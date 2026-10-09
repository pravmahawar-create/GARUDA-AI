import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import SEOHead from "../components/SEOHead";
import { SOLUTIONS_DATA } from "../config/solutionsData";
import { PALETTE } from "../theme/palette";

export default function SolutionsHub() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("ALL");
  const solutionsList = Object.values(SOLUTIONS_DATA);

  const categories = [
    { id: "ALL", label: `All Problems (${solutionsList.length})` },
    { id: "pwa", label: "📱 PWA & Mobile", match: ["pwa", "mobile"] },
    { id: "ai", label: "🤖 AI & Agents", match: ["ai", "conversational", "receptionist", "support", "swarms"] },
    { id: "academic", label: "🎓 Academic & Legal", match: ["academic", "legal", "phd"] },
    { id: "retail", label: "🛒 Retail & Billing", match: ["retail", "pos", "gst"] },
    { id: "cyber", label: "🛡️ Cyber & Reputation", match: ["cyber", "reputation", "troll"] },
    { id: "fintech", label: "💳 Fintech & Rails", match: ["fintech", "payment", "stripe"] },
    { id: "electoral", label: "🗳️ Electoral & Cadre", match: ["electoral", "political", "booth"] },
    { id: "health", label: "🥗 Health & Nutrition", match: ["clinical", "nutrition", "health"] },
    { id: "code", label: "⚡ Code & Sprints", match: ["refactoring", "engineering", "sprint", "developer"] },
  ];

  const filteredSolutions = solutionsList.filter((s) => {
    const q = search.toLowerCase();
    const matchesSearch = !q || (
      s.title.toLowerCase().includes(q) ||
      s.category.toLowerCase().includes(q) ||
      s.symptom.toLowerCase().includes(q) ||
      (s.targetQuery && s.targetQuery.toLowerCase().includes(q))
    );

    if (!matchesSearch) return false;
    if (activeCategory === "ALL") return true;

    const catObj = categories.find(c => c.id === activeCategory);
    if (!catObj || !catObj.match) return true;

    const catText = (s.category + " " + s.title + " " + s.slug).toLowerCase();
    return catObj.match.some(m => catText.includes(m));
  });

  const hubSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "GARUDA OS Solutions Directory — Emergency Problem Resolutions",
    "description": "Comprehensive engineering blueprints and 48-hour production resolutions for after-hours lead drops, WhatsApp automation, mobile speed bottlenecks, and agency white-label scaling.",
    "url": "https://www.garudaos.in/solutions"
  };

  return (
    <div style={{ minHeight: "100vh", background: PALETTE.canvas, color: PALETTE.text, fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}>
      <SEOHead
        title="Solutions & Emergency Engineering Blueprints | GARUDA OS"
        description="Solve your business's critical technical and revenue bottlenecks in 48 hours. Explore solutions for after-hours lead loss, WhatsApp automation, and urgent development."
        canonical="https://www.garudaos.in/solutions"
        schema={hubSchema}
      />

      {/* Top Header */}
      <header style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(247, 244, 238, 0.94)", backdropFilter: "blur(14px)", borderBottom: `1px solid ${PALETTE.border}`, padding: "1rem 1.5rem" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Link to="/" style={{ display: "flex", alignItems: "center", gap: "0.75rem", textDecoration: "none" }}>
            <span style={{ fontSize: "1.25rem", fontWeight: 800, letterSpacing: "-0.02em", color: PALETTE.text, fontFamily: "'Playfair Display', Georgia, serif" }}>
              GARUDA <span style={{ color: PALETTE.goldDeep }}>SOLUTIONS</span>
            </span>
          </Link>

          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <Link to="/audit" style={{ fontSize: "0.85rem", padding: "0.45rem 0.95rem", borderRadius: "8px", background: PALETTE.redBg, border: "1px solid rgba(220, 38, 38, 0.25)", color: PALETTE.red, textDecoration: "none", fontWeight: 700 }}>
              ⚡ Free Lead-Leak Audit
            </Link>
            <Link to="/chat" style={{ fontSize: "0.85rem", padding: "0.45rem 0.95rem", borderRadius: "8px", background: PALETTE.card, border: `1px solid ${PALETTE.border}`, color: PALETTE.text, textDecoration: "none", fontWeight: 600, boxShadow: PALETTE.shadowSm }}>
              Talk to Architect
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "3.5rem 1.5rem 6rem" }}>
        {/* Banner */}
        <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.4rem 1rem", borderRadius: "9999px", background: PALETTE.goldHalo, border: `1px solid ${PALETTE.borderGold}`, color: PALETTE.goldDeep, fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "1.25rem" }}>
            Forensic Problem Directory
          </div>

          <h1 style={{ fontSize: "clamp(2rem, 5vw, 3.25rem)", fontWeight: 800, lineHeight: 1.18, letterSpacing: "-0.03em", margin: "0 0 1.25rem", color: PALETTE.text, fontFamily: "'Playfair Display', Georgia, serif" }}>
            Identify Your Bottleneck. Solve It In 48 Hours.
          </h1>

          <p style={{ maxWidth: 650, margin: "0 auto 2.5rem", color: PALETTE.muted, fontSize: "1.05rem", lineHeight: 1.6 }}>
            Every business problem maps to a deterministic engineering solution. Select your current bottleneck below to view the architectural breakdown and 48-hour resolution plan.
          </p>

          {/* Quick Filter Box */}
          <div style={{ maxWidth: 500, margin: "0 auto 1.5rem" }}>
            <input
              type="text"
              placeholder="Search problem (e.g. pwa, leads, speed, whatsapp, billing)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: "100%", background: PALETTE.card, border: `1px solid ${PALETTE.border}`, borderRadius: "10px", padding: "0.85rem 1.25rem", color: PALETTE.text, fontSize: "0.95rem", outline: "none", boxSizing: "border-box", boxShadow: PALETTE.shadowSm }}
            />
          </div>

          {/* Category Filter Pills */}
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "0.5rem", maxWidth: 900, margin: "0 auto" }}>
            {categories.map((cat) => {
              const active = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  style={{
                    background: active ? PALETTE.goldGradient : PALETTE.card,
                    color: active ? "#FFFFFF" : PALETTE.muted,
                    fontWeight: active ? 700 : 500,
                    border: active ? `1px solid ${PALETTE.goldPrimary}` : `1px solid ${PALETTE.border}`,
                    borderRadius: "9999px",
                    padding: "0.4rem 0.95rem",
                    fontSize: "0.8rem",
                    cursor: "pointer",
                    boxShadow: active ? PALETTE.shadowGold : PALETTE.shadowSm,
                    transition: "all 0.15s ease"
                  }}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Free Audit Highlight Card */}
        <div style={{ background: PALETTE.card, border: "1px solid rgba(220, 38, 38, 0.22)", borderRadius: "16px", padding: "2rem 2.25rem", marginBottom: "3rem", display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "1.5rem", boxShadow: PALETTE.shadowMd }}>
          <div>
            <div style={{ fontSize: "0.75rem", fontWeight: 700, color: PALETTE.red, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.35rem" }}>
              Instant Diagnostic Tool
            </div>
            <h2 style={{ fontSize: "1.45rem", fontWeight: 800, margin: "0 0 0.45rem", color: PALETTE.text, fontFamily: "'Playfair Display', Georgia, serif" }}>
              Not sure why your website visitors aren't converting?
            </h2>
            <p style={{ margin: 0, fontSize: "0.92rem", color: PALETTE.muted, maxWidth: 620, lineHeight: 1.55 }}>
              Run our free Lead-Leak & Speed Scanner to pinpoint after-hours drops, mobile TTFB latency, and missing conversion triggers in 5 seconds.
            </p>
          </div>

          <Link
            to="/audit"
            style={{ background: PALETTE.red, color: "#FFFFFF", padding: "0.85rem 1.65rem", borderRadius: "10px", fontWeight: 700, textDecoration: "none", fontSize: "0.95rem", whiteSpace: "nowrap", boxShadow: "0 4px 14px rgba(220, 38, 38, 0.25)", transition: "opacity 0.2s" }}
          >
            Launch Free Audit →
          </Link>
        </div>

        {/* Solutions Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.5rem" }}>
          {filteredSolutions.map((sol) => (
            <Link
              key={sol.slug}
              to={`/solutions/${sol.slug}`}
              style={{ background: PALETTE.card, border: `1px solid ${PALETTE.border}`, borderRadius: "14px", padding: "1.75rem", textDecoration: "none", color: "inherit", display: "flex", flexDirection: "column", justifyContent: "space-between", boxShadow: PALETTE.shadowSm, transition: "transform 0.2s, box-shadow 0.2s, border-color 0.2s" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-3px)";
                e.currentTarget.style.borderColor = PALETTE.borderGold;
                e.currentTarget.style.boxShadow = PALETTE.shadowLg;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.borderColor = PALETTE.border;
                e.currentTarget.style.boxShadow = PALETTE.shadowSm;
              }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.85rem" }}>
                  <span style={{ fontSize: "0.72rem", color: PALETTE.goldDeep, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    {sol.category}
                  </span>
                  <span style={{ fontSize: "0.68rem", padding: "0.2rem 0.55rem", borderRadius: "4px", background: PALETTE.redBg, color: PALETTE.red, fontWeight: 700, border: "1px solid rgba(220, 38, 38, 0.15)" }}>
                    {sol.urgencyLevel}
                  </span>
                </div>

                <h3 style={{ fontSize: "1.2rem", fontWeight: 700, margin: "0 0 0.85rem", color: PALETTE.text, lineHeight: 1.4, fontFamily: "'Playfair Display', Georgia, serif" }}>
                  {sol.title}
                </h3>

                <p style={{ fontSize: "0.88rem", color: PALETTE.muted, lineHeight: 1.55, margin: "0 0 1.35rem" }}>
                  {sol.symptom}
                </p>
              </div>

              <div>
                <div style={{ padding: "0.8rem 1rem", borderRadius: "8px", background: PALETTE.canvasSubtle, border: `1px solid ${PALETTE.borderSubtle}`, marginBottom: "1rem", display: "flex", justifyContent: "space-between", fontSize: "0.82rem" }}>
                  <span style={{ color: PALETTE.muted }}>Resolution Turnaround:</span>
                  <span style={{ color: PALETTE.goldDeep, fontWeight: 800 }}>{sol.stats.resolutionTime}</span>
                </div>

                <span style={{ color: PALETTE.goldDeep, fontSize: "0.88rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.35rem" }}>
                  View Forensic Blueprint →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
