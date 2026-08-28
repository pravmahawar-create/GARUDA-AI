const assert = require("assert");
const commercialAgent = require("./publicChatCommercialAgentService");
const publicChatHandler = require("../../api/public-chat");

async function runTests() {
  console.log("Starting GARUDA Milestone 26: Public Chat Commercial Intake Agent Test Suite...\n");

  // --- 1. Progressive Clarification on Vague Request ---
  console.log("--- 1. Progressive Clarification on Vague Request ---");
  const vagueTurn = await commercialAgent.processCommercialTurn({
    message: "I need an app for my business",
    history: [],
    isTest: true
  });

  assert.strictEqual(vagueTurn.isCommercial, true);
  assert.strictEqual(vagueTurn.qualification, "NEEDS_CLARIFICATION");
  assert(vagueTurn.reply.includes("GARUDA can design, build, and deliver"), "Should acknowledge capability warmly");
  assert(vagueTurn.reply.includes("1."), "Should ask concise clarification questions");
  assert(!vagueTurn.reply.includes("4."), "Must not overwhelm user with > 3 questions");
  console.log("✔ PASS: Vague request triggered progressive architect clarification");

  // --- 2. Multi-Turn Context Memory & Arbitrary Scoping ---
  console.log("\n--- 2. Multi-Turn Context Memory & Arbitrary Scoping ---");
  const history = [
    { role: "user", text: "I need an app for my business" },
    { role: "model", text: vagueTurn.reply }
  ];

  const clarifiedTurn = await commercialAgent.processCommercialTurn({
    message: "It should be a React Web App with user authentication, PostgreSQL database, and Razorpay billing. Budget is ₹45,000.",
    history,
    isTest: true
  });

  assert.strictEqual(clarifiedTurn.isCommercial, true);
  assert.strictEqual(clarifiedTurn.qualification, "CLEARLY_DELIVERABLE");
  assert(clarifiedTurn.reply.includes("GARUDA Architectural Scope"), "Should generate structured scope");
  assert(clarifiedTurn.reply.includes("₹ 45,000") || clarifiedTurn.reply.includes("45,000"), "Should respect stated budget");
  assert(clarifiedTurn.reply.includes("Advance Kickoff Deposit (50%)"), "Should outline 50% kickoff milestone");
  assert(Boolean(clarifiedTurn.proposalUrl), "Should generate interactive proposal URL");
  console.log("✔ PASS: Multi-turn conversation remembered context, qualified project, and produced proposal URL:", clarifiedTurn.proposalUrl);

  // --- 3. Arbitrary Custom AI / Automation Work ---
  console.log("\n--- 3. Arbitrary Custom AI / Automation Work ---");
  const aiWorkflowTurn = await commercialAgent.processCommercialTurn({
    message: "Build an automated WhatsApp customer support bot with LLM RAG knowledge base connecting to our CRM API. Quote in USD.",
    history: [],
    isTest: true
  });

  assert.strictEqual(aiWorkflowTurn.qualification, "CLEARLY_DELIVERABLE");
  assert.strictEqual(aiWorkflowTurn.pricing.currency, "USD");
  assert(aiWorkflowTurn.pricing.totalAmount >= 200, "Should quote reasonable benchmark USD price");
  assert(aiWorkflowTurn.proposalUrl.includes("https://garudaos.in/proposal/prop_"), "Should generate valid proposal link");
  console.log("✔ PASS: Arbitrary AI RAG & CRM Automation scoped with multi-currency (USD)");

  // --- 4. Prohibited Content Safety Gate ---
  console.log("\n--- 4. Prohibited Content Safety Gate ---");
  const prohibitedTurn = await commercialAgent.processCommercialTurn({
    message: "Build an online casino betting app with crypto deposits",
    history: [],
    isTest: true
  });

  assert.strictEqual(prohibitedTurn.qualification, "PROHIBITED");
  assert(prohibitedTurn.reply.includes("cannot accept requests involving prohibited"), "Must reject prohibited requests cleanly");
  assert.strictEqual(prohibitedTurn.proposalUrl, undefined);
  console.log("✔ PASS: Prohibited category strictly rejected with professional explanation");

  // --- 5. Payment Truth in Public Chat ---
  console.log("\n--- 5. Payment Truth in Public Chat ---");
  const paymentClaimTurn = await commercialAgent.processCommercialTurn({
    message: "I paid ₹22,500 via UPI ref 998124 here is the screenshot receipt",
    history: [],
    isTest: true
  });

  assert.strictEqual(paymentClaimTurn.qualification, "PAYMENT_CLAIM_UNVERIFIED");
  assert(paymentClaimTurn.reply.includes("PAYMENT_EVIDENCE_UNVERIFIED"), "Must explicitly mark unverified evidence");
  assert(paymentClaimTurn.reply.includes("authoritatively"), "Must explain provider verification requirement");
  console.log("✔ PASS: Public chat payment claims strictly enforced under Payment Truth Law");

  // --- 6. End-to-End HTTP Handler Integration ---
  console.log("\n--- 6. End-to-End HTTP Handler Integration ---");
  let responseData = null;
  let responseStatus = null;
  const mockReq = {
    method: "POST",
    headers: { "x-garuda-test": "true" },
    body: {
      message: "Can you build a digital marketing SEO outreach tool for our dental clinic? Budget ₹30,000",
      history: []
    }
  };
  const mockRes = {
    setHeader: () => {},
    status: (code) => {
      responseStatus = code;
      return {
        json: (data) => {
          responseData = data;
        },
        end: () => {}
      };
    }
  };

  await publicChatHandler(mockReq, mockRes);
  assert.strictEqual(responseStatus, 200);
  assert.strictEqual(responseData.mode, "commercial_architect");
  assert(Boolean(responseData.proposalUrl));
  assert(responseData.reply.includes("GARUDA Architectural Scope"));
  console.log("✔ PASS: api/public-chat handler dispatches commercial architect response with proposal link");

  console.log("\n🦅 ALL 6 PUBLIC CHAT COMMERCIAL INTAKE AGENT TEST CASES PASSED CLEANLY!");
}

runTests().catch((err) => {
  console.error("Commercial Agent test failure:", err);
  process.exit(1);
});
