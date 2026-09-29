/**
 * GARUDA Social Lead Engine - Buyer-Intent Discovery Optimization
 * Executes controlled discovery cycle across a multi-phrase buyer-intent matrix.
 * Filters commercial sellers, hosting ads, and promotional noise.
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const SessionManager = require('./browser/sessionManager');
const FacebookAdapter = require('./platforms/facebook/facebookAdapter');
const InstagramAdapter = require('./platforms/instagram/instagramAdapter');
const HealthMonitor = require('./core/healthMonitor');
const LeadNormalizer = require('./leads/leadNormalizer');
const LeadQualification = require('./leads/leadQualification');
const LeadDeduplication = require('./leads/leadDeduplication');
const OutreachQueue = require('./outreach/outreachQueue');
const StateStore = require('./persistence/stateStore');

const LOG_FILE = path.join(__dirname, '..', 'logs', 'social-engine.log');
const LEADS_JSONL = path.join(__dirname, '..', 'data', 'leads', 'social_leads.jsonl');

function logEvent(level, message, metadata = {}) {
  const ts = new Date().toISOString();
  const sanitizedMeta = { ...metadata };
  delete sanitizedMeta.cookies;
  delete sanitizedMeta.headers;
  
  const line = `[${ts}] [${level.toUpperCase()}] ${message} ${Object.keys(sanitizedMeta).length ? JSON.stringify(sanitizedMeta) : ''}\n`;
  try {
    fs.mkdirSync(path.dirname(LOG_FILE), { recursive: true });
    fs.appendFileSync(LOG_FILE, line, 'utf8');
  } catch (_) {}
  console.log(`[${level.toUpperCase()}] ${message}`);
}

const FB_BUYER_QUERIES = [
  'recommend a web developer',
  'looking for web developer',
  'need ecommerce website'
];

const IG_BUYER_TAGS = [
  'needwebsite',
  'hiringdeveloper',
  'webdevelopment'
];

async function runBuyerIntentCycle() {
  logEvent('info', 'Starting GARUDA Buyer-Intent Discovery Optimization Cycle');

  const report = {
    status: 'LIVE',
    facebook: {
      discovered: 0,
      buyerIntentCandidates: 0,
      qualified: 0,
      disqualifiedBreakdown: {},
      candidates: []
    },
    instagram: {
      discovered: 0,
      buyerIntentCandidates: 0,
      qualified: 0,
      disqualifiedBreakdown: {},
      candidates: []
    },
    topQuerySignals: [],
    disqualificationPatterns: [],
    awaitingApproval: 0,
    blocker: null,
    linkedin: 'SECURITY_BLOCKED'
  };

  const dedup = new LeadDeduplication();
  const outreachQueue = new OutreachQueue();
  const stateStore = new StateStore();

  fs.mkdirSync(path.dirname(LEADS_JSONL), { recursive: true });

  // ==========================================
  // PHASE 1: FACEBOOK BUYER-INTENT DISCOVERY
  // ==========================================
  logEvent('info', 'Phase 1: Starting Facebook Buyer-Intent Matrix');
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
      report.facebook.error = initRes.error || initRes.reason;
      logEvent('error', `Facebook session init failed: ${report.facebook.error}`);
    } else {
      const fbAdapter = new FacebookAdapter(fbSession, fbHealth);
      const authRes = await fbAdapter.verifyAuthentication(initRes.page);

      if (!authRes.authenticated) {
        logEvent('warn', 'Facebook auth check failed or challenged');
        report.blocker = authRes.challenge ? `Facebook Challenge: ${authRes.challenge.type}` : 'FB Auth Expired';
      } else {
        for (const query of FB_BUYER_QUERIES) {
          logEvent('info', `Facebook Query: "${query}"`);
          const searchRes = await fbAdapter.searchPosts(initRes.page, query);

          if (searchRes.challenge && searchRes.challenge.detected) {
            logEvent('warn', `Challenge detected during query "${query}", stopping FB batch`);
            break;
          }

          const rawPosts = searchRes.leads || [];
          logEvent('info', `Query "${query}" returned ${rawPosts.length} post(s)`);

          for (const raw of rawPosts) {
            report.facebook.discovered++;

            const identity = raw.author.profileUrl || raw.author.name;
            const isDup = dedup.isDuplicateLead('facebook', identity);

            const qual = LeadQualification.qualify(raw.snippet);
            const normalized = LeadNormalizer.normalize('facebook', raw, qual.signals);

            // Record query in normalized metadata
            normalized.query = query;

            if (qual.signals.length > 0) {
              report.topQuerySignals.push(...qual.signals);
            }

            const candidateRecord = {
              platform: 'facebook',
              query,
              author: raw.author.name,
              profileUrl: raw.author.profileUrl,
              postUrl: raw.postUrl,
              snippet: raw.snippet.slice(0, 150),
              confidence: qual.confidence,
              signals: qual.signals,
              qualified: qual.qualified,
              isDuplicate: isDup
            };
            report.facebook.candidates.push(candidateRecord);

            if (qual.qualified && !isDup) {
              report.facebook.buyerIntentCandidates++;
              report.facebook.qualified++;
              dedup.registerLead(normalized);

              outreachQueue.enqueue({
                lead: normalized,
                pitch: `Hello ${normalized.name}, we saw your inquiry regarding web development and can share how GARUDA delivers high-reliability software.`,
                platformHealthy: true,
                rateLimitAvailable: true
              });

              report.awaitingApproval++;
              fs.appendFileSync(LEADS_JSONL, JSON.stringify(normalized) + '\n', 'utf8');
              logEvent('info', `QUALIFIED FB BUYER: ${normalized.name} (Score: ${qual.confidence})`);
            } else {
              // Track disqualification reasons
              const reason = qual.signals.find(s => s.startsWith('SELF_PROMOTION') || s.startsWith('SELLER') || s.startsWith('COMMERCIAL') || s.startsWith('HOSTING') || s.startsWith('SPONSORED')) || 'NOISE_NO_BUYER_SIGNALS';
              report.facebook.disqualifiedBreakdown[reason] = (report.facebook.disqualifiedBreakdown[reason] || 0) + 1;
              if (!report.disqualificationPatterns.includes(reason)) report.disqualificationPatterns.push(reason);
              logEvent('info', `Disqualified FB: ${raw.author.name} [Reason: ${reason}]`);
            }
          }

          // Gentle pause between search queries
          await new Promise(r => setTimeout(r, 3000));
        }
      }
    }
  } catch (err) {
    logEvent('error', `FB Buyer cycle error: ${err.message}`);
    report.blocker = err.message;
  } finally {
    logEvent('info', 'Closing Facebook session');
    await fbSession.closeSession();
  }

  // ==========================================
  // PHASE 2: INSTAGRAM BUYER-INTENT DISCOVERY
  // ==========================================
  logEvent('info', 'Phase 2: Starting Instagram Buyer-Intent Matrix');
  const igCookies = [];
  if (process.env.INSTAGRAM_SESSION_ID) {
    igCookies.push({ name: 'sessionid', value: process.env.INSTAGRAM_SESSION_ID.trim(), domain: '.instagram.com', path: '/' });
  }
  if (process.env.INSTAGRAM_USER_ID) {
    igCookies.push({ name: 'ds_user_id', value: process.env.INSTAGRAM_USER_ID.trim(), domain: '.instagram.com', path: '/' });
  }

  const igHealth = new HealthMonitor('instagram');
  const igSession = new SessionManager('instagram', { headless: 'new' });

  try {
    const initRes = await igSession.initializeSession(igCookies);
    if (!initRes.success) {
      report.instagram.error = initRes.error || initRes.reason;
      logEvent('error', `Instagram session init failed: ${report.instagram.error}`);
    } else {
      const igAdapter = new InstagramAdapter(igSession, igHealth);
      const authRes = await igAdapter.verifyAuthentication(initRes.page);

      if (!authRes.authenticated) {
        logEvent('warn', 'Instagram auth check failed or challenged');
        if (!report.blocker) report.blocker = authRes.challenge ? `Instagram Challenge: ${authRes.challenge.type}` : 'IG Auth Expired';
      } else {
        for (const tag of IG_BUYER_TAGS) {
          logEvent('info', `Instagram Tag: #${tag}`);
          const tagRes = await igAdapter.discoverHashtagPosts(initRes.page, tag, 3);

          if (tagRes.challenge && tagRes.challenge.detected) {
            logEvent('warn', `Challenge on tag #${tag}, stopping IG batch`);
            break;
          }

          const links = tagRes.posts || [];
          logEvent('info', `Tag #${tag} returned ${links.length} post(s)`);

          for (const postUrl of links) {
            report.instagram.discovered++;
            const detailRes = await igAdapter.extractPostDetails(initRes.page, postUrl);

            if (detailRes.challenge && detailRes.challenge.detected) {
              logEvent('warn', 'Challenge on post inspection');
              break;
            }

            const raw = detailRes.extracted;
            if (!raw || !raw.author || !raw.author.username || raw.status === 'UNKNOWN') {
              const reason = 'EXTRACTION_INCOMPLETE_OR_NAV_REJECT';
              report.instagram.disqualifiedBreakdown[reason] = (report.instagram.disqualifiedBreakdown[reason] || 0) + 1;
              continue;
            }

            const isDup = dedup.isDuplicateLead('instagram', raw.author.username);
            const qual = LeadQualification.qualify(raw.caption);
            const normalized = LeadNormalizer.normalize('instagram', raw, qual.signals);
            normalized.query = `#${tag}`;

            if (qual.signals.length > 0) {
              report.topQuerySignals.push(...qual.signals);
            }

            const candidateRecord = {
              platform: 'instagram',
              query: `#${tag}`,
              author: raw.author.username,
              profileUrl: raw.author.profileUrl,
              postUrl,
              snippet: raw.caption.slice(0, 150),
              confidence: qual.confidence,
              signals: qual.signals,
              qualified: qual.qualified,
              isDuplicate: isDup
            };
            report.instagram.candidates.push(candidateRecord);

            if (qual.qualified && !isDup) {
              report.instagram.buyerIntentCandidates++;
              report.instagram.qualified++;
              dedup.registerLead(normalized);

              outreachQueue.enqueue({
                lead: normalized,
                pitch: `Hello @${normalized.username}, we noticed your project scope. GARUDA provides reliable engineering for web and SaaS applications.`,
                platformHealthy: true,
                rateLimitAvailable: true
              });

              report.awaitingApproval++;
              fs.appendFileSync(LEADS_JSONL, JSON.stringify(normalized) + '\n', 'utf8');
              logEvent('info', `QUALIFIED IG BUYER: ${normalized.username} (Score: ${qual.confidence})`);
            } else {
              const reason = qual.signals.find(s => s.startsWith('SELF_PROMOTION') || s.startsWith('SELLER') || s.startsWith('COMMERCIAL') || s.startsWith('STUDENT')) || 'NOISE_PORTFOLIO_TUTORIAL';
              report.instagram.disqualifiedBreakdown[reason] = (report.instagram.disqualifiedBreakdown[reason] || 0) + 1;
              if (!report.disqualificationPatterns.includes(reason)) report.disqualificationPatterns.push(reason);
              logEvent('info', `Disqualified IG: ${raw.author.username} [Reason: ${reason}]`);
            }
          }

          // Gentle pause between tags
          await new Promise(r => setTimeout(r, 2500));
        }
      }
    }
  } catch (err) {
    logEvent('error', `IG Buyer cycle error: ${err.message}`);
    if (!report.blocker) report.blocker = err.message;
  } finally {
    logEvent('info', 'Closing Instagram session');
    await igSession.closeSession();
  }

  // Deduplicate signal tags
  report.topQuerySignals = Array.from(new Set(report.topQuerySignals));

  logEvent('info', 'Buyer-Intent Discovery Cycle Completed');
  return report;
}

if (require.main === module) {
  runBuyerIntentCycle().then(rep => {
    console.log('\n====================================================');
    console.log('🦅 BUYER-INTENT DISCOVERY SUMMARY:');
    console.log('====================================================');
    console.log(JSON.stringify(rep, null, 2));
  }).catch(err => {
    console.error('Fatal execution error:', err);
    process.exit(1);
  });
}

module.exports = runBuyerIntentCycle;
