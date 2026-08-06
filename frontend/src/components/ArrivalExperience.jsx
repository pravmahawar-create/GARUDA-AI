import React, { useEffect, useMemo, useState } from "react";

export default function ArrivalExperience({ onEnter }) {
  const [isTransitioning, setIsTransitioning] = useState(false);
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

  function handleEnter() {
    if (isTransitioning) return;
    setIsTransitioning(true);
    onEnter();
  }

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      if (isTransitioning) return;
      event.preventDefault();
      handleEnter();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isTransitioning]);

  const particleNodes = useMemo(
    () => new Array(14).fill(0).map((_, index) => ({ id: `particle-${index + 1}` })),
    []
  );

  return (
    <div
      className={`garuda-arrival ${isTransitioning ? "garuda-arrival--exit" : ""}`}
      data-enter="ready"
      data-motion={prefersReducedMotion ? "reduced" : "full"}
      style={{
        background: "radial-gradient(circle at center, #111827 0%, #030712 100%)",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "fixed",
        inset: 0,
        zIndex: 9999
      }}
    >
      {/* Background Layer with Dark Vignette & Overlay */}
      <div className="garuda-arrival__background-layer" aria-hidden="true">
        <div className="garuda-arrival__overlay" />
        <div className="garuda-arrival__vignette" />
      </div>

      {/* Subtle Premium Animated Particle Atmosphere */}
      <div className="garuda-arrival__atmosphere-layer" aria-hidden="true">
        {particleNodes.map((particle, index) => (
          <span key={particle.id} className={`garuda-arrival__particle-dot garuda-arrival__particle-dot--${(index % 7) + 1}`} />
        ))}
      </div>

      {/* Opening Experience Content */}
      <div className="garuda-arrival__content" style={{ textAlign: "center", zIndex: 10, maxWidth: "600px", padding: "2rem" }}>
        <h1 style={{ fontSize: "3.5rem", fontWeight: 800, letterSpacing: "0.18em", color: "#ffffff", margin: "0 0 0.5rem 0", textTransform: "uppercase" }}>
          GARUDA
        </h1>
        <h2 style={{ color: "#fbbf24", letterSpacing: "0.22em", fontSize: "1.1rem", fontWeight: 700, margin: "0 0 1.25rem 0", textTransform: "uppercase" }}>
          AI OPERATING SYSTEM
        </h2>
        <p style={{ color: "#9ca3af", fontSize: "1.15rem", letterSpacing: "0.08em", margin: "0 0 2.25rem 0" }}>
          Build. Deploy. Scale.
        </p>

        <button
          className="garuda-arrival__button"
          onClick={handleEnter}
          aria-label="ENTER GARUDA"
          style={{
            background: "linear-gradient(135deg, #fbbf24 0%, #d97706 100%)",
            color: "#000000",
            border: "none",
            padding: "0.9rem 2.25rem",
            fontSize: "1rem",
            fontWeight: 800,
            letterSpacing: "0.15em",
            borderRadius: "6px",
            cursor: "pointer",
            boxShadow: "0 0 20px rgba(251, 191, 36, 0.35)",
            transition: "all 0.25s ease"
          }}
        >
          ENTER GARUDA
        </button>
      </div>
    </div>
  );
}
