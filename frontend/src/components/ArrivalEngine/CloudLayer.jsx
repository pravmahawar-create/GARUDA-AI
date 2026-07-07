import React from "react";
import { getCloudOffset } from "./AnimationManager";

export default function CloudLayer({ time }) {
  const offset = getCloudOffset(time);

  return (
    <div className="arrival-engine__cloud-layer" aria-hidden="true">
      <div className="arrival-engine__cloud arrival-engine__cloud--one" style={{ transform: `translateX(${offset}px)` }} />
      <div className="arrival-engine__cloud arrival-engine__cloud--two" style={{ transform: `translateX(${-offset * 0.6}px)` }} />
    </div>
  );
}
