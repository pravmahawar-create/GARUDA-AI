import React, { useMemo, useState } from "react";
import BrandAssetManagerImage from "./BrandAssetManagerImage";

export default function ArrivalExperience({ onEnter }) {
  const [isTransitioning, setIsTransitioning] = useState(false);

  const layers = useMemo(
    () => [
      { id: "background", className: "kingdom-arrival__background-layer" },
      { id: "atmosphere", className: "kingdom-arrival__atmosphere-layer" },
      { id: "weather", className: "kingdom-arrival__weather-layer" },
      { id: "sigil", className: "kingdom-arrival__sigil-layer" },
      { id: "kingdom", className: "kingdom-arrival__kingdom-layer" },
      { id: "transition", className: "kingdom-arrival__transition-layer" }
    ],
    []
  );

  function handleEnter() {
    setIsTransitioning(true);
    window.setTimeout(() => {
      onEnter();
    }, 260);
  }

  return (
    <div className={`kingdom-arrival ${isTransitioning ? "kingdom-arrival--exit" : ""}`}>
      {layers.map((layer) => (
        <div key={layer.id} className={layer.className} aria-hidden="true" />
      ))}

      <div className="kingdom-arrival__background-layer kingdom-arrival__background-layer--visual" aria-hidden="true">
        <div className="kingdom-arrival__aurora" />
        <div className="kingdom-arrival__mist kingdom-arrival__mist--one" />
        <div className="kingdom-arrival__mist kingdom-arrival__mist--two" />
        <div className="kingdom-arrival__kingdom-glow" />
      </div>

      <div className="kingdom-arrival__atmosphere-layer kingdom-arrival__atmosphere-layer--visual" aria-hidden="true">
        <div className="kingdom-arrival__wind kingdom-arrival__wind--one" />
        <div className="kingdom-arrival__wind kingdom-arrival__wind--two" />
        <span className="kingdom-arrival__particle kingdom-arrival__particle--one" />
        <span className="kingdom-arrival__particle kingdom-arrival__particle--two" />
        <span className="kingdom-arrival__particle kingdom-arrival__particle--three" />
      </div>

      <div className="kingdom-arrival__weather-layer kingdom-arrival__weather-layer--visual" aria-hidden="true">
        <div className="kingdom-arrival__flash" />
        <div className="kingdom-arrival__flash kingdom-arrival__flash--secondary" />
      </div>

      <div className="kingdom-arrival__sigil-layer kingdom-arrival__sigil-layer--visual" aria-hidden="true">
        <div className="kingdom-arrival__sigil" aria-label="GARUDA sigil">
          <BrandAssetManagerImage kind="sigil" alt="GARUDA sigil" className="kingdom-arrival__sigil-image" />
        </div>
      </div>

      <div className="kingdom-arrival__kingdom-layer kingdom-arrival__kingdom-layer--visual" aria-hidden="true">
        <div className="kingdom-arrival__guardian" />
        <div className="kingdom-arrival__kingdom-asset">
          <BrandAssetManagerImage kind="kingdom" alt="Kingdom background" className="kingdom-arrival__kingdom-image" />
        </div>
      </div>

      <div className="kingdom-arrival__transition-layer" aria-hidden="true" />

      <div className="kingdom-arrival__content">
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
