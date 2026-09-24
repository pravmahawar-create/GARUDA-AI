import React, { useState } from 'react';
import { Play, Pause, Flame } from 'lucide-react';
import { MANTRAS_PLAYLIST } from '../data/mockData';
import type { MantraTrack } from '../types';
import type { Language } from '../types';
import { getLabels } from '../data/languages';
import { devotionalPlayer, triggerHaptic, playTempleBell } from '../services/audioService';
import { pushBackHandler } from '../services/modalBackHandler';

interface BhaktiTabProps {
  lang: Language;
}

export const BhaktiTab: React.FC<BhaktiTabProps> = ({ lang }) => {
  const labels = getLabels(lang);
  const [filterDeity, setFilterDeity] = useState<string>('all');
  const [selectedTrack, setSelectedTrack] = useState<MantraTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(devotionalPlayer.isPlaying);
  const [currentTrackId, setCurrentTrackId] = useState<string | null>(devotionalPlayer.currentTrackId);

  React.useEffect(() => {
    if (!selectedTrack) return;
    return pushBackHandler(() => setSelectedTrack(null));
  }, [selectedTrack]);

  React.useEffect(() => {
    const unsub = devotionalPlayer.subscribe(() => {
      setIsPlaying(devotionalPlayer.isPlaying);
      setCurrentTrackId(devotionalPlayer.currentTrackId);
    });
    return unsub;
  }, []);

  const handlePlayTrack = (track: MantraTrack) => {
    triggerHaptic('medium');
    playTempleBell();
    devotionalPlayer.playTrack(track.audioUrl, track.id);
  };

  const filteredTracks = filterDeity === 'all'
    ? MANTRAS_PLAYLIST
    : MANTRAS_PLAYLIST.filter(t => t.deity === filterDeity);

  return (
    <div className="space-y-6 safe-tab-viewport">
      {/* Header Banner */}
      <div className="relative rounded-3xl overflow-hidden border border-gold-500/30 p-6 shadow-gold-md">
        <div className="absolute inset-0 z-0">
          <img
            src="/assets/Screenshot 2026-09-16 114937.png"
            alt="Mantras and Chanting"
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#07090E] via-[#07090E]/80 to-black/50" />
        </div>

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-950/80 border border-amber-500/40 text-amber-300 font-shloka text-xs mb-2 shadow-gold-sm">
            <span>दर्शनं देवदर्शनम्</span>
            <span className="text-[10px] text-zinc-400 font-sans">• {labels.path2}</span>
          </div>
          <h2 className="font-display text-2xl font-bold text-white tracking-wide">
            {labels.bhaktiHeading}
          </h2>
          <p className="text-xs text-amber-200/90 font-devanagari mt-1.5 leading-relaxed">
            {labels.bhaktiSub}
          </p>
        </div>
      </div>

      {/* Deity Filter Pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'all', label: labels.allDeities },
          { id: 'shiva', label: `🔱 ${labels.mahadev}` },
          { id: 'shakti', label: `🪔 ${labels.maShakti}` },
          { id: 'universal', label: `☀️ ${labels.gayatri}` },
          { id: 'ganesha', label: `🐘 ${labels.ganpati}` },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => {
              triggerHaptic('light');
              setFilterDeity(f.id);
            }}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              filterDeity === f.id
                ? 'bg-gradient-to-r from-gold-600 to-amber-500 text-black shadow-gold-sm font-bold'
                : 'glass-gold text-zinc-300 border border-gold-500/20 hover:border-gold-500/40'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Sacred Track Playlist */}
      <div className="space-y-3">
        <div className="flex justify-between items-center px-1">
          <span className="text-xs font-cinzel text-gold-400 font-bold">
            {labels.featuredChantsList} ({filteredTracks.length})
          </span>
          <span className="text-[11px] font-mono text-zinc-400">{labels.audio108}</span>
        </div>

        {filteredTracks.map((track) => {
          const isCurrentActive = currentTrackId === track.id;
          const isCurrentPlaying = isCurrentActive && isPlaying;

          return (
            <div
              key={track.id}
              onClick={() => setSelectedTrack(track)}
              className={`p-4 rounded-2xl transition-all cursor-pointer flex items-center justify-between gap-4 border ${
                isCurrentActive
                  ? 'glass-gold-active'
                  : 'glass-gold border-gold-500/20 hover:border-gold-500/40'
              }`}
            >
              {/* Artwork & Play Button */}
              <div className="flex items-center gap-3.5 min-w-0 flex-1">
                <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-gold-500/40 flex-shrink-0">
                  <img
                    src={track.artwork}
                    alt={track.title}
                    className="w-full h-full object-cover"
                  />
                  {/* Floating Play/Pause overlay */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlayTrack(track);
                    }}
                    className={`absolute inset-0 flex items-center justify-center transition-all ${
                      isCurrentPlaying ? 'bg-black/60' : 'bg-black/40 hover:bg-black/60'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-gold-500 to-amber-500 text-black flex items-center justify-center shadow-gold-sm">
                      {isCurrentPlaying ? (
                        <Pause className="w-3.5 h-3.5 fill-black stroke-black" />
                      ) : (
                        <Play className="w-3.5 h-3.5 fill-black stroke-black ml-0.5" />
                      )}
                    </div>
                  </button>
                </div>

                <div className="min-w-0 flex-1">
                  <h4 className="font-cinzel text-sm font-bold text-white truncate">
                    {track.title}
                  </h4>
                  <p className="text-xs font-devanagari text-gold-300/90 truncate mt-0.5">
                    {track.sanskritTitle}
                  </p>
                  <p className="text-[10px] font-mono text-zinc-400 mt-1">
                    {track.artist} • {track.durationFormatted}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedTrack(track);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-black/40 border border-gold-500/20 text-[11px] text-gold-300 font-cinzel hover:border-gold-400"
                >
                  {labels.lyricsBtn}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 5-Step Chanting Guide */}
      <div className="glass-gold p-5 rounded-2xl border border-gold-500/25 space-y-3">
        <div className="flex items-center gap-2 border-b border-gold-500/20 pb-2.5">
          <Flame className="w-4 h-4 text-amber-500" />
          <h3 className="font-cinzel text-sm font-bold text-white">
            {labels.howToChant}
          </h3>
        </div>

        <div className="grid grid-cols-5 gap-2 text-center text-[10px]">
          {[
            { num: 1, label: labels.stepPrepare },
            { num: 2, label: labels.stepFocus },
            { num: 3, label: labels.stepChant },
            { num: 4, label: labels.stepFeel },
            { num: 5, label: labels.stepTransform },
          ].map((st) => (
            <div key={st.num} className="bg-black/40 p-2 rounded-xl border border-gold-500/10">
              <span className="w-4 h-4 rounded-full bg-gold-500/20 text-gold-400 font-bold mx-auto flex items-center justify-center mb-1 text-[9px]">
                {st.num}
              </span>
              <p className="font-devanagari text-gold-300 font-semibold">{st.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Full Track Lyrics & Meaning Modal */}
      {selectedTrack && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-gold w-full max-w-lg rounded-3xl border border-gold-500/40 p-6 max-h-[85vh] overflow-y-auto space-y-4 shadow-gold-lg">
            <div className="flex justify-between items-start border-b border-gold-500/20 pb-3">
              <div>
                <span className="text-[10px] font-mono text-gold-400 uppercase tracking-widest font-bold">
                  {labels.sacredLyrics}
                </span>
                <h3 className="font-cinzel text-lg font-bold text-white">
                  {selectedTrack.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedTrack(null)}
                className="w-8 h-8 rounded-full bg-black/40 border border-gold-500/30 text-gold-300 flex items-center justify-center hover:bg-gold-500/20"
              >
                ✕
              </button>
            </div>

            {/* Main Sanskrit Shloka Block */}
            <div className="bg-black/60 p-5 rounded-2xl border border-gold-500/30 text-center space-y-2">
              <p className="font-devanagari text-gold-300 text-lg font-bold leading-relaxed whitespace-pre-line drop-shadow-[0_0_12px_rgba(212,175,55,0.6)]">
                {selectedTrack.sanskritLyrics}
              </p>
              <p className="text-xs font-mono text-amber-400 italic pt-1">
                {selectedTrack.transliteration}
              </p>
            </div>

            {/* Meaning Block */}
            <div className="p-3.5 rounded-xl bg-gold-950/40 border border-gold-500/20">
              <h5 className="text-xs font-mono text-gold-400 uppercase font-semibold">
                {labels.sacredMeaning}
              </h5>
              <p className="font-devanagari text-sm text-zinc-200 mt-1 leading-relaxed">
                {lang === 'en' ? selectedTrack.meaningEnglish : selectedTrack.meaningHindi}
              </p>
            </div>

            {/* Benefits */}
            <div className="p-3.5 rounded-xl bg-black/40 border border-zinc-800">
              <h5 className="text-xs font-mono text-amber-400 uppercase font-semibold">
                {labels.spiritualBenefits}
              </h5>
              <p className="text-xs text-zinc-300 font-sans mt-1 leading-relaxed">
                {selectedTrack.benefits}
              </p>
            </div>

            {/* Quick Play CTA */}
            <button
              onClick={() => {
                handlePlayTrack(selectedTrack);
                setSelectedTrack(null);
              }}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-gold-600 to-amber-500 text-black font-semibold text-xs tracking-wider uppercase flex items-center justify-center gap-2 shadow-gold-sm"
            >
              <Play className="w-4 h-4 fill-black stroke-black" />
              <span>{labels.playSacred}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
