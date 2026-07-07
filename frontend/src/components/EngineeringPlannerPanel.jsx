import React, { useEffect, useState } from "react";
import engineeringPlanner from "../planner/EngineeringPlanner";

export default function EngineeringPlannerPanel() {
  const [plan, setPlan] = useState(null);

  useEffect(() => {
    setPlan(engineeringPlanner.generateRoadmap({
      architectureHealth: "healthy",
      modules: ["frontend", "backend", "knowledge", "creative", "revenue", "mother", "self-build", "continuous-intelligence"],
      observations: ["planning layer is expanding", "approval gates are active"]
    }));
  }, []);

  if (!plan) return null;

  const firstTask = plan.tasks?.[0] || null;

  return (
    <aside className="engineering-planner-panel" aria-label="Engineering planner panel">
      <h3>Engineering Planner</h3>
      <p><strong>Architecture Health:</strong> {plan.architecture?.architectureHealth || "healthy"}</p>
      <p><strong>Missing Features:</strong> {plan.capabilities?.missingFeatures?.join(", ") || "None"}</p>
      <p><strong>Technical Debt:</strong> {plan.dependencies?.risk || "Moderate"}</p>
      <p><strong>Recommended Next Task:</strong> {firstTask?.title || "None"}</p>
      <p><strong>Roadmap Progress:</strong> {plan.progress?.progressPercent || 0}%</p>
      <p><strong>Planning Status:</strong> {plan.planningStatus || "ready"}</p>
    </aside>
  );
}
