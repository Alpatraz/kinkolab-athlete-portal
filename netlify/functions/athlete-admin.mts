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

export default async (req: Request) => {
  try {
    if (req.method !== "POST") return Response.json({ error: "Method not allowed" }, { status: 405 });
    init();
    await requireAdmin(req);
    const { action, athleteId, status } = await req.json();
    if (action !== "update_status" || !athleteId || !status) return Response.json({ error: "Invalid action" }, { status: 400 });
    const ref = admin.firestore().collection("athletes").doc(athleteId);
    const snapshot = await ref.get();
    if (!snapshot.exists) return Response.json({ error: "Athlete not found" }, { status: 404 });
    const athlete = snapshot.data() || {};
    const active = ["active", "actif", "accepté"].includes(status);
    await ref.update({ status, isPublic: active, deactivatedAt: active ? null : athlete.deactivatedAt || admin.firestore.FieldValue.serverTimestamp(), updatedAt: admin.firestore.FieldValue.serverTimestamp() });
    if (athlete.userId) {
      await admin.auth().updateUser(athlete.userId, { disabled: !active });
      await admin.firestore().collection("users").doc(athlete.userId).set({ status: active ? "active" : status, deactivatedAt: active ? null : admin.firestore.FieldValue.serverTimestamp(), ...(active ? { inactivityWarningSentAt: null } : {}), updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
    }
    return Response.json({ updated: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return Response.json({ error: message }, { status: message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500 });
  }
};

export const config: Config = { path: "/api/athlete-admin", method: ["POST"] };
