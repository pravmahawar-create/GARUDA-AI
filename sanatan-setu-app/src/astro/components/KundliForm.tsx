import React, { useMemo, useState } from 'react';
import { Compass, MapPin } from 'lucide-react';
import { triggerHaptic } from '../../services/audioService';
import type { Language } from '../../types';
import { searchCities, cityLabel } from '../data/cities';
import type { CityEntry } from '../data/cities';
import { computeKundli } from '../engine/kundli';
import type { KundliChart } from '../engine/kundli';
import { NAKSHATRA_NAMES_EN, NAKSHATRA_NAMES_HI, RASHI_NAMES_EN, RASHI_NAMES_HI, GRAHA_HI, GRAHA_EN, LAGNA_GEM_HI, LAGNA_GEM_EN } from '../data/nakshatraIndex';
import { NorthIndianChart } from './NorthIndianChart';
import { SouthIndianChart } from './SouthIndianChart';
import { getAstroLabels } from '../../data/astroLabels';
import { getLabels } from '../../data/languages';

interface Props {
  lang: Language;
}

type ChartStyle = 'north' | 'south';

export const KundliForm: React.FC<Props> = ({ lang }) => {
  const base = getLabels(lang);
  const labels = { ...base, ...getAstroLabels(lang) };
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [tob, setTob] = useState('');
  const [cityQuery, setCityQuery] = useState('');
  const [city, setCity] = useState<CityEntry | null>(null);
  const [chartStyle, setChartStyle] = useState<ChartStyle>('north');
  const [chart, setChart] = useState<KundliChart | null>(null);
  const [error, setError] = useState('');

  const suggestions = useMemo(() => searchCities(cityQuery, lang), [cityQuery, lang]);
  const rashiNames = lang === 'en' ? RASHI_NAMES_EN : RASHI_NAMES_HI;
  const nakNames = lang === 'en' ? NAKSHATRA_NAMES_EN : NAKSHATRA_NAMES_HI;
  const grahaNames = lang === 'en' ? GRAHA_EN : GRAHA_HI;

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    triggerHaptic('heavy');
    setError('');
    if (!name.trim() || !dob || !tob || !city) {
      setError(labels.kundliNeedAll);
      return;
    }
    try {
      const result = computeKundli({
        name,
        dob,
        tob,
        cityLat: city.lat,
        cityLon: city.lon,
        utcOffsetHours: city.tz,
      });
      setChart(result);
    } catch {
      setError(labels.kundliError);
    }
  };

  const inputCls = 'w-full px-3 py-2 rounded-xl bg-black/50 border border-amber-500/25 text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400 text-xs';

  return (
    <div className="space-y-4">
      <form onSubmit={handleGenerate} className="glass-gold p-3.5 rounded-2xl border border-amber-500/25 space-y-2.5 text-xs">
        <div className="flex items-center gap-1.5 text-amber-300 font-display font-semibold">
          <Compass className="w-4 h-4 text-amber-400" />
          <span>{labels.birthDetailsForm}</span>
        </div>
        <p className="text-[10px] text-zinc-400 font-devanagari">{labels.kundliNeedBirth}</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <input
            type="text"
            required
            placeholder={labels.namePlaceholder}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputCls}
          />
          <input
            type="date"
            required
            value={dob}
            onChange={(e) => setDob(e.target.value)}
            className={inputCls}
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[9.5px] text-zinc-400 block font-mono mb-1">{labels.timeOfBirthLabel}</label>
            <input
              type="time"
              required
              value={tob}
              onChange={(e) => setTob(e.target.value)}
              className={inputCls}
            />
          </div>
          <div className="relative">
            <label className="text-[9.5px] text-zinc-400 block font-mono mb-1">{labels.placeOfBirthLabel}</label>
            <input
              type="text"
              required
              placeholder={labels.cityPlaceholder}
              value={city ? cityLabel(city, lang) : cityQuery}
              onChange={(e) => {
                setCity(null);
                setCityQuery(e.target.value);
              }}
              className={inputCls}
            />
            {!city && suggestions.length > 0 && (
              <ul className="absolute z-20 left-0 right-0 mt-1 max-h-40 overflow-y-auto rounded-xl bg-black/95 border border-amber-500/40 shadow-gold-sm">
                {suggestions.map((c) => (
                  <li key={`${c.n}-${c.lat}`}>
                    <button
                      type="button"
                      onClick={() => {
                        setCity(c);
                        setCityQuery('');
                        triggerHaptic('light');
                      }}
                      className="w-full text-left px-3 py-2 text-[11px] text-amber-100 hover:bg-amber-500/20 flex items-center gap-1.5"
                    >
                      <MapPin className="w-3 h-3 text-amber-400 flex-shrink-0" />
                      <span>{cityLabel(c, lang)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="flex gap-1.5 p-1 rounded-xl bg-black/50 border border-amber-500/20">
          <button
            type="button"
            onClick={() => setChartStyle('north')}
            className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
              chartStyle === 'north' ? 'bg-amber-500/30 text-amber-200 border border-amber-400' : 'text-zinc-400 border border-transparent'
            }`}
          >
            {labels.northChart}
          </button>
          <button
            type="button"
            onClick={() => setChartStyle('south')}
            className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
              chartStyle === 'south' ? 'bg-amber-500/30 text-amber-200 border border-amber-400' : 'text-zinc-400 border border-transparent'
            }`}
          >
            {labels.southChart}
          </button>
        </div>

        {error && <p className="text-[10px] text-red-400 font-devanagari">{error}</p>}

        <button
          type="submit"
          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 text-black font-semibold text-xs tracking-wider uppercase shadow-gold-sm hover:brightness-110 active:scale-98 transition-all"
        >
          {labels.generateKundli}
        </button>
      </form>

      {!chart ? (
        <div className="p-5 rounded-2xl bg-black/50 border border-dashed border-amber-500/30 text-center space-y-2">
          <Compass className="w-8 h-8 text-amber-400/60 mx-auto animate-pulse" />
          <h4 className="font-display text-sm font-bold text-white">{labels.kundliWaiting}</h4>
          <p className="text-xs text-zinc-400 font-devanagari max-w-xs mx-auto leading-relaxed">{labels.kundliWaitingSub}</p>
        </div>
      ) : (
        <div className="p-4 rounded-3xl bg-black/70 border border-amber-500/30 text-center space-y-3">
          <div className="flex justify-between items-center px-1 text-xs">
            <span className="font-display font-bold text-amber-200">{chart.name}</span>
            <span className="text-[10px] font-mono text-emerald-400 font-bold">
              {labels.lagnaLabel} {rashiNames[Math.floor(chart.lagna / 30) % 12]}
            </span>
          </div>

          {chartStyle === 'north' ? (
            <NorthIndianChart chart={chart} lang={lang} />
          ) : (
            <SouthIndianChart chart={chart} lang={lang} />
          )}

          <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/20 text-[10px] text-amber-200/90 font-devanagari text-left">
            {labels.kundliDisclaimer}
          </div>

          <div className="grid grid-cols-2 gap-2 text-left pt-1 text-xs">
            <div className="bg-black/50 p-2.5 rounded-xl border border-amber-500/15">
              <span className="text-[10px] text-zinc-400 font-mono block">{labels.moonSignLabel}</span>
              <span className="text-amber-300 font-bold font-devanagari">{rashiNames[chart.moonRashi]}</span>
            </div>
            <div className="bg-black/50 p-2.5 rounded-xl border border-amber-500/15">
              <span className="text-[10px] text-zinc-400 font-mono block">{labels.birthStarLabel}</span>
              <span className="text-amber-300 font-bold font-devanagari">
                {nakNames[chart.moonNakshatra]} {chart.moonPada}
              </span>
            </div>
            <div className="bg-black/50 p-2.5 rounded-xl border border-emerald-500/25">
              <span className="text-[10px] text-zinc-400 font-mono block">{labels.manglikLabel}</span>
              <span className="text-emerald-300 font-bold font-devanagari text-[11px]">
                {chart.manglik.isManglik
                  ? chart.manglik.strength === 'strong'
                    ? lang === 'en' ? 'Strong Manglik' : 'प्रबल मांगलिक'
                    : lang === 'en' ? 'Partial Manglik' : 'आंशिक मांगलिक'
                  : lang === 'en' ? 'Non-Manglik' : 'दोष मुक्त'}
              </span>
            </div>
            <div className="bg-black/50 p-2.5 rounded-xl border border-amber-500/15">
              <span className="text-[10px] text-zinc-400 font-mono block">{labels.luckyGemLabel}</span>
              <span className="text-amber-300 font-bold font-devanagari">
                {(lang === 'en' ? LAGNA_GEM_EN : LAGNA_GEM_HI)[Math.floor(chart.lagna / 30) % 12]}
              </span>
            </div>
          </div>

          <div className="text-left bg-black/50 p-2.5 rounded-xl border border-amber-500/15 space-y-1">
            <span className="text-[10px] text-zinc-400 font-mono block uppercase">{labels.planetPositions}</span>
            <div className="grid grid-cols-3 gap-x-2 gap-y-0.5 text-[10px]">
              {chart.planets.map((p) => (
                <span key={p.key} className="text-amber-100/90">
                  {grahaNames[p.key]}: {rashiNames[p.rashi]} {Math.floor(p.degreeInSign)}°
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
