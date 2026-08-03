import type { Config } from "@netlify/functions";
import admin from "firebase-admin";
import crypto from "node:crypto";

const SITE_URL = "https://athletes.kinkolab.com";
const WISE_WEBHOOK_URL = `${SITE_URL}/.netlify/functions/wise-webhook`;

function app() {
  if (admin.apps.length) return admin.app();
  const raw = Netlify.env.get("FIREBASE_SERVICE_ACCOUNT_KEY");
  if (!raw) throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY is missing");
  const key = JSON.parse(raw);
  if (key.private_key) key.private_key = key.private_key.replace(/\\n/g, "\n");
  return admin.initializeApp({ credential: admin.credential.cert(key) });
}

function baseUrl() {
  return Netlify.env.get("WISE_ENVIRONMENT") === "sandbox" ? "https://api.sandbox.transferwise.tech" : "https://api.wise.com";
}

function token() {
  const value = Netlify.env.get("WISE_API_TOKEN");
  if (!value) throw new Error("WISE_API_TOKEN is missing");
  return value;
}

function approvalRuleConfirmed() {
  return Netlify.env.get("WISE_APPROVAL_RULE_CONFIRMED") === "true";
}

async function wise(path: string, options: RequestInit = {}) {
  const response = await fetch(`${baseUrl()}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token()}`,
      "Content-Type": "application/json",
      "X-External-Correlation-Id": crypto.randomUUID(),
      ...(options.headers || {}),
    },
  });
  const text = await response.text();
  let data: any = text;
  try { data = text ? JSON.parse(text) : {}; } catch {}
  if (!response.ok) {
    const error: any = new Error(data?.message || data?.error || `Wise API ${response.status}`);
    error.status = response.status;
    error.details = data;
    error.wiseHeaders = Object.fromEntries(response.headers.entries());
    throw error;
  }
  return data;
}

async function requireAdmin(req: Request) {
  const value = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!value) throw new Error("Unauthorized");
  const decoded = await admin.auth().verifyIdToken(value);
  const user = await admin.firestore().collection("users").doc(decoded.uid).get();
  if (!user.exists || user.data()?.role !== "admin") throw new Error("Forbidden");
  return decoded;
}

