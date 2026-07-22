const assert = require("assert"); const service = require("./revenueConnectorRegistryService");
const request = { status: "handoff_ready", actionType: "delivery", requestKey: "r", evidenceHash: "e", latestDecisionHash: "d", destination: "sandbox", handoffPackage: { packageHash: "p" } };
const validation = service.validateDispatch(request, { connectorId: "sandbox_handoff", dryRun: true });
assert.strictEqual(validation.mode, "dry_run"); const receipt = service.buildReceipt(validation, null, new Date("2026-01-01"));
assert.strictEqual(receipt.status, "validated"); assert.strictEqual(receipt.governance.externalSideEffectPerformed, false); assert.ok(receipt.receiptHash);
assert.throws(() => service.validateDispatch(request, { connectorId: "sandbox_handoff", dryRun: false }), /dry-run/);
assert.throws(() => service.validateDispatch({ ...request, status: "pending_founder" }, { connectorId: "sandbox_handoff" }), /approved/);
assert.throws(() => service.validateDispatch({ ...request, actionType: "payment_verification" }, { connectorId: "sandbox_handoff" }), /does not support/);
console.log("Governed connector registry, idempotency, dry-run, and receipt validation passed.");
