import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import BrandAssetImage from "../components/BrandAssetImage";
import SEOHead from "../components/SEOHead";

const palette = {
  bg: "#04070a",
  panel: "#0b0f16",
  panelSoft: "rgba(11, 15, 22, 0.75)",
  line: "rgba(245, 215, 110, 0.16)",
  text: "#f7f2dc",
  muted: "#8d95a7",
  gold: "#f5d76e",
  goldStrong: "#b8860b",
  green: "#75f4ab",
  blue: "#7dd3fc"
};

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-50px" },
  transition: { duration: 0.5, ease: "easeOut" }
};

const ARCHITECTURAL_PILLARS = [
  {
    title: "1. Mother Brain & Orchestration",
    badge: "CENTRAL GOVERNANCE",
    desc: "The central intelligence hub that maintains global system state, routes multi-modal directives across autonomous subsystems, and coordinates complex multi-agent handoffs."
  },
  {
    title: "2. Autonomous Execution Engines",
    badge: "27 INTEGRATED UNIVERSES",
    desc: "Specialized engines covering Lead Discovery, Commercial Qualification, Solution Scoping, Automated Builder Tasks, and Real-Time Telemetry."
  },
  {
    title: "3. Governed Truth & Verification",
    badge: "100% TRUTH LAW",
    desc: "Every commercial operation, outreach brief, and revenue calculation is backed by cryptographic release manifests and strict human-in-the-loop Founder approval gates."
  },
  {
    title: "4. Full-Stack Software Builders",
    badge: "CODE EXECUTION",
    desc: "Deterministic software engineering agents capable of scaffolding, testing, and deploying custom AI pipelines, web apps, SaaS MVPs, and business integrations."
  }
];

const FAQS = [
  {
    q: "What is GARUDA AI?",
    a: "GARUDA AI is an autonomous AI Operating System designed for governed business automation, custom software execution, revenue operations, and intelligent workflows. Founded by Praveen Mahawar, it operates as an integrated software and AI engineering platform that builds and manages bespoke digital solutions for global enterprises and businesses."
  },
  {
    q: "How is GARUDA AI different from generic chatbots or LLMs?",
    a: "Unlike simple text chatbots or raw language models, GARUDA AI operates as a complete multi-agent Operating System. It connects directly to business databases, CRM workflows, payment gateways, and code repositories, executing verifiable tasks with strict milestone governance, automated QA test suites, and cryptographic delivery manifests."
  },
  {
    q: "Is GARUDA AI related to Garuda Linux or other projects?",
    a: "No. GARUDA AI (official website: https://www.garudaos.in) is an independent AI Operating System and commercial software engineering company. It is entirely distinct from Garuda Linux (an open-source Linux OS distribution) and other unrelated projects bearing the name Garuda."
  },
  {
    q: "What services does GARUDA AI provide?",
    a: "GARUDA AI specializes in Custom AI Development (multi-agent & RAG architectures), Full-Stack SaaS MVP Engineering, Enterprise Business Workflow Automation, and Custom WhatsApp/Telegram AI Commercial Bots with built-in instant checkout."
  },
  {
    q: "How does GARUDA AI ensure software quality and delivery truth?",
    a: "GARUDA AI enforces the Anti-Fabrication Law and Payment Truth Law across all subsystems. All software builds must pass 100% automated regression test suites, and all commercial contracts are structured with transparent milestone governance (50% kickoff deposit, 50% upon verified delivery)."
  }
];

