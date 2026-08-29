import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import SEOHead from "../components/SEOHead";
import "../styles/high-command.css";

const MODULES = [
  { id: "home", label: "HOME", icon: "⌂" },
  { id: "brain", label: "BRAIN", icon: "🧠" },
  { id: "money", label: "MONEY", icon: "₹" },
  { id: "approvals", label: "APPROVALS", icon: "⚡" },
  { id: "operations", label: "OPERATIONS", icon: "◉" },
  { id: "alerts", label: "ALERTS", icon: "🚨" },
  { id: "activity", label: "ACTIVITY", icon: "📜" }
];

export default function HighCommandCenter({ onLogout }) {
  const navigate = useNavigate();
  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetched, setLastFetched] = useState(null);
  const [activeModule, setActiveModule] = useState("home");
  const [commandSheetOpen, setCommandSheetOpen] = useState(false);
  const [expandedActivityId, setExpandedActivityId] = useState(null);

  // Fetch command center snapshot from Phase 5.1 API
  const fetchSnapshot = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    setError(null);
    try {
      const response = await fetch("/api/founder/command-center", {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "same-origin"
      });

      if (response.status === 401 || response.status === 403) {
        throw new Error("UNAUTHORIZED");
      }

      const resJson = await response.json();
      if (!response.ok || !resJson.success) {
        throw new Error(resJson.error?.message || "Failed to load command snapshot");
      }

      setSnapshot(resJson.data);
      setLastFetched(new Date());
    } catch (err) {
      if (err.message === "UNAUTHORIZED") {
        if (typeof onLogout === "function") {
          onLogout();
        } else {
          navigate("/founder");
        }
        return;
      }
      setError(err.message || "Unable to reach GARUDA High Command API");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [navigate, onLogout]);

  useEffect(() => {
    fetchSnapshot();
  }, [fetchSnapshot]);

  // Relative time helper
  const getRelativeTime = (date) => {
    if (!date) return "Just now";
    const diffSec = Math.floor((new Date() - new Date(date).getTime()) / 1000);
    if (diffSec < 10) return "Just now";
    if (diffSec < 60) return `${diffSec}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    return `${Math.floor(diffHr / 24)}d ago`;
  };

  const formatDateTime = (date) => {
    if (!date) return "—";
    try {
      return new Date(date).toLocaleString("en-IN", {
        day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit"
      });
    } catch {
      return "—";
    }
  };

  // Currency Formatter
  const formatINR = (val) => {
    if (typeof val !== "number" || isNaN(val)) return "—";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(val);
  };

  // Truth-safe helpers: never convert unavailable into 0.
  const sectionAvailable = (section) => section && section.available !== false;
  const moneyOrUnavailable = (value, available) => {
    if (!available) return "UNAVAILABLE";
    if (typeof value !== "number" || isNaN(value)) return "—";
    return formatINR(value);
  };
  const countOrUnavailable = (value, available) => {
    if (!available) return "UNAVAILABLE";
    return typeof value === "number" && Number.isFinite(value) ? value : "—";
  };

  // Overall truth status
  const getStatusLevel = () => {
    if (!snapshot) return "limited";
    if (snapshot.system?.status === "HEALTHY" && (!snapshot.partialErrors || snapshot.partialErrors.length === 0)) {
      return "live";
    }
    if (snapshot.system?.status === "DEGRADED" || (snapshot.partialErrors && snapshot.partialErrors.length > 0)) {
      return "limited";
    }
    return "unavailable";
  };

  const statusLevel = getStatusLevel();

  // Priority card truth state: attention / steady / limited
  const approvalsAvailable = sectionAvailable(snapshot?.approvals);
  const alertsAvailable = sectionAvailable(snapshot?.alerts);
  const hasAttention = (snapshot?.approvals?.pendingCount > 0) || (snapshot?.alerts?.critical > 0);
  const priorityState = (!approvalsAvailable || !alertsAvailable) ? "limited" : (hasAttention ? "attention" : "steady");

  const selectModule = (mod) => {
    setActiveModule(mod);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const renderUnavailableBanner = (message) => (
    <div className="hcc-hero-card" style={{ borderColor: "rgba(244, 63, 94, 0.35)", background: "rgba(20, 8, 12, 0.7)" }}>
      <div className="hcc-hero-headline" style={{ color: "var(--hcc-rose)", fontSize: "1rem", marginBottom: 6 }}>
        DATA UNAVAILABLE
      </div>
      <p className="hcc-hero-sub" style={{ marginBottom: 0 }}>{message}</p>
    </div>
  );

  return (
    <div className="hcc-container">
      <SEOHead
        title="GARUDA High Command Center | Private Sovereign Intelligence"
        description="Private mobile-first command center for Boss to observe and govern the GARUDA Kingdom."
        canonical="https://www.garudaos.in/command-center"
        robots="noindex, nofollow"
      />

      <div className="hcc-wrapper">
        {/* TOP HEADER */}
        <header className="hcc-header">
          <div className="hcc-brand" onClick={() => selectModule("home")}>
            <div className="hcc-crest">🦅</div>
            <div className="hcc-title-area">
              <span className="hcc-title">HIGH COMMAND</span>
              <span className="hcc-subtitle">GARUDA Live Intelligence</span>
            </div>
          </div>

          <div className="hcc-header-actions">
            <div className={`hcc-status-pill ${statusLevel}`}>
              <span className="hcc-dot"></span>
              <span>{statusLevel.toUpperCase()}</span>
            </div>

            <button
              className="hcc-btn-icon"
              onClick={() => fetchSnapshot(true)}
              title="Refresh Intelligence"
              disabled={refreshing}
            >
              <span style={{ display: "inline-block", transform: refreshing ? "rotate(360deg)" : "none", transition: "transform 0.6s ease" }}>
                🔄
              </span>
            </button>
          </div>
        </header>

        {/* MODULE SUB-NAVIGATION */}
        <nav className="hcc-module-nav" aria-label="Intelligence modules">
          {MODULES.map(mod => (
            <button
              key={mod.id}
              className={`hcc-nav-chip ${activeModule === mod.id ? "active" : ""}`}
              onClick={() => selectModule(mod.id)}
            >
              {mod.label}
            </button>
          ))}
        </nav>

        {/* LOADING SKELETON */}
        {loading && (
          <div>
            <div className="hcc-hero-card hcc-skeleton" style={{ height: 180, marginBottom: 16 }}></div>
            <div className="hcc-priority-card hcc-skeleton" style={{ height: 60, marginBottom: 16 }}></div>
            <div className="hcc-intel-grid">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="hcc-intel-card hcc-skeleton" style={{ height: 108 }}></div>
              ))}
            </div>
          </div>
        )}

        {/* ERROR STATE */}
        {!loading && error && (
          <div className="hcc-hero-card" style={{ borderColor: "rgba(244, 63, 94, 0.4)", background: "rgba(20, 8, 12, 0.8)" }}>
            <div className="hcc-hero-headline" style={{ color: "var(--hcc-rose)", fontSize: "1.1rem" }}>
              ⚠️ Command Data Stream Interrupted
            </div>
            <p className="hcc-hero-sub" style={{ color: "var(--hcc-text-muted)" }}>
              {error}
            </p>
            <button
              onClick={() => fetchSnapshot(true)}
              style={{
                padding: "8px 16px",
                background: "var(--hcc-gold-500)",
                color: "#000",
                fontWeight: 700,
                border: "none",
                borderRadius: "var(--hcc-radius-sm)",
                cursor: "pointer"
              }}
            >
              Retry Stream
            </button>
          </div>
        )}

        {/* ========================================================= */}
        {/* ACTIVE MODULE CONTENT                                     */}
        {/* ========================================================= */}
        {!loading && !error && snapshot && (
          <>
            {/* ================= HOME ================= */}
            {activeModule === "home" && (
              <>
                {/* HERO STATUS CARD */}
                <div className="hcc-hero-card">
                  <div className="hcc-hero-meta">
                    <span className="hcc-hero-greeting">Welcome, Boss</span>
                    <span style={{ fontSize: "0.7rem", color: "var(--hcc-text-dim)", fontFamily: "var(--hcc-font-mono)" }}>
                      {getRelativeTime(lastFetched)}
                    </span>
                  </div>

                  <h1 className="hcc-hero-headline">
                    {snapshot.system?.status === "HEALTHY" ? "Kingdom Operational" : "Kingdom Active (Limited)"}
                  </h1>
                  <p className="hcc-hero-sub">
                    {sectionAvailable(snapshot.workforce)
                      ? `Sovereign intelligence synchronized across ${snapshot.workforce.activeAgents?.length || 0} registered runtime engines.`
                      : "Sovereign intelligence synchronized across GARUDA runtime."}
                  </p>

                  <div className="hcc-hero-stats">
                    <div className="hcc-stat-box">
                      <div className="hcc-stat-val">
                        {moneyOrUnavailable(snapshot.revenue?.verifiedWonINR?.amount, sectionAvailable(snapshot.revenue))}
                      </div>
                      <div className="hcc-stat-lbl">Verified Won</div>
                    </div>

                    <div className="hcc-stat-box">
                      <div className="hcc-stat-val">
                        {countOrUnavailable(snapshot.commercial?.activeProjects, sectionAvailable(snapshot.commercial))}
                      </div>
                      <div className="hcc-stat-lbl">Active Projects</div>
                    </div>

                    <div className="hcc-stat-box">
                      <div className="hcc-stat-val">
                        {countOrUnavailable(snapshot.approvals?.pendingCount, approvalsAvailable)}
                      </div>
                      <div className="hcc-stat-lbl">Boss Actions</div>
                    </div>
                  </div>
                </div>

                {/* BOSS PRIORITY CARD (truth-aware three-state) */}
                {priorityState === "attention" && (
                  <div className="hcc-priority-card attention" onClick={() => selectModule("approvals")}>
                    <div className="hcc-priority-info">
                      <div className="hcc-priority-icon">⚡</div>
                      <div>
                        <h3 className="hcc-priority-title">
                          {(snapshot.approvals?.pendingCount || snapshot.alerts?.critical)} Action(s) Require Boss
                        </h3>
                        <p className="hcc-priority-desc">
                          {snapshot.approvals?.items?.[0]?.title || snapshot.alerts?.items?.[0]?.title || "Tap to inspect attention queue"}
                        </p>
                      </div>
                    </div>
                    <span style={{ color: "var(--hcc-gold-400)", fontSize: "1.1rem" }}>➔</span>
                  </div>
                )}

                {priorityState === "steady" && (
                  <div className="hcc-priority-card steady">
                    <div className="hcc-priority-info">
                      <div className="hcc-priority-icon">🛡️</div>
                      <div>
                        <h3 className="hcc-priority-title">Kingdom Steady</h3>
                        <p className="hcc-priority-desc">No approval blockers or critical alerts detected.</p>
                      </div>
                    </div>
                  </div>
                )}

                {priorityState === "limited" && (
                  <div className="hcc-priority-card steady" style={{ borderColor: "rgba(245, 158, 11, 0.4)", background: "linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(20, 16, 8, 0.8) 100%)" }}>
                    <div className="hcc-priority-info">
                      <div className="hcc-priority-icon">⚠️</div>
                      <div>
                        <h3 className="hcc-priority-title">Intelligence Limited</h3>
                        <p className="hcc-priority-desc">
                          {!approvalsAvailable && "Approval visibility unavailable. "}
                          {!alertsAvailable && "Alert visibility unavailable. "}
                          No fabricated status is shown.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* INTELLIGENCE GRIDS */}
                <div className="hcc-section-head">
                  <h2 className="hcc-section-title">Command Intelligence</h2>
                  <span className="hcc-section-badge">Realtime Pulse</span>
                </div>

                <div className="hcc-intel-grid">
                  {/* Brain Card */}
                  <div className="hcc-intel-card" onClick={() => selectModule("brain")}>
                    <div className="hcc-intel-head">
                      <span className="hcc-intel-icon">🧠</span>
                      <span className={`hcc-intel-pill ${sectionAvailable(snapshot.brain) ? "green" : "rose"}`}>
                        {sectionAvailable(snapshot.brain) ? snapshot.brain.status : "LIMITED"}
                      </span>
                    </div>
                    <div className="hcc-intel-body">
                      <div className="hcc-intel-val">
                        {countOrUnavailable(snapshot.brain?.activeMissions, sectionAvailable(snapshot.brain))}
                      </div>
                      <div className="hcc-intel-lbl">Active Missions</div>
                    </div>
                  </div>

                  {/* Commercial Card */}
                  <div className="hcc-intel-card" onClick={() => selectModule("money")}>
                    <div className="hcc-intel-head">
                      <span className="hcc-intel-icon">₹</span>
                      <span className={`hcc-intel-pill ${sectionAvailable(snapshot.commercial) ? "gold" : "rose"}`}>
                        {sectionAvailable(snapshot.commercial) ? `${snapshot.commercial.totalProposals} Props` : "LIMITED"}
                      </span>
                    </div>
                    <div className="hcc-intel-body">
                      <div className="hcc-intel-val">
                        {moneyOrUnavailable(snapshot.revenue?.pipelineValueINR?.amount, sectionAvailable(snapshot.revenue))}
                      </div>
                      <div className="hcc-intel-lbl">Pipeline Value</div>
                    </div>
                  </div>

                  {/* Approvals Card */}
                  <div className="hcc-intel-card" onClick={() => selectModule("approvals")}>
                    <div className="hcc-intel-head">
                      <span className="hcc-intel-icon">⚡</span>
                      <span className={`hcc-intel-pill ${approvalsAvailable ? (snapshot.approvals.pendingCount > 0 ? "gold" : "gray") : "rose"}`}>
                        {approvalsAvailable ? `${snapshot.approvals.pendingCount} Pending` : "UNAVAILABLE"}
                      </span>
                    </div>
                    <div className="hcc-intel-body">
                      <div className="hcc-intel-val">
                        {countOrUnavailable(snapshot.approvals?.pendingCount, approvalsAvailable)}
                      </div>
                      <div className="hcc-intel-lbl">Approvals</div>
                    </div>
                  </div>

                  {/* Operations Card */}
                  <div className="hcc-intel-card" onClick={() => selectModule("operations")}>
                    <div className="hcc-intel-head">
                      <span className="hcc-intel-icon">◉</span>
                      <span className={`hcc-intel-pill ${snapshot.system?.database?.status === "HEALTHY" ? "green" : "gold"}`}>
                        {snapshot.system?.database?.status === "HEALTHY" ? "POSTGRES" : "FALLBACK"}
                      </span>
                    </div>
                    <div className="hcc-intel-body">
                      <div className="hcc-intel-val">
                        {countOrUnavailable(snapshot.workforce?.activeAgents?.length, sectionAvailable(snapshot.workforce))}
                      </div>
                      <div className="hcc-intel-lbl">Active Engines</div>
                    </div>
                  </div>
                </div>

                {/* LIVE ACTIVITY STRIP */}
                <div className="hcc-section-head">
                  <h2 className="hcc-section-title">Live Activity</h2>
                  <span className="hcc-section-badge" onClick={() => selectModule("activity")} style={{ cursor: "pointer" }}>
                    FULL TIMELINE ➔
                  </span>
                </div>

                <div className="hcc-activity-list">
                  {sectionAvailable(snapshot.activity) && snapshot.activity.recentEvents.length > 0 ? (
                    snapshot.activity.recentEvents.slice(0, 5).map((evt, idx) => (
                      <div key={evt.eventId || idx} className="hcc-activity-item">
                        <div className="hcc-activity-dot"></div>
                        <div className="hcc-activity-content">
                          <div className="hcc-activity-top">
                            <span className="hcc-activity-type">{evt.eventType}</span>
                            <span className="hcc-activity-time">{getRelativeTime(evt.occurredAt)}</span>
                          </div>
                          <p className="hcc-activity-msg">{evt.summary}</p>
                          <div className="hcc-activity-seal">
                            <span>{evt.actor?.id || evt.actor || "system"}</span>
                            <span>•</span>
                            <span>{evt.entityType}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="hcc-activity-item" style={{ justifyContent: "center", color: "var(--hcc-text-dim)", padding: "16px" }}>
                      {sectionAvailable(snapshot.activity)
                        ? "No production activity events available."
                        : "Activity feed unavailable."}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* ================= BRAIN INTELLIGENCE ================= */}
            {activeModule === "brain" && (
              <div>
                <div className="hcc-section-head">
                  <h2 className="hcc-section-title">Brain Intelligence</h2>
                  <span className="hcc-section-badge">Execution Truth</span>
                </div>

                {!sectionAvailable(snapshot.brain) ? (
                  renderUnavailableBanner(snapshot.brain?.error || "Brain execution data is not available from the command layer.")
                ) : (
                  <>
                    {/* CURRENT EXECUTION STATE */}
                    <div className="hcc-hero-card">
                      <div className="hcc-hero-meta">
                        <span className="hcc-hero-greeting">Current Execution State</span>
                        <span className={`hcc-status-pill ${snapshot.brain.status === "EXECUTING" ? "live" : "limited"}`}>
                          {snapshot.brain.status || "UNKNOWN"}
                        </span>
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: 8 }}>
                        <span className="hcc-card-badge" style={{ background: "rgba(245,158,11,0.12)", color: "var(--hcc-gold-400)" }}>{snapshot.brain.mode || "governed_execution_runtime"}</span>
                        <span className="hcc-card-badge" style={{ background: "rgba(6,182,212,0.12)", color: "var(--hcc-cyan)" }}>{snapshot.brain.runtime || "serverless_postgresql_dual_mode"}</span>
                      </div>
                      <p className="hcc-hero-sub" style={{ marginBottom: 0 }}>
                        Execution project counts reflect governed delivery projects — not simulated AI cognition.
                      </p>
                    </div>

                    {/* TASK / MILESTONE STATE */}
                    <div className="hcc-hero-stats" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 16, borderTop: "none", paddingTop: 0 }}>
                      <div className="hcc-stat-box">
                        <div className="hcc-stat-val">{countOrUnavailable(snapshot.brain.activeMissions, true)}</div>
                        <div className="hcc-stat-lbl">Active Missions</div>
                      </div>
                      <div className="hcc-stat-box">
                        <div className="hcc-stat-val">{countOrUnavailable(snapshot.brain.activeTasks, true)}</div>
                        <div className="hcc-stat-lbl">Active Tasks</div>
                      </div>
                      <div className="hcc-stat-box">
                        <div className="hcc-stat-val">{countOrUnavailable(snapshot.brain.activeGoals, true)}</div>
                        <div className="hcc-stat-lbl">Active Projects</div>
                      </div>
                    </div>

                    {/* COMPLETED / FAILED WORK */}
                    <div className="hcc-card-list">
                      <div className="hcc-card-item">
                        <div className="hcc-card-top">
                          <h3 className="hcc-card-title">Completed Work</h3>
                          <span className="hcc-card-badge" style={{ background: "rgba(16,185,129,0.12)", color: "var(--hcc-emerald)" }}>{countOrUnavailable(snapshot.brain.completedWorkCount, true)}</span>
                        </div>
                        <p className="hcc-priority-desc">Projects that reached DELIVERY_READY / CLOSED / ARCHIVED.</p>
                      </div>
                      <div className="hcc-card-item">
                        <div className="hcc-card-top">
                          <h3 className="hcc-card-title">Failures / Blockers</h3>
                          <span className="hcc-card-badge" style={{ background: "rgba(244,63,94,0.12)", color: "var(--hcc-rose)" }}>{countOrUnavailable(snapshot.brain.failedWorkCount, true)}</span>
                        </div>
                        <p className="hcc-priority-desc">Projects currently VALIDATION_FAILED or BLOCKED.</p>
                      </div>
                    </div>

                    {/* RECENT EXECUTION */}
                    <div className="hcc-section-head">
                      <h2 className="hcc-section-title">Recent Execution</h2>
                      <span className="hcc-section-badge">Live</span>
                    </div>
                    <div className="hcc-card-list">
                      {snapshot.brain.recentExecution && snapshot.brain.recentExecution.length > 0 ? (
                        snapshot.brain.recentExecution.map(proj => (
                          <div key={proj.projectId} className="hcc-card-item">
                            <div className="hcc-card-top">
                              <h3 className="hcc-card-title">{proj.title || proj.projectId}</h3>
                              <span className="hcc-card-badge" style={{ background: "rgba(16,185,129,0.12)", color: "var(--hcc-emerald)" }}>{proj.status}</span>
                            </div>
                            <p className="hcc-priority-desc">
                              Phase: {proj.currentPhase} {proj.milestonesCount ? `• ${proj.milestonesCount} milestone(s)` : ""}
                            </p>
                            <div className="hcc-card-meta">
                              <span>{proj.projectId}</span>
                              <span>{getRelativeTime(proj.updatedAt)}</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="hcc-card-item">
                          <p className="hcc-priority-desc">No active execution projects currently recorded.</p>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ================= MONEY / COMMERCIAL INTELLIGENCE ================= */}
            {activeModule === "money" && (
              <div>
                <div className="hcc-section-head">
                  <h2 className="hcc-section-title">Money Command</h2>
                  <span className="hcc-section-badge">Revenue Truth</span>
                </div>

                {!sectionAvailable(snapshot.revenue) && !sectionAvailable(snapshot.commercial) ? (
                  renderUnavailableBanner("Commercial and revenue data are not available from the command layer.")
                ) : (
                  <>
                    {/* VERIFIED REVENUE (AUTHORITATIVE) */}
                    <div className="hcc-hero-card" style={{ marginBottom: 14 }}>
                      <div className="hcc-hero-meta">
                        <span className="hcc-hero-greeting">Verified Won Revenue</span>
                        <span className="hcc-status-pill live">AUTHORITATIVE</span>
                      </div>
                      <div style={{ fontSize: "1.8rem", fontWeight: 800, fontFamily: "var(--hcc-font-mono)", color: "var(--hcc-gold-400)" }}>
                        {moneyOrUnavailable(snapshot.revenue?.verifiedWonINR?.amount, sectionAvailable(snapshot.revenue))}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "var(--hcc-text-dim)", marginTop: 4 }}>
                        {sectionAvailable(snapshot.revenue)
                          ? `${snapshot.revenue.verifiedWonINR.transactionsCount || 0} verified transaction(s) recorded in payment ledger.`
                          : "Verified revenue unavailable."}
                      </div>
                    </div>

                    {/* PIPELINE VALUE (DERIVED) */}
                    <div className="hcc-hero-card" style={{ marginBottom: 14 }}>
                      <div className="hcc-hero-meta">
                        <span className="hcc-hero-greeting">Pipeline Valuation</span>
                        <span className="hcc-status-pill limited">DERIVED</span>
                      </div>
                      <div style={{ fontSize: "1.4rem", fontWeight: 800, fontFamily: "var(--hcc-font-mono)", color: "var(--hcc-text-main)" }}>
                        {moneyOrUnavailable(snapshot.revenue?.pipelineValueINR?.amount, sectionAvailable(snapshot.revenue))}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "var(--hcc-text-dim)", marginTop: 4 }}>
                        {sectionAvailable(snapshot.revenue)
                          ? `${snapshot.revenue.pipelineValueINR.proposalsCount || 0} proposal(s) awaiting deposit binding. Derived — not yet collected.`
                          : "Pipeline valuation unavailable."}
                      </div>
                    </div>

                    {/* PENDING PAYMENTS */}
                    <div className="hcc-card-item" style={{ marginBottom: 16 }}>
                      <div className="hcc-card-top">
                        <h3 className="hcc-card-title">Pending Payments</h3>
                        <span className="hcc-card-badge" style={{ background: "rgba(245,158,11,0.12)", color: "var(--hcc-amber)" }}>
                          {countOrUnavailable(snapshot.revenue?.pendingPayments, sectionAvailable(snapshot.revenue))}
                        </span>
                      </div>
                      <p className="hcc-priority-desc">Accepted proposals with deposit settlement still pending.</p>
                    </div>

                    {/* COMMERCIAL FUNNEL */}
                    {sectionAvailable(snapshot.commercial) && (
                      <>
                        <div className="hcc-section-head">
                          <h2 className="hcc-section-title">Commercial Funnel</h2>
                          <span className="hcc-section-badge">Counts</span>
                        </div>
                        <div className="hcc-card-list">
                          {[
                            { label: "Leads", value: snapshot.commercial.totalLeads, sub: "Total inbound + sourced leads" },
                            { label: "Qualified", value: snapshot.commercial.qualifiedLeads, sub: "Contacted or qualified" },
                            { label: "Proposals", value: snapshot.commercial.totalProposals, sub: "Proposals created" },
                            { label: "Accepted", value: snapshot.commercial.acceptedProposals, sub: "Client accepted or paid" },
                            { label: "Projects", value: snapshot.commercial.activeProjects, sub: "Active delivery projects" },
                            { label: "Payments", value: snapshot.commercial.paidProposals, sub: "Deposit confirmed" }
                          ].map(row => (
                            <div key={row.label} className="hcc-card-item">
                              <div className="hcc-card-top">
                                <h3 className="hcc-card-title">{row.label}</h3>
                                <span className="hcc-card-badge" style={{ background: "rgba(245,158,11,0.12)", color: "var(--hcc-gold-400)" }}>{row.value}</span>
                              </div>
                              <p className="hcc-priority-desc">{row.sub}</p>
                            </div>
                          ))}
                        </div>
                      </>
                    )}

                    {/* RECENT COMMERCIAL ACTIVITY */}
                    <div className="hcc-section-head">
                      <h2 className="hcc-section-title">Recent Commercial Activity</h2>
                      <span className="hcc-section-badge">Latest</span>
                    </div>

                    {sectionAvailable(snapshot.revenue) && snapshot.revenue.recentTransactions.length > 0 && (
                      <div className="hcc-card-list">
                        {snapshot.revenue.recentTransactions.map((tx, idx) => (
                          <div key={idx} className="hcc-card-item">
                            <div className="hcc-card-top">
                              <h3 className="hcc-card-title">{tx.clientName || "Client"}</h3>
                              <strong style={{ fontSize: "0.78rem", color: "var(--hcc-emerald)", fontFamily: "var(--hcc-font-mono)" }}>
                                {moneyOrUnavailable(tx.amountPaidINR, true)}
                              </strong>
                            </div>
                            <div className="hcc-card-meta">
                              <span>{tx.proposalId}</span>
                              <span>{getRelativeTime(tx.paidAt)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {sectionAvailable(snapshot.commercial) && snapshot.commercial.recentLeads && snapshot.commercial.recentLeads.length > 0 && (
                      <div className="hcc-card-list">
                        {snapshot.commercial.recentLeads.slice(0, 5).map((l, idx) => (
                          <div key={l.leadId || idx} className="hcc-card-item">
                            <div className="hcc-card-top">
                              <h3 className="hcc-card-title">{l.maskedContact || "Direct Inbound"}</h3>
                              <span className="hcc-card-badge" style={{ background: "rgba(148,163,184,0.1)", color: "var(--hcc-text-dim)" }}>{l.status}</span>
                            </div>
                            <p className="hcc-priority-desc">{l.message || "Direct Inquiry"}</p>
                            <div className="hcc-card-meta">
                              <span>{l.source}</span>
                              <span>{getRelativeTime(l.capturedAt)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {(!sectionAvailable(snapshot.revenue) || snapshot.revenue.recentTransactions.length === 0) &&
                      (!sectionAvailable(snapshot.commercial) || !snapshot.commercial.recentLeads || snapshot.commercial.recentLeads.length === 0) && (
                      <div className="hcc-card-item">
                        <p className="hcc-priority-desc">No recent commercial activity available from the command layer.</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* ================= BOSS APPROVALS ================= */}
            {activeModule === "approvals" && (
              <div>
                <div className="hcc-section-head">
                  <h2 className="hcc-section-title">Boss Approvals</h2>
                  <span className="hcc-section-badge">Review Only</span>
                </div>

                {!approvalsAvailable ? (
                  renderUnavailableBanner(snapshot.approvals?.error || "Approval data is not available from the command layer.")
                ) : snapshot.approvals.pendingCount === 0 ? (
                  <div className="hcc-hero-card">
                    <div className="hcc-hero-headline" style={{ color: "var(--hcc-emerald)", fontSize: "1.1rem", marginBottom: 6 }}>
                      🛡️ No Approvals Pending
                    </div>
                    <p className="hcc-hero-sub" style={{ marginBottom: 0 }}>
                      No proposals currently in WAITING_APPROVAL state require Boss review.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="hcc-card-item" style={{ marginBottom: 14 }}>
                      <div className="hcc-card-top">
                        <h3 className="hcc-card-title">Pending Reviews</h3>
                        <span className="hcc-card-badge" style={{ background: "rgba(245,158,11,0.15)", color: "var(--hcc-gold-400)" }}>
                          {snapshot.approvals.pendingCount}
                        </span>
                      </div>
                      <p className="hcc-priority-desc">
                        Governed proposals awaiting Boss approval before client presentation. View + context only — no execution controls in this phase.
                      </p>
                    </div>

                    <div className="hcc-card-list">
                      {snapshot.approvals.items.map(item => (
                        <div key={item.id} className="hcc-card-item">
                          <div className="hcc-card-top">
                            <h3 className="hcc-card-title">{item.title}</h3>
                            <span className="hcc-card-badge" style={{ background: "rgba(245,158,11,0.15)", color: "var(--hcc-amber)" }}>{item.severity}</span>
                          </div>
                          <p className="hcc-priority-desc">{item.reason}</p>
                          <div className="hcc-card-meta">
                            <span>{item.type}</span>
                            <span>{getRelativeTime(item.createdAt)}</span>
                          </div>
                          {item.recommendedAction && (
                            <div className="hcc-card-meta" style={{ borderTop: "none", paddingTop: 0, color: "var(--hcc-gold-400)" }}>
                              <span>→ {item.recommendedAction}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ================= OPERATIONS INTELLIGENCE ================= */}
            {activeModule === "operations" && (
              <div>
                <div className="hcc-section-head">
                  <h2 className="hcc-section-title">Operations Intelligence</h2>
                  <span className="hcc-section-badge">System Truth</span>
                </div>

                <div className="hcc-hero-card" style={{ marginBottom: 14 }}>
                  <div className="hcc-hero-meta">
                    <span className="hcc-hero-greeting">Infrastructure Health</span>
                    <span className={`hcc-status-pill ${snapshot.system?.status === "HEALTHY" ? "live" : snapshot.system?.status === "DEGRADED" ? "limited" : "unavailable"}`}>
                      {snapshot.system?.status || "UNKNOWN"}
                    </span>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: "0.8rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--hcc-text-dim)" }}>Environment</span>
                      <strong style={{ color: "var(--hcc-text-main)" }}>{snapshot.system?.environment || "production"}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--hcc-text-dim)" }}>Database</span>
                      <strong style={{ color: snapshot.system?.database?.status === "HEALTHY" ? "var(--hcc-emerald)" : "var(--hcc-amber)" }}>
                        {snapshot.system?.database?.status === "HEALTHY" ? "HEALTHY" : "LOCAL STORAGE FALLBACK"} ({snapshot.system?.database?.provider})
                      </strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--hcc-text-dim)" }}>Data Integrity</span>
                      <strong style={{ color: "var(--hcc-gold-400)" }}>{snapshot.system?.database?.dataIntegrity || "ENFORCED"}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--hcc-text-dim)" }}>Event Nervous System</span>
                      <strong style={{ color: snapshot.system?.eventNervousSystem?.status === "HEALTHY" ? "var(--hcc-emerald)" : "var(--hcc-rose)" }}>
                        {snapshot.system?.eventNervousSystem?.status || "UNAVAILABLE"}
                      </strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--hcc-text-dim)" }}>Buffered Events</span>
                      <strong style={{ color: "var(--hcc-text-main)" }}>{countOrUnavailable(snapshot.system?.eventNervousSystem?.bufferedEvents, true)}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--hcc-text-dim)" }}>Telegram Alerts</span>
                      <strong style={{ color: snapshot.system?.telegramAlerts?.status === "CONFIGURED" ? "var(--hcc-emerald)" : "var(--hcc-amber)" }}>
                        {snapshot.system?.telegramAlerts?.status || "NOT_CONFIGURED"}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* WORKFORCE TRUTH */}
                <div className="hcc-section-head">
                  <h2 className="hcc-section-title">Workforce</h2>
                  <span className="hcc-section-badge">{sectionAvailable(snapshot.workforce) ? "Live" : "Limited"}</span>
                </div>

                {!sectionAvailable(snapshot.workforce) ? (
                  renderUnavailableBanner(snapshot.workforce?.error || "Workforce data is not available from the command layer.")
                ) : (
                  <>
                    <div className="hcc-card-list">
                      <div className="hcc-card-item">
                        <div className="hcc-card-top">
                          <h3 className="hcc-card-title">Running Jobs</h3>
                          <span className="hcc-card-badge" style={{ background: "rgba(16,185,129,0.12)", color: "var(--hcc-emerald)" }}>{snapshot.workforce.runningJobs}</span>
                        </div>
                        <p className="hcc-priority-desc">Projects in EXECUTION_RUNNING state.</p>
                      </div>
                      <div className="hcc-card-item">
                        <div className="hcc-card-top">
                          <h3 className="hcc-card-title">Pending Worker Jobs</h3>
                          <span className="hcc-card-badge" style={{ background: "rgba(245,158,11,0.12)", color: "var(--hcc-amber)" }}>{snapshot.workforce.pendingWorkerJobs}</span>
                        </div>
                        <p className="hcc-priority-desc">Projects awaiting external worker connection.</p>
                      </div>
                      <div className="hcc-card-item">
                        <div className="hcc-card-top">
                          <h3 className="hcc-card-title">Failed Jobs</h3>
                          <span className="hcc-card-badge" style={{ background: "rgba(244,63,94,0.12)", color: "var(--hcc-rose)" }}>{snapshot.workforce.failedJobs}</span>
                        </div>
                        <p className="hcc-priority-desc">Projects VALIDATION_FAILED or BLOCKED.</p>
                      </div>
                      <div className="hcc-card-item">
                        <div className="hcc-card-top">
                          <h3 className="hcc-card-title">Registered Runtime Engines</h3>
                          <span className="hcc-card-badge" style={{ background: "rgba(6,182,212,0.12)", color: "var(--hcc-cyan)" }}>{snapshot.workforce.activeAgents?.length || 0}</span>
                        </div>
                        <p className="hcc-priority-desc">
                          Registered engine identifiers. Live worker telemetry is not yet instrumented — counts shown are derived from project state only.
                        </p>
                      </div>
                    </div>
                    <div className="hcc-card-item" style={{ marginBottom: 16 }}>
                      <h3 className="hcc-card-title" style={{ marginBottom: 8 }}>Registered Engines</h3>
                      <ul style={{ margin: 0, paddingLeft: 18, color: "var(--hcc-text-muted)", fontSize: "0.8rem", lineHeight: 1.7 }}>
                        {snapshot.workforce.activeAgents?.map((agent, i) => (
                          <li key={i}><strong style={{ color: "var(--hcc-text-main)" }}>{agent}</strong></li>
                        ))}
                      </ul>
                      <p className="hcc-priority-desc" style={{ marginTop: 8 }}>
                        LIVE WORKER TELEMETRY UNAVAILABLE — no per-worker process metrics are currently collected.
                      </p>
                    </div>
                  </>
                )}

                {/* SUBSYSTEM AVAILABILITY */}
                <div className="hcc-section-head">
                  <h2 className="hcc-section-title">Subsystem Availability</h2>
                  <span className="hcc-section-badge">Isolation</span>
                </div>
                <div className="hcc-card-list">
                  {snapshot.subsystemAvailability && Object.entries(snapshot.subsystemAvailability).map(([key, ok]) => (
                    <div key={key} className="hcc-card-item">
                      <div className="hcc-card-top">
                        <h3 className="hcc-card-title">{key}</h3>
                        <span className={`hcc-card-badge ${ok ? "" : ""}`} style={{ background: ok ? "rgba(16,185,129,0.12)" : "rgba(244,63,94,0.12)", color: ok ? "var(--hcc-emerald)" : "var(--hcc-rose)" }}>
                          {ok ? "LIVE" : "UNAVAILABLE"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {snapshot.partialErrors && snapshot.partialErrors.length > 0 && (
                  <div className="hcc-card-item" style={{ marginBottom: 16 }}>
                    <h3 className="hcc-card-title" style={{ marginBottom: 8 }}>Partial Failures</h3>
                    {snapshot.partialErrors.map((pe, i) => (
                      <p key={i} className="hcc-priority-desc" style={{ fontSize: "0.72rem", color: "var(--hcc-rose)" }}>
                        {pe.subsystem}: {pe.error}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ================= ALERT CENTER ================= */}
            {activeModule === "alerts" && (
              <div>
                <div className="hcc-section-head">
                  <h2 className="hcc-section-title">Alert Center</h2>
                  <span className="hcc-section-badge">Attention Queue</span>
                </div>

                {!alertsAvailable ? (
                  renderUnavailableBanner(snapshot.alerts?.error || "ALERT VISIBILITY LIMITED — alert data is not available from the command layer.")
                ) : snapshot.alerts.items && snapshot.alerts.items.length === 0 ? (
                  <div className="hcc-hero-card">
                    <div className="hcc-hero-headline" style={{ color: "var(--hcc-emerald)", fontSize: "1.1rem", marginBottom: 6 }}>
                      🛡️ No Active Alerts
                    </div>
                    <p className="hcc-hero-sub" style={{ marginBottom: 0 }}>
                      The attention queue returned zero records. Nothing requires Boss action right now.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="hcc-hero-stats" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8, marginBottom: 16, borderTop: "none", paddingTop: 0 }}>
                      <div className="hcc-stat-box">
                        <div className="hcc-stat-val" style={{ color: "var(--hcc-rose)" }}>{snapshot.alerts.critical || 0}</div>
                        <div className="hcc-stat-lbl">Critical / High</div>
                      </div>
                      <div className="hcc-stat-box">
                        <div className="hcc-stat-val" style={{ color: "var(--hcc-amber)" }}>{snapshot.alerts.warnings || 0}</div>
                        <div className="hcc-stat-lbl">Warnings</div>
                      </div>
                    </div>

                    {snapshot.alerts.items.map(item => (
                      <div
                        key={item.id}
                        className={`hcc-alert-item ${item.severity === "CRITICAL" || item.severity === "HIGH" ? "critical" : item.severity === "MEDIUM" ? "warning" : "info"}`}
                      >
                        <div className="hcc-card-top">
                          <h3 className="hcc-card-title">{item.title}</h3>
                          <span className="hcc-card-badge" style={{ color: "var(--hcc-text-main)" }}>{item.severity}</span>
                        </div>
                        <p className="hcc-priority-desc">{item.reason}</p>
                        <div className="hcc-card-meta">
                          <span>{item.type}</span>
                          <span>{getRelativeTime(item.createdAt)}</span>
                        </div>
                        {item.entityType && (
                          <div className="hcc-card-meta" style={{ borderTop: "none", paddingTop: 0 }}>
                            <span>{item.entityType}:{item.entityId}</span>
                            {item.recommendedAction && <span style={{ color: "var(--hcc-gold-400)" }}>{item.recommendedAction}</span>}
                          </div>
                        )}
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}

            {/* ================= FULL ACTIVITY TIMELINE ================= */}
            {activeModule === "activity" && (
              <div>
                <div className="hcc-section-head">
                  <h2 className="hcc-section-title">Full Activity Timeline</h2>
                  <span className="hcc-section-badge">Chronological</span>
                </div>

                {!sectionAvailable(snapshot.activity) ? (
                  renderUnavailableBanner(snapshot.activity?.error || "Activity timeline is not available from the command layer.")
                ) : snapshot.activity.recentEvents.length === 0 ? (
                  <div className="hcc-hero-card">
                    <div className="hcc-hero-headline" style={{ color: "var(--hcc-text-dim)", fontSize: "1.1rem", marginBottom: 6 }}>
                      No Production Events
                    </div>
                    <p className="hcc-hero-sub" style={{ marginBottom: 0 }}>
                      No production lifecycle events are currently reachable. Test-generated events are excluded by the command layer.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="hcc-card-item" style={{ marginBottom: 14 }}>
                      <div className="hcc-card-top">
                        <h3 className="hcc-card-title">Events in Window</h3>
                        <span className="hcc-card-badge" style={{ background: "rgba(6,182,212,0.12)", color: "var(--hcc-cyan)" }}>
                          {snapshot.activity.totalEvents}
                        </span>
                      </div>
                      <p className="hcc-priority-desc">Test-generated events (unit_test / TEST_EVENT) are excluded server-side.</p>
                    </div>

                    <div className="hcc-activity-list">
                      {snapshot.activity.recentEvents.map((evt, idx) => (
                        <div
                          key={evt.eventId || idx}
                          className="hcc-activity-item"
                          style={{ flexDirection: "column", cursor: evt.eventId ? "pointer" : "default" }}
                          onClick={() => evt.eventId && setExpandedActivityId(expandedActivityId === evt.eventId ? null : evt.eventId)}
                        >
                          <div style={{ display: "flex", alignItems: "flex-start", gap: 10, width: "100%" }}>
                            <div className="hcc-activity-dot"></div>
                            <div className="hcc-activity-content">
                              <div className="hcc-activity-top">
                                <span className="hcc-activity-type">{evt.eventType}</span>
                                <span className="hcc-activity-time">{getRelativeTime(evt.occurredAt)}</span>
                              </div>
                              <p className="hcc-activity-msg">{evt.summary}</p>
                              <div className="hcc-activity-seal">
                                <span>{evt.actor?.id || evt.actor || "system"}</span>
                                <span>•</span>
                                <span>{evt.entityType || "system"}{evt.entityId ? `:${evt.entityId}` : ""}</span>
                              </div>
                            </div>
                          </div>
                          {expandedActivityId === evt.eventId && (
                            <div style={{ marginTop: 8, padding: "10px 12px", borderRadius: "var(--hcc-radius-sm)", background: "rgba(6,8,13,0.5)", fontSize: "0.68rem", color: "var(--hcc-text-dim)", fontFamily: "var(--hcc-font-mono)", lineHeight: 1.6, wordBreak: "break-all" }}>
                              <div>EVENT {evt.eventId}</div>
                              <div>STATUS: {evt.status || "—"}</div>
                              <div>OCCURRED: {formatDateTime(evt.occurredAt)}</div>
                              {evt.immutabilitySeal && evt.immutabilitySeal !== "UNSEALED" && (
                                <div>INTEGRITY: {evt.immutabilitySeal} SEALED</div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* BOTTOM NAVIGATION BAR */}
      <nav className="hcc-bottom-nav">
        <button
          className={`hcc-nav-item ${activeModule === "home" ? "active" : ""}`}
          onClick={() => selectModule("home")}
        >
          <span className="hcc-nav-icon">⌂</span>
          <span className="hcc-nav-lbl">HOME</span>
        </button>

        <button
          className={`hcc-nav-item ${activeModule === "brain" ? "active" : ""}`}
          onClick={() => selectModule("brain")}
        >
          <span className="hcc-nav-icon">🧠</span>
          <span className="hcc-nav-lbl">BRAIN</span>
        </button>

        {/* CENTER COMMAND ORB */}
        <div className="hcc-orb-wrapper">
          <button
            className="hcc-command-orb"
            onClick={() => setCommandSheetOpen(true)}
            title="Open Command Sheet"
            aria-label="Open command sheet"
          >
            ⚡
          </button>
        </div>

        <button
          className={`hcc-nav-item ${activeModule === "money" ? "active" : ""}`}
          onClick={() => selectModule("money")}
        >
          <span className="hcc-nav-icon">₹</span>
          <span className="hcc-nav-lbl">MONEY</span>
        </button>

        <button
          className={`hcc-nav-item ${activeModule === "operations" ? "active" : ""}`}
          onClick={() => selectModule("operations")}
        >
          <span className="hcc-nav-icon">◉</span>
          <span className="hcc-nav-lbl">SYSTEM</span>
        </button>
      </nav>

      {/* COMMAND ORB SHEET MODAL */}
      {commandSheetOpen && (
        <div className="hcc-sheet-backdrop" onClick={() => setCommandSheetOpen(false)}>
          <div className="hcc-sheet" onClick={e => e.stopPropagation()}>
            <div className="hcc-sheet-handle"></div>
            <div className="hcc-sheet-head">
              <h3 className="hcc-sheet-title">GARUDA Command Actions</h3>
              <button
                onClick={() => setCommandSheetOpen(false)}
                style={{ background: "transparent", border: "none", color: "var(--hcc-text-dim)", fontSize: "1.2rem", cursor: "pointer" }}
                aria-label="Close command sheet"
              >
                ✕
              </button>
            </div>

            <div className="hcc-sheet-options">
              <button
                className="hcc-sheet-btn"
                onClick={() => {
                  setCommandSheetOpen(false);
                  navigate("/chat");
                }}
              >
                <div>
                  <strong>Ask GARUDA Intelligence</strong>
                  <div style={{ fontSize: "0.72rem", color: "var(--hcc-text-muted)" }}>Open conversational interface</div>
                </div>
                <span>💬</span>
              </button>

              <button
                className="hcc-sheet-btn"
                onClick={() => {
                  setCommandSheetOpen(false);
                  fetchSnapshot(true);
                }}
              >
                <div>
                  <strong>Synchronize Kingdom Pulse</strong>
                  <div style={{ fontSize: "0.72rem", color: "var(--hcc-text-muted)" }}>Force realtime snapshot reload</div>
                </div>
                <span>🔄</span>
              </button>

              <button
                className="hcc-sheet-btn"
                onClick={() => {
                  setCommandSheetOpen(false);
                  selectModule("approvals");
                }}
              >
                <div>
                  <strong>Open Boss Approvals</strong>
                  <div style={{ fontSize: "0.72rem", color: "var(--hcc-gold-400)" }}>Review governed proposals</div>
                </div>
                <span>⚡</span>
              </button>

              <button
                className="hcc-sheet-btn disabled"
                title="Coming in Phase 5.3"
              >
                <div>
                  <strong>Autonomous Revenue Dispatch</strong>
                  <div style={{ fontSize: "0.72rem", color: "var(--hcc-gold-400)" }}>COMING IN PHASE 5.3</div>
                </div>
                <span>🔒</span>
              </button>

              <button
                className="hcc-sheet-btn"
                onClick={() => {
                  setCommandSheetOpen(false);
                  if (typeof onLogout === "function") onLogout();
                  else navigate("/founder");
                }}
                style={{ background: "rgba(244, 63, 94, 0.1)", borderColor: "rgba(244, 63, 94, 0.3)", color: "var(--hcc-rose)" }}
              >
                <div>
                  <strong>Lock Command Center</strong>
                  <div style={{ fontSize: "0.72rem", color: "var(--hcc-text-dim)" }}>End session</div>
                </div>
                <span>🔒</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
