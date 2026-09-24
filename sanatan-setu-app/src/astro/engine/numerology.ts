export interface NumerologyProfile {
  lifePath: number;
  destiny: number;
  soulUrge: number;
  birthdayNumber: number;
  personalYear: number;
}

export const NUMBER_MEANINGS_HI: Record<number, string> = {
  1: 'नेतृत्व, स्वतंत्रता व मूलकर्ता शक्ति — स्वयं का मार्ग बनाने वाला अंक।',
  2: 'सहयोग, संवेदनशीलता व द्वैत-संतुलन — मधुर साथी व शांति-दूत।',
  3: 'सृजनशीलता, अभिव्यक्ति व आनंद — कला व संवाद का प्रकाश।',
  4: 'अनुशासन, स्थिरता व परिश्रम — ठोस नींव रखने वाला अंक।',
  5: 'स्वतंत्रता, यात्रा व परिवर्तन — अनुभव-केंद्रित ऊर्जा।',
  6: 'करुणा, परिवार व उत्तरदायित्व — सेवा व सुंदरता का कारक।',
  7: 'अध्यात्म, विश्लेषण व गूढ़ ज्ञान — अंतर्दृष्टि का अंक।',
  8: 'सफलता, प्रबंधन व भौतिक उन्नति — सामर्थ्य व न्याय का अंक।',
  9: 'पूर्णता, विश्व-दृष्टि व त्याग — मानवता-सेवा का अंक।',
  11: 'आध्यात्मिक जागरूकता का मास्टर अंक — अंतर्ज्ञान प्रखर।',
  22: 'महान निर्माता का मास्टर अंक — विशाल सपनों का व्यावहारिक रूप।',
  33: 'सेवा व करुणा का मास्टर अंक — उपचारक व शिक्षक ऊर्जा।'
};

export const NUMBER_MEANINGS_EN: Record<number, string> = {
  1: 'Leadership, independence and originality — the self-made path.',
  2: 'Cooperation, sensitivity and balance — a gentle peacemaker.',
  3: 'Creativity, expression and joy — light of art and communication.',
  4: 'Discipline, stability and diligence — builds solid foundations.',
  5: 'Freedom, travel and change — experience-centred energy.',
  6: 'Compassion, family and responsibility — service and beauty.',
  7: 'Spirituality, analysis and deep wisdom — insight and intuition.',
  8: 'Success, management and material rise — power with fairness.',
  9: 'Completion, universal vision and sacrifice — humanitarian service.',
  11: 'Master number of spiritual awareness — heightened intuition.',
  22: 'Master builder — turns vast vision into practical reality.',
  33: 'Master of service and compassion — healing and teaching energy.'
};

export function reduceNumber(n: number, keepMasters = true): number {
  let v = Math.abs(n);
  while (v > 9) {
    if (keepMasters && (v === 11 || v === 22 || v === 33)) return v;
    v = String(v).split('').reduce((s, d) => s + Number(d), 0);
  }
  return v;
}

export function lifePathFromDob(dob: string): number {
  const digits = Array.from(dob.replace(/[^0-9]/g, ''));
  if (!digits.length) return 0;
  const sum = digits.reduce((s, d) => s + Number(d), 0);
  return reduceNumber(sum);
}

/** Pythagorean letter values A=1..I=9, J=1..R=9, S=1..Z=8. */
const PYTHAG: Record<string, number> = {
  a: 1, b: 2, c: 3, d: 4, e: 5, f: 6, g: 7, h: 8, i: 9,
  j: 1, k: 2, l: 3, m: 4, n: 5, o: 6, p: 7, q: 8, r: 9,
  s: 1, t: 2, u: 3, v: 4, w: 5, x: 6, y: 7, z: 8
};

function letterValue(ch: string): number {
  const lc = ch.toLowerCase();
  if (PYTHAG[lc] !== undefined) return PYTHAG[lc];
  // Devanagari rough map by varna of akshar position — use char code fallback
  if (lc >= 'अ' && lc <= 'ह') {
    const code = lc.codePointAt(0) || 0;
    return reduceNumber(code - 0x0905 + 1, false) || 1;
  }
  return 0;
}

function sumName(name: string, filter?: (ch: string, idx: number) => boolean): number {
  let sum = 0;
  let idx = 0;
  for (const ch of name) {
    if (filter && !filter(ch, idx)) {
      idx++;
      continue;
    }
    sum += letterValue(ch);
    idx++;
  }
  return sum;
}

const VOWELS = new Set(['a', 'e', 'i', 'o', 'u', 'aa', 'ee', 'oo']);

export function destinyFromName(name: string): number {
  const sum = sumName(name);
  return sum > 0 ? reduceNumber(sum) : 0;
}

export function soulUrgeFromName(name: string): number {
  const sum = sumName(name, (ch) => VOWELS.has(ch.toLowerCase()));
  return sum > 0 ? reduceNumber(sum) : 0;
}

export function birthdayNumber(dob: string): number {
  const day = Number(dob.split('-')[2]);
  if (!day) return 0;
  return reduceNumber(day);
}

export function personalYear(dob: string, year: number): number {
  const [ , m, d] = dob.split('-').map(Number);
  if (!m || !d) return 0;
  const sum = reduceNumber(m) + reduceNumber(d) + reduceNumber(year);
  return reduceNumber(sum);
}

export function computeNumerology(name: string, dob: string, now = new Date()): NumerologyProfile {
  return {
    lifePath: lifePathFromDob(dob),
    destiny: destinyFromName(name),
    soulUrge: soulUrgeFromName(name),
    birthdayNumber: birthdayNumber(dob),
    personalYear: personalYear(dob, now.getFullYear()),
  };
}
