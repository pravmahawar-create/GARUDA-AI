import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import SEOHead from "../components/SEOHead";
import ProjectScopeForm from "../components/ProjectScopeForm";
import WhatsAppQuickCTA from "../components/WhatsAppQuickCTA";
import { trackEvent } from "../utils/telemetry";

export const SERVICES_DATA = {
  "custom-ai-development": {
    slug: "custom-ai-development",
    title: "Custom AI Development & Machine Learning Architecture",
    seoTitle: "Custom AI Development Company | Tailored AI Solutions | GARUDA",
    seoDescription: "Enterprise custom AI development, domain-grounded generative AI pipelines, and bespoke LLM integrations engineered with deterministic QA manifests.",
    tagline: "Deterministic AI Systems, Bespoke Model Integrations & Governed Operations",
    keyword: "custom ai development",
    category: "AI & Machine Learning",
    baseINR: 45000,
    baseUSD: 550,
    whoIsItFor: "Businesses, startups, and mid-market companies needing proprietary AI logic, domain-grounded intelligence, and customized automated tool-calling workflows.",
    problem: "Generic off-the-shelf AI models hallucinate, lack business context, and fail in multi-step production workflows. Businesses require custom-grounded architectures with deterministic verification.",
    solution: "GARUDA engineers bespoke AI operating pipelines: custom tool-calling agents, retrieval-augmented generation (RAG) vector stores, structured data extractors, and automated verification suites governed by cryptographic delivery manifests.",
    features: [
      "Deterministic Multi-Agent Task Orchestration with retry governance",
      "Domain-specific fine-tuning and retrieval-augmented generation (RAG)",
      "Custom tool-calling integrations with CRM, ERP, and internal databases",
      "Cryptographic SHA-256 QA release manifests for full delivery auditability"
    ],
    milestones: [
      { name: "Milestone 1: Architecture & Advance Kickoff", share: "50%", desc: "Vector indexing, data schema design, and core agent orchestration build." },
      { name: "Milestone 2: Final Verification & Deployment", share: "50%", desc: "100% passing QA test suite run, cloud deployment, and client sign-off." }
    ],
    timeline: "1-2 weeks",
    faqs: [
      {
        q: "What is included in GARUDA's custom AI development service?",
        a: "We engineer complete, production-ready AI pipelines tailored to your business: proprietary prompt architectures, vector embedding indices, secure database connectors, automated verification suites, and full source code ownership."
      },
      {
        q: "How does GARUDA prevent AI hallucinations?",
        a: "We use deterministic citation grounding, strict schema validation, and retrieval-augmented generation (RAG) that restricts the AI model to verified company data sources only."
      },
      {
        q: "Do I own the full intellectual property and source code?",
        a: "Yes. 100% of all developed code, model configurations, prompts, and database schemas are transferred to you upon completion with no vendor lock-in."
      }
    ],
    related: ["ai-agent-development", "rag-development", "custom-software-development"]
  },

  "ai-agent-development": {
    slug: "ai-agent-development",
    title: "Autonomous AI Agent Development & Multi-Agent Systems",
    seoTitle: "AI Agent Development Company | Multi-Agent Systems | GARUDA",
    seoDescription: "Build autonomous multi-agent AI systems, supervisor-worker agent graphs, and self-verifying AI workers that execute complex business operations.",
    tagline: "Autonomous Supervisor-Worker Agent Graphs That Execute Real Work",
    keyword: "ai agent development",
    category: "Agentic AI",
    baseINR: 48000,
    baseUSD: 580,
    whoIsItFor: "Founders, CTOs, and operations leaders who need autonomous AI agents to research, qualify leads, draft proposals, parse documents, and execute multi-step business tasks.",
    problem: "Single-prompt chatbots cannot execute multi-step operational tasks. When a step fails, they give up or fabricate hallucinated answers without human governance.",
    solution: "GARUDA engineers multi-agent graphs with strict supervisor-worker hierarchies. Agents plan tasks, invoke specialized subagents, verify output validity against deterministic rules, and notify human operators when approval is required.",
    features: [
      "Supervisor-Worker Multi-Agent Orchestration graphs",
      "Dynamic tool-calling (APIs, web search, database querying, email dispatch)",
      "Automated state machine tracking with rollback on errors",
      "Human-in-the-loop approval gates for financial and outreach actions"
    ],
    milestones: [
      { name: "Milestone 1: Agent Architecture & Tool Graph", share: "50%", desc: "Define agent state transitions, tool permissions, and supervisor logic." },
      { name: "Milestone 2: Autonomous Execution & QA Validation", share: "50%", desc: "Stress-testing agent tasks, error handling verification, and live deployment." }
    ],
    timeline: "1-2 weeks",
    faqs: [
      {
        q: "What is the difference between an AI chatbot and an AI agent?",
        a: "A chatbot only responds to text messages in conversational turns. An AI agent is equipped with tools, memory, and state awareness to proactively execute multi-step tasks across external APIs, databases, and software systems."
      },
      {
        q: "Can AI agents be controlled to prevent unintended actions?",
        a: "Yes. GARUDA embeds strict deterministic governance gates where high-stakes actions (such as financial transactions or outbound emails) require explicit human approval before execution."
      },
      {
        q: "Which AI models power GARUDA's autonomous agents?",
        a: "We architect multi-model systems using Claude 3.5 Sonnet, OpenAI GPT-4o, Google Gemini 2.0 Flash/Pro, or local open-source models depending on latency, cost, and compliance requirements."
      }
    ],
    related: ["custom-ai-development", "business-automation", "rag-development"]
  },

  "custom-software-development": {
    slug: "custom-software-development",
    title: "Full-Stack Custom Software & Enterprise Engineering",
    seoTitle: "Custom Software Development Company | Enterprise Web Apps | GARUDA",
    seoDescription: "High-performance custom software engineering, scalable cloud backends, and responsive web applications built with React, Node.js, and PostgreSQL.",
    tagline: "Scalable Enterprise Software Engineered with Clean Architecture",
    keyword: "custom software development",
    category: "Full Stack Engineering",
    baseINR: 50000,
    baseUSD: 600,
    whoIsItFor: "Established companies, growing businesses, and enterprises that have outgrown off-the-shelf software and need tailored digital infrastructure.",
    problem: "Commercial off-the-shelf software forces businesses to change their proven workflows, charges expensive per-seat subscriptions, and locks data into proprietary silos.",
    solution: "GARUDA builds bespoke full-stack software tailored to your exact operational workflows: modern responsive interfaces, scalable microservices, relational and document databases, and complete data ownership.",
    features: [
      "Modern React / Next.js / TypeScript frontend interfaces",
      "Scalable Node.js / Python REST & GraphQL microservices",
      "PostgreSQL / MongoDB database architecture with automated migrations",
      "Comprehensive automated regression test coverage (100% pass guarantee)"
    ],
    milestones: [
      { name: "Milestone 1: Core Architecture & Backend Foundation", share: "50%", desc: "Database modeling, authentication, API endpoints, and core UI layout." },
      { name: "Milestone 2: Feature Completion, QA & Deployment", share: "50%", desc: "Full feature implementation, end-to-end regression tests, and cloud rollout." }
    ],
    timeline: "2-3 weeks",
    faqs: [
      {
        q: "How long does custom software development take?",
        a: "Core business applications typically take 2 to 3 weeks for an initial production release. We deliver in transparent milestones so you see functional progress every few days."
      },
      {
        q: "What tech stack does GARUDA use for custom software?",
        a: "We use modern, battle-tested technologies: React, Next.js, Node.js, Express, Python/FastAPI, PostgreSQL, MongoDB, Redis, Docker, and AWS/Vercel/Render cloud infrastructure."
      },
      {
        q: "Do you provide post-launch support and warranty?",
        a: "Yes. Every custom software project includes post-launch deployment support, automated test suites, documentation, and a bug-fix warranty period."
      }
    ],
    related: ["saas-mvp-development", "website-development", "custom-ai-development"]
  },

  "website-development": {
    slug: "website-development",
    title: "High-Converting Custom Website Development",
    seoTitle: "Custom Website Development Company | High-Converting Web Design | GARUDA",
    seoDescription: "Custom-engineered modern business websites with sub-second page speeds, dynamic lead capture forms, technical SEO, and conversion-focused design.",
    tagline: "Blazing-Fast, High-Converting Business & SaaS Websites That Drive Revenue",
    keyword: "custom website development",
    category: "Web Engineering",
    baseINR: 30000,
    baseUSD: 360,
    whoIsItFor: "Companies, professional service firms, and technology startups needing a modern, authoritative online presence that turns search visitors into paying clients.",
    problem: "Bloated template websites (like heavy WordPress themes) take 5+ seconds to load, look generic, suffer from poor mobile responsiveness, and fail to generate inbound leads.",
    solution: "GARUDA engineers high-performance custom websites using modern React/Vite/Next.js stacks with 95+ Google PageSpeed scores, pre-rendered static HTML for crawler discoverability, and embedded lead capture forms.",
    features: [
      "Sub-second load times with static HTML pre-rendering & CDN edge caching",
      "Automated lead capture intake with instant email/Telegram alerts",
      "Full Technical SEO architecture (Schema.org JSON-LD, OpenGraph, Canonical URLs)",
      "100% responsive, mobile-first design with fluid interactions"
    ],
    milestones: [
      { name: "Milestone 1: Design Architecture & Core Pages", share: "50%", desc: "Page wireframes, copywriting alignment, and component build." },
      { name: "Milestone 2: SEO Prerender, Lead Intake & Launch", share: "50%", desc: "Form validation, telemetry integration, search console setup, and production deploy." }
    ],
    timeline: "4-7 business days",
    faqs: [
      {
        q: "Why choose custom website development over WordPress or Wix?",
        a: "Custom-engineered websites load 3x faster, have zero security vulnerabilities from unmaintained plugins, achieve significantly higher Google SEO ranking scores, and feature custom interactive workflows."
      },
      {
        q: "Will my website be optimized for Google Search out of the box?",
        a: "Yes. Every GARUDA website includes structured schema markup, static pre-rendering for search crawlers, semantic headings, OpenGraph preview tags, and XML sitemaps."
      },
      {
        q: "Can I easily update content after launch?",
        a: "Yes. We configure clean modular data files or headless CMS integrations so non-technical team members can update text, pricing, and case studies effortlessly."
      }
    ],
    related: ["custom-software-development", "saas-mvp-development", "custom-ai-development"]
  },

  "saas-mvp-development": {
    slug: "saas-mvp-development",
    title: "Rapid Startup SaaS MVP Development",
    seoTitle: "SaaS MVP Development Company | Build Startup Software | GARUDA",
    seoDescription: "Turn your product idea into a production-ready SaaS MVP in 2-3 weeks with authentication, Stripe/Razorpay subscriptions, database models, and automated QA.",
    tagline: "From Product Concept to Paying SaaS Customers in 2-3 Weeks",
    keyword: "saas mvp development",
    category: "Startup Engineering",
    baseINR: 50000,
    baseUSD: 600,
    whoIsItFor: "Founders, domain experts, and early-stage startups who need to build and launch a scalable software product to validate demand and acquire paying users.",
    problem: "Traditional software agencies charge $30k-$80k and take 6 months to deliver an MVP, burning through runway before the startup can validate product-market fit.",
    solution: "GARUDA builds production-grade SaaS MVPs in 2 to 3 weeks using modular microservices: clean React dashboard, secure authentication, Stripe/Razorpay billing, database schema, and automated test coverage.",
    features: [
      "Production-ready User Authentication & Role-Based Access Control (RBAC)",
      "Automated Stripe & Razorpay global recurring subscription billing",
      "Scalable database architecture with automated migration scripts",
      "Interactive analytics & customer management dashboard"
    ],
    milestones: [
      { name: "Milestone 1: Core Foundation & Advance Kickoff", share: "50%", desc: "Database schemas, authentication engine, and UI dashboard architecture." },
      { name: "Milestone 2: Payment Gateway, QA & Production Release", share: "50%", desc: "Subscription billing, integration test passes, production deployment, and client sign-off." }
    ],
    timeline: "2-3 weeks",
    faqs: [
      {
        q: "What is included in a SaaS MVP build?",
        a: "Everything required to launch commercially: User authentication, customer dashboard, payment billing (Stripe/Razorpay), database models, email transaction alerts, API backend, and production cloud hosting."
      },
      {
        q: "Can the MVP scale as our user base grows?",
        a: "Yes. We avoid no-code lock-in and build on standard enterprise stacks (React, Node.js, PostgreSQL/MongoDB) allowing seamless scaling from your first 10 users to 100,000+ without rewriting."
      },
      {
        q: "How much does a SaaS MVP typically cost with GARUDA?",
        a: "Benchmark MVP projects start at ₹50,000 INR (~$600 USD) on a transparent 50% milestone schedule. Final pricing depends on specific custom features and third-party API integrations."
      }
    ],
    related: ["custom-software-development", "custom-ai-development", "website-development"]
  },

  "business-automation": {
    slug: "business-automation",
    title: "Enterprise Business Process & Workflow AI Automation",
    seoTitle: "Business Process Automation Services | Workflow AI | GARUDA",
    seoDescription: "Autonomous business workflow automation connecting CRMs, payment gateways, document pipelines, and enterprise data with zero loss.",
    tagline: "Automate Repetitive Lead Capture, Invoicing & Operational Pipelines",
    keyword: "business automation",
    category: "Operations & Automation",
    baseINR: 25000,
    baseUSD: 300,
    whoIsItFor: "Operations managers, agency owners, and growing companies overwhelmed by manual data entry, disconnected SaaS apps, and slow manual follow-ups.",
    problem: "Manual copying of leads, invoice preparation, document filing, and cross-platform notifications waste hundreds of human hours every month and cause costly data errors.",
    solution: "GARUDA builds governed event-driven automation workers that link your inbound leads, accounting software, messaging channels, and internal systems with zero data leakage.",
    features: [
      "Automated Multi-Source Lead Ingestion & Prospect Qualification",
      "Document & Invoice Parsing with automated accounting sync",
      "Bi-directional webhook integrations across CRM, Slack, WhatsApp, and email",
      "Low-risk ₹25,000 tier with rapid 3-7 day production turnaround"
    ],
    milestones: [
      { name: "Milestone 1: Workflow Setup & Advance Kickoff", share: "50%", desc: "Webhook ingestion, data mapping, and event worker configuration." },
      { name: "Milestone 2: Live Verification & Delivery", share: "50%", desc: "End-to-end integration tests, error alerting verification, and client sign-off." }
    ],
    timeline: "3-7 business days",
    faqs: [
      {
        q: "What types of business processes can be automated?",
        a: "Lead capture & CRM routing, customer onboarding, invoice generation & payment matching, document data extraction (PDFs, receipts), automated notifications, and multi-app sync."
      },
      {
        q: "How do you handle API failures or rate limits?",
        a: "We implement idempotent event queues with exponential retry backoff, durable database logging, and instant notification alerts so no lead or transaction is ever dropped."
      },
      {
        q: "Do we need to replace our current software tools?",
        a: "No. Our automation workers connect directly to your existing software tools (HubSpot, Salesforce, Google Workspace, Slack, Stripe, QuickBooks, WhatsApp) via secure APIs."
      }
    ],
    related: ["whatsapp-telegram-ai-bots", "ai-agent-development", "custom-software-development"]
  },

  "rag-development": {
    slug: "rag-development",
    title: "Enterprise Retrieval-Augmented Generation (RAG) & Knowledge AI",
    seoTitle: "Enterprise RAG Development Services | AI Knowledge Bases | GARUDA",
    seoDescription: "Build custom enterprise RAG pipelines, dense-sparse vector search, and document AI extraction with strict citation grounding and 0% hallucinations.",
    tagline: "Turn Complex Enterprise Documents into Instant, Grounded AI Intelligence",
    keyword: "rag development",
    category: "AI & Machine Learning",
    baseINR: 45000,
    baseUSD: 550,
    whoIsItFor: "Legal firms, healthcare companies, technical enterprises, and knowledge-heavy organizations needing accurate AI search across private documents.",
    problem: "Standard LLMs have cut-off dates and zero knowledge of your private files, contracts, or documentation. Feeding raw text exceeds context limits and causes dangerous hallucinations.",
    solution: "GARUDA architects enterprise-grade RAG systems using hybrid dense-sparse vector indexing, semantic re-ranking, document chunking, and strict citation grounding to deliver 100% fact-checked responses.",
    features: [
      "Hybrid Vector Search (dense embeddings + BM25 keyword matching)",
      "Multi-format document ingestion (PDF, DOCX, XLSX, Markdown, SQL)",
      "Semantic re-ranking with source page & paragraph citation metadata",
      "Strict zero-hallucination verification filters"
    ],
    milestones: [
      { name: "Milestone 1: Ingestion & Vector Indexing Architecture", share: "50%", desc: "Document parsing, chunking strategy, and vector database setup." },
      { name: "Milestone 2: Re-Ranking, Precision Evaluation & Deployment", share: "50%", desc: "Retrieval accuracy benchmark testing, UI interface, and production launch." }
    ],
    timeline: "1-2 weeks",
    faqs: [
      {
        q: "How does enterprise RAG protect data privacy?",
        a: "Your private documents are stored in dedicated vector databases. We can configure RAG pipelines using private cloud instances or on-premise local models to ensure no data is sent to public AI training pools."
      },
      {
        q: "What document formats are supported?",
        a: "Our pipelines support PDF, Word (DOCX), Excel (XLSX), CSV, JSON, Markdown, PowerPoint, audio transcripts, and direct SQL database connections."
      },
      {
        q: "How accurate is the retrieval process?",
        a: "We implement hybrid search (dense vectors + sparse keyword indexing) coupled with cross-encoder re-ranking, achieving >95% precision with exact page-level source citations."
      }
    ],
    related: ["custom-ai-development", "ai-agent-development", "custom-software-development"]
  },

  "whatsapp-telegram-ai-bots": {
    slug: "whatsapp-telegram-ai-bots",
    title: "Custom WhatsApp & Telegram AI Commercial Bots",
    seoTitle: "WhatsApp & Telegram AI Commercial Bots | Customer Automation | GARUDA",
    seoDescription: "Custom WhatsApp and Telegram AI commercial bots with multi-turn sales scoping, automated lead qualification, and instant payment checkout.",
    tagline: "24/7 Automated Customer Support, Scoping & Payment Checkout Bots",
    keyword: "custom whatsapp bot",
    category: "Conversational AI",
    baseINR: 20000,
    baseUSD: 250,
    whoIsItFor: "E-commerce brands, B2B service providers, and local business owners needing automated 24/7 customer support, instant qualification, and payment link generation.",
    problem: "Missed customer messages and delayed quotes lose high-intent buyers. Static FAQ bots frustrate users with robotic, unhelpful answers.",
    solution: "GARUDA deploys senior solution architect bots that converse naturally, understand custom product requirements, formulate instant price quotes, and generate payment checkout links.",
    features: [
      "Natural language understanding and progressive requirement scoping",
      "Direct Razorpay/Stripe checkout links and instant receipt dispatch",
      "Anti-spam rate limiting and secure HMAC webhook verification",
      "Founder alert relay for high-value qualified leads"
    ],
    milestones: [
      { name: "Milestone 1: Bot Setup & Advance Kickoff", share: "50%", desc: "Intent catalog, knowledge base grounding, and conversational flow configuration." },
      { name: "Milestone 2: Gateway Integration & Delivery", share: "50%", desc: "Payment link triggers, stress testing, live webhook binding, and client sign-off." }
    ],
    timeline: "3-5 business days",
    faqs: [
      {
        q: "Can the WhatsApp bot take payments directly?",
        a: "Yes. The bot can generate secure Razorpay or Stripe checkout links during conversation and confirm order fulfillment once the webhook receives verified payment."
      },
      {
        q: "Do I need official WhatsApp Business API approval?",
        a: "Yes, we handle the technical setup with official WhatsApp Business Cloud API providers (Meta direct or Twilio/Gupshup) to ensure 100% deliverability without ban risks."
      },
      {
        q: "Can a human agent take over the conversation?",
        a: "Yes. We include seamless live agent handoff protocols that alert your support team when complex inquiries or high-value deals require human interaction."
      }
    ],
    related: ["business-automation", "custom-ai-development", "website-development"]
  }
};

