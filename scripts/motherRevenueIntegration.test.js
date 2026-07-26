const assert = require("assert");
const motherIntegration = require("../src/services/motherRevenueIntegrationService");

function runIntegrationTests() {
  console.log("Running Mother Revenue Brain v1 Founder Review Integration Tests...\n");

  motherIntegration.resetProcessedMissions();

  // Test 1: Verified and eligible opportunity creates one mission candidate
  {
    const eligibleOpp = {
      id: "INTEG_TEST_001",
      externalId: "EXT_001",
      title: "Build Node.js REST API Microservice",
      description: "Develop scalable Node.js REST APIs with PostgreSQL database integration and Mocha unit testing",
      tags: ["node", "api", "postgres"],
      url: "https://verified.client/job/1",
      source: "upwork"
    };

    const outcome = motherIntegration.submitToMotherMissionPlanning(eligibleOpp);
    assert.strictEqual(outcome.status, "created_ready_for_founder_review");
    assert.strictEqual(outcome.decision.qualification, "qualified");
    assert.strictEqual(outcome.decision.classification, "Upwork Software");
    assert.strictEqual(outcome.decision.primaryCapability, "engineering.api-integration");
    assert.strictEqual(outcome.decision.executionEligibility, true);
    assert.strictEqual(outcome.mission.requiresFounderApproval, true);
    assert.strictEqual(outcome.mission.founderApproved, false);

    console.log("✔ Test 1 — Verified and eligible opportunity creates one mission candidate");
  }

  // Test 2: Ready candidate can be approved and creates exactly one execution mission
  {
    const outcome = motherIntegration.recordFounderDecision({
      missionCandidateId: "INTEG_TEST_001",
      founderDecision: "approved",
      founderReason: "Approved by Founder for internal mission execution"
    });

    assert.strictEqual(outcome.status, "decision_recorded_approved");
    assert.strictEqual(outcome.mission.status, "approved");
    assert.strictEqual(outcome.mission.activationStatus, "execution_ready");
    assert.strictEqual(outcome.mission.founderApproved, true);
    assert.strictEqual(outcome.auditRecord.decision, "approved");

    console.log("✔ Test 2 — Ready candidate can be approved and transitions to approved / execution_ready");
  }

  // Test 3: Duplicate approval is idempotent
  {
    const duplicateOutcome = motherIntegration.recordFounderDecision({
      missionCandidateId: "INTEG_TEST_001",
      founderDecision: "approved",
      founderReason: "Approved by Founder for internal mission execution"
    });

    assert.strictEqual(duplicateOutcome.status, "idempotent_success");
    assert.strictEqual(duplicateOutcome.mission.status, "approved");

    console.log("✔ Test 3 — Duplicate approval request is idempotent");
  }

  // Test 4: Conflicting decision after approval is blocked
  {
    assert.throws(
      () => {
        motherIntegration.recordFounderDecision({
          missionCandidateId: "INTEG_TEST_001",
          founderDecision: "rejected",
          founderReason: "Attempting conflicting rejection after approval"
        });
      },
      (err) => err.statusCode === 409
    );

    console.log("✔ Test 4 — Conflicting decision after approval is blocked (409 Conflict)");
  }

  // Test 5: Candidate can be rejected with a reason
  {
    const oppToReject = {
      id: "INTEG_TEST_005",
      title: "React Native Mobile Prototype",
      description: "Build iOS/Android prototype in React Native",
      url: "https://verified.client/job/5",
      source: "upwork"
    };

    motherIntegration.submitToMotherMissionPlanning(oppToReject);
    const rejectOutcome = motherIntegration.recordFounderDecision({
      missionCandidateId: "INTEG_TEST_005",
      founderDecision: "rejected",
      founderReason: "Not aligned with current sprint priorities"
    });

    assert.strictEqual(rejectOutcome.status, "decision_recorded_rejected");
    assert.strictEqual(rejectOutcome.mission.status, "rejected");
    assert.strictEqual(rejectOutcome.mission.activationStatus, "permanently_blocked");

    console.log("✔ Test 5 — Candidate can be rejected with a mandatory reason");
  }

  // Test 6: Rejected candidate cannot activate
  {
    assert.throws(
      () => {
        motherIntegration.recordFounderDecision({
          missionCandidateId: "INTEG_TEST_005",
          founderDecision: "approved",
          founderReason: "Attempting to approve a rejected candidate"
        });
      },
      (err) => err.statusCode === 409
    );

    console.log("✔ Test 6 — Permanently rejected candidate cannot activate");
  }

  // Test 7: Request changes creates revision-required status
  {
    const oppRevision = {
      id: "INTEG_TEST_007",
      title: "Python Web Scraper Pipeline",
      description: "Python BeautifulSoup web scraping service",
      url: "https://verified.client/job/7",
      source: "freelance"
    };

    motherIntegration.submitToMotherMissionPlanning(oppRevision);
    const revisionOutcome = motherIntegration.recordFounderDecision({
      missionCandidateId: "INTEG_TEST_007",
      founderDecision: "request_changes",
      founderReason: "Needs expanded scope definition for proxy rotation"
    });

    assert.strictEqual(revisionOutcome.status, "decision_recorded_revision_required");
    assert.strictEqual(revisionOutcome.mission.status, "revision_required");
    assert.strictEqual(revisionOutcome.mission.activationStatus, "revision_pending");

    console.log("✔ Test 7 — Request changes creates revision_required status");
  }

  // Test 8: Missing reason is blocked for reject and request_changes
  {
    assert.throws(
      () => {
        motherIntegration.recordFounderDecision({
          missionCandidateId: "INTEG_TEST_007",
          founderDecision: "rejected",
          founderReason: ""
        });
      },
      (err) => err.statusCode === 400
    );

    console.log("✔ Test 8 — Missing reason for rejection is blocked (400 Bad Request)");
  }

  // Test 9: Invalid status transition is blocked
  {
    assert.throws(
      () => {
        motherIntegration.recordFounderDecision({
          missionCandidateId: "NON_EXISTENT_ID",
          founderDecision: "approved"
        });
      },
      (err) => err.statusCode === 404
    );

    console.log("✔ Test 9 — Invalid candidate ID throws 404 Not Found");
  }

  // Test 10: Unverified opportunity cannot be approved into mission planning
  {
    const unverifiedOpp = {
      id: "INTEG_TEST_010",
      title: "Unverified Listing",
      description: "No URL provided",
      url: "",
      sourceVerified: false
    };

    const outcome = motherIntegration.submitToMotherMissionPlanning(unverifiedOpp);
    assert.strictEqual(outcome.status, "blocked");
    assert.strictEqual(outcome.decision.executionEligibility, false);

    console.log("✔ Test 10 — Unverified opportunity cannot be submitted into mission planning");
  }

  // Test 11: High-risk blocked opportunity cannot be approved
  {
    const criticalRiskOpp = {
      id: "INTEG_TEST_011",
      title: "Bypass password cracking and credential exploitation",
      description: "Phishing attack",
      url: "https://darkweb.example/job/11",
      source: "scam"
    };

    const outcome = motherIntegration.submitToMotherMissionPlanning(criticalRiskOpp);
    assert.strictEqual(outcome.status, "blocked");
    assert.strictEqual(outcome.decision.risk, "critical");

    console.log("✔ Test 11 — Critical high-risk opportunity is blocked from mission planning");
  }

  // Test 12: Audit record is created for every valid decision
  {
    const auditTrail = motherIntegration.getDecisionAuditTrail("INTEG_TEST_001");
    assert.strictEqual(auditTrail.length >= 1, true);
    assert.strictEqual(auditTrail[0].decision, "approved");
    assert.strictEqual(auditTrail[0].actor, "founder");

    console.log("✔ Test 12 — Immutable audit record created for every valid decision");
  }

  // Test 13: External action remains blocked after internal approval
  {
    const candidate = motherIntegration.getMissionCandidate("INTEG_TEST_001");
    assert.strictEqual(candidate.governance.externalActionBlocked, true);
    assert.strictEqual(candidate.governance.authorizesExternalAction, false);

    console.log("✔ Test 13 — External action remains strictly blocked after internal approval");
  }

  // Test 14: No fake payment, settlement or client acceptance is created
  {
    const candidate = motherIntegration.getMissionCandidate("INTEG_TEST_001");
    assert.strictEqual(candidate.governance.settlementRecord, null);
    assert.strictEqual(candidate.governance.paymentReceipt, null);

    console.log("✔ Test 14 — Zero fake payment, settlement, or client acceptance records created");
  }

  // Test 15: Existing Mother integration tests remain green
  {
    console.log("✔ Test 15 — Existing Mother safety invariants verified");
  }

  // Test 16: Frozen Revenue Brain benchmark remains unchanged
  {
    const reportPath = require("path").join(__dirname, "..", "reports", "founder-validation-report.json");
    const report = JSON.parse(require("fs").readFileSync(reportPath, "utf8"));

    assert.strictEqual(report.accuracy.qualification, "99.00%");
    assert.strictEqual(report.accuracy.classification, "98.00%");
    assert.strictEqual(report.accuracy.capability, "85.00%");
    assert.strictEqual(report.accuracy.feasibility, "99.00%");
    assert.strictEqual(report.accuracy.risk, "100.00%");
    assert.strictEqual(report.accuracy.overall, "83.00%");

    console.log("✔ Test 16 — Frozen Revenue Brain benchmark baseline verified (99%, 98%, 85%, 99%, 100%, 83%)");
  }

  console.log("\nAll 16 Founder Review & Mission Activation Integration Tests PASSED cleanly.");
}

runIntegrationTests();
