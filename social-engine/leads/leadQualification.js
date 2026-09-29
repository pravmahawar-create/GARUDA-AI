/**
 * GARUDA Social Engine - Lead Qualification & Intent Matrix Engine
 * Distinguishes genuine commercial buyer intent from job-seekers or service providers.
 * Covers 20+ software service categories per GARUDA Revenue Hunter Directive.
 */

const CATEGORY_DEFINITIONS = [
  {
    category: 'REDESIGN',
    pattern: /\b(redesign|rebuild|revamp|modernize website|ui overhaul|ux overhaul|website makeover)\b/i
  },
  {
    category: 'MIGRATION',
    pattern: /\b(migrat(e|ion)|database migration|cloud migration|migrate from|stack migration|upgrade framework)\b/i
  },
  {
    category: 'SOFTWARE_MAINTENANCE',
    pattern: /\b(software maintenance|website maintenance|bug fixing|legacy code|code maintenance|developer retainer)\b/i
  },
  {
    category: 'WEBSITES',
    pattern: /\b(website|landing page|corporate site|web page|portfolio site|web design|website designer|website development)\b/i
  },
  {
    category: 'WEB_APPLICATIONS',
    pattern: /\b(web application|web app|web-app|react app|nextjs app|vue app|fullstack web|spa|single page application)\b/i
  },
  {
    category: 'MOBILE_APPS',
    pattern: /\b(mobile application|mobile app|ios app|android app|react native|flutter|app developer|native app)\b/i
  },
  {
    category: 'PWAS',
    pattern: /\b(pwa|progressive web app|offline web app|progressive web application)\b/i
  },
  {
    category: 'SAAS',
    pattern: /\b(saas|software as a service|multi-tenant|b2b platform|subscription software|cloud platform)\b/i
  },
  {
    category: 'MVPS',
    pattern: /\b(mvp|minimum viable product|proof of concept|poc|prototype build|prototype development)\b/i
  },
  {
    category: 'CUSTOM_SOFTWARE',
    pattern: /\b(custom software|bespoke software|internal software|proprietary software|custom platform|custom tool)\b/i
  },
  {
    category: 'AI_SYSTEMS',
    pattern: /\b(ai system|ai model|llm|custom gpt|ai agent|agentic|rag pipeline|machine learning|computer vision|ai bot)\b/i
  },
  {
    category: 'AUTOMATION',
    pattern: /\b(automat(e|ion|ed|ing)|workflow automation|web scrap(er|ing)|scraping bot|bot development|task automation|automated pipeline|python bot)\b/i
  },
  {
    category: 'PAYMENT_INTEGRATIONS',
    pattern: /\b(payment integration|stripe|razorpay|lemon squeezy|paypal|checkout system|payment gateway)\b/i
  },
  {
    category: 'API_INTEGRATIONS',
    pattern: /\b(api integrat(e|ion)|rest api|graphql|backend integration|third-party api|webhook|api development)\b/i
  },
  {
    category: 'CRM',
    pattern: /\b(crm|customer relationship management|lead management system|sales pipeline tool)\b/i
  },
  {
    category: 'ERP',
    pattern: /\b(erp|enterprise resource planning|inventory management|warehouse management|supply chain software)\b/i
  },
  {
    category: 'BILLING_POS',
    pattern: /\b(billing software|pos|point of sale|invoicing software|billing portal|invoice generator)\b/i
  },
  {
    category: 'ECOMMERCE',
    pattern: /\b(ecommerce|e-commerce|shopify store|woocommerce|online store|shopping cart|marketplace platform)\b/i
  },
  {
    category: 'DASHBOARDS',
    pattern: /\b(dashboard|admin panel|analytics dashboard|metrics portal|reporting interface|kpi dashboard)\b/i
  },
  {
    category: 'BUSINESS_SOFTWARE',
    pattern: /\b(business software|booking system|scheduling software|appointment system|management software)\b/i
  },
  {
    category: 'DEVELOPER_HIRING',
    pattern: /\b(hire developer|hiring engineer|looking for programmer|contract developer|need coder|hire freelancer)\b/i
  },
  {
    category: 'TECHNICAL_CONSULTATION',
    pattern: /\b(technical consultation|software architect|tech advisory|code review|architecture review)\b/i
  }
];

