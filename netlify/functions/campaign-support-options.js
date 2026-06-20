const admin = require("firebase-admin");

function initFirebase() {
  if (admin.apps.length) return;
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
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
  return !["suspendue", "suspendu", "archivée", "archive", "archivé"].includes(cleanStatus(value));
}

exports.handler = async function handler(event) {
  if (event.httpMethod === "OPTIONS") return corsResponse(200, { ok: true });
  if (event.httpMethod !== "GET") return corsResponse(405, { error: "Method not allowed" });

  initFirebase();

  const db = admin.firestore();
  const campaignId = event.queryStringParameters?.campaignId || "";
  const reservedAmount = Number(event.queryStringParameters?.reservedAmount || 20);

  if (!campaignId) {
    return corsResponse(200, { campaigns: [], supportOptions: [] });
  }

  const supportOptions = [];
  const usedAthletes = new Set();
  const usedFamilies = new Set();

  function addFamily(option) {
    if (!option.familyId) return;
    if (usedFamilies.has(option.familyId)) return;
    usedFamilies.add(option.familyId);
    supportOptions.push(option);
  }

  function addAthlete(option) {
    if (!option.athleteId) return;
    if (usedAthletes.has(option.athleteId)) return;
    usedAthletes.add(option.athleteId);
    supportOptions.push(option);
  }

  const participationsSnap = await db
    .collection("campaignParticipations")
    .where("campaignId", "==", campaignId)
    .get();

  const participations = participationsSnap.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }))
    .filter((p) => isActive(p.status));

  const familyIdsInCampaign = new Set(
    participations
      .filter((p) => p.familyId)
      .map((p) => p.familyId)
  );

  participations.forEach((p) => {
    if (p.familyId) {
      addFamily({
        type: "family",
        label: `Famille ${p.familyName || p.familyId}`,
        athleteId: "",
        familyId: p.familyId,
        campaignId,
        fundingMode: "family",
        fundingGroupId: p.fundingGroupId || `${p.familyId}-${campaignId}`,
        reservedAmount,
      });
      return;
    }

    if (p.athleteId) {
      addAthlete({
        type: "individual",
        label: p.athleteName || p.athleteId,
        athleteId: p.athleteId,
        familyId: "",
        campaignId,
        fundingMode: "individual",
        fundingGroupId: p.fundingGroupId || `${p.athleteId}-${campaignId}`,
        reservedAmount,
      });
    }
  });

  const familiesSnap = await db.collection("families").get();

  familiesSnap.docs.forEach((doc) => {
    const family = { id: doc.id, ...doc.data() };
    if (!isActive(family.status)) return;
    if (!familyIdsInCampaign.has(family.id)) return;

    addFamily({
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
    campaigns: [],
    supportOptions,
  });
};
