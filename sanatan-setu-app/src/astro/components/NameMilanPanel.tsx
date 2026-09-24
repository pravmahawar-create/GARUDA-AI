import React, { useState } from 'react';
import { Type, HeartHandshake } from 'lucide-react';
import { playTempleBell, triggerHaptic } from '../../services/audioService';
import type { Language } from '../../types';
import { computeNameMilan, NAM_SYLLABLES } from '../engine/nameRashi';
import { RASHI_NAMES_EN, RASHI_NAMES_HI, RASHI_SYMBOLS } from '../data/nakshatraIndex';
import { getAstroLabels } from '../../data/astroLabels';
import { getLabels } from '../../data/languages';

interface Props {
  lang: Language;
}

export const NameMilanPanel: React.FC<Props> = ({ lang }) => {
  const labels = { ...getLabels(lang), ...getAstroLabels(lang) };
  const [groomName, setGroomName] = useState('');
  const [brideName, setBrideName] = useState('');
  const [result, setResult] = useState<ReturnType<typeof computeNameMilan> | null>(null);

  const rashiNames = lang === 'en' ? RASHI_NAMES_EN : RASHI_NAMES_HI;

  const handleCalc = (e: React.FormEvent) => {
    e.preventDefault();
    triggerHaptic('heavy');
    playTempleBell();
    if (!groomName.trim() || !brideName.trim()) return;
    setResult(computeNameMilan(groomName, brideName));
  };

  const inputCls = 'w-full px-3 py-2 rounded-xl bg-black/50 border border-amber-500/25 text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400 text-xs';

  return (
    <div className="space-y-4">
      <form onSubmit={handleCalc} className="glass-gold p-3.5 rounded-2xl border border-amber-500/25 space-y-3 text-xs">
        <div className="flex items-center gap-1.5 text-amber-300 font-display font-semibold">
          <Type className="w-4 h-4 text-amber-400" />
          <span>{labels.nameMilanTitle}</span>
        </div>
        <p className="text-[10px] text-zinc-400 font-devanagari">{labels.nameMilanSub}</p>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[9px] text-zinc-400 block font-mono mb-1">{labels.groomDetails}</label>
            <input
              type="text"
              required
              placeholder={labels.namePlaceholder}
              value={groomName}
              onChange={(e) => setGroomName(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className="text-[9px] text-zinc-400 block font-mono mb-1">{labels.brideDetails}</label>
            <input
              type="text"
              required
              placeholder={labels.namePlaceholder}
              value={brideName}
              onChange={(e) => setBrideName(e.target.value)}
              className={inputCls}
            />
          </div>
        </div>
        <button
          type="submit"
          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 text-black font-semibold text-xs tracking-wider uppercase shadow-gold-sm hover:brightness-110 active:scale-98 transition-all"
        >
          {labels.calculateMilan}
        </button>
      </form>

      {result && (
        <div className="glass-gold p-4 rounded-3xl border border-amber-500/30 space-y-3 bg-gradient-to-br from-amber-950/30 via-black to-black">
          <div className="flex items-center justify-between border-b border-amber-500/20 pb-2">
            <span className="font-display text-sm font-bold text-amber-200 flex items-center gap-1.5">
              <HeartHandshake className="w-4 h-4 text-amber-400" />
              {labels.nameMilanTitle}
            </span>
            <span className="font-mono text-base font-bold text-amber-300">
              {result.score}/{result.max}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-black/50 p-2.5 rounded-xl border border-amber-500/15 text-center">
              <span className="text-[9px] text-zinc-400 block font-mono">{labels.groomDetails}</span>
              <span className="text-amber-200 font-bold block">{groomName}</span>
              {result.groomNaamRashi >= 0 && (
                <span className="text-amber-300">
                  {RASHI_SYMBOLS[result.groomNaamRashi]} {rashiNames[result.groomNaamRashi]}
                </span>
              )}
            </div>
            <div className="bg-black/50 p-2.5 rounded-xl border border-amber-500/15 text-center">
              <span className="text-[9px] text-zinc-400 block font-mono">{labels.brideDetails}</span>
              <span className="text-amber-200 font-bold block">{brideName}</span>
              {result.brideNaamRashi >= 0 && (
                <span className="text-amber-300">
                  {RASHI_SYMBOLS[result.brideNaamRashi]} {rashiNames[result.brideNaamRashi]}
                </span>
              )}
            </div>
          </div>

          {result.groomLuckySyllables.length > 0 && (
            <div className="bg-black/50 p-2.5 rounded-xl border border-amber-500/15">
              <span className="text-[10px] text-zinc-400 font-mono block mb-1">
                {lang === 'en' ? 'Lucky name syllables (from Moon pada)' : 'शुभ नामाक्षर (चंद्र पाद से)'}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {result.groomLuckySyllables.map((s) => (
                  <span key={`g-${s}`} className="px-2 py-0.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-200 text-[11px] font-bold">
                    {s}
                  </span>
                ))}
                {result.brideLuckySyllables.map((s) => (
                  <span key={`b-${s}`} className="px-2 py-0.5 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-200 text-[11px] font-bold">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          <p className="text-[10.5px] font-devanagari text-zinc-300 leading-relaxed border-t border-amber-500/15 pt-2">
            {labels.nameMilanDisclaimer}
          </p>
        </div>
      )}

      <details className="rounded-xl bg-black/50 border border-amber-500/20 p-3 text-xs">
        <summary className="text-amber-300 font-display font-semibold cursor-pointer">
          {lang === 'en' ? 'All 27 Nakshatra name letters' : 'सभी 27 नक्षत्र के नामाक्षर'}
        </summary>
        <div className="grid grid-cols-3 gap-1.5 mt-2">
          {NAM_SYLLABLES.map((syllables, i) => (
            <div key={i} className="p-1.5 rounded-lg bg-black/40 border border-amber-500/10">
              <span className="text-[9px] text-amber-400 block font-mono">{rashiNames[i % 12]} · {i + 1}</span>
              <span className="text-[10px] text-amber-100">{syllables.join(', ')}</span>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
};


