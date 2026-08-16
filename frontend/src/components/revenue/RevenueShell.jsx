import React, { useState } from "react";
import { GOLD, MUTED } from "./format";
import Overview from "./Overview";
import OpportunitiesView from "./OpportunitiesView";
import ProposalsView from "./ProposalsView";
import ExecutionView from "./ExecutionView";
import RevenueLedger from "./RevenueLedger";
import SettlementsView from "./SettlementsView";
import IntelligenceView from "./IntelligenceView";
import ActivityView from "./ActivityView";
import SettingsView from "./SettingsView";

const NAV = [
  { id: "overview", label: "Overview" },
  { id: "opportunities", label: "Opportunities" },
  { id: "proposals", label: "Proposals" },
  { id: "execution", label: "Execution" },
  { id: "revenue", label: "Revenue" },
  { id: "settlements", label: "Settlements" },
  { id: "intelligence", label: "Intelligence" },
  { id: "activity", label: "Activity" },
  { id: "settings", label: "Settings" }
];

export default function RevenueShell({ onBack }) {
  const [active, setActive] = useState("overview");

  const renderView = () => {
    switch (active) {
      case "opportunities": return <OpportunitiesView />;
      case "proposals": return <ProposalsView />;
      case "execution": return <ExecutionView />;
      case "revenue": return <RevenueLedger />;
      case "settlements": return <SettlementsView />;
      case "intelligence": return <IntelligenceView />;
      case "activity": return <ActivityView />;
      case "settings": return <SettingsView />;
      default: return <Overview onNavigate={setActive} />;
    }
  };

  return (
    <div className="founder-fd" style={{ minHeight: "100vh" }}>
      <div style={{ width: "100%" }}>
        <header
          style={{
            borderBottom: "1px solid var(--fd-line)",
            background: "rgba(10,13,19,0.85)",
            backdropFilter: "blur(10px)",
            position: "sticky",
            top: 0,
            zIndex: 20
          }}
        >
          <div style={{ maxWidth: 1240, margin: "0 auto", padding: "1rem 1.25rem", display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
            {typeof onBack === "function" && (
              <button
                type="button"
                onClick={onBack}
                style={{ background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.3)", color: "#eef1f6", borderRadius: 10, padding: "0.45rem 0.9rem", cursor: "pointer", fontSize: "0.82rem", fontWeight: 700 }}
              >
                ← Founder Console
              </button>
            )}
            <div style={{ minWidth: 0 }}>
              <p style={{ margin: 0, color: GOLD, fontSize: "0.7rem", fontWeight: 800, letterSpacing: "0.2em" }}>GARUDA AI OPERATING SYSTEM</p>
              <h1 className="fd-heading" style={{ margin: "0.15rem 0 0", fontSize: "1.35rem" }}>
                Revenue Universe
              </h1>
            </div>
            <div style={{ marginLeft: "auto", fontSize: "0.78rem", color: MUTED }}>
              Founder-scoped · reads production API · potential ≠ received
            </div>
          </div>
          <nav style={{ maxWidth: 1240, margin: "0 auto", padding: "0 1.25rem", overflowX: "auto", display: "flex", gap: "0.25rem", whiteSpace: "nowrap" }}>
            {NAV.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActive(item.id)}
                style={{
                  padding: "0.6rem 0.9rem",
                  fontSize: "0.82rem",
                  fontWeight: item.id === active ? 800 : 600,
                  color: item.id === active ? "#0a0d13" : "#c7ccd8",
                  background: item.id === active ? "linear-gradient(135deg, #d4af37 0%, #f5d76e 55%, #aa820a 100%)" : "transparent",
                  border: "none",
                  borderTopLeftRadius: 10,
                  borderTopRightRadius: 10,
                  cursor: "pointer"
                }}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </header>

        <main style={{ maxWidth: 1240, margin: "0 auto", padding: "1.5rem 1.25rem 3rem" }}>
          {renderView()}
        </main>
      </div>
    </div>
  );
}