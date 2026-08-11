import React from "react";

const FALLBACK_COLORS = ["#d4af37", "#2563eb", "#16a34a", "#7c3aed", "#f87171", "#eab308", "#22d3ee"];

export default function DonutChart({ segments = [], size = 190, thickness = 26, centerLabel = "", centerSub = "" }) {
  const items = (Array.isArray(segments) ? segments : []).filter((s) => s && Number(s.value) > 0);
  const total = items.reduce((sum, s) => sum + Number(s.value), 0);

  const radius = (size - thickness) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * radius;

  let offset = 0;
  const arcs = items.map((s, i) => {
    const frac = Number(s.value) / total;
    const len = frac * circumference;
    const arc = {
      color: s.color || FALLBACK_COLORS[i % FALLBACK_COLORS.length],
      dash: `${len} ${circumference - len}`,
      offset: -offset
    };
    offset += len;
    return arc;
  });

  return (
    <svg viewBox={`0 0 ${size} ${size}`} width="100%" maxWidth={size} role="img" aria-label={centerLabel || "distribution"}>
      <circle cx={cx} cy={cy} r={radius} fill="rgba(17,24,39,0.5)" />
      {arcs.map((arc, i) => (
        <circle
          key={i}
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke={arc.color}
          strokeWidth={thickness}
          strokeDasharray={arc.dash}
          strokeDashoffset={arc.offset}
          transform={`rotate(-90 ${cx} ${cy})`}
        />
      ))}
      <text x="50%" y="47%" textAnchor="middle" fill="#eef1f6" fontSize={size * 0.155} fontWeight="800" fontFamily="Manrope, sans-serif">
        {centerLabel}
      </text>
      <text x="50%" y="58%" textAnchor="middle" fill="#8b94a6" fontSize={size * 0.075} fontWeight="500">
        {centerSub}
      </text>
    </svg>
  );
}