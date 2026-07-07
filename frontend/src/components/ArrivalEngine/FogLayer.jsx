import React from "react";
import { getOpacityForTime } from "./AnimationManager";

export default function FogLayer({ time }) {
  const opacity = getOpacityForTime(time);

  return (
    <div className="arrival-engine__fog-layer" style={{ opacity }}>
      <div className="arrival-engine__fog arrival-engine__fog--one" />
      <div className="arrival-engine__fog arrival-engine__fog--two" />
      <div className="arrival-engine__fog arrival-engine__fog--three" />
    </div>
  );
}
