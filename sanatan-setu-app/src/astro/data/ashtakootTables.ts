import type { GrahaKey } from '../data/nakshatraIndex';

/** 14 traditional yonis indexed by nakshatra (0-26). */
export const YONI_BY_NAK: number[] = [
  0, 1, 2, 3, 3, 4, 5, 2, 5,
  6, 6, 7, 8, 9, 8, 9, 10, 10,
  4, 11, 12, 11, 13, 0, 13, 7, 1
];

export const YONI_NAMES_HI = [
  'घोड़ा', 'हाथी', 'भेड़ा', 'सर्प', 'कुत्ता', 'बिल्ली', 'चूहा',
  'गाय', 'भैंस', 'बाघ', 'हिरन', 'बंदर', 'नकुल', 'सिंह'
];

export const YONI_NAMES_EN = [
  'Horse', 'Elephant', 'Sheep', 'Serpent', 'Dog', 'Cat', 'Rat',
  'Cow', 'Buffalo', 'Tiger', 'Deer', 'Monkey', 'Mongoose', 'Lion'
];

/**
 * Traditional yoni score matrix [4 same, 3 friend, 2 neutral, 1 enemy, 0 vivah].
 * Rows/cols follow YONI_NAMES order. Classical mutual friendships.
 */
const F: Record<string, true> = {};
const E: Record<string, true> = {};
const W: Record<string, true> = {};
const key = (a: number, b: number) => `${Math.min(a, b)}-${Math.max(a, b)}`;

// Mutual friends (score 3)
([
  [0, 11], [0, 4], [0, 10], // Horse: Monkey, Dog, Deer
  [1, 7], [1, 2], [1, 6],   // Elephant: Cow, Sheep, Rat
  [2, 7], [2, 8],           // Sheep: Cow, Buffalo
  [3, 5], [3, 6], [3, 13],  // Serpent: Cat, Rat, Lion
  [4, 8], [4, 11],          // Dog: Buffalo, Monkey
  [5, 6], [5, 11],          // Cat: Rat, Monkey
  [6, 12],                  // Rat: Mongoose
  [7, 8],                   // Cow: Buffalo
  [9, 13], [9, 10], [9, 11],// Tiger: Lion, Deer, Monkey
  [10, 11],                 // Deer: Monkey
] as [number, number][]).forEach(([a, b]) => { F[key(a, b)] = true; });

// Classical enemies (score 1)
([
  [0, 8],                   // Horse vs Buffalo
  [0, 13],                  // Horse vs Lion
  [1, 4],                   // Elephant vs Dog
  [2, 4],                   // Sheep vs Dog
  [4, 7],                   // Dog vs Cow
  [4, 10],                  // Dog vs Deer
  [5, 9],                   // Cat vs Tiger
  [5, 13],                  // Cat vs Lion
  [6, 7],                   // Rat vs Cow
  [6, 8],                   // Rat vs Buffalo
  [6, 9],                   // Rat vs Tiger
  [7, 11],                  // Cow vs Monkey
  [8, 11],                  // Buffalo vs Monkey
  [8, 12],                  // Buffalo vs Mongoose
  [9, 12],                  // Tiger vs Mongoose
  [10, 12],                 // Deer vs Mongoose
  [11, 13],                 // Monkey vs Lion
] as [number, number][]).forEach(([a, b]) => { E[key(a, b)] = true; });

// Greatest enemies / vivah badhak (score 0)
([
  [7, 13],                  // Cow vs Lion
  [1, 13],                  // Elephant vs Lion
  [0, 1],                   // Horse vs Elephant (classical vivah pair in some texts → keep enemy? no: vivah)
] as [number, number][]).forEach(([a, b]) => { W[key(a, b)] = true; });

export function yoniScore(nakA: number, nakB: number): number {
  const a = YONI_BY_NAK[nakA % 27];
  const b = YONI_BY_NAK[nakB % 27];
  if (a === b) return 4;
  const k = key(a, b);
  if (W[k]) return 0;
  if (F[k]) return 3;
  if (E[k]) return 1;
  return 2;
}

/** Gana per nakshatra: 0 Deva, 1 Manushya, 2 Rakshasa (classical map). */
export const GANA_BY_NAK = [
  0, 1, 2, 1, 0, 2, 0, 0, 2,
  2, 1, 1, 0, 2, 0, 2, 0, 2,
  2, 1, 1, 0, 2, 2, 1, 1, 0
];

export const GANA_NAMES_HI = ['देव', 'मनुष्य', 'राक्षस'];
export const GANA_NAMES_EN = ['Deva', 'Manushya', 'Rakshasa'];

/**
 * Varna by rashi: 0 Brahmin, 1 Kshatriya, 2 Vaishya, 3 Shudra.
 * Kark/Vrishchik/Meen=Brahmin; Mesh/Simh/Dhanu=Kshatriya;
 * Vrish/Kanya/Makar=Vaishya; Mithun/Tula/Kumbh=Shudra.
 */
export const VARNA_BY_RASHI = [1, 2, 3, 0, 1, 2, 3, 0, 1, 2, 3, 0];

