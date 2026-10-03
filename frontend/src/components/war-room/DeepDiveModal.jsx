import React from "react";
import { tokens } from "./tokens";

/**
 * 🦅 GARUDA OS — FEATURE DEEP-DIVE ARCHITECTURAL ENGINE
 * Rigorous engineering breakdown of every War Room capability:
 * WHAT IT DOES, INPUTS, PROCESS, TECHNOLOGY, VALIDATION, HUMAN CONTROL, OUTPUT, AUDITABILITY, FAILURE STATES.
 */

const DEEP_DIVE_BLUEPRINTS = {
  "01": {
    title: "MISSION CONTROL // SYSTEM HEALTH & STATE ARCHITECTURE",
    module: "01 — MISSION CONTROL",
    whatItDoes: "Aggregates multi-source telemetry, system heartbeat, data ingestion freshness, and critical state vectors across 5 primary operational dimensions (System, Data, Field, Analytics, Security).",
    inputs: ["Serverless API Heartbeats", "ECI Gazette Ingestion Pipeline", "Field Cadre WebSocket Signals", "HMAC Verification Gateways"],
    process: [
      { step: "01", name: "POLL HEARTBEATS", desc: "Monitors sub-second connectivity across core microservices." },
      { step: "02", name: "INGESTION CHECK", desc: "Compares current timestamp with authoritative ECI & Municipal published gazette digests." },
      { step: "03", name: "STATE VECTOR EVALUATION", desc: "Computes 5-vector state (GREEN, AMBER, RED, GREY). Never returns GREEN on null payload." },
      { step: "04", name: "EXECUTIVE SYNTHESIS", desc: "Renders top-level mission console with 0% fabricated operational indicators." }
    ],
    technology: ["Node.js Microservices", "Vercel Edge Functions", "Cryptographic State Machines", "WebSockets / Polling Fallbacks"],
    validation: "Deterministic status evaluation. Amber if latency > 300ms; Red if database connection fails.",
    humanControl: "Command principal can trigger manual system diagnostic, force cache purge, or isolate affected nodes.",
    output: "Unified Mission Readiness Dashboard & Real-Time Security Health State.",
    auditability: "Every health check event is logged to immutable internal memory with timestamp and status vector hash.",
    failureStates: "If connectivity to state registries drops, UI displays GREY (UNAVAILABLE) or AMBER (DEGRADED), never fake GREEN."
  },
  "02": {
    title: "INTELLIGENCE RADAR // CIVIC ISSUE & NARRATIVE INGESTION",
    module: "02 — INTELLIGENCE",
    whatItDoes: "Extracts, parses, and correlates verified public civic grievances (RWA petitions, municipal notices, local gazettes) with emerging public opposition claims without individual surveillance.",
    inputs: ["Municipal Corporation Grievance Portals", "Public Gazette Work Orders", "Public Press Statements", "Public Regional News RSS"],
    process: [
      { step: "01", name: "PUBLIC SIGNAL ACQUISITION", desc: "Ingests public municipal records and open digital references." },
      { step: "02", name: "NATURAL LANGUAGE CORRELATION", desc: "Clusters civic issues by ward, booth range, and frequency." },
      { step: "03", name: "EVIDENCE LINKING", desc: "Attaches verified tender or gazette references to each detected issue." },
      { step: "04", name: "SIGNAL STRENGTH COMPUTATION", desc: "Computes HIGH, MEDIUM, or LOW signal based on verified public citations." }
    ],
    technology: ["Vector Embeddings", "Named Entity Recognition (NER)", "Geo-Coordinate Ward Mapping", "Full-Text Search Indexing"],
    validation: "Issues require minimum 5 distinct public citations to be classified as VERIFIED, else PARTIAL.",
    humanControl: "Campaign principal can override narrative tags, attach additional physical gazettes, or dismiss unverified rumors.",
    output: "12-Category Civic Issue Radar and Opposition Narrative Fact-Check Register.",
    auditability: "Every issue reference retains original publication URL, timestamp, and OCR text extract.",
    failureStates: "If municipal portal is unreachable, status reverts to 'PARTIAL / CACHED BENCHMARK', preventing data blank-out."
  },
  "03": {
    title: "FIELD OPERATIONS // BOOTH CADRE TELEMETRY ARCHITECTURE",
    module: "03 — FIELD OPS",
    whatItDoes: "Coordinates assigned campaign booth in-charges via secure mobile handshakes, tracking battery, network latency, device connectivity, and turnout mobilization.",
    inputs: ["Authorized Field Cadre Mobile Handsets", "GPS Coordinates (Booth Perimeter)", "Voter Slip Verification Signals", "Heartbeat Ping Packets"],
    process: [
      { step: "01", name: "HANDSHAKE & AUTHENTICATION", desc: "Device establishes TLS connection with cryptographic token." },
      { step: "02", name: "TELEMETRY BURST", desc: "Transmits battery level, network type (5G/4G), latency (ms), and active status." },
      { step: "03", name: "GEOGRAPHIC BOUNDARY LOCK", desc: "Verifies device presence within DEO designated polling center sector." },
      { step: "04", name: "DEVICE INSPECTOR BINDING", desc: "Updates real-time War Room device matrix and tactical event stream." }
    ],
    technology: ["TLS 1.3 Secure Enclave", "JWT Booth Identity Passports", "WebRTC / WebSocket Stream", "Battery & Network API"],
    validation: "If device fails heartbeat for > 120 seconds, status auto-switches from ONLINE to STALE DATA.",
    humanControl: "Central War Room Commander can revoke device passport, reassign booth in-charge, or trigger field verification call.",
    output: "Live Booth Cadre Telemetry Matrix, Device Inspector Drawer, and Tactical Event Feed.",
    auditability: "Every connection, disconnection, and slip delivery is recorded with timestamp and hardware fingerprint.",
    failureStates: "If live physical devices are unlinked, screen explicitly labels mode as 'BENCHMARK SIMULATION', obeying Anti-Fabrication Law."
  },
  "04": {
    title: "ELECTORAL ANALYTICS // FORM 20 BOOTH SYMMETRY & VOTE CUTTER",
    module: "04 — ELECTORAL ANALYTICS",
    whatItDoes: "Analyzes official ECI Form 20 booth-level final results, decomposing constituency into 4 scientific quadrants and identifying independent/rebel vote splitters.",
    inputs: ["ECI Form 20 Final Result Sheets", "Historical Turnout Gazette (2019/2024)", "Candidate Candidate Roster", "Booth Boundary Roll"],
    process: [
      { step: "01", name: "FORM 20 NORMALIZATION", desc: "Digitizes and cross-audits candidate votes per polling station." },
      { step: "02", name: "POLARITY QUADRANT SORT", desc: "Categorizes booths into Fortified (>200 lead), Bastion, Battleground (<75 margin), and Turnout Leak." },
      { step: "03", name: "VOTE SPLITTER IDENTIFICATION", desc: "Detects booths where 3rd-party votes exceeded the 1st vs 2nd candidate winning margin." },
      { step: "04", name: "SURGICAL FLIP FORMULATION", desc: "Calculates the exact minimum booth flip target required for electoral victory." }
    ],
    technology: ["Statistical Regression Matrix", "Form 20 Ingestion Engine", "Electoral Polarity Algorithmic Core", "Mathematical Turnout Normalizer"],
    validation: "Booth totals must match ECI official constituency aggregate within 0% discrepancy (checksum verified).",
    humanControl: "Strategist can switch between 'INCUMBENT' and 'CHALLENGER' perspective to generate opposite attack playbooks.",
    output: "Booth Win/Loss Symmetry Matrix, Vote Cutter Forensics Table, and Battleground Target List.",
    auditability: "Formula, baseline ECI statistical gazette reference, and record numbers exposed via 'Why This Number?'.",
    failureStates: "If historical Form 20 is altered or incomplete, classification renders 'DATA INSUFFICIENT', not false certainty."
  },
  "05": {
    title: "SCENARIO LAB // HYPOTHETICAL VOTER MOBILIZATION SIMULATOR",
    module: "05 — SCENARIO LAB",
    whatItDoes: "Simulates hypothetical shifts in voter turnout, participation rates, margin deficits, and cadre resource allocation. Strictly labeled as SIMULATION — NOT FORECAST.",
    inputs: ["Current ECI Electoral Baseline", "Adjustable Turnout Delta (-10% to +15%)", "Independent Vote Absorption Factor", "Target Booth Resource Shift"],
    process: [
      { step: "01", name: "INGEST BASELINE", desc: "Loads verified total electors, past turnout percentage, and victory margin." },
      { step: "02", name: "APPLY ASSUMPTION DELTA", desc: "Simulates increase or drop in voting turnout across targeted booth clusters." },
      { step: "03", name: "RUN MARGIN RE-CALCULATION", desc: "Projects mathematical impact on vote deficit based on historical demographic behavior." },
      { step: "04", name: "RENDER SCENARIO DELTA", desc: "Displays required votes needed, probability bounds, and methodological limitations." }
    ],
    technology: ["Deterministic Monte Carlo Matrix", "Elasticity Curve Model", "React Reactive State Engine", "Sensitivity Analysis Engine"],
    validation: "Bounds locked between realistic biological turnouts (35% to 85%). Rejects absurd or zero-probability user inputs.",
    humanControl: "User dynamically manipulates sliders; system updates delta in real-time with explicit limitation notices.",
    output: "Mathematical Turnout Simulation Model with Confidence Intervals and Sensitivity Graphs.",
    auditability: "Every simulated configuration can be exported as a tagged scenario snapshot with input parameters.",
    failureStates: "Outputs are always watermarked with 'SIMULATION — NOT FORECAST' to prevent deceptive electoral guarantees."
  },
  "06": {
    title: "CRISIS WORKFLOW // 15-MINUTE VERIFIED REBUTTAL PIPELINE",
    module: "06 — CRISIS WORKFLOW",
    whatItDoes: "Executes a 9-step reputation defense drill from opposition claim detection to evidence verification, kinetic video draft, and human sign-off.",
    inputs: ["Public Allegation Feed", "Pre-Indexed Government Work Order Database", "Candidate Gazette Record", "Kinetic Video Templates"],
    process: [
      { step: "01", name: "SIGNAL DETECTION (00:00)", desc: "Webhooks identify critical keyword mentions in public regional news feeds." },
      { step: "02", name: "SOURCE VALIDATION (03:00)", desc: "Confirms original speaker identity, timestamp, and claim scope." },
      { step: "03", name: "EVIDENCE RETRIEVAL (06:00)", desc: "RAG engine fetches approved municipal tenders, PWD completion certificates." },
      { step: "04", name: "FACT CHECK (10:00)", desc: "Contradiction analysis confirms claim is factually false with documented proof." },
      { step: "05", name: "DRAFT PRODUCTION (12:00)", desc: "Compiles factual synthesis, press release draft, and 30-second kinetic video script." },
      { step: "06", name: "HUMAN SIGN-OFF (15:00)", desc: "Candidate or Campaign Manager must click APPROVE before any dispatch." }
    ],
    technology: ["Vector Search RAG (Chroma/Mongo)", "Kinetic Typography Rendering", "Speech-to-Text Whisper", "Multi-Channel Dispatch Webhooks"],
    validation: "No rebuttal can be prepared without at least 1 verified official document number (e.g. Work Order #).",
    humanControl: "100% mandatory human approval. Autonomous public publishing without human sign-off is physically blocked.",
    output: "Factual Brief, Official Press Statement, 30-Second Video Reel Script, and Document Reference Dossier.",
    auditability: "Stores original allegation link, responding staff ID, approval timestamp, and complete dispatch log.",
    failureStates: "If contradicting document is not found in database, pipeline outputs 'REQUIRES MANUAL LEGAL REVIEW'."
  },
  "07": {
    title: "EVIDENCE VAULT // FORENSIC DOCUMENT & RECORD REGISTRY",
    module: "07 — EVIDENCE VAULT",
    whatItDoes: "Central cryptographically indexed vault housing every gazette, election notification, tender record, and calculation methodology powering the War Room.",
    inputs: ["Election Commission of India Reports", "DEO Polling Booth Gazettes", "Municipal Corporation Tender Files", "RTI Disclosures"],
    process: [
      { step: "01", name: "INGESTION & HASHING", desc: "Computes SHA-256 cryptographic hash of every source PDF or official gazette." },
      { step: "02", name: "METADATA BINDING", desc: "Tags record with publishing authority, date, reference number, and legal status." },
      { step: "03", name: "CROSS-SYSTEM LINKING", desc: "Binds evidence nodes to corresponding KPI metrics across all War Room screens." },
      { step: "04", name: "AUDIT READINESS", desc: "Exposes records for 1-click forensic scrutiny via 'Why This Number?' drawers." }
    ],
    technology: ["SHA-256 Checksum Engine", "Document OCR Indexer", "Relational Traceability Graph", "PDF Parse & Stream Verification"],
    validation: "Unverified third-party blogs or hearsay are rejected. Only official government or gazette publications allowed.",
    humanControl: "Chief Forensic Officer can verify new records, update classification levels, or retire outdated administrative boundaries.",
    output: "Searchable Evidence Ledger with Downloadable Verified Source Gazettes.",
    auditability: "Every document view and verification check generates an immutable audit record.",
    failureStates: "If source document is under legal stay or unverified, classification is tagged 'PARTIAL / PENDING VERIFICATION'."
  },
  "08": {
    title: "REPORT GENERATOR // A4 EXECUTIVE & DOSSIER ENGINE",
    module: "08 — REPORTS",
    whatItDoes: "Generates high-precision, executive-ready A4 reports (Executive Brief, Field Ops Report, Electoral Analytics Report, Crisis Incident Report) with print stylesheets.",
    inputs: ["Constituency Intelligence Model", "Form 20 Booth Dataset", "Evidence Vault References", "Campaign Principal Metadata"],
    process: [
      { step: "01", name: "DATA COMPILATION", desc: "Pulls active telemetry, electoral baselines, and issue signals." },
      { step: "02", name: "EXECUTIVE LAYOUT SYNTHESIS", desc: "Formats data into high-contrast, structured A4 paginated container." },
      { step: "03", name: "AUTHENTICATION WATERMARKING", desc: "Applies cryptographic verification stamp, generation timestamp, and confidentiality tags." },
      { step: "04", name: "PRINT & PDF DISPATCH", desc: "Executes print-ready CSS rendering for 1-click browser export or direct WhatsApp sharing." }
    ],
    technology: ["Print-Optimized CSS Grid", "SVG Vector Schematics", "Dynamic A4 Pagination Engine", "Client-Side Blob PDF Streaming"],
    validation: "Every generated report includes data freshness timestamp, source references, and confidence percentages.",
    humanControl: "Campaign manager can customize report sections, select target ward clusters, or redact sensitive cadre names.",
    output: "4-Page Executive Brief, Field Operations Summary, and Classified Electoral Dossier.",
    auditability: "Generation event, recipient name, and invoice/dossier serial recorded in central database.",
    failureStates: "If browser print engine truncates layout, emergency CSS resets ensure 100% zero cutoff."
  },
  "09": {
    title: "AUDIT CORE // IMMUTABLE SYSTEM EVENT & ACCESS TRAIL",
    module: "09 — AUDIT CORE",
    whatItDoes: "Chronological, tamper-evident recording of every critical system transaction, configuration change, payment event, and human approval in the War Room.",
    inputs: ["System Initialization Signals", "Payment & Order State Transitions", "Human Rebuttal Approvals", "Data Refresh Triggers"],
    process: [
      { step: "01", name: "TRANSACTION INTERCEPTION", desc: "Captures actor identity, target entity, timestamp, and operation payload." },
      { step: "02", name: "BEFORE & AFTER SNAPSHOTTING", desc: "Records exact delta of state before and after execution." },
      { step: "03", name: "HASH CHAINING", desc: "Appends transaction to chronological ledger with tamper-evident serial." },
      { step: "04", name: "AUDIT CONSOLE PRESENTATION", desc: "Renders filterable, searchable audit trail for executive oversight." }
    ],
    technology: ["Cryptographic Hash Sequences", "Immutable State Ledgers", "Role-Based Access Control (RBAC)", "JSON-LD Event Streams"],
    validation: "System records cannot be edited or deleted once written; state transitions follow formal finite state machine.",
    humanControl: "Read-only for operators. Only Authorized Founder Identity can export official compliance logs.",
    output: "Filterable Forensic Audit Ledger with Timestamp, Actor, Action, Source, and Status Proof.",
    auditability: "Self-auditing architecture. Audit Core continuously verifies integrity of its own chronological stream.",
    failureStates: "If database write fails, system suspends sensitive operational commands until log write is acknowledged."
  }
};

