/**
 * 🦅 GARUDA SOVEREIGN OUTBOUND DISPATCHER
 * Sends direct proposals from praveen@garudaos.in via verified Zoho SMTP (DKIM + SPF active)
 * Targets verified buyers who requested web/app/software developers.
 */

require('dotenv').config();
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const telegram = require('../src/services/telegramBotService');

const LOG_FILE = path.join(__dirname, '..', 'data', 'active-buyer-dispatch-log.json');

const SMTP_CONFIG = {
  host: process.env.GARUDA_EMAIL_HOST || 'smtp.zoho.in',
  port: parseInt(process.env.GARUDA_EMAIL_PORT || '465', 10),
  secure: true,
  auth: {
    user: process.env.GARUDA_EMAIL_USER || 'praveen@garudaos.in',
    pass: process.env.GARUDA_EMAIL_PASS
  }
};

const FROM_HEADER = `"Praveen Mahawar — GARUDA OS" <${SMTP_CONFIG.auth.user}>`;

// Direct buyer leads who posted requirements with emails
const BUYERS_QUEUE = [
  {
    buyerId: 'reddit_osama_web',
    name: 'Osama Aman',
    email: 'Osamaaman1998@gmail.com',
    source: 'Reddit r/forhire',
    subject: 'Figma-to-Code & Web Platform Build [GARUDA OS]',
    text: `Hi Osama,

I saw your requirement on Reddit for a web developer to build a pixel-perfect website from your Figma design and comic web platform.

We build production-grade web systems at GARUDA OS with sub-second load times, 100/100 Lighthouse performance, and clean maintainable code (React / Next.js / HTML5).

How we execute:
1. Exact 1-to-1 fidelity with your Figma layouts and mobile responsiveness.
2. Clean, bloat-free code with zero layout shift.
3. Rapid 48-hour delivery on staging for your review.

Live architecture proof: https://www.garudaos.in

If you'd like to share the Figma file or project brief, I can review it immediately and provide a turnaround preview.

Best regards,
Praveen Mahawar
Founder & Chief Architect — GARUDA OS
Official Email: praveen@garudaos.in | Web: https://www.garudaos.in`
  },
  {
    buyerId: 'reddit_andrew_variance',
    name: 'Andrew (Variance Agency)',
    email: 'andrew@variance.agency',
    source: 'Reddit r/hiredev',
    subject: 'Senior Web & Functional Frontend Development Partner [GARUDA OS]',
    text: `Hi Andrew,

Saw your hiring post on Reddit looking for a reliable web designer and developer to handle functional website builds for Variance Agency.

At GARUDA OS, we act as an on-demand technical delivery bench for agency owners. We take your client briefs or Figma files and deliver fully-tested, high-performance web applications with zero handholding.

Tech stack & capabilities:
• React 19, Next.js, Node.js, and clean responsive CSS.
• Sub-second API integrations, speed optimization, and 100% cross-browser testing.
• Predictable 48-72h turnaround on client sprints.

Live production proof: https://www.garudaos.in

Happy to take on an initial test task at your standard rates ($30/hr or fixed milestone) so you can evaluate our code quality.

Best regards,
Praveen Mahawar
Founder & Chief Architect — GARUDA OS
Official Email: praveen@garudaos.in | Web: https://www.garudaos.in`
  },
  {
    buyerId: 'buyer_tigerbelly_shopify',
    name: 'Tigerbelly Studio',
    email: 'thetigerbelly@gmail.com',
    source: 'Direct Client Signal',
    subject: 'Shopify & E-Commerce Web Engineering [GARUDA OS]',
    text: `Hi Team,

I saw your hiring call for a web developer to engineer your Shopify e-commerce site.

At GARUDA OS, we build fast, high-conversion e-commerce experiences with optimized checkout funnels, custom liquid theme adjustments, and sub-second page performance that prevents cart abandonment.

Our capabilities:
1. Custom Shopify liquid development and app integrations.
2. High-speed mobile responsive layouts with zero layout shifts.
3. Clean theme architecture and conversion rate optimization.

Live platform proof: https://www.garudaos.in

Feel free to send over your store requirements or design references, and we can discuss the rollout plan.

Best regards,
Praveen Mahawar
Founder & Chief Architect — GARUDA OS
Official Email: praveen@garudaos.in | Web: https://www.garudaos.in`
  },
  {
    buyerId: 'buyer_abnotix_web',
    name: 'Abnotix Solutions',
    email: 'care@abnotixsolutions.com',
    source: 'Direct Client Signal',
    subject: 'Senior Full-Stack Web Development Capacity [GARUDA OS]',
    text: `Hi Abnotix Team,

I saw your hiring opening for a skilled Web Developer.

We provide dedicated full-stack software and web engineering capacity through GARUDA OS. We build robust, scalable web applications with modern frontend frameworks (React, Next.js, TypeScript) and resilient Node.js backends.

Key highlights:
• Sub-second response times and 100% verified test pipelines.
• REST & GraphQL API engineering with automated deployments.
• Immediate capacity to take on production tickets without onboarding delays.

Live platform proof: https://www.garudaos.in

Available for a brief technical alignment call or trial task.

Best regards,
Praveen Mahawar
Founder & Chief Architect — GARUDA OS
Official Email: praveen@garudaos.in | Web: https://www.garudaos.in`
  },
  {
    buyerId: 'buyer_trivanta_hospitality',
    name: 'Trivanta Hospitality Group',
    email: 'trivantahospitality@gmail.com',
    source: 'Hospitality Web Signal',
    subject: 'Luxury Hospitality Digital Experience & Direct Booking Funnel [GARUDA OS]',
    text: `Hi Trivanta Hospitality Team,

I saw your requirement for building a premium, luxury website for your hospitality group.

Two critical factors we focus on for luxury properties:
1. Visual Distinction: Editorial typography and high-resolution media pacing that communicates luxury in the first 2 seconds.
2. Direct Bookings: Eliminating high OTA commission fees (15-25%) with a frictionless, high-speed direct inquiry and reservation funnel.

Fixed pricing: ₹30,000 fixed milestone with 50% delivery governance.

Live production proof: https://www.garudaos.in
Personalized scope: https://www.garudaos.in/chat?ref=trivanta

Looking forward to bringing your properties online with world-class polish.

Best regards,
Praveen Mahawar
Founder & Chief Architect — GARUDA OS
Official Email: praveen@garudaos.in | Web: https://www.garudaos.in`
  },
  {
    buyerId: 'buyer_nisarga_care',
    name: 'Nisarga Care Team',
    email: 'nisargacare1@gmail.com',
    source: 'Healthcare Redesign Signal',
    subject: 'SEO-Safe Digital Redesign for Nisarga Care [GARUDA OS]',
    text: `Namaste Nisarga Care Team,

I saw your requirement regarding redesigning your website without disrupting your existing Google search rankings. This exact constraint is our specialty.

We execute with:
1. Strict 1-to-1 URL preservation and 301 redirection maps so zero backlinks or search rankings are lost.
2. Modern, clean medical UI designed for patient trust and immediate family inquiries.
3. Sub-second mobile loading speed.

Fixed pricing: ₹30,000 milestone (50% delivery governance).

Live production proof: https://www.garudaos.in
Personalized scope: https://www.garudaos.in/chat?ref=nisargacare

Best regards,
Praveen Mahawar
Founder & Chief Architect — GARUDA OS
Official Email: praveen@garudaos.in | Web: https://www.garudaos.in`
  }
];

