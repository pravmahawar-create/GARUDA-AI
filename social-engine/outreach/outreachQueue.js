/**
 * GARUDA Social Engine - Outreach Queue
 * Manages pending outreach tasks, Founder approval workflows, and status tracking.
 * Principles:
 * - 100% Human-gated: No auto-DM.
 * - Message Immutability: SHA-256 hash locked at approval.
 * - Truth First: Verified delivery states (FOUNDER_APPROVED, DISPATCHING, SENT, FAILED, DISPATCH_UNKNOWN, ALREADY_SENT).
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const ApprovalGate = require('./approvalGate');

class OutreachQueue {
  constructor(queueFilePath = null) {
    this.queueFile = queueFilePath || path.join(__dirname, '..', '..', 'data', 'leads', 'social_outreach_queue.json');
    const dir = path.dirname(this.queueFile);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    this.queue = this._loadQueue();
  }

  _loadQueue() {
    if (fs.existsSync(this.queueFile)) {
      try {
        return JSON.parse(fs.readFileSync(this.queueFile, 'utf8'));
      } catch (_) {
        return [];
      }
    }
    return [];
  }

  _saveQueue() {
    try {
      fs.writeFileSync(this.queueFile, JSON.stringify(this.queue, null, 2), 'utf8');
    } catch (err) {
      console.error('[OutreachQueue] Failed to save queue:', err.message);
    }
  }

  enqueue({ lead, pitch, platformHealthy = true, rateLimitAvailable = true }) {
    const gateResult = ApprovalGate.evaluate({
      lead,
      pitch,
      platformHealthy,
      rateLimitAvailable,
      autoAllowedEnabled: false // Strict governance: Always mandate human approval
    });

    const queueItem = {
      queueId: `outreach_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      lead,
      pitch,
      gateStatus: gateResult.status,
      gateReason: gateResult.reason,
      status: 'AWAITING_APPROVAL',
      createdAt: new Date().toISOString(),
      approvedAt: null,
      approvedBy: null,
      messageHash: null,
      dispatchedAt: null,
      deliveryEvidence: null
    };

    this.queue.push(queueItem);
    this._saveQueue();
    return queueItem;
  }

  getPendingApproval() {
    this.queue = this._loadQueue();
    return this.queue.filter(i => i.status === 'AWAITING_APPROVAL' || i.status === 'PENDING_APPROVAL');
  }

  getFounderApproved(platform = null) {
    this.queue = this._loadQueue();
    return this.queue.filter(i => {
      const matchStatus = i.status === 'FOUNDER_APPROVED';
      const matchPlatform = platform ? i.lead.platform === platform : true;
      return matchStatus && matchPlatform;
    });
  }

  getReadyForDispatch(platform = null) {
    // Backward compatibility alias for getFounderApproved
    return this.getFounderApproved(platform);
  }

  /**
   * Explicit Founder Approval for a specific lead
   * @param {string} queueId
   * @param {string} actor
   * @returns {{ success: boolean, item?: object, error?: string }}
   */
  approve(queueId, actor = 'founder_praveen') {
    const item = this.queue.find(i => i.queueId === queueId || i.lead?.leadId === queueId);
    if (!item) {
      return { success: false, error: `Queue item not found for identifier: ${queueId}` };
    }

    if (item.status !== 'AWAITING_APPROVAL' && item.status !== 'PENDING_APPROVAL') {
      return { success: false, error: `Cannot approve item with status: ${item.status}` };
    }

    item.status = 'FOUNDER_APPROVED';
    item.approvedAt = new Date().toISOString();
    item.approvedBy = actor;
    // Lock message immutability with SHA-256 hash
    item.messageHash = crypto.createHash('sha256').update(item.pitch).digest('hex');

    this._saveQueue();
    return { success: true, item };
  }

  reject(queueId, reason = 'REJECTED_BY_FOUNDER', actor = 'founder_praveen') {
    const item = this.queue.find(i => i.queueId === queueId || i.lead?.leadId === queueId);
    if (!item) {
      return { success: false, error: `Queue item not found: ${queueId}` };
    }

    item.status = 'REJECTED';
    item.rejectedAt = new Date().toISOString();
    item.rejectedBy = actor;
    item.rejectionReason = reason;

    this._saveQueue();
    return { success: true, item };
  }

  editPitch(queueId, newPitch) {
    const item = this.queue.find(i => i.queueId === queueId || i.lead?.leadId === queueId);
    if (!item) {
      return { success: false, error: `Queue item not found: ${queueId}` };
    }

    item.pitch = newPitch;
    // Any edit voids previous approval and resets to AWAITING_APPROVAL
    item.status = 'AWAITING_APPROVAL';
    item.approvedAt = null;
    item.approvedBy = null;
    item.messageHash = null;
    item.editedAt = new Date().toISOString();

    this._saveQueue();
    return { success: true, item };
  }

  markDispatching(queueId) {
    const item = this.queue.find(i => i.queueId === queueId);
    if (item) {
      item.status = 'DISPATCHING';
      item.dispatchStartedAt = new Date().toISOString();
      this._saveQueue();
      return true;
    }
    return false;
  }

  markSent(queueId, evidence = {}) {
    const item = this.queue.find(i => i.queueId === queueId);
    if (item) {
      item.status = 'SENT';
      item.dispatchedAt = new Date().toISOString();
      item.deliveryEvidence = evidence;
      this._saveQueue();
      return true;
    }
    return false;
  }

  markFailed(queueId, errorDetails = {}) {
    const item = this.queue.find(i => i.queueId === queueId);
    if (item) {
      item.status = 'FAILED';
      item.failedAt = new Date().toISOString();
      item.error = errorDetails;
      this._saveQueue();
      return true;
    }
    return false;
  }

  markUnknown(queueId, details = {}) {
    const item = this.queue.find(i => i.queueId === queueId);
    if (item) {
      item.status = 'DISPATCH_UNKNOWN';
      item.unknownAt = new Date().toISOString();
      item.unknownDetails = details;
      this._saveQueue();
      return true;
    }
    return false;
  }

  markAlreadySent(queueId, priorEvidence = {}) {
    const item = this.queue.find(i => i.queueId === queueId);
    if (item) {
      item.status = 'ALREADY_SENT';
      item.alreadySentAt = new Date().toISOString();
      item.priorEvidence = priorEvidence;
      this._saveQueue();
      return true;
    }
    return false;
  }

  markDispatched(queueId, resultDetails = {}) {
    // Backward compatibility wrapper
    return this.markSent(queueId, resultDetails);
  }
}

module.exports = OutreachQueue;
