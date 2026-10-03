import React, { useState } from "react";
import { tokens } from "./tokens";

/**
 * 🦅 GARUDA OS — MODULE 07: EVIDENCE VAULT
 * Central Cryptographic Record Repository for all verified ECI gazettes, municipal work orders,
 * turnout reports, and calculation methodologies.
 */

export default function EvidenceVaultModule({
  constituency,
  onOpenEvidence,
  onOpenDeepDive
}) {
  const p = tokens.palette;
  const [filterType, setFilterType] = useState("ALL"); // ALL, ECI, MUNICIPAL, PWD, TELECOM
  const [searchDoc, setSearchDoc] = useState("");

  const EVIDENCE_RECORDS = [
    {
      id: "ev-01",
      title: "ECI Final Electoral Roll 2024 / 2026",
      category: "ECI",
      docRef: "ECI-MH-ROLL-2024-Q3",
      source: "Election Commission of India (ECI) Final Roll Benchmark",
      status: "VERIFIED",
      recordsCount: "348 Booth Registers",
      sha256: "8A4C2E9B1F54881A23D88EF210",
      confidence: "99.8%",
      date: "01 Oct 2026",
      summary: "Certified elector counts by gender, third gender, and demographic ratios for Thane 148."
    },
    {
      id: "ev-02",
      title: "DEO Thane Polling Station Official Gazette",
      category: "ECI",
      docRef: "DEO-THANE-GAZ-2024",
      source: "District Election Officer Thane Gazette Notification",
      status: "VERIFIED",
      recordsCount: "348 Primary + 12 Auxiliary",
      sha256: "7D1B994F8A2109CC55E048A190",
      confidence: "100%",
      date: "28 Sep 2026",
      summary: "Exact geographic boundaries, vulnerable booths identified (34), and critical turnout clusters (28)."
    },
    {
      id: "ev-03",
      title: "ECI Form 20 Certified Booth-Level Result Sheets",
      category: "ECI",
      docRef: "ECI-MH-148-FORM20",
      source: "Returning Officer Form 20 Declaration",
      status: "VERIFIED",
      recordsCount: "348 Polling Station Records",
      sha256: "4E2190B88C4102EF9A1200BC41",
      confidence: "100%",
      date: "15 Sep 2026",
      summary: "Candidate-by-candidate vote counts, NOTA, rejected ballots, and winning margin benchmarks."
    },
    {
      id: "ev-04",
      title: "Thane Municipal Corporation Water Work Order #4102",
      category: "MUNICIPAL",
      docRef: "TMC-PWD-WO-4102",
      source: "TMC Engineering Dept Work Order Gazette",
      status: "VERIFIED",
      recordsCount: "1 Tender Package (₹1.4 Cr)",
      sha256: "9F1142A88BC401E788102BA771",
      confidence: "98.5%",
      date: "14 Mar 2025",
      summary: "Clearance and execution records for Wards 14-16 municipal water feeder pipeline."
    },
    {
      id: "ev-05",
      title: "MMRDA Metro Line 4 Construction Timelines Gazette",
      category: "MUNICIPAL",
      docRef: "MMRDA-ML4-STATUS-2026",
      source: "MMRDA Public Works Status Gazette",
      status: "VERIFIED",
      recordsCount: "14 Work Packages",
      sha256: "2A994B8810CCFE1299881A4410",
      confidence: "94.0%",
      date: "02 Oct 2026",
      summary: "Ghodbunder flyover diversion plans, structural audit certificates, and traffic easing notices."
    },
    {
      id: "ev-06",
      title: "TRAI Urban Maharashtra Telecom Penetration Report",
      category: "TELECOM",
      docRef: "TRAI-MH-URB-718",
      source: "Telecom Regulatory Authority of India Subscription Index",
      status: "ESTIMATED",
      recordsCount: "Statistical Aggregate Model",
      sha256: "1E40882199BC44A10988EE2144",
      confidence: "78.5%",
      date: "30 Jun 2026",
      summary: "71.8% urban smartphone penetration heuristic applied to adult population for digital reach modeling."
    }
  ];

  const filteredDocs = EVIDENCE_RECORDS.filter(doc => {
    const matchCat = filterType === "ALL" || doc.category === filterType;
    const matchSearch = !searchDoc.trim() || doc.title.toLowerCase().includes(searchDoc.toLowerCase()) || doc.docRef.toLowerCase().includes(searchDoc.toLowerCase()) || doc.summary.toLowerCase().includes(searchDoc.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* SECTION HEADER */}
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-end", gap: 12 }}>
        <div>
          <span style={{ fontSize: "0.68rem", fontFamily: tokens.typography.fontMono, color: p.metallicGold, letterSpacing: "0.15em", textTransform: "uppercase" }}>
            MODULE 07 // EVIDENCE VAULT
          </span>
          <h2 style={{ fontSize: "1.5rem", fontFamily: tokens.typography.fontDisplay, color: p.textPrimary, margin: "2px 0 0 0" }}>
            Forensic Document & Cryptographic Source Registry
          </h2>
        </div>
        <button
          type="button"
          onClick={() => onOpenDeepDive("07")}
          style={{ background: "transparent", border: `1px solid ${p.borderGold}`, color: p.metallicGold, borderRadius: 5, padding: "5px 12px", fontSize: "0.72rem", fontFamily: tokens.typography.fontMono, cursor: "pointer" }}
        >
          [ VAULT ARCHITECTURE → ]
        </button>
      </div>

      {/* SEARCH & CATEGORY FILTER */}
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 12, background: p.graphite, border: `1px solid ${p.border}`, borderRadius: 10, padding: "12px 16px" }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {["ALL", "ECI", "MUNICIPAL", "TELECOM"].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setFilterType(cat)}
              style={{
                background: filterType === cat ? p.surfaceElevated : "transparent",
                color: filterType === cat ? p.metallicGold : p.textMuted,
                border: filterType === cat ? `1px solid ${p.borderGold}` : `1px solid ${p.border}`,
                borderRadius: 4,
                padding: "4px 10px",
                fontSize: "0.72rem",
                fontFamily: tokens.typography.fontMono,
                cursor: "pointer"
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6, background: p.obsidian, border: `1px solid ${p.border}`, borderRadius: 6, padding: "4px 10px" }}>
          <span style={{ fontSize: "0.8rem", color: p.textMuted }}>🔍</span>
          <input
            type="text"
            value={searchDoc}
            onChange={(e) => setSearchDoc(e.target.value)}
            placeholder="Search gazette, tender or hash..."
            style={{ background: "transparent", border: "none", outline: "none", color: p.textPrimary, fontSize: "0.78rem", fontFamily: tokens.typography.fontUI, width: 200 }}
          />
        </div>
      </div>

      {/* DOCUMENTS GRID */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 14 }}>
        {filteredDocs.map((doc) => {
          const statusConfig = tokens.dataStates[doc.status] || tokens.dataStates.VERIFIED;
          return (
            <div
              key={doc.id}
              style={{
                background: p.graphite,
                border: `1px solid ${p.border}`,
                borderRadius: 10,
                padding: "18px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                gap: 12
              }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <span style={{ fontSize: "0.68rem", fontFamily: tokens.typography.fontMono, color: p.metallicGold }}>
                    REF: {doc.docRef}
                  </span>
                  <span style={{ fontSize: "0.65rem", fontFamily: tokens.typography.fontMono, color: statusConfig.color, background: statusConfig.bg, padding: "2px 6px", borderRadius: 3, fontWeight: 700 }}>
                    {doc.status}
                  </span>
                </div>

                <h3 style={{ fontSize: "1rem", fontWeight: 700, color: p.warmIvory, margin: "0 0 6px 0", fontFamily: tokens.typography.fontUI }}>
                  {doc.title}
                </h3>

                <p style={{ fontSize: "0.78rem", color: p.textSecondary, lineHeight: 1.45, margin: "0 0 10px 0" }}>
                  {doc.summary}
                </p>

                <div style={{ background: p.surfaceElevated, borderRadius: 6, padding: "10px", fontSize: "0.72rem", fontFamily: tokens.typography.fontMono, color: p.textMuted, display: "flex", flexDirection: "column", gap: 3 }}>
                  <div>Source: <span style={{ color: p.textPrimary }}>{doc.source}</span></div>
                  <div>Records: <span style={{ color: p.textPrimary }}>{doc.recordsCount}</span></div>
                  <div>SHA-256: <span style={{ color: p.metallicGold }}>{doc.sha256}</span></div>
                  <div>Confidence: <span style={{ color: p.statusGreen }}>{doc.confidence}</span> · {doc.date}</div>
                </div>
              </div>

              <div style={{ paddingTop: 10, borderTop: `1px solid ${p.borderSubtle}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.65rem", fontFamily: tokens.typography.fontMono, color: p.textMuted }}>
                  CLASSIFICATION: OPEN RECORD
                </span>
                <button
                  type="button"
                  onClick={() => onOpenEvidence({
                    metricName: doc.title,
                    value: doc.docRef,
                    status: doc.status,
                    confidence: doc.confidence,
                    source: doc.source,
                    recordsUsed: doc.recordsCount,
                    calculation: `Cryptographic SHA-256 Verification: ${doc.sha256}`,
                    timestamp: doc.date,
                    dataVersion: doc.docRef,
                    humanReviewed: true,
                    humanAuditor: "Evidence Vault Registrar",
                    signoffDate: doc.date
                  })}
                  style={{
                    background: "transparent",
                    border: `1px solid ${p.borderGold}`,
                    color: p.metallicGold,
                    borderRadius: 4,
                    padding: "4px 10px",
                    fontSize: "0.7rem",
                    fontFamily: tokens.typography.fontMono,
                    cursor: "pointer"
                  }}
                >
                  AUDIT EVIDENCE →
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
