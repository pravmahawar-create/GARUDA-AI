import React from 'react';
import { GRAHA_SYMBOL } from '../data/nakshatraIndex';
import type { KundliChart } from '../engine/kundli';
import { houseSignMap } from '../engine/kundli';
import { RASHI_NAMES_HI, RASHI_NAMES_EN, RASHI_SYMBOLS } from '../data/nakshatraIndex';
import type { Language } from '../../types';

interface Props {
  chart: KundliChart;
  lang: Language;
}

/** North Indian diamond chart — houses fixed, signs rotate. */
export const NorthIndianChart: React.FC<Props> = ({ chart, lang }) => {
  const signs = houseSignMap(chart);
  const signNames = lang === 'en' ? RASHI_NAMES_EN : RASHI_NAMES_HI;

  const getSignInHouse = (h: number) => signs[h - 1];
  const getPlanets = (h: number) => chart.houseGrahas[h - 1]
    .map((k) => GRAHA_SYMBOL[k] || k)
    .join(' ');

  const cells: { h: number; x: number; y: number }[] = [
    { h: 1, x: 150, y: 68 },
    { h: 2, x: 95, y: 42 },
    { h: 3, x: 48, y: 95 },
    { h: 4, x: 55, y: 150 },
    { h: 5, x: 48, y: 205 },
    { h: 6, x: 95, y: 258 },
    { h: 7, x: 150, y: 232 },
    { h: 8, x: 205, y: 258 },
    { h: 9, x: 252, y: 205 },
    { h: 10, x: 245, y: 150 },
    { h: 11, x: 252, y: 95 },
    { h: 12, x: 205, y: 42 },
  ];

  return (
    <div className="w-full">
      <div className="text-center text-[10px] font-mono text-amber-400 mb-1.5 uppercase tracking-wider">
        {lang === 'en' ? 'North Indian Chart' : 'उत्तर भारतीय कुण्डली'}
      </div>
      <svg viewBox="0 0 300 300" className="w-full max-w-[280px] mx-auto filter drop-shadow-[0_0_10px_rgba(212,175,55,0.25)]">
        <rect x="4" y="4" width="292" height="292" fill="#07090E" stroke="#D4AF37" strokeWidth="2" />
        <line x1="4" y1="4" x2="296" y2="296" stroke="#D4AF37" strokeWidth="1.1" />
        <line x1="296" y1="4" x2="4" y2="296" stroke="#D4AF37" strokeWidth="1.1" />
        <polygon points="150,4 296,150 150,296 4,150" fill="none" stroke="#D4AF37" strokeWidth="1.1" />
        {cells.map((c) => {
          const si = getSignInHouse(c.h);
          return (
            <g key={c.h}>
              <text x={c.x} y={c.y} textAnchor="middle" fill="#FDE047" fontSize="11" fontWeight="bold" fontFamily="monospace">
                {RASHI_SYMBOLS[si]}
              </text>
              <text x={c.x} y={c.y + 16} textAnchor="middle" fill="#FCD34D" fontSize="9" fontWeight="bold">
                {getPlanets(c.h)}
              </text>
              <text x={c.x} y={c.y + 30} textAnchor="middle" fill="#A1A1AA" fontSize="8">
                {signNames[si]}
              </text>
            </g>
          );
        })}
        <text x="150" y="154" textAnchor="middle" fill="#FDE047" fontSize="10" fontWeight="bold">
          {lang === 'en' ? 'LAGNA' : 'लग्न'}
        </text>
        <text x="150" y="168" textAnchor="middle" fill="#FCD34D" fontSize="9">
          {RASHI_SYMBOLS[signs[0]]} {signNames[signs[0]]}
        </text>
      </svg>
    </div>
  );
};
