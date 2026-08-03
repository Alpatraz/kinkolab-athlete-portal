const crypto = require("crypto");
const admin = require("firebase-admin");

const ATHLETE_SHARE_PER_ITEM = 20;
const FROM = "KinkoLab Athlètes <athletes@kinkolab.com>";
const SITE_URL = "https://athletes.kinkolab.com";

function initFirebase() {
  if (admin.apps.length) return;
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
  if (serviceAccount.private_key) serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, "\n");
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

function rawBody(event) {
  return event.isBase64Encoded ? Buffer.from(event.body || "", "base64") : Buffer.from(event.body || "", "utf8");
}

function header(event, name) {
  const key = Object.keys(event.headers || {}).find((item) => item.toLowerCase() === name.toLowerCase());
  return key ? event.headers[key] : "";
}

function verifyShopifyHmac(event) {
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET;
  const received = header(event, "x-shopify-hmac-sha256");
  if (!secret || !received) return false;
  const expected = crypto.createHmac("sha256", secret).update(rawBody(event)).digest("base64");
  try { return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(received)); } catch { return false; }
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[character]));
}

function propertyMap(properties = []) {
  return Object.fromEntries(properties.filter((item) => item?.name).map((item) => [item.name, item.value]));
}

function customerName(order) {
  const address = order.billing_address || order.shipping_address || {};
  return `${order.customer?.first_name || address.first_name || ""} ${order.customer?.last_name || address.last_name || ""}`.trim();
}

function money(value, currency = "CAD", language = "fr") {
  return new Intl.NumberFormat(language === "en" ? "en-CA" : "fr-CA", { style: "currency", currency }).format(Number(value || 0));
}

function emailShell(title, body) {
  return `<!doctype html><html><body style="margin:0;background:#090909;font-family:Arial,sans-serif"><div style="max-width:680px;margin:auto;padding:32px 20px"><div style="border:1px solid #d7b85b55;border-radius:24px;background:#18181b;padding:32px"><img src="${SITE_URL}/images/kinko-logo.png" alt="KinkoLab" style="max-width:150px;max-height:70px"><h1 style="color:#f4f4f5;font-size:30px">${escapeHtml(title)}</h1>${body}<p style="margin-top:30px;border-top:1px solid #d7b85b55;padding-top:20px;color:#a1a1aa;font-size:12px">KinkoLab Inc. · Terrebonne, Québec · athletes@kinkolab.com</p></div></div></body></html>`;
}

async function sendEmail(db, { to, subject, title, html, type, recordId, language = "fr" }) {
  if (!to) return null;
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY is missing");
  const response = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ from: FROM, reply_to: "athletes@kinkolab.com", to: [to], subject, html: emailShell(title, html) }) });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Resend rejected the email");
  await db.collection("emailLogs").add({ type, recordId, recipient: to, language, resendId: data.id, status: "sent", test: false, createdAt: admin.firestore.FieldValue.serverTimestamp() });
  return data.id;
}

async function findParticipation(db, fundingGroupId, athleteId, campaignId) {
  if (!fundingGroupId) return null;
  const snapshot = await db.collection("campaignParticipations").where("fundingGroupId", "==", fundingGroupId).get();
  return snapshot.docs.find((item) => athleteId && item.data().athleteId === athleteId)
    || snapshot.docs.find((item) => item.data().campaignId === campaignId)
    || snapshot.docs[0]
    || null;
}

async function campaignData(db, campaignId) {
  if (!campaignId) return {};
  const snapshot = await db.collection("campaigns").doc(campaignId).get();
  return snapshot.exists ? snapshot.data() : {};
}