export default function WhatIsGarudaAI() {
  const navigate = useNavigate();

  const entityFaqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": FAQS.map((f) => ({
      "@type": "Question",
      "name": f.q,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": f.a
      }
    }))
  };

  return (
    <div style={{ minHeight: "100vh", background: palette.bg, color: palette.text, fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif" }}>
      <SEOHead
        title="What is GARUDA AI? | Autonomous AI Operating System"
        description="Learn what GARUDA AI is: The autonomous AI Operating System engineered for governed business automation, custom software execution, and multi-agent workflows."
        canonical="https://www.garudaos.in/what-is-garuda-ai"
        schema={entityFaqSchema}
      />

      {/* Header */}
      <header style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "1.25rem clamp(1.25rem, 4vw, 4rem)",
        borderBottom: "1px solid rgba(245,215,110,0.12)",
        background: "rgba(4,7,10,0.8)",
        backdropFilter: "blur(14px)",
        position: "sticky",
        top: 0,
        zIndex: 50
      }}>
        <button type="button" onClick={() => navigate("/")} style={{ display: "flex", alignItems: "center", gap: "0.75rem", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
          <span style={{ width: 44, height: 44, display: "grid", placeItems: "center", overflow: "hidden" }}>
            <BrandAssetImage kind="branding" alt="GARUDA sigil" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <span style={{ margin: 0, fontSize: "1.35rem", fontWeight: 800, letterSpacing: "0.12em", color: "#ffffff" }}>GARUDA</span>
            <span style={{ fontSize: "0.7rem", background: "rgba(245,215,110,0.14)", color: palette.gold, padding: "0.2rem 0.55rem", borderRadius: 4, fontWeight: 700, letterSpacing: "0.08em" }}>AI OS</span>
          </span>
        </button>
        <nav style={{ display: "flex", alignItems: "center", gap: "clamp(1rem, 2vw, 2rem)" }}>
          <button type="button" onClick={() => navigate("/")} style={{ background: "none", border: "none", color: "#9ca3af", cursor: "pointer", fontSize: "0.92rem" }}>Home</button>
          <button type="button" onClick={() => navigate("/chat")} style={{ background: "none", border: "none", color: "#9ca3af", cursor: "pointer", fontSize: "0.92rem" }}>Public Chat</button>
          <button
            type="button"
            onClick={() => navigate("/chat")}
            style={{
              background: "linear-gradient(135deg, #f5d76e 0%, #b8860b 100%)",
              color: "#05070b",
              border: "none",
              padding: "0.55rem 1.4rem",
              borderRadius: 999,
              fontWeight: 800,
              cursor: "pointer",
              fontSize: "0.9rem"
            }}
          >
            Scoping Chat →
          </button>
        </nav>
      </header>

      {/* Hero Section */}
      <main style={{ maxWidth: 960, margin: "0 auto", padding: "clamp(3rem, 6vw, 5rem) 1.5rem" }}>
        <motion.div {...fadeUp} style={{ textAlign: "center", marginBottom: "4rem" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.35rem 1rem", borderRadius: 999, border: "1px solid rgba(245,215,110,0.3)", background: "rgba(245,215,110,0.06)", color: palette.gold, fontSize: "0.8rem", fontWeight: 700, letterSpacing: "0.1em", marginBottom: "1.25rem" }}>
            OFFICIAL BRAND & PRODUCT ENTITY
          </div>
          <h1 style={{ fontSize: "clamp(2.4rem, 5vw, 3.8rem)", fontWeight: 800, lineHeight: 1.15, margin: "0 0 1.5rem", letterSpacing: "-0.02em" }}>
            What is <span style={{ background: "linear-gradient(120deg, #f5d76e, #ffdf8a 55%, #b8860b)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>GARUDA AI</span>?
          </h1>
          <p style={{ color: palette.muted, fontSize: "clamp(1.1rem, 2vw, 1.25rem)", lineHeight: 1.7, maxWidth: 740, margin: "0 auto" }}>
            GARUDA AI is an autonomous <b>AI Operating System</b> engineered for governed business automation, custom software execution, revenue operations, and multi-agent workflow orchestration.
          </p>
        </motion.div>

        {/* Section 1: Entity Disambiguation */}
        <motion.section {...fadeUp} style={{ background: palette.panelSoft, border: "1px solid rgba(245,215,110,0.15)", borderRadius: 16, padding: "2.5rem", marginBottom: "3rem" }}>
          <h2 style={{ fontSize: "1.6rem", fontWeight: 800, color: palette.gold, margin: "0 0 1rem" }}>
            Entity Identity & Disambiguation
          </h2>
          <p style={{ color: "#d1d5db", lineHeight: 1.8, fontSize: "1rem", margin: "0 0 1.2rem" }}>
            To clarify across Google Search and global knowledge bases: <b>GARUDA AI</b> (accessible officially at <a href="https://www.garudaos.in" style={{ color: palette.gold, textDecoration: "underline" }}>garudaos.in</a>) is a dedicated software and artificial intelligence platform.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.2rem", marginTop: "1.5rem" }}>
            <div style={{ background: "#05080e", padding: "1.2rem", borderRadius: 10, border: "1px solid rgba(16,185,129,0.3)" }}>
              <div style={{ color: palette.green, fontWeight: 700, fontSize: "0.95rem", marginBottom: "0.4rem" }}>✓ What GARUDA AI Is</div>
              <p style={{ color: "#9ca3af", fontSize: "0.88rem", lineHeight: 1.6, margin: 0 }}>
                An autonomous AI Operating System and software engineering company that architects, builds, verifies, and delivers production custom AI and business workflows under founder governance.
              </p>
            </div>
            <div style={{ background: "#05080e", padding: "1.2rem", borderRadius: 10, border: "1px solid rgba(239,68,68,0.3)" }}>
              <div style={{ color: "#f87171", fontWeight: 700, fontSize: "0.95rem", marginBottom: "0.4rem" }}>✗ What GARUDA AI Is Not</div>
              <p style={{ color: "#9ca3af", fontSize: "0.88rem", lineHeight: 1.6, margin: 0 }}>
                It is NOT Garuda Linux (an Arch Linux desktop OS), NOT a generic wrapper script, NOT an ungrounded chatbot, and NOT affiliated with unrelated aviation or financial frameworks.
              </p>
            </div>
          </div>
        </motion.section>

        {/* Section 2: Architectural Pillars */}
        <motion.section {...fadeUp} style={{ marginBottom: "3.5rem" }}>
          <h2 style={{ fontSize: "1.8rem", fontWeight: 800, textAlign: "center", margin: "0 0 2rem" }}>
            The 4 Pillars of the GARUDA Architecture
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem" }}>
            {ARCHITECTURAL_PILLARS.map((p, idx) => (
              <div key={idx} style={{ background: palette.panelSoft, border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "1.8rem" }}>
                <div style={{ fontSize: "0.75rem", fontWeight: 700, color: palette.gold, background: "rgba(245,215,110,0.1)", padding: "0.2rem 0.6rem", borderRadius: 4, display: "inline-block", marginBottom: "0.8rem" }}>
                  {p.badge}
                </div>
                <h3 style={{ fontSize: "1.15rem", fontWeight: 700, margin: "0 0 0.6rem", color: "#f3f4f6" }}>{p.title}</h3>
                <p style={{ color: palette.muted, fontSize: "0.92rem", lineHeight: 1.6, margin: 0 }}>{p.desc}</p>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Section 3: Engineered Core Capabilities */}
        <motion.section {...fadeUp} style={{ background: "#060a12", border: "1px solid rgba(245,215,110,0.12)", borderRadius: 16, padding: "2.5rem", marginBottom: "3.5rem" }}>
          <h2 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#fff", margin: "0 0 1.5rem" }}>
            Engineered Commercial Services
          </h2>
          <p style={{ color: palette.muted, lineHeight: 1.7, marginBottom: "1.8rem" }}>
            Businesses engage GARUDA AI for fixed-scope, milestone-governed engineering deployments:
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1rem" }}>
            <div onClick={() => navigate("/services/custom-ai-development")} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", padding: "1.2rem", borderRadius: 10, cursor: "pointer" }}>
              <div style={{ fontWeight: 700, color: palette.gold, marginBottom: "0.3rem" }}>Custom AI Development →</div>
              <div style={{ color: "#9ca3af", fontSize: "0.85rem" }}>Deterministic agents, multi-turn RAG pipelines, vector stores.</div>
            </div>
            <div onClick={() => navigate("/services/custom-software-saas-mvp")} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", padding: "1.2rem", borderRadius: 10, cursor: "pointer" }}>
              <div style={{ fontWeight: 700, color: palette.gold, marginBottom: "0.3rem" }}>SaaS MVP Development →</div>
              <div style={{ color: "#9ca3af", fontSize: "0.85rem" }}>Full-stack React, Node.js, Stripe/Razorpay billing, PostgreSQL.</div>
            </div>
            <div onClick={() => navigate("/services/business-workflow-ai-automation")} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", padding: "1.2rem", borderRadius: 10, cursor: "pointer" }}>
              <div style={{ fontWeight: 700, color: palette.gold, marginBottom: "0.3rem" }}>Business Workflow Automation →</div>
              <div style={{ color: "#9ca3af", fontSize: "0.85rem" }}>Event-driven integrations, document parsing, zero data loss.</div>
            </div>
            <div onClick={() => navigate("/services/whatsapp-telegram-ai-bots")} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", padding: "1.2rem", borderRadius: 10, cursor: "pointer" }}>
              <div style={{ fontWeight: 700, color: palette.gold, marginBottom: "0.3rem" }}>WhatsApp & Telegram AI Bots →</div>
              <div style={{ color: "#9ca3af", fontSize: "0.85rem" }}>24/7 intelligent customer scoping, quotes, and payment checkout.</div>
            </div>
          </div>
        </motion.section>

        {/* Section 4: Frequently Asked Questions */}
        <motion.section {...fadeUp} style={{ marginBottom: "4rem" }}>
          <h2 style={{ fontSize: "1.8rem", fontWeight: 800, textAlign: "center", margin: "0 0 2rem" }}>
            Frequently Asked Questions
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
            {FAQS.map((faq, i) => (
              <div key={i} style={{ background: palette.panelSoft, border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "1.5rem" }}>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: palette.gold, margin: "0 0 0.6rem" }}>{faq.q}</h3>
                <p style={{ color: "#d1d5db", fontSize: "0.95rem", lineHeight: 1.7, margin: 0 }}>{faq.a}</p>
              </div>
            ))}
          </div>
        </motion.section>

        {/* CTA */}
        <motion.section {...fadeUp} style={{ textAlign: "center", padding: "3rem 1.5rem", background: "radial-gradient(circle at 50% 50%, rgba(245,215,110,0.12), transparent 70%)" }}>
          <h2 style={{ fontSize: "2rem", fontWeight: 800, margin: "0 0 1rem" }}>Ready to Architect Your Solution?</h2>
          <p style={{ color: palette.muted, maxWidth: 540, margin: "0 auto 2rem", fontSize: "1rem", lineHeight: 1.6 }}>
            Speak directly with GARUDA AI's Solution Architect to formulate your architectural blueprint and milestone quote.
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: "1rem", flexWrap: "wrap" }}>
            <button
              onClick={() => navigate("/chat")}
              style={{
                background: "linear-gradient(135deg, #f5d76e 0%, #b8860b 100%)",
                color: "#05070b",
                border: "none",
                padding: "0.85rem 2.2rem",
                borderRadius: 999,
                fontWeight: 800,
                fontSize: "0.95rem",
                cursor: "pointer",
                boxShadow: "0 8px 24px rgba(245,215,110,0.25)"
              }}
            >
              Start Instant Scoping Chat →
            </button>
            <button
              onClick={() => navigate("/")}
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.15)",
                color: palette.text,
                padding: "0.85rem 1.8rem",
                borderRadius: 999,
                fontWeight: 600,
                fontSize: "0.95rem",
                cursor: "pointer"
              }}
            >
              Back to Home
            </button>
          </div>
        </motion.section>
      </main>

      {/* Footer */}
      <footer style={{ padding: "2.5rem clamp(1.25rem, 4vw, 4rem)", borderTop: "1px solid rgba(245,215,110,0.1)", textAlign: "center", color: "#5b6472", fontSize: "0.85rem", lineHeight: 1.7 }}>
        © {new Date().getFullYear()} GARUDA AI Operating System. Founded by Praveen Mahawar. Official Website: https://www.garudaos.in.
        <div style={{ marginTop: "0.5rem", color: "#6b7280" }}>
          <a href="/what-is-garuda-ai" style={{ color: palette.gold, textDecoration: "none", marginRight: "1rem" }}>What is GARUDA AI?</a>
          <a href="/services/custom-ai-development" style={{ color: "#9ca3af", textDecoration: "none", marginRight: "1rem" }}>Custom AI</a>
          <a href="/services/custom-software-saas-mvp" style={{ color: "#9ca3af", textDecoration: "none", marginRight: "1rem" }}>SaaS MVP</a>
          <a href="/chat" style={{ color: "#9ca3af", textDecoration: "none" }}>Scoping Chat</a>
        </div>
      </footer>
    </div>
  );
}
