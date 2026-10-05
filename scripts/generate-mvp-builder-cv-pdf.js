/**
 * 🦅 GARUDA OS — MVP & FULL-STACK PRODUCT ENGINEER CV PDF GENERATOR
 * Tailored for Startup Founders, Agencies & Businesses wanting Web Apps, MVPs & PWAs.
 */

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Praveen Kumar Mahawar - Senior Full-Stack & MVP Architect</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');

    @page {
      size: A4;
      margin: 11mm 13mm 11mm 13mm;
    }

    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #1e293b;
      background: #ffffff;
      line-height: 1.45;
      font-size: 9.2pt;
      margin: 0;
      padding: 0;
    }

    /* HEADER */
    .header {
      border-bottom: 2px solid #0f172a;
      padding-bottom: 10px;
      margin-bottom: 11px;
    }

    .name-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }

    h1.name {
      font-size: 22pt;
      font-weight: 800;
      letter-spacing: -0.02em;
      color: #0f172a;
      margin: 0;
      line-height: 1.1;
    }

    .title {
      font-size: 11pt;
      font-weight: 700;
      color: #2563eb; /* Vibrant Trust Blue */
      letter-spacing: 0.01em;
      margin-top: 3px;
    }

    .contact-info {
      font-size: 8.6pt;
      color: #475569;
      margin-top: 6px;
      display: flex;
      flex-wrap: wrap;
      gap: 14px;
    }

    .contact-info span {
      display: inline-flex;
      align-items: center;
    }

    .contact-info a {
      color: #0f172a;
      text-decoration: none;
      font-weight: 600;
    }

    /* SECTION HEADINGS */
    .section-title {
      font-size: 9.8pt;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.07em;
      color: #0f172a;
      border-bottom: 1px solid #cbd5e1;
      padding-bottom: 3px;
      margin-top: 11px;
      margin-bottom: 7px;
      display: flex;
      align-items: center;
    }

    .section-title::after {
      content: "";
      flex: 1;
      height: 1px;
      background: #e2e8f0;
      margin-left: 10px;
    }

    /* SUMMARY */
    .summary-text {
      color: #334155;
      text-align: justify;
      margin-bottom: 9px;
      font-size: 9.2pt;
      line-height: 1.45;
    }

    /* SERVICES / CORE PILLARS */
    .services-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 7px;
      margin-bottom: 9px;
    }

    .service-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 7px 10px;
      border-left: 3px solid #2563eb;
    }

    .service-box h4 {
      margin: 0 0 2px 0;
      font-size: 9.2pt;
      font-weight: 700;
      color: #0f172a;
    }

    .service-box p {
      margin: 0;
      font-size: 8.4pt;
      color: #475569;
      line-height: 1.35;
    }

    /* SKILLS TABLE / GRID */
    .skills-grid {
      display: grid;
      grid-template-columns: 140px 1fr;
      row-gap: 4px;
      margin-bottom: 10px;
      font-size: 8.9pt;
    }

    .skill-cat {
      font-weight: 700;
      color: #0f172a;
    }

    .skill-desc {
      color: #334155;
    }

    /* EXPERIENCE ENTRIES */
    .exp-entry {
      margin-bottom: 9px;
      page-break-inside: avoid;
    }

    .exp-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 2px;
    }

    .exp-role {
      font-size: 10pt;
      font-weight: 700;
      color: #0f172a;
    }

    .exp-company {
      font-weight: 600;
      color: #2563eb;
    }

    .exp-date-loc {
      font-size: 8.5pt;
      font-weight: 600;
      color: #64748b;
      font-family: 'JetBrains Mono', monospace;
    }

    ul.exp-bullets {
      margin: 3px 0 0 0;
      padding-left: 16px;
    }

    ul.exp-bullets li {
      margin-bottom: 3px;
      color: #334155;
      font-size: 8.9pt;
      line-height: 1.4;
    }

    ul.exp-bullets li strong {
      color: #0f172a;
    }

    /* PROJECT SHOWCASE */
    .project-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 7px;
      margin-bottom: 8px;
    }

    .project-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 7px 9px;
      page-break-inside: avoid;
    }

    .project-card h4 {
      margin: 0 0 2px 0;
      font-size: 9.1pt;
      font-weight: 700;
      color: #0f172a;
    }

    .project-card p {
      margin: 0;
      font-size: 8.3pt;
      color: #475569;
      line-height: 1.35;
    }

    /* FOOTER BADGE */
    .footer-badge {
      display: flex;
      justify-content: space-between;
      border-top: 1px solid #e2e8f0;
      padding-top: 6px;
      margin-top: 10px;
      font-size: 8pt;
      color: #64748b;
      font-family: 'JetBrains Mono', monospace;
    }
  </style>
