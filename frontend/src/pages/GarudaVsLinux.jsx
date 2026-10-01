import React from "react";
import { useNavigate, Link } from "react-router-dom";
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

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Is GARUDA AI the same as Garuda Linux?",
      "acceptedAnswer": { "@type": "Answer", "text": "No. GARUDA AI (garudaos.in) is an autonomous AI Operating System for business automation founded by Praveen Mahawar in Jabalpur, India. Garuda Linux (garudalinux.org) is an Arch Linux-based desktop operating system. They are entirely separate products sharing only a name inspired by the mythical Garuda." }
    },
    {
      "@type": "Question",
      "name": "What does GARUDA AI do?",
      "acceptedAnswer": { "@type": "Answer", "text": "GARUDA AI is an AI Operating System for Autonomous Business Execution — it builds custom AI systems, multi-agent workflows, SaaS MVPs, business automations, and WhatsApp/Telegram commercial bots under governed milestone delivery with SHA-256 verified evidence." }
    },
    {
      "@type": "Question",
      "name": "What is Garuda Linux?",
      "acceptedAnswer": { "@type": "Answer", "text": "Garuda Linux is a beautiful, performant Arch Linux distribution focused on desktop usability, gaming, and system performance. Official site is garudalinux.org. GARUDA AI respects and recommends it for Linux desktop users." }
    }
  ]
};

