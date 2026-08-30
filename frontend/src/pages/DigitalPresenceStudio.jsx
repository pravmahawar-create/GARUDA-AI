import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import SEOHead from "../components/SEOHead";
import { openPristineWhitePdf } from "../utils/printPdf";

const GOLD = "#d4af37";
const GOLD_LIGHT = "#fef08a";
const BG = "#030712";
const PANEL = "rgba(15, 23, 42, 0.75)";
const BORDER = "rgba(212, 175, 55, 0.25)";

export default function DigitalPresenceStudio() {
  const navigate = useNavigate();
  const [serviceName, setServiceName] = useState("Custom Enterprise AI & Multi-Agent Development");
  const [targetMarket, setTargetMarket] = useState("Global B2B, Fintech, and Autonomous SaaS Companies");
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [presenceDossier, setPresenceDossier] = useState(null);

  const handleSynthesize = () => {
    setIsSynthesizing(true);
    setTimeout(() => {
      setPresenceDossier({
        serviceName,
        targetMarket,
        landingBlueprint: {
          heroHeadline: "Autonomous Custom AI Systems Built for Uncompromising Scale",
          subheadline: "Replace fragile AI prototypes with governed, multi-brain intelligence architectures.",
          primaryCta: "Schedule Technical Scoping Session",
          secondaryCta: "Explore Verified Case Studies"
        },
        seoTopicClusters: [
          { pillar: "Core Service", query: "enterprise custom ai development services", intent: "Commercial High-Intent", volume: "High" },
          { pillar: "Comparison", query: "ai agent architecture vs rule-based chatbots", intent: "Informational Authority", volume: "Medium" },
          { pillar: "Case Study", query: "how to build autonomous multi-agent systems", intent: "Technical Consideration", volume: "High" },
          { pillar: "Pricing & Scope", query: "enterprise rag system implementation cost", intent: "Direct Inbound", volume: "Medium" }
        ],
        canonicalRoutes: [
          "/services/custom-ai-development",
          "/services/ai-agent-development",
          "/services/rag-development",
          "/services/saas-mvp-development"
        ]
      });
      setIsSynthesizing(false);
    }, 600);
  };

  const handlePrintPdf = () => {
    if (!presenceDossier) return;
    openPristineWhitePdf({
      title: `GARUDA Digital Presence Universe (U22) — Landing & SEO Blueprint`,
      subtitle: `Service: ${presenceDossier.serviceName} | Market: ${presenceDossier.targetMarket}`,
      sections: [
        {
          heading: "High-Converting Hero Section Blueprint",
          content: `Headline: ${presenceDossier.landingBlueprint.heroHeadline}\nSubhead: ${presenceDossier.landingBlueprint.subheadline}\nPrimary CTA: ${presenceDossier.landingBlueprint.primaryCta}\nSecondary CTA: ${presenceDossier.landingBlueprint.secondaryCta}`
        },
        {
          heading: "SEO Topic Clusters & High-Intent Queries",
          content: presenceDossier.seoTopicClusters.map(c => `• [${c.pillar}] "${c.query}" (Intent: ${c.intent} | Search Vol: ${c.volume})`).join("\n")
        },
        {
          heading: "Canonical Service Portfolios Live on GARUDA",
          content: presenceDossier.canonicalRoutes.map(r => `• https://www.garudaos.in${r}`).join("\n")
        }
      ]
    });
  };

  return (
    <main style={{ minHeight: "100vh", background: BG, color: "#f8fafc", fontFamily: "sans-serif", padding: "1.5rem" }}>
      <SEOHead
        title="Digital Presence Universe (U22) — GARUDA Living Web & SEO Presence"
        description="High-converting landing page blueprints, SEO topic clusters, and service portfolio architectures of GARUDA OS."
        canonical="https://www.garudaos.in/digital-presence"
      />

      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${BORDER}`, paddingBottom: "1rem", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <span style={{ fontSize: "1.5rem", color: GOLD }}>☰</span>
              <span style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.15em", color: GOLD, fontWeight: "bold" }}>
                GARUDA UNIVERSE 22 · RING 3
              </span>
              <span style={{ background: "rgba(117, 244, 171, 0.15)", color: "#75f4ab", fontSize: "0.7rem", padding: "0.2rem 0.6rem", borderRadius: "999px", fontWeight: "bold" }}>
                PRODUCTION VERIFIED
              </span>
            </div>
            <h1 style={{ fontSize: "1.8rem", margin: "0.3rem 0 0", color: "#fff" }}>
              Digital Presence & Landing Engine
            </h1>
            <p style={{ margin: "0.2rem 0 0", color: "#94a3b8", fontSize: "0.9rem" }}>
              Living web surfaces, high-converting service landing pages, and search dominance topic clusters.
            </p>
          </div>

          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button
              type="button"
              onClick={() => navigate("/founder/access")}
              style={{ background: "linear-gradient(135deg, rgba(212,175,55,0.2), rgba(184,134,11,0.4))", color: GOLD_LIGHT, border: `1px solid ${GOLD}`, borderRadius: "8px", padding: "0.5rem 1rem", fontSize: "0.85rem", fontWeight: "bold", cursor: "pointer" }}
            >
              👑 Access GARUDA Kingdom
            </button>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "1.5rem" }}>
          <div style={{ background: PANEL, border: `1px solid ${BORDER}`, borderRadius: "12px", padding: "1.5rem" }}>
            <h3 style={{ margin: "0 0 1rem", color: GOLD, fontSize: "1.1rem" }}>Service & Audience Parameters</h3>

            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", fontSize: "0.8rem", color: "#94a3b8", marginBottom: "0.3rem" }}>Service / Offering Name</label>
              <input
                type="text"
                value={serviceName}
                onChange={(e) => setServiceName(e.target.value)}
                style={{ width: "100%", padding: "0.6rem", background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "6px", color: "#fff" }}
              />
            </div>

            <div style={{ marginBottom: "1.25rem" }}>
              <label style={{ display: "block", fontSize: "0.8rem", color: "#94a3b8", marginBottom: "0.3rem" }}>Target Market</label>
              <input
                type="text"
                value={targetMarket}
                onChange={(e) => setTargetMarket(e.target.value)}
                style={{ width: "100%", padding: "0.6rem", background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "6px", color: "#fff" }}
              />
            </div>

            <button
              type="button"
              onClick={handleSynthesize}
              disabled={isSynthesizing}
              style={{ width: "100%", padding: "0.8rem", background: "linear-gradient(135deg, #d4af37, #b8860b)", border: "none", borderRadius: "8px", color: "#000", fontWeight: "bold", fontSize: "0.95rem", cursor: "pointer" }}
            >
              {isSynthesizing ? "Synthesizing Architecture..." : "⚡ Generate Landing Blueprint & SEO Clusters"}
            </button>
          </div>

          <div style={{ background: PANEL, border: `1px solid ${BORDER}`, borderRadius: "12px", padding: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3 style={{ margin: 0, color: GOLD, fontSize: "1.1rem" }}>Digital Presence Blueprint</h3>
              {presenceDossier && (
                <button
                  type="button"
                  onClick={handlePrintPdf}
                  style={{ background: "rgba(212,175,55,0.15)", color: GOLD_LIGHT, border: `1px solid ${GOLD}`, borderRadius: "6px", padding: "0.3rem 0.7rem", fontSize: "0.75rem", cursor: "pointer" }}
                >
                  📄 Print Blueprint PDF
                </button>
              )}
            </div>

            {!presenceDossier ? (
              <div style={{ textAlign: "center", padding: "3rem 1rem", color: "#64748b" }}>
                <span style={{ fontSize: "2.5rem", display: "block", marginBottom: "0.5rem" }}>🌐</span>
                Click <strong>Generate Landing Blueprint</strong> to construct conversion-optimized hero layouts and high-intent SEO search clusters.
              </div>
            ) : (
              <div>
                <div style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", padding: "1rem", marginBottom: "1rem" }}>
                  <span style={{ color: "#38bdf8", fontSize: "0.75rem", fontWeight: "bold" }}>HERO WIREFRAME</span>
                  <h4 style={{ color: "#fff", fontSize: "1.1rem", margin: "0.3rem 0" }}>{presenceDossier.landingBlueprint.heroHeadline}</h4>
                  <p style={{ color: "#94a3b8", fontSize: "0.85rem", margin: "0 0 0.8rem" }}>{presenceDossier.landingBlueprint.subheadline}</p>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <span style={{ background: GOLD, color: "#000", padding: "0.3rem 0.7rem", borderRadius: "4px", fontSize: "0.75rem", fontWeight: "bold" }}>{presenceDossier.landingBlueprint.primaryCta}</span>
                    <span style={{ background: "rgba(255,255,255,0.1)", color: "#fff", padding: "0.3rem 0.7rem", borderRadius: "4px", fontSize: "0.75rem" }}>{presenceDossier.landingBlueprint.secondaryCta}</span>
                  </div>
                </div>

                <h4 style={{ fontSize: "0.85rem", color: GOLD, margin: "0 0 0.5rem", textTransform: "uppercase" }}>SEO Topic Clusters</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  {presenceDossier.seoTopicClusters.map((c, i) => (
                    <div key={i} style={{ background: "rgba(255,255,255,0.02)", padding: "0.5rem 0.7rem", borderRadius: "4px", fontSize: "0.8rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <strong style={{ color: "#fff" }}>"{c.query}"</strong>
                        <div style={{ color: "#64748b", fontSize: "0.75rem" }}>{c.pillar} · {c.intent}</div>
                      </div>
                      <span style={{ color: "#75f4ab", fontSize: "0.75rem" }}>Vol: {c.volume}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
