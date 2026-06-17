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

  const rawBody = getRawBody(event);

  const digest = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("base64");

  return crypto.timingSafeEqual(
    Buffer.from(digest, "utf8"),
    Buffer.from(hmacHeader, "utf8")
  );
}

async function fetchMetafields(ownerType, ownerId) {
  const shop = process.env.SHOPIFY_SHOP_DOMAIN;
  const token = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;

  if (!shop || !token || !ownerId) return {};

  const url = `https://${shop}/admin/api/2025-04/${ownerType}/${ownerId}/metafields.json`;

  const response = await fetch(url, {
    headers: {
      "X-Shopify-Access-Token": token,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) return {};

  const data = await response.json();
  const metafields = data.metafields || [];

  return metafields
    .filter((field) => field.namespace === "kinko")
    .reduce((acc, field) => {
      acc[field.key] = field.value;
      return acc;
    }, {});
}

function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
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

  const existing = await db
    .collection("fundTransactions")
    .where("orderId", "==", orderId)
    .limit(1)
    .get();

  if (!existing.empty) {
    return {
      statusCode: 200,
      body: "Order already processed.",
    };
  }

  const batch = db.batch();
  const participationUpdates = new Map();

  for (const item of order.line_items || []) {
    const variantMetafields = await fetchMetafields(
      "variants",
      item.variant_id
    );

    const productMetafields = await fetchMetafields(
      "products",
      item.product_id
    );

    const metafields = {
      ...productMetafields,
      ...variantMetafields,
    };

    const athleteId = metafields.athlete_id || null;
    const campaignId = metafields.campaign_id || null;
    const fundingMode = metafields.funding_mode || "individual";
    const fundingGroupId =
      metafields.funding_group_id ||
      (athleteId && campaignId ? `${athleteId}-${campaignId}` : null);

    const reservedAmountUnit = toNumber(metafields.reserved_amount);
    const quantity = Number(item.quantity || 1);
    const reservedAmount = reservedAmountUnit * quantity;

    if (!campaignId || !fundingGroupId || reservedAmount <= 0) {
      continue;
    }

    const transactionRef = db.collection("fundTransactions").doc();

    batch.set(transactionRef, {
      type: "shopify_sale",

      orderId,
      orderName,
      orderCreatedAt: order.created_at || null,

      lineItemId: String(item.id || ""),
      productId: String(item.product_id || ""),
      variantId: String(item.variant_id || ""),
      productTitle: item.title || "",
      variantTitle: item.variant_title || "",

      athleteId,
      campaignId,
      fundingMode,
      fundingGroupId,

      quantity,
      reservedAmountUnit,
      reservedAmount,

      currency: order.currency || "CAD",
      status: "reserved",

      customerEmail: order.email || null,

      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    if (!participationUpdates.has(fundingGroupId)) {
      participationUpdates.set(fundingGroupId, 0);
    }

    participationUpdates.set(
      fundingGroupId,
      participationUpdates.get(fundingGroupId) + reservedAmount
    );
  }

  for (const [fundingGroupId, amount] of participationUpdates.entries()) {
    const participationsSnap = await db
      .collection("campaignParticipations")
      .where("fundingGroupId", "==", fundingGroupId)
      .get();

    participationsSnap.forEach((docSnap) => {
      batch.update(docSnap.ref, {
        raisedShop: admin.firestore.FieldValue.increment(amount),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });
  }

  await batch.commit();

  return {
    statusCode: 200,
    body: "Shopify order processed.",
  };
};
