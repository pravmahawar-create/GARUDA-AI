import type { Veda, Upanishad, GitaShloka, Purana, MantraTrack, Temple, Article, DeepScripture } from '../types';

export const CLIENT_FOUNDATION_INFO = {
  name: "Sanatan Setu Charitable Foundation",
  registrationNumber: "191320",
  address: "Office No F02, First Floor, Krishna Complex, Nithari, Sector 31, Noida, U.P. 201301",
  phone: "+91 9953011446",
  email: "info.sanatansetu@gmail.com",
  instagram: "https://www.instagram.com/sanatansetuoffical",
  motto: "ज्ञान से जुड़ाव, संस्कृति से गर्व, और जीवन में प्रकाश — यही है सनातन सेतु !",
  tagline: "Connecting You to Eternal Wisdom"
};

export const LOGO_PILLARS = [
  {
    id: 1,
    titleHindi: "त्रिशूल",
    titleEnglish: "Trishul (Divine Trident)",
    meaningHindi: "भगवान शिव का सर्वोच्च प्रतीक जो तीन गुणों (सत्व, रज, तम) पर विजय और धर्म की रक्षा को दर्शाता है।",
    meaningEnglish: "Supreme symbol of Lord Shiva representing mastery over the three Gunas (Sattva, Rajas, Tamas) and protection of Dharma.",
    icon: "Trident"
  },
  {
    id: 2,
    titleHindi: "डमरू",
    titleEnglish: "Damru (Cosmic Drum)",
    meaningHindi: "डमरू से उत्पन्न नाद से सृष्टि की रचना हुई। यह समय (काल), स्पंदन और ज्ञान के विस्तार का प्रतीक है।",
    meaningEnglish: "The primordial sound creating cosmic vibration, the flow of sacred time, and the propagation of divine wisdom.",
    icon: "Music"
  },
  {
    id: 3,
    titleHindi: "ॐ (प्रणव)",
    titleEnglish: "Om (Primordial Sound)",
    meaningHindi: "आदि नाद, जो ब्रह्म, चेतना और संपूर्ण सृष्टि का मूल स्वरूप है। यह हमें परमसत्य से जोड़ता है।",
    meaningEnglish: "The primordial resonance of universal consciousness and Brahman, connecting the seeker directly to eternal truth.",
    icon: "Sun"
  },
  {
    id: 4,
    titleHindi: "खुला ग्रंथ",
    titleEnglish: "Open Grantha (Scriptures)",
    meaningHindi: "खुली पुस्तक वेद, उपनिषद और पुराणों के ज्ञान का प्रतीक है जो प्रकाश और सही मार्गदर्शन देता है।",
    meaningEnglish: "The open scripture symbolizing Vedas, Upanishads, and Puranas illuminating human life with timeless wisdom.",
    icon: "BookOpen"
  },
  {
    id: 5,
    titleHindi: "स्वर्णिम वृत्त",
    titleEnglish: "Golden Circle (Mandala)",
    meaningHindi: "अनंत ब्रह्मांड, एकता, पूर्णता और हमारे सनातन दर्शन की अखंडता का प्रतीक।",
    meaningEnglish: "The cosmic infinite circle symbolizing wholeness, continuity, and unbroken unity of Sanatan Dharma.",
    icon: "CircleDot"
  },
  {
    id: 6,
    titleHindi: "मंदिर पृष्ठभूमि",
    titleEnglish: "Temple Shikhars (Heritage)",
    meaningHindi: "हमारी प्राचीन सभ्यता, आस्था, आध्यात्मिक तपस्या और सनातन संस्कृति की भव्यता।",
    meaningEnglish: "Ancient sacred architecture reflecting civilizational depth, architectural mastery, and eternal devotion.",
    icon: "Building2"
  },
  {
    id: 7,
    titleHindi: "'S' आकार (सेतु)",
    titleEnglish: "'S' Form (The Bridge)",
    meaningHindi: "अतीत और वर्तमान, साधक और परमात्मा, शास्त्र और आधुनिक जीवन के बीच स्वर्णिम सेतु।",
    meaningEnglish: "Representing 'Setu' — the sacred bridge between past and present, seeker and Divine, wisdom and action.",
    icon: "Waypoints"
  },
  {
    id: 8,
    titleHindi: "संस्कृत आलेख",
    titleEnglish: "Sanskrit Inscriptions (Shabda Brahma)",
    meaningHindi: "'S' पर अंकित सूक्ष्म संस्कृत मंत्र हमारे शास्त्रों की दिव्यता और प्रामाणिकता दर्शाते हैं।",
    meaningEnglish: "Ancient Vedic script inscribed upon the emblem confirming textual authority and sacred authenticity.",
    icon: "Scroll"
  },
  {
    id: 9,
    titleHindi: "प्रकाश बिंदु",
    titleEnglish: "Radiant Light Points",
    meaningHindi: "अज्ञान के अंधकार से आत्मज्ञान और आंतरिक चेतना के प्रकाश की ओर ले जाने वाली किरणें।",
    meaningEnglish: "The divine spark guiding humanity from darkness to eternal light and inner awakening.",
    icon: "Sparkles"
  }
];

export const VEDAS_DATA: Veda[] = [
  {
    id: "rigveda",
    name: "Rig Veda",
    sanskritName: "ऋग्वेदः",
    tagline: "Hymns of Cosmic Wisdom & Truth",
    description: "The oldest known scripture of humanity, containing 1,028 suktas dedicated to cosmic deities, nature, and the ultimate truth.",
    mantrasCount: "10,552 Mantras | 10 Mandalas",
    keySukta: "Nasadiya Sukta (Hymn of Creation) & Gayatri Mantra",
    sanskritVerse: "एकं सद् विप्रा बहुधा वदन्ति अग्निं यमं मातरिश्वानमाहुः ॥",
    hindiTranslation: "सत्य एक ही है, जिसे ज्ञानी ऋषि अलग-अलग नामों (अग्नि, यम, मातरिश्वा) से पुकारते हैं।",
    englishTranslation: "Truth is One; the wise perceive and call it by multiple divine names.",
    image: "/assets/Screenshot 2026-09-16 120715.png"
  },
  {
    id: "yajurveda",
    name: "Yajur Veda",
    sanskritName: "यजुर्वेदः",
    tagline: "Science of Sacred Action & Rituals",
    description: "The Veda of sacred ceremonies, Yajna procedures, and psychological transformation through disciplined action.",
    mantrasCount: "1,975 Mantras | 40 Adhyayas",
    keySukta: "Shiva Sankalpa Sukta & Rudradhyaya (Shri Rudram)",
    sanskritVerse: "तन्मे मनः शिवसङ्कल्पमस्तु ॥",
    hindiTranslation: "मेरा मन सदैव शुभ, कल्याणकारी और शिव संकल्पों से परिपूर्ण रहे।",
    englishTranslation: "May my mind always dwell upon auspicious, noble, and benevolent intentions.",
    image: "/assets/Screenshot 2026-09-16 120831.png"
  },
  {
    id: "samaveda",
    name: "Sama Veda",
    sanskritName: "सामवेदः",
    tagline: "Melody of the Divine Spirit",
    description: "The source of Indian classical music and musical chanting, transforming Vedic mantras into divine melody and spiritual ecstasy.",
    mantrasCount: "1,875 Verses",
    keySukta: "Gana / Chhandas & Musical Devotion",
    sanskritVerse: "वेदानां सामवेदोऽस्मि (गीता १०.२२)",
    hindiTranslation: "भगवान श्रीकृष्ण ने कहा: समस्त वेदों में मैं 'सामवेद' हूँ।",
    englishTranslation: "Lord Krishna declared in the Bhagavad Gita: 'Among the Vedas, I am the Sama Veda.'",
    image: "/assets/Screenshot 2026-09-16 115123.png"
  },
  {
    id: "atharvaveda",
    name: "Atharva Veda",
    sanskritName: "अथर्ववेदः",
    tagline: "Wisdom for Daily Life, Healing & Harmony",
    description: "Comprehensive wisdom for holistic health, Ayurveda, nature conservation, societal governance, and spiritual shielding.",
    mantrasCount: "5,977 Mantras | 20 Kandas",
    keySukta: "Prithvi Sukta (Ode to Mother Earth)",
    sanskritVerse: "माता भूमिः पुत्रोऽहं पृथिव्याः ॥",
    hindiTranslation: "यह पृथ्वी मेरी माता है और मैं इस पावन धरा का पुत्र हूँ।",
    englishTranslation: "Earth is my sacred mother, and I am her devoted child.",
    image: "/assets/Screenshot 2026-09-16 120845.png"
  }
];

