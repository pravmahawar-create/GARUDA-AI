import React from "react";

function todayLabel() {
  return new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export default function TopBar() {
  return (
    <header className="topbar">
      <div className="topbar__title">
        <p className="eyebrow">Founder Interface</p>
        <h2>GARUDA Command Center</h2>
      </div>

      <div className="topbar__actions">
        <a
          href="/founder/access"
          style={{
            textDecoration: "none",
            background: "linear-gradient(135deg, rgba(212,175,55,0.25), rgba(184,134,11,0.5))",
            color: "#fef08a",
            border: "1px solid #d4af37",
            borderRadius: "999px",
            padding: "0.4rem 0.9rem",
            fontSize: "0.8rem",
            fontWeight: "bold",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.3rem"
          }}
        >
          👑 Kingdom Access
        </a>
        <div className="topbar__pill" title="Backend status indicator">
          <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: "#16a34a", boxShadow: "0 0 8px rgba(22,163,74,0.7)", marginRight: "0.45rem" }} />
          Live
        </div>
        <div className="topbar__pill">{todayLabel()}</div>
        <button className="topbar__button">+ New Mission</button>
      </div>
    </header>
  );
}