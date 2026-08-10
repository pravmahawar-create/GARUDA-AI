import React from "react";
import { STATUS, RINGS } from "../config/universes";

const palette = {
  bg: "#04070a",
  panel: "#0b0f16",
  line: "rgba(245, 215, 110, 0.16)",
  text: "#f7f2dc",
  muted: "#8d95a7",
  gold: "#f5d76e",
  goldStrong: "#b8860b"
};

export default function UniverseDetail({ universe, onClose }) {
  if (!universe) return null;
  const statusMeta = STATUS[universe.status] || STATUS.ROADMAP;
  const ring = RINGS.find((r) => r.id === universe.ring);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 90,
        background: "rgba(2, 4, 8, 0.72)",
        backdropFilter: "blur(6px)",
        display: "grid",
        placeItems: "center",
        padding: "1.25rem"
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`${universe.name} detail`}
        style={{
          width: "min(680px, 100%)",
          maxHeight: "86vh",
          overflowY: "auto",
          background: "linear-gradient(160deg, rgba(245,215,110,0.06), rgba(11,15,22,0.98))",
          border: "1px solid rgba(245,215,110,0.22)",
          borderRadius: 22,
          padding: "1.8rem"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", marginBottom: "1.2rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <span style={{ fontFamily: "ui-monospace, monospace", color: palette.gold, fontWeight: 800, fontSize: "1.1rem" }}>
              {String(universe.num).padStart(2, "0")}
            </span>
            <span style={{ fontSize: "1.8rem", color: palette.gold }}>{universe.icon}</span>
            <div>
              <h2 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800 }}>{universe.name}</h2>
              <p className="eyebrow" style={{ margin: "0.25rem 0 0", color: palette.goldStrong }}>
                Ring {universe.ring} — {ring?.name}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close universe detail"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(245,215,110,0.3)",
              color: palette.text,
              width: 36,
              height: 36,
              borderRadius: "50%",
              fontSize: "1rem",
              cursor: "pointer",
              flexShrink: 0
            }}
          >
            ×
          </button>
        </div>

        <p style={{ margin: "0 0 0.3rem", fontSize: "1.05rem", color: palette.text, fontWeight: 600 }}>{universe.tagline}</p>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", margin: "0.9rem 0 1.3rem" }}>
          <StatusBadge status={universe.status} />
          {ring && <span style={{ color: palette.muted, fontSize: "0.82rem" }}>{ring.blurb}</span>}
        </div>

        {universe.flagship && (
          <div style={{ padding: "0.9rem 1.1rem", borderRadius: 12, border: "1px solid rgba(245,215,110,0.3)", background: "rgba(245,215,110,0.08)", marginBottom: "1.3rem" }}>
            <p className="eyebrow" style={{ marginBottom: "0.3rem", color: palette.goldStrong }}>FLAGSHIP IDEA</p>
            <p style={{ margin: 0, color: palette.text, fontWeight: 700, fontSize: "1rem" }}>{universe.flagship}</p>
          </div>
        )}

        <p className="eyebrow" style={{ marginBottom: "0.6rem", color: palette.muted }}>SUB-UNIVERSES & MODULES</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem", marginBottom: "1.4rem" }}>
          {universe.modules.map((mod) => (
            <span key={mod} style={{ display: "inline-flex", alignItems: "center", gap: "0.45rem", padding: "0.45rem 0.85rem", borderRadius: 999, border: "1px solid rgba(245,215,110,0.18)", background: "rgba(11,15,22,0.8)", color: palette.text, fontSize: "0.88rem" }}>
              {mod}
              <span style={{ fontSize: "0.58rem", fontWeight: 800, letterSpacing: "0.08em", color: palette.muted, border: "1px solid rgba(141,149,167,0.3)", padding: "0.08rem 0.35rem", borderRadius: 999 }}>
                {universe.status === "ROADMAP" ? "COMING SOON" : "ON MAP"}
              </span>
            </span>
          ))}
        </div>

        {universe.note && <p style={{ margin: 0, color: palette.muted, fontSize: "0.9rem", lineHeight: 1.6 }}>📌 {universe.note}</p>}
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const meta = STATUS[status] || STATUS.ROADMAP;
  return (
    <span style={{
      fontSize: "0.68rem",
      fontWeight: 800,
      letterSpacing: "0.1em",
      padding: "0.3rem 0.7rem",
      borderRadius: 999,
      border: `1px solid ${meta.color}66`,
      background: `${meta.color}14`,
      color: meta.color
    }}>
      {meta.label}
    </span>
  );
}