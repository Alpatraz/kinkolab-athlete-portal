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

export default async (req: Request) => {
  try {
    getAdminApp();
    const currentAdmin = await requireAdmin(req);
    if (req.method !== "PUT") return Response.json({ error: "Method not allowed" }, { status: 405 });
    const body = await req.json();
    const disciplines = Array.isArray(body.disciplines) ? body.disciplines
      .map((item: any, index: number) => ({
        id: String(item.id || `discipline-${index}`).slice(0, 80),
        labelFr: String(item.labelFr || "").trim().slice(0, 120),
        labelEn: String(item.labelEn || item.labelFr || "").trim().slice(0, 120),
      }))
      .filter((item: any) => item.labelFr) : [];
    if (!disciplines.length) return Response.json({ error: "Au moins une discipline est requise." }, { status: 400 });
    await admin.firestore().collection("siteSettings").doc("programOptions").set({ disciplines, updatedBy: currentAdmin.uid, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
    return Response.json({ saved: true, disciplines });
  } catch (error) {
    console.error("program-settings error", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return Response.json({ error: message }, { status: message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500 });
  }
};

export const config: Config = { path: "/api/program-settings", method: ["PUT"] };
