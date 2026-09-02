import React, { useEffect, useRef } from "react";

/**
 * 🦅 GARUDA Sovereign Holographic Entity Canvas
 * Phase 2.1 — Flagship Visual Presence & Acoustic Identity
 * Pure Canvas 2D math simulation with orbital particles, sacred geometry, and state-reactive physics.
 * Zero external libraries, 60fps lightweight rendering, 100% sovereign.
 */

export default function HolographicEntityCanvas({
  visualState = "IDLE", // IDLE | THINKING | SPEAKING | EXECUTING | ANSWERING | DEMONSTRATION_COMPLETE
  size = 280,
  isSpeaking = false,
  className = ""
}) {
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = size;
    let height = size;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const centerX = width / 2;
    const centerY = height / 2;

    // Pre-allocate particle constellation
    const PARTICLE_COUNT = 64;
    const particles = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const angle = (i / PARTICLE_COUNT) * Math.PI * 2;
      const radius = 45 + Math.random() * 45;
      particles.push({
        angle,
        radius,
        baseRadius: radius,
        speed: (0.008 + Math.random() * 0.012) * (i % 2 === 0 ? 1 : -1),
        size: 1 + Math.random() * 2,
        alpha: 0.3 + Math.random() * 0.6,
        pulseSpeed: 0.02 + Math.random() * 0.03,
        pulseOffset: Math.random() * Math.PI * 2
      });
    }

    let time = 0;
    let confirmPulseRadius = 0;
    let confirmPulseAlpha = 0;

    const render = () => {
      time += 0.03;
      ctx.clearRect(0, 0, width, height);

      // Determine effective state
      const state = isSpeaking ? "SPEAKING" : visualState;

      // 1. Dynamic state-based parameters
      let coreGlow = 0.35 + Math.sin(time * 1.5) * 0.1;
      let coreRadius = 38;
      let primaryColor = "251, 191, 36"; // Gold #fbbf24
      let secondaryColor = "217, 119, 6"; // Deep Amber #d97706
      let accentColor = "245, 158, 11"; // Bright Amber

      if (state === "LISTENING") {
        primaryColor = "16, 185, 129"; // Emerald #10b981
        secondaryColor = "56, 189, 248"; // Cyan
        accentColor = "52, 211, 153"; // Mint
        coreGlow = 0.65 + Math.sin(time * 4) * 0.25;
        coreRadius = 36 + Math.sin(time * 3) * 3;
      } else if (state === "THINKING") {
        primaryColor = "56, 189, 248"; // Cyan #38bdf8
        secondaryColor = "251, 191, 36"; // Gold
        accentColor = "99, 102, 241"; // Indigo
        coreGlow = 0.55 + Math.sin(time * 4) * 0.2;
        coreRadius = 32 + Math.sin(time * 6) * 3;
      } else if (state === "SPEAKING" || state === "ANSWERING") {
        primaryColor = "251, 191, 36";
        secondaryColor = "245, 158, 11";
        accentColor = "254, 240, 138";
        coreGlow = 0.65 + Math.sin(time * 3) * 0.25;
        coreRadius = 40 + Math.sin(time * 5) * 5;
      } else if (state === "EXECUTING") {
        primaryColor = "168, 85, 247"; // Purple #a855f7
        secondaryColor = "56, 189, 248"; // Cyan
        accentColor = "251, 191, 36"; // Gold
        coreGlow = 0.75 + Math.sin(time * 5) * 0.2;
        coreRadius = 44 + Math.sin(time * 4) * 4;
      } else if (state === "DEMONSTRATION_COMPLETE") {
        primaryColor = "16, 185, 129"; // Emerald #10b981
        secondaryColor = "251, 191, 36"; // Gold
        accentColor = "52, 211, 153";
        coreGlow = 0.8;
      }

      // 2. Ambient outer aura gradient
      const auraGradient = ctx.createRadialGradient(
        centerX,
        centerY,
        coreRadius * 0.5,
        centerX,
        centerY,
        width * 0.48
      );
      auraGradient.addColorStop(0, `rgba(${primaryColor}, ${coreGlow * 0.45})`);
      auraGradient.addColorStop(0.5, `rgba(${secondaryColor}, ${coreGlow * 0.15})`);
      auraGradient.addColorStop(1, "rgba(0, 0, 0, 0)");

      ctx.fillStyle = auraGradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, width * 0.48, 0, Math.PI * 2);
      ctx.fill();

      // 3. Rotating Sacred Geometry Outer Rings
      ctx.lineWidth = 1.2;
      const ring1Angle = time * (state === "THINKING" ? 0.8 : 0.25);
      const ring2Angle = -time * (state === "THINKING" ? 0.6 : 0.18);

      // Ring 1: Segmented Precision Arc
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(ring1Angle);
      ctx.strokeStyle = `rgba(${primaryColor}, ${0.35 + Math.sin(time) * 0.15})`;
      ctx.setLineDash([14, 8, 4, 8]);
      ctx.beginPath();
      ctx.arc(0, 0, coreRadius + 28, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // Ring 2: Computational Compass Tick Marks
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(ring2Angle);
      ctx.strokeStyle = `rgba(${secondaryColor}, ${0.4 + Math.cos(time) * 0.1})`;
      ctx.setLineDash([4, 12]);
      ctx.beginPath();
      ctx.arc(0, 0, coreRadius + 44, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // 4. State-Reactive Particle Constellation
      particles.forEach((p, idx) => {
        let currentRadius = p.baseRadius;
        let speed = p.speed;

        if (state === "THINKING") {
          currentRadius = p.baseRadius * (0.65 + Math.sin(time * 2 + idx) * 0.15);
          speed *= 2.5;
        } else if (state === "SPEAKING") {
          currentRadius = p.baseRadius + Math.sin(time * 4 + idx * 0.5) * 12;
          speed *= 1.4;
        } else if (state === "EXECUTING") {
          currentRadius = p.baseRadius * (1.1 + Math.sin(time * 3 + idx) * 0.25);
          speed *= 3.0;
        }

        p.angle += speed;
        const px = centerX + Math.cos(p.angle) * currentRadius;
        const py = centerY + Math.sin(p.angle) * currentRadius;
        const alpha = p.alpha * (0.5 + Math.sin(time * p.pulseSpeed * 10 + p.pulseOffset) * 0.5);

        ctx.fillStyle = `rgba(${primaryColor}, ${alpha})`;
        ctx.beginPath();
        ctx.arc(px, py, p.size, 0, Math.PI * 2);
        ctx.fill();

        // Connect adjacent particle computational filaments
        if (idx > 0 && idx % 4 === 0) {
          const prev = particles[idx - 1];
          const prevX = centerX + Math.cos(prev.angle) * prev.baseRadius;
          const prevY = centerY + Math.sin(prev.angle) * prev.baseRadius;
          const dist = Math.hypot(px - prevX, py - prevY);
          if (dist < 40) {
            ctx.strokeStyle = `rgba(${accentColor}, ${(1 - dist / 40) * 0.25})`;
            ctx.lineWidth = 0.75;
            ctx.setLineDash([]);
            ctx.beginPath();
            ctx.moveTo(px, py);
            ctx.lineTo(prevX, prevY);
            ctx.stroke();
          }
        }
      });

      // 5. Active Speech Radial Waveforms (When Speaking)
      if (state === "SPEAKING") {
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.strokeStyle = `rgba(254, 240, 138, ${0.45 + Math.sin(time * 6) * 0.2})`;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([]);
        ctx.beginPath();
        const wavePoints = 48;
        for (let i = 0; i <= wavePoints; i++) {
          const theta = (i / wavePoints) * Math.PI * 2;
          const waveAmp = Math.sin(theta * 6 + time * 8) * 6 + Math.sin(theta * 3 - time * 5) * 4;
          const r = coreRadius + 16 + waveAmp;
          const wx = Math.cos(theta) * r;
          const wy = Math.sin(theta) * r;
          if (i === 0) ctx.moveTo(wx, wy);
          else ctx.lineTo(wx, wy);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
      }

      // 6. Central Sovereign Energy Sphere
      const sphereGrad = ctx.createRadialGradient(
        centerX - coreRadius * 0.25,
        centerY - coreRadius * 0.25,
        2,
        centerX,
        centerY,
        coreRadius
      );
      sphereGrad.addColorStop(0, `rgba(${accentColor}, 0.95)`);
      sphereGrad.addColorStop(0.4, `rgba(${primaryColor}, 0.85)`);
      sphereGrad.addColorStop(0.85, `rgba(${secondaryColor}, 0.6)`);
      sphereGrad.addColorStop(1, "rgba(3, 7, 18, 0.4)");

      ctx.fillStyle = sphereGrad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, coreRadius, 0, Math.PI * 2);
      ctx.fill();

      // 7. Extended Cybernetic Garuda Sovereign Wings & Neural Optics
      ctx.save();
      ctx.translate(centerX, centerY);

      // A. Dynamic Aerodynamic Cyber-Wings (Iron Man / Cybernetic Garuda Matrix)
      const wingFlap = Math.sin(time * (state === "SPEAKING" ? 5 : 2)) * 0.12;
      const wingSpanScale = 1.35;
      ctx.save();
      ctx.scale(wingSpanScale, wingSpanScale);

      // Left Cyber-Wing
      ctx.save();
      ctx.rotate(-wingFlap);
      ctx.strokeStyle = `rgba(${primaryColor}, ${0.7 + Math.sin(time * 3) * 0.2})`;
      ctx.fillStyle = `rgba(${secondaryColor}, 0.25)`;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(-8, -12);
      ctx.lineTo(-32, -28);
      ctx.lineTo(-58, -22);
      ctx.lineTo(-72, -6);
      ctx.lineTo(-50, 14);
      ctx.lineTo(-26, 18);
      ctx.lineTo(-8, 6);
      ctx.closePath();
      ctx.stroke();
      ctx.fill();

      // Left Feather Energy Filaments
      ctx.strokeStyle = `rgba(${accentColor}, 0.6)`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-32, -28); ctx.lineTo(-45, -2);
      ctx.moveTo(-58, -22); ctx.lineTo(-42, 8);
      ctx.stroke();
      ctx.restore();

      // Right Cyber-Wing
      ctx.save();
      ctx.rotate(wingFlap);
      ctx.strokeStyle = `rgba(${primaryColor}, ${0.7 + Math.sin(time * 3) * 0.2})`;
      ctx.fillStyle = `rgba(${secondaryColor}, 0.25)`;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(8, -12);
      ctx.lineTo(32, -28);
      ctx.lineTo(58, -22);
      ctx.lineTo(72, -6);
      ctx.lineTo(50, 14);
      ctx.lineTo(26, 18);
      ctx.lineTo(8, 6);
      ctx.closePath();
      ctx.stroke();
      ctx.fill();

      // Right Feather Energy Filaments
      ctx.strokeStyle = `rgba(${accentColor}, 0.6)`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(32, -28); ctx.lineTo(45, -2);
      ctx.moveTo(58, -22); ctx.lineTo(42, 8);
      ctx.stroke();
      ctx.restore();

      ctx.restore();

      // B. Central Sovereign Garuda Crest & Head
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.9 + Math.sin(time * 2) * 0.1})`;
      ctx.fillStyle = `rgba(${primaryColor}, 0.85)`;
      ctx.lineWidth = 2.0;

      const scale = 0.65;
      ctx.beginPath();
      // Crown Apex
      ctx.moveTo(0, -26 * scale);
      ctx.lineTo(-10 * scale, -14 * scale);
      ctx.lineTo(-18 * scale, -2 * scale);
      ctx.lineTo(-10 * scale, 10 * scale);
      ctx.lineTo(0, 22 * scale); // Beak tip
      ctx.lineTo(10 * scale, 10 * scale);
      ctx.lineTo(18 * scale, -2 * scale);
      ctx.lineTo(10 * scale, -14 * scale);
      ctx.closePath();
      ctx.stroke();
      ctx.fill();

      // Neural Eye Optics (Twin glowing conscious sensors)
      const eyeAlpha = 0.85 + Math.sin(time * 6) * 0.15;
      ctx.fillStyle = state === "THINKING" ? `rgba(56, 189, 248, ${eyeAlpha})` : `rgba(255, 255, 255, ${eyeAlpha})`;
      // Left eye
      ctx.beginPath();
      ctx.ellipse(-6 * scale, -4 * scale, 2.5 * scale, 1.2 * scale, -0.2, 0, Math.PI * 2);
      ctx.fill();
      // Right eye
      ctx.beginPath();
      ctx.ellipse(6 * scale, -4 * scale, 2.5 * scale, 1.2 * scale, 0.2, 0, Math.PI * 2);
      ctx.fill();

      // HUD Targeting Brackets (Iron Man JARVIS style)
      ctx.strokeStyle = `rgba(${accentColor}, 0.5)`;
      ctx.lineWidth = 1.2;
      const bSize = coreRadius + 18;
      // Top-left bracket
      ctx.beginPath();
      ctx.moveTo(-bSize, -bSize + 12); ctx.lineTo(-bSize, -bSize); ctx.lineTo(-bSize + 12, -bSize);
      // Top-right bracket
      ctx.moveTo(bSize - 12, -bSize); ctx.lineTo(bSize, -bSize); ctx.lineTo(bSize, -bSize + 12);
      // Bottom-left bracket
      ctx.moveTo(-bSize, bSize - 12); ctx.lineTo(-bSize, bSize); ctx.lineTo(-bSize + 12, bSize);
      // Bottom-right bracket
      ctx.moveTo(bSize - 12, bSize); ctx.lineTo(bSize, bSize); ctx.lineTo(bSize, bSize - 12);
      ctx.stroke();

      ctx.restore();

      // 8. Cryptographic Confirmation Shockwave Ring (Upon Demo Complete)
      if (state === "DEMONSTRATION_COMPLETE") {
        if (confirmPulseRadius === 0) {
          confirmPulseRadius = coreRadius;
          confirmPulseAlpha = 1.0;
        }
        confirmPulseRadius += 3.5;
        confirmPulseAlpha *= 0.94;

        if (confirmPulseAlpha > 0.02) {
          ctx.strokeStyle = `rgba(16, 185, 129, ${confirmPulseAlpha})`;
          ctx.lineWidth = 2.5;
          ctx.setLineDash([]);
          ctx.beginPath();
          ctx.arc(centerX, centerY, confirmPulseRadius, 0, Math.PI * 2);
          ctx.stroke();
        }
      } else {
        confirmPulseRadius = 0;
        confirmPulseAlpha = 0;
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [size, visualState, isSpeaking]);

  return (
    <div
      className={`relative flex items-center justify-center select-none ${className}`}
      style={{ width: size, height: size }}
      aria-label="GARUDA Sovereign Holographic Entity"
    >
      <canvas
        ref={canvasRef}
        style={{
          width: size,
          height: size,
          display: "block",
          filter: "drop-shadow(0 0 25px rgba(251, 191, 36, 0.45))"
        }}
      />
    </div>
  );
}
