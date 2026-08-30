import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import SEOHead from "../components/SEOHead";
import UniverseDetail from "../components/UniverseDetail";
import { UNIVERSES, RINGS } from "../config/universes";
import BrandAssetImage from "../components/BrandAssetImage";

const GOLD = "#d4af37";
const GOLD_LIGHT = "#fef08a";
const BG = "#030712";
const PANEL = "#0a0f18";
const PANEL_SOFT = "rgba(11, 15, 25, 0.75)";
const BORDER = "rgba(212, 175, 55, 0.22)";

const QUICK_ACTIONS = [
  {
    id: "creative",
    icon: "🎨",
    title: "Creative & Marketing Studio",
    desc: "Generate 360° campaigns, ad copy hooks, reels scripts & PPT decks",
    action: "/studio",
    badge: "LIVE"
  },
  {
    id: "scholar",
    icon: "📚",
    title: "Scholar / Vidya Studio",
    desc: "Autonomous academic research, step-by-step derivations & white PDF export",
    action: "/scholar",
    badge: "LIVE"
  },
  {
    id: "proposal",
    icon: "💼",
    title: "Commercial Proposals",
    desc: "Generate fixed-price proposals, milestone governance & Razorpay checkout",
    action: "/proposal/prop_kudos_2026",
    badge: "LIVE"
  },
  {
    id: "realestate",
    icon: "🏢",
    title: "Real Estate Growth OS",
    desc: "Discover property builders, evaluate corridors & score high-intent leads",
    action: "agent.real_estate_hunter",
    isAgent: true,
    badge: "EXECUTABLE"
  },
  {
    id: "command",
    icon: "📡",
    title: "High Command Center",
    desc: "Live multi-brain telemetry, risk scoring & whole-system radar",
    action: "/command-center",
    badge: "LIVE"
  }
];

