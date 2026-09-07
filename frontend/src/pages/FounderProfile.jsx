import React from "react";
import SEOHead from "../components/SEOHead";

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
    <div style={{ minHeight: "100vh", background: "#030712", color: "#f8fafc", fontFamily: "system-ui, -apple-system, sans-serif", lineHeight: 1.6 }}>
      <SEOHead
        title="Praveen Mahawar | Founder & Chief AI Architect of GARUDA-AI • Jabalpur, India"
        description="Official profile of Praveen Mahawar, Founder and Chief Architect of GARUDA-AI, a world-class autonomous AI Operating System engineered in Jabalpur, Madhya Pradesh, India."
        canonical="https://www.garudaos.in/praveen-mahawar"
        schema={schemaPerson}
      />

      {/* Header Bar */}
      <header style={{ borderBottom: "1px solid rgba(212,175,55,0.15)", background: "rgba(3,7,18,0.9)", backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 50, padding: "1rem 2rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <a href="/" style={{ display: "flex", alignItems: "center", gap: "0.8rem", textDecoration: "none", color: "#f8fafc" }}>
          <span style={{ fontSize: "1.5rem" }}>🦅</span>
          <div>
            <div style={{ fontSize: "1.1rem", fontWeight: 900, letterSpacing: "0.05em", color: "#d4af37" }}>GARUDA-AI</div>
            <div style={{ fontSize: "0.68rem", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.1em" }}>Autonomous AI Operating System</div>
          </div>
        </a>
        <div style={{ display: "flex", gap: "0.8rem", alignItems: "center" }}>
          <a href="/what-is-garuda-ai" style={{ fontSize: "0.85rem", color: "#cbd5e1", textDecoration: "none", fontWeight: 600 }}>Architecture</a>
          <a href="/chat" style={{ fontSize: "0.85rem", padding: "0.45rem 1rem", background: "linear-gradient(135deg, #d4af37 0%, #aa820a 100%)", color: "#000", borderRadius: "6px", textDecoration: "none", fontWeight: 800 }}>
            ⚡ Talk to Architect
          </a>
        </div>
      </header>

      {/* Hero Profile Section */}
      <main style={{ maxWidth: "1000px", margin: "0 auto", padding: "3.5rem 1.5rem 5rem" }}>
        <div style={{
          background: "linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(30, 41, 59, 0.4) 100%)",
          border: "1px solid rgba(212, 175, 55, 0.3)",
          borderRadius: "16px",
          padding: "clamp(2rem, 5vw, 3.5rem)",
          boxShadow: "0 20px 50px rgba(0,0,0,0.5), 0 0 40px rgba(212,175,55,0.08)",
          position: "relative",
          overflow: "hidden"
        }}>
          {/* Subtle Golden Glow */}
          <div style={{ position: "absolute", top: "-100px", right: "-100px", width: "300px", height: "300px", background: "radial-gradient(circle, rgba(212,175,55,0.15) 0%, transparent 70%)", pointerEvents: "none" }} />

          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {/* Top Badges */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem", alignItems: "center" }}>
              <span style={{ fontSize: "0.75rem", padding: "0.3rem 0.8rem", background: "rgba(212,175,55,0.15)", color: "#f5d76e", borderRadius: "999px", border: "1px solid rgba(212,175,55,0.4)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                👑 Founder & Chief Architect
              </span>
              <span style={{ fontSize: "0.75rem", padding: "0.3rem 0.8rem", background: "rgba(56,189,248,0.15)", color: "#38bdf8", borderRadius: "999px", border: "1px solid rgba(56,189,248,0.3)", fontWeight: 700 }}>
                📍 Jabalpur, Madhya Pradesh, India
              </span>
              <span style={{ fontSize: "0.75rem", padding: "0.3rem 0.8rem", background: "rgba(16,185,129,0.15)", color: "#34d399", borderRadius: "999px", border: "1px solid rgba(16,185,129,0.3)", fontWeight: 700 }}>
                ✓ Official Verified Entity
              </span>
            </div>

            {/* Founder Title */}
            <div>
              <h1 style={{ fontSize: "clamp(2.4rem, 5vw, 3.5rem)", fontWeight: 900, margin: "0 0 0.5rem 0", color: "#f8fafc", letterSpacing: "-0.02em" }}>
                Praveen Mahawar
              </h1>
              <p style={{ fontSize: "clamp(1.1rem, 2.5vw, 1.35rem)", color: "#d4af37", fontWeight: 700, margin: 0 }}>
                Founder & Chief AI Architect of GARUDA-AI
              </p>
              <p style={{ fontSize: "0.95rem", color: "#94a3b8", marginTop: "0.4rem" }}>
                Pioneering Sovereign AI Operating Systems • Born & Engineered in Jabalpur, Madhya Pradesh
              </p>
            </div>

            {/* Official Entity Statement */}
            <div style={{ background: "rgba(3, 7, 18, 0.6)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px", padding: "1.4rem", fontSize: "1.05rem", lineHeight: 1.75, color: "#e2e8f0" }}>
              <strong style={{ color: "#f8fafc" }}>Praveen Mahawar</strong> is the visionary creator and Chief Architect behind <strong>GARUDA-AI</strong> (<a href="https://www.garudaos.in" style={{ color: "#38bdf8", textDecoration: "none" }}>garudaos.in</a>), a world-class autonomous AI Operating System engineered for sovereign software execution, multi-agent enterprise automation, deterministic verification, and omnichannel media intelligence.
              Operating with the supreme <em>100% Anti-Fabrication Law</em> (&quot;Show &gt; Tell&quot;), Praveen Mahawar has architected an autonomous digital workforce capable of self-healing development, real-time code generation, and direct API cloud orchestration.
            </div>

            {/* Verified External Profile Links ("SameAs" Reconciliation) */}
            <div>
              <h3 style={{ fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#94a3b8", marginBottom: "0.8rem", fontWeight: 700 }}>
                Official Verified Profiles & Channels
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "0.8rem" }}>
                <a
                  href="https://www.facebook.com/praveen.mahawar.5/"
                  target="_blank"
                  rel="me noreferrer"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.8rem",
                    padding: "0.85rem 1rem",
                    background: "rgba(24, 119, 242, 0.12)",
                    border: "1px solid rgba(24, 119, 242, 0.4)",
                    borderRadius: "8px",
                    color: "#93c5fd",
                    textDecoration: "none",
                    fontWeight: 700,
                    fontSize: "0.9rem"
                  }}
                >
                  <span style={{ fontSize: "1.3rem" }}>📘</span>
                  <div>
                    <div>Facebook Profile</div>
                    <div style={{ fontSize: "0.72rem", color: "#60a5fa", fontWeight: 500 }}>praveen.mahawar.5 (Jabalpur, MP)</div>
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
                    padding: "0.85rem 1rem",
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    borderRadius: "8px",
                    color: "#f8fafc",
                    textDecoration: "none",
                    fontWeight: 700,
                    fontSize: "0.9rem"
                  }}
                >
                  <span style={{ fontSize: "1.3rem" }}>🐙</span>
                  <div>
                    <div>GitHub Engineering</div>
                    <div style={{ fontSize: "0.72rem", color: "#94a3b8", fontWeight: 500 }}>@pravmahawar-create</div>
                  </div>
                </a>

                <a
                  href="mailto:garudaos.ai@gmail.com"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.8rem",
                    padding: "0.85rem 1rem",
                    background: "rgba(16, 185, 129, 0.1)",
                    border: "1px solid rgba(16, 185, 129, 0.3)",
                    borderRadius: "8px",
                    color: "#6ee7b7",
                    textDecoration: "none",
                    fontWeight: 700,
                    fontSize: "0.9rem"
                  }}
                >
                  <span style={{ fontSize: "1.3rem" }}>✉️</span>
                  <div>
                    <div>Official Contact</div>
                    <div style={{ fontSize: "0.72rem", color: "#34d399", fontWeight: 500 }}>garudaos.ai@gmail.com</div>
                  </div>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* The GARUDA-AI Innovations Section */}
        <section style={{ marginTop: "3.5rem" }}>
          <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
            <span style={{ fontSize: "0.75rem", padding: "0.25rem 0.75rem", background: "rgba(212,175,55,0.15)", color: "#d4af37", borderRadius: "999px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Core Technological Inventions
            </span>
            <h2 style={{ fontSize: "2rem", fontWeight: 900, color: "#f8fafc", marginTop: "0.8rem" }}>
              What Praveen Mahawar Built in GARUDA-AI
            </h2>
            <p style={{ color: "#94a3b8", maxWidth: "650px", margin: "0.5rem auto 0", fontSize: "0.95rem" }}>
              Architected from first principles in Jabalpur, Madhya Pradesh, to free modern software development from human fatigue and fragile prompts.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.2rem" }}>
            <div style={{ background: "#090d16", border: "1px solid #1e293b", borderRadius: "12px", padding: "1.6rem" }}>
              <div style={{ fontSize: "1.8rem", marginBottom: "0.8rem" }}>🧠</div>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#f8fafc", margin: "0 0 0.5rem 0" }}>
                Autonomous Mother Brain
              </h3>
              <p style={{ color: "#94a3b8", fontSize: "0.88rem", lineHeight: 1.6, margin: 0 }}>
                Central intelligence routing that coordinates autonomous multi-agent pipelines (`founder_garuda`) across 27 operational universes with zero manual micromanagement.
              </p>
            </div>

            <div style={{ background: "#090d16", border: "1px solid #1e293b", borderRadius: "12px", padding: "1.6rem" }}>
              <div style={{ fontSize: "1.8rem", marginBottom: "0.8rem" }}>🌌</div>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#c084fc", margin: "0 0 0.5rem 0" }}>
                BOT-VERSE Omnichannel Engine
              </h3>
              <p style={{ color: "#94a3b8", fontSize: "0.88rem", lineHeight: 1.6, margin: 0 }}>
                Official YouTube Data API v3 direct push integration, algorithmic video SEO, high-CTR title engineering, and multi-platform syndication across YouTube, Instagram, and LinkedIn.
              </p>
            </div>

            <div style={{ background: "#090d16", border: "1px solid #1e293b", borderRadius: "12px", padding: "1.6rem" }}>
              <div style={{ fontSize: "1.8rem", marginBottom: "0.8rem" }}>🛡️</div>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#34d399", margin: "0 0 0.5rem 0" }}>
                100% Anti-Fabrication Law
              </h3>
              <p style={{ color: "#94a3b8", fontSize: "0.88rem", lineHeight: 1.6, margin: 0 }}>
                Deterministic verification doctrine: GARUDA never hallucinates, never fabricates claims, and proves software through SHA-256 releases and live working code inside worktrees.
              </p>
            </div>

            <div style={{ background: "#090d16", border: "1px solid #1e293b", borderRadius: "12px", padding: "1.6rem" }}>
              <div style={{ fontSize: "1.8rem", marginBottom: "0.8rem" }}>⚡</div>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#38bdf8", margin: "0 0 0.5rem 0" }}>
                PAWAN Sovereign Coding Agent
              </h3>
              <p style={{ color: "#94a3b8", fontSize: "0.88rem", lineHeight: 1.6, margin: 0 }}>
                Fast-as-wind autonomous coding agent equipped with two-way voice command loops, multi-model execution, and closed-loop syntax self-repair.
              </p>
            </div>
          </div>
        </section>

        {/* Geographic Entity Anchor (Jabalpur, Madhya Pradesh) */}
        <section style={{ marginTop: "3.5rem", background: "rgba(15, 23, 42, 0.6)", border: "1px solid #334155", borderRadius: "12px", padding: "2rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.8rem", marginBottom: "1rem" }}>
            <span style={{ fontSize: "1.5rem" }}>🇮🇳</span>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#f8fafc", margin: 0 }}>
              Sovereign Indian AI Roots • Jabalpur, Madhya Pradesh
            </h3>
          </div>
          <p style={{ color: "#cbd5e1", fontSize: "0.95rem", lineHeight: 1.7, margin: 0 }}>
            Praveen Mahawar represents the rising wave of Indian deep-tech innovators engineering sovereign, high-performance artificial intelligence systems outside conventional metro silos. Engineered in the historic city of <strong>Jabalpur, Madhya Pradesh</strong>, GARUDA-AI stands as testament that world-dominating software architecture can be conceived, built, and deployed globally from the heart of India.
          </p>
        </section>

        {/* Bottom CTA */}
        <div style={{ marginTop: "3.5rem", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
          <h3 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#f8fafc", margin: 0 }}>
            Collaborate or Build with Praveen Mahawar &amp; GARUDA-AI
          </h3>
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", justifyContent: "center" }}>
            <a
              href="/chat"
              style={{
                padding: "0.75rem 1.6rem",
                background: "linear-gradient(135deg, #d4af37 0%, #aa820a 100%)",
                color: "#000",
                borderRadius: "8px",
                fontWeight: 800,
                textDecoration: "none",
                fontSize: "0.95rem"
              }}
            >
              ⚡ Start Autonomous Scoping Chat
            </a>
            <a
              href="/"
              style={{
                padding: "0.75rem 1.6rem",
                background: "#090d16",
                border: "1px solid #334155",
                color: "#cbd5e1",
                borderRadius: "8px",
                fontWeight: 700,
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
      <footer style={{ borderTop: "1px solid #1e293b", padding: "2rem", textAlign: "center", color: "#64748b", fontSize: "0.85rem" }}>
        © {new Date().getFullYear()} GARUDA-AI Operating System • Founder: Praveen Mahawar (Jabalpur, MP) • Official Domain: https://www.garudaos.in
      </footer>
    </div>
  );
}
