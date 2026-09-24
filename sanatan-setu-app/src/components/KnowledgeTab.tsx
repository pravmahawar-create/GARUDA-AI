import React, { useState } from 'react';
import {
  Scroll, ChevronRight, BookOpen, Sparkles, Flame, Eye,
  Users, Shield, Heart, Calendar, Music, BookMarked, ArrowRight
} from 'lucide-react';
import {
  VEDAS_DATA, UPANISHADS_DATA, GITA_HIGHLIGHTS, PURANAS_LIST,
  DEEP_SCRIPTURES_DATA, ARTICLES_DATA
} from '../data/mockData';
import { KNOWLEDGE_HUB_CATEGORIES } from '../data/knowledgeHubData';
import { getLabels, getCategoryTitle } from '../data/languages';
import type { Veda, Upanishad, GitaShloka, Purana, DeepScripture, Language, Article } from '../types';
import type { TabType } from './BottomNav';
import { playTempleBell, triggerHaptic } from '../services/audioService';
import { ScriptureReaderModal } from './ScriptureReaderModal';
import { PuranaDetailModal } from './PuranaDetailModal';
import { KnowledgeDetailModal, type KnowledgeCategoryKey } from './KnowledgeDetailModal';
import { ArticleReaderModal } from './ArticleReaderModal';

interface KnowledgeTabProps {
  lang: Language;
  onNavigateTab?: (tab: TabType) => void;
}

type SubSection = 'hub' | 'vedas' | 'upanishads' | 'gita' | 'puranas';

