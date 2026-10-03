import React, { useState } from "react";
import { tokens } from "./tokens";

/**
 * 🦅 GARUDA OS — MODULE 06: CRISIS RESPONSE WORKFLOW
 * Structured 9-Stage Reputation Defense Protocol:
 * SIGNAL DETECTED -> SOURCE VALIDATION -> EVIDENCE COLLECTION -> FACT CHECK ->
 * DRAFT RESPONSE -> HUMAN REVIEW -> APPROVAL -> PUBLISH / EXPORT -> AUDIT LOG.
 * ZERO AUTONOMOUS PUBLIC DISPATCH WITHOUT EXPLICIT HUMAN APPROVAL.
 */

export default function CrisisWorkflowModule({
  constituency,
  activeIssue,
  onOpenEvidence,
  onOpenDeepDive
}) {
  const p = tokens.palette;

  const [activeTab, setActiveTab] = useState("summary"); // summary, statement, script, evidence
  const [pipelineState, setPipelineState] = useState({
    status: "PENDING_APPROVAL", // PENDING_APPROVAL, APPROVED, PUBLISHED
    approvedBy: "",
    approvedAt: null,
    publishedChannels: []
  });

  const PIPELINE_STAGES = [
    { step: "01", name: "SIGNAL DETECTED", time: "00:00", status: "COMPLETE", detail: "Keyword trigger detected in regional video stream" },
    { step: "02", name: "SOURCE VALIDATION", time: "03:00", status: "COMPLETE", detail: "Opposition spokesperson identity confirmed" },
    { step: "03", name: "EVIDENCE RETRIEVAL", time: "06:00", status: "COMPLETE", detail: "TMC PWD Work Order #4102 pulled from Vector DB" },
    { step: "04", name: "FACT CHECK AUDIT", time: "10:00", status: "COMPLETE", detail: "Official completion certificate refutes allegation" },
    { step: "05", name: "DRAFT SYNTHESIS", time: "12:00", status: "COMPLETE", detail: "Press statement & 30s video script generated" },
    { step: "06", name: "HUMAN REVIEW", time: "14:00", status: pipelineState.status === "PENDING_APPROVAL" ? "ACTIVE" : "COMPLETE", detail: "Awaiting Campaign Leader digital authorization" },
    { step: "07", name: "APPROVAL GATE", time: "14:30", status: pipelineState.status !== "PENDING_APPROVAL" ? "COMPLETE" : "PENDING", detail: "Cryptographic human sign-off" },
    { step: "08", name: "DISPATCH / EXPORT", time: "15:00", status: pipelineState.status === "PUBLISHED" ? "COMPLETE" : "PENDING", detail: "Distribution to WhatsApp & social handles" },
    { step: "09", name: "IMMUTABLE AUDIT", time: "15:05", status: pipelineState.status === "PUBLISHED" ? "COMPLETE" : "PENDING", detail: "Logged into Audit Core memory ledger" }
  ];

  const handleApprove = () => {
    setPipelineState({
      status: "APPROVED",
      approvedBy: "Campaign Leader (Praveen Mahawar Auth Enclave)",
      approvedAt: new Date().toLocaleTimeString("en-IN"),
      publishedChannels: []
    });
  };

  const handlePublish = () => {
    setPipelineState(prev => ({
      ...prev,
      status: "PUBLISHED",
      publishedChannels: ["Instagram Reels", "Facebook Video", "YouTube Shorts", "348 Booth WhatsApp Groups"]
    }));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* SECTION HEADER */}
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-end", gap: 12 }}>
        <div>
          <span style={{ fontSize: "0.68rem", fontFamily: tokens.typography.fontMono, color: p.metallicGold, letterSpacing: "0.15em", textTransform: "uppercase" }}>
            MODULE 06 // CRISIS RESPONSE WORKFLOW
          </span>
          <h2 style={{ fontSize: "1.5rem", fontFamily: tokens.typography.fontDisplay, color: p.textPrimary, margin: "2px 0 0 0" }}>
            15-Minute Verified Rebuttal Pipeline
          </h2>
        </div>
        <button
          type="button"
          onClick={() => onOpenDeepDive("06")}
          style={{ background: "transparent", border: `1px solid ${p.borderGold}`, color: p.metallicGold, borderRadius: 5, padding: "5px 12px", fontSize: "0.72rem", fontFamily: tokens.typography.fontMono, cursor: "pointer" }}
        >
          [ REBUTTAL WORKFLOW LOGIC → ]
        </button>
      </div>

      {/* MANDATORY HUMAN REVIEW NOTICE */}
      <div style={{ background: "rgba(5, 150, 105, 0.08)", border: `1px solid ${p.statusGreen}40`, borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: "1.1rem" }}>🛡️</span>
        <div>
          <div style={{ fontSize: "0.78rem", fontWeight: 700, color: p.statusGreen, fontFamily: tokens.typography.fontMono }}>
            MANDATORY SOVEREIGN HUMAN REVIEW POLICY ENFORCED
          </div>
          <div style={{ fontSize: "0.75rem", color: p.textSecondary, lineHeight: 1.4 }}>
            GARUDA OS physically prohibits autonomous public publishing. All counter-statements, rebuttal video scripts, and press releases require explicit digital authorization by the registered Campaign Principal.
          </div>
        </div>
      </div>

      {/* 9-STAGE PROGRESSION VISUALIZER */}
      <div style={{ background: p.graphite, border: `1px solid ${p.border}`, borderRadius: 12, padding: "18px" }}>
        <span style={{ fontSize: "0.7rem", fontFamily: tokens.typography.fontMono, color: p.metallicGold, letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 12 }}>
          9-STAGE REPUTATION DEFENSE PROGRESSION (00:00 → 15:00)
        </span>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(105px, 1fr))", gap: 8 }}>
          {PIPELINE_STAGES.map((stg) => {
            const isDone = stg.status === "COMPLETE";
            const isActive = stg.status === "ACTIVE";
            const bg = isDone ? p.statusGreenBg : isActive ? "rgba(196, 139, 40, 0.15)" : p.surfaceElevated;
            const border = isDone ? p.statusGreen : isActive ? p.metallicGold : p.border;
            const color = isDone ? p.statusGreen : isActive ? p.metallicGold : p.textMuted;

            return (
              <div key={stg.step} style={{ background: bg, border: `1px solid ${border}`, borderRadius: 6, padding: "8px 6px", textAlign: "center" }}>
                <div style={{ fontSize: "0.68rem", fontFamily: tokens.typography.fontMono, color }}>{stg.time}</div>
                <div style={{ fontSize: "0.72rem", fontWeight: 700, color: p.warmIvory, margin: "2px 0" }}>{stg.name}</div>
                <div style={{ fontSize: "0.62rem", fontFamily: tokens.typography.fontMono, color: isDone ? p.statusGreen : p.textMuted }}>
                  {stg.status}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ACTIVE INCIDENT DETAILS & REBUTTAL DRAFTS */}
      <div style={{ background: p.graphite, border: `1px solid ${p.border}`, borderRadius: 12, padding: "20px" }}>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: "0.68rem", fontFamily: tokens.typography.fontMono, color: p.metallicGold }}>
              ACTIVE INCIDENT TARGET // WARD 14-16 PIPELINE
            </div>
            <h3 style={{ fontSize: "1.1rem", fontFamily: tokens.typography.fontDisplay, color: p.warmIvory, margin: "2px 0 0 0" }}>
              Allegation of delayed municipal water works in {constituency.name}
            </h3>
          </div>
          <div style={{ background: p.surfaceElevated, border: `1px solid ${p.border}`, borderRadius: 6, padding: "4px 10px", fontSize: "0.72rem", fontFamily: tokens.typography.fontMono, color: p.textSecondary }}>
            Status: <span style={{ color: pipelineState.status === "PUBLISHED" ? p.statusGreen : p.statusAmber, fontWeight: 700 }}>{pipelineState.status}</span>
          </div>
        </div>

        {/* TABS */}
        <div style={{ display: "flex", gap: 6, borderBottom: `1px solid ${p.border}`, paddingBottom: 10, marginBottom: 14 }}>
          {[
            { id: "summary", label: "Factual Synthesis" },
            { id: "statement", label: "Press Statement Draft" },
            { id: "script", label: "30-Sec Kinetic Video Script" },
            { id: "evidence", label: "Government Document References" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: activeTab === tab.id ? p.surfaceElevated : "transparent",
                color: activeTab === tab.id ? p.warmIvory : p.textSecondary,
                border: activeTab === tab.id ? `1px solid ${p.borderGold}` : "none",
                borderRadius: 5,
                padding: "6px 12px",
                fontSize: "0.75rem",
                fontFamily: tokens.typography.fontUI,
                fontWeight: activeTab === tab.id ? 700 : 500,
                cursor: "pointer"
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB CONTENT */}
        <div style={{ background: p.surfaceElevated, borderRadius: 8, padding: "16px 18px", fontSize: "0.85rem", lineHeight: 1.6, color: p.textPrimary, border: `1px solid ${p.borderSubtle}` }}>
          {activeTab === "summary" && (
            <div>
              <strong style={{ color: p.metallicGold }}>Verified Factual Synthesis:</strong> The public claim alleging negligence regarding municipal water works in Wards 14–16 of {constituency.name} is contradicted by official municipal gazettes showing active sanction order #4102 and PWD completion certificates. Funds were fully utilized under verified public audits.
            </div>
          )}
          {activeTab === "statement" && (
            <div>
              <strong style={{ color: p.metallicGold }}>Official Press Statement Draft:</strong> “The claims made earlier today regarding drinking water allocations are baseless, politically motivated, and directly refuted by Thane Municipal Corporation Work Order #4102. The infrastructure is commissioned and verified by public gazettes. We urge our citizens to rely strictly on verifiable administrative records.”
            </div>
          )}
          {activeTab === "script" && (
            <div>
              <strong style={{ color: p.metallicGold }}>30-Second Kinetic Video/Reels Script:</strong><br />
              <strong>[00:00 - 00:05]</strong> Hook: “Opposition ka safed jhooth benaqaab! {constituency.name} ke vikas par afwaahein failana band karein.”<br />
              <strong>[00:05 - 00:18]</strong> Proof: <em>(On-screen zoom into TMC PWD Sanction Certificate #4102 with official green stamp)</em> “Work order sanctioned hua, tender complete hua, aur pipeline functional hai.”<br />
              <strong>[00:18 - 00:30]</strong> Punch: “Kaam zameen par bolta hai, kagaz par nahi. Sach dekhein—GARUDA Verified Gazette Record.”
            </div>
          )}
          {activeTab === "evidence" && (
            <div>
              <strong style={{ color: p.metallicGold }}>Documented Citations in Evidence Vault:</strong><br />
              1. TMC Municipal PWD Work Order #4102 (Sanction Date: 14 March 2025)<br />
              2. Technical Inspection Certificate #PWD/CIVIL/8812 (Verification Date: 20 Aug 2025)<br />
              3. Citizen Representation Audit Record (Ward Committee Minutes #14)
            </div>
          )}
        </div>

        {/* HUMAN ACTION CONTROLS */}
        <div style={{ marginTop: 18, paddingTop: 16, borderTop: `1px solid ${p.border}`, display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <div>
            {pipelineState.approvedBy ? (
              <div style={{ fontSize: "0.75rem", fontFamily: tokens.typography.fontMono, color: p.statusGreen }}>
                ✓ AUTHORIZED BY: {pipelineState.approvedBy} at {pipelineState.approvedAt}
              </div>
            ) : (
              <div style={{ fontSize: "0.75rem", fontFamily: tokens.typography.fontMono, color: p.statusAmber }}>
                ⏳ Awaiting Human Principal Authorization before dispatch
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            {pipelineState.status === "PENDING_APPROVAL" && (
              <button
                type="button"
                onClick={handleApprove}
                style={{
                  background: p.metallicGold,
                  color: "#000",
                  fontWeight: 700,
                  fontSize: "0.78rem",
                  padding: "8px 18px",
                  borderRadius: 6,
                  border: "none",
                  cursor: "pointer",
                  fontFamily: tokens.typography.fontUI
                }}
              >
                AUTHORIZE REBUTTAL (SIGN-OFF)
              </button>
            )}

            {pipelineState.status === "APPROVED" && (
              <button
                type="button"
                onClick={handlePublish}
                style={{
                  background: p.statusGreen,
                  color: "#FFFFFF",
                  fontWeight: 700,
                  fontSize: "0.78rem",
                  padding: "8px 18px",
                  borderRadius: 6,
                  border: "none",
                  cursor: "pointer",
                  fontFamily: tokens.typography.fontUI
                }}
              >
                EXECUTE MULTI-CHANNEL DISPATCH
              </button>
            )}

            {pipelineState.status === "PUBLISHED" && (
              <span style={{ background: p.statusGreenBg, color: p.statusGreen, border: `1px solid ${p.statusGreen}`, padding: "6px 14px", borderRadius: 6, fontSize: "0.75rem", fontFamily: tokens.typography.fontMono, fontWeight: 700 }}>
                ✓ BROADCAST COMPLETE (4 CHANNELS)
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
