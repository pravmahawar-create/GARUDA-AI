import React, { useEffect, useMemo, useState } from "react";
import BrandAssetManagerImage from "./BrandAssetManagerImage";

export default function ArrivalExperience({ onEnter }) {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [time, setTime] = useState(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const applyPreference = () => setPrefersReducedMotion(mediaQuery.matches);

    applyPreference();
    mediaQuery.addEventListener("change", applyPreference);

    return () => {
      mediaQuery.removeEventListener("change", applyPreference);
    };
  }, []);

  useEffect(() => {
    if (prefersReducedMotion) {
      setTime(8);
      return undefined;
    }

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
  }, [prefersReducedMotion]);

  function handleEnter() {
    if (isTransitioning) return;
    setIsTransitioning(true);
    window.setTimeout(() => {
      onEnter();
    }, 560);
  }

  const progress = useMemo(() => {
    if (time <= 2.8) return 0;
    if (time >= 7.2) return 100;
    return Math.round(((time - 2.8) / (7.2 - 2.8)) * 100);
  }, [time]);

  const welcomeVisible = time >= 2;
  const initVisible = time >= 3.4;
  const portalVisible = time >= 5.6;
  const enterReady = time >= 7.2;

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      if (!enterReady || isTransitioning) return;
      event.preventDefault();
      handleEnter();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enterReady, isTransitioning]);

  const particleNodes = useMemo(
    () => new Array(14).fill(0).map((_, index) => ({ id: `particle-${index + 1}` })),
    []
  );

  return (
    <div
      className={`kingdom-arrival kingdom-arrival--v2 ${isTransitioning ? "kingdom-arrival--exit" : ""}`}
      data-enter={enterReady ? "ready" : "loading"}
      data-portal={portalVisible ? "open" : "closed"}
      data-motion={prefersReducedMotion ? "reduced" : "full"}
    >
      <div className="kingdom-arrival__background-layer kingdom-arrival__background-layer--visual" aria-hidden="true">
        <BrandAssetManagerImage kind="kingdom" alt="GARUDA Kingdom Portal artwork" className="kingdom-arrival__bg-image" />
        <div className="kingdom-arrival__readability-overlay" />
        <div className="kingdom-arrival__artwork-mask" />
        <div className="kingdom-arrival__vignette" />
      </div>

      <div className="kingdom-arrival__atmosphere-layer kingdom-arrival__atmosphere-layer--visual" aria-hidden="true">
        {particleNodes.map((particle, index) => (
          <span key={particle.id} className={`kingdom-arrival__particle-dot kingdom-arrival__particle-dot--${(index % 7) + 1}`} />
        ))}
      </div>

      <div className="kingdom-arrival__sigil-layer kingdom-arrival__sigil-layer--visual" aria-hidden="true">
        <div className="kingdom-arrival__sigil" aria-label="GARUDA sigil">
          <BrandAssetManagerImage kind="sigil" alt="GARUDA sigil" className="kingdom-arrival__sigil-image" />
        </div>
      </div>

      <div className="kingdom-arrival__kingdom-layer kingdom-arrival__kingdom-layer--visual" aria-hidden="true">
        <div className="kingdom-arrival__portal-gate">
          <div className="kingdom-arrival__portal-door kingdom-arrival__portal-door--left" />
          <div className="kingdom-arrival__portal-door kingdom-arrival__portal-door--right" />
        </div>
        <div className="kingdom-arrival__portal-arch" />
        <div className="kingdom-arrival__portal-floor" />
      </div>

      <div className="kingdom-arrival__content kingdom-arrival__content--minimal">
        {welcomeVisible ? <h1>Welcome Back, Founder.</h1> : null}
        {initVisible ? <p className="kingdom-arrival__status">Initializing Mother Brain...</p> : null}

        <div className="kingdom-arrival__progress" aria-hidden="true">
          <span className="kingdom-arrival__progress-fill" style={{ width: `${progress}%` }} />
        </div>

        {enterReady ? (
          <button className="kingdom-arrival__button" onClick={handleEnter} aria-label="Enter GARUDA">
            ENTER GARUDA
          </button>
        ) : null}
      </div>
    </div>
  );
}
