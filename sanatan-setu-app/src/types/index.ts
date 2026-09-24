export type Language =
  | 'hi'   // हिन्दी (Hindi)
  | 'en'   // English
  | 'kn'   // ಕನ್ನಡ (Kannada)
  | 'ml'   // മലയാളം (Malayalam)
  | 'tcy'  // ತುಳು (Tulu)
  | 'te'   // తెలుగు (Telugu)
  | 'ta'   // தமிழ் (Tamil)
  | 'mr'   // मराठी (Marathi)
  | 'gu'   // ગુજરાતી (Gujarati)
  | 'bn'   // বাংলা (Bengali)
  | 'as'   // অসমীয়া (Assamese)
  | 'bho'  // भोजपुरी (Bhojpuri)
  | 'or'   // ଓଡ଼ିଆ (Odia)
  | 'hne'  // छत्तीसगढ़ी (Chhattisgarhi)
  | 'sa';  // संस्कृतम् (Sanskrit)

export interface ContentCategory {
  id: string;
  titleHindi: string;
  titleEnglish: string;
  tagline: string;
  iconName: string;
  image: string;
  deityFocus?: string;
}

export interface DeepVerse {
  chapter?: number;
  mandala?: number;      // मण्डल (Vedic Mandala e.g. 1-10)
  sukta?: number;        // सूक्त (Vedic Sukta/Hymn number)
  suktaName?: string;    // सूक्त नाम (e.g. "अग्नि सूक्त", "पुरुष सूक्त")
  rishi?: string;        // मन्त्र द्रष्टा ऋषि (e.g. "मधुच्छन्दा वैश्वामित्र")
  devata?: string;       // प्रतिपाद्य देवता (e.g. "अग्नि देव")
  chhandas?: string;     // वैदिक छन्द (e.g. "गायत्री छन्द")
  verseNumber: number;   // मन्त्र / ऋचा / श्लोक संख्या
  sanskrit: string;
  transliteration: string;
  padChhed?: string;
  hindiMeaning: string;
  englishMeaning: string;
}

export interface DeepScripture {
  id: string;
  title: string;
  sanskritTitle: string;
  category: 'veda' | 'upanishad' | 'gita' | 'purana';
  granthaName?: string;  // मूल ग्रंथ (e.g. "ऋग्वेद संहिता", "श्रीमद्भगवद्गीता")
  mandalaCount?: number; // कुल मण्डल / काण्ड संख्या
  suktaCount?: number;   // कुल सूक्त संख्या
  totalMantras?: string; // कुल मन्त्र संख्या (e.g. "१०,५५२")
  affiliation: string;
  introduction: string;
  totalChapters: number;
  verses: DeepVerse[];
}

export interface Veda {
  id: string;
  name: string;
  sanskritName: string;
  tagline: string;
  description: string;
  mantrasCount: string;
  keySukta: string;
  sanskritVerse: string;
  hindiTranslation: string;
  englishTranslation: string;
  image: string;
}

export interface Upanishad {
  id: string;
  name: string;
  sanskritName: string;
  vedaAssociation: string;
  centralTheme: string;
  mahavakya: string;
  mahavakyaMeaning: string;
  sampleShloka: string;
  hindiTranslation: string;
  englishTranslation: string;
}

export interface GitaShloka {
  chapter: number;
  verse: number;
  sanskrit: string;
  transliteration: string;
  hindiMeaning: string;
  englishMeaning: string;
}

export interface Purana {
  id: string;
  name: string;
  sanskritName: string;
  shlokasCount: string;
  deity: string;
  category?: 'Sattvika' | 'Rajasa' | 'Tamasa';
  summary: string;
  keyStories?: string[];
  chaptersCount?: number;
}

export interface MantraTrack {
  id: string;
  title: string;
  sanskritTitle: string;
  deity: 'shiva' | 'shakti' | 'krishna' | 'ganesha' | 'hanuman' | 'universal';
  duration: number; // in seconds
  durationFormatted: string;
  audioUrl: string;
  sanskritLyrics: string;
  transliteration: string;
  meaningHindi: string;
  meaningEnglish: string;
  benefits: string;
  artist: string;
  artwork: string;
}

export interface Temple {
  id: string;
  name: string;
  sanskritName: string;
  location: string;
  state: string;
  deity: string;
  circuit: 'jyotirlinga' | 'chardham' | 'shaktipeeth' | 'major';
  description: string;
  liveDarshanAvailable: boolean;
  viewersCount: string;
  aartiTimings: string[];
  image: string;
  altitude?: string;
  circuitTag?: string;
  bestTimeToVisit?: string;
}

export interface Article {
  id: string;
  title: string;
  category: 'life_purpose' | 'dharma' | 'mind_soul' | 'heritage';
  summary: string;
  readTime: string;
  content: string[];
  quote: string;
}

export interface DarshanItem {
  id: string;
  nameHindi: string;
  nameEnglish: string;
  founder: string;
  founderSanskrit: string;
  centralText: string;
  tagline: string;
  summary: string;
  keyPrinciple: string;
}

export interface RishiItem {
  id: string;
  nameHindi: string;
  nameEnglish: string;
  title: string;
  vedicContribution: string;
  gotraLineage: string;
  lifeLesson: string;
}

export interface SamskaraItem {
  number: number;
  nameHindi: string;
  nameEnglish: string;
  stage: string;
  purpose: string;
  mantraOrSignificance: string;
}

export interface FestivalItem {
  id: string;
  nameHindi: string;
  nameEnglish: string;
  tithiHindi: string;
  season: string;
  spiritualSignificance: string;
  rituals: string[];
}

export interface ItihasItem {
  id: string;
  titleHindi: string;
  titleEnglish: string;
  author: string;
  scope: string;
  coreMessage: string;
  keySections: { title: string; desc: string }[];
}

export interface KnowledgeHubCategory {
  id: string;
  titleHindi: string;
  titleEnglish: string;
  tagline: string;
  countBadge: string;
  iconName: string;
  routeKey: string;
  image: string;
}

