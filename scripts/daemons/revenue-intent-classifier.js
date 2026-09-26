/**
 * GARUDA SCOUT FLEET — REVENUE INTENT CLASSIFIER & HANDOFF PIPELINE
 * 
 * SOVEREIGN DIRECTIVES (Founder Praveen Mahawar):
 * 1. Intent Classification:
 *    A. Immediate buyer need
 *    B. Hiring/development requirement
 *    C. Business website/software requirement
 *    D. Automation/AI requirement
 *    E. Unclear intent (BLOCKED)
 *    F. Vendor/promotional (BLOCKED)
 *    G. Non-commercial (BLOCKED)
 *    H. Unsafe/ambiguous (BLOCKED)
 *    Only A-D qualify for controlled outreach. E-H are strictly rejected.
 * 
 * 2. Reply Classification & Revenue Handoff:
 *    - Inbound reply classified: INTERESTED, WANTS_DETAILS, WANTS_PRICING, WANTS_CALL, NOT_INTERESTED, WRONG_PERSON, UNCLEAR
 *    - Positive replies routed to existing Opportunity Pipeline (scoutOpportunityService).
 *    - Inbound events deduplicated to prevent alert storms.
 *    - Dispatches comprehensive Telegram alert to Founder Praveen without automated pricing negotiations.
 */

const fs = require('fs');
const path = require('path');
const telegram = require('../../src/services/telegramBotService');
const scoutOpportunityService = require('../../src/services/scoutOpportunityService');

const SYSTEM_ACCOUNTS = [
  'instagram', 'meta', 'threads', 'explore', 'direct', 'reels', 'stories',
  'facebook', 'garudaos.ai', 'unknown', 'undefined', 'null', 'linkedin member'
];

const VENDOR_PATTERNS = [
  /we are an agency/i,
  /we are a team/i,
  /our agency/i,
  /dm me for services/i,
  /check our portfolio/i,
  /we offer web/i,
  /contact us on whatsapp/i,
  /affordable prices/i,
  /hire us/i,
  /best web development company/i,
  /order now/i,
  /build your app on/i,
  /sign up today/i,
  /download our/i,
  /pricing plan/i,
  /our services/i
];

/**
 * Classifies candidate text into Revenue Intent Categories A through H.
 */
