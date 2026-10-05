/**
 * 🦅 GARUDA OS — EXECUTIVE CV PDF GENERATOR
 * Generates an ATS-compliant, pixel-perfect executive PDF for Praveen Kumar Mahawar.
 */

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Praveen Kumar Mahawar - Executive CV</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');

    @page {
      size: A4;
      margin: 12mm 14mm 12mm 14mm;
    }

    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #1a202c;
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
      margin-bottom: 12px;
    }

    .name-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }

    h1.name {
      font-size: 21pt;
      font-weight: 800;
      letter-spacing: -0.02em;
      color: #0f172a;
      margin: 0;
      line-height: 1.1;
      text-transform: uppercase;
    }

    .title {
      font-size: 10.5pt;
      font-weight: 600;
      color: #b45309; /* Warm Gold/Amber Accent */
      letter-spacing: 0.02em;
      margin-top: 3px;
      text-transform: uppercase;
    }

    .contact-info {
      font-size: 8.5pt;
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
      font-weight: 500;
    }

    /* SECTION HEADINGS */
    .section-title {
      font-size: 10pt;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #0f172a;
      border-bottom: 1px solid #cbd5e1;
      padding-bottom: 3px;
      margin-top: 11px;
      margin-bottom: 7px;
      display: flex;
      align-items: center;
      justify-content: space-between;
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
      margin-bottom: 8px;
      font-size: 9.1pt;
      line-height: 1.45;
    }

    /* SKILLS TABLE / GRID */
    .skills-grid {
      display: grid;
      grid-template-columns: 145px 1fr;
      row-gap: 4px;
      margin-bottom: 10px;
      font-size: 8.8pt;
    }

    .skill-cat {
      font-weight: 700;
      color: #1e293b;
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
      margin-bottom: 1px;
    }

    .exp-role {
      font-size: 9.8pt;
      font-weight: 700;
      color: #0f172a;
    }

    .exp-company {
      font-weight: 600;
      color: #b45309;
    }

    .exp-date-loc {
      font-size: 8.5pt;
      font-weight: 500;
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

    /* PROJECTS */
    .project-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      margin-bottom: 8px;
    }

    .project-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 4px;
      padding: 7px 9px;
      page-break-inside: avoid;
    }

    .project-card h4 {
      margin: 0 0 2px 0;
      font-size: 9pt;
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
        <div class="title">Principal AI Systems Architect | Autonomous Automation & Full-Stack Engineer</div>
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
    High-velocity <strong>Principal Systems Architect with 10+ years of deep engineering experience</strong> architecting autonomous AI agent platforms, distributed web architectures, mission-critical analytics platforms, and high-scale headless automation pipelines. Founder and Lead Architect of <strong>GARUDA OS</strong> — an enterprise autonomous system coordinating multi-agent cognitive loops, stealth browser automation fleets, deterministic fintech state machines, and real-time electoral intelligence platforms processing 100,000+ data records with sub-100ms response times. Renowned for taking complex 0-to-1 systems into production without technical debt, enforcing strict zero-custody cryptographic guarantees, and executing with uncompromised velocity.
  </div>

  <!-- TECHNICAL ARSENAL -->
  <div class="section-title">Core Technical Arsenal</div>
  <div class="skills-grid">
    <div class="skill-cat">Autonomous AI & Agents:</div>
    <div class="skill-desc">Multi-Agent Orchestration, Agentic Loops, Self-Healing Runtimes, Tool-Calling Pipelines, Persistent Synaptic Memory (JSONL/Vector), Context Compression.</div>

    <div class="skill-cat">Headless Automation:</div>
    <div class="skill-desc">Puppeteer, Playwright, Chrome DevTools Protocol (CDP), Anti-Bot & Fingerprint Bypass, Proxy Rotation Farms, Distributed Web Scrapers.</div>

    <div class="skill-cat">Backend & Microservices:</div>
    <div class="skill-desc">Node.js (ESNext/CJS), Express, Python, RESTful API Engineering, WebSockets, Serverless Microservices (Vercel, Render), OAuth2/JWT Security.</div>

    <div class="skill-cat">Frontend Architecture:</div>
    <div class="skill-desc">React 19, Vite, Tailwind CSS, Dynamic Canvas/SVG Rendering, Offline Progressive Web Apps (PWA), Strict Viewport Anti-Flicker Architecture.</div>

    <div class="skill-cat">Data & Cryptography:</div>
    <div class="skill-desc">PostgreSQL, Supabase, Redis, SQLite, Deterministic State Machines, SHA-256 Ledger Auditing, Zero-Custody Enforcers.</div>

    <div class="skill-cat">DevOps & Governance:</div>
    <div class="skill-desc">Git Worktrees, Automated Build Verification Gates, Forensic Pre-Commit Linters, Cloudflare Edge, Linux & Windows Terminal Architecture.</div>
  </div>

  <!-- EXPERIENCE -->
  <div class="section-title">Professional Experience</div>

  <div class="exp-entry">
    <div class="exp-header">
      <div class="exp-role">Founder & Principal Systems Architect <span class="exp-company">| GARUDA OS</span></div>
      <div class="exp-date-loc">2023 – PRESENT | REMOTE</div>
    </div>
    <ul class="exp-bullets">
      <li><strong>Autonomous Multi-Agent Architecture</strong>: Engineered the core runtime of GARUDA OS — an enterprise autonomous system coordinating multi-agent task planning, self-healing code execution, and autonomous browser-based research workflows.</li>
      <li><strong>Constituency War Room Platform</strong>: Built an enterprise electoral intelligence platform ingesting 100,000+ official ECI Form 20 records across 12 battleground constituencies, delivering dynamic multi-quadrant voter polarity algorithms and real-time field cadre telemetry at 60 FPS.</li>
      <li><strong>Headless Scraping & Signal Hunting Fleets</strong>: Developed autonomous browser daemons executing authenticated session management, resilient DOM parsing, and target enrichment across high-security platforms with 99.4% uptime.</li>
      <li><strong>Zero-Custody Fintech Infrastructure</strong>: Implemented zero-custody financial qualification engines and multi-ledger reconciliation systems backed by immutable SHA-256 cryptographic hashing.</li>
      <li><strong>1-Shot Forensic Build Standards</strong>: Enforced zero-regression governance across 450+ canonical routes, achieving clean exit-code 0 builds and sub-second asset streaming on production.</li>
    </ul>
  </div>

  <div class="exp-entry">
    <div class="exp-header">
      <div class="exp-role">Lead Systems Consultant & Architect <span class="exp-company">| High-Scale Automation Solutions</span></div>
      <div class="exp-date-loc">2018 – 2023 | REMOTE (UK / US / GLOBAL)</div>
    </div>
    <ul class="exp-bullets">
      <li><strong>High-Throughput Scraping Pipelines</strong>: Built distributed data extraction infrastructure for international clients, harvesting and structuring over 500,000+ records daily from public registries, e-commerce catalogs, and dynamic web portals.</li>
      <li><strong>API Integration & Middleware</strong>: Built bidirectional connectors integrating Meta Graph API, Google Workspace, payment gateways, and custom webhook dispatchers with automated exponential backoff and dead-letter queues.</li>
      <li><strong>Enterprise Web Platforms</strong>: Delivered 20+ responsive web portals in React/Node.js for international businesses, reducing page load latencies by 55% via asset pre-rendering and edge caching.</li>
    </ul>
  </div>

  <div class="exp-entry">
    <div class="exp-header">
      <div class="exp-role">Full-Stack Software Developer <span class="exp-company">| Enterprise Web & Database Systems</span></div>
      <div class="exp-date-loc">2014 – 2018 | INDIA</div>
    </div>
    <ul class="exp-bullets">
      <li>Developed robust MVC web applications, relational database schemas (MySQL/PostgreSQL), and customer portals for commercial enterprises.</li>
      <li>Automated manual reporting workflows into automated scheduled pipelines, saving clients 15+ hours of operational overhead weekly.</li>
    </ul>
  </div>

  <!-- FLAGSHIP SHOWCASES -->
  <div class="section-title">Flagship Architectural Showcases</div>
  <div class="project-grid">
    <div class="project-card">
      <h4>GARUDA Autonomous OS (garudaos.in)</h4>
      <p>Production platform running multi-agent cognitive layers, dynamic UI rendering, and pre-rendered SEO pipelines across 960+ static nodes.</p>
    </div>
    <div class="project-card">
      <h4>Constituency War Room & Cadre PWA</h4>
      <p>Mission-critical operational platform featuring dynamic QR matrices, offline-first booth telemetry, and multi-quadrant electoral math engines.</p>
    </div>
    <div class="project-card">
      <h4>CyberShield Threat Neutralization Engine</h4>
      <p>Perimeter defense framework detecting unauthorized brand pollution, security exposures, and DNS regressions with automated incident reporting.</p>
    </div>
    <div class="project-card">
      <h4>Stealth Browser Automation Fleet</h4>
      <p>Headless cluster bypassing anti-bot shields, handling 2FA tokens, and extracting multi-source signals without IP degradation.</p>
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
      Core Specialization: Systems Architecture, Database Management Systems (DBMS), Data Structures & Algorithms, Object-Oriented Programming, Operating Systems & Network Protocols.
    </div>
  </div>

  <!-- FOOTER -->
  <div class="footer-badge">
    <span>VERIFIED PORTFOLIO: GARUDAOS.IN</span>
    <span>PHILOSOPHY: SHOW > TELL | ZERO TECHNICAL DEBT</span>
    <span>100% REMOTE DEDICATED</span>
  </div>

</body>
</html>
`;

async function generatePDF() {
  console.log('🚀 Launching headless browser for PDF generation...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

  const outputPath = path.resolve('D:/GARUDA-AI/Praveen_Kumar_Mahawar_Executive_CV.pdf');
  
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
  console.log('✅ PDF generated successfully at:', outputPath);

  const stats = fs.statSync(outputPath);
  console.log('📦 File Size:', (stats.size / 1024).toFixed(2), 'KB');
}

generatePDF().catch(err => {
  console.error('❌ Error generating PDF:', err);
  process.exit(1);
});
