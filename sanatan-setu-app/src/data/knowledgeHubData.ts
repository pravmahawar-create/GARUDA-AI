import type {
  KnowledgeHubCategory, DarshanItem, RishiItem,
  SamskaraItem, FestivalItem, ItihasItem
} from '../types';

export const KNOWLEDGE_HUB_CATEGORIES: KnowledgeHubCategory[] = [
  {
    id: 'vedas',
    titleHindi: 'चार वेद',
    titleEnglish: 'The Four Vedas',
    tagline: 'श्रुति परंपरा • ऋग्वेद, यजुर्वेद, सामवेद, अथर्ववेद',
    countBadge: '४ वेद, २०,०००+ मंत्र',
    iconName: 'BookOpen',
    routeKey: 'vedas',
    image: '/assets/Screenshot 2026-09-16 120715.png'
  },
  {
    id: 'upanishads',
    titleHindi: 'प्रमुख उपनिषद्',
    titleEnglish: 'Principal Upanishads',
    tagline: 'वेदान्त ज्ञान • ईश, केन, कठ, मुण्डक, माण्डूक्य',
    countBadge: '१० मुख्य उपनिषद्',
    iconName: 'Scroll',
    routeKey: 'upanishads',
    image: '/assets/Screenshot 2026-09-16 120730.png'
  },
  {
    id: 'gita',
    titleHindi: 'श्रीमद्भगवद्गीता',
    titleEnglish: 'Shrimad Bhagavad Gita',
    tagline: 'योगेश्वर श्रीकृष्ण की अमर वाणी • निष्काम कर्मयोग',
    countBadge: '१८ अध्याय, ७०० श्लोक',
    iconName: 'Sparkles',
    routeKey: 'gita',
    image: '/assets/Screenshot 2026-09-16 114937.png'
  },
  {
    id: 'puranas',
    titleHindi: '१८ महापुराण',
    titleEnglish: '18 Mahapuranas',
    tagline: 'महर्षि वेदव्यास प्रणीत सात्विक, राजसिक व तामसिक पुराण',
    countBadge: '१८ पुराण, ४,००,००० श्लोक',
    iconName: 'Flame',
    routeKey: 'puranas',
    image: '/assets/Screenshot 2026-09-16 120635.png'
  },
  {
    id: 'darshan',
    titleHindi: 'षड् दर्शन',
    titleEnglish: '6 Schools of Philosophy',
    tagline: 'सांख्य, योग, न्याय, वैशेषिक, मीमांसा एवं वेदान्त',
    countBadge: '६ आस्तिक दर्शन',
    iconName: 'Eye',
    routeKey: 'darshan',
    image: '/assets/Screenshot 2026-09-16 120817.png'
  },
  {
    id: 'rishis',
    titleHindi: 'ऋषि एवं मुनि परंपरा',
    titleEnglish: 'Saptarshi & Great Sages',
    tagline: 'सप्तर्षि, मन्त्र द्रष्टा महर्षि एवं गुरुकुल ज्ञान',
    countBadge: 'सप्तर्षि एवं अमर ऋषि',
    iconName: 'Users',
    routeKey: 'rishis',
    image: '/assets/Screenshot 2026-09-16 120831.png'
  },
  {
    id: 'itihas',
    titleHindi: 'रामायण एवं महाभारत',
    titleEnglish: 'Sanatan Itihas & Epics',
    tagline: 'वाल्मीकि रामायण (मर्यादा) व महाभारत (धर्म-युद्ध)',
    countBadge: '२ महाकाव्य, १,२४,००० श्लोक',
    iconName: 'Shield',
    routeKey: 'itihas',
    image: '/assets/Screenshot 2026-09-16 120845.png'
  },
  {
    id: 'samskaras',
    titleHindi: '१६ संस्कार',
    titleEnglish: '16 Vedic Samskaras',
    tagline: 'गर्भाधान से अन्त्येष्टि तक जीवन की आध्यात्मिक यात्रा',
    countBadge: '१६ जीवन संस्कार',
    iconName: 'Heart',
    routeKey: 'samskaras',
    image: '/assets/Screenshot 2026-09-16 115008.png'
  },
  {
    id: 'festivals',
    titleHindi: 'सनातन पर्व एवं व्रत',
    titleEnglish: 'Festivals & Vratas',
    tagline: 'शिवरात्रि, नवरात्रि, दीपावली, एकादशी व पावन तिथियां',
    countBadge: 'पवित्र व्रत एवं उत्सव',
    iconName: 'Calendar',
    routeKey: 'festivals',
    image: '/assets/Screenshot 2026-09-16 120654.png'
  },
  {
    id: 'mantras',
    titleHindi: 'वैदिक मंत्र एवं स्तोत्र',
    titleEnglish: 'Vedic Mantras & Stotras',
    tagline: 'महामृत्युंजय, गायत्री, श्रीसूक्त व दिव्य बीज मंत्र',
    countBadge: '१०८+ सिद्ध स्तोत्र',
    iconName: 'Music',
    routeKey: 'mantras',
    image: '/assets/Screenshot 2026-09-16 114937.png'
  },
  {
    id: 'articles',
    titleHindi: 'आध्यात्मिक लेख एवं शोध',
    titleEnglish: 'Spiritual Articles & Research',
    tagline: 'दैनिक साधना, तनाव मुक्ति, वैदिक विज्ञान व चेतना',
    countBadge: 'गहन चिंतन एवं शोध',
    iconName: 'BookMarked',
    routeKey: 'articles',
    image: '/assets/Screenshot 2026-09-16 120715.png'
  }
];

