import {
  GANA_BY_NAK,
  SIGN_LORD,
  TARA_INAUSPICIOUS,
  VARNA_BY_RASHI,
  maitriScore,
  nadiOfNak,
  nadiVedhaCancels,
  vashyaScore,
  yoniScore,
} from '../data/ashtakootTables';

export interface MilanInput {
  groomName: string;
  groomRashi: number;
  groomNakshatra: number;
  groomPada: number;
  brideName: string;
  brideRashi: number;
  brideNakshatra: number;
  bridePada: number;
}

export interface KootaResult {
  key: string;
  score: number;
  max: number;
}

export interface MilanResult {
  total: number;
  max: number;
  kootas: KootaResult[];
  varna: number;
  vashya: number;
  tara: number;
  yoni: number;
  maitri: number;
  gana: number;
  bhakoot: number;
  nadi: number;
  nadiDosha: boolean;
  nadiCancelled: boolean;
  bhakootDosha: boolean;
  verdictLevel: 'excellent' | 'good' | 'average' | 'low';
}

function varnaScore(groomRashi: number, brideRashi: number): number {
  const g = VARNA_BY_RASHI[groomRashi % 12];
  const b = VARNA_BY_RASHI[brideRashi % 12];
  return b <= g ? 1 : 0;
}

function taraScore(groomNak: number, brideNak: number): number {
  const count1 = ((brideNak - groomNak + 27) % 9) + 1;
  const count2 = ((groomNak - brideNak + 27) % 9) + 1;
  const gOk = !TARA_INAUSPICIOUS.includes(count1);
  const bOk = !TARA_INAUSPICIOUS.includes(count2);
  if (gOk && bOk) return 3;
  if (gOk || bOk) return 1.5;
  return 0;
}

function ganaScore(groomNak: number, brideNak: number): number {
  const a = GANA_BY_NAK[groomNak % 27];
  const b = GANA_BY_NAK[brideNak % 27];
  if (a === b) return 6;
  if ((a === 0 && b === 1) || (a === 1 && b === 0)) return 5;
  if (a === 0 && b === 2) return 1;
  if (a === 2 && b === 0) return 0;
  return 0;
}

function bhakootScore(groomRashi: number, brideRashi: number): number {
  const dist = ((brideRashi - groomRashi + 12) % 12) + 1;
  if ([2, 12, 6, 8].includes(dist)) return 0;
  if ([5, 9].includes(dist)) return 0;
  return 7;
}

export function computeAshtakoot(input: MilanInput): MilanResult {
  const varna = varnaScore(input.groomRashi, input.brideRashi);
  const vashya = vashyaScore(input.groomRashi, input.brideRashi);
  const tara = taraScore(input.groomNakshatra, input.brideNakshatra);
  const yoni = yoniScore(input.groomNakshatra, input.brideNakshatra);
  const maitri = maitriScore(SIGN_LORD[input.groomRashi % 12], SIGN_LORD[input.brideRashi % 12]);
  const gana = ganaScore(input.groomNakshatra, input.brideNakshatra);
  const bhakoot = bhakootScore(input.groomRashi, input.brideRashi);

  const nG = nadiOfNak(input.groomNakshatra);
  const nB = nadiOfNak(input.brideNakshatra);
  let nadi: number;
  let nadiCancelled = false;
  if (nG !== nB) {
    nadi = 8;
  } else if (nadiVedhaCancels(input.groomPada, input.bridePada)) {
    nadi = 8;
    nadiCancelled = true;
  } else {
    nadi = 0;
  }
  const nadiDosha = nG === nB && !nadiCancelled;

  const total = varna + vashya + tara + yoni + maitri + gana + bhakoot + nadi;

  let verdictLevel: MilanResult['verdictLevel'] = 'low';
  if (total >= 28) verdictLevel = 'excellent';
  else if (total >= 18) verdictLevel = 'good';
  else if (total >= 12) verdictLevel = 'average';

  return {
    total,
    max: 36,
    kootas: [
      { key: 'varna', score: varna, max: 1 },
      { key: 'vashya', score: vashya, max: 2 },
      { key: 'tara', score: tara, max: 3 },
      { key: 'yoni', score: yoni, max: 4 },
      { key: 'maitri', score: maitri, max: 5 },
      { key: 'gana', score: gana, max: 6 },
      { key: 'bhakoot', score: bhakoot, max: 7 },
      { key: 'nadi', score: nadi, max: 8 },
    ],
    varna,
    vashya,
    tara,
    yoni,
    maitri,
    gana,
    bhakoot,
    nadi,
    nadiDosha,
    nadiCancelled,
    bhakootDosha: bhakoot === 0,
    verdictLevel,
  };
}
