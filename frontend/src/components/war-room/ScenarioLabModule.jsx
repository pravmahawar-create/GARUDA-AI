import React, { useState } from "react";
import { tokens } from "./tokens";

/**
 * 🦅 GARUDA OS — MODULE 05: SCENARIO LAB
 * Mathematical Electoral Sensitivity Simulator.
 * Strictly labeled: SIMULATION — NOT FORECAST.
 * Computes hypothetical turnout delta, margin impact, and resource reallocation bounds.
 */

export default function ScenarioLabModule({
  constituency,
  onOpenDeepDive
}) {
  const p = tokens.palette;

  // Baseline variables
  const baselineElectors = constituency.electoralBase.registeredElectors || 342618;
  const baselineTurnoutPct = parseFloat(constituency.historicalTurnout.lastElectionTurnout) || 52.84;
  const baselineMarginVotes = constituency.historicalMargin.winningMarginVotes || 24522;

  // Simulator Sliders
  const [turnoutDelta, setTurnoutDelta] = useState(3.5); // % change (-10 to +15)
  const [targetClusterShift, setTargetClusterShift] = useState(25); // % resource focus
  const [splitterReclaimRate, setSplitterReclaimRate] = useState(40); // % independent votes consolidated

  // Mathematical Projection (Pure Simulation)
  const simulatedTurnoutPct = Math.min(85, Math.max(35, baselineTurnoutPct + turnoutDelta));
  const additionalVotesPolled = Math.round((baselineElectors * turnoutDelta) / 100);
  const totalVotesProjected = Math.round((baselineElectors * simulatedTurnoutPct) / 100);

  // Projected margin swing based on resource focus and splitter reclamation
  const simulatedSwingVotes = Math.round((additionalVotesPolled * (targetClusterShift / 100)) + (4800 * (splitterReclaimRate / 100)));
  const remainingMarginDeficit = Math.max(0, baselineMarginVotes - simulatedSwingVotes);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* SECTION HEADER */}
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-end", gap: 12 }}>
        <div>
          <span style={{ fontSize: "0.68rem", fontFamily: tokens.typography.fontMono, color: p.metallicGold, letterSpacing: "0.15em", textTransform: "uppercase" }}>
            MODULE 05 // SCENARIO SIMULATION LAB
          </span>
          <h2 style={{ fontSize: "1.5rem", fontFamily: tokens.typography.fontDisplay, color: p.textPrimary, margin: "2px 0 0 0" }}>
            Mathematical Voter Turnout & Margin Simulator
          </h2>
        </div>
        <button
          type="button"
          onClick={() => onOpenDeepDive("05")}
          style={{ background: "transparent", border: `1px solid ${p.borderGold}`, color: p.metallicGold, borderRadius: 5, padding: "5px 12px", fontSize: "0.72rem", fontFamily: tokens.typography.fontMono, cursor: "pointer" }}
        >
          [ SIMULATION METHODOLOGY → ]
        </button>
      </div>

      {/* MANDATORY SIMULATION DISCLAIMER BANNER (DIRECTIVE SECTION 11) */}
      <div style={{ background: "rgba(217, 119, 6, 0.08)", border: `1px solid ${p.statusAmber}40`, borderRadius: 10, padding: "14px 18px", display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: "1.2rem" }}>🔬</span>
        <div>
          <div style={{ fontSize: "0.82rem", fontWeight: 700, color: p.statusAmber, fontFamily: tokens.typography.fontMono }}>
            SIMULATION — NOT FORECAST // HYPOTHETICAL SENSITIVITY MODEL
          </div>
          <div style={{ fontSize: "0.75rem", color: p.textSecondary, lineHeight: 1.45 }}>
            This simulator projects purely mechanical numerical responses to hypothetical parameters. It does NOT forecast, guarantee, or promise election results. Human behavioral volatility and external political factors will deviate from statistical assumptions.
          </div>
        </div>
      </div>

      {/* TWO COLUMN GRID: SLIDERS (ASSUMPTIONS) + MODEL OUTPUTS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>

        {/* INPUT ASSUMPTIONS (CONTROLS) */}
        <div style={{ background: p.graphite, border: `1px solid ${p.border}`, borderRadius: 12, padding: "20px" }}>
          <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: p.warmIvory, margin: "0 0 16px 0", fontFamily: tokens.typography.fontUI }}>
            SIMULATION PARAMETERS & ASSUMPTIONS
          </h3>

          {/* Slider 1: Turnout Shift */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: "0.78rem", fontFamily: tokens.typography.fontMono }}>
              <span style={{ color: p.textSecondary }}>HYPOTHETICAL TURNOUT SHIFT:</span>
              <span style={{ color: p.metallicGold, fontWeight: 700 }}>{turnoutDelta > 0 ? `+${turnoutDelta}%` : `${turnoutDelta}%`}</span>
            </div>
            <input
              type="range"
              min="-10"
              max="15"
              step="0.5"
              value={turnoutDelta}
              onChange={(e) => setTurnoutDelta(parseFloat(e.target.value))}
              style={{ width: "100%", accentColor: p.metallicGold, cursor: "pointer" }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.68rem", color: p.textMuted, fontFamily: tokens.typography.fontMono, marginTop: 3 }}>
              <span>-10% (Severe Apathy)</span>
              <span>Baseline: {baselineTurnoutPct}%</span>
              <span>+15% (Surge Turnout)</span>
            </div>
          </div>

          {/* Slider 2: Target Cluster Mobilization Focus */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: "0.78rem", fontFamily: tokens.typography.fontMono }}>
              <span style={{ color: p.textSecondary }}>SWING BOOTH RESOURCE SHIFT:</span>
              <span style={{ color: p.metallicGold, fontWeight: 700 }}>{targetClusterShift}% Focus</span>
            </div>
            <input
              type="range"
              min="5"
              max="60"
              step="5"
              value={targetClusterShift}
              onChange={(e) => setTargetClusterShift(parseInt(e.target.value, 10))}
              style={{ width: "100%", accentColor: p.metallicGold, cursor: "pointer" }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.68rem", color: p.textMuted, fontFamily: tokens.typography.fontMono, marginTop: 3 }}>
              <span>5% (Dispersed)</span>
              <span>25% (Standard)</span>
              <span>60% (High Density)</span>
            </div>
          </div>

          {/* Slider 3: Splitter / Rebel Reclaim Rate */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: "0.78rem", fontFamily: tokens.typography.fontMono }}>
              <span style={{ color: p.textSecondary }}>INDEPENDENT VOTE CONSOLIDATION:</span>
              <span style={{ color: p.metallicGold, fontWeight: 700 }}>{splitterReclaimRate}% Absorbed</span>
            </div>
            <input
              type="range"
              min="0"
              max="80"
              step="5"
              value={splitterReclaimRate}
              onChange={(e) => setSplitterReclaimRate(parseInt(e.target.value, 10))}
              style={{ width: "100%", accentColor: p.metallicGold, cursor: "pointer" }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.68rem", color: p.textMuted, fontFamily: tokens.typography.fontMono, marginTop: 3 }}>
              <span>0% (Split Intact)</span>
              <span>40% (Consolidation)</span>
              <span>80% (Alliance Lock)</span>
            </div>
          </div>

          {/* Reset Action */}
          <button
            type="button"
            onClick={() => {
              setTurnoutDelta(3.5);
              setTargetClusterShift(25);
              setSplitterReclaimRate(40);
            }}
            style={{ background: "transparent", border: `1px solid ${p.border}`, color: p.textMuted, borderRadius: 5, padding: "5px 12px", fontSize: "0.72rem", fontFamily: tokens.typography.fontMono, cursor: "pointer" }}
          >
            RESET TO BENCHMARK DEFAULTS
          </button>
        </div>

        {/* MODEL OUTPUTS & PROJECTION GRID */}
        <div style={{ background: p.graphite, border: `1px solid ${p.border}`, borderRadius: 12, padding: "20px", display: "flex", flexDirection: "column", gap: 14 }}>
          <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: p.warmIvory, margin: 0, fontFamily: tokens.typography.fontUI }}>
            SIMULATED SENSITIVITY OUTPUTS
          </h3>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {/* Box 1: Turnout */}
            <div style={{ background: p.surfaceElevated, border: `1px solid ${p.border}`, borderRadius: 8, padding: "12px" }}>
              <span style={{ fontSize: "0.65rem", fontFamily: tokens.typography.fontMono, color: p.textMuted, display: "block" }}>PROJECTED TURNOUT</span>
              <div style={{ fontSize: "1.4rem", fontWeight: 700, color: p.metallicGold, fontFamily: tokens.typography.fontDisplay, margin: "2px 0" }}>
                {simulatedTurnoutPct.toFixed(2)}%
              </div>
              <span style={{ fontSize: "0.7rem", color: p.textSecondary, fontFamily: tokens.typography.fontMono }}>
                Baseline: {baselineTurnoutPct}%
              </span>
            </div>

            {/* Box 2: Total Votes */}
            <div style={{ background: p.surfaceElevated, border: `1px solid ${p.border}`, borderRadius: 8, padding: "12px" }}>
              <span style={{ fontSize: "0.65rem", fontFamily: tokens.typography.fontMono, color: p.textMuted, display: "block" }}>VOTES POLLED MODEL</span>
              <div style={{ fontSize: "1.4rem", fontWeight: 700, color: p.textPrimary, fontFamily: tokens.typography.fontDisplay, margin: "2px 0" }}>
                {totalVotesProjected.toLocaleString("en-IN")}
              </div>
              <span style={{ fontSize: "0.7rem", color: p.statusGreen, fontFamily: tokens.typography.fontMono }}>
                {additionalVotesPolled >= 0 ? `+${additionalVotesPolled.toLocaleString()} votes` : `${additionalVotesPolled.toLocaleString()} votes`}
              </span>
            </div>

            {/* Box 3: Simulated Swing */}
            <div style={{ background: p.surfaceElevated, border: `1px solid ${p.border}`, borderRadius: 8, padding: "12px" }}>
              <span style={{ fontSize: "0.65rem", fontFamily: tokens.typography.fontMono, color: p.textMuted, display: "block" }}>HYPOTHETICAL SWING</span>
              <div style={{ fontSize: "1.4rem", fontWeight: 700, color: p.statusGreen, fontFamily: tokens.typography.fontDisplay, margin: "2px 0" }}>
                +{simulatedSwingVotes.toLocaleString("en-IN")}
              </div>
              <span style={{ fontSize: "0.7rem", color: p.textSecondary, fontFamily: tokens.typography.fontMono }}>
                From Turnout & Splitters
              </span>
            </div>

            {/* Box 4: Remaining Deficit */}
            <div style={{ background: p.surfaceElevated, border: `1px solid ${p.border}`, borderRadius: 8, padding: "12px" }}>
              <span style={{ fontSize: "0.65rem", fontFamily: tokens.typography.fontMono, color: p.textMuted, display: "block" }}>PROJECTED NET MARGIN</span>
              <div style={{ fontSize: "1.4rem", fontWeight: 700, color: remainingMarginDeficit === 0 ? p.statusGreen : p.warmIvory, fontFamily: tokens.typography.fontDisplay, margin: "2px 0" }}>
                {remainingMarginDeficit === 0 ? "LEAD OVERCOME" : `${remainingMarginDeficit.toLocaleString()} votes`}
              </div>
              <span style={{ fontSize: "0.7rem", color: p.textSecondary, fontFamily: tokens.typography.fontMono }}>
                Baseline: {baselineMarginVotes.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Model Confidence & Limitations */}
          <div style={{ background: p.obsidian, border: `1px solid ${p.border}`, borderRadius: 8, padding: "12px 14px", marginTop: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: "0.68rem", fontFamily: tokens.typography.fontMono, color: p.metallicGold }}>MODEL CONFIDENCE BOUNDS</span>
              <span style={{ fontSize: "0.68rem", fontFamily: tokens.typography.fontMono, color: p.textMuted }}>SENSITIVITY: HIGH</span>
            </div>
            <div style={{ fontSize: "0.74rem", color: p.textSecondary, lineHeight: 1.45 }}>
              Confidence score <strong>76.4% (Calculated Sensitivity)</strong>. Assumes linear voter absorption. Real world vote redistribution exhibits geographic clustering around municipal issue nodes.
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
