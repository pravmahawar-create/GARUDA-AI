import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import BrandAssetImage from "../components/BrandAssetImage";
import SEOHead from "../components/SEOHead";
import ProjectScopeForm from "../components/ProjectScopeForm";
import WhatsAppQuickCTA from "../components/WhatsAppQuickCTA";
import { trackEvent } from "../utils/telemetry";
import { getPublicUniverses } from "../config/universes";

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

const PAYMENT_URL = (import.meta.env.VITE_PAYMENT_URL || "https://razorpay.me/@garudaosincompany").trim();

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.5, ease: "easeOut" }
};

const SectionHeading = ({ kicker, title, sub }) => (
  <motion.div {...fadeUp} style={{ textAlign: "center", maxWidth: 720, margin: "0 auto 3.5rem" }}>
    <p style={{ color: palette.gold, letterSpacing: "0.18em", fontSize: "0.78rem", fontWeight: 700, margin: "0 0 0.9rem", textTransform: "uppercase" }}>{kicker}</p>
    <h2 style={{ fontSize: "clamp(1.9rem, 3.4vw, 2.6rem)", fontWeight: 800, lineHeight: 1.15, margin: 0 }}>{title}</h2>
    {sub && <p style={{ color: palette.muted, fontSize: "1.05rem", lineHeight: 1.65, margin: "1rem auto 0", maxWidth: 640 }}>{sub}</p>}
  </motion.div>
);

const Pillar = [
  { icon: "◈", title: "Automation", desc: "Turn repeatable work into governed workflows: documents, approvals, handoffs, and follow-ups run on defined rules you control." },
  { icon: "✉", title: "Communication", desc: "Professional client and team communication — enquiries, updates, scheduling, and replies — drafted and sent under founder oversight." },
  { icon: "▣", title: "Operations", desc: "A single operating rhythm for tasks, pipelines, deadlines, and escalations, coordinated across your business." },
  { icon: "◎", title: "Customer Support", desc: "Consistent, always-on support for common questions and issues, routed to humans whenever judgement is needed." },
  { icon: "◈", title: "Analytics", desc: "Live views of leads, revenue, delivery, and performance built from your own records — no guesswork, no black box." },
  { icon: "▤", title: "Knowledge Management", desc: "Your policies, rates, history, and decisions become a private, retrievable knowledge base that compounds with use." },
  { icon: "⚙", title: "Monitoring & Alerts", desc: "Watch deadlines, payments, inventory, and commitments; get notified before small problems become client-facing issues." },
  { icon: "☰", title: "Productivity", desc: "One command center for notes, meetings, tasks, and reporting — so founders and teams work from a single source of truth." }
];

const workflows = [
  { step: "01", title: "Lead arrives", desc: "An enquiry lands from your website, directory, or referral. GARUDA captures it with source, context, and priority." },
  { step: "02", title: "GARUDA replies", desc: "A professional, on-brand response is drafted from your knowledge base and sent after your approval — within minutes, not days." },
  { step: "03", title: "Task created", desc: "Qualified enquiries become tracked tasks with owners, due dates, and next steps in your operations queue." },
  { step: "04", title: "Payment verified", desc: "When a deal closes, the payment link, receipt, and settlement are verified and logged — income is real and traceable." },
  { step: "05", title: "Delivery tracked", desc: "Work is tracked against the agreed scope with evidence at every step, so delivery status is visible to you at all times." },
  { step: "06", title: "Founder notified", desc: "You stay in control: every significant action is summarized for review, approval, or one-tap sign-off." }
];

const industries = [
  "Hotels & Hospitality", "Hospitals & Clinics", "CA & Accounting Firms", "Law Offices & Legal", "Schools & Coaching Institutes",
  "Retail & Stores", "Real Estate & Property", "Factories & Manufacturing", "Warehouses & Logistics", "Restaurants & Cafés",
  "Dental & Diagnostics Labs", "Gyms & Wellness Centers", "Salons & Spas", "Travel & Tour Operators", "Event & Wedding Management",
  "Architecture & Interiors", "Insurance Agencies", "Financial Advisory Firms", "Digital Marketing Agencies", "IT Services & SaaS",
  "Pharmacy & Chemist", "Distribution & Trading", "Freight & Fleet Operators", "Agri-Business & FPOs", "Co-working Spaces",
  "Housing Societies & Property Mgmt", "NGOs & Social Enterprises", "Media, Publishing & Agencies", "Auto Service & Garages", "Veterinary & Pet Care"
];

const metrics = [
  { value: "48h", label: "typical time-to-first-reply before onboarding", highlight: false },
  { value: "3–5×", label: "faster enquiry follow-up with templates + review", highlight: true },
  { value: "100%", label: "of payments logged with verification evidence", highlight: false },
  { value: "1", label: "command center instead of scattered tools", highlight: true }
];

const verifiedExamples = [
  { icon: "✉", stat: "Enquiries answered", detail: "Every client question gets a tracked, professional response — none lost in inboxes." },
  { icon: "◈", stat: "Follow-ups on schedule", detail: "Quotes and proposals are followed up on time, with founder review of every send." },
  { icon: "☰", stat: "Tasks with owners & deadlines", detail: "Work has a status, an assignee, and a due date — nothing falls through the cracks." },
  { icon: "⚙", stat: "Payments verified & logged", detail: "Revenue records carry provider, amount, and settlement evidence for full traceability." }
];