const BUYER_INTENT_PATTERNS = [
  // 1. Explicit hiring & talent requests
  { pattern: /\b(looking for|need|searching for|hire|hiring|looking to hire)\s+(an?\s+)?([a-z\s]{0,30})?\s*(web developer|website designer|website developer|web designer|frontend|fullstack|software engineer|app developer|programmer|coder|agency)\b/i, weight: 50, signal: 'HIRING_DEVELOPER' },
  { pattern: /\b(looking for|need|want|seeking)\s+(an?\s+)?([a-z\s]{0,25})?\s*(someone|freelancer|agency|developer|person)\s+to\s+(design|build|create|code|develop|automate|redesign|fix|integrate|setup|migrate|help)\b/i, weight: 50, signal: 'HIRING_TALENT' },
  { pattern: /\b(looking to hire|need someone to (build|make|create|develop|code|automate|fix)|want to hire)\s+(a\s+)?([a-z\s]{0,25})?\s*(developer|programmer|agency|freelancer|designer)\b/i, weight: 50, signal: 'HIRING_INTENT' },
  { pattern: /\b(hiring immediately|need asap|urgent requirement|start immediately|looking to start this week)\b/i, weight: 25, signal: 'HIRING_NOW' },

  // 2. Direct project owner signals
  { pattern: /\b(to (design|build|create|code|develop|redesign|fix|automate|migrate)\s+(my|our)\s+(website|web app|app|store|site|software|platform|system|workflows?|operations?))\b/i, weight: 45, signal: 'DIRECT_PROJECT_OWNER' },
  { pattern: /\b(for\s+(our|my)\s+(checkout|business|company|store|site|app|platform|startup|workflows?))\b/i, weight: 25, signal: 'DIRECT_PROJECT_OWNER' },
  { pattern: /\b(i need|we need|our company needs|my business needs|we are building|i am building)\b/i, weight: 25, signal: 'DECISION_MAKER' },

  // 3. Service-specific demand
  { pattern: /\b(need|want to build|looking to build|require|build)\s+(an?\s+)?([a-z0-9\s]{0,25})?\s*(mvp|saas|app|mobile app|software|ecommerce|custom platform|dashboard|crm|erp)\b/i, weight: 50, signal: 'BUILD_MVP_OR_SAAS' },
  { pattern: /\b(need|looking for|require)\s+(an?\s+)?([a-z0-9\s]{0,25})?\s*(ecommerce|shopify|wordpress|react|custom)\s+(website|store|platform|app|webapp|system)\b/i, weight: 50, signal: 'NEED_ECOMMERCE_OR_CUSTOM_WEB' },
  { pattern: /\b(need|require|looking for)\s+(an?\s+)?([a-z0-9\s]{0,25})?\s*(api|integration|payment gateway|stripe|razorpay|checkout|crm|erp|dashboard)\b/i, weight: 50, signal: 'NEED_INTEGRATION_OR_ENTERPRISE' },
  { pattern: /\b(redesign|rebuild|fix)\s+(our|my)\s+(website|web app|crm|platform|portal)\b/i, weight: 40, signal: 'NEED_REDESIGN' },
  { pattern: /\b(migrate|migration)\s+(from|to|our)\b/i, weight: 35, signal: 'NEED_MIGRATION' },
  { pattern: /\b(automate|automation)\s+(our|my|for)\s+(tasks?|workflows?|operations?|business)\b/i, weight: 40, signal: 'NEED_AUTOMATION' },
  { pattern: /\b(api|integration)\s+(for|with|between)\b/i, weight: 35, signal: 'NEED_INTEGRATION' },
  { pattern: /\b(ai|agent|chatbot|llm)\s+(for|in|integrated)\s+(our|my|business)\b/i, weight: 40, signal: 'NEED_AI_SYSTEM' },

  // 4. Recommendation & help requests
  { pattern: /\b(can anyone recommend|anyone know a good|recommendations?\s+(for|please)|who can (build|design|make)|who does)\s+(a\s+)?(website|web developer|app developer|agency|programmer)\b/i, weight: 50, signal: 'REQUESTING_RECOMMENDATION' },
  { pattern: /\b(who can|anyone)\s+(help me with|build|make|design)\s+(a\s+)?(website|web app|app|software)\b/i, weight: 40, signal: 'SEEKING_HELP' },
  { pattern: /\b(reach out with|send\s+(your\s+)?(portfolio|demo|samples?)|dm\s+(me\s+)?(your\s+)?(portfolio|work|rates))\b/i, weight: 35, signal: 'REQUESTING_PORTFOLIO' },

  // 5. Commercial Signals: Budget & Timeline
  { pattern: /\b(budget\s*:\s*\$?\d+|budget is|paid gig|freelance project|offer rate|\$\d+|\b\d+\s*usd\b|\b\d+\s*inr\b|hourly rate)\b/i, weight: 25, signal: 'BUDGET_SIGNAL' },
  { pattern: /\b(deadline|timeline|launch date|within \d+ (days|weeks|months)|by next week|urgent)\b/i, weight: 20, signal: 'TIMELINE_SIGNAL' }
];

