const crypto = require("crypto");

const CHANNELS = ["owned_website", "approved_social", "opt_in_email"];
const PROHIBITED = /\b(gambling|casino|betting|adult|porn|alcohol|tobacco|nicotine|vape|weapon|firearm|recreational drug|controlled substance)\b/i;
const DECEPTIVE = /\b(guaranteed (?:income|profit|result)|get rich|risk[- ]free|instant money|no effort|miracle|cure|100% success|fake review|fake testimonial)\b/i;

function fail(message, statusCode = 400) { throw Object.assign(new Error(message), { statusCode }); }
function hash(value) { return crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex"); }
function text(value, name, max = 1000) {
  const result = String(value || "").replace(/\s+/g, " ").trim();
  if (!result) fail(`${name} is required`);
  if (result.length > max) fail(`${name} exceeds ${max} characters`);
  return result;
}
function secureUrl(value, name) {
  const result = text(value, name, 2000);
  let parsed;
  try { parsed = new URL(result); } catch { fail(`${name} must be a valid URL`); }
  if (parsed.protocol !== "https:") fail(`${name} must use HTTPS`);
  if (parsed.username || parsed.password) fail(`${name} must not contain credentials`);
  return parsed.toString();
}
function isoPast(value, name, now = new Date()) {
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime())) fail(`${name} must be a valid date`);
  if (parsed.getTime() > now.getTime()) fail(`${name} cannot be in the future`);
  return parsed.toISOString();
}
function recent(value, name, now, maxDays = 30) {
  const result = isoPast(value, name, now);
  if (now.getTime() - new Date(result).getTime() > maxDays * 86400000) fail(`${name} is stale; review current terms again`, 409);
  return result;
}
function trueGate(input, name) { if (input?.[name] !== true) fail(`${name} must be explicitly confirmed`, 409); }
function safeCopy(value, name, max) {
  const result = text(value, name, max);
  if (DECEPTIVE.test(result)) fail(`${name} contains a deceptive or unsupported claim`, 409);
  return result;
}
function asRecord(value) { return value?.toObject ? value.toObject() : (value || {}); }
function exactHash(value, expected, name) {
  if (!/^[a-f0-9]{64}$/.test(String(value || "")) || value !== expected) fail(`${name} is not bound to the current approved artifact`, 409);
}

function buildVerifiedOffer(input = {}, now = new Date()) {
  const provider = text(input.provider, "provider", 120);
  const externalOfferId = text(input.externalOfferId, "externalOfferId", 200);
  const title = text(input.title, "title", 300);
  const seller = text(input.seller, "seller", 300);
  const category = text(input.category, "category", 120);
  if (PROHIBITED.test(`${title} ${category}`)) fail("Age-restricted or prohibited offer category is blocked", 409);
  ["sourceReviewed", "promotionalRulesReviewed", "sellerPromotionAllowedConfirmed", "authorizedEligibleOperatorConfirmed", "currentPlatformTermsReviewed", "regionalEligibilityConfirmed", "trackingLinkOwnedByAuthorizedOperator", "noCredentialsStored"].forEach((gate) => trueGate(input, gate));
  const sourceVerifiedAt = recent(input.sourceVerifiedAt, "sourceVerifiedAt", now);
  const commissionType = String(input.commissionType || "percentage").trim().toLowerCase();
  if (!["percentage", "fixed"].includes(commissionType)) fail("commissionType must be percentage or fixed");
  const commissionValue = Number(input.commissionValue);
  if (!Number.isFinite(commissionValue) || commissionValue <= 0 || (commissionType === "percentage" && commissionValue > 100)) fail("commissionValue is invalid");
  const offerPayload = {
    provider, externalOfferId, title, seller, category,
    officialOfferUrl: secureUrl(input.officialOfferUrl, "officialOfferUrl"),
    affiliateTrackingUrl: secureUrl(input.affiliateTrackingUrl, "affiliateTrackingUrl"),
    currentTermsUrl: secureUrl(input.currentTermsUrl, "currentTermsUrl"),
    promotionalRulesUrl: secureUrl(input.promotionalRulesUrl, "promotionalRulesUrl"),
    commission: { type: commissionType, value: commissionValue, currency: String(input.currency || "USD").trim().toUpperCase() },
    sourceVerifiedAt,
    verifiedAt: now.toISOString(),
    confirmations: {
      sourceReviewed: true, promotionalRulesReviewed: true, sellerPromotionAllowedConfirmed: true,
      authorizedEligibleOperatorConfirmed: true, currentPlatformTermsReviewed: true,
      regionalEligibilityConfirmed: true, trackingLinkOwnedByAuthorizedOperator: true, noCredentialsStored: true
    }
  };
  if (!/^[A-Z]{3}$/.test(offerPayload.commission.currency)) fail("currency must be a three-letter code");
  const offerHash = hash(offerPayload);
  return {
    provider, externalOfferId, caseKey: hash({ provider: provider.toLowerCase(), externalOfferId }), status: "offer_verified",
    offer: { ...offerPayload, offerHash },
    governance: {
      vendorNeutral: true, externalPublishingPerformed: false, fakeClicksAllowed: false,
      selfReferralAllowed: false, credentialsStored: false, affiliateDisclosureRequired: true,
      currentTermsRequired: true, eligibleAuthorizedOperatorRequired: true,
      commissionIsNotCashReceived: true, earningsClaimAllowedOnlyAfterVerifiedPayment: true
    }
  };
}

