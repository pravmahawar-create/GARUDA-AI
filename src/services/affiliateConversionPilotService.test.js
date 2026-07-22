const assert = require("assert");
const service = require("./affiliateConversionPilotService");

const now = new Date("2026-07-22T16:45:00.000Z");
const offerInput = {
  provider: "Example affiliate marketplace",
  externalOfferId: "offer-123",
  title: "Productivity course",
  seller: "Example Seller",
  category: "education",
  officialOfferUrl: "https://example.com/marketplace/offer-123",
  affiliateTrackingUrl: "https://example.com/track/authorized-id",
  currentTermsUrl: "https://example.com/terms",
  promotionalRulesUrl: "https://example.com/promotion-rules",
  commissionType: "percentage",
  commissionValue: 25,
  currency: "USD",
  sourceVerifiedAt: "2026-07-22T15:00:00.000Z",
  sourceReviewed: true,
  promotionalRulesReviewed: true,
  sellerPromotionAllowedConfirmed: true,
  authorizedEligibleOperatorConfirmed: true,
  currentPlatformTermsReviewed: true,
  regionalEligibilityConfirmed: true,
  trackingLinkOwnedByAuthorizedOperator: true,
  noCredentialsStored: true
};

const offer = service.buildVerifiedOffer(offerInput, now);
assert.equal(offer.status, "offer_verified");
assert.equal(offer.governance.externalPublishingPerformed, false);
assert.equal(offer.governance.earningsClaimAllowedOnlyAfterVerifiedPayment, true);

const drafted = { ...offer, ...service.buildCampaignDraft(offer, {
  channel: "owned_website",
  channelRulesReviewed: true,
  audience: "Readers looking for an organized learning workflow",
  headline: "A practical productivity course to review",
  body: "Review the official course information and decide whether its documented lessons match your needs.",
  callToAction: "Review the official offer",
  disclosure: "Affiliate disclosure: an authorized operator may earn a commission from a qualifying purchase."
}, now) };
assert.equal(drafted.status, "campaign_drafted");
assert.equal(drafted.campaign.governance.autoPublish, false);

const handoffUpdate = service.buildApprovedHandoff(drafted, {
  campaignHash: drafted.campaign.campaignHash,
  campaignReviewed: true,
  offerRulesRechecked: true,
  authorizedEligibleOperatorConfirmed: true,
  channelAccountAuthorized: true,
  disclosureVisibleConfirmed: true,
  noMisrepresentationConfirmed: true,
  noSpamOrFakeTrafficConfirmed: true,
  destination: "https://publisher.example.com/editor/campaign-123"
}, now);
const ready = { ...drafted, ...handoffUpdate };
assert.equal(ready.status, "handoff_ready");

const publishedUpdate = service.buildPublicationReceipt(ready, {
  handoffHash: ready.handoff.handoffHash,
  publicationActuallyCompleted: true,
  sameApprovedCampaign: true,
  platformRulesFollowed: true,
  authorizedEligibleOperatorUsed: true,
  disclosureVisible: true,
  noAutomationOrSpam: true,
  publicUrl: "https://publisher.example.com/productivity-course-review",
  providerReference: "post-123",
  evidence: "Authorized operator publication receipt",
  publishedAt: "2026-07-22T16:00:00.000Z"
}, now);
const published = { ...ready, ...publishedUpdate };
assert.equal(published.status, "published");

const conversionUpdate = service.buildConversionReceipt(published, {
  publicationHash: published.publication.publicationHash,
  providerReportReviewed: true,
  conversionActuallyOccurred: true,
  notSelfReferral: true,
  notFakeOrIncentivizedTraffic: true,
  trackingMatchesCampaign: true,
  providerTransactionId: "txn-real-001",
  trackingId: "campaign-123",
  evidence: "Marketplace transaction report reference",
  convertedAt: "2026-07-22T16:15:00.000Z"
}, now);
const converted = { ...published, ...conversionUpdate };
assert.equal(converted.conversion.governance.revenueRecorded, false);

const commissionUpdate = service.buildCommissionVerification(converted, {
  conversionHash: converted.conversion.conversionHash,
  providerCommissionReportReviewed: true,
  transactionMatchesConversion: true,
  amountConfirmedByProvider: true,
  amount: 25,
  currency: "USD",
  payoutStatus: "payable",
  providerCommissionId: "commission-001",
  evidence: "Provider commission statement reference"
}, now);
const commissioned = { ...converted, ...commissionUpdate };
assert.equal(commissioned.status, "commission_verified");
assert.equal(commissioned.commission.governance.cashEarningClaimAllowed, false);

const paymentUpdate = service.buildPaymentReceipt(commissioned, {
  commissionHash: commissioned.commission.commissionHash,
  paymentActuallyReceived: true,
  providerPayoutReportReviewed: true,
  amountAndCurrencyMatch: true,
  destinationAccountOwnedByAuthorizedOperator: true,
  amount: 25,
  currency: "USD",
  providerPayoutId: "payout-001",
  receiptReference: "bank-receipt-001",
  evidence: "Provider payout and destination receipt matched",
  receivedAt: "2026-07-22T16:30:00.000Z"
}, now);
assert.equal(paymentUpdate.status, "payment_received");
assert.equal(paymentUpdate.payment.governance.verifiedRealEarning, true);

assert.throws(() => service.buildVerifiedOffer({ ...offerInput, category: "gambling" }, now), /prohibited/i);
assert.throws(() => service.buildVerifiedOffer({ ...offerInput, authorizedEligibleOperatorConfirmed: false }, now), /explicitly confirmed/i);
assert.throws(() => service.buildCampaignDraft(offer, { channel: "owned_website", channelRulesReviewed: true, audience: "Readers", headline: "Guaranteed income", body: "Review it", callToAction: "Open", disclosure: "Affiliate commission disclosure" }, now), /deceptive/i);
assert.throws(() => service.buildCampaignDraft(offer, { channel: "owned_website", channelRulesReviewed: true, audience: "Readers", headline: "Review", body: "Review it", callToAction: "Open", disclosure: "Partner link" }, now), /clearly state/i);
assert.throws(() => service.buildPaymentReceipt(commissioned, { commissionHash: commissioned.commission.commissionHash, paymentActuallyReceived: true, providerPayoutReportReviewed: true, amountAndCurrencyMatch: true, destinationAccountOwnedByAuthorizedOperator: true, amount: 24, currency: "USD", providerPayoutId: "x", receiptReference: "x", evidence: "x", receivedAt: now.toISOString() }, now), /must match/i);

console.log("Affiliate real conversion truth-chain test passed.");
