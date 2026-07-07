import React, { useEffect, useState } from "react";
import learningEngine from "../learning/LearningEngine";

export default function LearningPanel() {
  const [state, setState] = useState(null);

  useEffect(() => {
    const sample = learningEngine.recordExperience({
      goal: "Improve intelligence visibility",
      action: "Prepare advisory recommendations",
      expectedResult: "Founder-facing guidance",
      actualResult: "Recommendations prepared successfully",
      successScore: 78,
      failureReason: "None",
      confidenceChange: 6,
      lessonsLearned: ["Keep proposals advisory", "Preserve approval gates"]
    });

    setState({
      experienceCount: learningEngine.experienceEngine.records.length,
      learningScore: learningEngine.learningScore,
      confidenceScore: learningEngine.confidenceScore,
      topLessons: learningEngine.generateLessons(),
      recentSuccesses: learningEngine.remember().filter((item) => (item.successScore || 0) >= 70),
      recentFailures: learningEngine.remember().filter((item) => (item.successScore || 0) < 50),
      bestRecommendations: [sample.experience?.goal || "No recommendation yet"]
    });
  }, []);

  if (!state) return null;

  return (
    <aside className="learning-panel" aria-label="Learning panel">
      <h3>Learning Panel</h3>
      <p><strong>Experience Count:</strong> {state.experienceCount}</p>
      <p><strong>Learning Score:</strong> {state.learningScore}</p>
      <p><strong>Confidence Score:</strong> {state.confidenceScore}</p>
      <p><strong>Top Lessons:</strong> {state.topLessons.join(", ") || "None"}</p>
      <p><strong>Recent Successes:</strong> {state.recentSuccesses.length}</p>
      <p><strong>Recent Failures:</strong> {state.recentFailures.length}</p>
      <p><strong>Best Recommendations:</strong> {state.bestRecommendations.join(", ") || "None"}</p>
    </aside>
  );
}
