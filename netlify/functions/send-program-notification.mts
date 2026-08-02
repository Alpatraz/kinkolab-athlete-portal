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

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;",
  }[character] || character));
}

function emailLayout(title, paragraphs, button) {
  return `<!doctype html><html><body style="margin:0;background:#090909;color:#f4f4f5;font-family:Arial,sans-serif"><div style="max-width:640px;margin:auto;padding:32px 20px"><div style="border:1px solid #3f3f46;border-radius:24px;background:#18181b;padding:32px"><p style="color:#d7b85b;font-weight:700;letter-spacing:.12em;text-transform:uppercase">KinkoLab · Programme Athlètes</p><h1 style="font-size:30px;line-height:1.2">${escapeHtml(title)}</h1>${paragraphs.map((paragraph) => `<p style="color:#d4d4d8;font-size:16px;line-height:1.7">${escapeHtml(paragraph)}</p>`).join("")}${button ? `<p style="margin-top:28px"><a href="${button.url}" style="display:inline-block;border-radius:12px;background:#d7b85b;color:#000;padding:14px 20px;font-weight:700;text-decoration:none">${escapeHtml(button.label)}</a></p>` : ""}<p style="margin-top:30px;border-top:1px solid #3f3f46;padding-top:20px;color:#71717a;font-size:12px">KinkoLab Inc. · Terrebonne, Québec · athletes@kinkolab.com</p></div></div></body></html>`;
}

function applicationTemplate(type, application, language) {
  const english = language === "en";
  const name = application.athleteName || `${application.firstName || ""} ${application.lastName || ""}`.trim();
  const campaign = application.campaignTitle || "KinkoLab Athlete Program";
  const templates = {
    application_received: english
      ? { subject: "We received your KinkoLab application", title: "Application received", paragraphs: [`Hello ${name},`, `We have received your application for ${campaign}. Our team will review it and contact you by email with the next steps.`] }
      : { subject: "Nous avons reçu votre candidature KinkoLab", title: "Candidature reçue", paragraphs: [`Bonjour ${name},`, `Nous avons reçu votre candidature pour ${campaign}. Notre équipe l’examinera et communiquera avec vous par courriel pour les prochaines étapes.`] },
    application_accepted: english
      ? { subject: "Your KinkoLab application has been accepted", title: "Welcome to the Athlete Program", paragraphs: [`Hello ${name},`, `Your application for ${campaign} has been accepted. Your athlete access has been created. Use the button below to set or reset your password.`], button: { label: "Access my account", url: "https://athletes.kinkolab.com/login" } }
      : { subject: "Votre candidature KinkoLab est acceptée", title: "Bienvenue dans le Programme Athlètes", paragraphs: [`Bonjour ${name},`, `Votre candidature pour ${campaign} a été acceptée. Votre accès athlète a été créé. Utilisez le bouton ci-dessous pour accéder à votre compte ou réinitialiser votre mot de passe.`], button: { label: "Accéder à mon compte", url: "https://athletes.kinkolab.com/login" } },
    application_refused: english
      ? { subject: "Update regarding your KinkoLab application", title: "Application update", paragraphs: [`Hello ${name},`, `After reviewing your application for ${campaign}, we are unable to accept it at this time. Thank you for your interest in the KinkoLab Athlete Program.`] }
      : { subject: "Mise à jour concernant votre candidature KinkoLab", title: "Mise à jour de votre candidature", paragraphs: [`Bonjour ${name},`, `Après examen de votre candidature pour ${campaign}, nous ne pouvons pas l’accepter pour le moment. Merci de votre intérêt envers le Programme Athlètes KinkoLab.`] },
  };
  return templates[type];
}

