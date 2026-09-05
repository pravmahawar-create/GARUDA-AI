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
    path: "/experience",
    filePaths: [
      path.join(DIST_DIR, "experience", "index.html"),
      path.join(DIST_DIR, "experience.html")
    ],
    title: "THE GARUDA EXPERIENCE | Autonomous AI Presentation & Live Demonstration",
    description: "Experience GARUDA AI explaining itself autonomously. An interactive sovereign AI Operating System presentation, architectural dialogue, and live capability demonstration.",
    canonical: "https://www.garudaos.in/experience",
    h1: "The GARUDA Experience",
    eyebrow: "AUTONOMOUS SOVEREIGN PRESENTATION ENGINE",
    contentSnippet: `
      <h2>Autonomous Sovereign Self-Introduction & Live Proof</h2>
      <p>Experience GARUDA AI presenting its own architecture, philosophy, and verified capabilities live. Founded by Praveen Mahawar.</p>
      <p><a href="/experience">Enter The GARUDA Experience</a> | <a href="/what-is-garuda-ai">Learn More</a></p>
    `
  },
  {
    path: "/investor",
    filePaths: [
      path.join(DIST_DIR, "investor", "index.html"),
      path.join(DIST_DIR, "investor.html")
    ],
    title: "GARUDA AI Investor Autonomous Briefing | Sovereign Intelligence",
    description: "Autonomous briefing for investors, partners, and enterprise leaders. Live architectural demonstration, 100% Anti-Fabrication Truth Law, and multi-tier sovereign core.",
    canonical: "https://www.garudaos.in/investor",
    h1: "GARUDA AI Investor Briefing",
    eyebrow: "AUTONOMOUS COMMERCIAL BRIEFING",
    contentSnippet: `
      <h2>Autonomous Architectural Briefing for Investors & Partners</h2>
      <p>GARUDA introduces itself, explains why it is fundamentally different from LLM wrappers, and demonstrates real verified capabilities live.</p>
      <p><a href="/investor">Start Autonomous Briefing</a> | <a href="/chat">Talk to Solution Architect</a></p>
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
  },
  {
    path: "/guides",
    filePaths: [
      path.join(DIST_DIR, "guides", "index.html"),
      path.join(DIST_DIR, "guides.html")
    ],
    title: "Engineering & AI Architecture Guides | GARUDA AI",
    description: "Comprehensive technical guides, architectural comparisons, and engineering blueprints for custom AI development, autonomous agents, RAG, SaaS MVPs, and business automation.",
    canonical: "https://www.garudaos.in/guides",
    h1: "Engineering Guides & AI Architectural Blueprints",
    eyebrow: "GARUDA KNOWLEDGE & ARCHITECTURE LIBRARY",
    contentSnippet: `
      <h2>Technical Guides & Decision Frameworks for Engineering Leaders</h2>
      <p>Explore in-depth architectural comparisons and implementation roadmaps for custom AI, multi-agent graphs, RAG systems, and SaaS development.</p>
      <ul>
        <li><a href="/guides/ai-agent-vs-chatbot">AI Agent vs Chatbot: What Businesses Actually Need</a></li>
        <li><a href="/guides/how-business-workflow-automation-works">How Business Workflow Automation with AI Works</a></li>
        <li><a href="/guides/rag-systems-architecture-implementation-guide">RAG Systems for Business: Architecture, Vector Search, and Implementation</a></li>
        <li><a href="/guides/how-to-build-saas-mvp-architecture-timeline">How to Build a SaaS MVP in 2-3 Weeks: Scope, Architecture & Timeline</a></li>
        <li><a href="/guides/custom-software-vs-off-the-shelf-software">Custom Software vs Off-the-Shelf SaaS: The Enterprise Decision Framework</a></li>
        <li><a href="/guides/automate-whatsapp-business-operations-ai">How Businesses Can Automate WhatsApp Operations with AI</a></li>
        <li><a href="/guides/what-custom-ai-development-actually-involves">What Does Custom AI Development Actually Involve?</a></li>
        <li><a href="/guides/how-to-plan-ai-automation-project">How to Plan an AI Automation Project Before Development</a></li>
      </ul>
    `
  },
  {
    path: "/guides/ai-agent-vs-chatbot",
    filePaths: [
      path.join(DIST_DIR, "guides", "ai-agent-vs-chatbot", "index.html"),
      path.join(DIST_DIR, "guides", "ai-agent-vs-chatbot.html")
    ],
    title: "AI Agent vs Chatbot for Business: Key Differences & Architecture Guide | GARUDA",
    description: "Understand the critical differences between conversational chatbots and autonomous AI agents. Learn when your business needs multi-step agentic workflows vs simple LLM chats.",
    canonical: "https://www.garudaos.in/guides/ai-agent-vs-chatbot",
    h1: "AI Agent vs Chatbot: What Businesses Actually Need",
    eyebrow: "AGENTIC AI & ARCHITECTURE GUIDE",
    contentSnippet: `
      <h2>Conversational Text vs Autonomous Multi-Step Execution</h2>
      <p>While chatbots generate text responses to single prompts, autonomous AI agents plan multi-step workflows, call external APIs, query databases, verify their own work, and execute real business tasks.</p>
      <p>Related Service: <a href="/services/ai-agent-development">Autonomous AI Agent Development Services →</a></p>
    `,
    schema: {
      "@context": "https://schema.org",
      "@type": "TechArticle",
      "@id": "https://www.garudaos.in/guides/ai-agent-vs-chatbot#article",
      "headline": "AI Agent vs Chatbot: What Businesses Actually Need",
      "description": "Understand the critical differences between conversational chatbots and autonomous AI agents.",
      "url": "https://www.garudaos.in/guides/ai-agent-vs-chatbot"
    }
  },
  {
    path: "/guides/how-business-workflow-automation-works",
    filePaths: [
      path.join(DIST_DIR, "guides", "how-business-workflow-automation-works", "index.html"),
      path.join(DIST_DIR, "guides", "how-business-workflow-automation-works.html")
    ],
    title: "How Business Workflow AI Automation Works: Architecture & Guide | GARUDA",
    description: "Discover how modern AI workflow automation connects CRMs, document pipelines, payment gateways, and databases with zero data leakage.",
    canonical: "https://www.garudaos.in/guides/how-business-workflow-automation-works",
    h1: "How Business Workflow Automation with AI Works",
    eyebrow: "OPERATIONS & AUTOMATION ARCHITECTURE",
    contentSnippet: `
      <h2>Event-Driven Automation, Document Parsing & Zero-Loss Webhooks</h2>
      <p>Learn how event-driven architecture, cognitive OCR parsers, and HMAC webhook verification automate inbound leads, invoice processing, and customer onboarding.</p>
      <p>Related Service: <a href="/services/business-automation">Enterprise Business Workflow AI Automation →</a></p>
    `,
    schema: {
      "@context": "https://schema.org",
      "@type": "TechArticle",
      "@id": "https://www.garudaos.in/guides/how-business-workflow-automation-works#article",
      "headline": "How Business Workflow Automation with AI Works",
      "description": "Discover how modern AI workflow automation connects CRMs, document pipelines, payment gateways, and databases with zero data leakage.",
      "url": "https://www.garudaos.in/guides/how-business-workflow-automation-works"
    }
  },
  {
    path: "/guides/rag-systems-architecture-implementation-guide",
    filePaths: [
      path.join(DIST_DIR, "guides", "rag-systems-architecture-implementation-guide", "index.html"),
      path.join(DIST_DIR, "guides", "rag-systems-architecture-implementation-guide.html")
    ],
    title: "Enterprise RAG Systems: Architecture & Implementation Guide | GARUDA",
    description: "Comprehensive engineering guide to Retrieval-Augmented Generation (RAG). Learn hybrid search, vector embeddings, chunking strategies, and zero-hallucination citation grounding.",
    canonical: "https://www.garudaos.in/guides/rag-systems-architecture-implementation-guide",
    h1: "RAG Systems for Business: Architecture, Use Cases & Implementation",
    eyebrow: "ENTERPRISE RAG & KNOWLEDGE AI",
    contentSnippet: `
      <h2>Hybrid Vector Search, Semantic Chunking & Citation Grounding</h2>
      <p>Standard LLMs cannot read private company documents and frequently hallucinate. Retrieval-Augmented Generation (RAG) grounds AI in verified enterprise knowledge.</p>
      <p>Related Service: <a href="/services/rag-development">Enterprise RAG Systems Development →</a></p>
    `,
    schema: {
      "@context": "https://schema.org",
      "@type": "TechArticle",
      "@id": "https://www.garudaos.in/guides/rag-systems-architecture-implementation-guide#article",
      "headline": "RAG Systems for Business: Architecture, Use Cases & Implementation",
      "description": "Comprehensive engineering guide to Retrieval-Augmented Generation (RAG).",
      "url": "https://www.garudaos.in/guides/rag-systems-architecture-implementation-guide"
    }
  },
  {
    path: "/guides/how-to-build-saas-mvp-architecture-timeline",
    filePaths: [
      path.join(DIST_DIR, "guides", "how-to-build-saas-mvp-architecture-timeline", "index.html"),
      path.join(DIST_DIR, "guides", "how-to-build-saas-mvp-architecture-timeline.html")
    ],
    title: "How to Build a SaaS MVP in 2-3 Weeks: Architecture & Roadmap | GARUDA",
    description: "Step-by-step technical roadmap for founders building a production SaaS MVP in 14-21 days. Learn stack selection, authentication, database schema, and Stripe billing.",
    canonical: "https://www.garudaos.in/guides/how-to-build-saas-mvp-architecture-timeline",
    h1: "How to Build a SaaS MVP in 2-3 Weeks: Scope, Architecture & Timeline",
    eyebrow: "STARTUP PRODUCT & FULL-STACK ROADMAP",
    contentSnippet: `
      <h2>Scope, Multi-Tenant Architecture & Production Billing Engine</h2>
      <p>The deterministic 2-3 week engineering blueprint to get your SaaS MVP in front of paying customers with automated test verification and clean multi-tenant isolation.</p>
      <p>Related Service: <a href="/services/saas-mvp-development">Rapid Startup SaaS MVP Development →</a></p>
    `,
    schema: {
      "@context": "https://schema.org",
      "@type": "TechArticle",
      "@id": "https://www.garudaos.in/guides/how-to-build-saas-mvp-architecture-timeline#article",
      "headline": "How to Build a SaaS MVP in 2-3 Weeks: Scope, Architecture & Timeline",
      "description": "Step-by-step technical roadmap for founders building a production SaaS MVP in 14-21 days.",
      "url": "https://www.garudaos.in/guides/how-to-build-saas-mvp-architecture-timeline"
    }
  },
  {
    path: "/guides/custom-software-vs-off-the-shelf-software",
    filePaths: [
      path.join(DIST_DIR, "guides", "custom-software-vs-off-the-shelf-software", "index.html"),
      path.join(DIST_DIR, "guides", "custom-software-vs-off-the-shelf-software.html")
    ],
    title: "Custom Software vs Off-the-Shelf SaaS: Complete Decision Framework | GARUDA",
    description: "Detailed business comparison between custom software development and off-the-shelf SaaS subscriptions. Evaluate TCO, IP ownership, and operational fit.",
    canonical: "https://www.garudaos.in/guides/custom-software-vs-off-the-shelf-software",
    h1: "Custom Software vs Off-the-Shelf SaaS: The Enterprise Decision Framework",
    eyebrow: "SOFTWARE STRATEGY & TCO FRAMEWORK",
    contentSnippet: `
      <h2>Total Cost of Ownership, IP Ownership & Vendor Lock-In</h2>
      <p>Evaluate whether your company should build custom software or pay for monthly SaaS licenses using our 3-year TCO comparison and 5-question decision matrix.</p>
      <p>Related Service: <a href="/services/custom-software-development">Full-Stack Custom Software Engineering →</a></p>
    `,
    schema: {
      "@context": "https://schema.org",
      "@type": "TechArticle",
      "@id": "https://www.garudaos.in/guides/custom-software-vs-off-the-shelf-software#article",
      "headline": "Custom Software vs Off-the-Shelf SaaS: The Enterprise Decision Framework",
      "description": "Detailed business comparison between custom software development and off-the-shelf SaaS subscriptions.",
      "url": "https://www.garudaos.in/guides/custom-software-vs-off-the-shelf-software"
    }
  },
  {
    path: "/guides/automate-whatsapp-business-operations-ai",
    filePaths: [
      path.join(DIST_DIR, "guides", "automate-whatsapp-business-operations-ai", "index.html"),
      path.join(DIST_DIR, "guides", "automate-whatsapp-business-operations-ai.html")
    ],
    title: "Automate WhatsApp Business Operations with AI: Guide & Blueprint | GARUDA",
    description: "Learn how to build 24/7 commercial WhatsApp AI bots for customer scoping, automated lead qualification, instant payments, and CRM sync.",
    canonical: "https://www.garudaos.in/guides/automate-whatsapp-business-operations-ai",
    h1: "How Businesses Can Automate WhatsApp Operations with AI",
    eyebrow: "CONVERSATIONAL COMMERCIAL AI",
    contentSnippet: `
      <h2>WhatsApp Cloud API, Multi-Turn Lead Scoping & Dynamic Payment Links</h2>
      <p>Learn the technical blueprint to deploy intelligent, commercial WhatsApp AI bots that scope requirements and generate instant checkout links with human handoff safeguards.</p>
      <p>Related Service: <a href="/services/whatsapp-telegram-ai-bots">Custom WhatsApp & Telegram AI Commercial Bots →</a></p>
    `,
    schema: {
      "@context": "https://schema.org",
      "@type": "TechArticle",
      "@id": "https://www.garudaos.in/guides/automate-whatsapp-business-operations-ai#article",
      "headline": "How Businesses Can Automate WhatsApp Operations with AI",
      "description": "Learn how to build 24/7 commercial WhatsApp AI bots for customer scoping, automated lead qualification, instant payments, and CRM sync.",
      "url": "https://www.garudaos.in/guides/automate-whatsapp-business-operations-ai"
    }
  },
  {
    path: "/guides/what-custom-ai-development-actually-involves",
    filePaths: [
      path.join(DIST_DIR, "guides", "what-custom-ai-development-actually-involves", "index.html"),
      path.join(DIST_DIR, "guides", "what-custom-ai-development-actually-involves.html")
    ],
    title: "What Does Custom AI Development Actually Involve? (Process & Cost) | GARUDA",
    description: "A transparent, technical guide to what custom AI engineering actually entails. Learn data prep, model selection, prompt graphs, automated evaluation, and deployment costs.",
    canonical: "https://www.garudaos.in/guides/what-custom-ai-development-actually-involves",
    h1: "What Does Custom AI Development Actually Involve?",
    eyebrow: "AI ENGINEERING & STRATEGY",
    contentSnippet: `
      <h2>Beyond the Hype: Data Preparation, Tool Graphs & Deterministic QA</h2>
      <p>A transparent engineering reality check on custom AI development: data readiness, model selection, prompt graphs, automated evaluation, and realistic milestone budgets.</p>
      <p>Related Service: <a href="/services/custom-ai-development">Custom AI Development Services →</a></p>
    `,
    schema: {
      "@context": "https://schema.org",
      "@type": "TechArticle",
      "@id": "https://www.garudaos.in/guides/what-custom-ai-development-actually-involves#article",
      "headline": "What Does Custom AI Development Actually Involve?",
      "description": "A transparent, technical guide to what custom AI engineering actually entails.",
      "url": "https://www.garudaos.in/guides/what-custom-ai-development-actually-involves"
    }
  },
  {
    path: "/guides/how-to-plan-ai-automation-project",
    filePaths: [
      path.join(DIST_DIR, "guides", "how-to-plan-ai-automation-project", "index.html"),
      path.join(DIST_DIR, "guides", "how-to-plan-ai-automation-project.html")
    ],
    title: "How to Plan an AI Automation Project: Scoping & ROI Framework | GARUDA",
    description: "Actionable framework for business leaders planning an AI automation initiative. Learn how to calculate ROI, define acceptance criteria, and prevent scope creep.",
    canonical: "https://www.garudaos.in/guides/how-to-plan-ai-automation-project",
    h1: "How to Plan an AI Automation Project Before Development",
    eyebrow: "AI STRATEGY & SCOPING FRAMEWORK",
    contentSnippet: `
      <h2>ROI Calculation, Data Readiness Audits & Deterministic Acceptance Criteria</h2>
      <p>The step-by-step framework to scope, validate, and budget your AI automation project before development to prevent pilot purgatory and guarantee positive ROI.</p>
      <p>Related Service: <a href="/services/custom-ai-development">Custom AI Development & Architecture →</a></p>
    `,
    schema: {
      "@context": "https://schema.org",
      "@type": "TechArticle",
      "@id": "https://www.garudaos.in/guides/how-to-plan-ai-automation-project#article",
      "headline": "How to Plan an AI Automation Project Before Development",
      "description": "Actionable framework for business leaders planning an AI automation initiative.",
      "url": "https://www.garudaos.in/guides/how-to-plan-ai-automation-project"
    }
  },
  {
    path: "/command-center",
    filePaths: [
      path.join(DIST_DIR, "command-center", "index.html"),
      path.join(DIST_DIR, "command-center.html")
    ],
    title: "GARUDA High Command Center | Private Sovereign Intelligence",
    description: "Private mobile-first command center for Boss to observe and govern the GARUDA Kingdom.",
    canonical: "https://www.garudaos.in/command-center",
    robots: "noindex, nofollow"
  },
  {
    path: "/command",
    filePaths: [
      path.join(DIST_DIR, "command", "index.html"),
      path.join(DIST_DIR, "command.html")
    ],
    title: "GARUDA High Command Center | Private Sovereign Intelligence",
    description: "Private mobile-first command center for Boss to observe and govern the GARUDA Kingdom.",
    canonical: "https://www.garudaos.in/command-center",
    robots: "noindex, nofollow"
  },
  {
    path: "/high-command",
    filePaths: [
      path.join(DIST_DIR, "high-command", "index.html"),
      path.join(DIST_DIR, "high-command.html")
    ],
    title: "GARUDA High Command Center | Private Sovereign Intelligence",
    description: "Private mobile-first command center for Boss to observe and govern the GARUDA Kingdom.",
    canonical: "https://www.garudaos.in/command-center",
    robots: "noindex, nofollow"
  },
  {
    path: "/growth",
    filePaths: [
      path.join(DIST_DIR, "growth", "index.html"),
      path.join(DIST_DIR, "growth.html")
    ],
    title: "Growth Command Center — Cross-Universe Intelligence",
    description: "Command interface for GARUDA Growth Intelligence: cross-universe campaign orchestration with founder approval gates.",
    canonical: "https://www.garudaos.in/growth",
    robots: "noindex, nofollow"
  },
  {
    path: "/founder",
    filePaths: [
      path.join(DIST_DIR, "founder", "index.html"),
      path.join(DIST_DIR, "founder.html")
    ],
    title: "GARUDA Founder Workspace | Sovereign Console",
    description: "Private management console for GARUDA operations.",
    canonical: "https://www.garudaos.in/founder",
    robots: "noindex, nofollow"
  },
  {
    path: "/founder/acquisition",
    filePaths: [
      path.join(DIST_DIR, "founder", "acquisition", "index.html"),
      path.join(DIST_DIR, "founder-acquisition.html")
    ],
    title: "GARUDA Founder Acquisition Cockpit | Sent Outreach Console",
    description: "Founder Acquisition Cockpit — canonical Sent Outreach history, governed outreach dispatch, and real Brevo relay telemetry.",
    canonical: "https://www.garudaos.in/founder/acquisition",
    robots: "noindex, nofollow",
    h1: "GARUDA Founder Acquisition Cockpit",
    eyebrow: "FOUNDER COMMAND — SENT OUTREACH",
    contentSnippet: `
      <h2>Canonical Sent Outreach History</h2>
      <p>Real persisted outreach dispatches with Brevo Message IDs, IST dispatch timestamps, and truthful AWAITING telemetry. No synthetic delivery data.</p>
      <p>Live prospect: Niravi Jaipur — contact@niravijaipur.com — dispatched 03 Sep 2026, 18:16 IST via Brevo &lt;202609031246.78700348457@smtp-relay.mailin.fr&gt; — Status SENT / ACCEPTED_BY_RELAY — Attachment GARUDA_Niravi_Jaipur_Executive_Proposal.pdf — SHA 4d5c46a35c80d859738f3262dcd2b70e7eacccfedb23a09d5787382ae24a3ddd.</p>
      <p><a href="/founder/acquisition">Open Founder Acquisition Cockpit →</a></p>
    `
  },
  {
    path: "/login",
    filePaths: [
      path.join(DIST_DIR, "login", "index.html"),
      path.join(DIST_DIR, "login.html")
    ],
    title: "GARUDA Client Login | Portal Access",
    description: "Secure client login portal for GARUDA projects.",
    canonical: "https://www.garudaos.in/login",
    robots: "noindex, nofollow"
  },
  {
    path: "/signup",
    filePaths: [
      path.join(DIST_DIR, "signup", "index.html"),
      path.join(DIST_DIR, "signup.html")
    ],
    title: "GARUDA Client Signup | Get Started",
    description: "Create your client portal account for GARUDA projects.",
    canonical: "https://www.garudaos.in/signup",
    robots: "noindex, nofollow"
  },
  {
    path: "/app",
    filePaths: [
      path.join(DIST_DIR, "app", "index.html"),
      path.join(DIST_DIR, "app.html")
    ],
    title: "GARUDA Customer Dashboard | Project Execution",
    description: "Client project governance and milestone portal.",
    canonical: "https://www.garudaos.in/app",
    robots: "noindex, nofollow"
  },
  {
    path: "/scholar",
    filePaths: [
      path.join(DIST_DIR, "scholar", "index.html"),
      path.join(DIST_DIR, "scholar.html"),
      path.join(DIST_DIR, "vidya", "index.html"),
      path.join(DIST_DIR, "vidya.html"),
      path.join(DIST_DIR, "research", "index.html"),
      path.join(DIST_DIR, "research.html")
    ],
    title: "GARUDA Vidya Studio (विद्या) | Autonomous Academic Intelligence & Scholar Copilot",
    description: "Free, unrestricted academic research synthesis, literature reviews, thesis structuring, step-by-step derivations, coding studio, and verified plagiarism integrity checks.",
    canonical: "https://www.garudaos.in/scholar",
    h1: "GARUDA Vidya Studio — The Autonomous Academic Powerhouse",
    eyebrow: "ACADEMIC INTELLIGENCE & RESEARCH STUDIO",
    contentSnippet: `
      <h2>Autonomous Academic Synthesis, Code Studio & Originality Engine</h2>
      <p>GARUDA Vidya Studio empowers school and college students, teachers, university scholars, scientists, and software engineers with deep 8,192-token research papers, thesis synthesis, mathematical derivations, and verified Turnitin-safe integrity audits.</p>
      <ul>
        <li>Peer-Review Ready Academic Research Papers & Citations (APA / IEEE / Nature)</li>
        <li>Production-Grade Code Generation, Algorithms & Debugging</li>
        <li>Step-by-Step Mathematical, Physics & Chemistry Derivations</li>
        <li>Multimodal Voice Dictation & PDF / Document Parsing</li>
        <li>Authentic Plagiarism & Academic Originality Verification (0% Fake Commitment)</li>
      </ul>
    `,
    schema: {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "GARUDA Vidya Studio",
      "applicationCategory": "EducationalApplication",
      "operatingSystem": "All",
      "url": "https://www.garudaos.in/scholar",
      "description": "Autonomous Academic Intelligence & Research Synthesis Studio"
    }
  },
  {
    path: "/creative",
    filePaths: [
      path.join(DIST_DIR, "creative", "index.html"),
      path.join(DIST_DIR, "creative.html"),
      path.join(DIST_DIR, "studio", "index.html"),
      path.join(DIST_DIR, "studio.html"),
      path.join(DIST_DIR, "agency", "index.html"),
      path.join(DIST_DIR, "agency.html"),
      path.join(DIST_DIR, "creator", "index.html"),
      path.join(DIST_DIR, "creator.html")
    ],
    title: "GARUDA Creative Universe (U19) | Multimodal Creative OS & One-Tap Composer",
    description: "Multimodal creative operating system featuring One-Tap Music Composer, Cinematic Film Storyboard Engine, and character consistency architecture.",
    canonical: "https://www.garudaos.in/creative",
    h1: "GARUDA Creative Universe OS — One-Tap Music, Film & Visual Engine",
    eyebrow: "MULTIMODAL CREATIVE OPERATING SYSTEM",
    contentSnippet: `
      <h2>One-Tap Composer, Cinematic Storyboard Engine & Character Consistency</h2>
      <p>GARUDA Creative Universe provides complete multimodal creation: humming to master music composition, multi-track stems, cinematic script breakdown, and visual storyboards with 1-click white PDF export.</p>
    `
  },
  {
    path: "/content",
    filePaths: [
      path.join(DIST_DIR, "content", "index.html"),
      path.join(DIST_DIR, "content.html")
    ],
    title: "GARUDA Content Universe (U20) | High-Velocity Content Factory",
    description: "Autonomous content factory for 4-week editorial calendars, high-converting copy hooks, and omnichannel repurposing.",
    canonical: "https://www.garudaos.in/content",
    h1: "GARUDA Content Factory — 4-Week Editorial Schedules & Copy Hooks",
    eyebrow: "CONTENT UNIVERSE (U20)",
    contentSnippet: `
      <h2>High-Velocity Editorial Planning & Multi-Platform Copywriting</h2>
      <p>Autonomous generation of 4-week thought leadership calendars, Reels & Shorts scripts, and direct response ad copy hooks.</p>
    `
  },
  {
    path: "/brand",
    filePaths: [
      path.join(DIST_DIR, "brand", "index.html"),
      path.join(DIST_DIR, "brand.html")
    ],
    title: "GARUDA Brand Universe (U21) | Sovereign IdentityLock™ Studio",
    description: "Brand identity architecture, typography systems, color governance, and sovereign voice discipline.",
    canonical: "https://www.garudaos.in/brand",
    h1: "Sovereign IdentityLock™ Brand Studio — Voice & Visual Governance",
    eyebrow: "BRAND UNIVERSE (U21)",
    contentSnippet: `
      <h2>IdentityLock™ Brand Governance & Typography Architecture</h2>
      <p>Enforce consistent brand voice rules, color palettes, and executive presentation formatting across all digital touchpoints.</p>
    `
  },
  {
    path: "/digital-presence",
    filePaths: [
      path.join(DIST_DIR, "digital-presence", "index.html"),
      path.join(DIST_DIR, "digital-presence.html")
    ],
    title: "GARUDA Digital Presence Universe (U22) | Living Web & SEO Engine",
    description: "High-converting landing page blueprints, SEO topic clusters, and service portfolio architectures.",
    canonical: "https://www.garudaos.in/digital-presence",
    h1: "Digital Presence & Landing Engine — Search Dominance Clusters",
    eyebrow: "DIGITAL PRESENCE UNIVERSE (U22)",
    contentSnippet: `
      <h2>High-Converting Landing Pages & SEO Topic Clusters</h2>
      <p>Living web surfaces, conversion-optimized service landing wireframes, and high-intent organic search dominance clusters.</p>
    `
  },
  {
    path: "/entertainment",
    filePaths: [
      path.join(DIST_DIR, "entertainment", "index.html"),
      path.join(DIST_DIR, "entertainment.html")
    ],
    title: "GARUDA Entertainment Universe (U23) | Event Experience War Room",
    description: "Interactive media architectures, celebrity hype orchestration, and 13-day live event war rooms.",
    canonical: "https://www.garudaos.in/entertainment",
    h1: "Entertainment & Event Experience Studio — 13-Day Campaign War Rooms",
    eyebrow: "ENTERTAINMENT UNIVERSE (U23)",
    contentSnippet: `
      <h2>Live Event Campaign War Rooms & Celebrity Hype Blueprints</h2>
      <p>Interactive spectacle orchestration, VIP guest line management, and corporate sponsor pitch frameworks.</p>
    `
  },
  {
    path: "/founder/access",
    filePaths: [
      path.join(DIST_DIR, "founder", "access", "index.html"),
      path.join(DIST_DIR, "founder", "access.html"),
      path.join(DIST_DIR, "kingdom", "index.html"),
      path.join(DIST_DIR, "kingdom.html")
    ],
    title: "Founder Kingdom Access | GARUDA 27 Universes Sovereign Map",
    description: "Sovereign central control surface for Founder Praveen Mahawar across all 27 Canonical Universes, client workspaces, and system tools.",
    canonical: "https://www.garudaos.in/founder/access",
    robots: "noindex, nofollow"
  },
  {
    path: "/kudos",
    filePaths: [
      path.join(DIST_DIR, "kudos", "index.html"),
      path.join(DIST_DIR, "kudos.html"),
      path.join(DIST_DIR, "pitch", "kudos", "index.html"),
      path.join(DIST_DIR, "pitch", "kudos.html")
    ],
    title: "Kudos Face of India 2026 | 360° Digital Omnipresence Blueprint",
    description: "13-day celebrity mega event digital marketing war room for Kudos Entertainment, Kajal Sharma, and Celina Jaitly at Radisson Blu Dwarka.",
    canonical: "https://www.garudaos.in/kudos",
    robots: "noindex, nofollow"
  },
  {
    path: "/proposal",
    filePaths: [
      path.join(DIST_DIR, "proposal", "index.html"),
      path.join(DIST_DIR, "proposal.html"),
      path.join(DIST_DIR, "proposal", "prop_kudos_2026", "index.html"),
      path.join(DIST_DIR, "proposal", "prop_kudos_2026.html")
    ],
    title: "Commercial Proposal & Milestone Agreement | GARUDA OS",
    description: "Cryptographically locked commercial proposal, deliverable schedule, and milestone escrow checkout.",
    canonical: "https://www.garudaos.in/proposal",
    robots: "noindex, nofollow"
  },
  {
    path: "/bot-verse",
    filePaths: [
      path.join(DIST_DIR, "bot-verse", "index.html"),
      path.join(DIST_DIR, "bot-verse.html"),
      path.join(DIST_DIR, "founder", "bot-verse", "index.html"),
      path.join(DIST_DIR, "founder", "bot-verse.html")
    ],
    title: "GARUDA BOT-VERSE | Omni-Channel Video SEO & Algorithmic Growth Engine",
    description: "Autonomous 6-Platform Growth Engine for YouTube, Instagram Reels, Facebook, LinkedIn, Google Search Video Highlights, and WhatsApp Funnels.",
    canonical: "https://www.garudaos.in/bot-verse",
    h1: "GARUDA BOT-VERSE • Omni-Channel Video Intelligence",
    eyebrow: "DIGITAL MARKETING UNIVERSE (U20 & U22)",
    contentSnippet: `
      <h2>6-Platform Omni-Channel Video & Content Distribution Engine</h2>
      <p>YouTube High-CTR SEO, Instagram Reels Feeder, Facebook Native Video Syndication, LinkedIn 5-Slide PDF Carousels, and Google Search VideoObject structured schema.</p>
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

  // 4. Robots Meta Tag (for private routes)
  if (route.robots) {
    const robotsTag = `<meta name="robots" content="${route.robots}" />`;
    if (/<meta\s+name=["']robots["'][\s\S]*?>/i.test(output)) {
      output = output.replace(/<meta\s+name=["']robots["'][\s\S]*?>/i, robotsTag);
    } else {
      output = output.replace(/<\/head>/i, `  ${robotsTag}\n</head>`);
    }
  }

  // 5. OpenGraph and Twitter Meta Tags
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

  // 6. Inject Structured Data (Schema.org JSON-LD)
  if (route.schema) {
    const schemaScript = `<script type="application/ld+json">\n${JSON.stringify(route.schema, null, 2)}\n</script>`;
    output = output.replace(/<\/head>/i, `  ${schemaScript}\n</head>`);
  }

  // 7. Inject Semantic, Crawler-Visible Fallback Content inside #root (Public SEO pages only)
  // Security Law: Private/noindex routes NEVER have static data or metrics injected.
  if (!route.robots || !route.robots.includes("noindex")) {
    const fallbackHtml = `
      <div id="seo-fallback" style="padding: 2rem; max-width: 900px; margin: 0 auto; font-family: sans-serif; line-height: 1.6; color: #111;">
        ${route.eyebrow ? `<p style="font-size: 0.85rem; font-weight: bold; color: #b8860b; text-transform: uppercase; letter-spacing: 0.1em;">${route.eyebrow}</p>` : ""}
        <h1 style="font-size: 2.2rem; margin-top: 0.5rem; margin-bottom: 1rem;">${route.h1 || route.title}</h1>
        <p style="font-size: 1.1rem; color: #444;">${route.description}</p>
        ${route.contentSnippet || ""}
        <p style="margin-top: 2rem; font-size: 0.85rem; color: #888;">© 2026 GARUDA Operating System. Official Entity Domain: https://www.garudaos.in</p>
      </div>
    `;
    output = output.replace(/<div id="root"><\/div>/i, `<div id="root">${fallbackHtml}</div>`);
  }

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
