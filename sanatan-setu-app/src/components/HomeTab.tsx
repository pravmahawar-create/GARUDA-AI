import React, { useState } from 'react';
import {
  Sparkles, Play, Pause, Radio, Eye, ChevronRight,
  ShieldCheck, Volume2, Flame, Compass, Disc3,
  SlidersHorizontal, BookOpen, Clock, Calendar,
  ArrowRight
} from 'lucide-react';
import {
  getTodayPanchang, CLIENT_FOUNDATION_INFO, MANTRAS_PLAYLIST,
  VEDAS_DATA, PURANAS_LIST, TEMPLES_DATA, DEEP_SCRIPTURES_DATA,
  ARTICLES_DATA
} from '../data/mockData';
import { CONTENT_CATEGORIES } from '../data/contentCategories';
import { KNOWLEDGE_HUB_CATEGORIES } from '../data/knowledgeHubData';
import { getLabels, getCategoryTitle } from '../data/languages';
import type { TabType } from './BottomNav';
import type { DeepScripture, Purana, Language, Article } from '../types';
import { devotionalPlayer, playTempleBell, triggerHaptic } from '../services/audioService';
import { ScriptureReaderModal } from './ScriptureReaderModal';
import { PuranaDetailModal } from './PuranaDetailModal';
import { ArticleReaderModal } from './ArticleReaderModal';
import { DiscourseModal } from './DiscourseModal';
import { PanchangModal } from './PanchangModal';

interface HomeTabProps {
  onNavigateTab: (tab: TabType) => void;
  onOpenLogoModal: () => void;
  onOpenAstroModal: () => void;
  onOpenSettings: () => void;
  lang: Language;
  userPreferences: string[];
}