function classifyRevenueIntent(text = '', author = '', username = '') {
  const normUser = String(username || '').toLowerCase().trim();
  const normAuthor = String(author || '').toLowerCase().trim();
  const raw = String(text || '').trim();
  const lower = raw.toLowerCase();

  // Category H: Unsafe / Ambiguous Identity
  if (!normUser && !normAuthor) {
    return {
      category: 'H',
      name: 'Unsafe/ambiguous',
      eligible: false,
      confidence: 1.0,
      reasoning: 'Missing or empty identity (author/username absent)'
    };
  }
  if (SYSTEM_ACCOUNTS.includes(normUser) || SYSTEM_ACCOUNTS.includes(normAuthor)) {
    return {
      category: 'H',
      name: 'Unsafe/ambiguous',
      eligible: false,
      confidence: 1.0,
      reasoning: `Target is a platform/system account ("${normUser || normAuthor}")`
    };
  }

  // Category F: Vendor / Promotional Account
  const isVendor = VENDOR_PATTERNS.some(p => p.test(lower));
  if (isVendor) {
    return {
      category: 'F',
      name: 'Vendor/promotional',
      eligible: false,
      confidence: 0.95,
      reasoning: 'Matches vendor advertisement or service seller promotional patterns'
    };
  }

  // Category G: Non-commercial
  if (lower.length < 15 || /meme|funny|lol|joke|political|vote|rant|complaint/i.test(lower)) {
    if (!/website|developer|designer|app|software|build/i.test(lower)) {
      return {
        category: 'G',
        name: 'Non-commercial',
        eligible: false,
        confidence: 0.85,
        reasoning: 'Content is social chatter, non-commercial, or unrelated to technology procurement'
      };
    }
  }

  // Category A: Immediate Buyer Need
  const isImmediate = /urgent|urgently|asap|immediately|right now|emergency|budget ready|ready to start|need today/i.test(lower);
  const hasNeedCore = /need a|need someone|looking for|seeking|hire a|require/i.test(lower);
  const hasTechCore = /developer|designer|website|web site|app|software|fullstack|frontend/i.test(lower);

  if (isImmediate && (hasNeedCore || hasTechCore)) {
    return {
      category: 'A',
      name: 'Immediate buyer need',
      eligible: true,
      confidence: 0.95,
      reasoning: 'Explicit high-urgency commercial procurement intent detected'
    };
  }

  // Category B: Hiring / Development Requirement
  const isHiring = /we are hiring|hiring|open position|job opening|freelance role|contractor needed|looking for web developer|need a developer|looking for developer|web developer needed/i.test(lower);
  if (isHiring) {
    return {
      category: 'B',
      name: 'Hiring/development requirement',
      eligible: true,
      confidence: 0.90,
      reasoning: 'Active hiring or contractor requisition for engineering development'
    };
  }

  // Category D: Automation / AI Requirement
  const isAutomation = /gohighlevel|ghl|crm automation|workflow automation|webhook|zapier|make\.com|n8n|ai agent|chatbot/i.test(lower);
  if (isAutomation && (hasNeedCore || /specialist|expert|setup|integrate|build/i.test(lower))) {
    return {
      category: 'D',
      name: 'Automation/AI requirement',
      eligible: true,
      confidence: 0.90,
      reasoning: 'Technical requirement for CRM, workflow automation, or AI system integration'
    };
  }

  // Category C: Business Website / Software Requirement
  const isBusinessReq = /business website|company website|clinic redesign|ecommerce brand|shopify|web application|mobile app|mvp/i.test(lower);
  if ((isBusinessReq || hasTechCore) && hasNeedCore) {
    return {
      category: 'C',
      name: 'Business website/software requirement',
      eligible: true,
      confidence: 0.88,
      reasoning: 'Clear commercial requirement for website, software, or digital architecture build'
    };
  }

  // Category E: Unclear Intent
  return {
    category: 'E',
    name: 'Unclear intent',
    eligible: false,
    confidence: 0.70,
    reasoning: 'Weak or ambiguous procurement signals; does not meet strict eligibility standard'
  };
}

/**
 * Classifies an incoming prospect reply into standard response types.
 */
function classifyInboundReply(replyText = '') {
  const t = String(replyText || '').toLowerCase().trim();

  if (/call|zoom|meet|google meet|phone|ring me|number|schedule a time|talk on/i.test(t)) {
    return { type: 'WANTS_CALL', isPositive: true, action: 'Schedule executive scoping call' };
  }
  if (/price|pricing|cost|how much|quote|rate|charges|fees|package/i.test(t)) {
    return { type: 'WANTS_PRICING', isPositive: true, action: 'Prepare fixed deliverable scope & commercial estimate' };
  }
  if (/detail|details|portfolio|work|samples|case stud|send more|explain|process/i.test(t)) {
    return { type: 'WANTS_DETAILS', isPositive: true, action: 'Dispatch tailored visual case study & wireframe concepts' };
  }
  if (/yes|interested|sure|sounds good|let's do it|happy to connect|reach out|tell me more/i.test(t)) {
    return { type: 'INTERESTED', isPositive: true, action: 'Send personal calendar booking link & initial requirements sheet' };
  }
  if (/not interested|no thanks|already hired|we are good|stop|unsubscribe|don't message|spam/i.test(t)) {
    return { type: 'NOT_INTERESTED', isPositive: false, action: 'Mark closed/unsubscribed; suppress future outreach' };
  }
  if (/wrong person|not me|didn't post|who is this/i.test(t)) {
    return { type: 'WRONG_PERSON', isPositive: false, action: 'Mark invalid lead target; update dedup record' };
  }

  return { type: 'UNCLEAR', isPositive: false, action: 'Review manually for clarifying intent' };
}

