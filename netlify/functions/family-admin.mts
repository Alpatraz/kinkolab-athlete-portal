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
}

async function updateMatching(collectionName: string, field: string, value: string, payload: Record<string, unknown>) {
  const db = admin.firestore();
  const snapshot = await db.collection(collectionName).where(field, "==", value).get();
  for (let index = 0; index < snapshot.docs.length; index += 400) {
    const batch = db.batch();
    snapshot.docs.slice(index, index + 400).forEach((item) => batch.set(item.ref, payload, { merge: true }));
    await batch.commit();
  }
}

export default async (req: Request) => {
  try {
    if (req.method !== "POST" && req.method !== "DELETE") return Response.json({ error: "Method not allowed" }, { status: 405 });
    init();
    await requireAdmin(req);
    const { familyId, action, confirmation } = await req.json();
    if (!familyId || !["archive", "reactivate", "hard_delete"].includes(action)) return Response.json({ error: "Invalid action" }, { status: 400 });
    if (action === "hard_delete" && confirmation !== "SUPPRIMER") return Response.json({ error: "Confirmation invalide" }, { status: 400 });
    const db = admin.firestore();
    const familyRef = db.collection("families").doc(familyId);
    const family = await familyRef.get();
    if (!family.exists) return Response.json({ error: "Family not found" }, { status: 404 });

    if (action === "archive" || action === "reactivate") {
      const status = action === "archive" ? "archived" : "active";
      await familyRef.set({ status, archivedAt: action === "archive" ? admin.firestore.FieldValue.serverTimestamp() : null, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
      return Response.json({ updated: true, familyId, status });
    }

    const detached = { familyId: null, familyName: null, updatedAt: admin.firestore.FieldValue.serverTimestamp() };
    await Promise.all([
      updateMatching("athletes", "familyId", familyId, detached),
      updateMatching("users", "familyId", familyId, { familyId: null, updatedAt: admin.firestore.FieldValue.serverTimestamp() }),
      updateMatching("contributions", "familyId", familyId, { familyDeleted: true, familyName: "Famille supprimée", updatedAt: admin.firestore.FieldValue.serverTimestamp() }),
      updateMatching("payouts", "familyId", familyId, { familyDeleted: true, familyName: "Famille supprimée", updatedAt: admin.firestore.FieldValue.serverTimestamp() }),
    ]);
    await familyRef.delete();
    return Response.json({ deleted: true, familyId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return Response.json({ error: message }, { status: message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500 });
  }
};

export const config: Config = { path: "/api/family-admin", method: ["POST", "DELETE"] };
