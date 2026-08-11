import React from "react";

const GOLD = "#d4af37";

export default function Sparkline({ data = [], width = 520, height = 150, color = GOLD, strokeWidth = 2.5, label = "", value = "" }) {
  const values = (Array.isArray(data) ? data : []).filter((v) => typeof v === "number" && Number.isFinite(v));
  const hasData = values.length > 1;

  if (!hasData) {
    return (
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} role="img" aria-label={label}>
        <rect x="8" y="8" width={width - 16} height={height - 16} rx="14" fill="rgba(17,24,39,0.4)" />
        <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" fill="#8b94a6" fontSize="13">
          {label ? `${label} — awaiting live data` : "Awaiting live data"}
        </text>
      </svg>
    );
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const pad = 14;
  const stepX = (width - pad * 2) / (values.length - 1);
  const points = values.map((v, i) => {
    const x = pad + i * stepX;
    const y = height - pad - ((v - min) / range) * (height - pad * 2);
    return [x, y];
  });

  const linePath = points.map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1][0].toFixed(1)} ${height - pad} L ${pad} ${height - pad} Z`;
  const last = points[points.length - 1];
  const gradientId = `spark-${label.replace(/[^a-z0-9]/gi, "") || "line"}`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} role="img" aria-label={label}>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradientId})`} />
      <path d={linePath} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={last[0]} cy={last[1]} r="4.5" fill={color} />
      {value && (
        <text x={last[0] - 6} y={last[1] - 12} textAnchor="end" fill="#eef1f6" fontSize="14" fontWeight="700" fontFamily="Manrope, sans-serif">
          {value}
        </text>
      )}
    </svg>
  );
}