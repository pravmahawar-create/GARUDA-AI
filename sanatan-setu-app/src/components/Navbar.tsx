import React from 'react';
import { Bell, Info, Settings } from 'lucide-react';
import { playTempleBell, triggerHaptic } from '../services/audioService';
import type { Language } from '../types';

interface NavbarProps {
  currentLang: Language;
  onOpenSettings: () => void;
  onOpenLogoInfo: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentLang, onOpenSettings, onOpenLogoInfo }) => {
  const handleBellClick = () => {
    playTempleBell();
  };

  return (
    <header className="sticky top-0 z-30 w-full glass-gold border-b border-amber-500/20 px-4 pb-3 safe-top-padding">
      <div className="max-w-2xl mx-auto flex items-center justify-between">
        {/* Left: Master Emblem & Title */}
        <div className="flex items-center gap-2.5">
          <div className="relative w-9 h-9 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-amber-500/20 blur-md" />
            <img
              src="/assets/Sanatan Setu Golden Spiritual Emblem.png"
              alt="Sanatan Setu Emblem"
              className="w-full h-full object-contain relative z-10 drop-shadow-[0_0_8px_rgba(212,175,55,0.7)]"
            />
          </div>

          <div>
            <h1 className="font-display text-base font-bold tracking-[0.16em] gold-gradient-text leading-tight">
              SANATAN SETU
            </h1>
            <div className="flex items-center gap-1.5">
              <p className="text-[8.5px] font-mono tracking-wider text-amber-400/80 uppercase">
                Trust Reg: 191320 • Noida
              </p>
              <span className="text-zinc-700">•</span>
              <div className="flex items-center gap-0.5">
                <img src="/assets/garuda-sigil.png" alt="GARUDA" className="w-2.5 h-2.5 opacity-50" />
                <span className="text-[7px] font-mono tracking-wider text-amber-500/40 uppercase">GARUDA</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Actions: Temple Bell, Settings / Preferences, Logo Info */}
        <div className="flex items-center gap-2">
          {/* Temple Bell Chime */}
          <button
            onClick={handleBellClick}
            title="Ring Sacred Temple Bell"
            className="w-8 h-8 rounded-full bg-amber-950/50 border border-amber-500/30 text-amber-400 flex items-center justify-center hover:border-amber-400 hover:text-amber-200 transition-colors shadow-gold-sm active:scale-90"
          >
            <Bell className="w-4 h-4" />
          </button>

          {/* Settings / Preferences (Language & Content Switcher) */}
          <button
            onClick={() => {
              triggerHaptic('light');
              onOpenSettings();
            }}
            title={`Language & Preferences (${currentLang.toUpperCase()})`}
            className="w-8 h-8 rounded-full bg-black/50 border border-amber-500/30 text-amber-300 flex items-center justify-center hover:border-amber-400 hover:text-white transition-colors shadow-gold-sm active:scale-90"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Logo & Foundation Info */}
          <button
            onClick={onOpenLogoInfo}
            title="About Sanatan Setu Logo & Foundation"
            className="w-8 h-8 rounded-full bg-amber-950/50 border border-amber-500/30 text-amber-400 flex items-center justify-center hover:border-amber-400 hover:text-amber-200 transition-colors active:scale-90"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
