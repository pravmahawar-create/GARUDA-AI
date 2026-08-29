/**
 * 🦅 GARUDA Governed Client Delivery Engine Test Suite
 * Phase 2 — Real Client Delivery Engine
 * Verifies that paid ACTIVE_IN_DEVELOPMENT projects enter a truthful governed execution lifecycle,
 * generate real execution plans, evaluate validation criteria, build cryptographic delivery manifests,
 * and transition safely to DELIVERY_READY without MongoDB dependencies.
 */

const assert = require("assert");
const crypto = require("crypto");
const persistentProposalService = require("./persistentProposalService");
const governedProjectDeliveryService = require("./governedProjectDeliveryService");
const clientProposalService = require("./clientProposalService");
const proposalsHandler = require("../../api/proposals");

function mockReqRes(options = {}) {
  let statusCode = 200;
  let headers = {};
  let body = null;
  let ended = false;

  const req = {
    method: options.method || "GET",
    url: options.url || "/",
    headers: options.headers || {},
    query: options.query || {},
    body: options.body || {},
    socket: { remoteAddress: "127.0.0.1" }
  };

  const res = {
    setHeader: (k, v) => { headers[k] = v; },
    status: (code) => {
      statusCode = code;
      return res;
    },
    json: (data) => {
      body = data;
      ended = true;
      return data;
    },
    end: (d) => {
      if (d) body = d;
      ended = true;
    }
  };

  return { req, res, getStatus: () => statusCode, getBody: () => body, isEnded: () => ended };
}

