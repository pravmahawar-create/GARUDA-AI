import React, { useState, useEffect } from "react";
import { tokens } from "./tokens";

/**
 * 🦅 GARUDA OS — COMMAND PALETTE (CTRL + K)
 * Operating-system level command launcher and global entity search.
 */

export default function CommandPalette({ isOpen, onClose, onSelectAction, constituency }) {
  const [search, setSearch] = useState("");
  const p = tokens.palette;

  // Listen for CTRL+K or ESC
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        if (isOpen) onClose();
        else onSelectAction({ type: "OPEN_PALETTE" });
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  const baseCommands = [
    { id: "mod-01", type: "NAVIGATION", target: "01", label: "01 — Open Mission Control", category: "Navigation" },
    { id: "mod-02", type: "NAVIGATION", target: "02", label: "02 — Open Intelligence & Narrative Radar", category: "Navigation" },
    { id: "mod-03", type: "NAVIGATION", target: "03", label: "03 — Open Field Operations & Cadre Matrix", category: "Navigation" },
    { id: "mod-04", type: "NAVIGATION", target: "04", label: "04 — Open Electoral Analytics (Form 20)", category: "Navigation" },
    { id: "mod-05", type: "NAVIGATION", target: "05", label: "05 — Open Scenario Lab & Simulation", category: "Navigation" },
    { id: "mod-06", type: "NAVIGATION", target: "06", label: "06 — Open Crisis Response Workflow", category: "Navigation" },
    { id: "mod-07", type: "NAVIGATION", target: "07", label: "07 — Open Evidence Vault", category: "Navigation" },
    { id: "mod-08", type: "NAVIGATION", target: "08", label: "08 — Open A4 Executive Reports", category: "Navigation" },
    { id: "mod-09", type: "NAVIGATION", target: "09", label: "09 — Open Audit Core Trail", category: "Navigation" },
    { id: "mode-exec", type: "MODE", targetMode: "EXECUTIVE", label: "Switch to Executive Mode (Minimal Strategic KPIs)", category: "Operational Mode" },
    { id: "mode-tactical", type: "MODE", targetMode: "TACTICAL", label: "Switch to Tactical Mode (Real-Time Signals & Threats)", category: "Operational Mode" },
    { id: "mode-field", type: "MODE", targetMode: "FIELD", label: "Switch to Field Mode (Cadre Telemetry & Hardware)", category: "Operational Mode" },
    { id: "mode-audit", type: "MODE", targetMode: "AUDIT", label: "Switch to Audit Mode (Evidence Vault & Hash Verification)", category: "Operational Mode" },
    { id: "action-dossier", type: "ACTION", action: "OPEN_DOSSIER", label: "Generate Confidential Dossier (A4)", category: "Report Action" },
    { id: "action-health", type: "ACTION", action: "VIEW_HEALTH", label: "System Health & Integrity Audit", category: "System Action" }
  ];

  // Dynamic search additions for booths and issues
  const dynamicItems = [];
  if (constituency?.pockets) {
    constituency.pockets.forEach(pocket => {
      dynamicItems.push({
        id: `pocket-${pocket.name}`,
        type: "BOOTH_SEARCH",
        pocket,
        label: `Inspect Booth Cluster: ${pocket.name} (${pocket.booths})`,
        category: "Booth Cluster"
      });
    });
  }
  if (constituency?.issueRadar) {
    constituency.issueRadar.forEach(iss => {
      dynamicItems.push({
        id: `issue-${iss.id}`,
        type: "ISSUE_SEARCH",
        issue: iss,
        label: `Civic Signal: ${iss.name} [${iss.signal}]`,
        category: "Civic Signal"
      });
    });
  }

  const allItems = [...baseCommands, ...dynamicItems];
  const filtered = search.trim()
    ? allItems.filter(item => item.label.toLowerCase().includes(search.toLowerCase()) || item.category.toLowerCase().includes(search.toLowerCase()))
    : allItems;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0, 0, 0, 0.8)",
        backdropFilter: "blur(8px)",
        zIndex: 1300,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        paddingTop: "12vh"
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 620,
          background: p.graphite,
          border: `1.5px solid ${p.borderGold}`,
          borderRadius: 12,
          boxShadow: "0 24px 60px rgba(0, 0, 0, 0.7)",
          overflow: "hidden"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* INPUT */}
        <div style={{ display: "flex", alignItems: "center", padding: "14px 18px", borderBottom: `1px solid ${p.border}`, gap: 12 }}>
          <span style={{ fontSize: "1.1rem", color: p.metallicGold }}>⌘</span>
          <input
            autoFocus
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Type a command, booth, evidence reference, or report..."
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              color: p.textPrimary,
              fontFamily: tokens.typography.fontUI,
              fontSize: "0.95rem"
            }}
          />
          <span style={{ fontSize: "0.68rem", fontFamily: tokens.typography.fontMono, color: p.textMuted, border: `1px solid ${p.border}`, padding: "2px 6px", borderRadius: 4 }}>
            ESC to close
          </span>
        </div>

        {/* RESULTS LIST */}
        <div style={{ maxHeight: 360, overflowY: "auto", padding: "8px" }}>
          {filtered.length === 0 ? (
            <div style={{ padding: "24px", textAlign: "center", color: p.textMuted, fontSize: "0.85rem", fontFamily: tokens.typography.fontMono }}>
              No system entity or command matching "{search}"
            </div>
          ) : (
            filtered.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelectAction(item);
                  onClose();
                }}
                style={{
                  width: "100%",
                  textAlign: "left",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "10px 14px",
                  background: "transparent",
                  border: "none",
                  borderRadius: 6,
                  cursor: "pointer",
                  color: p.textPrimary,
                  fontFamily: tokens.typography.fontUI,
                  fontSize: "0.88rem",
                  transition: "background 0.15s ease"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = p.surfaceElevated;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                <span>{item.label}</span>
                <span style={{ fontSize: "0.68rem", fontFamily: tokens.typography.fontMono, color: p.metallicGold, textTransform: "uppercase" }}>
                  {item.category}
                </span>
              </button>
            ))
          )}
        </div>

        {/* FOOTER SHORTCUTS */}
        <div style={{ padding: "10px 18px", borderTop: `1px solid ${p.border}`, background: p.obsidian, display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.68rem", color: p.textMuted, fontFamily: tokens.typography.fontMono }}>
          <span>GARUDA OS COMMAND ENGINE</span>
          <span>CTRL + K TO RE-OPEN</span>
        </div>
      </div>
    </div>
  );
}
