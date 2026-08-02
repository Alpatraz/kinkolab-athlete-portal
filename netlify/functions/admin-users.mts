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

async function requireAdmin(req: Request) {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) throw new Error("Unauthorized");
  const decoded = await admin.auth().verifyIdToken(token);
  const user = await admin.firestore().collection("users").doc(decoded.uid).get();
  if (!user.exists || user.data()?.role !== "admin") throw new Error("Forbidden");
  return decoded;
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[character] || character));
}

async function sendInvitation(email: string, name: string, setupUrl: string, language: string) {
  const apiKey = Netlify.env.get("RESEND_API_KEY");
  if (!apiKey) throw new Error("RESEND_API_KEY is missing");
  const english = language === "en";
  const subject = english ? "Your KinkoLab administrator access" : "Votre accès administrateur KinkoLab";
  const title = english ? "Administrator invitation" : "Invitation administrateur";
  const message = english ? `Hello ${name}, your KinkoLab administrator account is ready. Choose your password securely.` : `Bonjour ${name}, votre compte administrateur KinkoLab est prêt. Choisissez votre mot de passe de façon sécurisée.`;
  const button = english ? "Create my password" : "Créer mon mot de passe";
  const html = `<!doctype html><html><body style="margin:0;background:#090909;font-family:Arial,sans-serif"><div style="max-width:640px;margin:auto;padding:32px 20px"><div style="border:1px solid #d7b85b55;border-radius:24px;background:#18181b;padding:32px"><h1 style="color:#f4f4f5">${escapeHtml(title)}</h1><p style="color:#d4d4d8;font-size:16px;line-height:1.7">${escapeHtml(message)}</p><p style="margin-top:28px"><a href="${escapeHtml(setupUrl)}" style="display:inline-block;border-radius:12px;background:#d7b85b;color:#000;padding:14px 20px;font-weight:700;text-decoration:none">${button}</a></p></div></div></body></html>`;
  const response = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ from: "KinkoLab Athlètes <athletes@kinkolab.com>", reply_to: "athletes@kinkolab.com", to: [email], subject, html }) });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Resend rejected the invitation");
  return data.id;
}

export default async (req: Request) => {
  try {
    getAdminApp();
    const currentAdmin = await requireAdmin(req);
    const db = admin.firestore();
    if (req.method === "GET") {
      const snapshot = await db.collection("users").where("role", "==", "admin").get();
      return Response.json({ admins: snapshot.docs.map((doc) => ({ uid: doc.id, ...doc.data() })) });
    }
    if (req.method !== "POST") return Response.json({ error: "Method not allowed" }, { status: 405 });
    const { email, name, language = "fr" } = await req.json();
    if (!email || !name) return Response.json({ error: "Name and email are required" }, { status: 400 });
    let user;
    try { user = await admin.auth().getUserByEmail(String(email).trim().toLowerCase()); }
    catch (error: any) {
      if (error.code !== "auth/user-not-found") throw error;
      user = await admin.auth().createUser({ email: String(email).trim().toLowerCase(), displayName: name, password: `Kinko-${crypto.randomUUID()}-Aa1!` });
    }
    await db.collection("users").doc(user.uid).set({ uid: user.uid, email: user.email, name, role: "admin", preferredLanguage: language, invitedBy: currentAdmin.uid, updatedAt: admin.firestore.FieldValue.serverTimestamp(), createdAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
    const setupUrl = await admin.auth().generatePasswordResetLink(user.email!, { url: "https://athletes.kinkolab.com/login" });
    const resendId = await sendInvitation(user.email!, name, setupUrl, language);
    return Response.json({ created: true, uid: user.uid, resendId });
  } catch (error) {
    console.error("admin-users error", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return Response.json({ error: message }, { status: message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500 });
  }
};

export const config: Config = { path: "/api/admin-users", method: ["GET", "POST"] };
