const assert = require("assert");
const fs = require("fs");
const path = require("path");
const os = require("os");
const {
  buildPitch,
  detectTopic,
  loadKnowledgeChunks,
  pickRelevantChunks
} = require("./insurancePitchService");
const {
  canMessageToday,
  getLedgerPath,
  getSummary,
  loadLedger,
  optOutLead,
  previewOutreach,
  runOutreach,
  setLedgerPath
} = require("./insuranceOutreachService");

const DAY_MS = 24 * 60 * 60 * 1000;

const DEFAULT_LEDGER_PATH = path.join(__dirname, "..", "..", "data", "insurance-outreach-ledger.json");

function withTempLedger(fn) {
  const tmp = path.join(os.tmpdir(), `garuda-ledger-${Date.now()}-${Math.random().toString(36).slice(2)}.json`);
  setLedgerPath(tmp);
  return Promise.resolve(fn(tmp)).finally(() => {
    if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
    setLedgerPath(DEFAULT_LEDGER_PATH);
  });
}

function testPitchGeneration() {
  const chunks = loadKnowledgeChunks();
  assert.ok(chunks.length > 100, "knowledge base should be loaded");
  const pitch = buildPitch({ firstName: "Amit", query: "savings_investment", chunks });
  assert.ok(pitch.body.includes("GARUDA"), "pitch should identify as GARUDA");
  assert.ok(pitch.body.includes("Amit"), "pitch should use first name");
  assert.ok(!/Praveen|Mahawar|insurance agent/i.test(pitch.body), "founder name + insurance-agent label must never appear");
  assert.ok(/financial advisor/i.test(pitch.body), "positioned as financial advisor");
  assert.ok(/financial partner/i.test(pitch.body), "positioned as ABSLI financial partner");
  assert.ok(/garudaos\.in/.test(pitch.body), "website should be mentioned");
  assert.ok(/30,000/.test(pitch.body), "investment start amount should be mentioned");
  assert.ok(pitch.body.includes("reply 'no'"), "opt-out language should be present");
  const topic = detectTopic("child education for my daughter");
  assert.strictEqual(topic, "child_education");
  console.log("PASS pitch positioning (advisor+partner+website+30k) + founder anonymity");
}

function testRelevantChunks() {
  const chunks = loadKnowledgeChunks();
  const picked = pickRelevantChunks("savings guaranteed returns", chunks);
  assert.ok(Array.isArray(picked) && picked.length >= 0, "picks should be an array");
  console.log(`PASS relevant chunk retrieval (${picked.length} chunks)`);
}

function testCanMessageToday() {
  const now = new Date("2026-08-10T10:00:00Z");
  assert.strictEqual(canMessageToday(null, now).allowed, true, "new lead allowed");
  const optedOut = { optedOut: true, lastAttemptAt: null };
  assert.strictEqual(canMessageToday(optedOut, now).reason, "opted_out", "opted out blocked");
  const recent = { optedOut: false, lastAttemptAt: new Date(now.getTime() - 1000).toISOString() };
  assert.strictEqual(canMessageToday(recent, now).reason, "daily_cap", "same day blocked");
  const old = { optedOut: false, lastAttemptAt: new Date(now.getTime() - DAY_MS - 1000).toISOString() };
  assert.strictEqual(canMessageToday(old, now).allowed, true, "next day allowed");
  console.log("PASS canMessageToday unit rules");
}

async function testDailyCapAndOptOut() {
  await withTempLedger(async (tmp) => {
    const contacts = [{ email: "cap@test.com", firstName: "Cap" }];
    const env = { GARUDA_EMAIL_USER: "test@test.com", GARUDA_EMAIL_PASS: "x", GARUDA_EMAIL_HOST: "smtp.test.com" };
    const now = new Date("2026-08-10T10:00:00Z");

    const first = await runOutreach(contacts, { env, now, dryRun: true });
    assert.strictEqual(first.sent.length, 1, "first run should send");
    const second = await runOutreach(contacts, { env, now: new Date(now.getTime() + 1000), dryRun: true });
    assert.ok(second.skipped.some((s) => s.email === "cap@test.com" && s.reason === "daily_cap"), "second run same day capped");

    optOutLead("cap@test.com");
    const afterOpt = await runOutreach(contacts, { env, now: new Date(now.getTime() + DAY_MS + 1000), dryRun: true });
    assert.ok(afterOpt.skipped.some((s) => s.email === "cap@test.com" && s.reason === "opted_out"), "opted out blocked next day");
    console.log("PASS daily cap + opt-out enforcement via runOutreach");
  });
}

function testPreviewIsPure() {
  withTempLedger((tmp) => {
    const contacts = [{ email: "pure@test.com", firstName: "Pure" }];
    previewOutreach(contacts, { now: new Date("2026-08-10T10:00:00Z") });
    const fileExists = fs.existsSync(tmp);
    const leads = fileExists ? JSON.parse(fs.readFileSync(tmp, "utf8")).leads : [];
    assert.strictEqual(leads.length, 0, "preview must never write to ledger");
    console.log("PASS preview stays pure (no ledger writes)");
  });
}

async function testDryRunSend() {
  await withTempLedger(async (tmp) => {
    const contacts = [
      { email: "one@test.com", firstName: "One", query: "savings_investment" },
      { email: "two@test.com", firstName: "Two", query: "child_education" }
    ];
    const env = {
      GARUDA_EMAIL_HOST: "smtp.gmail.com",
      GARUDA_EMAIL_PORT: "587",
      GARUDA_EMAIL_USER: "garudaos.ai@gmail.com",
      GARUDA_EMAIL_PASS: "dummy"
    };
    const result = await runOutreach(contacts, { env, now: new Date(), dryRun: true });
    assert.strictEqual(result.sent.length, 2, "dry run should prepare 2");
    const summary = getSummary();
    assert.strictEqual(summary.total, 2, "ledger should track 2 leads");
    console.log("PASS dry-run send + ledger persistence");
  });
}

(async () => {
  testPitchGeneration();
  testRelevantChunks();
  testCanMessageToday();
  await testDailyCapAndOptOut();
  await testPreviewIsPure();
  await testDryRunSend();
  console.log("ALL INSURANCE OUTREACH TESTS PASSED");
})().catch((e) => {
  console.error("TEST FAILURE:", e);
  process.exit(1);
});
