import React from 'react';
import { GRAHA_SYMBOL, RASHI_NAMES_EN, RASHI_NAMES_HI, RASHI_SYMBOLS } from '../data/nakshatraIndex';
import type { KundliChart } from '../engine/kundli';
import type { Language } from '../../types';

interface Props {
  chart: KundliChart;
  lang: Language;
}

/**
 * South Indian fixed-sign chart (4×4).
 * Layout: Pisces|Aries|Taurus|Gemini / Aquarius|open|open|Cancer /
 * Capricorn|open|open|Leo / Sagittarius|Scorpio|Libra|Virgo
 */
const GRID: { r: number; c: number; sign: number }[] = [
  { r: 0, c: 0, sign: 11 }, { r: 0, c: 1, sign: 0 }, { r: 0, c: 2, sign: 1 }, { r: 0, c: 3, sign: 2 },
  { r: 1, c: 0, sign: 10 }, { r: 1, c: 3, sign: 3 },
  { r: 2, c: 0, sign: 9 }, { r: 2, c: 3, sign: 4 },
  { r: 3, c: 0, sign: 8 }, { r: 3, c: 1, sign: 7 }, { r: 3, c: 2, sign: 6 }, { r: 3, c: 3, sign: 5 },
];

const CELL = 75;
const SIZE = 300;

export const SouthIndianChart: React.FC<Props> = ({ chart, lang }) => {
  const signNames = lang === 'en' ? RASHI_NAMES_EN : RASHI_NAMES_HI;

  const planetsInSign = (sign: number): string =>
    chart.planets
      .filter((p) => p.rashi === sign)
      .map((p) => GRAHA_SYMBOL[p.key] || p.key)
      .join(' ');

  return (
    <div className="w-full">
      <div className="text-center text-[10px] font-mono text-amber-400 mb-1.5 uppercase tracking-wider">
        {lang === 'en' ? 'South Indian Chart' : 'दक्षिण भारतीय कुण्डली'}
      </div>
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="w-full max-w-[280px] mx-auto filter drop-shadow-[0_0_10px_rgba(212,175,55,0.25)]">
        <rect x="4" y="4" width="292" height="292" fill="#07090E" stroke="#D4AF37" strokeWidth="2" />
        {[1, 2, 3].map((i) => (
          <line key={`h${i}`} x1="4" y1={4 + i * CELL} x2="296" y2={4 + i * CELL} stroke="#D4AF37" strokeWidth="0.9" />
        ))}
        {[1, 2, 3].map((i) => (
          <line key={`v${i}`} x1={4 + i * CELL} y1="4" x2={4 + i * CELL} y2="296" stroke="#D4AF37" strokeWidth="0.9" />
        ))}
        {GRID.map((g) => {
          const x = 4 + g.c * CELL + CELL / 2;
          const y = 4 + g.r * CELL + CELL / 2;
          const planets = planetsInSign(g.sign);
          return (
            <g key={`${g.r}-${g.c}`}>
              <text x={x} y={y - 14} textAnchor="middle" fill="#FDE047" fontSize="12" fontWeight="bold">
                {RASHI_SYMBOLS[g.sign]}
              </text>
              <text x={x} y={y + 2} textAnchor="middle" fill="#FCD34D" fontSize="9" fontWeight="bold">
                {planets}
              </text>
              <text x={x} y={y + 16} textAnchor="middle" fill="#A1A1AA" fontSize="7.5">
                {signNames[g.sign]}
              </text>
            </g>
          );
        })}
        <rect x={4 + CELL} y={4 + CELL} width={CELL * 2} height={CELL * 2} fill="#0A0D14" opacity="0.35" />
        <text x={SIZE / 2} y={SIZE / 2 - 6} textAnchor="middle" fill="#FDE047" fontSize="10" fontWeight="bold">
          {lang === 'en' ? 'LAGNA' : 'लग्न'}
        </text>
        <text x={SIZE / 2} y={SIZE / 2 + 10} textAnchor="middle" fill="#FCD34D" fontSize="9">
          {RASHI_SYMBOLS[chart.planets.length ? chart.lagna % 360 / 30 | 0 : 0]}
        </text>
      </svg>
    </div>
  );
};
