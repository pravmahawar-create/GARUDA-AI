import React, { useEffect, useState } from "react";
import continuousThinkingEngine from "../intelligence/ContinuousThinkingEngine";

export default function IntelligencePanel() {
  const [state, setState] = useState(null);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setState(continuousThinkingEngine.think({
        projectArchitecture: "modular frontend and service layers",
        revenueOpportunities: ["premium workflow automation"],
        userExperience: "stable"
      }));
    }, 3500);

    return () => window.clearInterval(timer);
  }, []);

  if (!state) return null;

  return (
    <aside className="intelligence-panel" aria-label="Continuous intelligence panel">
      <h3>Intelligence Panel</h3>
      <p><strong>Status:</strong> {state.thinkingStatus}</p>
      <p><strong>Observation:</strong> {state.observation?.status || "observing"}</p>
      <p><strong>Latest Idea:</strong> {state.idea?.title || "No new ideas yet"}</p>
      <p><strong>Latest Opportunities:</strong> {state.opportunities?.businessOpportunities?.join(", ") || "None"}</p>
      <p><strong>Score:</strong> {state.intelligenceScores?.overallIntelligenceScore || 0}</p>
      <p><strong>Pipeline:</strong> {state.strategy?.nextStep || "Awaiting founder review"}</p>
    </aside>
  );
}