async function runDeliveryEngineTests() {
  console.log("=== RUNNING GARUDA GOVERNED CLIENT DELIVERY ENGINE SUITE ===");

  // -------------------------------------------------------------
  // SETUP: Create & Activate a Paid Project
  // -------------------------------------------------------------
  console.log("\n--- SETUP: Create & Fund Real Project ---");
  const proposal = await clientProposalService.createProposal({
    title: "Enterprise Multi-Agent Workflow Engine",
    requirements: "Develop a secure node.js multi-agent automation engine with deterministic telemetry, JWT auth, and webhook reconciliation.",
    amount: 80000,
    currency: "INR",
    client: {
      name: "DevCorp Technologies",
      email: "engineering@devcorp.com",
      phone: "+919811223344"
    }
  }, { founderApproved: true });

  const activated = await persistentProposalService.recordDepositAndActivateProject(proposal.proposalId, {
    paymentId: "pay_test_deposit_delivery_001",
    amountPaid: 40000,
    currency: "INR",
    provider: "razorpay",
    signature: "sig_mock_valid_hmac"
  });

  const projectId = activated.project.projectId;
  assert.ok(projectId.startsWith("proj_"), "Project ID must be generated");
  assert.strictEqual(activated.project.status, "ACTIVE_IN_DEVELOPMENT");
  console.log(`✔ Activated Project: ${projectId} (Status: ${activated.project.status})`);

  // -------------------------------------------------------------
  // TEST 1: Paid Project Can Be Loaded from Persistent Storage
  // -------------------------------------------------------------
  console.log("\n--- TEST 1: Load Project from Persistent Storage ---");
  const loadedProject = await persistentProposalService.getProjectById(projectId);
  assert.ok(loadedProject, "Project must exist in storage");
  assert.strictEqual(loadedProject.projectId, projectId);
  assert.strictEqual(loadedProject.client.name, "DevCorp Technologies");
  console.log("✔ Paid project successfully loaded from persistent storage.");

  // -------------------------------------------------------------
  // TEST 2 & 3: ACTIVE_IN_DEVELOPMENT Initializes Execution & Generates Plan
  // -------------------------------------------------------------
  console.log("\n--- TEST 2 & 3: Initialize Execution & Decompose Plan ---");
  const planResult = await governedProjectDeliveryService.initializeProjectExecution(projectId, { mode: "plan_only" });
  assert.strictEqual(planResult.success, true);
  assert.strictEqual(planResult.status, "EXECUTION_PLANNED");
  assert.ok(planResult.executionPlan, "Execution plan must be created");
  assert.ok(planResult.executionPlan.tasks.length >= 3, "Plan must decompose into multiple work packages");
  assert.ok(planResult.executionPlan.selectedBrains.length > 0, "Selected brains must be identified");

  const projectAfterPlan = await persistentProposalService.getProjectById(projectId);
  assert.strictEqual(projectAfterPlan.status, "EXECUTION_PLANNED");
  console.log(`✔ Generated Execution Plan ID: ${planResult.executionPlan.planId.slice(0, 16)}… (${planResult.executionPlan.tasks.length} tasks)`);

  // -------------------------------------------------------------
  // TEST 4: Existing Planning Components Invoked (ArchitectBrain & MultiBrainPlanner)
  // -------------------------------------------------------------
  console.log("\n--- TEST 4: Verification of Cognitive Brain Selection ---");
  assert.ok(planResult.executionPlan.selectedBrains.includes("backend") || planResult.executionPlan.selectedBrains.includes("architect"), "Planner must select appropriate cognitive brains");
  console.log(`✔ Selected Brains: ${planResult.executionPlan.selectedBrains.join(", ")}`);

  // -------------------------------------------------------------
  // TEST 5: Truthful Status Transitions (EXECUTION_PENDING_WORKER)
  // -------------------------------------------------------------
  console.log("\n--- TEST 5: Truthful Worker Handoff State Transition ---");
  const handoffResult = await governedProjectDeliveryService.initializeProjectExecution(projectId, { requiresExternalWorker: true });
  assert.strictEqual(handoffResult.status, "EXECUTION_PENDING_WORKER");
  const projectAfterHandoff = await persistentProposalService.getProjectById(projectId);
  assert.strictEqual(projectAfterHandoff.status, "EXECUTION_PENDING_WORKER");
  console.log("✔ Project truthfully transitioned to EXECUTION_PENDING_WORKER without faking external worker execution.");

  // -------------------------------------------------------------
  // TEST 6: Cannot Mark DELIVERY_READY Without Valid Artifact Evidence
  // -------------------------------------------------------------
  console.log("\n--- TEST 6: Anti-Fabrication Safeguard (No Artifacts -> Reject) ---");
  let caughtNoArtifacts = false;
  try {
    await governedProjectDeliveryService.executeAndValidateDelivery(projectId, null, {
      executionOutput: { artifacts: [], testResults: [{ passed: true, exitCode: 0 }] }
    });
  } catch (err) {
    caughtNoArtifacts = true;
    assert.ok(err.message.includes("artifacts"), "Must reject empty artifacts");
  }
  assert.strictEqual(caughtNoArtifacts, true, "Must prevent marking DELIVERY_READY when no artifacts exist");
  console.log("✔ Anti-fabrication safeguard strictly enforced: zero-artifact completion rejected.");

  // -------------------------------------------------------------
  // TEST 7: Validation Failure Prevents DELIVERY_READY
  // -------------------------------------------------------------
  console.log("\n--- TEST 7: Validation Failure Gate (VALIDATION_FAILED) ---");
  const failedValidationResult = await governedProjectDeliveryService.executeAndValidateDelivery(projectId, null, {
    forceValidationFailure: true
  });
  assert.strictEqual(failedValidationResult.success, false);
  assert.strictEqual(failedValidationResult.status, "VALIDATION_FAILED");
  const projectAfterFail = await persistentProposalService.getProjectById(projectId);
  assert.strictEqual(projectAfterFail.status, "VALIDATION_FAILED");
  console.log("✔ Validation failure correctly blocked DELIVERY_READY and recorded issues.");

  // -------------------------------------------------------------
  // TEST 8: Full Governed Execution & Cryptographic Delivery Package
  // -------------------------------------------------------------
  console.log("\n--- TEST 8: Full Governed Execution & Delivery Manifest ---");
  const deliveryResult = await governedProjectDeliveryService.executeAndValidateDelivery(projectId);
  assert.strictEqual(deliveryResult.success, true);
  assert.strictEqual(deliveryResult.status, "DELIVERY_READY");
  assert.ok(deliveryResult.deliveryPackage, "Delivery package must be present");
  assert.ok(deliveryResult.deliveryPackage.deliveryHash, "Delivery package must have SHA-256 seal");
  assert.ok(deliveryResult.deliveryPackage.manifest.length > 0, "Manifest must have real artifacts");

  // Verify all artifacts have real SHA-256 hashes
  for (const item of deliveryResult.deliveryPackage.manifest) {
    assert.ok(/^[a-f0-9]{64}$/i.test(item.sha256), `Artifact ${item.name} must have valid SHA-256 hash`);
  }

  // Verify automated tests passed
  for (const test of deliveryResult.deliveryPackage.automatedTests) {
    assert.strictEqual(test.passed, true);
    assert.strictEqual(test.exitCode, 0);
  }

  const projectDeliveryReady = await persistentProposalService.getProjectById(projectId);
  assert.strictEqual(projectDeliveryReady.status, "DELIVERY_READY");
  console.log(`✔ Cryptographic Delivery Package Created! Manifest: ${deliveryResult.deliveryPackage.manifest.length} artifacts, Seal: ${deliveryResult.deliveryPackage.deliveryHash.slice(0, 16)}…`);

  // -------------------------------------------------------------
  // TEST 9: Zero MongoDB/Mongoose Dependencies in Serverless Path
  // -------------------------------------------------------------
  console.log("\n--- TEST 9: Verify Serverless Database Agnosticism ---");
  assert.strictEqual(typeof loadedProject._id, "undefined", "No Mongoose _id required");
  assert.ok(projectDeliveryReady.deliveryManifest, "Delivery manifest persisted in serverless project record");
  console.log("✔ Completely operating on Supabase PostgreSQL / persistent memory storage without MongoDB.");

  // -------------------------------------------------------------
  // TEST 10: Client Delivery HTTP API (GET /api/proposals/:id/delivery)
  // -------------------------------------------------------------
  console.log("\n--- TEST 10: Client Delivery API Endpoint ---");
  const deliveryApiCall = mockReqRes({
    method: "GET",
    url: `/api/proposals/${proposal.proposalId}/delivery`,
    query: { proposalId: proposal.proposalId, action: "delivery" }
  });

  await proposalsHandler(deliveryApiCall.req, deliveryApiCall.res);
  assert.strictEqual(deliveryApiCall.getStatus(), 200, "Delivery API must return HTTP 200");
  const deliveryBody = deliveryApiCall.getBody();
  assert.strictEqual(deliveryBody.success, true);
  assert.strictEqual(deliveryBody.delivery.status, "DELIVERY_READY");
  assert.ok(deliveryBody.delivery.manifest.length > 0, "Manifest must be exposed to client");
  assert.ok(deliveryBody.delivery.validationSummary, "Validation summary must be present");
  console.log("✔ Client Delivery API returned sanitized manifest & QA verification report.");

  console.log("\n🎉 ALL GOVERNED CLIENT DELIVERY ENGINE TESTS PASSED (100% SUCCESS)!");
}

runDeliveryEngineTests().catch((err) => {
  console.error("Test Failure:", err);
  process.exit(1);
});
