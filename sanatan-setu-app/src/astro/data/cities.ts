import citiesJson from './cities.json';
import type { Language } from '../../types';

export interface CityEntry {
  n: string;
  s: string;
  lat: number;
  lon: number;
  tz: number;
  h?: string;
}

const CITIES = citiesJson as CityEntry[];

export function searchCities(query: string, lang: Language, limit = 8): CityEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const scored: { c: CityEntry; score: number }[] = [];
  for (const c of CITIES) {
    const en = c.n.toLowerCase();
    const hi = (c.h || '').toLowerCase();
    const st = c.s.toLowerCase();
    if (en.startsWith(q) || (lang !== 'en' && hi.startsWith(q))) scored.push({ c, score: 0 });
    else if (en.includes(q) || hi.includes(q)) scored.push({ c, score: 1 });
    else if (st.includes(q)) scored.push({ c, score: 2 });
  }
  scored.sort((a, b) => a.score - b.score || a.c.n.localeCompare(b.c.n));
  return scored.slice(0, limit).map((x) => x.c);
}

export function cityLabel(c: CityEntry, lang: Language): string {
  if (lang === 'en') return `${c.n}, ${c.s}`;
  const local = c.h || c.n;
  return lang === 'hi' ? `${local}, ${c.s}` : `${local} (${c.n})`;
}
