import React from "react";
import { motion } from "framer-motion";

export default function MetricCard({ icon, title, value, detail, tone = "gold" }) {
  return (
    <motion.article
      className={`metric-card metric-card--${tone}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div className="metric-card__icon">{icon}</div>
      <div>
        <p className="metric-card__title">{title}</p>
        <h3>{value}</h3>
        <span>{detail}</span>
      </div>
    </motion.article>
  );
}