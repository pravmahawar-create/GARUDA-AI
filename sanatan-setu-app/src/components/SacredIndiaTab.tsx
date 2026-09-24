import React, { useState } from 'react';
import { Radio, MapPin, Clock, Eye, Sparkles, Flame, X } from 'lucide-react';
import { TEMPLES_DATA } from '../data/mockData';
import type { Temple, Language } from '../types';
import { playTempleBell, triggerHaptic } from '../services/audioService';

interface SacredIndiaTabProps {
  lang: Language;
}

export const SacredIndiaTab: React.FC<SacredIndiaTabProps> = ({ lang }) => {
  const [selectedCircuit, setSelectedCircuit] = useState<string>('all');
  const [activeDarshanTemple, setActiveDarshanTemple] = useState<Temple | null>(null);
  const [diyaOffered, setDiyaOffered] = useState<boolean>(false);

  const filteredTemples = selectedCircuit === 'all'
    ? TEMPLES_DATA
    : TEMPLES_DATA.filter(t => t.circuit === selectedCircuit || (selectedCircuit === 'major' && t.circuit === 'major'));

  const handleOpenLiveDarshan = (temple: Temple) => {
    playTempleBell();
    triggerHaptic('medium');
    setDiyaOffered(false);
    setActiveDarshanTemple(temple);
  };

  const handleOfferDiya = () => {
    playTempleBell();
    triggerHaptic('heavy');
    setDiyaOffered(true);
  };

  return (
    <div className="space-y-6 safe-tab-viewport">
      {/* Header Banner */}
      <div className="relative rounded-3xl overflow-hidden border border-gold-500/30 p-6 shadow-gold-md">
        <div className="absolute inset-0 z-0">
          <img
            src="/assets/Screenshot 2026-09-16 120654.png"
            alt="Sacred India Himalayas and Ghats"
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#07090E] via-[#07090E]/80 to-black/50" />
        </div>

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-950/80 border border-amber-500/40 text-amber-300 font-shloka text-xs mb-2 shadow-gold-sm">
            <span>तीर्थं तीर्थकरं विदुः</span>
            <span className="text-[10px] text-zinc-400 font-sans">• Path 4: Pilgrimage & Tourism</span>
          </div>
          <h2 className="font-display text-2xl font-bold text-white tracking-wide">
            {lang === 'hi' ? 'पवित्र तीर्थ व मन्दिर' : 'Sacred India & Temples'}
          </h2>
          <p className="text-xs text-amber-200/90 font-devanagari mt-1.5 leading-relaxed">
            हिमालय के शिखरों से लेकर पावन गंगा तट और दक्षिण के भव्य देवालयों तक
          </p>
        </div>
      </div>

      {/* Circuit Filter Pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'all', label: 'All Tirthas' },
          { id: 'chardham', label: '🏔️ चार धाम' },
          { id: 'jyotirlinga', label: '🔱 द्वादश ज्योतिर्लिंग' },
          { id: 'shaktipeeth', label: '🪔 ५१ शक्तिपीठ' },
          { id: 'major', label: '🏛️ प्रमुख देवालय' },
        ].map((c) => (
          <button
            key={c.id}
            onClick={() => {
              triggerHaptic('light');
              setSelectedCircuit(c.id);
            }}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCircuit === c.id
                ? 'bg-gradient-to-r from-gold-600 to-amber-500 text-black shadow-gold-sm font-bold'
                : 'glass-gold text-zinc-300 border border-gold-500/20 hover:border-gold-500/40'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Temples List */}
      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <span className="text-xs font-cinzel text-gold-400 font-bold">
            Holy Sanctuaries ({filteredTemples.length})
          </span>
          <span className="text-[11px] font-mono text-zinc-400">Live Aarti Streams</span>
        </div>

        {filteredTemples.map((temple) => (
          <div
            key={temple.id}
            className="glass-gold rounded-2xl overflow-hidden border border-gold-500/25 hover:border-gold-400 transition-all shadow-gold-sm"
          >
            {/* Card Image with Live Badge */}
            <div className="relative h-44 w-full">
              <img
                src={temple.image}
                alt={temple.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0D111A] via-transparent to-black/40" />

              {/* Live Badge */}
              <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-950/80 border border-red-500/40 text-red-400 text-[10px] font-mono tracking-wider font-bold">
                <span className="w-2 h-2 rounded-full bg-red-500 live-indicator" />
                <span>LIVE DARSHAN</span>
              </div>

              {/* Viewers Count */}
              <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full bg-black/60 border border-zinc-700 text-zinc-300 text-[10px] font-mono">
                <Eye className="w-3 h-3 text-gold-400" />
                <span>{temple.viewersCount} watching</span>
              </div>

              <div className="absolute bottom-3 left-4 right-4">
                <p className="font-shloka text-xs text-amber-300 font-semibold">
                  {temple.sanskritName}
                </p>
                <h3 className="font-display text-lg md:text-xl font-bold text-white leading-tight drop-shadow-md">
                  {temple.name}
                </h3>
              </div>
            </div>

            {/* Details & CTA */}
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-2 text-xs text-zinc-400 font-sans">
                <MapPin className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                <span className="truncate">{temple.location}, {temple.state}</span>
              </div>

              {/* Pilgrimage Circuit & Altitude Badges */}
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                {temple.circuitTag && (
                  <span className="px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-devanagari font-semibold">
                    {temple.circuitTag}
                  </span>
                )}
                {temple.altitude && (
                  <span className="px-2 py-0.5 rounded-md bg-black/50 border border-zinc-700 text-zinc-300 text-[10px] font-mono">
                    ऊंचाई: {temple.altitude}
                  </span>
                )}
              </div>

              <p className="text-xs text-zinc-300 font-sans leading-relaxed line-clamp-2">
                {temple.description}
              </p>

              {/* Aarti Timings & Best Season */}
              <div className="bg-black/40 p-2.5 rounded-xl border border-amber-500/15 space-y-1.5 text-[11px]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-zinc-400">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>आरती समय:</span>
                  </div>
                  <span className="font-mono text-amber-300 font-semibold">
                    {temple.aartiTimings[0]}
                  </span>
                </div>
                {temple.bestTimeToVisit && (
                  <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 font-devanagari pt-1 border-t border-zinc-800">
                    <Sparkles className="w-3 h-3 text-amber-400 flex-shrink-0" />
                    <span>दर्शन काल: {temple.bestTimeToVisit}</span>
                  </div>
                )}
              </div>

              <button
                onClick={() => handleOpenLiveDarshan(temple)}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-gold-600 to-amber-500 text-black font-semibold text-xs tracking-wider uppercase flex items-center justify-center gap-2 shadow-gold-sm hover:scale-[1.01] active:scale-98 transition-transform"
              >
                <Radio className="w-4 h-4 animate-pulse" />
                <span>Watch Live Darshan</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Live Darshan Video Stream Simulator Modal */}
      {activeDarshanTemple && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-lg flex items-center justify-center p-4">
          <div className="glass-gold w-full max-w-lg rounded-3xl border border-gold-500/40 p-5 space-y-4 shadow-gold-lg">
            {/* Top Live Status */}
            <div className="flex justify-between items-center border-b border-gold-500/20 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500 live-indicator" />
                <div>
                  <h4 className="font-cinzel text-sm font-bold text-white">
                    {activeDarshanTemple.name}
                  </h4>
                  <p className="text-[10px] font-mono text-zinc-400">
                    Live Temple Sanctum Feed • {activeDarshanTemple.viewersCount} Devotees
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveDarshanTemple(null)}
                className="w-8 h-8 rounded-full bg-black/40 border border-gold-500/30 text-gold-300 flex items-center justify-center hover:bg-gold-500/20"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Simulated Live Stream Viewport */}
            <div className="relative aspect-video rounded-2xl overflow-hidden border border-gold-500/30 bg-black flex items-center justify-center">
              <img
                src={activeDarshanTemple.image}
                alt={activeDarshanTemple.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />

              {/* Watermark & Live Overlays */}
              <div className="absolute top-3 left-3 px-2 py-0.5 rounded bg-red-600/90 text-white text-[10px] font-mono font-bold tracking-widest">
                LIVE FEED
              </div>
              <div className="absolute bottom-3 left-3 text-xs font-devanagari text-gold-300 font-bold drop-shadow">
                {activeDarshanTemple.sanskritName}
              </div>

              {/* Virtual Diya Overlay when offered */}
              {diyaOffered && (
                <div className="absolute bottom-4 right-4 flex flex-col items-center animate-bounce">
                  <div className="w-8 h-8 rounded-full bg-amber-500/30 blur-md" />
                  <Flame className="w-8 h-8 text-amber-400 drop-shadow-[0_0_15px_#FF8C00]" />
                  <span className="text-[9px] font-devanagari text-gold-200 mt-0.5">दीप अर्पित</span>
                </div>
              )}
            </div>

            {/* Interactive Offering Actions */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                onClick={handleOfferDiya}
                className={`py-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-cinzel font-semibold transition-all ${
                  diyaOffered
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-diya'
                    : 'glass-gold border-gold-500/30 text-gold-300 hover:border-gold-400'
                }`}
              >
                <Flame className="w-4 h-4 text-amber-400" />
                <span>{diyaOffered ? 'दीप प्रज्वलित ✓' : 'दीप प्रज्वलन करें'}</span>
              </button>

              <button
                onClick={() => playTempleBell()}
                className="py-3 rounded-xl glass-gold border border-gold-500/30 text-gold-300 text-xs font-cinzel font-semibold flex items-center justify-center gap-2 hover:border-gold-400 active:scale-95 transition-all"
              >
                <Sparkles className="w-4 h-4 text-gold-400" />
                <span>घंटी बजाएं (Ring Bell)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