export const DARSHANA_DATA: DarshanItem[] = [
  {
    id: 'sankhya',
    nameHindi: 'सांख्य दर्शन',
    nameEnglish: 'Sankhya Darshana',
    founder: 'महर्षि कपिल',
    founderSanskrit: 'महर्षिः कपिलः',
    centralText: 'सांख्यप्रवचन सूत्र',
    tagline: 'प्रकृति और पुरुष का तत्व-विवेक',
    summary: 'ब्रह्मांड के २५ मूल तत्वों (प्रकृति, महत्, अहंकार, पंचतन्मात्रा, एकादश इन्द्रियां, पंचमहाभूत और पुरुष) का वैज्ञानिक व दार्शनिक विश्लेषण।',
    keyPrinciple: 'मूलप्रकृतिरविकृतिर्महदाद्याः प्रकृतिविकृतयः सप्त । षोडशकस्तु विकारो न प्रकृतिर्न विकृतिः पुरुषः ॥'
  },
  {
    id: 'yoga',
    nameHindi: 'योग दर्शन',
    nameEnglish: 'Yoga Darshana',
    founder: 'महर्षि पतंजलि',
    founderSanskrit: 'महर्षिः पतञ्जलिः',
    centralText: 'पातञ्जल योगसूत्र',
    tagline: 'चित्त वृत्तियों का निरोध एवं अष्टांग योग',
    summary: 'यम, नियम, आसन, प्राणायाम, प्रत्याहार, धारणा, ध्यान और समाधि — इन आठ अंगों द्वारा चित्त की शुद्धि और आत्म-साक्षात्कार का प्रायोगिक मार्ग।',
    keyPrinciple: 'योगश्चित्तवृत्तिनिरोधः । तदा द्रष्टुः स्वरूपेऽवस्थानम् ॥'
  },
  {
    id: 'nyaya',
    nameHindi: 'न्याय दर्शन',
    nameEnglish: 'Nyaya Darshana',
    founder: 'महर्षि गौतम (अक्षपाद)',
    founderSanskrit: 'महर्षिः अक्षपाद गौतमः',
    centralText: 'न्याय सूत्र',
    tagline: 'प्रमाण शास्त्र एवं तार्किक अन्वेषण',
    summary: 'सत्य ज्ञान की प्राप्ति हेतु चार प्रमाण (प्रत्यक्ष, अनुमान, उपमान, शब्द) और १६ पदार्थों का व्यवस्थित तार्किक विश्लेषण।',
    keyPrinciple: 'प्रमाणप्रमेयसंशयप्रयोजनदृष्टान्तसिद्धान्तावयवतर्कनिर्णयवादजल्पवितण्डाहेत्वाभासच्छलजातिनिग्रहस्थानानां तत्त्वज्ञानान्निःश्रेयसाधिगमः ॥'
  },
  {
    id: 'vaisheshika',
    nameHindi: 'वैशेषिक दर्शन',
    nameEnglish: 'Vaisheshika Darshana',
    founder: 'महर्षि कणाद',
    founderSanskrit: 'महर्षिः कणादः',
    centralText: 'वैशेषिक सूत्र',
    tagline: 'परमाणुवाद एवं पदार्थ विज्ञान',
    summary: 'सृष्टि के भौतिक स्वरूप का विश्लेषण। द्रव्य, गुण, कर्म, सामान्य, विशेष और समवाय — इन ६ मूल पदार्थों और परमाणु सिद्धांत की स्थापना।',
    keyPrinciple: 'यतोऽभ्युदयनिश्रेयससिद्धिः स धर्मः । तद्वचनादाम्नायस्य प्रामाण्यम् ॥'
  },
  {
    id: 'mimamsa',
    nameHindi: 'पूर्व मीमांसा दर्शन',
    nameEnglish: 'Purva Mimamsa Darshana',
    founder: 'महर्षि जैमिनि',
    founderSanskrit: 'महर्षिः जैमिनिः',
    centralText: 'मीमांसा सूत्र',
    tagline: 'धर्म, वैदिक यज्ञ एवं कर्मकांड विचार',
    summary: 'वेद वचनों की यथार्थ व्याख्या, यज्ञ-यागादि कर्मों का वैज्ञानिक विश्लेषण तथा धर्म की मर्यादा की रक्षा का प्रमाण-युक्त शास्त्र।',
    keyPrinciple: 'अथातो धर्मजिज्ञासा । चोदनालक्षणोऽर्थो धर्मः ॥'
  },
  {
    id: 'vedanta',
    nameHindi: 'उत्तर मीमांसा (वेदान्त)',
    nameEnglish: 'Uttara Mimamsa (Vedanta)',
    founder: 'महर्षि बादरायण (व्यास)',
    founderSanskrit: 'महर्षिः बादरायणः',
    centralText: 'ब्रह्मसूत्र एवं उपनिषद्',
    tagline: 'अद्वैत ब्रह्मज्ञान — अहं ब्रह्मास्मि',
    summary: 'उपनिषदों का चरम निष्कर्ष। जीव और ब्रह्म की तात्विक एकता, माया का स्वरूप तथा मोक्ष की पराकाष्ठा का निर्विवाद दर्शन।',
    keyPrinciple: 'अथातो ब्रह्मजिज्ञासा । जन्माद्यस्य यतः । शास्त्रयोनित्वात् ॥'
  }
];