function buildCampaignDraft(caseInput, input = {}, now = new Date()) {
  const record = asRecord(caseInput);
  if (record.status !== "offer_verified") fail("A verified offer is required before campaign drafting", 409);
  const channel = String(input.channel || "owned_website").trim().toLowerCase();
  if (!CHANNELS.includes(channel)) fail(`channel must be one of: ${CHANNELS.join(", ")}`);
  trueGate(input, "channelRulesReviewed");
  if (channel === "opt_in_email") trueGate(input, "audienceOptInConfirmed");
  const disclosure = safeCopy(input.disclosure, "disclosure", 500);
  if (!/affiliate|commission|earn/i.test(disclosure)) fail("disclosure must clearly state the affiliate relationship", 409);
  const campaignPayload = {
    offerHash: record.offer.offerHash,
    channel,
    audience: safeCopy(input.audience, "audience", 500),
    headline: safeCopy(input.headline, "headline", 300),
    body: safeCopy(input.body, "body", 4000),
    callToAction: safeCopy(input.callToAction, "callToAction", 300),
    disclosure,
    trackingUrl: record.offer.affiliateTrackingUrl,
    preparedAt: now.toISOString(),
    governance: { internalDraftOnly: true, autoPublish: false, fakeTraffic: false, paidAdsApproved: false, founderApprovalRequired: true }
  };
  if (PROHIBITED.test(`${campaignPayload.headline} ${campaignPayload.body}`)) fail("Campaign promotes a prohibited category", 409);
  return { campaign: { ...campaignPayload, campaignHash: hash(campaignPayload) }, status: "campaign_drafted" };
}

function buildApprovedHandoff(caseInput, input = {}, now = new Date()) {
  const record = asRecord(caseInput);
  if (record.status !== "campaign_drafted") fail("A campaign draft is required before handoff", 409);
  exactHash(input.campaignHash, record.campaign?.campaignHash, "campaignHash");
  ["campaignReviewed", "offerRulesRechecked", "authorizedEligibleOperatorConfirmed", "channelAccountAuthorized", "disclosureVisibleConfirmed", "noMisrepresentationConfirmed", "noSpamOrFakeTrafficConfirmed"].forEach((gate) => trueGate(input, gate));
  const approvedAt = now.toISOString();
  const approvalPayload = { campaignHash: record.campaign.campaignHash, decision: "approved_for_manual_publish", approvedBy: "founder", approvedAt };
  const founderApproval = { ...approvalPayload, decisionHash: hash(approvalPayload) };
  const handoffPayload = {
    campaignHash: record.campaign.campaignHash,
    decisionHash: founderApproval.decisionHash,
    destination: secureUrl(input.destination, "destination"),
    preparedAt: approvedAt,
    governance: { manualPublishOnly: true, externalPublishingPerformed: false, exactArtifactBound: true, credentialsIncluded: false }
  };
  return { founderApproval, handoff: { ...handoffPayload, handoffHash: hash(handoffPayload) }, status: "handoff_ready" };
}