function payoutTemplate(payout, language) {
  const english = language === "en";
  const amount = new Intl.NumberFormat(english ? "en-CA" : "fr-CA", { style: "currency", currency: "CAD" }).format(Number(payout.amount || 0));
  return english
    ? { subject: "Your KinkoLab funds have been paid", title: "Payment recorded", paragraphs: [`Hello ${payout.beneficiaryLabel || "athlete"},`, `A payment of ${amount} has been recorded for ${payout.campaignTitle || "your KinkoLab campaign"}.`, "Contact us if you have any questions about this payment."] }
    : { subject: "Vos fonds KinkoLab ont été versés", title: "Versement enregistré", paragraphs: [`Bonjour ${payout.beneficiaryLabel || "athlète"},`, `Un versement de ${amount} a été enregistré pour ${payout.campaignTitle || "votre campagne KinkoLab"}.`, "Communiquez avec nous pour toute question concernant ce versement."] };
}

async function sendEmail(to, template) {
  const apiKey = Netlify.env.get("RESEND_API_KEY");
  if (!apiKey) throw new Error("RESEND_API_KEY is missing");
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: "KinkoLab Athlètes <athletes@kinkolab.com>",
      reply_to: "athletes@kinkolab.com",
      to: [to],
      subject: template.subject,
      html: emailLayout(template.title, template.paragraphs, template.button),
    }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Resend rejected the email");
  return data.id;
}

async function requireAdmin(req) {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) throw new Error("Unauthorized");
  const decoded = await admin.auth().verifyIdToken(token);
  const user = await admin.firestore().collection("users").doc(decoded.uid).get();
  if (!user.exists || user.data()?.role !== "admin") throw new Error("Forbidden");
}

export default async (req: Request) => {
  try {
    if (req.method !== "POST") return Response.json({ error: "Method not allowed" }, { status: 405 });
    getAdminApp();
    const { type, recordId } = await req.json();
    if (!type || !recordId) return Response.json({ error: "type and recordId are required" }, { status: 400 });
    if (type !== "application_received") await requireAdmin(req);

    const db = admin.firestore();
    let recordRef;
    let recipient = "";
    let language = "fr";
    let template;

    if (["application_received", "application_accepted", "application_refused"].includes(type)) {
      recordRef = db.collection("applications").doc(recordId);
      const snapshot = await recordRef.get();
      if (!snapshot.exists) return Response.json({ error: "Application not found" }, { status: 404 });
      const application = snapshot.data();
      recipient = application?.parentEmail || application?.email || "";
      language = application?.preferredLanguage || "fr";
      template = applicationTemplate(type, application, language);
    } else if (type === "payout_paid") {
      recordRef = db.collection("payouts").doc(recordId);
      const snapshot = await recordRef.get();
      if (!snapshot.exists) return Response.json({ error: "Payout not found" }, { status: 404 });
      const payout = snapshot.data();
      let beneficiary;
      if (payout?.athleteId) beneficiary = await db.collection("athletes").doc(payout.athleteId).get();
      if ((!beneficiary || !beneficiary.exists) && payout?.familyId) beneficiary = await db.collection("families").doc(payout.familyId).get();
      const data = beneficiary?.data() || {};
      recipient = data.parentEmail || data.contactEmail || data.email || "";
      language = data.preferredLanguage || "fr";
      template = payoutTemplate(payout, language);
    } else {
      return Response.json({ error: "Unsupported notification type" }, { status: 400 });
    }

    if (!recipient) return Response.json({ error: "Recipient email not found" }, { status: 400 });
    const marker = `emailNotifications.${type}`;
    const current = (await recordRef.get()).data()?.emailNotifications?.[type];
    if (current) return Response.json({ sent: false, alreadySent: true });

    const resendId = await sendEmail(recipient, template);
    await recordRef.update({ [marker]: admin.firestore.FieldValue.serverTimestamp() });
    await db.collection("emailLogs").add({ type, recordId, recipient, language, resendId, status: "sent", createdAt: admin.firestore.FieldValue.serverTimestamp() });
    return Response.json({ sent: true, resendId });
  } catch (error) {
    console.error("send-program-notification error", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return Response.json({ error: message }, { status });
  }
};

export const config: Config = {
  path: "/api/program-notification",
  method: ["POST"],
};
