import React, { useState } from 'react';
import { Hand, ChevronRight, ChevronLeft } from 'lucide-react';
import { triggerHaptic } from '../../services/audioService';
import type { Language } from '../../types';
import { PALMISTRY_CHAPTERS } from '../data/palmistryContent';
import { getAstroLabels } from '../../data/astroLabels';
import { getLabels } from '../../data/languages';

interface Props {
  lang: Language;
}

export const PalmistryChapter: React.FC<Props> = ({ lang }) => {
  const labels = { ...getLabels(lang), ...getAstroLabels(lang) };
  const [idx, setIdx] = useState(0);
  const chapter = PALMISTRY_CHAPTERS[idx];
  const isEn = lang === 'en';

  const go = (dir: -1 | 1) => {
    triggerHaptic('light');
    setIdx((i) => Math.min(PALMISTRY_CHAPTERS.length - 1, Math.max(0, i + dir)));
  };

  return (
    <div className="space-y-4">
      <div className="glass-gold p-4 rounded-3xl border border-amber-500/30 space-y-3 bg-gradient-to-br from-amber-950/30 via-black to-black">
        <div className="flex items-center justify-between border-b border-amber-500/20 pb-2">
          <span className="font-display text-sm font-bold text-amber-200 flex items-center gap-1.5">
            <Hand className="w-4 h-4 text-amber-400" />
            {labels.palmistryTitle}
          </span>
          <span className="text-[10px] font-mono text-amber-400">
            {idx + 1}/{PALMISTRY_CHAPTERS.length}
          </span>
        </div>

        <h4 className="font-display text-base font-bold text-white">
          {isEn ? chapter.titleEn : chapter.titleHi}
        </h4>

        <div className="space-y-2.5">
          {(isEn ? chapter.bodyEn : chapter.bodyHi).map((para, i) => (
            <p key={i} className="text-xs text-zinc-200 font-devanagari leading-relaxed">
              {para}
            </p>
          ))}
        </div>

        {/* Simple educational palm SVG — no photo */}
        <svg viewBox="0 0 200 220" className="w-full max-w-[180px] mx-auto opacity-80">
          <path
            d="M60 200 C40 160 35 120 45 90 C50 70 65 75 65 95 L65 50 C65 40 80 40 80 55 L80 45 C80 35 95 35 95 50 L95 48 C95 38 110 38 110 52 L110 55 C110 45 125 45 125 58 L125 100 C140 70 155 75 150 100 C145 130 140 165 130 200 Z"
            fill="#1A1208"
            stroke="#D4AF37"
            strokeWidth="2"
          />
          <path d="M55 140 Q90 125 135 145" fill="none" stroke="#F59E0B" strokeWidth="1.5" />
          <path d="M60 115 Q95 105 130 120" fill="none" stroke="#FCD34D" strokeWidth="1.3" />
          <path d="M70 165 Q95 155 120 175" fill="none" stroke="#FBBF24" strokeWidth="1.2" />
          <text x="100" y="215" textAnchor="middle" fill="#A1A1AA" fontSize="8" fontFamily="monospace">
            {isEn ? 'Educational diagram' : 'शैक्षिक आरेख'}
          </text>
        </svg>

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={() => go(-1)}
            disabled={idx === 0}
            className="flex-1 py-2 rounded-xl bg-black/50 border border-amber-500/25 text-amber-300 text-xs font-semibold flex items-center justify-center gap-1 disabled:opacity-30 active:scale-98 transition-all"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            {labels.prevChapter}
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            disabled={idx === PALMISTRY_CHAPTERS.length - 1}
            className="flex-1 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-500 text-black text-xs font-semibold flex items-center justify-center gap-1 disabled:opacity-30 active:scale-98 transition-all"
          >
            {labels.nextChapter}
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <p className="text-[10px] font-devanagari text-zinc-400 border-t border-amber-500/15 pt-2">
          {labels.palmistryDisclaimer}
        </p>
      </div>
    </div>
  );
};
