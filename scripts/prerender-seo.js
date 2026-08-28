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
      <h3>Engineered Commercial Services:</h3>
      <ul>
        <li><a href="/services/custom-ai-development">Custom AI Development Services & Machine Learning</a></li>
        <li><a href="/services/ai-agent-development">Autonomous AI Agent Development & Multi-Agent Graphs</a></li>
        <li><a href="/services/custom-software-development">Custom Software Engineering & Enterprise Web Backends</a></li>
        <li><a href="/services/website-development">Custom Website Development & Modern Web Applications</a></li>
        <li><a href="/services/saas-mvp-development">SaaS MVP Development & Startup Product Engineering</a></li>
        <li><a href="/services/business-automation">Business Workflow AI Automation & API Integration</a></li>
        <li><a href="/services/rag-development">Enterprise RAG Systems & Document Knowledge Extraction</a></li>
        <li><a href="/services/whatsapp-telegram-ai-bots">WhatsApp & Telegram AI Commercial Bots</a></li>
        <li><a href="/what-is-garuda-ai">What is GARUDA AI? (Architecture & Product Entity Overview)</a></li>
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
        <li><a href="/services/ai-agent-development">AI Agent Development</a></li>
        <li><a href="/services/custom-software-development">Custom Software Development</a></li>
        <li><a href="/services/website-development">Custom Website Development</a></li>
        <li><a href="/services/saas-mvp-development">SaaS MVP Development</a></li>
        <li><a href="/services/business-automation">Business Workflow AI Automation</a></li>
        <li><a href="/services/rag-development">Enterprise RAG Systems</a></li>
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
    filePaths: [
      path.join(DIST_DIR, "services", "custom-ai-development", "index.html"),
      path.join(DIST_DIR, "services", "custom-ai-development.html")
    ],
    title: "Custom AI Development Services | AI Agents & Automation | GARUDA",
    description: "Enterprise-grade custom AI development, autonomous multi-agent systems, and specialized RAG pipelines engineered with verified deterministic quality.",
    canonical: "https://www.garudaos.in/services/custom-ai-development",
    h1: "Custom AI Development & Autonomous Agent Architecture",
    eyebrow: "AI & MACHINE LEARNING ENGINEERING",
    contentSnippet: `
      <h2>Deterministic AI Agents & Multi-Turn RAG Pipelines</h2>
      <p>GARUDA engineers bespoke AI operating pipelines: custom tool-calling agents, retrieval-augmented generation (RAG) vector stores, structured data extractors, and automated verification suites governed by cryptographic delivery manifests.</p>
      <h3>Engineered Deliverables:</h3>
      <ul>
        <li>Deterministic Multi-Agent Task Orchestration with retry governance</li>
        <li>Domain-specific fine-tuning and retrieval-augmented generation (RAG)</li>
        <li>Custom tool-calling integrations with CRM, ERP, and internal databases</li>
        <li>Cryptographic SHA-256 QA release manifests for full delivery auditability</li>
      </ul>
      <p>Milestone Terms: 50% Advance Kickoff / 50% Upon Verified Delivery. Timeline: 1-2 weeks.</p>
      <p><a href="/chat?topic=custom-ai-development">Discuss Custom AI Scope with Solution Architect →</a></p>
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
    path: "/services/ai-agent-development",
    filePaths: [
      path.join(DIST_DIR, "services", "ai-agent-development", "index.html"),
      path.join(DIST_DIR, "services", "ai-agent-development.html")
    ],
    title: "AI Agent Development Company | Multi-Agent Systems | GARUDA",
    description: "Build autonomous multi-agent AI systems, supervisor-worker agent graphs, and self-verifying AI workers that execute complex business operations.",
    canonical: "https://www.garudaos.in/services/ai-agent-development",
    h1: "Autonomous AI Agent Development & Multi-Agent Systems",
    eyebrow: "AGENTIC AI ENGINEERING",
    contentSnippet: `
      <h2>Autonomous Supervisor-Worker Agent Graphs That Execute Real Work</h2>
      <p>GARUDA engineers multi-agent graphs with strict supervisor-worker hierarchies. Agents plan tasks, invoke specialized subagents, verify output validity against deterministic rules, and notify human operators when approval is required.</p>
      <h3>Engineered Deliverables:</h3>
      <ul>
        <li>Supervisor-Worker Multi-Agent Orchestration graphs</li>
        <li>Dynamic tool-calling (APIs, web search, database querying, email dispatch)</li>
        <li>Automated state machine tracking with rollback on errors</li>
        <li>Human-in-the-loop approval gates for financial and outreach actions</li>
      </ul>
      <p>Milestone Terms: 50% Advance Kickoff / 50% Upon Verified Delivery. Timeline: 1-2 weeks.</p>
      <p><a href="/chat?topic=ai-agent-development">Discuss AI Agent Architecture with Solution Architect →</a></p>
    `,
    schema: {
      "@context": "https://schema.org",
      "@type": "Service",
      "@id": "https://www.garudaos.in/services/ai-agent-development#service",
      "name": "Autonomous AI Agent Development",
      "serviceType": "AI Agent Development",
      "provider": {
        "@type": "Organization",
        "name": "GARUDA AI",
        "url": "https://www.garudaos.in"
      },
      "areaServed": "Worldwide"
    }
  },
  {
    path: "/services/custom-software-development",
    filePaths: [
      path.join(DIST_DIR, "services", "custom-software-development", "index.html"),
      path.join(DIST_DIR, "services", "custom-software-development.html")
    ],
    title: "Custom Software Development Company | Enterprise Web Apps | GARUDA",
    description: "High-performance custom software engineering, scalable cloud backends, and responsive web applications built with React, Node.js, and PostgreSQL.",
    canonical: "https://www.garudaos.in/services/custom-software-development",
    h1: "Full-Stack Custom Software & Enterprise Engineering",
    eyebrow: "FULL STACK SOFTWARE ENGINEERING",
    contentSnippet: `
      <h2>Scalable Enterprise Software Engineered with Clean Architecture</h2>
      <p>GARUDA builds bespoke full-stack software tailored to your exact operational workflows: modern responsive interfaces, scalable microservices, relational and document databases, and complete data ownership.</p>
      <h3>Engineered Deliverables:</h3>
      <ul>
        <li>Modern React / Next.js / TypeScript frontend interfaces</li>
        <li>Scalable Node.js / Python REST & GraphQL microservices</li>
        <li>PostgreSQL / MongoDB database architecture with automated migrations</li>
        <li>Comprehensive automated regression test coverage (100% pass guarantee)</li>
      </ul>
      <p>Milestone Terms: 50% Advance Kickoff / 50% Upon Verified Delivery. Timeline: 2-3 weeks.</p>
      <p><a href="/chat?topic=custom-software-development">Discuss Custom Software Scope with Solution Architect →</a></p>
    `,
    schema: {
      "@context": "https://schema.org",
      "@type": "Service",
      "@id": "https://www.garudaos.in/services/custom-software-development#service",
      "name": "Full-Stack Custom Software Engineering",
      "serviceType": "Custom Software Development",
      "provider": {
        "@type": "Organization",
        "name": "GARUDA AI",
        "url": "https://www.garudaos.in"
      },
      "areaServed": "Worldwide"
    }
  },
  {
    path: "/services/website-development",
    filePaths: [
      path.join(DIST_DIR, "services", "website-development", "index.html"),
      path.join(DIST_DIR, "services", "website-development.html")
    ],
    title: "Custom Website Development Company | High-Converting Web Design | GARUDA",
    description: "Custom-engineered modern business websites with sub-second page speeds, dynamic lead capture forms, technical SEO, and conversion-focused design.",
    canonical: "https://www.garudaos.in/services/website-development",
    h1: "High-Converting Custom Website Development",
    eyebrow: "HIGH PERFORMANCE WEB ENGINEERING",
    contentSnippet: `
      <h2>Blazing-Fast, High-Converting Business & SaaS Websites</h2>
      <p>GARUDA engineers high-performance custom websites using modern React/Vite/Next.js stacks with 95+ Google PageSpeed scores, pre-rendered static HTML for crawler discoverability, and embedded lead capture forms.</p>
      <h3>Engineered Deliverables:</h3>
      <ul>
        <li>Sub-second load times with static HTML pre-rendering & CDN edge caching</li>
        <li>Automated lead capture intake with instant email/Telegram alerts</li>
        <li>Full Technical SEO architecture (Schema.org JSON-LD, OpenGraph, Canonical URLs)</li>
        <li>100% responsive, mobile-first design with fluid interactions</li>
      </ul>
      <p>Milestone Terms: 50% Advance Kickoff / 50% Upon Verified Delivery. Timeline: 4-7 business days.</p>
      <p><a href="/chat?topic=website-development">Discuss Website Scope with Solution Architect →</a></p>
    `,
    schema: {
      "@context": "https://schema.org",
      "@type": "Service",
      "@id": "https://www.garudaos.in/services/website-development#service",
      "name": "High-Converting Custom Website Development",
      "serviceType": "Custom Website Development",
      "provider": {
        "@type": "Organization",
        "name": "GARUDA AI",
        "url": "https://www.garudaos.in"
      },
      "areaServed": "Worldwide"
    }
  },
  {
    path: "/services/saas-mvp-development",
    filePaths: [
      path.join(DIST_DIR, "services", "saas-mvp-development", "index.html"),
      path.join(DIST_DIR, "services", "saas-mvp-development.html"),
      path.join(DIST_DIR, "services", "custom-software-saas-mvp", "index.html"),
      path.join(DIST_DIR, "services", "custom-software-saas-mvp.html")
    ],
    title: "SaaS MVP Development Company | Build Startup Software | GARUDA",
    description: "Turn your product idea into a production-ready SaaS MVP in 2-3 weeks with authentication, Stripe/Razorpay subscriptions, database models, and automated QA.",
    canonical: "https://www.garudaos.in/services/saas-mvp-development",
    h1: "Rapid Startup SaaS MVP Development",
    eyebrow: "STARTUP PRODUCT ENGINEERING",
    contentSnippet: `
      <h2>From Product Concept to Paying SaaS Customers in 2-3 Weeks</h2>
      <p>GARUDA builds production-grade SaaS MVPs in 2 to 3 weeks using modular microservices: clean React dashboard, secure authentication, Stripe/Razorpay billing, database schema, and automated test coverage.</p>
      <h3>Engineered Deliverables:</h3>
      <ul>
        <li>Production-ready User Authentication & Role-Based Access Control (RBAC)</li>
        <li>Automated Stripe & Razorpay global recurring subscription billing</li>
        <li>Scalable database architecture with automated migration scripts</li>
        <li>Interactive analytics & customer management dashboard</li>
      </ul>
      <p>Milestone Terms: 50% Advance Kickoff / 50% Upon Verified Delivery. Timeline: 2-3 weeks.</p>
      <p><a href="/chat?topic=saas-mvp-development">Discuss SaaS MVP Scope with Solution Architect →</a></p>
    `,
    schema: {
      "@context": "https://schema.org",
      "@type": "Service",
      "@id": "https://www.garudaos.in/services/saas-mvp-development#service",
      "name": "Rapid Startup SaaS MVP Development",
      "serviceType": "SaaS MVP Development",
      "provider": {
        "@type": "Organization",
        "name": "GARUDA AI",
        "url": "https://www.garudaos.in"
      },
      "areaServed": "Worldwide"
    }
  },
  {
    path: "/services/business-automation",
    filePaths: [
      path.join(DIST_DIR, "services", "business-automation", "index.html"),
      path.join(DIST_DIR, "services", "business-automation.html"),
      path.join(DIST_DIR, "services", "business-workflow-ai-automation", "index.html"),
      path.join(DIST_DIR, "services", "business-workflow-ai-automation.html")
    ],
    title: "Business Process Automation Services | Workflow AI | GARUDA",
    description: "Autonomous business workflow automation connecting CRMs, payment gateways, document pipelines, and enterprise data with zero loss.",
    canonical: "https://www.garudaos.in/services/business-automation",
    h1: "Enterprise Business Process & Workflow AI Automation",
    eyebrow: "OPERATIONS & AUTOMATION",
    contentSnippet: `
      <h2>Automate Repetitive Lead Capture, Invoicing & Operations</h2>
      <p>GARUDA builds governed event-driven automation workers that link inbound leads, accounting software, messaging channels, and internal systems with zero data leakage.</p>
      <h3>Engineered Deliverables:</h3>
      <ul>
        <li>Automated Multi-Source Lead Ingestion & Prospect Qualification</li>
        <li>Document & Invoice Parsing with automated accounting sync</li>
        <li>Bi-directional webhook integrations across CRM, Slack, WhatsApp, and email</li>
      </ul>
      <p>Milestone Terms: 50% Advance Kickoff / 50% Upon Verified Delivery. Timeline: 3-7 business days.</p>
      <p><a href="/chat?topic=business-automation">Discuss Automation Scope with Solution Architect →</a></p>
    `,
    schema: {
      "@context": "https://schema.org",
      "@type": "Service",
      "@id": "https://www.garudaos.in/services/business-automation#service",
      "name": "Enterprise Business Process & Workflow AI Automation",
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
    path: "/services/rag-development",
    filePaths: [
      path.join(DIST_DIR, "services", "rag-development", "index.html"),
      path.join(DIST_DIR, "services", "rag-development.html")
    ],
    title: "Enterprise RAG Development Services | AI Knowledge Bases | GARUDA",
    description: "Build custom enterprise RAG pipelines, dense-sparse vector search, and document AI extraction with strict citation grounding and 0% hallucinations.",
    canonical: "https://www.garudaos.in/services/rag-development",
    h1: "Enterprise Retrieval-Augmented Generation (RAG) & Knowledge AI",
    eyebrow: "ENTERPRISE RAG & KNOWLEDGE ENGINEERING",
    contentSnippet: `
      <h2>Turn Complex Enterprise Documents into Instant Grounded Intelligence</h2>
      <p>GARUDA architects enterprise-grade RAG systems using hybrid dense-sparse vector indexing, semantic re-ranking, document chunking, and strict citation grounding to deliver 100% fact-checked responses.</p>
      <h3>Engineered Deliverables:</h3>
      <ul>
        <li>Hybrid Vector Search (dense embeddings + BM25 keyword matching)</li>
        <li>Multi-format document ingestion (PDF, DOCX, XLSX, Markdown, SQL)</li>
        <li>Semantic re-ranking with source page & paragraph citation metadata</li>
        <li>Strict zero-hallucination verification filters</li>
      </ul>
      <p>Milestone Terms: 50% Advance Kickoff / 50% Upon Verified Delivery. Timeline: 1-2 weeks.</p>
      <p><a href="/chat?topic=rag-development">Discuss RAG Scope with Solution Architect →</a></p>
    `,
    schema: {
      "@context": "https://schema.org",
      "@type": "Service",
      "@id": "https://www.garudaos.in/services/rag-development#service",
      "name": "Enterprise Retrieval-Augmented Generation (RAG) Development",
      "serviceType": "Enterprise RAG Systems",
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
    filePaths: [
      path.join(DIST_DIR, "services", "whatsapp-telegram-ai-bots", "index.html"),
      path.join(DIST_DIR, "services", "whatsapp-telegram-ai-bots.html")
    ],
    title: "WhatsApp & Telegram AI Commercial Bots | Customer Automation | GARUDA",
    description: "Custom WhatsApp and Telegram AI commercial bots with multi-turn sales scoping, automated lead qualification, and instant payment checkout.",
    canonical: "https://www.garudaos.in/services/whatsapp-telegram-ai-bots",
    h1: "Custom WhatsApp & Telegram AI Commercial Bots",
    eyebrow: "CONVERSATIONAL COMMERCIAL AI",
    contentSnippet: `
      <h2>24/7 Automated Customer Support, Scoping & Payment Checkout Bots</h2>
      <p>GARUDA deploys senior solution architect bots that converse naturally, understand custom product requirements, formulate instant price quotes, and generate payment checkout links.</p>
      <h3>Engineered Deliverables:</h3>
      <ul>
        <li>Natural language understanding and progressive requirement scoping</li>
        <li>Direct Razorpay/Stripe checkout links and instant receipt dispatch</li>
        <li>Anti-spam rate limiting and secure HMAC webhook verification</li>
        <li>Founder alert relay for high-value qualified leads</li>
      </ul>
      <p>Milestone Terms: 50% Advance Kickoff / 50% Upon Verified Delivery. Timeline: 3-5 business days.</p>
      <p><a href="/chat?topic=whatsapp-telegram-ai-bots">Discuss Bot Scope with Solution Architect →</a></p>
    `,
    schema: {
      "@context": "https://schema.org",
      "@type": "Service",
      "@id": "https://www.garudaos.in/services/whatsapp-telegram-ai-bots#service",
      "name": "Custom WhatsApp & Telegram AI Commercial Bots",
      "serviceType": "Conversational AI Bots",
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
    description: "Interact directly with GARUDA AI to scope custom software, AI development, business automation, or explore system capabilities in real-time.",
    canonical: "https://www.garudaos.in/chat",
    h1: "Interactive AI Solution Architect & Project Scoping",
    eyebrow: "INTERACTIVE SOLUTION ARCHITECT CONSOLE",
    contentSnippet: `
      <h2>Real-Time AI Project Scoping & Requirements Intake</h2>
      <p>Consult with GARUDA's conversational intelligence to draft project requirements, evaluate architecture options, and receive milestone pricing estimates.</p>
      <p>Direct Services: Custom AI Development, Autonomous Agents, Full-Stack Web Software, Enterprise Workflow Automation.</p>
    `
  },
  {
    path: "/demo",
    filePaths: [
      path.join(DIST_DIR, "demo", "index.html"),
      path.join(DIST_DIR, "demo.html")
    ],
    title: "GARUDA AI Interactive Demo | Autonomous AI Operating System",
    description: "Launch the interactive GARUDA AI demonstration. Experience governed software execution, autonomous multi-agent workflows, and enterprise intelligence live.",
    canonical: "https://www.garudaos.in/demo",
    h1: "Launch GARUDA AI Interactive Demo",
    eyebrow: "AUTONOMOUS AI EXPERIENCE",
    contentSnippet: `
      <h2>Experience Governed AI Execution in Real-Time</h2>
      <p>Launch the interactive GARUDA AI demonstration to evaluate multi-agent orchestration, custom software generation, and business automation workflows.</p>
      <p><a href="/chat">Discuss Custom Project Scope →</a> | <a href="/what-is-garuda-ai">Learn About GARUDA Architecture →</a></p>
    `
  }
];

function injectSeoMetadata(html, route) {
  let output = html;

  // 1. Replace <title>
  output = output.replace(/<title>[\s\S]*?<\/title>/i, `<title>${route.title}</title>`);

  // 2. Replace or Inject <meta name="description">
  const metaDescTag = `<meta name="description" content="${route.description.replace(/"/g, "&quot;")}" />`;
  if (/<meta\s+name=["']description["'][\s\S]*?>/i.test(output)) {
    output = output.replace(/<meta\s+name=["']description["'][\s\S]*?>/i, metaDescTag);
  } else {
    output = output.replace(/<\/head>/i, `  ${metaDescTag}\n</head>`);
  }

  // 3. Replace or Inject <link rel="canonical">
  const canonicalTag = `<link rel="canonical" href="${route.canonical}" />`;
  if (/<link\s+rel=["']canonical["'][\s\S]*?>/i.test(output)) {
    output = output.replace(/<link\s+rel=["']canonical["'][\s\S]*?>/i, canonicalTag);
  } else {
    output = output.replace(/<\/head>/i, `  ${canonicalTag}\n</head>`);
  }

  // 4. OpenGraph and Twitter Meta Tags
  const ogTags = [
    `<meta property="og:title" content="${route.title.replace(/"/g, "&quot;")}" />`,
    `<meta property="og:description" content="${route.description.replace(/"/g, "&quot;")}" />`,
    `<meta property="og:url" content="${route.canonical}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${route.title.replace(/"/g, "&quot;")}" />`,
    `<meta name="twitter:description" content="${route.description.replace(/"/g, "&quot;")}" />`
  ].join("\n  ");

  output = output.replace(/<\/head>/i, `  ${ogTags}\n</head>`);

  // 5. Inject Structured Data (Schema.org JSON-LD)
  if (route.schema) {
    const schemaScript = `<script type="application/ld+json">\n${JSON.stringify(route.schema, null, 2)}\n</script>`;
    output = output.replace(/<\/head>/i, `  ${schemaScript}\n</head>`);
  }

  // 6. Inject Semantic, Crawler-Visible Fallback Content inside #root
  const fallbackHtml = `
    <div id="seo-fallback" style="padding: 2rem; max-width: 900px; margin: 0 auto; font-family: sans-serif; line-height: 1.6; color: #111;">
      ${route.eyebrow ? `<p style="font-size: 0.85rem; font-weight: bold; color: #b8860b; text-transform: uppercase; letter-spacing: 0.1em;">${route.eyebrow}</p>` : ""}
      <h1 style="font-size: 2.2rem; margin-top: 0.5rem; margin-bottom: 1rem;">${route.h1 || route.title}</h1>
      <p style="font-size: 1.1rem; color: #444;">${route.description}</p>
      ${route.contentSnippet || ""}
      <p style="margin-top: 2rem; font-size: 0.85rem; color: #888;">© 2026 GARUDA Operating System. Official Entity Domain: https://www.garudaos.in</p>
    </div>
  `;

  // Inject fallbackHtml inside <div id="root"></div> so crawlers without JS immediately see full page content
  output = output.replace(/<div id="root"><\/div>/i, `<div id="root">${fallbackHtml}</div>`);

  return output;
}

console.log("=== EXECUTING GARUDA SEO PRERENDER PIPELINE ===");

let renderedCount = 0;
for (const route of ROUTES) {
  const renderedHtml = injectSeoMetadata(baseTemplate, route);

  for (const filePath of route.filePaths) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    const cleanHtml = renderedHtml.split("\n").map((line) => line.trimEnd()).join("\n");
    fs.writeFileSync(filePath, cleanHtml, "utf8");
    console.log(`✔ Prerendered [${route.path}] -> ${path.relative(DIST_DIR, filePath)}`);
    renderedCount++;
  }
}

console.log(`\n🎉 Successfully prerendered ${renderedCount} static HTML files across ${ROUTES.length} canonical routes!`);
