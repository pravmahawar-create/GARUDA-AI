import React, { useState } from 'react';
import { HeartHandshake, MapPin } from 'lucide-react';
import { playTempleBell, triggerHaptic } from '../../services/audioService';
import type { Language } from '../../types';
import { searchCities, cityLabel } from '../data/cities';
import type { CityEntry } from '../data/cities';
import { computeKundli } from '../engine/kundli';
import type { KundliChart } from '../engine/kundli';
import { computeAshtakoot } from '../engine/ashtakoot';
import type { MilanResult } from '../engine/ashtakoot';
import { NAKSHATRA_NAMES_EN, NAKSHATRA_NAMES_HI, RASHI_NAMES_EN, RASHI_NAMES_HI } from '../data/nakshatraIndex';
import { getAstroLabels } from '../../data/astroLabels';
import { getLabels } from '../../data/languages';

interface Props {
  lang: Language;
}

interface PersonState {
  name: string;
  dob: string;
  tob: string;
  cityQuery: string;
  city: CityEntry | null;
}

const emptyPerson = (): PersonState => ({ name: '', dob: '', tob: '', cityQuery: '', city: null });

function PersonFields({
  person,
  onChange,
  title,
  lang,
  labels,
}: {
  person: PersonState;
  onChange: (p: PersonState) => void;
  title: string;
  lang: Language;
  labels: ReturnType<typeof getLabels> & ReturnType<typeof getAstroLabels>;
}) {
  const suggestions = searchCities(person.cityQuery, lang);
  const inputCls = 'w-full px-3 py-1.5 rounded-xl bg-black/50 border border-amber-500/25 text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400 text-xs';

  return (
    <div className="p-2.5 rounded-xl bg-black/40 border border-amber-500/15 space-y-2">
      <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider block font-bold">{title}</span>
      <div className="grid grid-cols-2 gap-2">
        <input
          type="text"
          required
          placeholder={labels.namePlaceholder}
          value={person.name}
          onChange={(e) => onChange({ ...person, name: e.target.value })}
          className={inputCls}
        />
        <input
          type="date"
          required
          value={person.dob}
          onChange={(e) => onChange({ ...person, dob: e.target.value })}
          className={inputCls}
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <input
          type="time"
          required
          value={person.tob}
          onChange={(e) => onChange({ ...person, tob: e.target.value })}
          className={inputCls}
        />
        <div className="relative">
          <input
            type="text"
            required
            placeholder={labels.cityPlaceholder}
            value={person.city ? cityLabel(person.city, lang) : person.cityQuery}
            onChange={(e) => onChange({ ...person, city: null, cityQuery: e.target.value })}
            className={inputCls}
          />
          {!person.city && suggestions.length > 0 && (
            <ul className="absolute z-20 left-0 right-0 mt-1 max-h-36 overflow-y-auto rounded-xl bg-black/95 border border-amber-500/40">
              {suggestions.map((c) => (
                <li key={`${c.n}-${c.lat}`}>
                  <button
                    type="button"
                    onClick={() => onChange({ ...person, city: c, cityQuery: '' })}
                    className="w-full text-left px-2.5 py-1.5 text-[11px] text-amber-100 hover:bg-amber-500/20 flex items-center gap-1.5"
                  >
                    <MapPin className="w-3 h-3 text-amber-400" />
                    {cityLabel(c, lang)}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export const MilanForm: React.FC<Props> = ({ lang }) => {
  const labels = { ...getLabels(lang), ...getAstroLabels(lang) };
  const [groom, setGroom] = useState<PersonState>(emptyPerson);
  const [bride, setBride] = useState<PersonState>(emptyPerson);
  const [result, setResult] = useState<{ milan: MilanResult; g: KundliChart; b: KundliChart } | null>(null);
  const [error, setError] = useState('');

  const rashiNames = lang === 'en' ? RASHI_NAMES_EN : RASHI_NAMES_HI;
  const nakNames = lang === 'en' ? NAKSHATRA_NAMES_EN : NAKSHATRA_NAMES_HI;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    triggerHaptic('heavy');
    playTempleBell();
    setError('');
    if (!groom.name.trim() || !bride.name.trim() || !groom.dob || !bride.dob || !groom.tob || !bride.tob || !groom.city || !bride.city) {
      setError(labels.kundliNeedAll);
      return;
    }
    try {
      const gChart = computeKundli({
        name: groom.name, dob: groom.dob, tob: groom.tob,
        cityLat: groom.city.lat, cityLon: groom.city.lon, utcOffsetHours: groom.city.tz,
      });
      const bChart = computeKundli({
        name: bride.name, dob: bride.dob, tob: bride.tob,
        cityLat: bride.city.lat, cityLon: bride.city.lon, utcOffsetHours: bride.city.tz,
      });
      const milan = computeAshtakoot({
        groomName: groom.name,
        groomRashi: gChart.moonRashi,
        groomNakshatra: gChart.moonNakshatra,
        groomPada: gChart.moonPada,
        brideName: bride.name,
        brideRashi: bChart.moonRashi,
        brideNakshatra: bChart.moonNakshatra,
        bridePada: bChart.moonPada,
      });
      setResult({ milan, g: gChart, b: bChart });
    } catch {
      setError(labels.kundliError);
    }
  };

  const verdictHi =
    result?.milan.verdictLevel === 'excellent'
      ? lang === 'en' ? 'Excellent Divine Match' : 'अति उत्तम दिव्य मिलान'
      : result?.milan.verdictLevel === 'good'
        ? lang === 'en' ? 'Auspicious Match' : 'शुभ वैवाहिक योग'
        : result?.milan.verdictLevel === 'average'
          ? lang === 'en' ? 'Moderate — needs guidance' : 'मध्यम — मार्गदर्शन आवश्यक'
          : lang === 'en' ? 'Requires careful matching' : 'सावधानीपूर्वक विचारणीय';

  const kootaLabel = (key: string): string => {
    const map: Record<string, string> = {
      varna: lang === 'en' ? 'Varna' : 'वर्ण',
      vashya: lang === 'en' ? 'Vashya' : 'वश्य',
      tara: lang === 'en' ? 'Tara' : 'तारा',
      yoni: lang === 'en' ? 'Yoni' : 'योनि',
      maitri: lang === 'en' ? 'Maitri' : 'ग्रहमैत्री',
      gana: lang === 'en' ? 'Gana' : 'गण',
      bhakoot: lang === 'en' ? 'Bhakoot' : 'भकूट',
      nadi: lang === 'en' ? 'Nadi' : 'नाड़ी',
    };
    return map[key] || key;
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="glass-gold p-3.5 rounded-2xl border border-amber-500/25 space-y-3 text-xs">
        <div className="flex items-center gap-1.5 text-amber-300 font-display font-semibold">
          <HeartHandshake className="w-4 h-4 text-amber-400" />
          <span>{labels.matchmakingTitle}</span>
        </div>
        <p className="text-[10px] text-zinc-400 font-devanagari">{labels.milanNeedBirth}</p>
        <PersonFields person={groom} onChange={setGroom} title={labels.groomDetails} lang={lang} labels={labels} />
        <PersonFields person={bride} onChange={setBride} title={labels.brideDetails} lang={lang} labels={labels} />
        {error && <p className="text-[10px] text-red-400 font-devanagari">{error}</p>}
        <button
          type="submit"
          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 text-black font-semibold text-xs tracking-wider uppercase shadow-gold-sm hover:brightness-110 active:scale-98 transition-all"
        >
          {labels.calculateMilan}
        </button>
      </form>

      {result && (
        <div className="glass-gold p-4 rounded-3xl border border-emerald-500/40 bg-gradient-to-br from-emerald-950/25 via-black to-black space-y-3">
          <div className="flex justify-between items-center border-b border-amber-500/20 pb-2">
            <div>
              <span className="text-[10px] font-mono text-amber-400 uppercase">{labels.totalGunaLabel}</span>
              <h4 className="font-display text-xl font-bold text-white">
                {result.milan.total} / {result.milan.max} {labels.gunaUnit}
              </h4>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400 text-emerald-300 text-xs font-bold">
              {verdictHi}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="bg-black/50 p-2 rounded-xl border border-amber-500/15">
              <span className="text-[9px] text-zinc-400 block">{labels.groomDetails}</span>
              <span className="text-amber-200 font-bold">{result.g.name}</span>
              <span className="block text-amber-100/80">
                {rashiNames[result.g.moonRashi]} • {nakNames[result.g.moonNakshatra]}
              </span>
            </div>
            <div className="bg-black/50 p-2 rounded-xl border border-amber-500/15">
              <span className="text-[9px] text-zinc-400 block">{labels.brideDetails}</span>
              <span className="text-amber-200 font-bold">{result.b.name}</span>
              <span className="block text-amber-100/80">
                {rashiNames[result.b.moonRashi]} • {nakNames[result.b.moonNakshatra]}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-1.5 text-center text-xs">
            {result.milan.kootas.map((k) => (
              <div key={k.key} className="p-1.5 rounded-lg bg-black/50 border border-amber-500/15">
                <span className="text-[9px] text-zinc-400 block font-mono leading-tight">{kootaLabel(k.key)}</span>
                <span className="text-amber-300 font-bold font-mono text-xs">{k.score}/{k.max}</span>
              </div>
            ))}
          </div>

          <div className="p-2.5 rounded-xl bg-black/60 border border-amber-500/15 text-xs space-y-1">
            <div className="flex justify-between text-zinc-300">
              <span>{labels.nadiStatus}</span>
              <span className={result.milan.nadiDosha ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold'}>
                {result.milan.nadiDosha
                  ? lang === 'en' ? 'Nadi Dosha present' : 'नाड़ी दोष'
                  : result.milan.nadiCancelled
                    ? lang === 'en' ? 'Cancelled by Paad Vedha' : 'पाद वेद से रद्द'
                    : lang === 'en' ? 'No dosha' : 'दोष मुक्त'}
              </span>
            </div>
            <div className="flex justify-between text-zinc-300">
              <span>{labels.bhakootStatus}</span>
              <span className={result.milan.bhakootDosha ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold'}>
                {result.milan.bhakootDosha
                  ? lang === 'en' ? 'Bhakoot dosha' : 'भकूट दोष'
                  : lang === 'en' ? 'Auspicious' : 'शुभ भकूट'}
              </span>
            </div>
            <p className="text-[10.5px] font-devanagari text-zinc-300 pt-1.5 border-t border-zinc-800 leading-relaxed">
              {labels.milanDisclaimer}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
