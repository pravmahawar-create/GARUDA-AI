import React, { useState, useEffect } from 'react';
import { X, ArrowLeft, BookOpen, Sparkles, ChevronRight } from 'lucide-react';
import {
  DARSHANA_DATA, RISHI_PARAMPARA_DATA,
  SAMSKARA_DATA, FESTIVALS_DATA, ITIHAS_DATA
} from '../data/knowledgeHubData';
import type { Language, DarshanItem, RishiItem, ItihasItem } from '../types';
import { playTempleBell, triggerHaptic } from '../services/audioService';
import { pushBackHandler } from '../services/modalBackHandler';

export type KnowledgeCategoryKey = 'darshan' | 'rishis' | 'samskaras' | 'festivals' | 'itihas';

interface KnowledgeDetailModalProps {
  categoryKey: KnowledgeCategoryKey | null;
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
}

export const KnowledgeDetailModal: React.FC<KnowledgeDetailModalProps> = ({
  categoryKey,
  isOpen,
  onClose,
  lang: _lang
}) => {
  const [activeDarshan, setActiveDarshan] = useState<DarshanItem | null>(null);
  const [activeRishi, setActiveRishi] = useState<RishiItem | null>(null);
  const [activeItihas, setActiveItihas] = useState<ItihasItem | null>(null);
  const [samskaraStageFilter, setSamskaraStageFilter] = useState<string>('all');

  useEffect(() => {
    if (!isOpen) return;
    return pushBackHandler(() => {
      if (activeDarshan) {
        setActiveDarshan(null);
      } else if (activeRishi) {
        setActiveRishi(null);
      } else if (activeItihas) {
        setActiveItihas(null);
      } else {
        onClose();
      }
    });
  }, [isOpen, activeDarshan, activeRishi, activeItihas, onClose]);

  if (!isOpen || !categoryKey) return null;

  const getTitle = () => {
    switch (categoryKey) {
      case 'darshan':
        return {
          hi: 'षड् दर्शन • भारतीय तत्वज्ञान',
          en: '6 Schools of Hindu Philosophy',
          sub: 'सांख्य, योग, न्याय, वैशेषिक, पूर्व मीमांसा एवं वेदान्त'
        };
      case 'rishis':
        return {
          hi: 'ऋषि एवं मुनि परंपरा',
          en: 'Saptarshi & Vedic Sages',
          sub: 'सप्तर्षि, मन्त्रद्रष्टा महर्षि एवं अनादि गुरुकुल चेतना'
        };
      case 'samskaras':
        return {
          hi: 'षोडश संस्कार (१६ संस्कार)',
          en: '16 Vedic Life Samskaras',
          sub: 'गर्भाधान से अन्त्येष्टि तक जीवन की पावन आध्यात्मिक यात्रा'
        };
      case 'festivals':
        return {
          hi: 'सनातन पर्व, व्रत एवं उत्सव',
          en: 'Sacred Festivals & Vratas',
          sub: 'महाशिवरात्रि, नवरात्रि, दीपावली, संक्रांति व पवित्र तिथियां'
        };
      case 'itihas':
        return {
          hi: 'सनातन इतिहास — रामायण एवं महाभारत',
          en: 'Sanatan Epics & Itihas',
          sub: 'वाल्मीकि रामायण (मर्यादा) व व्यास महाभारत (धर्म-युद्ध)'
        };
    }
  };

  const title = getTitle();

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col safe-top-padding animate-in fade-in duration-200">
      {/* Top Header */}
      <header className="px-4 py-3 border-b border-amber-500/25 glass-gold flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="w-9 h-9 rounded-full bg-black/50 border border-amber-500/30 text-amber-300 flex items-center justify-center hover:bg-amber-500/20 active:scale-95 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <span className="text-[9px] font-mono text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded-full border border-amber-500/30 uppercase font-bold">
              सनातन ज्ञान सागर • Knowledge Hub
            </span>
            <h3 className="font-display text-base md:text-lg font-bold text-white leading-tight">
              {title.hi}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              playTempleBell();
              triggerHaptic('medium');
            }}
            className="w-8 h-8 rounded-full bg-black/40 border border-amber-500/30 text-amber-300 flex items-center justify-center hover:border-amber-400"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
          </button>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/40 border border-amber-500/30 text-zinc-400 hover:text-white flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Sub-header Banner */}
      <div className="px-4 py-2 bg-gradient-to-r from-amber-950/40 via-black to-amber-950/40 border-b border-amber-500/15">
        <p className="text-xs text-amber-200 font-devanagari">
          {title.sub}
        </p>
      </div>

      {/* Scrollable Content Viewport */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 max-w-2xl mx-auto w-full pb-20">
        {/* 1. DARSHANA SECTION */}
        {categoryKey === 'darshan' && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-amber-950/30 border border-amber-500/20 text-xs text-zinc-300 leading-relaxed font-devanagari">
              सनातन परंपरा में 'दर्शन' केवल बौद्धिक तर्क नहीं, बल्कि परमसत्य का प्रत्यक्ष साक्षात्कार (दृष्टि) है। ये ६ आस्तिक दर्शन वेदों की प्रामाणिकता को स्वीकार करते हैं।
            </div>

            <div className="grid grid-cols-1 gap-3.5">
              {DARSHANA_DATA.map((darshan) => (
                <div
                  key={darshan.id}
                  onClick={() => {
                    triggerHaptic('light');
                    setActiveDarshan(activeDarshan?.id === darshan.id ? null : darshan);
                  }}
                  className="glass-gold p-4 rounded-2xl border border-amber-500/25 hover:border-amber-400 cursor-pointer transition-all group shadow-gold-sm"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-400" />
                        <h4 className="font-display text-base font-bold text-white group-hover:text-amber-200">
                          {darshan.nameHindi} ({darshan.nameEnglish})
                        </h4>
                      </div>
                      <p className="text-xs text-amber-400 font-mono mt-1">
                        प्रवर्तक: {darshan.founder} • मूल ग्रंथ: {darshan.centralText}
                      </p>
                    </div>
                    <span className="text-xs font-mono text-amber-300 px-2 py-0.5 rounded-full bg-black/50 border border-amber-500/20">
                      {darshan.tagline}
                    </span>
                  </div>

                  <p className="text-xs text-zinc-300 font-devanagari mt-2.5 leading-relaxed">
                    {darshan.summary}
                  </p>

                  {/* Expanded Principle */}
                  {activeDarshan?.id === darshan.id && (
                    <div className="mt-3 p-3 rounded-xl bg-black/60 border border-amber-500/30 animate-in fade-in duration-200">
                      <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider block font-bold">
                        मूल सूत्र / महासिद्धांत:
                      </span>
                      <p className="font-shloka text-amber-200 text-sm font-bold mt-1 leading-relaxed">
                        {darshan.keyPrinciple}
                      </p>
                    </div>
                  )}

                  <div className="mt-2.5 pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[11px] font-mono text-amber-400">
                    <span>{activeDarshan?.id === darshan.id ? 'संक्षेप करें ▲' : 'मूल सूत्र देखें ▼'}</span>
                    <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 2. RISHI PARAMPARA SECTION */}
        {categoryKey === 'rishis' && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-amber-950/30 border border-amber-500/20 text-xs text-zinc-300 leading-relaxed font-devanagari">
              ऋषि मन्त्रों के रचयिता नहीं, अपितु मन्त्रों के 'द्रष्टा' हैं — "ऋषयो मन्त्रद्रष्टारः"। जिन्होंने समाधि की गहराइयों में ब्रह्मांडीय ऋत और सत्य का साक्षात्कार किया।
            </div>

            <div className="grid grid-cols-1 gap-3.5">
              {RISHI_PARAMPARA_DATA.map((rishi) => (
                <div
                  key={rishi.id}
                  onClick={() => {
                    triggerHaptic('light');
                    setActiveRishi(activeRishi?.id === rishi.id ? null : rishi);
                  }}
                  className="glass-gold p-4 rounded-2xl border border-amber-500/25 hover:border-amber-400 cursor-pointer transition-all group shadow-gold-sm"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-display text-base font-bold text-white group-hover:text-amber-200">
                        {rishi.nameHindi}
                      </h4>
                      <p className="text-xs text-amber-400 font-mono mt-0.5">
                        {rishi.title}
                      </p>
                    </div>
                    <span className="text-[10px] font-mono text-zinc-400 px-2.5 py-1 rounded-full bg-black/60 border border-amber-500/20">
                      {rishi.gotraLineage}
                    </span>
                  </div>

                  <div className="mt-2 p-3 rounded-xl bg-black/50 border border-amber-500/15">
                    <span className="text-[10px] font-mono text-amber-300 font-bold block">
                      वैदिक योगदान:
                    </span>
                    <p className="text-xs text-zinc-300 font-devanagari mt-0.5 leading-relaxed">
                      {rishi.vedicContribution}
                    </p>
                  </div>

                  {activeRishi?.id === rishi.id && (
                    <div className="mt-2.5 p-3 rounded-xl bg-amber-950/40 border border-amber-500/30 animate-in fade-in duration-200">
                      <span className="text-[10px] font-mono text-amber-400 uppercase font-bold block">
                        जीवन प्रेरणा व संदेश:
                      </span>
                      <p className="text-xs text-amber-100 font-devanagari mt-0.5 leading-relaxed">
                        {rishi.lifeLesson}
                      </p>
                    </div>
                  )}

                  <div className="mt-2.5 pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[11px] font-mono text-amber-400">
                    <span>{activeRishi?.id === rishi.id ? 'संक्षेप करें ▲' : 'जीवन संदेश खोलें ▼'}</span>
                    <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. SAMSKARAS SECTION */}
        {categoryKey === 'samskaras' && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-amber-950/30 border border-amber-500/20 text-xs text-zinc-300 leading-relaxed font-devanagari">
              संस्कार मनुष्य के अंतःकरण को शुद्ध, परिमार्जित और दिव्य बनाते हैं। १६ संस्कार जीवन के प्रत्येक महत्वपूर्ण मोड़ पर चेतना को जाग्रत रखने का वैदिक विज्ञान हैं।
            </div>

            {/* Filter Pills */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {[
                { id: 'all', label: 'सभी १६ संस्कार' },
                { id: 'early', label: 'शैशव व बाल्यकाल' },
                { id: 'study', label: 'शिक्षा व गुरुकुल' },
                { id: 'life', label: 'गृहस्थ व अंतिम' }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => {
                    triggerHaptic('light');
                    setSamskaraStageFilter(f.id);
                  }}
                  className={`px-3 py-1 rounded-full text-xs font-mono font-semibold whitespace-nowrap transition-all ${
                    samskaraStageFilter === f.id
                      ? 'bg-amber-500 text-black font-bold shadow-gold-sm'
                      : 'bg-black/50 border border-amber-500/20 text-zinc-300'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-3">
              {SAMSKARA_DATA.map((samskara) => (
                <div
                  key={samskara.number}
                  className="glass-gold p-4 rounded-2xl border border-amber-500/20 hover:border-amber-400 transition-all shadow-gold-sm flex gap-3.5 items-start"
                >
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono font-bold flex items-center justify-center flex-shrink-0 text-sm">
                    {samskara.number}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h4 className="font-display text-sm font-bold text-white">
                        {samskara.nameHindi}
                      </h4>
                      <span className="text-[10px] font-mono text-amber-400/90 px-2 py-0.5 rounded bg-black/40 border border-amber-500/20">
                        {samskara.stage}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-300 font-devanagari mt-1 leading-relaxed">
                      {samskara.purpose}
                    </p>
                    <div className="mt-2 text-[10.5px] font-devanagari text-amber-200/90 bg-black/40 p-2 rounded-lg border border-amber-500/10">
                      <span className="font-bold text-amber-400">महत्व: </span>
                      {samskara.mantraOrSignificance}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. FESTIVALS SECTION */}
        {categoryKey === 'festivals' && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-amber-950/30 border border-amber-500/20 text-xs text-zinc-300 leading-relaxed font-devanagari">
              सनातन पर्व केवल उल्लास नहीं, बल्कि प्रकृति, ऋतु-परिवर्तन, खगोलीय स्थिति और आत्म-साधना के दिव्य संगम हैं।
            </div>

            <div className="grid grid-cols-1 gap-3.5">
              {FESTIVALS_DATA.map((fest) => (
                <div
                  key={fest.id}
                  className="glass-gold p-4 rounded-2xl border border-amber-500/25 shadow-gold-sm space-y-2.5"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-display text-base font-bold text-white">
                        {fest.nameHindi}
                      </h4>
                      <span className="text-xs font-mono text-amber-400">
                        {fest.tithiHindi} • {fest.season}
                      </span>
                    </div>
                    <span className="text-xl">🪔</span>
                  </div>

                  <p className="text-xs text-zinc-300 font-devanagari leading-relaxed">
                    {fest.spiritualSignificance}
                  </p>

                  <div className="p-2.5 rounded-xl bg-black/50 border border-amber-500/15">
                    <span className="text-[10px] font-mono text-amber-400 uppercase font-bold block mb-1">
                      प्रमुख अनुष्ठान एवं परंपरा:
                    </span>
                    <div className="grid grid-cols-2 gap-1.5">
                      {fest.rituals.map((r, i) => (
                        <span key={i} className="text-[11px] font-devanagari text-zinc-300 flex items-center gap-1">
                          <span className="text-amber-400">•</span>
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. ITIHAS SECTION */}
        {categoryKey === 'itihas' && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-amber-950/30 border border-amber-500/20 text-xs text-zinc-300 leading-relaxed font-devanagari">
              'इतिहास' का अर्थ है — "इति ह आस" (ऐसा निश्चित ही हुआ था)। वाल्मीकि रामायण और व्यास महाभारत सत्य घटना पर आधारित सनातन धर्म के अमर जीवन ग्रंथ हैं।
            </div>

            <div className="grid grid-cols-1 gap-4">
              {ITIHAS_DATA.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    triggerHaptic('light');
                    setActiveItihas(activeItihas?.id === item.id ? null : item);
                  }}
                  className="glass-gold p-4 rounded-2xl border border-amber-500/25 hover:border-amber-400 cursor-pointer transition-all group shadow-gold-sm"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-display text-base font-bold text-white group-hover:text-amber-200">
                        {item.titleHindi}
                      </h4>
                      <p className="text-xs text-amber-400 font-mono mt-0.5">
                        रचयिता: {item.author} • {item.scope}
                      </p>
                    </div>
                    <BookOpen className="w-5 h-5 text-amber-400 group-hover:rotate-12 transition-transform" />
                  </div>

                  <div className="mt-2.5 p-3 rounded-xl bg-black/50 border border-amber-500/15">
                    <span className="text-[10px] font-mono text-amber-400 font-bold block">
                      मूल संदेश (Core Teaching):
                    </span>
                    <p className="text-xs text-amber-100 font-devanagari mt-0.5 leading-relaxed font-semibold">
                      {item.coreMessage}
                    </p>
                  </div>

                  {activeItihas?.id === item.id && (
                    <div className="mt-3 space-y-2 animate-in fade-in duration-200">
                      <span className="text-[10px] font-mono text-amber-400 uppercase font-bold block">
                        काण्ड / पर्व विवरण:
                      </span>
                      {item.keySections.map((sec, idx) => (
                        <div key={idx} className="p-2.5 rounded-xl bg-black/60 border border-amber-500/20 text-xs">
                          <span className="font-bold text-amber-300 font-display block">
                            {sec.title}
                          </span>
                          <span className="text-zinc-300 font-devanagari mt-0.5 block">
                            {sec.desc}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-2.5 pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[11px] font-mono text-amber-400">
                    <span>{activeItihas?.id === item.id ? 'संक्षेप करें ▲' : 'समस्त काण्ड/पर्व देखें ▼'}</span>
                    <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
