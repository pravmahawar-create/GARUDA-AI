import React from "react";
import { motion } from "framer-motion";

export default function PublicLanding({ onLoginClick }) {
  const capabilities = [
    { icon: "✦", title: "Fixed-Price AI Engineering", desc: "Custom AI agent development, workflow automation, and custom tool integration with predictable outcomes." },
    { icon: "◌", title: "Autonomous Operations", desc: "Background task discovery, automated intelligence processing, and governed execution monitoring." },
    { icon: "▣", title: "Technical Documentation", desc: "Automated architecture mapping, system flow diagramming, and automated API specification." }
  ];

  return (
    <div className="garuda-shell" style={{ display: "block", minHeight: "100vh", background: "#030712", color: "#f9fafb" }}>
      {/* Public Navigation Header */}
      <header style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "1.5rem 3rem",
        borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
        background: "rgba(17, 24, 39, 0.6)",
        backdropFilter: "blur(12px)",
        position: "sticky",
        top: 0,
        zIndex: 50
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <h2 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800, letterSpacing: "0.1em", color: "#ffffff" }}>GARUDA</h2>
          <span style={{ fontSize: "0.75rem", background: "rgba(251, 191, 36, 0.15)", color: "#fbbf24", padding: "0.2rem 0.6rem", borderRadius: "4px", fontWeight: 600 }}>AI OS</span>
        </div>
        <nav style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
          <a href="#overview" style={{ color: "#9ca3af", textDecoration: "none", fontSize: "0.95rem" }}>Overview</a>
          <a href="#capabilities" style={{ color: "#9ca3af", textDecoration: "none", fontSize: "0.95rem" }}>Capabilities</a>
          <a href="#pricing" style={{ color: "#9ca3af", textDecoration: "none", fontSize: "0.95rem" }}>Pricing</a>
          <button
            type="button"
            onClick={onLoginClick}
            style={{
              background: "linear-gradient(135deg, #fbbf24 0%, #d97706 100%)",
              color: "#000000",
              border: "none",
              padding: "0.6rem 1.5rem",
              borderRadius: "6px",
              fontWeight: 700,
              cursor: "pointer",
              fontSize: "0.9rem"
            }}
          >
            Founder Login
          </button>
        </nav>
      </header>

      {/* Hero Section */}
      <section id="overview" style={{ padding: "6rem 2rem", textAlign: "center", maxWidth: "900px", margin: "0 auto" }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <p style={{ color: "#fbbf24", letterSpacing: "0.15em", fontSize: "0.85rem", fontWeight: 700, marginBottom: "1rem" }}>
            GARUDA AI COMMERCIAL OPERATIONS
          </p>
          <h1 style={{ fontSize: "3.2rem", fontWeight: 800, lineHeight: 1.15, marginBottom: "1.5rem" }}>
            Autonomous Intelligence.<br />Human Accountability.
          </h1>
          <p style={{ color: "#9ca3af", fontSize: "1.2rem", lineHeight: 1.6, marginBottom: "2.5rem" }}>
            Fixed-price AI engineering, automation, API integration, and technical documentation delivered under Founder supervision.
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: "1rem" }}>
            <button
              onClick={onLoginClick}
              style={{
                background: "linear-gradient(135deg, #fbbf24 0%, #d97706 100%)",
                color: "#000000",
                border: "none",
                padding: "0.9rem 2.25rem",
                borderRadius: "6px",
                fontWeight: 800,
                fontSize: "1rem",
                cursor: "pointer"
              }}
            >
              Access Founder Portal
            </button>
          </div>
        </motion.div>
      </section>

      {/* Capabilities Section */}
      <section id="capabilities" style={{ padding: "5rem 2rem", background: "rgba(17, 24, 39, 0.4)", borderTop: "1px solid rgba(255, 255, 255, 0.05)" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
            <h2 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: "0.5rem" }}>Core Capabilities</h2>
            <p style={{ color: "#9ca3af" }}>Engineered for precision, governance, and rapid deployment.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "2rem" }}>
            {capabilities.map((item) => (
              <div key={item.title} style={{
                background: "rgba(31, 41, 55, 0.5)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "12px",
                padding: "2rem"
              }}>
                <div style={{ fontSize: "2rem", color: "#fbbf24", marginBottom: "1rem" }}>{item.icon}</div>
                <h3 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "0.75rem" }}>{item.title}</h3>
                <p style={{ color: "#9ca3af", fontSize: "0.95rem", lineHeight: 1.5 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing / Contact CTA Section */}
      <section id="pricing" style={{ padding: "5rem 2rem", textAlign: "center", maxWidth: "800px", margin: "0 auto" }}>
        <h2 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: "1rem" }}>Commercial Delivery</h2>
        <p style={{ color: "#9ca3af", fontSize: "1.1rem", marginBottom: "2rem" }}>
          Fixed-scope sprints backed by automated validation and proof-of-work output.
        </p>
        <button
          onClick={onLoginClick}
          style={{
            background: "rgba(255, 255, 255, 0.05)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            color: "#ffffff",
            padding: "0.8rem 2rem",
            borderRadius: "6px",
            fontWeight: 600,
            cursor: "pointer"
          }}
        >
          Contact / Request Proposal
        </button>
      </section>

      {/* Footer */}
      <footer style={{ padding: "2rem", textAlign: "center", borderTop: "1px solid rgba(255, 255, 255, 0.05)", color: "#6b7280", fontSize: "0.85rem" }}>
        © {new Date().getFullYear()} GARUDA AI Commercial Operations. All rights reserved.
      </footer>
    </div>
  );
}
