import React, { useState } from "react";
import { 
  FiShield, FiAlertTriangle, FiCheckCircle, FiDollarSign, 
  FiRefreshCw, FiLock, FiFileText, FiList, FiTrendingUp, FiArrowUpRight, FiArrowDownRight 
} from "react-icons/fi";
import { 
  EXECUTIVE_METRICS, 
  VAULT_PHYSICAL_COUNT, 
  MAHA_ROKAD_TRANSACTIONS, 
  DEMO_CONFIG 
} from "./vyaparDemoData";

export default function MahaRokadReconciliation() {
  const [denominations, setDenominations] = useState(VAULT_PHYSICAL_COUNT.denominations);
  const [transactions, setTransactions] = useState(MAHA_ROKAD_TRANSACTIONS);
  const [closingConfirmed, setClosingConfirmed] = useState(false);
  const [showClosingConfirmModal, setShowClosingConfirmModal] = useState(false);

  const formatINR = (val) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(val);
  };

  // Recalculate physical cash count from denominations
  const totalPhysicalNotesCount = denominations.reduce((acc, d) => acc + (d.count * parseInt(d.note.replace("₹", ""))), 0);
  
  const openingCash = EXECUTIVE_METRICS.openingVaultCash;
  const verifiedInflows = EXECUTIVE_METRICS.verifiedCashInflows;
  const verifiedOutflows = EXECUTIVE_METRICS.verifiedCashOutflows;
  const expectedClosingVaultCash = openingCash + verifiedInflows - verifiedOutflows;
  const variance = totalPhysicalNotesCount - expectedClosingVaultCash;

  const handleDenominationChange = (index, newCount) => {
    const parsed = Math.max(0, parseInt(newCount) || 0);
    const updated = [...denominations];
    const unitVal = parseInt(updated[index].note.replace("₹", ""));
    updated[index] = {
      ...updated[index],
      count: parsed,
      value: parsed * unitVal
    };
    setDenominations(updated);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* 1. Header with Gaddi Protocol Banner */}
      <div style={{
        background: "#FFFFFF",
        borderRadius: "16px",
        padding: "22px 28px",
        border: "1px solid #E2E8F0",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "16px"
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <span style={{
              background: "#111827",
              color: "#C5A869",
              padding: "4px 10px",
              borderRadius: "4px",
              fontSize: "11px",
              fontWeight: "800",
              letterSpacing: "0.5px"
            }}>
              MAHA-ROKAD MASTER CASH VAULT
            </span>
            <span style={{ fontSize: "12px", color: "#64748B" }}>
              Forensic Physical Reconciliation Protocol • Day Closing Desk
            </span>
          </div>
          <h2 style={{ margin: 0, fontSize: "22px", fontWeight: "800", color: "#111827" }}>
            Central Physical Vault Equation & Denomination Audit
          </h2>
        </div>

        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <div style={{
            background: "#EFF6FF",
            border: "1px solid #BFDBFE",
            padding: "8px 14px",
            borderRadius: "8px",
            fontSize: "12px",
            fontWeight: "700",
            color: "#1E40AF"
          }}>
            🏦 ICICI DIGITAL LEDGER: {formatINR(EXECUTIVE_METRICS.digitalCollectionTotal)} (ISOLATED)
          </div>

          <button
            onClick={() => setShowClosingConfirmModal(true)}
            disabled={closingConfirmed}
            style={{
              background: closingConfirmed ? "#059669" : "#111827",
              color: closingConfirmed ? "#FFFFFF" : "#C5A869",
              border: "1px solid #C5A869",
              borderRadius: "8px",
              padding: "10px 18px",
              fontSize: "13px",
              fontWeight: "700",
              cursor: closingConfirmed ? "default" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}
          >
            <FiLock size={14} />
            {closingConfirmed ? "✓ Day Closed & Sealed" : "Sign EOD Day Closing"}
          </button>
        </div>
      </div>

      {/* 2. The Core Invariant Formula Visualization Strip */}
      <div style={{
        background: "linear-gradient(135deg, #FAF9F6 0%, #FFFFFF 100%)",
        border: "1px solid #E2E8F0",
        borderRadius: "16px",
        padding: "24px",
        boxShadow: "0 4px 16px rgba(0,0,0,0.02)"
      }}>
        <div style={{ fontSize: "12px", fontWeight: "700", color: "#8E6D24", marginBottom: "12px", textTransform: "uppercase" }}>
          THE MAHA-ROKAD INVARIANT EQUATION
        </div>

        <div className="vyapar-formula-grid">
          {/* Opening */}
          <div style={formulaCardStyle}>
            <div style={{ fontSize: "11px", color: "#64748B", fontWeight: "700" }}>OPENING PHYSICAL CASH</div>
            <div style={{ fontSize: "20px", fontWeight: "800", color: "#111827", fontVariantNumeric: "tabular-nums" }}>
              {formatINR(openingCash)}
            </div>
            <div style={{ fontSize: "11px", color: "#64748B" }}>09:00 AM Vault Handover</div>
          </div>

          <div className="vyapar-formula-op" style={{ textAlign: "center", fontSize: "20px", fontWeight: "900", color: "#059669" }}>+</div>

          {/* Inflows */}
          <div style={{ ...formulaCardStyle, borderLeft: "3px solid #059669" }}>
            <div style={{ fontSize: "11px", color: "#059669", fontWeight: "700" }}>VERIFIED CASH INFLOWS</div>
            <div style={{ fontSize: "20px", fontWeight: "800", color: "#059669", fontVariantNumeric: "tabular-nums" }}>
              {formatINR(verifiedInflows)}
            </div>
            <div style={{ fontSize: "11px", color: "#64748B" }}>Agents, Milk, Hotels, BC</div>
          </div>

          <div className="vyapar-formula-op" style={{ textAlign: "center", fontSize: "20px", fontWeight: "900", color: "#DC2626" }}>-</div>

          {/* Outflows */}
          <div style={{ ...formulaCardStyle, borderLeft: "3px solid #DC2626" }}>
            <div style={{ fontSize: "11px", color: "#DC2626", fontWeight: "700" }}>VERIFIED OUTFLOWS</div>
            <div style={{ fontSize: "20px", fontWeight: "800", color: "#DC2626", fontVariantNumeric: "tabular-nums" }}>
              {formatINR(verifiedOutflows)}
            </div>
            <div style={{ fontSize: "11px", color: "#64748B" }}>Procurement, BC Winner, Loan</div>
          </div>

          <div className="vyapar-formula-op" style={{ textAlign: "center", fontSize: "20px", fontWeight: "900", color: "#C5A869" }}>=</div>

          {/* Expected Closing */}
          <div style={{ ...formulaCardStyle, background: "#111827", color: "#FFFFFF" }}>
            <div style={{ fontSize: "11px", color: "#C5A869", fontWeight: "700" }}>EXPECTED CLOSING VAULT</div>
            <div style={{ fontSize: "22px", fontWeight: "900", color: "#FFFFFF", fontVariantNumeric: "tabular-nums" }}>
              {formatINR(expectedClosingVaultCash)}
            </div>
            <div style={{ fontSize: "11px", color: "#94A3B8" }}>Theoretical Ledger Balance</div>
          </div>
        </div>

        {/* Live Variance Status Banner */}
        <div style={{
          marginTop: "18px",
          padding: "14px 18px",
          borderRadius: "10px",
          background: variance === 0 ? "#ECFDF5" : "#FEF2F2",
          border: `1px solid ${variance === 0 ? "#A7F3D0" : "#FECACA"}`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "10px"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {variance === 0 ? (
              <FiCheckCircle size={20} color="#059669" />
            ) : (
              <FiAlertTriangle size={20} color="#DC2626" />
            )}
            <div>
              <div style={{ fontWeight: "800", fontSize: "14px", color: variance === 0 ? "#065F46" : "#991B1B" }}>
                {variance === 0 ? "VAULT BALANCED — ZERO VARIANCE" : `PHYSICAL CASH DISCREPANCY: ${formatINR(variance)}`}
              </div>
              <div style={{ fontSize: "12px", color: variance === 0 ? "#047857" : "#B91C1C" }}>
                {variance === 0 
                  ? "Every physical currency note counted matches the software ledger with 100% precision."
                  : "Actual physical count in drawer is short by ₹4,500. Flagged on Counter #2 evening shift handover."}
              </div>
            </div>
          </div>

          <div style={{
            fontSize: "16px",
            fontWeight: "900",
            fontVariantNumeric: "tabular-nums",
            color: variance === 0 ? "#059669" : "#DC2626"
          }}>
            ACTUAL COUNT: {formatINR(totalPhysicalNotesCount)}
          </div>
        </div>
      </div>

      {/* 3. Interactive Physical Denomination Counter Desk */}
      <div className="vyapar-rokad-split">
        {/* Left: Interactive Denominations */}
        <div style={{
          background: "#FFFFFF",
          borderRadius: "14px",
          border: "1px solid #E2E8F0",
          padding: "20px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.02)"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "#111827" }}>
              Physical Currency Denominations
            </h3>
            <span style={{ fontSize: "11px", color: "#64748B" }}>Edit note counts to test</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {denominations.map((d, index) => (
              <div 
                key={d.note}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  background: "#FAF9F6",
                  border: "1px solid #E2E8F0"
                }}
              >
                <div style={{ width: "60px", fontWeight: "800", color: "#111827", fontSize: "14px" }}>
                  {d.note}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "12px", color: "#64748B" }}>×</span>
                  <input
                    type="number"
                    value={d.count}
                    onChange={(e) => handleDenominationChange(index, e.target.value)}
                    style={{
                      width: "80px",
                      padding: "6px 8px",
                      borderRadius: "6px",
                      border: "1px solid #CBD5E1",
                      textAlign: "right",
                      fontWeight: "700",
                      fontSize: "13px",
                      outline: "none"
                    }}
                  />
                  <span style={{ fontSize: "12px", color: "#64748B" }}>notes</span>
                </div>

                <div style={{ width: "100px", textAlign: "right", fontWeight: "800", color: "#111827", fontVariantNumeric: "tabular-nums" }}>
                  {formatINR(d.value)}
                </div>
              </div>
            ))}

            <div style={{
              marginTop: "8px",
              paddingTop: "12px",
              borderTop: "2px solid #E2E8F0",
              display: "flex",
              justifyContent: "space-between",
              fontWeight: "900",
              fontSize: "16px",
              color: "#111827"
            }}>
              <span>TOTAL COUNT:</span>
              <span style={{ color: "#059669", fontVariantNumeric: "tabular-nums" }}>
                {formatINR(totalPhysicalNotesCount)}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Master Day Cash Book / Transactions Ledger */}
        <div style={{
          background: "#FFFFFF",
          borderRadius: "14px",
          border: "1px solid #E2E8F0",
          padding: "20px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.02)"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "#111827" }}>
              Maha-Rokad Day Cash Book (Bahi-Khata)
            </h3>
            <span style={{ fontSize: "11px", color: "#64748B" }}>10 Ledger Postings</span>
          </div>

          <div className="vyapar-table-scroll">
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", textAlign: "left" }}>
              <thead>
                <tr style={{ background: "#FAF9F6", borderBottom: "1px solid #E2E8F0", color: "#64748B" }}>
                  <th style={{ padding: "10px 12px" }}>TIME / REF</th>
                  <th style={{ padding: "10px 12px" }}>PARTICULARS</th>
                  <th style={{ padding: "10px 12px" }}>VERTICAL</th>
                  <th style={{ padding: "10px 12px", textAlign: "right" }}>DEBIT (-)</th>
                  <th style={{ padding: "10px 12px", textAlign: "right" }}>CREDIT (+)</th>
                  <th style={{ padding: "10px 12px", textAlign: "right" }}>BALANCE</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr key={t.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                    <td style={{ padding: "10px 12px" }}>
                      <div style={{ fontWeight: "700", color: "#111827" }}>{t.time}</div>
                      <div style={{ fontSize: "10px", color: "#94A3B8" }}>{t.id}</div>
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      <div style={{ fontWeight: "600", color: "#1E293B" }}>{t.desc}</div>
                      <div style={{ fontSize: "10px", color: "#64748B" }}>Verified by: {t.verifiedBy}</div>
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      <span style={{
                        padding: "2px 6px",
                        borderRadius: "4px",
                        fontSize: "10px",
                        fontWeight: "700",
                        background: "#E2E8F0",
                        color: "#334155"
                      }}>
                        {t.vertical}
                      </span>
                    </td>
                    <td style={{ padding: "10px 12px", textAlign: "right", color: t.debit > 0 ? "#DC2626" : "#CBD5E1", fontWeight: "700", fontVariantNumeric: "tabular-nums" }}>
                      {t.debit > 0 ? `-${formatINR(t.debit)}` : "—"}
                    </td>
                    <td style={{ padding: "10px 12px", textAlign: "right", color: t.credit > 0 ? "#059669" : "#CBD5E1", fontWeight: "700", fontVariantNumeric: "tabular-nums" }}>
                      {t.credit > 0 ? `+${formatINR(t.credit)}` : "—"}
                    </td>
                    <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: "800", color: "#111827", fontVariantNumeric: "tabular-nums" }}>
                      {formatINR(t.balance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Confirmation Modal before Simulated EOD Closing */}
      {showClosingConfirmModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(17, 24, 39, 0.65)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 10000,
          padding: "16px"
        }}>
          <div style={{
            background: "#FFFFFF",
            borderRadius: "16px",
            maxWidth: "480px",
            width: "100%",
            padding: "24px",
            boxShadow: "0 20px 40px rgba(0,0,0,0.25)",
            border: "1px solid #E2E8F0"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
              <div style={{ background: "#FEF3C7", padding: "8px", borderRadius: "8px", color: "#B45309" }}>
                <FiLock size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: "17px", fontWeight: "800", color: "#111827" }}>
                  Confirm EOD Cash Book Closing?
                </h3>
                <div style={{ fontSize: "11px", color: "#64748B" }}>
                  Simulated Master Vault Day Lock • Lakshya Traders
                </div>
              </div>
            </div>

            <p style={{ fontSize: "13px", color: "#475569", lineHeight: "1.4", margin: "0 0 16px" }}>
              Closing the day will lock all verified cash movements for today. Review the physical note reconciliation before signing:
            </p>

            <div style={{
              background: "#FAF9F6",
              borderRadius: "10px",
              padding: "14px",
              border: "1px solid #E2E8F0",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              fontSize: "12px",
              marginBottom: "18px"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#64748B" }}>Opening Vault Cash:</span>
                <strong style={{ color: "#111827" }}>{formatINR(openingCash)}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#059669" }}>+ Verified Inflows:</span>
                <strong style={{ color: "#059669" }}>+{formatINR(verifiedInflows)}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#DC2626" }}>- Verified Outflows:</span>
                <strong style={{ color: "#DC2626" }}>-{formatINR(verifiedOutflows)}</strong>
              </div>
              <div style={{ borderTop: "1px solid #E2E8F0", paddingTop: "6px", display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#8E6D24", fontWeight: "700" }}>Expected Closing:</span>
                <strong style={{ color: "#8E6D24" }}>{formatINR(expectedClosingVaultCash)}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#111827", fontWeight: "700" }}>Actual Physical Counted:</span>
                <strong style={{ color: "#111827" }}>{formatINR(totalPhysicalNotesCount)}</strong>
              </div>
              <div style={{ borderTop: "1px dashed #CBD5E1", paddingTop: "6px", display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: variance !== 0 ? "#DC2626" : "#059669", fontWeight: "800" }}>Variance Shortfall:</span>
                <strong style={{ color: variance !== 0 ? "#DC2626" : "#059669" }}>{formatINR(variance)}</strong>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                onClick={() => setShowClosingConfirmModal(false)}
                style={{
                  background: "#F1F5F9",
                  color: "#475569",
                  border: "none",
                  borderRadius: "8px",
                  padding: "9px 16px",
                  fontSize: "13px",
                  fontWeight: "600",
                  cursor: "pointer"
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setClosingConfirmed(true);
                  setShowClosingConfirmModal(false);
                }}
                style={{
                  background: "#111827",
                  color: "#C5A869",
                  border: "1px solid #C5A869",
                  borderRadius: "8px",
                  padding: "9px 18px",
                  fontSize: "13px",
                  fontWeight: "700",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px"
                }}
              >
                <FiLock size={14} /> Confirm & Seal Day
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const formulaCardStyle = {
  background: "#FFFFFF",
  borderRadius: "12px",
  padding: "16px",
  border: "1px solid #E2E8F0",
  display: "flex",
  flexDirection: "column",
  gap: "4px"
};
