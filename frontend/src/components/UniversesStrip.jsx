import React from "react";
import { getPublicUniverses, STATUS } from "../config/universes";

const palette = {
  bg: "#04070a",
  panel: "#0b0f16",
  panelSoft: "rgba(11, 15, 22, 0.72)",
  line: "rgba(245, 215, 110, 0.16)",
  text: "#f7f2dc",
  muted: "#8d95a7",
  gold: "#f5d76e",
  goldStrong: "#b8860b"
};

const GROUP_META = {
  CREATE: { label: "CREATE", blurb: "Flagship creator studios and digital identity." },
  LIVE: { label: "LIVE", blurb: "Universes that power what customers see today." },
  GROW: { label: "GROW", blurb: "Growth and empowerment for real life." },
  FUTURE: { label: "FUTURE", blurb: "The far-future vision of the GARUDA civilization." }
};

export default function UniversesStrip({ onSelect }) {
  const publicUniverses = getPublicUniverses();
  const groups = ["CREATE", "LIVE", "GROW", "FUTURE"];
  const grouped = groups
    .map((group) => ({
      ...(GROUP_META[group] || { label: group, blurb: "" }),
      universes: publicUniverses.filter((u) => u.group === group)
    }))
    .filter((g) => g.universes.length > 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2.2rem" }}>
      {grouped.map((group) => (
        <section key={group.label} aria-label={group.label}>
          <p className="eyebrow" style={{ margin: "0 0 0.2rem", color: palette.gold }}>
            {group.label}
          </p>
          <p style={{ margin: "0 0 1rem", color: palette.muted, fontSize: "0.9rem" }}>{group.blurb}</p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
              gap: "1rem"
            }}
          >
            {group.universes.map((u) => {
              const meta = STATUS[u.status] || STATUS.ROADMAP;
              return (
                <button
                  key={u.num}
                  type="button"
                  onClick={() => onSelect(u)}
                  style={{
                    textAlign: "left",
                    padding: "1.3rem",
                    borderRadius: 18,
                    border: "1px solid rgba(245,215,110,0.14)",
                    background: palette.panelSoft,
                    color: "inherit",
                    font: "inherit",
                    cursor: "pointer",
                    transition: "transform 0.15s ease, border-color 0.15s ease",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.6rem"
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.borderColor = "rgba(245,215,110,0.5)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.borderColor = "rgba(245,215,110,0.14)"; }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                    <span style={{ fontFamily: "ui-monospace, monospace", color: palette.gold, fontWeight: 800, fontSize: "0.75rem" }}>
                      {String(u.num).padStart(2, "0")}
                    </span>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: meta.color, boxShadow: `0 0 8px ${meta.color}88` }} />
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.55rem" }}>
                    <span style={{ fontSize: "1.2rem", color: palette.gold }}>{u.icon}</span>
                    <h3 style={{ margin: 0, fontSize: "0.98rem", fontWeight: 700 }}>{u.name.replace(" Universe", "")}</h3>
                  </div>
                  <p style={{ margin: 0, color: palette.muted, fontSize: "0.8rem", lineHeight: 1.45 }}>{u.tagline}</p>
                  <span style={{ fontSize: "0.75rem", color: palette.goldStrong, fontWeight: 700 }}>Open →</span>
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}