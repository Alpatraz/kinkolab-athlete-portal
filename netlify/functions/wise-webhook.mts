import admin from "firebase-admin";
import crypto from "node:crypto";

const PRODUCTION_KEY = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAvO8vXV+JksBzZAY6GhSO
XdoTCfhXaaiZ+qAbtaDBiu2AGkGVpmEygFmWP4Li9m5+Ni85BhVvZOodM9epgW3F
bA5Q1SexvAF1PPjX4JpMstak/QhAgl1qMSqEevL8cmUeTgcMuVWCJmlge9h7B1CS
D4rtlimGZozG39rUBDg6Qt2K+P4wBfLblL0k4C4YUdLnpGYEDIth+i8XsRpFlogx
CAFyH9+knYsDbR43UJ9shtc42Ybd40Afihj8KnYKXzchyQ42aC8aZ/h5hyZ28yVy
Oj3Vos0VdBIs/gAyJ/4yyQFCXYte64I7ssrlbGRaco4nKF3HmaNhxwyKyJafz19e
HwIDAQAB
-----END PUBLIC KEY-----`;

function app() {
  if (admin.apps.length) return admin.app();
  const raw = Netlify.env.get("FIREBASE_SERVICE_ACCOUNT_KEY");
  if (!raw) throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY is missing");
  const key = JSON.parse(raw);
  if (key.private_key) key.private_key = key.private_key.replace(/\\n/g, "\n");
  return admin.initializeApp({ credential: admin.credential.cert(key) });
}

function verify(body: string, signature: string) {
  const publicKey = Netlify.env.get("WISE_WEBHOOK_PUBLIC_KEY") || PRODUCTION_KEY;
  return crypto.verify("RSA-SHA256", Buffer.from(body), publicKey, Buffer.from(signature, "base64"));
}

export default async (req: Request) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const body = await req.text();
  const signature = req.headers.get("x-signature-sha256") || "";
  if (!signature || !verify(body, signature)) return new Response("Invalid Wise signature", { status: 401 });
  app();
  const event = JSON.parse(body || "{}");
  const deliveryId = req.headers.get("x-delivery-id") || event.id || crypto.createHash("sha256").update(body).digest("hex");
  await admin.firestore().collection("wiseWebhookEvents").doc(deliveryId).set({
    eventType: event.event_type || event.type || "unknown",
    transferId: String(event.data?.resource?.id || event.data?.transfer_id || event.data?.id || ""),
    state: event.data?.current_state || event.data?.state || null,
    occurredAt: event.data?.occurred_at || event.sent_at || null,
    payload: event,
    receivedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  const transferId = String(event.data?.resource?.id || event.data?.transfer_id || event.data?.id || "");
  const state = event.data?.current_state || event.data?.state || null;
  if (transferId && state) {
    const batches = await admin.firestore().collection("wisePayoutBatches").get();
    for (const batchDoc of batches.docs) {
      const batch = batchDoc.data();
      const transfers = (batch.transfers || []).map((item: any) =>
        String(item.wiseTransferId) === transferId
          ? { ...item, status: state, wiseUpdatedAt: event.data?.occurred_at || event.sent_at || new Date().toISOString() }
          : item,
      );
      if (!transfers.some((item: any) => String(item.wiseTransferId) === transferId)) continue;
      const completed = transfers.length > 0 && transfers.every((item: any) => item.status === "outgoing_payment_sent");
      const processing = transfers.some((item: any) => ["processing", "funds_converted", "outgoing_payment_sent"].includes(item.status));
      await batchDoc.ref.update({
        transfers,
        status: completed ? "completed" : processing ? "processing" : batch.status,
        lastWebhookAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
  }
  return Response.json({ received: true });
};

export const config = { path: "/api/wise-webhook" };