function plusDays(value, days) {
  if (!value) return null;
  const date = value.toDate ? value.toDate() : new Date(`${String(value).slice(0, 10)}T23:59:59`);
  if (Number.isNaN(date.getTime())) return null;
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

async function processPaid(db, order) {
  const orderId = String(order.id || "");
  if (!orderId) throw new Error("Missing order id");
  if (!["paid", "partially_paid"].includes(order.financial_status || "")) return { ignored: true };
  const supportedLines = [];

  for (const item of order.line_items || []) {
    const props = propertyMap(item.properties || []);
    const campaignId = props._campaignId || "";
    const fundingGroupId = props._fundingGroupId || "";
    if (!campaignId || !fundingGroupId) continue;
    const fundingMode = props._fundingMode === "family" ? "family" : "individual";
    const athleteId = fundingMode === "individual" ? props._athleteId || "" : "";
    const familyId = fundingMode === "family" ? props._familyId || "" : "";
    const quantity = Math.max(1, Number(item.quantity || 1));
    const reservedAmount = ATHLETE_SHARE_PER_ITEM * quantity;
    const lineItemId = String(item.id || "");
    const contributionRef = db.collection("contributions").doc(`${orderId}-${lineItemId}`);
    const existingContribution = await contributionRef.get();
    if (existingContribution.exists) {
      supportedLines.push(existingContribution.data());
      continue;
    }

    const participationRef = await findParticipation(db, fundingGroupId, athleteId, campaignId);
    const participation = participationRef?.data() || {};
    const campaign = await campaignData(db, campaignId);
    const supportLabel = props["Athlète ou famille soutenu(e)"] || props["Athlète ou famille soutenu"] || props.Supporté || participation.athleteName || participation.familyName || "";
    const athleteName = fundingMode === "individual" ? participation.athleteName || supportLabel : null;
    const campaignTitle = participation.campaignTitle || campaign.title || campaign.titleFr || campaignId;
    const payload = {
      source: "shopify", type: "shopify_sale", orderId, orderName: order.name || "", orderCreatedAt: order.created_at || null,
      lineItemId, productId: String(item.product_id || ""), variantId: String(item.variant_id || ""), productTitle: item.title || "", productName: item.title || "", variantTitle: item.variant_title || "", size: item.variant_title || "",
      supportLabel, athleteId: fundingMode === "individual" ? athleteId || participation.athleteId || null : null, athleteName,
      familyId: fundingMode === "family" ? familyId || participation.familyId || null : null, familyName: fundingMode === "family" ? participation.familyName || supportLabel : null,
      campaignId, campaignTitle, campaignEndDate: campaign.endDate || campaign.endAt || null, eligiblePayoutDate: plusDays(campaign.endDate || campaign.endAt, 15),
      fundingMode, fundingGroupId, quantity, refundedQuantity: 0, reservedAmountUnit: ATHLETE_SHARE_PER_ITEM, reservedAmount, amountReserved: reservedAmount,
      currency: order.currency || "CAD", customerEmail: order.email || order.contact_email || null, customerName: customerName(order) || null,
      orderStatusUrl: order.order_status_url || null, status: "reserved", displayDate: new Date().toISOString().slice(0, 10), createdAt: admin.firestore.FieldValue.serverTimestamp(), updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    await Promise.all([
      contributionRef.set(payload),
      db.collection("fundTransactions").doc(`${orderId}-${lineItemId}`).set(payload),
      participationRef?.ref.update({ raisedShop: admin.firestore.FieldValue.increment(reservedAmount), updatedAt: admin.firestore.FieldValue.serverTimestamp() }) || Promise.resolve(),
    ]);
    supportedLines.push(payload);
  }

  const notificationRef = db.collection("shopifyOrderNotifications").doc(`${orderId}-paid`);
  if (supportedLines.length && (order.email || order.contact_email) && !(await notificationRef.get()).exists) {
    const language = String(order.customer_locale || order.locale || "fr").toLowerCase().startsWith("en") ? "en" : "fr";
    const rows = supportedLines.map((line) => `<tr><td style="padding:10px;border-bottom:1px solid #3f3f46;color:#fff">${escapeHtml(line.productTitle)}${line.variantTitle ? ` — ${escapeHtml(line.variantTitle)}` : ""} × ${line.quantity}<br><small style="color:#a1a1aa">${escapeHtml(line.campaignTitle)} · ${escapeHtml(line.supportLabel)}</small></td><td style="padding:10px;border-bottom:1px solid #3f3f46;color:#d7b85b;text-align:right">${money(line.amountReserved, line.currency, language)}</td></tr>`).join("");
    const athleteShare = supportedLines.reduce((sum, line) => sum + line.amountReserved, 0);
    const title = language === "en" ? "Your KinkoLab supporter purchase" : "Votre achat supporter KinkoLab";
    const intro = language === "en" ? `Thank you ${customerName(order) || ""}. Here is the breakdown of the athlete support associated with your order ${order.name || ""}.` : `Merci ${customerName(order) || ""}. Voici la répartition du soutien aux athlètes associé à votre commande ${order.name || ""}.`;
    const statusLink = order.order_status_url ? `<p><a href="${escapeHtml(order.order_status_url)}" style="display:inline-block;background:#d7b85b;color:#000;padding:12px 18px;border-radius:10px;text-decoration:none;font-weight:bold">${language === "en" ? "View receipt and order" : "Voir la facture et la commande"}</a></p>` : "";
    const html = `<p style="color:#d4d4d8;line-height:1.7">${escapeHtml(intro)}</p><table style="width:100%;border-collapse:collapse">${rows}</table><p style="color:#fff;font-size:18px"><strong>${language === "en" ? "Fixed athlete allocation" : "Montant fixe attribué aux athlètes"}: ${money(athleteShare, order.currency || "CAD", language)}</strong></p><p style="color:#d4d4d8;line-height:1.7">${language === "en" ? "The athlete allocation is $20 per eligible hoodie. Taxes, shipping and the remaining product price are not part of the athlete allocation. Shopify will send the official order confirmation. We will contact you when the product ships and when the funds are paid to the athlete, normally 15 days after the campaign ends." : "La part attribuée est de 20 $ par hoodie admissible. Les taxes, la livraison et le solde du prix du produit ne font pas partie du montant attribué à l’athlète. Shopify transmet la confirmation officielle de commande. Nous vous contacterons lors de l’expédition du produit et lorsque les fonds seront remis à l’athlète, normalement 15 jours après la fin de la campagne."}</p>${statusLink}`;
    const resendId = await sendEmail(db, { to: order.email || order.contact_email, subject: language === "en" ? `Receipt and athlete allocation — ${order.name}` : `Facture et part athlète — ${order.name}`, title, html, type: "supporter_order_paid", recordId: orderId, language });
    await notificationRef.set({ resendId, sentAt: admin.firestore.FieldValue.serverTimestamp() });
  }
  return { createdContributions: supportedLines.length };
}

async function affectedRecipient(db, contribution) {
  let snapshot = null;
  if (contribution.athleteId) snapshot = await db.collection("athletes").doc(contribution.athleteId).get();
  if ((!snapshot || !snapshot.exists) && contribution.familyId) snapshot = await db.collection("families").doc(contribution.familyId).get();
  const data = snapshot?.data() || {};
  return { email: data.parentEmail || data.contactEmail || data.email || "", name: data.name || contribution.athleteName || contribution.familyName || contribution.supportLabel || "athlète", language: data.preferredLanguage || "fr" };
}

async function reverseContributions(db, orderId, status, refundLines = null, notificationKey = String(orderId)) {
  const snapshot = await db.collection("contributions").where("orderId", "==", String(orderId)).get();
  const refunds = refundLines ? new Map(refundLines.map((item) => [String(item.line_item_id || item.line_item?.id || ""), Number(item.quantity || 0)])) : null;
  const notices = new Map();
  let adjusted = 0;
  for (const doc of snapshot.docs) {
    const contribution = doc.data();
    const refundQuantity = refunds ? refunds.get(String(contribution.lineItemId)) || 0 : Number(contribution.quantity || 0);
    if (refunds && refundQuantity <= 0) continue;
    const previousActiveAmount = ["cancelled", "refunded"].includes(contribution.status) ? 0 : Number(contribution.amountReserved || 0);
    const totalRefundedQuantity = Math.min(Number(contribution.quantity || 0), Number(contribution.refundedQuantity || 0) + refundQuantity);
    const remainingQuantity = Math.max(0, Number(contribution.quantity || 0) - totalRefundedQuantity);
    const nextAmount = refunds ? remainingQuantity * ATHLETE_SHARE_PER_ITEM : 0;
    const nextStatus = nextAmount > 0 ? "partially_refunded" : status;
    const reduction = Math.max(0, previousActiveAmount - nextAmount);
    await Promise.all([
      doc.ref.update({ status: nextStatus, refundedQuantity: refunds ? totalRefundedQuantity : Number(contribution.quantity || 0), amountReserved: nextAmount, reservedAmount: nextAmount, adjustedAt: admin.firestore.FieldValue.serverTimestamp(), updatedAt: admin.firestore.FieldValue.serverTimestamp() }),
      db.collection("fundTransactions").doc(`${orderId}-${contribution.lineItemId}`).set({ status: nextStatus, refundedQuantity: refunds ? totalRefundedQuantity : Number(contribution.quantity || 0), reservedAmount: nextAmount, adjustedAt: admin.firestore.FieldValue.serverTimestamp(), updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true }),
    ]);
    if (reduction && contribution.fundingGroupId) {
      const participation = await findParticipation(db, contribution.fundingGroupId, contribution.athleteId, contribution.campaignId);
      if (participation) await participation.ref.update({ raisedShop: admin.firestore.FieldValue.increment(-reduction), updatedAt: admin.firestore.FieldValue.serverTimestamp() });
    }
    const recipient = await affectedRecipient(db, contribution);
    if (recipient.email && reduction > 0) {
      const previousNotice = notices.get(recipient.email);
      notices.set(recipient.email, {
        ...recipient,
        campaign: contribution.campaignTitle,
        product: previousNotice?.product
          ? `${previousNotice.product}, ${contribution.productTitle}`
          : contribution.productTitle,
        amount: Number(previousNotice?.amount || 0) + reduction,
        currency: contribution.currency || "CAD",
      });
    }
    adjusted += reduction;
  }
  for (const [email, notice] of notices) {
    const noticeId = `${notificationKey}-${crypto.createHash("sha256").update(email).digest("hex").slice(0, 20)}`;
    await db.collection("shopifyAdjustmentNotifications").doc(noticeId).set({ ...notice, email, orderId: String(orderId), notificationKey, status: "pending", updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
  }
  const pendingNotices = await db.collection("shopifyAdjustmentNotifications").where("notificationKey", "==", notificationKey).get();
  for (const noticeDoc of pendingNotices.docs.filter((item) => item.data().status === "pending")) {
    const notice = noticeDoc.data();
    const email = notice.email;
    const english = notice.language === "en";
    const resendId = await sendEmail(db, { to: email, subject: english ? `Adjustment to ${notice.campaign}` : `Ajustement de la campagne ${notice.campaign}`, title: english ? "Order cancellation or refund" : "Annulation ou remboursement d’une commande", html: `<p style="color:#d4d4d8;line-height:1.7">${escapeHtml(english ? `Hello ${notice.name}, a supporter order related to ${notice.product} was cancelled or refunded. The amount assigned to your campaign has been adjusted by ${money(notice.amount, notice.currency, "en")}. Your dashboard and public totals have been updated automatically.` : `Bonjour ${notice.name}, une commande supporter liée au produit ${notice.product} a été annulée ou remboursée. Le montant attribué à votre campagne a été ajusté de ${money(notice.amount, notice.currency, "fr")}. Votre tableau de bord et les totaux publics ont été mis à jour automatiquement.`)}</p><p><a href="${SITE_URL}/login" style="color:#d7b85b">${english ? "Open my dashboard" : "Ouvrir mon espace"}</a></p>`, type: "supporter_order_adjusted", recordId: String(orderId), language: notice.language });
    await noticeDoc.ref.update({ status: "sent", resendId, sentAt: admin.firestore.FieldValue.serverTimestamp() });
  }
  return { adjusted };
}

async function processFulfilled(db, order) {
  const orderId = String(order.id || "");
  const snapshot = await db.collection("contributions").where("orderId", "==", orderId).limit(1).get();
  if (snapshot.empty || !(order.email || order.contact_email)) return { ignored: true };
  const language = String(order.customer_locale || "fr").startsWith("en") ? "en" : "fr";
  const tracking = (order.fulfillments || []).flatMap((item) => item.tracking_urls || [item.tracking_url]).filter(Boolean)[0] || order.order_status_url || "";
  const link = tracking ? `<p><a href="${escapeHtml(tracking)}" style="display:inline-block;background:#d7b85b;color:#000;padding:12px 18px;border-radius:10px;text-decoration:none;font-weight:bold">${language === "en" ? "Track shipment" : "Suivre l’expédition"}</a></p>` : "";
  await sendEmail(db, { to: order.email || order.contact_email, subject: language === "en" ? `Your KinkoLab order ${order.name} has shipped` : `Votre commande KinkoLab ${order.name} a été expédiée`, title: language === "en" ? "Your supporter product is on its way" : "Votre produit supporter est en route", html: `<p style="color:#d4d4d8;line-height:1.7">${language === "en" ? "Your supporter product has been shipped. Thank you again for supporting a KinkoLab athlete." : "Votre produit supporter a été expédié. Merci encore de soutenir un athlète KinkoLab."}</p>${link}`, type: "supporter_order_fulfilled", recordId: orderId, language });
  return { notified: true };
}

exports.handler = async function handler(event) {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method not allowed" };
  if (!verifyShopifyHmac(event)) return { statusCode: 401, body: "Invalid Shopify HMAC" };
  initFirebase();
  const db = admin.firestore();
  const payload = JSON.parse(rawBody(event).toString("utf8") || "{}");
  const topic = header(event, "x-shopify-topic") || "orders/paid";
  const webhookId = header(event, "x-shopify-webhook-id") || crypto.createHash("sha256").update(rawBody(event)).digest("hex");
  const eventRef = db.collection("shopifyWebhookEvents").doc(webhookId);
  const existingEvent = await eventRef.get();
  if (existingEvent.exists && existingEvent.data()?.status === "completed") return { statusCode: 200, body: JSON.stringify({ ok: true, duplicate: true }) };
  try {
    let result;
    if (topic === "orders/paid") result = await processPaid(db, payload);
    else if (topic === "orders/cancelled") result = await reverseContributions(db, payload.id, "cancelled", null, webhookId);
    else if (topic === "refunds/create") result = await reverseContributions(db, payload.order_id, "refunded", payload.refund_line_items || [], webhookId);
    else if (["orders/fulfilled", "orders/partially_fulfilled"].includes(topic)) result = await processFulfilled(db, payload);
    else result = { ignored: true, topic };
    await eventRef.set({ topic, status: "completed", result, processedAt: admin.firestore.FieldValue.serverTimestamp() });
    return { statusCode: 200, body: JSON.stringify({ ok: true, topic, ...result }) };
  } catch (error) {
    console.error("shopify webhook error", topic, error);
    await eventRef.set({ topic, status: "failed", error: error.message || String(error), failedAt: admin.firestore.FieldValue.serverTimestamp() });
    return { statusCode: 500, body: "Webhook processing failed" };
  }
};