export const RISHI_PARAMPARA_DATA: RishiItem[] = [
  {
    id: 'vashistha',
    nameHindi: 'महर्षि वशिष्ठ',
    nameEnglish: 'Maharshi Vashistha',
    title: 'ब्रह्मर्षि • सूर्यवंश के कुलगुरु',
    vedicContribution: 'ऋग्वेद के सातवें मण्डल के द्रष्टा। प्रसिद्ध महामृत्युंजय मंत्र के द्रष्टा ऋषि। योगवासिष्ठ ग्रंथ के प्रवक्ता।',
    gotraLineage: 'वशिष्ठ गोत्र के मूल प्रवर्तक',
    lifeLesson: 'क्रोध पर पूर्ण विजय, कामधेनु के प्रलोभन में भी क्षमाभाव और राजा राम के आध्यात्मिक मार्गदर्शक।'
  },
  {
    id: 'vishwamitra',
    nameHindi: 'महर्षि विश्वामित्र',
    nameEnglish: 'Maharshi Vishwamitra',
    title: 'राजर्षि से ब्रह्मर्षि • गायत्री मंत्र द्रष्टा',
    vedicContribution: 'ऋग्वेद के तीसरे मण्डल के द्रष्टा। जगत को समस्त पापों से मुक्ति दिलाने वाले सर्वोपरि महामंत्र ‘गायत्री’ के द्रष्टा।',
    gotraLineage: 'विश्वामित्र / कौशिक गोत्र के मूल प्रवर्तक',
    lifeLesson: 'कठिनतम तपस्या द्वारा अहंकार और क्षत्रिय भाव को त्यागकर सर्वोच्च ब्रह्मर्षि पद प्राप्त करने का अप्रतिम उदाहरण।'
  },
  {
    id: 'kashyapa',
    nameHindi: 'महर्षि कश्यप',
    nameEnglish: 'Maharshi Kashyapa',
    title: 'सृष्टि के प्रपितामह • मरीचि पुत्र',
    vedicContribution: 'ऋग्वेद के नवम मण्डल (पवमान सोम) के अनेक सूक्तों के द्रष्टा। समस्त देवों, असुरों, गन्धर्वों व नागों के पूर्वज।',
    gotraLineage: 'कश्यप गोत्र के मूल प्रवर्तक',
    lifeLesson: 'समस्त चराचर सृष्टि में ईश्वर के प्राण-स्पंदन को देखना और समस्त प्रजा के कल्याण का संकल्प।'
  },
  {
    id: 'atri',
    nameHindi: 'महर्षि अत्रि',
    nameEnglish: 'Maharshi Atri',
    title: 'सप्तर्षि • माता अनसूया के पति',
    vedicContribution: 'ऋग्वेद के पंचम मण्डल के द्रष्टा। दत्तात्रेय, दुर्वासा और चन्द्रमा के जनक।',
    gotraLineage: 'अत्रि गोत्र के मूल प्रवर्तक',
    lifeLesson: 'त्रिगुणों (सत्व, रज, तम) से परे होकर परब्रह्म की साधना; सत्य और अक्रोध की प्रतिमूर्ति।'
  },
  {
    id: 'bharadvaja',
    nameHindi: 'महर्षि भारद्वाज',
    nameEnglish: 'Maharshi Bharadvaja',
    title: 'वेदों के प्रकांड अध्येता • आयुर्वेद व विमानशास्त्र',
    vedicContribution: 'ऋग्वेद के छठे मण्डल के द्रष्टा। देवराज इन्द्र से आयुर्वेद का संपूर्ण ज्ञान प्राप्त कर धरती पर मानवता को दिया।',
    gotraLineage: 'भारद्वाज गोत्र के मूल प्रवर्तक',
    lifeLesson: 'ज्ञान की निरंतर पिपासा — तीन जन्मों की तपस्या के बाद भी चौथे जन्म में वेदों के अध्ययन की प्रार्थना।'
  },
  {
    id: 'gautama',
    nameHindi: 'महर्षि गौतम',
    nameEnglish: 'Maharshi Gautama',
    title: 'न्याय शास्त्र के जनक • गोदावरी अवतरण कर्ता',
    vedicContribution: 'ऋग्वेद के प्रथम मण्डल के अनेक सूक्तों के द्रष्टा। न्याय दर्शन के सूत्रों के रचयिता।',
    gotraLineage: 'गौतम गोत्र के मूल प्रवर्तक',
    lifeLesson: 'तार्किक सत्य, तपस्या के बल से दक्षिण गंगा ‘गोदावरी’ को धरती पर लाकर अकाल से जीवों की रक्षा।'
  },
  {
    id: 'jamadagni',
    nameHindi: 'महर्षि जमदग्नि',
    nameEnglish: 'Maharshi Jamadagni',
    title: 'भृगुवंशी तपस्वी • भगवान परशुराम के पिता',
    vedicContribution: 'ऋग्वेद के नवम व दशम मण्डल के अनेक सूक्तों के मन्त्रद्रष्टा। शस्त्र और शास्त्र दोनों के अद्वितीय ज्ञाता।',
    gotraLineage: 'जामदग्न्य गोत्र के मूल प्रवर्तक',
    lifeLesson: 'अखंड तप, त्याग और धर्म की मर्यादा की रक्षा हेतु सर्वस्व न्योछावर करने का तेज।'
  }
];

