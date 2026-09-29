/**
 * GARUDA Pluggable Scout - Base Scout Architecture
 * Standard interface for all autonomous hunters (Social, Search, Conversation, Platform).
 */

const LeadQualification = require('../leads/leadQualification');
const LeadNormalizer = require('../leads/leadNormalizer');
const LeadDeduplication = require('../leads/leadDeduplication');
const StateStore = require('../persistence/stateStore');

class BaseScout {
  constructor(name, options = {}) {
    this.name = name;
    this.options = options;
    this.stateStore = new StateStore(options.metricsFile);
    this.dedup = new LeadDeduplication(options.dedupFile);
    this.isRunning = false;
    this.lastRunAt = null;
    this.status = 'IDLE'; // IDLE | RUNNING | PAUSED | RATE_LIMITED | SECURITY_BLOCKED | FAILED
  }

  /**
   * Abstract method to be implemented by specific scouts
   * @returns {Promise<Array<object>>} Raw discovered candidates
   */
  async discover() {
    throw new Error(`Scout [${this.name}] must implement discover()`);
  }

  /**
   * Standardized pipeline: DISCOVER -> EXTRACT -> NORMALIZE -> DEDUPLICATE -> QUALIFY -> REGISTER
   */
  async runCycle() {
    if (this.status === 'SECURITY_BLOCKED') {
      console.log(`[Scout:${this.name}] Halted: Status is SECURITY_BLOCKED. Zero circumvention allowed.`);
      return { status: 'SECURITY_BLOCKED', discovered: 0, qualified: 0 };
    }

    this.status = 'RUNNING';
    this.isRunning = true;
    this.lastRunAt = new Date().toISOString();

    const summary = {
      scout: this.name,
      timestamp: this.lastRunAt,
      discovered: 0,
      normalized: 0,
      duplicates: 0,
      qualified: 0,
      unqualified: 0,
      leads: []
    };

    try {
      console.log(`[Scout:${this.name}] Starting discovery cycle...`);
      const rawCandidates = await this.discover();
      summary.discovered = rawCandidates.length;
      this.stateStore.increment('leadsDiscovered', rawCandidates.length);

      for (const raw of rawCandidates) {
        // 1. Qualify Intent First
        const textToQualify = raw.snippet || raw.caption || raw.content || raw.requirement || '';
        const qualification = LeadQualification.qualify(textToQualify);

        // 2. Normalize to Canonical Lead
        const canonicalLead = LeadNormalizer.normalize(
          raw.platform || this.name.toLowerCase().replace('-scout', ''),
          raw,
          qualification.signals,
          {
            sourceType: raw.sourceType || 'search',
            qualificationScore: qualification.confidence,
            category: qualification.category,
            evidence: raw.evidence
          }
        );
        summary.normalized++;

        // 3. Deduplication Check
        const identity = canonicalLead.profileUrl || canonicalLead.username || canonicalLead.postUrl;
        if (this.dedup.isDuplicateLead(canonicalLead.platform, identity)) {
          summary.duplicates++;
          this.stateStore.increment('duplicatesRemoved');
          continue;
        }

        // 4. Opt-Out Check
        if (this.dedup.isOptedOut(identity)) {
          console.log(`[Scout:${this.name}] Lead ${identity} is in DO_NOT_CONTACT list. Skipping.`);
          continue;
        }

        // 5. Qualification Gate
        if (qualification.qualified) {
          summary.qualified++;
          canonicalLead.status = 'QUALIFIED';
          this.dedup.registerLead(canonicalLead);
          this.stateStore.increment('leadsVerified');
          summary.leads.push({
            leadId: canonicalLead.leadId,
            name: canonicalLead.name,
            category: qualification.category,
            score: qualification.confidence,
            lead: canonicalLead
          });
        } else {
          summary.unqualified++;
          this.stateStore.increment('leadsRejected');
        }
      }

      this.status = 'IDLE';
      console.log(`[Scout:${this.name}] Cycle completed: ${summary.discovered} discovered, ${summary.qualified} qualified, ${summary.duplicates} duplicates.`);
    } catch (err) {
      this.status = 'FAILED';
      console.error(`[Scout:${this.name}] Cycle failed:`, err.message);
      this.stateStore.increment('workersFailed');
    } finally {
      this.isRunning = false;
    }

    return summary;
  }
}

module.exports = BaseScout;
