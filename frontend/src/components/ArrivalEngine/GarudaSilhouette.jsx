import React from "react";
import { getRevealProgress, getWingSpread } from "./AnimationManager";

export default function GarudaSilhouette({ time }) {
  const reveal = getRevealProgress(time);
  const wingSpread = getWingSpread(time);

  return (
    <div className="arrival-engine__silhouette-layer" style={{ opacity: reveal }}>
      <div className="arrival-engine__silhouette" style={{ transform: `scale(${0.75 + reveal * 0.22}) rotate(${wingSpread * 4}deg)` }}>
        <div className="arrival-engine__silhouette-wing arrival-engine__silhouette-wing--left" style={{ transform: `rotate(${-24 - wingSpread * 50}deg)` }} />
        <div className="arrival-engine__silhouette-wing arrival-engine__silhouette-wing--right" style={{ transform: `rotate(${24 + wingSpread * 50}deg)` }} />
        <div className="arrival-engine__silhouette-body" />
      </div>
    </div>
  );
}
