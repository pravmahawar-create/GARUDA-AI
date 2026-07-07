import React from "react";
import { getOpacityForTime } from "./AnimationManager";

export default function ParticleLayer({ time }) {
  const opacity = getOpacityForTime(time);

  return (
    <div className="arrival-engine__particle-layer" style={{ opacity }}>
      <span className="arrival-engine__particle arrival-engine__particle--one" />
      <span className="arrival-engine__particle arrival-engine__particle--two" />
      <span className="arrival-engine__particle arrival-engine__particle--three" />
      <span className="arrival-engine__particle arrival-engine__particle--four" />
    </div>
  );
}