export const HomeTab: React.FC<HomeTabProps> = ({
  onNavigateTab,
  onOpenLogoModal,
  onOpenAstroModal,
  onOpenSettings,
  lang,
  userPreferences
}) => {
  const labels = getLabels(lang);
  const panchang = getTodayPanchang();
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(devotionalPlayer.currentTrackId);
  const [isPlaying, setIsPlaying] = useState<boolean>(devotionalPlayer.isPlaying);

  // Modals state
  const [activeDeepScripture, setActiveDeepScripture] = useState<DeepScripture | null>(null);
  const [activePurana, setActivePurana] = useState<Purana | null>(null);
  const [activeArticle, setActiveArticle] = useState<Article | null>(null);
  const [showDiscourseModal, setShowDiscourseModal] = useState<boolean>(false);
  const [showPanchangModal, setShowPanchangModal] = useState<boolean>(false);

  const [activeFilter, setActiveFilter] = useState<string>(
    userPreferences.length > 0 ? userPreferences[0] : 'all'
  );

  React.useEffect(() => {
    const unsub = devotionalPlayer.subscribe(() => {
      setPlayingTrackId(devotionalPlayer.currentTrackId);
      setIsPlaying(devotionalPlayer.isPlaying);
    });
    return unsub;
  }, []);

  const handlePlayTrack = (trackId: string, audioUrl: string) => {
    triggerHaptic('medium');
    playTempleBell();
    devotionalPlayer.playTrack(audioUrl, trackId);
  };

  const handleOpenVedaReader = (vedaId: string) => {
    triggerHaptic('light');
    playTempleBell();
    const deep = DEEP_SCRIPTURES_DATA[vedaId] || DEEP_SCRIPTURES_DATA.rigveda;
    setActiveDeepScripture(deep);
  };

  const handleOpenPurana = (purana: Purana) => {
    triggerHaptic('light');
    playTempleBell();
    setActivePurana(purana);
  };

  const handleOpenArticle = (art: Article) => {
    triggerHaptic('light');
    playTempleBell();
    setActiveArticle(art);
  };

  // User-selected categories mapped to objects
  const userSelectedCategories = CONTENT_CATEGORIES.filter(c =>
    userPreferences.includes(c.id)
  );

  // Topic filtering helpers — only show sections for selected categories
  const hasPreference = (...ids: string[]) => ids.some(id => userPreferences.includes(id));
  const showMantras = hasPreference('mantras_stotras');
  const showBhakti = hasPreference('aarti_bhajan', 'katha_pravachan');
  const showTemples = hasPreference('teerth_mandir');
  const showVedas = hasPreference('vedas_upanishads', 'puranas_itihas');
  const showArticles = hasPreference('sanatan_knowledge', 'darshan_adhyatma', 'rishi_parampara', 'sanskriti_parampara', 'parv_utsav', 'dhyan_sadhana');

  // Time-aware spiritual greeting — fully language-aware via labels
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 4 && hour < 12) return { text: labels.greetingMorning, sub: labels.greetingMorningSub };
    if (hour >= 12 && hour < 17) return { text: labels.greetingAfternoon, sub: labels.greetingAfternoonSub };
    if (hour >= 17 && hour < 21) return { text: labels.greetingEvening, sub: labels.greetingEveningSub };
    return { text: labels.greetingNight, sub: labels.greetingNightSub };
  };

  const greeting = getGreeting();
  const featuredMantra = MANTRAS_PLAYLIST[0];

  return (
    <div className="space-y-6 safe-tab-viewport pb-16">
      {/* ========================================================================= */}
      {/* 0. TOP DISCOVERY GREETING & TITHI BAR */}
      {/* ========================================================================= */}
      <div className="flex justify-between items-end pt-1 px-1">
        <div>
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-amber-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{greeting.sub}</span>
          </div>
          <h2 className="font-display text-xl md:text-2xl font-bold text-white tracking-wide leading-tight">
            {greeting.text}, {labels.sadhak}
          </h2>
        </div>

        {/* Subtle Vedic Tithi Pill - Clicking opens PanchangModal */}
        <button
          onClick={() => {
            triggerHaptic('light');
            setShowPanchangModal(true);
          }}
          className="px-3 py-1.5 rounded-full bg-black/60 border border-amber-500/30 text-right backdrop-blur-md shadow-gold-sm hover:border-amber-400 transition-all active:scale-95"
        >
          <p className="text-[10px] font-mono text-amber-300 font-bold leading-tight flex items-center justify-end gap-1">
            <span>{panchang.paksha} • {panchang.tithi}</span>
            <Calendar className="w-3 h-3 text-amber-400" />
          </p>
          <p className="text-[8.5px] font-mono text-zinc-400 mt-0.5">
            {panchang.samvat}
          </p>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TIER 1: CINEMATIC HERO SPOTLIGHT */}
      {/* ========================================================================= */}
      <div className="relative rounded-3xl overflow-hidden border border-amber-500/30 p-5 md:p-6 shadow-gold-md bg-gradient-to-t from-black via-black/80 to-transparent">
        <div className="absolute inset-0 z-0">
          <img
            src="/assets/Screenshot 2026-09-16 120635.png"
            alt="Sunrise at Holy Ganga"
            className="w-full h-full object-cover object-center brightness-60 scale-105 transition-transform duration-700 hover:scale-100"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#07090E] via-[#07090E]/80 to-black/35" />
        </div>

        <div className="relative z-10 space-y-3.5">
          {/* Spotlight Badge */}
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-950/90 border border-amber-500/50 text-amber-300 text-xs font-mono tracking-wider shadow-gold-sm uppercase font-bold">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>{labels.featuredBadge}</span>
            </span>
            <span className="text-xs font-mono text-amber-300 font-semibold">
              Kashi Vishwanath
            </span>
          </div>

          {/* Title & Motto */}
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-white tracking-wide leading-tight">
              {labels.heroTitle}
            </h1>
            <p className="text-sm text-amber-100 font-devanagari mt-1.5 leading-relaxed">
              {CLIENT_FOUNDATION_INFO.motto}
            </p>
          </div>

          {/* Aaj Ka Shloka Card inside Hero */}
          <div className="p-4 rounded-2xl bg-black/70 border border-amber-500/30 space-y-2 backdrop-blur-md">
            <div className="flex justify-between items-center text-xs">
              <span className="text-xs font-mono text-amber-400 uppercase tracking-wider font-bold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>{labels.todayShloka}</span>
              </span>
              <button
                onClick={() => playTempleBell()}
                className="text-xs font-mono text-amber-300 flex items-center gap-1 hover:underline active:scale-95"
              >
                <Volume2 className="w-4 h-4 text-amber-400" />
                <span>{labels.listen}</span>
              </button>
            </div>
            <p className="font-shloka text-amber-100 text-base md:text-lg font-bold leading-relaxed whitespace-pre-line">
              {panchang.shlokaOfDay.sanskrit}
            </p>
            <p className="text-sm font-devanagari text-zinc-200 leading-relaxed pt-1">
              {labels.meaningLabel} {panchang.shlokaOfDay.meaning}
            </p>
          </div>

          {/* Direct Hero CTA Buttons */}
          <div className="flex items-center gap-2.5 pt-1">
            <button
              onClick={() => onNavigateTab('bhakti')}
              className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 text-black font-bold text-sm tracking-wider uppercase flex items-center justify-center gap-2 shadow-gold-md hover:brightness-110 active:scale-98 transition-all"
            >
              <Play className="w-4 h-4 fill-black stroke-black" />
              <span>{labels.listenNow}</span>
            </button>
            <button
              onClick={() => onNavigateTab('temples')}
              className="px-6 py-3.5 rounded-2xl bg-black/70 border border-amber-500/40 text-amber-300 font-bold text-sm tracking-wider uppercase flex items-center justify-center gap-1.5 hover:bg-amber-500/10 active:scale-98 transition-all"
            >
              <Radio className="w-4 h-4 text-amber-400" />
              <span>{labels.liveDarshan}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TIER 2: CONTINUE / NITYA SADHANA — only if mantras_stotras selected */}
      {/* ========================================================================= */}
      {showMantras && (
      <div className="glass-gold p-4 rounded-2xl border border-amber-500/25 flex items-center justify-between shadow-gold-sm">
        <div className="flex items-center gap-3">
          <div className="relative w-13 h-13 rounded-xl overflow-hidden border border-amber-500/40 flex-shrink-0 bg-black">
            <img
              src={featuredMantra.artwork}
              alt={featuredMantra.title}
              className="w-full h-full object-cover"
            />
            <button
              onClick={() => handlePlayTrack(featuredMantra.id, featuredMantra.audioUrl)}
              className="absolute inset-0 bg-black/40 flex items-center justify-center text-amber-300 hover:text-white"
            >
              {isPlaying && playingTrackId === featuredMantra.id ? (
                <Pause className="w-5 h-5 fill-amber-300" />
              ) : (
                <Play className="w-5 h-5 fill-amber-300 ml-0.5" />
              )}
            </button>
          </div>
          <div>
            <span className="text-xs font-mono text-amber-400 uppercase tracking-wider font-bold block">
              {labels.dailyJapa}
            </span>
            <h4 className="font-display text-sm md:text-base font-bold text-white leading-tight">
              {featuredMantra.sanskritTitle}
            </h4>
            <span className="text-xs font-mono text-zinc-300 block mt-0.5">
              {labels.repeats108} • {featuredMantra.durationFormatted} • {featuredMantra.artist}
            </span>
          </div>
        </div>

        <button
          onClick={() => onNavigateTab('japa')}
          className="px-3.5 py-2.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-sm font-mono font-bold hover:bg-amber-500/30 flex items-center gap-1 active:scale-95 transition-all"
        >
          <Disc3 className="w-4 h-4" />
          <span>{labels.mala108}</span>
        </button>
      </div>
      )}

      {/* ========================================================================= */}
      {/* TIER 3: "SANATAN KA VISHAL GYAN" — LARGE KNOWLEDGE HUB ENTRY */}
      {/* ========================================================================= */}
      <div
        onClick={() => {
          triggerHaptic('medium');
          playTempleBell();
          onNavigateTab('knowledge');
        }}
        className="relative rounded-3xl overflow-hidden border border-amber-500/40 p-5 shadow-gold-md cursor-pointer group bg-gradient-to-r from-amber-950/80 via-black to-amber-950/60 transition-all hover:border-amber-400 active:scale-98"
      >
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-start justify-between relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-xs font-mono text-amber-300 font-bold uppercase tracking-wider">
                {labels.knowledgeHubTitle}
              </span>
            </div>

            <h3 className="font-display text-xl md:text-2xl font-bold text-white group-hover:text-amber-200 transition-colors">
              {labels.knowledgeHubDesc}
            </h3>
            <p className="text-sm text-amber-100 font-devanagari mt-1.5 leading-relaxed max-w-sm">
              {labels.knowledgeSub}
            </p>

            <div className="flex flex-wrap gap-2 mt-3.5">
              <span className="text-xs font-mono text-amber-300 px-3 py-1 rounded-full bg-black/60 border border-amber-500/30 font-semibold">
                {labels.pillars11}
              </span>
              <span className="text-xs font-mono text-amber-300 px-3 py-1 rounded-full bg-black/60 border border-amber-500/30 font-semibold">
                {labels.mantras20k}
              </span>
              <span className="text-xs font-mono text-amber-300 px-3 py-1 rounded-full bg-black/60 border border-amber-500/30 font-semibold">
                {labels.puranas18}
              </span>
            </div>
          </div>

          <div className="w-13 h-13 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 flex-shrink-0 group-hover:scale-110 transition-transform">
            <BookOpen className="w-6 h-6 text-amber-400" />
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-amber-500/20 flex items-center justify-between text-sm font-mono text-amber-300 font-bold">
          <span>{labels.openOcean}</span>
          <div className="flex items-center gap-1.5">
            <span>{labels.enter}</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TIER 4: KNOWLEDGE CATEGORY HORIZONTAL RAIL */}
      {/* ========================================================================= */}
      <section className="space-y-2.5">
        <div className="flex justify-between items-center px-1">
          <div className="flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-amber-400" />
            <h3 className="font-display text-sm font-bold text-white tracking-wide">
              {labels.knowledgeCategories}
            </h3>
          </div>
          <button
            onClick={() => onNavigateTab('knowledge')}
            className="text-[11px] font-mono text-amber-400 flex items-center gap-0.5 hover:underline"
          >
            <span>{labels.viewAll11}</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        {/* Horizontal Category Rail */}
        <div className="flex items-center gap-2.5 overflow-x-auto scrollbar-none py-1 -mx-4 px-4 snap-x">
          {KNOWLEDGE_HUB_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => {
                triggerHaptic('light');
                onNavigateTab('knowledge');
              }}
              className="flex-shrink-0 snap-start px-3.5 py-2 rounded-2xl bg-black/50 border border-amber-500/25 hover:border-amber-400 transition-all flex items-center gap-2 text-left group active:scale-95 shadow-gold-sm"
            >
              <div className="w-7 h-7 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-300">
                <span className="text-xs">📜</span>
              </div>
              <div>
                <span className="text-xs font-display font-bold text-white group-hover:text-amber-300 block whitespace-nowrap">
                  {getCategoryTitle(cat.id, lang, cat.titleHindi, cat.titleEnglish)}
                </span>
                <span className="text-[9px] font-mono text-zinc-400 block whitespace-nowrap">
                  {cat.countBadge}
                </span>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Topic Filter Chips for dynamic discovery */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1 -mx-4 px-4">
        <button
          onClick={() => {
            triggerHaptic('light');
            setActiveFilter(userPreferences[0] || 'all');
          }}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
            activeFilter === (userPreferences[0] || 'all')
              ? 'bg-amber-500 text-black shadow-gold-sm font-bold'
              : 'bg-black/50 border border-amber-500/20 text-zinc-300 hover:border-amber-400'
          }`}
        >
          {labels.home}
        </button>

        {userSelectedCategories.map(cat => (
          <button
            key={cat.id}
            onClick={() => {
              triggerHaptic('light');
              setActiveFilter(cat.id);
            }}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeFilter === cat.id
                ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-black shadow-gold-sm font-bold'
                : 'bg-black/50 border border-amber-500/25 text-amber-200 hover:border-amber-400'
            }`}
          >
            <span>{getCategoryTitle(cat.id, lang, cat.titleHindi, cat.titleEnglish)}</span>
          </button>
        ))}

        <button
          onClick={onOpenSettings}
          className="px-2.5 py-1.5 rounded-full text-xs font-mono text-zinc-400 border border-zinc-700 hover:border-amber-400 whitespace-nowrap flex items-center gap-1"
        >
          <SlidersHorizontal className="w-3 h-3" />
          <span>{labels.chooseTopics}</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TIER 5: BHAKTI RAIL / LIVE DISCOURSES & KATHA — only if aarti_bhajan or katha_pravachan selected */}
      {/* ========================================================================= */}
      {showBhakti && (
      <section className="space-y-3">
        <div className="flex justify-between items-center px-1">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-amber-400 font-mono">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span>{labels.satsangLive}</span>
            </div>
            <h3 className="font-display text-base font-bold text-white tracking-wide">
              {labels.discoursesTitle}
            </h3>
          </div>
          <button
            onClick={() => {
              triggerHaptic('light');
              setShowDiscourseModal(true);
            }}
            className="text-xs text-amber-400 font-mono hover:underline flex items-center gap-0.5"
          >
            <span>{labels.kathaPrograms}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Horizontal Katha Cards Rail */}
        <div className="flex gap-3.5 overflow-x-auto snap-x scrollbar-none pb-2 pt-1 -mx-4 px-4">
          {[
            {
              id: 'katha_1',
              title: 'श्रीमद्भागवत अमृत ज्ञान यज्ञ',
              guru: 'पूज्य आचार्य श्री',
              location: 'वृन्दावन धाम',
              time: 'प्रतिदिन अपराह्न ३:०० बजे',
              image: '/assets/Screenshot 2026-09-16 120635.png'
            },
            {
              id: 'katha_2',
              title: 'श्री रामकथा एवं मानस मर्म',
              guru: 'संत प्रवर वाणी',
              location: 'अयोध्या धाम',
              time: 'प्रातः ९:०० बजे',
              image: '/assets/Screenshot 2026-09-16 120845.png'
            },
            {
              id: 'katha_3',
              title: 'शिव महापुराण पावन कथा',
              guru: 'काशी विद्वत परिषद',
              location: 'मणिकर्णिका तट, काशी',
              time: 'सायं ६:३० बजे',
              image: '/assets/Screenshot 2026-09-16 114937.png'
            }
          ].map((katha) => (
            <div
              key={katha.id}
              onClick={() => {
                triggerHaptic('light');
                setShowDiscourseModal(true);
              }}
              className="w-60 flex-shrink-0 snap-start glass-gold rounded-2xl overflow-hidden border border-amber-500/25 hover:border-amber-400 cursor-pointer transition-all group shadow-gold-sm"
            >
              <div className="relative h-28 w-full">
                <img
                  src={katha.image}
                  alt={katha.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-red-950/80 border border-red-500/40 text-red-400 text-[9px] font-mono font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  {labels.broadcast}
                </span>
              </div>
              <div className="p-3">
                <h4 className="font-display text-xs font-bold text-white group-hover:text-amber-300 truncate">
                  {katha.title}
                </h4>
                <p className="text-[10px] text-amber-300 font-mono mt-0.5 truncate">
                  {katha.guru} • {katha.location}
                </p>
                <div className="mt-2 pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[10px] font-mono text-zinc-400">
                  <span>{katha.time}</span>
                  <span className="text-amber-400 underline font-bold">{labels.join}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
      )}

      {/* ========================================================================= */}
      {/* TIER 6: MANTRA RAIL (TRENDING SACRED CHANTS) — only if mantras_stotras selected */}
      {/* ========================================================================= */}
      {showMantras && (
      <section className="space-y-3">
        <div className="flex justify-between items-center px-1">
          <div>
            <h3 className="font-display text-base font-bold text-white tracking-wide">
              {labels.trendingMantras}
            </h3>
            <p className="text-[10px] font-mono text-zinc-400">108 Chants • Divine Vibrations</p>
          </div>
          <button
            onClick={() => onNavigateTab('bhakti')}
            className="text-xs text-amber-400 font-mono hover:underline flex items-center gap-0.5"
          >
            <span>{labels.viewAll}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Horizontal Snap Rail with Cinematic Album Cards */}
        <div className="flex gap-3.5 overflow-x-auto snap-x scrollbar-none pb-2 pt-1 -mx-4 px-4">
          {MANTRAS_PLAYLIST.map((track) => {
            const isThisPlaying = isPlaying && playingTrackId === track.id;

            return (
              <div
                key={track.id}
                className="w-44 flex-shrink-0 snap-start glass-gold p-3 rounded-2xl border border-amber-500/20 hover:border-amber-500/40 transition-all flex flex-col justify-between group shadow-gold-sm"
              >
                <div className="relative w-full h-28 rounded-xl overflow-hidden mb-2.5 border border-amber-500/30">
                  <img
                    src={track.artwork}
                    alt={track.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                  <button
                    onClick={() => handlePlayTrack(track.id, track.audioUrl)}
                    className="absolute bottom-2 right-2 w-9 h-9 rounded-full bg-amber-500 text-black flex items-center justify-center shadow-gold-md hover:scale-110 active:scale-95 transition-all"
                  >
                    {isThisPlaying ? (
                      <Pause className="w-4 h-4 fill-black stroke-black" />
                    ) : (
                      <Play className="w-4 h-4 fill-black stroke-black ml-0.5" />
                    )}
                  </button>

                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/70 border border-amber-500/30 text-amber-300 text-[9px] font-mono">
                    {track.durationFormatted}
                  </span>
                </div>

                <div>
                  <h4 className="font-display text-xs font-bold text-white truncate group-hover:text-amber-300 transition-colors">
                    {track.sanskritTitle}
                  </h4>
                  <p className="text-[10px] text-zinc-400 truncate font-mono mt-0.5">
                    {track.artist}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
      )}

      {/* ========================================================================= */}
      {/* TIER 7: LIVE DARSHAN RAIL — only if teerth_mandir selected */}
      {/* ========================================================================= */}
      {showTemples && (
      <section className="space-y-3">
        <div className="flex justify-between items-center px-1">
          <div>
            <h3 className="font-display text-base font-bold text-white tracking-wide">
              {labels.liveTemples}
            </h3>
            <p className="text-[10px] font-mono text-zinc-400">Direct From Holy Sanctuaries • २४x७</p>
          </div>
          <button
            onClick={() => onNavigateTab('temples')}
            className="text-xs text-amber-400 font-mono hover:underline flex items-center gap-0.5"
          >
            <span>{labels.allTemples}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Horizontal Wide Live Stream Cards Rail */}
        <div className="flex gap-3.5 overflow-x-auto snap-x scrollbar-none pb-2 pt-1 -mx-4 px-4">
          {TEMPLES_DATA.map((temple) => (
            <div
              key={temple.id}
              onClick={() => onNavigateTab('temples')}
              className="w-64 flex-shrink-0 snap-start glass-gold rounded-2xl overflow-hidden border border-amber-500/25 hover:border-amber-400 cursor-pointer transition-all group shadow-gold-sm"
            >
              <div className="relative h-32 w-full">
                <img
                  src={temple.image}
                  alt={temple.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40" />

                <div className="absolute top-2.5 left-2.5 flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-950/80 border border-red-500/40 text-red-400 text-[9px] font-mono font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 live-indicator" />
                  <span>LIVE</span>
                </div>

                <div className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/60 text-zinc-300 text-[9px] font-mono">
                  <Eye className="w-3 h-3 text-amber-400" />
                  <span>{temple.viewersCount}</span>
                </div>

                <div className="absolute bottom-2 left-3 right-3">
                  <h4 className="font-display text-sm font-bold text-white truncate drop-shadow">
                    {temple.sanskritName}
                  </h4>
                  <p className="text-[10px] text-amber-300/90 font-mono truncate">
                    {temple.location}
                  </p>
                </div>
              </div>

              <div className="p-3 flex items-center justify-between border-t border-amber-500/15 text-xs">
                <span className="text-[10px] font-mono text-zinc-400">
                  {temple.circuitTag || labels.holySanctuaries}
                </span>
                <span className="text-amber-400 font-bold font-mono text-[11px] underline">
                  {labels.deepOffer}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
      )}

      {/* ========================================================================= */}
      {/* TIER 8: ISOLATED VEDIC ASTROLOGY PORTAL ENTRY */}
      {/* ========================================================================= */}
      <section className="space-y-3">
        <div className="flex justify-between items-center px-1">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-950/80 border border-amber-500/40 text-amber-300 font-shloka text-[11px] mb-1">
              <span>{labels.vedicBadge}</span>
            </div>
            <h3 className="font-display text-base font-bold text-white tracking-wide">
              {labels.astrologyHeading}
            </h3>
          </div>
          <button
            onClick={onOpenAstroModal}
            className="text-xs text-amber-400 font-mono hover:underline flex items-center gap-0.5"
          >
            <span>{labels.enter}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Dedicated Royal Astrology Card */}
        <div
          onClick={() => {
            triggerHaptic('medium');
            onOpenAstroModal();
          }}
          className="relative rounded-2xl p-4 bg-gradient-to-r from-amber-950/60 via-black to-amber-950/40 border border-amber-500/30 cursor-pointer group hover:border-amber-400 transition-all shadow-gold-sm"
        >
          <div className="flex items-start justify-between">
            <div className="space-y-1 max-w-[260px]">
              <span className="text-[10px] font-mono text-amber-400 font-bold uppercase tracking-wider block">
                {labels.vedicBadge}
              </span>
              <h4 className="font-display text-sm md:text-base font-bold text-white group-hover:text-amber-200">
                {labels.astrologyCardTitle}
              </h4>
              <p className="text-[11px] font-devanagari text-zinc-300 leading-relaxed pt-0.5">
                {labels.astrologyCardDesc}
              </p>
            </div>

            <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 flex-shrink-0 group-hover:scale-105 transition-transform">
              <Compass className="w-6 h-6 text-amber-400" />
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-amber-500/15 flex items-center justify-between text-xs font-mono text-amber-300">
            <span className="text-[10px] text-zinc-400">{labels.birthRequired}</span>
            <span className="font-bold underline flex items-center gap-1">
              <span>{labels.openKundli}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>

        {/* Quick Launch Cards */}
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => {
              triggerHaptic('light');
              setShowPanchangModal(true);
            }}
            className="p-2.5 rounded-2xl glass-gold border border-amber-500/30 hover:border-amber-400 flex flex-col items-center text-center group active:scale-95 transition-all shadow-gold-sm"
          >
            <span className="text-lg mb-0.5">📅</span>
            <span className="text-xs font-display font-bold text-white group-hover:text-amber-200">
              {labels.shubhMuhurat}
            </span>
            <span className="text-[8.5px] font-mono text-zinc-400 mt-0.5">
              {labels.choghadiya}
            </span>
          </button>

          <button
            onClick={() => {
              triggerHaptic('light');
              onOpenAstroModal();
            }}
            className="p-2.5 rounded-2xl glass-gold border border-amber-500/30 hover:border-amber-400 flex flex-col items-center text-center group active:scale-95 transition-all shadow-gold-sm"
          >
            <span className="text-lg mb-0.5">🧭</span>
            <span className="text-xs font-display font-bold text-white group-hover:text-amber-200">
              {labels.lagnaChakra}
            </span>
            <span className="text-[8.5px] font-mono text-zinc-400 mt-0.5">
              Diamond Chart
            </span>
          </button>

          <button
            onClick={() => {
              triggerHaptic('light');
              onOpenAstroModal();
            }}
            className="p-2.5 rounded-2xl glass-gold border border-amber-500/30 hover:border-amber-400 flex flex-col items-center text-center group active:scale-95 transition-all shadow-gold-sm"
          >
            <span className="text-lg mb-0.5">🤝</span>
            <span className="text-xs font-display font-bold text-white group-hover:text-amber-200">
              {labels.ashtakoot}
            </span>
            <span className="text-[8.5px] font-mono text-zinc-400 mt-0.5">
              Ashtakoot
            </span>
          </button>
        </div>

        {/* 12 Rashi Discs Rail */}
        <div className="flex gap-2.5 overflow-x-auto snap-x scrollbar-none pb-1 pt-1 -mx-4 px-4">
          {[
            { id: 'mesh', name: 'मेष', symbol: '♈', eng: 'Aries' },
            { id: 'vrishabh', name: 'वृषभ', symbol: '♉', eng: 'Taurus' },
            { id: 'mithun', name: 'मिथुन', symbol: '♊', eng: 'Gemini' },
            { id: 'kark', name: 'कर्क', symbol: '♋', eng: 'Cancer' },
            { id: 'sinh', name: 'सिंह', symbol: '♌', eng: 'Leo' },
            { id: 'kanya', name: 'कन्या', symbol: '♍', eng: 'Virgo' },
            { id: 'tula', name: 'तुला', symbol: '♎', eng: 'Libra' },
            { id: 'vrishchik', name: 'वृश्चिक', symbol: '♏', eng: 'Scorpio' },
            { id: 'dhanu', name: 'धनु', symbol: '♐', eng: 'Sagittarius' },
            { id: 'makar', name: 'मकर', symbol: '♑', eng: 'Capricorn' },
            { id: 'kumbh', name: 'कुम्भ', symbol: '♒', eng: 'Aquarius' },
            { id: 'meen', name: 'मीन', symbol: '♓', eng: 'Pisces' },
          ].map((r) => (
            <button
              key={r.id}
              onClick={onOpenAstroModal}
              className="w-16 flex-shrink-0 snap-start p-2 rounded-2xl glass-gold border border-amber-500/20 hover:border-amber-400 flex flex-col items-center justify-center transition-all group active:scale-95 shadow-gold-sm"
            >
              <span className="text-xl mb-0.5 group-hover:scale-110 transition-transform">{r.symbol}</span>
              <span className="font-devanagari text-[11px] font-bold text-white group-hover:text-amber-300">{r.name}</span>
            </button>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* TIER 9: TIRTH / PILGRIMAGE RAIL — only if vedas_upanishads or puranas_itihas */}
      {/* ========================================================================= */}
      {showVedas && (
      <section className="space-y-3">
        <div className="flex justify-between items-center px-1">
          <div>
            <h3 className="font-display text-base font-bold text-white tracking-wide">
              {labels.sacredVedas}
            </h3>
            <p className="text-[10px] font-mono text-zinc-400">Canonical 4-Tier Grantha Hierarchy</p>
          </div>
          <button
            onClick={() => onNavigateTab('knowledge')}
            className="text-xs text-amber-400 font-mono hover:underline flex items-center gap-0.5"
          >
            <span>{labels.grantha}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Horizontal Book Posters Rail */}
        <div className="flex gap-3 overflow-x-auto snap-x scrollbar-none pb-2 pt-1 -mx-4 px-4">
          {VEDAS_DATA.map((veda) => (
            <div
              key={veda.id}
              onClick={() => handleOpenVedaReader(veda.id)}
              className="w-36 flex-shrink-0 snap-start glass-gold p-3 rounded-2xl border border-amber-500/25 hover:border-amber-400 cursor-pointer transition-all group flex flex-col justify-between shadow-gold-sm"
            >
              <div className="w-full h-24 rounded-xl overflow-hidden mb-2 border border-amber-500/30 bg-black">
                <img
                  src={veda.image}
                  alt={veda.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              </div>
              <div>
                <span className="text-[9px] font-mono text-amber-400 block uppercase font-bold">४ वेद</span>
                <h4 className="font-display text-xs font-bold text-white truncate group-hover:text-amber-200">
                  {veda.sanskritName}
                </h4>
                <span className="text-[9px] font-mono text-zinc-400 block mt-0.5">
                  {veda.mantrasCount}
                </span>
              </div>
              <span className="mt-2 text-[9px] font-mono text-amber-300/80 underline text-center block">
                {labels.mandala} →
              </span>
            </div>
          ))}

          {PURANAS_LIST.slice(0, 6).map((purana) => (
            <div
              key={purana.id}
              onClick={() => handleOpenPurana(purana)}
              className="w-36 flex-shrink-0 snap-start glass-gold p-3 rounded-2xl border border-amber-500/20 hover:border-amber-400 cursor-pointer transition-all group flex flex-col justify-between shadow-gold-sm bg-gradient-to-b from-amber-950/20 to-black"
            >
              <div className="w-full h-24 rounded-xl mb-2 border border-amber-500/25 bg-amber-950/40 flex flex-col items-center justify-center p-2 text-center">
                <span className="text-xl mb-1">📜</span>
                <span className="text-[10px] font-mono text-amber-300 font-bold">
                  {purana.shlokasCount}
                </span>
                <span className="text-[8px] font-mono text-zinc-400 uppercase">{labels.shlokaCountLabel}</span>
              </div>
              <div>
                <span className="text-[9px] font-mono text-amber-400 block uppercase font-bold">{purana.category || 'पुराण'}</span>
                <h4 className="font-display text-xs font-bold text-white truncate group-hover:text-amber-200">
                  {purana.sanskritName}
                </h4>
                <span className="text-[9px] font-devanagari text-zinc-400 block truncate mt-0.5">
                  {labels.deityLabel} {purana.deity}
                </span>
              </div>
              <span className="mt-2 text-[9px] font-mono text-amber-300/80 underline text-center block">
                {labels.puranaDetails} →
              </span>
            </div>
          ))}
        </div>
      </section>
      )}

      {/* ========================================================================= */}
      {/* TIER 10: ARTICLES / SPIRITUAL WISDOM RAIL — only if relevant topics selected */}
      {/* ========================================================================= */}
      {showArticles && (
      <section className="space-y-3">
        <div className="flex justify-between items-center px-1">
          <div>
            <h3 className="font-display text-base font-bold text-white tracking-wide">
              {labels.articlesHeading}
            </h3>
            <p className="text-[10px] font-mono text-zinc-400">{labels.articlesSub}</p>
          </div>
          <span className="text-xs text-amber-400 font-mono">
            {ARTICLES_DATA.length} Articles
          </span>
        </div>

        <div className="space-y-3">
          {ARTICLES_DATA.map((art) => (
            <div
              key={art.id}
              onClick={() => handleOpenArticle(art)}
              className="glass-gold p-4 rounded-2xl border border-amber-500/20 hover:border-amber-400 cursor-pointer transition-all group shadow-gold-sm"
            >
              <div className="flex justify-between items-start mb-1.5">
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold bg-amber-500/15 border border-amber-500/30 text-amber-300 uppercase">
                  {art.category.replace('_', ' ')}
                </span>
                <span className="text-[10px] font-mono text-zinc-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {art.readTime} read
                </span>
              </div>

              <h4 className="font-display text-sm font-bold text-white group-hover:text-amber-200 transition-colors">
                {art.title}
              </h4>
              <p className="text-xs text-zinc-300 font-devanagari mt-1 leading-relaxed line-clamp-2">
                {art.summary}
              </p>

              <div className="mt-3 pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[11px] font-mono text-amber-400">
                <span className="italic truncate max-w-[240px] text-zinc-400">
                  {art.quote}
                </span>
                <span className="underline font-bold whitespace-nowrap ml-2">{labels.readFull}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
      )}

      {/* ========================================================================= */}
      {/* FOUNDATION TRUST & 9-PILLARS SACRED EMBLEM STRIP */}
      {/* ========================================================================= */}
      <div
        onClick={onOpenLogoModal}
        className="glass-gold p-4 rounded-2xl border border-amber-500/30 cursor-pointer hover:border-amber-400 transition-all flex items-center justify-between group shadow-gold-sm"
      >
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl overflow-hidden border border-amber-500/40 flex-shrink-0 bg-black p-1">
            <img
              src="/assets/Sanatan Setu Golden Spiritual Emblem.png"
              alt="Logo Emblem"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider font-bold">
                Regd. Trust: 191320 (Noida, U.P.)
              </span>
            </div>
            <h4 className="font-display text-xs md:text-sm font-bold text-white group-hover:text-amber-200">
              {labels.trustNinePillars}
            </h4>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-amber-400 group-hover:translate-x-1 transition-transform" />
      </div>

      {/* SUBTLE SOVEREIGN BRAND FOOTER */}
      <div className="text-center py-2">
        <p className="text-[9.5px] font-mono text-zinc-500 tracking-widest uppercase">
          SANATAN SETU • POWERED BY GARUDA & SIGIL
        </p>
      </div>

      {/* ========================================================================= */}
      {/* MODAL MOUNTS */}
      {/* ========================================================================= */}
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

      {/* Article Reader Modal */}
      <ArticleReaderModal
        article={activeArticle}
        isOpen={!!activeArticle}
        onClose={() => setActiveArticle(null)}
        lang={lang}
      />

      {/* Discourse Modal */}
      <DiscourseModal
        isOpen={showDiscourseModal}
        onClose={() => setShowDiscourseModal(false)}
        lang={lang}
      />

      {/* Panchang & Muhurat Modal */}
      <PanchangModal
        isOpen={showPanchangModal}
        onClose={() => setShowPanchangModal(false)}
        lang={lang}
        onOpenAstroModal={() => {
          setShowPanchangModal(false);
          onOpenAstroModal();
        }}
      />
    </div>
  );
};
