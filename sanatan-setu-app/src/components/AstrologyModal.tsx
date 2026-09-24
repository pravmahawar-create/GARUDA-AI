import React, { useState, useEffect } from 'react';
import { X, Sparkles, Sun, CheckCircle2, Compass, HeartHandshake, AlertCircle, Type, Hash, Hand } from 'lucide-react';
import { playTempleBell, triggerHaptic } from '../services/audioService';
import { pushBackHandler } from '../services/modalBackHandler';
import type { Language } from '../types';
import { getLabels } from '../data/languages';
import { getAstroLabels } from '../data/astroLabels';
import { KundliForm } from '../astro/components/KundliForm';
import { MilanForm } from '../astro/components/MilanForm';
import { NameMilanPanel } from '../astro/components/NameMilanPanel';
import { NumerologyPanel } from '../astro/components/NumerologyPanel';
import { PalmistryChapter } from '../astro/components/PalmistryChapter';

interface AstrologyModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
}

interface RashiInfo {
  id: string;
  nameHi: string;
  nameEn: string;
  symbol: string;
  planet: string;
  element: string;
  luckyNumber: number;
  luckyColor: string;
  predictionHi: string;
  predictionEn: string;
}

const RASHIS: RashiInfo[] = [
  {
    id: 'mesh', nameHi: 'मेष', nameEn: 'Aries', symbol: '♈', planet: 'मंगल (Mars)', element: 'अग्नि (Fire)',
    luckyNumber: 9, luckyColor: 'रक्त वर्ण (Crimson Red)',
    predictionHi: 'आज आपके पराक्रम और साहस में वृद्धि होगी। कार्यक्षेत्र में नए उत्तरदायित्व मिल सकते हैं। हनुमान चालीसा का पाठ विशेष कल्याणकारी रहेगा।',
    predictionEn: 'Courage and vitality will rise today. New leadership responsibilities await. Chanting Hanuman Chalisa brings supreme auspiciousness.'
  },
  {
    id: 'vrishabh', nameHi: 'वृषभ', nameEn: 'Taurus', symbol: '♉', planet: 'शुक्र (Venus)', element: 'पृथ्वी (Earth)',
    luckyNumber: 6, luckyColor: 'श्वेत (Pure White)',
    predictionHi: 'आर्थिक मामलों में स्थिरता और परिवार में सुखद वातावरण रहेगा। कला और आध्यात्मिक अध्ययन में मन लगेगा। माँ लक्ष्मी का ध्यान करें।',
    predictionEn: 'Financial stability and peace within family. Creative pursuits and devotional contemplation will flourish.'
  },
  {
    id: 'mithun', nameHi: 'मिथुन', nameEn: 'Gemini', symbol: '♊', planet: 'बुध (Mercury)', element: 'वायु (Air)',
    luckyNumber: 5, luckyColor: 'हरा (Emerald Green)',
    predictionHi: 'बौद्धिक कार्यों में उत्कृष्ट सफलता मिलेगी। संचार और संबंधों में मधुरता बनी रहेगी। तुलसी पत्र का अर्पण करें।',
    predictionEn: 'Intellectual brilliance and successful communications. Offering sacred Tulsi leaves yields immense merit.'
  },
  {
    id: 'kark', nameHi: 'कर्क', nameEn: 'Cancer', symbol: '♋', planet: 'चन्द्र (Moon)', element: 'जल (Water)',
    luckyNumber: 2, luckyColor: 'मोती श्वेत (Pearl Silver)',
    predictionHi: 'मानसिक शांति और अंतर्ज्ञान प्रखर रहेगा। माता-पिता का आशीर्वाद मिलेगा। भगवान शिव का जलाभिषेक लाभप्रद रहेगा।',
    predictionEn: 'Deep inner tranquility and heightened spiritual intuition. Offering water to Lord Shiva brings peace of mind.'
  },
  {
    id: 'sinh', nameHi: 'सिंह', nameEn: 'Leo', symbol: '♌', planet: 'सूर्य (Sun)', element: 'अग्नि (Fire)',
    luckyNumber: 1, luckyColor: 'स्वर्णिम पीत (Golden Amber)',
    predictionHi: 'आत्मविश्वास चरम पर रहेगा। समाज में मान-सम्मान बढ़ेगा। प्रातःकाल सूर्य देव को तांबे के लोटे से अर्घ्य दें।',
    predictionEn: 'Radiant confidence and social honor. Offering Arghya to Lord Surya in a copper vessel brings divine radiance.'
  },
  {
    id: 'kanya', nameHi: 'कन्या', nameEn: 'Virgo', symbol: '♍', planet: 'बुध (Mercury)', element: 'पृथ्वी (Earth)',
    luckyNumber: 5, luckyColor: 'हल्का हरा (Light Olive)',
    predictionHi: 'योजनाबद्ध कार्यों में सफलता मिलेगी। स्वास्थ्य उत्तम रहेगा। गणेश जी को दूर्वा अर्पित करना शुभ रहेगा।',
    predictionEn: 'Meticulous planning bears fruit. Offering sacred Durva grass to Lord Ganesha removes all obstacles.'
  },
  {
    id: 'tula', nameHi: 'तुला', nameEn: 'Libra', symbol: '♎', planet: 'शुक्र (Venus)', element: 'वायु (Air)',
    luckyNumber: 7, luckyColor: 'आसमानी (Sky Blue)',
    predictionHi: 'संतुलन और न्यायपूर्ण निर्णय का दिन है। व्यावसायिक साझेदारी में लाभ होगा। संध्याकाल में दीप प्रज्वलित करें।',
    predictionEn: 'Harmonious relationships and equitable decisions. Lighting a ghee lamp at twilight brings prosperity.'
  },
  {
    id: 'vrishchik', nameHi: 'वृश्चिक', nameEn: 'Scorpio', symbol: '♏', planet: 'मंगल (Mars)', element: 'जल (Water)',
    luckyNumber: 8, luckyColor: 'गहरा लाल (Deep Maroon)',
    predictionHi: 'गूढ़ विद्या और आध्यात्मिक अनुसंधान में रुचि बढ़ेगी। पुराने अटके कार्य पूर्ण होंगे। महामृत्युंजय मंत्र जपें।',
    predictionEn: 'Deep mystical insight and completion of pending tasks. Chanting Mahamrityunjaya Mantra gives supreme protection.'
  },
  {
    id: 'dhanu', nameHi: 'धनु', nameEn: 'Sagittarius', symbol: '♐', planet: 'बृहस्पति (Jupiter)', element: 'अग्नि (Fire)',
    luckyNumber: 3, luckyColor: 'पीला (Saffron Yellow)',
    predictionHi: 'गुरु कृपा से ज्ञान और धर्म में रुचि बढ़ेगी। तीर्थ यात्रा अथवा सत्संग का योग बन रहा है। विष्णु सहस्रनाम सुनें।',
    predictionEn: 'Wisdom flourishes through Divine Guru grace. Listening to Vishnu Sahasranamam brings serenity and blessings.'
  },
  {
    id: 'makar', nameHi: 'मकर', nameEn: 'Capricorn', symbol: '♑', planet: 'शनि (Saturn)', element: 'पृथ्वी (Earth)',
    luckyNumber: 4, luckyColor: 'नील वर्ण (Royal Indigo)',
    predictionHi: 'कड़े परिश्रम का सुखद फल मिलेगा। कर्मक्षेत्र में प्रतिष्ठा बढ़ेगी। पीपल के वृक्ष के समीप दीप प्रज्वलित करें।',
    predictionEn: 'Disciplined perseverance brings tangible rewards. Professional respect elevates significantly.'
  },
  {
    id: 'kumbh', nameHi: 'कुम्भ', nameEn: 'Aquarius', symbol: '♒', planet: 'शनि (Saturn)', element: 'वायु (Air)',
    luckyNumber: 11, luckyColor: 'नीला (Electric Cyan)',
    predictionHi: 'परोपकार और नए रचनात्मक विचारों से समाज में प्रतिष्ठा मिलेगी। मित्रों का सहयोग प्राप्त होगा। ॐ शं शनैश्चराय नमः जपें।',
    predictionEn: 'Altruism and visionary ideas attract immense goodwill. Chanting Shani Mantra brings protection and clarity.'
  },
  {
    id: 'meen', nameHi: 'मीन', nameEn: 'Pisces', symbol: '♓', planet: 'बृहस्पति (Jupiter)', element: 'जल (Water)',
    luckyNumber: 3, luckyColor: 'केसरिया (Saffron Gold)',
    predictionHi: 'आध्यात्मिक शांति और अंतर्मुखी ध्यान का योग है। अप्रत्याशित शुभ समाचार मिल सकता है। श्री हरि विष्णु का स्तवन करें।',
    predictionEn: 'Spiritual bliss and contemplative serenity. Auspicious tidings await. Meditate upon Lord Hari.'
  }
];

