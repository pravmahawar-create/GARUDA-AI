import React, { useState, useEffect } from 'react';
import { X, Volume2, Bookmark, Type, ArrowLeft, Layers, BookOpen, Compass, Sparkles } from 'lucide-react';
import type { DeepScripture } from '../types';
import { playTempleBell, triggerHaptic } from '../services/audioService';
import { pushBackHandler } from '../services/modalBackHandler';

interface ScriptureReaderModalProps {
  scripture: DeepScripture | null;
  isOpen: boolean;
  onClose: () => void;
  lang: string;
}

export const ScriptureReaderModal: React.FC<ScriptureReaderModalProps> = ({
  scripture,
  isOpen,
  onClose,
  lang: _lang
}) => {
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xlarge'>('large');
  const [selectedMandala, setSelectedMandala] = useState<number>(1);
  const [selectedSukta, setSelectedSukta] = useState<number | null>(null);
  const [selectedMantra, setSelectedMantra] = useState<number | null>(null);
  const [isBookmarked, setIsBookmarked] = useState<boolean>(false);
  const [playingVerse, setPlayingVerse] = useState<number | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    return pushBackHandler(onClose);
  }, [isOpen, onClose]);

  if (!isOpen || !scripture) return null;

  const isVeda = scripture.category === 'veda';
  const tier2Label = isVeda ? 'मण्डल (Mandala)' : scripture.category === 'gita' ? 'अध्याय (Adhyaya)' : 'खण्ड / अध्याय';
  const tier3Label = isVeda ? 'सूक्त (Sukta)' : 'प्रकरण / अनुवाक';
  const tier4Label = isVeda ? 'मन्त्र (Mantra)' : 'श्लोक (Shloka)';

  const handlePlayRecitation = (verseNum: number) => {
    triggerHaptic('medium');
    playTempleBell();
    setPlayingVerse(verseNum);
    setTimeout(() => {
      setPlayingVerse(null);
    }, 4000);
  };

  const toggleFontSize = () => {
    triggerHaptic('light');
    setFontSize(prev => prev === 'normal' ? 'large' : prev === 'large' ? 'xlarge' : 'normal');
  };

  // Verses filtered by active Mandala/Chapter
  const mandalaVerses = scripture.verses.filter(v => (v.mandala || v.chapter || 1) === selectedMandala);
  const displayedVerses = mandalaVerses.length > 0
    ? (selectedSukta ? mandalaVerses.filter(v => (v.sukta || 1) === selectedSukta) : mandalaVerses)
    : scripture.verses.slice(0, 3);

  // Unique suktas in current mandala
  const availableSuktas = Array.from(new Set(mandalaVerses.map(v => v.sukta || 1)));

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col safe-top-padding animate-in fade-in duration-200">
      {/* 1. TOP LUXURY HEADER: GRANTHA (ग्रंथ) IDENTITY */}
      <header className="px-4 py-3 border-b border-amber-500/25 glass-gold flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/50 border border-amber-500/30 text-amber-300 flex items-center justify-center hover:bg-amber-500/20 active:scale-95 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-mono text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded-full border border-amber-500/30 uppercase font-bold">
                ग्रंथ • Grantha
              </span>
              <span className="text-[10px] font-mono text-zinc-400">
                {scripture.affiliation}
              </span>
            </div>
            <h3 className="font-display text-base md:text-lg font-bold text-white leading-tight">
              {scripture.granthaName || scripture.sanskritTitle}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Font Resizer */}
          <button
            onClick={toggleFontSize}
            title="Adjust Font Size"
            className="w-8 h-8 rounded-full bg-black/40 border border-amber-500/30 text-amber-300 flex items-center justify-center hover:border-amber-400"
          >
            <Type className="w-3.5 h-3.5" />
          </button>

          {/* Bookmark */}
          <button
            onClick={() => {
              triggerHaptic('light');
              setIsBookmarked(!isBookmarked);
            }}
            className={`w-8 h-8 rounded-full border flex items-center justify-center transition-colors ${
              isBookmarked
                ? 'bg-amber-500 text-black border-amber-400'
                : 'bg-black/40 text-amber-300 border-amber-500/30 hover:border-amber-400'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
          </button>

          {/* Close */}
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/40 border border-amber-500/30 text-zinc-400 flex items-center justify-center hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 2. CANONICAL HIERARCHY BREADCRUMB STRIP */}
      <div className="px-4 py-1.5 bg-amber-950/40 border-b border-amber-500/20 flex items-center justify-between text-[11px] font-mono overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-1.5 text-amber-300 whitespace-nowrap">
          <BookOpen className="w-3.5 h-3.5 text-amber-400" />
          <span className="font-bold">ग्रंथ: {scripture.sanskritTitle.split('(')[0].trim()}</span>
          <span className="text-zinc-500">›</span>
          <span className="text-amber-200">{isVeda ? `मण्डल ${selectedMandala}` : `अध्याय ${selectedMandala}`}</span>
          {selectedSukta && (
            <>
              <span className="text-zinc-500">›</span>
              <span className="text-amber-300">सूक्त {selectedSukta}</span>
            </>
          )}
          {selectedMantra && (
            <>
              <span className="text-zinc-500">›</span>
              <span className="text-yellow-300">मन्त्र {selectedMantra}</span>
            </>
          )}
        </div>

        <span className="text-[10px] text-zinc-400 font-mono pl-2">
          {scripture.totalMantras ? `${scripture.totalMantras} मन्त्र` : `${scripture.totalChapters} अध्याय`}
        </span>
      </div>

      {/* 3. TIER 2: MANDALA / ADHYAYA SELECTOR (मण्डल / अध्याय चयन) */}
      <div className="px-4 py-2 border-b border-amber-500/15 bg-black/60 flex items-center gap-2 overflow-x-auto scrollbar-none">
        <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider flex-shrink-0 flex items-center gap-1">
          <Layers className="w-3 h-3 text-amber-400" />
          <span>{tier2Label}:</span>
        </span>
        {Array.from({ length: Math.min(scripture.totalChapters || 10, 10) }, (_, i) => i + 1).map((m) => (
          <button
            key={m}
            onClick={() => {
              triggerHaptic('light');
              setSelectedMandala(m);
              setSelectedSukta(null);
              setSelectedMantra(null);
            }}
            className={`px-3 py-1 rounded-full text-xs font-mono font-bold flex-shrink-0 transition-all ${
              selectedMandala === m
                ? 'bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 text-black shadow-gold-sm font-bold scale-105'
                : 'bg-black/40 border border-amber-500/20 text-zinc-300 hover:border-amber-500/40'
            }`}
          >
            {isVeda ? `मण्डल ${m}` : `अध्याय ${m}`}
          </button>
        ))}
      </div>

      {/* 4. TIER 3: SUKTA SELECTOR (सूक्त चयन - IF MULTIPLE SUKTAS) */}
      {availableSuktas.length > 1 && (
        <div className="px-4 py-1.5 border-b border-amber-500/10 bg-black/40 flex items-center gap-2 overflow-x-auto scrollbar-none text-xs">
          <span className="text-[9.5px] font-mono text-amber-400 uppercase tracking-wider flex-shrink-0 flex items-center gap-1">
            <Compass className="w-3 h-3" />
            <span>{tier3Label}:</span>
          </span>
          <button
            onClick={() => {
              triggerHaptic('light');
              setSelectedSukta(null);
            }}
            className={`px-2.5 py-0.5 rounded-lg text-[11px] font-mono transition-all ${
              selectedSukta === null
                ? 'bg-amber-500/30 text-amber-200 border border-amber-400'
                : 'bg-black/30 text-zinc-400 border border-zinc-700'
            }`}
          >
            समस्त सूक्त (All)
          </button>
          {availableSuktas.map(s => {
            const suktaVerse = mandalaVerses.find(v => v.sukta === s);
            return (
              <button
                key={s}
                onClick={() => {
                  triggerHaptic('light');
                  setSelectedSukta(s);
                }}
                className={`px-2.5 py-0.5 rounded-lg text-[11px] font-mono whitespace-nowrap transition-all ${
                  selectedSukta === s
                    ? 'bg-amber-500/30 text-amber-200 border border-amber-400 shadow-gold-sm'
                    : 'bg-black/30 text-zinc-400 border border-zinc-700 hover:border-zinc-500'
                }`}
              >
                सूक्त {s} {suktaVerse?.suktaName ? `(${suktaVerse.suktaName.split('(')[0].trim()})` : ''}
              </button>
            );
          })}
        </div>
      )}

      {/* 5. TIER 4: MANTRA (मन्त्र) CONTENT VIEWPORT */}
      <main className="flex-1 overflow-y-auto px-4 py-4 space-y-5 max-w-2xl mx-auto w-full safe-tab-viewport">
        {/* Mandala & Sukta Introduction Card */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/50 via-black to-amber-950/30 border border-amber-500/30 shadow-gold-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-amber-400 uppercase tracking-widest font-bold flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>{isVeda ? `मण्डल ${selectedMandala}` : `अध्याय ${selectedMandala}`} • पावन स्वाध्याय</span>
            </span>
            <span className="text-[10px] font-mono text-zinc-400">
              {displayedVerses.length} {tier4Label} उपलब्ध
            </span>
          </div>

          <p className="font-devanagari text-xs md:text-sm text-zinc-300 leading-relaxed">
            {scripture.introduction}
          </p>
        </div>

        {/* Verses Loop */}
        <div className="space-y-5">
          {displayedVerses.map((v) => {
            const isReciting = playingVerse === v.verseNumber;

            return (
              <article
                key={`${v.mandala || v.chapter || 1}-${v.sukta || 1}-${v.verseNumber}`}
                className={`p-5 rounded-3xl transition-all border ${
                  isReciting
                    ? 'glass-gold-active border-amber-400 shadow-gold-md scale-[1.01]'
                    : 'glass-gold border-amber-500/25 hover:border-amber-500/45 shadow-gold-sm'
                }`}
              >
                {/* 4-Tier Hierarchy Header for this Mantra */}
                <div className="flex flex-wrap justify-between items-center gap-2 mb-3 border-b border-amber-500/20 pb-2.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Canonical Badge: Grantha.Mandala.Sukta.Mantra */}
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-amber-600/30 to-yellow-500/20 border border-amber-400/50 text-amber-200 font-mono text-xs font-bold shadow-gold-sm">
                      {isVeda
                        ? `मण्डल ${v.mandala || v.chapter || selectedMandala} • सूक्त ${v.sukta || 1} • मन्त्र ${v.verseNumber}`
                        : `अध्याय ${v.chapter || selectedMandala} • श्लोक ${v.verseNumber}`}
                    </span>

                    {/* Sukta Name Tag */}
                    {v.suktaName && (
                      <span className="text-[10px] font-mono text-amber-400/90 font-bold px-2 py-0.5 rounded-md bg-black/60 border border-amber-500/25">
                        {v.suktaName}
                      </span>
                    )}
                  </div>

                  {/* Audio Recitation Trigger */}
                  <button
                    onClick={() => handlePlayRecitation(v.verseNumber)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono transition-all ${
                      isReciting
                        ? 'bg-amber-500 text-black font-bold animate-pulse shadow-gold-sm'
                        : 'bg-black/40 text-amber-300 border border-amber-500/35 hover:border-amber-400'
                    }`}
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>{isReciting ? 'उच्चारण जारी...' : 'मन्त्र श्रवण'}</span>
                  </button>
                </div>

                {/* Canonical Credentials: ऋषि, देवता, छन्द */}
                {(v.rishi || v.devata || v.chhandas) && (
                  <div className="flex flex-wrap gap-1.5 mb-3 text-[10.5px] font-mono text-zinc-300 bg-black/60 p-2 rounded-xl border border-amber-500/15">
                    {v.rishi && (
                      <span className="px-2 py-0.5 rounded bg-amber-950/40 border border-amber-500/20 text-amber-300">
                        ऋषि: <strong className="text-white">{v.rishi}</strong>
                      </span>
                    )}
                    {v.devata && (
                      <span className="px-2 py-0.5 rounded bg-amber-950/40 border border-amber-500/20 text-amber-300">
                        देवता: <strong className="text-white">{v.devata}</strong>
                      </span>
                    )}
                    {v.chhandas && (
                      <span className="px-2 py-0.5 rounded bg-amber-950/40 border border-amber-500/20 text-amber-300">
                        छन्द: <strong className="text-white">{v.chhandas}</strong>
                      </span>
                    )}
                  </div>
                )}

                {/* Sanskrit Mool Mantra */}
                <div className="bg-black/55 p-4 rounded-2xl border border-amber-500/20 text-center my-3">
                  <p
                    className={`font-shloka text-amber-100 font-bold whitespace-pre-line leading-relaxed drop-shadow-[0_0_15px_rgba(212,175,55,0.5)] ${
                      fontSize === 'normal' ? 'text-base md:text-lg' : fontSize === 'large' ? 'text-lg md:text-xl' : 'text-xl md:text-2xl'
                    }`}
                  >
                    {v.sanskrit}
                  </p>
                </div>

                {/* Transliteration */}
                <p className="text-[11px] font-mono text-zinc-400 italic text-center mb-3">
                  {v.transliteration}
                </p>

                {/* Pad-Chhed (पदच्छेद) */}
                {v.padChhed && (
                  <div className="p-2.5 rounded-xl bg-amber-950/25 border border-amber-500/15 mb-3 text-xs">
                    <span className="text-[10px] font-mono text-amber-400 uppercase tracking-widest block font-bold mb-0.5">
                      पदच्छेद (Vedic Word Analysis):
                    </span>
                    <p className="font-devanagari text-zinc-300 text-xs leading-relaxed font-semibold">
                      {v.padChhed}
                    </p>
                  </div>
                )}

                {/* Hindi Meaning */}
                <div className="pt-2 border-t border-amber-500/15">
                  <span className="text-[10px] font-mono text-amber-400 uppercase tracking-widest block font-bold mb-1">
                    हिन्दी भावार्थ:
                  </span>
                  <p className="font-devanagari text-xs md:text-sm text-zinc-200 leading-relaxed">
                    {v.hindiMeaning}
                  </p>
                </div>

                {/* English Translation */}
                <div className="pt-2 mt-2 border-t border-zinc-800">
                  <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest block font-bold mb-0.5">
                    English Translation:
                  </span>
                  <p className="text-xs text-zinc-300 font-sans leading-relaxed">
                    {v.englishMeaning}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      </main>
    </div>
  );
};
