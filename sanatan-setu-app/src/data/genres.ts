import type { ContentCategory, Language } from '../types';
import { CONTENT_CATEGORIES } from './contentCategories';

export interface Genre {
  id: string;
  titleHindi: string;
  titleEnglish: string;
  tagline: string;
  iconName: string;
  image: string;
  categoryIds: string[];
}

export const GENRES: Genre[] = [
  {
    id: 'dharm_gyan',
    titleHindi: 'धर्म ज्ञान',
    titleEnglish: 'Dharma Wisdom',
    tagline: 'वेद, उपनिषद, पुराण, दर्शन व ऋषि परंपरा',
    iconName: 'BookOpen',
    image: '/assets/Screenshot 2026-09-16 120715.png',
    categoryIds: [
      'vedas_upanishads',
      'puranas_itihas',
      'sanatan_knowledge',
      'darshan_adhyatma',
      'rishi_parampara',
      'sanskriti_parampara'
    ]
  },
  {
    id: 'bhakti',
    titleHindi: 'भक्ति',
    titleEnglish: 'Devotion',
    tagline: 'शिव-शक्ति, रामायण, आरती व प्रवचन',
    iconName: 'Flame',
    image: '/assets/Screenshot 2026-09-16 114937.png',
    categoryIds: [
      'shiva_shakti',
      'ramayana_mahabharata',
      'aarti_bhajan',
      'katha_pravachan'
    ]
  },
  {
    id: 'mantra_bhajan',
    titleHindi: 'मंत्र एवं भजन',
    titleEnglish: 'Mantras & Bhajans',
    tagline: 'बीज मंत्र, स्तोत्र, आरती व ध्यान साधना',
    iconName: 'Sparkles',
    image: '/assets/Screenshot 2026-09-16 120802.png',
    categoryIds: [
      'mantras_stotras',
      'aarti_bhajan',
      'dhyan_sadhana'
    ]
  },
  {
    id: 'katha_sadhana',
    titleHindi: 'कथा एवं साधना',
    titleEnglish: 'Stories & Sadhana',
    tagline: 'प्रवचन, पुराण कथाएं व नित्य साधना',
    iconName: 'MessageSquare',
    image: '/assets/Screenshot 2026-09-16 120635.png',
    categoryIds: [
      'katha_pravachan',
      'dhyan_sadhana',
      'puranas_itihas'
    ]
  },
  {
    id: 'teerth_mandir',
    titleHindi: 'तीर्थ एवं मंदिर',
    titleEnglish: 'Pilgrimage & Temples',
    tagline: 'चार धाम, ज्योतिर्लिंग, पर्व व लाइव दर्शन',
    iconName: 'Landmark',
    image: '/assets/Screenshot 2026-09-16 120654.png',
    categoryIds: [
      'teerth_mandir',
      'parv_utsav',
      'sanskriti_parampara'
    ]
  },
  {
    id: 'jyotish',
    titleHindi: 'ज्योतिष',
    titleEnglish: 'Astrology',
    tagline: 'कुंडली, मिलान, नाम राशि व भविष्यवाणी',
    iconName: 'Stars',
    image: '/assets/Screenshot 2026-09-16 120817.png',
    categoryIds: []
  }
];

export const DEFAULT_GENRE = 'dharm_gyan';

