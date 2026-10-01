import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import BrandAssetImage from "../components/BrandAssetImage";
import SEOHead from "../components/SEOHead";

const palette = {
  canvas: "#F6F4EE",
  canvasIvory: "#FAF9F6",
  card: "#FFFFFF",
  text: "#17181B",
  textBody: "#292B30",
  muted: "#525866",
  subtle: "#8A8D95",
  gold: "#B38235",
  goldPrimary: "#C48B28",
  goldDeep: "#9E6D1C",
  goldLight: "#D6A84F",
  goldGradient: "linear-gradient(135deg, #C48B28 0%, #9E6D1C 100%)",
  border: "rgba(23, 24, 27, 0.08)",
  borderGold: "rgba(179, 130, 53, 0.35)",
  green: "#15803d",
  greenBg: "rgba(22, 163, 74, 0.08)",
  red: "#b91c1c",
  redBg: "rgba(185, 28, 28, 0.08)",
  obsidian: "#10141D",
  obsidianDeep: "#0B0E14"
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
    a: "No. GARUDA AI is a completely independent sovereign software and autonomous intelligence platform. It has no affiliation with Garuda Linux (an Arch Linux desktop distro), airline brands, or third-party financial institutions."
  },
  {
    q: "How can businesses engage or hire GARUDA AI?",
    a: "Businesses can initiate solution scoping directly through the GARUDA engineering portal at garudaos.in/chat. We define deterministic deliverables, timeline milestones, and fixed pricing within 24 hours."
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
    <div style={{
      minHeight: "100vh",
      background: palette.canvas,
      color: palette.text,
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      WebkitFontSmoothing: "antialiased"
    }}>
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
        padding: "0.85rem clamp(1.25rem, 4vw, 3.5rem)",
        borderBottom: `1px solid ${palette.border}`,
        background: "rgba(246, 244, 238, 0.92)",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        position: "sticky",
        top: 0,
        zIndex: 50
      }}>
        <button
          type="button"
          onClick={() => navigate("/")}
          style={{ display: "flex", alignItems: "center", gap: "0.8rem", background: "none", border: "none", cursor: "pointer", padding: 0 }}
        >
          <img
            src="/images/garuda_eagle_sigil.png"
            alt="GARUDA Sigil"
            style={{ width: "34px", height: "28px", objectFit: "contain" }}
          />
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", lineHeight: 1 }}>
            <div style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: "1.25rem",
              fontWeight: 700,
              letterSpacing: "0.06em",
              color: palette.text
            }}>
              GARUDA AI
            </div>
            <div style={{
              fontSize: "0.6rem",
              color: palette.muted,
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              marginTop: "3px"
            }}>
              Autonomous AI Operating System
            </div>
          </div>
        </button>

        <nav style={{ display: "flex", alignItems: "center", gap: "clamp(1rem, 2vw, 2rem)" }}>
          <button
            type="button"
            onClick={() => navigate("/")}
            style={{ background: "none", border: "none", color: palette.muted, cursor: "pointer", fontSize: "0.9rem", fontWeight: 500 }}
          >
            Home
          </button>
          <button
            type="button"
            onClick={() => navigate("/case-studies")}
            style={{ background: "none", border: "none", color: palette.muted, cursor: "pointer", fontSize: "0.9rem", fontWeight: 500 }}
          >
            Case Studies
          </button>
          <button
            type="button"
            onClick={() => navigate("/chat")}
            style={{
              background: palette.goldGradient,
              color: "#FFFFFF",
              border: "none",
              padding: "0.6rem 1.35rem",
              borderRadius: 999,
              fontWeight: 600,
              cursor: "pointer",
              fontSize: "0.88rem",
              boxShadow: "0 2px 10px rgba(179, 130, 53, 0.25)"
            }}
          >
            Scoping Chat →
          </button>
        </nav>
      </header>

      {/* Hero Section */}
      <main style={{ maxWidth: 1040, margin: "0 auto", padding: "clamp(3rem, 6vw, 5rem) 1.5rem" }}>
        <motion.div {...fadeUp} style={{ textAlign: "center", marginBottom: "4rem" }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.35rem 1rem",
            borderRadius: 999,
            border: `1px solid ${palette.borderGold}`,
            background: "rgba(179, 130, 53, 0.08)",
            color: palette.goldDeep,
            fontSize: "0.78rem",
            fontWeight: 700,
            letterSpacing: "0.1em",
            marginBottom: "1.25rem",
            textTransform: "uppercase"
          }}>
            Official Brand & Product Entity
          </div>
          <h1 style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: "clamp(2.4rem, 5vw, 3.8rem)",
            fontWeight: 700,
            lineHeight: 1.15,
            margin: "0 0 1.5rem",
            letterSpacing: "-0.01em",
            color: palette.text
          }}>
            What is <span style={{
              background: palette.goldGradient,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent"
            }}>GARUDA AI</span>?
          </h1>
          <p style={{
            color: palette.muted,
            fontSize: "clamp(1.05rem, 2vw, 1.25rem)",
            lineHeight: 1.7,
            maxWidth: 760,
            margin: "0 auto"
          }}>
            GARUDA AI is an autonomous <b>AI Operating System</b> engineered for governed business automation, custom software execution, revenue operations, and multi-agent workflow orchestration.
          </p>
        </motion.div>

        {/* Section 1: Entity Disambiguation */}
        <motion.section {...fadeUp} style={{
          background: palette.card,
          border: `1px solid ${palette.border}`,
          borderRadius: 16,
          padding: "2.5rem",
          marginBottom: "3rem",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.03)"
        }}>
          <h2 style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: "1.75rem",
            fontWeight: 700,
            color: palette.text,
            margin: "0 0 1rem"
          }}>
            Entity Identity & Disambiguation
          </h2>
          <p style={{ color: palette.textBody, lineHeight: 1.8, fontSize: "1rem", margin: "0 0 1.5rem" }}>
            To clarify across Google Search and global knowledge bases: <b>GARUDA AI</b> (accessible officially at <a href="https://www.garudaos.in" style={{ color: palette.goldDeep, textDecoration: "underline", fontWeight: 600 }}>garudaos.in</a>) is a dedicated software and artificial intelligence platform.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.25rem" }}>
            <div style={{
              background: palette.greenBg,
              padding: "1.5rem",
              borderRadius: 12,
              border: "1px solid rgba(22, 163, 74, 0.2)"
            }}>
              <div style={{ color: palette.green, fontWeight: 700, fontSize: "0.98rem", marginBottom: "0.5rem" }}>
                ✓ What GARUDA AI Is
              </div>
              <p style={{ color: palette.textBody, fontSize: "0.9rem", lineHeight: 1.6, margin: 0 }}>
                An autonomous AI Operating System and software engineering practice that architects, builds, verifies, and delivers production custom AI and business workflows under founder governance.
              </p>
            </div>
            <div style={{
              background: palette.redBg,
              padding: "1.5rem",
              borderRadius: 12,
              border: "1px solid rgba(185, 28, 28, 0.2)"
            }}>
              <div style={{ color: palette.red, fontWeight: 700, fontSize: "0.98rem", marginBottom: "0.5rem" }}>
                ✗ What GARUDA AI Is Not
              </div>
              <p style={{ color: palette.textBody, fontSize: "0.9rem", lineHeight: 1.6, margin: 0 }}>
                It is NOT Garuda Linux (an Arch Linux desktop OS), NOT a generic wrapper script, NOT an ungrounded chatbot, and NOT affiliated with unrelated aviation or financial frameworks.
              </p>
            </div>
          </div>
        </motion.section>

        {/* Section 2: Architectural Pillars */}
        <motion.section {...fadeUp} style={{ marginBottom: "3.5rem" }}>
          <h2 style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: "2rem",
            fontWeight: 700,
            textAlign: "center",
            margin: "0 0 2rem",
            color: palette.text
          }}>
            The 4 Pillars of the GARUDA Architecture
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem" }}>
            {ARCHITECTURAL_PILLARS.map((p, idx) => (
              <div
                key={idx}
                style={{
                  background: palette.card,
                  border: `1px solid ${palette.border}`,
                  borderRadius: 14,
                  padding: "1.8rem",
                  boxShadow: "0 4px 16px rgba(0, 0, 0, 0.03)"
                }}
              >
                <div style={{
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  color: palette.goldDeep,
                  background: "rgba(179, 130, 53, 0.1)",
                  padding: "0.25rem 0.6rem",
                  borderRadius: 4,
                  display: "inline-block",
                  marginBottom: "0.8rem",
                  letterSpacing: "0.06em"
                }}>
                  {p.badge}
                </div>
                <h3 style={{ fontSize: "1.15rem", fontWeight: 700, margin: "0 0 0.6rem", color: palette.text }}>
                  {p.title}
                </h3>
                <p style={{ color: palette.muted, fontSize: "0.92rem", lineHeight: 1.6, margin: 0 }}>
                  {p.desc}
                </p>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Section 3: Engineered Core Capabilities */}
        <motion.section {...fadeUp} style={{
          background: palette.canvasIvory,
          border: `1px solid ${palette.border}`,
          borderRadius: 16,
          padding: "2.5rem",
          marginBottom: "3.5rem"
        }}>
          <h2 style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: "1.8rem",
            fontWeight: 700,
            color: palette.text,
            margin: "0 0 1rem"
          }}>
            Engineered Commercial Services
          </h2>
          <p style={{ color: palette.muted, lineHeight: 1.7, marginBottom: "1.8rem", fontSize: "0.98rem" }}>
            Businesses engage GARUDA AI for fixed-scope, milestone-governed engineering deployments:
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1rem" }}>
            <div
              onClick={() => navigate("/services/custom-ai-development")}
              style={{
                background: palette.card,
                border: `1px solid ${palette.border}`,
                padding: "1.4rem",
                borderRadius: 12,
                cursor: "pointer",
                transition: "all 0.15s ease",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.02)"
              }}
            >
              <div style={{ fontWeight: 700, color: palette.goldDeep, marginBottom: "0.35rem" }}>
                Custom AI Development →
              </div>
              <div style={{ color: palette.muted, fontSize: "0.88rem", lineHeight: 1.5 }}>
                Deterministic agents, multi-turn RAG pipelines, vector stores.
              </div>
            </div>
            <div
              onClick={() => navigate("/services/custom-software-saas-mvp")}
              style={{
                background: palette.card,
                border: `1px solid ${palette.border}`,
                padding: "1.4rem",
                borderRadius: 12,
                cursor: "pointer",
                transition: "all 0.15s ease",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.02)"
              }}
            >
              <div style={{ fontWeight: 700, color: palette.goldDeep, marginBottom: "0.35rem" }}>
                SaaS MVP Development →
              </div>
              <div style={{ color: palette.muted, fontSize: "0.88rem", lineHeight: 1.5 }}>
                Full-stack React, Node.js, Stripe/Razorpay billing, PostgreSQL.
              </div>
            </div>
            <div
              onClick={() => navigate("/services/business-workflow-ai-automation")}
              style={{
                background: palette.card,
                border: `1px solid ${palette.border}`,
                padding: "1.4rem",
                borderRadius: 12,
                cursor: "pointer",
                transition: "all 0.15s ease",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.02)"
              }}
            >
              <div style={{ fontWeight: 700, color: palette.goldDeep, marginBottom: "0.35rem" }}>
                Business Workflow Automation →
              </div>
              <div style={{ color: palette.muted, fontSize: "0.88rem", lineHeight: 1.5 }}>
                Event-driven integrations, document parsing, zero data loss.
              </div>
            </div>
            <div
              onClick={() => navigate("/services/whatsapp-telegram-ai-bots")}
              style={{
                background: palette.card,
                border: `1px solid ${palette.border}`,
                padding: "1.4rem",
                borderRadius: 12,
                cursor: "pointer",
                transition: "all 0.15s ease",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.02)"
              }}
            >
              <div style={{ fontWeight: 700, color: palette.goldDeep, marginBottom: "0.35rem" }}>
                WhatsApp & Telegram AI Bots →
              </div>
              <div style={{ color: palette.muted, fontSize: "0.88rem", lineHeight: 1.5 }}>
                24/7 intelligent customer scoping, quotes, and payment checkout.
              </div>
            </div>
          </div>
        </motion.section>

        {/* Section 4: Frequently Asked Questions */}
        <motion.section {...fadeUp} style={{ marginBottom: "4rem" }}>
          <h2 style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: "2rem",
            fontWeight: 700,
            textAlign: "center",
            margin: "0 0 2rem",
            color: palette.text
          }}>
            Frequently Asked Questions
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
            {FAQS.map((faq, i) => (
              <div
                key={i}
                style={{
                  background: palette.card,
                  border: `1px solid ${palette.border}`,
                  borderRadius: 12,
                  padding: "1.5rem",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.02)"
                }}
              >
                <h3 style={{ fontSize: "1.08rem", fontWeight: 700, color: palette.goldDeep, margin: "0 0 0.6rem" }}>
                  {faq.q}
                </h3>
                <p style={{ color: palette.muted, fontSize: "0.95rem", lineHeight: 1.7, margin: 0 }}>
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </motion.section>

        {/* CTA */}
        <motion.section {...fadeUp} style={{
          textAlign: "center",
          padding: "3.5rem 2rem",
          background: `linear-gradient(180deg, ${palette.obsidian} 0%, ${palette.obsidianDeep} 100%)`,
          borderRadius: 20,
          border: `1px solid ${palette.borderGold}`,
          color: "#FFFFFF",
          boxShadow: "0 20px 50px rgba(16, 20, 29, 0.2)"
        }}>
          <h2 style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: "2.2rem",
            fontWeight: 700,
            margin: "0 0 1rem"
          }}>
            Ready to Architect Your Solution?
          </h2>
          <p style={{ color: "#b0b8c8", maxWidth: 540, margin: "0 auto 2rem", fontSize: "1rem", lineHeight: 1.65 }}>
            Speak directly with GARUDA AI's Solution Architect to formulate your architectural blueprint and milestone quote.
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: "1rem", flexWrap: "wrap" }}>
            <button
              onClick={() => navigate("/chat")}
              style={{
                background: palette.goldGradient,
                color: "#FFFFFF",
                border: "none",
                padding: "0.85rem 2.2rem",
                borderRadius: 999,
                fontWeight: 600,
                fontSize: "0.95rem",
                cursor: "pointer",
                boxShadow: "0 8px 24px rgba(179, 130, 53, 0.3)"
              }}
            >
              Start Instant Scoping Chat →
            </button>
            <button
              onClick={() => navigate("/")}
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.2)",
                color: "#FFFFFF",
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
      <footer style={{
        padding: "3rem clamp(1.25rem, 4vw, 4rem)",
        borderTop: `1px solid ${palette.border}`,
        textAlign: "center",
        color: palette.subtle,
        fontSize: "0.85rem",
        lineHeight: 1.7,
        background: palette.canvasIvory
      }}>
        <div>
          © {new Date().getFullYear()} GARUDA AI Operating System. Founded by Praveen Mahawar. Official Website: https://www.garudaos.in.
        </div>
        <div style={{ marginTop: "0.75rem", display: "flex", gap: "1.2rem", justifyContent: "center", flexWrap: "wrap" }}>
          <a href="/what-is-garuda-ai" style={{ color: palette.goldDeep, textDecoration: "none", fontWeight: 600 }}>What is GARUDA AI?</a>
          <a href="/services/custom-ai-development" style={{ color: palette.muted, textDecoration: "none" }}>Custom AI</a>
          <a href="/services/custom-software-saas-mvp" style={{ color: palette.muted, textDecoration: "none" }}>SaaS MVP</a>
          <a href="/chat" style={{ color: palette.muted, textDecoration: "none" }}>Scoping Chat</a>
        </div>
      </footer>
    </div>
  );
}
