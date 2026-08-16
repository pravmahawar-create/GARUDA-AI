import React from "react";
import { GOLD, MUTED } from "./format";

export default function RevenueAreaChart({ data = [], width = 640, height = 220, color = GOLD, label = "Revenue trend", value = "" }) {
  const values = (Array.isArray(data) ? data : []).filter((v) => typeof v === "number" && Number.isFinite(v));
  const hasData = values.length > 1;

  if (!hasData) {
    return (
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} role="img" aria-label={label}>
        <rect x="10" y="10" width={width - 20} height={height - 20} rx="16" fill="rgba(17,24,39,0.5)" stroke="rgba(212,175,55,0.14)" />
        <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" fill={MUTED} fontSize="13">
          {label} — awaiting verified revenue data
        </text>
      </svg>
    );
  }

  const padX = 34;
  const padTop = 22;
  const padBottom = 28;
  const max = Math.max(...values, 1);
  const stepX = (width - padX * 2) / (values.length - 1);
  const innerH = height - padTop - padBottom;
  const points = values.map((v, i) => {
    const x = padX + i * stepX;
    const y = padTop + innerH - (v / max) * innerH;
    return [x, y];
  });
  const linePath = points.map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1][0].toFixed(1)} ${height - padBottom} L ${padX} ${height - padBottom} Z`;
  const gradId = `rev-${label.replace(/[^a-z0-9]/gi, "") || "trend"}`;
  const last = points[points.length - 1];
  const tickCount = Math.min(values.length, 6);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} role="img" aria-label={label}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.32" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <line x1={padX} y1={padTop + innerH} x2={width - padX} y2={padTop + innerH} stroke="rgba(212,175,55,0.2)" strokeWidth="1" />
      {Array.from({ length: tickCount }).map((_, i) => {
        const v = (max * (i + 1)) / tickCount;
        const y = padTop + innerH - (v / max) * innerH;
        return (
          <g key={i}>
            <line x1={padX} y1={y} x2={width - padX} y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
            <text x={padX - 8} y={y + 3} textAnchor="end" fill={MUTED} fontSize="9">{Math.round(v)}</text>
          </g>
        );
      })}
      <path d={areaPath} fill={`url(#${gradId})`} />
      <path d={linePath} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={last[0]} cy={last[1]} r="4.5" fill={color} />
      {value && (
        <text x={last[0] - 8} y={last[1] - 12} textAnchor="end" fill="#eef1f6" fontSize="13" fontWeight="700" fontFamily="Manrope, sans-serif">
          {value}
        </text>
      )}
    </svg>
  );
}