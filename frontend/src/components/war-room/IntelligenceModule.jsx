import React, { useState } from "react";
import { tokens } from "./tokens";
import { WhyThisNumber } from "./EvidenceDrawer";

/**
 * 🦅 GARUDA OS — MODULE 02: INTELLIGENCE & NARRATIVE RADAR
 * Integrates: Area & Booth Clusters, Local Civic Issue Radar, Public Narrative Radar,
 * and Chronological Intelligence Event Stream with Evidence Traceability.
 */

export default function IntelligenceModule({
  constituency,
  selectedIssueId,
  onSelectIssueId,
  onOpenEvidence,
  onOpenDeepDive
}) {
  const p = tokens.palette;
  const [filterType, setFilterType] = useState("ALL"); // ALL, CIVIC, NARRATIVE, SYSTEM

  const INTELLIGENCE_EVENTS = [
    { time: "11:21:44", type: "REVIEW", source: "Crisis Workflow Module", status: "PENDING", evidenceRef: "ECI-PWD-4102", text: "Municipal pipeline counter-rebuttal script generated. Human sign-off required." },
    { time: "11:21:02", type: "ANALYSIS", source: "Electoral Polarity Engine", status: "VERIFIED", evidenceRef: "FORM-20-AGG", text: "Turnout calculation completed across 348 Polling Booths (52.84% benchmark)." },
    { time: "11:20:19", type: "VALIDATION", source: "Evidence Vault Core", status: "VERIFIED", evidenceRef: "SHA256-TH148", text: "Dataset SHA-256 checksum verified against official ECI final roll." },
    { time: "11:20:04", type: "DATA INGESTION", source: "Municipal Gazette Scraper", status: "VERIFIED", evidenceRef: "TMC-GAZ-089", text: "Booth cluster dataset synchronized for Wards 14, 18, and 22." },
    { time: "10:45:12", type: "NARRATIVE DETECTED", source: "Regional Print RSS", status: "PARTIAL", evidenceRef: "NEWS-RSS-88", text: "Opposition allegation reported regarding Majiwada flyover delay." }
  ];

  const filteredEvents = filterType === "ALL"
    ? INTELLIGENCE_EVENTS
    : INTELLIGENCE_EVENTS.filter(e => e.type.includes(filterType) || (filterType === "SYSTEM" && (e.type === "VALIDATION" || e.type === "DATA INGESTION")));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* SECTION HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <span style={{ fontSize: "0.68rem", fontFamily: tokens.typography.fontMono, color: p.metallicGold, letterSpacing: "0.15em", textTransform: "uppercase" }}>
            MODULE 02 // SOVEREIGN INTELLIGENCE RADAR
          </span>
          <h2 style={{ fontSize: "1.5rem", fontFamily: tokens.typography.fontDisplay, color: p.textPrimary, margin: "2px 0 0 0" }}>
            Civic Signals & Public Narrative Radar
          </h2>
        </div>
        <button
          type="button"
          onClick={() => onOpenDeepDive("02")}
          style={{ background: "transparent", border: `1px solid ${p.borderGold}`, color: p.metallicGold, borderRadius: 5, padding: "5px 12px", fontSize: "0.72rem", fontFamily: tokens.typography.fontMono, cursor: "pointer" }}
        >
          [ HOW INTELLIGENCE WORKS → ]
        </button>
      </div>

      {/* TWO COLUMN GRID: BOOTH POCKETS + CIVIC ISSUE RADAR */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 16 }}>

        {/* AREA & BOOTH CLUSTERS */}
        <div style={{ background: p.graphite, border: `1px solid ${p.border}`, borderRadius: 12, padding: "18px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div>
              <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: p.warmIvory, margin: 0, fontFamily: tokens.typography.fontUI }}>
                AREA & BOOTH CLUSTER SIGNALS
              </h3>
              <p style={{ fontSize: "0.75rem", color: p.textSecondary, margin: "2px 0 0 0" }}>
                Empirical demographic indicators & turnout variance.
              </p>
            </div>
            <span style={{ fontSize: "0.7rem", fontFamily: tokens.typography.fontMono, color: p.metallicGold }}>
              {constituency.pockets.length} KEY CLUSTERS
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {constituency.pockets.map((pocket, idx) => {
              const stateColor = pocket.condition === "RED" ? p.statusRed : pocket.condition === "AMBER" ? p.statusAmber : p.statusGreen;
              const stateBg = pocket.condition === "RED" ? p.statusRedBg : pocket.condition === "AMBER" ? p.statusAmberBg : p.statusGreenBg;
              return (
                <div key={idx} style={{ border: `1px solid ${stateColor}35`, background: p.surfaceElevated, borderRadius: 8, padding: "12px 14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <span style={{ fontSize: "0.85rem", fontWeight: 600, color: p.textPrimary }}>{pocket.name}</span>
                    <span style={{ fontSize: "0.68rem", fontWeight: 700, fontFamily: tokens.typography.fontMono, color: stateColor, background: stateBg, padding: "2px 6px", borderRadius: 3 }}>
                      {pocket.label}
                    </span>
                  </div>
                  <div style={{ fontSize: "0.75rem", color: p.textSecondary, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>Booths {pocket.booths} · ~{pocket.electorsEst?.toLocaleString()} electors</span>
                    <span style={{ color: p.metallicGold, fontFamily: tokens.typography.fontMono, fontWeight: 600 }}>{pocket.primaryIssue}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* LOCAL CIVIC ISSUE RADAR */}
        <div style={{ background: p.graphite, border: `1px solid ${p.border}`, borderRadius: 12, padding: "18px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div>
              <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: p.warmIvory, margin: 0, fontFamily: tokens.typography.fontUI }}>
                LOCAL CIVIC ISSUE RADAR
              </h3>
              <p style={{ fontSize: "0.75rem", color: p.textSecondary, margin: "2px 0 0 0" }}>
                Derived from verified municipal grievance logs and news references.
              </p>
            </div>
            <span style={{ fontSize: "0.7rem", fontFamily: tokens.typography.fontMono, color: p.statusGreen }}>
              24x7 MONITORING
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {constituency.issueRadar.map((issue) => {
              const isSelected = selectedIssueId === issue.id;
              const isHigh = issue.signal === "HIGH";
              return (
                <div
                  key={issue.id}
                  onClick={() => onSelectIssueId(issue.id)}
                  style={{
                    border: isSelected ? `1.5px solid ${p.metallicGold}` : `1px solid ${p.border}`,
                    background: isSelected ? "rgba(196, 139, 40, 0.08)" : p.surfaceElevated,
                    borderRadius: 8,
                    padding: "12px 14px",
                    cursor: "pointer",
                    transition: "all 0.15s ease"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <span style={{ fontSize: "0.85rem", fontWeight: 600, color: p.textPrimary }}>{issue.name}</span>
                    <span style={{ fontSize: "0.68rem", fontWeight: 700, fontFamily: tokens.typography.fontMono, color: isHigh ? p.statusRed : p.statusAmber, background: isHigh ? p.statusRedBg : p.statusAmberBg, padding: "2px 6px", borderRadius: 3 }}>
                      {issue.signal} SIGNAL
                    </span>
                  </div>
                  <div style={{ fontSize: "0.75rem", color: p.textSecondary, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>{issue.publicReferences} public references · {issue.source}</span>
                    <span style={{ fontSize: "0.68rem", fontFamily: tokens.typography.fontMono, color: issue.status === "VERIFIED" ? p.statusGreen : p.statusAmber }}>
                      [{issue.status}]
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* PUBLIC NARRATIVE RADAR */}
      <div style={{ background: p.graphite, border: `1px solid ${p.border}`, borderRadius: 12, padding: "18px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div>
            <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: p.warmIvory, margin: 0, fontFamily: tokens.typography.fontUI }}>
              PUBLIC NARRATIVE MONITORING
            </h3>
            <p style={{ fontSize: "0.75rem", color: p.textSecondary, margin: "2px 0 0 0" }}>
              Publicly stated allegations cross-referenced against authoritative gazettes. Never assumes guilt.
            </p>
          </div>
          <span style={{ fontSize: "0.7rem", fontFamily: tokens.typography.fontMono, color: p.metallicGold }}>
            {constituency.narratives.length} ACTIVE SIGNALS
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 12 }}>
          {constituency.narratives.map((nar) => (
            <div key={nar.id} style={{ background: p.surfaceElevated, border: `1px solid ${p.border}`, borderRadius: 8, padding: "14px" }}>
              <div style={{ fontSize: "0.7rem", fontFamily: tokens.typography.fontMono, color: p.textMuted, marginBottom: 4 }}>
                SOURCE: {nar.source} · {nar.timestamp}
              </div>
              <div style={{ fontSize: "0.85rem", color: p.textPrimary, lineHeight: 1.45, marginBottom: 8, fontStyle: "italic" }}>
                "{nar.claim}"
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.72rem", fontFamily: tokens.typography.fontMono, fontWeight: 700, color: nar.verification.includes("Contradicted") ? p.statusRed : p.statusGreen }}>
                  {nar.verification}
                </span>
                <span style={{ fontSize: "0.68rem", fontFamily: tokens.typography.fontMono, color: p.metallicGold, background: p.obsidian, border: `1px solid ${p.border}`, borderRadius: 3, padding: "2px 6px" }}>
                  {nar.responseStatus}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CHRONOLOGICAL INTELLIGENCE EVENT STREAM (DIRECTIVE SECTION 7) */}
      <div style={{ background: p.graphite, border: `1px solid ${p.border}`, borderRadius: 12, padding: "18px" }}>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <div>
            <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: p.warmIvory, margin: 0, fontFamily: tokens.typography.fontUI }}>
              INTELLIGENCE EVENT TIMELINE
            </h3>
            <p style={{ fontSize: "0.75rem", color: p.textSecondary, margin: "2px 0 0 0" }}>
              Immutable chronological record of data ingestion, checksums, and analytical states.
            </p>
          </div>

          {/* Filter Pills */}
          <div style={{ display: "flex", gap: 6 }}>
            {["ALL", "REVIEW", "ANALYSIS", "SYSTEM", "NARRATIVE"].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setFilterType(tab)}
                style={{
                  background: filterType === tab ? p.surfaceElevated : "transparent",
                  color: filterType === tab ? p.metallicGold : p.textMuted,
                  border: filterType === tab ? `1px solid ${p.borderGold}` : `1px solid ${p.border}`,
                  borderRadius: 4,
                  padding: "3px 8px",
                  fontSize: "0.68rem",
                  fontFamily: tokens.typography.fontMono,
                  cursor: "pointer"
                }}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* TIMELINE LIST */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filteredEvents.map((evt, idx) => (
            <div key={idx} style={{ background: p.surfaceElevated, border: `1px solid ${p.border}`, borderRadius: 8, padding: "10px 14px", display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: "0.75rem", fontFamily: tokens.typography.fontMono, color: p.metallicGold, fontWeight: 700 }}>
                  [{evt.time}]
                </span>
                <span style={{ fontSize: "0.72rem", fontFamily: tokens.typography.fontMono, background: p.obsidian, border: `1px solid ${p.border}`, padding: "2px 6px", borderRadius: 4, color: p.textPrimary }}>
                  {evt.type}
                </span>
                <span style={{ fontSize: "0.82rem", color: p.textPrimary }}>
                  {evt.text}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: "0.7rem", fontFamily: tokens.typography.fontMono, color: p.textMuted }}>
                  REF: {evt.evidenceRef}
                </span>
                <span style={{ fontSize: "0.68rem", fontFamily: tokens.typography.fontMono, color: evt.status === "VERIFIED" ? p.statusGreen : p.statusAmber, fontWeight: 700 }}>
                  [{evt.status}]
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
