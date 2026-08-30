import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import SEOHead from "../components/SEOHead";
import { openPristineWhitePdf } from "../utils/printPdf";

const GOLD = "#d4af37";
const GOLD_LIGHT = "#fef08a";
const BG = "#030712";
const PANEL = "rgba(15, 23, 42, 0.75)";
const BORDER = "rgba(212, 175, 55, 0.25)";

export default function BrandStudio() {
  const navigate = useNavigate();
  const [brandName, setBrandName] = useState("GARUDA AI Operating System");
  const [positioning, setPositioning] = useState("Sovereign AI Operating System for Autonomous Business Execution");
  const [isAuditing, setIsAuditing] = useState(false);
  const [brandDossier, setBrandDossier] = useState(null);

  const handleAuditBrand = () => {
    setIsAuditing(true);
    setTimeout(() => {
      setBrandDossier({
        brandName,
        positioning,
        colorPalette: [
          { name: "Obsidian Core", hex: "#030712", rgb: "rgb(3, 7, 18)", role: "Primary Background & Depth" },
          { name: "Sovereign Gold", hex: "#d4af37", rgb: "rgb(212, 175, 55)", role: "Primary Accent, Sigil & Borders" },
          { name: "Gold Radiance", hex: "#fef08a", rgb: "rgb(254, 240, 138)", role: "High-Contrast Highlights" },
          { name: "Verification Green", hex: "#75f4ab", rgb: "rgb(117, 244, 171)", role: "Live Truth & Cryptographic Status" }
        ],
        typography: {
          display: "Cinzel / Syne (Sovereign Authority)",
          body: "Inter / Manrope (Clean Enterprise Legibility)",
          code: "Fira Code (Deterministic Integrity)"
        },
        voiceRules: [
          "Never use generic marketing buzzwords without operational proof.",
          "State technical limits honestly — Truth Law (Amendment 7) strictly enforced.",
          "Maintain sovereign, calm, high-conviction executive tone.",
          "All quantitative performance metrics must tie to verifiable SHA-256 seals."
        ],
        identitySeal: "sha256_brand_" + Math.random().toString(16).slice(2, 10) + "99c1"
      });
      setIsAuditing(false);
    }, 600);
  };

  const handlePrintPdf = () => {
    if (!brandDossier) return;
    openPristineWhitePdf({
      title: `GARUDA Brand Universe (U21) — IdentityLock™ Brand Dossier: ${brandDossier.brandName}`,
      subtitle: `Positioning: ${brandDossier.positioning}`,
      sections: [
        {
          heading: "Color Architecture & Palette",
          content: brandDossier.colorPalette.map(c => `• ${c.name} (${c.hex}): ${c.role}`).join("\n")
        },
        {
          heading: "Typography Signatures",
          content: `Display: ${brandDossier.typography.display}\nBody: ${brandDossier.typography.body}\nCode: ${brandDossier.typography.code}`
        },
        {
          heading: "Sovereign Voice & Tone Governance",
          content: brandDossier.voiceRules.map((r, i) => `${i + 1}. ${r}`).join("\n")
        },
        {
          heading: "IdentityLock™ Cryptographic Seal",
          content: `IdentityLock Hash: ${brandDossier.identitySeal}\nVerified by GARUDA Brand Universe (U21).`
        }
      ]
    });
  };

  return (
    <main style={{ minHeight: "100vh", background: BG, color: "#f8fafc", fontFamily: "sans-serif", padding: "1.5rem" }}>
      <SEOHead
        title="Brand Universe (U21) — Sovereign IdentityLock™ Brand Studio"
        description="Brand identity governance, typography systems, color architecture, and executive voice enforcement of GARUDA OS."
        canonical="https://www.garudaos.in/brand"
      />

      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${BORDER}`, paddingBottom: "1rem", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <span style={{ fontSize: "1.5rem", color: GOLD }}>◈</span>
              <span style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.15em", color: GOLD, fontWeight: "bold" }}>
                GARUDA UNIVERSE 21 · RING 3
              </span>
              <span style={{ background: "rgba(56, 189, 248, 0.15)", color: "#38bdf8", fontSize: "0.7rem", padding: "0.2rem 0.6rem", borderRadius: "999px", fontWeight: "bold" }}>
                STUDIO EXECUTABLE
              </span>
            </div>
            <h1 style={{ fontSize: "1.8rem", margin: "0.3rem 0 0", color: "#fff" }}>
              Sovereign IdentityLock™ Studio
            </h1>
            <p style={{ margin: "0.2rem 0 0", color: "#94a3b8", fontSize: "0.9rem" }}>
              Brand architecture, typography systems, color governance, and sovereign voice discipline.
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
            <h3 style={{ margin: "0 0 1rem", color: GOLD, fontSize: "1.1rem" }}>Brand Identity Parameters</h3>

            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", fontSize: "0.8rem", color: "#94a3b8", marginBottom: "0.3rem" }}>Brand / Entity Name</label>
              <input
                type="text"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                style={{ width: "100%", padding: "0.6rem", background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "6px", color: "#fff" }}
              />
            </div>

            <div style={{ marginBottom: "1.25rem" }}>
              <label style={{ display: "block", fontSize: "0.8rem", color: "#94a3b8", marginBottom: "0.3rem" }}>Brand Positioning Statement</label>
              <textarea
                rows={3}
                value={positioning}
                onChange={(e) => setPositioning(e.target.value)}
                style={{ width: "100%", padding: "0.6rem", background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "6px", color: "#fff" }}
              />
            </div>

            <button
              type="button"
              onClick={handleAuditBrand}
              disabled={isAuditing}
              style={{ width: "100%", padding: "0.8rem", background: "linear-gradient(135deg, #d4af37, #b8860b)", border: "none", borderRadius: "8px", color: "#000", fontWeight: "bold", fontSize: "0.95rem", cursor: "pointer" }}
            >
              {isAuditing ? "Enforcing Brand Lock..." : "🛡 Enforce IdentityLock™ Guidelines"}
            </button>
          </div>

          <div style={{ background: PANEL, border: `1px solid ${BORDER}`, borderRadius: "12px", padding: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3 style={{ margin: 0, color: GOLD, fontSize: "1.1rem" }}>IdentityLock™ Dossier</h3>
              {brandDossier && (
                <button
                  type="button"
                  onClick={handlePrintPdf}
                  style={{ background: "rgba(212,175,55,0.15)", color: GOLD_LIGHT, border: `1px solid ${GOLD}`, borderRadius: "6px", padding: "0.3rem 0.7rem", fontSize: "0.75rem", cursor: "pointer" }}
                >
                  📄 Print Brand Dossier PDF
                </button>
              )}
            </div>

            {!brandDossier ? (
              <div style={{ textAlign: "center", padding: "3rem 1rem", color: "#64748b" }}>
                <span style={{ fontSize: "2.5rem", display: "block", marginBottom: "0.5rem" }}>🛡</span>
                Click <strong>Enforce IdentityLock™ Guidelines</strong> to generate color architecture, typography signatures, and sovereign voice rules.
              </div>
            ) : (
              <div>
                <h4 style={{ fontSize: "0.85rem", color: GOLD, margin: "0 0 0.5rem", textTransform: "uppercase" }}>Color Architecture</h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginBottom: "1rem" }}>
                  {brandDossier.colorPalette.map((c) => (
                    <div key={c.hex} style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "6px", padding: "0.6rem", display: "flex", alignItems: "center", gap: "0.6rem" }}>
                      <div style={{ width: "24px", height: "24px", borderRadius: "4px", background: c.hex, border: "1px solid #fff" }} />
                      <div style={{ fontSize: "0.75rem" }}>
                        <div style={{ color: "#fff", fontWeight: "bold" }}>{c.name}</div>
                        <div style={{ color: "#94a3b8" }}>{c.hex}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <h4 style={{ fontSize: "0.85rem", color: GOLD, margin: "0 0 0.5rem", textTransform: "uppercase" }}>Voice Discipline Rules</h4>
                <ul style={{ paddingLeft: "1.2rem", margin: "0 0 1rem", fontSize: "0.8rem", color: "#cbd5e1" }}>
                  {brandDossier.voiceRules.map((r, idx) => <li key={idx} style={{ marginBottom: "0.3rem" }}>{r}</li>)}
                </ul>

                <div style={{ background: "rgba(117,244,171,0.08)", border: "1px solid rgba(117,244,171,0.3)", borderRadius: "6px", padding: "0.6rem", fontSize: "0.75rem", color: "#75f4ab" }}>
                  ✔ Sovereign Seal: {brandDossier.identitySeal}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
