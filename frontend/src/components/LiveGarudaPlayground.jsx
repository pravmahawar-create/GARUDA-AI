import React, { useState, useEffect } from "react";
import { SIMULATION_MODES, PRESET_PROMPTS, simulateResponse } from "../services/simulatorService";
import { trackEvent } from "../utils/telemetry";

export default function LiveGarudaPlayground({ onDeployClinic, onDeploySales, onGetStarterKit }) {
  const [activeMode, setActiveMode] = useState(SIMULATION_MODES.CLINIC);
  const [inputMessage, setInputMessage] = useState(PRESET_PROMPTS[SIMULATION_MODES.CLINIC][0].text);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState(null);

  // Trigger initial simulation on load so visitor immediately sees a working bot
  useEffect(() => {
    const initialPrompt = PRESET_PROMPTS[SIMULATION_MODES.CLINIC][0].text;
    setInputMessage(initialPrompt);
    setResult(simulateResponse(SIMULATION_MODES.CLINIC, initialPrompt));
  }, []);

  const handleModeChange = (mode) => {
    setActiveMode(mode);
    const defaultPrompt = PRESET_PROMPTS[mode][0].text;
    setInputMessage(defaultPrompt);
    setIsProcessing(true);
    trackEvent("playground_tab_selected", { mode });

    setTimeout(() => {
      setResult(simulateResponse(mode, defaultPrompt));
      setIsProcessing(false);
    }, 180);
  };

  const handleSelectPrompt = (promptText) => {
    setInputMessage(promptText);
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
    setIsProcessing(true);
    trackEvent("playground_custom_submit", { mode: activeMode });

    setTimeout(() => {
      setResult(simulateResponse(activeMode, inputMessage));
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
      aria-label="Live GARUDA AI Playground"
      style={{
        background: "linear-gradient(180deg, #10141D 0%, #0B0E14 100%)",
        border: "1px solid rgba(201, 154, 50, 0.28)",
        borderRadius: 20,
        boxShadow: "0 24px 60px -12px rgba(23, 24, 27, 0.32), 0 2px 10px rgba(0, 0, 0, 0.2)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        padding: "clamp(1.3rem, 3.2vw, 2rem)",
        maxWidth: 740,
        margin: "0 auto",
        textAlign: "left",
        color: "#f3f4f6"
      }}
    >
      {/* Top Header & Status Badge */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "0.6rem",
        marginBottom: "1.2rem",
        paddingBottom: "0.9rem",
        borderBottom: "1px solid rgba(255, 255, 255, 0.08)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <span style={{ fontSize: "1.1rem", color: "#D6A84F" }}>⚡</span>
          <span style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 800, fontSize: "0.95rem", letterSpacing: "0.06em", color: "#ffffff" }}>
            LIVE GARUDA PLAYGROUND
          </span>
        </div>
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.45rem",
          background: "rgba(5, 150, 105, 0.12)",
          border: "1px solid rgba(5, 150, 105, 0.35)",
          color: "#34D399",
          padding: "0.28rem 0.75rem",
          borderRadius: 999,
          fontSize: "0.72rem",
          fontWeight: 700,
          fontFamily: "ui-monospace, monospace"
        }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#34D399", boxShadow: "0 0 8px #34D399" }} />
          SANDBOX ACTIVE · 0ms
        </div>
      </div>

      {/* Mode Selector Tabs */}
      <div
        role="tablist"
        aria-label="Simulation Modes"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "0.5rem",
          background: "#06090E",
          padding: "0.35rem",
          borderRadius: 12,
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
            background: activeMode === SIMULATION_MODES.CLINIC ? "rgba(201, 154, 50, 0.16)" : "transparent",
            border: activeMode === SIMULATION_MODES.CLINIC ? "1px solid rgba(201, 154, 50, 0.45)" : "1px solid transparent",
            color: activeMode === SIMULATION_MODES.CLINIC ? "#F5D76E" : "#8B94A6",
            padding: "0.65rem 0.5rem",
            borderRadius: 8,
            fontWeight: 700,
            fontSize: "clamp(0.78rem, 1.8vw, 0.88rem)",
            cursor: "pointer",
            transition: "all 0.16s ease",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.4rem"
          }}
        >
          <span>🏥</span>
          <span>Clinic Reception</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeMode === SIMULATION_MODES.SALES}
          onClick={() => handleModeChange(SIMULATION_MODES.SALES)}
          style={{
            background: activeMode === SIMULATION_MODES.SALES ? "rgba(201, 154, 50, 0.16)" : "transparent",
            border: activeMode === SIMULATION_MODES.SALES ? "1px solid rgba(201, 154, 50, 0.45)" : "1px solid transparent",
            color: activeMode === SIMULATION_MODES.SALES ? "#F5D76E" : "#8B94A6",
            padding: "0.65rem 0.5rem",
            borderRadius: 8,
            fontWeight: 700,
            fontSize: "clamp(0.78rem, 1.8vw, 0.88rem)",
            cursor: "pointer",
            transition: "all 0.16s ease",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.4rem"
          }}
        >
          <span>💼</span>
          <span>Lead Qualifier</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeMode === SIMULATION_MODES.CODE}
          onClick={() => handleModeChange(SIMULATION_MODES.CODE)}
          style={{
            background: activeMode === SIMULATION_MODES.CODE ? "rgba(201, 154, 50, 0.16)" : "transparent",
            border: activeMode === SIMULATION_MODES.CODE ? "1px solid rgba(201, 154, 50, 0.45)" : "1px solid transparent",
            color: activeMode === SIMULATION_MODES.CODE ? "#F5D76E" : "#8B94A6",
            padding: "0.65rem 0.5rem",
            borderRadius: 8,
            fontWeight: 700,
            fontSize: "clamp(0.78rem, 1.8vw, 0.88rem)",
            cursor: "pointer",
            transition: "all 0.16s ease",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.4rem"
          }}
        >
          <span>⚡</span>
          <span>Code Engine</span>
        </button>
      </div>

      {/* Preset Prompt Chips */}
      <div style={{ marginBottom: "1rem" }}>
        <span style={{ fontSize: "0.72rem", color: "#8B94A6", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.08em", display: "block", marginBottom: "0.45rem" }}>
          Suggested Scenarios (1-Tap Test):
        </span>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {PRESET_PROMPTS[activeMode].map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => handleSelectPrompt(p.text)}
              style={{
                background: inputMessage === p.text ? "rgba(201, 154, 50, 0.16)" : "rgba(255, 255, 255, 0.04)",
                border: inputMessage === p.text ? "1px solid rgba(201, 154, 50, 0.45)" : "1px solid rgba(255, 255, 255, 0.08)",
                color: inputMessage === p.text ? "#F5D76E" : "#D1D5DB",
                padding: "0.38rem 0.8rem",
                borderRadius: 999,
                fontSize: "0.76rem",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.15s ease"
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Input Form */}
      <form onSubmit={handleExecute} style={{ display: "flex", gap: "0.5rem", marginBottom: "1.2rem" }}>
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Or type a custom scenario..."
          aria-label="Simulation message input"
          style={{
            flex: 1,
            background: "#06090E",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            borderRadius: 10,
            padding: "0.75rem 1rem",
            color: "#ffffff",
            fontSize: "0.9rem",
            outline: "none"
          }}
        />
        <button
          type="submit"
          disabled={isProcessing}
          style={{
            background: "linear-gradient(135deg, #C99A32 0%, #B88924 100%)",
            color: "#080A0E",
            border: "none",
            borderRadius: 10,
            padding: "0 1.35rem",
            fontWeight: 800,
            fontSize: "0.85rem",
            cursor: "pointer",
            opacity: isProcessing ? 0.7 : 1,
            whiteSpace: "nowrap",
            boxShadow: "0 4px 14px rgba(201, 154, 50, 0.25)"
          }}
        >
          {isProcessing ? "Triage..." : "Simulate →"}
        </button>
      </form>

      {/* Structured Output Card */}
      {result && (
        <div style={{
          background: "#080B10",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: 14,
          padding: "1.25rem",
          position: "relative",
          overflow: "hidden"
        }}>
          {/* Header Metadata Bar */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "0.5rem",
            marginBottom: "0.8rem",
            paddingBottom: "0.6rem",
            borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
            fontSize: "0.75rem",
            fontFamily: "ui-monospace, monospace"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{
                background: "rgba(255, 255, 255, 0.05)",
                color: result.priorityColor,
                padding: "0.2rem 0.5rem",
                borderRadius: 4,
                fontWeight: 800,
                border: `1px solid ${result.priorityColor}40`
              }}>
                {result.priority}
              </span>
              <span style={{ color: "#8D95A7" }}>{result.category}</span>
            </div>

            {result.humanEscalationRequired && (
              <span style={{
                color: "#f87171",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.3rem",
                fontWeight: 700
              }}>
                ⚠️ Human Escalation Triggered
              </span>
            )}
          </div>

          {/* Code Snippet (if Code Mode) */}
          {result.codeSnippet && (
            <pre style={{
              background: "#020408",
              border: "1px solid rgba(56, 189, 248, 0.2)",
              borderRadius: 8,
              padding: "0.85rem",
              color: "#38bdf8",
              fontSize: "0.78rem",
              fontFamily: "ui-monospace, monospace",
              overflowX: "auto",
              margin: "0 0 0.8rem 0",
              lineHeight: 1.45
            }}>
              <code>{result.codeSnippet}</code>
            </pre>
          )}

          {/* AI Structured Reply */}
          <div style={{
            fontSize: "0.94rem",
            lineHeight: 1.65,
            color: "#f3f4f6",
            marginBottom: "0.9rem"
          }}>
            {result.reply}
          </div>

          {/* Safety Disclaimer Banner */}
          <div style={{
            background: "rgba(255, 255, 255, 0.03)",
            borderLeft: "3px solid rgba(201, 154, 50, 0.5)",
            padding: "0.5rem 0.8rem",
            fontSize: "0.72rem",
            color: "#9ca3af",
            marginBottom: "1rem"
          }}>
            {result.disclaimer}
          </div>

          {/* Dynamic Post-Interaction CTA */}
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              type="button"
              onClick={handleCTAClick}
              style={{
                background: "linear-gradient(135deg, #C99A32 0%, #B88924 100%)",
                color: "#080A0E",
                border: "none",
                borderRadius: 8,
                padding: "0.65rem 1.4rem",
                fontWeight: 800,
                fontSize: "0.84rem",
                cursor: "pointer",
                boxShadow: "0 4px 15px rgba(201, 154, 50, 0.25)",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem"
              }}
            >
              {result.ctaLabel}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
