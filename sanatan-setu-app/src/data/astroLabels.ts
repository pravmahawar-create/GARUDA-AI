import type { Language } from '../types';

export interface AstroLabels {
  tabNameMilan: string;
  tabNumerology: string;
  tabPalmistry: string;
  nameMilanTitle: string;
  nameMilanSub: string;
  nameMilanDisclaimer: string;
  numerologyTitle: string;
  numerologySub: string;
  numerologyDisclaimer: string;
  palmistryTitle: string;
  palmistryDisclaimer: string;
  lifePathLabel: string;
  destinyLabel: string;
  soulUrgeLabel: string;
  birthdayLabel: string;
  personalYearLabel: string;
  northChart: string;
  southChart: string;
  planetPositions: string;
  kundliNeedAll: string;
  kundliError: string;
  kundliNeedBirth: string;
  kundliDisclaimer: string;
  milanNeedBirth: string;
  milanDisclaimer: string;
  prevChapter: string;
  nextChapter: string;
}

const CHROME: AstroLabels = {
  tabNameMilan: 'नाम राशि',
  tabNumerology: 'अंक ज्योतिष',
  tabPalmistry: 'हस्तरेखा',
  nameMilanTitle: 'नाम राशि मिलान',
  nameMilanSub: 'वर व कन्या के नाम की पहली ध्वनि से नाम राशि मिलान करें। पारंपरिक शुभ अक्षर भी दिखेंगे।',
  nameMilanDisclaimer: 'सत्यनिष्ठा: नाम राशि मिलान शैक्षिक मार्गदर्शन है। पूर्ण विवाह-निर्णय हेतु जन्म कुण्डली व अष्टकूट गुण अध्ययन आवश्यक है।',
  numerologyTitle: 'अंक ज्योतिष (Numerology)',
  numerologySub: 'नाम व जन्म तिथि से जीवन पथ, भाग्य व आत्म-इच्छा अंक ज्ञात करें।',
  numerologyDisclaimer: 'सत्यनिष्ठा: अंक शास्त्र शैक्षिक व मार्गदर्शक है — कोई निश्चित भविष्य-दावा नहीं।',
  palmistryTitle: 'हस्तरेखा विज्ञान',
  palmistryDisclaimer: 'सत्यनिष्ठा: शैक्षिक अध्ययन मात्र। चिकित्सा/वित्त निर्णय हेतु योग्य सलाहकार से परामर्श लें।',
  lifePathLabel: 'जीवन पथ',
  destinyLabel: 'भाग्य',
  soulUrgeLabel: 'आत्म इच्छा',
  birthdayLabel: 'जन्मांक',
  personalYearLabel: 'वर्षांक',
  northChart: 'उत्तर भारतीय',
  southChart: 'दक्षिण भारतीय',
  planetPositions: 'ग्रह स्थिति',
  kundliNeedAll: 'कृपया नाम, जन्म तिथि, समय व जन्म स्थान भरें।',
  kundliError: 'गणना में त्रुटि। पुनः प्रयास करें।',
  kundliNeedBirth: 'सटीक लग्न कुण्डली हेतु नाम, जन्म समय व जन्म स्थान अनिवार्य है।',
  kundliDisclaimer: 'सत्यनिष्ठा प्रकटीकरण: यह कुण्डली astronomy-engine व लाहिरी निरयण से जन्म समय-स्थान पर आधारित है। फल-विवेचन परामर्शित है।',
  milanNeedBirth: 'वर व कन्या — दोनों का नाम, जन्म तिथि, समय व स्थान अनिवार्य है।',
  milanDisclaimer: 'सत्यनिष्ठा परामर्श: अष्टकूट प्राथमिक वैदिक मापदंड है। परिपक्व निर्णय हेतु सप्तम भाव, गुरु/शुक्र व दशा-अध्ययन आवश्यक।',
  prevChapter: 'पिछला',
  nextChapter: 'अगला'
};

type AstroMap = Record<Language, AstroLabels>;