function buildPublicationReceipt(caseInput, input = {}, now = new Date()) {
  const record = asRecord(caseInput);
  if (record.status !== "handoff_ready") fail("An approved handoff is required", 409);
  exactHash(input.handoffHash, record.handoff?.handoffHash, "handoffHash");
  ["publicationActuallyCompleted", "sameApprovedCampaign", "platformRulesFollowed", "authorizedEligibleOperatorUsed", "disclosureVisible", "noAutomationOrSpam"].forEach((gate) => trueGate(input, gate));
  const payload = {
    handoffHash: record.handoff.handoffHash,
    channel: record.campaign.channel,
    publicUrl: secureUrl(input.publicUrl, "publicUrl"),
    providerReference: text(input.providerReference, "providerReference", 500),
    evidence: text(input.evidence, "evidence", 2000),
    publishedAt: isoPast(input.publishedAt, "publishedAt", now),
    recordedAt: now.toISOString()
  };
  return { publication: { ...payload, publicationHash: hash(payload) }, status: "published" };
}

function buildConversionReceipt(caseInput, input = {}, now = new Date()) {
  const record = asRecord(caseInput);
  if (record.status !== "published") fail("A genuine publication receipt is required before conversion attribution", 409);
  exactHash(input.publicationHash, record.publication?.publicationHash, "publicationHash");
  ["providerReportReviewed", "conversionActuallyOccurred", "notSelfReferral", "notFakeOrIncentivizedTraffic", "trackingMatchesCampaign"].forEach((gate) => trueGate(input, gate));
  const payload = {
    publicationHash: record.publication.publicationHash,
    providerTransactionId: text(input.providerTransactionId, "providerTransactionId", 500),
    trackingId: text(input.trackingId, "trackingId", 500),
    evidence: text(input.evidence, "evidence", 2000),
    convertedAt: isoPast(input.convertedAt, "convertedAt", now),
    recordedAt: now.toISOString(),
    governance: { commissionVerified: false, paymentReceived: false, revenueRecorded: false }
  };
  return { conversion: { ...payload, conversionHash: hash(payload) }, status: "conversion_recorded" };
}

function buildCommissionVerification(caseInput, input = {}, now = new Date()) {
  const record = asRecord(caseInput);
  if (record.status !== "conversion_recorded") fail("A provider-attributed conversion is required", 409);
  exactHash(input.conversionHash, record.conversion?.conversionHash, "conversionHash");
  ["providerCommissionReportReviewed", "transactionMatchesConversion", "amountConfirmedByProvider"].forEach((gate) => trueGate(input, gate));
  const amount = Number(input.amount);
  const currency = String(input.currency || "").trim().toUpperCase();
  if (!Number.isFinite(amount) || amount <= 0 || amount > 1_000_000_000) fail("amount must be a positive finite value");
  if (!/^[A-Z]{3}$/.test(currency)) fail("currency must be a three-letter code");
  const payoutStatus = String(input.payoutStatus || "payable").trim().toLowerCase();
  if (!["pending", "payable", "paid"].includes(payoutStatus)) fail("payoutStatus must be pending, payable, or paid");
  const payload = {
    conversionHash: record.conversion.conversionHash, amount, currency, payoutStatus,
    providerCommissionId: text(input.providerCommissionId, "providerCommissionId", 500),
    evidence: text(input.evidence, "evidence", 2000),
    verifiedAt: now.toISOString(),
    governance: { genuineCommissionConfirmed: true, paymentReceived: false, cashEarningClaimAllowed: false }
  };
  return { commission: { ...payload, commissionHash: hash(payload) }, status: "commission_verified" };
}

function buildPaymentReceipt(caseInput, input = {}, now = new Date()) {
  const record = asRecord(caseInput);
  if (record.status !== "commission_verified") fail("A verified commission is required before payment recording", 409);
  exactHash(input.commissionHash, record.commission?.commissionHash, "commissionHash");
  ["paymentActuallyReceived", "providerPayoutReportReviewed", "amountAndCurrencyMatch", "destinationAccountOwnedByAuthorizedOperator"].forEach((gate) => trueGate(input, gate));
  const amount = Number(input.amount);
  const currency = String(input.currency || "").trim().toUpperCase();
  if (amount !== Number(record.commission.amount) || currency !== record.commission.currency) fail("Received payment must match the verified commission", 409);
  const payload = {
    commissionHash: record.commission.commissionHash, amount, currency,
    providerPayoutId: text(input.providerPayoutId, "providerPayoutId", 500),
    receiptReference: text(input.receiptReference, "receiptReference", 1000),
    evidence: text(input.evidence, "evidence", 2000),
    receivedAt: isoPast(input.receivedAt, "receivedAt", now),
    verifiedAt: now.toISOString(),
    governance: { paymentReceived: true, verifiedRealEarning: true, settlementHandoffReady: true }
  };
  return { payment: { ...payload, paymentHash: hash(payload) }, status: "payment_received" };
}

