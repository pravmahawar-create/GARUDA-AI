/**
 * GARUDA Instagram Autonomous Scout & Private Lead Closer Daemon
 * 
 * SOVEREIGN DIRECTIVES (Founder Praveen Mahawar):
 * - ZERO Public Comments: Never drop generic public comments under posts.
 * - Strict Private Executive DMs only.
 * - Cross-Platform Deduplication: Checks unified lead guard across FB, IG, LinkedIn.
 * - Hardened Post Author Extraction: Rejects system accounts (@instagram, @meta, @explore).
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const telegram = require('../../src/services/telegramBotService');
const { isGloballyContacted, recordContactedLead, acquireProcessLock, withCycleLock } = require('./unified-lead-guard');
const { evaluateOutboundSafetyGate, logOutboundAttempt } = require('./outbound-safety-gate');

const LEADS_FILE = path.join(__dirname, '..', '..', 'data', 'leads', 'instagram_private_dms.json');
const OUTPUT_DIR = path.join(__dirname, '..', '..', 'output', 'scouts');

if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
if (!fs.existsSync(path.dirname(LEADS_FILE))) fs.mkdirSync(path.dirname(LEADS_FILE), { recursive: true });

const HASHTAGS = [
  'needwebsite',
  'lookingforwebdesigner',
  'webdeveloperneeded',
  'appdeveloperneeded',
  'needappdeveloper'
];

const SYSTEM_ACCOUNTS = ['instagram', 'meta', 'threads', 'explore', 'direct', 'reels', 'stories', 'garudaos.ai'];

let tagIndex = 0;

async function runScoutCycle() {
  const sessionId = process.env.INSTAGRAM_SESSION_ID;
  const userId = process.env.INSTAGRAM_USER_ID;

  if (!sessionId || !userId) {
    console.warn('⚠️ [IG SCOUT] INSTAGRAM_SESSION_ID or INSTAGRAM_USER_ID missing in .env. STATUS = BLOCKED.');
    return;
  }

  const tag = HASHTAGS[tagIndex % HASHTAGS.length];
  tagIndex++;

  console.log(`\n======================================================`);
  console.log(`🦅 [INSTAGRAM PRIVATE SCOUT DAEMON] Starting cycle at ${new Date().toISOString()}`);
  console.log(`🛡️ Mode: STRICT PRIVATE EXECUTIVE DMs (Zero Public Comments)`);
  console.log(`🎯 Active Hashtag [${tagIndex}/${HASHTAGS.length}]: "#${tag}"`);
  console.log(`======================================================`);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,900']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');

    await page.setCookie(
      { name: 'sessionid', value: sessionId.trim(), domain: '.instagram.com', path: '/' },
      { name: 'ds_user_id', value: userId.trim(), domain: '.instagram.com', path: '/' }
    );

    // 1. Explore Hashtag Posts
    await page.goto(`https://www.instagram.com/explore/tags/${tag}/`, { waitUntil: 'domcontentloaded', timeout: 40000 });
    await new Promise(r => setTimeout(r, 6000));

    // Check if session is expired
    const isLogin = await page.evaluate(() => Boolean(document.querySelector("input[name='username']")));
    if (isLogin) {
      console.warn('⚠️ [IG SCOUT] Instagram session expired or requires login. STATUS = BLOCKED.');
      return;
    }

    // 2. Discover post author links
    const postLinks = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll("a[href*='/p/']"));
      return links.slice(0, 5).map(a => a.href);
    });

    console.log(`▶ Discovered ${postLinks.length} posts under #${tag}`);

    let dmsSent = 0;
    for (const postUrl of postLinks) {
      if (dmsSent >= 1) break; // Strict rate limit: 1 careful DM per cycle to preserve IG health

      console.log(`▶ Inspecting post: ${postUrl}`);
      await page.goto(postUrl, { waitUntil: 'domcontentloaded', timeout: 35000 });
      await new Promise(r => setTimeout(r, 4000));

      // Hardened author extraction targeting post header specifically
      const username = await page.evaluate((systemList) => {
        const headerLink = document.querySelector("article header a[role='link']:not([href*='/explore/'])");
        if (headerLink) {
          const text = (headerLink.textContent || '').trim();
          if (text && !systemList.includes(text.toLowerCase())) return text;
          const href = headerLink.getAttribute('href') || '';
          const clean = href.replace(/^\/+|\/+$/g, '');
          if (clean && !systemList.includes(clean.toLowerCase())) return clean;
        }

        const candidateLinks = Array.from(document.querySelectorAll("article a[role='link']"));
        for (const a of candidateLinks) {
          const href = a.getAttribute('href') || '';
          if (href.startsWith('/') && !href.includes('/p/') && !href.includes('/explore/') && !href.includes('/direct/')) {
            const clean = href.replace(/^\/+|\/+$/g, '');
            if (clean && !systemList.includes(clean.toLowerCase())) return clean;
          }
        }
        return null;
      }, SYSTEM_ACCOUNTS);

      if (!username || SYSTEM_ACCOUNTS.includes(username.toLowerCase().trim())) {
        console.log(`⏩ Skipping invalid/system account: ${username}`);
        continue;
      }

      // GLOBAL DEDUPLICATION CHECK
      const profileUrl = `https://www.instagram.com/${username}/`;
      const pitch = `Hi! Saw your post regarding needing a website or digital development. Reaching out directly in private rather than adding noise to public comments.\n\nOur engineering team at GARUDA crafts custom, modern websites and high-performance apps with rapid 48-hour turnarounds and zero monthly bloat.\n\nFeel free to explore our live systems and portfolio at https://www.garudaos.in — happy to review your project scope in private!\n\nBest regards,\nPraveen Mahawar\nFounder, GARUDA OS`;

      // Centralized Outbound Safety Gate Check
      const gate = evaluateOutboundSafetyGate({
        platform: 'instagram',
        username,
        author: username,
        profileUrl,
        snippet: tag,
        pitch,
        currentCycleCount: dmsSent
      });

      if (!gate.allowed) {
        console.log(`🔒 [SAFETY GATE BLOCKED] @${username}: ${gate.reason} (Gate: ${gate.gate})`);
        logOutboundAttempt({
          platform: 'instagram',
          candidateIdentity: { username },
          profileUrl,
          sourcePostUrl: postUrl,
          qualificationResult: { tag },
          personalizationResult: pitch,
          safetyGateResult: gate
        });
        continue;
      }

      console.log(`🎯 Targeting fresh Instagram lead for Private DM: @${username}`);
      await page.goto(profileUrl, { waitUntil: 'domcontentloaded', timeout: 35000 });
      await new Promise(r => setTimeout(r, 4000));

      // Look for [ Message ] button
      const clickedMsg = await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll("div[role='button'], button, a"));
        for (const b of btns) {
          if (b.textContent && b.textContent.trim().toLowerCase() === 'message') {
            b.click();
            return true;
          }
        }
        return false;
      });

      if (clickedMsg) {
        console.log(`   Clicked Message button on @${username}! Waiting for chat...`);
        await new Promise(r => setTimeout(r, 5000));

        // Dismiss "Not Now" notifications popup if shown
        await page.evaluate(() => {
          const btns = Array.from(document.querySelectorAll("button"));
          for (const b of btns) {
            if (b.textContent && b.textContent.trim().toLowerCase() === 'not now') {
              b.click();
              break;
            }
          }
        });
        await new Promise(r => setTimeout(r, 2000));

        const textBox = await page.$("div[role='textbox'][aria-label*='Message' i], div[contenteditable='true']");
        if (textBox) {
          await textBox.click();
          await new Promise(r => setTimeout(r, 1000));

          await page.keyboard.type(pitch, { delay: 14 });
          await new Promise(r => setTimeout(r, 2000));
          await page.keyboard.press('Enter');
          await new Promise(r => setTimeout(r, 5000));

          const timestamp = Date.now();
          const proofPath = path.join(OUTPUT_DIR, `ig_dm_${timestamp}.png`);
          await page.screenshot({ path: proofPath });
          console.log(`✔ Private Instagram DM sent! Saved proof: ${proofPath}`);

          recordContactedLead({
            platform: 'instagram_direct',
            username,
            author: username,
            profileUrl,
            tag,
            pitch,
            proofPath,
            platformFile: LEADS_FILE
          });

          logOutboundAttempt({
            platform: 'instagram',
            candidateIdentity: { username },
            profileUrl,
            sourcePostUrl: postUrl,
            qualificationResult: { tag },
            personalizationResult: pitch,
            safetyGateResult: gate,
            sendResult: { sent: true, proofPath }
          });

          dmsSent++;
        }
      } else {
        console.log(`   No direct Message button available for @${username}. Skipping.`);
        logOutboundAttempt({
          platform: 'instagram',
          candidateIdentity: { username },
          profileUrl,
          sourcePostUrl: postUrl,
          qualificationResult: { tag },
          personalizationResult: pitch,
          safetyGateResult: gate,
          sendResult: { sent: false, error: 'No direct Message button available' }
        });
      }
    }

    // 3. Check Direct Inbox for inbound inquiries
    console.log(`🔍 [IG SCOUT] Checking Direct Inbox for client inquiries...`);
    await page.goto('https://www.instagram.com/direct/inbox/', { waitUntil: 'domcontentloaded', timeout: 35000 });
    await new Promise(r => setTimeout(r, 5000));

    const unreadCount = await page.evaluate(() => {
      const badge = document.querySelector("a[href*='/direct/inbox/'] span");
      return badge ? parseInt(badge.textContent.trim()) || 0 : 0;
    });

    if (unreadCount > 0) {
      console.log(`🚨 FOUND ${unreadCount} UNREAD DMs ON INSTAGRAM!`);
      await telegram.sendFounderAlert(
        '🔥 GARUDA INSTAGRAM INBOUND DM ALERT',
        `You have ${unreadCount} new unread Direct Message(s) on Instagram (@garudaos.ai).\nPlease check Instagram DM immediately.`
      );
    } else {
      console.log(`✔ Instagram Direct Inbox checked. 0 unread inquiries.`);
    }

  } catch (err) {
    console.error(`❌ [INSTAGRAM SCOUT DAEMON] Error during cycle:`, err.message);
  } finally {
    await browser.close();
  }
}

async function startDaemon() {
  const lock = acquireProcessLock('instagram_scout');
  if (!lock.acquired) {
    console.error(`🚨 [IG SCOUT FATAL] Another Instagram Scout is ALREADY running under PID ${lock.existingPid}. Aborting duplicate start.`);
    process.exit(1);
  }

  console.log(`======================================================`);
  console.log(`🚀 [GARUDA INSTAGRAM PRIVATE SCOUT DAEMON] Initialized (30m Interval)`);
  console.log(`🛡️ Mode: STRICT PRIVATE EXECUTIVE DMs (Zero Public Comments)`);
  console.log(`🔒 PID: ${process.pid}`);
  console.log(`======================================================`);

  while (true) {
    try {
      await withCycleLock('instagram_scout_cycle', async () => {
        await runScoutCycle();
      });
    } catch (e) {
      console.error('[Instagram Daemon Loop Error]:', e);
    }

    console.log(`\n💤 Sleeping 30 minutes until next cycle...\n`);
    await new Promise(resolve => setTimeout(resolve, 30 * 60 * 1000));
  }
}

if (require.main === module) {
  startDaemon();
}

module.exports = { runScoutCycle, startDaemon };
