import { nakshatraPada } from './ephemeris';

/**
 * Traditional first-syllables per nakshatra pada (4 padas × 27).
 * Used for Naam Rashi / naming guidance from Moon pada.
 */
export const NAM_SYLLABLES: string[][] = [
  ['Chu', 'Che', 'Cho', 'La'],
  ['Li', 'Lu', 'Le', 'Lo'],
  ['A', 'Ee', 'U', 'Ai'],
  ['O', 'Va', 'Vi', 'Vu'],
  ['Ve', 'Vo', 'Ka', 'Ki'],
  ['Ko', 'Ha', 'Hi', 'Hu'],
  ['Gay', 'Gu', 'Go', 'Si'],
  ['Ha', 'Hi', 'Hu', 'He'],
  ['Di', 'Du', 'De', 'Do'],
  ['Ma', 'Mi', 'Mu', 'Me'],
  ['Mo', 'Ta', 'Ti', 'Tu'],
  ['Te', 'To', 'Pa', 'Pi'],
  ['Pu', 'Sha', 'Na', 'Tha'],
  ['Pe', 'Po', 'Ra', 'Ri'],
  ['Ru', 'Re', 'Ro', 'Ta'],
  ['Ro', 'Ri', 'Ru', 'Ray'],
  ['Ti', 'Tu', 'Te', 'To'],
  ['Ya', 'Yu', 'Yo', 'Bha'],
  ['Ye', 'Yo', 'Bha', 'Bhi'],
  ['Bha', 'Bhu', 'Dha', 'Pha'],
  ['Be', 'Bo', 'Ja', 'Ji'],
  ['Ju', 'Je', 'Jo', 'Ra'],
  ['Ga', 'Gi', 'Gu', 'Ge'],
  ['Go', 'Sa', 'Si', 'Su'],
  ['Se', 'So', 'Da', 'Di'],
  ['Du', 'Tha', 'Jha', 'Na'],
  ['De', 'Do', 'Cha', 'Chi']
];

/**
 * Traditional Naam Rashi from first letter (Devanagari + Latin approx).
 * Returns rashi index 0-11 or -1 if unmapped.
 */
const LETTER_MAP: Record<string, number> = {
  // Latin
  a: 0, l: 0,
  u: 1, v: 1,
  b: 2, k: 2, c: 2, g: 2,
  d: 3, h: 3,
  m: 4,
  t: 5, e: 5,
  p: 6, f: 6, y: 6,
  n: 7, o: 7,
  j: 8, p8: 8,
  s: 9,
  r: 10,
  w: 11, z: 11, i: 11,
  // Devanagari
  'अ': 0, 'आ': 0, 'ल': 0,
  'उ': 1, 'ऊ': 1, 'व': 1,
  'ब': 2, 'क': 2, 'ख': 2, 'ग': 2, 'घ': 2,
  'ड': 3, 'ढ': 3, 'ह': 3,
  'म': 4,
  'ट': 5, 'ठ': 5, 'ए': 5, 'ऐ': 5,
  'प': 6, 'फ': 6, 'य': 6,
  'न': 7, 'ओ': 7, 'औ': 7,
  'ज': 8, 'झ': 8, 'ष': 8,
  'श': 9, 'स': 9, 'च': 9,
  'र': 10, 'ऋ': 10,
  'ध': 11, 'इ': 11, 'ई': 11
};

export function naamRashiFromName(name: string): number {
  const trimmed = name.trim();
  if (!trimmed) return -1;
  const ch = trimmed[0].toLowerCase();
  if (ch in LETTER_MAP) return LETTER_MAP[ch];
  // Skip leading spaces / common prefixes
  for (const c of trimmed) {
    const lc = c.toLowerCase();
    if (lc in LETTER_MAP) return LETTER_MAP[lc];
  }
  return -1;
}

export interface NameMilanResult {
  groomNaamRashi: number;
  brideNaamRashi: number;
  score: number;
  max: number;
  groomLuckySyllables: string[];
  brideLuckySyllables: string[];
  moonPadaGroom: number;
  moonPadaBride: number;
}

/** Simple rashi-friendship based naam milan (0-8 style scaled to 0-8). */
function rashifriendScore(a: number, b: number): number {
  if (a < 0 || b < 0) return 0;
  if (a === b) return 8;
  const dist = ((b - a + 12) % 12);
  const mod = dist % 6;
  if (dist === 4 || dist === 8) return 4; // trine-ish
  if (dist === 3 || dist === 9) return 5; // kendra
  if (mod === 0) return 6; // same element opposite
  if (dist === 2 || dist === 10 || dist === 6) return 3; // 2/12/8
  if (dist === 5 || dist === 7) return 4;
  return 5;
}

export function computeNameMilan(
  groomName: string,
  brideName: string,
  groomMoonLon?: number,
  brideMoonLon?: number
): NameMilanResult {
  const groomNaam = naamRashiFromName(groomName);
  const brideNaam = naamRashiFromName(brideName);
  const score = rashifriendScore(groomNaam, brideNaam);

  let moonPadaGroom = 1;
  let moonPadaBride = 1;
  let groomLucky: string[] = [];
  let brideLucky: string[] = [];

  if (groomMoonLon !== undefined) {
    const nak = Math.floor((groomMoonLon % 360) / (360 / 27)) % 27;
    moonPadaGroom = nakshatraPada(groomMoonLon);
    groomLucky = NAM_SYLLABLES[nak] || [];
  }
  if (brideMoonLon !== undefined) {
    const nak = Math.floor((brideMoonLon % 360) / (360 / 27)) % 27;
    moonPadaBride = nakshatraPada(brideMoonLon);
    brideLucky = NAM_SYLLABLES[nak] || [];
  }

  return {
    groomNaamRashi: groomNaam,
    brideNaamRashi: brideNaam,
    score,
    max: 8,
    groomLuckySyllables: groomLucky,
    brideLuckySyllables: brideLucky,
    moonPadaGroom,
    moonPadaBride,
  };
}