const controls = [
  { icon: "🛡", title: "Founder approval gates", desc: "Significant actions pause for your review. Nothing ships or sends without a decision you can see." },
  { icon: "🔒", title: "Private by design", desc: "Your knowledge, records, and conversations stay yours. GARUDA does not train on your data or share it." },
  { icon: "✎", title: "Full audit trail", desc: "Every automated action leaves a verifiable record — who did what, when, and why it happened." },
  { icon: "⛔", title: "Ethical-by-default", desc: "GARUDA is built for legitimate business work. No deception, no fabricated activity, no shortcuts." }
];

const engineeringProofs = [
  { title: "Governed Multi-Agent Engine", subtitle: "Deterministic State Transitions", icon: "◈" },
  { title: "Cryptographic Release Manifests", subtitle: "SHA-256 Verified Artifacts", icon: "🛡" },
  { title: "100% Truth Law Enforcement", subtitle: "Zero-Fabrication Architecture", icon: "⚖" },
  { title: "17 Automated QA Suites", subtitle: "100% Passing Regression Tests", icon: "⚙" },
  { title: "Direct Founder Oversight", subtitle: "Praveen Mahawar · Principal Architect", icon: "⚡" },
  { title: "Multi-Cloud High Availability", subtitle: "Vercel Edge + Render Microservices", icon: "☁" }
];

const WorkflowStep = ({ item, index }) => (
  <motion.div
    {...fadeUp}
    transition={{ ...fadeUp.transition, delay: index * 0.08 }}
    style={{ display: "flex", gap: "1.1rem", alignItems: "flex-start", padding: "1.2rem 1.4rem", borderRadius: 14, border: "1px solid rgba(245,215,110,0.12)", background: palette.panelSoft }}
  >
    <span style={{ fontFamily: "ui-monospace, monospace", color: palette.gold, fontWeight: 800, fontSize: "1rem", minWidth: "2.4rem" }}>{item.step}</span>
    <div>
      <h4 style={{ margin: "0 0 0.3rem", fontSize: "1.05rem", fontWeight: 700, color: palette.text }}>{item.title}</h4>
      <p style={{ margin: 0, color: palette.muted, fontSize: "0.92rem", lineHeight: 1.55 }}>{item.desc}</p>
    </div>
  </motion.div>
);

const PipelineBar = ({ step, label }) => (
  <div style={{ flex: 1, minWidth: 120, textAlign: "center" }}>
    <div style={{
      height: 8,
      borderRadius: 999,
      background: step === "done" ? "linear-gradient(90deg, #f5d76e, #b8860b)" : "rgba(245,215,110,0.12)",
      boxShadow: step === "done" ? "0 0 12px rgba(245,215,110,0.3)" : "none"
    }} />
    <div style={{ fontSize: "0.72rem", color: step === "done" ? palette.gold : palette.muted, marginTop: "0.5rem", fontWeight: step === "done" ? 700 : 500 }}>{label}</div>
  </div>
);