export const SAMSKARA_DATA: SamskaraItem[] = [
  {
    number: 1,
    nameHindi: 'गर्भाधान संस्कार',
    nameEnglish: 'Garbhadhana Samskara',
    stage: 'जन्म पूर्व (Prenatal)',
    purpose: 'श्रेष्ठ, धर्मात्मा और तेजस्वी संतान की उत्पत्ति हेतु पवित्र मानसिक व शारीरिक संकल्प।',
    mantraOrSignificance: 'ऋग्वेद १०.८५.४२ — पति-पत्नी का गृहस्थ धर्म में दिव्य प्रवेश।'
  },
  {
    number: 2,
    nameHindi: 'पुंसवन संस्कार',
    nameEnglish: 'Pumsavana Samskara',
    stage: 'गर्भ के तीसरे माह में',
    purpose: 'गर्भस्थ शिशु के स्वस्थ शारीरिक, मानसिक और ओजस्वी विकास हेतु प्रार्थना।',
    mantraOrSignificance: 'शिशु के मस्तिष्क व स्नायुतंत्र के कल्याण का वैदिक विधान।'
  },
  {
    number: 3,
    nameHindi: 'सीमन्तोन्नयन संस्कार',
    nameEnglish: 'Simantonnayana Samskara',
    stage: 'गर्भ के चौथे-आठवें माह में',
    purpose: 'गर्भवती माता के मन को प्रसन्न, भयमुक्त और सात्विक विचारों से परिपूर्ण रखना।',
    mantraOrSignificance: 'माता के मानसिक स्वास्थ्य का सीधा प्रभाव शिशु की चेतना पर पड़ता है।'
  },
  {
    number: 4,
    nameHindi: 'जातकर्म संस्कार',
    nameEnglish: 'Jatakarma Samskara',
    stage: 'जन्म के तुरंत बाद',
    purpose: 'नवजात को स्वर्ण शलाका से घृत-मधु चटाकर मेधा, दीर्घायु और बल की कामना करना।',
    mantraOrSignificance: 'मेधाजनन मन्त्र — "अश्मा भव परशुर्भव हिरण्यमस्तृतं भव..."'
  },
  {
    number: 5,
    nameHindi: 'नामकरण संस्कार',
    nameEnglish: 'Namakarana Samskara',
    stage: 'जन्म के ११वें या १२वें दिन',
    purpose: 'शुभ नक्षत्र, कुल परंपरा और आध्यात्मिक अर्थ से युक्त नामकरण करना।',
    mantraOrSignificance: 'नाम ही व्यक्ति के व्यक्तित्व, यश और जीवन की पहचान का मूल है।'
  },
  {
    number: 6,
    nameHindi: 'निष्क्रमण संस्कार',
    nameEnglish: 'Nishkramana Samskara',
    stage: 'जन्म के चौथे माह में',
    purpose: 'शिशु को पहली बार घर से बाहर खुली प्रकृति, सूर्य और चंद्र के दर्शन कराना।',
    mantraOrSignificance: 'पंचमहाभूतों (पृथ्वी, जल, अग्नि, वायु, आकाश) से शिशु की मित्रता।'
  },
  {
    number: 7,
    nameHindi: 'अन्नप्राशन संस्कार',
    nameEnglish: 'Annaprashana Samskara',
    stage: 'छठे माह में',
    purpose: 'माता के दूध के पश्चात पहली बार शिशु को सात्विक अन्न (खीर) का पवित्र भोग देना।',
    mantraOrSignificance: 'अन्नं वै प्राणाः — अन्न ही शरीर का निर्माण और ओज प्रदान करता है।'
  },
  {
    number: 8,
    nameHindi: 'चूड़ाकर्म (मुंडन) संस्कार',
    nameEnglish: 'Chudakarana (Mundan)',
    stage: 'पहले या तीसरे वर्ष में',
    purpose: 'जन्म के केशों को हटाकर मस्तिष्क के तालु को शीतलता, शुद्धि और बल प्रदान करना।',
    mantraOrSignificance: 'मस्तिष्क की नाड़ियों का शुद्धिकरण और दीर्घायु की प्रार्थना।'
  },
  {
    number: 9,
    nameHindi: 'कर्णवेध संस्कार',
    nameEnglish: 'Karnavedha Samskara',
    stage: 'तीसरे या पांचवें वर्ष में',
    purpose: 'कान के निचले भाग को छेदना, जिससे मेधा शक्ति, श्रवण शक्ति और स्मरण शक्ति बढ़ती है।',
    mantraOrSignificance: 'एक्यूप्रेशर और स्नायु विज्ञान पर आधारित वैदिक सुरक्षा चक्र।'
  },
  {
    number: 10,
    nameHindi: 'विद्यारंभ संस्कार',
    nameEnglish: 'Vidyarambha Samskara',
    stage: 'पांचवें वर्ष में',
    purpose: 'शिशु को पहली बार अक्षर ज्ञान, ॐकार और मां सरस्वती की वंदना सिखाना।',
    mantraOrSignificance: 'ॐ नमः सिद्धम् — ज्ञान की पावन गंगा में प्रवेश।'
  },
  {
    number: 11,
    nameHindi: 'उपनयन (यज्ञोपवीत) संस्कार',
    nameEnglish: 'Upanayana (Yajnopavita)',
    stage: 'आठवें से बारहवें वर्ष में',
    purpose: 'जनेऊ धारण कराकर गायत्री मंत्र की दीक्षा देना। यह मनुष्य का आध्यात्मिक दूसरा जन्म (द्विज) है।',
    mantraOrSignificance: 'गायत्री मंत्र की दीक्षा, ब्रह्मचर्य और आत्मसंयम का महासंकल्प।'
  },
  {
    number: 12,
    nameHindi: 'वेदारंभ संस्कार',
    nameEnglish: 'Vedarambha Samskara',
    stage: 'उपनयन के तुरंत बाद',
    purpose: 'गुरुकुल में वेदों, उपनिषदों और शास्त्रों के अध्ययन का विधिवत शुभारंभ।',
    mantraOrSignificance: 'आचार्य द्वारा शिष्य को वेदों के गंभीर ज्ञान में प्रवेश कराना।'
  },
  {
    number: 13,
    nameHindi: 'केशांत संस्कार',
    nameEnglish: 'Keshanta Samskara',
    stage: 'सोलहवें वर्ष में',
    purpose: 'गुरुकुल में ब्रह्मचर्य की परिपक्वता पर दाढ़ी-मूंछ की पहली हजामत और शुद्धि।',
    mantraOrSignificance: 'इन्द्रिय संयम और यौवन में धर्म-निष्ठा की प्रतिज्ञा।'
  },
  {
    number: 14,
    nameHindi: 'समावर्तन (दीक्षांत) संस्कार',
    nameEnglish: 'Samavartana (Graduation)',
    stage: 'शिक्षा पूर्ण होने पर',
    purpose: 'गुरुकुल की शिक्षा पूरी कर गृहस्थ आश्रम में प्रवेश हेतु स्नातक की उपाधि प्राप्त करना।',
    mantraOrSignificance: 'तैत्तिरीयोपनिषद् — "सत्यं वद, धर्मं चर, स्वाध्यायान्मा प्रमदः..."'
  },
  {
    number: 15,
    nameHindi: 'विवाह संस्कार',
    nameEnglish: 'Vivaha Samskara',
    stage: 'युवावस्था में',
    purpose: 'धर्म, अर्थ, काम और मोक्ष के संयुक्त पालन हेतु दो आत्माओं का पवित्र सात फेरों का बंधन।',
    mantraOrSignificance: 'सप्तपदी — सात वचनों के साथ जीवन-भर धर्म मार्ग पर साथ चलने का महासंकल्प।'
  },
  {
    number: 16,
    nameHindi: 'अन्त्येष्टि संस्कार',
    nameEnglish: 'Antyeshti Samskara',
    stage: 'जीवन के अंतिम पड़ाव पर',
    purpose: 'प्राण छूटने के पश्चात पंचभौतिक शरीर को अग्नि द्वारा पुनः पंचतत्वों में विलीन करना।',
    mantraOrSignificance: 'वायुरनिलममृतमथेदं भस्मान्तं शरीरम् — आत्मा अमर है, देह पंचतत्व में समा जाती है।'
  }
];