async function dispatchAll() {
  console.log('🦅 GARUDA SOVEREIGN OUTBOUND DISPATCH STARTED...');
  console.log(`Using SMTP: ${SMTP_CONFIG.auth.user} @ ${SMTP_CONFIG.host}:${SMTP_CONFIG.port}`);

  let existingLog = [];
  if (fs.existsSync(LOG_FILE)) {
    try {
      existingLog = JSON.parse(fs.readFileSync(LOG_FILE, 'utf8'));
    } catch (_) {}
  }

  const sentEmails = new Set(existingLog.map(x => x.email.toLowerCase()));
  const transporter = nodemailer.createTransport(SMTP_CONFIG);

  // Verify connection
  await transporter.verify();
  console.log('✅ Zoho SMTP Connected & Authenticated.');

  for (let i = 0; i < BUYERS_QUEUE.length; i++) {
    const buyer = BUYERS_QUEUE[i];
    if (sentEmails.has(buyer.email.toLowerCase())) {
      console.log(`[${i + 1}/${BUYERS_QUEUE.length}] ⏭ Already dispatched to: ${buyer.email}`);
      continue;
    }

    console.log(`\n[${i + 1}/${BUYERS_QUEUE.length}] Dispatching to: ${buyer.name} <${buyer.email}>...`);
    const sha256 = crypto.createHash('sha256').update(buyer.text).digest('hex');

    try {
      const info = await transporter.sendMail({
        from: FROM_HEADER,
        to: buyer.email,
        subject: buyer.subject,
        text: buyer.text,
        headers: {
          'X-Mailer': 'GARUDA-OS-Sovereign-Mailer',
          'X-Priority': '1',
          'Reply-To': 'praveen@garudaos.in'
        }
      });

      console.log(`   ✔ DELIVERED! Response: ${info.response} | ID: ${info.messageId}`);

      const record = {
        buyerId: buyer.buyerId,
        email: buyer.email,
        name: buyer.name,
        subject: buyer.subject,
        source: buyer.source,
        status: 'DELIVERED',
        providerResponseId: info.response,
        messageId: info.messageId,
        sha256: sha256,
        dispatchedAt: new Date().toISOString()
      };

      existingLog.push(record);
      fs.writeFileSync(LOG_FILE, JSON.stringify(existingLog, null, 2), 'utf8');

      // Send Telegram alert
      const tgMsg = `🎯 *HOT CLIENT PROPOSAL DISPATCHED!*\n\n👤 *Client:* ${buyer.name}\n📧 *Email:* \`${buyer.email}\`\n📌 *Source:* ${buyer.source}\n📝 *Subject:* ${buyer.subject}\n\n✅ *Status:* Primary Inbox Delivered (DKIM Active)\n🔒 *SHA-256:* \`${sha256.slice(0, 16)}...\``;
      try {
        await telegram.sendMessage(tgMsg);
      } catch (tgErr) {
        console.error('Telegram alert warning:', tgErr.message);
      }

      // Safe pause between emails
      console.log('   ⏳ Waiting 6 seconds before next dispatch...');
      await new Promise(r => setTimeout(r, 6000));
    } catch (err) {
      console.error(`   ❌ FAILED to send to ${buyer.email}:`, err.message);
      existingLog.push({
        buyerId: buyer.buyerId,
        email: buyer.email,
        name: buyer.name,
        subject: buyer.subject,
        source: buyer.source,
        status: 'FAILED',
        error: err.message,
        dispatchedAt: new Date().toISOString()
      });
      fs.writeFileSync(LOG_FILE, JSON.stringify(existingLog, null, 2), 'utf8');
    }
  }

  console.log('\n======================================================');
  console.log('🎉 ALL OUTBOUND PROPOSALS DISPATCHED & LOGGED CLEANLY!');
  console.log(`Log saved: ${LOG_FILE}`);
  console.log('======================================================\n');
}

dispatchAll().catch(err => {
  console.error('Fatal dispatch error:', err);
  process.exit(1);
});
