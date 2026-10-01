import React, { useState, useEffect } from "react";
import { SIMULATION_MODES, PRESET_PROMPTS, simulateResponse } from "../services/simulatorService";
import { trackEvent } from "../utils/telemetry";

export default function LiveGarudaPlayground({ onDeployClinic, onDeploySales, onGetStarterKit }) {
  const [activeMode, setActiveMode] = useState(SIMULATION_MODES.CLINIC);
  const [currentPrompt, setCurrentPrompt] = useState(PRESET_PROMPTS[SIMULATION_MODES.CLINIC][0].text);
  const [inputMessage, setInputMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState(null);

  // Trigger initial simulation on load so visitor immediately sees a working bot
  useEffect(() => {
    const initialPrompt = PRESET_PROMPTS[SIMULATION_MODES.CLINIC][0].text;
    setCurrentPrompt(initialPrompt);
    setResult(simulateResponse(SIMULATION_MODES.CLINIC, initialPrompt));
  }, []);

  const handleModeChange = (mode) => {
    setActiveMode(mode);
    const defaultPrompt = PRESET_PROMPTS[mode][0].text;
    setCurrentPrompt(defaultPrompt);
    setInputMessage("");
    setIsProcessing(true);
    trackEvent("playground_tab_selected", { mode });

    setTimeout(() => {
      setResult(simulateResponse(mode, defaultPrompt));
      setIsProcessing(false);
    }, 180);
  };

  const handleSelectPrompt = (promptText) => {
    setCurrentPrompt(promptText);
    setInputMessage("");
    setIsProcessing(true);
    trackEvent("playground_preset_clicked", { mode: activeMode, prompt: promptText.slice(0, 30) });

    setTimeout(() => {
      setResult(simulateResponse(activeMode, promptText));
      setIsProcessing(false);
      trackEvent("playground_interaction_completed", { mode: activeMode });
    }, 200);
  };

  const handleExecute = (e) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim()) return;
    const submittedText = inputMessage.trim();
    setCurrentPrompt(submittedText);
    setInputMessage("");
    setIsProcessing(true);
    trackEvent("playground_custom_submit", { mode: activeMode });

    setTimeout(() => {
      setResult(simulateResponse(activeMode, submittedText));
      setIsProcessing(false);
      trackEvent("playground_interaction_completed", { mode: activeMode });
    }, 220);
  };

  const handleCTAClick = () => {
    trackEvent("playground_cta_click", { mode: activeMode, ctaType: result?.ctaType });
    if (result?.ctaType === "code" && onGetStarterKit) {
      onGetStarterKit();
    } else if (result?.ctaType === "clinic" && onDeployClinic) {
      onDeployClinic();
    } else if (onDeploySales) {
      onDeploySales();
    }
  };

  return (
    <div
      role="region"
      aria-label="Live GARUDA AI Command Console"
      style={{
        background: "linear-gradient(180deg, #10141D 0%, #0B0E14 100%)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        borderRadius: 22,
        boxShadow: "0 28px 70px -10px rgba(10, 14, 22, 0.45), 0 2px 10px rgba(0, 0, 0, 0.2)",
        padding: "clamp(1.2rem, 2.5vw, 1.8rem)",
        maxWidth: 620,
        width: "100%",
        margin: "0 auto",
        textAlign: "left",
        color: "#f3f4f6",
        position: "relative",
        overflow: "hidden"
      }}
    >
      {/* Subtle top edge gold highlight */}
      <div style={{
        position: "absolute",
        top: 0,
        left: "15%",
        right: "15%",
        height: 1,
        background: "linear-gradient(90deg, transparent, rgba(179, 130, 53, 0.5), transparent)"
      }} />

      {/* Mode Selector Tabs (Matching Reference Design) */}
      <div
        role="tablist"
        aria-label="Simulation Modes"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "0.4rem",
          background: "#080B10",
          padding: "0.3rem",
          borderRadius: 14,
          marginBottom: "1.2rem",
          border: "1px solid rgba(255, 255, 255, 0.06)"
        }}
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeMode === SIMULATION_MODES.CLINIC}
          onClick={() => handleModeChange(SIMULATION_MODES.CLINIC)}
          style={{
            background: activeMode === SIMULATION_MODES.CLINIC ? "rgba(179, 130, 53, 0.18)" : "transparent",
            border: activeMode === SIMULATION_MODES.CLINIC ? "1px solid #B38235" : "1px solid transparent",
            color: activeMode === SIMULATION_MODES.CLINIC ? "#F5D76E" : "#8D95A7",
            padding: "0.6rem 0.5rem",
            borderRadius: 10,
            fontWeight: 700,
            fontSize: "clamp(0.74rem, 1.4vw, 0.84rem)",
            cursor: "pointer",
            transition: "all 0.16s ease",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.45rem"
          }}
        >
          <span style={{ fontSize: "0.9rem" }}>📋</span>
          <span>Clinic Reception</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeMode === SIMULATION_MODES.SALES}
          onClick={() => handleModeChange(SIMULATION_MODES.SALES)}
          style={{
            background: activeMode === SIMULATION_MODES.SALES ? "rgba(179, 130, 53, 0.18)" : "transparent",
            border: activeMode === SIMULATION_MODES.SALES ? "1px solid #B38235" : "1px solid transparent",
            color: activeMode === SIMULATION_MODES.SALES ? "#F5D76E" : "#8D95A7",
            padding: "0.6rem 0.5rem",
            borderRadius: 10,
            fontWeight: 700,
            fontSize: "clamp(0.74rem, 1.4vw, 0.84rem)",
            cursor: "pointer",
            transition: "all 0.16s ease",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.45rem"
          }}
        >
          <span style={{ fontSize: "0.9rem" }}>🎯</span>
          <span>Lead Qualifier</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeMode === SIMULATION_MODES.CODE}
          onClick={() => handleModeChange(SIMULATION_MODES.CODE)}
          style={{
            background: activeMode === SIMULATION_MODES.CODE ? "rgba(179, 130, 53, 0.18)" : "transparent",
            border: activeMode === SIMULATION_MODES.CODE ? "1px solid #B38235" : "1px solid transparent",
            color: activeMode === SIMULATION_MODES.CODE ? "#F5D76E" : "#8D95A7",
            padding: "0.6rem 0.5rem",
            borderRadius: 10,
            fontWeight: 700,
            fontSize: "clamp(0.74rem, 1.4vw, 0.84rem)",
            cursor: "pointer",
            transition: "all 0.16s ease",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.45rem"
          }}
        >
          <span style={{ fontSize: "0.85rem" }}>&lt;/&gt;</span>
          <span>Code Engine</span>
        </button>
      </div>

      {/* Interactive Chat Canvas (Matching Exact Reference Layout) */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.9rem", marginBottom: "1.1rem" }}>
        {/* User Inbound Message */}
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
          <div style={{
            width: 34,
            height: 34,
            borderRadius: "50%",
            background: "#0D2E1C",
            border: "1px solid rgba(37, 211, 102, 0.35)",
            display: "grid",
            placeItems: "center",
            flexShrink: 0,
            fontSize: "1.05rem"
          }}>
            💬
          </div>
          <div style={{
            flex: 1,
            background: "#151B26",
            border: "1px solid rgba(255, 255, 255, 0.06)",
            borderRadius: "4px 16px 16px 16px",
            padding: "0.9rem 1.1rem",
            position: "relative"
          }}>
            <p style={{ margin: 0, fontSize: "0.88rem", lineHeight: 1.55, color: "#E5E7EB" }}>
              {currentPrompt}
            </p>
            <div style={{ textAlign: "right", marginTop: "0.4rem", fontSize: "0.68rem", color: "#687082" }}>
              10:24 AM
            </div>
          </div>
        </div>

        {/* GARUDA AI Autonomous Response */}
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
          <div style={{
            width: 34,
            height: 34,
            borderRadius: "50%",
            background: "#181408",
            border: "1px solid rgba(179, 130, 53, 0.5)",
            display: "grid",
            placeItems: "center",
            flexShrink: 0,
            overflow: "hidden"
          }}>
            <img src="/images/garuda_eagle_sigil.png" alt="GARUDA" style={{ width: 20, height: 16, objectFit: "contain" }} />
          </div>
          <div style={{
            flex: 1,
            background: "#1B2332",
            border: "1px solid rgba(179, 130, 53, 0.2)",
            borderRadius: "4px 16px 16px 16px",
            padding: "1rem 1.15rem",
            position: "relative"
          }}>
            {/* Priority & Triage Metadata Bar (only when urgent or code mode) */}
            {result && result.humanEscalationRequired && (
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "0.4rem",
                marginBottom: "0.7rem",
                paddingBottom: "0.5rem",
                borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
                fontSize: "0.72rem",
                fontFamily: "ui-monospace, monospace"
              }}>
                <span style={{
                  color: result.priorityColor,
                  fontWeight: 800,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.3rem"
                }}>
                  ● {result.priority}
                </span>
                <span style={{ color: "#8D95A7" }}>{result.category}</span>
                <span style={{ color: "#F87171", fontWeight: 700 }}>⚠️ Human Flag</span>
              </div>
            )}

            {/* Code Snippet if Code Mode */}
            {result?.codeSnippet && (
              <pre style={{
                background: "#080B10",
                border: "1px solid rgba(56, 189, 248, 0.25)",
                borderRadius: 8,
                padding: "0.75rem",
                color: "#38bdf8",
                fontSize: "0.75rem",
                fontFamily: "ui-monospace, monospace",
                overflowX: "auto",
                margin: "0 0 0.8rem 0",
                lineHeight: 1.45
              }}>
                <code>{result.codeSnippet}</code>
              </pre>
            )}

            {/* Main AI Response Body */}
            <div style={{
              fontSize: "0.9rem",
              lineHeight: 1.62,
              color: "#F3F4F6",
              whiteSpace: "pre-line"
            }}>
              {isProcessing ? "Analyzing input against business rules..." : (result ? result.reply : "Ready.")}
            </div>

            <div style={{ textAlign: "right", marginTop: "0.4rem", fontSize: "0.68rem", color: "#687082" }}>
              10:24 AM
            </div>
          </div>
        </div>
      </div>

      {/* Input Bar with Attachment Paperclip & Golden Send Button */}
      <form onSubmit={handleExecute} style={{
        display: "flex",
        alignItems: "center",
        gap: "0.6rem",
        background: "#080B10",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        borderRadius: 14,
        padding: "0.4rem 0.5rem 0.4rem 0.9rem",
        marginBottom: "0.75rem"
      }}>
        <span style={{ fontSize: "1.05rem", color: "#6B7280", cursor: "default" }}>📎</span>
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Type a message to try the simulation..."
          aria-label="Simulation message input"
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            color: "#ffffff",
            fontSize: "0.86rem",
            outline: "none",
            fontFamily: "'Inter', sans-serif"
          }}
        />
        <button
          type="submit"
          disabled={isProcessing}
          style={{
            background: "linear-gradient(135deg, #C48B28 0%, #9E6D1C 100%)",
            color: "#ffffff",
            border: "none",
            borderRadius: 10,
            width: 36,
            height: 36,
            display: "grid",
            placeItems: "center",
            cursor: "pointer",
            opacity: isProcessing ? 0.6 : 1,
            boxShadow: "0 4px 12px rgba(179, 130, 53, 0.35)",
            fontSize: "0.95rem"
          }}
          aria-label="Simulate message execution"
        >
          ➤
        </button>
      </form>

      {/* Console Subtitle / Verification Disclaimer */}
      <div style={{
        textAlign: "center",
        fontSize: "0.72rem",
        color: "#687082",
        fontFamily: "'Inter', sans-serif"
      }}>
        SIMULATION: Demo environment — no real patient data is used.
      </div>
    </div>
  );
}
