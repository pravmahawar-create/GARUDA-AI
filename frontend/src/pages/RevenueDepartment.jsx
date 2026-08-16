import React, { useEffect, useState } from "react";
import { getRevenueRecords, getRevenueMetrics } from "../services/api";

const GOLD = "#d4af37";
const MUTED = "#8b94a6";
const GREEN = "#75f4ab";
const AMBER = "#f5d76e";

function formatAmount(amount, currency) {
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: String(currency || "INR"),
      maximumFractionDigits: 2
    }).format(Number(amount || 0));
  } catch {
    return `${currency || "INR"} ${Number(amount || 0).toFixed(2)}`;
  }
}

const STATUS_TONE = {
  pending: { label: "PENDING", color: AMBER },
  received: { label: "RECEIVED", color: GREEN },
  refunded: { label: "REFUNDED", color: "#f87171" }
};

export default function RevenueDepartment({ onBack }) {
  const [state, setState] = useState({ loading: true, error: "", records: [], metrics: null });

  useEffect(() => {
    let active = true;
    Promise.all([getRevenueMetrics(), getRevenueRecords()])
      .then(([metrics, records]) => {
        if (!active) return;
        setState({ loading: false, error: "", records: Array.isArray(records) ? records : [], metrics });
      })
      .catch((error) => {
        if (!active) return;
        setState({ loading: false, error: error.message || "Revenue engine unavailable.", records: [], metrics: null });
      });
    return () => { active = false; };
  }, []);

  const { loading, error, records, metrics } = state;
  const byStatus = Array.isArray(metrics?.byStatus) ? metrics.byStatus : [];
  const totalPending = byStatus.find((row) => row.status === "pending");
  const totalReceived = byStatus.find((row) => row.status === "received");

  const statCards = [
    { label: "TOTAL RECORDS", value: String(metrics?.totalRecords ?? records.length), detail: "Revenue Department ledger" },
    { label: "RECEIVED REVENUE", value: formatAmount(metrics?.receivedRevenue ?? 0, "INR"), detail: `${totalReceived?.count || 0} verified payments`, tone: GREEN },
    { label: "PENDING REVENUE", value: formatAmount(metrics?.pendingRevenue ?? 0, "INR"), detail: `${totalPending?.count || 0} records awaiting payment evidence`, tone: AMBER }
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#04070a", color: "#e7e9ee", fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif", padding: "2rem 1.25rem" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
          {typeof onBack === "function" && (
            <button
              type="button"
              onClick={onBack}
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "#e7e9ee", borderRadius: 8, padding: "0.45rem 0.85rem", cursor: "pointer", fontSize: "0.85rem" }}
            >
              ← Back to Founder Console
            </button>
          )}
          <div>
            <p style={{ margin: 0, color: GOLD, fontSize: "0.72rem", fontWeight: 800, letterSpacing: "0.18em" }}>REVENUE DEPARTMENT</p>
            <h1 style={{ margin: "0.2rem 0 0", fontSize: "1.6rem", fontWeight: 800 }}>GARUDA Revenue Universe</h1>
          </div>
        </div>

        <div style={{ border: "1px solid rgba(245,215,110,0.22)", background: "rgba(245,215,110,0.07)", borderRadius: 14, padding: "0.9rem 1.1rem", marginBottom: "1.5rem", fontSize: "0.85rem", lineHeight: 1.5, color: "#e9dcae" }}>
          <strong style={{ color: GOLD }}>Revenue integrity rule:</strong> Potential value ≠ received revenue. A record is <strong>RECEIVED</strong> only when real payment evidence (verified Razorpay payment event / settlement) exists. Everything else is honestly shown as <strong>PENDING</strong>.
        </div>

        {loading && (
          <div style={{ textAlign: "center", padding: "3rem 0", color: MUTED }}>
            Loading Revenue Department…
          </div>
        )}

        {!loading && error && (
          <div style={{ border: "1px solid rgba(248,113,113,0.35)", background: "rgba(248,113,113,0.08)", borderRadius: 14, padding: "1.5rem", color: "#fca5a5", fontSize: "0.95rem" }}>
            <strong>Revenue engine unavailable:</strong> {error}
            <div style={{ marginTop: "0.6rem", fontSize: "0.85rem", color: MUTED }}>
              This page reads the production GARUDA API directly. If the production database reports degraded, records cannot be shown here — no fabricated values are displayed.
            </div>
          </div>
        )}

        {!loading && !error && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
              {statCards.map((card) => (
                <div key={card.label} style={{ border: "1px solid rgba(255,255,255,0.09)", borderRadius: 16, padding: "1.2rem 1.3rem", background: "linear-gradient(165deg, rgba(245,215,110,0.05), rgba(10,14,20,0.9))" }}>
                  <p style={{ margin: 0, color: MUTED, fontSize: "0.7rem", fontWeight: 800, letterSpacing: "0.14em" }}>{card.label}</p>
                  <p style={{ margin: "0.4rem 0 0.2rem", fontSize: "1.7rem", fontWeight: 800, color: card.tone || "#fff" }}>{card.value}</p>
                  <p style={{ margin: 0, color: MUTED, fontSize: "0.78rem" }}>{card.detail}</p>
                </div>
              ))}
            </div>

            <div style={{ border: "1px solid rgba(255,255,255,0.09)", borderRadius: 16, background: "rgba(255,255,255,0.02)", overflow: "hidden" }}>
              <div style={{ padding: "1rem 1.3rem", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                <strong style={{ fontSize: "0.9rem" }}>Revenue Records</strong>
                <span style={{ marginLeft: "0.6rem", color: MUTED, fontSize: "0.8rem" }}>{records.length} in ledger</span>
              </div>

              {records.length === 0 ? (
                <div style={{ padding: "2rem 1.3rem", color: MUTED, fontSize: "0.9rem" }}>No revenue records found.</div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.86rem" }}>
                    <thead>
                      <tr style={{ color: MUTED, textAlign: "left" }}>
                        <th style={{ padding: "0.7rem 1.3rem", fontWeight: 700 }}>CLIENT</th>
                        <th style={{ padding: "0.7rem 1.3rem", fontWeight: 700 }}>AMOUNT</th>
                        <th style={{ padding: "0.7rem 1.3rem", fontWeight: 700 }}>STATUS</th>
                        <th style={{ padding: "0.7rem 1.3rem", fontWeight: 700 }}>SOURCE</th>
                        <th style={{ padding: "0.7rem 1.3rem", fontWeight: 700 }}>RECORDED</th>
                        <th style={{ padding: "0.7rem 1.3rem", fontWeight: 700 }}>NOTES</th>
                      </tr>
                    </thead>
                    <tbody>
                      {records.map((record) => {
                        const tone = STATUS_TONE[record.status] || STATUS_TONE.pending;
                        return (
                          <tr key={record.id} style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                            <td style={{ padding: "0.7rem 1.3rem" }}>{record.client || "—"}</td>
                            <td style={{ padding: "0.7rem 1.3rem", fontWeight: 700 }}>{formatAmount(record.amount, record.currency)}</td>
                            <td style={{ padding: "0.7rem 1.3rem" }}>
                              <span style={{ display: "inline-block", fontSize: "0.68rem", fontWeight: 800, letterSpacing: "0.08em", padding: "0.2rem 0.6rem", borderRadius: 999, border: `1px solid ${tone.color}66`, color: tone.color, background: `${tone.color}14` }}>{tone.label}</span>
                            </td>
                            <td style={{ padding: "0.7rem 1.3rem", color: MUTED }}>{record.source || "direct"}</td>
                            <td style={{ padding: "0.7rem 1.3rem", color: MUTED }}>{new Date(record.recordedAt || record.createdAt || Date.now()).toLocaleDateString("en-IN")}</td>
                            <td style={{ padding: "0.7rem 1.3rem", color: MUTED, maxWidth: 280 }}>{record.notes || ""}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}