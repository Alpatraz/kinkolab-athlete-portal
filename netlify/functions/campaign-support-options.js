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

function isActive(value) {
  const status = cleanStatus(value);
  return !["suspendue", "suspendu", "archivée", "archive", "archivé"].includes(status);
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
  const reservedAmount = Number(event.queryStringParameters?.reservedAmount || 20);

  const campaignsSnap = await db.collection("campaigns").get();

  const campaigns = campaignsSnap.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }))
    .filter((campaign) => isActive(campaign.status))
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

  const supportOptions = [];
  const optionKeys = new Set();

  function addOption(option) {
    const key = `${option.fundingMode}-${option.fundingGroupId}-${option.athleteId || ""}-${option.familyId || ""}`;
    if (optionKeys.has(key)) return;
    optionKeys.add(key);
    supportOptions.push(option);
  }

  const participationsSnap = await db
    .collection("campaignParticipations")
    .where("campaignId", "==", campaignId)
    .get();

  const participations = participationsSnap.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }))
    .filter((participation) => isActive(participation.status));

  participations.forEach((item) => {
    if (item.fundingMode === "family" && item.fundingGroupId) {
      addOption({
        type: "family",
        label: `Famille ${item.familyName || item.familyId || item.fundingGroupId}`,
        athleteId: "",
        familyId: item.familyId || "",
        campaignId,
        fundingMode: "family",
        fundingGroupId: item.fundingGroupId,
        reservedAmount,
      });
      return;
    }

    if (item.athleteId) {
      addOption({
        type: "individual",
        label: item.athleteName || item.athleteId,
        athleteId: item.athleteId,
        familyId: item.familyId || "",
        campaignId,
        fundingMode: "individual",
        fundingGroupId: item.fundingGroupId || `${item.athleteId}-${campaignId}`,
        reservedAmount,
      });
    }
  });

  const athletesSnap = await db.collection("athletes").get();
  const athletes = athletesSnap.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }))
    .filter((athlete) => isActive(athlete.status))
    .filter((athlete) => athlete.isPublic !== false)
    .filter((athlete) => {
      return (
        athlete.campaignId === campaignId ||
        athlete.programId === campaignId ||
        athlete.mainCampaignId === campaignId
      );
    });

  athletes.forEach((athlete) => {
    addOption({
      type: "individual",
      label: athlete.name || `${athlete.firstName || ""} ${athlete.lastName || ""}`.trim() || athlete.id,
      athleteId: athlete.id,
      familyId: athlete.familyId || "",
      campaignId,
      fundingMode: "individual",
      fundingGroupId: `${athlete.id}-${campaignId}`,
      reservedAmount,
    });
  });

  const familiesSnap = await db.collection("families").get();

  familiesSnap.docs.forEach((doc) => {
    const family = { id: doc.id, ...doc.data() };
    if (!isActive(family.status)) return;

    const athleteIds = Array.isArray(family.athleteIds) ? family.athleteIds : [];

    const hasAthleteInCampaign = athleteIds.some((athleteId) =>
      athletes.some((athlete) => athlete.id === athleteId)
    );

    const hasParticipationInCampaign = participations.some(
      (participation) => participation.familyId === family.id
    );

    if (!hasAthleteInCampaign && !hasParticipationInCampaign) return;

    addOption({
      type: "family",
      label: `Famille ${family.name || family.familyName || family.id}`,
      athleteId: "",
      familyId: family.id,
      campaignId,
      fundingMode: "family",
      fundingGroupId: `${family.id}-${campaignId}`,
      reservedAmount,
    });
  });

  supportOptions.sort((a, b) => {
    if (a.type === "family" && b.type !== "family") return -1;
    if (a.type !== "family" && b.type === "family") return 1;
    return a.label.localeCompare(b.label);
  });

  return corsResponse(200, {
    campaigns,
    supportOptions,
  });
};
