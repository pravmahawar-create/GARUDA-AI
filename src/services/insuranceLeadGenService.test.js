const path = require("path");
const fs = require("fs");
const os = require("os");
const assert = require("assert");

const {
  addProspects,
  generateContactsCsv,
  getPipeline,
  listProspects,
  scoreProspect,
  setPaths
} = require("./insuranceLeadGenService");

let tmpDir;

function freshPaths() {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "garuda-leadgen-"));
  const paths = {
    prospectsPath: path.join(tmpDir, "prospects.json"),
    contactsPath: path.join(tmpDir, "contacts.csv"),
    ledgerPath: path.join(tmpDir, "ledger.json")
  };
  setPaths(paths);
  return paths;
}

function run() {
  let passed = 0;
  let failed = 0;

  function test(name, fn) {
    try {
      freshPaths();
      fn();
      passed += 1;
      console.log(`  ok  ${name}`);
    } catch (error) {
      failed += 1;
      console.log(`  xx  ${name}: ${error.message}`);
    }
  }

  test("business owner detects + savings_investment query", () => {
    const scored = scoreProspect({
      businessName: "Sharma Traders Jaipur",
      businessType: "retail trading",
      email: "contact@sharmatraders.in",
      phone: "9829012345",
      gstin: "08AAAA",
      city: "Jaipur"
    });
    assert.ok(scored.segments.includes("business_owner"), `segments=${scored.segments}`);
    assert.strictEqual(scored.query, "savings_investment");
    assert.ok(scored.score >= 60, `score=${scored.score}`);
    assert.ok(scored.email === "contact@sharmatraders.in");
  });

  test("parent with children -> child_education query", () => {
    const scored = scoreProspect({
      businessName: "Sunrise Coaching",
      firstName: "Neha",
      email: "neha@sunrise.com",
      notes: "owner, mother of two schoolchildren"
    });
    assert.ok(scored.query === "child_education", scored.query);
  });

  test("low-signal prospect email-only scores low", () => {
    const scored = scoreProspect({ email: "random@p.com" });
    assert.ok(scored.score <= 40, `score=${scored.score}`);
    assert.ok(scored.grade === "LOW" || scored.grade === "POTENTIAL");
  });

  test("addProspects dedupes + stores", () => {
    const p = { businessName: "City Books", email: "owner@citybooks.in", phone: "9000011111" };
    const first = addProspects([p]);
    const dup = addProspects([p]);
    assert.strictEqual(first.added.length, 1);
    assert.strictEqual(dup.added.length, 0);
    assert.strictEqual(dup.skipped[0].reason, "duplicate");
  });

  test("addProspects rejects invalid email", () => {
    const res = addProspects([{ businessName: "No Email Shop", email: "" }]);
    assert.strictEqual(res.added.length, 0);
    assert.strictEqual(res.skipped[0].reason, "no_email");
  });

  test("generateContactsCsv writes only qualified rows", () => {
    addProspects([
      { businessName: "Ganga Traders", email: "ganga@t.in", phone: "9811111111", gstin: "08GG" },
      { businessName: "Mr Pupu", email: "pupu@p.in" }
    ]);
    const res = generateContactsCsv({ minScore: 40 });
    assert.ok(res.generated === 1, `generated=${res.generated}`);
    const csv = fs.readFileSync(res.contactsPath, "utf8");
    assert.ok(csv.includes("ganga@t.in"));
    assert.ok(!csv.includes("pupu@p.in"));
  });

  test("dryRun generate does not write file", () => {
    addProspects([{ businessName: "Bikaner Traders", email: "test@co.in", phone: "9822222222", gstin: "08TC" }]);
    const res = generateContactsCsv({ minScore: 40, dryRun: true });
    assert.strictEqual(res.rows.length, 1);
    assert.ok(!fs.existsSync(res.contactsPath));
  });

  test("pipeline counts by grade + query", () => {
    addProspects([
      { businessName: "Ajmer Handlooms", email: "a@h.in", phone: "9833333333", gstin: "08AH" },
      { businessName: "Bapu Pharma", email: "b@p.in", phone: "9844444444", notes: "director, two kids" }
    ]);
    const pipe = getPipeline();
    assert.ok(pipe.total >= 2);
    assert.ok(pipe.byQuery.savings_investment >= 1);
    assert.ok(pipe.byQuery.child_education === 1, JSON.stringify(pipe.byQuery));
  });

  test("minScore filter in listProspects", () => {
    addProspects([{ businessName: "Churu Textile Industries", email: "high@co.in", phone: "9855555555", gstin: "08HC" }]);
    const list = listProspects({ minScore: 50 });
    assert.ok(list.length >= 1);
    const none = listProspects({ minScore: 95 });
    assert.strictEqual(none.length, 0);
  });

  test("opted-out ledger contact rejected from add", () => {
    const ledgerPath = path.join(tmpDir, "ledger.json");
    fs.writeFileSync(
      ledgerPath,
      JSON.stringify({ leads: [{ email: "old@x.in", optedOut: true }] }),
      "utf8"
    );
    setPaths({ ledgerPath });
    const res = addProspects([{ businessName: "Old Shop", email: "old@x.in" }]);
    assert.strictEqual(res.added.length, 0);
    assert.strictEqual(res.skipped[0].reason, "opted_out");
  });

  console.log(`\ninsuranceLeadGenService.test: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

run();