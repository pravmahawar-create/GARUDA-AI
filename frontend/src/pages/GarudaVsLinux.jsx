import React from "react";
import { useNavigate, Link } from "react-router-dom";
import SEOHead from "../components/SEOHead";

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
    <div style={{ minHeight: "100vh", background: "#04070a", color: "#f7f2dc", fontFamily: "Inter, sans-serif" }}>
      <SEOHead
        title="GARUDA AI vs Garuda Linux: Understanding the Difference | GARUDA"
        description="GARUDA AI (garudaos.in) is an AI Operating System for business automation. Garuda Linux is an Arch Linux desktop OS. Learn the clear distinction."
        canonical="https://www.garudaos.in/garuda-ai-vs-garuda-linux"
        schema={faqSchema}
      />
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1.2rem clamp(1.25rem, 4vw, 4rem)", borderBottom: "1px solid rgba(245,215,110,0.12)", background: "rgba(4,7,10,0.9)", position: "sticky", top: 0, zIndex: 50 }}>
        <button onClick={() => navigate("/")} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <span style={{ fontSize: "1.35rem", fontWeight: 900, letterSpacing: "0.12em", color: "#fff" }}>GARUDA</span>
          <span style={{ fontSize: "0.7rem", background: "rgba(245,215,110,0.14)", color: "#f5d76e", padding: "0.2rem 0.55rem", borderRadius: 4, fontWeight: 700 }}>AI OS</span>
        </button>
        <nav style={{ display: "flex", gap: "1.2rem", alignItems: "center" }}>
          <Link to="/what-is-garuda-ai" style={{ color: "#9ca3af", textDecoration: "none", fontSize: "0.9rem" }}>What is GARUDA AI?</Link>
          <Link to="/chat" style={{ background: "linear-gradient(135deg, #f5d76e, #b8860b)", color: "#05070a", padding: "0.5rem 1.2rem", borderRadius: 999, textDecoration: "none", fontWeight: 800, fontSize: "0.85rem" }}>Talk to Architect →</Link>
        </nav>
      </header>

      <main style={{ maxWidth: 900, margin: "0 auto", padding: "3rem 1.5rem 4rem" }}>
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <div style={{ display: "inline-block", padding: "0.35rem 1rem", borderRadius: 999, border: "1px solid rgba(245,215,110,0.3)", background: "rgba(245,215,110,0.06)", color: "#f5d76e", fontSize: "0.78rem", fontWeight: 700, letterSpacing: "0.1em", marginBottom: "1rem" }}>BRAND ENTITY CLARIFICATION</div>
          <h1 style={{ fontSize: "clamp(2rem, 5vw, 3rem)", fontWeight: 900, lineHeight: 1.15, margin: 0 }}>GARUDA AI vs Garuda Linux — <span style={{ background: "linear-gradient(120deg, #f5d76e, #ffdf8a 55%, #b8860b)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>Understanding the Difference</span></h1>
          <p style={{ color: "#8d95a7", fontSize: "1.05rem", lineHeight: 1.65, maxWidth: 680, margin: "1.2rem auto 0" }}>Two completely different products. One shared name inspired by the mythical Garuda. Here is the clear distinction for search engines, AI answer systems, and humans.</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem", marginBottom: "2.5rem" }}>
          <div style={{ background: "rgba(11,15,22,0.85)", border: "1px solid rgba(245,215,110,0.25)", borderRadius: 16, padding: "1.8rem" }}>
            <div style={{ fontSize: "1.6rem", marginBottom: "0.6rem" }}>🦅</div>
            <h2 style={{ color: "#f5d76e", fontSize: "1.2rem", fontWeight: 800, margin: "0 0 0.6rem" }}>GARUDA AI</h2>
            <p style={{ color: "#d1d5db", fontSize: "0.92rem", lineHeight: 1.6, margin: 0 }}><strong>AI Operating System for Autonomous Business Execution.</strong><br />Custom AI, multi-agent workflows, SaaS MVPs, business automations, WhatsApp/Telegram bots. Founded by Praveen Mahawar in Jabalpur, India. Official domain: <a href="https://www.garudaos.in" style={{ color: "#f5d76e" }}>garudaos.in</a></p>
            <div style={{ marginTop: "1rem", display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
              <Link to="/what-is-garuda-ai" style={{ color: "#f5d76e", fontSize: "0.85rem", fontWeight: 700, textDecoration: "none" }}>What is GARUDA AI? →</Link>
              <Link to="/services/custom-ai-development" style={{ color: "#9ca3af", fontSize: "0.85rem", textDecoration: "none" }}>Services →</Link>
            </div>
          </div>
          <div style={{ background: "rgba(11,15,22,0.6)", border: "1px solid rgba(100,116,139,0.3)", borderRadius: 16, padding: "1.8rem" }}>
            <div style={{ fontSize: "1.6rem", marginBottom: "0.6rem" }}>🐧</div>
            <h2 style={{ color: "#94a3b8", fontSize: "1.2rem", fontWeight: 800, margin: "0 0 0.6rem" }}>Garuda Linux</h2>
            <p style={{ color: "#9ca3af", fontSize: "0.92rem", lineHeight: 1.6, margin: 0 }}><strong>Arch Linux-based desktop operating system.</strong><br />Beautiful, performant, gaming-focused Linux distro for personal computers. Open-source community project. Official domain: <a href="https://garudalinux.org" target="_blank" rel="noopener noreferrer" style={{ color: "#38bdf8" }}>garudalinux.org</a></p>
            <p style={{ color: "#64748b", fontSize: "0.82rem", marginTop: "0.8rem" }}>We respect Garuda Linux. If you searched for the Linux OS, please visit their official site above.</p>
          </div>
        </div>

        <section style={{ background: "rgba(11,15,22,0.6)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "1.8rem", marginBottom: "2rem" }}>
          <h3 style={{ color: "#fff", fontSize: "1.1rem", fontWeight: 800, margin: "0 0 0.8rem" }}>Quick Comparison</h3>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
              <thead><tr style={{ color: "#f5d76e", textAlign: "left", borderBottom: "1px solid rgba(245,215,110,0.2)" }}><th style={{ padding: "0.6rem" }}></th><th style={{ padding: "0.6rem" }}>GARUDA AI</th><th style={{ padding: "0.6rem" }}>Garuda Linux</th></tr></thead>
              <tbody style={{ color: "#cbd5e1" }}>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}><td style={{ padding: "0.6rem", color: "#8d95a7" }}>Category</td><td style={{ padding: "0.6rem" }}>AI / SaaS / Business Automation</td><td style={{ padding: "0.6rem" }}>Desktop Operating System</td></tr>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}><td style={{ padding: "0.6rem", color: "#8d95a7" }}>Website</td><td style={{ padding: "0.6rem" }}><a href="https://www.garudaos.in" style={{ color: "#f5d76e" }}>garudaos.in</a></td><td style={{ padding: "0.6rem" }}><a href="https://garudalinux.org" style={{ color: "#38bdf8" }}>garudalinux.org</a></td></tr>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}><td style={{ padding: "0.6rem", color: "#8d95a7" }}>Founded</td><td style={{ padding: "0.6rem" }}>Praveen Mahawar, Jabalpur, India</td><td style={{ padding: "0.6rem" }}>Open-source community</td></tr>
                <tr><td style={{ padding: "0.6rem", color: "#8d95a7" }}>Audience</td><td style={{ padding: "0.6rem" }}>Businesses, founders, enterprises</td><td style={{ padding: "0.6rem" }}>Linux desktop users, gamers</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        <section style={{ marginBottom: "2rem" }}>
          <h3 style={{ color: "#f5d76e", fontSize: "1.1rem", fontWeight: 800, marginBottom: "0.8rem" }}>Frequently Asked</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
            {faqSchema.mainEntity.map((f, i) => (
              <div key={i} style={{ background: "rgba(11,15,22,0.6)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "1rem 1.2rem" }}>
                <div style={{ color: "#f7f2dc", fontWeight: 700, fontSize: "0.95rem", marginBottom: "0.3rem" }}>{f.name}</div>
                <div style={{ color: "#94a3b8", fontSize: "0.9rem", lineHeight: 1.6 }}>{f.acceptedAnswer.text}</div>
              </div>
            ))}
          </div>
        </section>

        <div style={{ textAlign: "center", padding: "2rem", background: "linear-gradient(135deg, rgba(245,215,110,0.08), rgba(11,15,22,0.9))", border: "1px solid rgba(245,215,110,0.2)", borderRadius: 14 }}>
          <h3 style={{ color: "#fff", margin: "0 0 0.6rem" }}>Looking for Business AI & Automation?</h3>
          <p style={{ color: "#94a3b8", margin: "0 0 1.2rem" }}>You are in the right place. Scope your project with GARUDA's Solution Architect.</p>
          <Link to="/chat" style={{ display: "inline-block", background: "linear-gradient(135deg, #f5d76e, #b8860b)", color: "#05070a", padding: "0.8rem 1.8rem", borderRadius: 999, textDecoration: "none", fontWeight: 800 }}>Talk to Solution Architect →</Link>
        </div>
      </main>
      <footer style={{ textAlign: "center", padding: "2rem", borderTop: "1px solid rgba(255,255,255,0.06)", color: "#5b6472", fontSize: "0.82rem" }}>
        © 2026 GARUDA AI Operating System · <Link to="/what-is-garuda-ai" style={{ color: "#f5d76e", textDecoration: "none" }}>What is GARUDA AI?</Link> · <Link to="/praveen-mahawar" style={{ color: "#9ca3af", textDecoration: "none" }}>Praveen Mahawar</Link>
      </footer>
    </div>
  );
}