type AstroTab = 'horoscope' | 'kundli' | 'milan' | 'nameMilan' | 'numerology' | 'palmistry';

export const AstrologyModal: React.FC<AstrologyModalProps> = ({ isOpen, onClose, lang }) => {
  const labels = getLabels(lang);
  const astro = getAstroLabels(lang);
  const [activeTab, setActiveTab] = useState<AstroTab>('horoscope');
  const [selectedRashi, setSelectedRashi] = useState<RashiInfo>(RASHIS[0]);
  const [consultPhone, setConsultPhone] = useState('');
  const [isConsultSubmitted, setIsConsultSubmitted] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) return;
    return pushBackHandler(onClose);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSelectRashi = (rashi: RashiInfo) => {
    triggerHaptic('light');
    setSelectedRashi(rashi);
  };

  const TABS: { id: AstroTab; icon: React.ReactNode; label: string }[] = [
    { id: 'horoscope', icon: <Sun className="w-3.5 h-3.5" />, label: labels.tabRashifal },
    { id: 'kundli', icon: <Compass className="w-3.5 h-3.5" />, label: labels.tabKundli },
    { id: 'milan', icon: <HeartHandshake className="w-3.5 h-3.5" />, label: labels.ashtakoot },
    { id: 'nameMilan', icon: <Type className="w-3.5 h-3.5" />, label: astro.tabNameMilan },
    { id: 'numerology', icon: <Hash className="w-3.5 h-3.5" />, label: astro.tabNumerology },
    { id: 'palmistry', icon: <Hand className="w-3.5 h-3.5" />, label: astro.tabPalmistry },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-2.5 sm:p-4 overflow-y-auto safe-tab-viewport">
      <div className="glass-gold w-full max-w-lg rounded-3xl border border-amber-500/40 p-4 sm:p-5 my-auto max-h-[94vh] overflow-y-auto space-y-4 shadow-gold-lg">
        <div className="flex justify-between items-start border-b border-amber-500/20 pb-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-950/70 border border-amber-500/40 text-amber-300 font-shloka text-[11px] mb-1 shadow-gold-sm">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>{labels.vedicBadge}</span>
            </div>
            <h3 className="font-display text-lg sm:text-xl font-bold text-white tracking-wide">{labels.astroTitle}</h3>
            <p className="text-[11px] text-amber-200/80 font-devanagari">{labels.astroSub}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/50 border border-amber-500/30 text-amber-300 flex items-center justify-center hover:bg-amber-500/20 active:scale-95 transition-all flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 p-1 rounded-2xl bg-black/60 border border-amber-500/25 text-[10px] font-display">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                triggerHaptic('light');
                setActiveTab(t.id);
              }}
              className={`py-2 px-1 rounded-xl text-center font-bold tracking-wider transition-all flex flex-col sm:flex-row items-center justify-center gap-0.5 ${
                activeTab === t.id
                  ? 'bg-gradient-to-r from-amber-600 to-yellow-500 text-black shadow-gold-sm'
                  : 'text-zinc-400 hover:text-amber-200'
              }`}
            >
              {t.icon}
              <span className="leading-tight text-[9px] sm:text-[10px]">{t.label}</span>
            </button>
          ))}
        </div>

        {activeTab === 'horoscope' && (
          <div className="space-y-4">
            <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/25 flex items-start gap-2 text-[11px] text-amber-200/90 font-devanagari">
              <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <span>
                सत्यनिष्ठा सूचना: यह सामान्य राशि मार्गदर्शन है। जातक का व्यक्तिगत फल उसकी जन्म कुण्डली, भाव स्थिति व चल रही महादशा पर निर्भर करता है।
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-display font-semibold text-white">{labels.chooseRashi}</span>
                <span className="text-[10px] font-mono text-amber-400">{labels.twelveSigns}</span>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {RASHIS.map((rashi) => {
                  const isSelected = selectedRashi.id === rashi.id;
                  return (
                    <button
                      key={rashi.id}
                      onClick={() => handleSelectRashi(rashi)}
                      className={`p-2 rounded-xl flex flex-col items-center justify-center transition-all ${
                        isSelected
                          ? 'bg-amber-500/30 border border-amber-400 text-amber-200 shadow-gold-sm scale-105'
                          : 'bg-black/40 border border-amber-500/15 text-zinc-400 hover:text-amber-200'
                      }`}
                    >
                      <span className="text-xl leading-none mb-0.5">{rashi.symbol}</span>
                      <span className="text-xs font-devanagari font-bold">{rashi.nameHi}</span>
                      <span className="text-[9px] font-mono text-zinc-500">{rashi.nameEn}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="glass-gold p-4 rounded-2xl border border-amber-500/30 space-y-3 bg-gradient-to-br from-amber-950/30 via-black to-[#0A0D14]">
              <div className="flex items-center justify-between border-b border-amber-500/20 pb-2.5">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl p-2 rounded-xl bg-amber-500/20 border border-amber-500/30">{selectedRashi.symbol}</span>
                  <div>
                    <h4 className="font-display text-base font-bold text-amber-200">
                      {selectedRashi.nameHi} ({selectedRashi.nameEn})
                    </h4>
                    <p className="text-[10px] text-zinc-400 font-mono">
                      {labels.lordLabel} {selectedRashi.planet} • {labels.elementLabel} {selectedRashi.element}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-mono text-amber-400 block uppercase">{labels.luckyNumberLabel}</span>
                  <span className="font-mono text-base font-bold text-amber-300">{selectedRashi.luckyNumber}</span>
                </div>
              </div>
              <div>
                <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider block mb-1">{labels.cosmicGuidanceLabel}</span>
                <p className="font-devanagari text-xs text-zinc-200 leading-relaxed">
                  {lang === 'en' ? selectedRashi.predictionEn : selectedRashi.predictionHi}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-amber-500/15">
                <div className="bg-black/40 p-2 rounded-xl border border-amber-500/10">
                  <span className="text-[10px] text-zinc-400 block font-mono">{labels.luckyColorLabel}</span>
                  <span className="text-amber-300 font-semibold font-devanagari text-xs">{selectedRashi.luckyColor}</span>
                </div>
                <div className="bg-black/40 p-2 rounded-xl border border-amber-500/10">
                  <span className="text-[10px] text-zinc-400 block font-mono">{labels.ishtaDevLabel}</span>
                  <span className="text-amber-300 font-semibold font-devanagari text-xs">श्री महागणेश व शिव</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'kundli' && <KundliForm lang={lang} />}
        {activeTab === 'milan' && <MilanForm lang={lang} />}
        {activeTab === 'nameMilan' && <NameMilanPanel lang={lang} />}
        {activeTab === 'numerology' && <NumerologyPanel lang={lang} />}
        {activeTab === 'palmistry' && <PalmistryChapter lang={lang} />}

        <div className="p-3.5 rounded-2xl bg-black/60 border border-amber-500/20 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-display text-amber-200 font-semibold flex items-center gap-1.5">
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <span>{labels.consultHeading}</span>
            </span>
            <span className="text-[10px] font-mono text-amber-400">सनातन सेतु आचार्य</span>
          </div>
          {isConsultSubmitted ? (
            <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-center space-y-1">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto" />
              <p className="font-devanagari text-xs font-bold text-emerald-200">{labels.consultSuccess}</p>
              <p className="text-[10px] text-zinc-400 font-mono">
                {labels.consultSuccessSub} ({consultPhone})
              </p>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                type="tel"
                placeholder={labels.phonePlaceholder}
                value={consultPhone}
                onChange={(e) => setConsultPhone(e.target.value)}
                className="flex-1 px-3 py-1.5 rounded-xl bg-black/70 border border-amber-500/25 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-amber-400"
              />
              <button
                type="button"
                onClick={() => {
                  if (!consultPhone.trim()) return;
                  triggerHaptic('medium');
                  playTempleBell();
                  setIsConsultSubmitted(true);
                }}
                className="px-3 py-1.5 rounded-xl bg-amber-500 text-black font-bold text-xs hover:bg-amber-400 active:scale-95 transition-all"
              >
                {labels.sendConsultRequest}
              </button>
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-black/60 border border-amber-500/30 text-amber-300 font-semibold text-xs tracking-wider uppercase hover:bg-amber-500/10 active:scale-98 transition-colors"
        >
          {labels.closeReturn}
        </button>
      </div>
    </div>
  );
};
