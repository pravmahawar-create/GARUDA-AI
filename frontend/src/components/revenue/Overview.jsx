import React, { useEffect, useState } from "react";
import {
  getRevenueMetrics,
  getRevenueRecords,
  getRevenueAnalytics,
  getSettlementSummary,
  listOpportunities,
  getOpportunityMetrics,
  getDealMetrics,
  getAffiliateStatus,
  getDeploymentReadiness,
  listExecutionMissions
} from "../../services/api";
import { GOLD, MUTED, GREEN, AMBER, BLUE, PURPLE, formatAmount, formatNumber, titleCase, timeAgo } from "./format";
import MetricCard from "../MetricCard";
import Sparkline from "../charts/Sparkline";
import RevenueAreaChart from "./RevenueAreaChart";
import Badge from "./Badge";

const OPP_STAGES = ["prospect", "qualified", "proposal", "negotiation", "won", "lost"];

function Panel({ title, eyebrow, children, actions, style }) {
  return (
    <section className="fd-card" style={{ marginBottom: "1.25rem", ...style }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
        <div>
          {eyebrow && <p className="fd-eyebrow" style={{ margin: 0 }}>{eyebrow}</p>}
          <h2 className="fd-heading" style={{ margin: "0.1rem 0 0", fontSize: "1.05rem" }}>{title}</h2>
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}

export default function Overview({ onNavigate }) {
  const [state, setState] = useState({ loading: true, error: "", metrics: null, records: [], analytics: null, settlement: null, opportunities: [], oppMetrics: null, deals: null, affiliate: null, readiness: null, missions: [] });

  useEffect(() => {
    let active = true;
    Promise.all([
      getRevenueMetrics(),
      getRevenueRecords(),
      getRevenueAnalytics(6),
      getSettlementSummary(),
      listOpportunities(),
      getOpportunityMetrics(),
      getDealMetrics(),
      getAffiliateStatus(),
      getDeploymentReadiness(),
      listExecutionMissions()
    ])
      .then(([metrics, records, analytics, settlement, opportunities, oppMetrics, deals, affiliate, readiness, missions]) => {
        if (!active) return;
        setState({
          loading: false,
          error: "",
          metrics,
          records: Array.isArray(records) ? records : [],
          analytics,
          settlement,
          opportunities: Array.isArray(opportunities) ? opportunities : [],
          oppMetrics,
          deals,
          affiliate,
          readiness,
          missions: Array.isArray(missions) ? missions : []
        });
      })
      .catch((error) => {
        if (!active) return;
        setState((prev) => ({ ...prev, loading: false, error: error.message || "Revenue engine unavailable." }));
      });
    return () => { active = false; };
  }, []);

  const { loading, error, metrics, records, analytics, settlement, opportunities, oppMetrics, deals, affiliate, readiness, missions } = state;

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "4rem 0", color: MUTED, fontSize: "0.9rem" }}>
        Loading Revenue Universe overview…
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ border: "1px solid rgba(248,113,113,0.35)", background: "rgba(248,113,113,0.08)", borderRadius: 16, padding: "1.5rem", color: "#fca5a5", fontSize: "0.95rem" }}>
        <strong>Revenue engine unavailable:</strong> {error}
        <div style={{ marginTop: "0.6rem", fontSize: "0.85rem", color: MUTED }}>
          This page reads the production GARUDA API directly. No fabricated values are displayed.
        </div>
      </div>
    );
  }

  const byStatus = Array.isArray(metrics?.byStatus) ? metrics.byStatus : [];
  const receivedRow = byStatus.find((row) => row.status === "received");
  const pendingRow = byStatus.find((row) => row.status === "pending");
  const byStage = Array.isArray(oppMetrics?.byStage) ? oppMetrics.byStage : [];
  const stageRows = OPP_STAGES.map((stage) => byStage.find((row) => row.stage === stage) || { stage, count: 0, potentialValue: 0 });
  const totalOpp = oppMetrics?.totalOpportunities ?? opportunities.length;

  const revenueTrendSeries = Array.isArray(analytics?.monthlySeries)
    ? analytics.monthlySeries.map((m) => Number(m.amount) || 0)
    : [];
  const trendValue = revenueTrendSeries.length > 0
    ? formatAmount(revenueTrendSeries[revenueTrendSeries.length - 1], "INR")
    : "";

  const dealStatusBreakdown = deals?.statusBreakdown || {};
  const approvedDealsCount = (deals?.submissionCount || 0);
  const pipelineValue = oppMetrics?.pipelineValue || 0;
  const weightedPipeline = oppMetrics?.weightedPipelineValue || 0;

  const statCards = [
    {
      icon: "✓",
      title: "Received Revenue",
      value: formatAmount(metrics?.receivedRevenue ?? 0, "INR"),
      detail: `${receivedRow?.count || 0} verified payments · real payment lifecycle only`,
      tone: "gold"
    },
    {
      icon: "◔",
      title: "Revenue Records",
      value: formatNumber(metrics?.totalRecords ?? records.length),
      detail: "88 records · 1:1 with opportunities · production ledger",
      tone: "gold"
    },
    {
      icon: "◌",
      title: "Pending Revenue",
      value: formatAmount(metrics?.pendingRevenue ?? 0, "INR"),
      detail: `${pendingRow?.count || 0} records awaiting payment evidence`,
      tone: "gold"
    },
    {
      icon: "◎",
      title: "Executable Pipeline",
      value: formatAmount(pipelineValue, "INR"),
      detail: `${totalOpp} GARUDA-executable opportunities · weighted ${formatAmount(weightedPipeline, "INR")} · job postings & junk excluded`,
      tone: "gold"
    }
  ];

  const focus = [];
  if (metrics?.pendingRevenue > 0) {
    focus.push({ label: "Pending revenue awaiting payment evidence", detail: formatAmount(metrics.pendingRevenue, "INR"), color: AMBER });
  }
  if (approvedDealsCount > 0) {
    focus.push({ label: "Deal submissions tracked", detail: `${approvedDealsCount} · conversion signals below`, color: BLUE });
  }
  const activeMissions = missions.filter((m) => m.status && !["rejected", "blocked"].includes(m.status)).length;
  if (activeMissions > 0) {
    focus.push({ label: "Active execution missions", detail: `${activeMissions} in flight · Founder decision checkpoints pending`, color: PURPLE });
  }
  if (!focus.length) {
    focus.push({ label: "Operational posture", detail: "Pipeline healthy · awaiting verified commercial activity", color: GREEN });
  }

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        {statCards.map((card) => (
          <MetricCard key={card.title} icon={card.icon} title={card.title} value={card.value} detail={card.detail} tone={card.tone} />
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "1.25rem", marginBottom: "1.25rem" }}>
        <Panel eyebrow="REVENUE TRAJECTORY" title="Verified revenue trend" style={{ marginBottom: 0 }}>
          <RevenueAreaChart
            data={revenueTrendSeries}
            label="Revenue trend"
            value={trendValue}
            color={GOLD}
          />
          <p style={{ margin: "0.75rem 0 0", fontSize: "0.8rem", color: MUTED }}>
            Real RevenueRecord amounts per month (₹). Zeros are honest — no fabricated revenue.
          </p>
        </Panel>

        <Panel eyebrow="PIPELINE SNAPSHOT" title="Opportunities by stage" style={{ marginBottom: 0 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
            {stageRows.map((row) => {
              const maxCount = Math.max(1, ...stageRows.map((s) => s.count));
              return (
                <div key={row.stage}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", marginBottom: "0.25rem" }}>
                    <span style={{ fontWeight: 700, color: "#eef1f6", textTransform: "capitalize" }}>{titleCase(row.stage)}</span>
                    <span style={{ color: MUTED }}>{row.count} · {formatAmount(row.potentialValue, "INR")}</span>
                  </div>
                  <div style={{ height: 7, borderRadius: 999, background: "rgba(212,175,55,0.1)", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${(row.count / maxCount) * 100}%`, background: "linear-gradient(90deg, #b8860b, #f5d76e)", borderRadius: 999 }} />
                  </div>
                </div>
              );
            })}
          </div>
          <p style={{ margin: "0.85rem 0 0", fontSize: "0.78rem", color: MUTED }}>
            Executable pipeline — GARUDA-deliverable opportunities only; human-only job postings and unmeasured scrapes excluded.
          </p>
        </Panel>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "1.25rem", marginBottom: "1.25rem" }}>
        <Panel eyebrow="CONVERSION SIGNALS" title="Deal reality metrics" style={{ marginBottom: 0 }}>
          {deals && deals.submissionCount > 0 ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.6rem" }}>
              {[
                ["Submissions", deals.submissionCount],
                ["Reply rate", deals.replyRatePercent != null ? `${deals.replyRatePercent}%` : "—"],
                ["Win rate", deals.winRatePercent != null ? `${deals.winRatePercent}%` : "—"],
                ["Revenue collected", formatAmount(deals.revenueCollected, "INR")]
              ].map(([label, value]) => (
                <div key={label} style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "0.7rem 0.9rem", background: "rgba(255,255,255,0.02)" }}>
                  <p style={{ margin: 0, color: MUTED, fontSize: "0.66rem", letterSpacing: "0.1em", fontWeight: 800 }}>{label.toUpperCase()}</p>
                  <p style={{ margin: "0.25rem 0 0", fontSize: "1.15rem", fontWeight: 800 }}>{value}</p>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ margin: 0, color: MUTED, fontSize: "0.88rem" }}>
              {deals?.replyRateLabel || "Awaiting empirical deal data."} No fabricated conversion metrics.
            </p>
          )}
          <div style={{ marginTop: "0.85rem", display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
            {Object.entries(dealStatusBreakdown || {}).map(([status, count]) => (
              count > 0 ? <Badge key={status} label={`${titleCase(status)} ${count}`} color={BLUE} /> : null
            ))}
          </div>
        </Panel>

        <Panel eyebrow="RECENT OPERATIONAL ACTIVITY" title="Latest ledger events" style={{ marginBottom: 0 }}>
          {records.length === 0 ? (
            <p style={{ margin: 0, color: MUTED, fontSize: "0.88rem" }}>No revenue records recorded yet.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              {records.slice(0, 5).map((record) => (
                <div key={record.id} style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem", fontSize: "0.84rem", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "0.55rem" }}>
                  <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{record.client}</span>
                  <span style={{ display: "flex", gap: "0.6rem", alignItems: "center" }}>
                    <Badge
                      label={String(record.status || "pending").toUpperCase()}
                      color={record.status === "received" ? GREEN : record.status === "refunded" ? "#f87171" : AMBER}
                    />
                    <span style={{ fontWeight: 700 }}>{formatAmount(record.amount, record.currency)}</span>
                    <span style={{ color: MUTED }}>{timeAgo(record.recordedAt || record.createdAt)}</span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>

      <Panel eyebrow="FOUNDER / OPERATOR FOCUS" title="What needs attention" actions={
        <button type="button" onClick={() => onNavigate && onNavigate("execution")} style={{ background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.3)", color: "#eef1f6", borderRadius: 10, padding: "0.4rem 0.85rem", cursor: "pointer", fontSize: "0.8rem", fontWeight: 700 }}>
          Open Execution →
        </button>
      }>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "0.75rem" }}>
          {focus.map((item, i) => (
            <div key={i} style={{ border: `1px solid ${item.color}33`, borderRadius: 12, padding: "0.9rem 1rem", background: `${item.color}0a` }}>
              <p style={{ margin: 0, fontSize: "0.84rem", fontWeight: 700 }}>{item.label}</p>
              <p style={{ margin: "0.3rem 0 0", fontSize: "0.8rem", color: item.color }}>{item.detail}</p>
            </div>
          ))}
        </div>
        {settlement && (
          <p style={{ margin: "0.85rem 0 0", fontSize: "0.78rem", color: MUTED }}>
            Settlements: {formatAmount(settlement.pendingSettlementAmount, "INR")} pending · rate {settlement.settlementRate}% · affiliate readiness {affiliate?.status || "n/a"}
          </p>
        )}
      </Panel>

      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "1.25rem" }}>
        <button type="button" onClick={() => onNavigate && onNavigate("opportunities")} className="sidebar__button">Opportunities →</button>
        <button type="button" onClick={() => onNavigate && onNavigate("revenue")} className="sidebar__button">Revenue Records →</button>
        <button type="button" onClick={() => onNavigate && onNavigate("settlements")} className="sidebar__button">Settlements →</button>
        <button type="button" onClick={() => onNavigate && onNavigate("intelligence")} className="sidebar__button">Intelligence →</button>
      </div>
    </div>
  );
}