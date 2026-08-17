// GARUDA Revenue Operating Cycle Service
//
// Recurring governed operating cycle that ties together:
//   1. Continuous discovery (opportunityDiscoveryService.runDiscoveryCycle)
//   2. Inbox polling / reply detection (garudaInboxService.pollInbox)
//   3. Follow-up processor (garudaInboxService.pendingFollowUps / sendFollowUp)
//   4. Opportunity state updates (opportunityService) from classified replies
//
// Governed rules (never violated):
//   - Max 2-3 follow-ups per priority band (see revenueValueModelService).
//   - LOW_VALUE / JUNK opportunities archive after no reply (history preserved).
//   - A reply stops further follow-ups; replies update opportunity state.
//   - Founder approval is required for any external action / send.
//
// DRY-RUN MODE: by default nothing is actually sent. Set
// REVENUE_OPERATING_CYCLE_DRYRUN=false + explicit founder approval to enable
// real sends. This implementation never auto-sends without approval.
const opportunityService = require("./opportunityService");
const inboxService = require("./garudaInboxService");
const revenueValueModel = require("./revenueValueModelService");

const DEFAULT_FOLLOWUP_WINDOW_DAYS = 3;

function isDryRun(options = {}) {
  const flag = options.dryRun !== undefined ? options.dryRun : String(process.env.REVENUE_OPERATING_CYCLE_DRYRUN || "true").toLowerCase() !== "false";
  return Boolean(flag);
}

function founderApproved(context = {}) {
  const value = context.founderApproved !== undefined ? context.founderApproved : context.founder_approved;
  return value === true || String(value || "").trim().toLowerCase() === "true";
}

function opportunityPriority(opp) {
  if (opp.priority) return opp.priority;
  if (opp.valueModel && opp.valueModel.bandPriority) return opp.valueModel.bandPriority;
  return "UNMEASURED";
}

// Apply a classified reply to an opportunity record (state transition). Never
// fabricates revenue or deal value.
function applyReplyToOpportunity(opp, reply = {}) {
  const intent = String(reply.intent || "unknown").toLowerCase();
  const patch = {
    outreach: {
      ...(opp.outreach || {}),
      lastReplyAt: reply.date || new Date().toISOString(),
      replyIntent: intent,
      followUpCount: opp.outreach?.followUpCount || 0
    }
  };
  if (intent === "no" || intent === "optout") {
    patch.outreach.replyIntent = intent;
    patch.outreach.archived = true;
    patch.outreach.archivedAt = reply.date || new Date().toISOString();
    patch.outreach.archiveReason = "replied_no_or_optout";
    patch.stage = "lost";
  } else if (intent === "interested") {
    patch.outreach.replyIntent = "interested";
    patch.stage = opp.stage === "prospect" ? "qualified" : opp.stage;
    patch.probability = Math.max(Number(opp.probability) || 0, 50);
  } else if (intent === "question") {
    patch.outreach.replyIntent = "question";
  }
  return patch;
}

// Process the inbox for replies and update both outreach ledgers and
// opportunity records. In dry-run mode the IMAP poll is not performed; a
// simulated outcome is returned so the cycle is verifiable.
async function runInboxPoll(options = {}) {
  const dryRun = isDryRun(options);
  if (dryRun) {
    return {
      ok: true,
      dryRun: true,
      processed: [],
      note: "Inbox polling skipped (dry-run). Set REVENUE_OPERATING_CYCLE_DRYRUN=false to enable real IMAP polling."
    };
  }
  if (!inboxService.isConfigured()) {
    return { ok: false, dryRun: false, processed: [], error: "GARUDA_EMAIL_USER/PASS not configured" };
  }
  const result = await inboxService.pollInbox({ maxEmails: options.maxEmails });
  const processed = Array.isArray(result.processed) ? result.processed : [];
  for (const record of processed) {
    if (!record.matched) continue;
    const opps = await opportunityService.listOpportunities({});
    for (const opp of opps) {
      const clientName = String(opp.client || "").toLowerCase();
      const emailName = String(record.email || "").split("@")[0].toLowerCase();
      if (clientName.includes(emailName) || emailName.includes(clientName)) {
        const patch = applyReplyToOpportunity(opp, { intent: record.intent, date: record.date });
        await opportunityService.updateOpportunity(opp.id, patch);
      }
    }
  }
  return result;
}