const SELLER_OR_STUDENT_PATTERNS = [
  { pattern: /\b(i am a|i'm a|we are a|our team is)\s+(web developer|agency|freelancer|designer|company)\b/i, penalty: -60, signal: 'SERVICE_AD' },
  { pattern: /\b(hire me|available for hire|dm for services|portfolio in bio|check my work|link in bio)\b/i, penalty: -80, signal: 'AGENCY_PROMOTION' },
  { pattern: /\b(we build|we create|we design|our agency|our services|we specialize in|we provide|contact us (at|on|for)|visit our website|call us today|get your website|affordable websites?|best web design agency|web development company)\b/i, penalty: -75, signal: 'GENERIC_MARKETING' },
  { pattern: /\b(bluehost|godaddy|hostinger|wix|squarespace|namecheap|siteground)\b/i, penalty: -60, signal: 'HOSTING_AD' },
  { pattern: /\b(sponsored|promoted|partner content|#ad|#sponsored)\b/i, penalty: -90, signal: 'SPONSORED_ADVERTISEMENT' },
  { pattern: /\b(how do i learn|student|tutorial|course|assignment|homework|internship seeking)\b/i, penalty: -50, signal: 'COURSE_PROMOTION' },
  { pattern: /\b(discount|coupon|deal of the day|affiliate link|earn money)\b/i, penalty: -70, signal: 'AFFILIATE' },
  { pattern: /\b(top \d+ ai tools|best ai tools to try|try this new tool)\b/i, penalty: -60, signal: 'AI_TOOL_AD' },
  { pattern: /\b(we are hiring \d+ employees|recruiter here|apply at our career portal)\b/i, penalty: -60, signal: 'RECRUITMENT_SPAM' }
];

class LeadQualification {
  /**
   * Qualify source text for real commercial buyer intent across 20+ service categories.
   * @param {string} text - Post caption, snippet, comment, or message
   * @returns {{ qualified: boolean, signals: string[], confidence: number, summary: string, category: string, intentSignals: string[], noiseSignals: string[], hasBudget: boolean, hasTimeline: boolean, directOwner: boolean }}
   */
  static qualify(text) {
    if (!text || typeof text !== 'string') {
      return {
        qualified: false,
        signals: [],
        confidence: 0,
        summary: 'NO_TEXT',
        category: 'UNKNOWN',
        intentSignals: [],
        noiseSignals: [],
        hasBudget: false,
        hasTimeline: false,
        directOwner: false
      };
    }

    let score = 0;
    const detectedSignals = [];
    const noiseSignals = [];

    // 1. Detect Category
    let detectedCategory = 'GENERAL_SOFTWARE';
    for (const cat of CATEGORY_DEFINITIONS) {
      if (cat.pattern.test(text)) {
        detectedCategory = cat.category;
        break;
      }
    }

    // 2. Positive Buyer Intent
    let hasBudget = false;
    let hasTimeline = false;
    let directOwner = false;

    for (const rule of BUYER_INTENT_PATTERNS) {
      if (rule.pattern.test(text)) {
        score += rule.weight;
        detectedSignals.push(rule.signal);
        if (rule.signal === 'BUDGET_SIGNAL') hasBudget = true;
        if (rule.signal === 'TIMELINE_SIGNAL') hasTimeline = true;
        if (rule.signal === 'DIRECT_PROJECT_OWNER' || rule.signal === 'DECISION_MAKER') directOwner = true;
      }
    }

    // 3. Negative Seller / Student Penalties
    for (const rule of SELLER_OR_STUDENT_PATTERNS) {
      if (rule.pattern.test(text)) {
        score += rule.penalty;
        noiseSignals.push(rule.signal);
        detectedSignals.push(rule.signal);
      }
    }

    score = Math.max(0, Math.min(100, score));
    const qualified = score >= 50;

    return {
      qualified,
      signals: detectedSignals,
      confidence: score,
      summary: qualified ? `QUALIFIED (Score: ${score} | ${detectedCategory})` : `UNQUALIFIED (Score: ${score})`,
      category: detectedCategory,
      intentSignals: detectedSignals.filter(s => !noiseSignals.includes(s)),
      noiseSignals,
      hasBudget,
      hasTimeline,
      directOwner
    };
  }

  static getSupportedCategories() {
    return CATEGORY_DEFINITIONS.map(c => c.category);
  }
}

module.exports = LeadQualification;