export const FESTIVALS_DATA: FestivalItem[] = [
  {
    id: 'mahashivaratri',
    nameHindi: 'महाशिवरात्रि',
    nameEnglish: 'Maha Shivaratri',
    tithiHindi: 'फाल्गुन कृष्ण चतुर्दशी',
    season: 'शिशिर ऋतु (फरवरी/मार्च)',
    spiritualSignificance: 'भगवान शिव और माता पार्वती का पावन विवाह तथा शिवलिंग का प्राकट्य। रात्रि-जागरण से चेतना की उच्चतम अवस्था प्राप्त होती है।',
    rituals: ['चार प्रहर की रुद्राभिषेक पूजा', 'बेलपत्र एवं धतूरा अर्पण', 'निर्जला या फलाहार उपवास', 'महामृत्युंजय मंत्र जप']
  },
  {
    id: 'navratri',
    nameHindi: 'शारदीय एवं चैत्र नवरात्रि',
    nameEnglish: 'Navratri (9 Sacred Nights)',
    tithiHindi: 'आश्विन / चैत्र शुक्ल प्रतिपदा से नवमी',
    season: 'शरद एवं वसंत संधिकाल',
    spiritualSignificance: 'नवदुर्गा की नौ स्वरूपों में उपासना। आंतरिक तम, रज और विकारों (महिषासुर) पर दैवीय शक्ति (आदिशक्ति) की विजय।',
    rituals: ['घटस्थापना व अखण्ड ज्योति', 'दुर्गा सप्तशती पाठ', 'कन्या पूजन', 'नवमी हवन']
  },
  {
    id: 'deepavali',
    nameHindi: 'दीपावली (प्रकाश पर्व)',
    nameEnglish: 'Deepavali / Diwali',
    tithiHindi: 'कार्तिक कृष्ण अमावस्या',
    season: 'शरद ऋतु (अक्टूबर/नवंबर)',
    spiritualSignificance: 'मर्यादा पुरुषोत्तम श्रीराम का १४ वर्ष वनवास पश्चात अयोध्या आगमन तथा मां महालक्ष्मी का प्राकट्य। अज्ञान के अंधकार पर ज्ञान के प्रकाश की विजय।',
    rituals: ['श्री महालक्ष्मी व कुबेर पूजन', 'दीपक प्रज्वलन', 'बहीखाता पूजन', 'स्नेह मिलन व दान']
  },
  {
    id: 'janmashtami',
    nameHindi: 'श्रीकृष्ण जन्माष्टमी',
    nameEnglish: 'Krishna Janmashtami',
    tithiHindi: 'भाद्रपद कृष्ण अष्टमी (रोहिणी नक्षत्र)',
    season: 'वर्षा ऋतु (अगस्त/सितंबर)',
    spiritualSignificance: 'पूर्ण पुरुषोत्तम भगवान श्रीकृष्ण का आधी रात को कारागार में प्राकट्य। धर्म संस्थापना और निष्काम प्रेम का उत्सव।',
    rituals: ['मध्यरात्रि कान्हा जन्मोत्सव', 'पंचामृत अभिषेक', 'माखन-मिश्री भोग', 'दही-हांडी उत्सव']
  },
  {
    id: 'makar_sankranti',
    nameHindi: 'मकर संक्रांति (उत्तरायण)',
    nameEnglish: 'Makar Sankranti',
    tithiHindi: 'पौष मास (सूर्य का मकर राशि में प्रवेश)',
    season: 'शिशिर ऋतु (१४/१५ जनवरी)',
    spiritualSignificance: 'सूर्यदेव का दक्षिणायन से उत्तरायण में गमन — देवताओं का दिन आरंभ। गंगा स्नान, तिल-गुड़ दान और आरोग्य की कामना।',
    rituals: ['पवित्र नदियों (गंगा, नर्मदा, गोदावरी) में स्नान', 'सूर्य अर्घ्य', 'तिल-गुड़ व खिचड़ी दान', 'पतंग उत्सव']
  }
];