// Find opportunities that are due for a follow-up based on their priority band
// and outreach history. Returns a list of candidate follow-up actions.
async function pendingOpportunityFollowUps(now = new Date()) {
  const opps = await opportunityService.listOpportunities({});
  const due = [];
  const DAY = 24 * 60 * 60 * 1000;
  for (const opp of opps) {
    const outreach = opp.outreach || {};
    if (outreach.archived) continue;
    if (outreach.replyIntent === "no" || outreach.replyIntent === "optout" || opp.stage === "lost") continue;
    if (outreach.lastReplyAt) continue;
    const priority = opportunityPriority(opp);
    const maxFollowUps = revenueValueModel.maxFollowUpsFor(priority);
    const sentCount = outreach.followUpCount || (outreach.firstOutreachAt ? 1 : 0);
    if (sentCount >= maxFollowUps) continue;
    const sentAt = outreach.firstOutreachAt || outreach.lastFollowUpAt;
    if (!sentAt) continue;
    const waitFor = (sentCount) * DEFAULT_FOLLOWUP_WINDOW_DAYS * DAY;
    if (now.getTime() - new Date(sentAt).getTime() >= waitFor) {
      due.push({
        opportunityId: opp.id,
        title: opp.title,
        priority,
        step: sentCount + 1,
        maxFollowUps,
        firstOutreachAt: sentAt,
        sinceDays: Math.round((now.getTime() - new Date(sentAt).getTime()) / DAY)
      });
    }
  }
  return due;
}

// Archive opportunities that have exhausted their band's follow-up cap and
// received no reply. Only bands whose revenueValueModel PRIORITY_BANDS entry has
// archiveOnExhaustion=true are archived (LOW_VALUE, LOW, NORMAL); higher-value
// bands (HIGH/VERY_HIGH/STRATEGIC) are never archived merely for age. History is
// preserved (archive is reversible; nothing is deleted).
async function archiveExhaustedLowValue(now = new Date()) {
  const opps = await opportunityService.listOpportunities({});
  const archived = [];
  for (const opp of opps) {
    const outreach = opp.outreach || {};
    if (outreach.archived) continue;
    if (outreach.replyIntent || opp.stage === "lost") continue;
    const priority = opportunityPriority(opp);
    const band = revenueValueModel.PRIORITY_BANDS.find((b) => b.priority === priority);
    if (!band || band.archiveOnExhaustion !== true) continue;
    const maxFollowUps = revenueValueModel.maxFollowUpsFor(priority);
    const sentCount = outreach.followUpCount || (outreach.firstOutreachAt ? 1 : 0);
    if (sentCount >= maxFollowUps) {
      await opportunityService.updateOpportunity(opp.id, {
        outreach: { ...outreach, archived: true, archivedAt: now.toISOString(), archiveReason: "no_reply_exhausted_followups" }
      });
      archived.push({ opportunityId: opp.id, title: opp.title, priority });
    }
  }
  return archived;
}

// Execute pending follow-ups. In dry-run mode returns what WOULD be sent.
// Real sends require founder approval + dry-run disabled.
async function runFollowUpProcessor(options = {}) {
  const dryRun = isDryRun(options);
  const due = await pendingOpportunityFollowUps(options.now || new Date());
  const dry = dryRun || !founderApproved(options);
  const results = [];
  for (const item of due) {
    if (dry) {
      results.push({ ...item, mode: dryRun ? "dry_run" : "founder_approval_required" });
      continue;
    }
    const sent = await inboxService.sendFollowUp(null, item.title, item.step);
    results.push({ ...item, mode: "sent", accepted: sent.ok });
    if (sent.ok) {
      await opportunityService.updateOpportunity(item.opportunityId, {
        outreach: { followUpCount: item.step, lastFollowUpAt: new Date().toISOString(), firstOutreachAt: item.firstOutreachAt || new Date().toISOString() }
      });
    }
  }
  return { dryRun: dry, processed: results };
}

// The full recurring operating cycle.
async function runRevenueOperatingCycle(options = {}) {
  const dryRun = isDryRun(options);
  const now = options.now || new Date();
  const [discovery, inbox, followUps, archivedLowValue] = await Promise.all([
    require("./opportunityDiscoveryService").runDiscoveryCycle(options).catch((error) => ({ error: error.message })),
    runInboxPoll(options).catch((error) => ({ ok: false, error: error.message })),
    runFollowUpProcessor(options).catch((error) => ({ dryRun: true, error: error.message, processed: [] })),
    archiveExhaustedLowValue(now).catch((error) => ({ error: error.message }))
  ]);

  return {
    dryRun,
    cycleAt: now.toISOString(),
    discovery,
    inbox,
    followUps,
    archivedLowValue,
    governance: {
      dryRunMode: dryRun,
      founderApprovalRequiredForSends: true
    }
  };
}

module.exports = {
  DEFAULT_FOLLOWUP_WINDOW_DAYS,
  applyReplyToOpportunity,
  archiveExhaustedLowValue,
  founderApproved,
  isDryRun,
  pendingOpportunityFollowUps,
  runFollowUpProcessor,
  runInboxPoll,
  runRevenueOperatingCycle
};