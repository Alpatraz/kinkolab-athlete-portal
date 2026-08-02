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

async function sendEmail(to: string, language: string, kind: "warning" | "disabled") {
  const apiKey = Netlify.env.get("RESEND_API_KEY");
  if (!apiKey) throw new Error("RESEND_API_KEY is missing");
  const english = language === "en";
  const warning = kind === "warning";
  const subject = english
    ? warning ? "Your KinkoLab profile will be deactivated soon" : "Your KinkoLab profile has been deactivated"
    : warning ? "Votre profil KinkoLab sera bientôt désactivé" : "Votre profil KinkoLab a été désactivé";
  const title = english ? warning ? "Activity required" : "Profile deactivated" : warning ? "Connexion requise" : "Profil désactivé";
  const body = english
    ? warning ? "Your Athlete Portal profile has been inactive for five months. Sign in within the next month to keep it active." : "Your Athlete Portal profile was deactivated after six months without a sign-in. Contact KinkoLab if you would like it reactivated."
    : warning ? "Votre profil du Portail Athlètes est inactif depuis cinq mois. Connectez-vous au cours du prochain mois pour le conserver actif." : "Votre profil du Portail Athlètes a été désactivé après six mois sans connexion. Communiquez avec KinkoLab pour demander sa réactivation.";
  const button = english ? "Sign in" : "Me connecter";
  const html = `<!doctype html><html><body style="margin:0;background:#090909;font-family:Arial,sans-serif"><div style="max-width:640px;margin:auto;padding:32px 20px"><div style="border:1px solid #d7b85b55;border-radius:24px;background:#18181b;padding:32px"><h1 style="color:#f4f4f5">${title}</h1><p style="color:#d4d4d8;font-size:16px;line-height:1.7">${body}</p>${warning ? `<p><a href="https://athletes.kinkolab.com/login" style="display:inline-block;border-radius:12px;background:#d7b85b;color:#000;padding:14px 20px;font-weight:700;text-decoration:none">${button}</a></p>` : ""}</div></div></body></html>`;
  const response = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ from: "KinkoLab Athlètes <athletes@kinkolab.com>", reply_to: "athletes@kinkolab.com", to: [to], subject, html }) });
  if (!response.ok) throw new Error(`Resend error: ${await response.text()}`);
}

function dateOf(value: any) {
  if (value?.toDate) return value.toDate();
  if (value) return new Date(value);
  return null;
}

export default async () => {
  try {
    init();
    const db = admin.firestore();
    const snapshot = await db.collection("users").where("role", "==", "athlete").get();
    const now = new Date();
    const warningCutoff = new Date(now); warningCutoff.setMonth(warningCutoff.getMonth() - 5);
    const disableCutoff = new Date(now); disableCutoff.setMonth(disableCutoff.getMonth() - 6);
    let warned = 0; let disabled = 0;

    for (const document of snapshot.docs) {
      const user = document.data();
      const lastActivity = dateOf(user.lastLoginAt) || dateOf(user.createdAt);
      if (!lastActivity || user.deactivatedAt) continue;
      const athleteIds = [...new Set([user.athleteId, ...(user.athleteIds || [])].filter(Boolean))] as string[];
      if (lastActivity <= disableCutoff) {
        await sendEmail(user.email, user.preferredLanguage || "fr", "disabled");
        await admin.auth().updateUser(document.id, { disabled: true });
        await document.ref.update({ status: "inactive", deactivatedAt: admin.firestore.FieldValue.serverTimestamp(), updatedAt: admin.firestore.FieldValue.serverTimestamp() });
        await Promise.all(athleteIds.map((id) => db.collection("athletes").doc(id).set({ status: "inactive", isPublic: false, deactivatedAt: admin.firestore.FieldValue.serverTimestamp(), updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true })));
        disabled += 1;
      } else if (lastActivity <= warningCutoff && !user.inactivityWarningSentAt) {
        await sendEmail(user.email, user.preferredLanguage || "fr", "warning");
        await document.ref.update({ inactivityWarningSentAt: admin.firestore.FieldValue.serverTimestamp(), updatedAt: admin.firestore.FieldValue.serverTimestamp() });
        warned += 1;
      }
    }
    return Response.json({ checked: snapshot.size, warned, disabled });
  } catch (error) {
    console.error("athlete-inactivity error", error);
    return Response.json({ error: error instanceof Error ? error.message : "Inactivity check failed" }, { status: 500 });
  }
};

export const config: Config = { schedule: "30 13 * * *" };
