import React, { useEffect, useMemo, useState } from "react";
import BrandAssetManagerImage from "./BrandAssetManagerImage";
import FogLayer from "./ArrivalEngine/FogLayer";
import ParticleLayer from "./ArrivalEngine/ParticleLayer";
import LightningLayer from "./ArrivalEngine/LightningLayer";
import CloudLayer from "./ArrivalEngine/CloudLayer";
import GarudaSilhouette from "./ArrivalEngine/GarudaSilhouette";
import CameraController from "./ArrivalEngine/CameraController";
import { getTimelinePhase } from "./ArrivalEngine/TimelineController";

export default function ArrivalExperience({ onEnter }) {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [time, setTime] = useState(0);

  useEffect(() => {
    let frameId;
    let start;

    const tick = (timestamp) => {
      if (!start) start = timestamp;
      const elapsed = (timestamp - start) / 1000;
      setTime(elapsed);
      frameId = window.requestAnimationFrame(tick);
    };

    frameId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frameId);
  }, []);

  const phase = useMemo(() => getTimelinePhase(time), [time]);

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

  function KingdomReveal() {}
  function GarudaLanding() {}
  function FounderWelcome() {}
  function DashboardTransition() {}

  return (
    <div className={`kingdom-arrival ${isTransitioning ? "kingdom-arrival--exit" : ""}`}>
      {layers.map((layer) => (
        <div key={layer.id} className={layer.className} aria-hidden="true" />
      ))}

      <div className="kingdom-arrival__background-layer kingdom-arrival__background-layer--visual" aria-hidden="true">
        <div className="kingdom-arrival__aurora" />
        <div className="kingdom-arrival__mist kingdom-arrival__mist--one" />
        <div className="kingdom-arrival__mist kingdom-arrival__mist--two" />
        <div className="kingdom-arrival__mist kingdom-arrival__mist--three" />
        <div className="kingdom-arrival__kingdom-glow" />
      </div>

      <div className="kingdom-arrival__atmosphere-layer kingdom-arrival__atmosphere-layer--visual" aria-hidden="true">
        <div className="kingdom-arrival__wind kingdom-arrival__wind--one" />
        <div className="kingdom-arrival__wind kingdom-arrival__wind--two" />
        <FogLayer time={time} />
        <ParticleLayer time={time} />
      </div>

      <div className="kingdom-arrival__weather-layer kingdom-arrival__weather-layer--visual" aria-hidden="true">
        <LightningLayer time={time} />
        <CloudLayer time={time} />
      </div>

      <div className="kingdom-arrival__sigil-layer kingdom-arrival__sigil-layer--visual" aria-hidden="true">
        <div className="kingdom-arrival__sigil" aria-label="GARUDA sigil">
          <BrandAssetManagerImage kind="sigil" alt="GARUDA sigil" className="kingdom-arrival__sigil-image" />
        </div>
      </div>

      <div className="kingdom-arrival__kingdom-layer kingdom-arrival__kingdom-layer--visual" aria-hidden="true">
        <CameraController time={time}>
          <div className="kingdom-arrival__guardian" />
          <GarudaSilhouette time={time} />
          <div className="kingdom-arrival__kingdom-asset">
            <BrandAssetManagerImage kind="kingdom" alt="Kingdom background" className="kingdom-arrival__kingdom-image" />
          </div>
        </CameraController>
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

      <div className="arrival-engine__phase" aria-hidden="true">
        <span>{phase?.id}</span>
      </div>
    </div>
  );
}
