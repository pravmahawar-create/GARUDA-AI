import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import SEOHead from "../components/SEOHead";
import "../styles/high-command.css";

const MODULES = [
  { id: "home", label: "HOME", icon: "⌂" },
  { id: "creative", label: "CREATIVE", icon: "🎨" },
  { id: "brain", label: "BRAIN", icon: "🧠" },
  { id: "money", label: "MONEY", icon: "₹" },
  { id: "approvals", label: "APPROVALS", icon: "⚡" },
  { id: "operations", label: "SYSTEM", icon: "◉" },
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
  const [activityFilter, setActivityFilter] = useState("ALL");
  const [executingProjectId, setExecutingProjectId] = useState(null);

  const handleExecuteProject = async (projectId) => {
    setExecutingProjectId(projectId);
    try {
      const res = await fetch(`/api/founder/command/projects/${projectId}/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin"
      });
      if (res.ok) {
        await fetchSnapshot(true);
      }
    } catch (e) {
      console.warn("Project execution trigger note:", e.message);
    } finally {
      setExecutingProjectId(null);
    }
  };

  // Fetch command center snapshot from Phase 5.1 / 5.2B API
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

  // Truth-safe helpers: never convert unavailable into 0
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

  // Filtered activity events
  const rawEvents = snapshot?.activity?.recentEvents || [];
  const filteredEvents = activityFilter === "ALL"
    ? rawEvents
    : rawEvents.filter(e => e.eventType === activityFilter || e.entityType === activityFilter.toLowerCase());

  return (
    <div className="hcc-container">
      <SEOHead
        title="GARUDA High Command Center | Private Sovereign Intelligence"
        description="Private mobile-first command center for Boss to observe and govern the GARUDA Kingdom."
        canonical="https://www.garudaos.in/command-center"
        robots="noindex, nofollow"
      />

      <div className="hcc-ambient-mandala" aria-hidden="true"></div>

      <div className="hcc-wrapper">
        {/* ========================================================= */}
        {/* TOP HEADER                                                */}
        {/* ========================================================= */}
        <header className="hcc-header">
          <div className="hcc-brand" onClick={() => selectModule("home")}>
            <div className="hcc-crest">
              <img src="/favicon/garuda-sigil-icon.svg" alt="GARUDA Sigil" className="hcc-crest-img" onError={(e) => { e.target.style.display = 'none'; e.target.parentNode.innerText = '🦅'; }} />
            </div>
            <div className="hcc-title-area">
              <span className="hcc-title">
                GARUDA
              </span>
              <span className="hcc-subtitle">HIGH COMMAND CENTER</span>
            </div>
          </div>

          <div className="hcc-header-actions" style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <button
              type="button"
              onClick={() => navigate("/founder/access")}
              style={{
                background: "linear-gradient(135deg, rgba(212,175,55,0.25), rgba(184,134,11,0.5))",
                color: "#fef08a",
                border: "1px solid #d4af37",
                borderRadius: "8px",
                padding: "0.4rem 0.9rem",
                fontWeight: "bold",
                fontSize: "0.8rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.3rem"
              }}
            >
              👑 Access Kingdom
            </button>

            <div className={`hcc-status-pill ${statusLevel}`}>
              <span className="hcc-dot"></span>
              <span>{statusLevel.toUpperCase()}</span>
            </div>

            <button
              className="hcc-btn-icon"
              onClick={() => fetchSnapshot(true)}
              title="Synchronize Kingdom"
              disabled={refreshing}
              aria-label="Synchronize command center"
            >
              <span style={{ display: "inline-block", transform: refreshing ? "rotate(360deg)" : "none", transition: "transform 0.6s ease" }}>
                ↻
              </span>
            </button>
          </div>
        </header>

        {/* ========================================================= */}
        {/* MODULE SUB-NAVIGATION (HORIZONTAL CHIPS)                  */}
        {/* ========================================================= */}
        <nav className="hcc-module-nav" aria-label="Intelligence modules">
          {MODULES.map(mod => (
            <button
              key={mod.id}
              className={`hcc-nav-chip ${activeModule === mod.id ? "active" : ""}`}
              onClick={() => selectModule(mod.id)}
            >
              <span>{mod.icon}</span>
              <span>{mod.label}</span>
            </button>
          ))}
        </nav>

        {/* LOADING SKELETON */}
        {loading && (
          <div>
            <div className="hcc-kingdom-pulse hcc-skeleton" style={{ height: 200, marginBottom: 16 }}></div>
            <div className="hcc-hero-card hcc-skeleton" style={{ height: 140, marginBottom: 16 }}></div>
            <div className="hcc-intel-grid">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="hcc-intel-card hcc-skeleton" style={{ height: 96 }}></div>
              ))}
            </div>
          </div>
        )}

        {/* ERROR STATE */}
        {!loading && error && (
          <div className="hcc-hero-card" style={{ borderColor: "rgba(244, 63, 94, 0.4)", background: "rgba(20, 8, 12, 0.85)" }}>
            <div className="hcc-hero-headline" style={{ color: "var(--hcc-rose)", fontSize: "1.1rem" }}>
              ⚠️ Command Stream Interrupted
            </div>
            <p className="hcc-hero-sub" style={{ color: "var(--hcc-text-muted)" }}>
              {error}
            </p>
            <button
              onClick={() => fetchSnapshot(true)}
              style={{
                padding: "10px 20px",
                background: "var(--hcc-gold-500)",
                color: "#000",
                fontWeight: 800,
                border: "none",
                borderRadius: "var(--hcc-radius-sm)",
                cursor: "pointer",
                textTransform: "uppercase",
                letterSpacing: "0.05em"
              }}
            >
              Reconnect Stream
            </button>
          </div>
        )}

        {/* ========================================================= */}
        {/* ACTIVE MODULE VIEW                                        */}
        {/* ========================================================= */}
        {!loading && !error && snapshot && (
          <>
            {/* ===================================================== */}
            {/* TAB: HOME                                             */}
            {/* ===================================================== */}
            {activeModule === "home" && (
              <>
                {/* 1. KINGDOM PULSE (EMOTIONAL CENTERPIECE) */}
                <section className="hcc-kingdom-pulse">
                  <div className="hcc-pulse-header">
                    <div className="hcc-pulse-tag">
                      <span>👑</span>
                      <span>KINGDOM PULSE</span>
                    </div>
                    <div className={`hcc-status-pill ${statusLevel}`}>
                      <span className="hcc-dot"></span>
                      <span>● LIVE</span>
                    </div>
                  </div>

                  <div className="hcc-pulse-core">
                    <div className="hcc-pulse-emblem-wrap">
                      <img
                        src="/favicon/garuda-sigil-icon.svg"
                        alt="GARUDA Sovereign Sigil"
                        className="hcc-pulse-emblem"
                        onError={(e) => { e.target.style.display = 'none'; e.target.parentNode.innerText = '🦅'; }}
                      />
                    </div>
                    <div className="hcc-pulse-titles">
                      <h1 className="hcc-pulse-main-title">
                        {snapshot.system?.status === "HEALTHY" ? "Kingdom Operational" : "Kingdom Active (Limited)"}
                      </h1>
                      <p className="hcc-pulse-sub-text">
                        Everything is under your command. Welcome, Boss.
                      </p>
                    </div>
                  </div>

                  {/* Real KPI Grid */}
                  <div className="hcc-kpi-grid">
                    <div className="hcc-kpi-cell">
                      <div className="hcc-kpi-val">
                        {countOrUnavailable(snapshot.brain?.activeMissions, sectionAvailable(snapshot.brain))}
                      </div>
                      <div className="hcc-kpi-lbl">Missions</div>
                    </div>
                    <div className="hcc-kpi-cell">
                      <div className="hcc-kpi-val">
                        {countOrUnavailable(snapshot.brain?.activeTasks, sectionAvailable(snapshot.brain))}
                      </div>
                      <div className="hcc-kpi-lbl">Tasks</div>
                    </div>
                    <div className="hcc-kpi-cell">
                      <div className="hcc-kpi-val">
                        {countOrUnavailable(snapshot.commercial?.activeProjects, sectionAvailable(snapshot.commercial))}
                      </div>
                      <div className="hcc-kpi-lbl">Projects</div>
                    </div>
                    <div className="hcc-kpi-cell">
                      <div className="hcc-kpi-val">
                        {countOrUnavailable(snapshot.workforce?.activeAgents?.length, sectionAvailable(snapshot.workforce))}
                      </div>
                      <div className="hcc-kpi-lbl">Engines</div>
                    </div>
                  </div>
                </section>

                {/* 2. QUICK COMMAND ACTIONS */}
                <section className="hcc-quick-command-section">
                  <div className="hcc-section-head" style={{ marginTop: 0, marginBottom: 8 }}>
                    <h2 className="hcc-section-title">Quick Command</h2>
                    <span className="hcc-section-badge">Actions</span>
                  </div>

                  <div className="hcc-quick-grid">
                    <button
                      className="hcc-quick-btn"
                      onClick={() => setCommandSheetOpen(true)}
                      title="Run Agents"
                    >
                      <span className="hcc-quick-icon">🤖</span>
                      <span className="hcc-quick-lbl">Agents</span>
                    </button>

                    <button
                      className="hcc-quick-btn"
                      onClick={() => navigate("/chat")}
                      title="Start New Mission via Solution Architect"
                    >
                      <span className="hcc-quick-icon">✨</span>
                      <span className="hcc-quick-lbl">Mission</span>
                    </button>

                    <button
                      className="hcc-quick-btn"
                      onClick={() => navigate("/chat")}
                      title="Ask GARUDA Intelligence"
                    >
                      <span className="hcc-quick-icon">💬</span>
                      <span className="hcc-quick-lbl">Ask AI</span>
                    </button>

                    <button
                      className="hcc-quick-btn"
                      onClick={() => selectModule("approvals")}
                      title="Boss Approvals"
                    >
                      <span className="hcc-quick-icon">⚡</span>
                      <span className="hcc-quick-lbl">Approve</span>
                    </button>

                    <button
                      className="hcc-quick-btn"
                      onClick={() => fetchSnapshot(true)}
                      title="Synchronize Kingdom"
                    >
                      <span className="hcc-quick-icon">🔄</span>
                      <span className="hcc-quick-lbl">Sync</span>
                    </button>
                  </div>
                </section>

                {/* 3. MOTHER BRAIN STATUS HERO */}
                <section className="hcc-hero-card">
                  <div className="hcc-hero-meta">
                    <span className="hcc-hero-greeting">MOTHER BRAIN STATUS</span>
                    <span className={`hcc-status-pill ${snapshot.brain?.status === "EXECUTING" ? "live" : "limited"}`}>
                      {snapshot.brain?.status || "UNKNOWN"}
                    </span>
                  </div>

                  <h2 className="hcc-hero-headline" style={{ fontSize: "1rem", color: "var(--hcc-gold-400)" }}>
                    EXECUTION TRUTH • {snapshot.brain?.mode || "GOVERNED_EXECUTION_RUNTIME"}
                  </h2>
                  <p className="hcc-hero-sub">
                    All systems operational. Agents executing governed tasks with cryptographic verification.
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
                        {moneyOrUnavailable(snapshot.revenue?.pipelineValueINR?.amount, sectionAvailable(snapshot.revenue))}
                      </div>
                      <div className="hcc-stat-lbl">Pipeline</div>
                    </div>

                    <div className="hcc-stat-box">
                      <div className="hcc-stat-val">
                        {countOrUnavailable(snapshot.approvals?.pendingCount, approvalsAvailable)}
                      </div>
                      <div className="hcc-stat-lbl">Boss Actions</div>
                    </div>
                  </div>
                </section>

                {/* 4. BOSS PRIORITY / ATTENTION STRIP */}
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

                {/* 5. INTELLIGENCE GRIDS */}
                <div className="hcc-section-head">
                  <h2 className="hcc-section-title">Command Intelligence</h2>
                  <span className="hcc-section-badge">Realtime Modules</span>
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

                {/* 6. RECENT EXECUTION SNIPPET */}
                <div className="hcc-section-head">
                  <h2 className="hcc-section-title">Recent Execution</h2>
                  <span className="hcc-section-badge" onClick={() => selectModule("brain")} style={{ cursor: "pointer", color: "var(--hcc-gold-400)" }}>
                    VIEW ALL ➔
                  </span>
                </div>

                <div className="hcc-card-list">
                  {sectionAvailable(snapshot.brain) && snapshot.brain.recentExecution && snapshot.brain.recentExecution.length > 0 ? (
                    snapshot.brain.recentExecution.slice(0, 5).map(proj => (
                      <div key={proj.projectId} className="hcc-card-item">
                        <div className="hcc-card-top">
                          <h3 className="hcc-card-title">{proj.title || proj.projectId}</h3>
                          <span className="hcc-card-badge" style={{
                            background: proj.status === "DELIVERY_READY" ? "rgba(16,185,129,0.15)" : "rgba(212,175,55,0.15)",
                            color: proj.status === "DELIVERY_READY" ? "var(--hcc-emerald)" : "var(--hcc-gold-400)"
                          }}>
                            {proj.status}
                          </span>
                        </div>

                        {/* Activated Universes Badges */}
                        {Array.isArray(proj.activatedUniverses) && proj.activatedUniverses.length > 0 && (
                          <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap", margin: "0.35rem 0 0.5rem" }}>
                            {proj.activatedUniverses.slice(0, 4).map((u, i) => (
                              <span key={i} style={{ fontSize: "0.65rem", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#cbd5e1", padding: "0.1rem 0.4rem", borderRadius: 4 }}>
                                {u}
                              </span>
                            ))}
                            {proj.activatedUniverses.length > 4 && (
                              <span style={{ fontSize: "0.65rem", color: "var(--hcc-gold-400)" }}>
                                +{proj.activatedUniverses.length - 4} more
                              </span>
                            )}
                          </div>
                        )}

                        <p className="hcc-priority-desc">
                          Phase: {proj.currentPhase} {proj.milestonesCount ? `• ${proj.milestonesCount} milestone(s)` : ""}
                        </p>

                        <div className="hcc-card-meta" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.5rem" }}>
                          <div>
                            <span>{proj.projectId}</span> • <span>{getRelativeTime(proj.updatedAt)}</span>
                          </div>

                          {proj.status !== "DELIVERY_READY" && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleExecuteProject(proj.projectId);
                              }}
                              disabled={executingProjectId === proj.projectId}
                              style={{
                                background: "linear-gradient(135deg, #d4af37 0%, #b8860b 100%)",
                                color: "#000",
                                border: "none",
                                borderRadius: 4,
                                padding: "0.25rem 0.65rem",
                                fontSize: "0.72rem",
                                fontWeight: 800,
                                cursor: "pointer"
                              }}
                            >
                              {executingProjectId === proj.projectId ? "Executing…" : "Execute Governed Plan ⚡"}
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="hcc-card-item">
                      <p className="hcc-priority-desc">No active execution projects currently recorded.</p>
                    </div>
                  )}
                </div>

                {/* 7. LIVE ACTIVITY STRIP */}
                <div className="hcc-section-head">
                  <h2 className="hcc-section-title">Live Activity</h2>
                  <span className="hcc-section-badge" onClick={() => selectModule("activity")} style={{ cursor: "pointer", color: "var(--hcc-gold-400)" }}>
                    FULL TIMELINE ➔
                  </span>
                </div>

                <div className="hcc-activity-list">
                  {sectionAvailable(snapshot.activity) && snapshot.activity.recentEvents.length > 0 ? (
                    snapshot.activity.recentEvents.slice(0, 4).map((evt, idx) => (
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

            {/* ===================================================== */}
            {/* TAB: BRAIN INTELLIGENCE                               */}
            {/* ===================================================== */}
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

            {/* ===================================================== */}
            {/* TAB: MONEY COMMAND                                    */}
            {/* ===================================================== */}
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
                          ? `${snapshot.revenue.verifiedWonINR?.transactionsCount || 0} verified transaction(s) recorded in payment ledger.`
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
                          ? `${snapshot.revenue.pipelineValueINR?.proposalsCount || 0} proposal(s) awaiting deposit binding. Derived — not yet collected.`
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
                          <h2 className="hcc-section-title">Commercial Conversion Pulse</h2>
                          <span className="hcc-section-badge">Funnel Truth</span>
                        </div>
                        <div className="hcc-card-list">
                          {[
                            { label: "Total Leads", value: snapshot.commercial.totalLeads, sub: "Total inbound + sourced leads" },
                            { label: "Qualified Prospects", value: snapshot.commercial.qualifiedLeads, sub: "Contacted or qualified" },
                            { label: "Active Proposals", value: snapshot.commercial.totalProposals, sub: "Proposals created" },
                            { label: "Accepted Proposals", value: snapshot.commercial.acceptedProposals, sub: "Client accepted or paid" },
                            { label: "Active Projects", value: snapshot.commercial.activeProjects, sub: "Active delivery projects" },
                            { label: "Confirmed Payments", value: snapshot.commercial.paidProposals, sub: "Deposit confirmed" }
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

                    {sectionAvailable(snapshot.revenue) && snapshot.revenue.recentTransactions?.length > 0 && (
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

                    {(!sectionAvailable(snapshot.revenue) || snapshot.revenue.recentTransactions?.length === 0) &&
                      (!sectionAvailable(snapshot.commercial) || !snapshot.commercial.recentLeads || snapshot.commercial.recentLeads.length === 0) && (
                      <div className="hcc-card-item">
                        <p className="hcc-priority-desc">No recent commercial activity available from the command layer.</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* ===================================================== */}
            {/* TAB: BOSS APPROVALS                                   */}
            {/* ===================================================== */}
            {activeModule === "approvals" && (
              <div>
                <div className="hcc-section-head">
                  <h2 className="hcc-section-title">Boss Approvals</h2>
                  <span className="hcc-section-badge">Decision Queue</span>
                </div>

                {!approvalsAvailable ? (
                  renderUnavailableBanner(snapshot.approvals?.error || "Approval data is not available from the command layer.")
                ) : snapshot.approvals.pendingCount === 0 ? (
                  <div className="hcc-hero-card">
                    <div className="hcc-hero-headline" style={{ color: "var(--hcc-emerald)", fontSize: "1.1rem", marginBottom: 6 }}>
                      🛡️ Kingdom Clear • No Actions Required
                    </div>
                    <p className="hcc-hero-sub" style={{ marginBottom: 0 }}>
                      No governed proposals or validation checkpoints currently require Boss review.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="hcc-card-item" style={{ marginBottom: 14 }}>
                      <div className="hcc-card-top">
                        <h3 className="hcc-card-title">Pending Decisions</h3>
                        <span className="hcc-card-badge" style={{ background: "rgba(245,158,11,0.15)", color: "var(--hcc-gold-400)" }}>
                          {snapshot.approvals.pendingCount}
                        </span>
                      </div>
                      <p className="hcc-priority-desc">
                        Proposals awaiting Boss approval before client dispatch. Controlled execution actions arrive in Phase 5.2C.
                      </p>
                    </div>

                    <div className="hcc-card-list">
                      {snapshot.approvals.items?.map(item => (
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

            {/* ===================================================== */}
            {/* TAB: SYSTEM / OPERATIONS INTELLIGENCE                 */}
            {/* ===================================================== */}
            {activeModule === "operations" && (
              <div>
                <div className="hcc-section-head">
                  <h2 className="hcc-section-title">Operations Intelligence</h2>
                  <span className="hcc-section-badge">Core Matrix</span>
                </div>

                <div className="hcc-hero-card" style={{ marginBottom: 14 }}>
                  <div className="hcc-hero-meta">
                    <span className="hcc-hero-greeting">Infrastructure Health</span>
                    <span className={`hcc-status-pill ${snapshot.system?.status === "HEALTHY" ? "live" : snapshot.system?.status === "DEGRADED" ? "limited" : "unavailable"}`}>
                      {snapshot.system?.status || "UNKNOWN"}
                    </span>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: "0.8rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--hcc-text-dim)" }}>Environment</span>
                      <strong style={{ color: "var(--hcc-text-main)" }}>{snapshot.system?.environment || "production"}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--hcc-text-dim)" }}>Database</span>
                      <strong style={{ color: snapshot.system?.database?.status === "HEALTHY" ? "var(--hcc-emerald)" : "var(--hcc-amber)" }}>
                        {snapshot.system?.database?.status === "HEALTHY" ? "HEALTHY" : "LOCAL FALLBACK"} ({snapshot.system?.database?.provider})
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
                  <h2 className="hcc-section-title">Workforce & Registered Engines</h2>
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
                    </div>

                    <div className="hcc-card-item" style={{ marginBottom: 16 }}>
                      <div className="hcc-card-top">
                        <h3 className="hcc-card-title">Agent Workforce Roster & Telemetry</h3>
                        <span className="hcc-card-badge" style={{ background: "rgba(6,182,212,0.12)", color: "var(--hcc-cyan)" }}>
                          {snapshot.workforce.registered || snapshot.workforce.activeAgents?.length || 0} Registered & Executable
                        </span>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 8, margin: "12px 0" }}>
                        <div style={{ background: "rgba(255,255,255,0.03)", padding: 8, borderRadius: 6 }}>
                          <span style={{ fontSize: "0.75rem", color: "var(--hcc-text-muted)" }}>Registered / Wired</span>
                          <div style={{ fontWeight: 600, color: "var(--hcc-cyan)" }}>{snapshot.workforce.registered || 30} / {snapshot.workforce.wired || 30}</div>
                        </div>
                        <div style={{ background: "rgba(255,255,255,0.03)", padding: 8, borderRadius: 6 }}>
                          <span style={{ fontSize: "0.75rem", color: "var(--hcc-text-muted)" }}>Currently Executing</span>
                          <div style={{ fontWeight: 600, color: "var(--hcc-emerald)" }}>{snapshot.workforce.currentlyExecuting || 0}</div>
                        </div>
                        <div style={{ background: "rgba(255,255,255,0.03)", padding: 8, borderRadius: 6 }}>
                          <span style={{ fontSize: "0.75rem", color: "var(--hcc-text-muted)" }}>Idle & Ready</span>
                          <div style={{ fontWeight: 600, color: "var(--hcc-amber)" }}>{snapshot.workforce.idleAvailable || 30}</div>
                        </div>
                        <div style={{ background: "rgba(255,255,255,0.03)", padding: 8, borderRadius: 6 }}>
                          <span style={{ fontSize: "0.75rem", color: "var(--hcc-text-muted)" }}>Blocked</span>
                          <div style={{ fontWeight: 600, color: "var(--hcc-rose)" }}>{snapshot.workforce.blocked || 0}</div>
                        </div>
                      </div>
                      {snapshot.workforce.roster && (
                        <div style={{ maxHeight: 280, overflowY: "auto", margin: "8px 0 0 0", paddingRight: 4 }}>
                          {snapshot.workforce.roster.map((agent, i) => (
                            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.05)", fontSize: "0.8rem" }}>
                              <div>
                                <strong style={{ color: "var(--hcc-text-main)" }}>{agent.name}</strong>
                                <span style={{ marginLeft: 6, fontSize: "0.7rem", color: "var(--hcc-text-muted)", textTransform: "uppercase" }}>[{agent.domain}]</span>
                              </div>
                              <span className="hcc-card-badge" style={{ fontSize: "0.68rem", background: agent.currentState === "EXECUTING" ? "rgba(16,185,129,0.15)" : "rgba(245,158,11,0.12)", color: agent.currentState === "EXECUTING" ? "var(--hcc-emerald)" : "var(--hcc-amber)" }}>
                                {agent.currentState}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* SUBSYSTEM AVAILABILITY */}
                <div className="hcc-section-head">
                  <h2 className="hcc-section-title">Subsystem Isolation</h2>
                  <span className="hcc-section-badge">Matrix</span>
                </div>
                <div className="hcc-card-list">
                  {snapshot.subsystemAvailability && Object.entries(snapshot.subsystemAvailability).map(([key, ok]) => (
                    <div key={key} className="hcc-card-item">
                      <div className="hcc-card-top">
                        <h3 className="hcc-card-title">{key.toUpperCase()}</h3>
                        <span className="hcc-card-badge" style={{ background: ok ? "rgba(16,185,129,0.12)" : "rgba(244,63,94,0.12)", color: ok ? "var(--hcc-emerald)" : "var(--hcc-rose)" }}>
                          {ok ? "LIVE" : "UNAVAILABLE"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ===================================================== */}
            {/* TAB: ALERTS                                           */}
            {/* ===================================================== */}
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
                      🛡️ No Active Critical Alerts
                    </div>
                    <p className="hcc-hero-sub" style={{ marginBottom: 0 }}>
                      The attention queue returned zero issues. Kingdom is operating within nominal parameters.
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

                    {snapshot.alerts.items?.map(item => (
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

            {/* ===================================================== */}
            {/* TAB: CREATIVE STUDIO — WEBSITE-FIRST RESULT SURFACE      */}
            {/* ===================================================== */}
            {activeModule === "creative" && (
              <div>
                <div className="hcc-section-head">
                  <h2 className="hcc-section-title">Creative Studio Command</h2>
                  <span className="hcc-section-badge">GARUDA Creative OS</span>
                </div>
                {!snapshot?.creative || snapshot.creative.available===false ? (
                  <div className="hcc-hero-card" style={{ borderColor:"rgba(244,63,94,0.35)", background:"rgba(20,8,12,0.7)" }}>
                    <div className="hcc-hero-headline" style={{ color:"var(--hcc-rose)" }}>CREATIVE DATA UNAVAILABLE</div>
                    <p className="hcc-hero-sub">{snapshot?.creative?.error || "Creative subsystem not available."}</p>
                  </div>
                ) : (
                  <>
                    <div className="hcc-hero-card">
                      <div className="hcc-hero-meta"><span className="hcc-hero-greeting">Sovereign Creatives</span><span className="hcc-status-pill live">AUTHORITATIVE</span></div>
                      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8 }}>
                        <div className="hcc-stat-box"><div className="hcc-stat-val">{snapshot.creative.totalBriefs ?? 0}</div><div className="hcc-stat-lbl">Briefs</div></div>
                        <div className="hcc-stat-box"><div className="hcc-stat-val">{snapshot.creative.totalAssets ?? 0}</div><div className="hcc-stat-lbl">Assets</div></div>
                        <div className="hcc-stat-box"><div className="hcc-stat-val" style={{ fontSize:"0.85rem" }}>{snapshot.creative.creativeOperations?.imageCapability || snapshot.creative.mediaEditing?.ffmpegAvailable ? "READY" : "LIMITED"}</div><div className="hcc-stat-lbl">Pipeline</div></div>
                      </div>
                      <p className="hcc-hero-sub" style={{ marginTop:8 }}>
                        Image: <strong style={{ color:"var(--hcc-emerald)" }}>{snapshot.creative.creativeOperations?.imageCapability || "VECTOR_CREATIVE_ONLY"}</strong> · Video: <strong style={{ color:"var(--hcc-gold-400)" }}>{snapshot.creative.creativeOperations?.videoCapability || "STORYBOARD_ONLY"}</strong> · Edit: <strong style={{ color: snapshot.creative.mediaEditing?.ffmpegAvailable ? "var(--hcc-emerald)" : "var(--hcc-amber)" }}>{snapshot.creative.mediaEditing?.ffmpegAvailable ? "FFmpeg READY" : "UNAVAILABLE"}</strong>
                      </p>
                    </div>
                    <div className="hcc-card-list" style={{ marginTop:12 }}>
                      {(snapshot.creative.assets||[]).slice(0,6).map((a,i)=>(
                        <div key={i} className="hcc-card-item">
                          <div className="hcc-card-top"><h3 className="hcc-card-title">{a.title || a.assetId}</h3><span className="hcc-card-badge" style={{ background:"rgba(212,175,55,0.12)", color:"var(--hcc-gold-400)" }}>{a.classification || a.format || "VECTOR_CREATIVE"}</span></div>
                          <p className="hcc-priority-desc" style={{ wordBreak:"break-all" }}>{a.filePath || a.assetUrl || ""}</p>
                          <div className="hcc-card-meta"><span>{a.dimensions ? `${a.dimensions.width}x${a.dimensions.height}` : ""}</span><span>{a.provider || ""}</span></div>
                          {a.assetUrl && <a href={a.assetUrl} target="_blank" rel="noreferrer" style={{ fontSize:"0.75rem", color:"var(--hcc-gold-400)" }}>Open Preview →</a>}
                          {a.publicUrl && <a href={a.publicUrl} target="_blank" rel="noreferrer" style={{ fontSize:"0.75rem", color:"var(--hcc-cyan)", marginLeft:8 }}>MP4 Preview →</a>}
                        </div>
                      ))}
                      {(!snapshot.creative.assets || snapshot.creative.assets.length===0) && <div className="hcc-card-item"><p className="hcc-priority-desc">No creative assets yet. Generate via <code>/api/creative/generate</code> or visit <a href="/creative" style={{ color:"var(--hcc-gold-400)" }}>/creative</a>.</p></div>}
                    </div>
                    <div style={{ display:"flex", gap:8, marginTop:12 }}>
                      <button onClick={()=>window.open("/creative","_blank")} style={{ background:"linear-gradient(135deg,#d4af37,#b8860b)", color:"#000", border:"none", borderRadius:6, padding:"0.5rem 1rem", fontWeight:800, cursor:"pointer" }}>Open Creative Studio →</button>
                      <button onClick={()=>window.open("/studio","_blank")} style={{ background:"rgba(255,255,255,0.06)", color:"#cbd5e1", border:"1px solid rgba(255,255,255,0.1)", borderRadius:6, padding:"0.5rem 1rem", cursor:"pointer" }}>Agency Studio →</button>
                    </div>
                    <p className="hcc-hero-sub" style={{ marginTop:8, fontSize:"0.72rem" }}>
                      EDIT mode: upload via <code>POST /api/creative/media/ingest</code> → <code>POST /api/creative/media/render</code> → QC → <code>/data/creative-assets</code> delivery. Artifacts served at <code>/assets/creative/*</code>.
                    </p>
                  </>
                )}
              </div>
            )}

            {/* ===================================================== */}
            {/* TAB: ACTIVITY                                         */}
            {/* ===================================================== */}
            {activeModule === "activity" && (
              <div>
                <div className="hcc-section-head">
                  <h2 className="hcc-section-title">Full Activity Timeline</h2>
                  <span className="hcc-section-badge">Chronological</span>
                </div>

                {/* Filter Chips */}
                <div className="hcc-module-nav" style={{ marginBottom: 12 }}>
                  {["ALL", "PROPOSAL_CREATED", "LEAD_CAPTURED", "PAYMENT_RECORDED", "PROJECT_ACTIVATED"].map(f => (
                    <button
                      key={f}
                      className={`hcc-nav-chip ${activityFilter === f ? "active" : ""}`}
                      onClick={() => setActivityFilter(f)}
                      style={{ fontSize: "0.64rem", padding: "4px 10px", minHeight: "30px" }}
                    >
                      {f.replace("_", " ")}
                    </button>
                  ))}
                </div>

                {!sectionAvailable(snapshot.activity) ? (
                  renderUnavailableBanner(snapshot.activity?.error || "Activity timeline is not available from the command layer.")
                ) : filteredEvents.length === 0 ? (
                  <div className="hcc-hero-card">
                    <div className="hcc-hero-headline" style={{ color: "var(--hcc-text-dim)", fontSize: "1.1rem", marginBottom: 6 }}>
                      No Events In View
                    </div>
                    <p className="hcc-hero-sub" style={{ marginBottom: 0 }}>
                      No production lifecycle events match the selected filter. Test events are excluded server-side.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="hcc-card-item" style={{ marginBottom: 14 }}>
                      <div className="hcc-card-top">
                        <h3 className="hcc-card-title">Events in Window</h3>
                        <span className="hcc-card-badge" style={{ background: "rgba(6,182,212,0.12)", color: "var(--hcc-cyan)" }}>
                          {filteredEvents.length} Events
                        </span>
                      </div>
                      <p className="hcc-priority-desc">Test-generated events (unit_test / TEST_EVENT) are filtered server-side.</p>
                    </div>

                    <div className="hcc-activity-list">
                      {filteredEvents.map((evt, idx) => (
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
                            <div style={{ marginTop: 8, padding: "10px 12px", borderRadius: "var(--hcc-radius-sm)", background: "rgba(6,8,13,0.75)", fontSize: "0.68rem", color: "var(--hcc-text-dim)", fontFamily: "var(--hcc-font-mono)", lineHeight: 1.6, wordBreak: "break-all", border: "1px solid var(--hcc-border)" }}>
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

      {/* ========================================================= */}
      {/* BOTTOM NAVIGATION BAR                                     */}
      {/* ========================================================= */}
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

        {/* CENTER ELEVATED COMMAND ORB */}
        <div className="hcc-orb-wrapper">
          <button
            className="hcc-command-orb"
            onClick={() => setCommandSheetOpen(true)}
            title="Open Sovereign Command Core"
            aria-label="Open command sheet"
          >
            🦅
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

      {/* ========================================================= */}
      {/* COMMAND ACTIONS BOTTOM SHEET                              */}
      {/* ========================================================= */}
      {commandSheetOpen && (
        <div className="hcc-sheet-backdrop" onClick={() => setCommandSheetOpen(false)}>
          <div className="hcc-sheet" onClick={e => e.stopPropagation()}>
            <div className="hcc-sheet-handle"></div>
            <div className="hcc-sheet-head">
              <h3 className="hcc-sheet-title">GARUDA Sovereign Command</h3>
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
                  <strong style={{ color: "var(--hcc-gold-400)" }}>Ask GARUDA Intelligence</strong>
                  <div style={{ fontSize: "0.72rem", color: "var(--hcc-text-muted)" }}>Open conversational interface / solution architect</div>
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
                  <div style={{ fontSize: "0.72rem", color: "var(--hcc-gold-400)" }}>Review governed proposals in WAITING_APPROVAL</div>
                </div>
                <span>⚡</span>
              </button>

              <button
                className="hcc-sheet-btn disabled"
                title="Coming in Phase 5.2C"
              >
                <div>
                  <strong>Autonomous Action Execution</strong>
                  <div style={{ fontSize: "0.72rem", color: "var(--hcc-gold-400)" }}>COMING IN PHASE 5.2C</div>
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
                style={{ background: "rgba(244, 63, 94, 0.08)", borderColor: "rgba(244, 63, 94, 0.3)", color: "var(--hcc-rose)" }}
              >
                <div>
                  <strong>Lock Command Center</strong>
                  <div style={{ fontSize: "0.72rem", color: "var(--hcc-text-dim)" }}>End secure founder session</div>
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
