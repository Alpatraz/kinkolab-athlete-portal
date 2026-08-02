import type { Config } from "@netlify/functions";
import admin from "firebase-admin";

function getAdminApp() {
  if (admin.apps.length) return admin.app();
  const rawKey = Netlify.env.get("FIREBASE_SERVICE_ACCOUNT_KEY");
  if (!rawKey) throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY is missing");
  const serviceAccount = JSON.parse(rawKey);
  if (serviceAccount.private_key) serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, "\n");
  return admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

function torontoDate() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Toronto", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

export default async () => {
  try {
    getAdminApp();
    const db = admin.firestore();
    const snapshot = await db.collection("campaigns").get();
    const today = torontoDate();
    const changes: Array<{ id: string; status: string }> = [];

    await Promise.all(snapshot.docs.map(async (document) => {
      const campaign = document.data();
      if (campaign.autoSchedule === false || campaign.manuallyPaused || ["paused", "archived", "deleted"].includes(campaign.status)) return;
      let nextStatus = campaign.status || "active";
      if (campaign.endDate && today > campaign.endDate && ["active", "scheduled", "draft"].includes(nextStatus)) nextStatus = "completed";
      else if (campaign.startDate && today < campaign.startDate && ["active", "draft"].includes(nextStatus)) nextStatus = "scheduled";
      else if ((!campaign.startDate || today >= campaign.startDate) && (!campaign.endDate || today <= campaign.endDate) && ["scheduled", "draft"].includes(nextStatus)) nextStatus = "active";
      if (nextStatus === campaign.status) return;
      await document.ref.update({ status: nextStatus, lifecycleUpdatedAt: admin.firestore.FieldValue.serverTimestamp(), updatedAt: admin.firestore.FieldValue.serverTimestamp() });
      changes.push({ id: document.id, status: nextStatus });
    }));

    return Response.json({ date: today, checked: snapshot.size, changes });
  } catch (error) {
    console.error("campaign-lifecycle error", error);
    return Response.json({ error: error instanceof Error ? error.message : "Lifecycle failed" }, { status: 500 });
  }
};

export const config: Config = { schedule: "15 * * * *" };
