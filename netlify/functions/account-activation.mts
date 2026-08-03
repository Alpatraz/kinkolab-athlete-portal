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

function hash(token: string) { return crypto.createHash("sha256").update(token).digest("hex"); }

async function applicationFor(token: string) {
  const snapshot = await admin.firestore().collection("applications").where("activation.tokenHash", "==", hash(token)).limit(1).get();
  return snapshot.empty ? null : snapshot.docs[0];
}

function valid(document: FirebaseFirestore.QueryDocumentSnapshot) {
  const activation = document.data().activation || {};
  return !activation.usedAt && activation.expiresAt && new Date(activation.expiresAt).getTime() > Date.now() && activation.userId && activation.email;
}

export default async (req: Request) => {
  try {
    init();
    const url = new URL(req.url);
    const body = req.method === "POST" ? await req.json() : {};
    const token = String(url.searchParams.get("token") || body.token || "");
    if (token.length < 32) return Response.json({ error: "Lien d’activation invalide." }, { status: 400 });
    const application = await applicationFor(token);
    if (!application || !valid(application)) return Response.json({ error: "Ce lien est expiré ou a déjà été utilisé. Demandez un nouvel accès à KinkoLab." }, { status: 410 });
    const data = application.data();
    if (req.method === "GET") return Response.json({ valid: true, email: data.activation.email, name: data.parentName || data.athleteName || data.firstName || "Athlète" });
    if (req.method !== "POST") return Response.json({ error: "Method not allowed" }, { status: 405 });
    const password = String(body.password || "");
    if (password.length < 12 || !/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) return Response.json({ error: "Le mot de passe doit contenir au moins 12 caractères, une majuscule, une minuscule et un chiffre." }, { status: 400 });
    await admin.auth().updateUser(data.activation.userId, { password, emailVerified: true, disabled: false });
    const changedAt = new Date();
    const expiresAt = new Date(changedAt); expiresAt.setMonth(expiresAt.getMonth() + 6);
    await Promise.all([
      admin.firestore().collection("users").doc(data.activation.userId).set({ mustChangePassword: false, passwordChangedAt: changedAt.toISOString(), passwordExpiresAt: expiresAt.toISOString(), updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true }),
      application.ref.update({ "activation.usedAt": admin.firestore.FieldValue.serverTimestamp(), accountActivatedAt: admin.firestore.FieldValue.serverTimestamp(), updatedAt: admin.firestore.FieldValue.serverTimestamp() }),
    ]);
    return Response.json({ activated: true, email: data.activation.email });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Activation impossible" }, { status: 500 });
  }
};

export const config: Config = { path: "/api/account-activation", method: ["GET", "POST"] };
