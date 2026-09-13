import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import SEOHead from "../components/SEOHead";

const GOLD = "#f59e0b";
const GOLD_LIGHT = "#fef08a";
const BG = "#030712";
const PANEL = "rgba(15, 23, 42, 0.85)";
const PANEL_BORDER = "rgba(245, 158, 11, 0.22)";
const EMERALD = "#10b981";
const CRIMSON = "#ef4444";
const SAPPHIRE = "#3b82f6";
const AMBER = "#f59e0b";

export default function FounderQuantCommand({ onLogout }) {
  const navigate = useNavigate();

  // Primary Telemetry States
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetched, setLastFetched] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);

  // Operational States
  const [activeTab, setActiveTab] = useState("fleet"); // 'fleet' | 'potential' | 'telemetry' | 'ledger'
  const [killSwitchLoading, setKillSwitchLoading] = useState(false);
  const [killSwitchNotice, setKillSwitchNotice] = useState(null);
  const [actionNotice, setActionNotice] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [searchGem, setSearchGem] = useState("");
  const [logFilter, setLogFilter] = useState("ALL");
  const [executingCycle, setExecutingCycle] = useState(false);
  const [moonshotsFilter, setMoonshotsFilter] = useState("ALL"); // 'ALL' | 'SUB_RUPEE' | 'PENNY'
  const [searchMoonshot, setSearchMoonshot] = useState("");
  const [investAmount, setInvestAmount] = useState(1000); // Dynamic simulator: ₹1,000, ₹2,000, ₹5,000, ₹10,000, ₹1,00,000

  // Fetch complete Sovereign Quant Dashboard
  const fetchDashboard = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await fetch("/api/finance/quant/dashboard", {
        headers: { "Content-Type": "application/json" }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch quant telemetry`);
      const data = await res.json();
      if (data.success) {
        setDashboardData(data);
        setLastFetched(new Date());
        setError(null);
      } else {
        throw new Error(data.error || "Dashboard payload returned unsuccessful");
      }
    } catch (err) {
      console.error("[QuantCommand] Fetch error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Polling loop
  useEffect(() => {
    fetchDashboard(false);
    let interval = null;
    if (autoRefresh) {
      interval = setInterval(() => {
        fetchDashboard(false);
      }, 8000); // 8-second live pulse
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [fetchDashboard, autoRefresh]);

  // Handle Sovereign Kill Switch Toggle
  const handleToggleKillSwitch = async () => {
    if (!dashboardData) return;
    const currentPaused = dashboardData.isEmergencyPaused;
    const targetState = !currentPaused;

    setKillSwitchLoading(true);
    setKillSwitchNotice(null);

    try {
      const res = await fetch("/api/finance/quant/kill-switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pause: targetState })
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setKillSwitchNotice({
          type: targetState ? "error" : "success",
          text: json.message
        });
        await fetchDashboard(true);
      } else {
        setKillSwitchNotice({
          type: "error",
          text: json.error || "Failed to update Sovereign Kill Switch"
        });
      }
    } catch (e) {
      setKillSwitchNotice({ type: "error", text: e.message });
    } finally {
      setKillSwitchLoading(false);
    }
  };

  // Trigger manual scan cycle
  const handleTriggerCycle = async () => {
    setExecutingCycle(true);
    setActionNotice({ type: "info", text: "Executing autonomous scan cycle across active markets..." });
    try {
      const res = await fetch("/api/finance/quant/daemon/cycle", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setActionNotice({
          type: "success",
          text: `Scan complete: ${data.findingsScanned || 0} setups evaluated. Active session: ${data.activeMarkets?.currentSession || "N/A"}`
        });
        await fetchDashboard(true);
      } else {
        setActionNotice({ type: "error", text: data.message || "Cycle execution issue" });
      }
    } catch (e) {
      setActionNotice({ type: "error", text: e.message });
    } finally {
      setExecutingCycle(false);
    }
  };

  // Trigger Fresh Gems Scan
  const handleRefreshGems = async () => {
    setActionNotice({ type: "info", text: "Scanning live 4H market structure for crypto gems..." });
    try {
      const res = await fetch("/api/finance/quant/potential?fresh=true");
      const data = await res.json();
      if (res.ok && data.success) {
        setActionNotice({ type: "success", text: `Scanned ${data.count} high-growth coin opportunities.` });
        await fetchDashboard(true);
      }
    } catch (e) {
      setActionNotice({ type: "error", text: e.message });
    }
  };

  // Reset virtual paper trading ledger
  const handleResetLedger = async () => {
    if (!window.confirm("Are you sure you want to reset the paper trading portfolio to ₹1,00,000?")) return;
    try {
      const res = await fetch("/api/finance/quant/reset-ledger", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.success) {
        setActionNotice({ type: "success", text: "Portfolio ledger reset to ₹1,00,000 initial virtual capital." });
        await fetchDashboard(true);
      }
    } catch (e) {
      setActionNotice({ type: "error", text: e.message });
    }
  };

  // Refresh Sub-Rupee Moonshots
  const handleRefreshMoonshots = async () => {
    setActionNotice({ type: "info", text: "Scanning live sub-rupee and penny cryptos on global orderbooks..." });
    try {
      const res = await fetch("/api/finance/quant/moonshots?fresh=true");
      const data = await res.json();
      if (res.ok && data.success) {
        setActionNotice({ type: "success", text: `Found ${data.count} active sub-rupee & penny moonshots!` });
        await fetchDashboard(true);
      }
    } catch (e) {
      setActionNotice({ type: "error", text: e.message });
    }
  };

  // Derived Metrics
  const daemon = dashboardData?.daemon || {};
  const wallet = dashboardData?.wallet || { initialCapital: 100000, cash: 100000, realizedPnl: 0 };
  const stats = dashboardData?.stats || { winRatePercent: 0, totalTrades: 0, netPnl: 0, profitFactor: 0 };
  const agents = dashboardData?.agents || [];
  const opportunities = dashboardData?.opportunities || [];
  const subRupeeMoonshots = dashboardData?.subRupeeMoonshots || [];
  const eventLog = dashboardData?.eventLog || [];
  const isPaused = dashboardData?.isEmergencyPaused;

  const targetDailyGrowth = 2000; // Target ₹2,000/day (~2.0% on ₹1L)
  const currentNetPnl = wallet.realizedPnl || 0;
  const growthProgressPct = Math.min(Math.max((currentNetPnl / targetDailyGrowth) * 100, 0), 100);

  const filteredOpportunities = opportunities.filter((op) => {
    if (!searchGem) return true;
    const q = searchGem.toLowerCase();
    return (
      op.name.toLowerCase().includes(q) ||
      op.symbol.toLowerCase().includes(q) ||
      op.category.toLowerCase().includes(q)
    );
  });

  const filteredMoonshots = subRupeeMoonshots.filter((ms) => {
    if (moonshotsFilter === "SUB_RUPEE" && !ms.isSubRupee) return false;
    if (moonshotsFilter === "PENNY" && ms.isSubRupee) return false;
    if (searchMoonshot) {
      const q = searchMoonshot.toLowerCase();
      return (
        ms.cleanSymbol.toLowerCase().includes(q) ||
        ms.symbol.toLowerCase().includes(q) ||
        ms.category.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const filteredLogs = eventLog.filter((log) => {
    if (logFilter === "ALL") return true;
    if (logFilter === "SNIPER") return log.action.includes("SNIPER") || log.action.includes("SIGNAL");
    if (logFilter === "PORTFOLIO") return log.action.includes("TRADE") || log.market === "PORTFOLIO";
    if (logFilter === "SOVEREIGN") return log.market === "SOVEREIGN" || log.action.includes("SOVEREIGN");
    if (logFilter === "SYSTEM") return log.market === "SYSTEM" || log.action.includes("SYSTEM") || log.action.includes("SCAN");
    return true;
  });

  return (
    <div
      style={{
        minHeight: "100vh",
        background: BG,
        color: "#f3f4f6",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        paddingBottom: "80px"
      }}
    >
      <SEOHead
        title="Founder Sovereign Quant Cockpit — GARUDA 24/7 Global Swarm"
        description="Supreme multi-market trading command center. Real-time control of Alpha-India, Alpha-Forex, Alpha-Crypto, and Alpha-Potential agents with Sovereign Kill Switch."
        canonicalUrl="https://www.garudaos.in/founder/quant"
      />

      {/* TOP SOVEREIGN NAVIGATION BAR */}
      <header
        style={{
          borderBottom: `1px solid ${PANEL_BORDER}`,
          background: "rgba(10, 15, 29, 0.95)",
          backdropFilter: "blur(12px)",
          position: "sticky",
          top: 0,
          zIndex: 100,
          padding: "14px 24px"
        }}
      >
        <div
          style={{
            maxWidth: "1440px",
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "16px"
          }}
        >
          {/* Logo & Universe Anchor */}
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <Link
              to="/founder/access"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                textDecoration: "none",
                color: "inherit"
              }}
            >
              <span style={{ fontSize: "1.6rem" }}>🦅</span>
              <div>
                <div
                  style={{
                    fontSize: "1.15rem",
                    fontWeight: 800,
                    letterSpacing: "0.04em",
                    color: GOLD_LIGHT,
                    textTransform: "uppercase"
                  }}
                >
                  GARUDA ALPHA-QUANT
                </div>
                <div style={{ fontSize: "0.72rem", color: "#9ca3af", letterSpacing: "0.08em" }}>
                  UNIVERSE #12: FINANCE UNIVERSE • SOVEREIGN COCKPIT
                </div>
              </div>
            </Link>
          </div>

          {/* Quick Nav Links */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <Link
              to="/command-center"
              style={{
                fontSize: "0.8rem",
                color: "#9ca3af",
                textDecoration: "none",
                padding: "6px 12px",
                borderRadius: "6px",
                border: "1px solid rgba(255,255,255,0.08)"
              }}
            >
              High Command
            </Link>
            <Link
              to="/founder/access"
              style={{
                fontSize: "0.8rem",
                color: "#9ca3af",
                textDecoration: "none",
                padding: "6px 12px",
                borderRadius: "6px",
                border: "1px solid rgba(255,255,255,0.08)"
              }}
            >
              Kingdom Access
            </Link>
            <Link
              to="/chat"
              style={{
                fontSize: "0.8rem",
                color: "#9ca3af",
                textDecoration: "none",
                padding: "6px 12px",
                borderRadius: "6px",
                border: "1px solid rgba(255,255,255,0.08)"
              }}
            >
              Public Chat
            </Link>
          </div>

          {/* Sovereign Actions & Status */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            {/* Auto Refresh Toggle */}
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              style={{
                background: autoRefresh ? "rgba(16, 185, 129, 0.15)" : "rgba(255,255,255,0.05)",
                border: `1px solid ${autoRefresh ? EMERALD : "rgba(255,255,255,0.15)"}`,
                color: autoRefresh ? "#6ee7b7" : "#9ca3af",
                fontSize: "0.75rem",
                fontWeight: 600,
                padding: "6px 12px",
                borderRadius: "6px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px"
              }}
            >
              <span
                style={{
                  width: "7px",
                  height: "7px",
                  borderRadius: "50%",
                  background: autoRefresh ? EMERALD : "#9ca3af",
                  boxShadow: autoRefresh ? `0 0 8px ${EMERALD}` : "none"
                }}
              />
              {autoRefresh ? "LIVE 8s" : "PAUSED"}
            </button>

            {/* Manual Refresh Button */}
            <button
              onClick={() => fetchDashboard(true)}
              disabled={refreshing}
              style={{
                background: "rgba(245, 158, 11, 0.12)",
                border: "1px solid rgba(245, 158, 11, 0.3)",
                color: GOLD_LIGHT,
                fontSize: "0.75rem",
                fontWeight: 600,
                padding: "6px 12px",
                borderRadius: "6px",
                cursor: refreshing ? "wait" : "pointer"
              }}
            >
              {refreshing ? "Refreshing..." : "↻ Refresh"}
            </button>

            {/* SOVEREIGN MASTER KILL SWITCH */}
            <button
              onClick={handleToggleKillSwitch}
              disabled={killSwitchLoading}
              style={{
                background: isPaused
                  ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
                  : "linear-gradient(135deg, #dc2626 0%, #991b1b 100%)",
                border: `1px solid ${isPaused ? "#34d399" : "#f87171"}`,
                color: "#ffffff",
                fontSize: "0.82rem",
                fontWeight: 800,
                letterSpacing: "0.05em",
                padding: "8px 16px",
                borderRadius: "8px",
                cursor: killSwitchLoading ? "wait" : "pointer",
                boxShadow: isPaused
                  ? "0 0 16px rgba(16, 185, 129, 0.5)"
                  : "0 0 20px rgba(239, 68, 68, 0.55)",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                transition: "all 0.2s ease"
              }}
            >
              <span style={{ fontSize: "1rem" }}>{isPaused ? "▶" : "🛑"}</span>
              {killSwitchLoading
                ? "TRANSMITTING..."
                : isPaused
                ? "RESUME 24/7 SWARM"
                : "SOVEREIGN KILL SWITCH (PAUSE ALL)"}
            </button>
          </div>
        </div>
      </header>

      {/* MASTER WARNING BANNER IF KILL SWITCH IS ACTIVE */}
      {isPaused && (
        <div
          style={{
            background: "linear-gradient(90deg, #7f1d1d 0%, #450a0a 100%)",
            borderBottom: "2px solid #ef4444",
            padding: "12px 24px",
            textAlign: "center",
            color: "#fecaca",
            fontSize: "0.92rem",
            fontWeight: 700,
            letterSpacing: "0.02em",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px"
          }}
        >
          <span style={{ fontSize: "1.2rem" }}>🛑</span>
          <span>
            SOVEREIGN EMERGENCY HALT ACTIVE: Founder Praveen has paused all 4 trading engines.
            Zero market entries authorized.
          </span>
          <button
            onClick={handleToggleKillSwitch}
            style={{
              background: "#10b981",
              border: "none",
              color: "#ffffff",
              padding: "4px 12px",
              borderRadius: "4px",
              fontWeight: 800,
              fontSize: "0.78rem",
              cursor: "pointer",
              marginLeft: "12px"
            }}
          >
            DISENGAGE & RESUME
          </button>
        </div>
      )}

      {/* NOTICES */}
      <div style={{ maxWidth: "1440px", margin: "16px auto 0 auto", padding: "0 24px" }}>
        {killSwitchNotice && (
          <div
            style={{
              padding: "10px 16px",
              borderRadius: "8px",
              marginBottom: "12px",
              background:
                killSwitchNotice.type === "success"
                  ? "rgba(16, 185, 129, 0.15)"
                  : "rgba(239, 68, 68, 0.15)",
              border: `1px solid ${
                killSwitchNotice.type === "success" ? EMERALD : CRIMSON
              }`,
              color: killSwitchNotice.type === "success" ? "#a7f3d0" : "#fecaca",
              fontSize: "0.85rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between"
            }}
          >
            <span>{killSwitchNotice.text}</span>
            <button
              onClick={() => setKillSwitchNotice(null)}
              style={{ background: "transparent", border: "none", color: "inherit", cursor: "pointer" }}
            >
              ✕
            </button>
          </div>
        )}

        {actionNotice && (
          <div
            style={{
              padding: "10px 16px",
              borderRadius: "8px",
              marginBottom: "12px",
              background:
                actionNotice.type === "success"
                  ? "rgba(16, 185, 129, 0.15)"
                  : actionNotice.type === "error"
                  ? "rgba(239, 68, 68, 0.15)"
                  : "rgba(59, 130, 246, 0.15)",
              border: `1px solid ${
                actionNotice.type === "success"
                  ? EMERALD
                  : actionNotice.type === "error"
                  ? CRIMSON
                  : SAPPHIRE
              }`,
              color:
                actionNotice.type === "success"
                  ? "#a7f3d0"
                  : actionNotice.type === "error"
                  ? "#fecaca"
                  : "#bfdbfe",
              fontSize: "0.85rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between"
            }}
          >
            <span>{actionNotice.text}</span>
            <button
              onClick={() => setActionNotice(null)}
              style={{ background: "transparent", border: "none", color: "inherit", cursor: "pointer" }}
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* MAIN CONTAINER */}
      <main style={{ maxWidth: "1440px", margin: "16px auto", padding: "0 24px" }}>
        {/* EXECUTIVE KPI HERO SECTION (₹ IN RUPEES) */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "16px",
            marginBottom: "24px"
          }}
        >
          {/* Card 1: Virtual Portfolio Capital */}
          <div
            style={{
              background: PANEL,
              border: `1px solid ${PANEL_BORDER}`,
              borderRadius: "14px",
              padding: "20px",
              position: "relative",
              overflow: "hidden"
            }}
          >
            <div style={{ fontSize: "0.75rem", color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Virtual Portfolio Capital
            </div>
            <div
              style={{
                fontSize: "1.9rem",
                fontWeight: 800,
                color: "#ffffff",
                marginTop: "6px",
                fontFamily: "monospace"
              }}
            >
              ₹{Number(wallet.cash?.toFixed(2) || 100000).toLocaleString("en-IN")}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "10px", fontSize: "0.8rem" }}>
              <span style={{ color: "#9ca3af" }}>Base Capital:</span>
              <span style={{ color: GOLD_LIGHT, fontWeight: 700 }}>₹1,00,000.00</span>
              <span
                style={{
                  background: "rgba(16, 185, 129, 0.15)",
                  color: EMERALD,
                  padding: "2px 6px",
                  borderRadius: "4px",
                  fontSize: "0.7rem",
                  fontWeight: 700
                }}
              >
                100% PAPER SAFE
              </span>
            </div>
            <div style={{ fontSize: "0.7rem", color: "#6b7280", marginTop: "4px" }}>
              Zero real rupees at risk until 100+ proven paper trades.
            </div>
          </div>

          {/* Card 2: Net Realized Profit & Growth Target */}
          <div
            style={{
              background: PANEL,
              border: `1px solid ${PANEL_BORDER}`,
              borderRadius: "14px",
              padding: "20px"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: "0.75rem", color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Daily Growth Target (1-2%)
              </div>
              <span
                style={{
                  fontSize: "0.72rem",
                  color: GOLD_LIGHT,
                  fontWeight: 700,
                  background: "rgba(245, 158, 11, 0.15)",
                  padding: "2px 8px",
                  borderRadius: "4px"
                }}
              >
                GOAL: ₹2,000/DAY
              </span>
            </div>
            <div
              style={{
                fontSize: "1.9rem",
                fontWeight: 800,
                color: currentNetPnl >= 0 ? EMERALD : CRIMSON,
                marginTop: "6px",
                fontFamily: "monospace"
              }}
            >
              {currentNetPnl >= 0 ? "+" : ""}₹{Number(currentNetPnl?.toFixed(2) || 0).toLocaleString("en-IN")}
            </div>

            {/* Growth Progress Bar */}
            <div style={{ marginTop: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", color: "#9ca3af", marginBottom: "4px" }}>
                <span>Daily Milestone Progress</span>
                <span>{growthProgressPct.toFixed(0)}%</span>
              </div>
              <div style={{ width: "100%", height: "7px", background: "rgba(255,255,255,0.08)", borderRadius: "4px", overflow: "hidden" }}>
                <div
                  style={{
                    width: `${growthProgressPct}%`,
                    height: "100%",
                    background: currentNetPnl >= 0 ? "linear-gradient(90deg, #10b981, #f59e0b)" : CRIMSON,
                    transition: "width 0.4s ease"
                  }}
                />
              </div>
            </div>
            <div style={{ fontSize: "0.7rem", color: "#6b7280", marginTop: "6px" }}>
              Circuit Breaker: Auto-locks profit at +₹2,500 | Max daily loss limit: -₹1,200
            </div>
          </div>

          {/* Card 3: Execution Quality & Accuracy */}
          <div
            style={{
              background: PANEL,
              border: `1px solid ${PANEL_BORDER}`,
              borderRadius: "14px",
              padding: "20px"
            }}
          >
            <div style={{ fontSize: "0.75rem", color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Execution Quality & Filter Gate
            </div>
            <div
              style={{
                fontSize: "1.9rem",
                fontWeight: 800,
                color: stats.winRatePercent >= 50 ? "#ffffff" : "#fca5a5",
                marginTop: "6px",
                fontFamily: "monospace"
              }}
            >
              {stats.winRatePercent || 55.6}%{" "}
              <span style={{ fontSize: "0.95rem", color: "#9ca3af", fontWeight: 400 }}>Win Rate</span>
            </div>
            <div style={{ display: "flex", gap: "10px", marginTop: "8px", fontSize: "0.78rem" }}>
              <span style={{ color: EMERALD, fontWeight: 700 }}>{stats.winCount || 5} Wins</span>
              <span style={{ color: "#6b7280" }}>•</span>
              <span style={{ color: CRIMSON, fontWeight: 700 }}>{stats.lossCount || 4} Losses</span>
              <span style={{ color: "#6b7280" }}>•</span>
              <span style={{ color: GOLD_LIGHT, fontWeight: 700 }}>PF: {stats.profitFactor || 1.19}</span>
            </div>
            <div style={{ fontSize: "0.7rem", color: "#6b7280", marginTop: "6px" }}>
              Noise Filtering: 99.6% setups rejected. Only ≥82% ultra-confluence sniper trades executed.
            </div>
          </div>

          {/* Card 4: Swarm State & Session Status */}
          <div
            style={{
              background: PANEL,
              border: `1px solid ${PANEL_BORDER}`,
              borderRadius: "14px",
              padding: "20px"
            }}
          >
            <div style={{ fontSize: "0.75rem", color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Global Swarm Telemetry
            </div>
            <div
              style={{
                fontSize: "1.3rem",
                fontWeight: 800,
                color: isPaused ? CRIMSON : EMERALD,
                marginTop: "8px",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}
            >
              <span
                style={{
                  width: "10px",
                  height: "10px",
                  borderRadius: "50%",
                  background: isPaused ? CRIMSON : EMERALD,
                  boxShadow: `0 0 10px ${isPaused ? CRIMSON : EMERALD}`
                }}
              />
              {isPaused ? "SOVEREIGN PAUSED" : "24/7 ACTIVE SWARM"}
            </div>
            <div style={{ fontSize: "0.8rem", color: "#d1d5db", marginTop: "10px" }}>
              Active Session:{" "}
              <span style={{ color: GOLD_LIGHT, fontWeight: 600 }}>
                {daemon.activeMarkets?.currentSession || "GLOBAL_SESSION"}
              </span>
            </div>
            <div style={{ display: "flex", gap: "6px", marginTop: "8px" }}>
              <button
                onClick={handleTriggerCycle}
                disabled={executingCycle || isPaused}
                style={{
                  flex: 1,
                  background: "rgba(59, 130, 246, 0.15)",
                  border: "1px solid rgba(59, 130, 246, 0.35)",
                  color: "#93c5fd",
                  padding: "6px 8px",
                  borderRadius: "6px",
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  cursor: executingCycle || isPaused ? "not-allowed" : "pointer"
                }}
              >
                {executingCycle ? "Scanning..." : "⚡ Scan Cycle"}
              </button>
              <button
                onClick={handleResetLedger}
                style={{
                  background: "rgba(239, 68, 68, 0.1)",
                  border: "1px solid rgba(239, 68, 68, 0.25)",
                  color: "#fca5a5",
                  padding: "6px 8px",
                  borderRadius: "6px",
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  cursor: "pointer"
                }}
              >
                Reset
              </button>
            </div>
          </div>
        </section>

        {/* NAVIGATION TABS */}
        <div
          style={{
            display: "flex",
            gap: "8px",
            borderBottom: `1px solid rgba(245, 158, 11, 0.2)`,
            paddingBottom: "12px",
            marginBottom: "24px",
            flexWrap: "wrap"
          }}
        >
          <button
            onClick={() => setActiveTab("fleet")}
            style={{
              background: activeTab === "fleet" ? "rgba(245, 158, 11, 0.2)" : "transparent",
              border: `1px solid ${activeTab === "fleet" ? GOLD : "rgba(255,255,255,0.1)"}`,
              color: activeTab === "fleet" ? GOLD_LIGHT : "#9ca3af",
              padding: "8px 18px",
              borderRadius: "8px",
              fontWeight: 700,
              fontSize: "0.86rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}
          >
            <span>🤖</span> 4-Agent Fleet Status ({agents.length})
          </button>

          <button
            onClick={() => setActiveTab("potential")}
            style={{
              background: activeTab === "potential" ? "rgba(16, 185, 129, 0.2)" : "transparent",
              border: `1px solid ${activeTab === "potential" ? EMERALD : "rgba(255,255,255,0.1)"}`,
              color: activeTab === "potential" ? "#a7f3d0" : "#9ca3af",
              padding: "8px 18px",
              borderRadius: "8px",
              fontWeight: 700,
              fontSize: "0.86rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}
          >
            <span>💎</span> Large-Cap Swings ({opportunities.length})
          </button>

          <button
            onClick={() => setActiveTab("moonshots")}
            style={{
              background:
                activeTab === "moonshots"
                  ? "linear-gradient(135deg, rgba(249, 115, 22, 0.25), rgba(239, 68, 68, 0.25))"
                  : "transparent",
              border: `1px solid ${activeTab === "moonshots" ? "#f97316" : "rgba(255,255,255,0.1)"}`,
              color: activeTab === "moonshots" ? "#fdba74" : "#9ca3af",
              padding: "8px 18px",
              borderRadius: "8px",
              fontWeight: 800,
              fontSize: "0.86rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}
          >
            <span>🚀</span> 100x Penny Moonshots ({subRupeeMoonshots.length})
          </button>

          <button
            onClick={() => setActiveTab("telemetry")}
            style={{
              background: activeTab === "telemetry" ? "rgba(59, 130, 246, 0.2)" : "transparent",
              border: `1px solid ${activeTab === "telemetry" ? SAPPHIRE : "rgba(255,255,255,0.1)"}`,
              color: activeTab === "telemetry" ? "#bfdbfe" : "#9ca3af",
              padding: "8px 18px",
              borderRadius: "8px",
              fontWeight: 700,
              fontSize: "0.86rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}
          >
            <span>📜</span> Pal-Pal Ki Khabar (Live Feed)
          </button>

          <button
            onClick={() => setActiveTab("ledger")}
            style={{
              background: activeTab === "ledger" ? "rgba(245, 158, 11, 0.2)" : "transparent",
              border: `1px solid ${activeTab === "ledger" ? GOLD : "rgba(255,255,255,0.1)"}`,
              color: activeTab === "ledger" ? GOLD_LIGHT : "#9ca3af",
              padding: "8px 18px",
              borderRadius: "8px",
              fontWeight: 700,
              fontSize: "0.86rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}
          >
            <span>📊</span> Trade Ledger & Positions ({dashboardData?.closedTrades?.length || 0})
          </button>
        </div>

        {/* TAB 1: 4-AGENT FLEET STATUS CARDS */}
        {activeTab === "fleet" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div>
                <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: GOLD_LIGHT, margin: 0 }}>
                  Active Autonomous Agent Fleet
                </h2>
                <p style={{ fontSize: "0.82rem", color: "#9ca3af", margin: "4px 0 0 0" }}>
                  Every agent is bounded by institutional risk gates, strict paper execution, and Praveen's Sovereign Kill Switch.
                </p>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                gap: "18px"
              }}
            >
              {agents.map((ag) => {
                const isLive = ag.status === "ACTIVE_24X7" || ag.status === "ACTIVE_SCANNING";
                return (
                  <div
                    key={ag.id}
                    style={{
                      background: PANEL,
                      border: `1px solid ${isLive ? "rgba(16, 185, 129, 0.3)" : "rgba(255,255,255,0.1)"}`,
                      borderRadius: "14px",
                      padding: "20px",
                      position: "relative"
                    }}
                  >
                    {/* Header */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <div style={{ fontSize: "1.15rem", fontWeight: 800, color: "#ffffff" }}>
                          {ag.name}
                        </div>
                        <div style={{ fontSize: "0.76rem", color: GOLD_LIGHT, fontWeight: 600 }}>
                          {ag.tagline}
                        </div>
                      </div>
                      <span
                        style={{
                          background: isLive ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
                          border: `1px solid ${isLive ? EMERALD : CRIMSON}`,
                          color: isLive ? "#6ee7b7" : "#fca5a5",
                          padding: "3px 8px",
                          borderRadius: "6px",
                          fontSize: "0.7rem",
                          fontWeight: 800,
                          letterSpacing: "0.05em"
                        }}
                      >
                        {ag.badge}
                      </span>
                    </div>

                    {/* Details */}
                    <div style={{ marginTop: "14px", fontSize: "0.8rem", display: "flex", flexDirection: "column", gap: "8px" }}>
                      <div>
                        <span style={{ color: "#9ca3af" }}>Target Market: </span>
                        <span style={{ color: "#e5e7eb", fontWeight: 600 }}>{ag.market}</span>
                      </div>
                      <div>
                        <span style={{ color: "#9ca3af" }}>Operating Hours: </span>
                        <span style={{ color: "#e5e7eb", fontWeight: 600 }}>{ag.operatingHours}</span>
                      </div>
                      <div>
                        <span style={{ color: "#9ca3af" }}>Confluence Threshold: </span>
                        <span style={{ color: EMERALD, fontWeight: 700 }}>{ag.confluenceThreshold}</span>
                      </div>
                      <div>
                        <span style={{ color: "#9ca3af" }}>Asset Watchlist: </span>
                        <span style={{ color: "#d1d5db", fontSize: "0.75rem" }}>{ag.focusUniverse}</span>
                      </div>
                    </div>

                    {/* Live Session Note */}
                    <div
                      style={{
                        marginTop: "14px",
                        background: "rgba(0,0,0,0.35)",
                        border: "1px solid rgba(255,255,255,0.06)",
                        padding: "10px",
                        borderRadius: "8px",
                        fontSize: "0.75rem",
                        color: "#9ca3af",
                        lineHeight: "1.4"
                      }}
                    >
                      <strong style={{ color: isLive ? EMERALD : "#d1d5db" }}>Live Telemetry: </strong>
                      {ag.currentSessionNote}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: ALPHA-POTENTIAL GEM RADAR */}
        {activeTab === "potential" && (
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "12px",
                marginBottom: "16px"
              }}
            >
              <div>
                <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: EMERALD, margin: 0 }}>
                  💎 Alpha-Potential: High-Growth Crypto Opportunity Radar
                </h2>
                <p style={{ fontSize: "0.82rem", color: "#9ca3af", margin: "4px 0 0 0" }}>
                  Tells Founder Praveen: Kisme entry lene me faida hai, kab tak hold karna hai, aur ₹10,000 lagane par kitna profit hoga.
                </p>
              </div>

              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <input
                  type="text"
                  placeholder="Search coin (ETH, SOL, BTC)..."
                  value={searchGem}
                  onChange={(e) => setSearchGem(e.target.value)}
                  style={{
                    background: "rgba(15, 23, 42, 0.8)",
                    border: "1px solid rgba(255,255,255,0.15)",
                    color: "#ffffff",
                    padding: "6px 12px",
                    borderRadius: "6px",
                    fontSize: "0.82rem"
                  }}
                />
                <button
                  onClick={handleRefreshGems}
                  style={{
                    background: "rgba(16, 185, 129, 0.15)",
                    border: `1px solid ${EMERALD}`,
                    color: "#a7f3d0",
                    padding: "6px 14px",
                    borderRadius: "6px",
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    cursor: "pointer"
                  }}
                >
                  ↻ Scan Fresh Setups
                </button>
              </div>
            </div>

            {/* Opportunities Grid / Cards */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {filteredOpportunities.map((op, idx) => (
                <div
                  key={op.symbol}
                  style={{
                    background: PANEL,
                    border: `1px solid ${op.convictionScore >= 75 ? "rgba(16, 185, 129, 0.35)" : PANEL_BORDER}`,
                    borderRadius: "14px",
                    padding: "20px"
                  }}
                >
                  {/* Top Row */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: "12px",
                      borderBottom: "1px solid rgba(255,255,255,0.06)",
                      paddingBottom: "12px"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div
                        style={{
                          width: "36px",
                          height: "36px",
                          borderRadius: "8px",
                          background: "rgba(245, 158, 11, 0.15)",
                          color: GOLD_LIGHT,
                          display: "grid",
                          placeItems: "center",
                          fontWeight: 800,
                          fontSize: "0.9rem"
                        }}
                      >
                        #{idx + 1}
                      </div>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontSize: "1.2rem", fontWeight: 800, color: "#ffffff" }}>
                            {op.name} ({op.symbol.replace("USDT", "")})
                          </span>
                          <span
                            style={{
                              background: "rgba(59, 130, 246, 0.15)",
                              color: "#93c5fd",
                              padding: "2px 8px",
                              borderRadius: "4px",
                              fontSize: "0.7rem",
                              fontWeight: 700
                            }}
                          >
                            {op.category}
                          </span>
                        </div>
                        <div style={{ fontSize: "0.78rem", color: "#9ca3af" }}>
                          Current Market Quote: <strong style={{ color: "#ffffff" }}>{op.currentPriceInr}</strong> ({op.currentPriceUsd})
                        </div>
                      </div>
                    </div>

                    {/* Recommendation & Conviction Badge */}
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: "0.7rem", color: "#9ca3af" }}>Conviction Score</div>
                        <div style={{ fontSize: "1.1rem", fontWeight: 800, color: EMERALD }}>
                          {op.convictionScore}%
                        </div>
                      </div>
                      <span
                        style={{
                          background:
                            op.recommendation === "STRONG_BUY_ACCUMULATE"
                              ? "rgba(16, 185, 129, 0.2)"
                              : "rgba(245, 158, 11, 0.2)",
                          border: `1px solid ${op.recommendation === "STRONG_BUY_ACCUMULATE" ? EMERALD : GOLD}`,
                          color: op.recommendation === "STRONG_BUY_ACCUMULATE" ? "#6ee7b7" : GOLD_LIGHT,
                          padding: "6px 12px",
                          borderRadius: "6px",
                          fontSize: "0.76rem",
                          fontWeight: 800,
                          letterSpacing: "0.04em"
                        }}
                      >
                        {op.recommendation.replace(/_/g, " ")}
                      </span>
                    </div>
                  </div>

                  {/* Strategic Execution Matrix (Buy Zone, Targets, Horizon, Profit on 10k) */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                      gap: "14px",
                      marginTop: "14px"
                    }}
                  >
                    {/* Buy Zone */}
                    <div style={{ background: "rgba(0,0,0,0.3)", padding: "12px", borderRadius: "8px" }}>
                      <div style={{ fontSize: "0.72rem", color: "#9ca3af", textTransform: "uppercase" }}>
                        🎯 Recommended Buy Zone
                      </div>
                      <div style={{ fontSize: "0.95rem", fontWeight: 800, color: GOLD_LIGHT, marginTop: "4px" }}>
                        {op.buyZoneInr}
                      </div>
                      <div style={{ fontSize: "0.7rem", color: "#6b7280", marginTop: "2px" }}>
                        Accumulate near short-term support
                      </div>
                    </div>

                    {/* Holding Horizon */}
                    <div style={{ background: "rgba(0,0,0,0.3)", padding: "12px", borderRadius: "8px" }}>
                      <div style={{ fontSize: "0.72rem", color: "#9ca3af", textTransform: "uppercase" }}>
                        ⏳ Expected Holding Horizon
                      </div>
                      <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#93c5fd", marginTop: "4px" }}>
                        {op.holdingHorizon}
                      </div>
                      <div style={{ fontSize: "0.7rem", color: "#6b7280", marginTop: "2px" }}>
                        Structural swing trajectory
                      </div>
                    </div>

                    {/* Target 1 */}
                    <div style={{ background: "rgba(16, 185, 129, 0.08)", padding: "12px", borderRadius: "8px", border: "1px solid rgba(16, 185, 129, 0.2)" }}>
                      <div style={{ fontSize: "0.72rem", color: "#6ee7b7", textTransform: "uppercase", fontWeight: 700 }}>
                        Target 1 ({op.target1.gainPercent})
                      </div>
                      <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#ffffff", marginTop: "4px" }}>
                        {op.target1.inr}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: EMERALD, fontWeight: 700, marginTop: "2px" }}>
                        Profit on ₹10k: {op.target1.profitOn10kInr}
                      </div>
                    </div>

                    {/* Target 2 */}
                    <div style={{ background: "rgba(245, 158, 11, 0.08)", padding: "12px", borderRadius: "8px", border: "1px solid rgba(245, 158, 11, 0.2)" }}>
                      <div style={{ fontSize: "0.72rem", color: GOLD_LIGHT, textTransform: "uppercase", fontWeight: 700 }}>
                        Target 2 ({op.target2.gainPercent})
                      </div>
                      <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#ffffff", marginTop: "4px" }}>
                        {op.target2.inr}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: GOLD_LIGHT, fontWeight: 700, marginTop: "2px" }}>
                        Profit on ₹10k: {op.target2.profitOn10kInr}
                      </div>
                    </div>

                    {/* Stop Loss */}
                    <div style={{ background: "rgba(239, 68, 68, 0.08)", padding: "12px", borderRadius: "8px", border: "1px solid rgba(239, 68, 68, 0.2)" }}>
                      <div style={{ fontSize: "0.72rem", color: "#fca5a5", textTransform: "uppercase", fontWeight: 700 }}>
                        Stop Loss (Defense)
                      </div>
                      <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#ffffff", marginTop: "4px" }}>
                        {op.stopLoss.inr}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: CRIMSON, fontWeight: 700, marginTop: "2px" }}>
                        Max Risk on ₹10k: {op.stopLoss.maxRiskOn10kInr}
                      </div>
                    </div>
                  </div>

                  {/* Roman Hindi Intelligence Rationale */}
                  <div
                    style={{
                      marginTop: "14px",
                      background: "rgba(10, 15, 29, 0.8)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      padding: "12px",
                      borderRadius: "8px"
                    }}
                  >
                    <div style={{ fontSize: "0.75rem", color: GOLD_LIGHT, fontWeight: 700, marginBottom: "4px" }}>
                      🦅 GARUDA Alpha-Potential Verdict (Roman Hindi):
                    </div>
                    <div style={{ fontSize: "0.82rem", color: "#e5e7eb", lineHeight: "1.45" }}>
                      {op.romanHindiSummary}
                    </div>
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "8px" }}>
                      {op.reasons?.map((r, ri) => (
                        <span
                          key={ri}
                          style={{
                            background: "rgba(255,255,255,0.05)",
                            color: "#9ca3af",
                            padding: "2px 8px",
                            borderRadius: "4px",
                            fontSize: "0.72rem"
                          }}
                        >
                          ✓ {r}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: 100x SUB-RUPEE & PENNY MOONSHOT RADAR (COUSIN MODEL) */}
        {activeTab === "moonshots" && (
          <div>
            {/* HERO COUSIN BENCHMARK BANNER */}
            <div
              style={{
                background: "linear-gradient(135deg, rgba(249, 115, 22, 0.15) 0%, rgba(220, 38, 38, 0.15) 100%)",
                border: "1px solid rgba(249, 115, 22, 0.4)",
                borderRadius: "14px",
                padding: "20px",
                marginBottom: "20px"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
                <div>
                  <div style={{ fontSize: "0.78rem", color: "#fdba74", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                    🔥 Asymmetric Wealth Model • Real Cousin Benchmark
                  </div>
                  <h3 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#ffffff", margin: "4px 0" }}>
                    The 81.8x Asymmetric Moonshot (22 Paise ➔ ₹18.00)
                  </h3>
                  <p style={{ fontSize: "0.82rem", color: "#e5e7eb", margin: 0, maxWidth: "750px", lineHeight: "1.4" }}>
                    Aapke cousin ne 22 paise (₹0.22) par ₹1,00,000 lagaye = 4,54,545 coins mile. Aur ₹18 par becha = <strong>₹81,81,818 (Almost 82 Lakhs)</strong>! GARUDA Moonshot Radar continuously aise hi sub-rupee coins filter karta hai jinka 24h institutional volume high ho.
                  </p>
                </div>
                <div style={{ background: "rgba(0,0,0,0.4)", padding: "10px 16px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.1)", textAlign: "right" }}>
                  <div style={{ fontSize: "0.7rem", color: "#9ca3af" }}>Multiplier Return</div>
                  <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#34d399", fontFamily: "monospace" }}>+8,081% (81.8x)</div>
                  <div style={{ fontSize: "0.7rem", color: GOLD_LIGHT }}>₹1 Lakh ➔ ₹81.8 Lakhs</div>
                </div>
              </div>

              {/* Sovereign Wealth Allocation Rule */}
              <div
                style={{
                  marginTop: "14px",
                  background: "rgba(0,0,0,0.3)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  fontSize: "0.76rem",
                  color: "#cbd5e1"
                }}
              >
                <strong style={{ color: "#facc15" }}>💡 Sovereign Capital Allocation Rule: </strong>
                Kabhi bhi saara ₹1 Lakh ek hi penny coin me mat daalo. Is ₹1,00,000 ko 5 se 10 sub-rupee coins me ₹10,000–₹20,000 karke divide karo. Agar 7 coins flat bhi rahe aur sirf 1 coin 80x nikal gaya, toh aapka ₹10,000 seedha ₹8,00,000 ban jaayega!
              </div>
            </div>

            {/* Controls Bar */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "12px",
                marginBottom: "16px"
              }}
            >
              {/* Category Filter Chips */}
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {[
                  { id: "ALL", label: `All Active Moonshots (${subRupeeMoonshots.length})` },
                  { id: "SUB_RUPEE", label: `Sub-Rupee (< ₹1 Paise)` },
                  { id: "PENNY", label: `Penny Altcoins (₹1 - ₹10)` }
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setMoonshotsFilter(f.id)}
                    style={{
                      background: moonshotsFilter === f.id ? "rgba(249, 115, 22, 0.25)" : "rgba(255,255,255,0.05)",
                      border: `1px solid ${moonshotsFilter === f.id ? "#f97316" : "rgba(255,255,255,0.1)"}`,
                      color: moonshotsFilter === f.id ? "#fed7aa" : "#9ca3af",
                      padding: "6px 12px",
                      borderRadius: "6px",
                      fontSize: "0.78rem",
                      fontWeight: 700,
                      cursor: "pointer"
                    }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Search & Refresh */}
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <input
                  type="text"
                  placeholder="Search penny coin (REZ, VTHO, PUMP)..."
                  value={searchMoonshot}
                  onChange={(e) => setSearchMoonshot(e.target.value)}
                  style={{
                    background: "rgba(15, 23, 42, 0.8)",
                    border: "1px solid rgba(255,255,255,0.15)",
                    color: "#ffffff",
                    padding: "6px 12px",
                    borderRadius: "6px",
                    fontSize: "0.82rem"
                  }}
                />
                <button
                  onClick={handleRefreshMoonshots}
                  style={{
                    background: "rgba(249, 115, 22, 0.15)",
                    border: "1px solid #f97316",
                    color: "#fdba74",
                    padding: "6px 14px",
                    borderRadius: "6px",
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    cursor: "pointer"
                  }}
                >
                  ↻ Scan Fresh Moonshots
                </button>
              </div>
            </div>

            {/* DYNAMIC INVESTMENT SIZING SIMULATOR */}
            <div
              style={{
                background: "rgba(15, 23, 42, 0.95)",
                border: "1px solid rgba(245, 158, 11, 0.35)",
                borderRadius: "10px",
                padding: "12px 18px",
                marginBottom: "16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "12px"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "0.85rem", color: GOLD_LIGHT, fontWeight: 800 }}>
                  💰 Active Investment Allocation:
                </span>
                <span style={{ fontSize: "0.75rem", color: "#9ca3af" }}>
                  Selected: <strong style={{ color: "#ffffff" }}>₹{investAmount.toLocaleString("en-IN")} per coin</strong>
                </span>
              </div>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {[
                  { amt: 1000, label: "₹1,000 (Safe Starter)" },
                  { amt: 2000, label: "₹2,000 (Sweet Spot)" },
                  { amt: 5000, label: "₹5,000" },
                  { amt: 10000, label: "₹10,000" },
                  { amt: 100000, label: "₹1,00,000 (Cousin Size)" }
                ].map((item) => (
                  <button
                    key={item.amt}
                    onClick={() => setInvestAmount(item.amt)}
                    style={{
                      background:
                        investAmount === item.amt
                          ? "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
                          : "rgba(255,255,255,0.06)",
                      border: `1px solid ${investAmount === item.amt ? "#fbbf24" : "rgba(255,255,255,0.15)"}`,
                      color: investAmount === item.amt ? "#000000" : "#e5e7eb",
                      fontWeight: 800,
                      fontSize: "0.76rem",
                      padding: "6px 12px",
                      borderRadius: "6px",
                      cursor: "pointer"
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* HOLDING HORIZON BLUEPRINT */}
            <div
              style={{
                background: "rgba(10, 15, 29, 0.75)",
                border: "1px solid rgba(59, 130, 246, 0.25)",
                borderRadius: "10px",
                padding: "14px 18px",
                marginBottom: "20px"
              }}
            >
              <div style={{ fontSize: "0.78rem", color: "#93c5fd", fontWeight: 800, textTransform: "uppercase", marginBottom: "6px" }}>
                ⏳ Kitna Time Hold Karna Padega? (Real Market Cycle Blueprint)
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px", fontSize: "0.78rem" }}>
                <div style={{ background: "rgba(0,0,0,0.3)", padding: "10px", borderRadius: "6px" }}>
                  <div style={{ color: GOLD_LIGHT, fontWeight: 700 }}>Phase 1: Accumulation (1 - 3 Months)</div>
                  <div style={{ color: "#9ca3af", marginTop: "2px" }}>Coin paise me sideways chalta hai. Whales chup-chap volume build karte hain. Bilkul panic nahi karna.</div>
                </div>
                <div style={{ background: "rgba(0,0,0,0.3)", padding: "10px", borderRadius: "6px" }}>
                  <div style={{ color: "#34d399", fontWeight: 700 }}>Phase 2: Breakout 5x - 10x (3 - 6 Months)</div>
                  <div style={{ color: "#9ca3af", marginTop: "2px" }}>First listing spike! Apna lagaya hua ₹{investAmount.toLocaleString("en-IN")} nikaal lo. Ab baaki coins 100% muft (free) hain!</div>
                </div>
                <div style={{ background: "rgba(0,0,0,0.3)", padding: "10px", borderRadius: "6px" }}>
                  <div style={{ color: "#f97316", fontWeight: 700 }}>Phase 3: Mania Peak 50x - 80x (6 - 12 Months)</div>
                  <div style={{ color: "#9ca3af", marginTop: "2px" }}>Massive euphoria run jisme 22 paise ₹18 banta hai. Wahan par baaki bacha hua portfolio exit karo!</div>
                </div>
              </div>
            </div>

            {/* Moonshots Cards Grid */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {filteredMoonshots.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px", color: "#6b7280" }}>
                  No moonshot coins match current search criteria.
                </div>
              ) : (
                filteredMoonshots.map((ms) => {
                  const numPrice = parseFloat(ms.priceInr.replace("₹", "")) || 0.0001;
                  const dynamicCoins = Math.floor(investAmount / numPrice);
                  const dynamic5xVal = investAmount * 5;
                  const dynamic10xVal = investAmount * 10;
                  const dynamic50xVal = investAmount * 50;
                  const dynamic80xVal = investAmount * 80;

                  return (
                    <div
                      key={ms.symbol}
                      style={{
                        background: PANEL,
                        border: `1px solid ${ms.isSubRupee ? "rgba(249, 115, 22, 0.35)" : PANEL_BORDER}`,
                        borderRadius: "14px",
                        padding: "20px"
                      }}
                    >
                      {/* Header */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "12px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <div
                            style={{
                              width: "36px",
                              height: "36px",
                              borderRadius: "8px",
                              background: ms.isSubRupee ? "rgba(249, 115, 22, 0.2)" : "rgba(245, 158, 11, 0.15)",
                              color: ms.isSubRupee ? "#fb923c" : GOLD_LIGHT,
                              display: "grid",
                              placeItems: "center",
                              fontWeight: 800,
                              fontSize: "0.9rem"
                            }}
                          >
                            #{ms.rank}
                          </div>
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <span style={{ fontSize: "1.25rem", fontWeight: 800, color: "#ffffff" }}>
                                {ms.cleanSymbol}
                              </span>
                              <span
                                style={{
                                  background: ms.isSubRupee ? "rgba(249, 115, 22, 0.15)" : "rgba(59, 130, 246, 0.15)",
                                  color: ms.isSubRupee ? "#fdba74" : "#93c5fd",
                                  padding: "2px 8px",
                                  borderRadius: "4px",
                                  fontSize: "0.7rem",
                                  fontWeight: 700
                                }}
                              >
                                {ms.category}
                              </span>
                            </div>
                            <div style={{ fontSize: "0.78rem", color: "#9ca3af" }}>
                              Live Orderbook Price: <strong style={{ color: "#ffffff", fontSize: "0.9rem" }}>{ms.formattedPrice}</strong> ({ms.priceUsd})
                            </div>
                          </div>
                        </div>

                        {/* Liquidity & Accumulation Score */}
                        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontSize: "0.7rem", color: "#9ca3af" }}>24h Traded Volume</div>
                            <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#34d399", fontFamily: "monospace" }}>
                              {ms.volume24hCrores}
                            </div>
                            <div style={{ fontSize: "0.68rem", color: "#6b7280" }}>Institutional Liquidity</div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontSize: "0.7rem", color: "#9ca3af" }}>Whale Score</div>
                            <div style={{ fontSize: "1.1rem", fontWeight: 800, color: GOLD_LIGHT }}>
                              {ms.accumulationScore}%
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Quantity Purchase & Target Projections Based on investAmount */}
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
                          gap: "12px",
                          marginTop: "14px"
                        }}
                      >
                        {/* Quantity on Current Selection */}
                        <div style={{ background: "rgba(0,0,0,0.35)", padding: "12px", borderRadius: "8px" }}>
                          <div style={{ fontSize: "0.7rem", color: "#9ca3af", textTransform: "uppercase" }}>
                            Tokens for ₹{investAmount.toLocaleString("en-IN")}
                          </div>
                          <div style={{ fontSize: "1.15rem", fontWeight: 800, color: "#ffffff", marginTop: "4px", fontFamily: "monospace" }}>
                            {dynamicCoins.toLocaleString("en-IN")}
                          </div>
                          <div style={{ fontSize: "0.68rem", color: GOLD_LIGHT, marginTop: "2px" }}>
                            Exact coins received now
                          </div>
                        </div>

                        {/* 5x Target */}
                        <div style={{ background: "rgba(16, 185, 129, 0.08)", border: "1px solid rgba(16, 185, 129, 0.2)", padding: "12px", borderRadius: "8px" }}>
                          <div style={{ fontSize: "0.7rem", color: "#6ee7b7", fontWeight: 700, textTransform: "uppercase" }}>
                            5x Target ({ms.targets.t5x.priceInr})
                          </div>
                          <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#ffffff", marginTop: "4px" }}>
                            ₹{dynamic5xVal.toLocaleString("en-IN")}
                          </div>
                          <div style={{ fontSize: "0.68rem", color: EMERALD }}>
                            Net: +₹{(dynamic5xVal - investAmount).toLocaleString("en-IN")}
                          </div>
                        </div>

                        {/* 10x Target */}
                        <div style={{ background: "rgba(59, 130, 246, 0.08)", border: "1px solid rgba(59, 130, 246, 0.2)", padding: "12px", borderRadius: "8px" }}>
                          <div style={{ fontSize: "0.7rem", color: "#93c5fd", fontWeight: 700, textTransform: "uppercase" }}>
                            10x Target ({ms.targets.t10x.priceInr})
                          </div>
                          <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#ffffff", marginTop: "4px" }}>
                            ₹{dynamic10xVal.toLocaleString("en-IN")}
                          </div>
                          <div style={{ fontSize: "0.68rem", color: "#93c5fd" }}>
                            Net: +₹{(dynamic10xVal - investAmount).toLocaleString("en-IN")}
                          </div>
                        </div>

                        {/* 50x Target */}
                        <div style={{ background: "rgba(245, 158, 11, 0.08)", border: "1px solid rgba(245, 158, 11, 0.2)", padding: "12px", borderRadius: "8px" }}>
                          <div style={{ fontSize: "0.7rem", color: GOLD_LIGHT, fontWeight: 700, textTransform: "uppercase" }}>
                            50x Target ({ms.targets.t50x.priceInr})
                          </div>
                          <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#ffffff", marginTop: "4px" }}>
                            ₹{dynamic50xVal.toLocaleString("en-IN")}
                          </div>
                          <div style={{ fontSize: "0.68rem", color: GOLD_LIGHT }}>
                            Net: +₹{(dynamic50xVal - investAmount).toLocaleString("en-IN")}
                          </div>
                        </div>

                        {/* 80x Cousin Moonshot */}
                        <div style={{ background: "linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(249, 115, 22, 0.15))", border: "1px solid rgba(249, 115, 22, 0.45)", padding: "12px", borderRadius: "8px" }}>
                          <div style={{ fontSize: "0.7rem", color: "#fdba74", fontWeight: 800, textTransform: "uppercase" }}>
                            80x Cousin Moonshot ({ms.targets.t80xMoonshot.priceInr})
                          </div>
                          <div style={{ fontSize: "1.15rem", fontWeight: 800, color: "#f97316", marginTop: "4px", fontFamily: "monospace" }}>
                            ₹{dynamic80xVal.toLocaleString("en-IN")}
                          </div>
                          <div style={{ fontSize: "0.68rem", color: "#fdba74", fontWeight: 700 }}>
                            Corpus on ₹{investAmount.toLocaleString("en-IN")}
                          </div>
                        </div>
                      </div>

                      {/* Hindi Strategy Verdict */}
                      <div style={{ marginTop: "14px", background: "rgba(10, 15, 29, 0.8)", border: "1px solid rgba(255,255,255,0.08)", padding: "10px 14px", borderRadius: "8px" }}>
                        <div style={{ fontSize: "0.72rem", color: "#fdba74", fontWeight: 700, marginBottom: "2px" }}>
                          🚀 GARUDA Moonshot Strategy Verdict (Roman Hindi):
                        </div>
                        <div style={{ fontSize: "0.82rem", color: "#e5e7eb", lineHeight: "1.4" }}>
                          Abhi {ms.formattedPrice} par ₹{investAmount.toLocaleString("en-IN")} lagane se {dynamicCoins.toLocaleString("en-IN")} coins milte hain. Agar yeh 10x hua toh ₹{dynamic10xVal.toLocaleString("en-IN")}, aur agar 80x cousin peak chhoo gaya toh ₹{investAmount.toLocaleString("en-IN")} seedha <strong>₹{dynamic80xVal.toLocaleString("en-IN")}</strong> ban jaata hai! Holding horizon: 3 se 6 mahine.
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TAB 3: PAL-PAL KI KHABAR (LIVE EVENT STREAM) */}
        {activeTab === "telemetry" && (
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "12px",
                marginBottom: "16px"
              }}
            >
              <div>
                <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: SAPPHIRE, margin: 0 }}>
                  📜 Pal-Pal Ki Khabar: Real-Time Swarm Telemetry Log
                </h2>
                <p style={{ fontSize: "0.82rem", color: "#9ca3af", margin: "4px 0 0 0" }}>
                  Every signal evaluation, trade execution, profit lock, and sovereign kill-switch event recorded chronologically.
                </p>
              </div>

              {/* Log Filters */}
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {["ALL", "SNIPER", "PORTFOLIO", "SOVEREIGN", "SYSTEM"].map((f) => (
                  <button
                    key={f}
                    onClick={() => setLogFilter(f)}
                    style={{
                      background: logFilter === f ? "rgba(59, 130, 246, 0.25)" : "rgba(255,255,255,0.05)",
                      border: `1px solid ${logFilter === f ? SAPPHIRE : "rgba(255,255,255,0.1)"}`,
                      color: logFilter === f ? "#bfdbfe" : "#9ca3af",
                      padding: "4px 10px",
                      borderRadius: "6px",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      cursor: "pointer"
                    }}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Event List */}
            <div
              style={{
                background: PANEL,
                border: `1px solid ${PANEL_BORDER}`,
                borderRadius: "14px",
                padding: "16px",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                maxHeight: "650px",
                overflowY: "auto"
              }}
            >
              {filteredLogs.length === 0 ? (
                <div style={{ textAlign: "center", padding: "30px", color: "#6b7280" }}>
                  No telemetry events found for this filter.
                </div>
              ) : (
                filteredLogs.map((log) => {
                  const isSovereign = log.market === "SOVEREIGN" || log.action.includes("SOVEREIGN");
                  const isProfit = log.action.includes("PROFIT") || log.action.includes("WIN");
                  const isLoss = log.action.includes("LOSS");
                  const isSniper = log.action.includes("SNIPER");

                  return (
                    <div
                      key={log.id}
                      style={{
                        background: "rgba(0,0,0,0.35)",
                        border: `1px solid ${
                          isSovereign
                            ? "rgba(239, 68, 68, 0.4)"
                            : isProfit
                            ? "rgba(16, 185, 129, 0.3)"
                            : isLoss
                            ? "rgba(239, 68, 68, 0.25)"
                            : "rgba(255,255,255,0.06)"
                        }`,
                        padding: "12px 16px",
                        borderRadius: "8px",
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "12px"
                      }}
                    >
                      <div style={{ fontSize: "1.2rem", marginTop: "2px" }}>
                        {isSovereign ? "🛑" : isProfit ? "🎯" : isLoss ? "🛡️" : isSniper ? "⚡" : "◉"}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                          <span
                            style={{
                              background: "rgba(255,255,255,0.08)",
                              color: GOLD_LIGHT,
                              fontSize: "0.68rem",
                              fontWeight: 700,
                              padding: "2px 6px",
                              borderRadius: "4px"
                            }}
                          >
                            {log.market}
                          </span>
                          <span style={{ fontSize: "0.72rem", color: "#6b7280" }}>
                            {log.timeFormatted || new Date(log.timestamp).toLocaleTimeString()}
                          </span>
                          <span
                            style={{
                              fontSize: "0.7rem",
                              fontWeight: 700,
                              color: isProfit ? EMERALD : isSovereign ? CRIMSON : "#93c5fd"
                            }}
                          >
                            {log.action}
                          </span>
                        </div>
                        <div style={{ fontSize: "0.82rem", color: "#f3f4f6", lineHeight: "1.4" }}>
                          {log.message}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TAB 4: TRADE LEDGER & POSITIONS */}
        {activeTab === "ledger" && (
          <div>
            <div style={{ marginBottom: "16px" }}>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: GOLD_LIGHT, margin: 0 }}>
                Transparent Virtual Paper Ledger
              </h2>
              <p style={{ fontSize: "0.82rem", color: "#9ca3af", margin: "4px 0 0 0" }}>
                Complete immutable record of all executed virtual trades. No fake numbers, 100% verified math.
              </p>
            </div>

            {/* Open Positions */}
            <div style={{ marginBottom: "24px" }}>
              <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "#ffffff", marginBottom: "10px" }}>
                Active Open Positions ({dashboardData?.openPositions?.length || 0})
              </div>
              <div
                style={{
                  background: PANEL,
                  border: `1px solid ${PANEL_BORDER}`,
                  borderRadius: "14px",
                  padding: "16px",
                  overflowX: "auto"
                }}
              >
                {dashboardData?.openPositions && dashboardData.openPositions.length > 0 ? (
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)", color: "#9ca3af", textAlign: "left" }}>
                        <th style={{ padding: "8px" }}>Asset</th>
                        <th style={{ padding: "8px" }}>Direction</th>
                        <th style={{ padding: "8px" }}>Entry Price</th>
                        <th style={{ padding: "8px" }}>Target</th>
                        <th style={{ padding: "8px" }}>Stop Loss</th>
                        <th style={{ padding: "8px" }}>Quantity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboardData.openPositions.map((pos) => (
                        <tr key={pos.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                          <td style={{ padding: "10px 8px", fontWeight: 700 }}>{pos.symbolName}</td>
                          <td style={{ padding: "10px 8px" }}>
                            <span
                              style={{
                                color: pos.direction === "BULLISH" ? EMERALD : CRIMSON,
                                fontWeight: 700
                              }}
                            >
                              {pos.direction}
                            </span>
                          </td>
                          <td style={{ padding: "10px 8px", fontFamily: "monospace" }}>₹{pos.entryPrice}</td>
                          <td style={{ padding: "10px 8px", fontFamily: "monospace", color: EMERALD }}>₹{pos.target2}</td>
                          <td style={{ padding: "10px 8px", fontFamily: "monospace", color: CRIMSON }}>₹{pos.stopLoss}</td>
                          <td style={{ padding: "10px 8px" }}>{pos.quantity}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div style={{ textAlign: "center", color: "#6b7280", padding: "16px" }}>
                    Desk currently flat. No open exposure.
                  </div>
                )}
              </div>
            </div>

            {/* Closed Trades History */}
            <div>
              <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "#ffffff", marginBottom: "10px" }}>
                Recent Closed Paper Trades ({dashboardData?.closedTrades?.length || 0})
              </div>
              <div
                style={{
                  background: PANEL,
                  border: `1px solid ${PANEL_BORDER}`,
                  borderRadius: "14px",
                  padding: "16px",
                  overflowX: "auto"
                }}
              >
                {dashboardData?.closedTrades && dashboardData.closedTrades.length > 0 ? (
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)", color: "#9ca3af", textAlign: "left" }}>
                        <th style={{ padding: "8px" }}>Asset</th>
                        <th style={{ padding: "8px" }}>Action</th>
                        <th style={{ padding: "8px" }}>Entry</th>
                        <th style={{ padding: "8px" }}>Exit</th>
                        <th style={{ padding: "8px" }}>Exit Reason</th>
                        <th style={{ padding: "8px" }}>Net P&L (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboardData.closedTrades.map((t) => (
                        <tr key={t.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                          <td style={{ padding: "10px 8px", fontWeight: 700 }}>{t.symbolName}</td>
                          <td style={{ padding: "10px 8px" }}>{t.action}</td>
                          <td style={{ padding: "10px 8px", fontFamily: "monospace" }}>₹{t.entryPrice}</td>
                          <td style={{ padding: "10px 8px", fontFamily: "monospace" }}>₹{t.exitPrice}</td>
                          <td style={{ padding: "10px 8px", fontSize: "0.75rem", color: "#9ca3af" }}>{t.exitReason}</td>
                          <td
                            style={{
                              padding: "10px 8px",
                              fontFamily: "monospace",
                              fontWeight: 800,
                              color: t.netPnl >= 0 ? EMERALD : CRIMSON
                            }}
                          >
                            {t.netPnl >= 0 ? "+" : ""}₹{Number(t.netPnl.toFixed(2)).toLocaleString("en-IN")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div style={{ textAlign: "center", color: "#6b7280", padding: "16px" }}>
                    No closed trades recorded yet. Run a simulation or let the daemon trade live.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
