import type { ContentCategory } from '../types';

export const CONTENT_CATEGORIES: ContentCategory[] = [
  {
    id: 'vedas_upanishads',
    titleHindi: 'वेद एवं उपनिषद',
    titleEnglish: 'Vedas & Upanishads',
    tagline: '४ वेद, १० मुख्य उपनिषद् व ऋचाएं',
    iconName: 'BookOpen',
    image: '/assets/Screenshot 2026-09-16 120715.png',
    deityFocus: 'Brahma & Rishis'
  },
  {
    id: 'puranas_itihas',
    titleHindi: 'पुराण एवं इतिहास',
    titleEnglish: 'Puranas & Epics',
    tagline: '१८ महापुराण, श्रीमद्भागवत व प्राचीन गाथाएं',
    iconName: 'Scroll',
    image: '/assets/Screenshot 2026-09-16 120730.png',
    deityFocus: 'Vyasa & Avatars'
  },
  {
    id: 'mantras_stotras',
    titleHindi: 'मंत्र एवं स्तोत्र',
    titleEnglish: 'Mantras & Stotras',
    tagline: 'दिव्य वैदिक बीज मंत्र व सिद्ध स्तोत्र',
    iconName: 'Sparkles',
    image: '/assets/Screenshot 2026-09-16 114937.png',
    deityFocus: 'Shiva & Shakti'
  },
  {
    id: 'aarti_bhajan',
    titleHindi: 'आरती एवं भजन',
    titleEnglish: 'Aarti & Bhajans',
    tagline: 'भावपूर्ण संकीर्तन, नित्य आरती व दिव्य संगीत',
    iconName: 'Music',
    image: '/assets/Screenshot 2026-09-16 120802.png',
    deityFocus: 'Krishna & Rama'
  },
  {
    id: 'katha_pravachan',
    titleHindi: 'कथा एवं प्रवचन',
    titleEnglish: 'Sacred Discourses',
    tagline: 'सद्गुरु वाणी, अमृत कथाएं व आध्यात्मिक संवाद',
    iconName: 'MessageSquare',
    image: '/assets/Screenshot 2026-09-16 120635.png',
    deityFocus: 'Sanatan Dharma'
  },
  {
    id: 'shiva_shakti',
    titleHindi: 'शिव–शक्ति',
    titleEnglish: 'Shiva & Shakti',
    tagline: 'द्वादश ज्योतिर्लिंग, ५१ शक्तिपीठ व ताण्डव स्तोत्र',
    iconName: 'Flame',
    image: '/assets/Screenshot 2026-09-16 114937.png',
    deityFocus: 'Lord Shiva & Devi Durga'
  },
  {
    id: 'ramayana_mahabharata',
    titleHindi: 'रामायण / महाभारत',
    titleEnglish: 'Ramayana / Mahabharata',
    tagline: 'मर्यादा पुरुषोत्तम राम व श्रीमद्भगवद्गीता',
    iconName: 'Shield',
    image: '/assets/Screenshot 2026-09-16 120845.png',
    deityFocus: 'Shri Rama & Krishna'
  },
  {
    id: 'sanatan_knowledge',
    titleHindi: 'सनातन ज्ञान',
    titleEnglish: 'Sanatan Knowledge',
    tagline: 'धर्म, अर्थ, काम, मोक्ष व संस्कार विज्ञान',
    iconName: 'BookMarked',
    image: '/assets/Screenshot 2026-09-16 120845.png',
    deityFocus: 'Dharma & Karma'
  },
  {
    id: 'rishi_parampara',
    titleHindi: 'ऋषि परंपरा',
    titleEnglish: 'Rishi Tradition',
    tagline: 'सप्तर्षि, प्राचीन ऋषि परंपरा व गुरुकुल दर्शन',
    iconName: 'Users',
    image: '/assets/Screenshot 2026-09-16 120831.png',
    deityFocus: 'Vashistha, Agastya & Rishis'
  },
  {
    id: 'darshan_adhyatma',
    titleHindi: 'दर्शन / अध्यात्म',
    titleEnglish: 'Philosophy & Vedanta',
    tagline: 'अद्वैत, सांख्य, योग व तत्व ज्ञान',
    iconName: 'Eye',
    image: '/assets/Screenshot 2026-09-16 120817.png',
    deityFocus: 'Atman & Brahman'
  },
  {
    id: 'teerth_mandir',
    titleHindi: 'तीर्थ एवं मंदिर',
    titleEnglish: 'Sacred Temples',
    tagline: 'चार धाम, पावन घाट, दिव्य मंदिर व लाइव दर्शन',
    iconName: 'Landmark',
    image: '/assets/Screenshot 2026-09-16 120654.png',
    deityFocus: 'Tirtha Sanctuaries'
  },
  {
    id: 'parv_utsav',
    titleHindi: 'पर्व एवं उत्सव',
    titleEnglish: 'Festivals & Vrats',
    tagline: 'शिवरात्रि, नवरात्रि, दीपावली व एकादशी व्रत',
    iconName: 'Calendar',
    image: '/assets/Screenshot 2026-09-16 120635.png',
    deityFocus: 'Sacred Calendar'
  },
  {
    id: 'dhyan_sadhana',
    titleHindi: 'ध्यान / साधना',
    titleEnglish: 'Meditation & Sadhana',
    tagline: '१०८ जप माला, प्राणायाम, ब्रह्म मुहूर्त साधना',
    iconName: 'Disc3',
    image: '/assets/Screenshot 2026-09-16 115008.png',
    deityFocus: 'Inner Peace'
  },
  {
    id: 'sanskriti_parampara',
    titleHindi: 'संस्कृति एवं परंपरा',
    titleEnglish: 'Culture & Heritage',
    tagline: 'वैदिक जीवन शैली, १६ संस्कार व सनातन गौरव',
    iconName: 'Globe',
    image: '/assets/Screenshot 2026-09-16 120654.png',
    deityFocus: 'Civilizational Roots'
  }
];

export const DEFAULT_PREFERENCES = ['shiva_shakti', 'mantras_stotras', 'vedas_upanishads', 'teerth_mandir'];
