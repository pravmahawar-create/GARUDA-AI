import React from 'react';
import { X, ShieldCheck, Sparkles, Phone, Mail, MapPin } from 'lucide-react';
import { LOGO_PILLARS, CLIENT_FOUNDATION_INFO } from '../data/mockData';
import { getLabels } from '../data/languages';


import type { Language } from '../types';

interface LogoMeaningModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
}

export const LogoMeaningModal: React.FC<LogoMeaningModalProps> = ({ isOpen, onClose, lang }) => {
  const labels = getLabels(lang);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-lg flex items-center justify-center p-4">
      <div className="glass-gold w-full max-w-lg rounded-3xl border border-gold-500/40 p-6 max-h-[90vh] overflow-y-auto space-y-6 shadow-gold-lg">
        {/* Modal Header */}
        <div className="flex justify-between items-start border-b border-gold-500/20 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-black border border-gold-500/50 p-1 flex-shrink-0">
              <img
                src="/assets/Sanatan Setu Golden Spiritual Emblem.png"
                alt="Emblem"
                className="w-full h-full object-contain drop-shadow-[0_0_8px_rgba(212,175,55,0.7)]"
              />
            </div>
            <div>
              <span className="text-[10px] font-mono text-gold-400 uppercase tracking-widest font-bold">
                {labels.brandPhilosophy}
              </span>
              <h3 className="font-cinzel text-lg font-bold text-white leading-tight">
                {lang === 'hi' ? 'सनातन सेतु — लोगो का अर्थ एवं प्रतीक' : 'Sanatan Setu Emblem Symbology'}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/40 border border-gold-500/30 text-gold-300 flex items-center justify-center hover:bg-gold-500/20 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Motto Callout */}
        <div className="bg-gradient-to-r from-gold-950/70 via-black to-gold-950/70 p-4 rounded-2xl border border-gold-500/30 text-center">
          <p className="font-devanagari text-gold-300 text-sm font-bold">
            "{CLIENT_FOUNDATION_INFO.motto}"
          </p>
          <p className="text-[11px] font-cinzel text-zinc-400 mt-1 uppercase tracking-wider">
            {CLIENT_FOUNDATION_INFO.tagline}
          </p>
        </div>

        {/* The 9 Sacred Pillars Breakdown */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h4 className="font-cinzel text-sm font-bold text-white tracking-wide">
              {labels.trustNinePillars}
            </h4>
          </div>

          <div className="space-y-2.5">
            {LOGO_PILLARS.map((pillar) => (
              <div
                key={pillar.id}
                className="p-3.5 rounded-xl bg-black/40 border border-gold-500/15 space-y-1 hover:border-gold-500/40 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-gold-500/20 text-gold-300 text-[10px] font-mono font-bold flex items-center justify-center border border-gold-500/30">
                      {pillar.id}
                    </span>
                    <h5 className="font-devanagari text-sm font-bold text-gold-300">
                      {pillar.titleHindi} <span className="text-xs font-sans text-zinc-400 font-normal">({pillar.titleEnglish})</span>
                    </h5>
                  </div>
                </div>
                <p className="font-devanagari text-xs text-zinc-300 leading-relaxed pl-7">
                  {lang === 'hi' ? pillar.meaningHindi : pillar.meaningEnglish}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Official Foundation Profile Card */}
        <div className="glass-gold p-4 rounded-2xl border border-gold-500/30 space-y-3 text-xs">
          <div className="flex items-center gap-2 border-b border-gold-500/20 pb-2">
            <ShieldCheck className="w-4 h-4 text-gold-400" />
            <span className="font-cinzel font-bold text-white uppercase tracking-wider">
              Registered Charitable Foundation
            </span>
          </div>

          <div className="space-y-1.5 text-zinc-300">
            <p className="font-semibold text-gold-300">{CLIENT_FOUNDATION_INFO.name}</p>
            <p className="font-mono text-[11px] text-zinc-400">Govt Registration No: {CLIENT_FOUNDATION_INFO.registrationNumber}</p>
            <div className="flex items-start gap-2 text-zinc-400 pt-1">
              <MapPin className="w-3.5 h-3.5 text-gold-500 flex-shrink-0 mt-0.5" />
              <span>{CLIENT_FOUNDATION_INFO.address}</span>
            </div>
            <div className="flex items-center gap-2 text-zinc-400">
              <Phone className="w-3.5 h-3.5 text-gold-500" />
              <span>{CLIENT_FOUNDATION_INFO.phone}</span>
            </div>
            <div className="flex items-center gap-2 text-zinc-400">
              <Mail className="w-3.5 h-3.5 text-gold-500" />
              <span>{CLIENT_FOUNDATION_INFO.email}</span>
            </div>
          </div>
        </div>

        {/* Close CTA */}
        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-gold-600 to-amber-500 text-black font-semibold text-xs tracking-wider uppercase shadow-gold-sm"
        >
          {labels.closeReturn}
        </button>
      </div>
    </div>
  );
};
