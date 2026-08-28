import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import SEOHead from "../components/SEOHead";

const SERVICES_DATA = {
  "custom-ai-development": {
    slug: "custom-ai-development",
    title: "Custom AI Development & Agentic Architecture",
    tagline: "Deterministic AI Agents, Multi-Turn RAG Pipelines & Governed Operations",
    keyword: "custom ai development",
    category: "AI & Machine Learning",
    baseINR: 45000,
    baseUSD: 550,
    problem: "Generic off-the-shelf AI models hallucinate, lack business context, and fail in multi-step workflows. Businesses require custom-grounded architectures with deterministic verification.",
    solution: "GARUDA engineers bespoke AI operating pipelines: custom tool-calling agents, retrieval-augmented generation (RAG) vector stores, and automated verification suites governed by cryptographic delivery manifests.",
    features: [
      "Deterministic Multi-Agent Task Orchestration with retry governance",
      "Retrieval-Augmented Generation (RAG) with vector similarity search",
      "Custom tool-calling integrations with CRM, ERP, and internal databases",
      "Cryptographic SHA-256 QA release manifests for full delivery auditability"
    ],
    milestones: [
      { name: "Milestone 1: Architecture & Advance Kickoff", share: "50%", desc: "Vector indexing, data schema design, and core agent orchestration build." },
      { name: "Milestone 2: Final Verification & Deployment", share: "50%", desc: "100% passing QA test suite run, cloud deployment, and client sign-off." }
    ],
    timeline: "1-2 weeks"
  },
  "custom-software-saas-mvp": {
    slug: "custom-software-saas-mvp",
    title: "Full-Stack Custom Software & Scalable SaaS Development",
    tagline: "From Concept to Production SaaS MVP with Payments, Auth & Database",
    keyword: "custom software development",
    category: "Full Stack Engineering",
    baseINR: 50000,
    baseUSD: 600,
    problem: "Building a SaaS with generic low-code tools leads to vendor lock-in, poor performance, and inflexible billing logic. You need a scalable, production-grade codebase you own completely.",
    solution: "GARUDA engineers high-performance web applications using React/Next.js frontend, scalable Node.js/Python microservices, Stripe/Razorpay billing, and robust PostgreSQL/MongoDB storage.",
    features: [
      "Modern React / Next.js responsive user interface",
      "Secure Role-Based Access Control (RBAC) & User Authentication",
      "Automated Stripe / Razorpay global subscription billing",
      "Scalable database architecture with automated migration scripts"
    ],
    milestones: [
      { name: "Milestone 1: Core Foundation & Advance Kickoff", share: "50%", desc: "Database schemas, authentication engine, and UI dashboard architecture." },
      { name: "Milestone 2: Production Release & Delivery", share: "50%", desc: "Payment gateways, integration test passes, production deployment, and client sign-off." }
    ],
    timeline: "2-3 weeks"
  },
  "business-workflow-ai-automation": {
    slug: "business-workflow-ai-automation",
    title: "Enterprise Business Workflow & Process Automation",
    tagline: "Automate Repetitive Lead Capture, Invoicing & Operational Pipelines",
    keyword: "ai automation",
    category: "Operations & Automation",
    baseINR: 25000,
    baseUSD: 300,
    problem: "Manual data entry, invoice copying, and multi-app communication slow down growth and produce expensive operational errors.",
    solution: "GARUDA builds governed event-driven automation workers that link your inbound leads, accounting software, messaging channels, and internal systems with zero data leakage.",
    features: [
      "Automated Multi-Source Lead Generation & Prospect Qualification",
      "Document & Invoice Parsing with automated accounting sync",
      "Bi-directional webhook integrations across CRM, Slack, and email",
      "Low-risk ₹25,000 tier with rapid 3-7 day production turnaround"
    ],
    milestones: [
      { name: "Milestone 1: Workflow Setup & Advance Kickoff", share: "50%", desc: "Webhook ingestion, data mapping, and event worker configuration." },
      { name: "Milestone 2: Live Verification & Delivery", share: "50%", desc: "End-to-end integration tests, error alerting verification, and client sign-off." }
    ],
    timeline: "3-7 business days"
  },
  "whatsapp-telegram-ai-bots": {
    slug: "whatsapp-telegram-ai-bots",
    title: "Custom WhatsApp & Telegram AI Commercial Bots",
    tagline: "24/7 Automated Customer Support, Scoping & Payment Checkout Bots",
    keyword: "custom whatsapp bot",
    category: "Conversational AI",
    baseINR: 20000,
    baseUSD: 250,
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
    timeline: "3-5 business days"
  }
};

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
          "logo": "https://www.garudaos.in/favicon/garuda-sigil-icon.svg"
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
            "name": "GARUDA AI",
            "item": "https://www.garudaos.in"
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "Services",
            "item": "https://www.garudaos.in/#capabilities"
          },
          {
            "@type": "ListItem",
            "position": 3,
            "name": service.title,
            "item": `https://www.garudaos.in/services/${service.slug}`
          }
        ]
      }
    ]
  };

  return (
    <div style={{ minHeight: "100vh", background: "#030712", color: "#f9fafb", fontFamily: "Inter, system-ui, sans-serif" }}>
      <SEOHead
        title={`${service.title} — GARUDA AI Operating System`}
        description={`${service.tagline}. Fixed-price milestone execution with automated verification test suites.`}
        canonical={`https://www.garudaos.in/services/${service.slug}`}
        schema={serviceSchema}
      />
      {/* Top Header */}
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1.2rem 2rem", borderBottom: "1px solid rgba(255,255,255,0.08)", background: "rgba(11,15,22,0.85)", backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.8rem", cursor: "pointer" }} onClick={() => navigate("/")}>
          <span style={{ fontSize: "1.4rem", fontWeight: 900, letterSpacing: "0.1em", color: "#fff" }}>GARUDA</span>
          <span style={{ fontSize: "0.75rem", background: "rgba(212,175,55,0.15)", color: "#d4af37", padding: "0.2rem 0.6rem", borderRadius: "4px", fontWeight: 700 }}>
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

      {/* Hero Section */}
      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "3rem 1.5rem" }}>
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <div style={{ display: "inline-block", background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.3)", color: "#d4af37", padding: "0.35rem 1rem", borderRadius: "20px", fontSize: "0.85rem", fontWeight: 700, marginBottom: "1rem" }}>
            PREMIUM CUSTOMIZED EXECUTION
          </div>
          <h1 style={{ fontSize: "2.6rem", fontWeight: 900, lineHeight: 1.2, margin: "0 0 1rem 0", color: "#ffffff", letterSpacing: "-0.02em" }}>
            {service.title}
          </h1>
          <p style={{ fontSize: "1.2rem", color: "#9ca3af", maxWidth: 750, margin: "0 auto 2rem auto", lineHeight: 1.6 }}>
            {service.tagline}
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: "1rem", flexWrap: "wrap" }}>
            <button
              onClick={() => navigate("/chat?topic=" + service.slug)}
              style={{ background: "linear-gradient(135deg, #f5d76e 0%, #b8860b 100%)", color: "#05070a", padding: "0.85rem 2rem", borderRadius: "10px", fontWeight: 800, fontSize: "1rem", border: "none", cursor: "pointer", boxShadow: "0 4px 20px rgba(245,215,110,0.3)" }}
            >
              ◈ Start Instant Project Scoping →
            </button>
            <button
              onClick={() => navigate("/")}
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.15)", color: "#e5e7eb", padding: "0.85rem 1.6rem", borderRadius: "10px", fontWeight: 600, fontSize: "0.95rem", cursor: "pointer" }}
            >
              Explore All Capabilities
            </button>
          </div>
        </div>

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
                Estimated Timeline: <strong>{service.timeline}</strong> | Benchmark Investment: <strong style={{ color: "#d4af37" }}>{formattedPrice}</strong>
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

        {/* Bottom CTA Card */}
        <div style={{ textAlign: "center", padding: "3rem 1.5rem", background: "rgba(17,24,39,0.7)", borderRadius: "16px", border: "1px solid rgba(212,175,55,0.2)" }}>
          <h2 style={{ fontSize: "1.8rem", fontWeight: 900, color: "#fff", margin: "0 0 1rem 0" }}>
            Ready to Build Your Solution?
          </h2>
          <p style={{ color: "#9ca3af", maxWidth: 600, margin: "0 auto 2rem auto", fontSize: "1rem" }}>
            Tell GARUDA what you need. Our Solution Architect will progressively understand your requirements, formulate an exact scope, and provide your formal proposal.
          </p>
          <button
            onClick={() => navigate("/chat?topic=" + service.slug)}
            style={{ background: "linear-gradient(135deg, #f5d76e 0%, #b8860b 100%)", color: "#05070a", padding: "1rem 2.5rem", borderRadius: "10px", fontWeight: 800, fontSize: "1.05rem", border: "none", cursor: "pointer", boxShadow: "0 6px 25px rgba(245,215,110,0.35)" }}
          >
            ◈ Talk to GARUDA Solution Architect Now →
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.08)", padding: "2rem", textAlign: "center", color: "#6b7280", fontSize: "0.85rem" }}>
        © 2026 GARUDA Operating Systems Inc. All rights reserved. Built for deterministic, governed custom software and AI operations.
      </footer>
    </div>
  );
}
