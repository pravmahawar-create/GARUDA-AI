/**
 * GARUDA Social Engine - Human Approval Gate
 * Principle: When uncertain, mandate human approval before dispatch.
 */

class ApprovalGate {
  /**
   * Evaluate whether an outreach action requires human intervention
   * @param {object} params
   * @param {object} params.lead
   * @param {string} params.pitch
   * @param {boolean} params.platformHealthy
   * @param {boolean} params.rateLimitAvailable
   * @returns {{ status: 'AUTO_ALLOWED' | 'HUMAN_APPROVAL_REQUIRED' | 'BLOCKED', reason: string }}
   */
  static evaluate({ lead, pitch, platformHealthy, rateLimitAvailable, autoAllowedEnabled = false }) {
    if (!platformHealthy) {
      return { status: 'BLOCKED', reason: 'Platform health degraded or security challenge active' };
    }

    if (!rateLimitAvailable) {
      return { status: 'BLOCKED', reason: 'Rate limit ceiling reached or in cooldown' };
    }

    if (!lead || !lead.profileUrl) {
      return { status: 'BLOCKED', reason: 'Invalid or missing lead profile URL' };
    }

    if (lead.confidence < 70) {
      return { status: 'HUMAN_APPROVAL_REQUIRED', reason: `Lead extraction confidence below auto threshold (${lead.confidence} < 70)` };
    }

    if (!pitch || pitch.length < 20) {
      return { status: 'BLOCKED', reason: 'Empty or invalid pitch message' };
    }

    // Default policy: In production, autoAllowedEnabled is false -> mandatory human approval gate
    if (autoAllowedEnabled && lead.confidence >= 85 && lead.status === 'VERIFIED') {
      return { status: 'AUTO_ALLOWED', reason: 'Lead verified with high confidence' };
    }

    return { status: 'HUMAN_APPROVAL_REQUIRED', reason: 'Mandatory Founder human approval gate (Auto-DM Disabled)' };
  }
}

module.exports = ApprovalGate;