export const UPANISHADS_DATA: Upanishad[] = [
  {
    id: "isha",
    name: "Isha Upanishad",
    sanskritName: "ईशावास्योपनिषद्",
    vedaAssociation: "Shukla Yajur Veda",
    centralTheme: "Omnipresence of the Divine & Detached Enjoyment",
    mahavakya: "ईशा वास्यमिदं सर्वं यत्किञ्च जगत्यां जगत्",
    mahavakyaMeaning: "All this is enveloped by the Supreme Lord.",
    sampleShloka: "तेन त्यक्तेन भुञ्जीथा मा गृधः कस्यस्विद् धनम् ॥",
    hindiTranslation: "त्यागपूर्वक उपभोग करो, किसी के भी धन का लालच मत करो।",
    englishTranslation: "Enjoy and live with detachment and renunciation. Do not covet another's wealth."
  },
  {
    id: "taittiriya",
    name: "Taittiriya Upanishad",
    sanskritName: "तैत्तिरीयोपनिषद्",
    vedaAssociation: "Krishna Yajur Veda",
    centralTheme: "The Panchakosha (5 Sheaths) & Ultimate Truth",
    mahavakya: "सत्यं ज्ञानमनन्तं ब्रह्म",
    mahavakyaMeaning: "Brahman is pure Truth, infinite Knowledge, and Boundless Existence.",
    sampleShloka: "सत्यं वद । धर्मं चर । स्वाध्यायान्मा प्रमदः ॥",
    hindiTranslation: "सदा सत्य बोलो। धर्म का आचरण करो। स्वाध्याय में कभी आलस्य मत करो।",
    englishTranslation: "Speak the truth. Practice righteousness. Never neglect daily self-study and learning."
  },
  {
    id: "mandukya",
    name: "Mandukya Upanishad",
    sanskritName: "माण्डूक्योपनिषद्",
    vedaAssociation: "Atharva Veda",
    centralTheme: "The Four States of Consciousness (Aum & Turiya)",
    mahavakya: "अयमात्मा ब्रह्म (Ayam Atma Brahma)",
    mahavakyaMeaning: "This individual Self is the Supreme Brahman.",
    sampleShloka: "शिवं शान्तमद्वैतं चतुर्थं मन्यन्ते स आत्मा स विज्ञेयः ॥",
    hindiTranslation: "जो शांत, मंगलमय और अद्वैत है, वही चतुर्थ तुरीय अवस्था 'आत्मा' है, जिसे जानना चाहिए।",
    englishTranslation: "Peaceful, auspicious, and non-dual is the fourth state of pure awareness. That is the Self to be realized."
  },
  {
    id: "katha",
    name: "Katha Upanishad",
    sanskritName: "कठोपनिषद्",
    vedaAssociation: "Krishna Yajur Veda",
    centralTheme: "Dialogue between Nachiketa and Yama on Immortality",
    mahavakya: "उत्तिष्ठत जाग्रत प्राप्य वरान्निबोधत",
    mahavakyaMeaning: "Arise, awake, and learn from the enlightened masters.",
    sampleShloka: "क्षुरस्य धारा निशिता दुरत्यया दुर्गं पथस्तत्कवयो वदन्ति ॥",
    hindiTranslation: "ज्ञानी कहते हैं कि आत्मज्ञान का मार्ग छुरे की तीखी धार की तरह कठिन और दुर्गम है।",
    englishTranslation: "The wise declare that the path of spiritual liberation is as narrow and sharp as a razor's edge."
  }
];

export const GITA_HIGHLIGHTS: GitaShloka[] = [
  {
    chapter: 2,
    verse: 47,
    sanskrit: "कर्मण्येवाधिकारस्ते मा फलेषु कदाचन ।\nमा कर्मफलहेतुर्भूर्मा ते सङ्गोऽस्त्वकर्मणि ॥",
    transliteration: "Karmany evadhikaras te ma phaleshu kadachana...",
    hindiMeaning: "तुम्हारा अधिकार केवल निष्काम कर्म करने में है, उसके फलों में कभी नहीं। कर्मफल की इच्छा से कर्म मत करो और न ही कर्म त्यागने में तुम्हारी आसक्ति हो।",
    englishMeaning: "You have a right only to perform your prescribed duty, but never to the fruits of action. Never consider yourself the cause of results, nor be attached to inaction."
  },
  {
    chapter: 2,
    verse: 20,
    sanskrit: "न जायते म्रियते वा कदाचिन्नायं भूत्वा भविता वा न भूयः ।\nअजो नित्यः शाश्वतोऽयं पुराणो न हन्यते हन्यमाने शरीरे ॥",
    transliteration: "Na jayate mriyate va kadachin...",
    hindiMeaning: "आत्मा न कभी जन्म लेती है और न कभी मरती है। यह अजन्मा, नित्य, शाश्वत और पुरातन है। शरीर के नष्ट होने पर भी यह नहीं मरती।",
    englishMeaning: "The soul is neither born, nor does it ever die. It is unborn, eternal, ever-existing, and primeval. It is not slain when the body is slain."
  },
  {
    chapter: 7,
    verse: 8,
    sanskrit: "रसोऽहमप्सु कौन्तेय प्रभास्मि शशिसूर्ययोः ।\nप्रणवः सर्ववेदेषु शब्दः खे पौरुषं नृषु ॥",
    transliteration: "Raso 'ham apsu kaunteya prabhasmi shashi-suryayoh...",
    hindiMeaning: "हे कुन्तीपुत्र! मैं जलों में रस हूँ, चन्द्रमा और सूर्य में प्रकाश हूँ, समस्त वेदों में 'प्रणव' (ॐ) हूँ, आकाश में शब्द और पुरुषों में पौरुष हूँ।",
    englishMeaning: "O son of Kunti, I am the taste in water, the radiant light of the sun and moon, the sacred syllable AUM in all Vedas, sound in the ether, and ability in man."
  }
];

