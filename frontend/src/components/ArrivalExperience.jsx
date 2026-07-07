import React, { useState } from "react";
import BrandAssetImage from "./BrandAssetImage";

export default function ArrivalExperience({ onEnter }) {
  const [isTransitioning, setIsTransitioning] = useState(false);

  function handleEnter() {
    setIsTransitioning(true);
    window.setTimeout(() => {
      onEnter();
    }, 260);
  }

  return (
    <div className={`kingdom-arrival ${isTransitioning ? "kingdom-arrival--exit" : ""}`}>
      <div className="kingdom-arrival__aurora" />
      <div className="kingdom-arrival__wind kingdom-arrival__wind--one" />
      <div className="kingdom-arrival__wind kingdom-arrival__wind--two" />
      <span className="kingdom-arrival__particle kingdom-arrival__particle--one" />
      <span className="kingdom-arrival__particle kingdom-arrival__particle--two" />
      <span className="kingdom-arrival__particle kingdom-arrival__particle--three" />
      <div className="kingdom-arrival__flash" />

      <div className="kingdom-arrival__content">
        <div className="kingdom-arrival__sigil" aria-label="GARUDA sigil">
          <BrandAssetImage kind="sigil" alt="GARUDA sigil" className="kingdom-arrival__sigil-image" />
        </div>

        <p className="eyebrow">Royal access protocol</p>
        <h1>GARUDA THE KING</h1>
        <h2>Welcome to the World of GARUDA</h2>
        <p className="kingdom-arrival__tagline">One Command. Infinite Intelligence.</p>
        <p className="kingdom-arrival__welcome">Namaste Praveen. Founder access verified.</p>
        <button className="kingdom-arrival__button" onClick={handleEnter}>
          Enter GARUDA OS
        </button>
      </div>
    </div>
  );
}
