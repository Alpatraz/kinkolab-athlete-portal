import type { Config } from "@netlify/functions";
import admin from "firebase-admin";

const SITE_URL = "https://athletes.kinkolab.com";
const FROM = "KinkoLab Athlètes <athletes@kinkolab.com>";
const DEFAULT_DESIGN = {
  backgroundColor: "#090909", cardColor: "#18181b", textColor: "#d4d4d8",
  headingColor: "#f4f4f5", accentColor: "#d7b85b", buttonTextColor: "#000000",
  logoUrl: `${SITE_URL}/images/kinko-logo.png`, heroImageUrl: "", borderRadius: 24,
  contentWidth: 640, alignment: "left", blocks: ["logo", "image", "title", "body", "button"],
};

const DEFAULT_TEMPLATES: Record<string, any> = {
  application_received: {
    key: "application_received", name: "Candidature reçue", trigger: "Après l’envoi du formulaire d’inscription", enabled: true,
    fr: { subject: "Nous avons reçu votre candidature KinkoLab", title: "Candidature reçue", body: "Bonjour {{name}},\n\nNous avons reçu votre candidature pour {{campaign}}. Notre équipe l’examinera et communiquera avec vous par courriel pour les prochaines étapes.", buttonLabel: "", buttonUrl: "" },
    en: { subject: "We received your KinkoLab application", title: "Application received", body: "Hello {{name}},\n\nWe have received your application for {{campaign}}. Our team will review it and contact you by email with the next steps.", buttonLabel: "", buttonUrl: "" },
  },
  application_accepted: {
    key: "application_accepted", name: "Candidature acceptée", trigger: "Quand un administrateur accepte une candidature", enabled: true,
    fr: { subject: "Votre candidature KinkoLab est acceptée", title: "Bienvenue dans le Programme Athlètes", body: "Bonjour {{name}},\n\nVotre candidature pour {{campaign}} a été acceptée. Votre accès athlète a été créé.", buttonLabel: "Accéder à mon compte", buttonUrl: `${SITE_URL}/login` },
    en: { subject: "Your KinkoLab application has been accepted", title: "Welcome to the Athlete Program", body: "Hello {{name}},\n\nYour application for {{campaign}} has been accepted. Your athlete access has been created.", buttonLabel: "Access my account", buttonUrl: `${SITE_URL}/login` },
  },
  application_refused: {
    key: "application_refused", name: "Candidature refusée", trigger: "Quand un administrateur refuse une candidature", enabled: true,
    fr: { subject: "Mise à jour concernant votre candidature KinkoLab", title: "Mise à jour de votre candidature", body: "Bonjour {{name}},\n\nAprès examen de votre candidature pour {{campaign}}, nous ne pouvons pas l’accepter pour le moment. Merci de votre intérêt envers le Programme Athlètes KinkoLab.", buttonLabel: "", buttonUrl: "" },
    en: { subject: "Update regarding your KinkoLab application", title: "Application update", body: "Hello {{name}},\n\nAfter reviewing your application for {{campaign}}, we are unable to accept it at this time. Thank you for your interest in the KinkoLab Athlete Program.", buttonLabel: "", buttonUrl: "" },
  },
  payout_paid: {
    key: "payout_paid", name: "Versement effectué", trigger: "Quand un administrateur enregistre un versement", enabled: true,
    fr: { subject: "Vos fonds KinkoLab ont été versés", title: "Versement enregistré", body: "Bonjour {{name}},\n\nUn versement de {{amount}} a été enregistré pour {{campaign}}.\n\nCommuniquez avec nous pour toute question concernant ce versement.", buttonLabel: "", buttonUrl: "" },
    en: { subject: "Your KinkoLab funds have been paid", title: "Payment recorded", body: "Hello {{name}},\n\nA payment of {{amount}} has been recorded for {{campaign}}.\n\nContact us if you have any questions about this payment.", buttonLabel: "", buttonUrl: "" },
  },
};

function getAdminApp() {
  if (admin.apps.length) return admin.app();
  const rawKey = Netlify.env.get("FIREBASE_SERVICE_ACCOUNT_KEY");
  if (!rawKey) throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY is missing");
  const serviceAccount = JSON.parse(rawKey);
  if (serviceAccount.private_key) serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, "\n");
  return admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[character] || character));
}

function interpolate(value = "", variables: Record<string, string> = {}) {
  return String(value).replace(/{{\s*([a-zA-Z0-9_]+)\s*}}/g, (_, key) => variables[key] ?? "");
}