export const PURANAS_LIST: Purana[] = [
  {
    id: "brahma",
    name: "Brahma Purana (Adi Purana)",
    sanskritName: "ब्रह्मपुराणम् (आदिपुराणम्)",
    shlokasCount: "10,000",
    deity: "Lord Brahma & Surya",
    category: "Rajasa",
    chaptersCount: 245,
    keyStories: ["सृष्टि उत्पत्ति", "सूर्य महात्म्य", "गोदावरी तीर्थ महिमा", "ययाति चरित"],
    summary: "पुराणों में सबसे प्रथम माना जाने वाला महापुराण। इसमें सृष्टि की रचना, सौर मण्डल, गोदावरी नदी के तटवर्ती तीर्थों का विस्तृत वर्णन और धर्मशास्त्र के नियम हैं।"
  },
  {
    id: "padma",
    name: "Padma Purana",
    sanskritName: "पद्मपुराणम्",
    shlokasCount: "55,000",
    deity: "Lord Vishnu",
    category: "Sattvika",
    chaptersCount: 555,
    keyStories: ["पुष्कर तीर्थ महात्म्य", "शकुन्तला आख्यान", "गीता महात्म्य", "कार्तिक व वैशाख मास व्रत"],
    summary: "५ विशाल खण्डों (सृष्टि, भूमि, स्वर्ग, पाताल, उत्तर) में विभक्त। इसमें पुष्कर तीर्थ, एकादशी व्रत, तुलसी महात्म्य और श्रीमद्भगवद्गीता के प्रत्येक अध्याय का आध्यात्मिक फल वर्णित है।"
  },
  {
    id: "vishnu",
    name: "Vishnu Purana",
    sanskritName: "विष्णुपुराणम्",
    shlokasCount: "23,000",
    deity: "Lord Vishnu",
    category: "Sattvika",
    chaptersCount: 126,
    keyStories: ["ध्रुव चरित्र", "प्रह्लाद भक्ति व नृसिंह अवतार", "समुद्र मन्थन", "श्रीकृष्ण बाललीला"],
    summary: "पराशर ऋषि द्वारा रचित सर्वाधिक प्रामाणिक पुराण। इसमें ६ अंशों में भगवान विष्णु की भक्ति, काल गणना, सूर्य वंश, चन्द्र वंश और कलियुग के लक्षणों का सटीक निरूपण है।"
  },
  {
    id: "shiva",
    name: "Shiva Purana",
    sanskritName: "शिवपुराणम्",
    shlokasCount: "24,000",
    deity: "Lord Shiva (Mahadev)",
    category: "Tamasa",
    chaptersCount: 457,
    keyStories: ["द्वादश ज्योतिर्लिंग प्राकट्य", "सती देहत्याग व पार्वती तपस्या", "कार्तिकेय व गणेश जन्म", "रुद्राक्ष व भस्म महिमा"],
    summary: "भगवान आशुतोष शिव की सर्वोच्च लीलाओं का महाग्रंथ। इसमें विद्येश्वर, रुद्र, शतरुद्र, कोटिरुद्र, उमा, कैलास और वायु संहिताओं में बारह ज्योतिर्लिंगों की कथाएं और शिव पूजा विधि है।"
  },
  {
    id: "bhagavata",
    name: "Shrimad Bhagavata Purana",
    sanskritName: "श्रीमद्भागवत महापुराणम्",
    shlokasCount: "18,000",
    deity: "Bhagavan Shri Krishna",
    category: "Sattvika",
    chaptersCount: 335,
    keyStories: ["२४ अवतार", "कपिल देवहूति संवाद", "गजेन्द्र मोक्ष", "रास पंचाध्यायी", "उद्धव गीता"],
    summary: "भक्ति रस का सर्वोच्च शिरोमणि ग्रंथ। १२ स्कन्धों में भगवान वेदव्यास ने परमहंसों के लिए भक्ति, ज्ञान और वैराग्य का सार अमृत रूप में प्रस्तुत किया है।"
  },
  {
    id: "narada",
    name: "Narada Purana (Brihannaradiya)",
    sanskritName: "नारदपुराणम् (बृहन्नारदीय)",
    shlokasCount: "25,000",
    deity: "Devrishi Narada & Vishnu",
    category: "Sattvika",
    chaptersCount: 203,
    keyStories: ["वेदांगों की व्याख्या", "हरिवासर (एकादशी) व्रत", "तीर्थ यात्रा महात्म्य", "मोक्ष धर्म"],
    summary: "देवर्षि नारद द्वारा सनत्कुमारों को उपदिष्ट। इसमें वेदों के ६ अंगों (शिक्षा, कल्प, व्याकरण, निरुक्त, छन्द, ज्योतिष) का गूढ़ रहस्य और पवित्र तीर्थों की विधियां हैं।"
  },
  {
    id: "markandeya",
    name: "Markandeya Purana",
    sanskritName: "मार्कण्डेयपुराणम्",
    shlokasCount: "9,000",
    deity: "Maa Durga & Devi Chandi",
    category: "Rajasa",
    chaptersCount: 137,
    keyStories: ["श्री दुर्गा सप्तशती (देवी महात्म्य)", "महिषासुर मर्दिनी कथा", "मदालसा उपदेश", "हरिश्चन्द्र सत्य"],
    summary: "सर्वाधिक प्रसिद्ध ग्रंथ जिसमें ७०० श्लोकों वाली 'श्री दुर्गा सप्तशती' समाहित है। इसमें आद्याशक्ति माँ भगवती के प्राकट्य, मधु-कैटभ, महिषासुर और शुम्भ-निशुम्भ वध की गाथा है।"
  },
  {
    id: "agni",
    name: "Agni Purana",
    sanskritName: "अग्निपुराणम्",
    shlokasCount: "15,400",
    deity: "Agni Deva & Ishvara",
    category: "Tamasa",
    chaptersCount: 383,
    keyStories: ["आयुर्वेद संहिता", "धनुर्वेद व युद्धनीति", "वास्तुशास्त्र व मंदिर निर्माण", "ज्योतिष शास्त्र"],
    summary: "भारतीय ज्ञान-विज्ञान का विश्वकोश (Encyclopedia)। इसमें अग्निदेव ने वसिष्ठ जी को आयुर्वेद, धनुर्वेद, राजधर्म, वास्तु, व्याकरण, छंद, और औषधियों का संपूर्ण ज्ञान दिया है।"
  },
  {
    id: "bhavishya",
    name: "Bhavishya Purana",
    sanskritName: "भविष्यपुराणम्",
    shlokasCount: "14,500",
    deity: "Surya Deva & Brahma",
    category: "Rajasa",
    chaptersCount: 485,
    keyStories: ["कलियुग भविष्यवाणियां", "सूर्य उपासना व शाकद्वीप", "नाग पंचमी पूजा", "युग धर्म"],
    summary: "आगामी काल (भविष्य) की घटनाओं और ऐतिहासिक युग चक्रों का विस्मयकारी वर्णन। इसमें सूर्य देव की विधिवत उपासना और कलियुग में आने वाले परिवर्तनों का पूर्व-आकलन है।"
  },
  {
    id: "brahma_vaivarta",
    name: "Brahma Vaivarta Purana",
    sanskritName: "ब्रह्मवैवर्तपुराणम्",
    shlokasCount: "18,000",
    deity: "Shri Radha-Krishna & Ganesha",
    category: "Rajasa",
    chaptersCount: 276,
    keyStories: ["राधा-कृष्ण गोलोक लीला", "श्री गणेश जन्म व परशुराम युद्ध", "प्रकृति खण्ड (दुर्गा, लक्ष्मी, सरस्वती)", "गंगा अवतरण"],
    summary: "४ खण्डों (ब्रह्म, प्रकृति, गणपति, श्रीकृष्ण जन्म) में रचित। इसमें भगवान श्रीकृष्ण और श्री राधा रानी के दिव्य स्वरूप तथा पंच देवियों की उपासना का अलौकिक दर्शन है।"
  },
  {
    id: "linga",
    name: "Linga Purana",
    sanskritName: "लिंगपुराणम्",
    shlokasCount: "11,000",
    deity: "Shiva Linga & Sadashiva",
    category: "Tamasa",
    chaptersCount: 163,
    keyStories: ["अनादि ज्योतिर्लिंग प्राकट्य", "दधीचि मुनि की अस्थियों का दान", "मृत्युंजय साधना", "अघोर अस्त्र रहस्य"],
    summary: "निराकार और साकार ब्रह्म के प्रतीक 'शिवलिंग' की उत्पत्ति, रहस्य और पूजा का मुख्य आधार। इसमें ब्रह्मांड को लिंग रूप में देखने का उच्च दार्शनिक अद्वैत ज्ञान है।"
  },
  {
    id: "varaha",
    name: "Varaha Purana",
    sanskritName: "वराहपुराणम्",
    shlokasCount: "24,000",
    deity: "Bhagavan Varaha Avatar",
    category: "Sattvika",
    chaptersCount: 218,
    keyStories: ["भूदेवी उद्धार", "मथुरा मण्डल महिमा", "प्रायश्चित्त विधियां", "द्वादशी व्रत"],
    summary: "हिरण्याक्ष से पृथ्वी का उद्धार करने वाले भगवान वराह द्वारा भूदेवी को दिए गए उपदेश। इसमें शुद्ध आचार-विचार, पवित्र तीर्थ और पापनाशक व्रतों का विस्तार है।"
  },
  {
    id: "skanda",
    name: "Skanda Purana (Maha-Purana)",
    sanskritName: "स्कन्दपुराणम् (विशालतम्)",
    shlokasCount: "81,000",
    deity: "Bhagavan Kartikeya (Skanda)",
    category: "Tamasa",
    chaptersCount: 700,
    keyStories: ["काशी खण्ड (काशी महिमा)", "केदार खण्ड (उत्तराखण्ड)", "रेवा खण्ड (नर्मदा)", "अयोध्या महात्म्य", "सत्यनारायण कथा"],
    summary: "समस्त १८ पुराणों में सबसे विशालतम (८१,००० श्लोक)। इसमें काशी, केदारनाथ, बदरीनाथ, जगन्नाथ पुरी, और नर्मदा परिक्रमा का अत्यंत दिव्य और भूगोल सम्मत वर्णन है।"
  },
  {
    id: "vamana",
    name: "Vamana Purana",
    sanskritName: "वामनपुराणम्",
    shlokasCount: "10,000",
    deity: "Bhagavan Vamana (Trivikrama)",
    category: "Rajasa",
    chaptersCount: 95,
    keyStories: ["वामन अवतार व राजा बलि", "त्रिविक्रम रूप (तीन पग भूमि)", "कुरुक्षेत्र तीर्थ", "शिव-पार्वती विवाह"],
    summary: "भगवान वामन के त्रिविक्रम स्वरूप और दानवीर राजा बलि की कथा। इसमें भगवान शिव और विष्णु में कोई भेद न होने का अनूठा समन्वयकारी संदेश दिया गया है।"
  },
  {
    id: "kurma",
    name: "Kurma Purana",
    sanskritName: "कूर्मपुराणम्",
    shlokasCount: "17,000",
    deity: "Bhagavan Kurma & Shiva",
    category: "Tamasa",
    chaptersCount: 96,
    keyStories: ["समुद्र मन्थन व मन्दराचल", "ईश्वर गीता (शिव उपदेश)", "व्यास गीता", "प्रयाग तीर्थ महिमा"],
    summary: "समुद्र मन्थन के समय मन्दराचल पर्वत को धारण करने वाले कच्छप (कूर्म) अवतार द्वारा उपदिष्ट। इसके भीतर प्रसिद्ध 'ईश्वर गीता' समाहित है जिसमें अद्वैत तत्वज्ञान का प्रकाश है।"
  },
  {
    id: "matsya",
    name: "Matsya Purana",
    sanskritName: "मत्स्यपुराणम्",
    shlokasCount: "14,000",
    deity: "Bhagavan Matsya",
    category: "Tamasa",
    chaptersCount: 291,
    keyStories: ["जलप्रलय व मनु की नौका", "वास्तु एवं मूर्ति निर्माण कला (शिल्प)", "राजा ययाति कथा", "प्रयाग व नर्मदा महात्म्य"],
    summary: "महाप्रलय के समय राजा सत्यव्रत (मनु) को मत्स्य रूपी भगवान नारायण द्वारा दिया गया उपदेश। इसमें प्राचीन भारतीय स्थापत्य कला (Temple Architecture) और वास्तु शास्त्र के आधार सूत्र हैं।"
  },
  {
    id: "garuda",
    name: "Garuda Purana",
    sanskritName: "गरुड़पुराणम्",
    shlokasCount: "19,000",
    deity: "Bhagavan Vishnu & Pakshiraj Garuda",
    category: "Sattvika",
    chaptersCount: 271,
    keyStories: ["जीवात्मा की परलोक यात्रा", "यमलोक मार्ग व कर्मफल", "श्राद्ध एवं तर्पण विधि", "विष्णु भक्ति व मोक्ष धर्म"],
    summary: "पक्षीराज गरुड़ के प्रश्नों पर भगवान विष्णु द्वारा दिया गया उत्तर। इसमें मृत्यु के उपरांत आत्मा का सूक्ष्म सफर, कर्मों का फल, पुनर्जन्म, श्राद्ध विधान और मोक्ष प्राप्ति का विज्ञान है।"
  },
  {
    id: "brahmanda",
    name: "Brahmanda Purana",
    sanskritName: "ब्रह्माण्डपुराणम्",
    shlokasCount: "12,000",
    deity: "Cosmic Universe & Lalita Devi",
    category: "Rajasa",
    chaptersCount: 156,
    keyStories: ["श्री ललिता सहस्रनाम स्तोत्र", "अध्यात्म रामायण", "परशुराम चरित्र", "ब्रह्मांड की उत्पत्ति व भूगोल"],
    summary: "ब्रह्मांड के रहस्य और श्रीविद्या की साधना का परम ग्रंथ। इसी पुराण के उत्तर भाग में जगत्प्रसिद्ध 'श्री ललिता सहस्रनाम' और भगवान राम की तात्विक कथा 'अध्यात्म रामायण' समाहित है।"
  }
];

