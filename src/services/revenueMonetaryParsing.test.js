const assert = require("assert");
const { parseMonetaryValueDetailed } = require("./revenueCommandCenterService");

function testMonetaryParsing() {
  console.log("Testing monetary parsing and valuation rules...");

  // 1. Malformed typo: "$31,2k-$52k" -> should clean to "$31.2k-$52k" (31200 to 52000)
  const case1 = parseMonetaryValueDetailed("$31,2k-$52k");
  assert.strictEqual(case1.minUSD, 31200);
  assert.strictEqual(case1.maxUSD, 52000);
  assert.strictEqual(case1.estimatedUSD, 41600);
  assert.strictEqual(case1.estimatedINR, 41600 * 83);
  assert.strictEqual(case1.payUnit, "annual");
  assert.strictEqual(case1.warning, null);

  // 2. Standard range: "$25k-$35k"
  const case2 = parseMonetaryValueDetailed("$25k-$35k");
  assert.strictEqual(case2.minUSD, 25000);
  assert.strictEqual(case2.maxUSD, 35000);
  assert.strictEqual(case2.estimatedUSD, 30000);
  assert.strictEqual(case2.payUnit, "annual");

  // 3. Hourly range: "$50-$75/hour" -> estimatedUSD must be 0 without estimated hours
  const case3 = parseMonetaryValueDetailed("$50-$75/hour");
  assert.strictEqual(case3.minUSD, 50);
  assert.strictEqual(case3.maxUSD, 75);
  assert.strictEqual(case3.estimatedUSD, 0);
  assert.strictEqual(case3.payUnit, "hourly");
  assert.ok(case3.warning.includes("Hourly rate excluded"));

  // 4. Hourly range: "$90-$150/hour"
  const case4 = parseMonetaryValueDetailed("$90-$150/hour");
  assert.strictEqual(case4.minUSD, 90);
  assert.strictEqual(case4.maxUSD, 150);
  assert.strictEqual(case4.estimatedUSD, 0);
  assert.strictEqual(case4.payUnit, "hourly");

  // 5. Single K value: "$12K"
  const case5 = parseMonetaryValueDetailed("$12K");
  assert.strictEqual(case5.minUSD, 12000);
  assert.strictEqual(case5.maxUSD, 12000);
  assert.strictEqual(case5.estimatedUSD, 12000);

  // 6. Zero value: "0"
  const case6 = parseMonetaryValueDetailed("0");
  assert.strictEqual(case6.estimatedUSD, 0);
  assert.strictEqual(case6.payUnit, "unknown");

  // 7. Malformed non-numeric text: "Competitive salary"
  const case7 = parseMonetaryValueDetailed("Competitive salary");
  assert.strictEqual(case7.estimatedUSD, 0);
  assert.strictEqual(case7.payUnit, "unknown");
  assert.ok(case7.warning.includes("Non-numeric"));

  console.log("All monetary parsing test cases passed cleanly.");
}

testMonetaryParsing();
