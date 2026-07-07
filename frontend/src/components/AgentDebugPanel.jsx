import React, { useEffect, useMemo, useState } from "react";
import agentManager from "../agents/AgentManager";
import { DEFAULT_AGENT_CONFIG } from "../config/agentConfig";

export default function AgentDebugPanel() {
  const [health, setHealth] = useState(agentManager.getAgentHealth());
  const [enabled, setEnabled] = useState(DEFAULT_AGENT_CONFIG.debugPanelEnabled);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setHealth(agentManager.getAgentHealth());
    }, 2000);

    return () => window.clearInterval(timer);
  }, []);

  const providers = useMemo(() => health.availableProviders || [], [health]);

  if (!enabled) return null;

  return (
    <aside className="agent-debug-panel" aria-label="Agent debug panel">
      <h3>Agent Health</h3>
      <p><strong>Active Provider:</strong> {health.activeProvider}</p>
      <p><strong>Available Providers:</strong> {providers.map((provider) => provider.name).join(", ")}</p>
      <p><strong>Fallback Status:</strong> {health.fallbackStatus}</p>
      <p><strong>Agent Health:</strong> {health.agentHealth?.status || "standby"}</p>
      <small>{health.agentHealth?.message || "Agent manager ready."}</small>
      <button type="button" onClick={() => setEnabled(false)}>Hide panel</button>
    </aside>
  );
}