export const KnowledgeTab: React.FC<KnowledgeTabProps> = ({ lang, onNavigateTab }) => {
  const labels = getLabels(lang);
  const [subSection, setSubSection] = useState<SubSection>('hub');
  const [puranaFilter, setPuranaFilter] = useState<string>('all');

  // Reader Modals
  const [activeDeepScripture, setActiveDeepScripture] = useState<DeepScripture | null>(null);
  const [activePurana, setActivePurana] = useState<Purana | null>(null);
  const [activeCategoryModal, setActiveCategoryModal] = useState<KnowledgeCategoryKey | null>(null);
  const [activeArticle, setActiveArticle] = useState<Article | null>(null);

  const switchSub = (sec: SubSection) => {
    triggerHaptic('light');
    setSubSection(sec);
  };

  const handleOpenVeda = (veda: Veda) => {
    triggerHaptic('medium');
    playTempleBell();
    const deep = DEEP_SCRIPTURES_DATA[veda.id] || DEEP_SCRIPTURES_DATA.rigveda;
    setActiveDeepScripture(deep);
  };

  const handleOpenUpanishad = (_up: Upanishad) => {
    triggerHaptic('medium');
    playTempleBell();
    const deep = DEEP_SCRIPTURES_DATA.isha_upanishad;
    setActiveDeepScripture(deep);
  };

  const handleOpenGita = (_gita: GitaShloka) => {
    triggerHaptic('medium');
    playTempleBell();
    const deep = DEEP_SCRIPTURES_DATA.gita_deep;
    setActiveDeepScripture(deep);
  };

  const handleOpenPurana = (purana: Purana) => {
    triggerHaptic('medium');
    playTempleBell();
    setActivePurana(purana);
  };

  const handleCategoryCardClick = (catId: string) => {
    triggerHaptic('medium');
    playTempleBell();

    switch (catId) {
      case 'vedas':
        setActiveDeepScripture(DEEP_SCRIPTURES_DATA.rigveda);
        break;
      case 'upanishads':
        setActiveDeepScripture(DEEP_SCRIPTURES_DATA.isha_upanishad);
        break;
      case 'gita':
        setActiveDeepScripture(DEEP_SCRIPTURES_DATA.gita_deep);
        break;
      case 'puranas':
        setActivePurana(PURANAS_LIST[0]);
        break;
      case 'darshan':
        setActiveCategoryModal('darshan');
        break;
      case 'rishis':
        setActiveCategoryModal('rishis');
        break;
      case 'itihas':
        setActiveCategoryModal('itihas');
        break;
      case 'samskaras':
        setActiveCategoryModal('samskaras');
        break;
      case 'festivals':
        setActiveCategoryModal('festivals');
        break;
      case 'mantras':
        if (onNavigateTab) {
          onNavigateTab('bhakti');
        }
        break;
      case 'articles':
        setActiveArticle(ARTICLES_DATA[0]);
        break;
    }
  };

  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'BookOpen': return <BookOpen className="w-5 h-5 text-amber-400" />;
      case 'Scroll': return <Scroll className="w-5 h-5 text-amber-400" />;
      case 'Sparkles': return <Sparkles className="w-5 h-5 text-amber-400" />;
      case 'Flame': return <Flame className="w-5 h-5 text-amber-400" />;
      case 'Eye': return <Eye className="w-5 h-5 text-amber-400" />;
      case 'Users': return <Users className="w-5 h-5 text-amber-400" />;
      case 'Shield': return <Shield className="w-5 h-5 text-amber-400" />;
      case 'Heart': return <Heart className="w-5 h-5 text-amber-400" />;
      case 'Calendar': return <Calendar className="w-5 h-5 text-amber-400" />;
      case 'Music': return <Music className="w-5 h-5 text-amber-400" />;
      case 'BookMarked': return <BookMarked className="w-5 h-5 text-amber-400" />;
      default: return <BookOpen className="w-5 h-5 text-amber-400" />;
    }
  };

  const filteredPuranas = puranaFilter === 'all'
    ? PURANAS_LIST
    : PURANAS_LIST.filter(p => p.category === puranaFilter);

  return (
    <div className="space-y-5 safe-tab-viewport pb-16">
      {/* 1. Header Banner: "सनातन ज्ञान का महासागर" */}
      <div className="relative rounded-3xl overflow-hidden border border-amber-500/30 p-5 md:p-6 shadow-gold-md">
        <div className="absolute inset-0 z-0">
          <img
            src="/assets/Screenshot 2026-09-16 120715.png"
            alt="Vedas Grantha Banner"
            className="w-full h-full object-cover object-center brightness-65"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#07090E] via-[#07090E]/85 to-black/50" />
        </div>

        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-950/80 border border-amber-500/40 text-amber-300 font-shloka text-xs shadow-gold-sm">
            <span>विद्या ददाति विनयम्</span>
            <span className="text-[10px] text-zinc-400 font-sans">• {labels.knowledgeOcean}</span>
          </div>
          <h2 className="font-display text-2xl md:text-3xl font-bold text-white tracking-wide">
            {labels.knowledgeHubTitle}
          </h2>
          <p className="text-xs text-amber-200/90 font-devanagari leading-relaxed max-w-md">
            {labels.knowledgeSub}
          </p>
        </div>
      </div>

      {/* 2. Sub-section Navigation Pill Tabs */}
      <div className="flex rounded-2xl glass-gold p-1 border border-amber-500/25 overflow-x-auto scrollbar-none gap-1">
        {[
          { id: 'hub' as SubSection, label: labels.knowledgeOcean },
          { id: 'vedas' as SubSection, label: lang === 'hi' || lang === 'sa' ? '४ वेद' : '4 Vedas' },
          { id: 'upanishads' as SubSection, label: lang === 'hi' || lang === 'sa' ? '१० उपनिषद्' : 'Upanishads' },
          { id: 'gita' as SubSection, label: lang === 'hi' || lang === 'sa' ? 'गीता' : 'Bhagavad Gita' },
          { id: 'puranas' as SubSection, label: labels.puranas18 },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => switchSub(tab.id)}
            className={`flex-1 min-w-[90px] py-2 px-3 rounded-xl text-xs font-display font-semibold tracking-wider transition-all text-center whitespace-nowrap ${
              subSection === tab.id
                ? 'bg-gradient-to-r from-amber-600 to-yellow-500 text-black shadow-gold-sm font-bold'
                : 'text-zinc-400 hover:text-amber-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 3. MAJOR KNOWLEDGE HUB VIEW (THE 11 CLICKABLE CATEGORIES) */}
      {subSection === 'hub' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <span className="text-xs font-mono text-zinc-400">{labels.pillars11}</span>
            <span className="text-[11px] text-amber-400 font-mono font-bold">{labels.tapToOpen}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {KNOWLEDGE_HUB_CATEGORIES.map((cat, idx) => (
              <div
                key={cat.id}
                onClick={() => handleCategoryCardClick(cat.id)}
                className="glass-gold p-5 rounded-3xl border border-amber-500/25 hover:border-amber-400 cursor-pointer transition-all group flex flex-col justify-between shadow-gold-sm relative overflow-hidden active:scale-98 min-h-[160px]"
              >
                {/* Background Accent Subtle Glow */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

                <div>
                  <div className="flex justify-between items-start mb-2.5">
                    <div className="w-11 h-11 rounded-2xl bg-amber-950/80 border border-amber-500/35 flex items-center justify-center group-hover:scale-110 transition-transform shadow-gold-sm">
                      {getCategoryIcon(cat.iconName)}
                    </div>
                    <span className="text-xs font-mono text-amber-300 font-bold px-3 py-1 rounded-full bg-black/70 border border-amber-500/30 shadow-inner">
                      {cat.countBadge}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-amber-400 font-bold">
                      #{idx + 1}
                    </span>
                    <h3 className="font-display text-lg font-bold text-white group-hover:text-amber-200 transition-colors">
                      {getCategoryTitle(cat.id, lang, cat.titleHindi, cat.titleEnglish)}
                    </h3>
                  </div>
                  {getCategoryTitle(cat.id, lang, cat.titleHindi, cat.titleEnglish) !== cat.titleEnglish && (
                    <span className="text-xs font-mono text-amber-300/80 block mt-0.5">
                      {cat.titleEnglish}
                    </span>
                  )}

                  <p className="text-sm text-zinc-200 font-devanagari mt-2.5 leading-relaxed">
                    {cat.tagline}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-zinc-800/90 flex items-center justify-between text-xs font-mono text-amber-400 font-bold">
                  <span className="group-hover:underline">{labels.openStudy}</span>
                  <div className="flex items-center gap-1.5">
                    <span>{labels.enter}</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. VEDAS SECTION */}
      {subSection === 'vedas' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <span className="text-xs font-mono text-zinc-400">{labels.shruti}</span>
            <span className="text-[11px] text-amber-400 font-mono font-bold">{labels.openReader}</span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {VEDAS_DATA.map((veda) => (
              <div
                key={veda.id}
                onClick={() => handleOpenVeda(veda)}
                className="glass-gold p-5 rounded-3xl border border-amber-500/25 cursor-pointer hover:border-amber-400 transition-all group shadow-gold-sm"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-display text-lg font-bold text-white group-hover:text-amber-200 transition-colors">
                      {veda.name} ({veda.sanskritName})
                    </h3>
                    <p className="text-xs text-amber-300 font-devanagari mt-0.5">
                      {veda.tagline}
                    </p>
                  </div>
                  <span className="text-[10px] font-mono text-amber-400/90 px-2.5 py-1 rounded-full bg-black/60 border border-amber-500/30">
                    {veda.mantrasCount}
                  </span>
                </div>

                <div className="mt-3.5 p-3.5 rounded-2xl bg-black/50 border border-amber-500/15">
                  <p className="font-shloka text-amber-200 text-sm md:text-base font-semibold leading-relaxed">
                    "{veda.sanskritVerse}"
                  </p>
                  <p className="font-devanagari text-xs text-zinc-300 mt-1.5 leading-relaxed">
                    {veda.hindiTranslation}
                  </p>
                </div>

                <div className="mt-3 flex justify-between items-center text-[11px] font-mono text-amber-400 pt-2 border-t border-zinc-800">
                  <span>{labels.keySuktaLabel} {veda.keySukta.split(',')[0]}</span>
                  <span className="underline font-bold">{labels.deepStudy}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. UPANISHADS SECTION */}
      {subSection === 'upanishads' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <span className="text-xs font-mono text-zinc-400">{labels.upanishadHeader}</span>
            <span className="text-[11px] text-amber-400 font-mono">Tat Tvam Asi</span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {UPANISHADS_DATA.map((up) => (
              <div
                key={up.id}
                onClick={() => handleOpenUpanishad(up)}
                className="glass-gold p-5 rounded-2xl border border-amber-500/25 cursor-pointer hover:border-amber-400 transition-all group shadow-gold-sm"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[11px] font-mono text-amber-400">
                      {up.vedaAssociation}
                    </span>
                    <h3 className="font-display text-base font-bold text-white mt-1 group-hover:text-amber-200">
                      {up.name} ({up.sanskritName})
                    </h3>
                  </div>
                  <Scroll className="w-5 h-5 text-amber-500 group-hover:rotate-12 transition-transform" />
                </div>

                <div className="mt-3 p-3 rounded-xl bg-black/40 border border-amber-500/15">
                  <p className="text-[10px] font-mono text-amber-400 uppercase tracking-widest font-bold">
                    {labels.mahavakyaLabel}
                  </p>
                  <p className="font-shloka text-amber-200 text-base font-bold mt-0.5">
                    {up.mahavakya}
                  </p>
                  <p className="text-xs text-zinc-300 font-devanagari mt-1 leading-relaxed">
                    {up.mahavakyaMeaning}
                  </p>
                </div>

                <div className="mt-2.5 text-right">
                  <span className="text-[10px] font-mono text-amber-400 underline">
                    {labels.openUpanishad}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. BHAGAVAD GITA SECTION */}
      {subSection === 'gita' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <span className="text-xs font-mono text-zinc-400">श्रीमद्भगवद्गीता • १८ अध्याय, ७०० श्लोक</span>
            <span className="text-[11px] text-amber-400 font-mono">Yogah Karmasu Kaushalam</span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {GITA_HIGHLIGHTS.map((gita, idx) => (
              <div
                key={idx}
                onClick={() => handleOpenGita(gita)}
                className="glass-gold p-5 rounded-2xl border border-amber-500/25 cursor-pointer hover:border-amber-400 transition-all group shadow-gold-sm"
              >
                <div className="flex justify-between items-center mb-2 border-b border-amber-500/15 pb-2">
                  <span className="text-xs font-mono text-amber-400 font-bold">
                    {labels.chapterLabel} {gita.chapter} • {labels.verseLabel} {gita.verse}
                  </span>
                  <span className="text-[10px] font-mono text-zinc-400">{labels.bhagavadVaani}</span>
                </div>

                <div className="p-3.5 rounded-xl bg-black/50 border border-amber-500/15 text-center my-2">
                  <p className="font-shloka text-amber-100 text-sm md:text-base font-bold whitespace-pre-line leading-relaxed">
                    {gita.sanskrit}
                  </p>
                </div>

                <p className="font-devanagari text-xs text-zinc-300 leading-relaxed mt-2">
                  {gita.hindiMeaning}
                </p>

                <div className="mt-3 text-right">
                  <span className="text-[10px] font-mono text-amber-400 underline">
                    {labels.openFullGita}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7. ALL 18 MAHAPURANAS SECTION */}
      {subSection === 'puranas' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div>
              <span className="font-display text-sm font-bold text-white block">
                {labels.allPuranas}
              </span>
              <span className="text-[10px] font-mono text-zinc-400">कुल ४,००,००० {labels.shlokaCountLabel}</span>
            </div>
            <span className="text-xs text-amber-400 font-mono font-bold">18/18 Available</span>
          </div>

          {/* Category Filter Pills */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {[
              { id: 'all', label: labels.allPuranas },
              { id: 'Sattvika', label: labels.sattvika },
              { id: 'Rajasa', label: labels.rajasa },
              { id: 'Tamasa', label: labels.tamasa },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => {
                  triggerHaptic('light');
                  setPuranaFilter(f.id);
                }}
                className={`px-3 py-1 rounded-full text-xs font-mono font-semibold whitespace-nowrap transition-all ${
                  puranaFilter === f.id
                    ? 'bg-amber-500 text-black font-bold shadow-gold-sm'
                    : 'bg-black/50 border border-amber-500/20 text-zinc-300 hover:border-amber-500/40'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Grid of All 18 Puranas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredPuranas.map((purana) => (
              <div
                key={purana.id}
                onClick={() => handleOpenPurana(purana)}
                className="glass-gold p-4 rounded-2xl border border-amber-500/20 hover:border-amber-400 cursor-pointer transition-all group flex flex-col justify-between shadow-gold-sm"
              >
                <div>
                  <div className="flex justify-between items-start mb-1">
                    <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-500/15 border border-amber-500/30 text-amber-300 uppercase">
                      {purana.category}
                    </span>
                    <span className="text-[10px] font-mono text-zinc-400">
                      {purana.shlokasCount} {labels.shlokaCountLabel}
                    </span>
                  </div>

                  <h4 className="font-display text-sm font-bold text-white group-hover:text-amber-200 mt-1">
                    {purana.sanskritName}
                  </h4>
                  <p className="text-[11px] font-mono text-amber-400/90 mt-0.5">
                    {labels.deityLabel} {purana.deity}
                  </p>
                  <p className="text-xs text-zinc-300 font-devanagari mt-1.5 line-clamp-2 leading-relaxed">
                    {purana.summary}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[10px] font-mono text-amber-400">
                  <span>{labels.puranaDetails}</span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Deep Scripture Reader Modal */}
      <ScriptureReaderModal
        scripture={activeDeepScripture}
        isOpen={!!activeDeepScripture}
        onClose={() => setActiveDeepScripture(null)}
        lang={lang}
      />

      {/* Purana Detail Modal */}
      <PuranaDetailModal
        purana={activePurana}
        isOpen={!!activePurana}
        onClose={() => setActivePurana(null)}
        lang={lang}
      />

      {/* Knowledge Detail Modal (Darshan, Rishis, Samskaras, Festivals, Itihas) */}
      <KnowledgeDetailModal
        categoryKey={activeCategoryModal}
        isOpen={!!activeCategoryModal}
        onClose={() => setActiveCategoryModal(null)}
        lang={lang}
      />

      {/* Article Reader Modal */}
      <ArticleReaderModal
        article={activeArticle}
        isOpen={!!activeArticle}
        onClose={() => setActiveArticle(null)}
        lang={lang}
      />
    </div>
  );
};
