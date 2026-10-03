import React from "react";
import { tokens } from "./tokens";

/**
 * 🦅 GARUDA OS — WAR ROOM EXECUTIVE SHELL NAVIGATION & STATUS STRIP
 * Features 9 Sovereign Modules, 4 Executive Modes (EXECUTIVE, TACTICAL, FIELD, AUDIT),
 * and Top-Level 5-Vector Integrity Status Strip.
 */

export const NAV_MODULES = [
  { id: "01", name: "MISSION CONTROL", label: "01 — MISSION CONTROL", short: "MISSION" },
  { id: "02", name: "INTELLIGENCE", label: "02 — INTELLIGENCE", short: "INTEL" },
  { id: "03", name: "FIELD OPS", label: "03 — FIELD OPS", short: "FIELD" },
  { id: "04", name: "ELECTORAL ANALYTICS", label: "04 — ELECTORAL ANALYTICS", short: "ANALYTICS" },
  { id: "05", name: "SCENARIO LAB", label: "05 — SCENARIO LAB", short: "SCENARIO" },
  { id: "06", name: "CRISIS WORKFLOW", label: "06 — CRISIS WORKFLOW", short: "CRISIS" },
  { id: "07", name: "EVIDENCE VAULT", label: "07 — EVIDENCE VAULT", short: "EVIDENCE" },
  { id: "08", name: "REPORTS", label: "08 — REPORTS", short: "REPORTS" },
  { id: "09", name: "AUDIT CORE", label: "09 — AUDIT CORE", short: "AUDIT" }
];

export const EXECUTIVE_MODES = [
  { id: "EXECUTIVE", label: "EXECUTIVE", desc: "Minimal KPIs & Strategic Posture" },
  { id: "TACTICAL", label: "TACTICAL", desc: "Operational Events & Real-Time Alerts" },
  { id: "FIELD", label: "FIELD", desc: "Cadre Devices & Sync Telemetry" },
  { id: "AUDIT", label: "AUDIT", desc: "Sources, Cryptographic Hashes & Timestamps" }
];

export default function WarRoomNavigation({
  activeModule,
  onSelectModule,
  activeMode,
  onSelectMode,
  statusVectors = {
    system: "GREEN",
    data: "GREEN",
    field: "AMBER",
    analytics: "GREEN",
    security: "GREEN"
  },
  onOpenCommandPalette,
  onOpenDeepDive
}) {
  const p = tokens.palette;

  const renderStatusDot = (state) => {
    const color = state === "GREEN" ? p.statusGreen : state === "AMBER" ? p.statusAmber : state === "RED" ? p.statusRed : p.statusGrey;
    return (
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: "50%",
          background: color,
          display: "inline-block",
          boxShadow: `0 0 6px ${color}`
        }}
      />
    );
  };

  return (
    <div style={{ background: p.obsidian, borderBottom: `1px solid ${p.border}`, position: "sticky", top: 0, zIndex: 100 }}>
      {/* TOP STATUS STRIP & SYSTEM VECTORS */}
      <div
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          padding: "8px 20px",
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          borderBottom: `1px solid ${p.borderSubtle}`,
          fontSize: "0.72rem",
          fontFamily: tokens.typography.fontMono
        }}
      >
        {/* BRAND SOVEREIGN IDENTITY */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontFamily: tokens.typography.fontDisplay, fontWeight: 700, fontSize: "1rem", color: p.textPrimary, letterSpacing: "0.04em" }}>
            GARUDA <span style={{ color: p.metallicGold, fontStyle: "italic" }}>WAR ROOM</span>
          </span>
          <span style={{ color: p.textMuted }}>|</span>
          <span style={{ color: p.metallicGold, letterSpacing: "0.12em", fontWeight: 700 }}>SOVEREIGN INTELLIGENCE OS</span>
        </div>

        {/* 5-VECTOR STATUS STRIP */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {[
            { label: "SYSTEM", state: statusVectors.system },
            { label: "DATA", state: statusVectors.data },
            { label: "FIELD", state: statusVectors.field },
            { label: "ANALYTICS", state: statusVectors.analytics },
            { label: "SECURITY", state: statusVectors.security }
          ].map((vec) => (
            <div key={vec.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              {renderStatusDot(vec.state)}
              <span style={{ color: p.textSecondary, letterSpacing: "0.08em" }}>{vec.label}</span>
            </div>
          ))}
        </div>

        {/* EXECUTIVE DISPLAY MODES & COMMAND PALETTE BUTTON */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Executive Mode Selector */}
          <div style={{ display: "flex", background: p.graphite, border: `1px solid ${p.border}`, borderRadius: 6, padding: 2 }}>
            {EXECUTIVE_MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => onSelectMode(m.id)}
                title={m.desc}
                style={{
                  background: activeMode === m.id ? p.surfaceElevated : "transparent",
                  color: activeMode === m.id ? p.warmIvory : p.textMuted,
                  border: activeMode === m.id ? `1px solid ${p.borderGold}` : "1px solid transparent",
                  borderRadius: 4,
                  padding: "3px 8px",
                  fontSize: "0.68rem",
                  fontFamily: tokens.typography.fontMono,
                  fontWeight: activeMode === m.id ? 700 : 500,
                  cursor: "pointer",
                  transition: "all 0.15s ease"
                }}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Command Palette Trigger */}
          <button
            type="button"
            onClick={onOpenCommandPalette}
            style={{
              background: "rgba(196, 139, 40, 0.1)",
              border: `1px solid ${p.borderGold}`,
              color: p.metallicGold,
              borderRadius: 6,
              padding: "4px 10px",
              fontSize: "0.72rem",
              fontFamily: tokens.typography.fontMono,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 5
            }}
          >
            <span>⌘K</span>
            <span style={{ display: "none" }}>COMMAND</span>
          </button>
        </div>
      </div>

      {/* TOP-LEVEL 9-MODULE NAVIGATION TABS */}
      <div
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          padding: "0 20px",
          display: "flex",
          overflowX: "auto",
          scrollbarWidth: "none",
          gap: 4
        }}
      >
        {NAV_MODULES.map((mod) => {
          const isActive = activeModule === mod.id;
          return (
            <button
              key={mod.id}
              type="button"
              onClick={() => onSelectModule(mod.id)}
              style={{
                background: "transparent",
                color: isActive ? p.warmIvory : p.textSecondary,
                border: "none",
                borderBottom: isActive ? `2.5px solid ${p.metallicGold}` : "2.5px solid transparent",
                padding: "12px 14px",
                fontSize: "0.75rem",
                fontFamily: tokens.typography.fontMono,
                fontWeight: isActive ? 700 : 500,
                letterSpacing: "0.06em",
                whiteSpace: "nowrap",
                cursor: "pointer",
                transition: "all 0.15s ease"
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.color = p.textPrimary;
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.color = p.textSecondary;
              }}
            >
              {mod.label}
            </button>
          );
        })}

        {/* Deep Dive Action for Active Module */}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", padding: "6px 0" }}>
          <button
            type="button"
            onClick={() => onOpenDeepDive(activeModule)}
            style={{
              background: "transparent",
              border: `1px solid rgba(196, 139, 40, 0.3)`,
              color: p.metallicGold,
              borderRadius: 4,
              padding: "4px 10px",
              fontSize: "0.68rem",
              fontFamily: tokens.typography.fontMono,
              fontWeight: 700,
              cursor: "pointer",
              letterSpacing: "0.04em",
              whiteSpace: "nowrap"
            }}
          >
            [ DEEP DIVE → ]
          </button>
        </div>
      </div>
    </div>
  );
}
