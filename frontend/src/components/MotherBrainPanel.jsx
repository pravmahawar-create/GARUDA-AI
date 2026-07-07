import React, { useEffect, useState } from "react";
import motherBrain from "../mother/MotherBrain";

export default function MotherBrainPanel() {
  const [state, setState] = useState(null);

  useEffect(() => {
    motherBrain.registerEngine("continuous-intelligence", { status: "ready" });
    motherBrain.registerEngine("engineering-planner", { status: "ready" });
    motherBrain.registerEngine("self-build", { status: "ready" });
    motherBrain.registerEngine("knowledge", { status: "ready" });
    motherBrain.registerEngine("creative", { status: "ready" });
    motherBrain.registerEngine("revenue", { status: "ready" });
    motherBrain.registerEngine("scanner", { status: "ready" });
    motherBrain.registerEngine("decision-memory", { status: "ready" });
    motherBrain.registerEngine("future-prediction", { status: "ready" });
    motherBrain.registerEngine("innovation", { status: "ready" });
    motherBrain.registerEngine("opportunity-scanner", { status: "ready" });
    setState(motherBrain.generateMasterPlan());
  }, []);

  if (!state) return null;

  return (
    <aside className="mother-brain-panel" aria-label="Mother Brain panel">
      <h3>Mother Brain</h3>
      <p><strong>Registered Engines:</strong> {state.registeredEngines?.map((engine) => engine.name).join(", ") || "None"}</p>
      <p><strong>Engine Health:</strong> {state.overallHealth || "stable"}</p>
      <p><strong>Running Tasks:</strong> {motherBrain.taskCoordinator.getTasks().runningTasks.length}</p>
      <p><strong>Current Global Goal:</strong> {state.globalGoal}</p>
      <p><strong>Highest Priority Recommendation:</strong> {motherBrain.memoryCoordinator.getMemory("latestRecommendation")?.title || "Pending"}</p>
      <p><strong>Thinking Status:</strong> {state.thinkingStatus}</p>
      <p><strong>Planning Status:</strong> {state.planningStatus}</p>
      <p><strong>Synchronization Status:</strong> {state.synchronizationStatus}</p>
      <p><strong>Overall GARUDA Health:</strong> {state.overallHealth}</p>
    </aside>
  );
}
