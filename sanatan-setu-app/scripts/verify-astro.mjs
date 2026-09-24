import { computeKundli } from '../src/astro/engine/kundli.ts';
import { computeAshtakoot } from '../src/astro/engine/ashtakoot.ts';
import { computeNameMilan, naamRashiFromName } from '../src/astro/engine/nameRashi.ts';
import { computeNumerology, reduceNumber } from '../src/astro/engine/numerology.ts';

function assert(cond, msg) {
  if (!cond) throw new Error('FAIL: ' + msg);
  console.log('PASS: ' + msg);
}

const k = computeKundli({
  name: 'Test',
  dob: '1995-08-15',
  tob: '10:30',
  cityLat: 28.61,
  cityLon: 77.21,
  utcOffsetHours: 5.5,
});
assert(k.lagna >= 0 && k.lagna < 360, 'kundli lagna in 0..360');
assert(k.moonRashi >= 0 && k.moonRashi < 12, 'moon rashi 0..11');
assert(k.moonNakshatra >= 0 && k.moonNakshatra < 27, 'moon nakshatra 0..26');
assert(k.moonPada >= 1 && k.moonPada <= 4, 'moon pada 1..4');
assert(k.planets.length === 9, '9 grahas placed');
assert(k.houseGrahas.length === 12, '12 houses');
assert(typeof k.manglik.strength === 'string', 'manglik strength present');

const g2 = computeKundli({
  name: 'B',
  dob: '1992-03-10',
  tob: '06:00',
  cityLat: 19.07,
  cityLon: 72.87,
  utcOffsetHours: 5.5,
});
const b2 = computeKundli({
  name: 'G',
  dob: '1994-11-22',
  tob: '14:00',
  cityLat: 26.91,
  cityLon: 75.79,
  utcOffsetHours: 5.5,
});
const m = computeAshtakoot({
  groomName: 'A',
  groomRashi: g2.moonRashi,
  groomNakshatra: g2.moonNakshatra,
  groomPada: g2.moonPada,
  brideName: 'B',
  brideRashi: b2.moonRashi,
  brideNakshatra: b2.moonNakshatra,
  bridePada: b2.moonPada,
});
assert(m.total >= 0 && m.total <= 36, 'ashtakoot total in 0..36');
assert(m.max === 36, 'ashtakoot max is 36');
assert(m.kootas.length === 8, '8 kootas scored');
const ksum = m.kootas.reduce((s, x) => s + x.score, 0);
assert(Math.abs(ksum - m.total) < 1e-9, 'koota sum equals total');
assert(
  ['excellent', 'good', 'average', 'low'].includes(m.verdictLevel),
  'verdict level valid'
);

const nm = computeNameMilan('Rahul', 'Priya');
assert(nm.score >= 0 && nm.score <= 8, 'name milan score 0..8');
assert(nm.groomNaamRashi >= -1 && nm.groomNaamRashi < 12, 'groom naam rashi range');
assert(naamRashiFromName('Anita') >= 0, 'Devanagari/Latin first-letter map works');

const n = computeNumerology('Amit Sharma', '1990-05-20');
const okMaster = (x) => (x >= 1 && x <= 9) || [11, 22, 33].includes(x);
assert(okMaster(n.lifePath), 'life path valid');
assert(okMaster(n.destiny), 'destiny valid');
assert(okMaster(n.soulUrge), 'soul urge valid');
assert(okMaster(n.birthdayNumber), 'birthday number valid');
assert(okMaster(n.personalYear), 'personal year valid');
assert(reduceNumber(29) === 11 || reduceNumber(29, false) === 2, 'reduceNumber works');

console.log('\nALL GOLDEN TESTS PASSED');
