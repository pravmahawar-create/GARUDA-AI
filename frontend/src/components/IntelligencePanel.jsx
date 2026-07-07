import React, { useEffect, useState } from "react";
import thinkingScheduler from "../intelligence/ThinkingScheduler";

export default function IntelligencePanel() {
  const [state, setState] = useState(null);

  useEffect(() => {
    thinkingScheduler.startThinking();
    const timer = window.setInterval(() => {
      setState(thinkingScheduler.getThinkingStatus());
    }, 2000);

    setState(thinkingScheduler.getThinkingStatus());

    return () => {
      window.clearInterval(timer);
      thinkingScheduler.stopThinking();
    };
  }, []);

  if (!state) return null;

  return (
    <aside className="intelligence-panel" aria-label="Continuous intelligence panel">
      <h3>Intelligence Panel</h3>
      <p><strong>Status:</strong> {state.status}</p>
      <p><strong>Observation:</strong> {state.currentObservation?.status || "observing"}</p>
      <p><strong>Latest Recommendation:</strong> {state.currentRecommendation?.title || "No recommendation yet"}</p>
      <p><strong>Current Opportunity:</strong> {state.currentOpportunity || "None"}</p>
      <p><strong>Thinking Queue Size:</strong> {state.thinkingQueueSize || 0}</p>
      <p><strong>Intelligence Score:</strong> {state.intelligenceScores?.overallIntelligenceScore || 0}</p>
      <p><strong>Last Thinking Cycle:</strong> {state.lastCycle ? new Date(state.lastCycle).toLocaleTimeString() : "Pending"}</p>
      <p><strong>Pending Founder Approvals:</strong> {state.pendingFounderApprovals || 0}</p>
    </aside>
  );
}