export const MANTRAS_PLAYLIST: MantraTrack[] = [
  {
    id: "shiva_panchakshari",
    title: "Om Namah Shivaya (108 Chants)",
    sanskritTitle: "ॐ नमः शिवाय (पञ्चाक्षर मन्त्र)",
    deity: "shiva",
    duration: 668,
    durationFormatted: "11:08",
    audioUrl: "https://archive.org/download/Rudram_20161231/Om%20Namah%20Shivaaya.mp3",
    sanskritLyrics: "ॐ नमः शिवाय",
    transliteration: "Om Namah Shivaya",
    meaningHindi: "मैं सर्वव्यापक, कल्याणकारी देवाधिदेव शिव को नमन करता हूँ। यह मन को शांत कर भयमुक्त करता है।",
    meaningEnglish: "I bow to Lord Shiva, the embodiment of auspiciousness, cosmic consciousness, and eternal peace.",
    benefits: "Removes negative energy, relieves mental anxiety, awakens inner peace.",
    artist: "Sacred Choir of Varanasi",
    artwork: "/assets/Screenshot 2026-09-16 114937.png"
  },
  {
    id: "gayatri_mantra",
    title: "Maha Gayatri Mantra (108 Chants)",
    sanskritTitle: "गायत्री मन्त्र (ऋग्वेद ३.६२.१०)",
    deity: "universal",
    duration: 660,
    durationFormatted: "11:00",
    audioUrl: "https://archive.org/download/Rudram_20161231/Gayatri%20Mantra.mp3",
    sanskritLyrics: "ॐ भूर्भुवः स्वः तत्सवितुर्वरेण्यं भर्गो देवस्य धीमहि धियो यो नः प्रचोदयात् ॥",
    transliteration: "Om Bhur Bhuvah Svah Tat-Savitur Varenyam Bhargo Devasya Dheemahi Dhiyo Yo Nah Prachodayat",
    meaningHindi: "उस प्राणस्वरूप, दुःखनिवारक, सुखस्वरूप, श्रेष्ठ, तेजस्वी परमपिता परमात्मा को हम अपनी बुद्धि में धारण करें, जो हमारी बुद्धि को सन्मार्ग पर प्रेरित करे।",
    meaningEnglish: "We meditate upon the supreme effulgence of that divine Sun of Truth. May it illuminate and inspire our intellect.",
    benefits: "Sharpening of memory, intellectual brilliance, removal of inner darkness.",
    artist: "Vedic Sanskrit Scholars",
    artwork: "/assets/Screenshot 2026-09-16 115008.png"
  },
  {
    id: "mahamrityunjaya",
    title: "Maha Mrityunjaya Mantra",
    sanskritTitle: "महामृत्युञ्जय मन्त्र",
    deity: "shiva",
    duration: 540,
    durationFormatted: "09:00",
    audioUrl: "https://archive.org/download/Rudram_20161231/Mahamrityunjaya%20Mantra.mp3",
    sanskritLyrics: "ॐ त्र्यम्बकं यजामहे सुगन्धिं पुष्टिवर्धनम् ।\nउर्वारुकमिव बन्धनान्मृत्यौर्मुक्षीय मामृतात् ॥",
    transliteration: "Om Tryambakam Yajamahe Sugandhim Pushti-vardhanam...",
    meaningHindi: "हम त्रिनेत्रधारी सुगंधित पुष्टिवर्धक भगवान शिव की पूजा करते हैं। जैसे खरबूजा पकने पर बेल से मुक्त हो जाता है, वैसे ही हम मृत्यु के भय से मुक्त होकर अमरता को प्राप्त हों।",
    meaningEnglish: "We worship the three-eyed Lord who nourishes and sustains all beings. May He liberate us from death into immortality.",
    benefits: "Provides physical and spiritual vitality, protects against accidental afflictions.",
    artist: "Rishi Parampara Sansthan",
    artwork: "/assets/Screenshot 2026-09-16 115142.png"
  },
  {
    id: "devi_mantra",
    title: "Maa Durga Chamunda Beej Mantra",
    sanskritTitle: "ॐ ऐं ह्रीं क्लीं चामुण्डायै विच्चे",
    deity: "shakti",
    duration: 607,
    durationFormatted: "10:07",
    audioUrl: "https://archive.org/download/ShivaStotrasAndMantras/24Shiva%20Panchakshar%20Stotram.mp3",
    sanskritLyrics: "ॐ ऐं ह्रीं क्लीं चामुण्डायै विच्चे ॥",
    transliteration: "Om Aim Hreem Kleem Chamundayai Viche",
    meaningHindi: "सरस्वती (ऐं), महालक्ष्मी (ह्रीं) और महाकाली (क्लीं) की समन्वित शक्ति रूप माँ चामुण्डा हमारे अज्ञान और विघ्नों का संहार करें।",
    meaningEnglish: "Salutations to Maa Chamunda, combining the supreme forces of Saraswati, Lakshmi, and Mahakali for protection and courage.",
    benefits: "Awakens divine courage, eliminates negative influences, inner strength.",
    artist: "Shakti Sadhana Ashram",
    artwork: "/assets/Screenshot 2026-09-16 114937.png"
  },
  {
    id: "ganesh_mantra",
    title: "Vakratunda Mahakaya & Ganapataye Namah",
    sanskritTitle: "ॐ गं गणपतये नमः",
    deity: "ganesha",
    duration: 501,
    durationFormatted: "08:21",
    audioUrl: "https://archive.org/download/ShivaStotrasAndMantras/01Ganpati%20Beej%20Mantra.mp3",
    sanskritLyrics: "वक्रतुण्ड महाकाय सूर्यकोटि समप्रभ ।\nनिर्विघ्नं कुरु मे देव सर्वकार्येषु सर्वदा ॥",
    transliteration: "Vakratunda Mahakaya Suryakoti Samaprabha...",
    meaningHindi: "विशाल काया वाले, करोड़ों सूर्यों के समान तेजस्वी विघ्नहर्ता भगवान गणेश मेरे सभी कार्यों को सदा निर्विघ्न संपन्न करें।",
    meaningEnglish: "O Lord with the curved trunk and immense form, radiant as a million suns, please make all my endeavors free of obstacles forever.",
    benefits: "Success in new beginnings, removes obstacles, brings auspicious wisdom.",
    artist: "Shri Siddhivinayak Temple Choir",
    artwork: "/assets/Screenshot 2026-09-16 115008.png"
  }
];

export const TEMPLES_DATA: Temple[] = [
  {
    id: "kedarnath",
    name: "Shri Kedarnath Dham",
    sanskritName: "श्री केदारनाथ ज्योतिर्लिंगम्",
    location: "Rudraprayag, Garhwal Himalayas",
    state: "Uttarakhand",
    deity: "Bhagavan Shiva (Sada-Shiva)",
    circuit: "chardham",
    altitude: "3,583 m (11,755 ft)",
    circuitTag: "चार धाम एवं १२ ज्योतिर्लिंग",
    bestTimeToVisit: "मई से अक्टूबर (अक्षय तृतीया से भाई दूज)",
    description: "Located at an altitude of 3,583m near the Mandakini river amidst eternal snow-capped peaks, Kedarnath is one of the highest and holiest of the 12 Jyotirlingas.",
    liveDarshanAvailable: true,
    viewersCount: "4,820",
    aartiTimings: ["05:30 AM (Mangala Aarti)", "06:30 PM (Sandhya Shringar Aarti)"],
    image: "/assets/Screenshot 2026-09-16 115212.png"
  },
  {
    id: "badrinath",
    name: "Shri Badrinath Dham",
    sanskritName: "श्री बदरीनाथ विशाल",
    location: "Chamoli, Garhwal Himalayas",
    state: "Uttarakhand",
    deity: "Bhagavan Badri-Vishal (Narayana)",
    circuit: "chardham",
    altitude: "3,300 m (10,827 ft)",
    circuitTag: "महा चार धाम तीर्थ",
    bestTimeToVisit: "मई से नवंबर (कपाट दर्शन काल)",
    description: "Nestled between Nar and Narayana mountain ranges on the banks of Alaknanda river, Badrinath is the supreme Dham established by Adi Shankaracharya.",
    liveDarshanAvailable: true,
    viewersCount: "6,150",
    aartiTimings: ["04:30 AM (Maha Abhishek)", "06:30 PM (Geeta Govinda Sandhya Aarti)"],
    image: "/assets/Screenshot 2026-09-16 120635.png"
  },
  {
    id: "kashi_vishwanath",
    name: "Shri Kashi Vishwanath",
    sanskritName: "श्री काशी विश्वनाथ ज्योतिर्लिंगम्",
    location: "Varanasi (Kashi), River Ganga",
    state: "Uttar Pradesh",
    deity: "Bhagavan Vishweshwara (Shiva)",
    circuit: "jyotirlinga",
    altitude: "81 m (Ganga Plain)",
    circuitTag: "सप्त मोक्षपुरी एवं प्रधान ज्योतिर्लिंग",
    bestTimeToVisit: "अक्टूबर से मार्च (देव दीपावली व शिवरात्रि)",
    description: "The spiritual heart of Sanatan Dharma where Lord Shiva bestows Taraka Mantra. Situated on the sacred banks of Mother Ganga in the oldest continuously inhabited city.",
    liveDarshanAvailable: true,
    viewersCount: "8,940",
    aartiTimings: ["03:00 AM (Mangala)", "11:15 AM (Bhog)", "07:00 PM (Sandhya)", "09:00 PM (Shringar)", "10:30 PM (Shayan)"],
    image: "/assets/Screenshot 2026-09-16 120654.png"
  },
  {
    id: "mahakaleshwar",
    name: "Shri Mahakaleshwar Jyotirlinga",
    sanskritName: "श्री महाकालेश्वर ज्योतिर्लिंगम्",
    location: "Ujjain (Avantikapuri), Shipra River",
    state: "Madhya Pradesh",
    deity: "Bhagavan Mahakaal (Kala-Bhairava)",
    circuit: "jyotirlinga",
    altitude: "492 m (Malwa Plateau)",
    circuitTag: "दक्षिण-मुखी स्वयंभू ज्योतिर्लिंग",
    bestTimeToVisit: "वर्ष पर्यन्त (श्रावण मास व महाशिवरात्रि विशेष)",
    description: "The unique Dakshin-mukhi Jyotirlinga in ancient Avantika where sacred Bhasma Aarti is offered before dawn, presiding over time and death.",
    liveDarshanAvailable: true,
    viewersCount: "11,800",
    aartiTimings: ["04:00 AM (Bhasma Aarti)", "07:30 AM (Dadyodak)", "10:30 AM (Bhog)", "05:00 PM (Sandhya)", "10:30 PM (Shayan)"],
    image: "/assets/Screenshot 2026-09-16 120739.png"
  },
  {
    id: "somnath",
    name: "Shri Somnath Jyotirlinga",
    sanskritName: "श्री सोमनाथ मन्दिरम्",
    location: "Prabhas Patan, Saurashtra",
    state: "Gujarat",
    deity: "Bhagavan Somnath",
    circuit: "jyotirlinga",
    altitude: "Sea Level (Arabian Coast)",
    circuitTag: "प्रथम ज्योतिर्लिंग (सौराष्ट्र)",
    bestTimeToVisit: "अक्टूबर से मार्च",
    description: "The first among the twelve Jyotirlingas, standing resplendently on the shores of the Arabian Sea as an eternal monument to the indestructible spirit of Sanatan Dharma.",
    liveDarshanAvailable: true,
    viewersCount: "5,310",
    aartiTimings: ["07:00 AM (Pratah Aarti)", "12:00 PM (Madhyan Aarti)", "07:00 PM (Sandhya Aarti)"],
    image: "/assets/Screenshot 2026-09-16 120619.png"
  },
  {
    id: "tirumala_balaji",
    name: "Tirumala Venkateswara Swamy",
    sanskritName: "श्री वेङ्कटेश्वर स्वामि मन्दिरम्",
    location: "Tirupati, Seshachalam Hills",
    state: "Andhra Pradesh",
    deity: "Lord Venkateswara (Balaji)",
    circuit: "major",
    altitude: "853 m (Seven Sacred Hills)",
    circuitTag: "कलयुग प्रत्यक्ष वैकुण्ठ",
    bestTimeToVisit: "सितंबर से फरवरी (ब्रह्मोत्सवम)",
    description: "The sanctum of Kaliyuga Varada Lord Venkateswara, where millions offer devotion and seek divine blessings of prosperity and liberation.",
    liveDarshanAvailable: true,
    viewersCount: "14,200",
    aartiTimings: ["03:00 AM (Suprabhatam)", "07:00 PM (Tomala Seva)", "11:00 PM (Ekantha Seva)"],
    image: "/assets/Screenshot 2026-09-16 115212.png"
  }
];

