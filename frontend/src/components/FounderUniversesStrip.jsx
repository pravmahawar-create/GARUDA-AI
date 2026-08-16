import React from "react";
import { getFounderUniverses, getRevenueHub, STATUS } from "../config/universes";

const statusColor = (status) => {
  const meta = STATUS[status] || STATUS.ROADMAP;
  return meta.color || "#8b94a6";
};

export default function FounderUniversesStrip({ onSelectNav }) {
  const founder = getFounderUniverses();
  const hub = getRevenueHub();

  return (
    <section className="founder-fd fd-card" aria-label="Inner core founder universes">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "1.1rem", flexWrap: "wrap", gap: "0.5rem" }}>
        <div>
          <p className="fd-eyebrow">INNER CORE</p>
          <h2 className="fd-heading" style={{ margin: "0.25rem 0 0", fontSize: "1.3rem" }}>Founder Universes</h2>
          <p style={{ margin: "0.2rem 0 0", color: "var(--fd-muted)", fontSize: "0.82rem" }}>
            11 architecture engines. Every universe reports to Revenue — the reporting hub.
          </p>
        </div>
      </div>

      <div className="fd-strip">
        {founder.map((u) => {
          const isHub = u.hub === true;
          return (
            <button
              key={u.num}
              type="button"
              onClick={() => {
                if (isHub && onSelectNav) onSelectNav("Revenue Universe");
              }}
              className={`fd-strip__item ${isHub ? "fd-strip__item--hub" : ""}`}
              style={{ textAlign: "left", color: "inherit", font: "inherit", cursor: isHub ? "pointer" : "default", display: "flex", flexDirection: "column", gap: "0.5rem", border: isHub ? "1px solid rgba(212,175,55,0.5)" : "1px solid var(--fd-line)" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                <span style={{ fontFamily: "ui-monospace, monospace", color: "var(--fd-gold)", fontWeight: 800, fontSize: "0.78rem" }}>
                  {String(u.num).padStart(2, "0")}
                </span>
                {isHub ? (
                  <span style={{ fontSize: "0.62rem", fontWeight: 800, letterSpacing: "0.1em", padding: "0.16rem 0.5rem", borderRadius: 999, border: "1px solid rgba(212,175,55,0.55)", background: "rgba(212,175,55,0.14)", color: "var(--fd-gold)" }}>HUB</span>
                ) : (
                  <span style={{ width: 9, height: 9, borderRadius: "50%", background: statusColor(u.status), boxShadow: `0 0 8px ${statusColor(u.status)}88` }} />
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.55rem" }}>
                <span style={{ fontSize: "1.2rem", color: isHub ? "var(--fd-gold)" : "var(--fd-gold)" }}>{u.icon}</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: "0.98rem", fontWeight: 700 }}>{u.name.replace(" Universe", "")}</h3>
                  <span style={{ color: "var(--fd-muted)", fontSize: "0.7rem" }}>{u.status === "ROADMAP" ? "coming soon" : u.status.toLowerCase()}</span>
                </div>
              </div>
              <p style={{ margin: 0, color: "var(--fd-muted)", fontSize: "0.76rem", lineHeight: 1.45 }}>{u.tagline}</p>
              {isHub && <span style={{ fontSize: "0.74rem", color: "var(--fd-gold)", fontWeight: 700 }}>Open Revenue Console →</span>}
            </button>
          );
        })}
      </div>
    </section>
  );
}