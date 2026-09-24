import React, { useState } from 'react';
import { Hash, Sparkles } from 'lucide-react';
import { playTempleBell, triggerHaptic } from '../../services/audioService';
import type { Language } from '../../types';
import { computeNumerology } from '../engine/numerology';
import { NUMBER_MEANINGS_HI, NUMBER_MEANINGS_EN } from '../engine/numerology';
import type { NumerologyProfile } from '../engine/numerology';
import { getAstroLabels } from '../../data/astroLabels';
import { getLabels } from '../../data/languages';

interface Props {
  lang: Language;
}

export const NumerologyPanel: React.FC<Props> = ({ lang }) => {
  const labels = { ...getLabels(lang), ...getAstroLabels(lang) };
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [profile, setProfile] = useState<NumerologyProfile | null>(null);

  const meanings = lang === 'en' ? NUMBER_MEANINGS_EN : NUMBER_MEANINGS_HI;

  const handleCalc = (e: React.FormEvent) => {
    e.preventDefault();
    triggerHaptic('heavy');
    playTempleBell();
    if (!name.trim() || !dob) return;
    setProfile(computeNumerology(name, dob));
  };

  const cards: { key: string; label: string; value: number }[] = profile
    ? [
        { key: 'lifePath', label: labels.lifePathLabel, value: profile.lifePath },
        { key: 'destiny', label: labels.destinyLabel, value: profile.destiny },
        { key: 'soulUrge', label: labels.soulUrgeLabel, value: profile.soulUrge },
        { key: 'birthdayNumber', label: labels.birthdayLabel, value: profile.birthdayNumber },
        { key: 'personalYear', label: labels.personalYearLabel, value: profile.personalYear },
      ]
    : [];

  const inputCls = 'w-full px-3 py-2 rounded-xl bg-black/50 border border-amber-500/25 text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400 text-xs';

  return (
    <div className="space-y-4">
      <form onSubmit={handleCalc} className="glass-gold p-3.5 rounded-2xl border border-amber-500/25 space-y-3 text-xs">
        <div className="flex items-center gap-1.5 text-amber-300 font-display font-semibold">
          <Hash className="w-4 h-4 text-amber-400" />
          <span>{labels.numerologyTitle}</span>
        </div>
        <p className="text-[10px] text-zinc-400 font-devanagari">{labels.numerologySub}</p>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="text"
            required
            placeholder={labels.namePlaceholder}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputCls}
          />
          <input
            type="date"
            required
            value={dob}
            onChange={(e) => setDob(e.target.value)}
            className={inputCls}
          />
        </div>
        <button
          type="submit"
          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 text-black font-semibold text-xs tracking-wider uppercase shadow-gold-sm hover:brightness-110 active:scale-98 transition-all"
        >
          {labels.calculateMilan}
        </button>
      </form>

      {profile && (
        <div className="glass-gold p-4 rounded-3xl border border-amber-500/30 space-y-3 bg-gradient-to-br from-amber-950/30 via-black to-black">
          <div className="flex items-center gap-1.5 text-amber-200 font-display font-semibold text-sm border-b border-amber-500/20 pb-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            {name}
          </div>
          <div className="grid grid-cols-3 gap-2">
            {cards.map((c) => (
              <div key={c.key} className="p-2.5 rounded-xl bg-black/50 border border-amber-500/15 text-center">
                <span className="text-[9px] text-zinc-400 block font-mono leading-tight">{c.label}</span>
                <span className="font-mono text-lg font-bold text-amber-300">{c.value}</span>
              </div>
            ))}
          </div>
          {profile.lifePath > 0 && (
            <div className="p-3 rounded-xl bg-black/60 border border-amber-500/15">
              <span className="text-[10px] text-amber-400 font-mono block mb-1">
                {labels.lifePathLabel} = {profile.lifePath}
              </span>
              <p className="text-xs text-zinc-200 font-devanagari leading-relaxed">
                {meanings[profile.lifePath] || meanings[profile.lifePath % 9 || 9] || ''}
              </p>
            </div>
          )}
          <p className="text-[10.5px] font-devanagari text-zinc-300 leading-relaxed border-t border-amber-500/15 pt-2">
            {labels.numerologyDisclaimer}
          </p>
        </div>
      )}
    </div>
  );
};
