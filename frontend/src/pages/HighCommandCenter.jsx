import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import SEOHead from "../components/SEOHead";
import "../styles/high-command.css";

export default function HighCommandCenter({ onLogout }) {
  const navigate = useNavigate();
  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetched, setLastFetched] = useState(null);
  const [activeTab, setActiveTab] = useState("home");
  const [commandSheetOpen, setCommandSheetOpen] = useState(false);
  const [systemModalOpen, setSystemModalOpen] = useState(false);

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
    const diffSec = Math.floor((new Date() - date) / 1000);
    if (diffSec < 10) return "Just now";
    if (diffSec < 60) return `${diffSec}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    return `${Math.floor(diffMin / 60)}h ago`;
  };

  // Currency Formatter
  const formatINR = (val) => {
    if (typeof val !== "number" || isNaN(val)) return "₹0";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(val);
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

  return (
    <div className="hcc-container">
      <SEOHead
        title="GARUDA High Command Center | Private Sovereign Intelligence"
        description="Private mobile-first command center for Boss to observe and govern the GARUDA Kingdom."
        canonical="https://www.garudaos.in/founder"
        robots="noindex, nofollow"
      />

      <div className="hcc-wrapper">
        {/* TOP HEADER */}
        <header className="hcc-header">
          <div className="hcc-brand">
            <div className="hcc-crest">🦅</div>
            <div className="hcc-title-area">
              <span className="hcc-title">HIGH COMMAND</span>
              <span className="hcc-subtitle">GARUDA Sovereign Shell</span>
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

        {/* ACTIVE TAB CONTENT */}
        {!loading && !error && snapshot && (
          <>
            {/* ========================================================= */}
            {/* TAB 1: HOME VIEW                                          */}
            {/* ========================================================= */}
            {activeTab === "home" && (
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
                    Sovereign intelligence synchronized across {snapshot.workforce?.activeAgents?.length || 4} active runtime engines.
                  </p>

                  <div className="hcc-hero-stats">
                    <div className="hcc-stat-box">
                      <div className="hcc-stat-val">
                        {snapshot.revenue?.available !== false ? formatINR(snapshot.revenue?.verifiedWonINR?.amount) : "Unavailable"}
                      </div>
                      <div className="hcc-stat-lbl">Verified Won</div>
                    </div>

                    <div className="hcc-stat-box">
                      <div className="hcc-stat-val">
                        {snapshot.commercial?.available !== false ? snapshot.commercial?.activeProjects : "N/A"}
                      </div>
                      <div className="hcc-stat-lbl">Active Projects</div>
                    </div>

                    <div className="hcc-stat-box">
                      <div className="hcc-stat-val">
                        {snapshot.approvals?.available !== false ? snapshot.approvals?.pendingCount : "0"}
                      </div>
                      <div className="hcc-stat-lbl">Boss Actions</div>
                    </div>
                  </div>
                </div>

                {/* BOSS PRIORITY CARD */}
                {snapshot.approvals?.pendingCount > 0 || snapshot.alerts?.critical > 0 ? (
                  <div className="hcc-priority-card attention" onClick={() => setActiveTab("brain")}>
                    <div className="hcc-priority-info">
                      <div className="hcc-priority-icon">⚡</div>
                      <div>
                        <h3 className="hcc-priority-title">
                          {snapshot.approvals?.pendingCount || snapshot.alerts?.critical} Action(s) Require Boss
                        </h3>
                        <p className="hcc-priority-desc">
                          {snapshot.approvals?.items?.[0]?.message || snapshot.alerts?.items?.[0]?.message || "Tap to inspect attention queue"}
                        </p>
                      </div>
                    </div>
                    <span style={{ color: "var(--hcc-gold-400)", fontSize: "1.1rem" }}>➔</span>
                  </div>
                ) : (
                  <div className="hcc-priority-card steady">
                    <div className="hcc-priority-info">
                      <div className="hcc-priority-icon">🛡️</div>
                      <div>
                        <h3 className="hcc-priority-title">Kingdom Steady</h3>
                        <p className="hcc-priority-desc">No urgent approval blockers detected.</p>
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
                  <div className="hcc-intel-card" onClick={() => setActiveTab("brain")}>
                    <div className="hcc-intel-head">
                      <span className="hcc-intel-icon">🧠</span>
                      <span className="hcc-intel-pill green">
                        {snapshot.brain?.available !== false ? snapshot.brain?.status : "LIMITED"}
                      </span>
                    </div>
                    <div className="hcc-intel-body">
                      <div className="hcc-intel-val">
                        {snapshot.brain?.available !== false ? snapshot.brain?.activeMissions : "—"}
                      </div>
                      <div className="hcc-intel-lbl">Active Missions</div>
                    </div>
                  </div>

                  {/* Commercial Card */}
                  <div className="hcc-intel-card" onClick={() => setActiveTab("money")}>
                    <div className="hcc-intel-head">
                      <span className="hcc-intel-icon">₹</span>
                      <span className="hcc-intel-pill gold">
                        {snapshot.commercial?.available !== false ? `${snapshot.commercial?.totalProposals} Props` : "LIMITED"}
                      </span>
                    </div>
                    <div className="hcc-intel-body">
                      <div className="hcc-intel-val">
                        {snapshot.revenue?.available !== false ? formatINR(snapshot.revenue?.pipelineValueINR?.amount) : "—"}
                      </div>
                      <div className="hcc-intel-lbl">Pipeline Value</div>
                    </div>
                  </div>

                  {/* Approvals Card */}
                  <div className="hcc-intel-card" onClick={() => setActiveTab("brain")}>
                    <div className="hcc-intel-head">
                      <span className="hcc-intel-icon">⚡</span>
                      <span className="hcc-intel-pill gray">
                        {snapshot.approvals?.available !== false ? `${snapshot.approvals?.pendingCount} Pending` : "N/A"}
                      </span>
                    </div>
                    <div className="hcc-intel-body">
                      <div className="hcc-intel-val">
                        {snapshot.approvals?.available !== false ? snapshot.approvals?.pendingCount : "—"}
                      </div>
                      <div className="hcc-intel-lbl">Approvals</div>
                    </div>
                  </div>

                  {/* Operations Card */}
                  <div className="hcc-intel-card" onClick={() => setSystemModalOpen(true)}>
                    <div className="hcc-intel-head">
                      <span className="hcc-intel-icon">◉</span>
                      <span className="hcc-intel-pill green">
                        {snapshot.system?.database?.status === "HEALTHY" ? "POSTGRES" : "FALLBACK"}
                      </span>
                    </div>
                    <div className="hcc-intel-body">
                      <div className="hcc-intel-val">
                        {snapshot.workforce?.activeAgents?.length || 4}
                      </div>
                      <div className="hcc-intel-lbl">Active Engines</div>
                    </div>
                  </div>
                </div>

                {/* LIVE ACTIVITY STRIP */}
                <div className="hcc-section-head">
                  <h2 className="hcc-section-title">Live Activity Timeline</h2>
                  <span className="hcc-section-badge">SHA-256 Sealed</span>
                </div>

                <div className="hcc-activity-list">
                  {snapshot.activity?.recentEvents && snapshot.activity.recentEvents.length > 0 ? (
                    snapshot.activity.recentEvents.slice(0, 5).map((evt, idx) => (
                      <div key={evt.eventId || idx} className="hcc-activity-item">
                        <div className="hcc-activity-dot"></div>
                        <div className="hcc-activity-content">
                          <div className="hcc-activity-top">
                            <span className="hcc-activity-type">{evt.eventType}</span>
                            <span className="hcc-activity-time">{getRelativeTime(new Date(evt.occurredAt))}</span>
                          </div>
                          <p className="hcc-activity-msg">{evt.summary}</p>
                          <div className="hcc-activity-seal">
                            <span>🛡️ {evt.immutabilitySeal}</span>
                            <span>• {evt.actor}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="hcc-activity-item" style={{ justifyContent: "center", color: "var(--hcc-text-dim)", padding: "16px" }}>
                      No recent lifecycle events recorded.
                    </div>
                  )}
                </div>
              </>
            )}

            {/* ========================================================= */}
            {/* TAB 2: BRAIN & EXECUTION VIEW                             */}
            {/* ========================================================= */}
            {activeTab === "brain" && (
              <div>
                <div className="hcc-section-head">
                  <h2 className="hcc-section-title">Mother Brain Governed Execution</h2>
                  <span className="hcc-section-badge">{snapshot.brain?.mode || "Runtime"}</span>
                </div>

                <div className="hcc-hero-card" style={{ marginBottom: 14 }}>
                  <div className="hcc-hero-meta">
                    <span className="hcc-hero-greeting">Active Projects ({snapshot.commercial?.activeProjects || 0})</span>
                    <span className="hcc-status-pill live">RUNNING</span>
                  </div>

                  {snapshot.brain?.recentExecution && snapshot.brain.recentExecution.length > 0 ? (
                    snapshot.brain.recentExecution.map(proj => (
                      <div key={proj.projectId} style={{ padding: "10px 0", borderBottom: "1px solid var(--hcc-border)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <strong style={{ color: "var(--hcc-gold-400)", fontSize: "0.88rem" }}>{proj.title}</strong>
                          <span style={{ fontSize: "0.7rem", fontFamily: "var(--hcc-font-mono)", color: "var(--hcc-emerald)" }}>{proj.status}</span>
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "var(--hcc-text-muted)", marginTop: 4 }}>
                          Phase: {proj.currentPhase}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p style={{ color: "var(--hcc-text-dim)", fontSize: "0.8rem", margin: "10px 0 0 0" }}>
                      All delivery projects currently at steady state.
                    </p>
                  )}
                </div>

                <div className="hcc-hero-card">
                  <h3 style={{ margin: "0 0 8px 0", fontSize: "0.95rem", color: "var(--hcc-gold-400)" }}>
                    Workforce Autonomous Engines
                  </h3>
                  <ul style={{ margin: 0, paddingLeft: 18, color: "var(--hcc-text-muted)", fontSize: "0.8rem", lineHeight: 1.6 }}>
                    {snapshot.workforce?.activeAgents?.map((agent, i) => (
                      <li key={i}><strong style={{ color: "var(--hcc-text-main)" }}>{agent}</strong>: Active</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* TAB 3: MONEY & COMMERCIAL VIEW                            */}
            {/* ========================================================= */}
            {activeTab === "money" && (
              <div>
                <div className="hcc-section-head">
                  <h2 className="hcc-section-title">Commercial & Revenue Truth</h2>
                  <span className="hcc-section-badge">Authoritative</span>
                </div>

                <div className="hcc-hero-card" style={{ marginBottom: 14 }}>
                  <div className="hcc-hero-meta">
                    <span className="hcc-hero-greeting">Verified Won Revenue</span>
                    <span className="hcc-status-pill live">AUTHORITATIVE</span>
                  </div>
                  <div style={{ fontSize: "1.8rem", fontWeight: 800, fontFamily: "var(--hcc-font-mono)", color: "var(--hcc-gold-400)" }}>
                    {formatINR(snapshot.revenue?.verifiedWonINR?.amount)}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--hcc-text-dim)", marginTop: 4 }}>
                    {snapshot.revenue?.verifiedWonINR?.transactionsCount || 0} verified transactions recorded in payment ledger.
                  </div>
                </div>

                <div className="hcc-hero-card" style={{ marginBottom: 14 }}>
                  <div className="hcc-hero-meta">
                    <span className="hcc-hero-greeting">Pipeline Valuation</span>
                    <span className="hcc-status-pill limited">DERIVED</span>
                  </div>
                  <div style={{ fontSize: "1.4rem", fontWeight: 800, fontFamily: "var(--hcc-font-mono)", color: "var(--hcc-text-main)" }}>
                    {formatINR(snapshot.revenue?.pipelineValueINR?.amount)}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--hcc-text-dim)", marginTop: 4 }}>
                    {snapshot.revenue?.pipelineValueINR?.proposalsCount || 0} proposals awaiting deposit binding.
                  </div>
                </div>

                {snapshot.revenue?.recentTransactions && snapshot.revenue.recentTransactions.length > 0 && (
                  <div className="hcc-hero-card">
                    <h3 style={{ margin: "0 0 10px 0", fontSize: "0.9rem", color: "var(--hcc-gold-400)" }}>Recent Paid Deposits</h3>
                    {snapshot.revenue.recentTransactions.map((tx, idx) => (
                      <div key={idx} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid var(--hcc-border)" }}>
                        <span style={{ fontSize: "0.78rem", color: "var(--hcc-text-main)" }}>{tx.clientName}</span>
                        <strong style={{ fontSize: "0.78rem", color: "var(--hcc-emerald)", fontFamily: "var(--hcc-font-mono)" }}>
                          {formatINR(tx.amountPaidINR)}
                        </strong>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ========================================================= */}
            {/* TAB 4: MORE / SYSTEM HEALTH VIEW                          */}
            {/* ========================================================= */}
            {activeTab === "more" && (
              <div>
                <div className="hcc-section-head">
                  <h2 className="hcc-section-title">GARUDA Infrastructure Health</h2>
                  <span className="hcc-section-badge">System Truth</span>
                </div>

                <div className="hcc-hero-card" style={{ marginBottom: 14 }}>
                  <h3 style={{ margin: "0 0 12px 0", fontSize: "0.95rem", color: "var(--hcc-gold-400)" }}>Database & Persistence</h3>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: "0.8rem" }}>
                    <span style={{ color: "var(--hcc-text-dim)" }}>Provider:</span>
                    <strong style={{ color: "var(--hcc-text-main)" }}>{snapshot.system?.database?.provider}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: "0.8rem" }}>
                    <span style={{ color: "var(--hcc-text-dim)" }}>Status:</span>
                    <strong style={{ color: "var(--hcc-emerald)" }}>{snapshot.system?.database?.status}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: "0.8rem" }}>
                    <span style={{ color: "var(--hcc-text-dim)" }}>Data Integrity:</span>
                    <strong style={{ color: "var(--hcc-gold-400)" }}>{snapshot.system?.database?.dataIntegrity}</strong>
                  </div>
                </div>

                <div className="hcc-hero-card" style={{ marginBottom: 14 }}>
                  <h3 style={{ margin: "0 0 12px 0", fontSize: "0.95rem", color: "var(--hcc-gold-400)" }}>Event Nervous System</h3>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: "0.8rem" }}>
                    <span style={{ color: "var(--hcc-text-dim)" }}>Buffered Events:</span>
                    <strong style={{ color: "var(--hcc-text-main)" }}>{snapshot.system?.eventNervousSystem?.bufferedEvents}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: "0.8rem" }}>
                    <span style={{ color: "var(--hcc-text-dim)" }}>Immutability Seal:</span>
                    <strong style={{ color: "var(--hcc-emerald)" }}>{snapshot.system?.eventNervousSystem?.immutabilitySeal}</strong>
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (typeof onLogout === "function") onLogout();
                    else navigate("/founder");
                  }}
                  style={{
                    width: "100%",
                    padding: "12px",
                    background: "rgba(244, 63, 94, 0.12)",
                    border: "1px solid rgba(244, 63, 94, 0.3)",
                    color: "var(--hcc-rose)",
                    fontWeight: 700,
                    borderRadius: "var(--hcc-radius-md)",
                    cursor: "pointer",
                    fontFamily: "var(--hcc-font-sans)"
                  }}
                >
                  Lock Command Center
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* BOTTOM NAVIGATION BAR */}
      <nav className="hcc-bottom-nav">
        <button
          className={`hcc-nav-item ${activeTab === "home" ? "active" : ""}`}
          onClick={() => setActiveTab("home")}
        >
          <span className="hcc-nav-icon">⌂</span>
          <span className="hcc-nav-lbl">HOME</span>
        </button>

        <button
          className={`hcc-nav-item ${activeTab === "brain" ? "active" : ""}`}
          onClick={() => setActiveTab("brain")}
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
          >
            ⚡
          </button>
        </div>

        <button
          className={`hcc-nav-item ${activeTab === "money" ? "active" : ""}`}
          onClick={() => setActiveTab("money")}
        >
          <span className="hcc-nav-icon">₹</span>
          <span className="hcc-nav-lbl">MONEY</span>
        </button>

        <button
          className={`hcc-nav-item ${activeTab === "more" ? "active" : ""}`}
          onClick={() => setActiveTab("more")}
        >
          <span className="hcc-nav-icon">⚙</span>
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
                className="hcc-sheet-btn disabled"
                title="Coming in Phase 5.3"
              >
                <div>
                  <strong>Autonomous Revenue Dispatch</strong>
                  <div style={{ fontSize: "0.72rem", color: "var(--hcc-gold-400)" }}>COMING IN PHASE 5.3</div>
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
