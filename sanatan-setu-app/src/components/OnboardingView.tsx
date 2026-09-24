import React, { useState } from 'react';
import { Globe, Sparkles, Check, ChevronRight, BookOpen, Scroll, Music, MessageSquare, Flame, Shield, BookMarked, Users, Eye, Landmark, Calendar, Disc3 } from 'lucide-react';
import { LANGUAGES, getLabels } from '../data/languages';
import { CONTENT_CATEGORIES } from '../data/contentCategories';
import type { Language, ContentCategory } from '../types';
import { playTempleBell, triggerHaptic } from '../services/audioService';

interface OnboardingViewProps {
  onComplete: (selectedLang: Language, selectedPrefs: string[]) => void;
}

export const OnboardingView: React.FC<OnboardingViewProps> = ({ onComplete }) => {
  // Step 1: Full-Screen Language Portal ("अपनी भाषा चुनें")
  // Step 2: Content Preferences ("आप क्या देखना और सीखना चाहते हैं?")
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedLang, setSelectedLang] = useState<Language>('hi');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([
    'shiva_shakti',
    'mantras_stotras',
    'vedas_upanishads',
    'teerth_mandir'
  ]);

  const labels = getLabels(selectedLang);

  const handleLangTap = (langCode: Language) => {
    triggerHaptic('medium');
    playTempleBell();
    setSelectedLang(langCode);
  };

  const handleProceedToPreferences = () => {
    triggerHaptic('medium');
    playTempleBell();
    setStep(2);
  };

  const handleToggleCategory = (catId: string) => {
    triggerHaptic('light');
    setSelectedCategories(prev => {
      if (prev.includes(catId)) {
        if (prev.length === 1) return prev; // keep at least 1
        return prev.filter(id => id !== catId);
      } else {
        return [...prev, catId];
      }
    });
  };

  const handleSkipPreferences = () => {
    triggerHaptic('medium');
    playTempleBell();
    const finalPrefs = selectedCategories.length > 0 ? selectedCategories : ['shiva_shakti', 'mantras_stotras', 'vedas_upanishads', 'teerth_mandir'];
    localStorage.setItem('sanatan_language', selectedLang);
    localStorage.setItem('sanatan_user_preferences', JSON.stringify(finalPrefs));
    localStorage.setItem('sanatan_onboarded', 'true');
    onComplete(selectedLang, finalPrefs);
  };

  const handleFinishOnboarding = () => {
    triggerHaptic('heavy');
    playTempleBell();
    localStorage.setItem('sanatan_language', selectedLang);
    localStorage.setItem('sanatan_user_preferences', JSON.stringify(selectedCategories));
    localStorage.setItem('sanatan_onboarded', 'true');
    onComplete(selectedLang, selectedCategories);
  };

  const renderCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'BookOpen': return <BookOpen className="w-4 h-4 text-amber-400" />;
      case 'Scroll': return <Scroll className="w-4 h-4 text-amber-400" />;
      case 'Sparkles': return <Sparkles className="w-4 h-4 text-amber-400" />;
      case 'Music': return <Music className="w-4 h-4 text-amber-400" />;
      case 'MessageSquare': return <MessageSquare className="w-4 h-4 text-amber-400" />;
      case 'Flame': return <Flame className="w-4 h-4 text-amber-400" />;
      case 'Shield': return <Shield className="w-4 h-4 text-amber-400" />;
      case 'BookMarked': return <BookMarked className="w-4 h-4 text-amber-400" />;
      case 'Users': return <Users className="w-4 h-4 text-amber-400" />;
      case 'Eye': return <Eye className="w-4 h-4 text-amber-400" />;
      case 'Landmark': return <Landmark className="w-4 h-4 text-amber-400" />;
      case 'Calendar': return <Calendar className="w-4 h-4 text-amber-400" />;
      case 'Disc3': return <Disc3 className="w-4 h-4 text-amber-400" />;
      default: return <Globe className="w-4 h-4 text-amber-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-40 bg-[#07090E] flex flex-col justify-between overflow-hidden">
      {/* Background Graphic with Vignette */}
      <div className="absolute inset-0 z-0 opacity-25 pointer-events-none">
        <img
          src="/assets/Screenshot 2026-09-16 120635.png"
          alt="Varanasi Ganga Sunrise"
          className="w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#07090E] via-[#07090E]/90 to-[#07090E]/75" />
      </div>

      {/* Top Header */}
      <div className="relative z-10 px-5 pt-8 flex justify-between items-center">
        <div className="flex items-center gap-2.5">
          <img
            src="/assets/Sanatan Setu Golden Spiritual Emblem.png"
            alt="Sanatan Setu Emblem"
            className="w-8 h-8 object-contain drop-shadow-[0_0_12px_rgba(212,175,55,0.6)]"
          />
          <div>
            <span className="font-display text-xs tracking-[0.16em] gold-gradient-text font-bold block">
              SANATAN SETU
            </span>
            <span className="text-[9px] font-mono tracking-widest text-amber-400/80 uppercase block">
              Trust Reg: 191320 Noida
            </span>
          </div>
        </div>

        {step === 2 && (
          <button
            onClick={handleSkipPreferences}
            className="text-xs text-zinc-400 font-medium tracking-wider hover:text-amber-300 transition-colors uppercase px-3 py-1 rounded-full bg-black/40 border border-amber-500/20"
          >
            {labels.skipForNow || 'Skip for now'}
          </button>
        )}
      </div>

      {/* STEP 1: FULL-SCREEN LANGUAGE PORTAL (15 Sacred Languages) */}
      {step === 1 && (
        <div className="relative z-10 px-4 py-3 flex-1 flex flex-col justify-between max-w-md mx-auto w-full overflow-hidden">
          <div className="text-center mb-2.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/80 border border-amber-500/40 text-amber-300 text-[10px] font-mono uppercase tracking-wider mb-2 shadow-gold-sm">
              <Globe className="w-3 h-3 text-amber-400" />
              <span>चरण १ / २ • Language Portal</span>
            </span>
            <h2 className="font-display text-2xl font-bold text-white tracking-wide">
              अपनी भाषा चुनें
            </h2>
            <p className="text-xs text-amber-200/80 font-devanagari mt-1">
              आपकी यात्रा आपकी भाषा से शुरू होती है • Choose Your Sacred Language
            </p>
          </div>

          {/* 15 Languages Grid */}
          <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-2 gap-2 my-2 pb-2">
            {LANGUAGES.map((lang) => {
              const isSelected = selectedLang === lang.code;
              return (
                <button
                  key={lang.code}
                  onClick={() => handleLangTap(lang.code)}
                  className={`p-3 rounded-2xl text-left border transition-all flex items-center justify-between group active:scale-97 ${
                    isSelected
                      ? 'bg-amber-500/25 border-amber-400 text-amber-200 shadow-gold-sm ring-1 ring-amber-400/60'
                      : 'bg-black/50 border-amber-500/15 text-zinc-300 hover:border-amber-500/35'
                  }`}
                >
                  <div>
                    <p className="font-devanagari text-sm font-bold leading-tight group-hover:text-amber-300">
                      {lang.nativeName}
                    </p>
                    <p className="text-[10px] font-mono text-zinc-500 mt-0.5">
                      {lang.name} • {lang.region}
                    </p>
                  </div>
                  {isSelected ? (
                    <div className="w-5 h-5 rounded-full bg-amber-500 text-black flex items-center justify-center flex-shrink-0 shadow-gold-sm">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full border border-zinc-700 bg-black/40 flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Continue Button — pb-16 clears Android nav bar */}
          <div className="pt-2 pb-16">
            <button
              onClick={handleProceedToPreferences}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 text-black font-semibold text-xs tracking-wider uppercase shadow-gold-md hover:brightness-110 active:scale-98 transition-all flex items-center justify-center gap-2"
            >
              <span>{labels.continue || 'आगे बढ़ें'} (Continue)</span>
              <ChevronRight className="w-4 h-4 stroke-[3]" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: CONTENT PREFERENCES ("आप क्या देखना और सीखना चाहते हैं?") */}
      {step === 2 && (
        <div className="relative z-10 px-4 py-3 flex-1 flex flex-col justify-between max-w-md mx-auto w-full overflow-hidden">
          <div className="text-center mb-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/80 border border-amber-500/40 text-amber-300 text-[10px] font-mono uppercase tracking-wider mb-1.5 shadow-gold-sm">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>चरण २ / २ • Step 2 of 2</span>
            </span>
            <h2 className="font-display text-xl md:text-2xl font-bold text-white tracking-wide">
              {labels.selectPreferences || 'आप क्या देखना और सीखना चाहते हैं?'}
            </h2>
            <p className="text-[11px] text-zinc-400 font-devanagari mt-0.5">
              अपनी रुचि के विषय चुनें — हम आपके लिए पावन सामग्री तैयार करेंगे ({selectedCategories.length} चुने गए)
            </p>
          </div>

          {/* 14 Categories Multi-Select Grid (Astrology Isolated) */}
          <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-2 gap-2.5 my-2 pb-2">
            {CONTENT_CATEGORIES.map((cat: ContentCategory) => {
              const isSelected = selectedCategories.includes(cat.id);
              return (
                <div
                  key={cat.id}
                  onClick={() => handleToggleCategory(cat.id)}
                  className={`relative rounded-2xl overflow-hidden border cursor-pointer transition-all p-3 flex flex-col justify-between group active:scale-97 min-h-[90px] ${
                    isSelected
                      ? 'border-amber-400 bg-gradient-to-br from-amber-950/70 via-black/80 to-amber-950/40 shadow-gold-sm ring-1 ring-amber-400/50'
                      : 'border-amber-500/20 bg-black/50 hover:border-amber-500/40'
                  }`}
                >
                  {/* Background Artwork Backdrop */}
                  <div className="absolute inset-0 z-0 opacity-15">
                    <img src={cat.image} alt={cat.titleHindi} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/60" />
                  </div>

                  {/* Top Bar inside card: Icon + Checkbox */}
                  <div className="relative z-10 flex justify-between items-center">
                    <div className="w-7 h-7 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
                      {renderCategoryIcon(cat.iconName)}
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                        isSelected
                          ? 'bg-amber-500 border-amber-400 text-black shadow-gold-sm'
                          : 'border-zinc-600 bg-black/40'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </div>

                  {/* Category Titles */}
                  <div className="relative z-10 mt-2">
                    <h4 className={`font-devanagari text-xs font-bold leading-tight transition-colors ${
                      isSelected ? 'text-amber-200' : 'text-white group-hover:text-amber-300'
                    }`}>
                      {cat.titleHindi}
                    </h4>
                    <p className="text-[9px] font-mono text-zinc-400 truncate mt-0.5">
                      {cat.tagline}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Finish Button — pb-16 clears Android nav bar */}
          <div className="pt-2 pb-16">
            <button
              onClick={handleFinishOnboarding}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 text-black font-semibold text-xs tracking-wider uppercase shadow-gold-md hover:brightness-110 active:scale-98 transition-all flex items-center justify-center gap-2"
            >
              <span>{labels.beginJourney || 'सेतु में प्रवेश करें (Enter Sanctuary)'}</span>
              <ChevronRight className="w-4 h-4 stroke-[3]" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
