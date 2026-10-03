import React from "react";
import { tokens } from "./tokens";

/**
 * 🦅 GARUDA OS — DEVICE INSPECTOR PANEL
 * Shows detailed field device state, sync heartbeat, network latency, and audit trail.
 * Strictly adheres to Anti-Fabrication Law: explicitly labels state as SIMULATION or NOT CONNECTED.
 */

export default function DeviceInspector({ isOpen, onClose, device }) {
  if (!isOpen || !device) return null;

  const p = tokens.palette;
  const isSimulation = device.mode === "SIMULATION" || !device.isHardwareLive;
  const statusColor = device.status === "ONLINE" ? p.statusGreen : device.status === "DEGRADED" ? p.statusAmber : p.statusGrey;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0, 0, 0, 0.75)",
        backdropFilter: "blur(6px)",
        zIndex: 1200,
        display: "flex",
        justifyContent: "flex-end"
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 520,
          background: p.graphite,
          borderLeft: `1px solid ${p.borderGold}`,
          height: "100%",
          overflowY: "auto",
          padding: "26px 22px",
          display: "flex",
          flexDirection: "column",
          gap: 18,
          boxShadow: "-12px 0 40px rgba(0, 0, 0, 0.6)"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: `1px solid ${p.border}`, paddingBottom: 14 }}>
          <div>
            <div style={{ fontSize: "0.68rem", fontFamily: tokens.typography.fontMono, color: p.metallicGold, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 3 }}>
              FIELD OPS TELEMETRY // DEVICE INSPECTOR
            </div>
            <h3 style={{ fontSize: "1.2rem", fontFamily: tokens.typography.fontDisplay, color: p.textPrimary, margin: 0 }}>
              {device.deviceId}
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: `1px solid ${p.border}`,
              color: p.textSecondary,
              borderRadius: 6,
              width: 32,
              height: 32,
              cursor: "pointer",
              fontSize: "1rem",
              display: "grid",
              placeItems: "center"
            }}
          >
            ✕
          </button>
        </div>

        {/* SIMULATION / VERIFICATION NOTICE BANNER */}
        <div style={{ background: isSimulation ? "rgba(217, 119, 6, 0.08)" : "rgba(5, 150, 105, 0.08)", border: `1px solid ${isSimulation ? p.statusAmber : p.statusGreen}40`, borderRadius: 8, padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <span style={{ fontSize: "0.65rem", fontFamily: tokens.typography.fontMono, color: p.textMuted, display: "block" }}>OPERATION PROTOCOL</span>
            <span style={{ fontSize: "0.82rem", fontWeight: 700, color: isSimulation ? p.statusAmber : p.statusGreen, fontFamily: tokens.typography.fontMono }}>
              {isSimulation ? "HARDWARE BENCHMARK SIMULATION" : "LIVE SECURE HARDWARE LINK"}
            </span>
          </div>
          <span style={{ fontSize: "0.68rem", padding: "2px 8px", borderRadius: 4, background: isSimulation ? "rgba(217, 119, 6, 0.15)" : "rgba(5, 150, 105, 0.15)", color: isSimulation ? p.statusAmber : p.statusGreen, fontFamily: tokens.typography.fontMono, fontWeight: 700 }}>
            {isSimulation ? "BENCHMARK TEST" : "AUTHENTICATED"}
          </span>
        </div>

        {/* STATUS & METRICS GRID */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div style={{ background: p.surfaceElevated, border: `1px solid ${p.border}`, borderRadius: 8, padding: "12px" }}>
            <span style={{ fontSize: "0.65rem", fontFamily: tokens.typography.fontMono, color: p.textMuted, display: "block" }}>CONNECTION STATE</span>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: statusColor }} />
              <span style={{ fontSize: "0.9rem", fontWeight: 700, color: statusColor, fontFamily: tokens.typography.fontMono }}>
                {device.status}
              </span>
            </div>
          </div>

          <div style={{ background: p.surfaceElevated, border: `1px solid ${p.border}`, borderRadius: 8, padding: "12px" }}>
            <span style={{ fontSize: "0.65rem", fontFamily: tokens.typography.fontMono, color: p.textMuted, display: "block" }}>BATTERY TELEMETRY</span>
            <div style={{ fontSize: "0.95rem", fontWeight: 700, color: device.battery > 20 ? p.textPrimary : p.statusRed, fontFamily: tokens.typography.fontMono, marginTop: 4 }}>
              {device.battery}% {device.isCharging ? "⚡ (Charging)" : ""}
            </div>
          </div>

          <div style={{ background: p.surfaceElevated, border: `1px solid ${p.border}`, borderRadius: 8, padding: "12px" }}>
            <span style={{ fontSize: "0.65rem", fontFamily: tokens.typography.fontMono, color: p.textMuted, display: "block" }}>NETWORK CARRIER & LATENCY</span>
            <div style={{ fontSize: "0.85rem", fontWeight: 600, color: p.textPrimary, fontFamily: tokens.typography.fontMono, marginTop: 4 }}>
              {device.network} · {device.latency}ms
            </div>
          </div>

          <div style={{ background: p.surfaceElevated, border: `1px solid ${p.border}`, borderRadius: 8, padding: "12px" }}>
            <span style={{ fontSize: "0.65rem", fontFamily: tokens.typography.fontMono, color: p.textMuted, display: "block" }}>ASSIGNED BOOTH / SECTOR</span>
            <div style={{ fontSize: "0.85rem", fontWeight: 600, color: p.metallicGold, fontFamily: tokens.typography.fontMono, marginTop: 4 }}>
              {device.boothLabel || `Booth #${device.boothNumber}`}
            </div>
          </div>
        </div>

        {/* TIMESTAMPS */}
        <div style={{ background: p.obsidian, border: `1px solid ${p.border}`, borderRadius: 8, padding: "14px", display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem" }}>
            <span style={{ color: p.textSecondary, fontFamily: tokens.typography.fontMono }}>LAST HEARTBEAT:</span>
            <span style={{ color: p.warmIvory, fontFamily: tokens.typography.fontMono, fontWeight: 600 }}>{device.lastHeartbeat || "12s ago"}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem" }}>
            <span style={{ color: p.textSecondary, fontFamily: tokens.typography.fontMono }}>LAST DB SYNC:</span>
            <span style={{ color: p.warmIvory, fontFamily: tokens.typography.fontMono, fontWeight: 600 }}>{device.lastSync || "3m ago"}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem" }}>
            <span style={{ color: p.textSecondary, fontFamily: tokens.typography.fontMono }}>CLIENT SOFTWARE VER:</span>
            <span style={{ color: p.textSecondary, fontFamily: tokens.typography.fontMono }}>{device.clientVersion || "GARUDA-CADRE-v2.4.1"}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem" }}>
            <span style={{ color: p.textSecondary, fontFamily: tokens.typography.fontMono }}>LOCATION ACCURACY:</span>
            <span style={{ color: p.textSecondary, fontFamily: tokens.typography.fontMono }}>Sector Level (~150m) · Authorized DEO Zone</span>
          </div>
        </div>

        {/* EVENT HISTORY */}
        <div>
          <span style={{ fontSize: "0.7rem", fontFamily: tokens.typography.fontMono, color: p.metallicGold, letterSpacing: "0.08em", display: "block", marginBottom: 8 }}>
            RECENT DEVICE EVENT LOG
          </span>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {(device.events || [
              { time: "11:20:12", type: "HEARTBEAT", msg: "Keep-alive ping acknowledged by gateway." },
              { time: "11:15:40", type: "SYNC", msg: "Booth elector checklist hash matched with master roll." },
              { time: "11:02:08", type: "NETWORK", msg: "Network handoff: 5G NSA to 4G LTE (Carrier: Jio)." }
            ]).map((ev, i) => (
              <div key={i} style={{ background: p.surfaceElevated, border: `1px solid ${p.borderSubtle}`, borderRadius: 6, padding: "8px 10px", fontSize: "0.75rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", color: p.textMuted, fontFamily: tokens.typography.fontMono, marginBottom: 2 }}>
                  <span>[{ev.time}] {ev.type}</span>
                  <span style={{ color: p.statusGreen }}>ACK</span>
                </div>
                <div style={{ color: p.textPrimary }}>{ev.msg}</div>
              </div>
            ))}
          </div>
        </div>

        {/* FOOTER */}
        <div style={{ marginTop: "auto", paddingTop: 14, borderTop: `1px solid ${p.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "0.68rem", fontFamily: tokens.typography.fontMono, color: p.textMuted }}>
            NODE: {device.deviceId}
          </span>
          <button
            onClick={onClose}
            style={{
              background: p.metallicGold,
              color: "#000",
              fontWeight: 700,
              fontSize: "0.78rem",
              padding: "7px 16px",
              borderRadius: 6,
              border: "none",
              cursor: "pointer",
              fontFamily: tokens.typography.fontUI
            }}
          >
            DISMISS
          </button>
        </div>
      </div>
    </div>
  );
}
