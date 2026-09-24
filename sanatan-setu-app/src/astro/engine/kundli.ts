import {
  birthDateFromInputs,
  getAscendant,
  getGrahaLongitudes,
  nakshatraIndex,
  nakshatraPada,
  normalizeDeg,
  signDegree,
  signIndex,
} from './ephemeris';
import type { PlanetLongitude } from './ephemeris';
import { GRAHA_KEYS, MANGLIK_HOUSES, MANGLIK_STRONG_HOUSES, houseFromLagna } from '../data/nakshatraIndex';
import type { GrahaKey } from '../data/nakshatraIndex';

export interface BirthInput {
  name: string;
  dob: string;
  tob: string;
  cityLat: number;
  cityLon: number;
  utcOffsetHours: number;
}

export interface PlanetPlacement {
  key: GrahaKey;
  lon: number;
  rashi: number;
  degreeInSign: number;
  house: number;
  nakshatra: number;
  pada: number;
}

export interface ManglikReport {
  isManglik: boolean;
  houses: number[];
  strength: 'none' | 'partial' | 'strong';
}

export interface KundliChart {
  name: string;
  birthUtc: Date;
  lagna: number;
  lagnaDegree: number;
  lagnaNakshatra: number;
  lagnaPada: number;
  planets: PlanetPlacement[];
  houseGrahas: GrahaKey[][];
  moonRashi: number;
  moonNakshatra: number;
  moonPada: number;
  sunRashi: number;
  manglik: ManglikReport;
}

function buildPlanetPlacements(lagna: number, g: PlanetLongitude): PlanetPlacement[] {
  return GRAHA_KEYS.map((key) => {
    const lon = normalizeDeg(g[key]);
    return {
      key,
      lon,
      rashi: signIndex(lon),
      degreeInSign: signDegree(lon),
      house: houseFromLagna(lon, lagna),
      nakshatra: nakshatraIndex(lon),
      pada: nakshatraPada(lon),
    };
  });
}

function buildHouseGrahas(planets: PlanetPlacement[]): GrahaKey[][] {
  const houses: GrahaKey[][] = Array.from({ length: 12 }, () => []);
  for (const p of planets) {
    const h = Math.min(12, Math.max(1, p.house));
    houses[h - 1].push(p.key);
  }
  return houses;
}

function manglikFromPlanets(planets: PlanetPlacement[]): ManglikReport {
  const mars = planets.find((p) => p.key === 'mars');
  if (!mars) return { isManglik: false, houses: [], strength: 'none' };
  const houses = MANGLIK_HOUSES.filter((h) => h === mars.house);
  if (houses.length === 0) return { isManglik: false, houses: [], strength: 'none' };
  const strong = MANGLIK_STRONG_HOUSES.some((h) => h === mars.house);
  return { isManglik: true, houses, strength: strong ? 'strong' : 'partial' };
}

export function computeKundli(input: BirthInput): KundliChart {
  const birthUtc = birthDateFromInputs(input.dob, input.tob, input.utcOffsetHours);
  const lagna = getAscendant(birthUtc, input.cityLat, input.cityLon);
  const grahas = getGrahaLongitudes(birthUtc);
  const planets = buildPlanetPlacements(lagna, grahas);
  const moon = planets.find((p) => p.key === 'moon');
  const sun = planets.find((p) => p.key === 'sun');
  return {
    name: input.name.trim(),
    birthUtc,
    lagna,
    lagnaDegree: signDegree(lagna),
    lagnaNakshatra: nakshatraIndex(lagna),
    lagnaPada: nakshatraPada(lagna),
    planets,
    houseGrahas: buildHouseGrahas(planets),
    moonRashi: moon ? moon.rashi : 0,
    moonNakshatra: moon ? moon.nakshatra : 0,
    moonPada: moon ? moon.pada : 1,
    sunRashi: sun ? sun.rashi : 0,
    manglik: manglikFromPlanets(planets),
  };
}

/** Sign index (0-11) for each house 1-12 (whole-sign from lagna). */
export function houseSignMap(chart: KundliChart): number[] {
  const lagnaSign = signIndex(chart.lagna);
  return Array.from({ length: 12 }, (_, i) => (lagnaSign + i) % 12);
}
