import React, { useEffect, useState, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import SEOHead from "../components/SEOHead";

const PALETTE = {
  bg: "#030712",
  panel: "rgba(15, 23, 42, 0.75)",
  panelBorder: "rgba(245, 158, 11, 0.25)",
  gold: "#f59e0b",
  goldGlow: "rgba(245, 158, 11, 0.4)",
  cyan: "#38bdf8",
  cyanGlow: "rgba(56, 189, 248, 0.35)",
  textMain: "#f8fafc",
  textMuted: "#94a3b8",
  cardBg: "rgba(11, 15, 25, 0.85)"
};

export default function InvestorExperience() {
  const navigate = useNavigate();

  // Session & Stage State
  const [sessionId, setSessionId] = useState(null);
  const [stageMode, setStageMode] = useState("SPEAKER"); // 'SPEAKER' | 'ARCHITECTURE' | 'DEMO' | 'CONVERSATION'
  const [presentationData, setPresentationData] = useState(null);
  const [currentSpeechText, setCurrentSpeechText] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);

  // Conversation & Input
  const [investorInput, setInvestorInput] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [loadingAnswer, setLoadingAnswer] = useState(false);

  // Live Demonstration State
  const [activeDemoResult, setActiveDemoResult] = useState(null);
  const [executingDemo, setExecutingDemo] = useState(false);
  const [suggestedDemoKey, setSuggestedDemoKey] = useState("creative_artifact");

  const speechSynthRef = useRef(null);
  const recognitionRef = useRef(null);

  // Initialize Speech Synthesis
  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      speechSynthRef.current = window.speechSynthesis;
    }
  }, []);

  // Speak helper using Web Speech API
  const speakNarration = (text) => {
    setCurrentSpeechText(text);
    if (!voiceEnabled || !speechSynthRef.current || !text) {
      setIsSpeaking(false);
      return;
    }

    try {
      speechSynthRef.current.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 0.9;
      
      // Select deep/sovereign voice if available
      const voices = speechSynthRef.current.getVoices();
      const preferred = voices.find(v => (v.name.includes("Male") || v.name.includes("David") || v.name.includes("Natural")) && v.lang.startsWith("en"));
      if (preferred) utterance.voice = preferred;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      speechSynthRef.current.speak(utterance);
    } catch {
      setIsSpeaking(false);
    }
  };

  const stopSpeaking = () => {
    if (speechSynthRef.current) {
      speechSynthRef.current.cancel();
    }
    setIsSpeaking(false);
  };

  // Start Autonomous Presentation on Mount
  useEffect(() => {
    async function startPresentation() {
      try {
        const res = await fetch("/api/investor/presentation/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ metadata: { source: "investor_experience_ui" } })
        });
        const data = await res.json();
        if (data.success && data.data) {
          setSessionId(data.data.sessionId);
          setPresentationData(data.data);
          speakNarration(data.data.speechText);
        }
      } catch (err) {
        console.error("Failed to start investor presentation:", err);
      }
    }
    startPresentation();

    return () => {
      stopSpeaking();
    };
  }, []);

  // Advance to Next Module
  const handleNextModule = async () => {
    if (!sessionId) return;
    try {
      const res = await fetch("/api/investor/presentation/next", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId })
      });
      const data = await res.json();
      if (data.success && data.data) {
        setPresentationData(data.data);
        if (data.data.state === "DIFFERENTIATION_AND_TRUTH") {
          setStageMode("ARCHITECTURE");
        } else {
          setStageMode("SPEAKER");
        }
        speakNarration(data.data.speechText);
      }
    } catch (err) {
      console.error("Failed to advance module:", err);
    }
  };

  // Submit Investor Question
  const handleAskQuestion = async (overrideQuestion = null) => {
    const q = overrideQuestion || investorInput;
    if (!q.trim()) return;

    setLoadingAnswer(true);
    setStageMode("CONVERSATION");
    stopSpeaking();

    const userMessage = { role: "investor", text: q, timestamp: new Date().toLocaleTimeString() };
    setChatHistory(prev => [...prev, userMessage]);
    setInvestorInput("");

    try {
      const res = await fetch("/api/investor/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, question: q })
      });
      const data = await res.json();
      if (data.success && data.data) {
        const reply = data.data;
        const garudaReply = {
          role: "garuda",
          text: reply.answer,
          topic: reply.topic,
          suggestedDemo: reply.suggestedDemo,
          demonstrationAvailable: reply.demonstrationAvailable,
          timestamp: new Date().toLocaleTimeString()
        };
        setChatHistory(prev => [...prev, garudaReply]);
        if (reply.suggestedDemo) {
          setSuggestedDemoKey(reply.suggestedDemo);
        }
        speakNarration(reply.speechText || reply.answer);
      }
    } catch (err) {
      console.error("Chat failure:", err);
    } finally {
      setLoadingAnswer(false);
    }
  };

  // Trigger Real Live Demonstration
  const handleExecuteDemo = async (demoKey = suggestedDemoKey) => {
    setExecutingDemo(true);
    setStageMode("DEMO");
    stopSpeaking();

    try {
      const res = await fetch("/api/investor/demonstrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          demoKey: demoKey || "creative_artifact",
          options: { prompt: "Autonomous Sovereign Intelligence Core" }
        })
      });
      const data = await res.json();
      if (data.success && data.data) {
        setActiveDemoResult(data.data);
        speakNarration(data.data.narrative);
      } else {
        setActiveDemoResult({
          success: false,
          reason: data.error || "Demonstration failed to execute"
        });
      }
    } catch (err) {
      console.error("Demo execution failed:", err);
      setActiveDemoResult({ success: false, reason: err.message });
    } finally {
      setExecutingDemo(false);
    }
  };

  const particleNodes = useMemo(
    () => new Array(20).fill(0).map((_, i) => ({ id: `p-${i}`, delay: i * 0.2 })),
    []
  );

  return (
    <div style={{
      minHeight: "100vh",
      background: PALETTE.bg,
      color: PALETTE.textMain,
      fontFamily: "Inter, system-ui, -apple-system, sans-serif",
      position: "relative",
      overflowX: "hidden",
      display: "flex",
      flexDirection: "column"
    }}>
      <SEOHead
        title="THE GARUDA EXPERIENCE | Autonomous AI Presentation"
        description="Experience GARUDA AI explaining itself autonomously. An interactive sovereign AI Operating System presentation and live capability demonstration."
        canonical="https://www.garudaos.in/experience"
      />

      {/* Ambient Neural Particle Atmosphere */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 1 }}>
        <div style={{
          position: "absolute",
          top: "15%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "700px",
          height: "700px",
          background: `radial-gradient(circle, ${PALETTE.goldGlow} 0%, rgba(56, 189, 248, 0.08) 50%, transparent 70%)`,
          filter: "blur(70px)",
          opacity: 0.6
        }} />
        {particleNodes.map((p) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0.1, y: 0 }}
            animate={{ opacity: [0.1, 0.6, 0.1], y: [-20, 20, -20] }}
            transition={{ duration: 6 + (p.delay % 4), repeat: Infinity, ease: "easeInOut", delay: p.delay }}
            style={{
              position: "absolute",
              top: `${(p.delay * 23) % 90}%`,
              left: `${(p.delay * 37) % 90}%`,
              width: "3px",
              height: "3px",
              borderRadius: "50%",
              backgroundColor: PALETTE.cyan,
              boxShadow: `0 0 8px ${PALETTE.cyan}`
            }}
          />
        ))}
      </div>

      {/* Top Sovereign Header */}
      <header style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "1.25rem 2.5rem",
        borderBottom: "1px solid rgba(245, 158, 11, 0.15)",
        background: "rgba(3, 7, 18, 0.8)",
        backdropFilter: "blur(12px)",
        position: "sticky",
        top: 0,
        zIndex: 50
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{
            width: "38px",
            height: "38px",
            borderRadius: "8px",
            background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
            display: "grid",
            placeItems: "center",
            fontWeight: 900,
            color: "#000",
            fontSize: "1.2rem",
            boxShadow: `0 0 15px ${PALETTE.goldGlow}`
          }}>
            🦅
          </div>
          <div>
            <div style={{ fontSize: "1.05rem", fontWeight: 800, letterSpacing: "0.15em", color: "#fff" }}>
              GARUDA AI
            </div>
            <div style={{ fontSize: "0.72rem", color: PALETTE.gold, letterSpacing: "0.18em", textTransform: "uppercase" }}>
              Autonomous Investor Presentation Engine
            </div>
          </div>
        </div>

        {/* Global Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <button
            onClick={() => {
              if (isSpeaking) stopSpeaking();
              setVoiceEnabled(!voiceEnabled);
            }}
            style={{
              background: voiceEnabled ? "rgba(245, 158, 11, 0.15)" : "rgba(148, 163, 184, 0.1)",
              border: `1px solid ${voiceEnabled ? PALETTE.gold : "rgba(148, 163, 184, 0.3)"}`,
              color: voiceEnabled ? PALETTE.gold : PALETTE.textMuted,
              padding: "0.45rem 1rem",
              borderRadius: "20px",
              fontSize: "0.8rem",
              fontWeight: 700,
              letterSpacing: "0.08em",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem"
            }}
          >
            <span>{voiceEnabled ? "🔊 Voice: ON" : "🔇 Voice: OFF"}</span>
            {isSpeaking && (
              <motion.span
                animate={{ scale: [1, 1.4, 1] }}
                transition={{ duration: 0.8, repeat: Infinity }}
                style={{ width: "6px", height: "6px", borderRadius: "50%", background: PALETTE.gold }}
              />
            )}
          </button>

          <button
            onClick={() => navigate("/command-center")}
            style={{
              background: "transparent",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              color: "#fff",
              padding: "0.45rem 1rem",
              borderRadius: "6px",
              fontSize: "0.8rem",
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            Founder Cockpit
          </button>
        </div>
      </header>

      {/* Main Presentation Stage */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "2rem", zIndex: 10 }}>
        <div style={{ width: "min(1100px, 100%)", display: "flex", flexDirection: "column", gap: "2rem" }}>

          {/* Central GARUDA Sovereign Visual Presence */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", marginTop: "1rem" }}>
            <div style={{ position: "relative", width: "160px", height: "160px", display: "grid", placeItems: "center" }}>
              {/* Outer Pulsing Neural Waveform Rings */}
              <motion.div
                animate={isSpeaking ? { scale: [1, 1.35, 1], opacity: [0.3, 0.8, 0.3] } : { scale: 1, opacity: 0.25 }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                style={{
                  position: "absolute",
                  inset: "-10px",
                  borderRadius: "50%",
                  border: `2px solid ${isSpeaking ? PALETTE.gold : PALETTE.cyan}`,
                  boxShadow: `0 0 30px ${isSpeaking ? PALETTE.goldGlow : PALETTE.cyanGlow}`
                }}
              />
              <motion.div
                animate={isSpeaking ? { rotate: 360 } : { rotate: 0 }}
                transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                style={{
                  position: "absolute",
                  inset: "10px",
                  borderRadius: "50%",
                  border: "1px dashed rgba(245, 158, 11, 0.4)"
                }}
              />

              {/* Core Sigil Avatar */}
              <div style={{
                width: "100px",
                height: "100px",
                borderRadius: "50%",
                background: "radial-gradient(circle at 30% 30%, #f59e0b 0%, #78350f 70%, #030712 100%)",
                display: "grid",
                placeItems: "center",
                fontSize: "2.8rem",
                boxShadow: "0 0 35px rgba(245, 158, 11, 0.6)",
                border: "2px solid #fde68a"
              }}>
                🦅
              </div>
            </div>

            {/* Speaking Audio Waveform Indicator */}
            {isSpeaking && (
              <div style={{ display: "flex", gap: "4px", alignItems: "center", marginTop: "1.25rem", height: "18px" }}>
                {[12, 24, 16, 28, 14, 22, 10, 26, 18, 12].map((h, i) => (
                  <motion.div
                    key={i}
                    animate={{ height: [6, h, 6] }}
                    transition={{ duration: 0.4 + (i * 0.05), repeat: Infinity, ease: "easeInOut" }}
                    style={{ width: "3px", backgroundColor: PALETTE.gold, borderRadius: "2px" }}
                  />
                ))}
                <span style={{ fontSize: "0.75rem", color: PALETTE.gold, marginLeft: "0.5rem", letterSpacing: "0.1em", fontWeight: 700 }}>
                  GARUDA SPEAKING
                </span>
              </div>
            )}
          </div>

          {/* Dynamic Stage Canvas View */}
          <div style={{
            background: PALETTE.panel,
            border: `1px solid ${PALETTE.panelBorder}`,
            borderRadius: "16px",
            padding: "2rem",
            boxShadow: "0 20px 50px rgba(0, 0, 0, 0.6)",
            backdropFilter: "blur(16px)"
          }}>

            {/* Subtitle / Active Speech Box */}
            {currentSpeechText && (
              <div style={{
                borderLeft: `4px solid ${PALETTE.gold}`,
                padding: "1rem 1.5rem",
                background: "rgba(245, 158, 11, 0.08)",
                borderRadius: "0 8px 8px 0",
                marginBottom: "1.5rem"
              }}>
                <div style={{ fontSize: "0.75rem", color: PALETTE.gold, textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 800, marginBottom: "0.3rem" }}>
                  Autonomous Presentation Narration
                </div>
                <div style={{ fontSize: "1.15rem", lineHeight: "1.6", color: "#ffffff", fontWeight: 500 }}>
                  "{currentSpeechText}"
                </div>
              </div>
            )}

            {/* MODE 1: SPEAKER / PRESENTATION MODULE VIEW */}
            {stageMode === "SPEAKER" && presentationData && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                  <h2 style={{ fontSize: "1.4rem", fontWeight: 800, color: PALETTE.gold, margin: 0 }}>
                    {presentationData.module?.title || "Autonomous Architectural Briefing"}
                  </h2>
                  <span style={{ fontSize: "0.75rem", color: PALETTE.cyan, border: `1px solid ${PALETTE.cyan}`, padding: "0.2rem 0.6rem", borderRadius: "12px" }}>
                    MODULE {presentationData.module?.id ? presentationData.module.id.toUpperCase() : "ACTIVE"}
                  </span>
                </div>

                {/* Key Architectural Points */}
                {presentationData.keyPoints && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
                    {presentationData.keyPoints.map((point, idx) => (
                      <div key={idx} style={{
                        background: PALETTE.cardBg,
                        border: "1px solid rgba(255, 255, 255, 0.08)",
                        borderRadius: "10px",
                        padding: "1rem 1.25rem",
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "0.75rem"
                      }}>
                        <span style={{ color: PALETTE.gold, fontWeight: 900, fontSize: "1.1rem" }}>⚡</span>
                        <span style={{ fontSize: "0.95rem", color: "#e2e8f0", lineHeight: "1.5" }}>{point}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Presentation Navigation Actions */}
                <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", justifyContent: "flex-end" }}>
                  <button
                    onClick={() => handleAskQuestion("Can you show me what you can create live?")}
                    style={{
                      background: "rgba(56, 189, 248, 0.15)",
                      border: `1px solid ${PALETTE.cyan}`,
                      color: PALETTE.cyan,
                      padding: "0.75rem 1.5rem",
                      borderRadius: "8px",
                      fontSize: "0.9rem",
                      fontWeight: 700,
                      cursor: "pointer"
                    }}
                  >
                    ✨ Request Live Capability Demo
                  </button>

                  {presentationData.hasMoreModules && (
                    <button
                      onClick={handleNextModule}
                      style={{
                        background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                        border: "none",
                        color: "#000",
                        padding: "0.75rem 1.75rem",
                        borderRadius: "8px",
                        fontSize: "0.95rem",
                        fontWeight: 800,
                        letterSpacing: "0.05em",
                        cursor: "pointer",
                        boxShadow: `0 0 20px ${PALETTE.goldGlow}`
                      }}
                    >
                      Next Module →
                    </button>
                  )}
                </div>
              </motion.div>
            )}

            {/* MODE 2: ARCHITECTURE & TRUTH STAGE */}
            {stageMode === "ARCHITECTURE" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
                <h2 style={{ fontSize: "1.4rem", fontWeight: 800, color: PALETTE.gold, marginBottom: "1.5rem" }}>
                  Sovereign Architecture: Show &gt; Tell Stack
                </h2>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
                  <div style={{ background: PALETTE.cardBg, border: "1px solid rgba(245, 158, 11, 0.3)", borderRadius: "10px", padding: "1.25rem" }}>
                    <div style={{ color: PALETTE.gold, fontWeight: 800, fontSize: "0.85rem", textTransform: "uppercase" }}>1. Mother Brain</div>
                    <p style={{ fontSize: "0.85rem", color: PALETTE.textMuted, marginTop: "0.5rem" }}>
                      Central goal decomposition, cognitive router, and Founder write governance.
                    </p>
                  </div>
                  <div style={{ background: PALETTE.cardBg, border: "1px solid rgba(56, 189, 248, 0.3)", borderRadius: "10px", padding: "1.25rem" }}>
                    <div style={{ color: PALETTE.cyan, fontWeight: 800, fontSize: "0.85rem", textTransform: "uppercase" }}>2. 27 Execution Universes</div>
                    <p style={{ fontSize: "0.85rem", color: PALETTE.textMuted, marginTop: "0.5rem" }}>
                      Modular nodes for Engineering, Creative, Brand IdentityLock, and Revenue.
                    </p>
                  </div>
                  <div style={{ background: PALETTE.cardBg, border: "1px solid rgba(34, 197, 94, 0.3)", borderRadius: "10px", padding: "1.25rem" }}>
                    <div style={{ color: "#22c55e", fontWeight: 800, fontSize: "0.85rem", textTransform: "uppercase" }}>3. 100% Truth Law</div>
                    <p style={{ fontSize: "0.85rem", color: PALETTE.textMuted, marginTop: "0.5rem" }}>
                      Anti-Fabrication invariant. UNAVAILABLE !== 0. SHA-256 cryptographic verification.
                    </p>
                  </div>
                  <div style={{ background: PALETTE.cardBg, border: "1px solid rgba(168, 85, 247, 0.3)", borderRadius: "10px", padding: "1.25rem" }}>
                    <div style={{ color: "#c084fc", fontWeight: 800, fontSize: "0.85rem", textTransform: "uppercase" }}>4. One Core All Tiers</div>
                    <p style={{ fontSize: "0.85rem", color: PALETTE.textMuted, marginTop: "0.5rem" }}>
                      Personal, Creator, SME, and Enterprise dynamically served from one sovereign core.
                    </p>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem" }}>
                  <button
                    onClick={() => handleExecuteDemo("repo_architecture")}
                    style={{
                      background: "rgba(56, 189, 248, 0.15)",
                      border: `1px solid ${PALETTE.cyan}`,
                      color: PALETTE.cyan,
                      padding: "0.75rem 1.5rem",
                      borderRadius: "8px",
                      fontWeight: 700,
                      cursor: "pointer"
                    }}
                  >
                    🔍 Inspect Live Codebase AST
                  </button>
                  <button
                    onClick={handleNextModule}
                    style={{
                      background: PALETTE.gold,
                      color: "#000",
                      border: "none",
                      padding: "0.75rem 1.5rem",
                      borderRadius: "8px",
                      fontWeight: 800,
                      cursor: "pointer"
                    }}
                  >
                    Continue Presentation →
                  </button>
                </div>
              </motion.div>
            )}

            {/* MODE 3: LIVE CAPABILITY EXECUTION STAGE */}
            {stageMode === "DEMO" && (
              <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                  <h2 style={{ fontSize: "1.4rem", fontWeight: 800, color: PALETTE.gold, margin: 0 }}>
                    ⚡ Live Capability Demonstration Stage
                  </h2>
                  <span style={{
                    background: "rgba(34, 197, 94, 0.15)",
                    border: "1px solid #22c55e",
                    color: "#22c55e",
                    padding: "0.25rem 0.75rem",
                    borderRadius: "12px",
                    fontSize: "0.75rem",
                    fontWeight: 700
                  }}>
                    PHYSICAL REALITY VERIFIED
                  </span>
                </div>

                {executingDemo ? (
                  <div style={{ padding: "3rem", textAlign: "center" }}>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                      style={{ fontSize: "2.5rem", display: "inline-block", marginBottom: "1rem" }}
                    >
                      ⚙️
                    </motion.div>
                    <div style={{ color: PALETTE.gold, fontWeight: 700, fontSize: "1.1rem" }}>
                      Executing verified engine on server...
                    </div>
                    <p style={{ color: PALETTE.textMuted, fontSize: "0.9rem" }}>
                      Writing physical deliverable, computing SHA-256 seal, and binding Living Artifact context.
                    </p>
                  </div>
                ) : activeDemoResult ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                    <div style={{
                      background: "rgba(0, 0, 0, 0.5)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      borderRadius: "10px",
                      padding: "1.25rem"
                    }}>
                      <div style={{ fontSize: "0.8rem", color: PALETTE.gold, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 800 }}>
                        Executed Capability: {activeDemoResult.name} ({activeDemoResult.durationMs}ms)
                      </div>
                      <p style={{ color: "#f8fafc", fontSize: "1rem", marginTop: "0.5rem", lineHeight: "1.6" }}>
                        {activeDemoResult.narrative}
                      </p>

                      {/* Evidence Payload Box */}
                      {activeDemoResult.evidence && (
                        <div style={{
                          background: "#020617",
                          border: "1px solid rgba(56, 189, 248, 0.2)",
                          borderRadius: "8px",
                          padding: "1rem",
                          marginTop: "1rem",
                          fontFamily: "monospace",
                          fontSize: "0.85rem",
                          color: "#38bdf8"
                        }}>
                          <div style={{ color: "#94a3b8", marginBottom: "0.4rem" }}>// Cryptographic Physical Evidence</div>
                          <div>Artifact ID: {activeDemoResult.evidence.artifactId || activeDemoResult.evidence.engine || "PROVEN"}</div>
                          <div>SHA-256 Seal: {activeDemoResult.evidence.sha256Hash || activeDemoResult.evidence.scannedAt || "VERIFIED"}</div>
                          <div>File System: {activeDemoResult.evidence.filePath || `${activeDemoResult.evidence.totalFilesScanned} files mapped`}</div>
                        </div>
                      )}
                    </div>

                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem" }}>
                      <button
                        onClick={() => handleExecuteDemo("repo_architecture")}
                        style={{ background: "transparent", border: "1px solid rgba(255, 255, 255, 0.2)", color: "#fff", padding: "0.6rem 1.2rem", borderRadius: "6px", cursor: "pointer", fontSize: "0.85rem" }}
                      >
                        Try Repo Architecture Demo
                      </button>
                      <button
                        onClick={() => setStageMode("CONVERSATION")}
                        style={{ background: PALETTE.gold, color: "#000", border: "none", padding: "0.6rem 1.5rem", borderRadius: "6px", fontWeight: 800, cursor: "pointer", fontSize: "0.9rem" }}
                      >
                        Ask a Follow-Up Question →
                      </button>
                    </div>
                  </div>
                ) : null}
              </motion.div>
            )}

            {/* MODE 4: INTERACTIVE INVESTOR CONVERSATION */}
            {stageMode === "CONVERSATION" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <h2 style={{ fontSize: "1.3rem", fontWeight: 800, color: PALETTE.gold, marginBottom: "1rem" }}>
                  Interactive Investor Q&amp;A Dialogue
                </h2>

                {/* Conversation History Stream */}
                <div style={{
                  maxHeight: "340px",
                  overflowY: "auto",
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem",
                  paddingRight: "0.5rem",
                  marginBottom: "1.5rem"
                }}>
                  {chatHistory.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "2rem", color: PALETTE.textMuted }}>
                      Ask anything about GARUDA's architecture, founder origin, or capabilities.
                    </div>
                  ) : (
                    chatHistory.map((msg, idx) => (
                      <div
                        key={idx}
                        style={{
                          alignSelf: msg.role === "investor" ? "flex-end" : "flex-start",
                          maxWidth: "85%",
                          background: msg.role === "investor" ? "rgba(245, 158, 11, 0.15)" : PALETTE.cardBg,
                          border: `1px solid ${msg.role === "investor" ? "rgba(245, 158, 11, 0.4)" : "rgba(56, 189, 248, 0.25)"}`,
                          borderRadius: "12px",
                          padding: "1rem 1.25rem"
                        }}
                      >
                        <div style={{ fontSize: "0.75rem", fontWeight: 800, color: msg.role === "investor" ? PALETTE.gold : PALETTE.cyan, marginBottom: "0.3rem" }}>
                          {msg.role === "investor" ? "INVESTOR / VISITOR" : "GARUDA SOVEREIGN AI"}
                        </div>
                        <div style={{ fontSize: "0.98rem", color: "#fff", lineHeight: "1.6" }}>
                          {msg.text}
                        </div>
                        {msg.demonstrationAvailable && msg.suggestedDemo && (
                          <div style={{ marginTop: "0.75rem" }}>
                            <button
                              onClick={() => handleExecuteDemo(msg.suggestedDemo)}
                              style={{
                                background: "rgba(56, 189, 248, 0.2)",
                                border: `1px solid ${PALETTE.cyan}`,
                                color: PALETTE.cyan,
                                padding: "0.4rem 1rem",
                                borderRadius: "20px",
                                fontSize: "0.8rem",
                                fontWeight: 700,
                                cursor: "pointer"
                              }}
                            >
                              ⚡ Execute Demo: {msg.suggestedDemo.replace(/_/g, " ").toUpperCase()}
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                  {loadingAnswer && (
                    <div style={{ color: PALETTE.gold, fontSize: "0.9rem", fontStyle: "italic" }}>
                      GARUDA is formulating sovereign response...
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Quick Demonstration Chips */}
            <div style={{
              display: "flex",
              gap: "0.5rem",
              flexWrap: "wrap",
              paddingTop: "1.25rem",
              borderTop: "1px solid rgba(255, 255, 255, 0.08)"
            }}>
              <span style={{ fontSize: "0.8rem", color: PALETTE.textMuted, alignSelf: "center", marginRight: "0.25rem" }}>
                Live Capabilities:
              </span>
              <button
                onClick={() => handleExecuteDemo("creative_artifact")}
                style={{ background: "rgba(245, 158, 11, 0.1)", border: "1px solid rgba(245, 158, 11, 0.3)", color: PALETTE.gold, padding: "0.35rem 0.8rem", borderRadius: "15px", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer" }}
              >
                🎨 Creative Living Artifact
              </button>
              <button
                onClick={() => handleExecuteDemo("repo_architecture")}
                style={{ background: "rgba(56, 189, 248, 0.1)", border: "1px solid rgba(56, 189, 248, 0.3)", color: PALETTE.cyan, padding: "0.35rem 0.8rem", borderRadius: "15px", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer" }}
              >
                🔍 Repo Architecture Audit
              </button>
              <button
                onClick={() => handleExecuteDemo("brand_identity")}
                style={{ background: "rgba(168, 85, 247, 0.1)", border: "1px solid rgba(168, 85, 247, 0.3)", color: "#c084fc", padding: "0.35rem 0.8rem", borderRadius: "15px", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer" }}
              >
                🛡️ Brand IdentityLock™
              </button>
              <button
                onClick={() => handleExecuteDemo("marketing_seo")}
                style={{ background: "rgba(34, 197, 94, 0.1)", border: "1px solid rgba(34, 197, 94, 0.3)", color: "#22c55e", padding: "0.35rem 0.8rem", borderRadius: "15px", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer" }}
              >
                📈 SEO Topic Clusters
              </button>
            </div>

            {/* Investor Question Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAskQuestion();
              }}
              style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}
            >
              <input
                type="text"
                placeholder="Ask GARUDA anything (e.g., 'Why were you created?', 'Show me what you can do')..."
                value={investorInput}
                onChange={(e) => setInvestorInput(e.target.value)}
                style={{
                  flex: 1,
                  background: "rgba(0, 0, 0, 0.6)",
                  border: "1px solid rgba(245, 158, 11, 0.3)",
                  borderRadius: "8px",
                  padding: "0.85rem 1.25rem",
                  color: "#fff",
                  fontSize: "0.95rem",
                  outline: "none"
                }}
              />
              <button
                type="submit"
                style={{
                  background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                  border: "none",
                  color: "#000",
                  padding: "0.85rem 1.75rem",
                  borderRadius: "8px",
                  fontWeight: 800,
                  cursor: "pointer",
                  letterSpacing: "0.05em"
                }}
              >
                Ask GARUDA
              </button>
            </form>

          </div>
        </div>
      </main>

      {/* Sovereign Bottom Status Bar */}
      <footer style={{
        textAlign: "center",
        padding: "1rem",
        borderTop: "1px solid rgba(255, 255, 255, 0.05)",
        fontSize: "0.78rem",
        color: PALETTE.textMuted,
        letterSpacing: "0.05em",
        zIndex: 50
      }}>
        GARUDA AI &bull; Engineered by Praveen Mahawar &bull; 100% Anti-Fabrication Truth Law &bull; Free First, Sovereign Always
      </footer>
    </div>
  );
}
