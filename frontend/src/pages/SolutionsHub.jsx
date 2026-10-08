import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import SEOHead from "../components/SEOHead";
import { SOLUTIONS_DATA } from "../config/solutionsData";

export default function SolutionsHub() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const solutionsList = Object.values(SOLUTIONS_DATA);

  const filteredSolutions = solutionsList.filter((s) => {
    const q = search.toLowerCase();
    return (
      s.title.toLowerCase().includes(q) ||
      s.category.toLowerCase().includes(q) ||
      s.symptom.toLowerCase().includes(q)
    );
  });

  const hubSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "GARUDA OS Solutions Directory — Emergency Problem Resolutions",
    "description": "Comprehensive engineering blueprints and 48-hour production resolutions for after-hours lead drops, WhatsApp automation, mobile speed bottlenecks, and agency white-label scaling.",
    "url": "https://www.garudaos.in/solutions"
  };

  return (
    <div style={{ minHeight: "100vh", background: "#030712", color: "#f3f4f6", fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      <SEOHead
        title="Solutions & Emergency Engineering Blueprints | GARUDA OS"
        description="Solve your business's critical technical and revenue bottlenecks in 48 hours. Explore solutions for after-hours lead loss, WhatsApp automation, and urgent development."
        canonical="https://www.garudaos.in/solutions"
        schema={hubSchema}
      />

      {/* Top Header */}
      <header style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(3, 7, 18, 0.85)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", padding: "1rem 1.5rem" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Link to="/" style={{ display: "flex", alignItems: "center", gap: "0.75rem", textDecoration: "none" }}>
            <span style={{ fontSize: "1.25rem", fontWeight: 800, letterSpacing: "-0.02em", color: "#fff" }}>
              GARUDA <span style={{ color: "#38bdf8" }}>SOLUTIONS</span>
            </span>
          </Link>

          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <Link to="/audit" style={{ fontSize: "0.85rem", padding: "0.45rem 0.9rem", borderRadius: "6px", background: "rgba(239, 68, 68, 0.15)", border: "1px solid rgba(239, 68, 68, 0.3)", color: "#fca5a5", textDecoration: "none", fontWeight: 600 }}>
              ⚡ Free Lead-Leak Audit
            </Link>
            <Link to="/chat" style={{ fontSize: "0.85rem", padding: "0.45rem 0.9rem", borderRadius: "6px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "#f3f4f6", textDecoration: "none", fontWeight: 500 }}>
              Talk to Architect
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "3.5rem 1.5rem 6rem" }}>
        {/* Banner */}
        <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.35rem 0.85rem", borderRadius: "9999px", background: "rgba(56, 189, 248, 0.1)", border: "1px solid rgba(56, 189, 248, 0.25)", color: "#38bdf8", fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "1.25rem" }}>
            Forensic Problem Directory
          </div>

          <h1 style={{ fontSize: "clamp(2rem, 5vw, 3.25rem)", fontWeight: 800, lineHeight: 1.15, letterSpacing: "-0.03em", margin: "0 0 1rem", color: "#fff" }}>
            Identify Your Bottleneck. Solve It In 48 Hours.
          </h1>

          <p style={{ maxWidth: 650, margin: "0 auto 2.5rem", color: "#94a3b8", fontSize: "1.05rem", lineHeight: 1.6 }}>
            Every business problem maps to a deterministic engineering solution. Select your current bottleneck below to view the architectural breakdown and 48-hour resolution plan.
          </p>

          {/* Quick Filter Box */}
          <div style={{ maxWidth: 500, margin: "0 auto" }}>
            <input
              type="text"
              placeholder="Search problem (e.g. leads, speed, whatsapp, agency)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: "100%", background: "rgba(15, 23, 42, 0.8)", border: "1px solid rgba(255, 255, 255, 0.15)", borderRadius: "10px", padding: "0.75rem 1.25rem", color: "#fff", fontSize: "0.95rem", outline: "none", boxSizing: "border-box" }}
            />
          </div>
        </div>

        {/* Free Audit Highlight Card */}
        <div style={{ background: "linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(15, 23, 42, 0.8) 100%)", border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: "16px", padding: "1.75rem 2rem", marginBottom: "3rem", display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "1.5rem" }}>
          <div>
            <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#f87171", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.35rem" }}>
              Instant Diagnostic Tool
            </div>
            <h2 style={{ fontSize: "1.35rem", fontWeight: 700, margin: "0 0 0.4rem", color: "#fff" }}>
              Not sure why your website visitors aren't converting?
            </h2>
            <p style={{ margin: 0, fontSize: "0.9rem", color: "#94a3b8", maxWidth: 600 }}>
              Run our free Lead-Leak & Speed Scanner to pinpoint after-hours drops, mobile TTFB latency, and missing conversion triggers in 5 seconds.
            </p>
          </div>

          <Link
            to="/audit"
            style={{ background: "#ef4444", color: "#fff", padding: "0.75rem 1.5rem", borderRadius: "8px", fontWeight: 700, textDecoration: "none", fontSize: "0.95rem", whiteSpace: "nowrap" }}
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
              style={{ background: "rgba(15, 23, 42, 0.6)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: "14px", padding: "1.75rem", textDecoration: "none", color: "inherit", display: "flex", flexDirection: "column", justifyContent: "space-between", transition: "transform 0.2s, border-color 0.2s" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-3px)";
                e.currentTarget.style.borderColor = "rgba(56, 189, 248, 0.4)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.08)";
              }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                  <span style={{ fontSize: "0.7rem", color: "#38bdf8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    {sol.category}
                  </span>
                  <span style={{ fontSize: "0.65rem", padding: "0.15rem 0.5rem", borderRadius: "4px", background: "rgba(239, 68, 68, 0.15)", color: "#fca5a5", fontWeight: 700 }}>
                    {sol.urgencyLevel}
                  </span>
                </div>

                <h3 style={{ fontSize: "1.15rem", fontWeight: 700, margin: "0 0 0.75rem", color: "#fff", lineHeight: 1.4 }}>
                  {sol.title}
                </h3>

                <p style={{ fontSize: "0.85rem", color: "#94a3b8", lineHeight: 1.5, margin: "0 0 1.25rem" }}>
                  {sol.symptom}
                </p>
              </div>

              <div>
                <div style={{ padding: "0.75rem", borderRadius: "8px", background: "rgba(2, 6, 23, 0.5)", border: "1px solid rgba(255, 255, 255, 0.04)", marginBottom: "1rem", display: "flex", justifyContent: "space-between", fontSize: "0.8rem" }}>
                  <span style={{ color: "#64748b" }}>Resolution Turnaround:</span>
                  <span style={{ color: "#38bdf8", fontWeight: 700 }}>{sol.stats.resolutionTime}</span>
                </div>

                <span style={{ color: "#38bdf8", fontSize: "0.85rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.35rem" }}>
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
