import React, { useState, useEffect } from 'react';
import { X, ArrowLeft, Radio, Calendar, Play, Pause, Bell, MapPin, Eye } from 'lucide-react';
import { triggerHaptic, playTempleBell } from '../services/audioService';
import { pushBackHandler } from '../services/modalBackHandler';

interface DiscourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: string;
}

interface DiscourseProgram {
  id: string;
  title: string;
  speaker: string;
  location: string;
  date: string;
  time: string;
  isLive: boolean;
  viewers?: string;
  category: 'katha' | 'pravachan' | 'bhajan_sandhya' | 'festival';
  description: string;
  banner: string;
}

const DISCOURSE_PROGRAMS: DiscourseProgram[] = [
  {
    id: 'prog-1',
    title: 'श्रीमद्भागवत कथा ज्ञान यज्ञ — सप्तम दिवस (रास पंचाध्यायी)',
    speaker: 'पूज्य संत श्री अनिरुद्धाचार्य जी महाराज',
    location: 'वृन्दावन धाम, मथुरा',
    date: 'आज लाइव',
    time: '04:00 PM – 07:30 PM',
    isLive: true,
    viewers: '24,850',
    category: 'katha',
    description: 'भगवान श्रीकृष्ण की दिव्य लीलाओं और श्रीमद्भागवत महापुराण के दशम स्कन्ध का पावन रसपान।',
    banner: '/assets/Screenshot 2026-09-16 120635.png'
  },
  {
    id: 'prog-2',
    title: 'शिव महापुराण पावन कथा — द्वादश ज्योतिर्लिंग महिमा',
    speaker: 'पं. प्रदीप मिश्रा जी (सीहोर वाले)',
    location: 'काशी विश्वनाथ मन्दिर प्रांगण, वाराणसी',
    date: 'आज लाइव',
    time: '02:00 PM – 05:30 PM',
    isLive: true,
    viewers: '38,200',
    category: 'katha',
    description: 'कलिकाल में भवसागर पार कराने वाली भगवान शिव की अमृतमयी कथा एवं पार्थिव शिवलिंग पूजन विधि।',
    banner: '/assets/Screenshot 2026-09-16 114937.png'
  },
  {
    id: 'prog-3',
    title: 'अमृतमयी संकीर्तन एवं भजन संध्या (हरि नाम संकीर्तन)',
    speaker: 'श्री विनोद अग्रवाल संकीर्तन मंडल',
    location: 'अयोध्या धाम, उत्तर प्रदेश',
    date: 'कल शाम',
    time: '06:00 PM – 09:00 PM',
    isLive: false,
    category: 'bhajan_sandhya',
    description: 'प्रभु श्रीराम और श्रीराधा-माधव के दिव्य नाम संकीर्तन की रसभरी संध्या।',
    banner: '/assets/Screenshot 2026-09-16 120802.png'
  },
  {
    id: 'prog-4',
    title: 'वेदान्त एवं उपनिषद् मीमांसा — तत्वमसि दर्शन',
    speaker: 'स्वामी चिन्मयानंद मिशन',
    location: 'ऋषिकेश, उत्तराखण्ड',
    date: 'आगामी रविवार',
    time: '10:00 AM – 12:00 PM',
    isLive: false,
    category: 'pravachan',
    description: 'माण्डूक्य एवं तैत्तिरीय उपनिषद् पर गहन दार्शनिक चिंतन और आत्मज्ञान का मार्ग।',
    banner: '/assets/Screenshot 2026-09-16 120817.png'
  }
];

