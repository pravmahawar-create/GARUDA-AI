import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import BrandAssetImage from "../components/BrandAssetImage";
import SEOHead from "../components/SEOHead";
import ProjectScopeForm from "../components/ProjectScopeForm";
import WhatsAppQuickCTA from "../components/WhatsAppQuickCTA";
import LiveGarudaPlayground from "../components/LiveGarudaPlayground";
import { trackEvent } from "../utils/telemetry";

const palette = {
  bg: "#04070a",
  panel: "#0b0f16",
  panelSoft: "rgba(11, 15, 22, 0.72)",
  line: "rgba(245, 215, 110, 0.16)",
  text: "#f7f2dc",
  muted: "#8d95a7",
  gold: "#f5d76e",
  goldStrong: "#b8860b",
  green: "#75f4ab",
  red: "#f87171",
  blue: "#7dd3fc"
};

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-40px" },
  transition: { duration: 0.45, ease: "easeOut" }
};

const SectionHeading = ({ kicker, title, sub }) => (
  <motion.div {...fadeUp} style={{ textAlign: "center", maxWidth: 740, margin: "0 auto 3rem" }}>
    <p style={{ color: palette.gold, letterSpacing: "0.18em", fontSize: "0.78rem", fontWeight: 700, margin: "0 0 0.8rem", textTransform: "uppercase" }}>
      {kicker}
    </p>
    <h2 style={{ fontSize: "clamp(1.85rem, 3.2vw, 2.5rem)", fontWeight: 800, lineHeight: 1.18, margin: 0, color: "#ffffff" }}>
      {title}
    </h2>
    {sub && (
      <p style={{ color: palette.muted, fontSize: "1.02rem", lineHeight: 1.65, margin: "0.9rem auto 0", maxWidth: 640 }}>
        {sub}
      </p>
    )}
  </motion.div>
);

const structuredSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      "name": "GARUDA OS",
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "All",
      "offers": {
        "@type": "AggregateOffer",
        "lowPrice": "49",
        "highPrice": "999",
        "priceCurrency": "USD"
      }
    },
    {
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "How much does a WhatsApp AI receptionist cost?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "The Next.js 14 source code starter kit is $49 (₹3,999) with lifetime updates. Done-for-you turnkey clinic or business setup starts at $199 (₹9,999)."
          }
        },
        {
          "@type": "Question",
          "name": "Can GARUDA book clinic appointments automatically?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes. GARUDA automatically triages patient urgency, checks clinic availability, reserves slots, and alerts human staff immediately if emergency symptoms are detected."
          }
        },
        {
          "@type": "Question",
          "name": "How does milestone payment protection work?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "All custom software projects operate on a 50/50 milestone basis: 50% upfront to initiate architecture, and 50% upon verified staging demonstration."
          }
        }
      ]
    }
  ]
};

