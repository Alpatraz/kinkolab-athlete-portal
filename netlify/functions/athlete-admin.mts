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
    if (!["update_status", "archive", "delete"].includes(action) || !athleteId) return Response.json({ error: "Invalid action" }, { status: 400 });
    const ref = admin.firestore().collection("athletes").doc(athleteId);
    const snapshot = await ref.get();
    if (!snapshot.exists) return Response.json({ error: "Athlete not found" }, { status: 404 });
    const athlete = snapshot.data() || {};
    const nextStatus = action === "archive" ? "archivé" : action === "delete" ? "supprimé" : String(status || "");
    if (!nextStatus) return Response.json({ error: "Status is required" }, { status: 400 });
    const active = ["active", "actif", "accepté"].includes(nextStatus);
    await ref.update({
      status: nextStatus,
      isPublic: active,
      deactivatedAt: active ? null : athlete.deactivatedAt || admin.firestore.FieldValue.serverTimestamp(),
      archivedAt: nextStatus === "archivé" ? admin.firestore.FieldValue.serverTimestamp() : null,
      deletedAt: nextStatus === "supprimé" ? admin.firestore.FieldValue.serverTimestamp() : null,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    const participations = await admin.firestore().collection("campaignParticipations").where("athleteId", "==", athleteId).get();
    if (!participations.empty) {
      const batch = admin.firestore().batch();
      participations.docs.forEach((participation) => batch.set(participation.ref, {
        athleteStatus: nextStatus,
        athleteIsPublic: active,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true }));
      await batch.commit();
    }

    if (athlete.userId) {
      const siblings = await admin.firestore().collection("athletes").where("userId", "==", athlete.userId).get();
      const accountHasActiveAthlete = siblings.docs.some((item) => item.id !== athleteId && ["active", "actif", "accepté"].includes(String(item.data().status || "actif"))) || active;
      try {
        await admin.auth().updateUser(athlete.userId, { disabled: !accountHasActiveAthlete });
      } catch (authError) {
        console.warn("Athlete status saved, but linked Auth account could not be updated", athlete.userId, authError);
      }
      await admin.firestore().collection("users").doc(athlete.userId).set({ status: accountHasActiveAthlete ? "active" : nextStatus, deactivatedAt: accountHasActiveAthlete ? null : admin.firestore.FieldValue.serverTimestamp(), ...(active ? { inactivityWarningSentAt: null } : {}), updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
    }
    return Response.json({ updated: true, athleteId, status: nextStatus, accountActive: athlete.userId ? undefined : true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return Response.json({ error: message }, { status: message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500 });
  }
};

export const config: Config = { path: "/api/athlete-admin", method: ["POST"] };
