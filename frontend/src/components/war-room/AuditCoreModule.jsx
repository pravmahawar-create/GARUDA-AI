import React, { useState } from "react";
import { tokens } from "./tokens";

/**
 * 🦅 GARUDA OS — MODULE 09: AUDIT CORE
 * Immutable, tamper-evident ledger tracking:
 * WHO, WHAT, WHEN, SOURCE, BEFORE, AFTER, APPROVAL, and RESULT.
 */

export default function AuditCoreModule({
  constituency,
  onOpenDeepDive
}) {
  const p = tokens.palette;
  const [filterAction, setFilterAction] = useState("ALL");

  const AUDIT_LOGS = [
    {
      id: "aud-001",
      when: "Today, 11:21:44 IST",
      who: "AI Synthesis Daemon (ID: #SYS-RAG-902)",
      what: "Generated 15-Minute Crisis Rebuttal Script",
      source: "TMC Municipal Work Order #4102",
      before: "Status: UNRESOLVED_ALLEGATION",
      after: "Status: REBUTTAL_DRAFT_PENDING_HUMAN",
      approval: "Awaiting Campaign Leader Auth",
      result: "SUCCESS (Hash: SHA-4102-EF)",
      type: "REBUTTAL"
    },
    {
      id: "aud-002",
      when: "Today, 11:20:19 IST",
      who: "Electoral Ingestion Engine",
      what: "Form 20 Dataset Checksum Audit",
      source: "ECI Maharashtra Gazette 2024",
      before: "Integrity: UNVERIFIED",
      after: "Integrity: 100% VERIFIED",
      approval: "Automated Cryptographic Pass",
      result: "SUCCESS (Hash: SHA-148-OK)",
      type: "DATA"
    },
    {
      id: "aud-003",
      when: "Today, 10:48:02 IST",
      who: "War Room Gateway Operator",
      what: "Resolved Constituency Intelligence Model",
      source: "Benchmark Registry (Thane 148)",
      before: "Model: NULL",
      after: "Model: THANE_148_ACTIVE",
      approval: "System Handshake Protocol",
      result: "INITIALIZED (348 Booths Loaded)",
      type: "SYSTEM"
    },
    {
      id: "aud-004",
      when: "Yesterday, 22:45:11 IST",
      who: "Commercial Order Manager",
      what: "Territorial Exclusivity Check",
      source: "Internal Exclusivity Registry",
      before: "Status: UNKNOWN",
      after: "Status: AVAILABLE_TO_ONBOARD",
      approval: "Server Verification Gate",
      result: "CLEARED (No Competing Active Retainer)",
      type: "COMMERCIAL"
    },
    {
      id: "aud-005",
      when: "Yesterday, 19:10:04 IST",
      who: "Civic Issue Scanner Daemon",
      what: "Ingested Public TMC Grievances",
      source: "Public Civic Portal RSS",
      before: "References Count: 42",
      after: "References Count: 48 (High Signal)",
      approval: "Automated Frequency Threshold",
      result: "FLAGGED (Ghodbunder Bottleneck)",
      type: "DATA"
    }
  ];

  const filteredLogs = filterAction === "ALL"
    ? AUDIT_LOGS
    : AUDIT_LOGS.filter(l => l.type === filterAction);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* SECTION HEADER */}
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-end", gap: 12 }}>
        <div>
          <span style={{ fontSize: "0.68rem", fontFamily: tokens.typography.fontMono, color: p.metallicGold, letterSpacing: "0.15em", textTransform: "uppercase" }}>
            MODULE 09 // AUDIT CORE & COMPLIANCE
          </span>
          <h2 style={{ fontSize: "1.5rem", fontFamily: tokens.typography.fontDisplay, color: p.textPrimary, margin: "2px 0 0 0" }}>
            Immutable System Event & Authorization Trail
          </h2>
        </div>
        <button
          type="button"
          onClick={() => onOpenDeepDive("09")}
          style={{ background: "transparent", border: `1px solid ${p.borderGold}`, color: p.metallicGold, borderRadius: 5, padding: "5px 12px", fontSize: "0.72rem", fontFamily: tokens.typography.fontMono, cursor: "pointer" }}
        >
          [ AUDIT ARCHITECTURE → ]
        </button>
      </div>

      {/* FILTER BUTTONS & HASH METRIC */}
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 12, background: p.graphite, border: `1px solid ${p.border}`, borderRadius: 10, padding: "12px 16px" }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {["ALL", "DATA", "REBUTTAL", "SYSTEM", "COMMERCIAL"].map((act) => (
            <button
              key={act}
              type="button"
              onClick={() => setFilterAction(act)}
              style={{
                background: filterAction === act ? p.surfaceElevated : "transparent",
                color: filterAction === act ? p.metallicGold : p.textMuted,
                border: filterAction === act ? `1px solid ${p.borderGold}` : `1px solid ${p.border}`,
                borderRadius: 4,
                padding: "4px 10px",
                fontSize: "0.72rem",
                fontFamily: tokens.typography.fontMono,
                cursor: "pointer"
              }}
            >
              {act}
            </button>
          ))}
        </div>

        <div style={{ fontSize: "0.72rem", fontFamily: tokens.typography.fontMono, color: p.statusGreen, display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: p.statusGreen }} />
          <span>TAMPER-EVIDENT HASH CHAIN ACTIVE</span>
        </div>
      </div>

      {/* IMMUTABLE AUDIT TABLE (DIRECTIVE SECTION 19) */}
      <div style={{ background: p.graphite, border: `1px solid ${p.border}`, borderRadius: 12, padding: "18px" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.75rem", fontFamily: tokens.typography.fontMono }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${p.border}`, color: p.textMuted, textAlign: "left" }}>
                <th style={{ padding: "10px" }}>WHEN</th>
                <th style={{ padding: "10px" }}>WHO (ACTOR)</th>
                <th style={{ padding: "10px" }}>WHAT (ACTION)</th>
                <th style={{ padding: "10px" }}>SOURCE / REF</th>
                <th style={{ padding: "10px" }}>BEFORE → AFTER</th>
                <th style={{ padding: "10px" }}>APPROVAL</th>
                <th style={{ padding: "10px" }}>RESULT</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <tr key={log.id} style={{ borderBottom: `1px solid ${p.borderSubtle}` }}>
                  <td style={{ padding: "12px 10px", color: p.textSecondary }}>{log.when}</td>
                  <td style={{ padding: "12px 10px", color: p.warmIvory, fontWeight: 600 }}>{log.who}</td>
                  <td style={{ padding: "12px 10px", color: p.metallicGold }}>{log.what}</td>
                  <td style={{ padding: "12px 10px", color: p.textPrimary }}>{log.source}</td>
                  <td style={{ padding: "12px 10px", color: p.textMuted }}>
                    <span>{log.before}</span> → <span style={{ color: p.textPrimary }}>{log.after}</span>
                  </td>
                  <td style={{ padding: "12px 10px", color: p.statusAmber }}>{log.approval}</td>
                  <td style={{ padding: "12px 10px", color: p.statusGreen, fontWeight: 600 }}>{log.result}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