export default function PublicLanding({ onGetStarted, onFounderLogin }) {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState(null);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
    trackEvent("faq_toggle", { index });
  };

  const handleDeployClinic = () => {
    trackEvent("playground_clinic_cta_clicked");
    document.getElementById("project-scope")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleDeploySales = () => {
    trackEvent("playground_sales_cta_clicked");
    document.getElementById("project-scope")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleGetStarterKit = () => {
    trackEvent("playground_starter_cta_clicked");
    navigate("/starter");
  };

  return (
    <div style={{ minHeight: "100vh", background: palette.bg, color: palette.text, fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif" }}>
      <SEOHead
        title="GARUDA OS — Autonomous AI Systems & WhatsApp AI Receptionists"
        description="Deploy autonomous AI systems, 24/7 WhatsApp AI receptionists, and production software workflows engineered around your business rules. Next.js 14 Starter Kit available ($49 / ₹3,999)."
        canonical="https://www.garudaos.in/"
        structuredData={structuredSchema}
      />

      {/* 01 — Minimal High-Value Navigation */}
      <header style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "1rem clamp(1.25rem, 4vw, 3.5rem)",
        borderBottom: "1px solid rgba(245,215,110,0.12)",
        background: "rgba(4,7,10,0.85)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        position: "sticky",
        top: 0,
        zIndex: 50
      }}>
        {/* Brand Sigil */}
        <button
          type="button"
          onClick={() => navigate("/")}
          style={{ display: "flex", alignItems: "center", gap: "0.75rem", background: "none", border: "none", cursor: "pointer", padding: 0 }}
        >
          <span style={{ width: 40, height: 40, display: "grid", placeItems: "center", overflow: "hidden" }}>
            <BrandAssetImage kind="branding" alt="GARUDA sigil" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "0.55rem" }}>
            <span style={{ fontSize: "1.25rem", fontWeight: 800, letterSpacing: "0.1em", color: "#ffffff" }}>GARUDA</span>
            <span style={{ fontSize: "0.68rem", background: "rgba(245,215,110,0.14)", color: palette.gold, padding: "0.18rem 0.5rem", borderRadius: 4, fontWeight: 700, letterSpacing: "0.08em" }}>AI OS</span>
          </span>
        </button>

        {/* Minimal Nav Links */}
        <nav style={{ display: "flex", alignItems: "center", gap: "clamp(0.8rem, 2vw, 1.8rem)" }}>
          <a href="#products" style={{ color: "#d1d5db", textDecoration: "none", fontSize: "0.9rem", fontWeight: 600 }}>Products</a>
          <a href="#how-it-works" style={{ color: "#d1d5db", textDecoration: "none", fontSize: "0.9rem", fontWeight: 600 }}>How It Works</a>
          <a href="#proof" style={{ color: "#d1d5db", textDecoration: "none", fontSize: "0.9rem", fontWeight: 600 }}>Proof</a>
          <a href="#faq" style={{ color: "#d1d5db", textDecoration: "none", fontSize: "0.9rem", fontWeight: 600 }}>FAQ</a>

          {/* Persistent High-Value CTA */}
          <button
            type="button"
            onClick={() => {
              trackEvent("nav_starter_kit_click");
              navigate("/starter");
            }}
            style={{
              background: "rgba(117, 244, 171, 0.12)",
              border: "1px solid rgba(117, 244, 171, 0.45)",
              color: "#75f4ab",
              borderRadius: 999,
              padding: "0.45rem 1.15rem",
              fontWeight: 700,
              cursor: "pointer",
              fontSize: "0.85rem",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem"
            }}
          >
            <span>📦</span>
            <span>Starter Kit — $49</span>
          </button>

          {/* Founder Cockpit VIP Access */}
          <button
            type="button"
            onClick={onFounderLogin}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              background: "linear-gradient(135deg, #1f1704 0%, #3d2d09 100%)",
              border: "1.5px solid rgba(245, 215, 110, 0.6)",
              color: "#fff",
              borderRadius: 999,
              padding: "0.45rem 1.1rem",
              fontWeight: 800,
              cursor: "pointer",
              fontSize: "0.82rem"
            }}
          >
            <span>👑</span>
            <span>Founder</span>
          </button>
        </nav>
      </header>

      {/* 02 — Outcome-First Hero Section with Embedded Live Playground */}
      <section style={{
        position: "relative",
        overflow: "hidden",
        padding: "clamp(3.5rem, 6vw, 6rem) clamp(1.25rem, 4vw, 4rem)",
        textAlign: "center"
      }}>
        {/* Subtle Ambient Backing Glow */}
        <div style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background:
            "radial-gradient(circle at 50% 0%, rgba(245,215,110,0.12), transparent 45%)," +
            "radial-gradient(circle at 80% 30%, rgba(56,189,248,0.06), transparent 35%)," +
            "radial-gradient(circle at 20% 35%, rgba(117,244,171,0.05), transparent 30%)"
        }} />

        <div style={{ position: "relative", maxWidth: 1040, margin: "0 auto" }}>
          {/* Eyebrow Tag */}
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.4rem 1rem",
            borderRadius: 999,
            border: "1px solid rgba(245,215,110,0.3)",
            background: "rgba(245,215,110,0.06)",
            color: palette.gold,
            fontSize: "0.78rem",
            fontWeight: 700,
            letterSpacing: "0.08em",
            marginBottom: "1.4rem"
          }}>
            AUTONOMOUS BUSINESS EXECUTION ENGINE
          </div>

          {/* Outcome Headline */}
          <h1 style={{
            fontSize: "clamp(2.3rem, 5.2vw, 3.8rem)",
            fontWeight: 800,
            lineHeight: 1.12,
            margin: "0 0 1.25rem",
            letterSpacing: "-0.02em",
            color: "#ffffff"
          }}>
            Autonomous AI Systems That <br />
            <span style={{
              background: "linear-gradient(120deg, #f5d76e, #ffdf8a 55%, #b8860b)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent"
            }}>
              Run Your Business While You Sleep.
            </span>
          </h1>

          {/* Human-First Subhead */}
          <p style={{
            color: palette.muted,
            fontSize: "clamp(1.02rem, 1.8vw, 1.2rem)",
            lineHeight: 1.65,
            maxWidth: 720,
            margin: "0 auto 2rem"
          }}>
            From 24/7 WhatsApp customer receptionists to bespoke operations workflows — deploy intelligent software engineered around your exact business rules.
          </p>

          {/* Direct Hero Action CTAs */}
          <div style={{ display: "flex", justifyContent: "center", gap: "1rem", flexWrap: "wrap", marginBottom: "3rem" }}>
            <button
              onClick={() => {
                trackEvent("primary_cta_click", { location: "hero" });
                document.getElementById("project-scope")?.scrollIntoView({ behavior: "smooth" });
              }}
              style={{
                background: "linear-gradient(135deg, #f5d76e 0%, #b8860b 100%)",
                color: "#05070b",
                border: "none",
                padding: "0.95rem 2.2rem",
                borderRadius: 999,
                fontWeight: 800,
                fontSize: "1rem",
                cursor: "pointer",
                boxShadow: "0 10px 28px rgba(245,215,110,0.25)"
              }}
            >
              Deploy Your AI System →
            </button>

            <button
              onClick={() => {
                trackEvent("secondary_cta_click", { location: "hero" });
                navigate("/starter");
              }}
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(245,215,110,0.35)",
                color: palette.gold,
                padding: "0.95rem 2rem",
                borderRadius: 999,
                fontWeight: 700,
                fontSize: "0.98rem",
                cursor: "pointer"
              }}
            >
              Explore Starter Kit ($49) →
            </button>
          </div>

          {/* 03 — Live GARUDA Playground Mounted Directly in the First Fold */}
          <div style={{ margin: "1rem auto 0" }}>
            <LiveGarudaPlayground
              onDeployClinic={handleDeployClinic}
              onDeploySales={handleDeploySales}
              onGetStarterKit={handleGetStarterKit}
            />
          </div>
        </div>
      </section>

      {/* 04 — Proof & Trust Strip */}
      <section style={{
        padding: "1.8rem clamp(1.25rem, 4vw, 4rem)",
        borderTop: "1px solid rgba(245,215,110,0.1)",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
        background: "rgba(255, 255, 255, 0.015)"
      }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "1.2rem",
          maxWidth: 1100,
          margin: "0 auto",
          textAlign: "center"
        }}>
          {[
            { icon: "⚡", title: "Sub-Second Triage", subtitle: "Instant classification & priority routing" },
            { icon: "🛡️", title: "100% Code Ownership", subtitle: "Full source code, no vendor lock-in" },
            { icon: "💬", title: "WhatsApp Cloud API", subtitle: "Official Meta-compliant business messaging" },
            { icon: "⚠️", title: "Human Safeguard", subtitle: "Automated escalation when judgment is needed" }
          ].map((item) => (
            <div key={item.title} style={{ padding: "0.8rem 1rem" }}>
              <div style={{ fontSize: "1.4rem", marginBottom: "0.3rem" }}>{item.icon}</div>
              <div style={{ color: "#ffffff", fontWeight: 700, fontSize: "0.92rem" }}>{item.title}</div>
              <div style={{ color: palette.muted, fontSize: "0.78rem" }}>{item.subtitle}</div>
            </div>
          ))}
        </div>
      </section>

      {/* 05 — The Three Clear Commercial Paths */}
      <section id="products" style={{ padding: "clamp(4rem, 8vw, 6rem) clamp(1.25rem, 4vw, 4rem)" }}>
        <SectionHeading
          kicker="Three Clear Commercial Paths"
          title="Choose the Way You Want to Work with GARUDA"
          sub="Whether you want to build on our verified source code or have us engineer a custom autonomous system."
        />

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "1.6rem",
          maxWidth: 1120,
          margin: "0 auto"
        }}>
          {/* Card 1: Developers / Agencies */}
          <div style={{
            background: palette.panelSoft,
            border: "1px solid rgba(117, 244, 171, 0.3)",
            borderRadius: 20,
            padding: "2rem",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            position: "relative"
          }}>
            <div>
              <div style={{
                display: "inline-block",
                background: "rgba(117, 244, 171, 0.1)",
                color: "#75f4ab",
                padding: "0.25rem 0.75rem",
                borderRadius: 999,
                fontSize: "0.75rem",
                fontWeight: 700,
                marginBottom: "1rem"
              }}>
                FOR DEVELOPERS &amp; AGENCIES
              </div>
              <h3 style={{ fontSize: "1.4rem", fontWeight: 800, margin: "0 0 0.5rem", color: "#fff" }}>
                Next.js 14 AI Starter Kit
              </h3>
              <p style={{ color: palette.muted, fontSize: "0.92rem", lineHeight: 1.6, margin: "0 0 1.25rem" }}>
                Launch your own production WhatsApp AI receptionist in 60 minutes. Complete source code with Supabase schema, Gemini 2.5 triage, and Razorpay/Stripe billing.
              </p>
              <div style={{ fontSize: "1.75rem", fontWeight: 900, color: palette.gold, marginBottom: "1rem" }}>
                $49 <span style={{ fontSize: "1rem", color: "#9ca3af", fontWeight: 500 }}>USD · ₹3,999 INR</span>
              </div>
              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 1.75rem", color: "#d1d5db", fontSize: "0.88rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <li>✔ 17 Production-ready files (Next.js 14 App Router)</li>
                <li>✔ WhatsApp Cloud API webhook handler</li>
                <li>✔ SHA-256 Verified cryptographic release</li>
                <li>✔ Full commercial single-client deployment license</li>
              </ul>
            </div>
            <button
              onClick={() => {
                trackEvent("pricing_starter_click");
                navigate("/starter");
              }}
              style={{
                background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                color: "#ffffff",
                border: "none",
                borderRadius: 10,
                padding: "0.85rem",
                fontWeight: 800,
                fontSize: "0.95rem",
                cursor: "pointer",
                boxShadow: "0 4px 16px rgba(16, 185, 129, 0.25)"
              }}
            >
              Get the Starter Kit →
            </button>
          </div>

          {/* Card 2: Local Businesses */}
          <div style={{
            background: palette.panelSoft,
            border: "1px solid rgba(245, 215, 110, 0.4)",
            borderRadius: 20,
            padding: "2rem",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            position: "relative",
            boxShadow: "0 0 35px rgba(245, 215, 110, 0.08)"
          }}>
            <div>
              <div style={{
                display: "inline-block",
                background: "rgba(245, 215, 110, 0.12)",
                color: palette.gold,
                padding: "0.25rem 0.75rem",
                borderRadius: 999,
                fontSize: "0.75rem",
                fontWeight: 700,
                marginBottom: "1rem"
              }}>
                FOR CLINICS &amp; BUSINESSES
              </div>
              <h3 style={{ fontSize: "1.4rem", fontWeight: 800, margin: "0 0 0.5rem", color: "#fff" }}>
                Turnkey WhatsApp AI Receptionist
              </h3>
              <p style={{ color: palette.muted, fontSize: "0.92rem", lineHeight: 1.6, margin: "0 0 1.25rem" }}>
                Turn WhatsApp into your 24/7 autonomous receptionist. We handle complete setup, catalog integration, appointment booking rules, and staff handover.
              </p>
              <div style={{ fontSize: "1.75rem", fontWeight: 900, color: palette.gold, marginBottom: "1rem" }}>
                $199 <span style={{ fontSize: "1rem", color: "#9ca3af", fontWeight: 500 }}>USD · ₹9,999 INR</span>
              </div>
              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 1.75rem", color: "#d1d5db", fontSize: "0.88rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <li>✔ Custom prompt &amp; knowledge base formulation</li>
                <li>✔ Appointment booking &amp; emergency triage rules</li>
                <li>✔ Staff notification via WhatsApp / Telegram</li>
                <li>✔ Done-for-you configuration in 3-5 days</li>
              </ul>
            </div>
            <button
              onClick={() => {
                trackEvent("pricing_clinic_click");
                document.getElementById("project-scope")?.scrollIntoView({ behavior: "smooth" });
              }}
              style={{
                background: "linear-gradient(135deg, #f5d76e 0%, #b8860b 100%)",
                color: "#05070b",
                border: "none",
                borderRadius: 10,
                padding: "0.85rem",
                fontWeight: 800,
                fontSize: "0.95rem",
                cursor: "pointer",
                boxShadow: "0 4px 16px rgba(245, 215, 110, 0.25)"
              }}
            >
              Deploy My AI Receptionist →
            </button>
          </div>

          {/* Card 3: Enterprise */}
          <div style={{
            background: palette.panelSoft,
            border: "1px solid rgba(56, 189, 248, 0.3)",
            borderRadius: 20,
            padding: "2rem",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            position: "relative"
          }}>
            <div>
              <div style={{
                display: "inline-block",
                background: "rgba(56, 189, 248, 0.1)",
                color: "#38bdf8",
                padding: "0.25rem 0.75rem",
                borderRadius: 999,
                fontSize: "0.75rem",
                fontWeight: 700,
                marginBottom: "1rem"
              }}>
                FOR ENTERPRISE &amp; SAAS
              </div>
              <h3 style={{ fontSize: "1.4rem", fontWeight: 800, margin: "0 0 0.5rem", color: "#fff" }}>
                Custom Autonomous AI Systems
              </h3>
              <p style={{ color: palette.muted, fontSize: "0.92rem", lineHeight: 1.6, margin: "0 0 1.25rem" }}>
                Deploy an end-to-end autonomous AI system designed around your specific business operations. Built on milestone-based delivery with founder governance.
              </p>
              <div style={{ fontSize: "1.75rem", fontWeight: 900, color: palette.gold, marginBottom: "1rem" }}>
                $999+ <span style={{ fontSize: "1rem", color: "#9ca3af", fontWeight: 500 }}>USD · Custom Scope</span>
              </div>
              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 1.75rem", color: "#d1d5db", fontSize: "0.88rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <li>✔ Multi-agent workflow automation</li>
                <li>✔ Private enterprise document intelligence (RAG)</li>
                <li>✔ 50/50 Milestone payment structure</li>
                <li>✔ Direct architecture review with Praveen Mahawar</li>
              </ul>
            </div>
            <button
              onClick={() => {
                trackEvent("pricing_enterprise_click");
                document.getElementById("project-scope")?.scrollIntoView({ behavior: "smooth" });
              }}
              style={{
                background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
                color: "#ffffff",
                border: "none",
                borderRadius: 10,
                padding: "0.85rem",
                fontWeight: 800,
                fontSize: "0.95rem",
                cursor: "pointer",
                boxShadow: "0 4px 16px rgba(2, 132, 199, 0.25)"
              }}
            >
              Discuss My System →
            </button>
          </div>
        </div>
      </section>

      {/* 06 — How It Works (3 Clear Steps) */}
      <section id="how-it-works" style={{ padding: "clamp(4rem, 8vw, 6rem) clamp(1.25rem, 4vw, 4rem)", background: "rgba(255, 255, 255, 0.01)" }}>
        <SectionHeading
          kicker="Clear Engagement Process"
          title="How Autonomous Systems Are Delivered"
          sub="No theoretical debates or endless consulting. A disciplined 3-step execution model."
        />

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "1.5rem",
          maxWidth: 1080,
          margin: "0 auto"
        }}>
          {[
            {
              step: "01",
              title: "Scope & Business Rules Intake",
              desc: "We analyze your exact customer communication flows, operating bottlenecks, and required integrations."
            },
            {
              step: "02",
              title: "Deterministic Build & Sandbox Testing",
              desc: "Your system is built inside a private staging environment and tested against high-volume test scenarios."
            },
            {
              step: "03",
              title: "Governed Live Deployment",
              desc: "System launches with live WhatsApp Cloud API webhooks, automated logging, and built-in human escalation rules."
            }
          ].map((s) => (
            <div
              key={s.step}
              style={{
                padding: "1.8rem",
                borderRadius: 18,
                border: "1px solid rgba(245,215,110,0.14)",
                background: palette.panelSoft
              }}
            >
              <div style={{ fontFamily: "ui-monospace, monospace", color: palette.gold, fontSize: "1.2rem", fontWeight: 800, marginBottom: "0.6rem" }}>
                {s.step}
              </div>
              <h3 style={{ fontSize: "1.15rem", fontWeight: 700, margin: "0 0 0.5rem", color: "#fff" }}>{s.title}</h3>
              <p style={{ margin: 0, color: palette.muted, fontSize: "0.92rem", lineHeight: 1.6 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 07 & 08 — Proof & Governed Execution with Human Oversight */}
      <section id="proof" style={{ padding: "clamp(4rem, 8vw, 6rem) clamp(1.25rem, 4vw, 4rem)" }}>
        <SectionHeading
          kicker="Governed Execution Standard"
          title="Automated When Predictable. Human When It Matters."
          sub="We design AI systems that respect operational boundaries. Here is exactly what is automated versus escalated."
        />

        <div style={{
          maxWidth: 980,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "1.5rem"
        }}>
          {/* Automated Column */}
          <div style={{
            padding: "1.8rem",
            borderRadius: 18,
            border: "1px solid rgba(117, 244, 171, 0.25)",
            background: "rgba(117, 244, 171, 0.03)"
          }}>
            <h3 style={{ color: "#75f4ab", fontSize: "1.1rem", fontWeight: 800, margin: "0 0 1rem" }}>
              ✔ What GARUDA Autonomously Handles:
            </h3>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.6rem", color: "#d1d5db", fontSize: "0.9rem" }}>
              <li>• Instant 24/7 reply to repetitive inquiries in under 45 seconds</li>
              <li>• Patient symptom &amp; urgency triage based on clinical keywords</li>
              <li>• Lead qualification (budget, scope, timeline verification)</li>
              <li>• Structured task logging &amp; CRM record creation</li>
              <li>• Automated payment link generation &amp; receipt issuance</li>
            </ul>
          </div>

          {/* Escalation Column */}
          <div style={{
            padding: "1.8rem",
            borderRadius: 18,
            border: "1px solid rgba(248, 113, 113, 0.25)",
            background: "rgba(248, 113, 113, 0.03)"
          }}>
            <h3 style={{ color: "#f87171", fontSize: "1.1rem", fontWeight: 800, margin: "0 0 1rem" }}>
              ⚠️ What Triggers Human Escalation:
            </h3>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.6rem", color: "#d1d5db", fontSize: "0.9rem" }}>
              <li>• Medical emergencies, acute clinical distress, or trauma</li>
              <li>• Angry or emotionally distressed customer communications</li>
              <li>• Custom enterprise requests outside established rule boundaries</li>
              <li>• Payment disputes or manual refund authorizations</li>
              <li>• Any scenario where human clinical or legal judgment is required</li>
            </ul>
          </div>
        </div>
      </section>

      {/* 09 — High-Intent FAQ (SEO Schema Ready) */}
      <section id="faq" style={{ padding: "clamp(4rem, 8vw, 6rem) clamp(1.25rem, 4vw, 4rem)", background: "rgba(255, 255, 255, 0.015)" }}>
        <SectionHeading
          kicker="Frequently Asked Questions"
          title="Clear Answers on Setup, Pricing &amp; Compliance"
          sub="Everything you need to know before putting an autonomous system into production."
        />

        <div style={{ maxWidth: 840, margin: "0 auto", display: "flex", flexDirection: "column", gap: "0.85rem" }}>
          {[
            {
              q: "How much does a WhatsApp AI receptionist cost?",
              a: "Our Next.js 14 source code starter kit is $49 (₹3,999) one-time with full source code ownership. Done-for-you turnkey clinic or business setup starts at $199 (₹9,999). For larger enterprise systems, we provide custom milestone-based quotes."
            },
            {
              q: "Can GARUDA book clinic appointments automatically?",
              a: "Yes. GARUDA automatically triages patient urgency, checks clinic hours, reserves slots, and immediately alerts human staff if acute symptoms or emergencies are detected."
            },
            {
              q: "What is included in the Next.js 14 Starter Kit?",
              a: "You receive 17 verified source files: Next.js 14 App Router, Meta WhatsApp Cloud API webhook handler, Supabase database schema, Gemini 2.5 triage logic, and Razorpay/Stripe billing code."
            },
            {
              q: "How does the 50/50 milestone payment structure work?",
              a: "For custom client projects, 50% is paid upfront to initiate technical architecture and staging deployment. The remaining 50% is released only after you verify the working demonstration on staging."
            },
            {
              q: "Is WhatsApp Cloud API compliance guaranteed?",
              a: "Yes. All integrations use the official Meta WhatsApp Business Platform (Cloud API), ensuring full opt-in compliance without risking account suspension."
            }
          ].map((item, idx) => (
            <div
              key={item.q}
              style={{
                borderRadius: 14,
                border: "1px solid rgba(245,215,110,0.14)",
                background: palette.panelSoft,
                overflow: "hidden"
              }}
            >
              <button
                type="button"
                onClick={() => toggleFaq(idx)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "1.2rem 1.4rem",
                  background: "none",
                  border: "none",
                  color: "#ffffff",
                  fontSize: "1rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}
              >
                <span>{item.q}</span>
                <span style={{ color: palette.gold, fontSize: "1.2rem", transform: openFaq === idx ? "rotate(45deg)" : "none", transition: "transform 0.16s ease" }}>
                  +
                </span>
              </button>
              {openFaq === idx && (
                <div style={{ padding: "0 1.4rem 1.2rem", color: palette.muted, fontSize: "0.92rem", lineHeight: 1.65, borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "0.8rem" }}>
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 10 — Project Scope Request Intake */}
      <section id="project-scope" style={{ padding: "clamp(4rem, 8vw, 6rem) clamp(1.25rem, 4vw, 4rem)", position: "relative" }}>
        <SectionHeading
          kicker="Start Your Deployment"
          title="Direct Founder Scoping &amp; System Briefing"
          sub="Submit your business requirements below to receive a structured scope brief and timeline directly from Praveen Mahawar."
        />
        <ProjectScopeForm />
      </section>

      {/* 11 — Progressive Disclosure: Deep Ecosystem Directory */}
      <section id="ecosystem" style={{ padding: "2.5rem clamp(1.25rem, 4vw, 4rem)", borderTop: "1px solid rgba(245,215,110,0.1)", background: "rgba(3,7,18,0.7)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h4 style={{ color: "#ffffff", margin: "0 0 0.3rem", fontSize: "1rem", fontWeight: 700 }}>
              Technical Depth &amp; Autonomous Workspaces
            </h4>
            <p style={{ margin: 0, color: "#8d95a7", fontSize: "0.85rem" }}>
              Explore GARUDA's specialized studios and developer environments.
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
            <button type="button" onClick={() => navigate("/pawan")} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(245,215,110,0.2)", color: palette.gold, padding: "0.4rem 0.9rem", borderRadius: 8, fontSize: "0.8rem", cursor: "pointer", fontWeight: 700 }}>
              ⚡ PAWAN Coding Studio
            </button>
            <button type="button" onClick={() => navigate("/scholar")} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(56,189,248,0.2)", color: "#38bdf8", padding: "0.4rem 0.9rem", borderRadius: 8, fontSize: "0.8rem", cursor: "pointer", fontWeight: 700 }}>
              🎓 Vidya Studio
            </button>
            <button type="button" onClick={() => navigate("/dost")} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(16,185,129,0.2)", color: "#34d399", padding: "0.4rem 0.9rem", borderRadius: 8, fontSize: "0.8rem", cursor: "pointer", fontWeight: 700 }}>
              🌾 GARUDA DOST
            </button>
            <button type="button" onClick={() => navigate("/case-studies")} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", padding: "0.4rem 0.9rem", borderRadius: 8, fontSize: "0.8rem", cursor: "pointer", fontWeight: 700 }}>
              📋 Case Studies
            </button>
          </div>
        </div>
      </section>

      {/* Crawlable Footer */}
      <footer style={{ padding: "3rem clamp(1.25rem, 4vw, 4rem) 2rem", borderTop: "1px solid rgba(245,215,110,0.1)", background: "rgba(3,7,18,0.95)", color: "#9ca3af", fontSize: "0.85rem", lineHeight: 1.7 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "2rem", marginBottom: "2rem", textAlign: "left" }}>
          <div>
            <h4 style={{ color: palette.gold, margin: "0 0 0.8rem 0", fontSize: "0.95rem", fontWeight: 800 }}>GARUDA OS</h4>
            <p style={{ margin: 0, lineHeight: 1.6, color: "#6b7280" }}>
              Autonomous AI Operating System and commercial software engineering practice. Founded and architected by Praveen Mahawar. Official Portal: https://www.garudaos.in.
            </p>
          </div>
          <div>
            <h4 style={{ color: "#ffffff", margin: "0 0 0.8rem 0", fontSize: "0.9rem", fontWeight: 700 }}>Commercial Products</h4>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              <li><a href="/starter" style={{ color: palette.gold, textDecoration: "none", fontWeight: 700 }}>Next.js 14 AI Starter Kit ($49)</a></li>
              <li><a href="/whatsapp-bot" style={{ color: "#9ca3af", textDecoration: "none" }}>WhatsApp AI Receptionist</a></li>
              <li><a href="/pricing" style={{ color: "#9ca3af", textDecoration: "none" }}>Transparent Pricing</a></li>
              <li><a href="/billing" style={{ color: "#9ca3af", textDecoration: "none" }}>GARUDA Billing Engine</a></li>
            </ul>
          </div>
          <div>
            <h4 style={{ color: "#ffffff", margin: "0 0 0.8rem 0", fontSize: "0.9rem", fontWeight: 700 }}>Engineering Services</h4>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              <li><a href="/services/whatsapp-telegram-ai-bots" style={{ color: "#9ca3af", textDecoration: "none" }}>WhatsApp Automation Bots</a></li>
              <li><a href="/services/ai-agent-development" style={{ color: "#9ca3af", textDecoration: "none" }}>Autonomous AI Agents</a></li>
              <li><a href="/services/custom-software-development" style={{ color: "#9ca3af", textDecoration: "none" }}>Custom Software Engineering</a></li>
              <li><a href="/services/saas-mvp-development" style={{ color: "#9ca3af", textDecoration: "none" }}>SaaS MVP Development</a></li>
            </ul>
          </div>
          <div>
            <h4 style={{ color: "#ffffff", margin: "0 0 0.8rem 0", fontSize: "0.9rem", fontWeight: 700 }}>Platform &amp; Governance</h4>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              <li><a href="/what-is-garuda-ai" style={{ color: "#9ca3af", textDecoration: "none" }}>What is GARUDA AI?</a></li>
              <li><a href="/case-studies" style={{ color: "#9ca3af", textDecoration: "none" }}>Verified Case Studies</a></li>
              <li><a href="/garuda-ai-vs-garuda-linux" style={{ color: "#9ca3af", textDecoration: "none" }}>GARUDA AI vs Garuda Linux</a></li>
              <li><a href="/guides" style={{ color: palette.gold, textDecoration: "none", fontWeight: 600 }}>Engineering &amp; AI Guides →</a></li>
              <li><a href="/chat" style={{ color: "#9ca3af", textDecoration: "none" }}>Talk to AI Architect</a></li>
              <li>
                <button type="button" onClick={onFounderLogin} style={{ background: "none", border: "none", color: palette.gold, cursor: "pointer", fontSize: "inherit", padding: 0, textDecoration: "underline" }}>
                  Founder Console →
                </button>
              </li>
            </ul>
          </div>
        </div>
        <div style={{ textAlign: "center", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "1.5rem", color: "#8d95a7", display: "flex", flexDirection: "column", gap: "0.5rem", alignItems: "center" }}>
          <div>
            © {new Date().getFullYear()} GARUDA AI Operating System. Built for deterministic, governed custom software and AI operations.
          </div>
          <div style={{ display: "flex", gap: "1.2rem", fontSize: "0.85rem", flexWrap: "wrap", justifyContent: "center" }}>
            <a href="/praveen-mahawar" style={{ color: palette.gold, textDecoration: "none", fontWeight: 700 }}>Praveen Mahawar (Founder)</a>
            <span style={{ color: "rgba(255,255,255,0.2)" }}>•</span>
            <a href="/privacy" style={{ color: palette.gold, textDecoration: "none" }}>Privacy Policy</a>
            <span style={{ color: "rgba(255,255,255,0.2)" }}>•</span>
            <a href="/terms" style={{ color: palette.gold, textDecoration: "none" }}>Terms of Service</a>
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp Business Inquiry CTA */}
      <WhatsAppQuickCTA />
    </div>
  );
}