export const ITIHAS_DATA: ItihasItem[] = [
  {
    id: 'ramayana',
    titleHindi: 'श्रीमद्वाल्मीकीय रामायण',
    titleEnglish: 'Valmiki Ramayana',
    author: 'आदिकवि महर्षि वाल्मीकि',
    scope: '७ काण्ड, २४,००० श्लोक',
    coreMessage: 'धर्मो रक्षति रक्षितः — धर्म का आचरण करने वाले की रक्षा स्वयं धर्म करता है। श्रीराम का जीवन आदर्श पुत्र, भ्राता, पति और राजा की पराकाष्ठा है।',
    keySections: [
      { title: 'बालकाण्ड', desc: 'श्रीराम जन्म, विश्वामित्र यज्ञ रक्षा, धनुष भंग एवं सीता विवाह।' },
      { title: 'अयोध्याकाण्ड', desc: 'राज्याभिषेक की तैयारी, कैकेयी वरदान, श्रीराम का वनगमन एवं भरत का पादुका पूजन।' },
      { title: 'अरण्यकाण्ड', desc: 'पंचवटी निवास, शूर्पणखा प्रसंग, खर-दूषण वध, मारीच प्रसंग एवं सीता हरण।' },
      { title: 'किष्किन्धाकाण्ड', desc: 'हनुमान-सुग्रीव मिलन, बालि वध, सीता खोज हेतु वानर सेना का प्रस्थान।' },
      { title: 'सुन्दरकाण्ड', desc: 'श्री हनुमान का समुद्र लांघना, लंका दहन, सीता जी से भेंट एवं चूड़ामणि प्राप्ति।' },
      { title: 'युद्धकाण्ड (लंकाकाण्ड)', desc: 'राम सेतु निर्माण, रावण सेना से महासंग्राम, रावण वध एवं अयोध्या वापसी।' },
      { title: 'उत्तरकाण्ड', desc: 'श्रीराम राज्याभिषेक (रामतंत्र), लव-कुश जन्म एवं अश्वमेध यज्ञ।' }
    ]
  },
  {
    id: 'mahabharata',
    titleHindi: 'श्रीमहाभारतम्',
    titleEnglish: 'Mahabharata (Jaya, Bharata, Mahabharata)',
    author: 'महर्षि कृष्ण द्वैपायन वेदव्यास',
    scope: '१८ पर्व, १,००,००० श्लोक (विश्व का सबसे विशाल महाकाव्य)',
    coreMessage: 'यतो धर्मस्ततो जयः — जहां धर्म है, वहीं विजय है। सम्पूर्ण मानवीय स्वभाव, राजनीति, कर्तव्य और मुक्ति का विश्वकोश।',
    keySections: [
      { title: 'आदिपर्व', desc: 'कुरुवंश की उत्पत्ति, पाण्डव-कौरव जन्म, लाक्षागृह एवं द्रौपदी स्वयंवर।' },
      { title: 'सभापर्व', desc: 'इंद्रप्रस्थ निर्माण, युधिष्ठिर का राजसूय यज्ञ, द्यूत क्रीड़ा एवं द्रौपदी चीरहरण।' },
      { title: 'वनपर्व', desc: 'पाण्डवों का १२ वर्ष वनवास, यक्ष प्रश्न, तीर्थयात्रा एवं तपस्या।' },
      { title: 'विराटपर्व', desc: '१ वर्ष का अज्ञातवास, कीचक वध एवं उत्तर गो-ग्रहण युद्ध।' },
      { title: 'उद्योगपर्व', desc: 'श्रीकृष्ण की शांति दूत यात्रा, युद्ध की अंतिम तैयारियां एवं सेनाओं का जमावड़ा।' },
      { title: 'भीष्मपर्व', desc: 'कुरुक्षेत्र महायुद्ध का आरंभ एवं अध्याय २५-४२ में अमर "श्रीमद्भगवद्गीता"।' },
      { title: 'द्रोणपर्व व कर्णपर्व', desc: 'चक्रव्यूह भेदन, अभिमन्यु वीरगति, घटोत्कच वध एवं कर्ण-अर्जुन द्वंद्व।' },
      { title: 'शांतिपर्व व अनुशासनपर्व', desc: 'शरशय्या पर लेटे भीष्म पितामह द्वारा युधिष्ठिर को राजधर्म, मोक्षधर्म व विष्णु सहस्रनाम का उपदेश।' }
    ]
  }
];