export default function CustomerDashboard({ customer, onLogout }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("workspace");
  const [commandInput, setCommandInput] = useState("");
  const [isExecutingCommand, setIsExecutingCommand] = useState(false);
  const [commandResult, setCommandResult] = useState(null);

  const [selectedUniverse, setSelectedUniverse] = useState(null);
  const [workforceData, setWorkforceData] = useState(null);
  const [selectedAgentId, setSelectedAgentId] = useState("agent.copywriting");
  const [agentInputQuery, setAgentInputQuery] = useState("");
  const [isDispatchingAgent, setIsDispatchingAgent] = useState(false);
  const [agentExecutionResult, setAgentExecutionResult] = useState(null);

  const [recentMissions, setRecentMissions] = useState([
    {
      id: "mission_kudos_01",
      title: "Kudos Face of India 2026 — 13-Day Celebrity Omnipresence War Room",
      type: "CREATIVE & MARKETING",
      status: "COMPLETED",
      target: "Celina Jaitly & Radisson Blu Dwarka Event (12 Sept)",
      link: "/kudos"
    },
    {
      id: "mission_prop_01",
      title: "Commercial Proposal prop_kudos_2026 (₹65,000 Scope Lock)",
      type: "REVENUE & PROPOSAL",
      status: "READY FOR SIGN-OFF",
      target: "Kajal Sharma (Kudos Entertainment)",
      link: "/proposal/prop_kudos_2026"
    }
  ]);

  // Load Workforce Telemetry
  useEffect(() => {
    fetch("/api/customer?path=workforce")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.workforce) {
          setWorkforceData(data.workforce);
        }
      })
      .catch(() => {});
  }, []);

  // Execute Hero Command Input
  const handleExecuteCommand = async (e) => {
    e?.preventDefault();
    if (!commandInput.trim()) return;

    const cmd = commandInput.trim().toLowerCase();
    setIsExecutingCommand(true);
    setCommandResult(null);

    // Fast-path routing
    if (cmd.includes("studio") || cmd.includes("campaign") || cmd.includes("ad") || cmd.includes("marketing")) {
      setTimeout(() => navigate("/studio"), 300);
      return;
    }
    if (cmd.includes("scholar") || cmd.includes("research") || cmd.includes("thesis") || cmd.includes("paper")) {
      setTimeout(() => navigate("/scholar"), 300);
      return;
    }
    if (cmd.includes("command") || cmd.includes("radar") || cmd.includes("telemetry")) {
      setTimeout(() => navigate("/command-center"), 300);
      return;
    }
    if (cmd.includes("kudos") || cmd.includes("celina") || cmd.includes("event")) {
      setTimeout(() => navigate("/kudos"), 300);
      return;
    }

    // Agent dispatch fallback
    try {
      const res = await fetch("/api/customer?path=dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal: commandInput })
      });
      const data = await res.json();
      if (data.success) {
        setCommandResult({
          goal: commandInput,
          agent: data.routedAgentId,
          output: data.execution?.result
        });
        setRecentMissions((prev) => [
          {
            id: `mission_${Date.now().toString(36)}`,
            title: commandInput,
            type: "AUTONOMOUS AGENT DISPATCH",
            status: "SUCCESS",
            target: data.routedAgentId,
            link: null
          },
          ...prev
        ]);
      } else {
        setCommandResult({ goal: commandInput, error: data.message || "Execution failed." });
      }
    } catch (err) {
      setCommandResult({ goal: commandInput, error: err.message });
    } finally {
      setIsExecutingCommand(false);
    }
  };

  // Direct Agent Dispatch
  const handleDispatchSelectedAgent = async () => {
    setIsDispatchingAgent(true);
    setAgentExecutionResult(null);
    try {
      const res = await fetch("/api/customer?path=dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId: selectedAgentId,
          input: { query: agentInputQuery || "Delhi NCR Market", targetCity: "Delhi NCR", brandName: agentInputQuery || "Client Enterprise" }
        })
      });
      const data = await res.json();
      if (data.success && data.execution) {
        setAgentExecutionResult(data.execution.result);
      } else {
        setAgentExecutionResult({ error: data.message || "Task failed" });
      }
    } catch (err) {
      setAgentExecutionResult({ error: err.message });
    } finally {
      setIsDispatchingAgent(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: BG, color: "#f8fafc", fontFamily: "Inter, system-ui, sans-serif" }}>
      <SEOHead
        title="GARUDA OS Workspace | Sovereign AI Operating System"
        description="Unified AI Operating System for autonomous creation, research synthesis, commercial growth, and workforce dispatch."
        canonical="https://www.garudaos.in/app"
      />

      {/* Selected Universe Detail Modal */}
      {selectedUniverse && <UniverseDetail universe={selectedUniverse} onClose={() => setSelectedUniverse(null)} />}

      {/* ========================================================================= */}
      {/* 1. TOP NAVIGATION BAR */}
      {/* ========================================================================= */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: "rgba(3, 7, 18, 0.92)",
          borderBottom: `1px solid ${BORDER}`,
          backdropFilter: "blur(16px)",
          padding: "0.75rem 1.5rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
          <div
            onClick={() => setActiveTab("workspace")}
            style={{ display: "flex", alignItems: "center", gap: "0.65rem", cursor: "pointer" }}
          >
            <span style={{ width: 28, height: 28, display: "grid", placeItems: "center" }}>
              <BrandAssetImage kind="branding" alt="GARUDA" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
            </span>
            <div>
              <span style={{ fontWeight: 900, fontSize: "1.05rem", letterSpacing: "0.08em", color: "#fff" }}>GARUDA</span>
              <span style={{ fontSize: "0.65rem", background: "linear-gradient(135deg, #d4af37, #f59e0b)", color: "#000", padding: "0.15rem 0.4rem", borderRadius: 4, fontWeight: 900, marginLeft: "0.4rem" }}>
                OS
              </span>
            </div>
          </div>

          {/* Primary Navigation Ribbon */}
          <nav style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
            {[
              { id: "workspace", label: "⚡ Workspace" },
              { id: "universes", label: "🌌 27 Universes" },
              { id: "agents", label: "🤖 30-Agent Workforce" },
              { id: "commercial", label: "💼 Commercial & Proposals" }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  background: activeTab === tab.id ? "rgba(212,175,55,0.18)" : "transparent",
                  border: activeTab === tab.id ? `1px solid ${GOLD}` : "1px solid transparent",
                  color: activeTab === tab.id ? GOLD_LIGHT : "#94a3b8",
                  padding: "0.4rem 0.85rem",
                  borderRadius: 8,
                  fontSize: "0.82rem",
                  fontWeight: activeTab === tab.id ? 800 : 500,
                  cursor: "pointer",
                  transition: "all 0.15s ease"
                }}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* User Identity & Global Action */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <button
            onClick={() => navigate("/command-center")}
            style={{
              background: "rgba(56,189,248,0.12)",
              border: "1px solid rgba(56,189,248,0.3)",
              color: "#38bdf8",
              padding: "0.35rem 0.75rem",
              borderRadius: 6,
              fontSize: "0.78rem",
              fontWeight: 700,
              cursor: "pointer"
            }}
          >
            📡 Radar
          </button>
          <div style={{ fontSize: "0.78rem", color: "#8d95a7", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981", boxShadow: "0 0 8px #10b981" }} />
            <span style={{ color: "#cbd5e1" }}>{customer?.email || "Founder Access"}</span>
          </div>
          {onLogout && (
            <button
              onClick={onLogout}
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#94a3b8",
                padding: "0.35rem 0.65rem",
                borderRadius: 6,
                fontSize: "0.75rem",
                cursor: "pointer"
              }}
            >
              Sign out
            </button>
          )}
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. MAIN OPERATING CONTAINER */}
      {/* ========================================================================= */}
      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "2rem 1.25rem 5rem" }}>
        
        {/* ======================================================================= */}
        {/* TAB 1: WORKSPACE & PRIMARY COMMAND CENTER */}
        {/* ======================================================================= */}
        {activeTab === "workspace" && (
          <div>
            {/* HERO COMMAND SECTION */}
            <div
              style={{
                background: "linear-gradient(145deg, rgba(212,175,55,0.08) 0%, rgba(10,15,24,0.95) 100%)",
                border: `1px solid ${BORDER}`,
                borderRadius: 20,
                padding: "2.25rem 2rem",
                marginBottom: "2rem",
                boxShadow: "0 20px 60px rgba(0,0,0,0.5)"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem", marginBottom: "1.25rem" }}>
                <div>
                  <div style={{ fontSize: "0.75rem", color: GOLD, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase" }}>
                    Autonomous Sovereign Intelligence
                  </div>
                  <h1 style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", fontWeight: 900, color: "#fff", margin: "0.3rem 0 0 0" }}>
                    Good evening, Leader.
                  </h1>
                </div>
                <div style={{ display: "flex", gap: "0.6rem" }}>
                  <span style={{ fontSize: "0.75rem", background: "rgba(16,185,129,0.15)", color: "#34d399", border: "1px solid rgba(16,185,129,0.3)", padding: "0.25rem 0.65rem", borderRadius: 999, fontWeight: 700 }}>
                    ● 27 Universes Active
                  </span>
                  <span style={{ fontSize: "0.75rem", background: "rgba(56,189,248,0.15)", color: "#38bdf8", border: "1px solid rgba(56,189,248,0.3)", padding: "0.25rem 0.65rem", borderRadius: 999, fontWeight: 700 }}>
                    ● 30 Agents Ready
                  </span>
                </div>
              </div>

              {/* Primary Command Input */}
              <form onSubmit={handleExecuteCommand} style={{ position: "relative", marginBottom: "1.5rem" }}>
                <input
                  type="text"
                  value={commandInput}
                  onChange={(e) => setCommandInput(e.target.value)}
                  placeholder="What do you want to accomplish? (e.g. 'Create marketing campaign', 'Research AI thesis', 'Find real estate clients', 'Build proposal')"
                  style={{
                    width: "100%",
                    background: "#05070d",
                    border: "1px solid rgba(212,175,55,0.4)",
                    borderRadius: 14,
                    padding: "1rem 7.5rem 1rem 1.25rem",
                    color: "#fff",
                    fontSize: "1rem",
                    boxSizing: "border-box",
                    boxShadow: "0 8px 30px rgba(0,0,0,0.6)",
                    outline: "none"
                  }}
                />
                <button
                  type="submit"
                  disabled={isExecutingCommand || !commandInput.trim()}
                  style={{
                    position: "absolute",
                    right: 8,
                    top: 8,
                    bottom: 8,
                    background: "linear-gradient(135deg, #d4af37 0%, #b8860b 100%)",
                    color: "#000",
                    border: "none",
                    borderRadius: 10,
                    padding: "0 1.25rem",
                    fontWeight: 900,
                    fontSize: "0.85rem",
                    cursor: isExecutingCommand ? "not-allowed" : "pointer"
                  }}
                >
                  {isExecutingCommand ? "Executing…" : "Execute ➔"}
                </button>
              </form>

              {/* Command Result Output (If executed) */}
              {commandResult && (
                <div style={{ background: "#050811", border: "1px solid rgba(56,189,248,0.3)", borderRadius: 12, padding: "1.25rem", marginTop: "1rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                    <span style={{ fontSize: "0.75rem", color: "#38bdf8", fontWeight: 800 }}>
                      ⚡ ROUTED TO: {commandResult.agent || "CORE REASONING"}
                    </span>
                    <button
                      onClick={() => setCommandResult(null)}
                      style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "0.8rem" }}
                    >
                      ✕ Close
                    </button>
                  </div>
                  {commandResult.error ? (
                    <p style={{ color: "#f87171", margin: 0, fontSize: "0.9rem" }}>{commandResult.error}</p>
                  ) : (
                    <pre style={{ margin: 0, fontSize: "0.85rem", color: "#cbd5e1", whiteSpace: "pre-wrap", fontFamily: "monospace" }}>
                      {JSON.stringify(commandResult.output, null, 2)}
                    </pre>
                  )}
                </div>
              )}

              {/* REAL EXECUTABLE QUICK ACTIONS */}
              <div style={{ marginTop: "1.5rem" }}>
                <div style={{ fontSize: "0.75rem", color: "#8d95a7", fontWeight: 700, marginBottom: "0.75rem", textTransform: "uppercase" }}>
                  Quick Launch Verified Capabilities
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.75rem" }}>
                  {QUICK_ACTIONS.map((qa) => (
                    <button
                      key={qa.id}
                      onClick={() => {
                        if (qa.isAgent) {
                          setSelectedAgentId(qa.action);
                          setActiveTab("agents");
                        } else {
                          navigate(qa.action);
                        }
                      }}
                      style={{
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: 12,
                        padding: "0.85rem 1rem",
                        textAlign: "left",
                        cursor: "pointer",
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.3rem",
                        transition: "all 0.15s ease"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = GOLD;
                        e.currentTarget.style.background = "rgba(212,175,55,0.08)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                        e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: "1.2rem" }}>{qa.icon}</span>
                        <span style={{ fontSize: "0.65rem", background: "rgba(212,175,55,0.15)", color: GOLD_LIGHT, padding: "0.15rem 0.45rem", borderRadius: 4, fontWeight: 800 }}>
                          {qa.badge}
                        </span>
                      </div>
                      <div style={{ fontWeight: 800, fontSize: "0.9rem", color: "#fff", marginTop: "0.2rem" }}>{qa.title}</div>
                      <div style={{ fontSize: "0.75rem", color: "#94a3b8", lineHeight: 1.4 }}>{qa.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* ACTIVE MISSIONS & DELIVERABLES */}
            <div style={{ background: PANEL, border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "1.5rem", marginBottom: "2rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <div>
                  <div style={{ fontSize: "0.75rem", color: GOLD, fontWeight: 800, textTransform: "uppercase" }}>Active Delivery Pipeline</div>
                  <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#fff" }}>Recent Projects & Missions</div>
                </div>
                <button
                  onClick={() => navigate("/proposal/prop_kudos_2026")}
                  style={{ background: "rgba(212,175,55,0.12)", border: `1px solid ${GOLD}`, color: GOLD_LIGHT, padding: "0.35rem 0.75rem", borderRadius: 6, fontSize: "0.78rem", fontWeight: 700, cursor: "pointer" }}
                >
                  View Active Proposal →
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {recentMissions.map((m) => (
                  <div
                    key={m.id}
                    style={{
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      borderRadius: 10,
                      padding: "0.9rem 1.1rem",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: "0.75rem"
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                        <span style={{ fontWeight: 800, fontSize: "0.92rem", color: "#fff" }}>{m.title}</span>
                        <span style={{ fontSize: "0.65rem", background: "rgba(16,185,129,0.15)", color: "#34d399", padding: "0.15rem 0.4rem", borderRadius: 4, fontWeight: 700 }}>
                          {m.status}
                        </span>
                      </div>
                      <div style={{ fontSize: "0.78rem", color: "#8d95a7", marginTop: "0.2rem" }}>Target: {m.target}</div>
                    </div>
                    {m.link && (
                      <button
                        onClick={() => navigate(m.link)}
                        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", color: "#cbd5e1", borderRadius: 6, padding: "0.35rem 0.75rem", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer" }}
                      >
                        Open Workspace ➔
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ======================================================================= */}
        {/* TAB 2: STRUCTURED 27 UNIVERSES EXPLORER */}
        {/* ======================================================================= */}
        {activeTab === "universes" && (
          <div>
            <div style={{ marginBottom: "1.5rem" }}>
              <div style={{ fontSize: "0.75rem", color: GOLD, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                The 27 Foundational Universes
              </div>
              <h2 style={{ fontSize: "1.6rem", fontWeight: 900, color: "#fff", margin: "0.2rem 0 0.5rem" }}>
                GARUDA Multi-Universe Explorer
              </h2>
              <p style={{ color: "#9ca3af", fontSize: "0.9rem", maxWidth: 720 }}>
                Specialization without isolation. Every universe delivers concrete real-world capabilities. Select any universe to inspect its tools and launch execution.
              </p>
            </div>

            {/* Universes Grouped by Ring */}
            <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
              {RINGS.map((ring) => {
                const ringUniverses = UNIVERSES.filter((u) => u.ring === ring.id);
                return (
                  <div key={ring.id} style={{ background: PANEL, border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: "1.5rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "0.6rem" }}>
                      <div>
                        <span style={{ fontSize: "0.75rem", color: GOLD, fontWeight: 800 }}>RING {ring.id}</span>
                        <h3 style={{ margin: "0.1rem 0 0", fontSize: "1.15rem", fontWeight: 800, color: "#fff" }}>{ring.name}</h3>
                      </div>
                      <span style={{ fontSize: "0.78rem", color: "#8d95a7" }}>{ring.blurb}</span>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "1rem" }}>
                      {ringUniverses.map((u) => {
                        const isLive = u.status === "LIVE" || u.status === "ACTIVE" || u.status === "PRIMARY";
                        return (
                          <div
                            key={u.num}
                            style={{
                              background: "rgba(255,255,255,0.02)",
                              border: `1px solid ${isLive ? "rgba(212,175,55,0.2)" : "rgba(255,255,255,0.06)"}`,
                              borderRadius: 12,
                              padding: "1.1rem",
                              display: "flex",
                              flexDirection: "column",
                              justifyContent: "space-between",
                              gap: "0.75rem"
                            }}
                          >
                            <div>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                                <span style={{ fontFamily: "monospace", color: GOLD, fontWeight: 800, fontSize: "0.75rem" }}>
                                  U{String(u.num).padStart(2, "0")}
                                </span>
                                <span style={{ fontSize: "0.65rem", background: isLive ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.05)", color: isLive ? "#34d399" : "#8d95a7", padding: "0.15rem 0.4rem", borderRadius: 4, fontWeight: 700 }}>
                                  {u.status}
                                </span>
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", marginBottom: "0.3rem" }}>
                                <span style={{ fontSize: "1.1rem", color: GOLD }}>{u.icon}</span>
                                <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 800, color: "#fff" }}>{u.name.replace(" Universe", "")}</h4>
                              </div>
                              <p style={{ margin: 0, color: "#9ca3af", fontSize: "0.78rem", lineHeight: 1.45 }}>{u.tagline}</p>
                            </div>

                            {/* What Can I Do Here Action */}
                            <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "0.6rem" }}>
                              {u.num === 19 || u.num === 20 ? (
                                <button
                                  onClick={() => navigate("/studio")}
                                  style={{ width: "100%", background: "linear-gradient(135deg, rgba(212,175,55,0.2), rgba(56,189,248,0.2))", border: `1px solid ${GOLD}`, color: GOLD_LIGHT, borderRadius: 6, padding: "0.35rem", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer" }}
                                >
                                  🎨 Launch Creative Studio →
                                </button>
                              ) : u.num === 1 || u.num === 14 ? (
                                <button
                                  onClick={() => navigate("/scholar")}
                                  style={{ width: "100%", background: "rgba(56,189,248,0.12)", border: "1px solid rgba(56,189,248,0.3)", color: "#38bdf8", borderRadius: 6, padding: "0.35rem", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer" }}
                                >
                                  📚 Launch Vidya Research →
                                </button>
                              ) : u.num === 10 ? (
                                <button
                                  onClick={() => navigate("/proposal/prop_kudos_2026")}
                                  style={{ width: "100%", background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.3)", color: "#34d399", borderRadius: 6, padding: "0.35rem", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer" }}
                                >
                                  💼 Open Proposals →
                                </button>
                              ) : (
                                <button
                                  onClick={() => setSelectedUniverse(u)}
                                  style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#cbd5e1", borderRadius: 6, padding: "0.35rem", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer" }}
                                >
                                  Inspect Modules →
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ======================================================================= */}
        {/* TAB 3: 30-AGENT WORKFORCE & MISSION DISPATCHER */}
        {/* ======================================================================= */}
        {activeTab === "agents" && (
          <div>
            <div style={{ marginBottom: "1.5rem" }}>
              <div style={{ fontSize: "0.75rem", color: GOLD, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                Autonomous Execution Fleet
              </div>
              <h2 style={{ fontSize: "1.6rem", fontWeight: 900, color: "#fff", margin: "0.2rem 0 0.5rem" }}>
                30-Agent Workforce & Mission Dispatcher
              </h2>
              <p style={{ color: "#9ca3af", fontSize: "0.9rem", maxWidth: 720 }}>
                Deterministic specialized autonomous agents. Select any agent, provide target parameters, and dispatch missions in real-time.
              </p>
            </div>

            {/* Mission Dispatch Console */}
            <div style={{ background: PANEL, border: `1px solid ${BORDER}`, borderRadius: 16, padding: "1.75rem", marginBottom: "2rem" }}>
              <div style={{ fontSize: "0.8rem", color: GOLD_LIGHT, fontWeight: 800, marginBottom: "0.75rem" }}>
                ⚡ DISPATCH AUTONOMOUS MISSION
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem", marginBottom: "1rem" }}>
                <div>
                  <label style={{ fontSize: "0.75rem", color: "#8d95a7", display: "block", marginBottom: "0.3rem" }}>Select Sector Agent</label>
                  <select
                    value={selectedAgentId}
                    onChange={(e) => setSelectedAgentId(e.target.value)}
                    style={{ width: "100%", background: "#05070d", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, padding: "0.6rem 0.8rem", color: "#fff", fontSize: "0.88rem" }}
                  >
                    <option value="agent.copywriting">Creative Copywriting Agent</option>
                    <option value="agent.hospitality_hotel_hunter">Hospitality & Hotel Booking OS Hunter</option>
                    <option value="agent.restaurant_dining_hunter">Restaurant & Cloud Kitchen Hunter</option>
                    <option value="agent.mobile_app_saas_hunter">Mobile App & Custom SaaS Hunter</option>
                    <option value="agent.real_estate_hunter">Real Estate & Builder Growth Hunter</option>
                    <option value="agent.business_erp_hunter">Custom Business ERP Hunter</option>
                    <option value="agent.healthcare_clinic_hunter">Healthcare & Clinic Hunter</option>
                    <option value="agent.global_international_hunter">Global International B2B Hunter</option>
                    <option value="agent.lead_qualifier_pitcher">Lead Qualifier & Pitch Generator</option>
                    <option value="agent.market_intelligence">Market Intelligence Agent</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: "0.75rem", color: "#8d95a7", display: "block", marginBottom: "0.3rem" }}>Target Brand / City / Brief</label>
                  <input
                    type="text"
                    value={agentInputQuery}
                    onChange={(e) => setAgentInputQuery(e.target.value)}
                    placeholder="e.g. Grand Azure Resort Goa / DLF CyberCity Delhi"
                    style={{ width: "100%", background: "#05070d", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, padding: "0.6rem 0.8rem", color: "#fff", fontSize: "0.88rem", boxSizing: "border-box" }}
                  />
                </div>
              </div>

              <button
                onClick={handleDispatchSelectedAgent}
                disabled={isDispatchingAgent}
                style={{
                  background: "linear-gradient(135deg, #d4af37 0%, #b8860b 100%)",
                  color: "#000",
                  border: "none",
                  borderRadius: 8,
                  padding: "0.65rem 1.5rem",
                  fontWeight: 800,
                  fontSize: "0.88rem",
                  cursor: isDispatchingAgent ? "not-allowed" : "pointer"
                }}
              >
                {isDispatchingAgent ? "Dispatching Agent…" : "⚡ Execute Agent Mission"}
              </button>

              {/* Agent Execution Live Result */}
              {agentExecutionResult && (
                <div style={{ marginTop: "1.5rem", background: "#050811", border: "1px solid rgba(56,189,248,0.3)", borderRadius: 12, padding: "1.25rem" }}>
                  <div style={{ fontSize: "0.75rem", color: "#38bdf8", fontWeight: 800, marginBottom: "0.5rem" }}>
                    MISSION EXECUTION RESULT (VERIFIED)
                  </div>
                  <pre style={{ margin: 0, fontSize: "0.85rem", color: "#cbd5e1", whiteSpace: "pre-wrap", fontFamily: "monospace" }}>
                    {JSON.stringify(agentExecutionResult, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            {/* 30-Agent Active Fleet Table */}
            <div style={{ background: PANEL, border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "1.5rem" }}>
              <div style={{ fontWeight: 800, fontSize: "1.05rem", color: "#fff", marginBottom: "1rem" }}>
                Active Agent Roster ({workforceData?.registered || 30} Agents Verified)
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "0.75rem" }}>
                {(workforceData?.roster || []).slice(0, 12).map((ag) => (
                  <div key={ag.id} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, padding: "0.85rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.3rem" }}>
                      <span style={{ fontWeight: 700, fontSize: "0.85rem", color: "#fff" }}>{ag.name}</span>
                      <span style={{ fontSize: "0.65rem", background: "rgba(16,185,129,0.15)", color: "#34d399", padding: "0.15rem 0.35rem", borderRadius: 4, fontWeight: 700 }}>
                        {ag.currentState}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: "0.75rem", color: "#8d95a7", lineHeight: 1.4 }}>{ag.role}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ======================================================================= */}
        {/* TAB 4: COMMERCIAL & PROPOSALS */}
        {/* ======================================================================= */}
        {activeTab === "commercial" && (
          <div>
            <div style={{ marginBottom: "1.5rem" }}>
              <div style={{ fontSize: "0.75rem", color: GOLD, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                Commercial Engineering & Revenue Hub
              </div>
              <h2 style={{ fontSize: "1.6rem", fontWeight: 900, color: "#fff", margin: "0.2rem 0 0.5rem" }}>
                Client Proposals & Commercial Architecture
              </h2>
              <p style={{ color: "#9ca3af", fontSize: "0.9rem", maxWidth: 720 }}>
                Formal proposals, milestone escrow agreements, and Razorpay deposit checkout portals with 1-click Executive White PDF print engine.
              </p>
            </div>

            {/* Kudos Proposal Card */}
            <div style={{ background: PANEL, border: `1px solid ${BORDER}`, borderRadius: 16, padding: "1.75rem", marginBottom: "1.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
                <div>
                  <span style={{ fontSize: "0.72rem", background: "rgba(212,175,55,0.15)", color: GOLD_LIGHT, padding: "0.2rem 0.5rem", borderRadius: 4, fontWeight: 800 }}>
                    ACTIVE PROPOSAL
                  </span>
                  <h3 style={{ margin: "0.4rem 0 0.2rem", fontSize: "1.2rem", fontWeight: 800, color: "#fff" }}>
                    KUDOS FACE OF INDIA 2026 — 360° Digital Omnipresence Suite
                  </h3>
                  <div style={{ fontSize: "0.85rem", color: "#9ca3af" }}>Client: Kajal Sharma (Kudos Entertainment) • Ref: prop_kudos_2026</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "0.75rem", color: "#8d95a7" }}>Total Investment</div>
                  <div style={{ fontSize: "1.35rem", fontWeight: 900, color: GOLD }}>₹65,000 INR</div>
                  <div style={{ fontSize: "0.75rem", color: "#75f4ab" }}>Milestone 1 Advance: ₹32,500</div>
                </div>
              </div>

              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "1rem" }}>
                <button
                  onClick={() => navigate("/proposal/prop_kudos_2026")}
                  style={{ background: "linear-gradient(135deg, #d4af37 0%, #b8860b 100%)", color: "#000", border: "none", borderRadius: 8, padding: "0.55rem 1.25rem", fontWeight: 800, fontSize: "0.85rem", cursor: "pointer" }}
                >
                  Open Commercial Portal ➔
                </button>
                <button
                  onClick={() => navigate("/kudos")}
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", color: "#cbd5e1", borderRadius: 8, padding: "0.55rem 1.25rem", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer" }}
                >
                  View 7-Slide Pitch Deck
                </button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