export const ARTICLES_DATA: Article[] = [
  {
    id: "art_1",
    title: "The Power of Daily Sadhana: Awakening Inner Stillness",
    category: "life_purpose",
    readTime: "4 min",
    summary: "Simple, potent daily practices to anchor the mind, purify the nervous system, and connect with your higher spiritual self.",
    quote: "मन एव मनुष्याणां कारणं बन्धमोक्षयोः — The mind alone is the cause of human bondage and liberation.",
    content: [
      "In the Vedic tradition, life is not merely a sequence of random days; it is a sacred journey of conscious evolution. Daily Sadhana (disciplined spiritual practice) is the anchor that prevents the mind from being tossed by the relentless waves of modern noise.",
      "Just 15 minutes of conscious morning breath awareness (Pranayama) coupled with sacred Japa aligns the autonomic nervous system, infusing the body with satva and clarity.",
      "Consistency triumphs over intensity. Chanting one mala of 108 beads with full reverence every sunrise transforms neural pathways more deeply than sporadic weekend retreats."
    ]
  },
  {
    id: "art_2",
    title: "Lessons from Bhagavad Gita for Modern Stress & Burnout",
    category: "dharma",
    readTime: "5 min",
    summary: "How ancient Nishkama Karma philosophy unlocks effortless executive clarity and freedom from outcome anxiety.",
    quote: "योगः कर्मसु कौशलम् — Yoga is supreme skill and equanimity in action.",
    content: [
      "Modern society equates self-worth with rapid outcome metrics. Lord Krishna anticipated this universal psychological crisis 5,000 years ago on the battlefield of Kurukshetra.",
      "When your focus is glued to the reward or fear of failure, mental bandwidth for the present task collapses. Nishkama Karma does not preach apathy; it teaches 100% devotion to the action itself while releasing anxious ownership over results.",
      "This single mental reorientation eliminates chronic burnout and restores natural joy to work."
    ]
  },
  {
    id: "art_3",
    title: "Sanatan Values in the AI Era: Consciousness Above Computation",
    category: "mind_soul",
    readTime: "6 min",
    summary: "Why ancient Rishis understood the fundamental boundary between computational logic and pure transcendent Chaitanya (Consciousness).",
    quote: "प्रज्ञानं ब्रह्म — Pure Consciousness is the ultimate foundation of reality.",
    content: [
      "As artificial intelligence mimics cognitive tasks, humanity is forced to confront the eternal question: 'What is truly conscious?'",
      "Vedic Darshana clearly delineates the mind (Manas), intellect (Buddhi), and ego (Ahamkara) as subtle Prakriti (matter/computation), distinct from the witnessing Self (Purusha / Atman).",
      "Sanatan Setu serves as a technological bridge reminding the digital age that while tools grow exponentially intelligent, the light of conscious purpose remains eternally rooted in the Divine."
    ]
  }
];

export function getTodayPanchang() {
  const date = new Date();
  const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const dateFormatted = date.toLocaleDateString('hi-IN', options);
  const dateEnglish = date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });

  // Dynamic Astronomical Vedic Panchang Calculation
  const currentYear = date.getFullYear();
  const vikramSamvatYear = currentYear + 57;

  // Lunar Phase Calculation from Jan 11 2024 New Moon Epoch
  const epoch = new Date('2024-01-11T11:57:00Z').getTime();
  const daysSinceEpoch = (date.getTime() - epoch) / (1000 * 60 * 60 * 24);
  const synodicMonth = 29.530588;
  const lunarPhase = ((daysSinceEpoch % synodicMonth) + synodicMonth) % synodicMonth;
  const tithiIndex = Math.floor(lunarPhase / (synodicMonth / 30)); // 0 to 29

  const tithiNames = [
    'प्रतिपदा', 'द्वितीया', 'तृतीया', 'चतुर्थी', 'पंचमी', 'षष्ठी',
    'सप्तमी', 'अष्टमी', 'नवमी', 'दशमी', 'एकादशी', 'द्वादशी',
    'त्रयोदशी', 'चतुर्दशी'
  ];

  let paksha = 'शुक्ल पक्ष';
  let tithi = 'प्रतिपदा';

  if (tithiIndex < 14) {
    paksha = 'शुक्ल पक्ष';
    tithi = `${tithiNames[tithiIndex]} (शुक्ल)`;
  } else if (tithiIndex === 14) {
    paksha = 'शुक्ल पक्ष';
    tithi = 'पूर्णिमा';
  } else if (tithiIndex < 29) {
    paksha = 'कृष्ण पक्ष';
    tithi = `${tithiNames[tithiIndex - 15]} (कृष्ण)`;
  } else {
    paksha = 'कृष्ण पक्ष';
    tithi = 'अमावस्या';
  }

  // Sidereal Moon Nakshatra (27 Nakshatras across 27.32166 days)
  const nakshatraNames = [
    'अश्विनी', 'भरणी', 'कृत्तिका', 'रोहिणी', 'मृगशिरा', 'आर्द्रा', 'पुनर्वसु', 'पुष्य',
    'आश्लेषा', 'मघा', 'पूर्वाफाल्गुनी', 'उत्तराफाल्गुनी', 'हस्त', 'चित्रा', 'स्वाति',
    'विशाखा', 'अनुराधा', 'ज्येष्ठा', 'मूल', 'पूर्वाषाढ़ा', 'उत्तराषाढ़ा', 'श्रवण',
    'धनिष्ठा', 'शतभिषा', 'पूर्वाभाद्रपद', 'उत्तराभाद्रपद', 'रेवती'
  ];
  const siderealMonth = 27.321661;
  const nakshatraIndex = Math.floor((((daysSinceEpoch + 19.8) % siderealMonth) + siderealMonth) % siderealMonth / (siderealMonth / 27)) % 27;
  const nakshatra = `${nakshatraNames[nakshatraIndex]} (शुभ)`;

  return {
    date: dateFormatted,
    dateEnglish,
    samvat: `विक्रम संवत् ${vikramSamvatYear}`,
    paksha,
    tithi,
    nakshatra,
    brahmaMuhurta: "04:30 AM – 05:18 AM",
    sunrise: "06:08 AM",
    sunset: "06:22 PM",
    auspiciousYoga: "अमृत सिद्धि योग",
    isCalculated: true,
    calculationNote: "सौर-चान्द्र चक्र गणना पर आधारित • स्थानीय पंचांग देशांतर अनुसार सूक्ष्म अंतर संभव है",
    shlokaOfDay: {
      sanskrit: "शान्ताकारं भुजगशयनं पद्मनाभं सुरेशं\nविश्वाधारं गगनसदृशं मेघवर्णं शुभाङ्गम् ।\nलक्ष्मीकान्तं कमलनयनं योगिभिर्ध्यानगम्यं\nवन्दे विष्णुं भवभयहरं सर्वलोकैकनाथम् ॥",
      meaning: "जिनका स्वरूप परम शांत है, जो शेषनाग की शैय्या पर शयन करते हैं, जिनकी नाभि में कमल है, जो संपूर्ण ब्रह्मांड के आधार हैं — उन भवभयहारी परमेश्वर को हम नमन करते हैं।"
    }
  };
}

