const fs = require("fs");
const path = require("path");

/**
 * GARUDA SEO Pre-Renderer
 * Generates static, crawler-visible HTML files with unique titles, meta descriptions,
 * self-referencing canonical URLs, OpenGraph tags, JSON-LD structured data,
 * and meaningful semantic fallback content for every public canonical route.
 */

const DIST_DIR = path.resolve(__dirname, "../frontend/dist");
const BASE_TEMPLATE_PATH = path.join(DIST_DIR, "index.html");

if (!fs.existsSync(BASE_TEMPLATE_PATH)) {
  console.error("Error: frontend/dist/index.html does not exist. Run vite build first.");
  process.exit(1);
}

const baseTemplate = fs.readFileSync(BASE_TEMPLATE_PATH, "utf8");

const ROUTES = [
  {
    path: "/",
    filePaths: [path.join(DIST_DIR, "index.html")],
    title: "GARUDA AI Operating System | Custom AI & Software Engineering",
    description: "GARUDA is an autonomous AI Operating System delivering custom AI systems, web applications, SaaS MVPs, automated workflows, and enterprise software worldwide.",
    canonical: "https://www.garudaos.in/",
    h1: "One Command. Infinite Intelligence.",
    eyebrow: "AI OPERATING SYSTEM FOR BUSINESSES & PROFESSIONALS",
    contentSnippet: `
      <h2>Autonomous Software Execution & Governed AI Engineering</h2>
      <p>GARUDA AI provides production-ready custom AI pipelines, full-stack SaaS MVPs, business workflow automations, and commercial conversational bots. Founded by Praveen Mahawar.</p>
      <ul>
        <li><a href="/what-is-garuda-ai">What is GARUDA AI? (Architecture & Operating System Overview)</a></li>
        <li><a href="/services/custom-ai-development">Custom AI Development Services & Agentic Architecture</a></li>
        <li><a href="/services/custom-software-saas-mvp">Custom Software & Scalable SaaS MVP Development</a></li>
        <li><a href="/services/business-workflow-ai-automation">Enterprise Business Workflow & Process Automation</a></li>
        <li><a href="/services/whatsapp-telegram-ai-bots">Custom WhatsApp & Telegram AI Commercial Bots</a></li>
        <li><a href="/chat">Talk to GARUDA AI (Solution Architect & Project Scoping)</a></li>
      </ul>
    `
  },
  {
    path: "/what-is-garuda-ai",
    filePaths: [
      path.join(DIST_DIR, "what-is-garuda-ai", "index.html"),
      path.join(DIST_DIR, "what-is-garuda-ai.html")
    ],
    title: "What is GARUDA AI? | Autonomous AI Operating System",
    description: "Learn what GARUDA AI is: The autonomous AI Operating System engineered for governed business automation, custom software execution, and multi-agent workflows.",
    canonical: "https://www.garudaos.in/what-is-garuda-ai",
    h1: "What is GARUDA AI?",
    eyebrow: "OFFICIAL BRAND & PRODUCT ENTITY",
    contentSnippet: `
      <h2>Entity Identity & Disambiguation</h2>
      <p>GARUDA AI is an independent, autonomous AI Operating System and commercial software engineering company. It is NOT Garuda Linux (an Arch Linux desktop OS), NOT a generic wrapper, and NOT affiliated with unrelated aviation or financial frameworks.</p>
      <h2>The 4 Pillars of GARUDA Architecture</h2>
      <ol>
        <li><strong>Mother Brain & Orchestration:</strong> Central intelligence routing multi-modal directives across autonomous subsystems.</li>
        <li><strong>Autonomous Execution Engines:</strong> 27 integrated universes covering discovery, qualification, scoping, and builder tasks.</li>
        <li><strong>Governed Truth & Verification:</strong> 100% Truth Law with SHA-256 release manifests and founder approval gates.</li>
        <li><strong>Full-Stack Software Builders:</strong> Deterministic agents creating production AI pipelines, web applications, and integrations.</li>
      </ol>
      <h2>Engineered Commercial Services</h2>
      <ul>
        <li><a href="/services/custom-ai-development">Custom AI Development Services</a></li>
        <li><a href="/services/custom-software-saas-mvp">SaaS MVP & Full-Stack Custom Software</a></li>
        <li><a href="/services/business-workflow-ai-automation">Business Workflow AI Automation</a></li>
        <li><a href="/services/whatsapp-telegram-ai-bots">WhatsApp & Telegram AI Commercial Bots</a></li>
        <li><a href="/chat">Talk to GARUDA AI Solution Architect</a></li>
      </ul>
    `,
    schema: {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "What is GARUDA AI?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "GARUDA AI is an autonomous AI Operating System designed for governed business automation, custom software execution, revenue operations, and intelligent workflows. Founded by Praveen Mahawar."
          }
        },
        {
          "@type": "Question",
          "name": "How is GARUDA AI different from generic chatbots or LLMs?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Unlike simple text chatbots or raw language models, GARUDA AI operates as a complete multi-agent Operating System connecting directly to databases, CRM workflows, payment gateways, and code repositories."
          }
        },
        {
          "@type": "Question",
          "name": "Is GARUDA AI related to Garuda Linux?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "No. GARUDA AI (https://www.garudaos.in) is an independent AI Operating System and commercial software engineering company. It is distinct from Garuda Linux."
          }
        }
      ]
    }
  },
  {
    path: "/garuda-ai",
    filePaths: [path.join(DIST_DIR, "garuda-ai", "index.html")],
    title: "What is GARUDA AI? | Autonomous AI Operating System",
    description: "Learn what GARUDA AI is: The autonomous AI Operating System engineered for governed business automation, custom software execution, and multi-agent workflows.",
    canonical: "https://www.garudaos.in/what-is-garuda-ai",
    h1: "What is GARUDA AI?",
    eyebrow: "OFFICIAL BRAND & PRODUCT ENTITY",
    contentSnippet: `
      <h2>GARUDA AI Operating System Overview</h2>
      <p>Explore the full architecture, execution engines, and commercial capabilities of GARUDA AI.</p>
      <p><a href="/what-is-garuda-ai">Read the full architecture overview</a> | <a href="/chat">Discuss Project Scope</a></p>
    `
  },
  {
    path: "/services/custom-ai-development",
    filePaths: [path.join(DIST_DIR, "services", "custom-ai-development", "index.html")],
    title: "Custom AI Development Services | AI Agents & Automation | GARUDA",
    description: "Enterprise-grade custom AI development, autonomous multi-agent systems, and specialized RAG pipelines engineered with verified deterministic quality.",
    canonical: "https://www.garudaos.in/services/custom-ai-development",
    h1: "Custom AI Development & Autonomous Agent Architecture",
    eyebrow: "AI & MACHINE LEARNING ENGINEERING",
    contentSnippet: `
      <h2>Deterministic AI Agents & Multi-Turn RAG Pipelines</h2>
      <p>GARUDA engineers bespoke AI operating pipelines: custom tool-calling agents, retrieval-augmented generation (RAG) vector stores, and automated verification suites governed by cryptographic delivery manifests.</p>
      <h3>Engineered Deliverables:</h3>
      <ul>
        <li>Deterministic Multi-Agent Task Orchestration with retry governance</li>
        <li>Retrieval-Augmented Generation (RAG) with vector similarity search</li>
        <li>Custom tool-calling integrations with CRM, ERP, and internal databases</li>
        <li>Cryptographic SHA-256 QA release manifests for full delivery auditability</li>
      </ul>
      <p>Milestone Terms: 50% Advance Kickoff / 50% Upon Verified Delivery. Timeline: 1-2 weeks.</p>
      <p><a href="/chat">Discuss Custom AI Scope with Solution Architect →</a></p>
    `,
    schema: {
      "@context": "https://schema.org",
      "@type": "Service",
      "@id": "https://www.garudaos.in/services/custom-ai-development#service",
      "name": "Custom AI Development & Agentic Architecture",
      "serviceType": "Custom AI Development",
      "provider": {
        "@type": "Organization",
        "name": "GARUDA AI",
        "url": "https://www.garudaos.in"
      },
      "areaServed": "Worldwide"
    }
  },
  {
    path: "/services/custom-software-saas-mvp",
    filePaths: [path.join(DIST_DIR, "services", "custom-software-saas-mvp", "index.html")],
    title: "Custom Software & SaaS MVP Development | Full-Stack Engineering | GARUDA",
    description: "Full-stack custom software engineering and production-ready SaaS MVP development with milestone-governed execution and automated test verification.",
    canonical: "https://www.garudaos.in/services/custom-software-saas-mvp",
    h1: "Full-Stack Custom Software & Scalable SaaS Development",
    eyebrow: "FULL STACK ENGINEERING",
    contentSnippet: `
      <h2>From Concept to Production SaaS MVP with Payments & Auth</h2>
      <p>GARUDA engineers high-performance web applications using React frontend, scalable Node.js microservices, Stripe/Razorpay billing, and PostgreSQL/MongoDB storage.</p>
      <h3>Engineered Deliverables:</h3>
      <ul>
        <li>Modern React / Next.js responsive user interface</li>
        <li>Secure Role-Based Access Control (RBAC) & User Authentication</li>
        <li>Automated Stripe / Razorpay global subscription billing</li>
        <li>Scalable database architecture with automated migration scripts</li>
      </ul>
      <p>Milestone Terms: 50% Advance Kickoff / 50% Upon Verified Delivery. Timeline: 2-3 weeks.</p>
      <p><a href="/chat">Discuss SaaS MVP Scope with Solution Architect →</a></p>
    `,
    schema: {
      "@context": "https://schema.org",
      "@type": "Service",
      "@id": "https://www.garudaos.in/services/custom-software-saas-mvp#service",
      "name": "Full-Stack Custom Software & Scalable SaaS Development",
      "serviceType": "Custom Software & SaaS MVP Development",
      "provider": {
        "@type": "Organization",
        "name": "GARUDA AI",
        "url": "https://www.garudaos.in"
      },
      "areaServed": "Worldwide"
    }
  },
  {
    path: "/services/business-workflow-ai-automation",
    filePaths: [path.join(DIST_DIR, "services", "business-workflow-ai-automation", "index.html")],
    title: "Business Workflow AI Automation | Enterprise Process Integration | GARUDA",
    description: "Autonomous business process and workflow automation connecting CRMs, payment gateways, document pipelines, and enterprise data with zero loss.",
    canonical: "https://www.garudaos.in/services/business-workflow-ai-automation",
    h1: "Enterprise Business Workflow & Process Automation",
    eyebrow: "OPERATIONS & AUTOMATION",
    contentSnippet: `
      <h2>Automate Repetitive Lead Capture, Invoicing & Operations</h2>
      <p>GARUDA builds governed event-driven automation workers that link inbound leads, accounting software, messaging channels, and internal systems with zero data leakage.</p>
      <h3>Engineered Deliverables:</h3>
      <ul>
        <li>Automated Multi-Source Lead Generation & Prospect Qualification</li>
        <li>Document & Invoice Parsing with automated accounting sync</li>
        <li>Bi-directional webhook integrations across CRM, Slack, and email</li>
      </ul>
      <p>Milestone Terms: 50% Advance Kickoff / 50% Upon Verified Delivery. Timeline: 3-7 business days.</p>
      <p><a href="/chat">Discuss Automation Scope with Solution Architect →</a></p>
    `,
    schema: {
      "@context": "https://schema.org",
      "@type": "Service",
      "@id": "https://www.garudaos.in/services/business-workflow-ai-automation#service",
      "name": "Enterprise Business Workflow & Process Automation",
      "serviceType": "Business Workflow AI Automation",
      "provider": {
        "@type": "Organization",
        "name": "GARUDA AI",
        "url": "https://www.garudaos.in"
      },
      "areaServed": "Worldwide"
    }
  },
  {
    path: "/services/whatsapp-telegram-ai-bots",
    filePaths: [path.join(DIST_DIR, "services", "whatsapp-telegram-ai-bots", "index.html")],
    title: "WhatsApp & Telegram AI Commercial Bots | Customer Automation | GARUDA",
    description: "Custom WhatsApp and Telegram AI commercial bots with multi-turn sales scoping, automated lead qualification, and instant payment checkout.",
    canonical: "https://www.garudaos.in/services/whatsapp-telegram-ai-bots",
    h1: "Custom WhatsApp & Telegram AI Commercial Bots",
    eyebrow: "CONVERSATIONAL AI",
    contentSnippet: `
      <h2>24/7 Automated Customer Scoping & Payment Checkout Bots</h2>
      <p>GARUDA deploys senior solution architect bots that converse naturally, understand custom product requirements, formulate instant price quotes, and generate payment checkout links.</p>
      <h3>Engineered Deliverables:</h3>
      <ul>
        <li>Natural language understanding and progressive requirement scoping</li>
        <li>Direct Razorpay/Stripe checkout links and instant receipt dispatch</li>
        <li>Anti-spam rate limiting and secure HMAC webhook verification</li>
        <li>Founder alert relay for high-value qualified leads</li>
      </ul>
      <p>Milestone Terms: 50% Advance Kickoff / 50% Upon Verified Delivery. Timeline: 3-5 business days.</p>
      <p><a href="/chat">Discuss AI Bot Scope with Solution Architect →</a></p>
    `,
    schema: {
      "@context": "https://schema.org",
      "@type": "Service",
      "@id": "https://www.garudaos.in/services/whatsapp-telegram-ai-bots#service",
      "name": "Custom WhatsApp & Telegram AI Commercial Bots",
      "serviceType": "Conversational Commercial AI Bots",
      "provider": {
        "@type": "Organization",
        "name": "GARUDA AI",
        "url": "https://www.garudaos.in"
      },
      "areaServed": "Worldwide"
    }
  },
  {
    path: "/chat",
    filePaths: [
      path.join(DIST_DIR, "chat", "index.html"),
      path.join(DIST_DIR, "chat.html")
    ],
    title: "Talk to GARUDA AI | AI Solution Architect & Project Scoping",
    description: "Interact directly with GARUDA AI's Solution Architect to scope custom AI pipelines, SaaS MVPs, automation workflows, and receive milestone quotes.",
    canonical: "https://www.garudaos.in/chat",
    h1: "Interactive AI Solution Architect & Project Scoping",
    eyebrow: "COMMERCIAL SCOPING & ARCHITECTURE",
    contentSnippet: `
      <h2>Formulate Your Project Specifications with GARUDA AI</h2>
      <p>The GARUDA AI Solution Architect chat assists founders, technical leads, and enterprises in defining architectural blueprints, estimating delivery timelines, and formulating fixed-price milestone quotes.</p>
      <p>Capabilities available in scoping chat:</p>
      <ul>
        <li>Interactive requirements discovery for Custom AI, SaaS MVPs, and Automations</li>
        <li>Architectural scoping and milestone feasibility evaluation</li>
        <li>Deterministic fixed-price quote formulation</li>
      </ul>
      <p><a href="/">Return to GARUDA AI Homepage</a> | <a href="/what-is-garuda-ai">Read System Architecture Overview</a></p>
    `,
    schema: {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "@id": "https://www.garudaos.in/chat#app",
      "name": "GARUDA AI Solution Architect & Scoping Chat",
      "applicationCategory": "BusinessApplication",
      "url": "https://www.garudaos.in/chat",
      "provider": {
        "@type": "Organization",
        "name": "GARUDA AI",
        "url": "https://www.garudaos.in"
      }
    }
  }
];

