const admin = require("firebase-admin");

function initFirebase() {
  if (admin.apps.length) return;

  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

function corsResponse(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  };
}

function cleanStatus(value) {
  return String(value || "active").toLowerCase();
}

exports.handler = async function handler(event) {
  if (event.httpMethod === "OPTIONS") {
    return corsResponse(200, { ok: true });
  }

  if (event.httpMethod !== "GET") {
    return corsResponse(405, { error: "Method not allowed" });
  }

  initFirebase();

  const db = admin.firestore();

  const campaignId = event.queryStringParameters?.campaignId || "";
  const reservedAmount = Number(event.queryStringParameters?.reservedAmount || 10);

  const campaignsSnap = await db.collection("campaigns").get();

  const campaigns = campaignsSnap.docs
    .map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))
    .filter((campaign) => {
      const status = cleanStatus(campaign.status);
      return !["suspendue", "archivée", "archive", "archivé"].includes(status);
    })
    .map((campaign) => ({
      id: campaign.id,
      title: campaign.title || campaign.id,
      city: campaign.city || "",
      country: campaign.country || "",
      eventDate: campaign.eventDate || "",
    }));

  if (!campaignId) {
    return corsResponse(200, {
      campaigns,
      supportOptions: [],
    });
  }

  const participationsSnap = await db
    .collection("campaignParticipations")
    .where("campaignId", "==", campaignId)
    .get();

  const participations = participationsSnap.docs
    .map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))
    .filter((participation) => {
      const status = cleanStatus(participation.status);
      return !["suspendue", "archivée", "archive", "archivé"].includes(status);
    });

  const individualOptions = participations
    .filter((item) => item.fundingMode !== "family")
    .map((item) => ({
      type: "individual",
      label: item.athleteName || item.athleteId,
      athleteId: item.athleteId || "",
      campaignId: item.campaignId || campaignId,
      fundingMode: "individual",
      fundingGroupId: item.fundingGroupId || `${item.athleteId}-${campaignId}`,
      reservedAmount,
    }));

  const familyMap = new Map();

  participations
    .filter((item) => item.fundingMode === "family" && item.fundingGroupId)
    .forEach((item) => {
      if (!familyMap.has(item.fundingGroupId)) {
        familyMap.set(item.fundingGroupId, {
          type: "family",
          label: `Famille ${item.familyName || item.familyId || item.fundingGroupId}`,
          athleteId: "",
          familyId: item.familyId || "",
          campaignId: item.campaignId || campaignId,
          fundingMode: "family",
          fundingGroupId: item.fundingGroupId,
          reservedAmount,
          members: [],
        });
      }

      familyMap.get(item.fundingGroupId).members.push({
        athleteId: item.athleteId || "",
        athleteName: item.athleteName || item.athleteId || "",
      });
    });

  const supportOptions = [
    ...individualOptions,
    ...Array.from(familyMap.values()),
  ].sort((a, b) => a.label.localeCompare(b.label));

  return corsResponse(200, {
    campaigns,
    supportOptions,
  });
};
