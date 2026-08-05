import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
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
import selfBuildEngine from "../selfbuild/SelfBuildEngine";
import { checkHealth, askRag, getDashboardSnapshot, fetchThreads, fetchThread, createThread } from "../services/api";

const REVENUE_APP_URL = import.meta.env.VITE_REVENUE_APP_URL || "https://garuda-emergent-revenue.vercel.app/dashboard";

export default function FounderWorkspace({ onLogout }) {
  const [health, setHealth] = useState("checking");
  const [healthMessage, setHealthMessage] = useState("Awaiting backend response...");
  const [question, setQuestion] = useState("");
  const [activeThreadId, setActiveThreadId] = useState(() => localStorage.getItem("garuda_active_thread_id") || null);
  const [threads, setThreads] = useState([]);
  const [messages, setMessages] = useState([
    { role: "garuda", text: "Founder access granted. GARUDA is prepared to orchestrate your next move.", mode: "conversation" }
  ]);
  const [loading, setLoading] = useState(false);
  const [activityState, setActivityState] = useState("Ready");
  const [hasEntered, setHasEntered] = useState(false);
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
    if (label === "Revenue Universe") {
      window.location.href = REVENUE_APP_URL;
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

        let targetThreadId = activeThreadId;
        if (!targetThreadId && threadList && threadList.length > 0) {
          targetThreadId = threadList[0].threadId;
        }

        if (targetThreadId) {
          const loadedThread = await fetchThread(targetThreadId);
          if (loadedThread && Array.isArray(loadedThread.messages) && loadedThread.messages.length > 0) {
            setActiveThreadId(targetThreadId);
            localStorage.setItem("garuda_active_thread_id", targetThreadId);
            setMessages(loadedThread.messages);
          }
        }
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
      const answer = data?.answer || data?.message || "GARUDA Command Console is active.";
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
        { role: "garuda", text: `Namaste Founder! Main aapki query "${q}" samajh gaya hoon. GARUDA Command Console active hai aur aapke next directive ke liye ready hai!`, mode: "conversation" }
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

  if (!hasEntered) {
    return (
      <ArrivalExperience
        onEnter={() => {
          setHasEntered(true);
          window.scrollTo(0, 0);
        }}
      />
    );
  }

  return (
    <div className="garuda-shell">
      <Sidebar onSelectNav={handleSelectNav} />

      <section className="workspace">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <TopBar />
          {onLogout && (
            <button
              onClick={onLogout}
              style={{
                marginRight: "1.5rem",
                background: "rgba(239, 68, 68, 0.15)",
                color: "#f87171",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                padding: "0.4rem 1rem",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: "0.85rem"
              }}
            >
              Sign Out
            </button>
          )}
        </div>

        <AgentDebugPanel />
        <IntelligencePanel />
        <EngineeringPlannerPanel />
        <MotherBrainPanel />
        <LearningPanel />

        <div className="dashboard-grid">
          <div className="primary-column">
            <motion.header
              className="hero-panel"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
            >
              <div className="hero-panel__content">
                <p className="eyebrow">GARUDA AI FOUNDER DESKTOP</p>
                <h1>Autonomous Intelligence Control.<br />Human Accountability.</h1>
                <p>
                  Governed execution, strategy control, and live multi-brain telemetry.
                </p>
              </div>
              <div className="hero-panel__actions">
                <button
                  className="hero-panel__button hero-panel__button--primary"
                  onClick={handleRequestProposal}
                >
                  Command Console
                </button>
                <button
                  className="hero-panel__button"
                  onClick={handleViewCapabilities}
                >
                  View Systems
                </button>
              </div>
            </motion.header>

            {selfBuildState ? (
              <section className="selfbuild-panel" aria-label="Self-build intelligence panel">
                <p className="eyebrow">SELF-BUILDING INTELLIGENCE</p>
                <p>Architecture Score: {selfBuildState.intelligenceScores?.architectureScore ?? 0}</p>
                <p>Code Quality Score: {selfBuildState.intelligenceScores?.codeQualityScore ?? 0}</p>
                <p>Knowledge Score: {selfBuildState.intelligenceScores?.knowledgeScore ?? 0}</p>
                <p>Founder approval required before implementation.</p>
              </section>
            ) : null}

            <section className="metrics-grid" ref={metricsGridRef}>
              {metricCards.map((card) => (
                <MetricCard
                  key={card.title}
                  {...card}
                  onClick={card.title === "Revenue Universe" ? () => handleSelectNav("Revenue Universe") : undefined}
                />
              ))}
            </section>

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
          </div>

          <RightPanel
            health={health}
            healthMessage={healthMessage}
            knowledgeCount={knowledgeCount}
            motherBrain={motherBrain}
            onSelectNav={handleSelectNav}
          />
        </div>
      </section>
    </div>
  );
}
