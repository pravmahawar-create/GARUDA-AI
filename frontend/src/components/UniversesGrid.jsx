import React from "react";
import { UNIVERSES, RINGS, STATUS, ACTIVE_GATE } from "../config/universes";

const palette = {
  bg: "#04070a",
  panel: "#0b0f16",
  line: "rgba(245, 215, 110, 0.16)",
  text: "#f7f2dc",
  muted: "#8d95a7",
  gold: "#f5d76e",
  goldStrong: "#b8860b"
};

const StatusPill = ({ status }) => {
  const meta = STATUS[status] || STATUS.ROADMAP;
  return (
    <span
      style={{
        fontSize: "0.62rem",
        fontWeight: 800,
        letterSpacing: "0.1em",
        padding: "0.2rem 0.55rem",
        borderRadius: 999,
        border: `1px solid ${meta.color}66`,
        background: `${meta.color}14`,
        color: meta.color,
        whiteSpace: "nowrap"
      }}
    >
      {meta.label}
    </span>
  );
};

const UniverseCard = ({ universe, onSelect }) => {
  const isLocked = ACTIVE_GATE.includes(universe.status);
  return (
    <button
      type="button"
      onClick={() => onSelect(universe)}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: "0.7rem",
        textAlign: "left",
        padding: "1.3rem",
        borderRadius: 18,
        border: isLocked ? "1px solid rgba(245,215,110,0.4)" : "1px solid rgba(245,215,110,0.12)",
        background: isLocked ? "linear-gradient(160deg, rgba(245,215,110,0.08), rgba(11,15,22,0.9))" : palette.panel,
        color: "inherit",
        font: "inherit",
        cursor: "pointer",
        transition: "transform 0.15s ease, border-color 0.15s ease"
      }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.borderColor = "rgba(245,215,110,0.5)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.borderColor = isLocked ? "rgba(245,215,110,0.4)" : "rgba(245,215,110,0.12)"; }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
        <span style={{ fontFamily: "ui-monospace, monospace", color: palette.gold, fontWeight: 800, fontSize: "0.8rem" }}>
          0{universe.num}
        </span>
        <StatusPill status={universe.status} />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
        <span style={{ fontSize: "1.3rem", color: palette.gold }}>{universe.icon}</span>
        <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700 }}>{universe.name}</h3>
      </div>
      <p style={{ margin: 0, color: palette.muted, fontSize: "0.88rem", lineHeight: 1.55 }}>{universe.tagline}</p>
      <span style={{ fontSize: "0.78rem", color: palette.goldStrong, fontWeight: 700 }}>Open universe →</span>
    </button>
  );
};

export default function UniversesGrid({ onSelect }) {
  const locked = UNIVERSES.filter((u) => ACTIVE_GATE.includes(u.status));
  const future = UNIVERSES.filter((u) => !ACTIVE_GATE.includes(u.status));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
      <section>
        <p className="eyebrow" style={{ marginBottom: "0.6rem" }}>ACTIVE & LOCKED UNIVERSES</p>
        <h2 style={{ margin: "0 0 0.4rem", fontSize: "1.4rem" }}>The engine room — live & locked</h2>
        <p style={{ margin: "0 0 1.2rem", color: palette.muted, fontSize: "0.92rem" }}>
          These universes are active, primary, mandatory, or architecturally locked — and being developed first, day by day.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "1rem" }}>
          {locked.map((u) => <UniverseCard key={u.num} universe={u} onSelect={onSelect} />)}
        </div>
      </section>

      <section>
        <p className="eyebrow" style={{ marginBottom: "0.6rem" }}>FUTURE UNIVERSES</p>
        <h2 style={{ margin: "0 0 0.4rem", fontSize: "1.4rem" }}>The civilization forming around the core</h2>
        <p style={{ margin: "0 0 1.2rem", color: palette.muted, fontSize: "0.92rem" }}>
          27 interconnected universes. Each one is an operating system. Together they form an AI civilization under founder control.
        </p>
        {RINGS.map((ring) => {
          const ringUniverses = future.filter((u) => u.ring === ring.id);
          if (ringUniverses.length === 0) return null;
          return (
            <div key={ring.id} style={{ marginBottom: "1.5rem" }}>
              <h3 style={{ margin: "0 0 0.2rem", fontSize: "0.85rem", letterSpacing: "0.14em", textTransform: "uppercase", color: palette.gold }}>
                Ring {ring.id} — {ring.name}
              </h3>
              <p style={{ margin: "0 0 0.9rem", color: palette.muted, fontSize: "0.82rem" }}>{ring.blurb}</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "1rem" }}>
                {ringUniverses.map((u) => <UniverseCard key={u.num} universe={u} onSelect={onSelect} />)}
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}