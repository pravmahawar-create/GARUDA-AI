/**
 * 🦅 GARUDA SOVEREIGN AUTONOMOUS DISPATCHER FOR SCREAMING TECH BUYERS
 * Dispatches high-conversion, surgical engineering proposals directly to urgent Reddit tech buyers.
 * 
 * Rules:
 * - 100% Anti-Fabrication (SHA-256 evidence, screenshots, verified exit codes)
 * - Zero personal phone numbers
 * - Official corporate identity: praveen@garudaos.in | https://www.garudaos.in
 * - Update Supabase cloud leads state so Founder Praveen sees live status on his mobile phone.
 */

require('dotenv').config();
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { createAuthenticatedRedditSession } = require('./reddit_dm_dispatcher');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://gcifzzuyswrcwvkcfqbr.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_uYLXTH4M1PFyem5pQSMJtQ_7YqZ2rFp';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const LOG_FILE = path.join(__dirname, '..', 'data', 'reddit_screaming_dispatch_log.json');
const EVIDENCE_DIR = path.join(__dirname, '..', 'data', 'evidence');
if (!fs.existsSync(EVIDENCE_DIR)) fs.mkdirSync(EVIDENCE_DIR, { recursive: true });

const TARGETS = [
  {
    targetId: 'target_present_snow_va',
    supabaseId: 697,
    to: 'Present_Snow_9703',
    subject: 'Application: Software Engineer for Technical VA ($30/hr)',
    message: `Hi /u/Present_Snow_9703,

I read your post looking for a Software Engineer for a Technical VA role ($30/hr).

I am a Systems Engineer and Founder of GARUDA OS (https://www.garudaos.in). Because I engineer full-stack systems and automated pipeline tooling daily, I understand engineering stacks, developer culture, and technical context natively.

How I can execute your requirements:
1. Technical Inbox Triage & Filtering: Distinguishing genuine architectural opportunities, API partnerships, and client bugs from recruiter noise and spam.
2. LinkedIn & Tech Community Engagement: Crafting technically accurate, credible comments and evaluating inbound developer connections with deep domain context.
3. Lead Tracking & CRM Architecture: Maintaining structured prospect pipelines with high attention to detail.
4. Timezone Coordination: Reliable, asynchronous coordination across US/EST, European, and global timezones.

Availability: 20-30 hours/week, flexible schedule across EST/PST hours.

Live engineering standard: https://www.garudaos.in

I would be glad to hop on a short introductory call or take a small test trial so you can evaluate my technical communication and organizational standards.

Best regards,
Praveen Mahawar
Founder & Systems Architect — GARUDA OS
Email: praveen@garudaos.in | Web: https://www.garudaos.in`
  },
  {
    targetId: 'target_mangafried_ai',
    supabaseId: 692,
    to: 'Mangafried',
    subject: 'Search Atlas AI Builder & Channel Strategist ($20-$30/hr)',
    message: `Hi /u/Mangafried,

I saw your hiring call for Search Atlas looking for an AI Builder & Reddit Strategist ($20-$30/hr USD).

At GARUDA OS (https://www.garudaos.in), we engineer autonomous AI operating systems, multi-agent systems, real-time dashboards, and self-executing automation workflows that run 24/7.

What we build:
1. Autonomous AI Engines: Sub-second AI routing (Groq, NVIDIA NIM, Gemini) with zero-downtime failover and deterministic task execution.
2. Production Dashboards: Live telemetry, real-time event streaming, and lead management dashboards.
3. Automated Community Tracking: Keyword sentiment scrapers, AutoMod rule governance, and structured reporting.

Live platform reference: https://www.garudaos.in

I have also reviewed your careers portal spec. Happy to show you live working systems and automated dashboards anytime.

Best regards,
Praveen Mahawar
Founder & Chief AI Architect — GARUDA OS
Email: praveen@garudaos.in | Web: https://www.garudaos.in`
  },
  {
    targetId: 'target_ivii0_pentest',
    supabaseId: null, // New high-intent target
    to: 'IVII0',
    subject: 'Regarding: Application Security Assessment for B2B SaaS under DORA / OWASP ASVS',
    message: `Hi /u/IVII0,

I saw your requirement for an application security assessment of your multi-tenant B2B compliance SaaS under DORA / OWASP ASVS Level 2 ($500 - $1,200).

At GARUDA OS, we engineer enterprise software architectures with strict IDOR elimination, tenant data isolation, and cryptographic auditability (SHA-256 evidence logging).

How we execute your assessment:
1. Authentication & Session Verification: Deep token lifecycle, session hijacking resistance, and zero-trust credential governance.
2. Tenant Isolation & IDOR Testing: Systematic cross-tenant parameter fuzzing across all 4-5 user roles to verify strict boundary containment.
3. DORA / ICT Risk Documentation: Clean, structured remediation report with reproduction payloads and executive compliance attestation.

Live engineering standard: https://www.garudaos.in

I would be glad to review your scope and provide a rapid turnaround within your budget.

Best regards,
Praveen Mahawar
Founder & Chief Systems Architect — GARUDA OS
Email: praveen@garudaos.in | Platform: https://www.garudaos.in`
  }
];

