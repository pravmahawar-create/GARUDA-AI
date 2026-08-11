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