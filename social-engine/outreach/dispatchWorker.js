/**
 * GARUDA Social Engine - Production Dispatch Worker
 * Principles:
 * - Executes ONLY FOUNDER_APPROVED leads.
 * - Message Immutability: Verifies SHA-256 hash before dispatch.
 * - Duplicate-Send Protection: Zero repeated outreach to the same profile.
 * - Truth Lock: Zero unverified claims or buzzwords.
 * - Human Gate: Auto-DM disabled; dry-run verification first.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const OutreachQueue = require('./outreachQueue');
const TruthVerifier = require('./truthVerifier');
const LeadDeduplication = require('../leads/leadDeduplication');
const SessionManager = require('../browser/sessionManager');
const FacebookAdapter = require('../platforms/facebook/facebookAdapter');
const HealthMonitor = require('../core/healthMonitor');

const LOG_FILE = path.join(__dirname, '..', '..', 'logs', 'social-engine.log');

function logEvent(level, message, metadata = {}) {
  const ts = new Date().toISOString();
  const sanitized = { ...metadata };
  delete sanitized.cookies;
  delete sanitized.headers;
  delete sanitized.tokens;

  const line = `[${ts}] [${level.toUpperCase()}] ${message} ${Object.keys(sanitized).length ? JSON.stringify(sanitized) : ''}\n`;
  try {
    fs.mkdirSync(path.dirname(LOG_FILE), { recursive: true });
    fs.appendFileSync(LOG_FILE, line, 'utf8');
  } catch (_) {}
  console.log(`[${level.toUpperCase()}] ${message}`);
}

class DispatchWorker {
  constructor(options = {}) {
    this.options = options;
    this.queue = new OutreachQueue(options.queueFile);
    this.dedup = new LeadDeduplication(options.dedupFile);
  }

  /**
   * Process all currently approved leads
   * @param {object} params
   * @param {boolean} params.dryRun - When true, validates everything without sending real messages
   * @param {string|null} params.targetQueueId - Optional filter to dispatch only a specific lead
   * @returns {Promise<object>}
   */
  async processApproved({ dryRun = true, targetQueueId = null } = {}) {
    logEvent('info', `Starting Dispatch Worker (DryRun: ${dryRun})`);

    const approvedItems = this.queue.getFounderApproved();
    const candidateItems = targetQueueId 
      ? approvedItems.filter(i => i.queueId === targetQueueId || i.lead?.leadId === targetQueueId)
      : approvedItems;

    const summary = {
      dryRun,
      totalEligible: candidateItems.length,
      processed: 0,
      sent: 0,
      alreadySent: 0,
      truthBlocked: 0,
      immutabilityViolations: 0,
      failed: 0,
      unknown: 0,
      results: []
    };

    if (candidateItems.length === 0) {
      logEvent('info', 'No FOUNDER_APPROVED records eligible for dispatch.');
      return summary;
    }

    for (const item of candidateItems) {
      summary.processed++;
      const { queueId, lead, pitch, messageHash } = item;
      logEvent('info', `Evaluating lead ${queueId} (${lead.name})`);

      // 1. Message Immutability Check
      const currentHash = crypto.createHash('sha256').update(pitch).digest('hex');
      if (messageHash && currentHash !== messageHash) {
        logEvent('warn', `Immutability violation for ${queueId}: message modified after approval. Resetting to AWAITING_APPROVAL.`);
        this.queue.editPitch(queueId, pitch); // resets to AWAITING_APPROVAL
        summary.immutabilityViolations++;
        summary.results.push({ queueId, status: 'IMMUTABILITY_RESET', lead: lead.name });
        continue;
      }

      // 2. Duplicate-Send Protection
      const identity = lead.profileUrl || lead.username || lead.name;
      if (this.dedup.isAlreadyContacted(lead.platform, identity)) {
        logEvent('warn', `Duplicate send detected: ${lead.name} already contacted on ${lead.platform}. Marking ALREADY_SENT.`);
        this.queue.markAlreadySent(queueId, { reason: 'Identity exists in contacted index' });
        summary.alreadySent++;
        summary.results.push({ queueId, status: 'ALREADY_SENT', lead: lead.name });
        continue;
      }

      // 3. Truth Lock Verification
      const truthCheck = await TruthVerifier.verifyMessage(pitch, lead);
      if (!truthCheck.verified) {
        logEvent('warn', `Truth lock failed for ${queueId}: ${truthCheck.reason}`);
        item.status = 'TRUTH_VERIFICATION_REQUIRED';
        item.truthLockError = truthCheck.reason;
        this.queue._saveQueue();
        summary.truthBlocked++;
        summary.results.push({ queueId, status: 'TRUTH_VERIFICATION_REQUIRED', reason: truthCheck.reason });
        continue;
      }

      // 4. Dispatch Handling (DRY-RUN vs REAL)
      if (dryRun) {
        // DRY RUN: Simulate successful verification without sending actual network message
        const simulatedEvidence = {
          mode: 'DRY_RUN',
          verifiedAt: new Date().toISOString(),
          simulatedHash: crypto.createHash('sha256').update(`${queueId}:${pitch}`).digest('hex')
        };

        logEvent('info', `[DRY-RUN] Pre-dispatch verification PASSED for ${lead.name}. Real message NOT sent.`);
        summary.sent++;
        summary.results.push({
          queueId,
          status: 'DRY_RUN_VERIFIED',
          lead: lead.name,
          platform: lead.platform,
          pitchSample: pitch.slice(0, 100),
          evidence: simulatedEvidence
        });
      } else {
        // REAL DISPATCH (Only executed when dryRun === false and explicitly Founder-Approved)
        this.queue.markDispatching(queueId);
        logEvent('info', `Executing real dispatch for ${lead.name} on ${lead.platform}`);

        if (lead.platform === 'facebook') {
          const fbCookies = [];
          if (process.env.FB_C_USER && process.env.FB_XS) {
            fbCookies.push(
              { name: 'c_user', value: process.env.FB_C_USER.trim(), domain: '.facebook.com', path: '/' },
              { name: 'xs', value: process.env.FB_XS.trim(), domain: '.facebook.com', path: '/' }
            );
          }

          const fbHealth = new HealthMonitor('facebook');
          const fbSession = new SessionManager('facebook', { headless: 'new' });

          try {
            const initRes = await fbSession.initializeSession(fbCookies);
            if (!initRes.success) {
              throw new Error(initRes.error || initRes.reason || 'FB session initialization failed');
            }

            const adapter = new FacebookAdapter(fbSession, fbHealth);
            const sendRes = await adapter.sendDirectMessage(initRes.page, lead.profileUrl, pitch);

            if (sendRes.status === 'SENT') {
              const dispatchEvidence = {
                dispatchedBy: 'GARUDA_DISPATCH_WORKER',
                timestamp: sendRes.timestamp,
                evidenceHash: crypto.createHash('sha256').update(`${queueId}:${sendRes.timestamp}`).digest('hex')
              };
              this.dedup.recordContacted(lead.platform, identity, { queueId, leadId: lead.leadId });
              this.queue.markSent(queueId, dispatchEvidence);
              summary.sent++;
              summary.results.push({ queueId, status: 'SENT', lead: lead.name, evidence: dispatchEvidence });
              logEvent('info', `Dispatch confirmed for ${lead.name}`);
            } else if (sendRes.status === 'DISPATCH_UNKNOWN') {
              this.queue.markUnknown(queueId, { reason: sendRes.reason });
              summary.unknown++;
              summary.results.push({ queueId, status: 'DISPATCH_UNKNOWN', lead: lead.name, reason: sendRes.reason });
              logEvent('warn', `Dispatch outcome uncertain for ${lead.name}: ${sendRes.reason}. Stopped without retry.`);
            } else {
              this.queue.markFailed(queueId, { reason: sendRes.reason });
              summary.failed++;
              summary.results.push({ queueId, status: 'FAILED', lead: lead.name, reason: sendRes.reason });
              logEvent('error', `Dispatch failed for ${lead.name}: ${sendRes.reason}`);
            }
          } catch (err) {
            logEvent('error', `Dispatch error for ${lead.name}: ${err.message}`);
            this.queue.markFailed(queueId, { error: err.message });
            summary.failed++;
            summary.results.push({ queueId, status: 'FAILED', lead: lead.name, error: err.message });
          } finally {
            await fbSession.closeSession();
          }
        } else {
          // Unsupported platform for direct DM
          this.queue.markFailed(queueId, { reason: `Direct dispatch not supported on platform: ${lead.platform}` });
          summary.failed++;
          summary.results.push({ queueId, status: 'FAILED', lead: lead.name, reason: 'PLATFORM_UNSUPPORTED' });
        }
      }
    }

    logEvent('info', 'Dispatch Worker run completed', summary);
    return summary;
  }
}

module.exports = DispatchWorker;