export default function DeepDiveModal({ isOpen, onClose, moduleId }) {
  if (!isOpen) return null;

  const blueprint = DEEP_DIVE_BLUEPRINTS[moduleId] || DEEP_DIVE_BLUEPRINTS["01"];
  const p = tokens.palette;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0, 0, 0, 0.8)",
        backdropFilter: "blur(8px)",
        zIndex: 1300,
        display: "grid",
        placeItems: "center",
        padding: "20px"
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 780,
          maxHeight: "90vh",
          background: p.graphite,
          border: `1.5px solid ${p.borderGold}`,
          borderRadius: 14,
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 28px 80px rgba(0, 0, 0, 0.8)",
          overflow: "hidden"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div style={{ padding: "20px 24px", borderBottom: `1px solid ${p.border}`, display: "flex", justifyContent: "space-between", alignItems: "flex-start", background: p.obsidian }}>
          <div>
            <div style={{ fontSize: "0.68rem", fontFamily: tokens.typography.fontMono, color: p.metallicGold, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 4 }}>
              GARUDA OS ARCHITECTURAL BLUEPRINT // MODULE {moduleId}
            </div>
            <h2 style={{ fontSize: "1.35rem", fontFamily: tokens.typography.fontDisplay, color: p.warmIvory, margin: 0 }}>
              {blueprint.title}
            </h2>
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

        {/* BODY */}
        <div style={{ padding: "24px", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 20 }}>

          {/* WHAT IT DOES */}
          <div style={{ background: p.surfaceElevated, border: `1px solid ${p.border}`, borderRadius: 10, padding: "16px 18px" }}>
            <span style={{ fontSize: "0.68rem", fontFamily: tokens.typography.fontMono, color: p.metallicGold, letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 4 }}>
              WHAT IT DOES (OPERATIONAL PRINCIPLE)
            </span>
            <p style={{ fontSize: "0.9rem", color: p.textPrimary, lineHeight: 1.55, margin: 0 }}>
              {blueprint.whatItDoes}
            </p>
          </div>

          {/* PIPELINE ARCHITECTURE */}
          <div>
            <span style={{ fontSize: "0.68rem", fontFamily: tokens.typography.fontMono, color: p.metallicGold, letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 10 }}>
              ENGINEERING PIPELINE & WORKFLOW EXECUTION
            </span>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10 }}>
              {blueprint.process.map((step) => (
                <div key={step.step} style={{ background: p.obsidian, border: `1px solid ${p.border}`, borderRadius: 8, padding: "12px 10px" }}>
                  <div style={{ fontSize: "0.7rem", fontFamily: tokens.typography.fontMono, color: p.metallicGold, fontWeight: 700 }}>
                    STAGE {step.step}
                  </div>
                  <div style={{ fontSize: "0.82rem", fontWeight: 700, color: p.warmIvory, margin: "3px 0 5px 0" }}>
                    {step.name}
                  </div>
                  <div style={{ fontSize: "0.72rem", color: p.textSecondary, lineHeight: 1.4 }}>
                    {step.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* TWO COLUMN GRID: INPUTS & OUTPUTS */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div style={{ background: p.surfaceElevated, border: `1px solid ${p.border}`, borderRadius: 8, padding: "14px" }}>
              <span style={{ fontSize: "0.68rem", fontFamily: tokens.typography.fontMono, color: p.metallicGold, letterSpacing: "0.08em", display: "block", marginBottom: 6 }}>
                AUTHORIZED SYSTEM INPUTS
              </span>
              <ul style={{ margin: 0, paddingLeft: 16, fontSize: "0.78rem", color: p.textPrimary, lineHeight: 1.6 }}>
                {blueprint.inputs.map((inp, idx) => (
                  <li key={idx}>{inp}</li>
                ))}
              </ul>
            </div>

            <div style={{ background: p.surfaceElevated, border: `1px solid ${p.border}`, borderRadius: 8, padding: "14px" }}>
              <span style={{ fontSize: "0.68rem", fontFamily: tokens.typography.fontMono, color: p.metallicGold, letterSpacing: "0.08em", display: "block", marginBottom: 6 }}>
                DETERMINISTIC SYSTEM OUTPUT
              </span>
              <div style={{ fontSize: "0.82rem", color: p.textPrimary, lineHeight: 1.5 }}>
                {blueprint.output}
              </div>
            </div>
          </div>

          {/* TECHNICAL SPECIFICATIONS & CONTROLS */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div style={{ background: p.surfaceElevated, border: `1px solid ${p.border}`, borderRadius: 8, padding: "14px" }}>
              <span style={{ fontSize: "0.68rem", fontFamily: tokens.typography.fontMono, color: p.metallicGold, letterSpacing: "0.08em", display: "block", marginBottom: 4 }}>
                TECHNOLOGY & PROTOCOLS
              </span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
                {blueprint.technology.map((tech, idx) => (
                  <span key={idx} style={{ background: p.obsidian, border: `1px solid ${p.border}`, borderRadius: 4, padding: "2px 7px", fontSize: "0.7rem", fontFamily: tokens.typography.fontMono, color: p.textSecondary }}>
                    {tech}
                  </span>
                ))}
              </div>
            </div>

            <div style={{ background: p.surfaceElevated, border: `1px solid ${p.border}`, borderRadius: 8, padding: "14px" }}>
              <span style={{ fontSize: "0.68rem", fontFamily: tokens.typography.fontMono, color: p.metallicGold, letterSpacing: "0.08em", display: "block", marginBottom: 4 }}>
                HUMAN GOVERNANCE & SOVEREIGN CONTROL
              </span>
              <div style={{ fontSize: "0.78rem", color: p.textPrimary, lineHeight: 1.5 }}>
                {blueprint.humanControl}
              </div>
            </div>
          </div>

          {/* AUDITABILITY & FAILURE MODES */}
          <div style={{ background: p.obsidian, border: `1px solid ${p.border}`, borderRadius: 8, padding: "14px 16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: "0.68rem", fontFamily: tokens.typography.fontMono, color: p.metallicGold }}>AUDITABILITY SPECIFICATION</span>
              <span style={{ fontSize: "0.68rem", fontFamily: tokens.typography.fontMono, color: p.statusGreen }}>TRACEABLE 100%</span>
            </div>
            <div style={{ fontSize: "0.78rem", color: p.textSecondary, lineHeight: 1.45, marginBottom: 10 }}>
              {blueprint.auditability}
            </div>

            <div style={{ borderTop: `1px solid ${p.border}`, paddingTop: 8 }}>
              <span style={{ fontSize: "0.68rem", fontFamily: tokens.typography.fontMono, color: p.statusRed, display: "block", marginBottom: 2 }}>
                FAIL-SAFE BEHAVIOR & INTEGRITY BOUNDARY
              </span>
              <div style={{ fontSize: "0.75rem", color: p.textMuted, lineHeight: 1.4 }}>
                {blueprint.failureStates}
              </div>
            </div>
          </div>

        </div>

        {/* FOOTER */}
        <div style={{ padding: "14px 24px", borderTop: `1px solid ${p.border}`, background: p.obsidian, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "0.7rem", fontFamily: tokens.typography.fontMono, color: p.textMuted }}>
            GARUDA OS SOVEREIGN SPECIFICATION // ZERO THIRD-PARTY BRANDING
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
            DISMISS BLUEPRINT
          </button>
        </div>
      </div>
    </div>
  );
}