export const GENRE_TITLES: Record<string, Partial<Record<Language, string>>> = {
  dharm_gyan: {
    hi: 'धर्म ज्ञान', en: 'Dharma Wisdom', kn: 'ಧರ್ಮ ಜ್ಞಾನ', ml: 'ധർമ്മ ജ്ഞാനം',
    tcy: 'ಧರ್ಮ್ ಜ್ಞಾನ್', te: 'ధర్మ జ్ఞానం', ta: 'தர்ம ஞானம்', mr: 'धर्म ज्ञान',
    gu: 'ધર્મ જ્ઞાન', bn: 'ধর্ম জ্ঞান', as: 'ধৰ্ম জ্ঞান', bho: 'धर्म ज्ञान',
    or: 'ଧର୍ମ ଜ୍ଞାନ', hne: 'धर्म ज्ञान', sa: 'धर्मज्ञानम्'
  },
  bhakti: {
    hi: 'भक्ति', en: 'Devotion', kn: 'ಭಕ್ತಿ', ml: 'ഭക്തി',
    tcy: 'ಭಕ್ತಿ', te: 'భక్తి', ta: 'பக்தி', mr: 'भक्ती',
    gu: 'ભક્તિ', bn: 'ভক্তি', as: 'ভক্তি', bho: 'भक्ति',
    or: 'ଭକ୍ତି', hne: 'भक्ति', sa: 'भक्तिः'
  },
  mantra_bhajan: {
    hi: 'मंत्र एवं भजन', en: 'Mantras & Bhajans', kn: 'ಮಂತ್ರ ಮತ್ತು ಭಜನೆ', ml: 'മന്ത്രങ്ങളും ഭജനകളും',
    tcy: 'ಮಂತ್ರೊ ಭಜನೆ', te: 'మంత్రాలు & భజనలు', ta: 'மந்திரங்கள் & பஜனைகள்', mr: 'मंत्र आणि भजन',
    gu: 'મંત્ર અને ભજન', bn: 'মন্ত্র ও ভজন', as: 'মন্ত্ৰ আৰু ভজন', bho: 'मंत्र आ भजन',
    or: 'ମନ୍ତ୍ର ଓ ଭଜନ', hne: 'मंत्र अउ भजन', sa: 'मन्त्राः भजनानि च'
  },
  katha_sadhana: {
    hi: 'कथा एवं साधना', en: 'Stories & Sadhana', kn: 'ಕಥೆ ಮತ್ತು ಸಾಧನೆ', ml: 'കഥകളും സാധനയും',
    tcy: 'ಕಥೆ ಸಾಧನೆ', te: 'కథలు & సాధన', ta: 'கதைகள் & சாதனை', mr: 'कथा आणि साधना',
    gu: 'કથા અને સાધના', bn: 'কথা ও সাধনা', as: 'কথা আৰু সাধনা', bho: 'कथा आ साधना',
    or: 'କଥା ଓ ସାଧନା', hne: 'कथा अउ साधना', sa: 'कथा साधना च'
  },
  teerth_mandir: {
    hi: 'तीर्थ एवं मंदिर', en: 'Pilgrimage & Temples', kn: 'ತೀರ್ಥ ಮತ್ತು ದೇವಾಲಯ', ml: 'തീർത്ഥങ്ങളും ക്ഷേത്രങ്ങളും',
    tcy: 'ತೀರ್ಥೊ ದೇವಾಲಯೊ', te: 'తీర్థాలు & ఆలయాలు', ta: 'தீர்த்தங்கள் & கோயில்கள்', mr: 'तीर्थ आणि मंदिरे',
    gu: 'તીર્થ અને મંદિર', bn: 'তীর্থ ও মন্দির', as: 'তীৰ্থ আৰু মন্দিৰ', bho: 'तीरथ आ मंदिर',
    or: 'ତୀର୍ଥ ଓ ମନ୍ଦିର', hne: 'तीरथ अउ मंदिर', sa: 'तीर्थानि मन्दिराणि च'
  },
  jyotish: {
    hi: 'ज्योतिष', en: 'Astrology', kn: 'ಜ್ಯೋತಿಷ್ಯ', ml: 'ജ്യോതിഷം',
    tcy: 'ಜ್ಯೋತಿಷ್', te: 'జ్యోతిష్యం', ta: 'ஜோதிடம்', mr: 'ज्योतिष',
    gu: 'જ્યોતિષ', bn: 'জ্যোতিষ', as: 'জ্যোতিষ', bho: 'ज्योतिष',
    or: 'ଜ୍ୟୋତିଷ', hne: 'ज्योतिष', sa: 'ज्योतिषम्'
  }
};

export const getGenreTitle = (
  genreId: string,
  lang: Language,
  fallbackHindi: string,
  fallbackEnglish: string
): string => {
  const entry = GENRE_TITLES[genreId];
  if (entry) {
    const localized = entry[lang];
    if (localized) return localized;
    if (lang === 'en') return entry.en || fallbackEnglish;
    return entry.hi || fallbackHindi;
  }
  if (lang === 'en') return fallbackEnglish;
  return fallbackHindi;
};

export const getTopicsForGenre = (genreId: string): ContentCategory[] => {
  const genre = GENRES.find(g => g.id === genreId);
  if (!genre || genre.categoryIds.length === 0) return [];
  return CONTENT_CATEGORIES.filter(c => genre.categoryIds.includes(c.id));
};

export const getDefaultTopicsForGenre = (genreId: string): string[] => {
  const topics = getTopicsForGenre(genreId);
  if (topics.length === 0) return [];
  return topics.slice(0, Math.min(4, topics.length)).map(t => t.id);
};
