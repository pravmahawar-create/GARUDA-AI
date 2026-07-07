import React from "react";

export default function LightningLayer({ time }) {
  const visible = time >= 3.5 && time < 4.5;
  return (
    <div className={`arrival-engine__lightning-layer ${visible ? "is-visible" : ""}`} aria-hidden="true">
      <div className="arrival-engine__lightning" />
    </div>
  );
}