export const DEEP_SCRIPTURES_DATA: Record<string, DeepScripture> = {
  rigveda: {
    id: "rigveda",
    title: "Rigveda Samhita",
    sanskritTitle: "ऋग्वेद संहिता (ज्ञानकाण्ड)",
    category: "veda",
    granthaName: "ऋग्वेद संहिता (Rigveda Samhita)",
    mandalaCount: 10,
    suktaCount: 1028,
    totalMantras: "10,552",
    affiliation: "शाकल शाखा • १० मण्डल • १०२८ सूक्त",
    introduction: "मानव सभ्यता का प्राचीनतम लिखित दिव्य ज्ञानग्रंथ। इसमें १० मण्डलों में देवताओं की स्तुतियां, ब्रह्मांडीय नियम (ऋत) और सार्वभौमिक एकता का अद्वैत दर्शन समाहित है।",
    totalChapters: 10,
    verses: [
      {
        chapter: 1,
        mandala: 1,
        sukta: 1,
        suktaName: "अग्नि सूक्त (Agni Sukta)",
        rishi: "मधुच्छन्दा वैश्वामित्र",
        devata: "अग्नि देव",
        chhandas: "गायत्री छन्द",
        verseNumber: 1,
        sanskrit: "ॐ अग्निमीळे पुरोहितं यज्ञस्य देवमृत्विजम् ।\nहोतारं रत्नधातमम् ॥",
        transliteration: "Om agnim īḷe purohitaṃ yajñasya devam ṛtvijam | hotāraṃ ratnadhātamam ||",
        padChhed: "अग्निम् । ईळे । पुरःऽहितम् । यज्ञस्य । देवम् । ऋत्विजम् । होतारम् । रत्नऽधातमम् ॥",
        hindiMeaning: "मैं यज्ञ के पुरोहित, दिव्य तेजस्वी, ऋत्विज (समय के ज्ञाता), होता (आह्वान करने वाले) और परम ऐश्वर्य (रत्न) धारण कराने वाले अग्नि देव की स्तुति करता हूँ।",
        englishMeaning: "I praise Agni, the chosen priest, god, minister of sacrifice, the invoker, and the greatest bestower of treasure."
      },
      {
        chapter: 1,
        mandala: 1,
        sukta: 191,
        suktaName: "सङ्गठन सूक्त (Sangathan Sukta)",
        rishi: "संवर्धन ऋषि",
        devata: "विश्वेदेवाः (एकता)",
        chhandas: "अनुष्टुप् छन्द",
        verseNumber: 2,
        sanskrit: "सं गच्छध्वं सं वदध्वं सं वो मनांसि जानताम् ।\nदेवा भागं यथा पूर्वे संजानाना उपासते ॥",
        transliteration: "Saṃ gacchadhvaṃ saṃ vadadhvaṃ saṃ vo manāṃsi jānatām | devā bhāgaṃ yathā pūrve sañjānānā upāsate ||",
        padChhed: "सम् । गच्छध्वम् । सम् । वदध्वम् । सम् । वः । मनांसि । जानताम् ।",
        hindiMeaning: "तुम सब एक साथ मिलकर चलो, एक साथ एक स्वर में बोलो, तुम्हारे मन एक समान चिंतन करें; जिस प्रकार प्राचीन काल में ज्ञानी देवजन एकमत होकर अपने यज्ञ भाग को ग्रहण करते थे।",
        englishMeaning: "Walk together, speak together, let your minds be in harmony, just as the ancient enlightened gods accepted their share with one mind."
      },
      {
        chapter: 1,
        mandala: 1,
        sukta: 191,
        suktaName: "सङ्ज्ञान सूक्त (Sangyana Sukta)",
        rishi: "संवर्धन ऋषि",
        devata: "समान मन",
        chhandas: "त्रिष्टुप् छन्द",
        verseNumber: 3,
        sanskrit: "समानो मन्त्रः समितिः समानी समानं मनः सह चित्तमेषाम् ।\nसमानं मन्त्रमभि मन्त्रये वः समानेन वो हविषा जुहोमि ॥",
        transliteration: "Samāno mantraḥ samitiḥ samānī samānaṃ manaḥ saha cittam eṣām...",
        padChhed: "समानः । मन्त्रः । समितिः । समानी । समानम् । मनः । सह । चित्तम् ।",
        hindiMeaning: "हमारा विचार समान हो, हमारी सभाएं समान हों, हमारा मन और हृदय एक समान उद्देश्य से जुड़े हों। मैं तुम्हें समान संकल्प की दीक्षा देता हूँ।",
        englishMeaning: "Common be their prayer, common their gathering, common their purpose, unified their heart. I offer your oblation with a unified intent."
      },
      {
        chapter: 2,
        mandala: 2,
        sukta: 1,
        suktaName: "वायु सूक्त (Vayu Sukta)",
        rishi: "गृत्समद ऋषि",
        devata: "वायु देव",
        chhandas: "गायत्री छन्द",
        verseNumber: 1,
        sanskrit: "वायवा याहि दर्शतेमे सोमा अरंकृताः ।\nतेषां पाहि श्रुधी हवम् ॥",
        transliteration: "Vāyav ā yāhi darśateme somā araṅkṛtāḥ | teṣāṃ pāhi śrudhī havam ||",
        padChhed: "वायो । आ । याहि । दर्शतेमे । सोमाः । अरम्ऽकृताः । तेषाम् । पाहि । श्रुधि । हवम् ॥",
        hindiMeaning: "हे दर्शनीय प्राणस्वरूप वायुदेव! पधारिए, ये पवित्र सोम रस आपके लिए तैयार किए गए हैं। हमारी प्रार्थना सुनकर इनका पान कीजिए।",
        englishMeaning: "O beautiful Vayu, come forth! These Soma libations are made ready for Thee; drink of them and hear our divine call."
      },
      {
        chapter: 2,
        mandala: 2,
        sukta: 1,
        suktaName: "प्राण स्तुति (Prana Stuti)",
        rishi: "गृत्समद ऋषि",
        devata: "वायु देव",
        chhandas: "गायत्री छन्द",
        verseNumber: 2,
        sanskrit: "वायवुक्येभिर्जरन्ते त्वामच्छा जरितारः ।\nसुतसोमा निवीतये ॥",
        transliteration: "Vāyav ukthebhir jarante tvām acchā jaritāraḥ | sutasomā nimīvaye ||",
        padChhed: "वायो । उक्थेभिः । जरन्ते । त्वाम् । अच्छा । जरितारः ।",
        hindiMeaning: "हे वायुदेव! सोम रस निष्पन्न करने वाले उपासक आपके परम सानिध्य के लिए पावन मन्त्रों द्वारा आपकी वन्दना करते हैं।",
        englishMeaning: "The chanters, having pressed the divine essence, praise Thee with solemn hymns to seek Thy divine grace."
      },
      {
        chapter: 3,
        mandala: 3,
        sukta: 62,
        suktaName: "अश्विन सूक्त (Ashvina Sukta)",
        rishi: "विश्वामित्र ऋषि",
        devata: "अश्विनीकुमार",
        chhandas: "गायत्री छन्द",
        verseNumber: 1,
        sanskrit: "अश्विना यज्वरीरिषो द्रवत्पाणी शुभस्पती ।\nपुरुभुजा चनस्यतम् ॥",
        transliteration: "Aśvinā yajvarīr iṣo dravatpāṇī śubhaspatī | purubhujā canasyatam ||",
        padChhed: "अश्विना । यज्वरीः । इषः । द्रवत्ऽपाणी । शुभः । पती ।",
        hindiMeaning: "हे शीघ्रगामी, शुभ के रक्षक, कल्याणकारी अश्विनीकुमारों! हमारे द्वारा प्रस्तुत यज्ञिय आहुतियों को आनंदपूर्वक स्वीकार करें।",
        englishMeaning: "O Ashvins, swift of action, lords of auspicious radiance and healers of beings, graciously accept our sacred offerings."
      },
      {
        chapter: 10,
        mandala: 10,
        sukta: 90,
        suktaName: "पुरुष सूक्त (Purusha Sukta)",
        rishi: "नारायण ऋषि",
        devata: "विराट् पुरुष (परब्रह्म)",
        chhandas: "अनुष्टुप् छन्द",
        verseNumber: 1,
        sanskrit: "सहस्रशीर्षा पुरुषः सहस्राक्षः सहस्रपात् ।\nस भूमिं विश्वतो वृत्वात्यतिष्ठद्दशाङ्गुलम् ॥",
        transliteration: "Sahasra-śīrṣā puruṣaḥ sahasrākṣaḥ sahasra-pāt | sa bhūmiṃ viśvato vṛtvā atyatiṣṭhad daśāṅgulam ||",
        padChhed: "सहस्रऽशीर्षा । पुरुषः । सहस्रऽअक्षः । सहस्रऽपात् । सः । भूमिम् । विश्वतः । वृत्वा ।",
        hindiMeaning: "वह विराट पुरुष सहस्रों सिर, सहस्रों नेत्र और सहस्रों चरणों वाला है। वह समस्त ब्रह्मांड को सब ओर से व्याप्त करके दस अंगुल और परे विद्यमान है।",
        englishMeaning: "The Cosmic Being has a thousand heads, a thousand eyes, and a thousand feet. Pervading the cosmos on every side, He transcends it by ten fingers' length."
      }
    ]
  },
  yajurveda: {
    id: "yajurveda",
    title: "Shukla Yajurveda",
    sanskritTitle: "शुक्ल यजुर्वेद (कर्मकाण्ड व शांतिपाठ)",
    category: "veda",
    affiliation: "वाजसनेयी माध्यन्दिन शाखा • ४० अध्याय",
    introduction: "यज्ञ, कर्म, सदाचार और विश्व कल्याण का व्यावहारिक वेद। इसका ४०वां अध्याय ही प्रसिद्ध 'ईशावास्योपनिषद्' है।",
    totalChapters: 40,
    verses: [
      {
        chapter: 1,
        verseNumber: 1,
        sanskrit: "ॐ द्यौः शान्तिरन्तरिक्षं शान्तिः पृथिवी शान्तिरापः शान्तिरोषधयः शान्तिः ।\nवनस्पतयः शान्तिर्विश्वेदेवाः शान्तिर्ब्रह्म शान्तिः सर्वं शान्तिः शान्तिरेव शान्तिः सा मा शान्तिरेधि ॥\nॐ शान्तिः शान्तिः शान्तिः ॥",
        transliteration: "Om dyauḥ śāntir antarikṣaṃ śāntiḥ pṛthivī śāntir āpaḥ śāntir oṣadhayaḥ śāntiḥ...",
        padChhed: "द्यौः । शान्तिः । अन्तरिक्षम् । शान्तिः । पृथिवी । शान्तिः ।",
        hindiMeaning: "द्युलोक शांत हो, अंतरिक्ष शांत हो, पृथ्वी शांत हो, जल शांत हो, औषधियां शांत हों, वनस्पतियां शांत हों, समस्त देवगण शांत हों, परब्रह्म शांत हो, सब कुछ शांत हो और वह शांति मुझे प्राप्त हो।",
        englishMeaning: "May there be peace in heaven, peace in the atmosphere, peace on earth, peace in waters, peace in herbs, peace in vegetation, peace in the divine, peace everywhere, and may that peace abide in me."
      },
      {
        chapter: 2,
        verseNumber: 1,
        sanskrit: "कुर्वन्नेवेह कर्माणि जिजीविषेच्छतं समाः ।\nएवं त्वयि नान्यथेतोऽस्ति न कर्म लिप्यते नरे ॥",
        transliteration: "Kurvann eveha karmāṇi jijīviṣec chataṃ samāḥ...",
        padChhed: "कुर्वन् । एव । इह । कर्माणि । जिजीविषेत् । शतम् । समाः ।",
        hindiMeaning: "इस संसार में निष्काम भाव से सत्कर्म करते हुए ही १०० वर्ष जीने की अभिलाषा करनी चाहिए। इसके अतिरिक्त अन्य कोई मार्ग नहीं है जिससे मनुष्य कर्मों के बंधन में न बंधे।",
        englishMeaning: "One should wish to live for a hundred years here on earth performing selfless duties with detachment. For you, there is no other way by which action will not cling to you."
      },
      {
        chapter: 3,
        verseNumber: 1,
        sanskrit: "नमस्ते रुद्र मन्यव उतो त इषवे नमः ।\nनमस्ते अस्तु धन्वने बाहुभ्यामुत ते नमः ॥",
        transliteration: "Namaste rudra manyava uto ta iṣave namaḥ | namaste astu dhanvane bāhubhyām uta te namaḥ ||",
        padChhed: "नमः । ते । रुद्र । मन्यवे । उत । ते । इषवे । नमः ।",
        hindiMeaning: "हे दुःखों का नाश करने वाले रुद्र! आपके क्रोध और बाणों को प्रणाम है। आपके धनुष और आपकी दोनों भुजाओं को बारंबार नमन है।",
        englishMeaning: "Salutations to Thy wrath, O Rudra, and homage to Thine arrow. Salutations to Thy bow and to both Thine arms."
      }
    ]
  },
  samaveda: {
    id: "samaveda",
    title: "Samaveda",
    sanskritTitle: "सामवेद (उपासनाकाण्ड व दिव्य गान)",
    category: "veda",
    affiliation: "कौथुम शाखा • १८७५ मन्त्र",
    introduction: "भगवान श्रीकृष्ण ने गीता में कहा है—'वेदानां सामवेदोऽस्मि' (वेदों में मैं सामवेद हूँ)। यह भारतीय शास्त्रीय संगीत और भक्ति रस का मूल स्रोत है।",
    totalChapters: 2,
    verses: [
      {
        chapter: 1,
        verseNumber: 1,
        sanskrit: "ॐ अग्न आयाहि वीतये गृणानो हव्यदातये ।\nनि होता सत्सि बर्हिषि ॥",
        transliteration: "Om agna āyāhi vītaye gṛṇāno havyadātaye | ni hotā satsi barhiṣi ||",
        padChhed: "अग्ने । आ । याहि । वीतये । गृणानः । हव्यऽदातये ।",
        hindiMeaning: "हे प्रकाशमय अग्निदेव! स्तुति किए जाने पर हमारी हवि को ग्रहण करने हेतु पधारें और यज्ञ की पवित्र कुशा पर आसीन हों।",
        englishMeaning: "Come, O glorious Agni, praised for the banquet, to receive the sacred offering, and take your seat as the divine priest upon the altar."
      },
      {
        chapter: 2,
        verseNumber: 1,
        sanskrit: "तं त्वा समिद्भिरङ्गिरो घृतेन वर्धयामसि ।\nबृहच्छोचा यविष्ठ्य ॥",
        transliteration: "Taṃ tvā samidbhir aṅgiro ghṛtena vardhayāmasi | bṛhac chocā yaviṣṭhya ||",
        padChhed: "तम् । त्वा । समिद्ऽभिः । अङ्गिरः । घृतेन । वर्धयामसि ।",
        hindiMeaning: "हे ज्ञानपुंज अग्नि! हम पवित्र समिधाओं और घृत से आपके दिव्य तेज को प्रज्वलित करते हैं; आप हमारे भीतर ज्ञान का महाप्रकाश भर दें।",
        englishMeaning: "Thee with sacred faggots and with clarified butter we magnify, O radiant one; shine forth with resplendent illumination."
      }
    ]
  },
  atharvaveda: {
    id: "atharvaveda",
    title: "Atharvaveda",
    sanskritTitle: "अथर्ववेद (ब्रह्मवेद व जीवन विज्ञान)",
    category: "veda",
    affiliation: "शौनक शाखा • २० काण्ड • ७३० सूक्त",
    introduction: "दैनिक जीवन, पर्यावरण, आयुर्वेद, राष्ट्र रक्षा और भूमि-वंदना का व्यावहारिक महावेद। इसका १२वें काण्ड का 'भूमि सूक्त' पर्यावरण रक्षा का विश्व में प्रथम घोषणापत्र है।",
    totalChapters: 20,
    verses: [
      {
        chapter: 1,
        verseNumber: 1,
        sanskrit: "ये त्रिषप्ताः परियन्ति विश्वा रूपाणि बिभ्रतः ।\nवाचस्पतिर्बला तेषां तन्वो अद्य दधातु मे ॥",
        transliteration: "Ye triṣaptāḥ pariyanti viśvā rūpāṇi bibhrataḥ | vācaspatir balā teṣāṃ tanvo adya dadhātu me ||",
        padChhed: "ये । त्रिऽसप्ताः । परिऽयन्ति । विश्वा । रूपाणि । बिभ्रतः ।",
        hindiMeaning: "जो इक्कीस प्रकार की सृष्टि शक्तियां समस्त रूपों को धारण करती हुई व्याप्त हैं, वाणी के स्वामी परमात्मा आज उन सबकी सामर्थ्य मेरे शरीर व मन में प्रतिष्ठित करें।",
        englishMeaning: "May the Lord of Speech bestow upon me today the power and strength of those divine celestial forces that sustain the universe."
      },
      {
        chapter: 2,
        verseNumber: 1,
        sanskrit: "माता भूमिः पुत्रो अहं पृथिव्याः ।\nपर्जन्यः पिता स उ नः पिपर्तु ॥",
        transliteration: "Mātā bhūmiḥ putro ahaṃ pṛthivyāḥ | parjanyaḥ pitā sa u naḥ pipartu ||",
        padChhed: "माता । भूमिः । पुत्रः । अहम् । पृथिव्याः ।",
        hindiMeaning: "यह पवित्र पृथ्वी मेरी माता है और मैं इस मातृभूमि का पुत्र हूँ। मेघ हमारे पिता हैं, वे हमारा पालन-पोषण करें।",
        englishMeaning: "Earth is my Mother, and I am the son of the Earth. The rain-bearing sky is our protector and nourisher."
      }
    ]
  },
  isha_upanishad: {
    id: "isha_upanishad",
    title: "Isha Upanishad",
    sanskritTitle: "ईशावास्योपनिषद् (शुक्ल यजुर्वेद)",
    category: "upanishad",
    affiliation: "वेदान्त दर्शन • १८ मन्त्र",
    introduction: "उपनिषदों में सर्वप्रधान। यह सिखाता है कि संपूर्ण चर-अचर जगत में एक ही परमात्मा व्याप्त है। त्यागपूर्वक भोग करने से ही सच्चा आनंद मिलता है।",
    totalChapters: 1,
    verses: [
      {
        chapter: 1,
        verseNumber: 1,
        sanskrit: "ॐ पूर्णमदः पूर्णमिदं पूर्णात्पूर्णमुदच्यते ।\nपूर्णस्य पूर्णमादाय पूर्णमेवावशिष्यते ॥\nॐ शान्तिः शान्तिः शान्तिः ॥",
        transliteration: "Om pūrṇam adaḥ pūrṇam idaṃ pūrṇāt pūrṇam udacyate | pūrṇasya pūrṇam ādāya pūrṇam evāvaśiṣyate ||",
        padChhed: "पूर्णम् । अदः । पूर्णम् । इदम् । पूर्णात् । पूर्णम् । उदच्यते ।",
        hindiMeaning: "वह परब्रह्म परमात्मा पूर्ण है, यह व्यक्त जगत भी पूर्ण है। पूर्ण से ही पूर्ण की उत्पत्ति होती है। पूर्ण में से पूर्ण निकाल लेने पर भी पूर्ण ही शेष रहता है।",
        englishMeaning: "That invisible transcendent reality is Whole, this visible cosmos is Whole. From the Whole arises the Whole. Even when the Whole is taken from the Whole, the Whole alone remains."
      },
      {
        chapter: 1,
        verseNumber: 2,
        sanskrit: "ईशा वास्यमिदं सर्वं यत्किञ्च जगत्यां जगत् ।\nतेन त्यक्तेन भुञ्जीथा मा गृधः कस्यस्विद्धनम् ॥",
        transliteration: "Īśā vāsyam idaṃ sarvaṃ yat kiñca jagatyāṃ jagat | tena tyaktena bhuñjīthā mā gṛdhaḥ kasya svid dhanam ||",
        padChhed: "ईशा । वास्यम् । इदम् । सर्वम् । यत् । किञ्च । जगत्याम् । जगत् ।",
        hindiMeaning: "इस संसार में जो कुछ भी गतिशील या स्थिर है, वह सब ईश्वर से व्याप्त है। अतः त्याग भाव से उसका उपभोग करो, किसी के धन की लालसा मत करो।",
        englishMeaning: "All this, whatever moves in this moving world, is enveloped by the Divine. Enjoy life through sacred detachment; do not covet anyone's wealth."
      },
      {
        chapter: 1,
        verseNumber: 3,
        sanskrit: "यस्तु सर्वाणि भूतान्यात्मन्येवानुपश्यति ।\nसर्वभूतेषु चात्मानं ततो न विजुगुप्सते ॥",
        transliteration: "Yas tu sarvāṇi bhūtāny ātmany evānupaśyati | sarvabhūteṣu cātmānaṃ tato na vijugupsate ||",
        padChhed: "यः । तु । सर्वाणि । भूतानि । आत्मनि । एव । अनुपश्यति ।",
        hindiMeaning: "जो मनुष्य संपूर्ण प्राणियों को अपनी ही आत्मा में देखता है और अपनी आत्मा को सब प्राणियों में देखता है, वह कभी किसी से घृणा या द्वेष नहीं करता।",
        englishMeaning: "He who perceives all living beings in his own Self and his own Self in all living beings, can never harbor hatred towards anyone."
      }
    ]
  },
  gita_deep: {
    id: "gita_deep",
    title: "Shrimad Bhagavad Gita",
    sanskritTitle: "श्रीमद्भगवद्गीता (सांख्य एवं कर्मयोग)",
    category: "gita",
    affiliation: "महाभारत भीष्मपर्व • १८ अध्याय • ७०० श्लोक",
    introduction: "कुरुक्षेत्र के धर्मक्षेत्र में भगवान योगेश्वर श्रीकृष्ण द्वारा अर्जुन को दिया गया परम आध्यात्मिक उपदेश, जो प्रत्येक युग में मनुष्य के जीवन संग्राम का मार्गदर्शक है।",
    totalChapters: 18,
    verses: [
      {
        chapter: 1,
        verseNumber: 1,
        sanskrit: "धर्मक्षेत्रे कुरुक्षेत्रे समवेता युयुत्सवः ।\nमामकाः पाण्डवाश्चैव किमकुर्वत सञ्जय ॥",
        transliteration: "Dharma-kṣetre kuru-kṣetre samavetā yuyutsavaḥ | māmakāḥ pāṇḍavāś caiva kim akurvata sañjaya ||",
        padChhed: "धर्मऽक्षेत्रे । कुरुऽक्षेत्रे । समवेताः । युयुत्सवः । मामकाः । पाण्डवाः । च । एव ।",
        hindiMeaning: "धृतराष्ट्र ने कहा: हे संजय! धर्मभूमि कुरुक्षेत्र में युद्ध की इच्छा से एकत्र हुए मेरे और पाण्डु के पुत्रों ने क्या किया?",
        englishMeaning: "Dhritarashtra said: O Sanjaya, assembled on the sacred field of Kurukshetra, eager to fight, what did my sons and the sons of Pandu do?"
      },
      {
        chapter: 1,
        verseNumber: 28,
        sanskrit: "दृष्ट्वेमं स्वजनं कृष्ण युयुत्सुं समुपस्थितम् ।\nसीदन्ति मम गात्राणि मुखं च परिशुष्यति ॥",
        transliteration: "Dṛṣṭvemaṃ svajanaṃ kṛṣṇa yuyutsuṃ samupasthitam | sīdanti mama gātrāṇi mukhaṃ ca pariśuṣyati ||",
        padChhed: "दृष्ट्वा । इमम् । स्वऽजनम् । कृष्ण । युयुत्सुम् । सम्ऽउपस्थितम् ।",
        hindiMeaning: "अर्जुन ने कहा: हे कृष्ण! युद्ध की इच्छा से सामने उपस्थित अपने इन स्वजनों को देखकर मेरे अंग शिथिल हो रहे हैं और मुख सूख रहा है।",
        englishMeaning: "Arjuna said: Seeing these my own kinsmen gathered here eager for battle, O Krishna, my limbs fail and my mouth is parched."
      },
      {
        chapter: 2,
        verseNumber: 47,
        sanskrit: "कर्मण्येवाधिकारस्ते मा फलेषु कदाचन ।\nमा कर्मफलहेतुर्भूर्मा ते सङ्गोऽस्त्वकर्मणि ॥",
        transliteration: "Karmaṇy evādhikāras te mā phaleṣu kadācana | mā karmaphalahetur bhūr mā te saṅgo 'stv akarmaṇi ||",
        padChhed: "कर्मणि । एव । अधिकारः । ते । मा । फलेषु । कदाचन ।",
        hindiMeaning: "तुम्हारा अधिकार केवल कर्म करने में है, उसके फलों में कभी नहीं। इसलिए कर्मफल की इच्छा से कर्म मत करो और कर्म न करने में भी तुम्हारी आसक्ति न हो।",
        englishMeaning: "You have a right only to work, never to its fruits. Let not the fruit of action be your motive, nor let your attachment be to inaction."
      },
      {
        chapter: 2,
        verseNumber: 22,
        sanskrit: "वासांसि जीर्णानि यथा विहाय नवानि गृह्णाति नरोऽपराणि ।\nतथा शरीराणि विहाय जीर्ण्यान्यन्यानि संयाति नवानि देही ॥",
        transliteration: "Vāsāṃsi jīrṇāni yathā vihāya navāni gṛhṇāti naro 'parāṇi...",
        padChhed: "वासांसि । जीर्णानि । यथा । विहाय । नवानि । गृह्णाति । नरः । अपराणि ।",
        hindiMeaning: "जैसे मनुष्य पुराने वस्त्रों को त्यागकर नए वस्त्र धारण करता है, वैसे ही जीवात्मा पुराने शरीरों को छोड़कर नए शरीरों को प्राप्त करती है।",
        englishMeaning: "As a person casts off worn-out garments and puts on new ones, so does the embodied soul cast off worn-out bodies and enter into others that are new."
      },
      {
        chapter: 2,
        verseNumber: 23,
        sanskrit: "नैनं छिन्दन्ति शस्त्राणि नैनं दहति पावकः ।\nन चैनं क्लेदयन्त्यापो न शोषयति मारुतः ॥",
        transliteration: "Nainaṃ chindanti śastrāṇi nainaṃ dahati pāvakaḥ | na cainaṃ kledayanty āpo na śoṣayati mārutaḥ ||",
        padChhed: "न । एनम् । छिन्दन्ति । शस्त्राणि । न । एनम् । दहति । पावकः ।",
        hindiMeaning: "इस आत्मा को शस्त्र काट नहीं सकते, अग्नि जला नहीं सकती, जल इसे गीला नहीं कर सकता और वायु इसे सुखा नहीं सकती। यह अविनाशी है।",
        englishMeaning: "Weapons cleave it not, fire burns it not, water drench it not, and wind dry it not. The soul is eternal, immutable, and indestructible."
      },
      {
        chapter: 3,
        verseNumber: 21,
        sanskrit: "यद्यदाचरति श्रेष्ठस्तत्तदेवेतरो जनः ।\nस यत्प्रमाणं कुरुते लोकस्तदनुवर्तते ॥",
        transliteration: "Yad yad ācarati śreṣṭhas tat tad evetaro janaḥ | sa yat pramāṇaṃ kurute lokas tad anuvartate ||",
        padChhed: "यत् । यत् । आचरति । श्रेष्ठः । तत् । तत् । एव । इतरः । जनः ।",
        hindiMeaning: "श्रेष्ठ पुरुष जैसा आचरण करता है, अन्य लोग भी वैसा ही अनुसरण करते हैं; वह जो आदर्श प्रस्तुत करता है, समस्त संसार उसी का अनुगमन करता है।",
        englishMeaning: "Whatever standard a great man sets by his conduct, common men follow. Whatever ideal he demonstrates, the world emulates."
      }
    ]
  }
};

