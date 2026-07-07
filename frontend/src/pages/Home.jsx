import React, { useEffect, useState } from "react";
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
import selfBuildEngine from "../selfbuild/SelfBuildEngine";
import { checkHealth, askRag, getDashboardSnapshot } from "../services/api";

export default function Home() {
  const [health, setHealth] = useState("checking");
  const [healthMessage, setHealthMessage] = useState("Awaiting backend response...");
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([
    { role: "garuda", text: "Founder access granted. GARUDA is prepared to orchestrate your next move." }
  ]);
  const [loading, setLoading] = useState(false);
  const [hasEntered, setHasEntered] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [selfBuildState, setSelfBuildState] = useState(null);

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      try {
        const [healthData, snapshot] = await Promise.all([checkHealth(), getDashboardSnapshot()]);
        if (!active) return;

        const snapshotHealth = snapshot?.health?.status || healthData?.status || "healthy";
        const snapshotMessage = snapshot?.health?.message || healthData?.message || "Backend responded successfully.";
        setHealth(snapshotHealth);
        setHealthMessage(snapshotMessage);
        setDashboardData(snapshot);
      } catch (error) {
        if (active) {
          setHealth("offline");
          setHealthMessage("Backend connection unavailable.");
          setDashboardData(null);
        }
      }
    }

    loadDashboard();

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

  async function askGaruda() {
    const q = question.trim();
    if (!q || loading) return;

    setMessages((prev) => [...prev, { role: "user", text: q }]);
    setQuestion("");
    setLoading(true);

    try {
      const data = await askRag(q);
      const answer = data?.answer || data?.message || "No clear answer received.";
      setMessages((prev) => [
        ...prev,
        { role: "garuda", text: answer }
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "garuda", text: "Backend connection failed. The command channel is offline." }
      ]);
    } finally {
      setLoading(false);
    }
  }

  const revenueValue = dashboardData?.metrics?.revenue?.current ?? 0;
  const revenueDetail = dashboardData?.metrics?.revenue?.trend || "Live value";
  const knowledgeCount = dashboardData?.metrics?.knowledgeCore?.count ?? 0;
  const scannerStatus = dashboardData?.metrics?.motherBrain?.scanner?.status || "offline";
  const plannerStatus = dashboardData?.metrics?.motherBrain?.planner?.status || "offline";
  const builderStatus = dashboardData?.metrics?.motherBrain?.builder?.status || "offline";
  const validatorStatus = dashboardData?.metrics?.motherBrain?.validator?.status || "offline";
  const motherBrain = dashboardData?.metrics?.motherBrain || {};

  const metricCards = [
    { icon: "✦", title: "Revenue Universe", value: `₹${revenueValue.toLocaleString()}`, detail: revenueDetail, tone: "gold" },
    { icon: "◌", title: "Mother Brain", value: `${plannerStatus === "ready" ? "Ready" : "Standby"}`, detail: `Scanner ${scannerStatus}`, tone: "silver" },
    { icon: "▣", title: "Creative Studio", value: "Live", detail: "Execution channel", tone: "gold" },
    { icon: "⬢", title: "Knowledge Core", value: knowledgeCount.toLocaleString(), detail: "Indexed documents", tone: "silver" }
  ];

  if (!hasEntered) {
    return <ArrivalExperience onEnter={() => setHasEntered(true)} />;
  }

  return (
    <div className="garuda-shell">
      <Sidebar />

      <section className="workspace">
        <TopBar />
        <AgentDebugPanel />
        <IntelligencePanel />
        <EngineeringPlannerPanel />

        <div className="dashboard-grid">
          <div className="primary-column">
            <motion.header
              className="hero-panel"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
            >
              <div className="hero-panel__content">
                <p className="eyebrow">GARUDA AI OPERATING SYSTEM</p>
                <h1>Command the empire. Let intelligence execute.</h1>
                <p>
                  A luxury operating environment for strategy, execution, knowledge, and growth.
                </p>
              </div>
              <div className="hero-panel__actions">
                <button className="hero-panel__button hero-panel__button--primary">Launch Mission</button>
                <button className="hero-panel__button">View Blueprint</button>
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

            <section className="metrics-grid">
              {metricCards.map((card) => (
                <MetricCard key={card.title} {...card} />
              ))}
            </section>

            <CommandCenter
              messages={messages}
              question={question}
              loading={loading}
              onQuestionChange={setQuestion}
              onSend={askGaruda}
            />
          </div>

          <RightPanel
            health={health}
            healthMessage={healthMessage}
            knowledgeCount={knowledgeCount}
            motherBrain={motherBrain}
          />
        </div>
      </section>
    </div>
  );
}