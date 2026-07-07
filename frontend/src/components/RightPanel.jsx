import React from "react";

export default function RightPanel({ health, healthMessage, knowledgeCount, motherBrain = {} }) {
  const normalizedHealth = String(health || "").toLowerCase();
  const isHealthy = ["online", "ok", "healthy", "running", "ready"].includes(normalizedHealth);
  const statusText = normalizedHealth === "checking" ? "Checking" : isHealthy ? "Healthy" : "Offline";
  const statusClass = normalizedHealth === "checking" ? "checking" : isHealthy ? "online" : "offline";
  const scanner = motherBrain.scanner || {};
  const planner = motherBrain.planner || {};
  const builder = motherBrain.builder || {};
  const validator = motherBrain.validator || {};

  return (
    <aside className="right-panel">
      <section className="panel-card">
        <div className="panel-card__header">
          <p className="eyebrow">System Pulse</p>
          <span className={`status-chip ${statusClass}`}>{statusText}</span>
        </div>

        <div className="status-list">
          <div className="status-row">
            <span className="dot" />
            <div>
              <strong>Health API</strong>
              <p>{healthMessage || health}</p>
            </div>
          </div>
          <div className="status-row">
            <span className="dot" />
            <div>
              <strong>Scanner</strong>
              <p>{scanner.status || "offline"} • {scanner.totalFiles || 0} files</p>
            </div>
          </div>
          <div className="status-row">
            <span className="dot" />
            <div>
              <strong>Planner</strong>
              <p>{planner.status || "offline"} • {planner.priorityTask?.title || "No active plan"}</p>
            </div>
          </div>
          <div className="status-row">
            <span className="dot" />
            <div>
              <strong>Knowledge Engine</strong>
              <p>{knowledgeCount} indexed documents</p>
            </div>
          </div>
          <div className="status-row">
            <span className="dot" />
            <div>
              <strong>Builder / Validator</strong>
              <p>{builder.status || "offline"} / {validator.status || "offline"}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="panel-card">
        <p className="eyebrow">Quick Access</p>
        <a className="quick-action" href="#">Open Revenue Universe</a>
        <a className="quick-action" href="#">Review mother plan</a>
        <a className="quick-action" href="#">Launch creative sprint</a>
      </section>

      <section className="panel-card">
        <p className="eyebrow">Vision Stream</p>
        <p>Luxury AI product delivery with disciplined execution and founder-grade clarity.</p>
      </section>
    </aside>
  );
}