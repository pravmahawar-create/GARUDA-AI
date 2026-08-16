import React, { useEffect, useState } from "react";
import { getSettlementSummary, listSettlements } from "../../services/api";
import { GOLD, MUTED, GREEN, AMBER, RED, BLUE, formatAmount, formatDate, titleCase, timeAgo } from "./format";
import Badge from "./Badge";

const SETTLE_TONE = {
  pending: AMBER,
  eligible: GREEN,
  processing: BLUE,
  settled: GREEN,
  failed: RED
};

export default function SettlementsView() {
  const [state, setState] = useState({ loading: true, error: "", summary: null, settlements: [] });

  useEffect(() => {
    let active = true;
    Promise.all([getSettlementSummary(), listSettlements()])
      .then(([summary, settlements]) => {
        if (!active) return;
        setState({ loading: false, error: "", summary, settlements: Array.isArray(settlements) ? settlements : [] });
      })
      .catch((error) => {
        if (!active) return;
        setState((prev) => ({ ...prev, loading: false, error: error.message || "Settlement engine unavailable." }));
      });
    return () => { active = false; };
  }, []);

  const { loading, error, summary, settlements } = state;

  if (loading) return <div style={{ textAlign: "center", padding: "3rem 0", color: MUTED }}>Loading settlements…</div>;
  if (error) return (
    <div style={{ border: "1px solid rgba(248,113,113,0.35)", background: "rgba(248,113,113,0.08)", borderRadius: 14, padding: "1.25rem", color: "#fca5a5", fontSize: "0.9rem" }}>
      <strong>Settlement engine unavailable:</strong> {error}
    </div>
  );

  const cards = [
    ["SETTLED AMOUNT", formatAmount(summary?.settledAmount ?? 0, "INR"), "Verified payments settled", GREEN],
    ["PENDING SETTLEMENT", formatAmount(summary?.pendingSettlementAmount ?? 0, "INR"), `${summary?.pendingSettlementCount ?? 0} records awaiting payment evidence`, AMBER],
    ["SETTLEMENT RATE", summary?.settlementRate != null ? `${summary.settlementRate}%` : "—", "Of settlement base", BLUE],
    ["REFUNDED", formatAmount(summary?.refundedAmount ?? 0, "INR"), "Refunded amounts", RED]
  ];

  return (
    <div>
      <div style={{ marginBottom: "1.25rem" }}>
        <p className="fd-eyebrow" style={{ margin: 0 }}>SETTLEMENTS</p>
        <h2 className="fd-heading" style={{ margin: "0.1rem 0 0", fontSize: "1.25rem" }}>Settlement lifecycle</h2>
        <p style={{ margin: "0.25rem 0 0", fontSize: "0.78rem", color: MUTED }}>
          Gross / fee / net shown only when the production API provides them. Payout eligibility is real, not assumed.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem", marginBottom: "1.25rem" }}>
        {cards.map(([label, value, detail, color]) => (
          <div key={label} className="fd-stat">
            <p style={{ margin: 0, color: MUTED, fontSize: "0.66rem", letterSpacing: "0.14em", fontWeight: 800 }}>{label}</p>
            <p className="fd-stat__value" style={{ margin: "0.35rem 0 0.15rem", color }}>{value}</p>
            <p className="fd-stat__detail">{detail}</p>
          </div>
        ))}
      </div>

      <div style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, background: "rgba(255,255,255,0.02)", overflow: "hidden" }}>
        {settlements.length === 0 ? (
          <div style={{ padding: "2rem 1.25rem", color: MUTED, fontSize: "0.9rem" }}>
            No settlement ledgers yet. Settlements are created only from real revenue records with payment evidence.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
              <thead>
                <tr style={{ color: MUTED, textAlign: "left" }}>
                  <th style={{ padding: "0.7rem 1.2rem", fontWeight: 700 }}>RECORD</th>
                  <th style={{ padding: "0.7rem 1.2rem", fontWeight: 700 }}>STATUS</th>
                  <th style={{ padding: "0.7rem 1.2rem", fontWeight: 700 }}>GROSS</th>
                  <th style={{ padding: "0.7rem 1.2rem", fontWeight: 700 }}>FEE</th>
                  <th style={{ padding: "0.7rem 1.2rem", fontWeight: 700 }}>NET</th>
                  <th style={{ padding: "0.7rem 1.2rem", fontWeight: 700 }}>ELIGIBLE</th>
                  <th style={{ padding: "0.7rem 1.2rem", fontWeight: 700 }}>PROVIDER</th>
                  <th style={{ padding: "0.7rem 1.2rem", fontWeight: 700 }}>CREATED</th>
                </tr>
              </thead>
              <tbody>
                {settlements.map((s) => (
                  <tr key={s.id} style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                    <td style={{ padding: "0.7rem 1.2rem", fontWeight: 700 }}>{s.revenueRecordId ? String(s.revenueRecordId).slice(-6) : "—"}</td>
                    <td style={{ padding: "0.7rem 1.2rem" }}>
                      <Badge label={titleCase(s.status || "pending").toUpperCase()} color={SETTLE_TONE[s.status] || AMBER} />
                    </td>
                    <td style={{ padding: "0.7rem 1.2rem", fontWeight: 700 }}>{formatAmount(s.grossAmount, s.currency)}</td>
                    <td style={{ padding: "0.7rem 1.2rem", color: MUTED }}>{s.feeAmount != null ? formatAmount(s.feeAmount, s.currency) : "—"}</td>
                    <td style={{ padding: "0.7rem 1.2rem", fontWeight: 700, color: GREEN }}>{s.netAmount != null ? formatAmount(s.netAmount, s.currency) : "—"}</td>
                    <td style={{ padding: "0.7rem 1.2rem" }}>
                      {s.payoutEligible ? <Badge label="ELIGIBLE" color={GREEN} /> : <Badge label="NOT ELIGIBLE" color={RED} />}
                    </td>
                    <td style={{ padding: "0.7rem 1.2rem", color: MUTED }}>{s.provider || "manual"}</td>
                    <td style={{ padding: "0.7rem 1.2rem", color: MUTED }}>{formatDate(s.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {summary?.recentSettlements?.length > 0 && (
        <div style={{ marginTop: "1.25rem" }}>
          <p className="fd-eyebrow" style={{ margin: 0 }}>RECENT SETTLEMENTS</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem", marginTop: "0.6rem" }}>
            {summary.recentSettlements.map((r) => (
              <div key={r.id} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.84rem", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "0.5rem" }}>
                <span>{r.client}</span>
                <span style={{ display: "flex", gap: "0.6rem", alignItems: "center" }}>
                  <Badge label={String(r.status || "pending").toUpperCase()} color={r.status === "received" ? GREEN : AMBER} />
                  <strong>{formatAmount(r.amount, r.currency)}</strong>
                  <span style={{ color: MUTED }}>{timeAgo(r.recordedAt)}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}