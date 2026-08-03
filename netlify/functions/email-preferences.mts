import type { Config } from "@netlify/functions";
import admin from "firebase-admin";
import crypto from "node:crypto";

function init() {
  if (admin.apps.length) return;
  const raw = Netlify.env.get("FIREBASE_SERVICE_ACCOUNT_KEY");
  if (!raw) throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY is missing");
  const key = JSON.parse(raw);
  if (key.private_key) key.private_key = key.private_key.replace(/\\n/g, "\n");
  admin.initializeApp({ credential: admin.credential.cert(key) });
}

function page(language: string, success: boolean) {
  const english = language === "en";
  const title = success ? (english ? "You are unsubscribed" : "Vous êtes désabonné(e)") : (english ? "Invalid link" : "Lien invalide");
  const body = success
    ? (english ? "You will no longer receive optional news or promotional emails from KinkoLab. Essential messages about your application, account, order, active campaign and payments will continue." : "Vous ne recevrez plus les nouvelles facultatives ni les courriels promotionnels de KinkoLab. Les messages indispensables concernant votre candidature, votre compte, votre commande, votre campagne active et les versements continueront.")
    : (english ? "This preference link is invalid or has expired." : "Ce lien de préférences est invalide ou expiré.");
  return `<!doctype html><html lang="${english ? "en" : "fr"}"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${title}</title><body style="margin:0;background:#090909;color:#fff;font-family:Arial,sans-serif"><main style="max-width:680px;margin:80px auto;padding:32px;border:1px solid #d7b85b55;border-radius:24px;background:#18181b"><h1>${title}</h1><p style="color:#d4d4d8;line-height:1.7">${body}</p><a href="https://athletes.kinkolab.com" style="color:#d7b85b">KinkoLab Athlete Program</a></main></body></html>`;
}

export default async (req: Request) => {
  try {
    init();
    const url = new URL(req.url);
    const token = url.searchParams.get("token") || "";
    const language = url.searchParams.get("lang") === "en" ? "en" : "fr";
    if (!token || token.length < 20) return new Response(page(language, false), { status: 400, headers: { "content-type": "text/html; charset=utf-8" } });
    const db = admin.firestore();
    let found = false;
    for (const collectionName of ["applications", "athletes", "emailPreferences"]) {
      const snapshots = await db.collection(collectionName).where(collectionName === "emailPreferences" ? "token" : "communicationConsent.emailPreferenceToken", "==", token).limit(5).get();
      for (const document of snapshots.docs) {
        found = true;
        if (collectionName === "emailPreferences") {
          await document.ref.set({ marketing: false, status: "unsubscribed", email: admin.firestore.FieldValue.delete(), unsubscribedAt: admin.firestore.FieldValue.serverTimestamp(), updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
        } else {
          await document.ref.set({ communicationConsent: { marketing: false, operational: true, emailPreferenceToken: token, unsubscribedAt: new Date().toISOString(), unsubscribeSource: "one_click_email" }, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
        }
      }
    }
    await db.collection("emailSuppressionList").doc(crypto.createHash("sha256").update(token).digest("hex")).set({ tokenHash: crypto.createHash("sha256").update(token).digest("hex"), reason: "marketing_unsubscribe", createdAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
    return new Response(page(language, found), { status: found ? 200 : 404, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Preference update failed" }, { status: 500 });
  }
};

export const config: Config = { path: "/unsubscribe", method: ["GET", "POST"] };
