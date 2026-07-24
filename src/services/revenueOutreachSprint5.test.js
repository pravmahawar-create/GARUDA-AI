const assert = require("assert");
const { OutreachQueueManager, OUTREACH_STATES, CONNECTORS } = require("./revenueOutreachService");
const { getRevenueMetrics } = require("./revenueCommandCenterService");
const { executeRevenueTask } = require("../../scripts/mother/revenueEngine");

async function testSprint5OutreachEngine() {
  const manager = new OutreachQueueManager();

  const opp = {
    externalId: "opp-sprint5-001",
    company: "Enterprise Partner Client",
    url: "https://client-portal.example/opp/001"
  };

  const prop = {
    proposalHash: "prop-hash-sha256-001",
    summary: "Governed Node.js Microservice Proposal Package"
  };

  // 1. Queue Item Creation (State: draft)
  const item = manager.createOutreachItem(opp, prop, { channel: "client_portal" });
  assert.strictEqual(item.currentStatus, "draft");
  assert.strictEqual(item.opportunityId, "opp-sprint5-001");
  assert.strictEqual(item.proposalId, "prop-hash-sha256-001");
  assert.strictEqual(item.company, "Enterprise Partner Client");
  assert.strictEqual(item.contactChannel, "client_portal");
  assert.strictEqual(item.retryCount, 0);
  assert.strictEqual(item.founderAuthorization.authorized, false);

  // 2. Founder Authorization Gate Test (Must fail without Founder actor)
  assert.throws(() => {
    manager.authorizeOutreach(item.queueId, { founderAuthorized: false, actor: "agent" });
  }, /Explicit Founder authorization is strictly required/);

  // Unapproved dispatch attempt must fail
  assert.throws(() => {
    manager.enqueueOutreach(item.queueId);
  }, /Cannot queue outreach without Founder authorization/);

  // 3. Grant Founder Approval (State: approved)
  const approvedItem = manager.authorizeOutreach(item.queueId, { founderAuthorized: true, actor: "founder" });
  assert.strictEqual(approvedItem.currentStatus, "approved");
  assert.strictEqual(approvedItem.founderAuthorization.authorized, true);

  // 4. Enqueue Outreach (State: queued)
  const queuedItem = manager.enqueueOutreach(item.queueId);
  assert.strictEqual(queuedItem.currentStatus, "queued");

  // 5. Dispatch via Connector (State: queued -> sending -> sent)
  const dispatchResult = manager.dispatchOutreach(item.queueId, (outboundItem) => {
    assert.strictEqual(outboundItem.founderAuthorization.authorized, true);
    return { success: true, messageId: "portal-msg-9901" };
  });

  assert.strictEqual(dispatchResult.success, true);
  assert.strictEqual(item.currentStatus, "sent");

  // 6. Client Response & CRM Update (State: sent -> meeting_requested)
  const responsePayload = {
    responseType: "meeting_requested",
    body: "We reviewed the proposal and would like to schedule a technical alignment call."
  };

  const updatedItem = manager.recordClientResponse(item.queueId, responsePayload);
  assert.strictEqual(updatedItem.currentStatus, "meeting_requested");
  assert.strictEqual(updatedItem.conversationHistory.length, 1);
  assert.strictEqual(updatedItem.conversationHistory[0].sender, "client");

  // 7. Validate Revenue Command Center Dashboard Integration
  const metricsResult = await getRevenueMetrics({ queueManager: manager });
  assert.ok(metricsResult.metrics.outreach);
  assert.strictEqual(metricsResult.metrics.outreach.meetingsRequested, 1);
  assert.strictEqual(metricsResult.metrics.outreach.dealsProgressing, 1);

  // 8. Validate Mother Brain Task Execution
  const motherResult = await executeRevenueTask("Execute revenue outreach queue and dispatch status", { queueManager: manager });
  assert.strictEqual(motherResult.success, true);
  assert.strictEqual(motherResult.output.taskType, "revenue_outreach_execution");
  assert.strictEqual(motherResult.output.outreachEngine.status, "OUTREACH_ENGINE_READY");
  assert.strictEqual(motherResult.output.outreachEngine.governance.founderAuthorizationStrictlyEnforced, true);

  console.log("Sprint 5 Outreach Execution Engine validation passed.");
}

testSprint5OutreachEngine().catch((err) => {
  console.error("Sprint 5 validation failed:", err);
  process.exit(1);
});
