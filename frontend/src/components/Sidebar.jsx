import React, { useState } from "react";

const navItems = [
  { icon: "◈", label: "Dashboard" },
  { icon: "⟡", label: "Revenue Universe" },
  { icon: "✦", label: "Creative Studio" },
  { icon: "◌", label: "Mother Brain" },
  { icon: "◎", label: "Companion" }
];

export default function Sidebar() {
  const [activeItem, setActiveItem] = useState("Dashboard");

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <div className="sidebar__mark">G</div>
        <div>
          <h2>GARUDA</h2>
          <span>AI Operating System</span>
        </div>
      </div>

      <nav className="sidebar__nav">
        {navItems.map((item) => (
          <button
            key={item.label}
            className={`sidebar__button ${activeItem === item.label ? "active" : ""}`}
            onClick={() => setActiveItem(item.label)}
          >
            <span>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      <div className="sidebar__footer">
        <p>Founder access</p>
        <strong>Secure / Ready</strong>
      </div>
    </aside>
  );
}