function dateValue(value: any) {
  if (!value) return null;
  if (value.toDate) return value.toDate();
  const date = new Date(String(value).length <= 10 ? `${value}T23:59:59-04:00` : value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function activeContribution(item: any) {
  return !["cancelled", "refunded", "annulé", "remboursé"].includes(String(item.status || "reserved").toLowerCase());
}

async function profileId() {
  const configured = Netlify.env.get("WISE_PROFILE_ID");
  if (configured) return Number(configured);
  const profiles = await wise("/v2/profiles");
  const business = profiles.find((item: any) => item.type === "business") || profiles[0];
  if (!business?.id) throw new Error("No Wise Business profile found");
  return Number(business.id);
}

async function sendPayoutEmails(batch: any, item: any, payoutId: string) {
  const db = admin.firestore();
  const noticeRef = db.collection("wisePayoutNotifications").doc(payoutId);
  if ((await noticeRef.get()).exists) return;
  const apiKey = Netlify.env.get("RESEND_API_KEY");
  if (!apiKey) throw new Error("RESEND_API_KEY is missing");
  const beneficiary = item.athleteId
    ? await db.collection("athletes").doc(item.athleteId).get()
    : await db.collection("families").doc(item.familyId).get();
  const data = beneficiary.data() || {};
  const recipient = item.email || data.parentEmail || data.email;
  const english = (item.language || data.preferredLanguage) === "en";
  const amount = new Intl.NumberFormat(english ? "en-CA" : "fr-CA", { style: "currency", currency: "CAD" }).format(item.amount);
  const send = async (to: string, subject: string, title: string, body: string) => {
    const response = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ from: "KinkoLab Athlètes <athletes@kinkolab.com>", reply_to: "athletes@kinkolab.com", to: [to], subject, html: `<!doctype html><html><body style="margin:0;background:#090909;font-family:Arial,sans-serif"><div style="max-width:640px;margin:auto;padding:32px 20px"><div style="border:1px solid #d7b85b55;border-radius:24px;background:#18181b;padding:32px"><img src="${SITE_URL}/images/kinko-logo.png" alt="KinkoLab" style="max-width:150px"><h1 style="color:#fff">${title}</h1><p style="white-space:pre-line;color:#d4d4d8;line-height:1.7">${body}</p><p><a href="${SITE_URL}/login" style="color:#d7b85b">${english ? "Open my dashboard" : "Ouvrir mon espace"}</a></p></div></div></body></html>` }) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || "Resend rejected payout email");
    await db.collection("emailLogs").add({ type: "payout_paid", recordId: payoutId, recipient: to, resendId: result.id, status: "sent", createdAt: admin.firestore.FieldValue.serverTimestamp() });
  };
  if (recipient) await send(recipient, english ? `Your KinkoLab funds have been paid — ${batch.campaignTitle}` : `Vos fonds KinkoLab ont été versés — ${batch.campaignTitle}`, english ? "Wise payment completed" : "Versement Wise effectué", english ? `Hello ${item.legalName},\n\nWise has completed your ${amount} payment for ${batch.campaignTitle}. The transfer reference is ${item.wiseTransferId}.` : `Bonjour ${item.legalName},\n\nWise a effectué votre versement de ${amount} pour ${batch.campaignTitle}. La référence du transfert est ${item.wiseTransferId}.`);
  const contributions = (await db.collection("contributions").where("campaignId", "==", batch.campaignId).get()).docs.map((doc) => doc.data()).filter((entry) => item.athleteId ? entry.athleteId === item.athleteId : entry.familyId === item.familyId).filter(activeContribution);
  const supporters = new Map<string, any>();
  contributions.forEach((entry) => { if (entry.customerEmail) supporters.set(String(entry.customerEmail).toLowerCase(), entry); });
  for (const [email, contribution] of supporters) {
    const supporterEnglish = contribution.customerLanguage === "en";
    await send(email, supporterEnglish ? `Funds paid — ${batch.campaignTitle}` : `Fonds remis — ${batch.campaignTitle}`, supporterEnglish ? "Your support has reached the athlete" : "Votre soutien a été remis à l’athlète", supporterEnglish ? `The funds associated with your supporter purchase for ${batch.campaignTitle} have now been paid to ${item.beneficiaryLabel}. Thank you for your support.` : `Les fonds associés à votre achat supporter pour ${batch.campaignTitle} ont maintenant été remis à ${item.beneficiaryLabel}. Merci de votre soutien.`);
  }
  await noticeRef.set({ payoutId, sentAt: admin.firestore.FieldValue.serverTimestamp(), supporterCount: supporters.size });
}

async function buildCampaignRows(campaign: any) {
  const db = admin.firestore();
  const [contributionsSnapshot, payoutsSnapshot] = await Promise.all([
    db.collection("contributions").where("campaignId", "==", campaign.id).get(),
    db.collection("payouts").where("campaignId", "==", campaign.id).get(),
  ]);
  const paidByTarget = new Map<string, number>();
  payoutsSnapshot.docs.forEach((doc) => {
    const item = doc.data();
    if ((item.status || "paid") === "paid") paidByTarget.set(item.targetKey, (paidByTarget.get(item.targetKey) || 0) + Number(item.amount || 0));
  });
  const rows = new Map<string, any>();
  contributionsSnapshot.docs.map((doc) => doc.data()).filter(activeContribution).forEach((item) => {
    const targetKey = item.fundingMode === "family" ? `family-${item.familyId || item.fundingGroupId}` : `athlete-${item.athleteId}`;
    if (!rows.has(targetKey)) rows.set(targetKey, {
      targetKey, athleteId: item.athleteId || null, familyId: item.familyId || null,
      beneficiaryLabel: item.athleteName || item.familyName || item.supportLabel || "Bénéficiaire",
      amount: 0,
    });
    rows.get(targetKey).amount += Number(item.amountReserved || item.reservedAmount || 0);
  });
  const result = [];
  for (const row of rows.values()) {
    row.amount = Math.max(0, row.amount - Number(paidByTarget.get(row.targetKey) || 0));
    if (!row.amount) continue;
    const beneficiary = row.athleteId
      ? await db.collection("athletes").doc(row.athleteId).get()
      : await db.collection("families").doc(row.familyId).get();
    const data = beneficiary.data() || {};
    const payout = data.payoutProfile || {};
    result.push({
      ...row,
      legalName: payout.legalName || row.beneficiaryLabel,
      email: String(payout.wiseEmail || payout.interacEmail || data.parentEmail || data.email || "").trim().toLowerCase(),
      language: data.preferredLanguage || "fr",
      ready: payout.method === "wise" && Boolean(payout.consent) && Boolean(payout.wiseEmail || payout.interacEmail),
      blockedReason: payout.method === "wise" && payout.consent ? "missing_email" : "wise_consent_required",
    });
  }
  return result;
}