</head>
<body>

  <!-- HEADER -->
  <div class="header">
    <div class="name-row">
      <div>
        <h1 class="name">Praveen Kumar Mahawar</h1>
        <div class="title">Senior Full-Stack Product Engineer | SaaS MVPs, Web Apps & Mobile PWAs</div>
      </div>
    </div>
    <div class="contact-info">
      <span>📍 Jabalpur, MP, India (Worldwide Remote)</span>
      <span>📧 <a href="mailto:praveen@garudaos.in">praveen@garudaos.in</a></span>
      <span>🌐 <a href="https://www.garudaos.in">garudaos.in</a></span>
      <span>⏱️ Full UK (GMT/BST) & US (EST/PST) Overlap</span>
    </div>
  </div>

  <!-- SUMMARY -->
  <div class="section-title">Executive Profile Summary</div>
  <div class="summary-text">
    Hands-on <strong>Senior Full-Stack Product Engineer with 10+ years of proven experience</strong> building and shipping high-performance web applications, interactive SaaS dashboards, and offline-first mobile Progressive Web Apps (PWAs). Specializes in rapid <strong>0-to-1 MVP execution for US, UK, and Australian founders and agencies</strong> — taking ideas from wireframe to production deployment in 14 days without agency bureaucracy. Combines clean, responsive frontend craftsmanship (React 19, Vite, Tailwind CSS) with robust backend microservices (Node.js, Express, PostgreSQL, Supabase) and seamless Stripe/PayPal monetization rails.
  </div>

  <!-- WHAT I BUILD FOR FOUNDERS -->
  <div class="section-title">What I Deliver For Founders & Businesses</div>
  <div class="services-grid">
    <div class="service-box">
      <h4>🚀 14-Day SaaS MVP Launch</h4>
      <p>Full 0-to-1 build: User authentication, multi-tenant database, sleek analytics dashboard, and Stripe recurring subscription billing.</p>
    </div>
    <div class="service-box">
      <h4>📱 Offline-First Mobile PWAs</h4>
      <p>Apps that install directly on iOS & Android in 1 tap without 30% App Store fees, featuring local caching, dynamic QR codes, and push notifications.</p>
    </div>
    <div class="service-box">
      <h4>⚡ High-Speed Web Applications</h4>
      <p>Pixel-perfect, mobile-first responsive web apps built with React 19 & Vite. Sub-second page loads, zero UI layout shift, and 98+ Lighthouse scores.</p>
    </div>
    <div class="service-box">
      <h4>🔌 Custom Backend & API Integrations</h4>
      <p>Secure Node.js/Express REST APIs, Supabase/Postgres architectures, automated webhooks, CRM connections, and third-party API wiring.</p>
    </div>
  </div>

  <!-- TECHNICAL ARSENAL -->
  <div class="section-title">Technical Arsenal</div>
  <div class="skills-grid">
    <div class="skill-cat">Frontend Architecture:</div>
    <div class="skill-desc">React 19, Vite, Next.js concepts, Tailwind CSS, Modern Canvas/SVG Rendering, PWA Web Manifests, Responsive Viewport Lockdown.</div>

    <div class="skill-cat">Backend & Microservices:</div>
    <div class="skill-desc">Node.js (ESNext/CJS), Express, Python, RESTful APIs, WebSockets, Serverless Functions (Vercel, Render), Secure Session Governance.</div>

    <div class="skill-cat">Databases & Auth:</div>
    <div class="skill-desc">PostgreSQL, Supabase, MySQL, Redis, SQLite, JSON Data Engines, JWT, OAuth2 (Google, Meta, GitHub sign-ins), Role-Based Access Control (RBAC).</div>

    <div class="skill-cat">Payments & APIs:</div>
    <div class="skill-desc">Stripe (Checkout, Elements, Webhooks, Subscriptions), PayPal, Meta Graph API, Google Workspace APIs, SendGrid, Twilio.</div>

    <div class="skill-cat">Automation & Scraping:</div>
    <div class="skill-desc">Puppeteer, Playwright, Chrome DevTools Protocol, Headless Web Automation, Data Extraction & Transformation Pipelines.</div>

    <div class="skill-cat">DevOps & Deployment:</div>
    <div class="skill-desc">Git, GitHub, Vercel, Cloudflare Pages & Workers, Render Cloud, CI/CD automated linting, Linux & Windows Terminal Environments.</div>
  </div>

  <!-- EXPERIENCE -->
  <div class="section-title">Professional Experience</div>

  <div class="exp-entry">
    <div class="exp-header">
      <div class="exp-role">Lead Product Engineer & Systems Architect <span class="exp-company">| GARUDA OS</span></div>
      <div class="exp-date-loc">2023 – PRESENT | REMOTE</div>
    </div>
    <ul class="exp-bullets">
      <li><strong>Constituency War Room & Cadre Mobile PWA</strong>: Architected an interactive, multi-tab operational web application and companion offline-first field PWA. Features sub-100ms dashboard filtering, dynamic SVG QR code generation, and instant mobile home-screen installation without app store friction.</li>
      <li><strong>0-to-1 Platform Engineering</strong>: Built the complete full-stack web architecture for <em>garudaos.in</em> using React 19, Vite, and serverless Node.js, achieving 960+ pre-rendered static routes and sub-second asset delivery globally.</li>
      <li><strong>Fintech Qualification & Checkout Rails</strong>: Engineered a 19-section commercial checkout flow with deterministic state machine verification, zero-custody credential stripping, and automated Stripe/webhook reconciliation.</li>
      <li><strong>Automated Data Pipelines</strong>: Built resilient background services processing over 100k+ data points into structured PostgreSQL/JSON schemas with automated failure recovery.</li>
    </ul>
  </div>

  <div class="exp-entry">
    <div class="exp-header">
      <div class="exp-role">Senior Full-Stack Web & MVP Consultant <span class="exp-company">| Independent Contractor</span></div>
      <div class="exp-date-loc">2018 – 2023 | REMOTE (UK / US / GLOBAL)</div>
    </div>
    <ul class="exp-bullets">
      <li><strong>Startup MVP Delivery</strong>: Partnered with early-stage founders across the US, UK, and Australia to design, code, and deploy 20+ responsive web applications and SaaS MVPs from scratch, delivering production launches in an average of 14 to 21 days.</li>
      <li><strong>Custom Dashboards & Portals</strong>: Built customer portals, admin panels, and e-commerce web applications featuring real-time data tables, interactive charting, and granular role-based permissions.</li>
      <li><strong>Payment & CRM Integrations</strong>: Integrated Stripe subscription billing, recurring invoicing, and CRM automations (HubSpot, Google Sheets, email dispatchers) to automate client onboarding and payment reconciliation.</li>
      <li><strong>Performance Re-engineering</strong>: Migrated legacy, sluggish websites into lightweight React/Node architectures, reducing page load times by up to 60% and directly increasing mobile conversion rates.</li>
    </ul>
  </div>

  <div class="exp-entry">
    <div class="exp-header">
      <div class="exp-role">Full-Stack Web Developer <span class="exp-company">| Enterprise Web & Database Solutions</span></div>
      <div class="exp-date-loc">2014 – 2018 | INDIA</div>
    </div>
    <ul class="exp-bullets">
      <li>Developed responsive web portals, custom CMS platforms, and relational database schemas (MySQL/PostgreSQL) for commercial businesses.</li>
      <li>Engineered clean frontend interfaces with HTML5, CSS3, JavaScript, and modern UI libraries, delivering seamless cross-browser compatibility.</li>
    </ul>
  </div>

  <!-- FLAGSHIP SHOWCASES -->
  <div class="section-title">Selected Product Showcases</div>
  <div class="project-grid">
    <div class="project-card">
      <h4>GARUDA OS Platform (garudaos.in)</h4>
      <p>High-speed, luxury dark-mode web application featuring real-time interactive dashboards, pre-rendered SEO pipelines, and zero-flicker viewport architecture.</p>
    </div>
    <div class="project-card">
      <h4>Cadre Field Mobile PWA</h4>
      <p>Offline-first mobile web app with instant 1-tap installation, dynamic QR code matrix generator, and local caching for low-connectivity environments.</p>
    </div>
    <div class="project-card">
      <h4>Fintech State Machine & Billing Portal</h4>
      <p>Self-contained qualification and proposal generator with deterministic multi-tier pricing, cryptographic audit logs, and automated payment gateways.</p>
    </div>
    <div class="project-card">
      <h4>Headless Web Scraping & Lead Hub</h4>
      <p>High-throughput data extraction and structuring engine harvesting 100k+ records and populating clean relational databases with zero data loss.</p>
    </div>
  </div>

  <!-- EDUCATION -->
  <div class="section-title">Education & Credentials</div>
  <div class="exp-entry">
    <div class="exp-header">
      <div class="exp-role">Bachelor of Computer Applications (BCA)</div>
      <div class="exp-date-loc">JABALPUR, MADHYA PRADESH, INDIA</div>
    </div>
    <div style="font-size: 8.8pt; color: #475569; margin-top: 2px;">
      Core Foundations: Web Engineering, Database Management Systems (DBMS), Object-Oriented Software Design, Data Structures & Algorithms, Network Architectures.
    </div>
  </div>

  <!-- FOOTER -->
  <div class="footer-badge">
    <span>PORTFOLIO: GARUDAOS.IN</span>
    <span>GUARANTEE: 14-DAY MVP DELIVERY | CLEAN CODE | ZERO HAND-HOLDING</span>
    <span>100% REMOTE DEDICATED</span>
  </div>

</body>
</html>
`;

async function generatePDF() {
  console.log('🚀 Launching headless browser for MVP Builder CV...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

  const outputPath = path.resolve('D:/GARUDA-AI/Praveen_Kumar_Mahawar_MVP_FullStack_CV.pdf');
  
  await page.pdf({
    path: outputPath,
    format: 'A4',
    printBackground: true,
    margin: {
      top: '10mm',
      bottom: '10mm',
      left: '12mm',
      right: '12mm'
    }
  });

  await browser.close();
  console.log('✅ MVP Builder CV generated successfully at:', outputPath);

  const stats = fs.statSync(outputPath);
  console.log('📦 File Size:', (stats.size / 1024).toFixed(2), 'KB');
}

generatePDF().catch(err => {
  console.error('❌ Error generating PDF:', err);
  process.exit(1);
});