function emailLayout(title: string, body: string, buttonLabel = "", buttonUrl = "", customDesign: any = {}) {
  const design = { ...DEFAULT_DESIGN, ...(customDesign || {}) };
  const paragraphs = body.split(/\n\s*\n/).filter(Boolean);
  const align = ["left", "center", "right"].includes(design.alignment) ? design.alignment : "left";
  const blocks: Record<string, string> = {
    logo: design.logoUrl ? `<p style="margin:0 0 24px;text-align:${align}"><img src="${escapeHtml(design.logoUrl)}" alt="KinkoLab" style="display:inline-block;max-width:150px;max-height:72px;object-fit:contain"></p>` : "",
    image: design.heroImageUrl ? `<img src="${escapeHtml(design.heroImageUrl)}" alt="" style="display:block;width:100%;max-height:300px;object-fit:cover;border-radius:${Math.max(0, Number(design.borderRadius) - 8)}px;margin:0 0 24px">` : "",
    title: `<h1 style="margin:0 0 20px;color:${design.headingColor};font-size:30px;line-height:1.2;text-align:${align}">${escapeHtml(title)}</h1>`,
    body: paragraphs.map((paragraph) => `<p style="white-space:pre-line;color:${design.textColor};font-size:16px;line-height:1.7;text-align:${align}">${escapeHtml(paragraph)}</p>`).join(""),
    button: buttonLabel && buttonUrl ? `<p style="margin-top:28px;text-align:${align}"><a href="${escapeHtml(buttonUrl)}" style="display:inline-block;border-radius:12px;background:${design.accentColor};color:${design.buttonTextColor};padding:14px 20px;font-weight:700;text-decoration:none">${escapeHtml(buttonLabel)}</a></p>` : "",
  };
  const order = Array.isArray(design.blocks) ? design.blocks : DEFAULT_DESIGN.blocks;
  return `<!doctype html><html><body style="margin:0;background:${design.backgroundColor};font-family:Arial,sans-serif"><div style="max-width:${Number(design.contentWidth) || 640}px;margin:auto;padding:32px 20px"><div style="border:1px solid ${design.accentColor}55;border-radius:${Number(design.borderRadius) || 0}px;background:${design.cardColor};padding:32px">${order.map((key: string) => blocks[key] || "").join("")}<p style="margin-top:30px;border-top:1px solid ${design.accentColor}55;padding-top:20px;color:${design.textColor};opacity:.65;font-size:12px;text-align:${align}">KinkoLab Inc. · Terrebonne, Québec · athletes@kinkolab.com</p></div></div></body></html>`;
}

async function requireAdmin(req: Request) {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) throw new Error("Unauthorized");
  const decoded = await admin.auth().verifyIdToken(token);
  const user = await admin.firestore().collection("users").doc(decoded.uid).get();
  if (!user.exists || user.data()?.role !== "admin") throw new Error("Forbidden");
  return decoded;
}

async function getTemplate(key: string) {
  const snapshot = await admin.firestore().collection("emailTemplates").doc(key).get();
  return snapshot.exists ? { ...DEFAULT_TEMPLATES[key], ...snapshot.data() } : DEFAULT_TEMPLATES[key];
}

function renderTemplate(template: any, language: string, variables: Record<string, string>) {
  const content = template[language === "en" ? "en" : "fr"] || template.fr;
  return {
    subject: interpolate(content.subject, variables), title: interpolate(content.title, variables),
    body: interpolate(content.body, variables), buttonLabel: interpolate(content.buttonLabel, variables), buttonUrl: interpolate(content.buttonUrl, variables), design: { ...DEFAULT_DESIGN, ...(template.design || {}) },
  };
}

async function sendEmail(to: string, rendered: any) {
  const apiKey = Netlify.env.get("RESEND_API_KEY");
  if (!apiKey) throw new Error("RESEND_API_KEY is missing");
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: FROM, reply_to: "athletes@kinkolab.com", to: [to], subject: rendered.subject, html: emailLayout(rendered.title, rendered.body, rendered.buttonLabel, rendered.buttonUrl, rendered.design) }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Resend rejected the email");
  return data.id;
}

async function logEmail(data: any) {
  await admin.firestore().collection("emailLogs").add({ ...data, createdAt: admin.firestore.FieldValue.serverTimestamp() });
}

async function handleAdminGet() {
  const db = admin.firestore();
  const [templateSnapshot, logSnapshot] = await Promise.all([
    db.collection("emailTemplates").get(), db.collection("emailLogs").orderBy("createdAt", "desc").limit(100).get(),
  ]);
  const saved = Object.fromEntries(templateSnapshot.docs.map((doc) => [doc.id, doc.data()]));
  const templates = Object.values(DEFAULT_TEMPLATES).map((template: any) => ({ ...template, ...(saved[template.key] || {}) }));
  templateSnapshot.docs.forEach((doc) => { if (!DEFAULT_TEMPLATES[doc.id]) templates.push({ key: doc.id, ...doc.data() }); });
  const logs = logSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data(), createdAt: doc.data().createdAt?.toDate?.().toISOString() || null }));
  return Response.json({ templates, logs });
}

