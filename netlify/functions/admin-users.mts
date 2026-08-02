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

async function getOwnership(db: admin.firestore.Firestore, admins: admin.firestore.QueryDocumentSnapshot[], currentUid: string) {
  const ownershipRef = db.collection("settings").doc("adminOwnership");
  const ownership = await ownershipRef.get();
  const configuredUid = ownership.data()?.ownerUid;
  if (configuredUid && admins.some((item) => item.id === configuredUid)) return { ownerUid: configuredUid, ownershipRef };

  const candidates = [...admins].sort((a, b) => {
    const aData = a.data();
    const bData = b.data();
    if (Boolean(aData.invitedBy) !== Boolean(bData.invitedBy)) return aData.invitedBy ? 1 : -1;
    return (aData.createdAt?.toMillis?.() || Number.MAX_SAFE_INTEGER) - (bData.createdAt?.toMillis?.() || Number.MAX_SAFE_INTEGER);
  });
  const ownerUid = candidates[0]?.id || currentUid;
  await ownershipRef.set({ ownerUid, initializedAt: admin.firestore.FieldValue.serverTimestamp(), updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
  return { ownerUid, ownershipRef };
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
  const loginMessage = english ? "After choosing your password, sign in to the Athlete Portal." : "Après avoir choisi votre mot de passe, connectez-vous au Portail Athlètes.";
  const loginLabel = english ? "Open the Athlete Portal" : "Ouvrir le Portail Athlètes";
  const html = `<!doctype html><html><body style="margin:0;background:#090909;font-family:Arial,sans-serif"><div style="max-width:640px;margin:auto;padding:32px 20px"><div style="border:1px solid #d7b85b55;border-radius:24px;background:#18181b;padding:32px"><h1 style="color:#f4f4f5">${escapeHtml(title)}</h1><p style="color:#d4d4d8;font-size:16px;line-height:1.7">${escapeHtml(message)}</p><p style="margin-top:28px"><a href="${escapeHtml(setupUrl)}" style="display:inline-block;border-radius:12px;background:#d7b85b;color:#000;padding:14px 20px;font-weight:700;text-decoration:none">${button}</a></p><p style="margin-top:28px;color:#a1a1aa;font-size:14px;line-height:1.7">${escapeHtml(loginMessage)} <a href="https://athletes.kinkolab.com/login" style="color:#d7b85b">${escapeHtml(loginLabel)}</a></p></div></div></body></html>`;
  const response = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ from: "KinkoLab Athlètes <athletes@kinkolab.com>", reply_to: "athletes@kinkolab.com", to: [email], subject, html }) });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Resend rejected the invitation");
  return { id: data.id, subject };
}

