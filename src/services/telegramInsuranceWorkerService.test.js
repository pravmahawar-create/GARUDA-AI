// Phases 8-11 tests: Telegram Insurance Worker (Q&A, memory, need detection,
// qualification, InsuranceLead creation, founder-gated handoff).
const assert = require("assert");
const worker = require("./telegramInsuranceWorkerService");
const conversationService = require("./conversationService");

let passed = 0;
let failed = 0;
function test(name, fn) {
  const p = Promise.resolve()
    .then(fn)
    .then(() => {
      passed += 1;
      console.log(`  ok  ${name}`);
    })
    .catch((error) => {
      failed += 1;
      console.log(`  xx  ${name}: ${error.message}`);
    });
  return p;
}

async function main() {
  // -- intent + need detection --
  await test("insurance intent detected", () => {
    assert.strictEqual(worker.detectInsuranceIntent("term insurance kya hai"), true);
    assert.strictEqual(worker.detectInsuranceIntent("absli plans batao"), true);
    assert.strictEqual(worker.detectInsuranceIntent("website chahiye"), false);
  });

  await test("need signals detected", () => {
    const signals = worker.detectNeedSignals("mujhe term insurance chahiye, mera naam Rahul hai");
    assert.ok(signals.includes("explicit_interest"));
    assert.ok(signals.includes("name_provided"));
  });

  await test("contact signal detected from phone", () => {
    const signals = worker.detectNeedSignals("mera number 9876543210 hai");
    assert.ok(signals.includes("contact_provided"));
  });

  // -- conversation memory --
  await test("conversation memory stores messages", async () => {
    const chatId = "test_chat_mem_1";
    await worker.remember(chatId, "user", "term insurance kya hai");
    const context = await worker.recentContext(chatId, 4);
    assert.ok(Array.isArray(context));
    assert.ok(context.some((m) => m.text.includes("term insurance")));
  });

  await test("thread id is namespaced per chat", () => {
    assert.strictEqual(worker.threadIdForChat("12345"), "telegram:12345");
    assert.strictEqual(worker.threadIdForChat("999"), "telegram:999");
  });

  // -- grounded Q&A (no fabrication) --
  await test("insurance question returns grounded answer from knowledge", async () => {
    const result = await worker.handleInsuranceMessage("chat_qa_1", "term insurance kya hai", { stateStore: new Map() });
    assert.strictEqual(result.handled, true);
    assert.ok(result.reply.includes("ABSLI"));
    assert.ok(result.mode === "answered" || result.mode === "qualifying");
  });

  // -- qualification sequence --
  await test("qualification collects name then coverage type then contact", () => {
    let ctx = worker.parseQualificationAnswer("mera naam Priya", {});
    assert.strictEqual(ctx.name, "Priya");
    ctx = worker.parseQualificationAnswer("term coverage", ctx);
    assert.strictEqual(ctx.coverageType, "term");
    ctx = worker.parseQualificationAnswer("email@gmail.com", ctx);
    assert.strictEqual(ctx.contact, "email@gmail.com");
    assert.strictEqual(worker.qualificationComplete(ctx), true);
  });

  await test("qualification complete requires name + coverage type", () => {
    assert.strictEqual(worker.qualificationComplete({ name: "Abc", coverageType: "" }), false);
    assert.strictEqual(worker.qualificationComplete({ name: "Abc", coverageType: "term" }), true);
  });

  await test("age, budget and goal are captured from conversation text", () => {
    let ctx = worker.parseQualificationAnswer("mera naam Vikram, age 34, budget 45000 per month, goal family ke liye term cover", {});
    assert.strictEqual(ctx.name, "Vikram");
    assert.strictEqual(ctx.age, 34);
    assert.strictEqual(ctx.budget, 45000);
    assert.ok(ctx.goal && ctx.goal.length > 0);
  });

  await test("invalid age is not captured", () => {
    const ctx = worker.parseQualificationAnswer("meri umar 5 saal hai", {});
    assert.strictEqual(ctx.age, undefined);
  });

  await test("follow-up respects budget context", () => {
    const followUp = worker.buildFollowUp({ budget: 45000, coverageType: "term" }, { topic: "term" });
    assert.ok(/45,000/.test(followUp));
    assert.ok(/naam/.test(followUp));
  });

  await test("follow-up respects child education topic", () => {
    const followUp = worker.buildFollowUp({ coverageType: "education", age: 34 }, { topic: "child_education" });
    assert.ok(/34/.test(followUp));
    assert.ok(/education/.test(followUp.toLowerCase()));
  });

  await test("follow-up falls back gracefully with only name", () => {
    const followUp = worker.buildFollowUp({ userName: "Riya" }, null);
    assert.ok(/Riya/.test(followUp));
  });

  // -- InsuranceLead creation (DB mocked) --
  await test("insurance lead created from conversation state", async () => {
    const { InsuranceLead } = require("../models/InsuranceLead");
    const originalCreate = InsuranceLead.create;
    const originalFindOne = InsuranceLead.findOne;
    let createdPayload = null;
    InsuranceLead.create = async (payload) => { createdPayload = payload; return { id: "lead-1", toJSON: () => ({ id: "lead-1", ...payload }) }; };
    InsuranceLead.findOne = async () => null;
    try {
      const result = await worker.createInsuranceLeadFromConversation("chat_lead_1", {
        name: "Rohit",
        coverageType: "term",
        contact: "rohit@gmail.com",
        signals: ["explicit_interest", "coverage_type"]
      });
      assert.ok(result.lead);
      assert.strictEqual(createdPayload.source, "telegram");
      assert.strictEqual(createdPayload.status, "qualified");
      assert.ok(createdPayload.email.includes("rohit@gmail.com"));
      assert.ok(createdPayload.tags.includes("telegram"));
    } finally {
      InsuranceLead.create = originalCreate;
      InsuranceLead.findOne = originalFindOne;
    }
  });

  await test("full qualification path creates a lead (no real sends)", async () => {
    const { InsuranceLead } = require("../models/InsuranceLead");
    const originalCreate = InsuranceLead.create;
    const originalFindOne = InsuranceLead.findOne;
    InsuranceLead.create = async (payload) => ({ id: "lead-2", toJSON: () => ({ id: "lead-2", ...payload }) });
    InsuranceLead.findOne = async () => null;
    const stateStore = new Map();
    try {
      // Step 1: interest + name
      await worker.handleInsuranceMessage("chat_full_1", "mujhe term insurance chahiye, mera naam Sana", { stateStore });
      // Step 2: coverage type
      await worker.handleInsuranceMessage("chat_full_1", "term coverage", { stateStore });
      // Step 3: contact
      const result = await worker.handleInsuranceMessage("chat_full_1", "sana@gmail.com", { stateStore });
      assert.strictEqual(result.mode, "qualified");
      assert.strictEqual(result.leadId, "lead-2");
    } finally {
      InsuranceLead.create = originalCreate;
      InsuranceLead.findOne = originalFindOne;
    }
  });

  // -- multi-turn qualification persistence (conversation-thread backed) --
  await test("qualification persists across separate messages without an explicit stateStore", async () => {
    const { InsuranceLead } = require("../models/InsuranceLead");
    const originalCreate = InsuranceLead.create;
    const originalFindOne = InsuranceLead.findOne;
    InsuranceLead.create = async (payload) => ({ id: "lead-persist-1", toJSON: () => ({ id: "lead-persist-1", ...payload }) });
    InsuranceLead.findOne = async () => null;
    try {
      const chatId = "chat_persist_1";
      const r1 = await worker.handleInsuranceMessage(chatId, "term insurance chahiye");
      assert.strictEqual(r1.handled, true);
      assert.strictEqual(r1.mode, "qualifying");
      assert.strictEqual(r1.qualificationStep, "name");
      const r2 = await worker.handleInsuranceMessage(chatId, "mera naam Neha");
      assert.strictEqual(r2.qualificationStep, "contact");
      const r3 = await worker.handleInsuranceMessage(chatId, "neha@gmail.com");
      assert.strictEqual(r3.mode, "qualified");
      assert.strictEqual(r3.leadId, "lead-persist-1");
    } finally {
      InsuranceLead.create = originalCreate;
      InsuranceLead.findOne = originalFindOne;
    }
  });

  await test("duplicate insurance lead is not created after qualification completes", async () => {
    const { InsuranceLead } = require("../models/InsuranceLead");
    const originalCreate = InsuranceLead.create;
    const originalFindOne = InsuranceLead.findOne;
    let createCalls = 0;
    InsuranceLead.create = async (payload) => { createCalls += 1; return { id: "lead-dup-1", toJSON: () => ({ id: "lead-dup-1", ...payload }) }; };
    InsuranceLead.findOne = async () => null;
    try {
      const chatId = "chat_dup_1";
      await worker.handleInsuranceMessage(chatId, "term insurance chahiye");
      await worker.handleInsuranceMessage(chatId, "mera naam Aditi");
      const r3 = await worker.handleInsuranceMessage(chatId, "aditi@gmail.com");
      assert.strictEqual(r3.mode, "qualified");
      const r4 = await worker.handleInsuranceMessage(chatId, "savings plan chahiye");
      assert.strictEqual(r4.mode, "qualified");
      assert.strictEqual(r4.leadId, r3.leadId);
      assert.strictEqual(createCalls, 1, "lead must be created exactly once");
    } finally {
      InsuranceLead.create = originalCreate;
      InsuranceLead.findOne = originalFindOne;
    }
  });

  await test("qualification state is isolated per Telegram chat", async () => {
    const { InsuranceLead } = require("../models/InsuranceLead");
    const originalCreate = InsuranceLead.create;
    const originalFindOne = InsuranceLead.findOne;
    InsuranceLead.create = async (payload) => ({ id: "lead-iso-1", toJSON: () => ({ id: "lead-iso-1", ...payload }) });
    InsuranceLead.findOne = async () => null;
    try {
      const chatA = "chat_iso_a";
      const chatB = "chat_iso_b";
      const rA1 = await worker.handleInsuranceMessage(chatA, "term insurance chahiye");
      assert.strictEqual(rA1.qualificationStep, "name");
      await worker.handleInsuranceMessage(chatA, "mera naam Isha");
      const rB = await worker.handleInsuranceMessage(chatB, "health insurance kya hai");
      assert.strictEqual(rB.qualificationStep, "name", "chat B must not inherit chat A's qualification state");
    } finally {
      InsuranceLead.create = originalCreate;
      InsuranceLead.findOne = originalFindOne;
    }
  });

  await test("saveQualificationState/loadQualificationState round-trips and state is hidden from context", async () => {
    const chatId = "chat_state_rt_1";
    await worker.saveQualificationState(chatId, { name: "Kiran", coverageType: "term", contact: "kiran@example.com", signals: ["explicit_interest"] });
    const loaded = await worker.loadQualificationState(chatId);
    assert.strictEqual(loaded.name, "Kiran");
    assert.strictEqual(loaded.coverageType, "term");
    assert.strictEqual(loaded.contact, "kiran@example.com");
    const context = await worker.recentContext(chatId, 10);
    assert.ok(!context.some((m) => typeof m.text === "string" && m.text.startsWith("{")), "state messages must not leak into recent context");
  });

  // -- founder-gated handoff --
  await test("lead->opportunity handoff requires founder approval", async () => {
    const result = await worker.promoteLeadToOpportunity("507f1f77bcf86cd799439011", {});
    assert.strictEqual(result.promoted, false);
    assert.strictEqual(result.reason, "founder_approval_required");
  });

  await test("lead->opportunity rejects invalid lead id", async () => {
    const result = await worker.promoteLeadToOpportunity("not-an-id", { founderApproved: true });
    assert.strictEqual(result.promoted, false);
    assert.strictEqual(result.reason, "invalid_lead_id");
  });

  await test("lead->opportunity creates opportunity with founder approval (mocked)", async () => {
    const { InsuranceLead } = require("../models/InsuranceLead");
    const { Opportunity } = require("../models/Opportunity");
    const originalFindById = InsuranceLead.findById;
    const originalCreate = Opportunity.create;
    InsuranceLead.findById = async () => ({
      _id: "507f1f77bcf86cd799439011",
      firstName: "Rohit",
      coverageType: "term",
      email: "rohit@gmail.com",
      status: "qualified",
      audit: [],
      save: async () => true,
      toJSON: () => ({ id: "507f1f77bcf86cd799439011", firstName: "Rohit" })
    });
    let oppPayload = null;
    Opportunity.create = async (payload) => { oppPayload = payload; return { id: "opp-9", _id: "opp-9" }; };
    try {
      const result = await worker.promoteLeadToOpportunity("507f1f77bcf86cd799439011", { founderApproved: true });
      assert.strictEqual(result.promoted, true);
      assert.ok(oppPayload);
      assert.strictEqual(oppPayload.origin, "insurance_lead");
      assert.strictEqual(oppPayload.source, "telegram_insurance_lead");
      assert.strictEqual(oppPayload.valueModel.valueType, "insurance_opportunity_value");
      assert.strictEqual(oppPayload.priority, "UNMEASURED");
    } finally {
      InsuranceLead.findById = originalFindById;
      Opportunity.create = originalCreate;
    }
  });

  console.log(`\ntelegramInsuranceWorkerService.test: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main();