async function handleAdminAction(body: any, adminUser: any) {
  const db = admin.firestore();
  if (body.action === "save_template") {
    const template = body.template;
    if (!template?.key || !template?.name || !template?.fr?.subject || !template?.en?.subject) return Response.json({ error: "Template fields are required" }, { status: 400 });
    await db.collection("emailTemplates").doc(template.key).set({ ...template, updatedAt: admin.firestore.FieldValue.serverTimestamp(), updatedBy: adminUser.uid }, { merge: true });
    return Response.json({ saved: true });
  }
  if (body.action === "test_template") {
    const { template, email, language = "fr" } = body;
    if (!email || !template) return Response.json({ error: "Template and email are required" }, { status: 400 });
    const variables = { name: "Athlète test", campaign: "Campagne KinkoLab", amount: "125,00 $", loginUrl: `${SITE_URL}/login` };
    const resendId = await sendEmail(email, renderTemplate(template, language, variables));
    await logEmail({ type: template.key, recipient: email, language, resendId, status: "sent", test: true });
    return Response.json({ sent: true, resendId });
  }
  return null;
}

async function handleNotification(type: string, recordId: string, isAdmin: boolean) {
  const db = admin.firestore();
  let recordRef: any;
  let recipient = "";
  let language = "fr";
  let variables: Record<string, string> = {};

  if (["application_received", "application_accepted", "application_refused"].includes(type)) {
    recordRef = db.collection("applications").doc(recordId);
    const snapshot = await recordRef.get();
    if (!snapshot.exists) return Response.json({ error: "Application not found" }, { status: 404 });
    const application = snapshot.data();
    recipient = application?.parentEmail || application?.email || "";
    language = application?.preferredLanguage || "fr";
    variables = { name: application?.athleteName || `${application?.firstName || ""} ${application?.lastName || ""}`.trim(), campaign: application?.campaignTitle || "Programme Athlètes KinkoLab", amount: "", loginUrl: `${SITE_URL}/login` };
  } else if (type === "payout_paid") {
    recordRef = db.collection("payouts").doc(recordId);
    const snapshot = await recordRef.get();
    if (!snapshot.exists) return Response.json({ error: "Payout not found" }, { status: 404 });
    const payout = snapshot.data();
    let beneficiary: any;
    if (payout?.athleteId) beneficiary = await db.collection("athletes").doc(payout.athleteId).get();
    if ((!beneficiary || !beneficiary.exists) && payout?.familyId) beneficiary = await db.collection("families").doc(payout.familyId).get();
    const data = beneficiary?.data() || {};
    recipient = data.parentEmail || data.contactEmail || data.email || "";
    language = data.preferredLanguage || "fr";
    const amount = new Intl.NumberFormat(language === "en" ? "en-CA" : "fr-CA", { style: "currency", currency: "CAD" }).format(Number(payout?.amount || 0));
    variables = { name: payout?.beneficiaryLabel || "athlète", campaign: payout?.campaignTitle || "campagne KinkoLab", amount, loginUrl: `${SITE_URL}/login` };
  } else return Response.json({ error: "Unsupported notification type" }, { status: 400 });

  if (!recipient) return Response.json({ error: "Recipient email not found" }, { status: 400 });
  const template = await getTemplate(type);
  if (!template) return Response.json({ error: "Template not found" }, { status: 404 });
  if (template.enabled === false) return Response.json({ sent: false, disabled: true });
  const current = (await recordRef.get()).data()?.emailNotifications?.[type];
  if (current) return Response.json({ sent: false, alreadySent: true });
  if (type !== "application_received" && !isAdmin) throw new Error("Unauthorized");

  const resendId = await sendEmail(recipient, renderTemplate(template, language, variables));
  await recordRef.update({ [`emailNotifications.${type}`]: admin.firestore.FieldValue.serverTimestamp() });
  await logEmail({ type, recordId, recipient, language, resendId, status: "sent", test: false });
  return Response.json({ sent: true, resendId });
}

export default async (req: Request) => {
  try {
    getAdminApp();
    if (req.method === "GET") { await requireAdmin(req); return handleAdminGet(); }
    if (req.method !== "POST") return Response.json({ error: "Method not allowed" }, { status: 405 });
    const body = await req.json();
    let adminUser: any = null;
    if (body.action || body.type !== "application_received") adminUser = await requireAdmin(req);
    if (body.action) {
      const response = await handleAdminAction(body, adminUser);
      if (response) return response;
    }
    if (!body.type || !body.recordId) return Response.json({ error: "type and recordId are required" }, { status: 400 });
    return handleNotification(body.type, body.recordId, Boolean(adminUser));
  } catch (error) {
    console.error("send-program-notification error", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return Response.json({ error: message }, { status });
  }
};

export const config: Config = { path: "/api/program-notification", method: ["GET", "POST"] };
