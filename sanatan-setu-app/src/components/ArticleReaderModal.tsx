import React, { useState, useEffect } from 'react';
import { X, ArrowLeft, Bookmark, Type, Sparkles, BookOpen, Clock } from 'lucide-react';
import { ARTICLES_DATA } from '../data/mockData';
import type { Article } from '../types';
import { triggerHaptic } from '../services/audioService';
import { pushBackHandler } from '../services/modalBackHandler';

interface ArticleReaderModalProps {
  article: Article | null;
  isOpen: boolean;
  onClose: () => void;
  lang: string;
}

export const ArticleReaderModal: React.FC<ArticleReaderModalProps> = ({
  article,
  isOpen,
  onClose,
  lang: _lang
}) => {
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xlarge'>('large');
  const [isBookmarked, setIsBookmarked] = useState<boolean>(false);
  const [activeArticle, setActiveArticle] = useState<Article>(article || ARTICLES_DATA[0]);

  useEffect(() => {
    if (!isOpen) return;
    return pushBackHandler(onClose);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const current = article || activeArticle;

  const toggleFontSize = () => {
    triggerHaptic('light');
    setFontSize(prev => prev === 'normal' ? 'large' : prev === 'large' ? 'xlarge' : 'normal');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col safe-top-padding animate-in fade-in duration-200">
      {/* Top Header */}
      <header className="px-4 py-3 border-b border-amber-500/25 glass-gold flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/50 border border-amber-500/30 text-amber-300 flex items-center justify-center hover:bg-amber-500/20 active:scale-95 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <span className="text-[9px] font-mono text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded-full border border-amber-500/30 uppercase font-bold">
              आध्यात्मिक लेख • Article
            </span>
            <h3 className="font-display text-base md:text-lg font-bold text-white leading-tight truncate max-w-[200px]">
              {current.title}
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

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto px-4 py-6 space-y-6 max-w-2xl mx-auto w-full safe-tab-viewport">
        {/* Hero Title & Meta */}
        <div className="space-y-2.5 border-b border-amber-500/20 pb-5">
          <div className="flex items-center gap-2 text-[11px] font-mono text-amber-400">
            <Clock className="w-3.5 h-3.5" />
            <span>{current.readTime}</span>
            <span>•</span>
            <span className="capitalize">{current.category.replace('_', ' ')}</span>
          </div>

          <h1 className="font-display text-2xl md:text-3xl font-bold text-white tracking-wide leading-tight">
            {current.title}
          </h1>

          <p className="font-devanagari text-sm text-zinc-300 leading-relaxed">
            {current.summary}
          </p>
        </div>

        {/* Highlighted Vedic Quote Box */}
        {current.quote && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/60 via-black to-amber-950/40 border border-amber-500/30 shadow-gold-sm space-y-1 text-center">
            <Sparkles className="w-4 h-4 text-amber-400 mx-auto" />
            <p className="font-shloka text-amber-200 text-base md:text-lg font-bold leading-relaxed">
              "{current.quote}"
            </p>
          </div>
        )}

        {/* Article Paragraphs */}
        <div className="space-y-4 font-devanagari leading-relaxed text-zinc-200">
          {current.content.map((para, i) => (
            <p
              key={i}
              className={`leading-relaxed ${
                fontSize === 'normal'
                  ? 'text-sm md:text-base'
                  : fontSize === 'large'
                  ? 'text-base md:text-lg'
                  : 'text-lg md:text-xl'
              }`}
            >
              {para}
            </p>
          ))}
        </div>

        {/* Other Articles Horizontal Rail */}
        <div className="pt-6 border-t border-amber-500/20 space-y-3">
          <h4 className="font-display text-sm font-bold text-white tracking-wide flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-amber-400" />
            <span>अन्य पावन लेख (Related Wisdom)</span>
          </h4>

          <div className="grid grid-cols-1 gap-2.5">
            {ARTICLES_DATA.map((art) => (
              <div
                key={art.id}
                onClick={() => {
                  triggerHaptic('light');
                  setActiveArticle(art);
                }}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                  art.id === current.id
                    ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                    : 'bg-black/50 border-amber-500/20 text-zinc-300 hover:border-amber-500/40'
                }`}
              >
                <div>
                  <h5 className="font-display text-xs md:text-sm font-bold text-white leading-tight">
                    {art.title}
                  </h5>
                  <span className="text-[10px] font-mono text-zinc-400 mt-0.5 block">
                    {art.readTime} • {art.summary.slice(0, 50)}...
                  </span>
                </div>
                <span className="text-amber-400 text-xs font-mono">पढ़ें →</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};
