/**
 * GARUDA Facebook Autonomous Scout & Private Lead Closer Daemon
 * 
 * SOVEREIGN DIRECTIVE (Founder Praveen Mahawar):
 * - ZERO Public Comment Begging: Never drop generic public comments in front of other freelancers.
 * - Microscopic Intelligence ("Bareek-Bareek Cheeze Notice Karna"):
 *   1. Analyze the exact problem (business website, app, GHL, reference example, budget).
 *   2. Reach out privately via 1-on-1 Messenger Direct Message.
 *   3. Messenger E2EE confirmation/modal UI navigation.
 *   4. Authoritative tone, rapid 48-hour turnaround, signed by Founder Praveen Mahawar.
 *   5. Listen for incoming DMs and alert Founder Praveen immediately on Telegram.
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const telegram = require('../../src/services/telegramBotService');
const { isGloballyContacted, recordContactedLead, acquireProcessLock, withCycleLock } = require('./unified-lead-guard');
const { evaluateOutboundSafetyGate, logOutboundAttempt } = require('./outbound-safety-gate');

const LEADS_FILE = path.join(__dirname, '..', '..', 'data', 'leads', 'facebook_private_dms.json');
const OUTPUT_DIR = path.join(__dirname, '..', '..', 'output', 'scouts');

if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
if (!fs.existsSync(path.dirname(LEADS_FILE))) fs.mkdirSync(path.dirname(LEADS_FILE), { recursive: true });

const SEARCH_QUERIES = [
  'reputable and reliable web designer for business website',
  'need someone to design a website for me any suggestions',
  'looking for a reliable dependable website designer',
  'seeking a web designer for business responsive site',
  'need an app built react native flutter mobile developer',
  'looking for GoHighLevel automation specialist expert'
];

let queryIndex = 0;

function loadLeadsHistory() {
  try {
    if (fs.existsSync(LEADS_FILE)) {
      return JSON.parse(fs.readFileSync(LEADS_FILE, 'utf-8'));
    }
  } catch (e) {
    console.error('[FB Scout] Error loading leads history:', e.message);
  }
  return [];
}

function saveLead(lead) {
  const history = loadLeadsHistory();
  history.push(lead);
  fs.writeFileSync(LEADS_FILE, JSON.stringify(history, null, 2), 'utf-8');
}

function isAlreadyContacted(textSnippet, author) {
  const history = loadLeadsHistory();
  const normalizedText = (textSnippet || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const normalizedAuthor = (author || '').toLowerCase().trim();

  return history.some(h => {
    if (normalizedAuthor && h.author && h.author.toLowerCase().trim() === normalizedAuthor) return true;
    if (normalizedText && h.snippet) {
      const hNorm = h.snippet.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (hNorm && (normalizedText.includes(hNorm.slice(0, 30)) || hNorm.includes(normalizedText.slice(0, 30)))) return true;
    }
    return false;
  });
}

function craftMicroscopicPitch(author, snippet) {
  const s = snippet.toLowerCase();
  let specificContext = "Saw that you're seeking a reliable partner for your project — happy to review your exact requirements in private and share architectural wireframes upfront.";

  if (s.includes('example') || s.includes('reference') || s.includes('accomplish')) {
    specificContext = "Saw that you already have an example reference of what you're looking to accomplish — happy to review that reference in private and share technical wireframes upfront.";
  } else if (s.includes('business website')) {
    specificContext = "Saw that you need a high-converting, modern website specifically tailored for your business — happy to review your exact brand goals and share wireframes upfront.";
  } else if (s.includes('app') || s.includes('mobile') || s.includes('react native') || s.includes('flutter')) {
    specificContext = "Saw that you're looking to have a high-performance mobile app developed — our team specializes in cross-platform Android & iOS native builds with sub-second responsiveness.";
  } else if (s.includes('gohighlevel') || s.includes('ghl') || s.includes('automation')) {
    specificContext = "Saw that you're looking for advanced CRM and workflow automation — our team engineers custom webhook integrations and autonomous pipelines.";
  } else if (s.includes('affordable') || s.includes('budget')) {
    specificContext = "Saw that you're looking for high quality at an efficient price point — our modular architecture eliminates bloated agency retainers with transparent, fixed deliverables.";
  }

  const name = author && author !== 'Unknown' ? author.split(' ')[0] : 'there';

  return `Hi ${name}! Saw your note regarding needing a reputable developer for your project. Reaching out directly in private rather than adding noise to your public comments.\n\n${specificContext}\n\nOur team at GARUDA specializes in production-grade software and high-speed web/app engineering with rapid 48-hour turnarounds and zero monthly bloat.\n\nLive portfolio & interactive systems: https://www.garudaos.in\n\nBest regards,\nPraveen Mahawar\nFounder, GARUDA OS`;
}

async function runScoutCycle() {
  const cUser = process.env.FB_C_USER;
  const xs = process.env.FB_XS;

  if (!cUser || !xs) {
    console.error('[-] FB_C_USER or FB_XS missing in .env. Skipping cycle.');
    return;
  }

  const query = SEARCH_QUERIES[queryIndex % SEARCH_QUERIES.length];
  queryIndex++;

  console.log(`\n======================================================`);
  console.log(`🦅 [FB PRIVATE SCOUT DAEMON] Starting cycle at ${new Date().toISOString()}`);
  console.log(`🎯 Active Query [${queryIndex}/${SEARCH_QUERIES.length}]: "${query}"`);
  console.log(`======================================================`);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');

    await page.setCookie(
      { name: 'c_user', value: cUser.trim(), domain: '.facebook.com', path: '/', secure: true },
      { name: 'xs', value: xs.trim(), domain: '.facebook.com', path: '/', httpOnly: true, secure: true }
    );

    // 1. Search Facebook Posts
    const searchUrl = 'https://www.facebook.com/search/posts/?q=' + encodeURIComponent(query);
    console.log(`▶ Navigating to Facebook Search: ${searchUrl}`);
    await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 35000 });
    await new Promise(r => setTimeout(r, 6000));

    // Scroll to load real user posts
    await page.evaluate(() => window.scrollBy(0, 800));
    await new Promise(r => setTimeout(r, 3000));

    // 2. Discover post candidates with profile links
    const candidates = await page.evaluate(() => {
      const posts = [];
      const postElements = Array.from(document.querySelectorAll("div[role='feed'] > div, div[role='article']"));

      for (const el of postElements) {
        const text = el.textContent || '';
        if (text.startsWith('FacebookFacebook') || text.length < 25) continue;

        const isNeed = /looking for|need someone|recommend|seeking|need a|web designer|developer|build|website|app/i.test(text);
        if (!isNeed) continue;

        // Negative intent filter: ignore promotional vendor advertisements
        const isVendor = /build your app on|our agency|our services|hire our team|we offer|sign up today|download our|pricing plan/i.test(text);
        if (isVendor) continue;

        // Extract author name and profile link
        let author = '';
        let profileLink = '';
        const authorLink = el.querySelector("h2 a[role='link'], h3 a[role='link'], strong a[role='link'], a[role='link'][tabindex='0']");
        if (authorLink) {
          author = authorLink.textContent.trim();
          profileLink = authorLink.href;
        }

        if (!author || author === 'Facebook' || author === 'Meta') continue;

        posts.push({
          author,
          profileLink,
          text: text.slice(0, 200).replace(/\s+/g, ' ')
        });
      }
      return posts;
    });

    console.log(`▶ Discovered ${candidates.length} candidate posts in feed.`);

    // 3. Private DM Outreach (Microscopic Intelligence)
    let dmsSentInThisCycle = 0;
    for (const c of candidates) {
      if (dmsSentInThisCycle >= 2) break; // Maximum 2 high-quality private DMs per 30m cycle

      const pitch = craftMicroscopicPitch(c.author, c.text);

      // Centralized Outbound Safety Gate Check
      const gate = evaluateOutboundSafetyGate({
        platform: 'facebook',
        author: c.author,
        profileUrl: c.profileLink,
        snippet: c.text,
        pitch,
        currentCycleCount: dmsSentInThisCycle
      });

      if (!gate.allowed) {
        console.log(`🔒 [SAFETY GATE BLOCKED] ${c.author}: ${gate.reason} (Gate: ${gate.gate})`);
        logOutboundAttempt({
          platform: 'facebook',
          candidateIdentity: { author: c.author },
          profileUrl: c.profileLink,
          sourcePostUrl: searchUrl,
          qualificationResult: { isNeed: true },
          personalizationResult: pitch,
          safetyGateResult: gate
        });
        continue;
      }

      console.log(`🎯 Targeting fresh lead for Private DM: ${c.author}`);
      console.log(`   Snippet: "${c.text.slice(0, 70)}..."`);

      let openedChat = false;

      // If profile link exists, navigate to their profile to click Message
      if (c.profileLink) {
        console.log(`▶ Opening profile: ${c.profileLink}`);
        await page.goto(c.profileLink, { waitUntil: 'domcontentloaded', timeout: 35000 });
        await new Promise(r => setTimeout(r, 5000));

        // Click [ Message ] button
        const clickedMsg = await page.evaluate(() => {
          const btns = Array.from(document.querySelectorAll("div[role='button'], a[role='button'], [aria-label*='Message' i]"));
          for (const b of btns) {
            if (b.textContent && b.textContent.trim().toLowerCase() === 'message') {
              b.scrollIntoView({ behavior: 'instant', block: 'center' });
              b.click();
              return true;
            }
          }
          return false;
        });

        console.log(`   Clicked Message button on profile?`, clickedMsg);
        openedChat = clickedMsg;
        await new Promise(r => setTimeout(r, 4000));
      }

      // Messenger E2EE confirmation/modal UI navigation
      await page.evaluate(() => {
        const all = Array.from(document.querySelectorAll('div, span, button'));
        for (const el of all) {
          if (el.textContent && el.textContent.trim() === 'Continue') {
            el.click();
            break;
          }
        }
      });
      await new Promise(r => setTimeout(r, 2000));

      // Find message input box
      const textBox = await page.$("div[role='textbox'][aria-label*='Write' i], div[role='textbox'][aria-label*='Message' i], div[contenteditable='true'][role='textbox'], div[aria-label='Message'], div[contenteditable='true']");

      if (textBox) {
        console.log(`   Found private chat box for ${c.author}! Typing executive brief...`);
        await textBox.click();
        await new Promise(r => setTimeout(r, 1000));

        const pitch = craftMicroscopicPitch(c.author, c.text);

        // Type clean text with Shift+Enter for clean paragraph structure
        const paragraphs = pitch.split('\n\n');
        for (let i = 0; i < paragraphs.length; i++) {
          await page.keyboard.type(paragraphs[i], { delay: 12 });
          if (i < paragraphs.length - 1) {
            await page.keyboard.down('Shift');
            await page.keyboard.press('Enter');
            await page.keyboard.press('Enter');
            await page.keyboard.up('Shift');
            await new Promise(r => setTimeout(r, 150));
          }
        }

        await new Promise(r => setTimeout(r, 2000));
        console.log(`   Dispatching private DM...`);
        await page.keyboard.press('Enter');
        await new Promise(r => setTimeout(r, 5000));

        const timestamp = Date.now();
        const proofPath = path.join(OUTPUT_DIR, `fb_dm_${timestamp}.png`);
        await page.screenshot({ path: proofPath });
        console.log(`✔ Private DM delivered! Saved proof: ${proofPath}`);

        recordContactedLead({
          platform: 'facebook_messenger_private',
          author: c.author,
          profileUrl: c.profileLink,
          snippet: c.text,
          query,
          pitch,
          proofPath,
          platformFile: LEADS_FILE
        });

        logOutboundAttempt({
          platform: 'facebook',
          candidateIdentity: { author: c.author },
          profileUrl: c.profileLink,
          sourcePostUrl: searchUrl,
          qualificationResult: { isNeed: true },
          personalizationResult: pitch,
          safetyGateResult: gate,
          sendResult: { sent: true, proofPath }
        });

        dmsSentInThisCycle++;
      } else {
        console.log(`   No message box found for ${c.author} (privacy restricted).`);
        logOutboundAttempt({
          platform: 'facebook',
          candidateIdentity: { author: c.author },
          profileUrl: c.profileLink,
          sourcePostUrl: searchUrl,
          qualificationResult: { isNeed: true },
          personalizationResult: pitch,
          safetyGateResult: gate,
          sendResult: { sent: false, error: 'No message box found (privacy restricted)' }
        });
      }
    }

    // 4. Inbound Check: Notifications & Messenger
    console.log(`🔍 [FB SCOUT] Checking notifications and Messenger for replies...`);
    await page.goto('https://www.facebook.com/notifications', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await new Promise(r => setTimeout(r, 4000));

    const unreadNotifications = await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll("div[role='feed'] div, div[role='article']"));
      const alerts = [];
      for (const el of items) {
        const text = el.textContent || '';
        if (text.includes('sent you a message') || text.includes('replied to') || text.includes('message request')) {
          alerts.push(text.slice(0, 150));
        }
      }
      return alerts;
    });

    if (unreadNotifications.length > 0) {
      console.log(`🚨 FOUND ${unreadNotifications.length} PROSPECT INBOUND RESPONSES!`);
      for (const alert of unreadNotifications.slice(0, 3)) {
        await telegram.sendFounderAlert(
          '🔥 GARUDA FACEBOOK INBOUND DEAL ALERT',
          `Prospect responded on Facebook:\n\n"${alert}"\n\nPlease check Facebook Messenger immediately.`
        );
      }
    } else {
      console.log(`✔ Notifications clean. 0 unhandled alerts.`);
    }

    console.log(`✔ [FB PRIVATE SCOUT DAEMON] Cycle completed. Private DMs sent this run: ${dmsSentInThisCycle}`);

  } catch (err) {
    console.error(`❌ [FB PRIVATE SCOUT DAEMON] Error during cycle:`, err.message);
  } finally {
    await browser.close();
  }
}

async function startDaemon() {
  const lock = acquireProcessLock('facebook_scout');
  if (!lock.acquired) {
    console.error(`🚨 [FB SCOUT FATAL] Another Facebook Scout is ALREADY running under PID ${lock.existingPid}. Aborting duplicate start.`);
    process.exit(1);
  }

  console.log(`======================================================`);
  console.log(`🚀 [GARUDA FB PRIVATE SCOUT DAEMON] Initialized (30m Interval)`);
  console.log(`🛡️ Mode: STRICT PRIVATE EXECUTIVE DMs (Zero Public Comments)`);
  console.log(`🔒 PID: ${process.pid}`);
  console.log(`======================================================`);

  while (true) {
    try {
      await withCycleLock('facebook_scout_cycle', async () => {
        await runScoutCycle();
      });
    } catch (e) {
      console.error('[FB Daemon Loop Error]:', e);
    }

    console.log(`\n💤 Sleeping 30 minutes until next cycle (${new Date(Date.now() + 30 * 60 * 1000).toLocaleTimeString()})...\n`);
    await new Promise(resolve => setTimeout(resolve, 30 * 60 * 1000));
  }
}

if (require.main === module) {
  startDaemon();
}

module.exports = { runScoutCycle, startDaemon };
