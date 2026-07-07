import React from "react";
import { getRevealProgress } from "./AnimationManager";

export default function CameraController({ time, children }) {
  const reveal = getRevealProgress(time);
  const translateY = (1 - reveal) * -8;
  const scale = 1 + reveal * 0.04;

  return (
    <div className="arrival-engine__camera" style={{ transform: `translate3d(0, ${translateY}px, 0) scale(${scale})` }}>
      {children}
    </div>
  );
}
