import React, { useEffect } from 'react';
import { X, Sparkles, CheckCircle2 } from 'lucide-react';
import type { Purana } from '../types';
import { pushBackHandler } from '../services/modalBackHandler';

interface PuranaDetailModalProps {
  purana: Purana | null;
  isOpen: boolean;
  onClose: () => void;
  lang: string;
}

export const PuranaDetailModal: React.FC<PuranaDetailModalProps> = ({
  purana,
  isOpen,
  onClose,
  lang: _lang
}) => {
  useEffect(() => {
    if (!isOpen) return;
    return pushBackHandler(onClose);
  }, [isOpen, onClose]);

  if (!isOpen || !purana) return null;

  const categoryColor = purana.category === 'Sattvika'
    ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300'
    : purana.category === 'Rajasa'
    ? 'bg-amber-950/70 border-amber-500/40 text-amber-300'
    : 'bg-indigo-950/70 border-indigo-500/40 text-indigo-300';

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 safe-top-padding">
      <div className="glass-gold w-full max-w-lg rounded-3xl border border-amber-500/40 p-5 md:p-6 my-auto max-h-[88vh] overflow-y-auto space-y-5 shadow-gold-lg animate-in fade-in zoom-in duration-150">
        {/* Header */}
        <div className="flex justify-between items-start border-b border-amber-500/20 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-mono uppercase tracking-widest font-bold ${categoryColor}`}>
                {purana.category || 'महापुराण'} तत्त्व
              </span>
              <span className="text-[10px] font-mono text-zinc-400">
                {purana.shlokasCount} श्लोक
              </span>
            </div>

            <h3 className="font-display text-xl md:text-2xl font-bold text-white tracking-wide">
              {purana.sanskritName}
            </h3>
            <p className="text-xs text-amber-300/90 font-mono mt-0.5">
              {purana.name} • आराध्य: {purana.deity}
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/50 border border-amber-500/30 text-zinc-400 flex items-center justify-center hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Core Summary */}
        <div className="bg-black/50 p-4 rounded-2xl border border-amber-500/20 space-y-2">
          <span className="text-[10px] font-mono text-amber-400 uppercase tracking-widest block font-bold">
            महापुराण का सार एवं महत्व:
          </span>
          <p className="font-devanagari text-xs md:text-sm text-zinc-200 leading-relaxed">
            {purana.summary}
          </p>
        </div>

        {/* Key Stories / Episodes */}
        {purana.keyStories && purana.keyStories.length > 0 && (
          <div className="space-y-2">
            <span className="text-xs font-display font-semibold text-white flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>प्रमुख आख्यान एवं दिव्य गाथाएं</span>
            </span>

            <div className="grid grid-cols-2 gap-2">
              {purana.keyStories.map((story, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl bg-black/40 border border-amber-500/15 flex items-center gap-2"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                  <span className="font-devanagari text-xs text-zinc-300 font-medium truncate">
                    {story}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
          <div className="p-2.5 rounded-xl bg-black/40 border border-amber-500/15">
            <span className="text-[10px] font-mono text-zinc-400 block">कुल श्लोक</span>
            <span className="font-mono text-amber-300 font-bold">{purana.shlokasCount}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-black/40 border border-amber-500/15">
            <span className="text-[10px] font-mono text-zinc-400 block">अध्याय संख्या</span>
            <span className="font-mono text-amber-300 font-bold">{purana.chaptersCount || 'अनेक खण्ड'}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-black/40 border border-amber-500/15">
            <span className="text-[10px] font-mono text-zinc-400 block">परंपरा</span>
            <span className="font-devanagari text-amber-300 font-bold">व्यास प्रणीत</span>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 text-black font-semibold text-xs tracking-wider uppercase shadow-gold-sm hover:brightness-110 active:scale-98 transition-all"
        >
          वापस जाएं (Return to Granthas)
        </button>
      </div>
    </div>
  );
};
