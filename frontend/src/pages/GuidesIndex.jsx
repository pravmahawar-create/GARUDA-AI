import React, { useState } from "react";
import { Link } from "react-router-dom";
import SEOHead from "../components/SEOHead";
import WhatsAppQuickCTA from "../components/WhatsAppQuickCTA";
import { GUIDES_DATA } from "../config/guidesData";

export default function GuidesIndex() {
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const guidesList = Object.values(GUIDES_DATA);

  const categories = ["ALL", ...Array.from(new Set(guidesList.map((g) => g.category)))];

  const filteredGuides = selectedCategory === "ALL"
    ? guidesList
    : guidesList.filter((g) => g.category === selectedCategory);

  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "GARUDA Engineering & AI Architecture Guides",
    "description": "Comprehensive engineering blueprints, architectural comparisons, and implementation guides for custom AI, multi-agent graphs, RAG, and SaaS software.",
    "url": "https://www.garudaos.in/guides",
    "publisher": {
      "@type": "Organization",
      "name": "GARUDA AI",
      "url": "https://www.garudaos.in",
      "logo": "https://www.garudaos.in/favicon-512x512.png"
    }
  };

  return (
    <div style={{ background: "#05070b", color: "#f7f2dc", minHeight: "100vh", fontFamily: "Inter, sans-serif" }}>
      <SEOHead
        title="Engineering & AI Architecture Guides | GARUDA AI"
        description="Comprehensive technical guides, architectural comparisons, and engineering blueprints for custom AI development, autonomous agents, RAG, SaaS MVPs, and business automation."
        canonical="https://www.garudaos.in/guides"
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />

      {/* Header */}
      <header style={{ borderBottom: "1px solid rgba(245, 215, 110, 0.15)", background: "rgba(5, 7, 11, 0.95)", position: "sticky", top: 0, zIndex: 50, backdropFilter: "blur(8px)" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0.9rem 1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Link to="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <img src="/favicon-48x48.png" alt="GARUDA Logo" style={{ width: "32px", height: "32px", borderRadius: "6px" }} />
            <span style={{ fontSize: "1.2rem", fontWeight: 800, letterSpacing: "0.12em", color: "#fff" }}>GARUDA</span>
          </Link>
          <nav style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
            <Link to="/#services" style={{ color: "#8d95a7", textDecoration: "none", fontSize: "0.88rem", fontWeight: 500 }}>Commercial Services</Link>
            <Link to="/what-is-garuda-ai" style={{ color: "#8d95a7", textDecoration: "none", fontSize: "0.88rem", fontWeight: 500 }}>Entity Architecture</Link>
            <Link to="/chat" style={{ padding: "0.45rem 1rem", background: "linear-gradient(135deg, #d4af37 0%, #aa820a 100%)", color: "#000", borderRadius: "6px", textDecoration: "none", fontSize: "0.85rem", fontWeight: 700 }}>
              Talk to Architect
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{ maxWidth: "1200px", margin: "0 auto", padding: "4rem 1.5rem 2.5rem" }}>
        <div style={{ display: "inline-block", padding: "0.3rem 0.8rem", borderRadius: "20px", background: "rgba(245, 215, 110, 0.12)", border: "1px solid rgba(245, 215, 110, 0.3)", color: "#f5d76e", fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "1rem" }}>
          GARUDA KNOWLEDGE & ARCHITECTURE LIBRARY
        </div>
        <h1 style={{ fontSize: "clamp(2.2rem, 4.5vw, 3.4rem)", fontWeight: 800, lineHeight: 1.15, margin: "0 0 1.2rem", color: "#fff" }}>
          Engineering Guides & AI Architectural Blueprints
        </h1>
        <p style={{ fontSize: "1.15rem", color: "#94a3b8", maxWidth: "800px", lineHeight: 1.6, margin: "0 0 2rem" }}>
          In-depth technical guides, architectural comparisons, and decision frameworks for CTOs, founders, and engineering leaders building custom AI, autonomous agents, RAG, and scalable software.
        </p>

        {/* Category Pills */}
        <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                padding: "0.45rem 1.1rem",
                borderRadius: "20px",
                border: selectedCategory === cat ? "1px solid #f5d76e" : "1px solid rgba(245, 215, 110, 0.16)",
                background: selectedCategory === cat ? "rgba(245, 215, 110, 0.2)" : "rgba(11, 15, 22, 0.6)",
                color: selectedCategory === cat ? "#f5d76e" : "#8d95a7",
                fontSize: "0.85rem",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.15s ease"
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* Guides Grid */}
      <section style={{ maxWidth: "1200px", margin: "0 auto", padding: "1rem 1.5rem 6rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: "1.8rem" }}>
          {filteredGuides.map((guide) => (
            <article
              key={guide.slug}
              style={{
                borderRadius: "14px",
                border: "1px solid rgba(245, 215, 110, 0.18)",
                background: "rgba(11, 15, 22, 0.75)",
                padding: "1.8rem",
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
                transition: "border-color 0.2s ease, transform 0.2s ease"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#f5d76e", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  {guide.category}
                </span>
                <span style={{ fontSize: "0.78rem", color: "#64748b" }}>
                  {guide.readingTime}
                </span>
              </div>

              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, margin: 0, lineHeight: 1.35 }}>
                <Link
                  to={`/guides/${guide.slug}`}
                  style={{ color: "#fff", textDecoration: "none" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#f5d76e")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#fff")}
                >
                  {guide.title}
                </Link>
              </h2>

              <p style={{ fontSize: "0.9rem", color: "#94a3b8", lineHeight: 1.55, margin: 0 }}>
                {guide.summary}
              </p>

              <div style={{ marginTop: "auto", paddingTop: "1rem", borderTop: "1px solid rgba(245, 215, 110, 0.08)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Link
                  to={`/guides/${guide.slug}`}
                  style={{ color: "#f5d76e", textDecoration: "none", fontSize: "0.88rem", fontWeight: 700 }}
                >
                  Read Architecture Guide →
                </Link>
                <Link
                  to={`/services/${guide.relatedServiceSlug}`}
                  style={{ color: "#8d95a7", textDecoration: "none", fontSize: "0.78rem" }}
                >
                  Services
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Footer Commercial Callout */}
      <footer style={{ borderTop: "1px solid rgba(245, 215, 110, 0.15)", background: "rgba(11, 15, 22, 0.9)", padding: "3rem 1.5rem" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1.5rem" }}>
          <div>
            <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#fff", marginBottom: "0.4rem" }}>GARUDA AI Operating System</div>
            <div style={{ fontSize: "0.85rem", color: "#8d95a7" }}>Autonomous AI systems & software engineering delivered with deterministic verification.</div>
          </div>
          <div style={{ display: "flex", gap: "1.5rem" }}>
            <Link to="/" style={{ color: "#8d95a7", textDecoration: "none", fontSize: "0.85rem" }}>Home</Link>
            <Link to="/what-is-garuda-ai" style={{ color: "#8d95a7", textDecoration: "none", fontSize: "0.85rem" }}>What is GARUDA</Link>
            <Link to="/chat" style={{ color: "#f5d76e", textDecoration: "none", fontSize: "0.85rem", fontWeight: 700 }}>Talk to Solution Architect</Link>
          </div>
        </div>
      </footer>

      <WhatsAppQuickCTA topic="engineering-guides" />
    </div>
  );
}
