import React from "react";
import { Link, useNavigate } from "react-router-dom";
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
  obsidian: "#10141D",
  obsidianDeep: "#0B0E14"
};

const CASES = [
  {
    id: "pawan",
    title: "PAWAN — Sovereign Autonomous Coding Agent",
    status: "VERIFIED",
    statusColor: "#15803d",
    statusBg: "rgba(22, 163, 74, 0.1)",
    desc: "Multi-model ReAct loop with syntax self-healing, Hindi/English voice control, and live repository synthesis. Executes real software tasks in isolated worktrees with deterministic verification.",
    evidence: ["Live at /pawan — voice command demo", "Multi-model router (Claude/GPT-4o/Gemini)", "Worktree-isolated execution with SHA-256 manifests"],
    link: "/pawan",
    cta: "View PAWAN Studio →"
  },
  {
    id: "botverse",
    title: "BOT-VERSE — Omnichannel Media Engine",
    status: "VERIFIED",
    statusColor: "#15803d",
    statusBg: "rgba(22, 163, 74, 0.1)",
    desc: "Official YouTube Data API v3 direct push, algorithmic SEO, and multi-platform syndication. Autonomous video generation and publishing pipeline.",
    evidence: ["Official YouTube Data API v3 integration", "Bot-verse studio at /bot-verse", "Cross-platform: YouTube, Instagram, LinkedIn"],
    link: "/bot-verse",
    cta: "View BOT-VERSE →"
  },
  {
    id: "dost",
    title: "GARUDA DOST — Zero-Advance Rozgar Setu",
    status: "VERIFIED",
    statusColor: "#15803d",
    statusBg: "rgba(22, 163, 74, 0.1)",
    desc: "Livelihood platform enabling rural and urban youth to earn via micro-tools (Cloth GST, local shop PWA) — zero advance, pay-when-you-earn, T+3 Razorpay settlement.",
    evidence: ["Live at /dost — partner onboarding", "Zero-advance model, verified T+3 payout", "Bharat-focused: gaon & kasba first"],
    link: "/dost",
    cta: "View GARUDA DOST →"
  },
  {
    id: "saas-mvp",
    title: "SaaS MVP Engineering — Multi-Tenant Platform",
    status: "PARTIAL",
    statusColor: "#d97706",
    statusBg: "rgba(217, 119, 6, 0.1)",
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
    statusBg: "rgba(100, 116, 139, 0.1)",
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
    <div style={{
      minHeight: "100vh",
      background: palette.canvas,
      color: palette.text,
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      WebkitFontSmoothing: "antialiased"
    }}>
      <SEOHead
        title="GARUDA AI Case Studies | Real Deployments & Engineering Proof | GARUDA"
        description="Verified case studies, architecture diagrams, and deployment evidence from GARUDA AI projects. Real workflows, real code, no fabrication."
        canonical="https://www.garudaos.in/case-studies"
        schema={collectionSchema}
      />

      {/* Top Header */}
      <header style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
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
          onClick={() => navigate("/")}
          style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.8rem", padding: 0 }}
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
              GARUDA CASE STUDIES
            </div>
            <div style={{
              fontSize: "0.6rem",
              color: palette.muted,
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              marginTop: "3px"
            }}>
              Deterministic Deployment Proof
            </div>
          </div>
        </button>

        <nav style={{ display: "flex", gap: "1.25rem", alignItems: "center" }}>
          <Link
            to="/what-is-garuda-ai"
            style={{ color: palette.muted, textDecoration: "none", fontSize: "0.9rem", fontWeight: 500 }}
          >
            Platform
          </Link>
          <Link
            to="/chat"
            style={{
              background: palette.goldGradient,
              color: "#FFFFFF",
              padding: "0.6rem 1.35rem",
              borderRadius: 999,
              textDecoration: "none",
              fontWeight: 600,
              fontSize: "0.88rem",
              boxShadow: "0 2px 10px rgba(179, 130, 53, 0.25)"
            }}
          >
            Scope Your Project →
          </Link>
        </nav>
      </header>

      <main style={{ maxWidth: 1040, margin: "0 auto", padding: "3.5rem 1.5rem 4rem" }}>
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <div style={{
            display: "inline-block",
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
            Verified Deployment Evidence
          </div>
          <h1 style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: "clamp(2rem, 5vw, 3.2rem)",
            fontWeight: 700,
            lineHeight: 1.15,
            margin: 0,
            color: palette.text
          }}>
            Proof Over Promises — <span style={{
              background: palette.goldGradient,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent"
            }}>GARUDA Case Studies</span>
          </h1>
          <p style={{
            color: palette.muted,
            fontSize: "1.05rem",
            lineHeight: 1.65,
            maxWidth: 720,
            margin: "1.2rem auto 0"
          }}>
            GARUDA operates under <strong style={{ color: palette.goldDeep }}>100% Truth Law</strong>. Only verified deployments are listed. Upcoming engagements are clearly marked <span style={{ color: "#d97706", fontWeight: 700 }}>PLANNED</span> / <span style={{ color: "#d97706", fontWeight: 700 }}>PARTIAL</span>. No logos, testimonials, or metrics are ever fabricated.
          </p>
        </div>

        <div style={{ display: "grid", gap: "1.5rem", marginBottom: "3rem" }}>
          {CASES.map((c) => (
            <div
              key={c.id}
              style={{
                background: palette.card,
                border: `1px solid ${palette.border}`,
                borderRadius: 16,
                padding: "2rem",
                display: "grid",
                gridTemplateColumns: "1fr auto",
                gap: "1.5rem",
                alignItems: "center",
                boxShadow: "0 4px 16px rgba(0, 0, 0, 0.03)"
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.6rem" }}>
                  <span style={{
                    fontSize: "0.7rem",
                    fontWeight: 800,
                    letterSpacing: "0.08em",
                    padding: "0.25rem 0.6rem",
                    borderRadius: 4,
                    background: c.statusBg,
                    color: c.statusColor,
                    border: `1px solid ${c.statusColor}30`
                  }}>
                    {c.status}
                  </span>
                  <span style={{ fontSize: "0.78rem", color: palette.subtle, fontWeight: 600 }}>{c.id.toUpperCase()}</span>
                </div>
                <h2 style={{
                  fontSize: "1.25rem",
                  fontWeight: 700,
                  color: palette.text,
                  margin: "0 0 0.5rem"
                }}>
                  {c.title}
                </h2>
                <p style={{ color: palette.textBody, fontSize: "0.92rem", lineHeight: 1.6, margin: "0 0 0.9rem" }}>
                  {c.desc}
                </p>
                <ul style={{ margin: 0, paddingLeft: "1.2rem", color: palette.muted, fontSize: "0.85rem", lineHeight: 1.6 }}>
                  {c.evidence.map((e, i) => <li key={i} style={{ color: palette.muted }}>{e}</li>)}
                </ul>
              </div>
              <div>
                <Link
                  to={c.link}
                  style={{
                    background: c.status === "VERIFIED" ? palette.goldGradient : "rgba(23, 24, 27, 0.04)",
                    color: c.status === "VERIFIED" ? "#FFFFFF" : palette.textBody,
                    padding: "0.7rem 1.4rem",
                    borderRadius: 999,
                    textDecoration: "none",
                    fontWeight: 600,
                    fontSize: "0.88rem",
                    whiteSpace: "nowrap",
                    display: "inline-block",
                    border: c.status !== "VERIFIED" ? `1px solid ${palette.border}` : "none",
                    boxShadow: c.status === "VERIFIED" ? "0 4px 14px rgba(179, 130, 53, 0.25)" : "none"
                  }}
                >
                  {c.cta}
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Anti-Fabrication Commitment Callout */}
        <div style={{
          background: "rgba(185, 28, 28, 0.04)",
          border: "1px solid rgba(185, 28, 28, 0.16)",
          borderRadius: 14,
          padding: "1.5rem 1.8rem",
          marginBottom: "2.5rem"
        }}>
          <div style={{ color: "#b91c1c", fontWeight: 700, fontSize: "0.95rem", marginBottom: "0.4rem" }}>
            ⚠ Sovereign Anti-Fabrication Commitment
          </div>
          <p style={{ color: palette.textBody, fontSize: "0.9rem", lineHeight: 1.6, margin: 0 }}>
            We never publish fake client logos, fabricated testimonials, hallucinated revenue numbers, or unverified deployment claims. Individual client case studies are published only with explicit written consent. If a capability is not yet deployed, we label it <strong>PLANNED</strong> — never as delivered.
          </p>
        </div>

        {/* Bottom CTA Console */}
        <div style={{
          textAlign: "center",
          padding: "3.5rem 2rem",
          background: `linear-gradient(180deg, ${palette.obsidian} 0%, ${palette.obsidianDeep} 100%)`,
          border: `1px solid ${palette.borderGold}`,
          borderRadius: 18,
          color: "#FFFFFF",
          boxShadow: "0 20px 50px rgba(16, 20, 29, 0.2)"
        }}>
          <h3 style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            color: "#FFFFFF",
            fontSize: "1.8rem",
            fontWeight: 700,
            margin: "0 0 0.6rem"
          }}>
            Have a Problem GARUDA Can Solve?
          </h3>
          <p style={{ color: "#b0b8c8", margin: "0 0 1.8rem", fontSize: "0.98rem", maxWidth: "560px", marginInline: "auto" }}>
            Describe your workflow — GARUDA will scope the architecture, milestones, and fixed price within 24h.
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: "1rem", flexWrap: "wrap" }}>
            <Link
              to="/chat"
              style={{
                background: palette.goldGradient,
                color: "#FFFFFF",
                padding: "0.85rem 2rem",
                borderRadius: 999,
                textDecoration: "none",
                fontWeight: 600,
                fontSize: "0.95rem",
                boxShadow: "0 8px 24px rgba(179, 130, 53, 0.3)"
              }}
            >
              Talk to Solution Architect →
            </Link>
            <Link
              to="/what-is-garuda-ai"
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.2)",
                color: "#FFFFFF",
                padding: "0.85rem 1.8rem",
                borderRadius: 999,
                textDecoration: "none",
                fontWeight: 600,
                fontSize: "0.95rem"
              }}
            >
              Platform Architecture →
            </Link>
          </div>
        </div>
      </main>

      <footer style={{
        textAlign: "center",
        padding: "2.5rem 1.5rem",
        borderTop: `1px solid ${palette.border}`,
        color: palette.subtle,
        fontSize: "0.85rem",
        background: palette.canvasIvory
      }}>
        © {new Date().getFullYear()} GARUDA AI · <Link to="/privacy" style={{ color: palette.muted, textDecoration: "none" }}>Privacy</Link> · <Link to="/terms" style={{ color: palette.muted, textDecoration: "none" }}>Terms</Link> · <Link to="/praveen-mahawar" style={{ color: palette.goldDeep, textDecoration: "none", fontWeight: 600 }}>Founder</Link>
      </footer>
    </div>
  );
}
