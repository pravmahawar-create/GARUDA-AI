import React, { useState, useEffect } from 'react';
import { Play, Pause, X } from 'lucide-react';

import { devotionalPlayer, triggerHaptic } from '../services/audioService';
import { MANTRAS_PLAYLIST } from '../data/mockData';

interface MiniPlayerProps {
  onOpenFullPlayer?: () => void;
}

export const MiniPlayer: React.FC<MiniPlayerProps> = ({ onOpenFullPlayer }) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(devotionalPlayer.isPlaying);
  const [currentTime, setCurrentTime] = useState<number>(devotionalPlayer.currentTime);
  const [duration, setDuration] = useState<number>(devotionalPlayer.duration);
  const [currentTrackId, setCurrentTrackId] = useState<string | null>(devotionalPlayer.currentTrackId);
  const [isVisible, setIsVisible] = useState<boolean>(true);

  useEffect(() => {
    const unsub = devotionalPlayer.subscribe(() => {
      setIsPlaying(devotionalPlayer.isPlaying);
      setCurrentTime(devotionalPlayer.currentTime);
      setDuration(devotionalPlayer.duration);
      setCurrentTrackId(devotionalPlayer.currentTrackId);
    });
    return unsub;
  }, []);

  if (!currentTrackId || !isVisible) return null;

  const currentTrack = MANTRAS_PLAYLIST.find(t => t.id === currentTrackId) || MANTRAS_PLAYLIST[0];
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('light');
    devotionalPlayer.togglePlayPause();
  };

  return (
    <div
      onClick={onOpenFullPlayer}
      className="fixed bottom-[65px] left-3 right-3 z-30 max-w-md mx-auto glass-gold border border-gold-500/40 rounded-2xl p-2.5 shadow-gold-md cursor-pointer transition-all hover:border-gold-400"
    >
      {/* Top micro progress bar */}
      <div className="absolute top-0 left-3 right-3 h-[2px] bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-gold-500 to-amber-500 transition-all duration-200"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="flex items-center justify-between gap-3 pt-1">
        {/* Track Artwork & Info */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="relative w-11 h-11 rounded-xl overflow-hidden border border-gold-500/30 flex-shrink-0">
            <img
              src={currentTrack.artwork}
              alt={currentTrack.title}
              className="w-full h-full object-cover"
            />
            {isPlaying && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-gold-400 animate-ping" />
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h4 className="text-xs font-semibold text-white truncate font-cinzel">
              {currentTrack.title}
            </h4>
            <p className="text-[10px] text-gold-400/80 font-devanagari truncate">
              {currentTrack.sanskritTitle}
            </p>
          </div>
        </div>

        {/* Audio Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={togglePlay}
            className="w-9 h-9 rounded-full bg-gradient-to-r from-gold-600 to-amber-500 text-black flex items-center justify-center shadow-gold-sm hover:scale-105 active:scale-95 transition-transform"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-black stroke-black" />
            ) : (
              <Play className="w-4 h-4 fill-black stroke-black ml-0.5" />
            )}
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsVisible(false);
            }}
            className="w-7 h-7 rounded-full text-zinc-400 hover:text-zinc-200 flex items-center justify-center"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
