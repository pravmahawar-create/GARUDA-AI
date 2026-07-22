const assert = require("assert");
const { assertVerifiedEngagement } = require("./revenueExternalActionService");
assert.throws(() => assertVerifiedEngagement({ opportunity: { source: "remotive", url: "https://example.com/job" } }), /discovered listing/);
assert.doesNotThrow(() => assertVerifiedEngagement({ opportunity: { engagementVerification: { verified: true, reference: "contract-001" } } }));
console.log("External action truth gate blocks listings and accepts verified engagements.");
