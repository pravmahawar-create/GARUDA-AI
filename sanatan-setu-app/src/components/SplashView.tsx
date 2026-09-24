import React, { useState, useEffect } from 'react';
import { ArrowRight, Volume2 } from 'lucide-react';
import { playOmAudio, stopOmAudio, triggerHaptic } from '../services/audioService';
import { getLabels } from '../data/languages';
import type { Language } from '../types';

interface SplashViewProps {
  onComplete: () => void;
  lang: Language;
}

export const SplashView: React.FC<SplashViewProps> = ({ onComplete, lang }) => {
  const labels = getLabels(lang);
  // Stages:
  // 1: Absolute Darkness & Primordial Resonance (0-2.2s)
  // 2: Sacred Golden Emblem & Wordmark Awakening (2.2-4.5s)
  // 3: Royal Welcome Screen ("स्वागत" & "आगे बढ़ें") (4.5s+)
  const [stage, setStage] = useState<1 | 2 | 3>(1);

  useEffect(() => {
    // Om starts INSTANTLY — warmOmAudio() in main.tsx already buffering om_new.mp3 (FULL complete Om).
    playOmAudio();

    const t1 = setTimeout(() => {
      setStage(2);
      triggerHaptic('light');
    }, 1200);

    const t2 = setTimeout(() => {
      setStage(3);
    }, 2800);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      stopOmAudio(2000);
    };
  }, []);

  const handleProceed = () => {
    stopOmAudio(1500);
    triggerHaptic('medium');
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#030508] flex flex-col items-center justify-between p-6 overflow-hidden select-none">
      {/* Background Subtle Sacred Aura */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(212,175,55,0.08)_0%,rgba(3,5,8,1)_75%)] pointer-events-none" />

      {/* Top Bar: Quiet, Unobtrusive */}
      <div className="w-full flex justify-between items-center z-10 pt-4 px-2">
        <div className="flex items-center gap-2">
          {stage > 1 && (
            <div className="flex items-center gap-1.5 animate-fade-in">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400/80 animate-pulse" />
              <span className="text-[10px] font-mono tracking-[0.2em] text-amber-300/70 uppercase">
                सनातन सेतु
              </span>
            </div>
          )}
        </div>

        {/* Subtle Skip button available after stage 1 */}
        {stage >= 2 && (
          <button
            onClick={handleProceed}
            className="px-3.5 py-1 rounded-full border border-amber-500/20 bg-black/40 text-amber-200/80 text-[11px] tracking-wider flex items-center gap-1 hover:border-amber-400 transition-colors animate-fade-in"
          >
            <span>{labels.splashSkip}</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Center Awakening Area */}
      <div className="flex-1 flex flex-col items-center justify-center text-center z-10 max-w-sm w-full px-4">
        {/* ================= STAGE 1: ABSOLUTE SACRED VOID ================= */}
        {stage === 1 && (
          <div className="flex flex-col items-center animate-fade-in transition-opacity duration-1000">
            {/* Subtle breathing golden particle in the dark */}
            <div className="relative w-12 h-12 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-amber-500/10 blur-xl animate-pulse" />
              <div className="w-2.5 h-2.5 rounded-full bg-amber-300/60 shadow-[0_0_20px_#D4AF37] animate-ping" />
            </div>
            <p className="mt-8 text-amber-200/60 font-shloka text-base tracking-[0.2em]">
              ॐ पूर्णमदः पूर्णमिदम्...
            </p>
            <p className="mt-2 text-[10px] text-zinc-500 font-mono tracking-[0.25em] uppercase">
              The Primordial Resonance
            </p>
          </div>
        )}

        {/* ================= STAGE 2: SACRED EMBLEM AWAKENING ================= */}
        {stage === 2 && (
          <div className="flex flex-col items-center animate-fade-in transition-all duration-1000">
            {/* Master Golden Spiritual Emblem Awakening */}
            <div className="relative w-44 h-44 mb-6">
              {/* Calm, noble breathing aura — not cheap gaming flash */}
              <div className="absolute -inset-4 bg-gradient-to-r from-amber-600/20 via-yellow-500/30 to-amber-600/20 rounded-full blur-2xl animate-pulse-slow" />
              <img
                src="/assets/Sanatan Setu Golden Spiritual Emblem.png"
                alt="Sanatan Setu Master Emblem"
                className="w-full h-full object-contain relative z-10 drop-shadow-[0_0_35px_rgba(212,175,55,0.7)]"
              />
            </div>

            <div className="space-y-1.5 animate-fade-in">
              <h1 className="font-display text-2xl font-bold tracking-[0.2em] gold-gradient-text">
                सनातन सेतु
              </h1>
              <p className="text-xs font-cinzel tracking-[0.25em] text-amber-200/80 uppercase font-semibold">
                SANATAN SETU
              </p>
              <p className="text-[11px] font-devanagari tracking-wider text-amber-300/70 pt-1">
                ज्ञान • साधना • संस्कृति
              </p>
            </div>
          </div>
        )}

        {/* ================= STAGE 3: ROYAL WELCOME SCREEN ================= */}
        {stage === 3 && (
          <div className="flex flex-col items-center animate-fade-in transition-all duration-700 w-full">
            {/* Emblem in Dignified Frame */}
            <div className="relative w-36 h-36 mb-5">
              <div className="absolute -inset-3 bg-amber-500/20 rounded-full blur-xl animate-pulse" />
              <img
                src="/assets/Sanatan Setu Golden Spiritual Emblem.png"
                alt="Sanatan Setu Master Emblem"
                className="w-full h-full object-contain relative z-10 drop-shadow-[0_0_25px_rgba(212,175,55,0.6)]"
              />
            </div>

            {/* Sacred Welcome Greeting */}
            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/80 border border-amber-500/40 text-amber-300 text-xs font-mono uppercase tracking-wider shadow-gold-sm">
                <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                <span>{labels.splashWelcome}</span>
              </span>

              <h2 className="font-display text-3xl font-bold text-white tracking-wide">
                {labels.heroTitle}
              </h2>

              <p className="text-sm font-devanagari text-amber-100/90 leading-relaxed max-w-xs mx-auto">
                {labels.splashWelcomeSub}
              </p>
            </div>

            {/* Prominent Royal CTA */}
            <div className="mt-8 w-full max-w-xs space-y-2">
              <button
                onClick={handleProceed}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 text-black font-bold text-sm tracking-wider uppercase shadow-gold-md hover:brightness-110 active:scale-98 transition-all flex items-center justify-center gap-2 group"
              >
                <span>{labels.splashProceed}</span>
                <ArrowRight className="w-4 h-4 text-black group-hover:translate-x-1 transition-transform" />
              </button>
              <p className="text-[10px] font-mono text-zinc-500 tracking-wider">
                Connecting You to Eternal Wisdom
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer Attribution + GARUDA Branding */}
      <div className="w-full text-center z-10 pb-3 space-y-1.5">
        <div className="flex items-center justify-center gap-1.5 text-[9px] font-mono tracking-[0.15em] text-amber-400/50">
          <img src="/assets/garuda-sigil.png" alt="GARUDA" className="w-3 h-3 opacity-50" />
          <span className="uppercase">Powered by GARUDA</span>
        </div>
        <div className="flex items-center justify-center gap-2 text-[10px] font-mono tracking-[0.2em] text-zinc-600 uppercase">
          <span>Sanatan Setu Charitable Foundation</span>
          <span className="text-zinc-700">•</span>
          <span className="text-amber-400/60 font-semibold">Reg: 191320</span>
        </div>
      </div>
    </div>
  );
};
