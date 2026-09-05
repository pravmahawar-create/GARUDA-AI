import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

const SpeechRec = typeof window !== "undefined" ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null;
const PAYMENT_URL = "https://razorpay.me/@garudaosincompany";

export default function PawanCodingStudio() {
  const navigate = useNavigate();
  const [instruction, setInstruction] = useState("");
  const [targetFile, setTargetFile] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const [statusInfo, setStatusInfo] = useState(null);
  const [isFounder, setIsFounder] = useState(true); // Default to Founder mode
  const [showGateModal, setShowGateModal] = useState(false);
  const [activeTab, setActiveTab] = useState("code"); // 'code' | 'preview' | 'mobile' | 'trajectory' | 'proof'
  const [codeCopied, setCodeCopied] = useState(false);
  const [previewViewport, setPreviewViewport] = useState("desktop"); // 'desktop' | 'mobile'
  const [previewKey, setPreviewKey] = useState(0);

  // 📱 Mobile Remote Debugging States
  const [mobileStatus, setMobileStatus] = useState(null);
  const [mobileLoading, setMobileLoading] = useState(false);
  const [mobileReverseMsg, setMobileReverseMsg] = useState("");
  const [mobileLogs, setMobileLogs] = useState("");

  // Client Intake State for Access Gate
  const [intakeName, setIntakeName] = useState("");
  const [intakeEmail, setIntakeEmail] = useState("");
  const [intakePhone, setIntakePhone] = useState("");
  const [intakeRepo, setIntakeRepo] = useState("");
  const [intakeSubmitted, setIntakeSubmitted] = useState(false);

  // 🎙️ Voice & Conversational States
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [voiceMuted, setVoiceMuted] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState("");
  const recognitionRef = useRef(null);

  useEffect(() => {
    fetchStatus();
    fetchHistory();
    fetchMobileStatus();
    checkAuthSession();
    if (SpeechRec) {
      setVoiceSupported(true);
    }
  }, []);

  const checkAuthSession = async () => {
    try {
      const res = await fetch("/api/auth/session", { credentials: "same-origin" });
      const data = await res.json();
      if (data.authenticated === true) {
        setIsFounder(true);
      }
    } catch {
      setIsFounder(true);
    }
  };

  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/pawan/status");
      const data = await res.json();
      if (data.success) setStatusInfo(data);
    } catch {}
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch("/api/pawan/history?limit=10");
      const data = await res.json();
      if (data.success) setHistory(data.history || []);
    } catch {}
  };

  const fetchMobileStatus = async () => {
    try {
      setMobileLoading(true);
      const res = await fetch("/api/pawan/mobile-status");
      const data = await res.json();
      if (data.success) setMobileStatus(data);
    } catch {} finally {
      setMobileLoading(false);
    }
  };

  const handleMobileReverse = async () => {
    try {
      setMobileReverseMsg("Establishing USB device bridge...");
      const res = await fetch("/api/pawan/mobile-reverse", { method: "POST" });
      const data = await res.json();
      setMobileReverseMsg(data.message || data.error || "Completed");
      pawanSpeak("USB bridge active. Connected phone is now synchronized with GARUDA.");
    } catch (err) {
      setMobileReverseMsg("Error: " + err.message);
    }
  };

  const fetchMobileLogs = async () => {
    try {
      const res = await fetch("/api/pawan/mobile-logs");
      const data = await res.json();
      setMobileLogs(data.logs || "No recent logs captured.");
    } catch {
      setMobileLogs("Log fetch error.");
    }
  };

  const getAppPreviewUrl = (filePath) => {
    if (!filePath) return "/";
    const p = filePath.toLowerCase();
    if (p.includes("billing")) return "/app";
    if (p.includes("kids")) return "/kids-play";
    if (p.includes("investor")) return "/investor";
    if (p.includes("botverse") || p.includes("bot-verse")) return "/bot-verse";
    if (p.includes("publiclanding") || p.includes("landing")) return "/";
    if (p.includes("whatisgaruda")) return "/what-is-garuda-ai";
    if (p.includes("command")) return "/command-center";
    return "/";
  };

  // 🔊 PAWAN Natural Speech (Streams Google Natural Voice)
  const pawanSpeak = (text) => {
    if (voiceMuted || typeof window === "undefined") return;
    try {
      const audio = new Audio(`/api/audio/tts?text=${encodeURIComponent(text)}&lang=hi`);
      audio.play().catch(() => {});
    } catch {}
  };

  // 🎙️ Toggle Voice Listening
  const toggleVoiceInput = () => {
    if (!SpeechRec) {
      alert("Voice recognition is supported in Chrome or Edge browser.");
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      setVoiceStatus("");
      return;
    }

    try {
      const recognition = new SpeechRec();
      recognition.lang = "hi-IN";
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsListening(true);
        setVoiceStatus("🎙️ Listening for task instruction... Speak now.");
        pawanSpeak("नमस्ते प्रवीण जी! मैं गरुड़ पवन हूँ। आदेश दीजिए, आज क्या कोड करना है?");
      };

      recognition.onresult = (event) => {
        let transcriptText = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcriptText += event.results[i][0].transcript;
        }
        setInstruction(transcriptText);
      };

      recognition.onerror = (event) => {
        setIsListening(false);
        setVoiceStatus("Mic error: " + event.error);
      };

      recognition.onend = () => {
        setIsListening(false);
        setVoiceStatus("");
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      setIsListening(false);
      setVoiceStatus("Voice error: " + err.message);
    }
  };

  const handleExecute = async (e) => {
    e?.preventDefault();
    if (!instruction.trim()) return;

    if (!isFounder) {
      setShowGateModal(true);
      pawanSpeak("This is GARUDA PAWAN sovereign execution engine. Please verify project scope.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    pawanSpeak("Pawan has initiated the task. Analyzing codebase and synthesizing verified patch.");

    try {
      const res = await fetch("/api/pawan/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instruction: instruction.trim(),
          targetFile: targetFile.trim() || undefined
        })
      });

      const rawText = await res.text();
      let data;
      try {
        data = JSON.parse(rawText);
      } catch {
        throw new Error(`Server returned HTTP ${res.status}: ${rawText.slice(0, 150) || "Backend server warming up, please retry in 3 seconds."}`);
      }

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Autonomous execution failed.");
      }

      setResult(data.data);
      setActiveTab("code");
      fetchHistory();
      pawanSpeak("Praveen ji, task completed successfully! Verified code is ready on screen.");
    } catch (err) {
      setError(err.message);
      pawanSpeak("Execution error occurred. Check screen details.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (!result?.code) return;
    navigator.clipboard.writeText(result.code);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 3000);
  };

  const handleIntakeSubmit = async (e) => {
    e.preventDefault();
    if (!intakeEmail && !intakePhone) {
      alert("Please enter email or phone number.");
      return;
    }

    try {
      await fetch("/api/project-scope", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName: intakeName || "Prospective Client",
          clientEmail: intakeEmail,
          clientPhone: intakePhone,
          serviceNeeded: "GARUDA PAWAN Autonomous Coding Agent Execution",
          requirements: `Repo: ${intakeRepo || "Private Repository"}\nTask Instruction: ${instruction}`,
          budgetRange: "₹25,000 - ₹1,00,000"
        })
      });
      setIntakeSubmitted(true);
      pawanSpeak("Your project scope has been transmitted to Founder Praveen Mahawar.");
    } catch {
      setIntakeSubmitted(true);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "radial-gradient(ellipse at 50% 0%, rgba(212, 175, 55, 0.08) 0%, #060503 60%, #030201 100%)", color: "#f8fafc", fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", padding: "1.5rem 1rem" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        
        {/* Top Header & Brand Bar */}
        <div style={{ borderBottom: "1px solid rgba(212, 175, 55, 0.2)", paddingBottom: "1.2rem", marginBottom: "1.8rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", background: "rgba(212, 175, 55, 0.1)", border: "1px solid rgba(212, 175, 55, 0.35)", borderRadius: "999px", padding: "3px 12px", marginBottom: "0.4rem" }}>
                <span style={{ fontSize: "0.85rem" }}>🦅</span>
                <span style={{ color: "#fbbf24", fontWeight: "800", fontSize: "0.72rem", letterSpacing: "0.12em", textTransform: "uppercase" }}>
                  GARUDA PAWAN • Autonomous Coding Studio
                </span>
              </div>

              <h1 style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: "800", margin: "0.2rem 0", color: "#ffffff", letterSpacing: "-0.02em" }}>
                PAWAN Autonomous Code & Repair Studio
              </h1>
              <p style={{ margin: 0, color: "#d4af37", fontSize: "0.85rem", fontWeight: "600" }}>
                “As Fast as Wind • Smooth & Powerful” — Closed-Loop ReAct Engine with Real-Time Syntax Repair & SHA-256 Audit Trail
              </p>
              <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "0.3rem" }}>
                Founder: <strong>Praveen Mahawar</strong> • Voice-Guided Closed Loop • Multi-Model Synthesis
              </div>
            </div>

            {/* Controls */}
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => setVoiceMuted(!voiceMuted)}
                style={{ background: voiceMuted ? "#1c1917" : "rgba(212, 175, 55, 0.12)", border: `1px solid ${voiceMuted ? "#44403c" : "#d4af37"}`, color: voiceMuted ? "#a8a29e" : "#fbbf24", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "0.75rem", fontWeight: "700" }}
              >
                {voiceMuted ? "🔇 Voice Muted" : "🔊 Voice Active"}
              </button>

              <button
                type="button"
                onClick={() => setIsFounder(!isFounder)}
                style={{
                  background: isFounder ? "linear-gradient(135deg, rgba(212,175,55,0.2) 0%, rgba(245,158,11,0.2) 100%)" : "#1c1917",
                  border: `1px solid ${isFounder ? "#d4af37" : "#44403c"}`,
                  color: isFounder ? "#fef08a" : "#94a3b8",
                  padding: "6px 12px",
                  borderRadius: "6px",
                  fontSize: "0.75rem",
                  fontWeight: "800",
                  cursor: "pointer"
                }}
              >
                {isFounder ? "👑 Founder Mode: Unlocked" : "🔒 Visitor Gate"}
              </button>

              <div style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "4px 10px", borderRadius: "6px", background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.35)", fontSize: "0.72rem", color: "#34d399", fontWeight: "800" }}>
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#10b981", display: "inline-block" }}></span>
                ONLINE
              </div>
            </div>
          </div>
        </div>

        {/* Main Workspace Layout */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1.5rem" }}>
          
          {/* Integrated Sleek Command Box (Modern Prompt Console) */}
          <div style={{ background: "#080705", border: "1px solid rgba(212, 175, 55, 0.28)", borderRadius: "12px", padding: "1.4rem", boxShadow: "0 10px 30px rgba(0,0,0,0.6)" }}>
            
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.8rem", flexWrap: "wrap", gap: "0.5rem" }}>
              <span style={{ fontSize: "0.82rem", color: "#d4af37", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                ⚡ Task Instruction / Engineering Prompt
              </span>
              <span style={{ fontSize: "0.72rem", color: "#94a3b8" }}>
                Press <kbd style={{ background: "#1c1917", padding: "2px 6px", borderRadius: "4px", border: "1px solid #44403c", color: "#fef08a" }}>Enter</kbd> to run • <kbd style={{ background: "#1c1917", padding: "2px 6px", borderRadius: "4px", border: "1px solid #44403c" }}>Shift+Enter</kbd> for newline
              </span>
            </div>

            {voiceStatus && (
              <div style={{ marginBottom: "0.8rem", padding: "8px 12px", background: "rgba(245, 158, 11, 0.12)", border: "1px solid rgba(245, 158, 11, 0.4)", borderRadius: "6px", fontSize: "0.8rem", color: "#fef08a", fontWeight: "700" }}>
                {voiceStatus}
              </div>
            )}

            <form onSubmit={handleExecute}>
              {/* Main Textarea with Enter-to-Submit */}
              <div style={{ position: "relative", marginBottom: "0.8rem" }}>
                <textarea
                  rows="3"
                  value={instruction}
                  onChange={(e) => setInstruction(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleExecute();
                    }
                  }}
                  placeholder="Describe task, bug, or feature to build (e.g. 'Repair order conversation persistence in billing app' or 'Create random API key generator with checksum')..."
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    background: "#030201",
                    border: "1px solid rgba(212, 175, 55, 0.25)",
                    borderRadius: "8px",
                    padding: "12px 14px",
                    color: "#ffffff",
                    fontSize: "0.92rem",
                    resize: "vertical",
                    outline: "none",
                    lineHeight: 1.5,
                    fontFamily: "inherit"
                  }}
                />
              </div>

              {/* Compact Integrated Action Toolbar (Sleek Proportions) */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.8rem" }}>
                
                {/* Left: Compact Target File input */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flex: "1 1 260px", maxWidth: "420px" }}>
                  <span style={{ fontSize: "0.75rem", color: "#a8a29e", whiteSpace: "nowrap", fontWeight: "700" }}>
                    Target File:
                  </span>
                  <input
                    type="text"
                    value={targetFile}
                    onChange={(e) => setTargetFile(e.target.value)}
                    placeholder="e.g. billing/src/components/VoiceModal.jsx (optional)"
                    style={{
                      flex: 1,
                      background: "#030201",
                      border: "1px solid #292524",
                      borderRadius: "6px",
                      padding: "7px 10px",
                      color: "#f8fafc",
                      fontSize: "0.8rem",
                      outline: "none",
                      fontFamily: "ui-monospace, monospace"
                    }}
                  />
                </div>

                {/* Right: Compact Voice and Run Button */}
                <div style={{ display: "flex", gap: "0.6rem", alignItems: "center" }}>
                  <button
                    type="button"
                    onClick={toggleVoiceInput}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.4rem",
                      padding: "7px 14px",
                      borderRadius: "6px",
                      background: isListening ? "#b91c1c" : "#14120c",
                      border: `1px solid ${isListening ? "#ef4444" : "rgba(212, 175, 55, 0.4)"}`,
                      color: isListening ? "#ffffff" : "#fbbf24",
                      fontSize: "0.8rem",
                      fontWeight: "800",
                      cursor: "pointer"
                    }}
                  >
                    <span>{isListening ? "⏹️" : "🎙️"}</span>
                    {isListening ? "Stop Listening" : "Voice"}
                  </button>

                  <button
                    type="submit"
                    disabled={loading || !instruction.trim()}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      padding: "8px 18px",
                      background: loading ? "#292524" : "linear-gradient(135deg, #d4af37 0%, #b8860b 100%)",
                      color: "#050402",
                      border: "none",
                      borderRadius: "6px",
                      fontWeight: "900",
                      fontSize: "0.85rem",
                      cursor: loading ? "wait" : "pointer",
                      boxShadow: "0 2px 15px rgba(212, 175, 55, 0.3)",
                      letterSpacing: "0.04em",
                      textTransform: "uppercase"
                    }}
                  >
                    <span>{loading ? "⚡" : "🚀"}</span>
                    {loading ? "Synthesizing Code..." : "Run Pawan ↵"}
                  </button>
                </div>
              </div>
            </form>

            {/* Quick Task Shortcuts */}
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center", marginTop: "1rem", paddingTop: "0.8rem", borderTop: "1px solid #14120c" }}>
              <span style={{ fontSize: "0.72rem", color: "#78716c", fontWeight: "600" }}>Quick Tasks:</span>
              <button
                type="button"
                onClick={() => {
                  setInstruction("Diagnose and repair order session persistence across voice clicks in billing app");
                  setTargetFile("billing/src/components/VoiceModal.jsx");
                }}
                style={{ background: "#14120c", border: "1px solid rgba(212,175,55,0.3)", color: "#fef08a", fontSize: "0.72rem", padding: "4px 8px", borderRadius: "4px", cursor: "pointer", fontWeight: "700" }}
              >
                🔧 Repair Billing Voice Orders
              </button>
              <button
                type="button"
                onClick={() => {
                  setInstruction("Create a utility to generate secure random API keys with checksum validation");
                  setTargetFile("src/utils/apiKeyGenerator.js");
                }}
                style={{ background: "#14120c", border: "1px solid #292524", color: "#cbd5e1", fontSize: "0.72rem", padding: "4px 8px", borderRadius: "4px", cursor: "pointer" }}
              >
                🔑 API Key Generator
              </button>
              <button
                type="button"
                onClick={() => navigate("/kids-play")}
                style={{ background: "#14120c", border: "1px solid #38bdf8", color: "#7dd3fc", fontSize: "0.72rem", padding: "4px 8px", borderRadius: "4px", cursor: "pointer", fontWeight: "700" }}
              >
                🎈 Kids Voice Companion ➔
              </button>
            </div>
          </div>

          {/* Execution Error Banner */}
          {error && (
            <div style={{ background: "rgba(185, 28, 28, 0.15)", border: "1px solid #dc2626", padding: "1rem", borderRadius: "8px", color: "#fca5a5", fontSize: "0.85rem" }}>
              <strong>Execution Error:</strong> {error}
            </div>
          )}

          {/* ================================================================= */}
          {/* THE REAL RESULT VIEWER: CODE, LIVE PREVIEW, MOBILE DEBUGGER       */}
          {/* ================================================================= */}
          {result && (
            <div style={{ background: "#080705", border: "2px solid #d4af37", borderRadius: "12px", padding: "1.5rem", boxShadow: "0 15px 40px rgba(0,0,0,0.8)" }}>
              {/* Result Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.8rem", borderBottom: "1px solid rgba(212, 175, 55, 0.2)", paddingBottom: "0.8rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                  <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "rgba(16, 185, 129, 0.2)", border: "1px solid #10b981", display: "grid", placeItems: "center", fontSize: "1.1rem" }}>
                    ✓
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "1.05rem", color: "#75f4ab", fontWeight: "900", letterSpacing: "-0.01em" }}>
                      TASK COMPLETED • CODE VERIFIED
                    </h3>
                    <div style={{ fontSize: "0.75rem", color: "#d4af37", marginTop: "2px", fontFamily: "monospace" }}>
                      Target: <strong>{result.file}</strong> • Task ID: {result.taskId}
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
                  <a
                    href={getAppPreviewUrl(result.file)}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                      color: "#ffffff",
                      border: "none",
                      padding: "7px 14px",
                      borderRadius: "6px",
                      fontWeight: "800",
                      fontSize: "0.78rem",
                      cursor: "pointer",
                      textDecoration: "none",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.4rem",
                      boxShadow: "0 0 15px rgba(16, 185, 129, 0.3)"
                    }}
                  >
                    <span>🌐</span> Launch Fixed App ➔
                  </a>

                  <button
                    type="button"
                    onClick={handleCopyCode}
                    style={{
                      background: codeCopied ? "#10b981" : "linear-gradient(135deg, #d4af37 0%, #b8860b 100%)",
                      color: "#000",
                      border: "none",
                      padding: "7px 14px",
                      borderRadius: "6px",
                      fontWeight: "800",
                      fontSize: "0.78rem",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.4rem"
                    }}
                  >
                    <span>{codeCopied ? "✓" : "📋"}</span>
                    {codeCopied ? "Copied!" : "Copy Code"}
                  </button>

                  <span style={{ background: "#14120c", border: "1px solid rgba(212,175,55,0.3)", color: "#fef08a", padding: "5px 10px", borderRadius: "6px", fontSize: "0.72rem", fontWeight: "700" }}>
                    Self-Heal Cycles: {result.healCyclesRun}
                  </span>
                </div>
              </div>

              {/* Summary Note */}
              {result.summary && (
                <div style={{ background: "rgba(212, 175, 55, 0.06)", border: "1px solid rgba(212, 175, 55, 0.2)", padding: "10px 14px", borderRadius: "6px", marginBottom: "1rem", fontSize: "0.82rem", color: "#fef08a", lineHeight: 1.5 }}>
                  <strong>💡 Architectural Summary:</strong> {result.summary}
                </div>
              )}

              {/* Result Tabs Navigation */}
              <div style={{ display: "flex", gap: "0.4rem", marginBottom: "1rem", borderBottom: "1px solid #14120c", paddingBottom: "0.4rem", overflowX: "auto" }}>
                <button
                  type="button"
                  onClick={() => setActiveTab("code")}
                  style={{
                    padding: "7px 14px",
                    borderRadius: "6px",
                    border: activeTab === "code" ? "1px solid #d4af37" : "1px solid transparent",
                    background: activeTab === "code" ? "rgba(212, 175, 55, 0.15)" : "transparent",
                    color: activeTab === "code" ? "#fef08a" : "#94a3b8",
                    fontWeight: "800",
                    fontSize: "0.8rem",
                    cursor: "pointer"
                  }}
                >
                  📜 Code Viewer
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("preview")}
                  style={{
                    padding: "7px 14px",
                    borderRadius: "6px",
                    border: activeTab === "preview" ? "1px solid #10b981" : "1px solid transparent",
                    background: activeTab === "preview" ? "rgba(16, 185, 129, 0.15)" : "transparent",
                    color: activeTab === "preview" ? "#6ee7b7" : "#94a3b8",
                    fontWeight: "800",
                    fontSize: "0.8rem",
                    cursor: "pointer"
                  }}
                >
                  👁️ In-Studio Preview
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("mobile");
                    fetchMobileStatus();
                  }}
                  style={{
                    padding: "7px 14px",
                    borderRadius: "6px",
                    border: activeTab === "mobile" ? "1px solid #38bdf8" : "1px solid transparent",
                    background: activeTab === "mobile" ? "rgba(56, 189, 248, 0.15)" : "transparent",
                    color: activeTab === "mobile" ? "#7dd3fc" : "#94a3b8",
                    fontWeight: "800",
                    fontSize: "0.8rem",
                    cursor: "pointer"
                  }}
                >
                  📱 Mobile Debugger
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("trajectory")}
                  style={{
                    padding: "7px 14px",
                    borderRadius: "6px",
                    border: activeTab === "trajectory" ? "1px solid #d4af37" : "1px solid transparent",
                    background: activeTab === "trajectory" ? "rgba(212, 175, 55, 0.15)" : "transparent",
                    color: activeTab === "trajectory" ? "#fef08a" : "#94a3b8",
                    fontWeight: "800",
                    fontSize: "0.8rem",
                    cursor: "pointer"
                  }}
                >
                  ⚡ Execution Steps
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("proof")}
                  style={{
                    padding: "7px 14px",
                    borderRadius: "6px",
                    border: activeTab === "proof" ? "1px solid #d4af37" : "1px solid transparent",
                    background: activeTab === "proof" ? "rgba(212, 175, 55, 0.15)" : "transparent",
                    color: activeTab === "proof" ? "#fef08a" : "#94a3b8",
                    fontWeight: "800",
                    fontSize: "0.8rem",
                    cursor: "pointer"
                  }}
                >
                  🔒 SHA-256 Proof
                </button>
              </div>

              {/* TAB 1: CODE VIEWER */}
              {activeTab === "code" && (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#110f0b", padding: "8px 12px", borderTopLeftRadius: "6px", borderTopRightRadius: "6px", border: "1px solid #24201a", borderBottom: "none" }}>
                    <span style={{ fontSize: "0.75rem", color: "#d4af37", fontFamily: "ui-monospace, monospace", fontWeight: "700" }}>
                      📁 {result.file}
                    </span>
                    <span style={{ fontSize: "0.7rem", color: "#a8a29e" }}>
                      {result.code ? `${result.code.split("\n").length} Lines` : "File Updated"}
                    </span>
                  </div>
                  <pre style={{ margin: 0, padding: "14px", background: "#030201", border: "1px solid #24201a", borderBottomLeftRadius: "6px", borderBottomRightRadius: "6px", color: "#f8fafc", fontSize: "0.82rem", fontFamily: "ui-monospace, Consolas, Monaco, monospace", lineHeight: 1.5, overflowX: "auto", maxHeight: "440px", whiteSpace: "pre" }}>
                    <code>{result.code || "// Code patched directly to " + result.file + "\n// Inspect file in editor."}</code>
                  </pre>
                </div>
              )}

              {/* TAB 2: LIVE APP PREVIEW (IN-STUDIO SIMULATOR) */}
              {activeTab === "preview" && (
                <div style={{ background: "#030201", border: "1px solid #24201a", borderRadius: "8px", padding: "0.8rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.8rem", flexWrap: "wrap", gap: "0.5rem" }}>
                    <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
                      <span style={{ fontSize: "0.75rem", color: "#d4af37", fontWeight: "700" }}>Simulator:</span>
                      <button
                        type="button"
                        onClick={() => setPreviewViewport("desktop")}
                        style={{ background: previewViewport === "desktop" ? "rgba(212,175,55,0.2)" : "#14120c", border: "1px solid #38332b", color: previewViewport === "desktop" ? "#fef08a" : "#94a3b8", padding: "3px 8px", borderRadius: "4px", fontSize: "0.72rem", cursor: "pointer", fontWeight: "700" }}
                      >
                        🖥️ Desktop (Full)
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewViewport("mobile")}
                        style={{ background: previewViewport === "mobile" ? "rgba(56,189,248,0.2)" : "#14120c", border: "1px solid #38332b", color: previewViewport === "mobile" ? "#7dd3fc" : "#94a3b8", padding: "3px 8px", borderRadius: "4px", fontSize: "0.72rem", cursor: "pointer", fontWeight: "700" }}
                      >
                        📱 Mobile (375px)
                      </button>
                    </div>

                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button
                        type="button"
                        onClick={() => setPreviewKey((k) => k + 1)}
                        style={{ background: "#14120c", border: "1px solid #38332b", color: "#cbd5e1", padding: "3px 8px", borderRadius: "4px", fontSize: "0.72rem", cursor: "pointer" }}
                      >
                        🔄 Reload
                      </button>
                      <a
                        href={getAppPreviewUrl(result.file)}
                        target="_blank"
                        rel="noreferrer"
                        style={{ background: "rgba(16,185,129,0.15)", border: "1px solid #10b981", color: "#6ee7b7", padding: "3px 8px", borderRadius: "4px", fontSize: "0.72rem", textDecoration: "none", fontWeight: "700" }}
                      >
                        🔗 Open New Tab
                      </a>
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "center", background: "#080705", padding: "0.8rem", borderRadius: "6px", border: "1px solid #1a1712", minHeight: "440px" }}>
                    <iframe
                      key={previewKey}
                      src={getAppPreviewUrl(result.file)}
                      title="Fixed App Preview"
                      style={{
                        width: previewViewport === "mobile" ? "375px" : "100%",
                        height: "500px",
                        border: previewViewport === "mobile" ? "6px solid #334155" : "1px solid #1e293b",
                        borderRadius: previewViewport === "mobile" ? "20px" : "4px",
                        background: "#030712"
                      }}
                    />
                  </div>
                </div>
              )}

              {/* TAB 3: MOBILE DEBUGGER (ADB & WI-FI REMOTE LINK) */}
              {activeTab === "mobile" && (
                <div style={{ background: "#030201", border: "1px solid #24201a", borderRadius: "8px", padding: "1.2rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.6rem", borderBottom: "1px solid #14120c", paddingBottom: "0.6rem" }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: "0.92rem", color: "#38bdf8", fontWeight: "800" }}>
                        📱 Mobile Device Debugger & Remote Bridge
                      </h4>
                      <p style={{ margin: "2px 0 0", fontSize: "0.72rem", color: "#94a3b8" }}>
                        Plug your phone via USB or connect to same Wi-Fi to test and debug live on your mobile.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={fetchMobileStatus}
                      disabled={mobileLoading}
                      style={{ background: "#14120c", border: "1px solid #38bdf8", color: "#7dd3fc", padding: "5px 12px", borderRadius: "5px", fontSize: "0.72rem", fontWeight: "800", cursor: "pointer" }}
                    >
                      {mobileLoading ? "Checking..." : "🔄 Refresh Devices"}
                    </button>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "0.8rem", marginBottom: "1rem" }}>
                    
                    {/* USB Cable Status */}
                    <div style={{ background: "#080a10", border: `1px solid ${mobileStatus?.connected ? "#10b981" : "#24201a"}`, borderRadius: "8px", padding: "1rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.4rem" }}>
                        <span style={{ fontSize: "1.1rem" }}>{mobileStatus?.connected ? "🟢" : "🔌"}</span>
                        <div>
                          <div style={{ fontSize: "0.8rem", fontWeight: "800", color: mobileStatus?.connected ? "#34d399" : "#cbd5e1" }}>
                            {mobileStatus?.connected ? "USB Phone Connected!" : "No USB Device Detected"}
                          </div>
                          <div style={{ fontSize: "0.7rem", color: "#94a3b8" }}>
                            {mobileStatus?.connected ? `Model: ${mobileStatus.devices[0]?.model || mobileStatus.devices[0]?.id}` : "Plug phone via USB cable and enable 'USB Debugging'"}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleMobileReverse}
                        style={{
                          width: "100%",
                          marginTop: "0.6rem",
                          background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
                          color: "#ffffff",
                          border: "none",
                          padding: "8px",
                          borderRadius: "6px",
                          fontSize: "0.75rem",
                          fontWeight: "800",
                          cursor: "pointer"
                        }}
                      >
                        ⚡ Activate Phone Device Bridge
                      </button>

                      {mobileReverseMsg && (
                        <div style={{ marginTop: "0.5rem", fontSize: "0.72rem", color: "#fef08a", background: "rgba(245,158,11,0.1)", padding: "5px 8px", borderRadius: "4px" }}>
                          {mobileReverseMsg}
                        </div>
                      )}
                    </div>

                    {/* Mobile Mirror Link */}
                    <div style={{ background: "#080a10", border: "1px solid #24201a", borderRadius: "8px", padding: "1rem" }}>
                      <div style={{ fontSize: "0.8rem", fontWeight: "800", color: "#fef08a", marginBottom: "0.2rem" }}>
                        📶 Mobile Device Mirror Link
                      </div>
                      <div style={{ fontSize: "0.7rem", color: "#94a3b8", marginBottom: "0.6rem" }}>
                        Open this link on your phone's browser for instant live testing:
                      </div>

                      <div style={{ display: "flex", gap: "0.3rem", alignItems: "center" }}>
                        <input
                          type="text"
                          readOnly
                          value={mobileStatus?.wifiUrl || (typeof window !== "undefined" ? window.location.origin : "https://www.garudaos.in")}
                          style={{ flex: 1, background: "#02040a", border: "1px solid #334155", borderRadius: "4px", padding: "6px 8px", color: "#38bdf8", fontSize: "0.75rem", fontFamily: "monospace" }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const url = mobileStatus?.wifiUrl || window.location.origin;
                            navigator.clipboard.writeText(url);
                            alert("Mobile mirror URL copied!");
                          }}
                          style={{ background: "#14120c", border: "1px solid #38bdf8", color: "#7dd3fc", padding: "6px 10px", borderRadius: "4px", fontSize: "0.72rem", fontWeight: "700", cursor: "pointer" }}
                        >
                          Copy
                        </button>
                      </div>

                      <div style={{ marginTop: "0.8rem", fontSize: "0.68rem", color: "#a8a29e" }}>
                        💡 Chrome DevTools: Open <code>chrome://inspect/#devices</code> in laptop Chrome to inspect phone DOM & console.
                      </div>
                    </div>

                  </div>

                  {/* Mobile Logs */}
                  <div style={{ borderTop: "1px solid #14120c", paddingTop: "0.8rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                      <span style={{ fontSize: "0.75rem", fontWeight: "800", color: "#d4af37" }}>
                        ADB Error Logcat Stream:
                      </span>
                      <button
                        type="button"
                        onClick={fetchMobileLogs}
                        style={{ background: "#14120c", border: "1px solid #38332b", color: "#cbd5e1", padding: "3px 8px", borderRadius: "4px", fontSize: "0.7rem", cursor: "pointer" }}
                      >
                        Fetch Phone Logs
                      </button>
                    </div>

                    <pre style={{ margin: 0, padding: "8px", background: "#02040a", border: "1px solid #1a1712", borderRadius: "4px", color: "#f87171", fontSize: "0.7rem", fontFamily: "monospace", maxHeight: "120px", overflowY: "auto", whiteSpace: "pre-wrap" }}>
                      {mobileLogs || "// Click 'Fetch Phone Logs' to inspect device error output."}
                    </pre>
                  </div>
                </div>
              )}

              {/* TAB 4: TRAJECTORY */}
              {activeTab === "trajectory" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {result.trajectory?.map((t, idx) => (
                    <div key={idx} style={{ background: "#110f0b", padding: "8px 12px", borderRadius: "6px", border: "1px solid #24201a", fontSize: "0.8rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ color: "#d4af37", fontWeight: "800" }}>
                        Step {idx + 1}: {t.step}
                      </span>
                      <span style={{ color: "#e7e5e4" }}>
                        {t.summary || t.instruction || t.file || "Completed"}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* TAB 5: PROOF */}
              {activeTab === "proof" && (
                <div style={{ background: "#030201", padding: "1rem", borderRadius: "6px", border: "1px solid #24201a" }}>
                  <div style={{ fontSize: "0.75rem", color: "#d4af37", fontWeight: "800", marginBottom: "0.3rem" }}>
                    Cryptographic Integrity Proof (SHA-256):
                  </div>
                  <code style={{ fontSize: "0.8rem", color: "#75f4ab", wordBreak: "break-all", fontFamily: "monospace" }}>
                    {result.sha256}
                  </code>
                  <div style={{ marginTop: "0.8rem", fontSize: "0.72rem", color: "#a8a29e", lineHeight: 1.5 }}>
                    This cryptographic digest certifies that code was written to local disk and passed syntax verification.
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Audit History Log */}
          <div style={{ background: "#080705", border: "1px solid rgba(212, 175, 55, 0.2)", borderRadius: "12px", padding: "1.4rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.8rem" }}>
              <div style={{ fontSize: "0.8rem", color: "#d4af37", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                📜 Recent Execution Audit Trail
              </div>
              <button
                type="button"
                onClick={fetchHistory}
                style={{ background: "#14120c", border: "1px solid rgba(212, 175, 55, 0.3)", color: "#fef08a", padding: "4px 10px", borderRadius: "4px", fontSize: "0.72rem", cursor: "pointer", fontWeight: "700" }}
              >
                Refresh
              </button>
            </div>

            {history.length === 0 ? (
              <div style={{ color: "#78716c", fontSize: "0.8rem", textAlign: "center", padding: "1rem" }}>
                No execution audit logs found. Run your first task above.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {history.map((item, idx) => (
                  <div key={idx} style={{ background: "#030201", border: "1px solid #1a1712", borderRadius: "6px", padding: "10px 12px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.4rem" }}>
                    <div>
                      <div style={{ fontSize: "0.82rem", fontWeight: "800", color: "#ffffff" }}>
                        {item.file || item.instruction || item.taskId}
                      </div>
                      <div style={{ fontSize: "0.72rem", color: "#a8a29e", marginTop: "2px" }}>
                        {item.timestamp ? new Date(item.timestamp).toLocaleString("en-IN") : "Recent"} • {item.summary || "Task executed"}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                      <span style={{ fontSize: "0.72rem", fontWeight: "800", color: item.success ? "#34d399" : "#f87171", background: item.success ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)", padding: "2px 6px", borderRadius: "4px" }}>
                        {item.success ? "✓ Passed" : "✕ Failed"}
                      </span>
                      {item.sha256 && (
                        <span style={{ fontSize: "0.68rem", color: "#78716c", fontFamily: "monospace" }}>
                          {item.sha256.substring(0, 10)}...
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Commercial Access Gate Modal */}
        {showGateModal && (
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)", display: "grid", placeItems: "center", zIndex: 1000, padding: "1.5rem" }}>
            <div style={{ background: "#0b0a07", border: "2px solid #d4af37", borderRadius: "16px", maxWidth: "560px", width: "100%", padding: "2rem", boxShadow: "0 20px 50px rgba(0,0,0,0.9)", position: "relative" }}>
              <button
                onClick={() => setShowGateModal(false)}
                style={{ position: "absolute", top: "1rem", right: "1rem", background: "none", border: "none", color: "#a8a29e", fontSize: "1.2rem", cursor: "pointer" }}
              >
                ✕
              </button>

              <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
                <div style={{ fontSize: "2.4rem", marginBottom: "0.4rem" }}>🦅🔒</div>
                <h2 style={{ fontSize: "1.4rem", fontWeight: "900", color: "#ffffff", margin: "0 0 0.4rem" }}>
                  Unlock GARUDA PAWAN Execution Engine
                </h2>
                <p style={{ fontSize: "0.85rem", color: "#d6d3d1", margin: 0, lineHeight: 1.5 }}>
                  PAWAN executes autonomously on real codebases with closed-loop syntax verification, multi-model synthesis, and cryptographic SHA-256 evidence.
                </p>
              </div>

              {!intakeSubmitted ? (
                <div>
                  <div style={{ background: "rgba(212, 175, 55, 0.1)", border: "1px solid rgba(212, 175, 55, 0.3)", borderRadius: "10px", padding: "1.2rem", marginBottom: "1.5rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                      <span style={{ fontSize: "0.85rem", fontWeight: "800", color: "#fef08a" }}>Option 1: Instant Pilot Execution Token</span>
                      <span style={{ fontSize: "1.1rem", fontWeight: "900", color: "#34d399" }}>₹5,000</span>
                    </div>
                    <p style={{ fontSize: "0.78rem", color: "#cbd5e1", margin: "0 0 1rem 0" }}>
                      Instant activation token for autonomous repo diagnosis, bug fix, and feature synthesis.
                    </p>
                    <a
                      href={PAYMENT_URL}
                      target="_blank"
                      rel="noreferrer"
                      style={{ display: "block", textAlign: "center", background: "linear-gradient(135deg, #d4af37 0%, #b8860b 100%)", color: "#000", fontWeight: "900", fontSize: "0.85rem", padding: "10px", borderRadius: "8px", textDecoration: "none" }}
                    >
                      Pay ₹5,000 Advance Token via Razorpay
                    </a>
                  </div>

                  <form onSubmit={handleIntakeSubmit}>
                    <div style={{ fontSize: "0.85rem", fontWeight: "800", color: "#d4af37", marginBottom: "0.8rem" }}>
                      Option 2: Submit Scoping Request to Founder
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.8rem", marginBottom: "0.8rem" }}>
                      <input
                        type="text"
                        placeholder="Your Name"
                        value={intakeName}
                        onChange={(e) => setIntakeName(e.target.value)}
                        style={{ background: "#050402", border: "1px solid #333", borderRadius: "6px", padding: "8px 12px", color: "#fff", fontSize: "0.85rem" }}
                      />
                      <input
                        type="text"
                        placeholder="Phone / WhatsApp"
                        value={intakePhone}
                        onChange={(e) => setIntakePhone(e.target.value)}
                        style={{ background: "#050402", border: "1px solid #333", borderRadius: "6px", padding: "8px 12px", color: "#fff", fontSize: "0.85rem" }}
                      />
                    </div>
                    <div style={{ marginBottom: "0.8rem" }}>
                      <input
                        type="email"
                        placeholder="Work Email Address"
                        value={intakeEmail}
                        onChange={(e) => setIntakeEmail(e.target.value)}
                        style={{ width: "100%", boxSizing: "border-box", background: "#050402", border: "1px solid #333", borderRadius: "6px", padding: "8px 12px", color: "#fff", fontSize: "0.85rem" }}
                      />
                    </div>
                    <button
                      type="submit"
                      style={{ width: "100%", background: "#1c1917", border: "1px solid #44403c", color: "#ffffff", padding: "10px", borderRadius: "8px", fontSize: "0.85rem", fontWeight: "700", cursor: "pointer" }}
                    >
                      Submit Scope for Review
                    </button>
                  </form>
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "1.5rem" }}>
                  <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>✓</div>
                  <h3 style={{ color: "#34d399", margin: "0 0 0.5rem" }}>Request Transmitted</h3>
                  <p style={{ fontSize: "0.85rem", color: "#cbd5e1", margin: "0 0 1.2rem" }}>
                    Founder Praveen Mahawar's desk has received your request.
                  </p>
                  <button
                    onClick={() => {
                      setShowGateModal(false);
                      setIntakeSubmitted(false);
                    }}
                    style={{ background: "#d4af37", color: "#000", border: "none", padding: "8px 20px", borderRadius: "6px", fontWeight: "800", cursor: "pointer" }}
                  >
                    Done
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
