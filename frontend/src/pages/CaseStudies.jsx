import React from "react";
import { Link, useNavigate } from "react-router-dom";
import SEOHead from "../components/SEOHead";

const CASES = [
  {
    id: "pawan",
    title: "PAWAN — Sovereign Autonomous Coding Agent",
    status: "VERIFIED",
    statusColor: "#10b981",
    desc: "Multi-model ReAct loop with syntax self-healing, Hindi/English voice control, and live repository synthesis. Executes real software tasks in isolated worktrees with deterministic verification.",
    evidence: ["Live at /pawan — voice command demo", "Multi-model router (Claude/GPT-4o/Gemini)", "Worktree-isolated execution with SHA-256 manifests"],
    link: "/pawan",
    cta: "View PAWAN Studio →"
  },
  {
    id: "botverse",
    title: "BOT-VERSE — Omnichannel Media Engine",
    status: "VERIFIED",
    statusColor: "#10b981",
    desc: "Official YouTube Data API v3 direct push, algorithmic SEO, and multi-platform syndication. Autonomous video generation and publishing pipeline.",
    evidence: ["Official YouTube Data API v3 integration", "Bot-verse studio at /bot-verse", "Cross-platform: YouTube, Instagram, LinkedIn"],
    link: "/bot-verse",
    cta: "View BOT-VERSE →"
  },
  {
    id: "dost",
    title: "GARUDA DOST — Zero-Advance Rozgar Setu",
    status: "VERIFIED",
    statusColor: "#10b981",
    desc: "Livelihood platform enabling rural and urban youth to earn via micro-tools (Cloth GST, local shop PWA) — zero advance, pay-when-you-earn, T+3 Razorpay settlement.",
    evidence: ["Live at /dost — partner onboarding", "Zero-advance model, verified T+3 payout", "Bharat-focused: gaon & kasba first"],
    link: "/dost",
    cta: "View GARUDA DOST →"
  },
  {
    id: "saas-mvp",
    title: "SaaS MVP Engineering — Multi-Tenant Platform",
    status: "PARTIAL",
    statusColor: "#f59e0b",
    desc: "Production SaaS MVPs with auth, RBAC, Stripe/Razorpay billing, and PostgreSQL multi-tenancy. Architecture proven internally; client case studies published only with explicit consent.",
    evidence: ["Pricing & architecture at /pricing", "Internal platform is self-hosted proof", "Client deployments: labelled PLANNED until consent"],
    link: "/services/saas-mvp-development",
    cta: "View SaaS MVP Service →"
  },
  {
    id: "rag",
    title: "Enterprise RAG — Hybrid Vector Search",
    status: "PLANNED",
    statusColor: "#64748b",
    desc: "Hybrid dense-sparse retrieval with pgvector/Qdrant, semantic chunking, and citation grounding. Architecture documented in guides; dedicated proof demo planned.",
    evidence: ["Guide: /guides/rag-systems-architecture-implementation-guide", "Service: /services/rag-development", "Proof demo: PLANNED — not yet published"],
    link: "/guides/rag-systems-architecture-implementation-guide",
    cta: "Read RAG Guide →"
  }
];