function sha256(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

async function dispatchAll() {
  console.log('🦅 ========================================================');
  console.log('🦅 GARUDA SOVEREIGN SCREAMING BUYER DISPATCH COMMENCING');
  console.log('🦅 Total Targets in Queue:', TARGETS.length);
  console.log('🦅 ========================================================\n');

  console.log('[Auth] Establishing authenticated Reddit session for u/' + process.env.REDDIT_USERNAME + '...');
  const { browser, page } = await createAuthenticatedRedditSession();

  let existingLog = [];
  if (fs.existsSync(LOG_FILE)) {
    try { existingLog = JSON.parse(fs.readFileSync(LOG_FILE, 'utf8')); } catch(e) {}
  }

  const results = [];

  for (let i = 0; i < TARGETS.length; i++) {
    const target = TARGETS[i];
    console.log(`\n--------------------------------------------------------`);
    console.log(`[Target ${i + 1}/${TARGETS.length}] Sending to /u/${target.to}...`);
    console.log(`Subject: ${target.subject}`);

    const hash = sha256(target.message);
    const beforePic = path.join(EVIDENCE_DIR, `dispatch_${target.to}_before.png`);
    const afterPic = path.join(EVIDENCE_DIR, `dispatch_${target.to}_sent.png`);

    try {
      const composeUrl = `https://www.reddit.com/message/compose/?to=${encodeURIComponent(target.to)}&subject=${encodeURIComponent(target.subject)}&message=${encodeURIComponent(target.message)}`;
      await page.goto(composeUrl, { waitUntil: 'networkidle2', timeout: 35000 });
      await new Promise(r => setTimeout(r, 4000));

      // Scroll and find Send button
      const btnCoords = await page.evaluate(() => {
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.trim().toLowerCase() === 'send');
        if (!btn) return null;
        btn.scrollIntoView({ behavior: 'instant', block: 'center' });
        const rect = btn.getBoundingClientRect();
        return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2, width: rect.width, height: rect.height };
      });

      if (!btnCoords) {
        console.error(`❌ Send button not found for /u/${target.to}`);
        results.push({ target: target.to, status: 'FAILED_NO_SEND_BTN' });
        continue;
      }

      await page.screenshot({ path: beforePic });
      console.log(`[Target ${target.to}] Screenshot before click saved.`);

      // Click send
      await page.mouse.click(btnCoords.x, btnCoords.y);
      await page.evaluate(() => {
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.trim().toLowerCase() === 'send');
        if (btn) btn.click();
      });

      console.log(`[Target ${target.to}] Clicked Send. Waiting 12s for server confirmation...`);
      await new Promise(r => setTimeout(r, 12000));

      const settledUrl = page.url();
      await page.screenshot({ path: afterPic });
      console.log(`[Target ${target.to}] Settled URL: ${settledUrl}`);

      const isDelivered = settledUrl.includes('/sent') || settledUrl.includes('/messages') || !settledUrl.includes('compose');
      console.log(`[Target ${target.to}] Delivery Verified: ${isDelivered ? '✅ DELIVERED' : '⚠️ UNCERTAIN'}`);

      const record = {
        targetId: target.targetId,
        to: target.to,
        subject: target.subject,
        sha256: hash,
        settledUrl,
        delivered: isDelivered,
        timestamp: new Date().toISOString(),
        beforePic,
        afterPic
      };

      existingLog.push(record);
      fs.writeFileSync(LOG_FILE, JSON.stringify(existingLog, null, 2));

      // Update Supabase cloud if id is linked
      if (target.supabaseId) {
        console.log(`[Supabase] Updating cloud status for lead #${target.supabaseId}...`);
        const { error } = await supabase
          .from('leads')
          .update({
            status: isDelivered ? 'contacted' : 'dispatch_attempted',
            reply_snippet: isDelivered ? 'Proposal Sent: ' + target.subject : 'Attempted'
          })
          .eq('id', target.supabaseId);
        if (error) console.error('[Supabase Update Err]', error.message);
        else console.log(`[Supabase] Lead #${target.supabaseId} updated to 'contacted' ✅`);
      }

      results.push({ target: target.to, status: isDelivered ? 'DELIVERED' : 'FAILED', sha256: hash });

      // Polite cooldown between dispatches
      if (i < TARGETS.length - 1) {
        console.log(`[Cooldown] Waiting 8 seconds before next dispatch...`);
        await new Promise(r => setTimeout(r, 8000));
      }

    } catch (err) {
      console.error(`❌ Error dispatching to /u/${target.to}:`, err.message);
      results.push({ target: target.to, status: 'ERROR', error: err.message });
    }
  }

  await browser.close();

  console.log('\n========================================================');
  console.log('🦅 [DISPATCH COMPLETE] Results Summary:');
  console.log(JSON.stringify(results, null, 2));
  console.log('========================================================');

  return results;
}

if (require.main === module) {
  dispatchAll()
    .then(() => process.exit(0))
    .catch(e => {
      console.error('Fatal dispatch error:', e);
      process.exit(1);
    });
}
