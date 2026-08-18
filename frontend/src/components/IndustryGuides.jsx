import React, { useState } from "react";
import { INDUSTRY_GUIDES } from "../config/industryGuides";

const palette = {
  panelSoft: "rgba(11, 15, 22, 0.72)",
  line: "rgba(245, 215, 110, 0.16)",
  text: "#f7f2dc",
  muted: "#8d95a7",
  gold: "#f5d76e",
  goldStrong: "#b8860b"
};

export default function IndustryGuides() {
  const [openId, setOpenId] = useState(null);
  const toggle = (id) => setOpenId((current) => (current === id ? null : id));

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
        gap: "1rem"
      }}
    >
      {INDUSTRY_GUIDES.map((guide) => {
        const isOpen = openId === guide.id;
        return (
          <div
            key={guide.id}
            style={{
              maxWidth: "none",
              padding: "1.3rem",
              borderRadius: 18,
              border: isOpen ? "1px solid rgba(245,215,110,0.45)" : "1px solid rgba(245,215,110,0.14)",
              background: palette.panelSoft,
              display: "flex",
              flexDirection: "column",
              gap: "0.6rem",
              transition: "border-color 0.15s ease"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
              <span style={{ fontSize: "1.4rem", color: palette.gold }}>{guide.icon}</span>
              <span style={{ fontFamily: "ui-monospace, monospace", color: palette.muted, fontSize: "0.68rem", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                guide
              </span>
            </div>
            <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700 }}>{guide.name}</h3>
            <p style={{ margin: 0, color: palette.muted, fontSize: "0.85rem", lineHeight: 1.5 }}>{guide.summary}</p>
            {isOpen && (
              <ul style={{ margin: "0.4rem 0 0", paddingLeft: "1.1rem", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                {guide.howGarudaHelps.map((point) => (
                  <li key={point} style={{ color: palette.text, fontSize: "0.82rem", lineHeight: 1.45 }}>{point}</li>
                ))}
              </ul>
            )}
            <button
              type="button"
              onClick={() => toggle(guide.id)}
              style={{
                marginTop: "auto",
                alignSelf: "flex-start",
                background: "none",
                border: "none",
                color: palette.gold,
                fontWeight: 700,
                fontSize: "0.82rem",
                cursor: "pointer",
                padding: "0.2rem 0"
              }}
            >
              {isOpen ? "Show less ↑" : "How GARUDA helps ↓"}
            </button>
          </div>
        );
      })}
    </div>
  );
}