export default function CaseStudies() {
  const navigate = useNavigate();
  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "GARUDA AI Case Studies — Verified Deployment Evidence",
    "description": "Verified proof, architecture evidence, and deployment status from GARUDA AI. No fabrication — PLANNED/PARTIAL clearly labelled.",
    "url": "https://www.garudaos.in/case-studies",
    "publisher": { "@type": "Organization", "name": "GARUDA AI", "url": "https://www.garudaos.in" }
  };
  return (
    <div style={{ minHeight: "100vh", background: "#04070a", color: "#f7f2dc", fontFamily: "Inter, sans-serif" }}>
      <SEOHead
        title="GARUDA AI Case Studies | Real Deployments & Engineering Proof | GARUDA"
        description="Verified case studies, architecture diagrams, and deployment evidence from GARUDA AI projects. Real workflows, real code, no fabrication."
        canonical="https://www.garudaos.in/case-studies"
        schema={collectionSchema}
      />
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1.2rem clamp(1.25rem, 4vw, 4rem)", borderBottom: "1px solid rgba(245,215,110,0.12)", background: "rgba(4,7,10,0.9)", position: "sticky", top: 0, zIndex: 50 }}>
        <button onClick={() => navigate("/")} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <span style={{ fontSize: "1.35rem", fontWeight: 900, letterSpacing: "0.12em", color: "#fff" }}>GARUDA</span>
          <span style={{ fontSize: "0.7rem", background: "rgba(245,215,110,0.14)", color: "#f5d76e", padding: "0.2rem 0.55rem", borderRadius: 4, fontWeight: 700 }}>AI OS</span>
        </button>
        <nav style={{ display: "flex", gap: "1.2rem", alignItems: "center" }}>
          <Link to="/what-is-garuda-ai" style={{ color: "#9ca3af", textDecoration: "none", fontSize: "0.9rem" }}>Platform</Link>
          <Link to="/chat" style={{ background: "linear-gradient(135deg, #f5d76e, #b8860b)", color: "#05070a", padding: "0.5rem 1.2rem", borderRadius: 999, textDecoration: "none", fontWeight: 800, fontSize: "0.85rem" }}>Scope Your Project →</Link>
        </nav>
      </header>

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "3rem 1.5rem 4rem" }}>
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <div style={{ display: "inline-block", padding: "0.35rem 1rem", borderRadius: 999, border: "1px solid rgba(245,215,110,0.3)", background: "rgba(245,215,110,0.06)", color: "#f5d76e", fontSize: "0.78rem", fontWeight: 700, letterSpacing: "0.1em", marginBottom: "1rem" }}>VERIFIED DEPLOYMENT EVIDENCE</div>
          <h1 style={{ fontSize: "clamp(2rem, 5vw, 3rem)", fontWeight: 900, lineHeight: 1.15, margin: 0 }}>Proof Over Promises — <span style={{ background: "linear-gradient(120deg, #f5d76e, #ffdf8a 55%, #b8860b)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>GARUDA Case Studies</span></h1>
          <p style={{ color: "#8d95a7", fontSize: "1.05rem", lineHeight: 1.65, maxWidth: 720, margin: "1.2rem auto 0" }}>GARUDA operates under <strong style={{ color: "#f5d76e" }}>100% Truth Law</strong>. Only verified deployments are listed. Upcoming engagements are clearly marked <span style={{ color: "#f59e0b", fontWeight: 700 }}>PLANNED</span> / <span style={{ color: "#f59e0b", fontWeight: 700 }}>PARTIAL</span>. No logos, testimonials, or metrics are ever fabricated.</p>
        </div>

        <div style={{ display: "grid", gap: "1.4rem", marginBottom: "3rem" }}>
          {CASES.map((c) => (
            <div key={c.id} style={{ background: "rgba(11,15,22,0.85)", border: "1px solid rgba(245,215,110,0.14)", borderRadius: 16, padding: "1.8rem", display: "grid", gridTemplateColumns: "1fr auto", gap: "1.2rem", alignItems: "center" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.5rem" }}>
                  <span style={{ fontSize: "0.7rem", fontWeight: 800, letterSpacing: "0.08em", padding: "0.2rem 0.6rem", borderRadius: 4, background: `${c.statusColor}18`, color: c.statusColor, border: `1px solid ${c.statusColor}40` }}>{c.status}</span>
                  <span style={{ fontSize: "0.78rem", color: "#64748b" }}>{c.id.toUpperCase()}</span>
                </div>
                <h2 style={{ fontSize: "1.15rem", fontWeight: 800, color: "#fff", margin: "0 0 0.5rem" }}>{c.title}</h2>
                <p style={{ color: "#9ca3af", fontSize: "0.92rem", lineHeight: 1.6, margin: "0 0 0.8rem" }}>{c.desc}</p>
                <ul style={{ margin: 0, paddingLeft: "1.2rem", color: "#64748b", fontSize: "0.82rem", lineHeight: 1.6 }}>
                  {c.evidence.map((e, i) => <li key={i} style={{ color: "#8d95a7" }}>{e}</li>)}
                </ul>
              </div>
              <Link to={c.link} style={{ background: c.status === "VERIFIED" ? "linear-gradient(135deg, #f5d76e, #b8860b)" : "rgba(255,255,255,0.06)", color: c.status === "VERIFIED" ? "#05070a" : "#cbd5e1", padding: "0.65rem 1.2rem", borderRadius: 999, textDecoration: "none", fontWeight: 800, fontSize: "0.85rem", whiteSpace: "nowrap", border: c.status !== "VERIFIED" ? "1px solid rgba(255,255,255,0.12)" : "none" }}>{c.cta}</Link>
            </div>
          ))}
        </div>

        <div style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 12, padding: "1.2rem 1.5rem", marginBottom: "2rem" }}>
          <div style={{ color: "#f87171", fontWeight: 800, fontSize: "0.9rem", marginBottom: "0.3rem" }}>⚠ Anti-Fabrication Commitment</div>
          <p style={{ color: "#9ca3af", fontSize: "0.88rem", lineHeight: 1.6, margin: 0 }}>We never publish fake client logos, fabricated testimonials, hallucinated revenue numbers, or unverified deployment claims. Individual client case studies are published only with explicit written consent. If a capability is not yet deployed, we label it <strong>PLANNED</strong> — never as delivered.</p>
        </div>

        <div style={{ textAlign: "center", padding: "2.5rem", background: "linear-gradient(135deg, rgba(245,215,110,0.08), rgba(11,15,22,0.9))", border: "1px solid rgba(245,215,110,0.2)", borderRadius: 16 }}>
          <h3 style={{ color: "#fff", fontSize: "1.4rem", fontWeight: 800, margin: "0 0 0.6rem" }}>Have a Problem GARUDA Can Solve?</h3>
          <p style={{ color: "#94a3b8", margin: "0 0 1.4rem" }}>Describe your workflow — GARUDA will scope the architecture, milestones, and fixed price within 24h.</p>
          <div style={{ display: "flex", justifyContent: "center", gap: "1rem", flexWrap: "wrap" }}>
            <Link to="/chat" style={{ background: "linear-gradient(135deg, #f5d76e, #b8860b)", color: "#05070a", padding: "0.85rem 1.8rem", borderRadius: 999, textDecoration: "none", fontWeight: 800 }}>Talk to Solution Architect →</Link>
            <Link to="/what-is-garuda-ai" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "#e5e7eb", padding: "0.85rem 1.8rem", borderRadius: 999, textDecoration: "none", fontWeight: 700 }}>Platform Architecture →</Link>
          </div>
        </div>
      </main>
      <footer style={{ textAlign: "center", padding: "2rem", borderTop: "1px solid rgba(255,255,255,0.06)", color: "#5b6472", fontSize: "0.82rem" }}>
        © 2026 GARUDA AI · <Link to="/privacy" style={{ color: "#9ca3af", textDecoration: "none" }}>Privacy</Link> · <Link to="/terms" style={{ color: "#9ca3af", textDecoration: "none" }}>Terms</Link> · <Link to="/praveen-mahawar" style={{ color: "#f5d76e", textDecoration: "none" }}>Founder</Link>
      </footer>
    </div>
  );
}
