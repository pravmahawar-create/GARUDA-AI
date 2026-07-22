const assert = require("assert");
const { assertVerifiedEngagement } = require("./revenueExternalActionService");
const truthHash = "f".repeat(64);
assert.throws(() => assertVerifiedEngagement({ opportunity: { source: "remotive", url: "https://example.com/job" } }), /discovered listing/);
assert.throws(() => assertVerifiedEngagement({ opportunity: { engagementVerification: { verified: true, reference: "contract-001" } } }), /discovered listing/);
assert.doesNotThrow(() => assertVerifiedEngagement({ realWorkIntake: { truthHash, workAuthorizationConfirmed: true, listingClassification: "public_listing_not_contract" }, opportunity: { engagementVerification: { verified: true, reference: "contract-001", workAuthorizationConfirmed: true, termsAcceptedByClient: true, truthHash } } }));
console.log("External action truth gate blocks listings and accepts verified engagements.");