async function appendEvent(caseId, eventType, payload, occurredAt = new Date()) {
  const { AffiliateConversionEvent } = require("../models/AffiliateConversionEvent");
  const previous = await AffiliateConversionEvent.findOne({ caseId }).sort({ occurredAt: -1, _id: -1 });
  const payloadHash = hash(payload);
  const previousEventHash = previous?.eventHash || null;
  const eventHash = hash({ caseId: String(caseId), eventType, payloadHash, previousEventHash, occurredAt: occurredAt.toISOString() });
  return AffiliateConversionEvent.create({ caseId, eventType, payloadHash, previousEventHash, eventHash, occurredAt });
}
async function createOffer(input, now = new Date()) {
  const { AffiliateConversionCase } = require("../models/AffiliateConversionCase");
  const record = await AffiliateConversionCase.create(buildVerifiedOffer(input, now));
  await appendEvent(record._id, "offer_verified", record.offer, now);
  return record;
}
async function transition(id, builder, eventType, input, now = new Date()) {
  const { AffiliateConversionCase } = require("../models/AffiliateConversionCase");
  const record = await AffiliateConversionCase.findById(id);
  if (!record) fail("Affiliate conversion case not found", 404);
  const update = builder(record, input, now);
  Object.assign(record, update);
  await record.save();
  await appendEvent(record._id, eventType, update, now);
  return record;
}
async function listCases() { const { AffiliateConversionCase } = require("../models/AffiliateConversionCase"); return AffiliateConversionCase.find().sort({ updatedAt: -1 }); }
async function getCase(id) { const { AffiliateConversionCase } = require("../models/AffiliateConversionCase"); const record = await AffiliateConversionCase.findById(id); if (!record) fail("Affiliate conversion case not found", 404); return record; }
async function listEvents(id) { const { AffiliateConversionEvent } = require("../models/AffiliateConversionEvent"); return AffiliateConversionEvent.find({ caseId: id }).sort({ occurredAt: 1, _id: 1 }); }
async function status() {
  const { AffiliateConversionCase } = require("../models/AffiliateConversionCase");
  const rows = await AffiliateConversionCase.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]);
  const counts = Object.fromEntries(rows.map((row) => [row._id, row.count]));
  return { counts, verifiedOffers: counts.offer_verified || 0, campaignsPublished: (counts.published || 0) + (counts.conversion_recorded || 0) + (counts.commission_verified || 0) + (counts.payment_received || 0), genuineConversions: (counts.conversion_recorded || 0) + (counts.commission_verified || 0) + (counts.payment_received || 0), verifiedCommissions: (counts.commission_verified || 0) + (counts.payment_received || 0), verifiedPaymentsReceived: counts.payment_received || 0 };
}

module.exports = {
  CHANNELS, buildVerifiedOffer, buildCampaignDraft, buildApprovedHandoff, buildPublicationReceipt,
  buildConversionReceipt, buildCommissionVerification, buildPaymentReceipt,
  createOffer, listCases, getCase, listEvents, status,
  draftCampaign: (id, input, now) => transition(id, buildCampaignDraft, "campaign_drafted", input, now),
  approveHandoff: (id, input, now) => transition(id, buildApprovedHandoff, "handoff_approved", input, now),
  recordPublication: (id, input, now) => transition(id, buildPublicationReceipt, "publication_recorded", input, now),
  recordConversion: (id, input, now) => transition(id, buildConversionReceipt, "conversion_recorded", input, now),
  verifyCommission: (id, input, now) => transition(id, buildCommissionVerification, "commission_verified", input, now),
  recordPayment: (id, input, now) => transition(id, buildPaymentReceipt, "payment_received", input, now)
};
