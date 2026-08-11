import React from "react";
import BrandAssetImage from "./BrandAssetImage";

export default function FounderProfile({ onSignOut }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>
      <div className="sidebar__brand">
        <span className="sidebar__mark" style={{ borderRadius: 16, boxShadow: "0 0 28px rgba(212,175,55,0.3)" }}>
          <BrandAssetImage kind="branding" alt="Founder avatar" style={{ width: "100%", height: "100%", objectFit: "contain", display: "block", borderRadius: 16, padding: 3 }} />
        </span>
        <div>
          <h2>Founder</h2>
          <span>Praveen Mahawar</span>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#16a34a", boxShadow: "0 0 8px rgba(22,163,74,0.7)" }} />
        <span style={{ fontSize: "0.78rem", color: "#8b94a6" }}>Founder access locked</span>
      </div>
      {typeof onSignOut === "function" && (
        <button
          type="button"
          onClick={onSignOut}
          style={{ background: "rgba(239,68,68,0.12)", color: "#f87171", border: "1px solid rgba(239,68,68,0.3)", padding: "0.45rem 1rem", borderRadius: 10, cursor: "pointer", fontWeight: 600, fontSize: "0.82rem", textAlign: "center" }}
        >
          Sign Out
        </button>
      )}
    </div>
  );
}