/** Vashya group: 0 Chatushpada, 1 Manushya, 2 Jalachara, 3 Vanachara, 4 Keeta. */
export const VASHYA_GROUP = [0, 0, 1, 2, 3, 1, 1, 4, 3, 0, 1, 2];

export const VASHYA_NAMES_HI = ['चतुष्पाद', 'मानव', 'जलचर', 'वनचर', 'कीट'];
export const VASHYA_NAMES_EN = ['Chatushpada', 'Manushya', 'Jalachara', 'Vanachara', 'Keeta'];

/** Vashya control score [groomType][brideType], max 2. */
const VASHYA_CTRL: number[][] = [
  [2, 2, 1, 1, 2],
  [1, 2, 1, 1, 2],
  [1, 1, 2, 1, 2],
  [1, 1, 1, 2, 1],
  [1, 1, 1, 2, 2]
];

export function vashyaScore(groomRashi: number, brideRashi: number): number {
  if (groomRashi === brideRashi) return 2;
  const g = VASHYA_GROUP[groomRashi % 12];
  const b = VASHYA_GROUP[brideRashi % 12];
  return VASHYA_CTRL[g][b];
}

/** Nadi: 0 Aadi, 1 Madhya, 2 Antya — classical cycle from Ashwini. */
export function nadiOfNak(nak: number): number {
  return nak % 3;
}

export const NADI_NAMES_HI = ['आदि', 'मध्य', 'अंत्य'];
export const NADI_NAMES_EN = ['Aadi', 'Madhya', 'Antya'];

/**
 * Nadi paad vedha cancellation pairs (pada 1-4).
 * If same nadi but these pada combos, dosha cancels → 8 points restored.
 * Index = (padaA-1)*4 + (padaB-1); symmetric.
 */
const NADI_VEDHA: Record<string, true> = {};
([
  [1, 2], [2, 1], [3, 4], [4, 3],
  [1, 3], [3, 1], [2, 4], [4, 2],
] as [number, number][]).forEach(([a, b]) => {
  NADI_VEDHA[`${a}-${b}`] = true;
});

export function nadiVedhaCancels(padaA: number, padaB: number): boolean {
  return NADI_VEDHA[`${padaA}-${padaB}`] === true;
}

/**
 * Natural planet friendship (Parashari).
 * F friends, N neutral, E enemies.
 */
const GRAHA_REL: Record<GrahaKey, { F: GrahaKey[]; N: GrahaKey[]; E: GrahaKey[] }> = {
  sun:    { F: ['moon', 'mars', 'jupiter'], N: ['mercury'], E: ['venus', 'saturn'] },
  moon:   { F: ['sun', 'mercury'], N: ['mars', 'jupiter', 'venus', 'saturn'], E: [] },
  mars:   { F: ['sun', 'moon', 'jupiter'], N: ['venus', 'saturn'], E: ['mercury'] },
  mercury:{ F: ['sun', 'venus'], N: ['mars', 'jupiter', 'saturn'], E: ['moon'] },
  jupiter:{ F: ['sun', 'moon', 'mars'], N: ['saturn'], E: ['mercury', 'venus'] },
  venus:  { F: ['mercury', 'saturn'], N: ['mars', 'jupiter'], E: ['sun', 'moon'] },
  saturn: { F: ['mercury', 'venus'], N: ['jupiter'], E: ['sun', 'moon', 'mars'] },
  rahu:   { F: ['venus', 'saturn', 'mercury'], N: ['mars', 'jupiter'], E: ['sun', 'moon'] },
  ketu:   { F: ['mars', 'jupiter'], N: ['saturn'], E: ['sun', 'moon', 'venus', 'mercury'] }
};

type Rel = 'F' | 'N' | 'E';

function relOf(from: GrahaKey, to: GrahaKey): Rel {
  if (from === to) return 'F';
  const r = GRAHA_REL[from];
  if (r.F.includes(to)) return 'F';
  if (r.E.includes(to)) return 'E';
  return 'N';
}

/** Graha maitri score 0-5 between two sign lords. */
export function maitriScore(lordA: GrahaKey, lordB: GrahaKey): number {
  if (lordA === lordB) return 5;
  const a = relOf(lordA, lordB);
  const b = relOf(lordB, lordA);
  if (a === 'F' && b === 'F') return 5;
  if ((a === 'F' && b === 'N') || (a === 'N' && b === 'F')) return 4;
  if (a === 'N' && b === 'N') return 3;
  if ((a === 'E' && b === 'N') || (a === 'N' && b === 'E')) return 2;
  if ((a === 'F' && b === 'E') || (a === 'E' && b === 'F')) return 1;
  return 0;
}

/** Traditional sign lords (0-11). */
export const SIGN_LORD: GrahaKey[] = [
  'mars', 'venus', 'mercury', 'moon', 'sun', 'mercury',
  'venus', 'mars', 'jupiter', 'saturn', 'saturn', 'jupiter'
];

/** Tara inauspicious counts (1-based mod 9): Janma, Satru, Rog. */
export const TARA_INAUSPICIOUS = [3, 5, 7];

export const VARNA_NAMES_HI = ['ब्राह्मण', 'क्षत्रिय', 'वैश्य', 'शूद्र'];
export const VARNA_NAMES_EN = ['Brahmin', 'Kshatriya', 'Vaishya', 'Shudra'];
