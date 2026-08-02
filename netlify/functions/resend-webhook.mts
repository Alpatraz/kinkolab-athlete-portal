import type { Config } from "@netlify/functions";
import admin from "firebase-admin";
import { createHmac, timingSafeEqual } from "node:crypto";

function getAdminApp() {
  if (admin.apps.length) return admin.app();
  const rawKey = Netlify.env.get("FIREBASE_SERVICE_ACCOUNT_KEY");
  if (!rawKey) throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY is missing");
  const serviceAccount = JSON.parse(rawKey);
  if (serviceAccount.private_key) serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, "\n");
  return admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

function verifySignature(payload: string, id: string, timestamp: string, signatureHeader: string, secret: string) {
  const unix = Number(timestamp);
  if (!unix || Math.abs(Date.now() / 1000 - unix) > 300) return false;
  const key = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
  const expected = createHmac("sha256", key).update(`${id}.${timestamp}.${payload}`).digest();
  return signatureHeader.split(" ").some((part) => {
    const encoded = part.startsWith("v1,") ? part.slice(3) : "";
    if (!encoded) return false;
    try { const received = Buffer.from(encoded, "base64"); return received.length === expected.length && timingSafeEqual(received, expected); }
    catch { return false; }
  });
}

export default async (req: Request) => {
  try {
    if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
    const secret = Netlify.env.get("RESEND_WEBHOOK_SECRET");
    if (!secret) return new Response("Webhook not configured", { status: 503 });
    const payload = await req.text();
    const id = req.headers.get("svix-id") || "";
    const timestamp = req.headers.get("svix-timestamp") || "";
    const signature = req.headers.get("svix-signature") || "";
    if (!id || !verifySignature(payload, id, timestamp, signature, secret)) return new Response("Invalid signature", { status: 400 });
    getAdminApp();
    const event = JSON.parse(payload);
    const emailId = event?.data?.email_id;
    const db = admin.firestore();
    const eventRef = db.collection("resendWebhookEvents").doc(id);
    if ((await eventRef.get()).exists) return Response.json({ received: true, duplicate: true });
    await eventRef.set({ type: event.type, emailId: emailId || "", createdAt: event.created_at || new Date().toISOString(), receivedAt: admin.firestore.FieldValue.serverTimestamp() });
    if (emailId) {
      const logs = await db.collection("emailLogs").where("resendId", "==", emailId).get();
      await Promise.all(logs.docs.map((log) => log.ref.update({
        status: String(event.type || "").replace("email.", ""),
        [`events.${String(event.type || "").replace("email.", "")}`]: event.created_at || new Date().toISOString(),
        lastEventAt: admin.firestore.FieldValue.serverTimestamp(),
      })));
    }
    return Response.json({ received: true });
  } catch (error) {
    console.error("resend-webhook error", error);
    return new Response("Webhook processing failed", { status: 500 });
  }
};

export const config: Config = { path: "/api/resend-webhook", method: ["POST"] };
