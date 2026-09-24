import React, { useState, useEffect } from 'react';
import { X, ArrowLeft, Sun, Moon, Sparkles, ShieldCheck, AlertCircle } from 'lucide-react';
import { getTodayPanchang } from '../data/mockData';
import { triggerHaptic } from '../services/audioService';
import { pushBackHandler } from '../services/modalBackHandler';

interface PanchangModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: string;
  onOpenAstroModal?: () => void;
}

export const PanchangModal: React.FC<PanchangModalProps> = ({
  isOpen,
  onClose,
  lang: _lang,
  onOpenAstroModal
}) => {
  const panchang = getTodayPanchang();
  const [activeTab, setActiveTab] = useState<'panchang' | 'muhurat' | 'consultation'>('panchang');

  useEffect(() => {
    if (!isOpen) return;
    return pushBackHandler(onClose);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col safe-top-padding animate-in fade-in duration-200">
      {/* Top Header */}
      <header className="px-4 py-3 border-b border-amber-500/25 glass-gold flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/50 border border-amber-500/30 text-amber-300 flex items-center justify-center hover:bg-amber-500/20 active:scale-95 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <span className="text-[9px] font-mono text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded-full border border-amber-500/30 uppercase font-bold">
              काल-गणना व मुहूर्त
            </span>
            <h3 className="font-display text-base md:text-lg font-bold text-white leading-tight">
              दैनिक पंचांग एवं शुभ मुहूर्त
            </h3>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-black/40 border border-amber-500/30 text-zinc-400 flex items-center justify-center hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>
      </header>

      {/* Segmented Switcher */}
      <div className="px-4 py-2 border-b border-amber-500/15 bg-black/60 flex items-center gap-2">
        <button
          onClick={() => {
            triggerHaptic('light');
            setActiveTab('panchang');
          }}
          className={`flex-1 py-1.5 rounded-xl text-xs font-semibold font-mono transition-all ${
            activeTab === 'panchang'
              ? 'bg-amber-500 text-black shadow-gold-sm font-bold'
              : 'bg-black/40 border border-amber-500/20 text-zinc-400'
          }`}
        >
          दैनिक पंचांग
        </button>

        <button
          onClick={() => {
            triggerHaptic('light');
            setActiveTab('muhurat');
          }}
          className={`flex-1 py-1.5 rounded-xl text-xs font-semibold font-mono transition-all ${
            activeTab === 'muhurat'
              ? 'bg-amber-500 text-black shadow-gold-sm font-bold'
              : 'bg-black/40 border border-amber-500/20 text-zinc-400'
          }`}
        >
          शुभ मुहूर्त व चौघड़िया
        </button>

        <button
          onClick={() => {
            triggerHaptic('light');
            setActiveTab('consultation');
          }}
          className={`flex-1 py-1.5 rounded-xl text-xs font-semibold font-mono transition-all ${
            activeTab === 'consultation'
              ? 'bg-amber-500 text-black shadow-gold-sm font-bold'
              : 'bg-black/40 border border-amber-500/20 text-zinc-400'
          }`}
        >
          ज्योतिष परामर्श
        </button>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-4 py-4 space-y-4 max-w-2xl mx-auto w-full safe-tab-viewport">
        {activeTab === 'panchang' && (
          <div className="space-y-4">
            {/* Truthful Astronomical Disclosure Banner */}
            <div className="p-3 rounded-2xl bg-amber-950/40 border border-amber-500/25 flex items-start gap-2.5 text-xs text-amber-200/90 font-devanagari">
              <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <span>
                सत्यनिष्ठा प्रकटीकरण: यह पंचांग सौर-चान्द्र चक्र गणना पर आधारित संदर्भ है। सटीक स्थानीय पंचांग सूर्योदय, अक्षांश व देशांतर पर निर्भर करता है।
              </span>
            </div>

            {/* Sunrise & Sunset Card */}
            <div className="p-4 rounded-3xl glass-gold border border-amber-500/30 flex items-center justify-between shadow-gold-sm">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400">
                  <Sun className="w-6 h-6 animate-spin-slow" />
                </div>
                <div>
                  <span className="text-[10px] font-mono text-zinc-400 block">सूर्योदय (Sunrise)</span>
                  <span className="font-display text-base font-bold text-white">{panchang.sunrise}</span>
                </div>
              </div>

              <div className="h-8 w-px bg-amber-500/20" />

              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-blue-500/20 border border-blue-400/40 flex items-center justify-center text-blue-300">
                  <Moon className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-mono text-zinc-400 block">सूर्यास्त (Sunset)</span>
                  <span className="font-display text-base font-bold text-white">{panchang.sunset}</span>
                </div>
              </div>
            </div>

            {/* 5 Anga of Panchang */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3.5 rounded-2xl bg-black/60 border border-amber-500/25 space-y-1">
                <span className="text-[10px] font-mono text-amber-400 uppercase font-bold">१. तिथि (Tithi)</span>
                <p className="font-display text-sm font-bold text-white">{panchang.tithi}</p>
                <p className="text-[9.5px] font-mono text-zinc-400">{panchang.paksha}</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-black/60 border border-amber-500/25 space-y-1">
                <span className="text-[10px] font-mono text-amber-400 uppercase font-bold">२. नक्षत्र (Nakshatra)</span>
                <p className="font-display text-sm font-bold text-white">{panchang.nakshatra}</p>
                <p className="text-[9.5px] font-mono text-zinc-400">शुभ व कल्याणकारी</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-black/60 border border-amber-500/25 space-y-1">
                <span className="text-[10px] font-mono text-amber-400 uppercase font-bold">३. योग (Yoga)</span>
                <p className="font-display text-sm font-bold text-white">{panchang.auspiciousYoga}</p>
                <p className="text-[9.5px] font-mono text-zinc-400">कार्य सिद्धि हेतु श्रेष्ठ</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-black/60 border border-amber-500/25 space-y-1">
                <span className="text-[10px] font-mono text-amber-400 uppercase font-bold">४. संवत्सर (Samvat)</span>
                <p className="font-display text-sm font-bold text-white">{panchang.samvat}</p>
                <p className="text-[9.5px] font-mono text-zinc-400">कालयुक्त संवत्</p>
              </div>
            </div>

            {/* Brahma Muhurta Highlight */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/60 via-black to-amber-950/40 border border-amber-500/30 space-y-1 shadow-gold-sm">
              <div className="flex items-center gap-1.5 text-amber-400 text-xs font-bold">
                <Sparkles className="w-4 h-4" />
                <span>ब्रह्म मुहूर्त साधना काल</span>
              </div>
              <p className="font-display text-lg font-bold text-white">{panchang.brahmaMuhurta}</p>
              <p className="text-[11px] font-devanagari text-zinc-300">
                प्रातःकाल ध्यान, जप और ईश्वर आराधना के लिए सर्वोत्तम समय।
              </p>
            </div>
          </div>
        )}

        {activeTab === 'muhurat' && (
          <div className="space-y-3">
            <div className="p-3.5 rounded-2xl bg-green-950/30 border border-green-500/40 space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="font-mono text-green-400 font-bold uppercase">अमृत चौघड़िया (Auspicious)</span>
                <span className="text-[10px] font-mono text-green-300">श्रेष्ठ समय</span>
              </div>
              <p className="font-display text-sm font-bold text-white">09:15 AM – 10:45 AM</p>
              <p className="text-[10px] text-zinc-300">नवीन कार्य, यात्रा, और विद्या आरंभ हेतु उत्तम।</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-950/30 border border-amber-500/40 space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="font-mono text-amber-400 font-bold uppercase">शुभ चौघड़िया</span>
                <span className="text-[10px] font-mono text-amber-300">कल्याणकारी</span>
              </div>
              <p className="font-display text-sm font-bold text-white">12:15 PM – 01:45 PM</p>
              <p className="text-[10px] text-zinc-300">धर्म-कर्म, पूजन और व्यापार हेतु शुभ।</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-red-950/30 border border-red-500/40 space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="font-mono text-red-400 font-bold uppercase">राहु काल (वर्जित समय)</span>
                <span className="text-[10px] font-mono text-red-300">त्याज्य</span>
              </div>
              <p className="font-display text-sm font-bold text-white">04:30 PM – 06:00 PM</p>
              <p className="text-[10px] text-zinc-300">इस समय में नवीन कार्य प्रारंभ न करें।</p>
            </div>
          </div>
        )}

        {activeTab === 'consultation' && (
          <div className="p-5 rounded-3xl glass-gold border border-amber-500/30 space-y-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-amber-400" />
              <h4 className="font-display text-base font-bold text-white">
                वैदिक ज्योतिषाचार्य परामर्श सेवा
              </h4>
            </div>

            <p className="text-xs text-zinc-300 font-devanagari leading-relaxed">
              सनातन सेतु के प्रामाणिक वैदिक आचार्यों द्वारा कुण्डली विश्लेषण, विवाह मिलान (३६ गुण), और ग्रह शांति अनुष्ठान का मार्गदर्शन।
            </p>

            <div className="p-3.5 rounded-2xl bg-black/60 border border-amber-500/20 space-y-2">
              <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider block font-bold">
                उपलब्ध परामर्श विषय:
              </span>
              <ul className="text-xs text-zinc-300 space-y-1 list-disc list-inside">
                <li>जन्म कुण्डली एवं महादशा विश्लेषण</li>
                <li>अष्टकूट ३६ गुण मिलान एवं मांगलिक विचार</li>
                <li>शुभ मुहूर्त (गृह प्रवेश, विवाह, नामकरण)</li>
                <li>वैदिक रत्न एवं रुद्राक्ष धारण परामर्श</li>
              </ul>
            </div>

            <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/30 text-center">
              <span className="text-[11px] font-mono text-amber-300 font-bold block">
                परामर्श बुकिंग जल्द ही शुरू हो रही है
              </span>
              <span className="text-[9.5px] font-mono text-zinc-400 block mt-0.5">
                (Verified Sanatan Astrologers Directory • Coming Soon)
              </span>
              {onOpenAstroModal && (
                <button
                  onClick={() => {
                    triggerHaptic('medium');
                    onOpenAstroModal();
                  }}
                  className="mt-3 w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-500 text-black font-bold text-xs shadow-gold-sm hover:brightness-110 active:scale-98 transition-all"
                >
                  लग्न कुण्डली चक्र एवं ३६ गुण मिलान खोलें →
                </button>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

