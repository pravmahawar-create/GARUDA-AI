import React, { useState } from "react";
import { 
  FiSearch, FiFilter, FiTruck, FiAlertTriangle, 
  FiCheckCircle, FiChevronLeft, FiChevronRight, FiPackage, FiInfo 
} from "react-icons/fi";
import { MILK_WORKERS_100 } from "./vyaparDemoData";

export default function MilkDistributionOS() {
  const [searchTerm, setSearchTerm] = useState("");
  const [routeFilter, setRouteFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const pageSize = 15;

  const formatINR = (val) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(val);
  };

  // Summary Metrics across all 100 workers
  const totalStockIssued = MILK_WORKERS_100.reduce((acc, w) => acc + w.stockIssuedLiters, 0);
  const totalDelivered = MILK_WORKERS_100.reduce((acc, w) => acc + w.deliveredLiters, 0);
  const totalSalesValue = MILK_WORKERS_100.reduce((acc, w) => acc + w.totalSalesValue, 0);
  const totalExpectedCash = MILK_WORKERS_100.reduce((acc, w) => acc + w.expectedCash, 0);
  const totalActualCash = MILK_WORKERS_100.reduce((acc, w) => acc + w.actualCashDeposited, 0);
  const totalDiscrepancy = totalActualCash - totalExpectedCash;

  // Filtered workers
  const filteredWorkers = MILK_WORKERS_100.filter((w) => {
    const matchesSearch = w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          w.workerId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          w.route.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRoute = routeFilter === "all" || w.route.toLowerCase().includes(routeFilter.toLowerCase());
    const matchesStatus = statusFilter === "all" || 
                          (statusFilter === "discrepancy" && w.variance !== 0) ||
                          (statusFilter === "settled" && w.settlementStatus === "Settled");
    return matchesSearch && matchesRoute && matchesStatus;
  });

  const totalPages = Math.ceil(filteredWorkers.length / pageSize);
  const paginatedWorkers = filteredWorkers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* 1. Header */}
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
              MILK DISTRIBUTION ENTERPRISE OS
            </span>
            <span style={{ fontSize: "12px", color: "#64748B" }}>
              100 Field Delivery Personnel • Jabalpur Dairy Hub
            </span>
          </div>
          <h2 style={{ margin: 0, fontSize: "22px", fontWeight: "800", color: "#111827" }}>
            Morning Crates Dispatch & Evening Cash Settlement Desk
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
            TOTAL ISSUED: {totalStockIssued.toLocaleString()} LTR ({Math.round(totalStockIssued / 12)} Crates)
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
            NET VARIANCE: {formatINR(totalDiscrepancy)}
          </div>
        </div>
      </div>

      {/* 2. Inventory & Settlement Summary KPI Grid */}
      <div className="vyapar-kpi-grid">
        <div style={kpiBoxStyle}>
          <div style={{ fontSize: "11px", color: "#64748B", fontWeight: "600" }}>TOTAL DELIVERED</div>
          <div style={{ fontSize: "20px", fontWeight: "800", color: "#111827", fontVariantNumeric: "tabular-nums" }}>
            {totalDelivered.toLocaleString()} L
          </div>
          <div style={{ fontSize: "11px", color: "#059669" }}>
            {((totalDelivered / totalStockIssued) * 100).toFixed(1)}% Delivery Rate
          </div>
        </div>

        <div style={kpiBoxStyle}>
          <div style={{ fontSize: "11px", color: "#64748B", fontWeight: "600" }}>TOTAL SALES VALUE</div>
          <div style={{ fontSize: "20px", fontWeight: "800", color: "#111827", fontVariantNumeric: "tabular-nums" }}>
            {formatINR(totalSalesValue)}
          </div>
          <div style={{ fontSize: "11px", color: "#64748B" }}>Gross Turnover</div>
        </div>

        <div style={kpiBoxStyle}>
          <div style={{ fontSize: "11px", color: "#64748B", fontWeight: "600" }}>EXPECTED CASH</div>
          <div style={{ fontSize: "20px", fontWeight: "800", color: "#111827", fontVariantNumeric: "tabular-nums" }}>
            {formatINR(totalExpectedCash)}
          </div>
          <div style={{ fontSize: "11px", color: "#64748B" }}>After Credit & Digital Sales</div>
        </div>

        <div style={{ ...kpiBoxStyle, borderLeft: "4px solid #059669" }}>
          <div style={{ fontSize: "11px", color: "#059669", fontWeight: "700" }}>ACTUAL DEPOSITED</div>
          <div style={{ fontSize: "20px", fontWeight: "800", color: "#059669", fontVariantNumeric: "tabular-nums" }}>
            {formatINR(totalActualCash)}
          </div>
          <div style={{ fontSize: "11px", color: "#059669" }}>Vault Credited</div>
        </div>
      </div>

      {/* 3. Search, Filter & Discrepancy Toggle Bar */}
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
            placeholder="Search amongst 100 workers by name, Worker ID (e.g. MW-014), or locality..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
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

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <select
            value={routeFilter}
            onChange={(e) => {
              setRouteFilter(e.target.value);
              setCurrentPage(1);
            }}
            style={{
              border: "1px solid #E2E8F0",
              background: "#FAF9F6",
              padding: "7px 12px",
              borderRadius: "8px",
              fontSize: "12px",
              color: "#1E293B",
              fontWeight: "600",
              outline: "none"
            }}
          >
            <option value="all">All Jabalpur Zones</option>
            <option value="Wright Town">Wright Town</option>
            <option value="Napier Town">Napier Town</option>
            <option value="Civil Lines">Civil Lines</option>
            <option value="Madan Mahal">Madan Mahal</option>
            <option value="Gorakhpur">Gorakhpur</option>
            <option value="Adhartal">Adhartal</option>
            <option value="Ranjhi">Ranjhi</option>
            <option value="Garha">Garha</option>
          </select>

          <button
            onClick={() => {
              setStatusFilter("all");
              setCurrentPage(1);
            }}
            style={filterBtnStyle(statusFilter === "all")}
          >
            All 100 Workers
          </button>

          <button
            onClick={() => {
              setStatusFilter("discrepancy");
              setCurrentPage(1);
            }}
            style={filterBtnStyle(statusFilter === "discrepancy", "#DC2626")}
          >
            ⚠️ Flagged Discrepancies
          </button>
        </div>
      </div>

      {/* 4. Workers Table with Tabular Data */}
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
                <th style={{ padding: "12px 16px" }}>WORKER & ID</th>
                <th style={{ padding: "12px 16px" }}>ASSIGNED ROUTE</th>
                <th style={{ padding: "12px 16px" }}>ISSUED (LTR)</th>
                <th style={{ padding: "12px 16px" }}>DELIVERED</th>
                <th style={{ padding: "12px 16px" }}>RETURNS/DAM</th>
                <th style={{ padding: "12px 16px" }}>EXPECTED CASH</th>
                <th style={{ padding: "12px 16px" }}>DEPOSITED CASH</th>
                <th style={{ padding: "12px 16px" }}>VARIANCE</th>
                <th style={{ padding: "12px 16px" }}>STATUS</th>
                <th style={{ padding: "12px 16px", textAlign: "right" }}>AUDIT</th>
              </tr>
            </thead>
            <tbody>
              {paginatedWorkers.map((w) => (
                <tr 
                  key={w.workerId}
                  style={{
                    borderBottom: "1px solid #F1F5F9",
                    background: w.variance !== 0 ? "rgba(254, 242, 242, 0.5)" : "transparent"
                  }}
                >
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ fontWeight: "700", color: "#1E293B" }}>{w.name}</div>
                    <div style={{ fontSize: "11px", color: "#64748B" }}>{w.workerId} • {w.phone}</div>
                  </td>
                  <td style={{ padding: "12px 16px", color: "#475569" }}>
                    {w.route}
                  </td>
                  <td style={{ padding: "12px 16px", fontWeight: "700", color: "#111827", fontVariantNumeric: "tabular-nums" }}>
                    {w.stockIssuedLiters} L ({w.assignedCrates} crt)
                  </td>
                  <td style={{ padding: "12px 16px", color: "#059669", fontWeight: "700", fontVariantNumeric: "tabular-nums" }}>
                    {w.deliveredLiters} L
                  </td>
                  <td style={{ padding: "12px 16px", color: "#64748B", fontVariantNumeric: "tabular-nums" }}>
                    {w.returnedUnsoldLiters} ret / {w.damagedLiters} dam
                  </td>
                  <td style={{ padding: "12px 16px", fontWeight: "700", color: "#111827", fontVariantNumeric: "tabular-nums" }}>
                    {formatINR(w.expectedCash)}
                  </td>
                  <td style={{ padding: "12px 16px", fontWeight: "800", color: "#059669", fontVariantNumeric: "tabular-nums" }}>
                    {formatINR(w.actualCashDeposited)}
                  </td>
                  <td style={{ padding: "12px 16px", fontVariantNumeric: "tabular-nums" }}>
                    {w.variance !== 0 ? (
                      <span style={{ color: "#DC2626", fontWeight: "800" }}>
                        {formatINR(w.variance)}
                      </span>
                    ) : (
                      <span style={{ color: "#059669", fontWeight: "600" }}>₹0</span>
                    )}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{
                      padding: "3px 8px",
                      borderRadius: "6px",
                      fontSize: "11px",
                      fontWeight: "700",
                      background: w.variance !== 0 ? "#FEE2E2" : w.settlementStatus === "Settled" ? "#ECFDF5" : "#FEF3C7",
                      color: w.variance !== 0 ? "#DC2626" : w.settlementStatus === "Settled" ? "#059669" : "#D97706"
                    }}>
                      {w.settlementStatus}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px", textAlign: "right" }}>
                    <button
                      onClick={() => setSelectedWorker(w)}
                      style={{
                        background: "#FAF9F6",
                        border: "1px solid #CBD5E1",
                        borderRadius: "6px",
                        padding: "4px 8px",
                        fontSize: "11px",
                        fontWeight: "600",
                        color: "#1E293B",
                        cursor: "pointer"
                      }}
                    >
                      Inspect
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards View */}
        <div className="vyapar-mobile-only vyapar-mobile-cards-wrap" style={{ padding: "12px" }}>
          {paginatedWorkers.map((w) => (
            <div key={w.workerId} className="vyapar-mobile-card" style={{
              borderLeft: w.variance !== 0 ? "4px solid #DC2626" : "4px solid #059669",
              background: w.variance !== 0 ? "rgba(254, 242, 242, 0.5)" : "#FFFFFF"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontWeight: "800", fontSize: "15px", color: "#111827" }}>{w.name}</div>
                  <div style={{ fontSize: "11px", color: "#64748B" }}>{w.workerId} • {w.route}</div>
                </div>
                <span style={{
                  padding: "3px 8px",
                  borderRadius: "6px",
                  fontSize: "11px",
                  fontWeight: "700",
                  background: w.variance !== 0 ? "#FEE2E2" : w.settlementStatus === "Settled" ? "#ECFDF5" : "#FEF3C7",
                  color: w.variance !== 0 ? "#DC2626" : w.settlementStatus === "Settled" ? "#059669" : "#D97706"
                }}>
                  {w.settlementStatus}
                </span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", background: "#FAF9F6", padding: "8px 10px", borderRadius: "8px", fontSize: "12px" }}>
                <div>
                  <span style={{ color: "#64748B" }}>Issued: </span>
                  <strong style={{ color: "#111827" }}>{w.stockIssuedLiters} L</strong>
                </div>
                <div>
                  <span style={{ color: "#64748B" }}>Delivered: </span>
                  <strong style={{ color: "#059669" }}>{w.deliveredLiters} L</strong>
                </div>
                <div>
                  <span style={{ color: "#64748B" }}>Returns: </span>
                  <span>{w.returnedUnsoldLiters} L</span>
                </div>
                <div>
                  <span style={{ color: "#64748B" }}>Damaged: </span>
                  <span style={{ color: w.damagedLiters > 0 ? "#DC2626" : "#64748B" }}>{w.damagedLiters} L</span>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "6px", borderTop: "1px solid #F1F5F9" }}>
                <div>
                  <div style={{ fontSize: "10px", color: "#64748B" }}>EXP. CASH / DEPOSITED</div>
                  <div style={{ fontSize: "13px", fontWeight: "800", color: "#111827", fontVariantNumeric: "tabular-nums" }}>
                    {formatINR(w.expectedCash)} / <span style={{ color: "#059669" }}>{formatINR(w.actualCashDeposited)}</span>
                  </div>
                </div>

                <div style={{ textAlign: "right", display: "flex", alignItems: "center", gap: "10px" }}>
                  {w.variance !== 0 && (
                    <div style={{ fontSize: "12px", fontWeight: "800", color: "#DC2626", fontVariantNumeric: "tabular-nums" }}>
                      {formatINR(w.variance)}
                    </div>
                  )}
                  <button
                    onClick={() => setSelectedWorker(w)}
                    style={{
                      background: "#111827",
                      color: "#C5A869",
                      border: "none",
                      borderRadius: "6px",
                      padding: "6px 12px",
                      fontSize: "12px",
                      fontWeight: "700",
                      cursor: "pointer"
                    }}
                  >
                    Inspect
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination Bar */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "14px 20px",
          background: "#FAF9F6",
          borderTop: "1px solid #E2E8F0",
          fontSize: "13px",
          color: "#64748B"
        }}>
          <div>
            Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, filteredWorkers.length)} of {filteredWorkers.length} delivery workers
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              style={{
                background: "#FFFFFF",
                border: "1px solid #CBD5E1",
                padding: "6px 12px",
                borderRadius: "6px",
                cursor: currentPage === 1 ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: "4px"
              }}
            >
              <FiChevronLeft size={14} /> Prev
            </button>
            <span style={{ fontWeight: "700", color: "#111827" }}>
              Page {currentPage} of {totalPages || 1}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              style={{
                background: "#FFFFFF",
                border: "1px solid #CBD5E1",
                padding: "6px 12px",
                borderRadius: "6px",
                cursor: currentPage >= totalPages ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: "4px"
              }}
            >
              Next <FiChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* 5. Worker Detail Settlement Modal */}
      {selectedWorker && (
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
            maxWidth: "520px",
            width: "100%",
            padding: "26px",
            border: "1px solid #E2E8F0"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
              <div>
                <span style={{ fontSize: "11px", color: "#8E6D24", fontWeight: "700" }}>DAILY SETTLEMENT AUDIT</span>
                <h3 style={{ margin: "2px 0 0", fontSize: "18px", fontWeight: "800", color: "#111827" }}>
                  {selectedWorker.name} ({selectedWorker.workerId})
                </h3>
                <div style={{ fontSize: "12px", color: "#64748B" }}>{selectedWorker.route}</div>
              </div>
              <button 
                onClick={() => setSelectedWorker(null)}
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

            <div style={{
              background: "#FAF9F6",
              borderRadius: "10px",
              padding: "16px",
              border: "1px solid #E2E8F0",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              marginBottom: "18px",
              fontSize: "13px"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#64748B" }}>Stock Issued (Morning):</span>
                <span style={{ fontWeight: "700" }}>{selectedWorker.stockIssuedLiters} Liters ({selectedWorker.assignedCrates} Crates)</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#64748B" }}>Delivered to Retailers:</span>
                <span style={{ fontWeight: "700", color: "#059669" }}>{selectedWorker.deliveredLiters} Liters</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#64748B" }}>Returned Unsold:</span>
                <span>{selectedWorker.returnedUnsoldLiters} Liters</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#64748B" }}>Damaged Pouches:</span>
                <span style={{ color: selectedWorker.damagedLiters > 0 ? "#DC2626" : "#64748B" }}>
                  {selectedWorker.damagedLiters} Liters
                </span>
              </div>
              <div style={{ borderTop: "1px dashed #CBD5E1", paddingTop: "8px", display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#64748B" }}>Credit Sales (Bahi-Khata):</span>
                <span style={{ fontWeight: "700" }}>{formatINR(selectedWorker.creditSales)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#64748B" }}>Direct UPI Payments:</span>
                <span style={{ fontWeight: "700" }}>{formatINR(selectedWorker.digitalSales)}</span>
              </div>
              <div style={{ borderTop: "1px solid #CBD5E1", paddingTop: "8px", display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontWeight: "700", color: "#111827" }}>Physical Cash Expected:</span>
                <span style={{ fontWeight: "800", color: "#111827" }}>{formatINR(selectedWorker.expectedCash)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontWeight: "700", color: "#059669" }}>Actual Cash Handed Over:</span>
                <span style={{ fontWeight: "800", color: "#059669" }}>{formatINR(selectedWorker.actualCashDeposited)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontWeight: "700", color: selectedWorker.variance !== 0 ? "#DC2626" : "#059669" }}>
                  Settlement Variance:
                </span>
                <span style={{ fontWeight: "900", color: selectedWorker.variance !== 0 ? "#DC2626" : "#059669" }}>
                  {formatINR(selectedWorker.variance)}
                </span>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={() => setSelectedWorker(null)}
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
                Close Audit Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const kpiBoxStyle = {
  background: "#FFFFFF",
  borderRadius: "12px",
  padding: "16px",
  border: "1px solid #E2E8F0",
  display: "flex",
  flexDirection: "column",
  gap: "4px"
};

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
