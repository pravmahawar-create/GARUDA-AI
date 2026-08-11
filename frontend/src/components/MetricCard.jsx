import React from "react";
import { motion } from "framer-motion";

export default function MetricCard({ icon, title, value, detail, tone = "gold", onClick }) {
  const toneId = (tone === "gold" || tone === "silver" ? tone : "gold");
  return (
    <motion.article
      className={`fd-stat metric-card--${toneId}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      onClick={onClick}
      style={{ cursor: onClick ? "pointer" : "default", display: "flex", flexDirection: "column", gap: "0.6rem" }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "1.3rem", color: toneId === "gold" ? "var(--fd-gold)" : "var(--fd-blue)" }}>{icon}</span>
        <span className="fd-stat__label">{title}</span>
        <span className="metric-card__icon" style={{ display: "none" }}>{icon}</span>
      </div>
      <div className="fd-stat__value" style={{ color: toneId === "gold" ? "var(--fd-gold)" : "var(--fd-text)" }}>{value}</div>
      <span className="fd-stat__detail">{detail}</span>
    </motion.article>
  );
}