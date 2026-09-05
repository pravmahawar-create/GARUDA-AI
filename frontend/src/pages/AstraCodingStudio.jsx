import React, { useState, useEffect, useRef } from "react";

const SpeechRec = typeof window !== "undefined" ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null;

export default function AstraCodingStudio() {
  const [instruction, setInstruction] = useState("");
  const [targetFile, setTargetFile] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const [statusInfo, setStatusInfo] = useState(null);
  const [copied, setCopied] = useState(false);

  // 🎙️ Voice & Conversational States
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [voiceMuted, setVoiceMuted] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState("");
  const recognitionRef = useRef(null);

  useEffect(() => {
    fetchStatus();
    fetchHistory();
    if (SpeechRec) {
      setVoiceSupported(true);
    }
  }, []);

  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/astra/status");
      const data = await res.json();
      if (data.success) setStatusInfo(data);
    } catch {}
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch("/api/astra/history?limit=10");
      const data = await res.json();
      if (data.success) setHistory(data.history || []);
    } catch {}
  };

  // 🔊 Astra Speech Response (Talk-Back)
  const astraSpeak = (text) => {
    if (voiceMuted || typeof window === "undefined" || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = "hi-IN";
      utter.rate = 1.0;
      utter.pitch = 1.05;
      window.speechSynthesis.speak(utter);
    } catch {}
  };

  // 🎙️ Toggle Voice Listening
  const toggleVoiceInput = () => {
    if (!SpeechRec) {
      alert("Voice recognition is not supported in this browser. Please use Google Chrome or Edge.");
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
      recognition.lang = "hi-IN"; // Supports Hindi & Hinglish
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsListening(true);
        setVoiceStatus("🎙️ Sun raha hoon Praveen bhai, boliye...");
        astraSpeak("Sun raha hoon Praveen bhai, boliye...");
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

    setLoading(true);
    setError(null);
    setResult(null);
    astraSpeak("Task start kar diya hai. Codebase analyze aur validate kar raha hoon.");

    try {
      const res = await fetch("/api/astra/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instruction: instruction.trim(),
          targetFile: targetFile.trim() || undefined
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Autonomous execution failed.");
      }

      setResult(data.data);
      fetchHistory();
      astraSpeak("Praveen bhai, task complete ho gaya aur syntax verify ho chuka hai.");
    } catch (err) {
      setError(err.message);
      astraSpeak("Execution mein error aayi hai. Screen par check kijiye.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#030712", color: "#f8fafc", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", padding: "2rem 1rem" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        
        {/* Header */}
        <div style={{ borderBottom: "1px solid #1e293b", paddingBottom: "1.5rem", marginBottom: "2rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <div style={{ display: "inline-block", background: "rgba(99, 102, 241, 0.15)", border: "1px solid rgba(99, 102, 241, 0.4)", color: "#818cf8", fontSize: "0.75rem", fontWeight: "800", padding: "4px 12px", borderRadius: "999px", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.5rem" }}>
              🦅 GARUDA ASTRA • SOVEREIGN CODING AGENT
            </div>
            <h1 style={{ fontSize: "1.8rem", fontWeight: "800", margin: "0.2rem 0", color: "#ffffff" }}>
              Autonomous Software Engineering & Voice Console
            </h1>
            <p style={{ margin: 0, color: "#94a3b8", fontSize: "0.9rem" }}>
              Founder: Praveen Mahawar • Two-Way Voice Command Engine • Local Repo Repair & Self-Healing
            </p>
          </div>

          <div style={{ textAlign: "right", display: "flex", gap: "0.8rem", alignItems: "center" }}>
            {/* Mute/Unmute Astra Speech */}
            <button
              type="button"
              onClick={() => setVoiceMuted(!voiceMuted)}
              title={voiceMuted ? "Astra Voice Muted" : "Astra Voice Active"}
              style={{ background: voiceMuted ? "#1e293b" : "rgba(16,185,129,0.15)", border: `1px solid ${voiceMuted ? "#334155" : "#10b981"}`, color: voiceMuted ? "#94a3b8" : "#34d399", padding: "6px 12px", borderRadius: "8px", cursor: "pointer", fontSize: "0.8rem", fontWeight: "700" }}
            >
              {voiceMuted ? "🔇 Astra Voice Muted" : "🔊 Astra Voice ON"}
            </button>

            <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.4rem 0.8rem", borderRadius: "8px", background: "#090d16", border: "1px solid #1e293b", fontSize: "0.8rem", color: "#34d399" }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#10b981", display: "inline-block" }}></span>
              <strong>ASTRA LIVE</strong>
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "2rem" }}>
          
          {/* Interactive Command Input Card */}
          <div style={{ background: "#0b0f19", border: "1px solid #1e293b", borderRadius: "14px", padding: "1.8rem", boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
              <div style={{ fontSize: "0.85rem", color: "#d4af37", fontWeight: "800", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                ⚡ Launch Autonomous Task (Type or Speak)
              </div>

              {/* 🎙️ Big Voice Command Button */}
              <button
                type="button"
                onClick={toggleVoiceInput}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "6px 16px",
                  borderRadius: "999px",
                  background: isListening ? "#ef4444" : "rgba(212, 175, 55, 0.15)",
                  border: `1px solid ${isListening ? "#f87171" : "#d4af37"}`,
                  color: isListening ? "#ffffff" : "#fbbf24",
                  fontSize: "0.8rem",
                  fontWeight: "800",
                  cursor: "pointer",
                  boxShadow: isListening ? "0 0 15px rgba(239, 68, 68, 0.6)" : "none",
                  transition: "all 0.2s ease"
                }}
              >
                <span style={{ fontSize: "1rem" }}>{isListening ? "⏹️" : "🎙️"}</span>
                {isListening ? "STOP LISTENING" : "BOL KAR KAAM BATAO"}
              </button>
            </div>

            {voiceStatus && (
              <div style={{ marginBottom: "0.8rem", padding: "8px 12px", background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.3)", borderRadius: "6px", fontSize: "0.8rem", color: "#fef08a", fontWeight: "600" }}>
                {voiceStatus}
              </div>
            )}

            <form onSubmit={handleExecute}>
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", fontSize: "0.85rem", color: "#cbd5e1", marginBottom: "0.4rem", fontWeight: "600" }}>
                  Task Instruction / Feature / Bug Fix
                </label>
                <textarea
                  rows="3"
                  value={instruction}
                  onChange={(e) => setInstruction(e.target.value)}
                  placeholder="e.g. Bol kar ya likh kar batao: 'billing folder mein order conversation session persistence fix karo'"
                  style={{ width: "100%", boxSizing: "border-box", background: "#040711", border: "1px solid #334155", borderRadius: "8px", padding: "12px", color: "#ffffff", fontSize: "0.95rem", resize: "vertical", outline: "none" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", color: "#cbd5e1", marginBottom: "0.4rem", fontWeight: "600" }}>
                    Target File Path (Optional)
                  </label>
                  <input
                    type="text"
                    value={targetFile}
                    onChange={(e) => setTargetFile(e.target.value)}
                    placeholder="e.g. billing/src/lib/conversation.js"
                    style={{ width: "100%", boxSizing: "border-box", background: "#040711", border: "1px solid #334155", borderRadius: "8px", padding: "10px 12px", color: "#ffffff", fontSize: "0.9rem", outline: "none" }}
                  />
                </div>

                <div style={{ display: "flex", alignItems: "flex-end" }}>
                  <button
                    type="submit"
                    disabled={loading || !instruction.trim()}
                    style={{
                      width: "100%",
                      padding: "12px",
                      background: loading ? "#334155" : "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                      color: "#ffffff",
                      border: "none",
                      borderRadius: "8px",
                      fontWeight: "800",
                      fontSize: "0.95rem",
                      cursor: loading ? "wait" : "pointer",
                      boxShadow: "0 4px 15px rgba(99, 102, 241, 0.4)",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      transition: "all 0.2s ease"
                    }}
                  >
                    {loading ? "⚡ ASTRA IS WORKING..." : "🚀 RUN ASTRA TASK"}
                  </button>
                </div>
              </div>
            </form>

            {/* Quick Prompts for Billing Repair */}
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ fontSize: "0.75rem", color: "#64748b" }}>Quick Repo Tasks:</span>
              <button
                type="button"
                onClick={() => {
                  setInstruction("Diagnose and repair order session persistence across voice clicks in billing app");
                  setTargetFile("billing/src/components/VoiceModal.jsx");
                }}
                style={{ background: "#111827", border: "1px solid #1f2937", color: "#d4af37", fontSize: "0.75rem", padding: "4px 8px", borderRadius: "4px", cursor: "pointer", fontWeight: "600" }}
              >
                🔧 Repair Billing Order Session
              </button>
              <button
                type="button"
                onClick={() => {
                  setInstruction("Create a utility to generate secure random API keys with checksum validation");
                  setTargetFile("src/utils/apiKeyGenerator.js");
                }}
                style={{ background: "#111827", border: "1px solid #1f2937", color: "#94a3b8", fontSize: "0.75rem", padding: "4px 8px", borderRadius: "4px", cursor: "pointer" }}
              >
                API Key Generator
              </button>
            </div>
          </div>

          {/* Execution Result Panel */}
          {error && (
            <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.4)", padding: "1.2rem", borderRadius: "10px", color: "#f87171", fontSize: "0.9rem" }}>
              <strong>Execution Error:</strong> {error}
            </div>
          )}

          {result && (
            <div style={{ background: "#0b0f19", border: "1px solid #1e293b", borderRadius: "14px", padding: "1.8rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                  <span style={{ fontSize: "1.2rem" }}>✅</span>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "1.1rem", color: "#34d399", fontWeight: "800" }}>
                      TASK COMPLETED & VALIDATED
                    </h3>
                    <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>Task ID: {result.taskId}</div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "0.6rem" }}>
                  <span style={{ background: "#111827", border: "1px solid #1f2937", color: "#38bdf8", padding: "4px 10px", borderRadius: "6px", fontSize: "0.75rem", fontWeight: "700" }}>
                    File: {result.file}
                  </span>
                  <span style={{ background: "#111827", border: "1px solid #1f2937", color: "#a7f3d0", padding: "4px 10px", borderRadius: "6px", fontSize: "0.75rem", fontWeight: "700" }}>
                    Heal Cycles: {result.healCyclesRun}
                  </span>
                </div>
              </div>

              {/* SHA-256 Proof */}
              <div style={{ background: "#040711", padding: "0.8rem", borderRadius: "6px", border: "1px solid #1e293b", fontSize: "0.75rem", color: "#64748b", wordBreak: "break-all", marginBottom: "1.2rem" }}>
                <strong style={{ color: "#d4af37" }}>Cryptographic SHA-256 Proof:</strong> {result.sha256}
              </div>

              {/* Trajectory Timeline */}
              <div style={{ marginBottom: "1.2rem" }}>
                <div style={{ fontSize: "0.8rem", color: "#cbd5e1", fontWeight: "700", marginBottom: "0.5rem" }}>
                  Autonomous Trajectory Steps:
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  {result.trajectory?.map((t, idx) => (
                    <div key={idx} style={{ background: "#111827", padding: "8px 12px", borderRadius: "6px", border: "1px solid #1f2937", fontSize: "0.8rem", display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "#818cf8", fontWeight: "700" }}>Step {idx + 1}: {t.step}</span>
                      <span style={{ color: "#94a3b8" }}>{t.summary || t.instruction || t.file || "Completed"}</span>
                    </div>
                  ))}
                </div>
              </div>

              {result.summary && (
                <p style={{ fontSize: "0.85rem", color: "#94a3b8", lineHeight: "1.5", margin: "0.8rem 0" }}>
                  {result.summary}
                </p>
              )}
            </div>
          )}

          {/* Recent Audit Trail History */}
          <div style={{ background: "#0b0f19", border: "1px solid #1e293b", borderRadius: "14px", padding: "1.8rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <div style={{ fontSize: "0.85rem", color: "#cbd5e1", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                📜 Recent Autonomous Execution Log
              </div>
              <button
                type="button"
                onClick={fetchHistory}
                style={{ background: "#111827", border: "1px solid #1f2937", color: "#94a3b8", padding: "4px 10px", borderRadius: "4px", fontSize: "0.75rem", cursor: "pointer" }}
              >
                Refresh
              </button>
            </div>

            {history.length === 0 ? (
              <div style={{ color: "#64748b", fontSize: "0.85rem", textAlign: "center", padding: "1rem" }}>
                No tasks executed yet. Run your first instruction above!
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                {history.map((item, idx) => (
                  <div key={idx} style={{ background: "#090d16", border: "1px solid #1e293b", borderRadius: "8px", padding: "12px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
                    <div>
                      <div style={{ fontSize: "0.85rem", fontWeight: "700", color: "#ffffff" }}>
                        {item.file || item.instruction || item.taskId}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                        {item.timestamp ? new Date(item.timestamp).toLocaleString("en-IN") : "Recent"} • {item.summary || "Task executed"}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                      <span style={{ fontSize: "0.75rem", fontWeight: "700", color: item.success ? "#34d399" : "#f87171", background: item.success ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)", padding: "2px 8px", borderRadius: "4px" }}>
                        {item.success ? "✅ SUCCESS" : "❌ FAILED"}
                      </span>
                      {item.sha256 && (
                        <span style={{ fontSize: "0.7rem", color: "#475569", fontFamily: "monospace" }}>
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

        {/* Footer */}
        <div style={{ textAlign: "center", fontSize: "0.75rem", color: "#475569", borderTop: "1px solid #1e293b", paddingTop: "1.5rem", marginTop: "2rem" }}>
          GARUDA AI Sovereign Astra Agent • Built for Founder Praveen Mahawar<br />
          CLI Command: <code style={{ color: "#d4af37" }}>node src/services/astraCodingAgent/astraCli.js "instruction"</code>
        </div>

      </div>
    </div>
  );
}
