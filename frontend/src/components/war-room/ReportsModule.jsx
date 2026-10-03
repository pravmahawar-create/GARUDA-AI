import React, { useState } from "react";
import { tokens } from "./tokens";

/**
 * 🦅 GARUDA OS — MODULE 08: REPORT GENERATOR & A4 EXPORT
 * Produces 6 Premium A4 Report Types:
 * 1. EXECUTIVE BRIEF
 * 2. FIELD OPERATIONS REPORT
 * 3. ELECTORAL ANALYTICS REPORT
 * 4. DATA QUALITY REPORT
 * 5. CRISIS INCIDENT REPORT
 * 6. AUDIT COMPLIANCE REPORT
 */

export default function ReportsModule({
  constituency,
  onOpenDossier,
  onOpenDeepDive
}) {
  const p = tokens.palette;
  const [selectedReportType, setSelectedReportType] = useState("EXECUTIVE_BRIEF");
  const [isGenerating, setIsGenerating] = useState(false);
  const [compiledPdf, setCompiledPdf] = useState(null);
  const [isCompilingPdf, setIsCompilingPdf] = useState(false);
  const [compileError, setCompileError] = useState("");

  const REPORT_TYPES = [
    {
      id: "EXECUTIVE_BRIEF",
      title: "Executive Strategic Intelligence Brief",
      pages: "4 Pages (A4)",
      desc: "Top-level vulnerability analysis, victory margin audit, critical booth clusters, and territorial exclusivity terms."
    },
    {
      id: "FIELD_OPS_REPORT",
      title: "Field Operations & Cadre Connectivity Audit",
      pages: "6 Pages (A4)",
      desc: "Booth-by-booth handset readiness, battery distribution, network latency logs, and mobilization velocities."
    },
    {
      id: "ELECTORAL_ANALYTICS_REPORT",
      title: "Electoral Analytics & Form 20 Symmetry Ledger",
      pages: "8 Pages (A4)",
      desc: "4-Quadrant polarity classification, independent vote-cutter forensics, and minimum required flip booth list."
    },
    {
      id: "DATA_QUALITY_REPORT",
      title: "Data Quality & Source Confidence Assessment",
      pages: "3 Pages (A4)",
      desc: "SHA-256 cryptographic hashes, ECI roll timestamps, and category-by-category verification status."
    },
    {
      id: "CRISIS_INCIDENT_REPORT",
      title: "Crisis Incident & 15-Minute Rebuttal Log",
      pages: "2 Pages (A4)",
      desc: "Chronological attack detection logs, contradicting work orders, and authorized press statement records."
    },
    {
      id: "AUDIT_REPORT",
      title: "System Audit & Sovereign Compliance Ledger",
      pages: "4 Pages (A4)",
      desc: "Immutable state machine transitions, human authorizations, and zero third-party disclosure certification."
    }
  ];

  const handlePrint = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      window.print();
    }, 400);
  };

  const handleCompileServerPdf = async () => {
    setIsCompilingPdf(true);
    setCompileError("");
    try {
      const res = await fetch("/api/war-room/dossier/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ constituencyData: constituency })
      });
      const json = await res.json();
      if (json.success && json.data) {
        setCompiledPdf(json.data);
      } else {
        setCompileError(json.message || "PDF synthesis failed on server.");
      }
    } catch (err) {
      setCompileError(err.message || "Network request failed.");
    } finally {
      setIsCompilingPdf(false);
    }
  };

  const activeReport = REPORT_TYPES.find(r => r.id === selectedReportType) || REPORT_TYPES[0];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* SECTION HEADER */}
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-end", gap: 12 }}>
        <div>
          <span style={{ fontSize: "0.68rem", fontFamily: tokens.typography.fontMono, color: p.metallicGold, letterSpacing: "0.15em", textTransform: "uppercase" }}>
            MODULE 08 // EXECUTIVE REPORT GENERATOR
          </span>
          <h2 style={{ fontSize: "1.5rem", fontFamily: tokens.typography.fontDisplay, color: p.textPrimary, margin: "2px 0 0 0" }}>
            A4 Document Synthesis & Print Engine
          </h2>
        </div>
        <button
          type="button"
          onClick={() => onOpenDeepDive("08")}
          style={{ background: "transparent", border: `1px solid ${p.borderGold}`, color: p.metallicGold, borderRadius: 5, padding: "5px 12px", fontSize: "0.72rem", fontFamily: tokens.typography.fontMono, cursor: "pointer" }}
        >
          [ REPORT ENGINE BLUEPRINT → ]
        </button>
      </div>

      {/* REPORT TYPE SELECTOR TILES */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>
        {REPORT_TYPES.map((rep) => {
          const isSelected = selectedReportType === rep.id;
          return (
            <div
              key={rep.id}
              onClick={() => setSelectedReportType(rep.id)}
              style={{
                background: isSelected ? "rgba(196, 139, 40, 0.08)" : p.graphite,
                border: isSelected ? `1.5px solid ${p.metallicGold}` : `1px solid ${p.border}`,
                borderRadius: 10,
                padding: "16px",
                cursor: "pointer",
                transition: "all 0.15s ease",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between"
              }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <span style={{ fontSize: "0.68rem", fontFamily: tokens.typography.fontMono, color: p.metallicGold }}>
                    A4 TEMPLATE
                  </span>
                  <span style={{ fontSize: "0.68rem", fontFamily: tokens.typography.fontMono, color: p.textMuted }}>
                    {rep.pages}
                  </span>
                </div>
                <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: p.warmIvory, margin: "0 0 4px 0", fontFamily: tokens.typography.fontUI }}>
                  {rep.title}
                </h3>
                <p style={{ fontSize: "0.75rem", color: p.textSecondary, lineHeight: 1.4, margin: 0 }}>
                  {rep.desc}
                </p>
              </div>

              <div style={{ marginTop: 12, paddingTop: 8, borderTop: `1px solid ${p.borderSubtle}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.65rem", fontFamily: tokens.typography.fontMono, color: isSelected ? p.metallicGold : p.textMuted }}>
                  {isSelected ? "● SELECTED FOR PREVIEW" : "SELECT FORMAT"}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* A4 PREVIEW CONTAINER (RESTYLED EXECUTIVE A4 DOCUMENT) */}
      <div style={{ background: p.graphite, border: `1.5px solid ${p.borderGold}`, borderRadius: 12, padding: "24px", display: "flex", flexDirection: "column", gap: 18 }}>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 12, borderBottom: `1px solid ${p.border}`, paddingBottom: 14 }}>
          <div>
            <div style={{ fontSize: "0.68rem", fontFamily: tokens.typography.fontMono, color: p.metallicGold, letterSpacing: "0.1em" }}>
              A4 PRINT ENGINE // READY TO GENERATE
            </div>
            <h3 style={{ fontSize: "1.2rem", fontFamily: tokens.typography.fontDisplay, color: p.textPrimary, margin: "2px 0 0 0" }}>
              {activeReport.title}
            </h3>
            <span style={{ fontSize: "0.75rem", color: p.textSecondary }}>
              Constituency: {constituency.canonicalName} · Date: {new Date().toLocaleDateString("en-IN")}
            </span>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            <button
              type="button"
              onClick={handleCompileServerPdf}
              disabled={isCompilingPdf}
              style={{
                background: "rgba(5, 150, 105, 0.15)",
                border: `1.5px solid ${p.statusGreen}`,
                color: p.statusGreen,
                borderRadius: 6,
                padding: "8px 16px",
                fontSize: "0.78rem",
                fontFamily: tokens.typography.fontUI,
                fontWeight: 700,
                cursor: isCompilingPdf ? "not-allowed" : "pointer"
              }}
            >
              {isCompilingPdf ? "COMPILING SERVER ISO-PDF..." : "⚡ COMPILE CRYPTOGRAPHIC ISO-PDF"}
            </button>
            <button
              type="button"
              onClick={onOpenDossier}
              style={{
                background: "transparent",
                border: `1px solid ${p.borderGold}`,
                color: p.metallicGold,
                borderRadius: 6,
                padding: "8px 16px",
                fontSize: "0.78rem",
                fontFamily: tokens.typography.fontUI,
                fontWeight: 700,
                cursor: "pointer"
              }}
            >
              PREVIEW DOSSIER MODAL
            </button>
            <button
              type="button"
              onClick={handlePrint}
              disabled={isGenerating}
              style={{
                background: p.metallicGold,
                color: "#000",
                borderRadius: 6,
                padding: "8px 20px",
                fontSize: "0.78rem",
                fontFamily: tokens.typography.fontUI,
                fontWeight: 700,
                border: "none",
                cursor: isGenerating ? "not-allowed" : "pointer"
              }}
            >
              {isGenerating ? "SYNTHESIZING..." : "PRINT / EXPORT A4"}
            </button>
          </div>
        </div>

        {/* COMPILED SERVER PDF DELIVERABLE BANNER */}
        {compiledPdf && (
          <div style={{ background: "rgba(5, 150, 105, 0.08)", border: `1.5px solid ${p.statusGreen}`, borderRadius: 8, padding: "14px 18px", display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <div>
              <div style={{ fontSize: "0.72rem", fontFamily: tokens.typography.fontMono, color: p.statusGreen, fontWeight: 700, letterSpacing: "0.08em" }}>
                ✓ PHYSICAL ISO-COMPLIANT PDF ARTIFACT COMPILED ON DISK
              </div>
              <div style={{ fontSize: "0.85rem", fontWeight: 700, color: p.warmIvory, margin: "2px 0" }}>
                {compiledPdf.fileName} ({Math.round(compiledPdf.fileSizeBytes / 1024)} KB · {compiledPdf.pageCount} Pages)
              </div>
              <div style={{ fontSize: "0.68rem", fontFamily: tokens.typography.fontMono, color: p.textMuted }}>
                SHA-256 CHECKSUM: <span style={{ color: p.metallicGold }}>{compiledPdf.sha256Hash}</span>
              </div>
            </div>
            <a
              href={compiledPdf.url}
              download={compiledPdf.fileName}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: p.statusGreen,
                color: "#fff",
                borderRadius: 6,
                padding: "8px 16px",
                fontSize: "0.78rem",
                fontFamily: tokens.typography.fontMono,
                fontWeight: 700,
                textDecoration: "none"
              }}
            >
              DOWNLOAD VERIFIED PDF ↓
            </a>
          </div>
        )}
        {compileError && (
          <div style={{ background: "rgba(220, 38, 38, 0.1)", border: `1px solid ${p.statusRed}`, borderRadius: 6, padding: "8px 12px", color: p.statusRed, fontSize: "0.75rem", fontFamily: tokens.typography.fontMono }}>
            PDF Generation Notice: {compileError}
          </div>
        )}

        {/* MOCK A4 REPORT PREVIEW BLOCK */}
        <div style={{ background: "#FFFFFF", color: "#17181B", borderRadius: 8, padding: "36px 32px", boxShadow: "0 12px 32px rgba(0,0,0,0.5)", fontFamily: tokens.typography.fontUI, maxWidth: 760, margin: "0 auto", width: "100%" }}>
          {/* A4 Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "2px solid #17181B", paddingBottom: 14, marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 11, fontFamily: tokens.typography.fontMono, fontWeight: 800, color: "#9E6D1C", letterSpacing: "0.15em" }}>
                GARUDA OS // SOVEREIGN INTELLIGENCE REPORT
              </div>
              <h1 style={{ fontSize: 24, fontFamily: tokens.typography.fontDisplay, margin: "4px 0", color: "#17181B" }}>
                {constituency.name.toUpperCase()} STRATEGIC BRIEF
              </h1>
              <div style={{ fontSize: 11, color: "#686A70" }}>
                {constituency.canonicalName} · District: {constituency.district} · State: {constituency.state}
              </div>
            </div>
            <div style={{ textAlign: "right", fontFamily: tokens.typography.fontMono, fontSize: 10, color: "#686A70" }}>
              <div>SERIAL: GRD-{constituency.assemblyNumber}-2026</div>
              <div>DATE: {new Date().toLocaleDateString("en-IN")}</div>
              <div style={{ color: "#059669", fontWeight: 700 }}>STATUS: ECI AUDITED</div>
            </div>
          </div>

          {/* Section 1 */}
          <div style={{ marginBottom: 18 }}>
            <h4 style={{ fontSize: 12, fontFamily: tokens.typography.fontMono, color: "#9E6D1C", borderBottom: "1px solid #E5E7EB", paddingBottom: 4, margin: "0 0 10px 0" }}>
              01 // EXECUTIVE ELECTORAL BASELINE
            </h4>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10, fontSize: 11 }}>
              <div style={{ background: "#F9FAFB", padding: "8px 10px", borderRadius: 4 }}>
                <span style={{ color: "#686A70", display: "block" }}>ELECTORS</span>
                <strong style={{ fontSize: 14 }}>{constituency.electoralBase.registeredElectors.toLocaleString()}</strong>
              </div>
              <div style={{ background: "#F9FAFB", padding: "8px 10px", borderRadius: 4 }}>
                <span style={{ color: "#686A70", display: "block" }}>BOOTHS</span>
                <strong style={{ fontSize: 14 }}>{constituency.pollingStructure.totalBooths}</strong>
              </div>
              <div style={{ background: "#F9FAFB", padding: "8px 10px", borderRadius: 4 }}>
                <span style={{ color: "#686A70", display: "block" }}>LAST TURNOUT</span>
                <strong style={{ fontSize: 14 }}>{constituency.historicalTurnout.lastElectionTurnout}</strong>
              </div>
              <div style={{ background: "#F9FAFB", padding: "8px 10px", borderRadius: 4 }}>
                <span style={{ color: "#686A70", display: "block" }}>WINNING MARGIN</span>
                <strong style={{ fontSize: 14, color: "#DC2626" }}>{constituency.historicalMargin.winningMarginPercentage}</strong>
              </div>
            </div>
          </div>

          {/* Section 2 */}
          <div style={{ marginBottom: 18 }}>
            <h4 style={{ fontSize: 12, fontFamily: tokens.typography.fontMono, color: "#9E6D1C", borderBottom: "1px solid #E5E7EB", paddingBottom: 4, margin: "0 0 10px 0" }}>
              02 // CRITICAL ISSUE RADAR (VERIFIED PUBLIC GRIEVANCES)
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 11 }}>
              {constituency.issueRadar.slice(0, 3).map((iss) => (
                <div key={iss.id} style={{ display: "flex", justifyContent: "space-between", padding: "6px 8px", background: "#F9FAFB", borderRadius: 4 }}>
                  <span><strong>{iss.name}</strong> ({iss.source})</span>
                  <span style={{ fontFamily: tokens.typography.fontMono, fontWeight: 700, color: iss.signal === "HIGH" ? "#DC2626" : "#D97706" }}>
                    {iss.signal} SIGNAL [{iss.publicReferences} refs]
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3 */}
          <div>
            <h4 style={{ fontSize: 12, fontFamily: tokens.typography.fontMono, color: "#9E6D1C", borderBottom: "1px solid #E5E7EB", paddingBottom: 4, margin: "0 0 6px 0" }}>
              03 // TERRITORIAL EXCLUSIVITY CLAUSE
            </h4>
            <p style={{ fontSize: 11, color: "#525866", lineHeight: 1.5, margin: 0 }}>
              GARUDA OS provides single-candidate territorial exclusivity. Upon commercial retainer binding, competing political entities are physically barred from onboarding this constituency.
            </p>
          </div>

          {/* A4 Footer */}
          <div style={{ marginTop: 24, paddingTop: 10, borderTop: "1px solid #E5E7EB", display: "flex", justifyContent: "space-between", fontSize: 9, fontFamily: tokens.typography.fontMono, color: "#9CA3AF" }}>
            <span>CONFIDENTIAL STRATEGIC MEMORANDUM · GARUDA OS</span>
            <span>PAGE 01 OF 04 · SHA-256 VERIFIED</span>
          </div>
        </div>
      </div>
    </div>
  );
}