/**
 * Deduplication cache for inbound reply events.
 */
const processedInboundEvents = new Set();

/**
 * Handles verified prospect reply and connects to existing Lead / Opportunity pipeline.
 */
async function handoffReplyToRevenuePipeline({
  platform,
  prospectIdentity,
  conversationRef,
  sourceUrl,
  originalOutreachContext,
  replyText,
  timestamp = new Date().toISOString()
}) {
  const normId = (prospectIdentity?.username || prospectIdentity?.author || 'unknown').toLowerCase().trim();
  const eventKey = `${platform}:${normId}:${replyText.slice(0, 40)}`;

  if (processedInboundEvents.has(eventKey)) {
    console.log(`[REVENUE HANDOFF] Duplicate inbound event suppressed: ${eventKey}`);
    return { handled: false, reason: 'DUPLICATE_EVENT_SUPPRESSED' };
  }
  processedInboundEvents.add(eventKey);

  const replyClass = classifyInboundReply(replyText);
  console.log(`[REVENUE HANDOFF] Inbound reply classified: ${replyClass.type} (Positive: ${replyClass.isPositive})`);

  let opportunityRecord = null;

  // If positive response, integrate directly into EXISTING scoutOpportunityService
  if (replyClass.isPositive) {
    try {
      opportunityRecord = await scoutOpportunityService.createOpportunity({
        platform,
        title: `Inbound Deal: ${prospectIdentity?.author || prospectIdentity?.username}`,
        client: prospectIdentity?.author || prospectIdentity?.username,
        url: conversationRef || prospectIdentity?.profileUrl || sourceUrl,
        budgetText: 'Qualified Inbound Lead',
        notes: `Classification: ${replyClass.type}\nOriginal Context: ${originalOutreachContext}\nReply: "${replyText}"`,
        source: `${platform}_scout`
      });
      console.log(`✔ [REVENUE HANDOFF] Registered in Existing Opportunity Pipeline (ID: ${opportunityRecord.id || opportunityRecord._id})`);
    } catch (e) {
      console.warn(`[REVENUE HANDOFF] Opportunity service note:`, e.message);
    }
  }

  // Generate Telegram Founder Alert with exact required specifications
  const alertTitle = replyClass.isPositive
    ? `🔥 GARUDA INBOUND HOT LEAD (${platform.toUpperCase()}): ${prospectIdentity?.author || prospectIdentity?.username}`
    : `ℹ️ GARUDA INBOUND RESPONSE (${platform.toUpperCase()}): ${prospectIdentity?.author || prospectIdentity?.username}`;

  const alertMessage = 
    `• Platform: ${platform}\n` +
    `• Prospect Identity: ${prospectIdentity?.author || prospectIdentity?.username} (${prospectIdentity?.profileUrl || 'Profile N/A'})\n` +
    `• Source: ${sourceUrl || 'Social Scout Fleet'}\n` +
    `• Original Outreach Context: "${(originalOutreachContext || '').slice(0, 150)}..."\n` +
    `• Reply Classification: ${replyClass.type}\n` +
    `• Conversation Reference: ${conversationRef || 'Direct Message Thread'}\n` +
    `• Prospect Message: "${replyText}"\n\n` +
    `⚡ RECOMMENDED NEXT MANUAL ACTION:\n${replyClass.action}`;

  try {
    await telegram.sendFounderAlert(alertTitle, alertMessage);
    console.log(`✔ [REVENUE HANDOFF] Telegram Founder Alert dispatched for @${normId}`);
  } catch (err) {
    console.error(`[REVENUE HANDOFF] Telegram alert dispatch failure:`, err.message);
  }

  return {
    handled: true,
    platform,
    prospectIdentity,
    replyClassification: replyClass,
    opportunityRecord,
    timestamp
  };
}

module.exports = {
  classifyRevenueIntent,
  classifyInboundReply,
  handoffReplyToRevenuePipeline,
  processedInboundEvents,
  SYSTEM_ACCOUNTS
};
