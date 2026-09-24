import React, { useState } from 'react';
import { X, Globe, Check, ShieldCheck, RefreshCw } from 'lucide-react';
import { LANGUAGES } from '../data/languages';
import { CONTENT_CATEGORIES } from '../data/contentCategories';
import { CLIENT_FOUNDATION_INFO } from '../data/mockData';
import type { Language } from '../types';
import { triggerHaptic, playTempleBell } from '../services/audioService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLang: Language;
  onSelectLang: (lang: Language) => void;
  userPreferences: string[];
  onUpdatePreferences: (prefs: string[]) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  currentLang,
  onSelectLang,
  userPreferences,
  onUpdatePreferences,
}) => {
  const [activeTab, setActiveTab] = useState<'language' | 'preferences' | 'about'>('language');
  const [tempPrefs, setTempPrefs] = useState<string[]>(userPreferences);

  if (!isOpen) return null;

  const handleLangSelect = (langCode: Language) => {
    triggerHaptic('medium');
    playTempleBell();
    onSelectLang(langCode);
    localStorage.setItem('sanatan_language', langCode);
  };

  const handleTogglePref = (catId: string) => {
    triggerHaptic('light');
    let updated: string[];
    if (tempPrefs.includes(catId)) {
      if (tempPrefs.length === 1) return; // keep at least 1
      updated = tempPrefs.filter(id => id !== catId);
    } else {
      updated = [...tempPrefs, catId];
    }
    setTempPrefs(updated);
    onUpdatePreferences(updated);
    localStorage.setItem('sanatan_user_preferences', JSON.stringify(updated));
  };

  const handleResetPreferences = () => {
    triggerHaptic('medium');
    const defaultIds = ['shiva_shakti', 'mantras_stotras', 'vedas_upanishads', 'teerth_mandir'];
    setTempPrefs(defaultIds);
    onUpdatePreferences(defaultIds);
    localStorage.setItem('sanatan_user_preferences', JSON.stringify(defaultIds));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex items-center justify-center p-4">
      <div className="glass-gold w-full max-w-md rounded-3xl border border-amber-500/40 p-5 space-y-4 shadow-gold-lg animate-in fade-in zoom-in duration-150 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-amber-500/20 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
              <Globe className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h3 className="font-display text-base font-bold text-white">
                सेटिंग्स एवं प्राथमिकताएं
              </h3>
              <p className="text-[10px] font-mono text-amber-400/80">Settings & Preferences</p>
            </div>
          </div>
          <button
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-black/50 border border-amber-500/30 text-zinc-400 flex items-center justify-center hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="grid grid-cols-3 gap-1 bg-black/60 p-1 rounded-xl border border-amber-500/20">
          <button
            onClick={() => setActiveTab('language')}
            className={`py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'language'
                ? 'bg-amber-500/25 border border-amber-400 text-amber-200 shadow-gold-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            भाषा (Language)
          </button>
          <button
            onClick={() => setActiveTab('preferences')}
            className={`py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'preferences'
                ? 'bg-amber-500/25 border border-amber-400 text-amber-200 shadow-gold-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            विषय (Topics)
          </button>
          <button
            onClick={() => setActiveTab('about')}
            className={`py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'about'
                ? 'bg-amber-500/25 border border-amber-400 text-amber-200 shadow-gold-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            संस्थान (Trust)
          </button>
        </div>

        {/* Tab 1: 14 Languages Grid */}
        {activeTab === 'language' && (
          <div className="flex-1 overflow-y-auto pr-1 space-y-2.5">
            <p className="text-xs text-zinc-300 font-devanagari">
              सनातन ज्ञान और मन्त्रों का अपनी पवित्र मातृभाषा में अनुभव करें:
            </p>
            <div className="grid grid-cols-2 gap-2">
              {LANGUAGES.map((lang) => {
                const isSelected = currentLang === lang.code;
                return (
                  <button
                    key={lang.code}
                    onClick={() => handleLangSelect(lang.code)}
                    className={`p-2.5 rounded-2xl text-left border transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-amber-500/25 border-amber-400 text-amber-200 shadow-gold-sm ring-1 ring-amber-400/50'
                        : 'bg-black/40 border-amber-500/15 text-zinc-300 hover:border-amber-500/40'
                    }`}
                  >
                    <div>
                      <p className="font-devanagari text-sm font-bold leading-tight">{lang.nativeName}</p>
                      <p className="text-[10px] font-mono text-zinc-500">{lang.name}</p>
                    </div>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-amber-500 text-black flex items-center justify-center">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 2: Content Preferences (Netflix-style topic toggles) */}
        {activeTab === 'preferences' && (
          <div className="flex-1 overflow-y-auto pr-1 space-y-2.5">
            <div className="flex justify-between items-center">
              <p className="text-xs text-zinc-300 font-devanagari">
                होम स्क्रीन पर अपनी रुचि के विषय चुनें:
              </p>
              <button
                onClick={handleResetPreferences}
                className="text-[11px] font-mono text-amber-400 flex items-center gap-1 hover:underline"
              >
                <RefreshCw className="w-3 h-3" />
                <span>रीसेट</span>
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {CONTENT_CATEGORIES.map((cat) => {
                const isSelected = tempPrefs.includes(cat.id);
                return (
                  <button
                    key={cat.id}
                    onClick={() => handleTogglePref(cat.id)}
                    className={`p-2.5 rounded-2xl text-left border transition-all flex items-center justify-between gap-1.5 ${
                      isSelected
                        ? 'bg-amber-500/25 border-amber-400 text-amber-200 shadow-gold-sm'
                        : 'bg-black/40 border-amber-500/15 text-zinc-400 hover:border-amber-500/30'
                    }`}
                  >
                    <div className="truncate">
                      <p className="font-devanagari text-xs font-bold truncate leading-tight">{cat.titleHindi}</p>
                      <p className="text-[9px] font-mono text-zinc-500 truncate">{cat.titleEnglish}</p>
                    </div>
                    <div
                      className={`w-4 h-4 rounded-md border flex items-center justify-center flex-shrink-0 ${
                        isSelected
                          ? 'bg-amber-500 border-amber-400 text-black'
                          : 'border-zinc-600 bg-black/40'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 3: About Trust */}
        {activeTab === 'about' && (
          <div className="flex-1 overflow-y-auto pr-1 space-y-3 text-xs text-zinc-300">
            <div className="p-3.5 rounded-2xl bg-black/60 border border-amber-500/30 space-y-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span className="font-display text-sm font-bold text-white">
                  {CLIENT_FOUNDATION_INFO.name}
                </span>
              </div>
              <p className="text-[11px] font-mono text-amber-400">
                Regd. Trust: {CLIENT_FOUNDATION_INFO.registrationNumber} (Noida, U.P.)
              </p>
              <p className="text-zinc-400 leading-relaxed font-devanagari">
                {CLIENT_FOUNDATION_INFO.motto}
              </p>
              <p className="text-[11px] text-zinc-400 font-mono">
                Email: {CLIENT_FOUNDATION_INFO.email}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/20 text-center">
              <p className="text-[11px] font-mono text-amber-300">Sanatan Setu Mobile Edition v2.3</p>
              <p className="text-[9px] text-zinc-500 font-mono mt-0.5">Powered by GARUDA & SIGIL</p>
            </div>
          </div>
        )}

        {/* Done Button */}
        <button
          onClick={() => {
            triggerHaptic('medium');
            onClose();
          }}
          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 text-black font-semibold text-xs tracking-wider uppercase shadow-gold-sm hover:brightness-110 transition-all"
        >
          पूर्ण (Done)
        </button>
      </div>
    </div>
  );
};