const EN: AstroLabels = {
  ...CHROME,
  tabNameMilan: 'Name Milan',
  tabNumerology: 'Numerology',
  tabPalmistry: 'Palmistry',
  nameMilanTitle: 'Name Rashi Milan',
  nameMilanSub: 'Match bride & groom name sounds to traditional Naam Rashi. Lucky syllables shown.',
  nameMilanDisclaimer: 'Honesty: Name milan is educational guidance. Full marriage decisions need Kundli + Ashtakoot study.',
  numerologyTitle: 'Numerology',
  numerologySub: 'Compute life path, destiny and soul-urge numbers from name and DOB.',
  numerologyDisclaimer: 'Honesty: Numerology is educational guidance — no fixed future claims.',
  palmistryTitle: 'Palmistry Science',
  palmistryDisclaimer: 'Honesty: educational study only. Consult a qualified advisor for medical/financial decisions.',
  lifePathLabel: 'Life Path',
  destinyLabel: 'Destiny',
  soulUrgeLabel: 'Soul Urge',
  birthdayLabel: 'Birthday',
  personalYearLabel: 'Personal Year',
  northChart: 'North Indian',
  southChart: 'South Indian',
  planetPositions: 'Planet Positions',
  kundliNeedAll: 'Please fill name, DOB, time and birth place.',
  kundliError: 'Calculation error. Please try again.',
  kundliNeedBirth: 'Name, birth time and place are required for accurate Lagna Kundli.',
  kundliDisclaimer: 'Disclosure: chart uses astronomy-engine with Lahiri ayanamsa from birth time & place. Interpretation is advisory.',
  milanNeedBirth: 'Both groom and bride need name, DOB, time and place.',
  milanDisclaimer: 'Honesty: Ashtakoot is the primary Vedic metric. Mature decisions also need 7th house, Guru/Venus and Dasha study.',
  prevChapter: 'Previous',
  nextChapter: 'Next'
};

const hi: AstroLabels = CHROME;

const partial = (overrides: Partial<AstroLabels>): AstroLabels => ({ ...CHROME, ...overrides });