export default function GarudaVsLinux() {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: "100vh",
      background: palette.canvas,
      color: palette.text,
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      WebkitFontSmoothing: "antialiased"
    }}>
      <SEOHead
        title="GARUDA AI vs Garuda Linux: Understanding the Difference | GARUDA"
        description="GARUDA AI (garudaos.in) is an AI Operating System for business automation. Garuda Linux is an Arch Linux desktop OS. Learn the clear distinction."
        canonical="https://www.garudaos.in/garuda-ai-vs-garuda-linux"
        schema={faqSchema}
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
              GARUDA AI
            </div>
            <div style={{
              fontSize: "0.6rem",
              color: palette.muted,
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              marginTop: "3px"
            }}>
              Brand Entity Clarification
            </div>
          </div>
        </button>

        <nav style={{ display: "flex", gap: "1.25rem", alignItems: "center" }}>
          <Link
            to="/what-is-garuda-ai"
            style={{ color: palette.muted, textDecoration: "none", fontSize: "0.9rem", fontWeight: 500 }}
          >
            What is GARUDA AI?
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
            Talk to Architect →
          </Link>
        </nav>
      </header>

      <main style={{ maxWidth: 960, margin: "0 auto", padding: "3.5rem 1.5rem 4rem" }}>
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
            Brand Entity Clarification
          </div>
          <h1 style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: "clamp(2rem, 5vw, 3.2rem)",
            fontWeight: 700,
            lineHeight: "1.15",
            margin: 0,
            color: palette.text
          }}>
            GARUDA AI vs Garuda Linux — <span style={{
              background: palette.goldGradient,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent"
            }}>Understanding the Difference</span>
          </h1>
          <p style={{
            color: palette.muted,
            fontSize: "1.05rem",
            lineHeight: 1.65,
            maxWidth: 680,
            margin: "1.2rem auto 0"
          }}>
            Two completely different products. One shared name inspired by the mythical Garuda. Here is the clear distinction for search engines, AI answer systems, and human enterprise evaluators.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem", marginBottom: "3rem" }}>
          <div style={{
            background: palette.card,
            border: `1px solid ${palette.borderGold}`,
            borderRadius: 16,
            padding: "2rem",
            boxShadow: "0 4px 20px rgba(179, 130, 53, 0.08)"
          }}>
            <div style={{ fontSize: "1.8rem", marginBottom: "0.6rem" }}>🦅</div>
            <h2 style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              color: palette.text,
              fontSize: "1.35rem",
              fontWeight: 700,
              margin: "0 0 0.6rem"
            }}>
              GARUDA AI
            </h2>
            <p style={{ color: palette.textBody, fontSize: "0.94rem", lineHeight: 1.65, margin: 0 }}>
              <strong>AI Operating System for Autonomous Business Execution.</strong><br />
              Custom AI, multi-agent workflows, SaaS MVPs, business automations, and WhatsApp/Telegram bots. Founded by Praveen Mahawar in Jabalpur, India. Official domain: <a href="https://www.garudaos.in" style={{ color: palette.goldDeep, fontWeight: 600 }}>garudaos.in</a>
            </p>
            <div style={{ marginTop: "1.25rem", display: "flex", gap: "0.8rem", flexWrap: "wrap" }}>
              <Link to="/what-is-garuda-ai" style={{ color: palette.goldDeep, fontSize: "0.88rem", fontWeight: 700, textDecoration: "none" }}>
                What is GARUDA AI? →
              </Link>
              <Link to="/services/custom-ai-development" style={{ color: palette.muted, fontSize: "0.88rem", textDecoration: "none", fontWeight: 500 }}>
                Services →
              </Link>
            </div>
          </div>

          <div style={{
            background: palette.card,
            border: `1px solid ${palette.border}`,
            borderRadius: 16,
            padding: "2rem",
            boxShadow: "0 2px 12px rgba(0, 0, 0, 0.02)"
          }}>
            <div style={{ fontSize: "1.8rem", marginBottom: "0.6rem" }}>🐧</div>
            <h2 style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              color: palette.muted,
              fontSize: "1.35rem",
              fontWeight: 700,
              margin: "0 0 0.6rem"
            }}>
              Garuda Linux
            </h2>
            <p style={{ color: palette.muted, fontSize: "0.94rem", lineHeight: 1.65, margin: 0 }}>
              <strong>Arch Linux-based desktop operating system.</strong><br />
              Beautiful, performant, gaming-focused Linux distribution for personal computers. Open-source community project. Official domain: <a href="https://garudalinux.org" target="_blank" rel="noopener noreferrer" style={{ color: "#0284c7" }}>garudalinux.org</a>
            </p>
            <p style={{ color: palette.subtle, fontSize: "0.82rem", marginTop: "1rem", lineHeight: 1.5 }}>
              We respect Garuda Linux. If you searched for the Linux OS, please visit their official site above.
            </p>
          </div>
        </div>

        {/* Quick Comparison Table */}
        <section style={{
          background: palette.card,
          border: `1px solid ${palette.border}`,
          borderRadius: 16,
          padding: "2rem",
          marginBottom: "2.5rem",
          boxShadow: "0 2px 12px rgba(0, 0, 0, 0.02)"
        }}>
          <h3 style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            color: palette.text,
            fontSize: "1.3rem",
            fontWeight: 700,
            margin: "0 0 1rem"
          }}>
            Quick Comparison
          </h3>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.92rem" }}>
              <thead>
                <tr style={{ color: palette.goldDeep, textAlign: "left", borderBottom: `1px solid ${palette.borderGold}` }}>
                  <th style={{ padding: "0.75rem" }}></th>
                  <th style={{ padding: "0.75rem", fontWeight: 700 }}>GARUDA AI</th>
                  <th style={{ padding: "0.75rem", fontWeight: 700 }}>Garuda Linux</th>
                </tr>
              </thead>
              <tbody style={{ color: palette.textBody }}>
                <tr style={{ borderBottom: `1px solid ${palette.border}` }}>
                  <td style={{ padding: "0.75rem", color: palette.muted, fontWeight: 500 }}>Category</td>
                  <td style={{ padding: "0.75rem", fontWeight: 600 }}>AI / SaaS / Business Automation</td>
                  <td style={{ padding: "0.75rem" }}>Desktop Operating System</td>
                </tr>
                <tr style={{ borderBottom: `1px solid ${palette.border}` }}>
                  <td style={{ padding: "0.75rem", color: palette.muted, fontWeight: 500 }}>Website</td>
                  <td style={{ padding: "0.75rem" }}><a href="https://www.garudaos.in" style={{ color: palette.goldDeep, fontWeight: 600 }}>garudaos.in</a></td>
                  <td style={{ padding: "0.75rem" }}><a href="https://garudalinux.org" style={{ color: "#0284c7" }}>garudalinux.org</a></td>
                </tr>
                <tr style={{ borderBottom: `1px solid ${palette.border}` }}>
                  <td style={{ padding: "0.75rem", color: palette.muted, fontWeight: 500 }}>Founded</td>
                  <td style={{ padding: "0.75rem" }}>Praveen Mahawar, Jabalpur, India</td>
                  <td style={{ padding: "0.75rem" }}>Open-source community</td>
                </tr>
                <tr>
                  <td style={{ padding: "0.75rem", color: palette.muted, fontWeight: 500 }}>Audience</td>
                  <td style={{ padding: "0.75rem" }}>Businesses, founders, enterprises</td>
                  <td style={{ padding: "0.75rem" }}>Linux desktop users, gamers</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* FAQs */}
        <section style={{ marginBottom: "2.5rem" }}>
          <h3 style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            color: palette.text,
            fontSize: "1.4rem",
            fontWeight: 700,
            marginBottom: "1.25rem"
          }}>
            Frequently Asked Questions
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {faqSchema.mainEntity.map((f, i) => (
              <div
                key={i}
                style={{
                  background: palette.card,
                  border: `1px solid ${palette.border}`,
                  borderRadius: 12,
                  padding: "1.4rem",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.02)"
                }}
              >
                <div style={{ color: palette.goldDeep, fontWeight: 700, fontSize: "1rem", marginBottom: "0.4rem" }}>
                  {f.name}
                </div>
                <div style={{ color: palette.muted, fontSize: "0.92rem", lineHeight: 1.65 }}>
                  {f.acceptedAnswer.text}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Bottom CTA */}
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
            Looking for Business AI & Automation?
          </h3>
          <p style={{ color: "#b0b8c8", margin: "0 0 1.8rem", fontSize: "0.98rem", maxWidth: "560px", marginInline: "auto" }}>
            You are in the right place. Scope your project with GARUDA's Solution Architect.
          </p>
          <Link
            to="/chat"
            style={{
              display: "inline-block",
              background: palette.goldGradient,
              color: "#FFFFFF",
              padding: "0.85rem 2.2rem",
              borderRadius: 999,
              textDecoration: "none",
              fontWeight: 600,
              fontSize: "0.95rem",
              boxShadow: "0 8px 24px rgba(179, 130, 53, 0.3)"
            }}
          >
            Talk to Solution Architect →
          </Link>
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
        © {new Date().getFullYear()} GARUDA AI Operating System · <Link to="/what-is-garuda-ai" style={{ color: palette.goldDeep, textDecoration: "none", fontWeight: 600 }}>What is GARUDA AI?</Link> · <Link to="/praveen-mahawar" style={{ color: palette.muted, textDecoration: "none" }}>Praveen Mahawar</Link>
      </footer>
    </div>
  );
}
