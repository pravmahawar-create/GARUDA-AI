// GARUDA Revenue Scheduler — run daily (or via cron) to:
//   1. Poll Gmail inbox for outreach replies
//   2. Update lead status + alert founder (Telegram)
//   3. Send due follow-ups (2 max per lead)
//   4. Print revenue loop summary
//
// Usage: npm run revenue:scheduler   [-- --dry-run]
require("dotenv").config();
const inboxService = require("../src/services/garudaInboxService");
const telegramBotService = require("../src/services/telegramBotService");

const DRY_RUN = process.argv.includes("--dry-run");

async function main() {
  const lines = [];
  const log = (s) => { lines.push(s); console.log(s); };

  log(`[REVENUE] dry-run=${DRY_RUN} time=${new Date().toISOString()}`);

  if (!inboxService.isConfigured()) {
    log("[REVENUE] GARUDA_EMAIL_USER/PASS not configured — inbox polling skipped.");
  } else if (DRY_RUN) {
    log("[REVENUE] dry-run: inbox poll skipped (set --dry-run off to connect IMAP).");
  } else {
    const poll = await inboxService.pollInbox({ maxEmails: 25 });
    log(`[REVENUE] inbox poll -> ok=${poll.ok} processed=${poll.processed.length}`);
    if (poll.error) log(`[REVENUE] inbox error: ${poll.error}`);
    for (const r of poll.processed) {
      log(`  INBOX ${r.intent.toUpperCase()} | ${r.email} | ${r.matched ? "LEAD:" + (r.domain || "?") + "/" + (r.leadStatus || "?") : "unmatched"} | ${r.subject.slice(0, 60)}`);
    }

    // Alert founder of any new interested replies.
    const interested = poll.processed.filter((r) => r.intent === "interested" && r.matched);
    for (const r of interested) {
      try {
        await telegramBotService.sendFounderAlert(
          "GARUDA — Interested Reply",
          `Email: ${r.email}\nDomain: ${r.domain}\nMessage: ${(r.snippet || "").slice(0, 300)}\n\nReply se deal karo — public chat / email follow-up ready hai.`
        );
      } catch {}
    }
  }

  // Follow-ups: only in real mode.
  if (!DRY_RUN) {
    const due = inboxService.pendingFollowUps();
    log(`[REVENUE] follow-ups due: ${due.length}`);
    for (const d of due) {
      const sent = await inboxService.sendFollowUp(d.email, d.domain, d.step);
      log(`  FOLLOWUP step${d.step} | ${d.email} (${d.domain}) | ${sent.ok ? "SENT" : sent.reason}`);
      if (sent.ok) {
        try {
          await telegramBotService.sendFounderAlert("GARUDA — Follow-up Sent", `${d.email} (${d.domain}) follow-up #${d.step}`);
        } catch {}
      }
    }
  } else {
    const due = inboxService.pendingFollowUps();
    log(`[REVENUE] follow-ups due (dry-run): ${due.length}`);
    for (const d of due) log(`  DUE step${d.step} | ${d.email} (${d.domain}) | ${d.sinceDays} days since sent`);
  }

  // Pipeline summary.
  try {
    const fs = require("fs");
    const leadGenEngine = require("../src/services/leadgen/genericLeadGenEngine");
    const domains = ["hotel", "restaurant", "gym", "education", "clinic"];
    let total = 0;
    for (const d of domains) {
      const p = leadGenEngine.getPipeline({ domain: d });
      total += p.total || 0;
      if ((p.total || 0) > 0) log(`  PIPELINE ${d}: ${p.total} prospects (${p.hot} HOT)`);
    }
    log(`[REVENUE] pipeline total: ${total}`);
  } catch {}

  return lines.join("\n");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("[REVENUE] FATAL:", e && e.message ? e.message : e);
    process.exit(1);
  });