const ASTRO_MAP: Partial<AstroMap> = {
  en: EN,
  hi,
  // Regional languages: chrome keys localized; body text in components uses lang==='en' ? en : hi
  kn: partial({
    tabNameMilan: 'ಹೆಸರು ರಾಶಿ',
    tabNumerology: 'ಅಂಕ ಜ್ಯೋತಿಷ್ಯ',
    tabPalmistry: 'ಹಸ್ತರೇಖೆ',
    nameMilanTitle: 'ಹೆಸರು ರಾಶಿ ಮಿಲನ',
    numerologyTitle: 'ಅಂಕ ಜ್ಯೋತಿಷ್ಯ',
    palmistryTitle: 'ಹಸ್ತರೇಖಾ ಶಾಸ್ತ್ರ',
    northChart: 'ಉತ್ತರ ಭಾರತೀಯ',
    southChart: 'ದಕ್ಷಿಣ ಭಾರತೀಯ',
    lifePathLabel: 'ಜೀವನ ಪಥ',
    destinyLabel: 'ಭಾಗ್ಯ',
    soulUrgeLabel: 'ಆತ್ಮ ಇಚ್ಛೆ',
    birthdayLabel: 'ಜನ್ಮಾಂಕ',
    personalYearLabel: 'ವರ್ಷಾಂಕ',
    prevChapter: 'ಹಿಂದಿನ',
    nextChapter: 'ಮುಂದಿನ'
  }),
  ml: partial({
    tabNameMilan: 'പേര് രാശി',
    tabNumerology: 'അക്ക ജ്യോതിഷം',
    tabPalmistry: 'ഹസ്തരേഖ',
    nameMilanTitle: 'പേര് രാശി മിലനം',
    numerologyTitle: 'അക്ക ജ്യോതിഷം',
    palmistryTitle: 'ഹസ്തരേഖാ ശാസ്ത്രം',
    northChart: 'ഉത്തരേന്ത്യൻ',
    southChart: 'ദക്ഷിണേന്ത്യൻ',
    lifePathLabel: 'ജീവന പാത',
    destinyLabel: 'ഭാഗ്യം',
    soulUrgeLabel: 'ആത്മാഭിലാഷം',
    birthdayLabel: 'ജന്മാംകം',
    personalYearLabel: 'വർഷാംകം',
    prevChapter: 'മുൻപത്തെ',
    nextChapter: 'അടുത്തത്'
  }),
  tcy: partial({
    tabNameMilan: 'ಪುಲ್ ರಾಶಿ',
    tabNumerology: 'ಅಂಕೊ ಜ್ಯೋತಿಷೊ',
    tabPalmistry: 'ಕೈಪಟ್ಟು',
    nameMilanTitle: 'ಪುಲ್ ರಾಶಿ ಮಿಲನೊ',
    numerologyTitle: 'ಅಂಕೊ ಜ್ಯೋತಿಷೊ',
    palmistryTitle: 'ಕೈಪಟ್ಟು ಶಾಸ್ತ್ರೊ',
    northChart: 'ಉತ್ತರ ಭಾರತೊ',
    southChart: 'ದಕ್ಷಿಣ ಭಾರತೊ',
    lifePathLabel: 'ಜೀವನೊ ಪಥೊ',
    destinyLabel: 'ಭಾಗ್ಯೊ',
    soulUrgeLabel: 'ಆತ್ಮೊ ಇಚ್ಛೆ',
    birthdayLabel: 'ಜನ್ಮಾಂಕೊ',
    personalYearLabel: 'ವರ್ಷಾಂಕೊ',
    prevChapter: 'ಒಪ್ಪುನೆ',
    nextChapter: 'ಮುಖೆನೆ'
  }),
  te: partial({
    tabNameMilan: 'పేరు రాశి',
    tabNumerology: 'అంక జ్యోతిష్యం',
    tabPalmistry: 'హస్తరేఖ',
    nameMilanTitle: 'పేరు రాశి మిలనం',
    numerologyTitle: 'అంక జ్యోతిష్యం',
    palmistryTitle: 'హస్తరేఖా శాస్త్రం',
    northChart: 'ఉత్తర భారతీయ',
    southChart: 'దక్షిణ భారతీయ',
    lifePathLabel: 'జీవన పథం',
    destinyLabel: 'భాగ్యం',
    soulUrgeLabel: 'ఆత్మ కోరిక',
    birthdayLabel: 'జన్మాంకం',
    personalYearLabel: 'సంవత్సరాంకం',
    prevChapter: 'మునుపటి',
    nextChapter: 'తదుపరి'
  }),
  ta: partial({
    tabNameMilan: 'பெயர் ராசி',
    tabNumerology: 'எண் ஜோதிடம்',
    tabPalmistry: 'கைரேகை',
    nameMilanTitle: 'பெயர் ராசி மிலன்',
    numerologyTitle: 'எண் ஜோதிடம்',
    palmistryTitle: 'கைரேகை சாஸ்திரம்',
    northChart: 'வட இந்திய',
    southChart: 'தென் இந்திய',
    lifePathLabel: 'வாழ்க்கை பாதை',
    destinyLabel: 'தலைவிதி',
    soulUrgeLabel: 'ஆன்ம விருப்பம்',
    birthdayLabel: 'பிறந்த எண்',
    personalYearLabel: 'ஆண்டு எண்',
    prevChapter: 'முந்தைய',
    nextChapter: 'அடுத்து'
  }),
  mr: partial({
    tabNameMilan: 'नाव राशी',
    tabNumerology: 'अंक ज्योतिष',
    tabPalmistry: 'हस्तरेखा',
    nameMilanTitle: 'नाव राशी मिलन',
    numerologyTitle: 'अंक ज्योतिष',
    palmistryTitle: 'हस्तरेखा शास्त्र',
    northChart: 'उत्तर भारतीय',
    southChart: 'दक्षिण भारतीय',
    lifePathLabel: 'जीवन पथ',
    destinyLabel: 'भाग्य',
    soulUrgeLabel: 'आत्मइच्छा',
    birthdayLabel: 'जन्मांक',
    personalYearLabel: 'वर्षांक',
    prevChapter: 'मागील',
    nextChapter: 'पुढील'
  }),
  gu: partial({
    tabNameMilan: 'નામ રાશિ',
    tabNumerology: 'અંક જ્યોતિષ',
    tabPalmistry: 'હસ્તરેખા',
    nameMilanTitle: 'નામ રાશિ મિલન',
    numerologyTitle: 'અંક જ્યોતિષ',
    palmistryTitle: 'હસ્તરેખા શાસ્ત્ર',
    northChart: 'ઉત્તર ભારતીય',
    southChart: 'દક્ષિણ ભારતીય',
    lifePathLabel: 'જીવન પથ',
    destinyLabel: 'ભાગ્ય',
    soulUrgeLabel: 'આત્મ ઇચ્છા',
    birthdayLabel: 'જન્માંક',
    personalYearLabel: 'વર્ષાંક',
    prevChapter: 'આગલું',
    nextChapter: 'પછીનું'
  }),
  bn: partial({
    tabNameMilan: 'নাম রাশি',
    tabNumerology: 'অংক জ্যোতিষ',
    tabPalmistry: 'হস্তরেখা',
    nameMilanTitle: 'নাম রাশি মিলান',
    numerologyTitle: 'অংক জ্যোতিষ',
    palmistryTitle: 'হস্তরেখা বিদ্যা',
    northChart: 'উত্তর ভারতীয়',
    southChart: 'দক্ষিণ ভারতীয়',
    lifePathLabel: 'জীবন পথ',
    destinyLabel: 'ভাগ্য',
    soulUrgeLabel: 'আত্মাভীষ্ট',
    birthdayLabel: 'জন্মাংক',
    personalYearLabel: 'বর্ষাংক',
    prevChapter: 'আগের',
    nextChapter: 'পরের'
  }),
  as: partial({
    tabNameMilan: 'নামৰ ৰাশি',
    tabNumerology: 'অংক জ্যোতিষ',
    tabPalmistry: 'হস্তৰেখা',
    nameMilanTitle: 'নামৰ ৰাশি মিলন',
    numerologyTitle: 'অংক জ্যোতিষ',
    palmistryTitle: 'হস্তৰেখা বিদ্যা',
    northChart: 'উত্তৰ ভাৰতীয়',
    southChart: 'দক্ষিণ ভাৰতীয়',
    lifePathLabel: 'জীৱন পথ',
    destinyLabel: 'ভাগ্য',
    soulUrgeLabel: 'আত্মাভিলিষ্ট',
    birthdayLabel: 'জন্মাংক',
    personalYearLabel: 'বৰ্ষাংক',
    prevChapter: 'আগৰ',
    nextChapter: 'পিছৰ'
  }),
  bho: partial({
    tabNameMilan: 'नाम राशि',
    tabNumerology: 'अंक ज्योतिष',
    tabPalmistry: 'हस्तरेखा',
    nameMilanTitle: 'नाम राशि मिलान',
    numerologyTitle: 'अंक ज्योतिष',
    palmistryTitle: 'हस्तरेखा विद्या',
    northChart: 'उत्तर भारतीय',
    southChart: 'दक्षिण भारतीय',
    lifePathLabel: 'जीवन पथ',
    destinyLabel: 'भाग्य',
    soulUrgeLabel: 'आत्म इच्छा',
    birthdayLabel: 'जन्मांक',
    personalYearLabel: 'वर्षांक',
    prevChapter: 'पहिले के',
    nextChapter: 'आगे के'
  }),
  or: partial({
    tabNameMilan: 'ନାମ ରାଶି',
    tabNumerology: 'ଅଙ୍କ ଜ୍ୟୋତିଷ',
    tabPalmistry: 'ହସ୍ତରେଖା',
    nameMilanTitle: 'ନାମ ରାଶି ମିଳନ',
    numerologyTitle: 'ଅଙ୍କ ଜ୍ୟୋତିଷ',
    palmistryTitle: 'ହସ୍ତରେଖା ବିଦ୍ୟା',
    northChart: 'ଉତ୍ତର ଭାରତୀୟ',
    southChart: 'ଦକ୍ଷିଣ ଭାରତୀୟ',
    lifePathLabel: 'ଜୀବନ ପଥ',
    destinyLabel: 'ଭାଗ୍ୟ',
    soulUrgeLabel: 'ଆତ୍ମ ଇଚ୍ଛା',
    birthdayLabel: 'ଜନ୍ମାଙ୍କ',
    personalYearLabel: 'ବର୍ଷାଙ୍କ',
    prevChapter: 'ପୂର୍ବବର୍ତ୍ତୀ',
    nextChapter: 'ପରବର୍ତ୍ତୀ'
  }),
  hne: partial({
    tabNameMilan: 'नाम राशि',
    tabNumerology: 'अंक ज्योतिष',
    tabPalmistry: 'हाथरेखा',
    nameMilanTitle: 'नाम राशि मिलन',
    numerologyTitle: 'अंक ज्योतिष',
    palmistryTitle: 'हाथरेखा विद्या',
    northChart: 'उत्तर भारतीय',
    southChart: 'दक्षिण भारतीय',
    lifePathLabel: 'जीवन पथ',
    destinyLabel: 'भाग्य',
    soulUrgeLabel: 'आत्म इच्छा',
    birthdayLabel: 'जन्मांक',
    personalYearLabel: 'वर्षांक',
    prevChapter: 'आगिल',
    nextChapter: 'पछिला'
  }),
  sa: partial({
    tabNameMilan: 'नामराशि मिलनम्',
    tabNumerology: 'अंकज्योतिषम्',
    tabPalmistry: 'हस्तरेखाविद्या',
    nameMilanTitle: 'नामराशि मिलनम्',
    numerologyTitle: 'अंकज्योतिषम्',
    palmistryTitle: 'हस्तरेखाशास्त्रम्',
    northChart: 'उत्तरभारतीयम्',
    southChart: 'दक्षिणभारतीयम्',
    lifePathLabel: 'जीवनपथः',
    destinyLabel: 'भाग्यम्',
    soulUrgeLabel: 'आत्मेच्छा',
    birthdayLabel: 'जन्मांकः',
    personalYearLabel: 'वर्षांकः',
    prevChapter: 'पूर्वम्',
    nextChapter: 'परम्'
  })
};

export function getAstroLabels(lang: Language): AstroLabels {
  return ASTRO_MAP[lang] || CHROME;
}
