const { researchAgent } = require("../src/agents/researchAgent");
const { proposalAgent } = require("../src/agents/proposalAgent");
const { validationAgent } = require("../src/agents/validationAgent");

function fail(msg) { throw new Error(msg); }

function printReport(passed, details) {
  const now = new Date().toISOString();
  console.log(`\n=== Agent Pipeline Verification Report ===
${now}
Status: ${passed ? "PASS" : "FAIL"}
${details}
===========================================\n`);
}

// Create a temporary in-memory sample mission object (NO database records)
const mission = {
  _id: "test-mission-id",
  missionKey: "test:candidate-001",
  candidateId: "test-candidate-001",
  incomeGoalId: "test-income-001",
  status: "awaiting_bounded_scope",
  opportunity: {
    title: "Test Client Delivery",
    company: "Test Corp",
    source: "https://example.com",
    score: 95,
  },
  realWorkIntake: {
    brief: {
      deliverableType: "web_application",
      acceptanceCriteria: [
        "User onboarding flow",
        "API integration",
        "Admin dashboard",
      ],
      client: "Test Client",
    },
    status: "handoff_ready",
  },
  capability: {
    id: "cap-rev-001",
    name: "Revenue Engine",
    universe: "revenue",
    readiness: "verified",
  },
  architecturePlan: {},
  workPackages: [
    { id: "wp1", title: "Setup", status: "planned", dependencies: [] },
    { id: "wp2", title: "Implement", status: "planned", dependencies: ["wp1"] },
    { id: "wp3", title: "Deploy", status: "planned", dependencies: ["wp1", "wp2"] },
  ],
  deliverableWorkspace: { status: "active" },
  governance: {},
  approvalEvidence: {},
  missionHash: "",
  payment: {},
  productionDelivery: {},
  executionEvidence: {},
  founderDecision: {},
  revisionNumber: 0,
  revisionHistory: [],
  executionPath: ["architect", "engineering", "tester", "reviewer", "founder"],
};

// Track outputs
let firstRunResults = {};
let secondRunResults = {};

// 1. FIRST RUN
console.log("--- First run of agent pipeline ---");
try {
  // ResearchAgent - populates architecturePlan.researchNotes
  const researchOutput = researchAgent(mission, mission.workPackages);
  firstRunResults.researchNotes = !!mission.architecturePlan?.researchNotes;
  console.log(`ResearchAgent: researchNotes populated = ${firstRunResults.researchNotes}`);

  // ProposalAgent - populates executionEvidence.proposalDraft
  // Note: proposalAgent internally references workPackages; we pass a minimal payload
  const researchPayload = { research: { opportunityTitle: mission.opportunity?.title || "Unknown", findings: [], summary: "" } };
  try {
    const proposalOutput = proposalAgent(mission, researchPayload);
    firstRunResults.proposalDraft = !!mission.executionEvidence?.proposalDraft;
    console.log(`ProposalAgent: proposalDraft populated = ${firstRunResults.proposalDraft}`);
  } catch (e) {
    console.log(`ProposalAgent: skipped - ${e.message.substring(0, 40)}`);
    firstRunResults.proposalDraft = false;
  }

  // ValidationAgent - populates governance.validationResult
  const acceptanceCriteria =
    mission.realWorkIntake && mission.realWorkIntake.brief
      ? mission.realWorkIntake.brief.acceptanceCriteria
      : [];
  try {
    const validationOutput = validationAgent(mission, mission.executionEvidence?.proposalDraft, acceptanceCriteria);
    firstRunResults.validationResult = !!mission.governance?.validationResult;
    firstRunResults.validationOverallPass =
      mission.governance?.validationResult?.overallPass;
    console.log(
      `ValidationAgent: validationResult populated = ${firstRunResults.validationResult}, overallPass = ${firstRunResults.validationOverallPass}`
    );
  } catch (e) {
    console.log(`ValidationAgent: skipped - ${e.message.substring(0, 40)}`);
    firstRunResults.validationResult = false;
  }
} catch (e) {
  console.error("First run fatal error:", e.message);
  firstRunResults.error = e.message;
}

// 2. SECOND RUN (idempotency check)
console.log("\n--- Second run of agent pipeline (idempotency check) ---");
try {
  // ResearchAgent - should reuse existing output
  const researchOutput2 = researchAgent(mission, mission.workPackages);
  secondRunResults.researchNotes =
    mission.architecturePlan?.researchNotes !== undefined;
  console.log(
    `ResearchAgent (reuse): researchNotes still present = ${secondRunResults.researchNotes}`
  );

  // ProposalAgent - should reuse existing output
  const researchPayload2 = { research: { opportunityTitle: mission.opportunity?.title || "Unknown", findings: [], summary: "" } };
  try {
    const proposalOutput2 = proposalAgent(mission, researchPayload2);
    secondRunResults.proposalDraft =
      mission.executionEvidence?.proposalDraft !== undefined;
    console.log(
      `ProposalAgent (reuse): proposalDraft still present = ${secondRunResults.proposalDraft}`
    );
  } catch (e) {
    console.log(`ProposalAgent (reuse): skipped - ${e.message.substring(0, 40)}`);
    secondRunResults.proposalDraft = false;
  }

  // ValidationAgent - should reuse existing output
  const acceptanceCriteria2 =
    mission.realWorkIntake && mission.realWorkIntake.brief
      ? mission.realWorkIntake.brief.acceptanceCriteria
      : [];
  try {
    const validationOutput2 = validationAgent(mission, mission.executionEvidence?.proposalDraft, acceptanceCriteria2);
    secondRunResults.validationResult =
      mission.governance?.validationResult !== undefined;
    secondRunResults.validationOverallPass =
      mission.governance?.validationResult?.overallPass;
    console.log(
      `ValidationAgent (reuse): validationResult still present = ${secondRunResults.validationResult}, overallPass = ${secondRunResults.validationOverallPass}`
    );
  } catch (e) {
    console.log(`ValidationAgent (reuse): skipped - ${e.message.substring(0, 40)}`);
    secondRunResults.validationResult = false;
  }
} catch (e) {
  console.error("Second run fatal error:", e.message);
  secondRunResults.error = e.message;
}

// 3. VERIFICATION
const allPassed =
  firstRunResults.researchNotes &&
  firstRunResults.proposalDraft &&
  firstRunResults.validationResult &&
  secondRunResults.researchNotes &&
  secondRunResults.proposalDraft &&
  secondRunResults.validationResult;

const details = [
  `First run - researchNotes: ${firstRunResults.researchNotes}`,
  `First run - proposalDraft: ${firstRunResults.proposalDraft}`,
  `First run - validationResult: ${firstRunResults.validationResult} (overallPass: ${firstRunResults.validationOverallPass})`,
  `Second run - researchNotes reused: ${secondRunResults.researchNotes}`,
  `Second run - proposalDraft reused: ${secondRunResults.proposalDraft}`,
  `Second run - validationResult reused: ${secondRunResults.validationResult} (overallPass: ${secondRunResults.validationOverallPass})`,
].join("\n");

printReport(allPassed, details);

// Exit with code based on pass/fail
process.exit(allPassed ? 0 : 1);