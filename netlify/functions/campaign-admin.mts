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
    if (req.method !== "DELETE") return Response.json({ error: "Method not allowed" }, { status: 405 });
    init();
    await requireAdmin(req);
    const { campaignId, confirmation } = await req.json();
    if (!campaignId || confirmation !== "SUPPRIMER") return Response.json({ error: "Confirmation invalide" }, { status: 400 });
    const db = admin.firestore();
    const campaignRef = db.collection("campaigns").doc(campaignId);
    if (!(await campaignRef.get()).exists) return Response.json({ error: "Campaign not found" }, { status: 404 });

    const participations = await db.collection("campaignParticipations").where("campaignId", "==", campaignId).get();
    for (let index = 0; index < participations.docs.length; index += 400) {
      const batch = db.batch();
      participations.docs.slice(index, index + 400).forEach((item) => batch.delete(item.ref));
      await batch.commit();
    }

    for (const collectionName of ["contributions", "payouts", "wisePayoutBatches"]) {
      const financial = await db.collection(collectionName).where("campaignId", "==", campaignId).get();
      for (let index = 0; index < financial.docs.length; index += 400) {
        const batch = db.batch();
        financial.docs.slice(index, index + 400).forEach((item) => batch.set(item.ref, { campaignDeleted: true, campaignTitle: item.data().campaignTitle || "Campagne supprimée", updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true }));
        await batch.commit();
      }
    }

    await campaignRef.delete();
    return Response.json({ deleted: true, campaignId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return Response.json({ error: message }, { status: message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500 });
  }
};

export const config: Config = { path: "/api/campaign-admin", method: ["DELETE"] };
