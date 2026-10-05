/**
 * 🦅 GARUDA SOVEREIGN TECH PROBLEM & HIGH-INTENT GIG SCOUT
 * Scans public developer communities (Upwork, Reddit, Facebook Groups)
 * for real founders and businesses with urgent paid tech problems.
 * Generates instant killer proposals with live interactive demo links.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
require('dotenv').config();

const telegram = require('../../src/services/telegramBotService');
const OUTPUT_FILE = path.join(__dirname, '..', '..', 'data', 'live-tech-opportunities.json');

const SERPER_API_KEY = process.env.SERPER_API_KEY;

const SEARCH_STREAMS = [
  {
    category: 'UPWORK_HIGH_INTENT',
    label: 'Upwork Live Client Gigs ($500 - $2,500)',
    query: 'site:upwork.com/freelance-jobs ("AI receptionist" OR "WhatsApp bot" OR "n8n automation" OR "React Node")',
    demoUrl: 'https://www.garudaos.in/demos/smile-multispeciality-dental-clinic'
  },
  {
    category: 'REDDIT_HIRING',
    label: 'Reddit r/forhire & r/SaaS [Hiring]',
    query: 'site:reddit.com/r/forhire "[Hiring]" ("bot" OR "automation" OR "website" OR "AI")',
    demoUrl: 'https://www.garudaos.in/chat?ref=TECH_PROBLEM_SCOUT'
  },
  {
    category: 'FB_GHL_AUTOMATION',
    label: 'Facebook GoHighLevel & Agency Automation Groups',
    query: 'site:facebook.com/groups ("GoHighLevel" OR "GHL") ("need a developer" OR "looking for developer" OR "automation help")',
    demoUrl: 'https://www.garudaos.in/demos/3r-car-care'
  },
  {
    category: 'UK_HIGH_TICKET_TUITION',
    label: 'UK 11+ & GCSE High-Ticket Tuition Requests (Parent Groups)',
    query: 'site:facebook.com/groups ("UK Tutors" OR "GCSE Tutors" OR "11 Plus Parents")',
    demoUrl: 'https://www.garudaos.in'
  }
];

function querySerper(query) {
  return new Promise((resolve, reject) => {
    if (!SERPER_API_KEY) {
      return reject(new Error('SERPER_API_KEY is missing in .env'));
    }
    const payload = JSON.stringify({ q: query, num: 4, tbs: 'qdr:m' });
    const req = https.request('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': SERPER_API_KEY,
        'Content-Type': 'application/json'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

function generateProposal(category, title, snippet, link) {
  if (category === 'UPWORK_HIGH_INTENT') {
    return (
      `Hi there,\n\n` +
      `We don't need 2 weeks of trial-and-error to build this — we have a battle-tested architecture already running live in production.\n\n` +
      `Check our live working interactive demo here:\n` +
      `👉 https://www.garudaos.in/chat?ref=UPWORK_SCOUT\n\n` +
      `What we deliver in 48 hours flat:\n` +
      `1. End-to-end webhook & API integration (Node.js / n8n / Meta WhatsApp Business API).\n` +
      `2. Sub-second response latency with bulletproof fallback error handling.\n` +
      `3. Automated admin escalation & calendar synchronization.\n\n` +
      `Turnaround: 48 Hours | Fixed Milestone Guarantee.\n` +
      `Available for a 5-minute screen share today.\n\n` +
      `- Praveen Mahawar (Founder, GARUDA OS | praveen@garudaos.in)`
    );
  }

  if (category === 'FB_GHL_AUTOMATION') {
    return (
      `Hey! Saw your post regarding GHL automation / webhook integration.\n\n` +
      `Most people struggle with GoHighLevel because standard native triggers drop leads when webhooks timeout. We solve this by bridging GHL with custom Node.js serverless micro-nodes.\n\n` +
      `We recently built this exact automation flow:\n` +
      `• Instant Meta Ad Lead Capture -> 24/7 AI WhatsApp engagement in <3 seconds.\n` +
      `• Auto-tagging & Calendar Booking into GHL.\n` +
      `• Working Demo: https://www.garudaos.in/demos/perfect-carz-spa\n\n` +
      `Happy to hop on a quick call or show you the architecture. Let me know!\n` +
      `- Praveen Mahawar (GARUDA OS)`
    );
  }

  if (category === 'UK_HIGH_TICKET_TUITION') {
    return (
      `Hello! If you are seeking specialized 1-on-1 GCSE / 11+ guidance, we offer diagnostic assessments that isolate exactly where the student is dropping marks (Maths, Science, Verbal Reasoning).\n\n` +
      `• Personalized curriculum tailored to UK exam boards (Edexcel, AQA, OCR, GL Assessment).\n` +
      `• Free 30-minute diagnostic session & baseline report.\n\n` +
      `Feel free to message here or email us at praveen@garudaos.in for schedule details.`
    );
  }

  return (
    `Hi,\n\n` +
    `Saw your requirements for "${title}". We specialize in rapid 24-48 hour MVP delivery and custom automation bots.\n\n` +
    `Live Proof & Portfolio: https://www.garudaos.in\n` +
    `Full stack: Node.js, React, n8n, WhatsApp API, Sub-second AI inference.\n\n` +
    `Let's connect if you need this delivered cleanly with zero bugs.\n` +
    `- Praveen Mahawar (praveen@garudaos.in)`
  );
}

async function runScout(options = {}) {
  console.log('🦅 [GARUDA TECH PROBLEM SCOUT] Initializing public high-intent stream scan...');
  const opportunities = [];

  for (const stream of SEARCH_STREAMS) {
    console.log(`\n🔍 Scanning Stream: ${stream.label}...`);
    try {
      const result = await querySerper(stream.query);
      if (result && result.organic && result.organic.length > 0) {
        for (const item of result.organic) {
          const proposal = generateProposal(stream.category, item.title, item.snippet, item.link);
          opportunities.push({
            id: `OPP_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            category: stream.category,
            categoryLabel: stream.label,
            title: item.title,
            snippet: item.snippet,
            link: item.link,
            date: item.date || 'Recent',
            recommendedPitch: proposal,
            scoutedAt: new Date().toISOString()
          });
        }
        console.log(`   ✔ Found ${result.organic.length} high-intent posts in this stream.`);
      } else {
        console.log(`   ⚠ No fresh organic posts found for query: ${stream.query}`);
      }
    } catch (err) {
      console.error(`   ❌ Failed to query stream ${stream.label}:`, err.message);
    }
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(opportunities, null, 2), 'utf8');
  console.log(`\n✔ Saved ${opportunities.length} high-intent tech opportunities to ${OUTPUT_FILE}`);

  if (options.notifyTelegram && opportunities.length > 0) {
    console.log('📱 Dispatching Telegram alert to Founder Praveen...');
    const header = 
      `🦅 *GARUDA HIGH-INTENT TECH SCOUT ALERT*\n\n` +
      `Founder Praveen ji, AI Scout ne social media groups & freelance boards se *${opportunities.length} active tech problems/gigs* hunt kiye hain.\n\n` +
      `Yahan log directly developers dhundh rahe hain aur paise offer kar rahe hain. Neeche top 3 hot opportunities hain:`;

    await telegram.sendMessage(header);
    await new Promise(r => setTimeout(r, 600));

    for (let i = 0; i < Math.min(opportunities.length, 3); i++) {
      const opp = opportunities[i];
      const card = 
        `🎯 *#${i+1} [${opp.category}]*\n` +
        `📌 *Title:* ${opp.title}\n` +
        `🔗 *Link:* ${opp.link}\n` +
        `📝 *Requirement Snippet:* ${opp.snippet.slice(0, 150)}...\n\n` +
        `💼 *Ready-to-Paste Pitch:*\n\`\`\`\n${opp.recommendedPitch.slice(0, 450)}...\n\`\`\``;

      await telegram.sendMessage(card);
      await new Promise(r => setTimeout(r, 600));
    }

    console.log('✔ Telegram alert sent successfully!');
  }

  return opportunities;
}

if (require.main === module) {
  const shouldNotify = process.argv.includes('--notify-telegram');
  runScout({ notifyTelegram: shouldNotify }).catch(console.error);
}

module.exports = { runScout };