async function createWiseBatch(campaign: any, rows: any[], actor = "scheduler") {
  const db = admin.firestore();
  const batchRef = db.collection("wisePayoutBatches").doc(campaign.id);
  const current = await batchRef.get();
  if (current.exists && !["configuration_required", "failed", "blocked"].includes(current.data()?.status)) return current.data();
  const readyRows = rows.filter((row) => row.ready);
  const blockedRows = rows.filter((row) => !row.ready);
  const total = readyRows.reduce((sum, row) => sum + row.amount, 0);
  const eligibleAt = new Date(dateValue(campaign.endDate || campaign.endAt || campaign.eventEnd)?.getTime() + 15 * 86400000).toISOString();
  const base = {
    campaignId: campaign.id, campaignTitle: campaign.titleFr || campaign.title || campaign.name || campaign.id,
    currency: "CAD", eligibleAt, total, beneficiaryCount: readyRows.length,
    blockedBeneficiaries: blockedRows.map(({ targetKey, beneficiaryLabel, blockedReason }) => ({ targetKey, beneficiaryLabel, blockedReason })),
    rows: readyRows, approvalMode: "wise_required", fundingMethod: "wise_cad_balance",
    createdBy: actor, updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };
  if (!Netlify.env.get("WISE_API_TOKEN")) {
    await batchRef.set({ ...base, status: "configuration_required", error: "WISE_API_TOKEN is missing" }, { merge: true });
    return { ...base, status: "configuration_required" };
  }
  if (!readyRows.length) {
    await batchRef.set({ ...base, status: "blocked", error: "No beneficiary has completed Wise payout preferences" }, { merge: true });
    return { ...base, status: "blocked" };
  }
  await batchRef.set({ ...base, status: "creating" }, { merge: true });
  let draft: any = null;
  try {
    const profile = await profileId();
    const group = await wise(`/v3/profiles/${profile}/batch-groups`, { method: "POST", body: JSON.stringify({ sourceCurrency: "CAD", name: `KinkoLab — ${base.campaignTitle}` }) });
    const batchGroupId = group.id || group.batchGroupId;
    if (!batchGroupId) throw new Error("Wise did not return a batch group identifier");
    const transfers = [];
    for (const row of readyRows) {
      const quote = await wise(`/v3/profiles/${profile}/quotes`, { method: "POST", body: JSON.stringify({ sourceCurrency: "CAD", targetCurrency: "CAD", sourceAmount: row.amount, targetAmount: null, payOut: "BANK_TRANSFER", preferredPayIn: "BALANCE" }) });
      const requirements = await wise(`/v1/quotes/${quote.id}/account-requirements`);
      const emailEnabled = Array.isArray(requirements) && requirements.some((item: any) => item.type === "email");
      if (!emailEnabled) throw new Error("Wise has not enabled email recipients for this CAD route. Contact Wise support before production use.");
      const recipient = await wise("/v1/accounts", { method: "POST", body: JSON.stringify({ currency: "CAD", type: "email", profile, ownedByCustomer: false, accountHolderName: row.legalName, details: { legalType: "PRIVATE", email: row.email } }) });
      const transfer = await wise(`/v3/profiles/${profile}/batch-groups/${batchGroupId}/transfers`, { method: "POST", body: JSON.stringify({ targetAccount: recipient.id || recipient.accountId, quoteUuid: quote.id, customerTransactionId: crypto.randomUUID(), details: { reference: `KINKO-${campaign.id}` } }) });
      transfers.push({ ...row, quoteId: quote.id, wiseRecipientId: recipient.id || recipient.accountId, wiseTransferId: transfer.id, status: transfer.status || "incoming_payment_waiting" });
    }
    draft = { ...base, profileId: profile, wiseBatchGroupId: batchGroupId, wiseBatchVersion: group.version, transfers, status: "closing_batch", error: null, createdAt: admin.firestore.FieldValue.serverTimestamp() };
    await batchRef.set(draft, { merge: true });
    const completedGroup = await wise(`/v3/profiles/${profile}/batch-groups/${batchGroupId}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "COMPLETED", version: group.version }),
    });
    await batchRef.set({ wiseBatchStatus: completedGroup.status || "COMPLETED", wiseBatchVersion: completedGroup.version || group.version, status: "submitting_for_approval", updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
    if (!approvalRuleConfirmed()) {
      const status = "funding_configuration_required";
      const error = "Set WISE_APPROVAL_RULE_CONFIRMED=true only after every payment created by the API token owner requires approval by another Wise team member.";
      await batchRef.set({ status, error, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
      return { ...draft, status, error };
    }
    const funding = await wise(`/v3/profiles/${profile}/batch-payments/${batchGroupId}/payments`, {
      method: "POST",
      body: JSON.stringify({ type: "BALANCE" }),
    });
    const fundingStatus = String(funding.status || "PENDING").toUpperCase();
    const status = fundingStatus === "COMPLETED" ? "processing" : "awaiting_wise_approval";
    await batchRef.set({ fundingResponse: funding, fundingStatus, fundingRequestedAt: admin.firestore.FieldValue.serverTimestamp(), status, error: null, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
    return { ...draft, fundingStatus, status };
  } catch (error: any) {
    await batchRef.set({ ...base, ...(draft || {}), status: draft ? "funding_failed" : "failed", error: error.message, wiseError: error.details || null, wiseErrorStatus: error.status || null, wiseErrorHeaders: error.wiseHeaders || null, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
    throw error;
  }
}

async function retryBatchFunding(campaignId: string) {
  const ref = admin.firestore().collection("wisePayoutBatches").doc(campaignId);
  const snapshot = await ref.get();
  if (!snapshot.exists) throw new Error("Wise batch not found");
  const batch = snapshot.data() || {};
  if (!batch.profileId || !batch.wiseBatchGroupId) throw new Error("Wise batch is incomplete and cannot be funded");
  if (!approvalRuleConfirmed()) throw new Error("WISE_APPROVAL_RULE_CONFIRMED must be true after the Wise approval rule has been verified");
  let completedGroup: any = null;
  if (batch.wiseBatchStatus !== "COMPLETED") {
    completedGroup = await wise(`/v3/profiles/${batch.profileId}/batch-groups/${batch.wiseBatchGroupId}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "COMPLETED", version: batch.wiseBatchVersion }),
    });
  }
  const funding = await wise(`/v3/profiles/${batch.profileId}/batch-payments/${batch.wiseBatchGroupId}/payments`, { method: "POST", body: JSON.stringify({ type: "BALANCE" }) });
  const fundingStatus = String(funding.status || "PENDING").toUpperCase();
  const status = fundingStatus === "COMPLETED" ? "processing" : "awaiting_wise_approval";
  await ref.set({ wiseBatchStatus: completedGroup?.status || batch.wiseBatchStatus || "COMPLETED", wiseBatchVersion: completedGroup?.version || batch.wiseBatchVersion, fundingResponse: funding, fundingStatus, fundingRequestedAt: admin.firestore.FieldValue.serverTimestamp(), status, error: null, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
  return { campaignId, fundingStatus, status };
}

async function prepareEligible(actor = "scheduler", onlyCampaignId = "") {
  const db = admin.firestore();
  const campaigns = (await db.collection("campaigns").get()).docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  const now = Date.now();
  const eligible = campaigns.filter((campaign: any) => {
    if (onlyCampaignId && campaign.id !== onlyCampaignId) return false;
    const end = dateValue(campaign.endDate || campaign.endAt || campaign.eventEnd);
    return end && now >= end.getTime() + 15 * 86400000;
  });
  const results = [];
  for (const campaign of eligible) results.push(await createWiseBatch(campaign, await buildCampaignRows(campaign), actor));
  return results;
}

async function syncBatches() {
  const db = admin.firestore();
  if (!Netlify.env.get("WISE_API_TOKEN")) return [];
  const snapshot = await db.collection("wisePayoutBatches").get();
  const changed = [];
  for (const batchDoc of snapshot.docs) {
    const batch = batchDoc.data();
    if (!batch.transfers?.length || ["completed", "cancelled"].includes(batch.status)) continue;
    const transfers = [];
    for (const item of batch.transfers) {
      const remote = await wise(`/v1/transfers/${item.wiseTransferId}`);
      transfers.push({ ...item, status: remote.status, wiseUpdatedAt: remote.updated || null });
      if (remote.status === "outgoing_payment_sent") {
        const payoutId = `wise-${item.wiseTransferId}`;
        const payoutRef = db.collection("payouts").doc(payoutId);
        if (!(await payoutRef.get()).exists) await payoutRef.set({
          targetKey: item.targetKey, athleteId: item.athleteId || null, familyId: item.familyId || null,
          beneficiaryLabel: item.beneficiaryLabel, beneficiaryType: item.familyId ? "Famille" : "Athlète",
          campaignId: batch.campaignId, campaignTitle: batch.campaignTitle, amount: item.amount,
          method: "wise", status: "paid", wiseTransferId: item.wiseTransferId, wiseBatchGroupId: batch.wiseBatchGroupId,
          date: new Date().toISOString().slice(0, 10), createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        await sendPayoutEmails(batch, item, payoutId);
      }
    }
    const completed = transfers.length > 0 && transfers.every((item: any) => item.status === "outgoing_payment_sent");
    const nextStatus = completed ? "completed" : transfers.some((item: any) => ["processing", "funds_converted", "outgoing_payment_sent"].includes(item.status)) ? "processing" : batch.status;
    await batchDoc.ref.update({ transfers, status: nextStatus, lastSyncedAt: admin.firestore.FieldValue.serverTimestamp() });
    changed.push({ id: batchDoc.id, status: nextStatus });
  }
  return changed;
}

async function setupWebhook() {
  const profile = await profileId();
  return wise(`/v3/profiles/${profile}/subscriptions`, { method: "POST", body: JSON.stringify({ name: "KinkoLab payout status", trigger_on: "transfers#state-change", delivery: { version: "4.0.0", url: WISE_WEBHOOK_URL } }) });
}

export async function runScheduledWisePayouts() {
  app();
  const prepared = await prepareEligible("scheduler");
  const synced = await syncBatches();
  return { prepared: prepared.length, synced };
}

export default async (req: Request) => {
  try {
    app();
    const adminUser = await requireAdmin(req);
    if (req.method === "GET") {
      const batches = (await admin.firestore().collection("wisePayoutBatches").orderBy("updatedAt", "desc").get()).docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      return Response.json({ configured: Boolean(Netlify.env.get("WISE_API_TOKEN")), approvalRuleConfirmed: approvalRuleConfirmed(), environment: Netlify.env.get("WISE_ENVIRONMENT") || "production", batches });
    }
    const body = await req.json();
    if (body.action === "prepare_eligible") return Response.json({ results: await prepareEligible(adminUser.uid, body.campaignId || "") });
    if (body.action === "retry_funding") return Response.json({ result: await retryBatchFunding(body.campaignId || "") });
    if (body.action === "sync") return Response.json({ results: await syncBatches() });
    if (body.action === "setup_webhook") return Response.json({ subscription: await setupWebhook() });
    return Response.json({ error: "Unsupported action" }, { status: 400 });
  } catch (error: any) {
    console.error("wise-payouts", error);
    const status = error.message === "Unauthorized" ? 401 : error.message === "Forbidden" ? 403 : 500;
    return Response.json({ error: error.message, details: error.details || null }, { status });
  }
};

export const config: Config = { path: "/api/wise-payouts" };
