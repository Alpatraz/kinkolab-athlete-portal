import admin from "firebase-admin";

function getAdminApp() {
  if (admin.apps.length) return admin.app();
  const rawKey = Netlify.env.get("FIREBASE_SERVICE_ACCOUNT_KEY");
  if (!rawKey) throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY is missing");
  const serviceAccount = JSON.parse(rawKey);
  if (serviceAccount.private_key) serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, "\n");
  return admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://kinkolab.com",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Cache-Control": "public, max-age=300, s-maxage=300",
};

export default async (request: Request) => {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
  if (request.method !== "GET") return Response.json({ error: "Method not allowed" }, { status: 405, headers: corsHeaders });
  try {
    getAdminApp();
    const snapshot = await admin.firestore().collection("campaigns").get();
    const campaigns = snapshot.docs
      .map((document) => ({ id: document.id, ...document.data() } as Record<string, any>))
      .filter((campaign) => !["deleted", "draft"].includes(String(campaign.status || "active").toLowerCase()))
      .filter((campaign) => campaign.calendarEventId || campaign.calendarUrl)
      .map((campaign) => ({
        eventId: campaign.calendarEventId || "",
        campaignId: campaign.id,
        seriesId: campaign.seriesId || "",
        year: campaign.year || "",
        title: campaign.title || "",
        titleEn: campaign.titleEn || "",
        status: campaign.status || "active",
        campaignActive: ["active", "actif"].includes(String(campaign.status || "active").toLowerCase()),
        campaignUrl: `https://athletes.kinkolab.com/campaign/${campaign.id}`,
        athleteApplicationUrl: `https://athletes.kinkolab.com/signup?campaign=${encodeURIComponent(campaign.id)}`,
        registrationUrl: campaign.registrationUrl || "",
        resultsPublished: campaign.resultsPublished === true,
        resultsUrl: campaign.resultsUrl || (campaign.resultsPublished ? `https://athletes.kinkolab.com/campaign/${campaign.id}#results` : ""),
      }));
    return Response.json({ updatedAt: new Date().toISOString(), campaigns }, { headers: corsHeaders });
  } catch (error) {
    console.error("calendar-campaigns error", error);
    return Response.json({ error: "Unable to load campaigns" }, { status: 500, headers: corsHeaders });
  }
};
