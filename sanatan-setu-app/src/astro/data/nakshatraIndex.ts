export const RASHI_NAMES_HI = [
  'मेष', 'वृषभ', 'मिथुन', 'कर्क', 'सिंह', 'कन्या',
  'तुला', 'वृश्चिक', 'धनु', 'मकर', 'कुम्भ', 'मीन'
];

export const RASHI_NAMES_EN = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
];

export const RASHI_SYMBOLS = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓'];

export const NAKSHATRA_NAMES_HI = [
  'अश्विनी', 'भरणी', 'कृत्तिका', 'रोहिणी', 'मृगशिरा', 'आर्द्रा', 'पुनर्वसु', 'पुष्य',
  'आश्लेषा', 'मघा', 'पूर्वाफाल्गुनी', 'उत्तराफाल्गुनी', 'हस्त', 'चित्रा', 'स्वाति',
  'विशाखा', 'अनुराधा', 'ज्येष्ठा', 'मूल', 'पूर्वाषाढ़ा', 'उत्तराषाढ़ा', 'श्रवण',
  'धनिष्ठा', 'शतभिषा', 'पूर्वाभाद्रपद', 'उत्तराभाद्रपद', 'रेवती'
];

export const NAKSHATRA_NAMES_EN = [
  'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra', 'Punarvasu', 'Pushya',
  'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni', 'Hasta', 'Chitra', 'Swati',
  'Vishakha', 'Anuradha', 'Jyeshta', 'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana',
  'Dhanishta', 'Shatabhisha', 'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati'
];

export const GRAHA_HI: Record<string, string> = {
  sun: 'सूर्य',
  moon: 'चन्द्र',
  mercury: 'बुध',
  venus: 'शुक्र',
  mars: 'मंगल',
  jupiter: 'गुरु',
  saturn: 'शनि',
  rahu: 'राहु',
  ketu: 'केतु'
};

export const GRAHA_EN: Record<string, string> = {
  sun: 'Sun',
  moon: 'Moon',
  mercury: 'Mercury',
  venus: 'Venus',
  mars: 'Mars',
  jupiter: 'Jupiter',
  saturn: 'Saturn',
  rahu: 'Rahu',
  ketu: 'Ketu'
};

export const GRAHA_SYMBOL: Record<string, string> = {
  sun: 'सू',
  moon: 'चं',
  mercury: 'बु',
  venus: 'शु',
  mars: 'मं',
  jupiter: 'गु',
  saturn: 'श',
  rahu: 'रा',
  ketu: 'के'
};

export const GRAHA_KEYS = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'rahu', 'ketu'] as const;
export type GrahaKey = (typeof GRAHA_KEYS)[number];

/** Natural gemstone per lagna lord (traditional). */
export const LAGNA_GEM_HI: Record<number, string> = {
  0: 'माणिक्य (Ruby)',
  1: 'हीरा (Diamond)',
  2: 'मरकत (Emerald)',
  3: 'मोती (Pearl)',
  4: 'माणिक्य (Ruby)',
  5: 'मरकत (Emerald)',
  6: 'हीरा (Diamond)',
  7: 'मूंगा (Coral)',
  8: 'पुखराज (Yellow Sapphire)',
  9: 'नीलम (Blue Sapphire)',
  10: 'नीलम (Blue Sapphire)',
  11: 'पुखराज (Yellow Sapphire)'
};

export const LAGNA_GEM_EN: Record<number, string> = {
  0: 'Ruby',
  1: 'Diamond',
  2: 'Emerald',
  3: 'Pearl',
  4: 'Ruby',
  5: 'Emerald',
  6: 'Diamond',
  7: 'Coral',
  8: 'Yellow Sapphire',
  9: 'Blue Sapphire',
  10: 'Blue Sapphire',
  11: 'Yellow Sapphire'
};

/** Classical full Manglik houses (Parashari). */
export const MANGLIK_HOUSES = [1, 2, 4, 7, 8, 12];
/** Stronger dosha houses. */
export const MANGLIK_STRONG_HOUSES = [1, 4, 7, 8, 12];

export function houseFromLagna(planetSidLon: number, lagnaSidLon: number): number {
  const diff = ((planetSidLon - lagnaSidLon) % 360 + 360) % 360;
  return Math.floor(diff / 30) + 1;
}
