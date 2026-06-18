const crypto = require("crypto");
const admin = require("firebase-admin");

function initFirebase() {
  if (admin.apps.length) return;

  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

function getRawBody(event) {
  return event.isBase64Encoded
    ? Buffer.from(event.body || "", "base64")
    : Buffer.from(event.body || "", "utf8");
}

function verifyShopifyHmac(event) {
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET;

  const hmacHeader =
    event.headers["x-shopify-hmac-sha256"] ||
    event.headers["X-Shopify-Hmac-Sha256"] ||
    event.headers["X-Shopify-Hmac-SHA256"];

  if (!secret || !hmacHeader) return false;

  const digest = crypto
    .createHmac("sha256", secret)
    .update(getRawBody(event))
    .digest("base64");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(digest, "utf8"),
      Buffer.from(hmacHeader, "utf8")
    );
  } catch {
    return false;
  }
}

function propertyMap(properties = []) {
  const map = {};

  properties.forEach((property) => {
    if (!property?.name) return;
    map[property.name] = property.value;
  });

  return map;
}

function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function customerName(order) {
  const firstName =
    order.customer?.first_name ||
    order.billing_address?.first_name ||
    "";

  const lastName =
    order.customer?.last_name ||
    order.billing_address?.last_name ||
    "";

  return `${firstName} ${lastName}`.trim();
}

async function findParticipation(db, { fundingGroupId, athleteId, campaignId, fundingMode }) {
  if (!fundingGroupId) return null;

  const snap = await db
    .collection("campaignParticipations")
    .where("fundingGroupId", "==", fundingGroupId)
    .get();

  if (snap.empty) return null;

  if (fundingMode === "individual" && athleteId) {
    return (
      snap.docs.find((docSnap) => docSnap.data().athleteId === athleteId) ||
      snap.docs[0]
    );
  }

  return (
    snap.docs.find((docSnap) => docSnap.data().campaignId === campaignId) ||
    snap.docs[0]
  );
}

exports.handler = async function handler(event) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: "Method not allowed",
    };
  }

  if (!verifyShopifyHmac(event)) {
    return {
      statusCode: 401,
      body: "Invalid Shopify HMAC",
    };
  }

  initFirebase();

  const db = admin.firestore();
  const order = JSON.parse(event.body || "{}");

  const orderId = String(order.id || "");
  const orderName = order.name || "";
  const financialStatus = order.financial_status || "";

  if (!orderId) {
    return {
      statusCode: 400,
      body: "Missing order id",
    };
  }

  if (!["paid", "partially_paid"].includes(financialStatus)) {
    return {
      statusCode: 200,
      body: "Order not paid. Ignored.",
    };
  }

  const alreadyProcessed = await db
    .collection("fundTransactions")
    .where("orderId", "==", orderId)
    .limit(1)
    .get();

  if (!alreadyProcessed.empty) {
    return {
      statusCode: 200,
      body: "Order already processed.",
    };
  }

  let createdTransactions = 0;
  let createdContributions = 0;

  for (const item of order.line_items || []) {
    const props = propertyMap(item.properties || []);

    const athleteId = props._athleteId || "";
    const familyId = props._familyId || "";
    const campaignId = props._campaignId || "";
    const fundingMode = props._fundingMode || "individual";
    const fundingGroupId = props._fundingGroupId || "";
    const reservedAmountUnit = toNumber(props._reservedAmount);

    const quantity = Number(item.quantity || 1);
    const reservedAmount = reservedAmountUnit * quantity;

    if (!campaignId || !fundingGroupId || reservedAmount <= 0) {
      continue;
    }

    const supportLabel =
      props["Athlète ou famille soutenu"] ||
      props["Supporté"] ||
      "";

    const participationSnap = await findParticipation(db, {
      fundingGroupId,
      athleteId,
      campaignId,
      fundingMode,
    });

    const participation = participationSnap?.data() || {};

    const basePayload = {
      source: "shopify",
      type: "shopify_sale",

      orderId,
      orderName,
      orderCreatedAt: order.created_at || null,

      lineItemId: String(item.id || ""),
      productId: String(item.product_id || ""),
      variantId: String(item.variant_id || ""),

      productTitle: item.title || "",
      variantTitle: item.variant_title || "",

      supportLabel,

      athleteId: athleteId || participation.athleteId || null,
      athleteName: participation.athleteName || null,

      familyId: familyId || participation.familyId || null,
      familyName: participation.familyName || null,

      campaignId,
      campaignTitle: participation.campaignTitle || null,

      fundingMode,
      fundingGroupId,

      quantity,
      reservedAmountUnit,
      reservedAmount,

      currency: order.currency || "CAD",

      customerEmail: order.email || null,
      customerName: customerName(order) || null,

      status: "reserved",

      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await db.collection("fundTransactions").add(basePayload);
    createdTransactions += 1;

    await db.collection("contributions").add({
      ...basePayload,
      amountReserved: reservedAmount,
      productName: item.title || "",
      displayDate: new Date().toISOString().slice(0, 10),
    });
    createdContributions += 1;

    if (participationSnap) {
      await participationSnap.ref.update({
        raisedShop: admin.firestore.FieldValue.increment(reservedAmount),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      ok: true,
      orderId,
      createdTransactions,
      createdContributions,
    }),
  };
};
