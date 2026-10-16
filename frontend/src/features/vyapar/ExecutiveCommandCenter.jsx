import React, { useState } from "react";
import { 
  FiTrendingUp, FiAlertTriangle, FiCheckCircle, FiClock, 
  FiArrowUpRight, FiArrowDownRight, FiShield, FiBriefcase, 
  FiRefreshCw, FiExternalLink, FiDollarSign, FiUsers, FiLayers 
} from "react-icons/fi";
import { EXECUTIVE_METRICS, DEMO_CONFIG } from "./vyaparDemoData";

export default function ExecutiveCommandCenter({ onSelectTab }) {
  const [drilldownModal, setDrilldownModal] = useState(null);
  const [selectedVertical, setSelectedVertical] = useState("all");

  const formatINR = (val) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(val);
  };

  const handleKpiClick = (title, value, description, breakdown) => {
    setDrilldownModal({ title, value, description, breakdown });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* 1. Gaddi Header Banner with Simulation Notice */}
      <div style={{
        background: "#FFFFFF",
        borderRadius: "16px",
        padding: "16px 20px",
        border: "1px solid #E2E8F0",
        boxShadow: "0 4px 20px rgba(0,0,0,0.02)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "12px"
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
            <span style={{
              background: "rgba(197, 168, 105, 0.15)",
              color: "#8E6D24",
              padding: "4px 10px",
              borderRadius: "6px",
              fontSize: "11px",
              fontWeight: "700",
              letterSpacing: "0.5px",
              textTransform: "uppercase"
            }}>
              GADDI COMMAND CENTER • JABALPUR
            </span>
            <span style={{
              background: "#ECFDF5",
              color: "#059669",
              padding: "4px 10px",
              borderRadius: "6px",
              fontSize: "11px",
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              gap: "5px"
            }}>
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#059669" }}></span>
              LIVE FINANCIAL RECONCILIATION
            </span>
            <span style={{
              background: "#EFF6FF",
              color: "#2563EB",
              padding: "4px 10px",
              borderRadius: "6px",
              fontSize: "11px",
              fontWeight: "600"
            }}>
              DEMO SIMULATION DATA
            </span>
          </div>
          <h1 style={{ margin: 0, fontSize: "26px", fontWeight: "800", color: "#111827", letterSpacing: "-0.5px" }}>
            {DEMO_CONFIG.clientName} — Unified Executive Gaddi
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: "14px", color: "#64748B" }}>
            Forensic Cash Control, Multi-Vertical Float Tracking & Central Physical Vault Ledger
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{
            background: "#F8FAFC",
            border: "1px solid #E2E8F0",
            padding: "8px 16px",
            borderRadius: "10px",
            textAlign: "right"
          }}>
            <div style={{ fontSize: "11px", color: "#64748B", fontWeight: "600" }}>AUDIT SYNC</div>
            <div style={{ fontSize: "13px", fontWeight: "700", color: "#1E293B", fontVariantNumeric: "tabular-nums" }}>
              {DEMO_CONFIG.lastReconciledTime}
            </div>
          </div>
          <button 
            onClick={() => onSelectTab("maharokad")}
            style={{
              background: "#C5A869",
              color: "#111827",
              border: "none",
              borderRadius: "10px",
              padding: "10px 18px",
              fontWeight: "700",
              fontSize: "13px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              boxShadow: "0 2px 8px rgba(197, 168, 105, 0.25)"
            }}
          >
            <FiShield size={16} /> Open Maha-Rokad Vault
          </button>
        </div>
      </div>

      {/* 2. Primary Financial Invariant KPI Matrix (Clickable drilldown) */}
      <div className="vyapar-kpi-grid">
        {/* KPI 1: Today Expected */}
        <div 
          onClick={() => handleKpiClick(
            "Today's Expected Collection", 
            EXECUTIVE_METRICS.todayExpectedCollection,
            "Total dues scheduled for collection today across Rojgari, Milk routes, Hotels, and Chit BC.",
            [
              { label: "Rojgari Daily Dues", amount: 380000 },
              { label: "Milk Route Deliveries", amount: 540000 },
              { label: "The Narmada Grand Daily", amount: 124500 },
              { label: "Kalchuri Heritage Daily", amount: 90000 },
              { label: "Parda Boli Installments", amount: 150000 }
            ]
          )}
          style={kpiCardStyle}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <span style={kpiLabelStyle}>EXPECTED COLLECTION</span>
            <span style={chipStyle("#F1F5F9", "#475569")}>SCHEDULED</span>
          </div>
          <div style={kpiValueStyle}>{formatINR(EXECUTIVE_METRICS.todayExpectedCollection)}</div>
          <div style={{ fontSize: "12px", color: "#64748B", display: "flex", alignItems: "center", gap: "4px" }}>
            <FiClock size={12} /> Target across 5 business verticals
          </div>
        </div>

        {/* KPI 2: Reported Collection */}
        <div 
          onClick={() => handleKpiClick(
            "Today's Recorded Collection", 
            EXECUTIVE_METRICS.todayReportedCollection,
            "Total payments reported as collected by collection agents, delivery workers, and front desk cashiers.",
            [
              { label: "Reported Cash", amount: 890000 },
              { label: "Reported UPI/Digital", amount: 252200 }
            ]
          )}
          style={kpiCardStyle}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <span style={kpiLabelStyle}>REPORTED BY FIELD</span>
            <span style={chipStyle("#FEF3C7", "#D97706")}>88.9% OF DUE</span>
          </div>
          <div style={kpiValueStyle}>{formatINR(EXECUTIVE_METRICS.todayReportedCollection)}</div>
          <div style={{ fontSize: "12px", color: "#D97706", display: "flex", alignItems: "center", gap: "4px" }}>
            <FiAlertTriangle size={12} /> ₹1,42,300 pending customer collection
          </div>
        </div>

        {/* KPI 3: Cash Awaiting Deposit (Float in Bag) */}
        <div 
          onClick={() => handleKpiClick(
            "Cash Awaiting Deposit (Agent Custody Float)", 
            EXECUTIVE_METRICS.cashAwaitingDeposit,
            "Physical cash collected by field workers that has NOT yet been counted or handed over at the Gaddi cashier desk.",
            [
              { label: "Rojgari Agents Float (6 Agents)", amount: 78200 },
              { label: "Milk Workers Float (100 Workers)", amount: 25600 },
              { label: "Hotel Desks Shift Transit", amount: 14500 }
            ]
          )}
          style={{ ...kpiCardStyle, borderLeft: "4px solid #D97706" }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <span style={kpiLabelStyle}>CASH IN BAG (FLOAT)</span>
            <span style={chipStyle("#FFFBEB", "#B45309")}>ON THE ROAD</span>
          </div>
          <div style={{ ...kpiValueStyle, color: "#B45309" }}>{formatINR(EXECUTIVE_METRICS.cashAwaitingDeposit)}</div>
          <div style={{ fontSize: "12px", color: "#B45309", display: "flex", alignItems: "center", gap: "4px" }}>
            <FiShield size={12} /> Held in custody of 12 field personnel
          </div>
        </div>

        {/* KPI 4: Deposited & Cashier Verified */}
        <div 
          onClick={() => handleKpiClick(
            "Verified Deposited Cash", 
            EXECUTIVE_METRICS.cashDepositedVerified,
            "Physical cash physically counted, notes verified, and formally logged into the master vault ledger.",
            [
              { label: "Counter #1 Verified (Rojgari & Hotels)", amount: 367000 },
              { label: "Counter #2 Verified (Milk & BC)", amount: 536400 }
            ]
          )}
          style={{ ...kpiCardStyle, borderLeft: "4px solid #059669" }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <span style={kpiLabelStyle}>DEPOSITED & VERIFIED</span>
            <span style={chipStyle("#ECFDF5", "#059669")}>VAULT INFLOW</span>
          </div>
          <div style={{ ...kpiValueStyle, color: "#059669" }}>{formatINR(EXECUTIVE_METRICS.cashDepositedVerified)}</div>
          <div style={{ fontSize: "12px", color: "#059669", display: "flex", alignItems: "center", gap: "4px" }}>
            <FiCheckCircle size={12} /> 100% physically verified at counter
          </div>
        </div>
      </div>

      {/* 3. Master Cash Vault Forensic Highlight Box (Maha-Rokad Core Equation) */}
      <div style={{
        background: "linear-gradient(135deg, #111827 0%, #1E293B 100%)",
        borderRadius: "18px",
        padding: "26px 30px",
        color: "#FFFFFF",
        boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
        position: "relative",
        overflow: "hidden"
      }}>
        {/* Decorative Gold Accent Bar */}
        <div style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "4px",
          background: "linear-gradient(90deg, #C5A869, #E4D1A0, #C5A869)"
        }} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <div style={{ fontSize: "12px", color: "#C5A869", fontWeight: "700", letterSpacing: "1px", textTransform: "uppercase" }}>
              CENTRAL PHYSICAL VAULT CONTROL (MAHA-ROKAD)
            </div>
            <div style={{ fontSize: "20px", fontWeight: "800", color: "#F8FAFC" }}>
              Closing Vault Equation & Forensic Discrepancy
            </div>
          </div>
          <div style={{
            background: "rgba(220, 38, 38, 0.15)",
            border: "1px solid rgba(220, 38, 38, 0.4)",
            color: "#FCA5A5",
            padding: "6px 14px",
            borderRadius: "8px",
            fontSize: "12px",
            fontWeight: "700",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}>
            <FiAlertTriangle size={14} color="#EF4444" />
            VARIANCE DETECTED: {formatINR(EXECUTIVE_METRICS.unreconciledVaultVariance)}
          </div>
        </div>

        <div className="vyapar-formula-grid" style={{
          padding: "18px",
          background: "rgba(255,255,255,0.04)",
          borderRadius: "12px",
          border: "1px solid rgba(255,255,255,0.08)"
        }}>
          <div>
            <div style={{ fontSize: "11px", color: "#94A3B8", fontWeight: "600" }}>OPENING CASH</div>
            <div style={{ fontSize: "20px", fontWeight: "800", color: "#E2E8F0", fontVariantNumeric: "tabular-nums" }}>
              {formatINR(EXECUTIVE_METRICS.openingVaultCash)}
            </div>
            <div style={{ fontSize: "11px", color: "#64748B" }}>09:00 AM Count</div>
          </div>

          <div>
            <div style={{ fontSize: "11px", color: "#34D399", fontWeight: "600" }}>+ VERIFIED INFLOWS</div>
            <div style={{ fontSize: "20px", fontWeight: "800", color: "#34D399", fontVariantNumeric: "tabular-nums" }}>
              +{formatINR(EXECUTIVE_METRICS.verifiedCashInflows)}
            </div>
            <div style={{ fontSize: "11px", color: "#64748B" }}>Counter receipts</div>
          </div>

          <div>
            <div style={{ fontSize: "11px", color: "#F87171", fontWeight: "600" }}>- VERIFIED OUTFLOWS</div>
            <div style={{ fontSize: "20px", fontWeight: "800", color: "#F87171", fontVariantNumeric: "tabular-nums" }}>
              -{formatINR(EXECUTIVE_METRICS.verifiedCashOutflows)}
            </div>
            <div style={{ fontSize: "11px", color: "#64748B" }}>Procurement & payouts</div>
          </div>

          <div>
            <div style={{ fontSize: "11px", color: "#C5A869", fontWeight: "600" }}>= EXPECTED CLOSING</div>
            <div style={{ fontSize: "20px", fontWeight: "800", color: "#C5A869", fontVariantNumeric: "tabular-nums" }}>
              {formatINR(EXECUTIVE_METRICS.expectedClosingVaultCash)}
            </div>
            <div style={{ fontSize: "11px", color: "#64748B" }}>Software ledger truth</div>
          </div>

          <div style={{
            background: "rgba(220, 38, 38, 0.12)",
            border: "1px solid rgba(220, 38, 38, 0.3)",
            borderRadius: "8px",
            padding: "10px 14px"
          }}>
            <div style={{ fontSize: "11px", color: "#FCA5A5", fontWeight: "700" }}>ACTUAL COUNTED</div>
            <div style={{ fontSize: "22px", fontWeight: "900", color: "#FFFFFF", fontVariantNumeric: "tabular-nums" }}>
              {formatINR(EXECUTIVE_METRICS.actualCountedVaultCash)}
            </div>
            <div style={{ fontSize: "11px", color: "#F87171", fontWeight: "600" }}>
              Shortfall: {formatINR(EXECUTIVE_METRICS.unreconciledVaultVariance)}
            </div>
          </div>
        </div>

        {/* Digital Isolation Safeguard Notice */}
        <div style={{
          marginTop: "16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: "12px",
          color: "#94A3B8",
          flexWrap: "wrap",
          gap: "10px"
        }}>
          <div>
            <strong style={{ color: "#60A5FA" }}>🔒 STRICT ISOLATION GUARD:</strong> Digital Bank Collection ({formatINR(EXECUTIVE_METRICS.digitalCollectionTotal)}) is kept separate in ICICI A/c and is NEVER mixed into physical vault balance.
          </div>
          <button
            onClick={() => onSelectTab("maharokad")}
            style={{
              background: "transparent",
              color: "#C5A869",
              border: "1px solid rgba(197, 168, 105, 0.4)",
              borderRadius: "6px",
              padding: "5px 12px",
              fontSize: "12px",
              cursor: "pointer",
              fontWeight: "600"
            }}
          >
            Investigate Shortfall →
          </button>
        </div>
      </div>

      {/* 4. Multi-Vertical Performance & Operational Desks */}
      <div className="vyapar-two-col">
        {/* Business Verticals Status */}
        <div style={{
          background: "#FFFFFF",
          borderRadius: "16px",
          padding: "22px",
          border: "1px solid #E2E8F0",
          boxShadow: "0 4px 16px rgba(0,0,0,0.02)"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "#111827" }}>
              Business Verticals Breakdown
            </h3>
            <span style={{ fontSize: "12px", color: "#64748B" }}>5 Operations Active</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {EXECUTIVE_METRICS.verticals.map((v) => (
              <div 
                key={v.id}
                onClick={() => onSelectTab(v.id === "hotel1" || v.id === "hotel2" ? "hotels" : v.id)}
                style={{
                  padding: "14px",
                  borderRadius: "10px",
                  border: "1px solid #F1F5F9",
                  background: "#FAF9F6",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = "#C5A869"}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = "#F1F5F9"}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontWeight: "700", fontSize: "14px", color: "#1E293B" }}>{v.name}</span>
                    <span style={{ fontSize: "10px", padding: "2px 6px", background: "#E2E8F0", borderRadius: "4px", color: "#475569" }}>{v.code}</span>
                  </div>
                  <div style={{ fontSize: "12px", color: "#64748B", marginTop: "3px" }}>
                    Target: {formatINR(v.expected)} • Collected: {formatINR(v.collected)}
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "14px", fontWeight: "800", color: "#059669", fontVariantNumeric: "tabular-nums" }}>
                    {formatINR(v.verified)}
                  </div>
                  <div style={{ fontSize: "11px", color: v.float > 0 ? "#D97706" : "#64748B" }}>
                    {v.float > 0 ? `Float: ${formatINR(v.float)}` : "Fully Deposited"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Priority Action Desk & Critical Exceptions */}
        <div style={{
          background: "#FFFFFF",
          borderRadius: "16px",
          padding: "22px",
          border: "1px solid #E2E8F0",
          boxShadow: "0 4px 16px rgba(0,0,0,0.02)"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "#111827" }}>
              Operational Exceptions & Alerts
            </h3>
            <span style={{
              background: "#FEE2E2",
              color: "#DC2626",
              padding: "2px 8px",
              borderRadius: "10px",
              fontSize: "11px",
              fontWeight: "700"
            }}>
              4 ACTIONABLE
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {EXECUTIVE_METRICS.actionableAlerts.map((alt) => (
              <div 
                key={alt.id}
                style={{
                  padding: "14px",
                  borderRadius: "10px",
                  borderLeft: `4px solid ${
                    alt.severity === "critical" ? "#DC2626" :
                    alt.severity === "warning" ? "#D97706" :
                    alt.severity === "amber" ? "#F59E0B" : "#2563EB"
                  }`,
                  background: alt.severity === "critical" ? "#FEF2F2" : "#F8FAFC",
                  borderTop: "1px solid #E2E8F0",
                  borderRight: "1px solid #E2E8F0",
                  borderBottom: "1px solid #E2E8F0"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ fontSize: "11px", fontWeight: "700", color: "#64748B", textTransform: "uppercase" }}>
                    {alt.vertical}
                  </div>
                  <span style={{ fontSize: "11px", color: "#94A3B8" }}>{alt.time}</span>
                </div>
                <div style={{ fontWeight: "700", fontSize: "13px", color: "#1E293B", margin: "4px 0 2px" }}>
                  {alt.title}
                </div>
                <div style={{ fontSize: "12px", color: "#475569", lineHeight: "1.4" }}>
                  {alt.desc}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 5. Drilldown Details Modal */}
      {drilldownModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(17, 24, 39, 0.6)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          padding: "20px"
        }}>
          <div style={{
            background: "#FFFFFF",
            borderRadius: "18px",
            maxWidth: "540px",
            width: "100%",
            padding: "26px",
            boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
            border: "1px solid #E2E8F0"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" }}>
              <div>
                <span style={{ fontSize: "11px", color: "#8E6D24", fontWeight: "700", letterSpacing: "0.5px" }}>
                  FORENSIC DRILL-DOWN VIEW
                </span>
                <h3 style={{ margin: "2px 0 0", fontSize: "18px", fontWeight: "800", color: "#111827" }}>
                  {drilldownModal.title}
                </h3>
              </div>
              <button 
                onClick={() => setDrilldownModal(null)}
                style={{
                  background: "#F1F5F9",
                  border: "none",
                  borderRadius: "50%",
                  width: "32px",
                  height: "32px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "700",
                  color: "#64748B"
                }}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: "13px", color: "#475569", marginTop: 0, marginBottom: "18px" }}>
              {drilldownModal.description}
            </p>

            <div style={{
              background: "#FAF9F6",
              borderRadius: "12px",
              padding: "16px",
              border: "1px solid #E2E8F0",
              marginBottom: "18px"
            }}>
              <div style={{ fontSize: "11px", color: "#64748B", fontWeight: "600" }}>TOTAL CONSOLIDATED AMOUNT</div>
              <div style={{ fontSize: "28px", fontWeight: "900", color: "#111827", fontVariantNumeric: "tabular-nums" }}>
                {formatINR(drilldownModal.value)}
              </div>
            </div>

            {drilldownModal.breakdown && (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "20px" }}>
                <div style={{ fontSize: "12px", fontWeight: "700", color: "#64748B", marginBottom: "4px" }}>
                  ITEMIZED SOURCE BREAKDOWN:
                </div>
                {drilldownModal.breakdown.map((item, idx) => (
                  <div 
                    key={idx}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      background: "#FFFFFF",
                      border: "1px solid #F1F5F9",
                      fontSize: "13px"
                    }}
                  >
                    <span style={{ color: "#334155", fontWeight: "600" }}>{item.label}</span>
                    <span style={{ color: "#111827", fontWeight: "700", fontVariantNumeric: "tabular-nums" }}>
                      {formatINR(item.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button 
                onClick={() => setDrilldownModal(null)}
                style={{
                  background: "#C5A869",
                  color: "#111827",
                  border: "none",
                  borderRadius: "8px",
                  padding: "9px 18px",
                  fontSize: "13px",
                  fontWeight: "700",
                  cursor: "pointer"
                }}
              >
                Close Audit View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const kpiCardStyle = {
  background: "#FFFFFF",
  borderRadius: "14px",
  padding: "16px",
  border: "1px solid #E2E8F0",
  boxShadow: "0 2px 12px rgba(0,0,0,0.02)",
  cursor: "pointer",
  transition: "transform 0.15s ease, box-shadow 0.15s ease",
  display: "flex",
  flexDirection: "column",
  gap: "6px"
};

const kpiLabelStyle = {
  fontSize: "11px",
  fontWeight: "700",
  color: "#64748B",
  letterSpacing: "0.5px"
};

const kpiValueStyle = {
  fontSize: "clamp(18px, 4.5vw, 24px)",
  fontWeight: "800",
  color: "#111827",
  fontVariantNumeric: "tabular-nums",
  letterSpacing: "-0.5px",
  whiteSpace: "nowrap"
};

const chipStyle = (bg, color) => ({
  background: bg,
  color: color,
  padding: "3px 8px",
  borderRadius: "6px",
  fontSize: "10px",
  fontWeight: "700",
  letterSpacing: "0.3px"
});