// Aliases for backwards compatibility and high-intent keyword variations
SERVICES_DATA["custom-software-saas-mvp"] = SERVICES_DATA["saas-mvp-development"];
SERVICES_DATA["business-workflow-ai-automation"] = SERVICES_DATA["business-automation"];

const CURRENCY_CONVERSIONS = {
  INR: { symbol: "₹", rate: 1 },
  USD: { symbol: "$", rate: 0.012 },
  EUR: { symbol: "€", rate: 0.011 },
  GBP: { symbol: "£", rate: 0.0095 },
  AED: { symbol: "AED ", rate: 0.044 },
  CAD: { symbol: "CA$", rate: 0.016 },
  AUD: { symbol: "AU$", rate: 0.018 },
  SGD: { symbol: "SG$", rate: 0.016 }
};

export default function ServiceLanding() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [selectedCurrency, setSelectedCurrency] = useState("INR");
  const [openFaq, setOpenFaq] = useState(null);

  const service = SERVICES_DATA[slug] || SERVICES_DATA["custom-ai-development"];

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [service]);

  const conv = CURRENCY_CONVERSIONS[selectedCurrency] || CURRENCY_CONVERSIONS.INR;
  const formattedPrice = selectedCurrency === "INR"
    ? `₹${service.baseINR.toLocaleString("en-IN")}`
    : `${conv.symbol}${Math.round(service.baseINR * conv.rate).toLocaleString()}`;

  const depositPrice = selectedCurrency === "INR"
    ? `₹${Math.round(service.baseINR * 0.5).toLocaleString("en-IN")}`
    : `${conv.symbol}${Math.round(service.baseINR * conv.rate * 0.5).toLocaleString()}`;

  const serviceSchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Service",
        "@id": `https://www.garudaos.in/services/${service.slug}#service`,
        "name": service.title,
        "serviceType": service.title,
        "category": service.category,
        "description": `${service.tagline}. ${service.solution}`,
        "provider": {
          "@type": "Organization",
          "name": "GARUDA AI",
          "url": "https://www.garudaos.in",
          "logo": "https://www.garudaos.in/favicon-512x512.png"
        },
        "areaServed": "Worldwide",
        "offers": {
          "@type": "Offer",
          "price": service.baseUSD,
          "priceCurrency": "USD",
          "description": `Starts at $${service.baseUSD} USD / ₹${service.baseINR.toLocaleString("en-IN")} with 50% milestone advance kickoff terms.`
        }
      },
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": "https://www.garudaos.in"
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "Services",
            "item": "https://www.garudaos.in/#services"
          },
          {
            "@type": "ListItem",
            "position": 3,
            "name": service.title,
            "item": `https://www.garudaos.in/services/${service.slug}`
          }
        ]
      },
      {
        "@type": "FAQPage",
        "mainEntity": (service.faqs || []).map((f) => ({
          "@type": "Question",
          "name": f.q,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": f.a
          }
        }))
      }
    ]
  };

  return (
    <div style={{ background: "#05070a", color: "#f3f4f6", minHeight: "100vh", fontFamily: "sans-serif", display: "flex", flexDirection: "column" }}>
      <SEOHead
        title={service.seoTitle}
        description={service.seoDescription}
        canonical={`https://www.garudaos.in/services/${service.slug}`}
        structuredData={serviceSchema}
      />

      {/* Navigation Header */}
      <header style={{ borderBottom: "1px solid rgba(212,175,55,0.15)", padding: "1.2rem 2rem", display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(5,7,10,0.85)", backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <a href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontSize: "1.4rem", fontWeight: 900, background: "linear-gradient(135deg, #f5d76e 0%, #d4af37 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              GARUDA
            </span>
          </a>
          <span style={{ color: "#4b5563" }}>/</span>
          <span style={{ fontSize: "0.85rem", color: "#9ca3af", fontWeight: 600 }}>
            {service.category}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "1.2rem" }}>
          <select
            value={selectedCurrency}
            onChange={(e) => setSelectedCurrency(e.target.value)}
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)", color: "#d4af37", padding: "0.4rem 0.8rem", borderRadius: "6px", fontWeight: 700, cursor: "pointer" }}
          >
            {Object.keys(CURRENCY_CONVERSIONS).map((cur) => (
              <option key={cur} value={cur} style={{ background: "#111827", color: "#fff" }}>{cur}</option>
            ))}
          </select>
          <button
            onClick={() => navigate("/chat?topic=" + service.slug)}
            style={{ background: "linear-gradient(135deg, #f5d76e 0%, #b8860b 100%)", color: "#05070a", border: "none", padding: "0.55rem 1.2rem", borderRadius: "8px", fontWeight: 800, cursor: "pointer", fontSize: "0.88rem" }}
          >
            Discuss on Live Chat →
          </button>
        </div>
      </header>

      {/* Main Content Body */}
      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "3rem 1.5rem", flex: 1, width: "100%", boxSizing: "border-box" }}>
        {/* Hero Section */}
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <div style={{ display: "inline-block", background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.3)", color: "#d4af37", padding: "0.35rem 1rem", borderRadius: "20px", fontSize: "0.85rem", fontWeight: 700, marginBottom: "1rem" }}>
            ENGINEERED HIGH-INTENT EXECUTION
          </div>
          <h1 style={{ fontSize: "2.6rem", fontWeight: 900, lineHeight: 1.2, margin: "0 0 1rem 0", color: "#ffffff", letterSpacing: "-0.02em" }}>
            {service.title}
          </h1>
          <p style={{ fontSize: "1.2rem", color: "#9ca3af", maxWidth: 750, margin: "0 auto 2rem auto", lineHeight: 1.6 }}>
            {service.tagline}
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: "1.2rem", flexWrap: "wrap" }}>
            <button
              onClick={() => {
                trackEvent("primary_cta_click", { location: "service_hero", service: service.slug });
                document.getElementById("project-scope")?.scrollIntoView({ behavior: "smooth" });
              }}
              style={{ background: "linear-gradient(135deg, #f5d76e 0%, #b8860b 100%)", color: "#05070a", padding: "0.95rem 2.4rem", borderRadius: "999px", fontWeight: 800, fontSize: "1rem", border: "none", cursor: "pointer", boxShadow: "0 4px 20px rgba(245,215,110,0.3)" }}
            >
              Get Project Scope →
            </button>
            <button
              onClick={() => {
                trackEvent("secondary_cta_click", { location: "service_hero", service: service.slug });
                navigate("/chat?topic=" + service.slug);
              }}
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.15)", color: "#e5e7eb", padding: "0.95rem 2rem", borderRadius: "999px", fontWeight: 600, fontSize: "0.95rem", cursor: "pointer" }}
            >
              Talk to AI Architect →
            </button>
          </div>
        </div>

        {/* Who Is This For Card */}
        {service.whoIsItFor && (
          <div style={{ background: "rgba(212,175,55,0.05)", border: "1px solid rgba(212,175,55,0.2)", padding: "1.4rem 1.8rem", borderRadius: "14px", marginBottom: "2.5rem", display: "flex", alignItems: "center", gap: "1rem" }}>
            <span style={{ fontSize: "1.6rem" }}>🎯</span>
            <div>
              <strong style={{ color: "#d4af37", fontSize: "0.95rem", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: "0.2rem" }}>Who Is This For?</strong>
              <p style={{ margin: 0, color: "#d1d5db", fontSize: "0.95rem", lineHeight: 1.5 }}>{service.whoIsItFor}</p>
            </div>
          </div>
        )}

        {/* Problem & Solution Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem", marginBottom: "3rem" }}>
          <div style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", padding: "1.8rem", borderRadius: "14px" }}>
            <h3 style={{ color: "#f87171", margin: "0 0 0.8rem 0", fontSize: "1.1rem", fontWeight: 800 }}>
              ✕ The Industry Bottleneck
            </h3>
            <p style={{ color: "#d1d5db", lineHeight: 1.6, margin: 0, fontSize: "0.95rem" }}>
              {service.problem}
            </p>
          </div>

          <div style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.2)", padding: "1.8rem", borderRadius: "14px" }}>
            <h3 style={{ color: "#34d399", margin: "0 0 0.8rem 0", fontSize: "1.1rem", fontWeight: 800 }}>
              ✓ The GARUDA Solution
            </h3>
            <p style={{ color: "#d1d5db", lineHeight: 1.6, margin: 0, fontSize: "0.95rem" }}>
              {service.solution}
            </p>
          </div>
        </div>

        {/* Core Architecture & Features */}
        <div style={{ background: "rgba(17,24,39,0.5)", border: "1px solid rgba(255,255,255,0.08)", padding: "2.2rem", borderRadius: "16px", marginBottom: "3rem" }}>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 800, margin: "0 0 1.5rem 0", color: "#d4af37" }}>
            ◈ Engineered Deliverables & Capabilities
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
            {service.features.map((feat, idx) => (
              <div key={idx} style={{ display: "flex", alignItems: "flex-start", gap: "0.8rem", background: "rgba(255,255,255,0.03)", padding: "1rem", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.05)" }}>
                <span style={{ color: "#d4af37", fontWeight: 900 }}>•</span>
                <span style={{ color: "#e5e7eb", fontSize: "0.92rem", lineHeight: 1.5 }}>{feat}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Milestone Schedule & Indicative Pricing */}
        <div style={{ background: "linear-gradient(180deg, rgba(212,175,55,0.08) 0%, rgba(11,15,22,0.6) 100%)", border: "1px solid rgba(212,175,55,0.25)", padding: "2.2rem", borderRadius: "16px", marginBottom: "3rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", marginBottom: "1.5rem" }}>
            <div>
              <h2 style={{ fontSize: "1.5rem", fontWeight: 800, margin: "0 0 0.4rem 0", color: "#ffffff" }}>
                Transparent Milestone Structure
              </h2>
              <p style={{ color: "#9ca3af", margin: 0, fontSize: "0.9rem" }}>
                Estimated Delivery: <strong>{service.timeline}</strong> | Benchmark Tier: <strong style={{ color: "#d4af37" }}>{formattedPrice}</strong>
              </p>
            </div>
            <div style={{ background: "rgba(0,0,0,0.4)", padding: "0.8rem 1.2rem", borderRadius: "10px", border: "1px solid rgba(212,175,55,0.2)", textAlign: "right" }}>
              <div style={{ fontSize: "0.75rem", color: "#9ca3af", textTransform: "uppercase", fontWeight: 700 }}>50% Advance Kickoff</div>
              <div style={{ fontSize: "1.3rem", fontWeight: 900, color: "#d4af37" }}>{depositPrice}</div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1rem" }}>
            {service.milestones.map((m, idx) => (
              <div key={idx} style={{ background: "rgba(0,0,0,0.3)", padding: "1.2rem", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                  <span style={{ fontWeight: 800, color: "#fff", fontSize: "0.95rem" }}>{m.name}</span>
                  <span style={{ background: "rgba(212,175,55,0.15)", color: "#d4af37", padding: "0.2rem 0.5rem", borderRadius: "4px", fontSize: "0.75rem", fontWeight: 800 }}>{m.share}</span>
                </div>
                <p style={{ color: "#9ca3af", fontSize: "0.88rem", margin: 0, lineHeight: 1.5 }}>{m.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Buyer FAQ Section */}
        {service.faqs && service.faqs.length > 0 && (
          <section style={{ marginBottom: "3rem" }}>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 800, margin: "0 0 1.5rem 0", color: "#ffffff" }}>
              Frequently Asked Buyer Questions
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
              {service.faqs.map((faq, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div
                    key={idx}
                    style={{
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: "12px",
                      overflow: "hidden"
                    }}
                  >
                    <button
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      style={{
                        width: "100%",
                        padding: "1.1rem 1.4rem",
                        background: "none",
                        border: "none",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        textAlign: "left",
                        cursor: "pointer",
                        color: "#f3f4f6",
                        fontWeight: 700,
                        fontSize: "0.98rem"
                      }}
                    >
                      <span>{faq.q}</span>
                      <span style={{ color: "#d4af37", fontSize: "1.2rem", transform: isOpen ? "rotate(45deg)" : "none", transition: "transform 0.2s" }}>+</span>
                    </button>
                    {isOpen && (
                      <div style={{ padding: "0 1.4rem 1.2rem 1.4rem", color: "#9ca3af", fontSize: "0.92rem", lineHeight: 1.6, borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Dedicated Project Scope Lead Capture Form */}
        <section id="project-scope" style={{ marginBottom: "3rem" }}>
          <ProjectScopeForm
            defaultService={service.slug}
            title={`Get Fixed-Price Scope for ${service.title}`}
            subtitle="Submit your requirements to receive a formal architectural scope, technical milestone breakdown, and firm pricing quote."
          />
        </section>

        {/* Internal Cross-Linking to Related Services */}
        {service.related && service.related.length > 0 && (
          <section style={{ marginBottom: "2rem", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", padding: "1.5rem", borderRadius: "14px" }}>
            <h3 style={{ fontSize: "1rem", color: "#d4af37", margin: "0 0 1rem 0", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Explore Related Engineering Capabilities
            </h3>
            <div style={{ display: "flex", gap: "0.8rem", flexWrap: "wrap" }}>
              {service.related.map((relSlug) => {
                const rel = SERVICES_DATA[relSlug];
                if (!rel) return null;
                return (
                  <a
                    key={relSlug}
                    href={`/services/${relSlug}`}
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.12)",
                      padding: "0.55rem 1rem",
                      borderRadius: "8px",
                      color: "#e5e7eb",
                      textDecoration: "none",
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      transition: "background 0.2s"
                    }}
                  >
                    {rel.title} →
                  </a>
                );
              })}
            </div>
          </section>
        )}
      </main>

      {/* Crawlable Footer with Full Service Directory */}
      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.08)", padding: "2.5rem 1.5rem", background: "rgba(3,7,18,0.95)", color: "#9ca3af", fontSize: "0.85rem" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "2rem", marginBottom: "2rem", textAlign: "left" }}>
          <div>
            <h4 style={{ color: "#d4af37", margin: "0 0 0.8rem 0", fontSize: "0.95rem" }}>GARUDA AI</h4>
            <p style={{ margin: 0, lineHeight: 1.6 }}>Autonomous AI Operating System and commercial software engineering practice. Founded by Praveen Mahawar.</p>
          </div>
          <div>
            <h4 style={{ color: "#ffffff", margin: "0 0 0.8rem 0", fontSize: "0.9rem" }}>AI & Machine Learning</h4>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              <li><a href="/services/custom-ai-development" style={{ color: "#9ca3af", textDecoration: "none" }}>Custom AI Development</a></li>
              <li><a href="/services/ai-agent-development" style={{ color: "#9ca3af", textDecoration: "none" }}>AI Agent Development</a></li>
              <li><a href="/services/rag-development" style={{ color: "#9ca3af", textDecoration: "none" }}>Enterprise RAG Systems</a></li>
            </ul>
          </div>
          <div>
            <h4 style={{ color: "#ffffff", margin: "0 0 0.8rem 0", fontSize: "0.9rem" }}>Software & Startups</h4>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              <li><a href="/services/saas-mvp-development" style={{ color: "#9ca3af", textDecoration: "none" }}>SaaS MVP Development</a></li>
              <li><a href="/services/custom-software-development" style={{ color: "#9ca3af", textDecoration: "none" }}>Custom Software Development</a></li>
              <li><a href="/services/website-development" style={{ color: "#9ca3af", textDecoration: "none" }}>Custom Website Development</a></li>
            </ul>
          </div>
          <div>
            <h4 style={{ color: "#ffffff", margin: "0 0 0.8rem 0", fontSize: "0.9rem" }}>Automation & Bots</h4>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              <li><a href="/services/business-automation" style={{ color: "#9ca3af", textDecoration: "none" }}>Business Workflow Automation</a></li>
              <li><a href="/services/whatsapp-telegram-ai-bots" style={{ color: "#9ca3af", textDecoration: "none" }}>WhatsApp & Telegram Bots</a></li>
              <li><a href="/what-is-garuda-ai" style={{ color: "#9ca3af", textDecoration: "none" }}>What is GARUDA AI?</a></li>
              <li><a href="/chat" style={{ color: "#9ca3af", textDecoration: "none" }}>Talk to AI Architect</a></li>
            </ul>
          </div>
        </div>
        <div style={{ textAlign: "center", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "1.5rem" }}>
          © 2026 GARUDA Operating Systems Inc. All rights reserved. Built for deterministic, governed custom software and AI operations.
        </div>
      </footer>

      {/* Floating WhatsApp Quick CTA */}
      <WhatsAppQuickCTA />
    </div>
  );
}
