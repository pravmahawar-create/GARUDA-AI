import React from "react";
import { useNavigate } from "react-router-dom";
import BrandAssetImage from "../components/BrandAssetImage";
import SEOHead from "../components/SEOHead";
import BotVerseEngineStudio from "../components/BotVerseEngineStudio";

export default function BotVerseStudio() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: "100vh", background: "#030712", color: "#f1f5f9", fontFamily: "system-ui, -apple-system, sans-serif", padding: "1.5rem 2rem" }}>
      <SEOHead
        title="GARUDA BOT-VERSE • Omni-Channel Video SEO & Algorithmic Growth"
        description="Autonomous 6-Platform Growth Engine for YouTube, Instagram Reels, Facebook, LinkedIn, Google Search Video Highlights, and WhatsApp Funnels."
      />

      {/* Top Header */}
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #1e293b", paddingBottom: "1.2rem", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <BrandAssetImage kind="branding" alt="GARUDA Logo" style={{ width: "36px", height: "36px" }} />
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <h1 style={{ fontSize: "1.3rem", fontWeight: "800", letterSpacing: "0.05em", color: "#f8fafc", margin: 0 }}>
                GARUDA BOT-VERSE
              </h1>
              <span style={{ fontSize: "0.7rem", padding: "0.15rem 0.5rem", background: "linear-gradient(135deg, rgba(168,85,247,0.3) 0%, rgba(59,130,246,0.3) 100%)", color: "#c084fc", borderRadius: "999px", border: "1px solid rgba(168,85,247,0.5)", fontWeight: "700" }}>
                6 PLATFORMS LIVE
              </span>
            </div>
            <div style={{ fontSize: "0.8rem", color: "#94a3b8", marginTop: "0.2rem" }}>
              YouTube SEO • Instagram Reels Feeder • Facebook Teasers • LinkedIn Carousels • Google Video Schema • Scoping Bridge
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: "flex", gap: "0.6rem" }}>
          <button
            onClick={() => navigate("/founder/acquisition?tab=bot_verse")}
            style={{ padding: "0.5rem 0.9rem", background: "#0f172a", border: "1px solid #334155", color: "#cbd5e1", borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem", fontWeight: "600" }}
          >
            🎯 Sales Cockpit
          </button>
          <button
            onClick={() => window.open("/chat", "_blank")}
            style={{ padding: "0.5rem 0.9rem", background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.4)", color: "#34d399", borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem", fontWeight: "600" }}
          >
            ⚡ Scoping Portal
          </button>
          <button
            onClick={() => navigate("/founder")}
            style={{ padding: "0.5rem 0.9rem", background: "linear-gradient(135deg, #d4af37 0%, #aa820a 100%)", border: "none", color: "#000", borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem", fontWeight: "700" }}
          >
            👑 Founder Console
          </button>
        </div>
      </header>

      {/* Main Studio Engine */}
      <BotVerseEngineStudio />
    </div>
  );
}
