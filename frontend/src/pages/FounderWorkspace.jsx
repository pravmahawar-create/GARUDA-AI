import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import TopBar from "../components/TopBar";
import MetricCard from "../components/MetricCard";
import RightPanel from "../components/RightPanel";
import CommandCenter from "../components/CommandCenter";
import ArrivalExperience from "../components/ArrivalExperience";
import AgentDebugPanel from "../components/AgentDebugPanel";
import IntelligencePanel from "../components/IntelligencePanel";
import EngineeringPlannerPanel from "../components/EngineeringPlannerPanel";
import MotherBrainPanel from "../components/MotherBrainPanel";
import LearningPanel from "../components/LearningPanel";
import FounderUniversesStrip from "../components/FounderUniversesStrip";
import MissionControlPanel from "../components/MissionControlPanel";
import Sparkline from "../components/charts/Sparkline";
import DonutChart from "../components/charts/DonutChart";
import selfBuildEngine from "../selfbuild/SelfBuildEngine";
import { checkHealth, askRag, getDashboardSnapshot, fetchThreads, fetchThread, createThread } from "../services/api";

export default function FounderWorkspace({ onLogout }) {
  const navigate = useNavigate();
  const [health, setHealth] = useState("checking");
  const [healthMessage, setHealthMessage] = useState("Awaiting backend response...");
  const [question, setQuestion] = useState("");
  const [activeThreadId, setActiveThreadId] = useState(null);
  const [threads, setThreads] = useState([]);
  const [messages, setMessages] = useState([
    { role: "garuda", text: "Founder access granted. GARUDA is prepared to orchestrate your next move.", mode: "conversation" }
  ]);
  const [loading, setLoading] = useState(false);
  const [activityState, setActivityState] = useState("Ready");
  const [hasEntered, setHasEntered] = useState(() => Boolean(sessionStorage.getItem("garuda_has_entered")));
  const [dashboardData, setDashboardData] = useState(null);
  const [selfBuildState, setSelfBuildState] = useState(null);
  const [activeNav, setActiveNav] = useState("Dashboard");

  const commandCenterRef = useRef(null);
  const metricsGridRef = useRef(null);

  const handleRequestProposal = () => {
    commandCenterRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleViewCapabilities = () => {
    metricsGridRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSelectNav = (label) => {
    if (label === "GARUDA Kingdom") {
      navigate("/founder/access");
      return;
    }
    if (label === "Revenue Universe") {
      navigate("/revenue");
      return;
    }
    if (label === "Sales Cockpit") {
      navigate("/founder/acquisition");
      return;
    }
    if (label === "Creative Universe") {
      navigate("/creative");
      return;
    }
    if (label === "Content Factory") {
      navigate("/content");
      return;
    }
    if (label === "Brand Studio") {
      navigate("/brand");
      return;
    }
    if (label === "Digital Presence") {
      navigate("/digital-presence");
      return;
    }
    if (label === "Entertainment Studio") {
      navigate("/entertainment");
      return;
    }
    if (label === "Knowledge") {
      navigate("/chat");
      return;
    }
    if (label === "Projects") {
      navigate("/app");
      return;
    }
    setActiveNav(label);
  };

  useEffect(() => {
    let active = true;

    async function loadDashboardAndThreads() {
      try {
        const [healthData, snapshot, threadList] = await Promise.all([
          checkHealth(),
          getDashboardSnapshot(),
          fetchThreads()
        ]);
        if (!active) return;

        const snapshotHealth = snapshot?.health?.status || healthData?.status || "healthy";
        const snapshotMessage = snapshot?.health?.message || healthData?.message || "Backend responded successfully.";
        setHealth(snapshotHealth);
        setHealthMessage(snapshotMessage);
        setDashboardData(snapshot);
        setThreads(threadList || []);
      } catch (error) {
        if (active) {
          setHealth("offline");
          setHealthMessage("Backend connection unavailable.");
          setDashboardData(null);
        }
      }
    }

    loadDashboardAndThreads();

    try {
      setSelfBuildState(selfBuildEngine.analyze({
        projectStructure: ["frontend", "src", "scripts", "docs", "data"],
        modules: ["arrival", "dashboard", "knowledge", "rag", "mother"],
        dependencies: ["react", "vite", "express", "mongoose", "framer-motion"]
      }));
    } catch {
      setSelfBuildState(null);
    }

    return () => {
      active = false;
    };
  }, []);

  const handleNewThread = async () => {
    const newThread = await createThread();
    if (newThread && newThread.threadId) {
      setActiveThreadId(newThread.threadId);
      localStorage.setItem("garuda_active_thread_id", newThread.threadId);
      setMessages(newThread.messages || [
        { role: "garuda", text: "Founder access granted. GARUDA is prepared to orchestrate your next move.", mode: "conversation" }
      ]);
      const threadList = await fetchThreads();
      setThreads(threadList);
    }
  };

  const handleSelectThread = async (tId) => {
    if (!tId) return;
    setActiveThreadId(tId);
    localStorage.setItem("garuda_active_thread_id", tId);
    const loaded = await fetchThread(tId);
    if (loaded && Array.isArray(loaded.messages)) {
      setMessages(loaded.messages);
    }
  };

  async function askGaruda() {
    const q = question.trim();
    if (!q || loading) return;

    let currentThreadId = activeThreadId;
    if (!currentThreadId) {
      const created = await createThread();
      if (created && created.threadId) {
        currentThreadId = created.threadId;
        setActiveThreadId(currentThreadId);
        localStorage.setItem("garuda_active_thread_id", currentThreadId);
      }
    }

    const userMsg = { role: "user", text: q, mode: "conversation" };
    setMessages((prev) => [...prev, userMsg]);
    setQuestion("");
    setLoading(true);
    setActivityState("Understanding request");

    // History for multi-turn context
    const historyPayload = messages.map((m) => ({
      role: m.role,
      content: m.text,
      mode: m.mode
    }));

    try {
      setActivityState("Processing & Executing Mission");
      const data = await askRag(q, currentThreadId, historyPayload);
      setActivityState("Preparing response");
      const answer = data?.answer || data?.message || "GARUDA engines are temporarily unavailable. Please try again.";
      const garudaMsg = {
        role: "garuda",
        text: answer,
        mode: data?.mode || "conversation",
        missionStatus: data?.missionStatus || null,
        evidence: data?.evidence || null
      };

      setMessages((prev) => [...prev, garudaMsg]);

      if (data?.threadId) {
        setActiveThreadId(data.threadId);
        localStorage.setItem("garuda_active_thread_id", data.threadId);
      }

      const updatedList = await fetchThreads();
      setThreads(updatedList);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "garuda", text: "GARUDA could not reach the AI engine for that request. Please try again in a moment.", mode: "conversation" }
      ]);
    } finally {
      setLoading(false);
      setActivityState("Ready");
    }
  }

  const revenueValue = dashboardData?.metrics?.revenue?.current ?? 0;
  const revenueDetail = dashboardData?.metrics?.revenue?.trend || "Live value";
  const knowledgeCount = dashboardData?.metrics?.knowledgeCore?.count ?? 0;
  const scannerStatus = dashboardData?.metrics?.motherBrain?.scanner?.status || "offline";
  const plannerStatus = dashboardData?.metrics?.motherBrain?.planner?.status || "offline";
  const motherBrain = dashboardData?.metrics?.motherBrain || {};

  const metricCards = [
    { icon: "✦", title: "Revenue Universe", value: `₹${revenueValue.toLocaleString()}`, detail: revenueDetail, tone: "gold" },
    { icon: "◌", title: "Mother Brain", value: `${plannerStatus === "ready" ? "Ready" : "Standby"}`, detail: `Scanner ${scannerStatus}`, tone: "silver" },
    { icon: "▣", title: "Creative Studio", value: "Live", detail: "Execution channel", tone: "gold" },
    { icon: "⬢", title: "Knowledge Core", value: knowledgeCount.toLocaleString(), detail: "Indexed documents", tone: "silver" }
  ];

  const revenueTrend = Array.isArray(dashboardData?.metrics?.revenue?.series)
    ? dashboardData.metrics.revenue.series
    : [0, 0.5, 1.2, 2, 1.6, 3.4, 3.1, 4.8, 5.2, 6.1];

  const universeMix = Array.isArray(dashboardData?.metrics?.universes)
    ? dashboardData.metrics.universes
    : [
        { label: "Active", value: 15, color: "#16a34a" },
        { label: "Primary", value: 1, color: "#2563eb" },
        { label: "Locked", value: 8, color: "#7c3aed" },
        { label: "Roadmap", value: 3, color: "#8b94a6" }
      ];

  if (!hasEntered) {
    return (
      <ArrivalExperience
        onEnter={() => {
          sessionStorage.setItem("garuda_has_entered", "true");
          setHasEntered(true);
          window.scrollTo(0, 0);
        }}
      />
    );
  }

  const handleSignOut = () => {
    sessionStorage.removeItem("garuda_has_entered");
    if (typeof onLogout === "function") {
      onLogout();
    }
  };

  return (
    <div className="founder-fd">
      <Sidebar onSelectNav={handleSelectNav} onSignOut={handleSignOut} />

      <section className="workspace" style={{ flex: 1, minWidth: 0, padding: "1.5rem clamp(1rem, 3vw, 2.5rem) 3rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        <TopBar />

        {/* Mission Control Cockpit */}
        <section className="fd-card" style={{ padding: "1.5rem" }}>
          <MissionControlPanel />
        </section>

        {/* Hero banner — primary focal point (prototype spec) */}
        <motion.section
          className="fd-hero"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "1.5rem", alignItems: "center", flexWrap: "wrap" }}
        >
          <div>
            <p className="fd-eyebrow">GARUDA AI FOUNDER DESKTOP</p>
            <h1 className="fd-heading" style={{ fontSize: "clamp(1.7rem, 3.4vw, 2.4rem)", lineHeight: 1.12, margin: "0.6rem 0 0.8rem" }}>
              Autonomous Intelligence Control.<br />Human Accountability.
            </h1>
            <p style={{ color: "var(--fd-muted)", fontSize: "0.98rem", lineHeight: 1.6, maxWidth: 620, margin: 0 }}>
              Governed execution, strategy control, and live multi-brain telemetry — with every significant action under founder oversight.
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.7rem", minWidth: 200 }}>
            <button className="hero-panel__button hero-panel__button--primary" onClick={handleRequestProposal}>
              Command Console
            </button>
            <button className="hero-panel__button" onClick={handleViewCapabilities}>
              View Systems
            </button>
            <button
              type="button"
              onClick={() => navigate("/revenue")}
              style={{ background: "rgba(212,175,55,0.12)", border: "1px solid rgba(212,175,55,0.5)", color: "#d4af37", padding: "0.7rem 1.1rem", borderRadius: 14, fontWeight: 800, cursor: "pointer", fontSize: "0.9rem" }}
            >
              Revenue Console ⟡
            </button>
          </div>
        </motion.section>

        {/* Stat cards */}
        <section className="metrics-grid" ref={metricsGridRef} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "1rem" }}>
          {metricCards.map((card) => (
            <MetricCard
              key={card.title}
              {...card}
              onClick={card.title === "Revenue Universe" ? () => handleSelectNav("Revenue Universe") : undefined}
            />
          ))}
        </section>

        {/* Charts row — line + donut (prototype spec) */}
        <section style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.6fr) minmax(260px, 0.9fr)", gap: "1.25rem", flexWrap: "wrap" }} className="fd-charts">
          <div className="fd-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.9rem", flexWrap: "wrap", gap: "0.5rem" }}>
              <div>
                <p className="fd-eyebrow">REVENUE TREND</p>
                <h3 className="fd-heading" style={{ margin: "0.3rem 0 0", fontSize: "1.15rem" }}>Income signal</h3>
              </div>
              <span style={{ color: "var(--fd-muted)", fontSize: "0.78rem" }}>{revenueDetail}</span>
            </div>
            <Sparkline data={revenueTrend} label="Revenue trend" value={`₹${revenueValue.toLocaleString()}`} color="#d4af37" />
          </div>
          <div className="fd-card" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.9rem" }}>
            <div style={{ width: "100%" }}>
              <p className="fd-eyebrow">UNIVERSE MIX</p>
              <h3 className="fd-heading" style={{ margin: "0.3rem 0 0", fontSize: "1.15rem" }}>27-universe distribution</h3>
            </div>
            <DonutChart segments={universeMix} centerLabel="27" centerSub="Universes" />
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem", justifyContent: "center" }}>
              {universeMix.map((s) => (
                <span key={s.label} style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", fontSize: "0.74rem", color: "var(--fd-muted)" }}>
                  <span style={{ width: 9, height: 9, borderRadius: "50%", background: s.color }} />
                  {s.label} · {s.value}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Inner Core — founder universes strip */}
        <FounderUniversesStrip onSelectNav={handleSelectNav} />

        {/* Self-build intelligence (kept) */}
        {selfBuildState ? (
          <section className="selfbuild-panel" aria-label="Self-build intelligence panel">
            <p className="eyebrow">SELF-BUILDING INTELLIGENCE</p>
            <p>Architecture Score: {selfBuildState.intelligenceScores?.architectureScore ?? 0}</p>
            <p>Code Quality Score: {selfBuildState.intelligenceScores?.codeQualityScore ?? 0}</p>
            <p>Knowledge Score: {selfBuildState.intelligenceScores?.knowledgeScore ?? 0}</p>
            <p>Founder approval required before implementation.</p>
          </section>
        ) : null}

        {/* Governance panels (kept intact) */}
        <AgentDebugPanel />
        <IntelligencePanel />
        <EngineeringPlannerPanel />
        <MotherBrainPanel />
        <LearningPanel />

        <div ref={commandCenterRef}>
          <CommandCenter
            messages={messages}
            question={question}
            loading={loading}
            activityState={activityState}
            threads={threads}
            activeThreadId={activeThreadId}
            onSelectThread={handleSelectThread}
            onNewThread={handleNewThread}
            onQuestionChange={setQuestion}
            onSend={askGaruda}
          />
        </div>

        {/* Conversation list — prototype spec */}
        <section className="fd-card" aria-label="Conversations">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.9rem" }}>
            <div>
              <p className="fd-eyebrow">THREADS</p>
              <h3 className="fd-heading" style={{ margin: "0.25rem 0 0", fontSize: "1.15rem" }}>Recent conversations</h3>
            </div>
            <button type="button" onClick={handleNewThread} style={{ background: "rgba(212,175,55,0.12)", color: "#d4af37", border: "1px solid rgba(212,175,55,0.4)", padding: "0.45rem 1rem", borderRadius: 12, fontWeight: 600, fontSize: "0.82rem", cursor: "pointer" }}>
              + New Thread
            </button>
          </div>
          {threads.length === 0 ? (
            <p style={{ color: "var(--fd-muted)", fontSize: "0.88rem", margin: 0 }}>No conversations yet — start one in Command Console above.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem" }}>
              {threads.slice(0, 8).map((t) => (
                <button
                  key={t.id || t.threadId}
                  type="button"
                  onClick={() => handleSelectThread(t.threadId || t.id)}
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", textAlign: "left", background: "var(--fd-panel)", border: "1px solid var(--fd-line)", borderRadius: 14, padding: "0.8rem 1rem", cursor: "pointer", color: "inherit", font: "inherit" }}
                >
                  <span style={{ fontWeight: 600, fontSize: "0.9rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {t.title || "Untitled conversation"}
                  </span>
                  <span style={{ color: "var(--fd-muted)", fontSize: "0.76rem", whiteSpace: "nowrap" }}>
                    {t.messageCount !== undefined ? `${t.messageCount} msg` : ""}
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>

        <RightPanel
          health={health}
          healthMessage={healthMessage}
          knowledgeCount={knowledgeCount}
          motherBrain={motherBrain}
          onSelectNav={handleSelectNav}
        />
      </section>
    </div>
  );
}