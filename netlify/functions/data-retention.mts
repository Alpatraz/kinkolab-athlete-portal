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

export default async () => {
  try {
    init();
    const db = admin.firestore();
    const now = new Date().toISOString();
    let scrubbedPayoutProfiles = 0;
    let scrubbedPayoutRecords = 0;
    for (const collectionName of ["athletes", "families"]) {
      const snapshot = await db.collection(collectionName).where("payoutProfile.payoutDataRetentionUntil", "<=", now).get();
      for (const document of snapshot.docs) {
        await document.ref.update({
          "payoutProfile.wiseEmail": admin.firestore.FieldValue.delete(),
          "payoutProfile.interacEmail": admin.firestore.FieldValue.delete(),
          "payoutProfile.legalName": admin.firestore.FieldValue.delete(),
          "payoutProfile.consent": admin.firestore.FieldValue.delete(),
          "payoutProfile.payoutDataRetentionUntil": admin.firestore.FieldValue.delete(),
          "payoutProfile.retentionScrubbedAt": admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        scrubbedPayoutProfiles += 1;
      }
    }
    const payouts = await db.collection("payouts").where("retentionUntil", "<=", now).get();
    for (const document of payouts.docs) {
      await document.ref.update({ recipientEmail: admin.firestore.FieldValue.delete(), beneficiaryEmail: admin.firestore.FieldValue.delete(), recipientName: admin.firestore.FieldValue.delete(), retentionScrubbedAt: admin.firestore.FieldValue.serverTimestamp() });
      scrubbedPayoutRecords += 1;
    }
    return Response.json({ scrubbedPayoutProfiles, scrubbedPayoutRecords });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Retention cleanup failed" }, { status: 500 });
  }
};

export const config: Config = { schedule: "10 8 * * 0" };
