import * as Astronomy from 'astronomy-engine';

export interface GeoPosition {
  lat: number;
  lon: number;
}

export interface PlanetLongitude {
  sun: number;
  moon: number;
  mercury: number;
  venus: number;
  mars: number;
  jupiter: number;
  saturn: number;
  rahu: number;
  ketu: number;
}

const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;

export function normalizeDeg(deg: number): number {
  let d = deg % 360;
  if (d < 0) d += 360;
  return d;
}

export function julianDay(date: Date): number {
  return date.getTime() / 86400000 + 2440587.5;
}

/**
 * Lahiri (Chitrapaksha) ayanamsa in degrees.
 * J2000 anchor 23.853167° (23°51'11.4"), precession rate ~50.290966"/yr.
 * Accuracy ~1–2 arcmin across 1900–2100 — sufficient for sign/nakshatra.
 */
export function lahiriAyanamsa(date: Date): number {
  const t = (julianDay(date) - 2451545.0) / 36525.0;
  return normalizeDeg(23.853167 + 1.39697128 * t + 0.0000538 * t * t);
}

/** Tropical (of-date) → Sidereal (Lahiri). */
export function toSidereal(tropicalLonDeg: number, date: Date): number {
  return normalizeDeg(tropicalLonDeg - lahiriAyanamsa(date));
}

function geocentricTropicalLon(body: Astronomy.Body, date: Date): number {
  const vec = Astronomy.GeoVector(body, date, true);
  const ecl = Astronomy.Ecliptic(vec);
  return normalizeDeg(ecl.elon);
}

/**
 * Mean lunar node (Rahu) tropical longitude — Meeus low-precision series,
 * accurate to ~1 arcmin, traditional choice for Vedic charts.
 */
export function meanRahuTropical(date: Date): number {
  const t = (julianDay(date) - 2451545.0) / 36525.0;
  const omega =
    125.0445479 -
    1934.1362891 * t +
    0.0020754 * t * t +
    (t * t * t) / 467441.0 -
    (t * t * t * t) / 60616000.0;
  return normalizeDeg(omega);
}

/** Sidereal longitudes of 9 grahas (Lahiri). */
export function getGrahaLongitudes(date: Date): PlanetLongitude {
  const sun = toSidereal(Astronomy.SunPosition(date).elon, date);
  const moonSid = Astronomy.EclipticGeoMoon(date);
  const moon = toSidereal(moonSid.lon, date);
  const mercury = toSidereal(geocentricTropicalLon(Astronomy.Body.Mercury, date), date);
  const venus = toSidereal(geocentricTropicalLon(Astronomy.Body.Venus, date), date);
  const mars = toSidereal(geocentricTropicalLon(Astronomy.Body.Mars, date), date);
  const jupiter = toSidereal(geocentricTropicalLon(Astronomy.Body.Jupiter, date), date);
  const saturn = toSidereal(geocentricTropicalLon(Astronomy.Body.Saturn, date), date);
  const rahu = toSidereal(meanRahuTropical(date), date);
  const ketu = normalizeDeg(rahu + 180);
  return { sun, moon, mercury, venus, mars, jupiter, saturn, rahu, ketu };
}

/**
 * Sidereal ascendant (Lagna) in degrees [0,360).
 * Uses local apparent sidereal time + standard east-horizon ecliptic formula,
 * then subtracts Lahiri ayanamsa.
 */
export function getAscendant(date: Date, lat: number, lon: number): number {
  const time = Astronomy.MakeTime(date);
  const gastHours = Astronomy.SiderealTime(time);
  const lstHours = ((gastHours + lon / 15) % 24 + 24) % 24;
  const ramc = lstHours * 15;

  const tilt = Astronomy.e_tilt(time);
  const eps = tilt.tobl * DEG2RAD;
  const phi = lat * DEG2RAD;
  const ramcRad = ramc * DEG2RAD;

  const y = Math.cos(ramcRad);
  const x = -(Math.sin(ramcRad) * Math.cos(eps) + Math.tan(phi) * Math.sin(eps));
  let ascTropical = Math.atan2(y, x) * RAD2DEG;
  ascTropical = normalizeDeg(ascTropical);

  return toSidereal(ascTropical, date);
}

export function signIndex(siderealLonDeg: number): number {
  return Math.floor(normalizeDeg(siderealLonDeg) / 30) % 12;
}

export function signDegree(siderealLonDeg: number): number {
  return normalizeDeg(siderealLonDeg) % 30;
}

export function nakshatraIndex(siderealLonDeg: number): number {
  return Math.floor(normalizeDeg(siderealLonDeg) / (360 / 27)) % 27;
}

export function nakshatraPada(siderealLonDeg: number): number {
  const within = normalizeDeg(siderealLonDeg) % (360 / 27);
  return Math.min(4, Math.floor(within / (360 / 108)) + 1);
}

/** Birth Date from user dob (YYYY-MM-DD) + tob (HH:MM) interpreted at city UTC offset. */
export function birthDateFromInputs(dob: string, tob: string, utcOffsetHours: number): Date {
  const [y, m, d] = dob.split('-').map(Number);
  const [hh, mm] = (tob || '12:00').split(':').map(Number);
  const utcMs = Date.UTC(y, (m || 1) - 1, d || 1, hh || 0, mm || 0, 0) - utcOffsetHours * 3600 * 1000;
  return new Date(utcMs);
}
