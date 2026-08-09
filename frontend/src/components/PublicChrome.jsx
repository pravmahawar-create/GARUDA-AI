import React from "react";
import { Link, useNavigate } from "react-router-dom";
import BrandAssetImage from "./BrandAssetImage";

const NAV = [
  { key: "", label: "Home", to: "/" },
  { key: "chat", label: "AI Chat", to: "/chat" },
  { key: "portal", label: "Client Portal", to: "/app" },
  { key: "founder", label: "Founder", to: "/founder" }
];

export default function PublicChrome({ active = "", children, footer = true }) {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "radial-gradient(circle at top, rgba(245,215,110,0.06), transparent 34%), #04070a" }}>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.9rem clamp(1.25rem, 4vw, 4rem)", borderBottom: "1px solid rgba(245,215,110,0.12)", background: "rgba(4,7,10,0.82)", backdropFilter: "blur(14px)", position: "sticky", top: 0, zIndex: 50 }}>
        <button type="button" onClick={() => navigate("/")} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.75rem", padding: 0 }}>
          <span style={{ width: 40, height: 40, display: "grid", placeItems: "center", overflow: "hidden", borderRadius: 10 }}>
            <BrandAssetImage kind="branding" alt="GARUDA sigil" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
          </span>
          <span style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", lineHeight: 1 }}>
            <span style={{ fontSize: "1.15rem", fontWeight: 800, letterSpacing: "0.12em", color: "#fff" }}>GARUDA</span>
            <span style={{ fontSize: "0.6rem", color: "#f5d76e", letterSpacing: "0.3em", fontWeight: 700, marginTop: "0.2rem" }}>AI OPERATING SYSTEM</span>
          </span>
        </button>
        <nav style={{ display: "flex", gap: "clamp(0.9rem, 2vw, 1.9rem)", alignItems: "center" }}>
          {NAV.map((item) => (
            <Link key={item.to} to={item.to} style={{ color: active === item.key ? "#f5d76e" : "#9ca3af", textDecoration: "none", fontSize: "0.9rem", fontWeight: active === item.key ? 700 : 500 }}>
              {item.label}
            </Link>
          ))}
          <button type="button" onClick={() => navigate("/signup")} style={{ background: "linear-gradient(135deg, #f5d76e 0%, #b8860b 100%)", color: "#05070b", border: "none", padding: "0.5rem 1.2rem", borderRadius: 999, fontWeight: 800, fontSize: "0.85rem", cursor: "pointer" }}>
            Get Started
          </button>
        </nav>
      </header>

      <div style={{ flex: 1 }}>{children}</div>

      {footer && (
        <footer style={{ padding: "2.6rem clamp(1.25rem, 4vw, 4rem)", borderTop: "1px solid rgba(245,215,110,0.1)", textAlign: "center", color: "#5b6472", fontSize: "0.85rem", lineHeight: 1.9 }}>
          <div style={{ display: "flex", justifyContent: "center", gap: "1.7rem", marginBottom: "1rem", flexWrap: "wrap" }}>
            <Link to="/" style={{ color: "#8d95a7", textDecoration: "none" }}>Home</Link>
            <Link to="/chat" style={{ color: "#8d95a7", textDecoration: "none" }}>Public AI Chat</Link>
            <Link to="/app" style={{ color: "#8d95a7", textDecoration: "none" }}>Client Portal</Link>
            <Link to="/signup" style={{ color: "#8d95a7", textDecoration: "none" }}>Get Started</Link>
            <Link to="/founder" style={{ color: "#5b6472", textDecoration: "none" }}>Founder Console</Link>
          </div>
          <div>© {new Date().getFullYear()} GARUDA AI Operating System</div>
          <div style={{ marginTop: "0.4rem", color: "#6b7280" }}>Founder-controlled · Audit-trailed · Ethical by default</div>
        </footer>
      )}
    </div>
  );
}