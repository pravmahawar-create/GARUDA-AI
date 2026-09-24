import React, { useState, useEffect } from 'react';
import { RotateCcw, Volume2, VolumeX, Award } from 'lucide-react';
import confetti from 'canvas-confetti';

import { playBeadClick, playTempleBell, triggerHaptic } from '../services/audioService';
import { getLabels } from '../data/languages';

import type { Language } from '../types';

interface JapaTabProps {
  lang: Language;
}

const MANTRAS_JAPA = [
  { id: 'shiva', name: 'ॐ नमः शिवाय', countGoal: 108 },
  { id: 'gayatri', name: 'गायत्री मन्त्र', countGoal: 108 },
  { id: 'mrityunjaya', name: 'महामृत्युञ्जय मन्त्र', countGoal: 108 },
  { id: 'krishna', name: 'हरे कृष्ण महामन्त्र', countGoal: 108 },
];

export const JapaTab: React.FC<JapaTabProps> = ({ lang }) => {
  const labels = getLabels(lang);
  const [count, setCount] = useState<number>(() => {
    return parseInt(localStorage.getItem('sanatan_japa_count') || '0', 10);
  });
  const [rounds, setRounds] = useState<number>(() => {
    return parseInt(localStorage.getItem('sanatan_japa_rounds') || '0', 10);
  });
  const [totalLifetime, setTotalLifetime] = useState<number>(() => {
    return parseInt(localStorage.getItem('sanatan_japa_total') || '108', 10);
  });
  const [activeMantra, setActiveMantra] = useState<string>('shiva');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [showCelebration, setShowCelebration] = useState<boolean>(false);

  useEffect(() => {
    localStorage.setItem('sanatan_japa_count', count.toString());
    localStorage.setItem('sanatan_japa_rounds', rounds.toString());
    localStorage.setItem('sanatan_japa_total', totalLifetime.toString());
  }, [count, rounds, totalLifetime]);

  const handleIncrement = () => {
    triggerHaptic('light');
    if (soundEnabled) {
      playBeadClick();
    }

    const nextCount = count + 1;
    setTotalLifetime(prev => prev + 1);

    if (nextCount >= 108) {
      // 108 Reached!
      setCount(0);
      setRounds(prev => prev + 1);
      setShowCelebration(true);
      playTempleBell();
      triggerHaptic('heavy');

      // Golden Confetti Blast
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#E6B450', '#FFD54F', '#FFA500', '#FFFFFF']
      });
    } else {
      setCount(nextCount);
    }
  };

  const handleReset = () => {
    if (window.confirm(labels.resetConfirm)) {
      triggerHaptic('medium');
      setCount(0);
    }
  };

  const progressPercent = (count / 108) * 100;
  const currentMantraObj = MANTRAS_JAPA.find(m => m.id === activeMantra) || MANTRAS_JAPA[0];

  return (
    <div className="space-y-6 safe-tab-viewport">
      {/* Header */}
      <div className="text-center space-y-1">
        <span className="text-[10px] font-mono tracking-widest text-amber-400 uppercase font-bold">
          {labels.digitalRudraksha}
        </span>
        <h2 className="font-display text-2xl font-bold text-white tracking-wide">
          {labels.japaHeading}
        </h2>
        <p className="text-xs text-zinc-400 font-devanagari">
          {labels.japaSub}
        </p>
      </div>

      {/* Mantra Selector Pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none justify-center">
        {MANTRAS_JAPA.map((m) => (
          <button
            key={m.id}
            onClick={() => {
              triggerHaptic('light');
              setActiveMantra(m.id);
            }}
            className={`px-3.5 py-1.5 rounded-full text-xs font-devanagari font-bold whitespace-nowrap transition-all ${
              activeMantra === m.id
                ? 'bg-gradient-to-r from-gold-600 to-amber-500 text-black shadow-gold-sm'
                : 'glass-gold text-zinc-300 border border-gold-500/20'
            }`}
          >
            {m.name}
          </button>
        ))}
      </div>

      {/* Main Interactive Japa Medallion */}
      <div className="flex flex-col items-center justify-center my-4">
        <div
          onClick={handleIncrement}
          className="relative w-72 h-72 rounded-full cursor-pointer flex items-center justify-center select-none active:scale-95 transition-transform group"
        >
          {/* Outer Decorative Beads Ring */}
          <div className="absolute inset-0 rounded-full border-2 border-dashed border-gold-500/40 animate-spin-slow" />
          
          {/* Circular Progress Ring SVG */}
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="144"
              cy="144"
              r="130"
              className="stroke-zinc-800/80"
              strokeWidth="6"
              fill="transparent"
            />
            <circle
              cx="144"
              cy="144"
              r="130"
              className="stroke-gold-500 transition-all duration-150"
              strokeWidth="7"
              strokeDasharray={2 * Math.PI * 130}
              strokeDashoffset={2 * Math.PI * 130 * (1 - progressPercent / 100)}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>

          {/* Central Touch Surface / Rudraksha Disc */}
          <div className="absolute inset-5 rounded-full glass-gold border-2 border-gold-500/50 flex flex-col items-center justify-center shadow-[0_0_40px_rgba(212,175,55,0.25)] group-hover:border-gold-400 group-hover:shadow-[0_0_50px_rgba(212,175,55,0.4)] transition-all">
            <span className="text-[10px] font-mono text-gold-400 uppercase tracking-widest font-bold">
              {labels.tapToChant}
            </span>

            {/* Current Bead Count */}
            <div className="my-2">
              <span className="font-display text-6xl font-black gold-gradient-text tracking-tighter">
                {count}
              </span>
              <span className="text-zinc-500 font-display text-lg font-bold">
                /108
              </span>
            </div>

            <p className="font-shloka text-sm text-amber-200 font-bold max-w-[160px] text-center truncate">
              {currentMantraObj.name}
            </p>

            <span className="mt-2 text-[10px] font-mono text-amber-400 bg-amber-950/60 px-2.5 py-0.5 rounded-full border border-amber-500/30">
              {labels.roundN} {rounds + 1}
            </span>
          </div>
        </div>

        <p className="mt-4 text-xs font-mono text-zinc-500 tracking-wider uppercase">
          {labels.touchRingHint}
        </p>
      </div>

      {/* Control Buttons (Reset & Sound Toggle) */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={handleReset}
          className="px-4 py-2 rounded-xl glass-gold border border-gold-500/30 text-xs text-zinc-300 flex items-center gap-1.5 hover:text-gold-300 hover:border-gold-400 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5 text-gold-400" />
          <span>{labels.resetCountBtn}</span>
        </button>

        <button
          onClick={() => {
            triggerHaptic('light');
            setSoundEnabled(!soundEnabled);
          }}
          className="px-4 py-2 rounded-xl glass-gold border border-gold-500/30 text-xs text-zinc-300 flex items-center gap-1.5 hover:text-gold-300 hover:border-gold-400 transition-colors"
        >
          {soundEnabled ? (
            <>
              <Volume2 className="w-3.5 h-3.5 text-gold-400" />
              <span>{labels.chimeOn}</span>
            </>
          ) : (
            <>
              <VolumeX className="w-3.5 h-3.5 text-zinc-500" />
              <span>{labels.chimeOff}</span>
            </>
          )}
        </button>
      </div>

      {/* Sadhana Statistics Card */}
      <div className="glass-gold p-5 rounded-2xl border border-gold-500/25 grid grid-cols-3 gap-3 text-center">
        <div>
          <span className="text-[10px] font-mono text-zinc-400 uppercase block">{labels.currentMala}</span>
          <span className="font-cinzel text-xl font-bold text-gold-300">{count}/108</span>
        </div>
        <div className="border-x border-zinc-800">
          <span className="text-[10px] font-mono text-zinc-400 uppercase block">{labels.totalMalas}</span>
          <span className="font-cinzel text-xl font-bold text-amber-400">{rounds}</span>
        </div>
        <div>
          <span className="text-[10px] font-mono text-zinc-400 uppercase block">{labels.totalChants}</span>
          <span className="font-cinzel text-xl font-bold text-white">{totalLifetime}</span>
        </div>
      </div>

      {/* Mala Completion Celebration Modal */}
      {showCelebration && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-gold w-full max-w-sm rounded-3xl border border-gold-500/50 p-6 text-center space-y-4 shadow-gold-lg animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-gold-500/20 border-2 border-gold-500 text-gold-400 mx-auto flex items-center justify-center shadow-gold-md">
              <Award className="w-8 h-8 text-gold-400 animate-bounce" />
            </div>

            <h3 className="font-cinzel text-2xl font-black text-white">
              {labels.malaComplete}
            </h3>
            <p className="font-devanagari text-sm text-gold-200">
              {labels.malaCompleteMsg}
            </p>
            <p className="text-xs text-zinc-400 font-sans">
              {labels.malaCompleteSub}
            </p>

            <button
              onClick={() => setShowCelebration(false)}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-gold-600 via-gold-500 to-amber-600 text-black font-semibold text-xs tracking-wider uppercase shadow-gold-md"
            >
              {labels.nextMala}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