export default function PublicLanding({ onGetStarted, onFounderLogin }) {
  const navigate = useNavigate();
  const publicUniverses = getPublicUniverses();

  return (
    <div style={{ minHeight: "100vh", background: palette.bg, color: palette.text, fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif" }}>
      <SEOHead
        title="GARUDA AI Operating System | Custom AI & Software Engineering"
        description="GARUDA is an autonomous AI Operating System delivering custom AI systems, web applications, SaaS MVPs, automated workflows, and enterprise software worldwide."
        canonical="https://www.garudaos.in/"
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
            <h2 style={{ margin: 0, fontSize: "1.35rem", fontWeight: 800, letterSpacing: "0.12em", color: "#ffffff" }}>GARUDA</h2>
            <span style={{ fontSize: "0.7rem", background: "rgba(245,215,110,0.14)", color: palette.gold, padding: "0.2rem 0.55rem", borderRadius: 4, fontWeight: 700, letterSpacing: "0.08em" }}>AI OS</span>
          </span>
        </button>
        <nav style={{ display: "flex", alignItems: "center", gap: "clamp(0.8rem, 2vw, 1.8rem)" }}>
          <button type="button" onClick={() => navigate("/what-is-garuda-ai")} style={{ background: "none", border: "none", color: palette.gold, cursor: "pointer", fontSize: "0.92rem", fontWeight: 700 }}>What is GARUDA AI?</button>
          <a href="#platform" style={{ color: "#9ca3af", textDecoration: "none", fontSize: "0.92rem" }}>Platform</a>
          <a href="#capabilities" style={{ color: "#9ca3af", textDecoration: "none", fontSize: "0.92rem" }}>Capabilities</a>
          <a href="#workflow" style={{ color: "#9ca3af", textDecoration: "none", fontSize: "0.92rem" }}>Workflow</a>
          <a href="#industries" style={{ color: "#9ca3af", textDecoration: "none", fontSize: "0.92rem" }}>Industries</a>
          <a href="#security" style={{ color: "#9ca3af", textDecoration: "none", fontSize: "0.92rem" }}>Security</a>
          <button
            type="button"
            onClick={() => navigate("/demo")}
            style={{
              background: "rgba(75, 200, 140, 0.12)",
              border: "1px solid rgba(75, 200, 140, 0.45)",
              color: "#7be8b4",
              borderRadius: 999,
              padding: "0.45rem 1.1rem",
              fontWeight: 700,
              cursor: "pointer",
              fontSize: "0.85rem"
            }}
          >
            Live Demo
          </button>
          <button
            type="button"
            onClick={() => navigate("/pawan")}
            style={{
              background: "rgba(212, 175, 55, 0.12)",
              border: "1px solid rgba(245, 215, 110, 0.35)",
              color: palette.gold,
              borderRadius: 999,
              padding: "0.45rem 1.1rem",
              fontWeight: 700,
              cursor: "pointer",
              fontSize: "0.85rem"
            }}
          >
            ⚡ PAWAN Studio
          </button>
          <button
            type="button"
            onClick={onGetStarted}
            style={{
              background: "linear-gradient(135deg, #f5d76e 0%, #b8860b 100%)",
              color: "#05070b",
              border: "none",
              padding: "0.5rem 1.25rem",
              borderRadius: 999,
              fontWeight: 800,
              cursor: "pointer",
              fontSize: "0.85rem",
              boxShadow: "0 4px 16px rgba(245,215,110,0.2)"
            }}
          >
            Get Started
          </button>

          {/* 👑 SUPREME FOUNDER COCKPIT (PROMINENT VIP BUTTON) */}
          <button
            type="button"
            onClick={onFounderLogin}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.45rem",
              background: "linear-gradient(135deg, #2a1f04 0%, #4a370b 50%, #1a1303 100%)",
              border: "2px solid #f5d76e",
              color: "#fff",
              borderRadius: 999,
              padding: "0.52rem 1.35rem",
              fontWeight: 900,
              cursor: "pointer",
              fontSize: "0.88rem",
              letterSpacing: "0.04em",
              boxShadow: "0 0 25px rgba(245, 215, 110, 0.45), inset 0 1px 0 rgba(255,255,255,0.2)"
            }}
          >
            <span style={{ fontSize: "1.05rem" }}>👑</span> Founder Cockpit
          </button>
        </nav>
      </header>

      {/* 1. Hero Section */}
      <section style={{ position: "relative", overflow: "hidden", padding: "clamp(5rem, 10vw, 8rem) clamp(1.25rem, 4vw, 4rem)", textAlign: "center" }}>
        <div style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 50% 0%, rgba(245,215,110,0.14), transparent 42%)," +
            "radial-gradient(circle at 82% 28%, rgba(125,211,252,0.07), transparent 30%)," +
            "radial-gradient(circle at 12% 34%, rgba(245,215,110,0.06), transparent 28%)"
        }} />
        <motion.div {...fadeUp} style={{ position: "relative", maxWidth: 860, margin: "0 auto" }}>
          <div style={{ width: 108, height: 108, margin: "0 auto 1.4rem", borderRadius: "50%", overflow: "hidden", background: "radial-gradient(circle, rgba(245,215,110,0.18), rgba(5,8,14,0.95))", border: "2px solid rgba(245,215,110,0.4)", boxShadow: "0 0 48px rgba(245,215,110,0.28)", padding: 10 }}>
            <BrandAssetImage kind="branding" alt="GARUDA sigil" style={{ width: "100%", height: "100%", objectFit: "contain", display: "block", borderRadius: "50%" }} />
          </div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.45rem 1rem", borderRadius: 999, border: "1px solid rgba(245,215,110,0.3)", background: "rgba(245,215,110,0.06)", color: palette.gold, fontSize: "0.8rem", fontWeight: 700, letterSpacing: "0.1em", marginBottom: "1.75rem" }}>
            AI OPERATING SYSTEM FOR BUSINESSES & PROFESSIONALS
          </div>
          <h1 style={{ fontSize: "clamp(2.6rem, 6vw, 4.4rem)", fontWeight: 800, lineHeight: 1.08, margin: "0 0 1.5rem", letterSpacing: "-0.02em" }}>
            One Command.<br />
            <span style={{ background: "linear-gradient(120deg, #f5d76e, #ffdf8a 55%, #b8860b)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>Infinite Intelligence.</span>
          </h1>
          <p style={{ color: palette.muted, fontSize: "clamp(1.05rem, 2vw, 1.25rem)", lineHeight: 1.7, maxWidth: 680, margin: "0 auto 2.25rem" }}>
            GARUDA runs the operating layer of a business — automation, communication, operations, analytics, knowledge, monitoring, and support — under founder control.
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: "1.2rem", flexWrap: "wrap" }}>
            <button
              onClick={() => {
                trackEvent("primary_cta_click", { location: "hero" });
                document.getElementById("project-scope")?.scrollIntoView({ behavior: "smooth" });
              }}
              style={{
                background: "linear-gradient(135deg, #f5d76e 0%, #b8860b 100%)",
                color: "#05070b",
                border: "none",
                padding: "1rem 2.6rem",
                borderRadius: 999,
                fontWeight: 800,
                fontSize: "1.05rem",
                cursor: "pointer",
                boxShadow: "0 12px 32px rgba(245,215,110,0.25)"
              }}
            >
              Get Project Scope →
            </button>
            <button
              onClick={() => {
                trackEvent("secondary_cta_click", { location: "hero" });
                navigate("/chat");
              }}
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(245,215,110,0.35)",
                color: palette.gold,
                padding: "1rem 2.4rem",
                borderRadius: 999,
                fontWeight: 700,
                fontSize: "1rem",
                cursor: "pointer"
              }}
            >
              Talk to AI Architect →
            </button>
            <button
              onClick={() => {
                trackEvent("scholar_cta_click", { location: "hero" });
                navigate("/scholar");
              }}
              style={{
                background: "linear-gradient(135deg, rgba(56, 189, 248, 0.15) 0%, rgba(212, 175, 55, 0.15) 100%)",
                border: "1px solid rgba(56, 189, 248, 0.5)",
                color: "#38bdf8",
                padding: "1rem 2.2rem",
                borderRadius: 999,
                fontWeight: 800,
                fontSize: "1rem",
                cursor: "pointer",
                boxShadow: "0 8px 24px rgba(56,189,248,0.15)"
              }}
            >
              🎓 Vidya Studio (Free) →
            </button>
          </div>
          <p style={{ color: "#5b6472", fontSize: "0.85rem", marginTop: "2rem", letterSpacing: "0.04em" }}>
            Founders stay in control of every significant action. No shortcuts. No fabricated activity.
          </p>
        </motion.div>
      </section>

      {/* 2. Architectural Proof & Engineering Governance */}
      <section style={{ padding: "2.5rem clamp(1.25rem, 4vw, 4rem) 3.5rem", borderTop: "1px solid rgba(245,215,110,0.08)", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
        <motion.p {...fadeUp} style={{ textAlign: "center", color: palette.gold, fontSize: "0.78rem", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: "1.75rem" }}>
          Architectural Proof & Engineering Governance
        </motion.p>
        <motion.div {...fadeUp} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1.2rem", maxWidth: 1100, margin: "0 auto" }}>
          {engineeringProofs.map((proof) => (
            <div
              key={proof.title}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.9rem",
                padding: "0.95rem 1.25rem",
                borderRadius: "12px",
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(245,215,110,0.12)"
              }}
            >
              <span style={{ color: palette.gold, fontSize: "1.4rem" }}>{proof.icon}</span>
              <div>
                <div style={{ color: "#ffffff", fontSize: "0.92rem", fontWeight: 700 }}>{proof.title}</div>
                <div style={{ color: "#8d95a7", fontSize: "0.78rem" }}>{proof.subtitle}</div>
              </div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* 3. What GARUDA actually does */}
      <section id="platform" style={{ padding: "clamp(4rem, 8vw, 6rem) clamp(1.25rem, 4vw, 4rem)" }}>
        <SectionHeading
          kicker="What GARUDA actually does"
          title="Real workflows, not promises"
          sub="GARUDA runs defined, repeatable business processes and makes their status visible to you. Here is how the work actually flows."
        />
        <motion.div {...fadeUp} style={{ maxWidth: 940, margin: "0 auto" }}>
          <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>
            {workflows.map((item, index) => <WorkflowStep key={item.step} item={item} index={index} />)}
          </div>
        </motion.div>
      </section>

      {/* 4. The 8 capability pillars */}
      <section id="capabilities" style={{ padding: "clamp(4rem, 8vw, 6rem) clamp(1.25rem, 4vw, 4rem)", background: "rgba(255,255,255,0.015)" }}>
        <SectionHeading
          kicker="The 8 capability pillars"
          title="An operating system, not a chatbot"
          sub="Eight governed capabilities work together so a business can run its operations, communication, and knowledge from one place."
        />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.4rem", maxWidth: 1120, margin: "0 auto" }}>
          {Pillar.map((item, index) => (
            <motion.div
              key={item.title}
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: (index % 4) * 0.06 }}
              style={{ padding: "1.75rem", borderRadius: 18, border: "1px solid rgba(245,215,110,0.12)", background: palette.panelSoft }}
            >
              <div style={{ width: 48, height: 48, display: "grid", placeItems: "center", borderRadius: 14, background: "rgba(245,215,110,0.1)", color: palette.gold, fontSize: "1.5rem", marginBottom: "1.1rem" }}>{item.icon}</div>
              <h3 style={{ margin: "0 0 0.6rem", fontSize: "1.15rem", fontWeight: 700 }}>{item.title}</h3>
              <p style={{ margin: 0, color: palette.muted, fontSize: "0.92rem", lineHeight: 1.6 }}>{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 5. Live workflow demo */}
      <section id="workflow" style={{ padding: "clamp(4rem, 8vw, 6rem) clamp(1.25rem, 4vw, 4rem)" }}>
        <SectionHeading
          kicker="Workflow demo"
          title="From lead to notified founder"
          sub="Watch one enquiry travel through the operating system: reply, task, payment, delivery, and founder sign-off."
        />
        <motion.div {...fadeUp} style={{ maxWidth: 1080, margin: "0 auto", padding: "2rem", borderRadius: 24, border: "1px solid rgba(245,215,110,0.16)", background: "linear-gradient(160deg, rgba(245,215,110,0.05), rgba(11,15,22,0.9))" }}>
          <div style={{ display: "flex", gap: "0.4rem", marginBottom: "1.75rem" }}>
            {["done", "done", "done", "done", "done", "active"].map((step, i) => (
              <PipelineBar key={i} step={step} label={["Lead", "Reply", "Task", "Payment", "Delivery", "Notify"][i]} />
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.1rem" }}>
            <div style={{ padding: "1.2rem", borderRadius: 14, border: "1px solid rgba(245,215,110,0.12)", background: "rgba(11,15,22,0.7)" }}>
              <div style={{ fontSize: "0.72rem", color: palette.muted, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "0.6rem" }}>Enquiry received</div>
              <div style={{ fontSize: "0.95rem", color: palette.text }}>"Need a website for my practice — what do you charge?"</div>
              <div style={{ fontSize: "0.78rem", color: palette.muted, marginTop: "0.6rem" }}>Source: website · 09:41</div>
            </div>
            <div style={{ padding: "1.2rem", borderRadius: 14, border: "1px solid rgba(245,215,110,0.12)", background: "rgba(11,15,22,0.7)" }}>
              <div style={{ fontSize: "0.72rem", color: palette.muted, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "0.6rem" }}>GARUDA reply (draft)</div>
              <div style={{ fontSize: "0.95rem", color: palette.text }}>"Thanks for reaching out. We can share a fixed quote after a short scope call — here's what we deliver..."</div>
              <div style={{ fontSize: "0.78rem", color: palette.gold, marginTop: "0.6rem" }}>✓ Approved by founder · 09:44</div>
            </div>
            <div style={{ padding: "1.2rem", borderRadius: 14, border: "1px solid rgba(245,215,110,0.12)", background: "rgba(11,15,22,0.7)" }}>
              <div style={{ fontSize: "0.72rem", color: palette.muted, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "0.6rem" }}>Payment verified</div>
              <div style={{ fontSize: "0.95rem", color: palette.text }}>₹45,000 · Razorpay</div>
              <div style={{ fontSize: "0.78rem", color: palette.green, marginTop: "0.6rem" }}>✓ Verified · settlement logged</div>
            </div>
            <div style={{ padding: "1.2rem", borderRadius: 14, border: "1px solid rgba(245,215,110,0.12)", background: "rgba(11,15,22,0.7)" }}>
              <div style={{ fontSize: "0.72rem", color: palette.muted, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "0.6rem" }}>Delivery tracked</div>
              <div style={{ fontSize: "0.95rem", color: palette.text }}>Task: Build landing page</div>
              <div style={{ fontSize: "0.78rem", color: palette.blue, marginTop: "0.6rem" }}>● In progress · ETA Fri</div>
            </div>
            <div style={{ padding: "1.2rem", borderRadius: 14, border: "1px solid rgba(245,215,110,0.12)", background: "rgba(11,15,22,0.7)" }}>
              <div style={{ fontSize: "0.72rem", color: palette.muted, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "0.6rem" }}>Founder notified</div>
              <div style={{ fontSize: "0.95rem", color: palette.text }}>1 action awaiting review</div>
              <div style={{ fontSize: "0.78rem", color: palette.gold, marginTop: "0.6rem" }}>→ Review now</div>
            </div>
          </div>
          <p style={{ color: palette.muted, fontSize: "0.78rem", textAlign: "center", margin: "1.2rem 0 0" }}>
            Illustrative example — the enquiry, amount, and tasks above are a concept preview, not a real transaction.
          </p>
        </motion.div>
      </section>

      {/* 6. Universe architecture teaser */}
      <section id="control-center" style={{ padding: "clamp(4rem, 8vw, 6rem) clamp(1.25rem, 4vw, 4rem)", background: "rgba(255,255,255,0.015)" }}>
        <SectionHeading
          kicker="Universe architecture"
          title="One system, 27 universes"
          sub="16 universes power what customers see and feel. 11 founder-internal universes run the intelligence behind it — every universe reports into Revenue, the reporting hub."
        />
        <motion.div {...fadeUp} style={{ maxWidth: 1080, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: "1rem" }}>
            {publicUniverses.map((u) => (
              <div
                key={u.num}
                style={{ padding: "1.2rem", borderRadius: 16, border: "1px solid rgba(245,215,110,0.14)", background: "rgba(11,15,22,0.7)" }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.6rem" }}>
                  <span style={{ fontSize: "1.3rem" }}>{u.icon}</span>
                  <span style={{ fontFamily: "ui-monospace, monospace", color: palette.gold, fontWeight: 800, fontSize: "0.72rem" }}>{String(u.num).padStart(2, "0")}</span>
                </div>
                <h4 style={{ margin: "0 0 0.4rem", fontSize: "0.98rem", fontWeight: 700 }}>{u.name.replace(" Universe", "")}</h4>
                <p style={{ margin: 0, color: palette.muted, fontSize: "0.78rem", lineHeight: 1.45 }}>{u.tagline}</p>
              </div>
            ))}
          </div>
          <p style={{ color: palette.muted, fontSize: "0.85rem", textAlign: "center", marginTop: "0.4rem" }}>
            11 founder-internal universes (Knowledge, Reasoning, Memory, Learning, Decision, Automation, Communication, Security, Governance, Revenue, Wealth) stay on the founder page.
          </p>
        </motion.div>
      </section>

      {/* 7. Industry examples */}
      <section id="industries" style={{ padding: "clamp(4rem, 8vw, 6rem) clamp(1.25rem, 4vw, 4rem)" }}>
        <SectionHeading
          kicker="Industry examples"
          title="Built for one business, ready for all"
          sub="These are examples, not limits. GARUDA adapts to the shape of any lawful operation — small teams and large enterprises alike."
        />
        <div style={{ maxWidth: 1000, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0.8rem" }}>
          {industries.map((industry) => (
            <div key={industry} style={{ padding: "0.95rem 1.2rem", borderRadius: 12, border: "1px solid rgba(245,215,110,0.14)", background: palette.panelSoft, color: "#d6d3cd", fontSize: "0.92rem", fontWeight: 500 }}>
              {industry}
            </div>
          ))}
        </div>
      </section>

      {/* 8. Verified outcomes */}
      <section id="outcomes" style={{ padding: "clamp(4rem, 8vw, 6rem) clamp(1.25rem, 4vw, 4rem)", background: "rgba(255,255,255,0.015)" }}>
        <SectionHeading
          kicker="Verified outcomes"
          title="Measurable, realistic results"
          sub="GARUDA's value is in verified work and traceable records — not inflated promises. Here is what that looks like in practice."
        />
        <div style={{ maxWidth: 1080, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.2rem", marginBottom: "2.5rem" }}>
            {metrics.map((metric) => (
              <div key={metric.label} style={{ padding: "1.6rem", borderRadius: 16, border: metric.highlight ? "1px solid rgba(245,215,110,0.35)" : "1px solid rgba(245,215,110,0.12)", background: metric.highlight ? "linear-gradient(160deg, rgba(245,215,110,0.12), rgba(11,15,22,0.9))" : palette.panelSoft }}>
                <div style={{ fontSize: "2rem", fontWeight: 800, color: palette.gold, marginBottom: "0.5rem" }}>{metric.value}</div>
                <div style={{ color: palette.muted, fontSize: "0.9rem", lineHeight: 1.5 }}>{metric.label}</div>
              </div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1.2rem" }}>
            {verifiedExamples.map((item) => (
              <div key={item.stat} style={{ padding: "1.5rem", borderRadius: 16, border: "1px solid rgba(245,215,110,0.12)", background: palette.panelSoft }}>
                <div style={{ color: palette.gold, fontSize: "1.4rem", marginBottom: "0.8rem" }}>{item.icon}</div>
                <h4 style={{ margin: "0 0 0.45rem", fontSize: "1.05rem", fontWeight: 700 }}>{item.stat}</h4>
                <p style={{ margin: 0, color: palette.muted, fontSize: "0.9rem", lineHeight: 1.55 }}>{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 9. AI Development Showcase */}
      <section id="ai" style={{ padding: "clamp(4rem, 8vw, 6rem) clamp(1.25rem, 4vw, 4rem)", background: "rgba(255,255,255,0.015)" }}>
        <SectionHeading
          kicker="AI development showcase"
          title="Engineered by AI, governed by you"
          sub="GARUDA's revenue, delivery, and operations systems are built and run by governed AI — here is a live taste you can try right now."
        />
        <motion.div {...fadeUp} style={{ maxWidth: 1080, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.4rem" }}>
          <div style={{ padding: "1.8rem", borderRadius: 20, border: "1px solid rgba(245,215,110,0.16)", background: "linear-gradient(160deg, rgba(245,215,110,0.08), rgba(11,15,22,0.92))" }}>
            <div style={{ width: 44, height: 44, display: "grid", placeItems: "center", borderRadius: 14, background: "rgba(245,215,110,0.12)", marginBottom: "1rem" }}>
              <BrandAssetImage kind="branding" alt="GARUDA" style={{ width: 30, height: 30, objectFit: "contain" }} />
            </div>
            <h3 style={{ margin: "0 0 0.5rem", fontSize: "1.15rem", fontWeight: 700 }}>Public AI Assistant</h3>
            <p style={{ margin: "0 0 1.2rem", color: palette.muted, fontSize: "0.92rem", lineHeight: 1.6 }}>A live conversational AI over the GARUDA knowledge base. Ask anything about the system — no login required.</p>
            <button onClick={() => navigate("/chat")} style={{ background: "linear-gradient(135deg, #f5d76e 0%, #b8860b 100%)", color: "#05070b", border: "none", padding: "0.75rem 1.6rem", borderRadius: 999, fontWeight: 800, fontSize: "0.9rem", cursor: "pointer" }}>Try it now →</button>
          </div>

          <div style={{ padding: "1.8rem", borderRadius: 20, border: "1px solid rgba(245,215,110,0.12)", background: palette.panelSoft }}>
            <div style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>⚙</div>
            <h3 style={{ margin: "0 0 0.5rem", fontSize: "1.15rem", fontWeight: 700 }}>AI Software Engineering</h3>
            <p style={{ margin: 0, color: palette.muted, fontSize: "0.92rem", lineHeight: 1.6 }}>Real repositories planned, implemented, tested, and reviewed by governed AI engineers — every change approval-gated by the founder.</p>
          </div>

          <div style={{ padding: "1.8rem", borderRadius: 20, border: "1px solid rgba(245,215,110,0.12)", background: palette.panelSoft }}>
            <div style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>◈</div>
            <h3 style={{ margin: "0 0 0.5rem", fontSize: "1.15rem", fontWeight: 700 }}>Revenue & Delivery Intelligence</h3>
            <p style={{ margin: 0, color: palette.muted, fontSize: "0.92rem", lineHeight: 1.6 }}>Automated lead verification, fixed-price scoping, payment links, and delivery tracking — every rupee recorded with evidence.</p>
          </div>
        </motion.div>
      </section>

      {/* 9b. Security & founder control */}
      <section id="security" style={{ padding: "clamp(4rem, 8vw, 6rem) clamp(1.25rem, 4vw, 4rem)" }}>
        <SectionHeading
          kicker="Security & founder control"
          title="You stay in command"
          sub="GARUDA is designed so founders always see, approve, and audit what the system does on their behalf."
        />
        <div style={{ maxWidth: 1000, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.4rem" }}>
          {controls.map((item, index) => (
            <motion.div key={item.title} {...fadeUp} transition={{ ...fadeUp.transition, delay: index * 0.07 }} style={{ padding: "1.75rem", borderRadius: 18, border: "1px solid rgba(245,215,110,0.12)", background: palette.panelSoft }}>
              <div style={{ fontSize: "1.6rem", marginBottom: "0.9rem" }}>{item.icon}</div>
              <h3 style={{ margin: "0 0 0.55rem", fontSize: "1.15rem", fontWeight: 700 }}>{item.title}</h3>
              <p style={{ margin: 0, color: palette.muted, fontSize: "0.92rem", lineHeight: 1.6 }}>{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 9c. Commercial Engineering & Service Clusters */}
      <section id="services" style={{ padding: "clamp(4rem, 8vw, 6rem) clamp(1.25rem, 4vw, 4rem)", background: "rgba(255,255,255,0.015)" }}>
        <SectionHeading
          kicker="Engineered Commercial Services"
          title="Bespoke Software, AI & Automation Delivery"
          sub="Fixed-price milestone contracts, transparent deliverable manifests, and complete source code ownership."
        />
        <div style={{ maxWidth: 1120, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.4rem" }}>
          {[
            { slug: "custom-ai-development", title: "Custom AI Development", desc: "Domain-grounded LLM pipelines, bespoke models, and custom tool-calling agents.", tag: "AI & ML", icon: "🧠" },
            { slug: "ai-agent-development", title: "AI Agent Development", desc: "Autonomous supervisor-worker multi-agent graphs executing multi-step business tasks.", tag: "Agentic AI", icon: "🤖" },
            { slug: "custom-software-development", title: "Custom Software Engineering", desc: "Scalable enterprise web applications, robust APIs, and PostgreSQL/MongoDB backends.", tag: "Full Stack", icon: "⚙" },
            { slug: "website-development", title: "Custom Website Development", desc: "Sub-second load times, technical SEO, and conversion-engineered business websites.", tag: "Web", icon: "🌐" },
            { slug: "saas-mvp-development", title: "SaaS MVP Development", desc: "Turn product concepts into production SaaS with authentication & Stripe billing in 2-3 weeks.", tag: "Startups", icon: "🚀" },
            { slug: "business-automation", title: "Business Workflow Automation", desc: "Automate lead capture, invoice sync, and cross-platform CRM integrations with zero data loss.", tag: "Automation", icon: "⚡" },
            { slug: "rag-development", title: "Enterprise RAG Systems", desc: "Hybrid vector search across private enterprise documents with 0% hallucination guarantees.", tag: "RAG & Vector", icon: "📚" },
            { slug: "whatsapp-telegram-ai-bots", title: "WhatsApp & Telegram AI Bots", desc: "24/7 commercial conversational agents formulating instant quotes and checkout links.", tag: "Bots", icon: "💬" }
          ].map((srv) => (
            <a
              key={srv.slug}
              href={`/services/${srv.slug}`}
              style={{
                textDecoration: "none",
                padding: "1.75rem",
                borderRadius: 18,
                border: "1px solid rgba(245,215,110,0.12)",
                background: palette.panelSoft,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                transition: "border-color 0.2s ease, transform 0.2s ease"
              }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                  <span style={{ fontSize: "1.5rem" }}>{srv.icon}</span>
                  <span style={{ fontSize: "0.72rem", background: "rgba(245,215,110,0.1)", color: palette.gold, padding: "0.2rem 0.5rem", borderRadius: 4, fontWeight: 700, textTransform: "uppercase" }}>{srv.tag}</span>
                </div>
                <h3 style={{ margin: "0 0 0.55rem", fontSize: "1.15rem", fontWeight: 700, color: palette.text }}>{srv.title}</h3>
                <p style={{ margin: "0 0 1.2rem 0", color: palette.muted, fontSize: "0.9rem", lineHeight: 1.55 }}>{srv.desc}</p>
              </div>
              <span style={{ color: palette.gold, fontSize: "0.85rem", fontWeight: 700 }}>
                Explore Service & Scoping →
              </span>
            </a>
          ))}
        </div>
      </section>

      {/* 10. Project Scope Request Intake */}
      <section id="project-scope" style={{ padding: "clamp(4rem, 8vw, 6rem) clamp(1.25rem, 4vw, 4rem)", position: "relative" }}>
        <ProjectScopeForm />
      </section>

      {/* Comprehensive Crawlable Footer */}
      <footer style={{ padding: "3rem clamp(1.25rem, 4vw, 4rem) 2rem", borderTop: "1px solid rgba(245,215,110,0.1)", background: "rgba(3,7,18,0.95)", color: "#9ca3af", fontSize: "0.85rem", lineHeight: 1.7 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "2rem", marginBottom: "2rem", textAlign: "left" }}>
          <div>
            <h4 style={{ color: palette.gold, margin: "0 0 0.8rem 0", fontSize: "0.95rem", fontWeight: 800 }}>GARUDA AI</h4>
            <p style={{ margin: 0, lineHeight: 1.6, color: "#6b7280" }}>
              Autonomous AI Operating System and commercial software engineering practice. Founded by Praveen Mahawar. Official Website: https://www.garudaos.in.
            </p>
          </div>
          <div>
            <h4 style={{ color: "#ffffff", margin: "0 0 0.8rem 0", fontSize: "0.9rem", fontWeight: 700 }}>AI & Machine Learning</h4>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              <li><a href="/services/custom-ai-development" style={{ color: "#9ca3af", textDecoration: "none" }}>Custom AI Development</a></li>
              <li><a href="/services/ai-agent-development" style={{ color: "#9ca3af", textDecoration: "none" }}>AI Agent Development</a></li>
              <li><a href="/services/rag-development" style={{ color: "#9ca3af", textDecoration: "none" }}>Enterprise RAG Systems</a></li>
            </ul>
          </div>
          <div>
            <h4 style={{ color: "#ffffff", margin: "0 0 0.8rem 0", fontSize: "0.9rem", fontWeight: 700 }}>Software & Startups</h4>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              <li><a href="/services/saas-mvp-development" style={{ color: "#9ca3af", textDecoration: "none" }}>SaaS MVP Development</a></li>
              <li><a href="/services/custom-software-development" style={{ color: "#9ca3af", textDecoration: "none" }}>Custom Software Development</a></li>
              <li><a href="/services/website-development" style={{ color: "#9ca3af", textDecoration: "none" }}>Custom Website Development</a></li>
            </ul>
          </div>
          <div>
            <h4 style={{ color: "#ffffff", margin: "0 0 0.8rem 0", fontSize: "0.9rem", fontWeight: 700 }}>Automation & Platform</h4>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              <li><a href="/services/business-automation" style={{ color: "#9ca3af", textDecoration: "none" }}>Business Workflow Automation</a></li>
              <li><a href="/services/whatsapp-telegram-ai-bots" style={{ color: "#9ca3af", textDecoration: "none" }}>WhatsApp & Telegram Bots</a></li>
              <li><a href="/pawan" style={{ color: palette.gold, textDecoration: "none", fontWeight: 700 }}>⚡ PAWAN Coding Studio</a></li>
              <li><a href="/bot-verse" style={{ color: "#c084fc", textDecoration: "none", fontWeight: 700 }}>🌌 BOT-VERSE Omni-Channel</a></li>
              <li><a href="/guides" style={{ color: palette.gold, textDecoration: "none", fontWeight: 600 }}>Engineering & AI Guides →</a></li>
              <li><a href="/what-is-garuda-ai" style={{ color: "#9ca3af", textDecoration: "none" }}>What is GARUDA AI?</a></li>
              <li><a href="/chat" style={{ color: "#9ca3af", textDecoration: "none" }}>Talk to AI Architect</a></li>
              <li>
                <button type="button" onClick={onFounderLogin} style={{ background: "none", border: "none", color: palette.gold, cursor: "pointer", fontSize: "inherit", padding: 0, textDecoration: "underline" }}>
                  Founder Console →
                </button>
              </li>
            </ul>
          </div>
        </div>
        <div style={{ textAlign: "center", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "1.5rem", color: "#5b6472" }}>
          © {new Date().getFullYear()} GARUDA AI Operating System. Built for deterministic, governed custom software and AI operations.
        </div>
      </footer>

      {/* Floating WhatsApp Business Inquiry CTA */}
      <WhatsAppQuickCTA />
    </div>
  );
}