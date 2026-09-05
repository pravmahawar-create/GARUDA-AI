import React, { useMemo, useState } from "react";
import BrandAssetImage from "./BrandAssetImage";
import FounderProfile from "./FounderProfile";

const navItems = [
  { icon: "👑", label: "GARUDA Kingdom" },
  { icon: "⚡", label: "Mission Control" },
  { icon: "◈", label: "Dashboard" },
  { icon: "🌌", label: "BOT-VERSE Omni-Channel" },
  { icon: "💨", label: "PAWAN Coding Studio" },
  { icon: "🎯", label: "Sales Cockpit" },
  { icon: "⟡", label: "Revenue Universe" },
  { icon: "✦", label: "Creative Universe" },
  { icon: "✎", label: "Content Factory" },
  { icon: "◈", label: "Brand Studio" },
  { icon: "☰", label: "Digital Presence" },
  { icon: "🎪", label: "Entertainment Studio" },
  { icon: "◌", label: "Mother Brain" },
  { icon: "⬢", label: "Knowledge" },
  { icon: "▣", label: "Projects" },
  { icon: "◎", label: "Settings" }
];

export default function Sidebar({ onSelectNav, onSignOut }) {
  const [activeItem, setActiveItem] = useState("Dashboard");
  const [isExpanded, setIsExpanded] = useState(false);

  const activeLabel = useMemo(
    () => navItems.find((item) => item.label === activeItem)?.label || "Dashboard",
    [activeItem]
  );

  function handleSelect(label) {
    setActiveItem(label);
    setIsExpanded(false);
    if (typeof onSelectNav === "function") {
      onSelectNav(label);
    }
  }

  return (
    <aside className={`sidebar ${isExpanded ? "sidebar--expanded" : ""}`}>
      <div className="sidebar__topbar">
        <div className="sidebar__brand">
          <BrandAssetImage
            kind="branding"
            alt="GARUDA brand mark"
            className="sidebar__mark"
          />
          <div>
            <h2>GARUDA</h2>
            <span>AI Operating System</span>
          </div>
        </div>

        <button
          type="button"
          className="sidebar__toggle"
          aria-expanded={isExpanded}
          aria-label={isExpanded ? "Collapse navigation" : "Expand navigation"}
          onClick={() => setIsExpanded((value) => !value)}
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      <div className="sidebar__section-label">Navigation</div>

      <nav className="sidebar__nav" aria-label="Primary navigation">
        {navItems.map((item) => {
          const isActive = activeItem === item.label;

          return (
            <button
              key={item.label}
              type="button"
              className={`sidebar__button ${isActive ? "is-active" : ""}`}
              aria-current={isActive ? "page" : undefined}
              aria-label={item.label}
              onClick={() => handleSelect(item.label)}
            >
              <span className="sidebar__icon" aria-hidden="true">{item.icon}</span>
              <span className="sidebar__label">{item.label}</span>
              {isActive ? <span className="sidebar__active-pill">Active</span> : null}
            </button>
          );
        })}
      </nav>

      <div className="sidebar__footer">
        {typeof onSignOut === "function" ? (
          <FounderProfile onSignOut={onSignOut} />
        ) : (
          <>
            <p>Founder access</p>
            <strong>{activeLabel}</strong>
          </>
        )}
      </div>
    </aside>
  );
}