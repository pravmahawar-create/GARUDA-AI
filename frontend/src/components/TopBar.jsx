import React from "react";

export default function TopBar() {
  return (
    <header className="topbar">
      <div className="topbar__title">
        <p className="eyebrow">Founder Interface</p>
        <h2>GARUDA Command Center</h2>
      </div>

      <div className="topbar__actions">
        <div className="topbar__pill">07 Jul 2026</div>
        <button className="topbar__button">+ New Mission</button>
      </div>
    </header>
  );
}