/**
 * GARUDA LinkedIn Autonomous Scout Daemon
 * 
 * SOVEREIGN DIRECTIVES (Founder Praveen Mahawar):
 * - ZERO Public Comments: Under NO circumstances post public comments, auto-comments, or public replies.
 * - Mode: DISCOVERY → QUALIFICATION → PRIVATE MESSAGE / INMAIL ONLY.
 * - If authentication fails or redirects: STATUS = BLOCKED. Never bypass platform security or fabricate success.
 * - Cross-Platform Deduplication: Uses unified-lead-guard before any outbound action.
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const telegram = require('../../src/services/telegramBotService');
const { isGloballyContacted, recordContactedLead, acquireProcessLock, withCycleLock } = require('./unified-lead-guard');
const { evaluateOutboundSafetyGate, logOutboundAttempt } = require('./outbound-safety-gate');

const LEADS_FILE = path.join(__dirname, '..', '..', 'data', 'leads', 'linkedin_scouted_leads.json');
const OUTPUT_DIR = path.join(__dirname, '..', '..', 'output', 'scouts');

if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
if (!fs.existsSync(path.dirname(LEADS_FILE))) fs.mkdirSync(path.dirname(LEADS_FILE), { recursive: true });

const SEARCH_QUERIES = [
  '"looking for a web developer" OR "need a developer"',
  '"build an MVP" OR "looking for fullstack developer"',
  '"hiring web developer" OR "freelance web developer"',
  '"GoHighLevel" OR "GHL specialist" OR "CRM automation"',
  '"need a mobile app" OR "React Native developer"'
];

let queryIndex = 0;

async function runScoutCycle() {
  const cookieVal = process.env.LINKEDIN_LI_AT;
  if (!cookieVal) {
    console.warn('⚠️ [LINKEDIN SCOUT DAEMON] LINKEDIN_LI_AT missing in .env. STATUS = BLOCKED.');
    return;
  }

  const query = SEARCH_QUERIES[queryIndex % SEARCH_QUERIES.length];
  queryIndex++;

  console.log(`\n======================================================`);
  console.log(`🦅 [LINKEDIN SCOUT DAEMON] Starting cycle at ${new Date().toISOString()}`);
  console.log(`🛡️ Mode: STRICT PRIVATE MESSAGING ONLY (Zero Public Comments)`);
  console.log(`🎯 Active Query [${queryIndex}/${SEARCH_QUERIES.length}]: "${query}"`);
  console.log(`======================================================`);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1380,900']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1380, height: 900 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');

    await page.setCookie({
      name: 'li_at',
      value: cookieVal.trim(),
      domain: '.linkedin.com',
      path: '/',
      httpOnly: true,
      secure: true
    });

    console.log('▶ Hydrating LinkedIn session at feed...');
    try {
      await page.goto('https://www.linkedin.com/feed/', { waitUntil: 'domcontentloaded', timeout: 30000 });
      await new Promise(r => setTimeout(r, 3000));
    } catch (e) {
      if (e.message && e.message.includes('ERR_TOO_MANY_REDIRECTS')) {
        console.warn('⚠️ [LINKEDIN SCOUT DAEMON] net::ERR_TOO_MANY_REDIRECTS encountered. LinkedIn session cookie expired/invalidated.');
        console.warn('🔒 STATUS = BLOCKED. Skipping cycle without executing outreach (Anti-Fabrication Rule).');
        return;
      }
      throw e;
    }

    const currentUrl = page.url();
    if (currentUrl.includes('/checkpoint/') || currentUrl.includes('/login') || currentUrl.includes('/authwall')) {
      console.warn(`⚠️ [LINKEDIN SCOUT DAEMON] Session redirected to ${currentUrl}. Authentication required. STATUS = BLOCKED.`);
      return;
    }

    const searchUrl = `https://www.linkedin.com/search/results/content/?keywords=${encodeURIComponent(query)}&sortBy=%22date_posted%22`;
    console.log(`▶ Navigating to LinkedIn Search: ${searchUrl}`);
    await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 35000 });
    await new Promise(r => setTimeout(r, 5000));

    // Scroll slightly to trigger hydration
    await page.evaluate(() => window.scrollBy(0, 500));
    await new Promise(r => setTimeout(r, 2000));

    // 1. DISCOVERY & QUALIFICATION (Post author profiles only)
    const candidates = await page.evaluate(() => {
      const posts = [];
      const containers = Array.from(document.querySelectorAll('div.feed-shared-update-v2, div[data-urn*="activity"]'));

      for (const el of containers) {
        const text = (el.textContent || '').replace(/\s+/g, ' ');
        const authorEl = el.querySelector('.update-components-actor__name, .feed-shared-actor__name');
        const authorLink = el.querySelector('.update-components-actor__container-link, a.app-aware-link');

        const author = authorEl ? authorEl.textContent.trim() : 'LinkedIn Member';
        const profileUrl = authorLink ? authorLink.href : '';

        if (author && author !== 'LinkedIn Member') {
          posts.push({
            author,
            profileUrl: profileUrl.split('?')[0],
            text: text.slice(0, 200)
          });
        }
      }
      return posts;
    });

    console.log(`▶ Discovered ${candidates.length} candidate post authors.`);

    // 2. PRIVATE OUTREACH PIPELINE (Zero Public Comments)
    let dmsSent = 0;
    for (const c of candidates) {
      if (dmsSent >= 1) break; // Strict rate limit: max 1 private message per cycle

      if (!c.profileUrl) continue;

      const pitch = `Hi ${c.author.split(' ')[0]}! Saw your note regarding needing an experienced developer. Reaching out directly in private rather than adding noise to public feeds.\n\nOur engineering team at GARUDA specializes in rapid, production-grade web & app architectures with 48-hour turnarounds and zero monthly bloat.\n\nLive portfolio & interactive systems: https://www.garudaos.in — happy to review your project spec in private!\n\nBest regards,\nPraveen Mahawar\nFounder, GARUDA OS`;

      // Centralized Outbound Safety Gate Check
      const gate = evaluateOutboundSafetyGate({
        platform: 'linkedin',
        author: c.author,
        profileUrl: c.profileUrl,
        snippet: c.text,
        pitch,
        currentCycleCount: dmsSent
      });

      if (!gate.allowed) {
        console.log(`🔒 [SAFETY GATE BLOCKED] ${c.author}: ${gate.reason} (Gate: ${gate.gate})`);
        logOutboundAttempt({
          platform: 'linkedin',
          candidateIdentity: { author: c.author },
          profileUrl: c.profileUrl,
          sourcePostUrl: searchUrl,
          qualificationResult: { candidate: true },
          personalizationResult: pitch,
          safetyGateResult: gate
        });
        continue;
      }

      console.log(`🎯 Targeting LinkedIn lead for Private Outreach: ${c.author}`);
      await page.goto(c.profileUrl, { waitUntil: 'domcontentloaded', timeout: 35000 });
      await new Promise(r => setTimeout(r, 4000));

      // SOVEREIGN RULE: Strictly look for private Message or InMail button on profile.
      // ZERO interaction with post comments or public reply boxes.
      const hasPrivateMessageBtn = await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll("button, div[role='button'], a"));
        for (const b of btns) {
          const txt = (b.textContent || '').trim().toLowerCase();
          if (txt === 'message' || txt === 'inmail') {
            b.click();
            return true;
          }
        }
        return false;
      });

      if (hasPrivateMessageBtn) {
        console.log(`   Found private message option on @${c.author}. Preparing confidential pitch...`);
        await new Promise(r => setTimeout(r, 4000));

        const textBox = await page.$("div.msg-form__contenteditable, div[role='textbox'][aria-label*='Write a message' i]");
        if (textBox) {
          await textBox.click();
          await new Promise(r => setTimeout(r, 1000));

          await page.keyboard.type(pitch, { delay: 15 });
          await new Promise(r => setTimeout(r, 2000));

          // Find send button
          const sent = await page.evaluate(() => {
            const sendBtn = document.querySelector("button.msg-form__send-button, button[type='submit']");
            if (sendBtn && !sendBtn.disabled) {
              sendBtn.click();
              return true;
            }
            return false;
          });

          if (sent) {
            await new Promise(r => setTimeout(r, 4000));
            const timestamp = Date.now();
            const proofPath = path.join(OUTPUT_DIR, `lnkd_dm_${timestamp}.png`);
            await page.screenshot({ path: proofPath });
            console.log(`✔ Private LinkedIn message dispatched! Saved proof: ${proofPath}`);

            recordContactedLead({
              platform: 'linkedin_private_message',
              author: c.author,
              profileUrl: c.profileUrl,
              snippet: c.text,
              pitch,
              proofPath,
              platformFile: LEADS_FILE
            });

            logOutboundAttempt({
              platform: 'linkedin',
              candidateIdentity: { author: c.author },
              profileUrl: c.profileUrl,
              sourcePostUrl: searchUrl,
              qualificationResult: { candidate: true },
              personalizationResult: pitch,
              safetyGateResult: gate,
              sendResult: { sent: true, proofPath }
            });

            dmsSent++;
          }
        }
      } else {
        console.log(`   No direct private message button available for ${c.author} (requires connection). Skipping without public comment.`);
        logOutboundAttempt({
          platform: 'linkedin',
          candidateIdentity: { author: c.author },
          profileUrl: c.profileUrl,
          sourcePostUrl: searchUrl,
          qualificationResult: { candidate: true },
          personalizationResult: pitch,
          safetyGateResult: gate,
          sendResult: { sent: false, error: 'No direct private message button available' }
        });
      }
    }

    // 3. INBOUND CHECK: LinkedIn Messages only
    console.log(`🔍 [LINKEDIN SCOUT] Checking LinkedIn messaging for incoming client inquiries...`);
    await page.goto('https://www.linkedin.com/messaging/', { waitUntil: 'domcontentloaded', timeout: 35000 });
    await new Promise(r => setTimeout(r, 4000));

    const unreadMessages = await page.evaluate(() => {
      const unreadNodes = Array.from(document.querySelectorAll('.msg-conversation-card--unread, .msg-conversation-listitem__unread-count'));
      return unreadNodes.length;
    });

    if (unreadMessages > 0) {
      console.log(`🚨 FOUND ${unreadMessages} UNREAD CLIENT INQUIRIES ON LINKEDIN!`);
      await telegram.sendFounderAlert(
        '🔥 GARUDA LINKEDIN INBOUND LEAD ALERT',
        `You have ${unreadMessages} new unread client message(s) on LinkedIn.\nPlease check https://www.linkedin.com/messaging/ immediately.`
      );
    } else {
      console.log(`✔ LinkedIn messaging clean. 0 unread messages.`);
    }

    console.log(`✔ [LINKEDIN SCOUT DAEMON] Cycle completed. Private DMs sent: ${dmsSent}`);

  } catch (err) {
    console.error(`❌ [LINKEDIN SCOUT DAEMON] Error during cycle:`, err.message);
  } finally {
    await browser.close();
  }
}

async function startDaemon() {
  const lock = acquireProcessLock('linkedin_scout');
  if (!lock.acquired) {
    console.error(`🚨 [LINKEDIN SCOUT FATAL] Another LinkedIn Scout is ALREADY running under PID ${lock.existingPid}. Aborting duplicate start.`);
    process.exit(1);
  }

  console.log(`======================================================`);
  console.log(`🚀 [GARUDA LINKEDIN SCOUT DAEMON] Initialized (30m Interval)`);
  console.log(`🛡️ Mode: STRICT PRIVATE MESSAGING ONLY (Zero Public Comments)`);
  console.log(`🔒 PID: ${process.pid}`);
  console.log(`======================================================`);

  while (true) {
    try {
      await withCycleLock('linkedin_scout_cycle', async () => {
        await runScoutCycle();
      });
    } catch (e) {
      console.error('[LinkedIn Daemon Loop Error]:', e);
    }

    console.log(`\n💤 Sleeping 30 minutes until next cycle (${new Date(Date.now() + 30 * 60 * 1000).toLocaleTimeString()})...\n`);
    await new Promise(resolve => setTimeout(resolve, 30 * 60 * 1000));
  }
}

if (require.main === module) {
  startDaemon();
}

module.exports = { runScoutCycle, startDaemon };