export default async (req: Request) => {
  try {
    getAdminApp();
    const currentAdmin = await requireAdmin(req);
    const db = admin.firestore();
    const adminSnapshot = await db.collection("users").where("role", "==", "admin").get();
    const { ownerUid, ownershipRef } = await getOwnership(db, adminSnapshot.docs, currentAdmin.uid);
    const isOwner = currentAdmin.uid === ownerUid;
    if (req.method === "GET") {
      return Response.json({ admins: adminSnapshot.docs.map((doc) => ({ uid: doc.id, ...doc.data(), isOwner: doc.id === ownerUid })), ownerUid, currentUid: currentAdmin.uid, canManage: isOwner });
    }
    if (!isOwner) return Response.json({ error: "Seul le propriétaire peut gérer les administrateurs." }, { status: 403 });

    if (req.method === "PATCH") {
      const { action, uid, name, email, language = "fr" } = await req.json();
      if (!uid) return Response.json({ error: "Administrator id is required" }, { status: 400 });
      const targetRef = db.collection("users").doc(uid);
      const target = await targetRef.get();
      if (!target.exists || target.data()?.role !== "admin") return Response.json({ error: "Administrateur introuvable." }, { status: 404 });
      if (action === "transfer_owner") {
        if (uid === ownerUid) return Response.json({ error: "Cette personne est déjà propriétaire." }, { status: 400 });
        await ownershipRef.set({ ownerUid: uid, previousOwnerUid: ownerUid, transferredBy: currentAdmin.uid, transferredAt: admin.firestore.FieldValue.serverTimestamp(), updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
        return Response.json({ transferred: true, ownerUid: uid });
      }
      if (uid === ownerUid) return Response.json({ error: "Le compte propriétaire doit d’abord transférer la propriété avant de pouvoir être modifié." }, { status: 409 });
      if (!name || !email) return Response.json({ error: "Name and email are required" }, { status: 400 });
      const normalizedEmail = String(email).trim().toLowerCase();
      try {
        await admin.auth().updateUser(uid, { email: normalizedEmail, displayName: String(name).trim() });
      } catch (error: any) {
        if (error.code === "auth/email-already-exists") return Response.json({ error: "Cette adresse courriel est déjà utilisée." }, { status: 409 });
        throw error;
      }
      await targetRef.set({ email: normalizedEmail, name: String(name).trim(), preferredLanguage: language, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
      return Response.json({ updated: true, uid });
    }

    if (req.method === "DELETE") {
      const uid = new URL(req.url).searchParams.get("uid") || "";
      if (!uid) return Response.json({ error: "Administrator id is required" }, { status: 400 });
      if (uid === ownerUid) return Response.json({ error: "Transférez d’abord la propriété avant de supprimer ce compte." }, { status: 409 });
      const target = await db.collection("users").doc(uid).get();
      if (!target.exists || target.data()?.role !== "admin") return Response.json({ error: "Administrateur introuvable." }, { status: 404 });
      await Promise.all([admin.auth().deleteUser(uid), target.ref.delete()]);
      return Response.json({ deleted: true, uid });
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
    const userRef = db.collection("users").doc(user.uid);
    await userRef.set({ uid: user.uid, email: user.email, name, role: "admin", preferredLanguage: language, invitedBy: currentAdmin.uid, invitationStatus: "pending", invitationError: admin.firestore.FieldValue.delete(), updatedAt: admin.firestore.FieldValue.serverTimestamp(), createdAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
    try {
      // Firebase's hosted password page does not require a custom continue URL. This
      // keeps invitations working even before the portal domain is allowlisted.
      const setupUrl = await admin.auth().generatePasswordResetLink(user.email!);
      const invitation = await sendInvitation(user.email!, name, setupUrl, language);
      await Promise.all([
        userRef.set({ invitationStatus: "sent", invitationSentAt: admin.firestore.FieldValue.serverTimestamp(), invitationResendId: invitation.id, invitationError: admin.firestore.FieldValue.delete(), updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true }),
        db.collection("emailLogs").add({ type: "admin_invitation", recipient: user.email, language, resendId: invitation.id, subject: invitation.subject, status: "sent", test: false, userId: user.uid, createdAt: admin.firestore.FieldValue.serverTimestamp() }),
      ]);
      return Response.json({ created: true, invitationSent: true, uid: user.uid, resendId: invitation.id });
    } catch (invitationError) {
      const invitationMessage = invitationError instanceof Error ? invitationError.message : "Invitation email failed";
      await Promise.all([
        userRef.set({ invitationStatus: "failed", invitationError: invitationMessage, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true }),
        db.collection("emailLogs").add({ type: "admin_invitation", recipient: user.email, language, status: "failed", error: invitationMessage, test: false, userId: user.uid, createdAt: admin.firestore.FieldValue.serverTimestamp() }),
      ]);
      return Response.json({ created: true, invitationSent: false, uid: user.uid, error: `Le compte a été créé, mais le courriel n'a pas pu être envoyé : ${invitationMessage}` }, { status: 207 });
    }
  } catch (error) {
    console.error("admin-users error", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return Response.json({ error: message }, { status: message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500 });
  }
};

export const config: Config = { path: "/api/admin-users", method: ["GET", "POST", "PATCH", "DELETE"] };