function generateHtmlForRoute(route, baseHtml) {
  let html = baseHtml;

  // 1. Replace Title
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${route.title}</title>`);

  // 2. Replace Meta Description
  html = html.replace(
    /<meta\s+name=["']description["']\s+content=["'][\s\S]*?["']\s*\/?>/i,
    `<meta name="description" content="${route.description}" />`
  );

  // 3. Replace Canonical Link
  html = html.replace(
    /<link\s+rel=["']canonical["']\s+href=["'][\s\S]*?["']\s*\/?>/i,
    `<link rel="canonical" href="${route.canonical}" />`
  );

  // 4. Replace OpenGraph Tags
  html = html.replace(
    /<meta\s+property=["']og:title["']\s+content=["'][\s\S]*?["']\s*\/?>/i,
    `<meta property="og:title" content="${route.title}" />`
  );
  html = html.replace(
    /<meta\s+property=["']og:description["']\s+content=["'][\s\S]*?["']\s*\/?>/i,
    `<meta property="og:description" content="${route.description}" />`
  );
  html = html.replace(
    /<meta\s+property=["']og:url["']\s+content=["'][\s\S]*?["']\s*\/?>/i,
    `<meta property="og:url" content="${route.canonical}" />`
  );

  // 5. Replace Twitter Tags
  html = html.replace(
    /<meta\s+name=["']twitter:title["']\s+content=["'][\s\S]*?["']\s*\/?>/i,
    `<meta name="twitter:title" content="${route.title}" />`
  );
  html = html.replace(
    /<meta\s+name=["']twitter:description["']\s+content=["'][\s\S]*?["']\s*\/?>/i,
    `<meta name="twitter:description" content="${route.description}" />`
  );
  html = html.replace(
    /<meta\s+name=["']twitter:url["']\s+content=["'][\s\S]*?["']\s*\/?>/i,
    `<meta name="twitter:url" content="${route.canonical}" />`
  );

  // 6. Inject Route-Specific Schema.org JSON-LD (if present)
  if (route.schema) {
    const routeSchemaScript = `<script type="application/ld+json" id="garuda-route-schema">${JSON.stringify(route.schema)}</script>`;
    html = html.replace("</head>", `  ${routeSchemaScript}\n</head>`);
  }

  // 7. Update Noscript Content with Route-Specific Semantic HTML
  const noscriptContent = [
    '<noscript>',
    '  <div style="padding: 2.5rem 1.5rem; max-width: 900px; margin: 0 auto; font-family: Inter, system-ui, sans-serif; background: #04070a; color: #f7f2dc; min-height: 100vh;">',
    `    <p style="color: #f5d76e; font-size: 0.8rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;">${route.eyebrow}</p>`,
    `    <h1 style="font-size: 2.2rem; font-weight: 800; color: #ffffff; margin: 0.5rem 0 1rem;">${route.h1}</h1>`,
    `    <p style="font-size: 1.1rem; color: #8d95a7; line-height: 1.6; margin-bottom: 2rem;">${route.description}</p>`,
    '    <main>',
    route.contentSnippet.trim().split("\n").map(l => "      " + l.trim()).join("\n"),
    '    </main>',
    '    <footer style="margin-top: 3rem; padding-top: 1.5rem; border-top: 1px solid rgba(245,215,110,0.15); font-size: 0.85rem; color: #6b7280;">',
    `      <p>© ${new Date().getFullYear()} GARUDA AI Operating System. Founded by Praveen Mahawar. Canonical URL: <a href="${route.canonical}" style="color: #f5d76e;">${route.canonical}</a></p>`,
    '    </footer>',
    '  </div>',
    '</noscript>'
  ].join("\n");

  html = html.replace(/<noscript>[\s\S]*?<\/noscript>/i, noscriptContent);

  return html;
}

console.log("=== EXECUTING GARUDA SEO PRERENDER PIPELINE ===");

let renderedCount = 0;
for (const route of ROUTES) {
  const routeHtml = generateHtmlForRoute(route, baseTemplate);
  for (const targetPath of route.filePaths) {
    const dir = path.dirname(targetPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(targetPath, routeHtml, "utf8");
    console.log(`✔ Prerendered [${route.path}] -> ${path.relative(DIST_DIR, targetPath)}`);
    renderedCount++;
  }
}

console.log(`\n🎉 Successfully prerendered ${renderedCount} static HTML files across ${ROUTES.length} canonical routes!`);
