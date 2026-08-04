import type { Config } from "@netlify/functions";
import admin from "firebase-admin";

function init() {
  if (admin.apps.length) return;
  const raw = Netlify.env.get("FIREBASE_SERVICE_ACCOUNT_KEY");
  if (!raw) throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY is missing");
  const key = JSON.parse(raw);
  if (key.private_key) key.private_key = key.private_key.replace(/\\n/g, "\n");
  admin.initializeApp({ credential: admin.credential.cert(key) });
}

async function requireAdmin(req: Request) {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) throw new Error("Unauthorized");
  const decoded = await admin.auth().verifyIdToken(token);
  const user = await admin.firestore().collection("users").doc(decoded.uid).get();
  if (!user.exists || user.data()?.role !== "admin") throw new Error("Forbidden");
  return decoded;
}

export default async (req: Request) => {
  try {
    if (req.method !== "POST") return Response.json({ error: "Method not allowed" }, { status: 405 });
    init();
    const actor = await requireAdmin(req);
    const { payoutId, action, confirmation } = await req.json();
    if (!payoutId || !["cancel", "delete_test"].includes(action)) return Response.json({ error: "Action invalide" }, { status: 400 });
    const ref = admin.firestore().collection("payouts").doc(payoutId);
    const snapshot = await ref.get();
    if (!snapshot.exists) return Response.json({ error: "Versement introuvable" }, { status: 404 });
    const payout = snapshot.data() || {};
    const hasWiseExecution = Boolean(payout.wiseTransferId || payout.wiseBatchGroupId || payout.wisePaymentId);
    if (hasWiseExecution) return Response.json({ error: "Ce versement possède une référence Wise. Il doit rester dans le registre financier et être traité depuis Wise selon son statut." }, { status: 409 });
    if (action === "delete_test") {
      if (confirmation !== "SUPPRIMER") return Response.json({ error: "Confirmation invalide" }, { status: 400 });
      await ref.delete();
      await admin.firestore().collection("adminAuditLogs").add({ action: "payout_test_deleted", payoutId, actorUid: actor.uid, deletedData: payout, createdAt: admin.firestore.FieldValue.serverTimestamp() });
      return Response.json({ deleted: true, payoutId });
    }
    await ref.set({ status: "cancelled", cancelledAt: admin.firestore.FieldValue.serverTimestamp(), cancelledBy: actor.uid, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
    await admin.firestore().collection("adminAuditLogs").add({ action: "payout_cancelled", payoutId, actorUid: actor.uid, createdAt: admin.firestore.FieldValue.serverTimestamp() });
    return Response.json({ cancelled: true, payoutId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return Response.json({ error: message }, { status: message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500 });
  }
};

export const config: Config = { path: "/api/payout-admin", method: ["POST"] };
