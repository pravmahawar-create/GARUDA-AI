import React, { useEffect, useState } from "react";
import { getRevenueRecords, getRevenueMetrics, getRevenueAnalytics } from "../../services/api";
import { GOLD, MUTED, GREEN, AMBER, RED, formatAmount, formatDate, titleCase } from "./format";
import Badge from "./Badge";
import RevenueAreaChart from "./RevenueAreaChart";

export default function RevenueLedger() {
  const [state, setState] = useState({ loading: true, error: "", records: [], metrics: null, analytics: null });
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    let active = true;
    Promise.all([getRevenueRecords(), getRevenueMetrics(), getRevenueAnalytics(6)])
      .then(([records, metrics, analytics]) => {
        if (!active) return;
        setState({ loading: false, error: "", records: Array.isArray(records) ? records : [], metrics, analytics });
      })
      .catch((error) => {
        if (!active) return;
        setState((prev) => ({ ...prev, loading: false, error: error.message || "Revenue engine unavailable." }));
      });
    return () => { active = false; };
  }, []);

  const { loading, error, records, metrics, analytics } = state;

  if (loading) return <div style={{ textAlign: "center", padding: "3rem 0", color: MUTED }}>Loading Revenue ledger…</div>;
  if (error) return (
    <div style={{ border: "1px solid rgba(248,113,113,0.35)", background: "rgba(248,113,113,0.08)", borderRadius: 14, padding: "1.25rem", color: "#fca5a5", fontSize: "0.9rem" }}>
      <strong>Revenue engine unavailable:</strong> {error}
    </div>
  );

  const byStatus = Array.isArray(metrics?.byStatus) ? metrics.byStatus : [];
  const received = byStatus.find((row) => row.status === "received");
  const pending = byStatus.find((row) => row.status === "pending");
  const refunded = byStatus.find((row) => row.status === "refunded");
  const trendSeries = Array.isArray(analytics?.monthlySeries) ? analytics.monthlySeries.map((m) => Number(m.amount) || 0) : [];

  return (
    <div>
      <div style={{ marginBottom: "1.25rem" }}>
        <p className="fd-eyebrow" style={{ margin: 0 }}>REVENUE RECORDS</p>
        <h2 className="fd-heading" style={{ margin: "0.1rem 0 0", fontSize: "1.25rem" }}>Revenue ledger</h2>
        <p style={{ margin: "0.25rem 0 0", fontSize: "0.78rem", color: MUTED }}>
          Actual RevenueRecords with lifecycle status. A record is <strong>RECEIVED</strong> only when real payment evidence exists.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem", marginBottom: "1.25rem" }}>
        {[
          ["TOTAL RECORDS", String(metrics?.totalRecords ?? records.length), `${byStatus.length} statuses tracked`, GOLD],
          ["RECEIVED REVENUE", formatAmount(metrics?.receivedRevenue ?? 0, "INR"), `${received?.count || 0} verified payments`, GREEN],
          ["PENDING REVENUE", formatAmount(metrics?.pendingRevenue ?? 0, "INR"), `${pending?.count || 0} awaiting payment evidence`, AMBER],
          ["REFUNDED", formatAmount(metrics?.refundedRevenue ?? 0, "INR"), `${refunded?.count || 0} refunded records`, RED]
        ].map(([label, value, detail, color]) => (
          <div key={label} className="fd-stat">
            <p style={{ margin: 0, color: MUTED, fontSize: "0.66rem", letterSpacing: "0.14em", fontWeight: 800 }}>{label}</p>
            <p className="fd-stat__value" style={{ margin: "0.35rem 0 0.15rem", color }}>{value}</p>
            <p className="fd-stat__detail">{detail}</p>
          </div>
        ))}
      </div>

      <div style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, background: "rgba(255,255,255,0.02)", padding: "1rem 1.25rem", marginBottom: "1.25rem" }}>
        <p className="fd-eyebrow" style={{ margin: 0 }}>REVENUE TREND</p>
        <RevenueAreaChart data={trendSeries} label="Revenue records trend" color={GOLD} />
      </div>

      <div style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, background: "rgba(255,255,255,0.02)", overflow: "hidden" }}>
        {records.length === 0 ? (
          <div style={{ padding: "2rem 1.25rem", color: MUTED, fontSize: "0.9rem" }}>No revenue records found.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
              <thead>
                <tr style={{ color: MUTED, textAlign: "left" }}>
                  <th style={{ padding: "0.7rem 1.2rem", fontWeight: 700 }}>CLIENT</th>
                  <th style={{ padding: "0.7rem 1.2rem", fontWeight: 700 }}>AMOUNT</th>
                  <th style={{ padding: "0.7rem 1.2rem", fontWeight: 700 }}>STATUS</th>
                  <th style={{ padding: "0.7rem 1.2rem", fontWeight: 700 }}>SOURCE</th>
                  <th style={{ padding: "0.7rem 1.2rem", fontWeight: 700 }}>OPPORTUNITY</th>
                  <th style={{ padding: "0.7rem 1.2rem", fontWeight: 700 }}>RECORDED</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => {
                  const color = record.status === "received" ? GREEN : record.status === "refunded" ? RED : AMBER;
                  return (
                    <tr key={record.id} onClick={() => setSelected(record)} style={{ borderTop: "1px solid rgba(255,255,255,0.05)", cursor: "pointer" }}>
                      <td style={{ padding: "0.7rem 1.2rem", fontWeight: 700 }}>{record.client || "—"}</td>
                      <td style={{ padding: "0.7rem 1.2rem", fontWeight: 700, color: GOLD }}>{formatAmount(record.amount, record.currency)}</td>
                      <td style={{ padding: "0.7rem 1.2rem" }}><Badge label={String(record.status || "pending").toUpperCase()} color={color} /></td>
                      <td style={{ padding: "0.7rem 1.2rem", color: MUTED }}>{record.source || "direct"}</td>
                      <td style={{ padding: "0.7rem 1.2rem", color: MUTED }}>{record.opportunityId ? String(record.opportunityId).slice(-6) : "—"}</td>
                      <td style={{ padding: "0.7rem 1.2rem", color: MUTED }}>{formatDate(record.recordedAt || record.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(3,7,18,0.72)", zIndex: 50, display: "grid", placeItems: "center", padding: "1.25rem" }} onClick={() => setSelected(null)}>
          <div className="fd-card" style={{ maxWidth: 560, width: "100%", maxHeight: "82vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
              <div>
                <Badge label={String(selected.status || "pending").toUpperCase()} color={selected.status === "received" ? GREEN : selected.status === "refunded" ? RED : AMBER} />
                <h3 className="fd-heading" style={{ margin: "0.5rem 0 0", fontSize: "1.15rem" }}>{selected.client || "Revenue record"}</h3>
              </div>
              <button type="button" onClick={() => setSelected(null)} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.14)", color: "#eef1f6", borderRadius: 8, padding: "0.35rem 0.7rem", cursor: "pointer", fontSize: "0.85rem" }}>✕</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.6rem", marginTop: "1rem" }}>
              {[
                ["Amount", formatAmount(selected.amount, selected.currency)],
                ["Status", titleCase(selected.status || "pending")],
                ["Source", selected.source || "direct"],
                ["Currency", selected.currency || "INR"],
                ["Recorded", formatDate(selected.recordedAt || selected.createdAt)],
                ["Opportunity ref", selected.opportunityId ? String(selected.opportunityId).slice(-6) : "—"]
              ].map(([label, value]) => (
                <div key={label} style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "0.6rem 0.8rem", background: "rgba(255,255,255,0.02)" }}>
                  <p style={{ margin: 0, color: MUTED, fontSize: "0.64rem", letterSpacing: "0.1em", fontWeight: 800 }}>{label.toUpperCase()}</p>
                  <p style={{ margin: "0.2rem 0 0", fontWeight: 700, fontSize: "0.9rem" }}>{value}</p>
                </div>
              ))}
            </div>
            {selected.verificationEvidence && (
              <div style={{ marginTop: "1rem", border: "1px solid rgba(117,244,171,0.22)", borderRadius: 10, padding: "0.75rem 0.9rem", background: "rgba(117,244,171,0.05)" }}>
                <p style={{ margin: 0, color: GREEN, fontSize: "0.72rem", fontWeight: 800, letterSpacing: "0.1em" }}>VERIFICATION EVIDENCE</p>
                <pre style={{ margin: "0.5rem 0 0", fontSize: "0.74rem", color: MUTED, whiteSpace: "pre-wrap", fontFamily: "monospace" }}>
                  {JSON.stringify(selected.verificationEvidence, null, 2)}
                </pre>
              </div>
            )}
            {selected.notes && <p style={{ margin: "1rem 0 0", fontSize: "0.85rem", color: MUTED }}>{selected.notes}</p>}
          </div>
        </div>
      )}
    </div>
  );
}