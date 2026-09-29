/**
 * GARUDA Response Intelligence Engine
 * Classifies inbound messages, creates HOT_OPPORTUNITY records, generates verified next responses,
 * and enforces instant DO_NOT_CONTACT opt-out. Conforms to Section 8 of Production Autonomy Lock.
 */

const fs = require('fs');
const path = require('path');
const LeadDeduplication = require('../leads/leadDeduplication');
const TelegramAlertService = require('../notifications/telegramAlertService');
const { isMongoConnected } = require('../../src/database/db');

const HOT_OPPORTUNITIES_FILE = path.join(__dirname, '..', '..', 'data', 'leads', 'hot_opportunities.json');

const RESPONSE_PATTERNS = [
  // 1. Opt-out & Rejection (Highest Priority - Immediate Action)
  {
    status: 'OPT_OUT',
    category: 'opt-out',
    pattern: /\b(stop|unsubscribe|don'?t message|don'?t contact|do not message|do not contact|remove me|opt out|leave me alone|fuck off|spam)\b/i,
    weight: 100
  },
  {
    status: 'NOT_INTERESTED',
    category: 'not interested',
    pattern: /\b(not interested|no thanks|no thank you|already have someone|already hired|not looking|don'?t need|pass)\b/i,
    weight: 90
  },

  // 2. High Intent / Commercial Engagement
  {
    status: 'INTERESTED',
    category: 'interested',
    pattern: /\b(interested|let'?s talk|sounds good|tell me more|yes please|let'?s connect|call me|schedule a call|send info|can we discuss)\b/i,
    weight: 85
  },
  {
    status: 'PRICE_REQUEST',
    category: 'asking price',
    pattern: /\b(how much|pricing|what are your rates|cost|quote|budget|estimate|rate card|how do you charge)\b/i,
    weight: 80
  },
  {
    status: 'PORTFOLIO_REQUEST',
    category: 'asking portfolio',
    pattern: /\b(portfolio|case studies|samples? of work|previous work|demos?|show me what you made|live examples?)\b/i,
    weight: 78
  },
  {
    status: 'DETAILS_REQUEST',
    category: 'asking details',
    pattern: /\b(here are the requirements|we need|can you build|tech stack|do you know react|features needed|scope of work|more details)\b/i,
    weight: 75
  },
  {
    status: 'QUESTION',
    category: 'asking details',
    pattern: /\b(where are you located|how does this work|do you have experience with)\b/i,
    weight: 60
  }
];

class ResponseMonitor {
  constructor(options = {}) {
    this.options = options;
    this.dedup = new LeadDeduplication(options.dedupFile);
    this.telegram = new TelegramAlertService();
    this.opportunitiesFile = options.opportunitiesFile || HOT_OPPORTUNITIES_FILE;
  }

  /**
   * Classify an inbound message from a contacted prospect
   * @param {string} text - Inbound message content
   * @param {object} lead - Canonical lead record
   * @returns {Promise<{ status: string, category: string, score: number, route: string, actionTaken?: string, opportunity?: object, nextResponseDraft?: string }>}
   */
  async processInboundMessage(text, lead = {}) {
    if (!text || typeof text !== 'string') {
      return { status: 'UNKNOWN', category: 'unclear', score: 0, route: 'GENERAL_INBOX' };
    }

    let detectedStatus = 'UNKNOWN';
    let detectedCategory = 'unclear';
    let highestWeight = 0;

    for (const rule of RESPONSE_PATTERNS) {
      if (rule.pattern.test(text) && rule.weight > highestWeight) {
        highestWeight = rule.weight;
        detectedStatus = rule.status;
        detectedCategory = rule.category;
      }
    }

    const identity = lead.profileUrl || lead.username || lead.leadId || lead.name || 'unknown';

    // 1. Handle Opt-Out / Not Interested -> Instant DO_NOT_CONTACT
    if (detectedStatus === 'OPT_OUT' || detectedStatus === 'NOT_INTERESTED') {
      this.dedup.recordOptOut(identity, `PROSPECT_REPLY: ${text.slice(0, 100)}`);
      return {
        status: detectedStatus,
        category: detectedCategory,
        score: highestWeight,
        route: 'DO_NOT_CONTACT',
        actionTaken: 'PERMANENT_OPT_OUT_RECORDED'
      };
    }

    // 2. Handle Hot / Commercial Responses -> Create HOT_OPPORTUNITY
    const isHot = ['INTERESTED', 'PRICE_REQUEST', 'PORTFOLIO_REQUEST', 'DETAILS_REQUEST'].includes(detectedStatus);
    if (isHot) {
      console.log(`[ResponseMonitor] 🔥 HOT PROSPECT DETECTED: ${lead.name} (${detectedStatus})`);

      const opportunity = await this._recordHotOpportunity({
        lead,
        inboundText: text,
        intentType: detectedStatus,
        category: detectedCategory
      });

      // Generate verified next response draft
      const nextResponseDraft = this._generateNextResponseDraft(detectedStatus, lead);

      // Alert Founder Praveen
      await this.telegram.sendAlert(
        'LEAD',
        `🔥 HOT LEAD RESPONSE: ${lead.name}`,
        `Platform: ${lead.platform}\nClassification: ${detectedCategory.toUpperCase()}\nMessage: "${text.slice(0, 200)}"\nEscalation: Alerting Founder WhatsApp (+91 9098750362 internal deal channel)`
      );

      return {
        status: detectedStatus,
        category: detectedCategory,
        score: highestWeight,
        route: 'FOUNDER_DEAL_DESK',
        actionTaken: 'HOT_OPPORTUNITY_CREATED',
        opportunity,
        nextResponseDraft
      };
    }

    return {
      status: detectedStatus,
      category: detectedCategory,
      score: highestWeight,
      route: 'STANDARD_INBOX',
      actionTaken: 'NONE'
    };
  }

  /**
   * Persist HOT_OPPORTUNITY to local storage and MongoDB
   */
  async _recordHotOpportunity({ lead, inboundText, intentType, category }) {
    const oppId = `opp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const opportunityRecord = {
      opportunityId: oppId,
      title: `Hot Inbound: ${lead.name || 'Qualified Prospect'} (${category})`,
      client: lead.name || 'Prospect',
      platform: lead.platform,
      profileUrl: lead.profileUrl,
      intentType,
      category,
      inboundText,
      stage: 'qualified',
      priority: 'HIGH',
      estimatedValueINR: 50000,
      createdAt: new Date().toISOString()
    };

    // 1. Persist to local JSON file
    try {
      const dir = path.dirname(this.opportunitiesFile);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      let existing = [];
      if (fs.existsSync(this.opportunitiesFile)) {
        try { existing = JSON.parse(fs.readFileSync(this.opportunitiesFile, 'utf8')); } catch (_) {}
      }
      existing.push(opportunityRecord);
      fs.writeFileSync(this.opportunitiesFile, JSON.stringify(existing, null, 2), 'utf8');
    } catch (err) {
      console.warn(`[ResponseMonitor] Local opportunity write failed: ${err.message}`);
    }

    // 2. Persist to MongoDB Opportunity collection if available
    if (isMongoConnected()) {
      try {
        const Opportunity = require('../../src/models/Opportunity');
        await Opportunity.create({
          title: opportunityRecord.title,
          client: opportunityRecord.client,
          source: lead.platform || 'social_hunter',
          stage: 'qualified',
          priority: 'HIGH',
          potentialValue: 50000,
          currency: 'INR',
          probability: 70,
          notes: `Inbound Message: "${inboundText}"\nProfile: ${lead.profileUrl || ''}`
        });
      } catch (mErr) {
        console.warn(`[ResponseMonitor] MongoDB Opportunity sync note: ${mErr.message}`);
      }
    }

    return opportunityRecord;
  }

  /**
   * Generates a factual, non-fabricated response draft
   */
  _generateNextResponseDraft(intentType, lead) {
    const firstName = lead.name && lead.name !== 'UNKNOWN' ? lead.name.split(' ')[0] : 'there';

    if (intentType === 'PRICE_REQUEST') {
      return `Hi ${firstName}, our pricing is based strictly on project scope and deliverables. We'd love to review your detailed requirements to give an exact estimate. You can also explore our verified platform at garudaos.in.`;
    }

    if (intentType === 'PORTFOLIO_REQUEST') {
      return `Hi ${firstName}, you can review our live platform and deployed systems directly at garudaos.in. We can also walk you through specific architecture demos relevant to your stack on a short scoping call.`;
    }

    if (intentType === 'DETAILS_REQUEST' || intentType === 'INTERESTED') {
      return `Hi ${firstName}, thanks for connecting. Would you prefer to share the scope details here, or connect on a quick call with Founder Praveen to review your architecture requirements?`;
    }

    return `Hi ${firstName}, thank you for your response. Let us know how we can best assist with your software requirements.`;
  }
}

module.exports = ResponseMonitor;
