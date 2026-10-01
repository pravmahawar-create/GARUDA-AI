import React from "react";
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

export default function FounderProfile() {
  const schemaPerson = {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": "https://www.garudaos.in/#praveen-mahawar",
    "name": "Praveen Mahawar",
    "alternateName": [
      "Praveen Mahawar Jabalpur",
      "Praveen Mahawar GARUDA AI",
      "Founder Praveen Mahawar",
      "Praveen Mahawar Madhya Pradesh"
    ],
    "jobTitle": "Founder & Chief AI Architect",
    "worksFor": {
      "@type": "Organization",
      "@id": "https://www.garudaos.in/#organization",
      "name": "GARUDA AI",
      "url": "https://www.garudaos.in"
    },
    "homeLocation": {
      "@type": "Place",
      "name": "Jabalpur, Madhya Pradesh, India",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Jabalpur",
        "addressRegion": "Madhya Pradesh",
        "addressCountry": "India"
      }
    },
    "nationality": {
      "@type": "Country",
      "name": "India"
    },
    "description": "Praveen Mahawar is an Indian AI engineer, technologist, and the Founder & Chief Architect of GARUDA-AI, an advanced autonomous AI Operating System developed in Jabalpur, Madhya Pradesh, India.",
    "url": "https://www.garudaos.in/praveen-mahawar",
    "sameAs": [
      "https://www.facebook.com/praveen.mahawar.5/",
      "https://github.com/pravmahawar-create/GARUDA-AI",
      "https://github.com/pravmahawar-create"
    ],
    "knowsAbout": [
      "Artificial Intelligence",
      "AI Operating Systems",
      "Autonomous Software Execution",
      "Multi-Agent Systems",
      "Enterprise Automation",
      "Sovereign AI Infrastructure"
    ]
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: palette.canvas,
      color: palette.text,
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      WebkitFontSmoothing: "antialiased",
      lineHeight: 1.6
    }}>
      <SEOHead
        title="Praveen Mahawar | Founder & Chief AI Architect of GARUDA-AI • Jabalpur, India"
        description="Official profile of Praveen Mahawar, Founder and Chief Architect of GARUDA-AI, a world-class autonomous AI Operating System engineered in Jabalpur, Madhya Pradesh, India."
        canonical="https://www.garudaos.in/praveen-mahawar"
        schema={schemaPerson}
      />

      {/* Header Bar */}
      <header style={{
        borderBottom: `1px solid ${palette.border}`,
        background: "rgba(246, 244, 238, 0.92)",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        position: "sticky",
        top: 0,
        zIndex: 50,
        padding: "0.85rem clamp(1.25rem, 4vw, 3.5rem)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}>
        <a href="/" style={{ display: "flex", alignItems: "center", gap: "0.8rem", textDecoration: "none", color: palette.text }}>
          <img
            src="/images/garuda_eagle_sigil.png"
            alt="GARUDA Sigil"
            style={{ width: "34px", height: "28px", objectFit: "contain" }}
          />
          <div>
            <div style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: "1.25rem",
              fontWeight: 700,
              letterSpacing: "0.06em",
              color: palette.text
            }}>
              GARUDA-AI
            </div>
            <div style={{
              fontSize: "0.6rem",
              color: palette.muted,
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              marginTop: "2px"
            }}>
              Founder Profile &amp; Governance
            </div>
          </div>
        </a>

        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <a
            href="/what-is-garuda-ai"
            style={{ fontSize: "0.9rem", color: palette.muted, textDecoration: "none", fontWeight: 500 }}
          >
            Architecture
          </a>
          <a
            href="/chat"
            style={{
              fontSize: "0.88rem",
              padding: "0.6rem 1.35rem",
              background: palette.goldGradient,
              color: "#FFFFFF",
              borderRadius: "8px",
              textDecoration: "none",
              fontWeight: 600,
              boxShadow: "0 2px 10px rgba(179, 130, 53, 0.25)"
            }}
          >
            ⚡ Talk to Architect
          </a>
        </div>
      </header>

      {/* Hero Profile Section */}
      <main style={{ maxWidth: "1000px", margin: "0 auto", padding: "3.5rem 1.5rem 5rem" }}>
        <div style={{
          background: palette.card,
          border: `1px solid ${palette.borderGold}`,
          borderRadius: "20px",
          padding: "clamp(2rem, 5vw, 3.5rem)",
          boxShadow: "0 10px 40px rgba(179, 130, 53, 0.08), 0 2px 8px rgba(0,0,0,0.02)",
          position: "relative",
          overflow: "hidden"
        }}>
          {/* Subtle Golden Glow Accent */}
          <div style={{
            position: "absolute",
            top: "-80px",
            right: "-80px",
            width: "280px",
            height: "280px",
            background: "radial-gradient(circle, rgba(179, 130, 53, 0.12) 0%, transparent 70%)",
            pointerEvents: "none"
          }} />

          <div style={{ display: "flex", flexDirection: "column", gap: "1.8rem" }}>
            {/* Top Badges */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem", alignItems: "center" }}>
              <span style={{
                fontSize: "0.75rem",
                padding: "0.3rem 0.85rem",
                background: "rgba(179, 130, 53, 0.1)",
                color: palette.goldDeep,
                borderRadius: "999px",
                border: `1px solid ${palette.borderGold}`,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.08em"
              }}>
                👑 Founder &amp; Chief Architect
              </span>
              <span style={{
                fontSize: "0.75rem",
                padding: "0.3rem 0.85rem",
                background: "rgba(2, 132, 199, 0.08)",
                color: "#0284c7",
                borderRadius: "999px",
                border: "1px solid rgba(2, 132, 199, 0.2)",
                fontWeight: 600
              }}>
                📍 Jabalpur, Madhya Pradesh, India
              </span>
              <span style={{
                fontSize: "0.75rem",
                padding: "0.3rem 0.85rem",
                background: "rgba(22, 163, 74, 0.08)",
                color: "#15803d",
                borderRadius: "999px",
                border: "1px solid rgba(22, 163, 74, 0.2)",
                fontWeight: 600
              }}>
                ✓ Official Verified Entity
              </span>
            </div>

            {/* Founder Title */}
            <div>
              <h1 style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: "clamp(2.4rem, 5vw, 3.6rem)",
                fontWeight: 700,
                margin: "0 0 0.5rem 0",
                color: palette.text,
                letterSpacing: "-0.01em"
              }}>
                Praveen Mahawar
              </h1>
              <p style={{
                fontSize: "clamp(1.1rem, 2.5vw, 1.35rem)",
                color: palette.goldDeep,
                fontWeight: 600,
                margin: 0
              }}>
                Founder &amp; Chief AI Architect of GARUDA-AI
              </p>
              <p style={{ fontSize: "0.95rem", color: palette.muted, marginTop: "0.4rem" }}>
                Pioneering Sovereign AI Operating Systems • Born &amp; Engineered in Jabalpur, Madhya Pradesh
              </p>
            </div>

            {/* Official Entity Statement */}
            <div style={{
              background: palette.canvasIvory,
              border: `1px solid ${palette.border}`,
              borderRadius: "12px",
              padding: "1.6rem",
              fontSize: "1.02rem",
              lineHeight: 1.8,
              color: palette.textBody
            }}>
              <strong style={{ color: palette.text }}>Praveen Mahawar</strong> is the visionary creator and Chief Architect behind <strong>GARUDA-AI</strong> (<a href="https://www.garudaos.in" style={{ color: palette.goldDeep, textDecoration: "underline", fontWeight: 600 }}>garudaos.in</a>), a world-class autonomous AI Operating System engineered for sovereign software execution, multi-agent enterprise automation, deterministic verification, and omnichannel media intelligence.
              Operating under the supreme <em>100% Anti-Fabrication Law</em> (&quot;Show &gt; Tell&quot;), Praveen Mahawar has architected an autonomous digital workforce capable of self-healing development, real-time code generation, and direct cloud API orchestration.
            </div>

            {/* Verified External Profile Links */}
            <div>
              <h3 style={{
                fontSize: "0.82rem",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: palette.muted,
                marginBottom: "0.8rem",
                fontWeight: 700
              }}>
                Official Verified Channels
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "0.85rem" }}>
                <a
                  href="mailto:praveen@garudaos.in"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.8rem",
                    padding: "0.9rem 1.1rem",
                    background: "rgba(179, 130, 53, 0.08)",
                    border: `1px solid ${palette.borderGold}`,
                    borderRadius: "10px",
                    color: palette.text,
                    textDecoration: "none",
                    fontWeight: 600,
                    fontSize: "0.9rem"
                  }}
                >
                  <span style={{ fontSize: "1.3rem" }}>✉️</span>
                  <div>
                    <div style={{ fontWeight: 700 }}>Official Enterprise Email</div>
                    <div style={{ fontSize: "0.76rem", color: palette.goldDeep, fontWeight: 500 }}>praveen@garudaos.in</div>
                  </div>
                </a>

                <a
                  href="https://github.com/pravmahawar-create"
                  target="_blank"
                  rel="me noreferrer"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.8rem",
                    padding: "0.9rem 1.1rem",
                    background: palette.canvasIvory,
                    border: `1px solid ${palette.border}`,
                    borderRadius: "10px",
                    color: palette.text,
                    textDecoration: "none",
                    fontWeight: 600,
                    fontSize: "0.9rem"
                  }}
                >
                  <span style={{ fontSize: "1.3rem" }}>🐙</span>
                  <div>
                    <div style={{ fontWeight: 700 }}>GitHub Engineering</div>
                    <div style={{ fontSize: "0.76rem", color: palette.muted, fontWeight: 500 }}>@pravmahawar-create</div>
                  </div>
                </a>

                <a
                  href="https://www.facebook.com/praveen.mahawar.5/"
                  target="_blank"
                  rel="me noreferrer"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.8rem",
                    padding: "0.9rem 1.1rem",
                    background: "rgba(24, 119, 242, 0.06)",
                    border: "1px solid rgba(24, 119, 242, 0.2)",
                    borderRadius: "10px",
                    color: palette.text,
                    textDecoration: "none",
                    fontWeight: 600,
                    fontSize: "0.9rem"
                  }}
                >
                  <span style={{ fontSize: "1.3rem" }}>📘</span>
                  <div>
                    <div style={{ fontWeight: 700 }}>Facebook Profile</div>
                    <div style={{ fontSize: "0.76rem", color: "#1d4ed8", fontWeight: 500 }}>praveen.mahawar.5 (Jabalpur, MP)</div>
                  </div>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* The GARUDA-AI Innovations Section */}
        <section style={{ marginTop: "3.5rem" }}>
          <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
            <span style={{
              fontSize: "0.75rem",
              padding: "0.3rem 0.8rem",
              background: "rgba(179, 130, 53, 0.1)",
              color: palette.goldDeep,
              borderRadius: "999px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.1em"
            }}>
              Core Technological Inventions
            </span>
            <h2 style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: "2rem",
              fontWeight: 700,
              color: palette.text,
              marginTop: "0.8rem"
            }}>
              What Praveen Mahawar Built in GARUDA-AI
            </h2>
            <p style={{ color: palette.muted, maxWidth: "650px", margin: "0.5rem auto 0", fontSize: "0.98rem" }}>
              Architected from first principles in Jabalpur, Madhya Pradesh, to free modern software development from human fatigue and fragile prompts.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.3rem" }}>
            <div style={{
              background: palette.card,
              border: `1px solid ${palette.border}`,
              borderRadius: "14px",
              padding: "1.8rem",
              boxShadow: "0 2px 10px rgba(0, 0, 0, 0.02)"
            }}>
              <div style={{ fontSize: "1.8rem", marginBottom: "0.8rem" }}>🧠</div>
              <h3 style={{ fontSize: "1.15rem", fontWeight: 700, color: palette.text, margin: "0 0 0.5rem 0" }}>
                Autonomous Mother Brain
              </h3>
              <p style={{ color: palette.muted, fontSize: "0.9rem", lineHeight: 1.6, margin: 0 }}>
                Central intelligence routing that coordinates autonomous multi-agent pipelines (`founder_garuda`) across 27 operational universes with zero manual micromanagement.
              </p>
            </div>

            <div style={{
              background: palette.card,
              border: `1px solid ${palette.border}`,
              borderRadius: "14px",
              padding: "1.8rem",
              boxShadow: "0 2px 10px rgba(0, 0, 0, 0.02)"
            }}>
              <div style={{ fontSize: "1.8rem", marginBottom: "0.8rem" }}>🌌</div>
              <h3 style={{ fontSize: "1.15rem", fontWeight: 700, color: palette.text, margin: "0 0 0.5rem 0" }}>
                BOT-VERSE Omnichannel Engine
              </h3>
              <p style={{ color: palette.muted, fontSize: "0.9rem", lineHeight: 1.6, margin: 0 }}>
                Official YouTube Data API v3 direct push integration, algorithmic video SEO, high-CTR title engineering, and multi-platform syndication across YouTube, Instagram, and LinkedIn.
              </p>
            </div>

            <div style={{
              background: palette.card,
              border: `1px solid ${palette.border}`,
              borderRadius: "14px",
              padding: "1.8rem",
              boxShadow: "0 2px 10px rgba(0, 0, 0, 0.02)"
            }}>
              <div style={{ fontSize: "1.8rem", marginBottom: "0.8rem" }}>🛡️</div>
              <h3 style={{ fontSize: "1.15rem", fontWeight: 700, color: palette.text, margin: "0 0 0.5rem 0" }}>
                100% Anti-Fabrication Law
              </h3>
              <p style={{ color: palette.muted, fontSize: "0.9rem", lineHeight: 1.6, margin: 0 }}>
                Deterministic verification doctrine: GARUDA never hallucinates, never fabricates claims, and proves software through SHA-256 releases and live working code inside worktrees.
              </p>
            </div>

            <div style={{
              background: palette.card,
              border: `1px solid ${palette.border}`,
              borderRadius: "14px",
              padding: "1.8rem",
              boxShadow: "0 2px 10px rgba(0, 0, 0, 0.02)"
            }}>
              <div style={{ fontSize: "1.8rem", marginBottom: "0.8rem" }}>⚡</div>
              <h3 style={{ fontSize: "1.15rem", fontWeight: 700, color: palette.text, margin: "0 0 0.5rem 0" }}>
                PAWAN Sovereign Coding Agent
              </h3>
              <p style={{ color: palette.muted, fontSize: "0.9rem", lineHeight: 1.6, margin: 0 }}>
                Fast-as-wind autonomous coding agent equipped with two-way voice command loops, multi-model execution, and closed-loop syntax self-repair.
              </p>
            </div>
          </div>
        </section>

        {/* Geographic Entity Anchor (Jabalpur, Madhya Pradesh) */}
        <section style={{
          marginTop: "3.5rem",
          background: palette.canvasIvory,
          border: `1px solid ${palette.border}`,
          borderRadius: "14px",
          padding: "2rem"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.8rem", marginBottom: "1rem" }}>
            <span style={{ fontSize: "1.6rem" }}>🇮🇳</span>
            <h3 style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: "1.25rem",
              fontWeight: 700,
              color: palette.text,
              margin: 0
            }}>
              Sovereign Indian AI Roots • Jabalpur, Madhya Pradesh
            </h3>
          </div>
          <p style={{ color: palette.textBody, fontSize: "0.96rem", lineHeight: 1.75, margin: 0 }}>
            Praveen Mahawar represents the rising wave of Indian deep-tech innovators engineering sovereign, high-performance artificial intelligence systems outside conventional metro silos. Engineered in the historic city of <strong>Jabalpur, Madhya Pradesh</strong>, GARUDA-AI stands as testament that world-dominating software architecture can be conceived, built, and deployed globally from the heart of India.
          </p>
        </section>

        {/* Bottom CTA */}
        <div style={{
          marginTop: "3.5rem",
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
            fontSize: "1.8rem",
            fontWeight: 700,
            color: "#FFFFFF",
            margin: "0 0 0.8rem"
          }}>
            Collaborate or Build with Praveen Mahawar &amp; GARUDA-AI
          </h3>
          <p style={{ color: "#b0b8c8", margin: "0 auto 1.8rem", fontSize: "0.98rem", maxWidth: "560px" }}>
            Direct solutions architect consultation for custom AI platforms, autonomous receptionists, and production software systems.
          </p>
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", justifyContent: "center" }}>
            <a
              href="/chat"
              style={{
                padding: "0.85rem 2rem",
                background: palette.goldGradient,
                color: "#FFFFFF",
                borderRadius: "999px",
                fontWeight: 600,
                textDecoration: "none",
                fontSize: "0.95rem",
                boxShadow: "0 8px 24px rgba(179, 130, 53, 0.3)"
              }}
            >
              ⚡ Start Autonomous Scoping Chat
            </a>
            <a
              href="/"
              style={{
                padding: "0.85rem 1.8rem",
                background: "rgba(255, 255, 255, 0.08)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                color: "#FFFFFF",
                borderRadius: "999px",
                fontWeight: 600,
                textDecoration: "none",
                fontSize: "0.95rem"
              }}
            >
              Explore GARUDA-AI Platform →
            </a>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        borderTop: `1px solid ${palette.border}`,
        padding: "2.5rem 1.5rem",
        textAlign: "center",
        color: palette.subtle,
        fontSize: "0.85rem",
        background: palette.canvasIvory
      }}>
        © {new Date().getFullYear()} GARUDA-AI Operating System • Founder: Praveen Mahawar (Jabalpur, MP) • Official Domain: https://www.garudaos.in
      </footer>
    </div>
  );
}
