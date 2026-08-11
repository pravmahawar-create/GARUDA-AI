const assert = require("assert");
const salesAgent = require("./garudaSalesAgentService");

const tests = [];

tests.push({
  name: "website with budget -> quote",
  run: () => {
    const r1 = salesAgent.handleSalesMessage("mujhe website chahiye, 3 pages, budget 50,000", { sessionId: "t1" });
    assert.strictEqual(r1.action, "quote");
    assert.ok(r1.quote.recommendedPrice >= 50000, "price should respect budget");
    assert.ok(r1.quote.floorPrice < r1.quote.recommendedPrice);
    assert.ok(r1.quote.milestones.length >= 2, "milestone-based for >=30k");
  }
});

tests.push({
  name: "ecommerce + lakh budget + negotiation floor",
  run: () => {
    const r1 = salesAgent.handleSalesMessage("ecommerce website chahiye, budget 2 lakh", { sessionId: "t2" });
    assert.strictEqual(r1.action, "quote");
    const floor = r1.quote.floorPrice;
    const start = r1.quote.recommendedPrice;
    const r2 = salesAgent.handleSalesMessage("bahut mehenga hai", { sessionId: "t2" });
    assert.strictEqual(r2.action, "negotiated");
    const r3 = salesAgent.handleSalesMessage("thoda kam karo", { sessionId: "t2" });
    assert.ok(r3.quote.currentPrice <= start, "price went down");
    assert.ok(r3.quote.currentPrice >= floor, "never below floor");
  }
});

tests.push({
  name: "deal accept -> payment page",
  run: () => {
    salesAgent.handleSalesMessage("website chahiye budget 20,000", { sessionId: "t3" });
    const r = salesAgent.handleSalesMessage("deal done", { sessionId: "t3" });
    assert.strictEqual(r.action, "accepted");
    assert.ok(r.paymentPageUrl.includes("razorpay"));
  }
});

tests.push({
  name: "no budget -> asks questions",
  run: () => {
    salesAgent.resetDeal("t4");
    const r = salesAgent.handleSalesMessage("mujhe website chahiye", { sessionId: "t4" });
    assert.strictEqual(r.action, "questions");
    assert.ok(r.questions.some((q) => /budget/i.test(q)));
  }
});

tests.push({
  name: "parseBudget handles lakh/crore",
  run: () => {
    assert.strictEqual(salesAgent.parseBudget("2 lakh"), 200000);
    assert.strictEqual(salesAgent.parseBudget("1.5 crore"), 15000000);
    assert.strictEqual(salesAgent.parseBudget("50k"), 50000);
    assert.strictEqual(salesAgent.parseBudget("25,000"), 25000);
  }
});

let failed = 0;
for (const t of tests) {
  try {
    t.run();
    console.log(`PASS: ${t.name}`);
  } catch (e) {
    failed++;
    console.log(`FAIL: ${t.name} -> ${e.message}`);
  }
}

process.exit(failed ? 1 : 0);
