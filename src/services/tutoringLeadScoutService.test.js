// GARUDA Tutoring Lead Scout Service tests.
// Proves the background web-research job: extracts emails from pages, dedupes,
// and writes scored prospects into the tutoring pipeline - without any network.

const path = require("path");
const fs = require("fs");
const os = require("os");
const assert = require("assert");

const scout = require("./tutoringLeadScoutService");
const router = require("./garudaCommandRouter");

const WORKDIR = fs.mkdtempSync(path.join(os.tmpdir(), "garuda-tutoring-test-"));
process.env.TUTORING_SCAN_STATUS_PATH = path.join(WORKDIR, "scan-status.json");

async function run() {
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

  async function testAsync(name, fn) {
    try {
      await fn();
      passed += 1;
      console.log(`  ok  ${name}`);
    } catch (error) {
      failed += 1;
      console.log(`  xx  ${name}: ${error.stack || error.message}`);
    }
  }

  // ---- extractEmails ----
  test("extractEmails finds mailto and plain emails, skips images/junk", () => {
    const html = `
      <html><body>
        <a href="mailto:info@brightmaths.com">Email</a>
        <p>Reach us at hello@kidsacademy.org or admin@tutoringhub.net.</p>
        <img src="x@example.com.png">
        <script>var a="script@junk.js";</script>
      </body></html>`;
    const emails = scout.extractEmails(html);
    assert.ok(emails.includes("info@brightmaths.com"), "mailto extracted");
    assert.ok(emails.includes("hello@kidsacademy.org"), "plain email extracted");
    assert.ok(emails.includes("admin@tutoringhub.net"), "second email extracted");
    assert.ok(!emails.some((e) => /\.png/.test(e)), "image emails skipped");
    assert.ok(!emails.some((e) => e.includes("script@junk.js")), "script emails skipped");
  });

  // ---- parseDuckDuckGoHtml ----
  test("parseDuckDuckGoHtml extracts result links from HTML", () => {
    const html = `
      <div class="result">
        <a class="result__a" href="//duckduckgo.com/l/?uddg=https%3A%2F%2Fwww.mathnasium.com%2F&rut=abc">Mathnasium</a>
      </div>
      <div class="result">
        <a class="result__a" href="//duckduckgo.com/l/?uddg=https%3A%2F%2Fwww.kumon.com%2F&rut=xyz">Kumon</a>
      </div>`;
    const results = scout.parseDuckDuckGoHtml(html);
    assert.strictEqual(results.length, 2, "two results parsed");
    assert.ok(results.some((r) => r.url.includes("mathnasium.com")), "first url decoded");
    assert.ok(results.some((r) => r.url.includes("kumon.com")), "second url decoded");
  });

  // ---- buildQueries ----
  test("buildQueries covers both locations", () => {
    assert.ok(scout.buildQueries("usa").length > 0);
    assert.ok(scout.buildQueries("dubai").length > 0);
    assert.ok(scout.buildQueries("usa").every((q) => q.includes("USA")));
    assert.ok(scout.buildQueries("dubai").every((q) => q.includes("UAE")));
  });

  // ---- runTutoringScanOnce with stubbed search + fetch ----
  await testAsync("scan finds emails and writes prospects to pipeline (stubbed, no network)", async () => {
    const prospectsPath = path.join(WORKDIR, "tutoring-prospects.json");
    const contactsPath = path.join(WORKDIR, "tutoring-contacts.csv");
    const ledgerPath = path.join(WORKDIR, "tutoring-outreach-ledger.json");

    const searchFn = async () => [
      { title: "Bright Maths Tutoring Center", url: "https://www.brightmaths.example.com/" },
      { title: "Kids Academy Learning Hub", url: "https://www.kidsacademy.example.com/" }
    ];
    const fetchFn = async (url) => {
      if (url.includes("/contact")) {
        return { ok: true, html: '<p>team@kidsacademy.example.org</p>' };
      }
      if (url.includes("brightmaths")) {
        return { ok: true, html: '<a href="mailto:info@brightmaths.example.com">Contact</a><p>admin@brightmaths.example.com</p>' };
      }
      if (url.includes("kidsacademy")) {
        return { ok: true, html: '<p>Email hello@kidsacademy.example.org</p><a href="/contact">Contact</a>' };
      }
      return { ok: false, status: 404 };
    };

    const result = await scout.runTutoringScanOnce({
      location: "usa",
      maxSites: 5,
      delayMs: 0,
      notifyFounder: false,
      searchFn,
      fetchFn,
      prospectsPath,
      contactsPath,
      ledgerPath
    });

    assert.strictEqual(result.running, false, "scan finishes");
    assert.ok(result.scanned >= 2, "two sites scanned");
    assert.ok(result.emailsFound >= 3, "found at least 3 emails across home+contact pages");
    assert.ok(result.sources.length >= 2, "two sources recorded");

    const store = JSON.parse(fs.readFileSync(prospectsPath, "utf8"));
    const emails = store.prospects.map((p) => p.email);
    assert.ok(emails.includes("info@brightmaths.example.com"), "mailto email persisted");
    assert.ok(emails.includes("admin@brightmaths.example.com"), "plain email persisted");
    assert.ok(emails.includes("team@kidsacademy.example.org"), "contact-page email persisted");
    assert.ok(store.prospects.every((p) => p.locale === "en"), "english locale for US leads");
    assert.ok(store.prospects.every((p) => p.country === "US"), "US country stamped");
  });

  // ---- status file reflects run ----
  await testAsync("getTutoringScanStatus returns real numbers after a run", async () => {
    const status = scout.getTutoringScanStatus();
    assert.ok(status.jobId, "job id recorded");
    assert.strictEqual(status.running, false, "not running after completion");
    assert.strictEqual(status.progress, "done", "progress done");
    assert.ok(status.scanned >= 2, "scanned count from status");
    assert.ok(status.emailsFound >= 3, "emails count from status");
  });

  // ---- router parseAmount ----
  test("parseAmount handles USD, AED and INR", () => {
    assert.deepStrictEqual(router.parseAmount("target $15"), { amount: 15, currency: "USD" });
    assert.deepStrictEqual(router.parseAmount("15 usd per class"), { amount: 15, currency: "USD" });
    assert.deepStrictEqual(router.parseAmount("60 AED"), { amount: 60, currency: "AED" });
    assert.deepStrictEqual(router.parseAmount("60 dirhams"), { amount: 60, currency: "AED" });
    assert.deepStrictEqual(router.parseAmount("5 lakh"), { amount: 500000, currency: "INR" });
  });

  // ---- detectCommand ----
  test("detectCommand routes tutoring request to tutoring_leads", () => {
    const det = router.detectCommand("sister class 8 maths tutor ke liye USA leads generate karke do");
    assert.strictEqual(det.command, "tutoring_leads");
    assert.strictEqual(det.params.location, "usa");
  });

  test("detectCommand routes dubai tutoring request to tutoring_leads", () => {
    const det = router.detectCommand("dubai mein tutoring leads dhoondo");
    assert.strictEqual(det.command, "tutoring_leads");
    assert.strictEqual(det.params.location, "dubai");
  });

  test("detectCommand routes pipeline and status", () => {
    assert.strictEqual(router.detectCommand("/pipeline").command, "pipeline");
    assert.strictEqual(router.detectCommand("pipeline status batao").command, "pipeline");
    assert.strictEqual(router.detectCommand("/status").command, "status");
    assert.strictEqual(router.detectCommand("current status").command, "status");
  });

  test("detectCommand still routes plain insurance leads to leadgen", () => {
    const det = router.detectCommand("insurance ke leads generate karo");
    assert.strictEqual(det.command, "leadgen");
  });

  test("detectCommand routes dollar/AED income target to income_goal", () => {
    const det = router.detectCommand("15 dollar ya 60 aed target hai");
    assert.strictEqual(det.command, "income_goal");
    assert.strictEqual(det.params.amount, 15);
    assert.strictEqual(det.params.currency, "USD");
  });

  // ---- income goal handler ----
  testAsync("handleIncomeGoal reports currency in the mission plan", async () => {
    const res = await router.handleIncomeGoal({ amount: 60, currency: "AED" }, { founderApproved: false });
    assert.strictEqual(res.command, "income_goal");
    assert.strictEqual(res.currency, "AED");
    assert.ok(res.message.includes("AED 60"), "message shows AED 60");
  });

  // ---- handlers ----
  await testAsync("handleTutoringLeads requires founder approval", async () => {
    const res = await router.handleTutoringLeads({ location: "usa" }, { founderApproved: false });
    assert.strictEqual(res.command, "tutoring_leads");
    assert.ok(res.message.includes("approval"), "mentions approval needed");
    assert.ok(!res.jobId, "no job started without approval");
  });

  await testAsync("handleStatus returns real status lines", async () => {
    const res = await router.handleStatus();
    assert.strictEqual(res.command, "status");
    assert.ok(res.message.includes("MongoDB"), "has mongo line");
    assert.ok(res.message.includes("Telegram"), "has telegram line");
    assert.ok(res.message.includes("worker"), "has worker line");
  });

  await testAsync("handlePipeline returns pipeline + tutoring scan lines", async () => {
    const res = await router.handlePipeline();
    assert.strictEqual(res.command, "pipeline");
    assert.ok(res.message.includes("PIPELINE"), "has pipeline header");
    assert.ok(res.message.includes("Tutoring"), "has tutoring scan line");
  });

  console.log(`\ntutoringLeadScoutService.test: ${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});