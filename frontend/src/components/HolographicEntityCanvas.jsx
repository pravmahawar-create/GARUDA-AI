import React, { useEffect, useRef } from "react";

/**
 * 🦅 GARUDA Sovereign Holographic Cyber-Entity
 * Avengers / Iron Man JARVIS Tier — Flagship Visual Presence & Kinetic Hologram
 * Pure Canvas 2D / 60fps WebGL-grade mathematical rendering with Arc Reactor Core,
 * 3D Toroidal Particle Storm, Dynamic Audio Spectrum Visualizer & Cyber-Eagle Sigil.
 */

export default function HolographicEntityCanvas({
  visualState = "IDLE", // IDLE | THINKING | SPEAKING | EXECUTING | ANSWERING | DEMONSTRATION_COMPLETE
  size = 320,
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

    // Pre-allocate 128 Particle Quantum Torus
    const PARTICLE_COUNT = 96;
    const particles = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const angle = (i / PARTICLE_COUNT) * Math.PI * 2;
      const radius = 55 + Math.random() * 65;
      particles.push({
        angle,
        radius,
        baseRadius: radius,
        speed: (0.006 + Math.random() * 0.015) * (i % 2 === 0 ? 1 : -1),
        size: 1 + Math.random() * 2.2,
        alpha: 0.3 + Math.random() * 0.7,
        z: Math.random() * 2 - 1, // 3D depth simulation
        pulseSpeed: 0.03 + Math.random() * 0.04,
        pulseOffset: Math.random() * Math.PI * 2
      });
    }

    let time = 0;
    let confirmPulseRadius = 0;
    let confirmPulseAlpha = 0;

    const render = () => {
      time += 0.035;
      ctx.clearRect(0, 0, width, height);

      // Determine effective state
      const state = isSpeaking ? "SPEAKING" : visualState;

      // 1. Dynamic state-based colors & glow
      let coreGlow = 0.45 + Math.sin(time * 2) * 0.15;
      let coreRadius = 42;
      let primaryColor = "251, 191, 36"; // Gold #fbbf24
      let secondaryColor = "56, 189, 248"; // Cyan #38bdf8
      let accentColor = "245, 158, 11"; // Amber

      if (state === "THINKING") {
        primaryColor = "56, 189, 248"; // High-tech Cyan
        secondaryColor = "168, 85, 247"; // Neural Purple
        accentColor = "99, 102, 241"; // Indigo
        coreGlow = 0.7 + Math.sin(time * 6) * 0.25;
        coreRadius = 38 + Math.sin(time * 8) * 4;
      } else if (state === "SPEAKING" || state === "ANSWERING") {
        primaryColor = "251, 191, 36"; // Sovereign Gold
        secondaryColor = "245, 158, 11";
        accentColor = "254, 240, 138";
        coreGlow = 0.8 + Math.sin(time * 4) * 0.2;
        coreRadius = 44 + Math.sin(time * 6) * 6;
      } else if (state === "EXECUTING") {
        primaryColor = "168, 85, 247"; // Quantum Purple
        secondaryColor = "56, 189, 248";
        accentColor = "251, 191, 36";
        coreGlow = 0.85 + Math.sin(time * 6) * 0.15;
        coreRadius = 46 + Math.sin(time * 5) * 5;
      } else if (state === "DEMONSTRATION_COMPLETE") {
        primaryColor = "16, 185, 129"; // Emerald Verification
        secondaryColor = "251, 191, 36";
        accentColor = "52, 211, 153";
        coreGlow = 0.9;
      }

      // 2. Deep Holographic Ambient Radial Void
      const auraGradient = ctx.createRadialGradient(
        centerX,
        centerY,
        coreRadius * 0.3,
        centerX,
        centerY,
        width * 0.49
      );
      auraGradient.addColorStop(0, `rgba(${primaryColor}, ${coreGlow * 0.5})`);
      auraGradient.addColorStop(0.4, `rgba(${secondaryColor}, ${coreGlow * 0.18})`);
      auraGradient.addColorStop(0.85, `rgba(3, 7, 18, 0.25)`);
      auraGradient.addColorStop(1, "rgba(0, 0, 0, 0)");

      ctx.fillStyle = auraGradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, width * 0.49, 0, Math.PI * 2);
      ctx.fill();

      // 3. Rotating Hyper-Tech Arc Reactor Rings (Concentric Sacred Geometry)
      ctx.lineWidth = 1.4;
      const ring1Angle = time * (state === "THINKING" ? 1.2 : 0.3);
      const ring2Angle = -time * (state === "THINKING" ? 0.9 : 0.22);
      const ring3Angle = time * 0.15;

      // Ring 1: Precision Graduated Outer HUD Ring
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(ring1Angle);
      ctx.strokeStyle = `rgba(${primaryColor}, ${0.5 + Math.sin(time * 2) * 0.2})`;
      ctx.setLineDash([16, 6, 4, 6]);
      ctx.beginPath();
      ctx.arc(0, 0, coreRadius + 38, 0, Math.PI * 2);
      ctx.stroke();

      // Degree Graduation Marks
      for (let i = 0; i < 24; i++) {
        const deg = (i / 24) * Math.PI * 2;
        const len = i % 6 === 0 ? 8 : 4;
        ctx.strokeStyle = `rgba(${primaryColor}, ${i % 6 === 0 ? 0.8 : 0.35})`;
        ctx.lineWidth = i % 6 === 0 ? 1.8 : 1.0;
        ctx.beginPath();
        ctx.moveTo(Math.cos(deg) * (coreRadius + 38), Math.sin(deg) * (coreRadius + 38));
        ctx.lineTo(Math.cos(deg) * (coreRadius + 38 + len), Math.sin(deg) * (coreRadius + 38 + len));
        ctx.stroke();
      }
      ctx.restore();

      // Ring 2: Intermediate Tactical Data Ring
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(ring2Angle);
      ctx.strokeStyle = `rgba(${secondaryColor}, ${0.55 + Math.cos(time * 2) * 0.15})`;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 14, 2, 14]);
      ctx.beginPath();
      ctx.arc(0, 0, coreRadius + 22, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // Ring 3: Inner Magnetic Confinement Ring
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(ring3Angle);
      ctx.strokeStyle = `rgba(${accentColor}, 0.65)`;
      ctx.lineWidth = 1.0;
      ctx.setLineDash([2, 8]);
      ctx.beginPath();
      ctx.arc(0, 0, coreRadius + 10, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // 4. State-Reactive 3D Particle Swarm with Depth Perspective
      particles.forEach((p, idx) => {
        let currentRadius = p.baseRadius;
        let speed = p.speed;

        if (state === "THINKING") {
          currentRadius = p.baseRadius * (0.7 + Math.sin(time * 3 + idx) * 0.2);
          speed *= 2.8;
        } else if (state === "SPEAKING") {
          currentRadius = p.baseRadius + Math.sin(time * 5 + idx * 0.4) * 14;
          speed *= 1.6;
        } else if (state === "EXECUTING") {
          currentRadius = p.baseRadius * (1.15 + Math.sin(time * 4 + idx) * 0.25);
          speed *= 3.2;
        }

        p.angle += speed;
        const pz = Math.sin(time * p.pulseSpeed * 8 + p.pulseOffset);
        const scale3d = 0.8 + pz * 0.3; // 3D depth scaling
        const px = centerX + Math.cos(p.angle) * currentRadius * scale3d;
        const py = centerY + Math.sin(p.angle) * currentRadius * (scale3d * 0.7); // Elliptical 3D tilt

        const alpha = p.alpha * (0.4 + (pz + 1) * 0.3);

        ctx.fillStyle = `rgba(${primaryColor}, ${alpha})`;
        ctx.beginPath();
        ctx.arc(px, py, p.size * scale3d, 0, Math.PI * 2);
        ctx.fill();

        // Connect adjacent quantum nodes
        if (idx % 3 === 0 && idx > 0) {
          const prev = particles[idx - 1];
          const prevX = centerX + Math.cos(prev.angle) * prev.baseRadius * 0.9;
          const prevY = centerY + Math.sin(prev.angle) * prev.baseRadius * 0.65;
          const dist = Math.hypot(px - prevX, py - prevY);
          if (dist < 45) {
            ctx.strokeStyle = `rgba(${secondaryColor}, ${0.25 * (1 - dist / 45)})`;
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(px, py);
            ctx.lineTo(prevX, prevY);
            ctx.stroke();
          }
        }
      });

      // 5. Dynamic Audio Spectrum Equalizer (Pulsates powerfully when speaking)
      if (state === "SPEAKING" || isSpeaking) {
        ctx.save();
        ctx.translate(centerX, centerY);
        const barCount = 36;
        for (let i = 0; i < barCount; i++) {
          const barTheta = (i / barCount) * Math.PI * 2;
          const freqAmp = Math.abs(Math.sin(barTheta * 4 + time * 10)) * 14 + Math.abs(Math.sin(barTheta * 8 - time * 6)) * 8;
          const r1 = coreRadius + 4;
          const r2 = r1 + freqAmp;
          ctx.strokeStyle = `rgba(${primaryColor}, 0.85)`;
          ctx.lineWidth = 2.0;
          ctx.beginPath();
          ctx.moveTo(Math.cos(barTheta) * r1, Math.sin(barTheta) * r1);
          ctx.lineTo(Math.cos(barTheta) * r2, Math.sin(barTheta) * r2);
          ctx.stroke();
        }
        ctx.restore();
      }

      // 6. Central Arc Reactor Sovereign Core
      const sphereGrad = ctx.createRadialGradient(
        centerX - coreRadius * 0.2,
        centerY - coreRadius * 0.2,
        1,
        centerX,
        centerY,
        coreRadius
      );
      sphereGrad.addColorStop(0, `rgba(255, 255, 255, 0.95)`);
      sphereGrad.addColorStop(0.25, `rgba(${accentColor}, 0.9)`);
      sphereGrad.addColorStop(0.65, `rgba(${primaryColor}, 0.8)`);
      sphereGrad.addColorStop(0.95, `rgba(${secondaryColor}, 0.5)`);
      sphereGrad.addColorStop(1, "rgba(3, 7, 18, 0.6)");

      ctx.fillStyle = sphereGrad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, coreRadius, 0, Math.PI * 2);
      ctx.fill();

      // 7. Sovereign Golden Eagle Head / Crown Sigil (Clean, Razor-Sharp Cybernetic Crest)
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.95 + Math.sin(time * 3) * 0.05})`;
      ctx.fillStyle = `rgba(3, 7, 18, 0.85)`;
      ctx.lineWidth = 2.0;
      ctx.setLineDash([]);

      const scale = 0.72;
      // Majestic Sharp Garuda Head Silhouette
      ctx.beginPath();
      ctx.moveTo(0, -28 * scale); // Crown apex
      ctx.lineTo(-12 * scale, -16 * scale); // Left crown spike
      ctx.lineTo(-8 * scale, -8 * scale);
      ctx.lineTo(-20 * scale, -2 * scale); // Left brow
      ctx.lineTo(-14 * scale, 8 * scale);
      ctx.lineTo(-4 * scale, 12 * scale);
      ctx.lineTo(0, 24 * scale); // Razor Beak tip
      ctx.lineTo(4 * scale, 12 * scale);
      ctx.lineTo(14 * scale, 8 * scale);
      ctx.lineTo(20 * scale, -2 * scale); // Right brow
      ctx.lineTo(8 * scale, -8 * scale);
      ctx.lineTo(12 * scale, -16 * scale); // Right crown spike
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Central Crown Power Crystal
      ctx.fillStyle = `rgba(${primaryColor}, 0.95)`;
      ctx.beginPath();
      ctx.moveTo(0, -22 * scale);
      ctx.lineTo(5 * scale, -14 * scale);
      ctx.lineTo(0, -6 * scale);
      ctx.lineTo(-5 * scale, -14 * scale);
      ctx.closePath();
      ctx.fill();

      // Glowing Cyan Neural Eye Optics (Twin conscious laser optics)
      const eyeGlow = 0.85 + Math.sin(time * 8) * 0.15;
      ctx.fillStyle = state === "THINKING" ? `rgba(56, 189, 248, ${eyeGlow})` : `rgba(255, 255, 255, ${eyeGlow})`;
      ctx.shadowColor = `rgba(${secondaryColor}, 1.0)`;
      ctx.shadowBlur = 8;
      // Left eye
      ctx.beginPath();
      ctx.ellipse(-7 * scale, -2 * scale, 3 * scale, 1.4 * scale, -0.25, 0, Math.PI * 2);
      ctx.fill();
      // Right eye
      ctx.beginPath();
      ctx.ellipse(7 * scale, -2 * scale, 3 * scale, 1.4 * scale, 0.25, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0; // Reset shadow

      // 8. Iron Man JARVIS Sci-Fi HUD Reticle Brackets
      ctx.strokeStyle = `rgba(${primaryColor}, 0.65)`;
      ctx.lineWidth = 1.4;
      const bSize = coreRadius + 48;
      const bCorner = 14;
      // Top-Left
      ctx.beginPath(); ctx.moveTo(-bSize, -bSize + bCorner); ctx.lineTo(-bSize, -bSize); ctx.lineTo(-bSize + bCorner, -bSize); ctx.stroke();
      // Top-Right
      ctx.beginPath(); ctx.moveTo(bSize - bCorner, -bSize); ctx.lineTo(bSize, -bSize); ctx.lineTo(bSize, -bSize + bCorner); ctx.stroke();
      // Bottom-Left
      ctx.beginPath(); ctx.moveTo(-bSize, bSize - bCorner); ctx.lineTo(-bSize, bSize); ctx.lineTo(-bSize + bCorner, bSize); ctx.stroke();
      // Bottom-Right
      ctx.beginPath(); ctx.moveTo(bSize - bCorner, bSize); ctx.lineTo(bSize, bSize); ctx.lineTo(bSize, bSize - bCorner); ctx.stroke();

      ctx.restore();

      // 9. Verification Shockwave Pulse
      if (state === "DEMONSTRATION_COMPLETE") {
        if (confirmPulseRadius === 0) {
          confirmPulseRadius = coreRadius;
          confirmPulseAlpha = 1.0;
        }
        confirmPulseRadius += 3.5;
        confirmPulseAlpha *= 0.94;

        ctx.strokeStyle = `rgba(16, 185, 129, ${confirmPulseAlpha})`;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(centerX, centerY, confirmPulseRadius, 0, Math.PI * 2);
        ctx.stroke();

        if (confirmPulseAlpha < 0.05) {
          confirmPulseRadius = 0;
        }
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [visualState, size, isSpeaking]);

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <canvas
        ref={canvasRef}
        style={{ width: size, height: size }}
        className="block drop-shadow-[0_0_35px_rgba(245,158,11,0.35)]"
      />
    </div>
  );
}
