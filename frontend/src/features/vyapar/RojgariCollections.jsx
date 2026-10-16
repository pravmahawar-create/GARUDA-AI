import React, { useState } from "react";
import { 
  FiSearch, FiFilter, FiCalendar, FiUserCheck, 
  FiAlertCircle, FiCheck, FiArrowRight, FiFileText, FiPhone 
} from "react-icons/fi";
import { ROJGARI_BORROWERS } from "./vyaparDemoData";

export default function RojgariCollections() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedBorrower, setSelectedBorrower] = useState(null);

  const formatINR = (val) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(val);
  };

  const filteredBorrowers = ROJGARI_BORROWERS.filter((b) => {
    const matchesSearch = b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          b.area.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          b.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || 
                          (statusFilter === "overdue" && b.overdueDays > 0) ||
                          (statusFilter === "active" && b.status === "Active" && b.overdueDays === 0);
    return matchesSearch && matchesStatus;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* 1. Header Banner */}
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
              background: "rgba(197, 168, 105, 0.15)",
              color: "#8E6D24",
              padding: "4px 8px",
              borderRadius: "4px",
              fontSize: "11px",
              fontWeight: "700"
            }}>
              ROJGARI FINANCE VERTICAL
            </span>
            <span style={{ fontSize: "12px", color: "#64748B" }}>
              Daily Micro-Lending & Installment Amortization
            </span>
          </div>
          <h2 style={{ margin: 0, fontSize: "22px", fontWeight: "800", color: "#111827" }}>
            Borrower Directory & Daily Repayment Schedule
          </h2>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <div style={{
            background: "#ECFDF5",
            border: "1px solid #A7F3D0",
            padding: "8px 14px",
            borderRadius: "8px",
            fontSize: "12px",
            fontWeight: "700",
            color: "#065F46"
          }}>
            DAILY EXPECTED: ₹3,80,000
          </div>
          <div style={{
            background: "#FEF2F2",
            border: "1px solid #FECACA",
            padding: "8px 14px",
            borderRadius: "8px",
            fontSize: "12px",
            fontWeight: "700",
            color: "#991B1B"
          }}>
            OVERDUE: ₹98,400 (7 Defaulters)
          </div>
        </div>
      </div>

      {/* 2. Search & Filter Bar */}
      <div style={{
        background: "#FFFFFF",
        borderRadius: "12px",
        padding: "16px 20px",
        border: "1px solid #E2E8F0",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "14px"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1, minWidth: "180px" }}>
          <FiSearch size={16} color="#64748B" />
          <input
            type="text"
            placeholder="Search borrower by name, Jabalpur area, or Loan ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              border: "none",
              outline: "none",
              width: "100%",
              fontSize: "14px",
              color: "#1E293B",
              background: "transparent"
            }}
          />
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={() => setStatusFilter("all")}
            style={filterBtnStyle(statusFilter === "all")}
          >
            All Borrowers ({ROJGARI_BORROWERS.length})
          </button>
          <button
            onClick={() => setStatusFilter("active")}
            style={filterBtnStyle(statusFilter === "active")}
          >
            Current On-Track
          </button>
          <button
            onClick={() => setStatusFilter("overdue")}
            style={filterBtnStyle(statusFilter === "overdue", "#DC2626")}
          >
            Overdue Dues
          </button>
        </div>
      </div>

      {/* 3. Borrowers Table */}
      <div style={{
        background: "#FFFFFF",
        borderRadius: "14px",
        border: "1px solid #E2E8F0",
        overflow: "hidden",
        boxShadow: "0 2px 8px rgba(0,0,0,0.02)"
      }}>
        {/* Desktop Table View */}
        <div className="vyapar-desktop-only vyapar-table-scroll">
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
            <thead>
              <tr style={{ background: "#FAF9F6", borderBottom: "1px solid #E2E8F0", color: "#64748B", fontWeight: "700" }}>
                <th style={{ padding: "14px 18px" }}>BORROWER & ID</th>
                <th style={{ padding: "14px 18px" }}>MARKET LOCATION</th>
                <th style={{ padding: "14px 18px" }}>PRINCIPAL</th>
                <th style={{ padding: "14px 18px" }}>DAILY DUE</th>
                <th style={{ padding: "14px 18px" }}>PROGRESS (DAYS)</th>
                <th style={{ padding: "14px 18px" }}>OUTSTANDING</th>
                <th style={{ padding: "14px 18px" }}>ASSIGNED AGENT</th>
                <th style={{ padding: "14px 18px" }}>STATUS</th>
                <th style={{ padding: "14px 18px", textAlign: "right" }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {filteredBorrowers.map((b) => (
                <tr 
                  key={b.id}
                  style={{
                    borderBottom: "1px solid #F1F5F9",
                    transition: "background 0.15s ease"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "#F8FAFC"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                >
                  <td style={{ padding: "14px 18px" }}>
                    <div style={{ fontWeight: "700", color: "#1E293B" }}>{b.name}</div>
                    <div style={{ fontSize: "11px", color: "#64748B", fontVariantNumeric: "tabular-nums" }}>{b.id} • {b.contact}</div>
                  </td>
                  <td style={{ padding: "14px 18px", color: "#475569" }}>
                    {b.area}
                  </td>
                  <td style={{ padding: "14px 18px", fontWeight: "700", color: "#111827", fontVariantNumeric: "tabular-nums" }}>
                    {formatINR(b.principal)}
                  </td>
                  <td style={{ padding: "14px 18px", fontWeight: "700", color: "#059669", fontVariantNumeric: "tabular-nums" }}>
                    {formatINR(b.dailyDue)} / day
                  </td>
                  <td style={{ padding: "14px 18px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div style={{ flex: 1, background: "#E2E8F0", height: "6px", borderRadius: "3px", minWidth: "60px", overflow: "hidden" }}>
                        <div style={{
                          background: b.overdueDays > 0 ? "#DC2626" : "#C5A869",
                          height: "100%",
                          width: `${(b.daysPaid / b.totalTenureDays) * 100}%`
                        }} />
                      </div>
                      <span style={{ fontSize: "11px", color: "#64748B", fontVariantNumeric: "tabular-nums" }}>
                        {b.daysPaid}/{b.totalTenureDays} d
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: "14px 18px", fontWeight: "800", color: "#1E293B", fontVariantNumeric: "tabular-nums" }}>
                    {formatINR(b.totalOutstanding)}
                  </td>
                  <td style={{ padding: "14px 18px", color: "#475569", fontSize: "12px" }}>
                    {b.assignedAgent}
                  </td>
                  <td style={{ padding: "14px 18px" }}>
                    {b.overdueDays > 0 ? (
                      <span style={{
                        background: "#FEE2E2",
                        color: "#DC2626",
                        padding: "3px 8px",
                        borderRadius: "6px",
                        fontSize: "11px",
                        fontWeight: "700"
                      }}>
                        {b.overdueDays} Days Late
                      </span>
                    ) : (
                      <span style={{
                        background: "#ECFDF5",
                        color: "#059669",
                        padding: "3px 8px",
                        borderRadius: "6px",
                        fontSize: "11px",
                        fontWeight: "700"
                      }}>
                        Paid Today
                      </span>
                    )}
                  </td>
                  <td style={{ padding: "14px 18px", textAlign: "right" }}>
                    <button
                      onClick={() => setSelectedBorrower(b)}
                      style={{
                        background: "#FAF9F6",
                        border: "1px solid #CBD5E1",
                        borderRadius: "6px",
                        padding: "5px 10px",
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "#1E293B",
                        cursor: "pointer"
                      }}
                    >
                      View Ledger
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards View */}
        <div className="vyapar-mobile-only vyapar-mobile-cards-wrap" style={{ padding: "12px" }}>
          {filteredBorrowers.map((b) => (
            <div key={b.id} className="vyapar-mobile-card" style={{
              borderLeft: b.overdueDays > 0 ? "4px solid #DC2626" : "4px solid #059669",
              background: b.overdueDays > 0 ? "rgba(254, 242, 242, 0.4)" : "#FFFFFF"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontWeight: "800", fontSize: "15px", color: "#111827" }}>{b.name}</div>
                  <div style={{ fontSize: "11px", color: "#64748B" }}>{b.id} • {b.area}</div>
                </div>
                <span style={{
                  padding: "3px 8px",
                  borderRadius: "6px",
                  fontSize: "11px",
                  fontWeight: "700",
                  background: b.overdueDays > 0 ? "#FEE2E2" : "#ECFDF5",
                  color: b.overdueDays > 0 ? "#DC2626" : "#059669"
                }}>
                  {b.overdueDays > 0 ? `${b.overdueDays}d Late` : "Paid Today"}
                </span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", background: "#FAF9F6", padding: "8px 10px", borderRadius: "8px", fontSize: "12px" }}>
                <div>
                  <span style={{ color: "#64748B" }}>Principal: </span>
                  <strong style={{ color: "#111827" }}>{formatINR(b.principal)}</strong>
                </div>
                <div>
                  <span style={{ color: "#64748B" }}>Daily Due: </span>
                  <strong style={{ color: "#059669" }}>{formatINR(b.dailyDue)}</strong>
                </div>
                <div>
                  <span style={{ color: "#64748B" }}>Repaid: </span>
                  <span style={{ color: "#059669", fontWeight: "700" }}>{formatINR(b.totalRepaid)}</span>
                </div>
                <div>
                  <span style={{ color: "#64748B" }}>Outstanding: </span>
                  <span style={{ color: "#DC2626", fontWeight: "800" }}>{formatINR(b.totalOutstanding)}</span>
                </div>
              </div>

              {/* Progress bar */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#64748B", marginBottom: "4px" }}>
                  <span>Repayment Progress</span>
                  <span>{b.daysPaid}/{b.totalTenureDays} days</span>
                </div>
                <div style={{ background: "#E2E8F0", height: "6px", borderRadius: "3px", overflow: "hidden" }}>
                  <div style={{
                    background: b.overdueDays > 0 ? "#DC2626" : "#C5A869",
                    height: "100%",
                    width: `${(b.daysPaid / b.totalTenureDays) * 100}%`
                  }} />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "6px", borderTop: "1px solid #F1F5F9" }}>
                <span style={{ fontSize: "11px", color: "#64748B" }}>Agent: {b.assignedAgent.split(" ")[0]}</span>
                <button
                  onClick={() => setSelectedBorrower(b)}
                  style={{
                    background: "#111827",
                    color: "#C5A869",
                    border: "none",
                    borderRadius: "6px",
                    padding: "6px 14px",
                    fontSize: "12px",
                    fontWeight: "700",
                    cursor: "pointer"
                  }}
                >
                  View Ledger →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Borrower Full Ledger Modal */}
      {selectedBorrower && (
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
            borderRadius: "16px",
            maxWidth: "600px",
            width: "100%",
            padding: "26px",
            maxHeight: "90vh",
            overflowY: "auto",
            border: "1px solid #E2E8F0"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "18px" }}>
              <div>
                <span style={{ fontSize: "11px", color: "#8E6D24", fontWeight: "700" }}>ROJGARI CUSTOMER LEDGER</span>
                <h3 style={{ margin: "2px 0 0", fontSize: "20px", fontWeight: "800", color: "#111827" }}>
                  {selectedBorrower.name}
                </h3>
                <div style={{ fontSize: "12px", color: "#64748B" }}>
                  Loan ID: {selectedBorrower.id} • {selectedBorrower.area}
                </div>
              </div>
              <button 
                onClick={() => setSelectedBorrower(null)}
                style={{
                  background: "#F1F5F9",
                  border: "none",
                  borderRadius: "50%",
                  width: "32px",
                  height: "32px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "700"
                }}
              >
                ✕
              </button>
            </div>

            {/* Quick Metrics */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: "12px",
              padding: "16px",
              background: "#FAF9F6",
              borderRadius: "12px",
              marginBottom: "20px"
            }}>
              <div>
                <div style={{ fontSize: "11px", color: "#64748B" }}>Principal Sanctioned</div>
                <div style={{ fontSize: "16px", fontWeight: "800", color: "#111827" }}>
                  {formatINR(selectedBorrower.principal)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: "11px", color: "#64748B" }}>Total Repaid</div>
                <div style={{ fontSize: "16px", fontWeight: "800", color: "#059669" }}>
                  {formatINR(selectedBorrower.totalRepaid)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: "11px", color: "#64748B" }}>Balance Outstanding</div>
                <div style={{ fontSize: "16px", fontWeight: "800", color: "#DC2626" }}>
                  {formatINR(selectedBorrower.totalOutstanding)}
                </div>
              </div>
            </div>

            {/* Simulated Repayment Timeline */}
            <h4 style={{ margin: "0 0 12px", fontSize: "14px", fontWeight: "700", color: "#1E293B" }}>
              Recent Payment History & Receipts
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "20px" }}>
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "10px 14px",
                borderRadius: "8px",
                background: "#F8FAFC",
                border: "1px solid #E2E8F0",
                fontSize: "13px"
              }}>
                <div>
                  <div style={{ fontWeight: "700", color: "#111827" }}>Payment Ref #REC-9821</div>
                  <div style={{ fontSize: "11px", color: "#64748B" }}>Today at 11:24 AM • Via {selectedBorrower.paymentModePreferred}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: "800", color: "#059669" }}>+{formatINR(selectedBorrower.lastPaymentAmount)}</div>
                  <span style={{ fontSize: "10px", color: "#059669", fontWeight: "700" }}>VERIFIED</span>
                </div>
              </div>

              <div style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "10px 14px",
                borderRadius: "8px",
                background: "#F8FAFC",
                border: "1px solid #E2E8F0",
                fontSize: "13px"
              }}>
                <div>
                  <div style={{ fontWeight: "700", color: "#111827" }}>Payment Ref #REC-9784</div>
                  <div style={{ fontSize: "11px", color: "#64748B" }}>Yesterday at 12:05 PM • Via Cash</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: "800", color: "#059669" }}>+{formatINR(selectedBorrower.dailyDue)}</div>
                  <span style={{ fontSize: "10px", color: "#059669", fontWeight: "700" }}>VERIFIED</span>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={() => setSelectedBorrower(null)}
                style={{
                  background: "#1E293B",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: "8px",
                  padding: "8px 16px",
                  fontSize: "13px",
                  fontWeight: "600",
                  cursor: "pointer"
                }}
              >
                Close Customer Card
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const filterBtnStyle = (active, activeColor = "#C5A869") => ({
  background: active ? (activeColor === "#DC2626" ? "#FEF2F2" : "#FAF9F6") : "#FFFFFF",
  border: `1px solid ${active ? activeColor : "#E2E8F0"}`,
  color: active ? (activeColor === "#DC2626" ? "#DC2626" : "#8E6D24") : "#64748B",
  padding: "7px 14px",
  borderRadius: "8px",
  fontSize: "12px",
  fontWeight: active ? "700" : "500",
  cursor: "pointer"
});