export const DiscourseModal: React.FC<DiscourseModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'live' | 'upcoming'>('live');
  const [playingId, setPlayingId] = useState<string | null>('prog-1');
  const [reminders, setReminders] = useState<string[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    return pushBackHandler(onClose);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const togglePlay = (id: string) => {
    triggerHaptic('medium');
    playTempleBell();
    setPlayingId(prev => prev === id ? null : id);
  };

  const toggleReminder = (id: string) => {
    triggerHaptic('light');
    setReminders(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const filteredPrograms = DISCOURSE_PROGRAMS.filter(p =>
    activeTab === 'live' ? p.isLive : !p.isLive
  );

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
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-mono text-red-400 bg-red-950/80 px-2 py-0.5 rounded-full border border-red-500/30 uppercase font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 live-indicator" />
                <span>लाइव सत्संग व कथा</span>
              </span>
            </div>
            <h3 className="font-display text-base md:text-lg font-bold text-white leading-tight">
              धार्मिक प्रवचन एवं भजन कार्यक्रम
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

      {/* Tabs Switcher: Live Now vs Upcoming */}
      <div className="px-4 py-2 border-b border-amber-500/15 bg-black/60 flex items-center gap-2">
        <button
          onClick={() => {
            triggerHaptic('light');
            setActiveTab('live');
          }}
          className={`flex-1 py-1.5 rounded-xl text-xs font-semibold font-mono flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'live'
              ? 'bg-red-500 text-white shadow-gold-sm font-bold'
              : 'bg-black/40 border border-amber-500/20 text-zinc-400'
          }`}
        >
          <Radio className="w-3.5 h-3.5" />
          <span>लाइव प्रसारण (Live Now)</span>
        </button>

        <button
          onClick={() => {
            triggerHaptic('light');
            setActiveTab('upcoming');
          }}
          className={`flex-1 py-1.5 rounded-xl text-xs font-semibold font-mono flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'upcoming'
              ? 'bg-amber-500 text-black shadow-gold-sm font-bold'
              : 'bg-black/40 border border-amber-500/20 text-zinc-400'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>आगामी कथा व प्रवचन</span>
        </button>
      </div>

      {/* Programs List */}
      <main className="flex-1 overflow-y-auto px-4 py-4 space-y-4 max-w-2xl mx-auto w-full safe-tab-viewport">
        {filteredPrograms.map((prog) => {
          const isPlaying = playingId === prog.id;
          const hasReminder = reminders.includes(prog.id);

          return (
            <div
              key={prog.id}
              className={`p-4 rounded-3xl border transition-all glass-gold ${
                isPlaying ? 'border-amber-400 shadow-gold-md' : 'border-amber-500/25 hover:border-amber-500/40'
              }`}
            >
              {/* Program Banner */}
              <div className="relative h-36 rounded-2xl overflow-hidden mb-3 border border-amber-500/30">
                <img
                  src={prog.banner}
                  alt={prog.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

                {prog.isLive ? (
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-950/90 border border-red-500/50 text-red-400 text-[10px] font-mono font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 live-indicator" />
                    <span>प्रत्यक्ष प्रसारण • LIVE</span>
                  </div>
                ) : (
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-950/90 border border-amber-500/50 text-amber-300 text-[10px] font-mono font-bold">
                    <span>आगामी कार्यक्रम</span>
                  </div>
                )}

                {prog.viewers && (
                  <div className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/70 text-zinc-200 text-[10px] font-mono">
                    <Eye className="w-3 h-3 text-amber-400" />
                    <span>{prog.viewers} श्रोता</span>
                  </div>
                )}

                <div className="absolute bottom-2 left-3 right-3">
                  <span className="text-[10px] font-mono text-amber-300 font-bold block truncate">
                    {prog.speaker}
                  </span>
                </div>
              </div>

              {/* Title & Info */}
              <div className="space-y-1.5">
                <h4 className="font-display text-base font-bold text-white leading-tight">
                  {prog.title}
                </h4>

                <div className="flex items-center gap-2 text-[11px] font-mono text-amber-400/90">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                  <span>{prog.location}</span>
                  <span>•</span>
                  <span>{prog.time}</span>
                </div>

                <p className="font-devanagari text-xs text-zinc-300 leading-relaxed pt-1">
                  {prog.description}
                </p>
              </div>

              {/* Actions */}
              <div className="mt-3.5 pt-3 border-t border-amber-500/20 flex items-center justify-between gap-2">
                {prog.isLive ? (
                  <button
                    onClick={() => togglePlay(prog.id)}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 text-black font-bold text-xs tracking-wider uppercase flex items-center justify-center gap-2 shadow-gold-sm active:scale-98 transition-all"
                  >
                    {isPlaying ? (
                      <>
                        <Pause className="w-4 h-4 fill-black" />
                        <span>प्रसारण रोकें</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 fill-black" />
                        <span>लाइव कथा श्रवण करें</span>
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={() => toggleReminder(prog.id)}
                    className={`flex-1 py-2.5 rounded-xl border text-xs font-mono font-bold flex items-center justify-center gap-1.5 active:scale-98 transition-all ${
                      hasReminder
                        ? 'bg-amber-500 text-black border-amber-400 shadow-gold-sm'
                        : 'bg-black/50 border-amber-500/30 text-amber-300 hover:bg-amber-500/10'
                    }`}
                  >
                    <Bell className="w-3.5 h-3.5" />
                    <span>{hasReminder ? 'स्मरण निर्धारित (Reminder Set)' : 'स्मरण सेट करें'}</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </main>
    </div>
  );
};
