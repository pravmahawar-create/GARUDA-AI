// Generic multi-domain lead-gen engine test.
// FD-107: proves the config-driven engine behaves EXACTLY like the insurance
// service it generalizes, with paths injected per domain + temp dirs.

const path = require("path");
const fs = require("fs");
const os = require("os");
const assert = require("assert");

const { DOMAINS, getDomain } = require("./domainConfig");
const {
  addProspects,
  detectSegments,
  extractEmail,
  generateContactsCsv,
  getPipeline,
  listProspects,
  scoreProspect
} = require("./genericLeadGenEngine");
const { buildPitch, detectTopic } = require("./genericPitchEngine");
const { previewOutreach, getSummary, optOutLead, canMessageToday } = require("./genericOutreachEngine");

function run() {
  let passed = 0;
  let failed = 0;

  function test(name, fn) {
    try {
      fn();
      passed += 1;
      console.log(`  ok  ${name}`);
    } catch (error) {
      failed += 1;
      console.log(`  xx  ${name}: ${error.message}`);
    }
  }

  // ---- domainConfig ----
  test("getDomain defaults to insurance and is ABSLI-positioned", () => {
    const d = getDomain();
    assert.strictEqual(d.id, "insurance");
    assert.ok(d.brandLines[0].includes("ABSLI"));
    assert.ok(Array.isArray(d.topics) && d.topics.includes("family_protection"));
  });

  test("getDomain falls back to insurance for unknown domain", () => {
    assert.strictEqual(getDomain("nope").id, "insurance");
  });

  test("DOMAINS registry exposes generic contract for new industries", () => {
    for (const [id, d] of Object.entries(DOMAINS)) {
      assert.ok(d.namespace, `${id} namespace`);
      assert.ok(Array.isArray(d.topics) && d.topics.length, `${id} topics`);
      assert.ok(d.segments && Object.keys(d.segments).length, `${id} segments`);
      assert.ok(d.hooks, `${id} hooks`);
      assert.ok(Array.isArray(d.brandLines) && d.brandLines.length, `${id} brandLines`);
    }
  });

  // ---- scoring ----
  test("business owner detects + savings_investment query (matches insurance)", () => {
    const scored = scoreProspect(
      {
        businessName: "Sharma Traders Jaipur",
        businessType: "retail trading",
        email: "contact@sharmatraders.in",
        phone: "9829012345",
        gstin: "08AAAA",
        city: "Jaipur"
      },
      getDomain("insurance")
    );
    assert.ok(scored.segments.includes("business_owner"), `segments=${scored.segments}`);
    assert.strictEqual(scored.query, "savings_investment");
    assert.ok(scored.score >= 60, `score=${scored.score}`);
  });

  test("parent with children -> child_education query (matches insurance)", () => {
    const scored = scoreProspect(
      {
        businessName: "Sunrise Coaching",
        firstName: "Neha",
        email: "neha@sunrise.com",
        notes: "owner, mother of two schoolchildren"
      },
      getDomain("insurance")
    );
    assert.strictEqual(scored.query, "child_education");
  });

  test("car owner -> family_protection query (term route)", () => {
    const scored = scoreProspect(
      {
        firstName: "Rohit",
        email: "rohit@example.com",
        notes: "owns a 4 wheeler car for 2 years, car insurance value 2 lakh"
      },
      getDomain("insurance")
    );
    assert.ok(scored.segments.includes("car_owner"), `segments=${scored.segments}`);
    assert.strictEqual(scored.query, "family_protection");
  });

  test("low-signal prospect email-only scores low", () => {
    const scored = scoreProspect({ email: "random@p.com" }, getDomain("insurance"));
    assert.ok(scored.score <= 40, `score=${scored.score}`);
  });

  // ---- pipeline with injected per-domain paths ----
  test("addProspects dedupes + stores (per-domain namespace)", () => {
    const paths = {
      prospectsPath: path.join(fs.mkdtempSync(path.join(os.tmpdir(), "garuda-gen-")), "prospects.json"),
      contactsPath: path.join(fs.mkdtempSync(path.join(os.tmpdir(), "garuda-gen-")), "contacts.csv"),
      ledgerPath: path.join(fs.mkdtempSync(path.join(os.tmpdir(), "garuda-gen-")), "ledger.json")
    };
    const p = { businessName: "City Books", email: "owner@citybooks.in", phone: "9000011111" };
    const first = addProspects([p], { domain: "insurance", ...paths });
    const dup = addProspects([p], { domain: "insurance", ...paths });
    assert.strictEqual(first.added.length, 1);
    assert.strictEqual(dup.added.length, 0);
    assert.strictEqual(dup.skipped[0].reason, "duplicate");
  });

  test("addProspects rejects invalid email", () => {
    const paths = {
      prospectsPath: path.join(fs.mkdtempSync(path.join(os.tmpdir(), "garuda-gen-")), "prospects.json"),
      contactsPath: path.join(fs.mkdtempSync(path.join(os.tmpdir(), "garuda-gen-")), "contacts.csv"),
      ledgerPath: path.join(fs.mkdtempSync(path.join(os.tmpdir(), "garuda-gen-")), "ledger.json")
    };
    const res = addProspects([{ businessName: "No Email Shop", email: "" }], { domain: "insurance", ...paths });
    assert.strictEqual(res.added.length, 0);
    assert.strictEqual(res.skipped[0].reason, "no_email");
  });

  test("generateContactsCsv writes only qualified rows (per-domain)", () => {
    const paths = {
      prospectsPath: path.join(fs.mkdtempSync(path.join(os.tmpdir(), "garuda-gen-")), "prospects.json"),
      contactsPath: path.join(fs.mkdtempSync(path.join(os.tmpdir(), "garuda-gen-")), "contacts.csv"),
      ledgerPath: path.join(fs.mkdtempSync(path.join(os.tmpdir(), "garuda-gen-")), "ledger.json")
    };
    addProspects(
      [
        { businessName: "Ganga Traders", email: "ganga@t.in", phone: "9811111111", gstin: "08GG" },
        { businessName: "Mr Pupu", email: "pupu@p.in" }
      ],
      { domain: "insurance", ...paths }
    );
    const res = generateContactsCsv({ minScore: 40, domain: "insurance", ...paths });
    assert.strictEqual(res.generated, 1, `generated=${res.generated}`);
    const csv = fs.readFileSync(res.contactsPath, "utf8");
    assert.ok(csv.includes("ganga@t.in"));
    assert.ok(!csv.includes("pupu@p.in"));
  });

  test("pipeline counts by grade + query", () => {
    const paths = {
      prospectsPath: path.join(fs.mkdtempSync(path.join(os.tmpdir(), "garuda-gen-")), "prospects.json"),
      contactsPath: path.join(fs.mkdtempSync(path.join(os.tmpdir(), "garuda-gen-")), "contacts.csv"),
      ledgerPath: path.join(fs.mkdtempSync(path.join(os.tmpdir(), "garuda-gen-")), "ledger.json")
    };
    addProspects(
      [
        { businessName: "Ajmer Handlooms", email: "a@h.in", phone: "9833333333", gstin: "08AH" },
        { businessName: "Bapu Pharma", email: "b@p.in", phone: "9844444444", notes: "director, two kids" }
      ],
      { domain: "insurance", ...paths }
    );
    const pipe = getPipeline({ domain: "insurance", ...paths });
    assert.ok(pipe.total >= 2);
    assert.ok(pipe.byQuery.savings_investment >= 1);
    assert.strictEqual(pipe.byQuery.child_education, 1, JSON.stringify(pipe.byQuery));
    assert.strictEqual(pipe.domain, "insurance");
  });

  // ---- generic pitch ----
  test("generic buildPitch produces ABSLI-positioned insurance pitch", () => {
    const pitch = buildPitch({ firstName: "Ramesh", query: "family_protection", domainId: "insurance", chunks: [] });
    assert.ok(pitch.body.includes("ABSLI"));
    assert.ok(pitch.body.includes("Namaste Ramesh"));
    assert.strictEqual(pitch.domain, "insurance");
    assert.strictEqual(pitch.topic, "family_protection");
  });

  test("detectTopic falls back to default when no keyword matches", () => {
    assert.strictEqual(detectTopic("hello world", getDomain("insurance")), "family_protection");
  });

  // ---- generic outreach ----
  test("previewOutreach builds pitch per domain (no SMTP needed)", () => {
    const result = previewOutreach(
      [{ email: "ramesh@x.in", firstName: "Ramesh", query: "savings_investment" }],
      { domain: "insurance", ledgerPath: path.join(fs.mkdtempSync(path.join(os.tmpdir(), "garuda-gen-")), "ledger.json") }
    );
    assert.strictEqual(result.generated, 1);
    assert.strictEqual(result.results[0].ok, true);
    assert.ok(result.results[0].body.includes("ABSLI"));
  });

  test("canMessageToday blocks opted-out leads", () => {
    const gate = canMessageToday({ optedOut: true, lastAttemptAt: null });
    assert.strictEqual(gate.allowed, false);
    assert.strictEqual(gate.reason, "opted_out");
  });

  test("buildPitch + previewOutreach support English (intl) locale", () => {
    const enPitch = buildPitch({ firstName: "John", query: "direct_bookings", domainId: "hotel", chunks: [], locale: "en" });
    assert.ok(enPitch.body.includes("Hello John"));
    assert.ok(enPitch.body.includes("OTA booking costs you"));
    assert.ok(!enPitch.body.includes("Namaste"));
    const hiPitch = buildPitch({ firstName: "Ramesh", query: "direct_bookings", domainId: "hotel", chunks: [] });
    assert.ok(hiPitch.body.includes("Namaste Ramesh"));
    const ledgerPath = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "garuda-gen-")), "ledger.json");
    const result = previewOutreach(
      [{ email: "dubai@x.ae", firstName: "John", query: "direct_bookings", locale: "en" }],
      { domain: "hotel", ledgerPath }
    );
    assert.strictEqual(result.results[0].locale, "en");
    assert.ok(result.results[0].body.includes("OTA booking costs you"));
  });

  test("canMessageToday blocks bounced leads (address doesn't exist)", () => {
    const gate = canMessageToday({ bounced: true, optedOut: false, lastAttemptAt: null });
    assert.strictEqual(gate.allowed, false);
    assert.strictEqual(gate.reason, "bounced");
  });

  test("optOutLead + getSummary reflect status", () => {
    const ledgerPath = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "garuda-gen-")), "ledger.json");
    fs.writeFileSync(ledgerPath, JSON.stringify({ leads: [{ email: "ramesh@x.in", optedOut: false, sentCount: 1, status: "message_sent", history: [] }] }), "utf8");
    const out = optOutLead("ramesh@x.in", { domain: "insurance", ledgerPath });
    assert.strictEqual(out.ok, true);
    const summary = getSummary({ domain: "insurance", ledgerPath });
    assert.strictEqual(summary.optedOut, 1);
    assert.strictEqual(summary.sent, 1);
  });

  // ---- parity helpers ----
  test("extractEmail + detectSegments parity with insurance", () => {
    assert.strictEqual(extractEmail({ email: "Foo@BAR.in" }), "foo@bar.in");
    const segs = detectSegments({ businessName: "Sharma Traders" }, getDomain("insurance"));
    assert.ok(segs.some((s) => s.segment === "business_owner"));
  });

  console.log(`\ngenericLeadGenEngine.test: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

run();
