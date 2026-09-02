import React from "react";
import { motion } from "framer-motion";
import heroImg from "../assets/garuda_sovereign_hero.png";

/**
 * 🦅 GARUDA Sovereign Hero Avatar — Official Mascot Presence
 * "GARUDA: THE KING OF INTELLIGENCE. ONE COMMAND. INFINITE INTELLIGENCE."
 * Features the official sovereign bird-headed humanoid mascot in black cyber-coat with gold trim,
 * standing on royal stone pedestal with glowing golden wings & sacred geometry.
 */
export default function SovereignHeroAvatar({
  visualState = "IDLE", // IDLE | THINKING | SPEAKING | EXECUTING | DEMONSTRATION_COMPLETE
  isSpeaking = false,
  size = 360,
  className = ""
}) {
  const effectiveState = isSpeaking ? "SPEAKING" : visualState;

  // Glow colors based on sovereign state
  const glowMap = {
    IDLE: "rgba(245, 158, 11, 0.4)",
    THINKING: "rgba(56, 189, 248, 0.6)",
    SPEAKING: "rgba(251, 191, 36, 0.7)",
    EXECUTING: "rgba(168, 85, 247, 0.6)",
    DEMONSTRATION_COMPLETE: "rgba(16, 185, 129, 0.7)"
  };

  const currentGlow = glowMap[effectiveState] || glowMap.IDLE;

  return (
    <div className={`relative flex flex-col items-center justify-center ${className}`}>
      {/* 1. Hyper-Dimensional Ambient Sacred Halo */}
      <motion.div
        animate={{
          scale: effectiveState === "SPEAKING" ? [1, 1.08, 1] : effectiveState === "THINKING" ? [0.95, 1.05, 0.95] : [1, 1.03, 1],
          opacity: effectiveState === "SPEAKING" ? [0.6, 0.9, 0.6] : [0.4, 0.7, 0.4]
        }}
        transition={{ duration: effectiveState === "SPEAKING" ? 1.2 : 3, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: "absolute",
          top: "40%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: `${size * 0.9}px`,
          height: `${size * 0.9}px`,
          background: `radial-gradient(circle, ${currentGlow} 0%, rgba(212, 175, 55, 0.15) 50%, transparent 70%)`,
          filter: "blur(40px)",
          pointerEvents: "none",
          zIndex: 1
        }}
      />

      {/* 2. Rotating Sacred Geometric HUD Ring */}
      <motion.div
        animate={{ rotate: effectiveState === "THINKING" ? 360 : 360 }}
        transition={{ duration: effectiveState === "THINKING" ? 8 : 40, repeat: Infinity, ease: "linear" }}
        style={{
          position: "absolute",
          top: "45%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: `${size * 0.85}px`,
          height: `${size * 0.85}px`,
          borderRadius: "50%",
          border: `1.5px dashed ${effectiveState === "THINKING" ? "rgba(56, 189, 248, 0.4)" : "rgba(212, 175, 55, 0.35)"}`,
          pointerEvents: "none",
          zIndex: 2
        }}
      />

      {/* 3. Authentic Sovereign Hero Mascot Image */}
      <div
        style={{
          position: "relative",
          width: `${size * 0.82}px`,
          height: `${size * 1.1}px`,
          maxHeight: "440px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 5
        }}
      >
        <motion.img
          src={heroImg || "/images/garuda_sovereign_hero.png"}
          alt="GARUDA — The King of Intelligence"
          animate={{
            y: effectiveState === "SPEAKING" ? [-4, 4, -4] : [-2, 2, -2],
            scale: effectiveState === "SPEAKING" ? [1, 1.02, 1] : 1
          }}
          transition={{ duration: effectiveState === "SPEAKING" ? 1.5 : 4, repeat: Infinity, ease: "easeInOut" }}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            filter: `drop-shadow(0 0 25px ${currentGlow})`,
            borderRadius: "16px"
          }}
        />

        {/* Dynamic Voice Waveform Particles when Speaking */}
        {effectiveState === "SPEAKING" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              position: "absolute",
              bottom: "15%",
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              gap: "4px",
              padding: "4px 12px",
              background: "rgba(3, 7, 18, 0.85)",
              border: "1px solid rgba(245, 158, 11, 0.5)",
              borderRadius: "20px",
              boxShadow: "0 0 15px rgba(245, 158, 11, 0.3)",
              zIndex: 10
            }}
          >
            {[12, 24, 18, 28, 14, 22, 10].map((h, i) => (
              <motion.span
                key={i}
                animate={{ height: [6, h, 6] }}
                transition={{ duration: 0.6 + (i % 3) * 0.2, repeat: Infinity, ease: "easeInOut" }}
                style={{
                  width: "3px",
                  background: "linear-gradient(180deg, #f59e0b 0%, #fbbf24 100%)",
                  borderRadius: "2px",
                  display: "inline-block"
                }}
              />
            ))}
          </motion.div>
        )}
      </div>

      {/* 4. Sovereign Crown Seal */}
      <div style={{
        marginTop: "-0.5rem",
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        background: "linear-gradient(135deg, rgba(212, 175, 55, 0.15) 0%, rgba(3, 7, 18, 0.8) 100%)",
        border: "1px solid rgba(212, 175, 55, 0.3)",
        padding: "0.3rem 0.9rem",
        borderRadius: "9999px",
        zIndex: 6
      }}>
        <span style={{ fontSize: "0.85rem" }}>👑</span>
        <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "#fbbf24", letterSpacing: "0.12em", textTransform: "uppercase" }}>
          GARUDA • KING OF INTELLIGENCE
        </span>
      </div>
    </div>
  );
}
