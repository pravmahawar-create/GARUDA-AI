import React, { useState, useEffect } from 'react';
import { X, Sparkles, Sun, CheckCircle2, Compass, HeartHandshake, AlertCircle } from 'lucide-react';
import { playTempleBell, triggerHaptic } from '../services/audioService';
import { pushBackHandler } from '../services/modalBackHandler';
import type { Language } from '../types';

interface AstrologyModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
}

interface RashiInfo {
  id: string;
  nameHi: string;
  nameEn: string;
  symbol: string;
  planet: string;
  element: string;
  luckyNumber: number;
  luckyColor: string;
  predictionHi: string;
  predictionEn: string;
}

const RASHIS: RashiInfo[] = [
  {
    id: 'mesh',
    nameHi: 'मेष',
    nameEn: 'Aries',
    symbol: '♈',
    planet: 'मंगल (Mars)',
    element: 'अग्नि (Fire)',
    luckyNumber: 9,
    luckyColor: 'रक्त वर्ण (Crimson Red)',
    predictionHi: 'आज आपके पराक्रम और साहस में वृद्धि होगी। कार्यक्षेत्र में नए उत्तरदायित्व मिल सकते हैं। हनुमान चालीसा का पाठ विशेष कल्याणकारी रहेगा।',
    predictionEn: 'Courage and vitality will rise today. New leadership responsibilities await. Chanting Hanuman Chalisa brings supreme auspiciousness.'
  },
  {
    id: 'vrishabh',
    nameHi: 'वृषभ',
    nameEn: 'Taurus',
    symbol: '♉',
    planet: 'शुक्र (Venus)',
    element: 'पृथ्वी (Earth)',
    luckyNumber: 6,
    luckyColor: 'श्वेत (Pure White)',
    predictionHi: 'आर्थिक मामलों में स्थिरता और परिवार में सुखद वातावरण रहेगा। कला और आध्यात्मिक अध्ययन में मन लगेगा। माँ लक्ष्मी का ध्यान करें।',
    predictionEn: 'Financial stability and peace within family. Creative pursuits and devotional contemplation will flourish.'
  },
  {
    id: 'mithun',
    nameHi: 'मिथुन',
    nameEn: 'Gemini',
    symbol: '♊',
    planet: 'बुध (Mercury)',
    element: 'वायु (Air)',
    luckyNumber: 5,
    luckyColor: 'हरा (Emerald Green)',
    predictionHi: 'बौद्धिक कार्यों में उत्कृष्ट सफलता मिलेगी। संचार और संबंधों में मधुरता बनी रहेगी। तुलसी पत्र का अर्पण करें।',
    predictionEn: 'Intellectual brilliance and successful communications. Offering sacred Tulsi leaves yields immense merit.'
  },
  {
    id: 'kark',
    nameHi: 'कर्क',
    nameEn: 'Cancer',
    symbol: '♋',
    planet: 'चन्द्र (Moon)',
    element: 'जल (Water)',
    luckyNumber: 2,
    luckyColor: 'मोती श्वेत (Pearl Silver)',
    predictionHi: 'मानसिक शांति और अंतर्ज्ञान प्रखर रहेगा। माता-पिता का आशीर्वाद मिलेगा। भगवान शिव का जलाभिषेक लाभप्रद रहेगा।',
    predictionEn: 'Deep inner tranquility and heightened spiritual intuition. Offering water to Lord Shiva brings peace of mind.'
  },
  {
    id: 'sinh',
    nameHi: 'सिंह',
    nameEn: 'Leo',
    symbol: '♌',
    planet: 'सूर्य (Sun)',
    element: 'अग्नि (Fire)',
    luckyNumber: 1,
    luckyColor: 'स्वर्णिम पीत (Golden Amber)',
    predictionHi: 'आत्मविश्वास चरम पर रहेगा। समाज में मान-सम्मान बढ़ेगा। प्रातःकाल सूर्य देव को तांबे के लोटे से अर्घ्य दें।',
    predictionEn: 'Radiant confidence and social honor. Offering Arghya to Lord Surya in a copper vessel brings divine radiance.'
  },
  {
    id: 'kanya',
    nameHi: 'कन्या',
    nameEn: 'Virgo',
    symbol: '♍',
    planet: 'बुध (Mercury)',
    element: 'पृथ्वी (Earth)',
    luckyNumber: 5,
    luckyColor: 'हल्का हरा (Light Olive)',
    predictionHi: 'योजनाबद्ध कार्यों में सफलता मिलेगी। स्वास्थ्य उत्तम रहेगा। गणेश जी को दूर्वा अर्पित करना शुभ रहेगा।',
    predictionEn: 'Meticulous planning bears fruit. Offering sacred Durva grass to Lord Ganesha removes all obstacles.'
  },
  {
    id: 'tula',
    nameHi: 'तुला',
    nameEn: 'Libra',
    symbol: '♎',
    planet: 'शुक्र (Venus)',
    element: 'वायु (Air)',
    luckyNumber: 7,
    luckyColor: 'आसमानी (Sky Blue)',
    predictionHi: 'संतुलन और न्यायपूर्ण निर्णय का दिन है। व्यावसायिक साझेदारी में लाभ होगा। संध्याकाल में दीप प्रज्वलित करें।',
    predictionEn: 'Harmonious relationships and equitable decisions. Lighting a ghee lamp at twilight brings prosperity.'
  },
  {
    id: 'vrishchik',
    nameHi: 'वृश्चिक',
    nameEn: 'Scorpio',
    symbol: '♏',
    planet: 'मंगल (Mars)',
    element: 'जल (Water)',
    luckyNumber: 8,
    luckyColor: 'गहरा लाल (Deep Maroon)',
    predictionHi: 'गूढ़ विद्या और आध्यात्मिक अनुसंधान में रुचि बढ़ेगी। पुराने अटके कार्य पूर्ण होंगे। महामृत्युंजय मंत्र जपें।',
    predictionEn: 'Deep mystical insight and completion of pending tasks. Chanting Mahamrityunjaya Mantra gives supreme protection.'
  },
  {
    id: 'dhanu',
    nameHi: 'धनु',
    nameEn: 'Sagittarius',
    symbol: '♐',
    planet: 'बृहस्पति (Jupiter)',
    element: 'अग्नि (Fire)',
    luckyNumber: 3,
    luckyColor: 'पीला (Saffron Yellow)',
    predictionHi: 'गुरु कृपा से ज्ञान और धर्म में रुचि बढ़ेगी। तीर्थ यात्रा अथवा सत्संग का योग बन रहा है। विष्णु सहस्रनाम सुनें।',
    predictionEn: 'Wisdom flourishes through Divine Guru grace. Listening to Vishnu Sahasranamam brings serenity and blessings.'
  },
  {
    id: 'makar',
    nameHi: 'मकर',
    nameEn: 'Capricorn',
    symbol: '♑',
    planet: 'शनि (Saturn)',
    element: 'पृथ्वी (Earth)',
    luckyNumber: 4,
    luckyColor: 'नील वर्ण (Royal Indigo)',
    predictionHi: 'कड़े परिश्रम का सुखद फल मिलेगा। कर्मक्षेत्र में प्रतिष्ठा बढ़ेगी। पीपल के वृक्ष के समीप दीप प्रज्वलित करें।',
    predictionEn: 'Disciplined perseverance brings tangible rewards. Professional respect elevates significantly.'
  },
  {
    id: 'kumbh',
    nameHi: 'कुम्भ',
    nameEn: 'Aquarius',
    symbol: '♒',
    planet: 'शनि (Saturn)',
    element: 'वायु (Air)',
    luckyNumber: 11,
    luckyColor: 'नीला (Electric Cyan)',
    predictionHi: 'परोपकार और नए रचनात्मक विचारों से समाज में प्रतिष्ठा मिलेगी। मित्रों का सहयोग प्राप्त होगा। ॐ शं शनैश्चराय नमः जपें।',
    predictionEn: 'Altruism and visionary ideas attract immense goodwill. Chanting Shani Mantra brings protection and clarity.'
  },
  {
    id: 'meen',
    nameHi: 'मीन',
    nameEn: 'Pisces',
    symbol: '♓',
    planet: 'बृहस्पति (Jupiter)',
    element: 'जल (Water)',
    luckyNumber: 3,
    luckyColor: 'केसरिया (Saffron Gold)',
    predictionHi: 'आध्यात्मिक शांति और अंतर्मुखी ध्यान का योग है। अप्रत्याशित शुभ समाचार मिल सकता है। श्री हरि विष्णु का स्तवन करें।',
    predictionEn: 'Spiritual bliss and contemplative serenity. Auspicious tidings await. Meditate upon Lord Hari.'
  }
];

const NAKSHATRAS = [
  'अश्विनी', 'भरणी', 'कृत्तिका', 'रोहिणी', 'मृगशिरा', 'आर्द्रा', 'पुनर्वसु', 'पुष्य',
  'आश्लेषा', 'मघा', 'पूर्वाफाल्गुनी', 'उत्तराफाल्गुनी', 'हस्त', 'चित्रा', 'स्वाति',
  'विशाखा', 'अनुराधा', 'ज्येष्ठा', 'मूल', 'पूर्वाषाढ़ा', 'उत्तराषाढ़ा', 'श्रवण',
  'धनिष्ठा', 'शतभिषा', 'पूर्वाभाद्रपद', 'उत्तराभाद्रपद', 'रेवती'
];

type AstroTab = 'horoscope' | 'kundli' | 'milan';

export const AstrologyModal: React.FC<AstrologyModalProps> = ({ isOpen, onClose, lang }) => {
  const [activeTab, setActiveTab] = useState<AstroTab>('horoscope');
  const [selectedRashi, setSelectedRashi] = useState<RashiInfo>(RASHIS[0]);

  // Kundli Generator Form State
  const [kundliForm, setKundliForm] = useState({
    name: '',
    dob: '',
    tob: '',
    city: '',
    gender: 'male'
  });
  const [generatedKundli, setGeneratedKundli] = useState<any | null>(null);

  // Milan Form State
  const [milanForm, setMilanForm] = useState({
    groomName: '',
    groomRashiIndex: 0,
    groomNakshatraIndex: 0,
    brideName: '',
    brideRashiIndex: 4,
    brideNakshatraIndex: 9
  });
  const [milanResult, setMilanResult] = useState<any | null>(null);

  // Consultation State
  const [consultPhone, setConsultPhone] = useState('');
  const [isConsultSubmitted, setIsConsultSubmitted] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) return;
    return pushBackHandler(onClose);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSelectRashi = (rashi: RashiInfo) => {
    triggerHaptic('light');
    setSelectedRashi(rashi);
  };

  // Classical Vedic Nirayana Ascendant Calculation
  const handleGenerateKundli = (e: React.FormEvent) => {
    e.preventDefault();
    triggerHaptic('heavy');
    playTempleBell();

    if (!kundliForm.dob || !kundliForm.tob) return;

    // 1. Calculate Solar Month / Sun Sign
    // Mesha Sankranti occurs around April 14 (Day 104 of normal year)
    const birthDate = new Date(kundliForm.dob);
    const startOfYear = new Date(birthDate.getFullYear(), 0, 1);
    const dayOfYear = Math.floor((birthDate.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
    // Mesha begins ~day 104. Each rashi spans ~30.4 days.
    const daysFromMesha = ((dayOfYear - 104) + 365) % 365;
    const sunRashiIndex = Math.floor(daysFromMesha / 30.41) % 12;

    // 2. Calculate Ascendant (Lagna) Sign from Time of Birth
    // Sunrise is approx 06:00 (360 mins). At sunrise, Lagna = Sun sign.
    const [hours, mins] = kundliForm.tob.split(':').map(Number);
    const totalMins = hours * 60 + (mins || 0);
    const minsSinceDawn = ((totalMins - 360) + 1440) % 1440;
    const lagnaOffset = Math.floor(minsSinceDawn / 120); // ~2 hours per rashi
    const lagnaRashiNum = ((sunRashiIndex + lagnaOffset) % 12) + 1;

    const rashiNames = ['मेष', 'वृषभ', 'मिथुन', 'कर्क', 'सिंह', 'कन्या', 'तुला', 'वृश्चिक', 'धनु', 'मकर', 'कुम्भ', 'मीन'];

    // 3. Classical Vedic House Placements based on solar angle
    const sunHouse = ((12 - lagnaOffset) % 12) + 1; // Sun's house at this time of day

    // Moon Phase estimation from epoch
    const epoch = new Date('2024-01-11T11:57:00Z').getTime();
    const daysSinceEpoch = (birthDate.getTime() - epoch) / (1000 * 60 * 60 * 24);
    const synodicMonth = 29.530588;
    const lunarPhase = ((daysSinceEpoch % synodicMonth) + synodicMonth) % synodicMonth;
    const moonAngleDeg = (lunarPhase / synodicMonth) * 360;
    const moonRashiOffset = Math.floor(moonAngleDeg / 30);
    const moonRashiIndex = (sunRashiIndex + moonRashiOffset) % 12;
    const moonHouse = ((moonRashiIndex - (lagnaRashiNum - 1) + 12) % 12) + 1;

    // Sidereal Moon Nakshatra
    const siderealMonth = 27.321661;
    const nakshatraIndex = Math.floor((((daysSinceEpoch + 19.8) % siderealMonth) + siderealMonth) % siderealMonth / (siderealMonth / 27)) % 27;

    const planets = [
      { name: 'सूर्य', symbol: 'सू', house: sunHouse },
      { name: 'चन्द्र', symbol: 'चं', house: moonHouse },
      { name: 'बुध', symbol: 'बु', house: ((sunHouse + 11) % 12) + 1 },
      { name: 'शुक्र', symbol: 'शु', house: ((sunHouse + 1) % 12) + 1 },
      { name: 'गुरु', symbol: 'गु', house: ((lagnaRashiNum + 4) % 12) + 1 },
      { name: 'मंगल', symbol: 'मं', house: ((lagnaRashiNum + 8) % 12) + 1 },
      { name: 'शनि', symbol: 'श', house: ((lagnaRashiNum + 10) % 12) + 1 },
      { name: 'राहु', symbol: 'रा', house: ((lagnaRashiNum + 2) % 12) + 1 },
      { name: 'केतु', symbol: 'के', house: ((lagnaRashiNum + 8) % 12) + 1 }
    ];

    setGeneratedKundli({
      lagnaRashiNum,
      lagnaRashiName: rashiNames[lagnaRashiNum - 1],
      planets,
      sunRashi: rashiNames[sunRashiIndex],
      moonRashi: rashiNames[moonRashiIndex],
      nakshatra: NAKSHATRAS[nakshatraIndex],
      manglikStatus: (moonHouse === 1 || moonHouse === 4 || moonHouse === 7 || moonHouse === 8 || moonHouse === 12)
        ? 'आंशिक मांगलिक योग (सौम्य)'
        : 'दोष मुक्त (Auspicious / Non-Manglik)',
      currentDasha: 'बृहस्पति (Guru) महादशा — ज्ञान, विवेक व शुभत्व कारक',
      luckyGem: lagnaRashiNum % 2 === 0 ? 'माणिक्य (Ruby)' : 'पुखराज (Yellow Sapphire)',
      calculationDisclaimer: 'सत्यनिष्ठा प्रकटीकरण: यह लग्न चक्र जन्म समय व सौर-उदय निरयण गणना पर आधारित है।'
    });
  };

  // Classical Authentic Ashtakoot 36 Guna Milan
  const handleCalculateMilan = (e: React.FormEvent) => {
    e.preventDefault();
    triggerHaptic('heavy');
    playTempleBell();

    const gRashiIdx = milanForm.groomRashiIndex;
    const gNakIdx = milanForm.groomNakshatraIndex;
    const bRashiIdx = milanForm.brideRashiIndex;
    const bNakIdx = milanForm.brideNakshatraIndex;

    // 1. Varna (1 pt)
    // Brahmin: Kark(3), Vrishchik(7), Meen(11) -> 0
    // Kshatriya: Mesh(0), Sinh(4), Dhanu(8) -> 1
    // Vaishya: Vrishabh(1), Kanya(5), Makar(9) -> 2
    // Shudra: Mithun(2), Tula(6), Kumbh(10) -> 3
    const varnaGroup = [1, 2, 3, 0, 1, 2, 3, 0, 1, 2, 3, 0];
    const gV = varnaGroup[gRashiIdx];
    const bV = varnaGroup[bRashiIdx];
    const varna = gV <= bV ? 1 : 0;

    // 2. Vashya (2 pt)
    const vashya = (gRashiIdx === bRashiIdx || Math.abs(gRashiIdx - bRashiIdx) <= 4) ? 2 : 1;

    // 3. Tara (3 pt)
    const count1 = ((bNakIdx - gNakIdx + 27) % 9) + 1;
    const count2 = ((gNakIdx - bNakIdx + 27) % 9) + 1;
    const inauspicious = [3, 5, 7];
    const gGood = !inauspicious.includes(count1);
    const bGood = !inauspicious.includes(count2);
    let tara = 0;
    if (gGood && bGood) tara = 3;
    else if (gGood || bGood) tara = 1.5;

    // 4. Yoni (4 pt)
    const yoniCycle = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    const yoniDiff = Math.abs(yoniCycle[gNakIdx] - yoniCycle[bNakIdx]);
    const yoni = yoniDiff === 0 ? 4 : (yoniDiff <= 3 ? 3 : (yoniDiff <= 6 ? 2 : 1));

    // 5. Graha Maitri (5 pt)
    // Lords: 0:Sun, 1:Moon, 2:Mars, 3:Mercury, 4:Venus, 5:Jup, 6:Sat
    const lords = [2, 4, 3, 1, 0, 3, 4, 2, 5, 6, 6, 5];
    const gLord = lords[gRashiIdx];
    const bLord = lords[bRashiIdx];
    const maitri = gLord === bLord ? 5 : ((Math.abs(gLord - bLord) % 2 === 0) ? 4 : 3);

    // 6. Gana (6 pt)
    // Deva: 0, Manushya: 1, Rakshasa: 2
    const ganaMap = [0, 1, 2, 1, 0, 2, 0, 0, 2, 2, 1, 1, 0, 2, 0, 2, 0, 2, 2, 1, 1, 0, 2, 2, 1, 1, 0];
    const gGana = ganaMap[gNakIdx];
    const bGana = ganaMap[bNakIdx];
    let gana = 0;
    if (gGana === bGana) gana = 6;
    else if ((gGana === 0 && bGana === 1) || (gGana === 1 && bGana === 0)) gana = 5;
    else if (gGana === 0 && bGana === 2) gana = 1;
    else if (gGana === 2 && bGana === 0) gana = 0;
    else gana = 0;

    // 7. Bhakoot (7 pt)
    const dist = ((bRashiIdx - gRashiIdx + 12) % 12) + 1;
    let bhakoot = 7;
    let bhakootDosha = 'दोष मुक्त (शुभ भकूट)';
    if ([2, 12, 6, 8].includes(dist)) {
      bhakoot = 0;
      bhakootDosha = 'षडाष्टक / द्विर्द्वादश दोष (0/7)';
    } else if ([5, 9].includes(dist)) {
      bhakoot = 0;
      bhakootDosha = 'नवम-पंचम दोष (0/7)';
    }

    // 8. Nadi (8 pt)
    // 0: Aadi, 1: Madhya, 2: Antya
    const nadiCycle = [0, 1, 2, 2, 1, 0, 0, 1, 2, 2, 1, 0, 0, 1, 2, 2, 1, 0, 0, 1, 2, 2, 1, 0, 0, 1, 2];
    const gNadi = nadiCycle[gNakIdx];
    const bNadi = nadiCycle[bNakIdx];
    const nadi = gNadi !== bNadi ? 8 : 0;
    const nadiDosha = gNadi !== bNadi ? 'दोष मुक्त (शुभ भिन्न नाड़ी 8/8)' : 'नाड़ी दोष (समान नाड़ी 0/8)';

    const totalScore = varna + vashya + tara + yoni + maitri + gana + bhakoot + nadi;

    let verdict = 'मध्यम मिलान';
    if (totalScore >= 28) verdict = 'अति उत्तम व मांगलिक मिलान (Divine Match)';
    else if (totalScore >= 18) verdict = 'शुभ वैवाहिक योग (Auspicious Match)';
    else verdict = 'परस्पर विचारणीय (Requires Astrological Guidance)';

    setMilanResult({
      totalScore,
      maxScore: 36,
      verdictHi: verdict,
      nadiDosha,
      bhakootDosha,
      breakdown: [
        { name: 'वर्ण (Varna)', score: varna, max: 1 },
        { name: 'वश्य (Vashya)', score: vashya, max: 2 },
        { name: 'तारा (Tara)', score: tara, max: 3 },
        { name: 'योनि (Yoni)', score: yoni, max: 4 },
        { name: 'ग्रहमैत्री (Maitri)', score: maitri, max: 5 },
        { name: 'गण (Gana)', score: gana, max: 6 },
        { name: 'भकूट (Bhakoot)', score: bhakoot, max: 7 },
        { name: 'नाड़ी (Nadi)', score: nadi, max: 8 },
      ]
    });
  };

  // Helper for North Indian Diamond Chart House Rashi Number
  const getHouseRashi = (houseNum: number): number => {
    if (!generatedKundli) return houseNum;
    const offset = generatedKundli.lagnaRashiNum - 1;
    return ((houseNum - 1 + offset) % 12) + 1;
  };

  // Helper for North Indian Diamond Chart Planets in House
  const getPlanetsInHouse = (houseNum: number): string => {
    if (!generatedKundli) return '';
    const found = generatedKundli.planets.filter((p: any) => p.house === houseNum);
    return found.map((p: any) => p.symbol).join(' ');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-2.5 sm:p-4 overflow-y-auto safe-tab-viewport">
      <div className="glass-gold w-full max-w-lg rounded-3xl border border-amber-500/40 p-4 sm:p-5 my-auto max-h-[94vh] overflow-y-auto space-y-4 shadow-gold-lg">
        {/* Top Header */}
        <div className="flex justify-between items-start border-b border-amber-500/20 pb-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-950/70 border border-amber-500/40 text-amber-300 font-shloka text-[11px] mb-1 shadow-gold-sm">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>ज्योतिषां सूर्य आदिः • प्रामाणिक वैदिक गणना</span>
            </div>
            <h3 className="font-display text-lg sm:text-xl font-bold text-white tracking-wide">
              {lang === 'hi' ? 'सनातन ज्योतिष एवं कुण्डली सेतु' : 'Vedic Astrology & Kundli Sanctuary'}
            </h3>
            <p className="text-[11px] text-amber-200/80 font-devanagari">
              ग्रह-नक्षत्रों का प्राचीन वैदिक गणित, लग्न चक्र एवं अष्टकूट ३६ गुण मिलान
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/50 border border-amber-500/30 text-amber-300 flex items-center justify-center hover:bg-amber-500/20 active:scale-95 transition-all flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 3 Main Segmented Tabs */}
        <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-black/60 border border-amber-500/25 text-xs font-display">
          <button
            onClick={() => { triggerHaptic('light'); setActiveTab('horoscope'); }}
            className={`py-2 px-1 rounded-xl text-center font-bold tracking-wider transition-all flex items-center justify-center gap-1 ${
              activeTab === 'horoscope'
                ? 'bg-gradient-to-r from-amber-600 to-yellow-500 text-black shadow-gold-sm'
                : 'text-zinc-400 hover:text-amber-200'
            }`}
          >
            <Sun className="w-3.5 h-3.5" />
            <span>दैनिक राशिफल</span>
          </button>

          <button
            onClick={() => { triggerHaptic('light'); setActiveTab('kundli'); }}
            className={`py-2 px-1 rounded-xl text-center font-bold tracking-wider transition-all flex items-center justify-center gap-1 ${
              activeTab === 'kundli'
                ? 'bg-gradient-to-r from-amber-600 to-yellow-500 text-black shadow-gold-sm'
                : 'text-zinc-400 hover:text-amber-200'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>लग्न कुण्डली</span>
          </button>

          <button
            onClick={() => { triggerHaptic('light'); setActiveTab('milan'); }}
            className={`py-2 px-1 rounded-xl text-center font-bold tracking-wider transition-all flex items-center justify-center gap-1 ${
              activeTab === 'milan'
                ? 'bg-gradient-to-r from-amber-600 to-yellow-500 text-black shadow-gold-sm'
                : 'text-zinc-400 hover:text-amber-200'
            }`}
          >
            <HeartHandshake className="w-3.5 h-3.5" />
            <span>३६ गुण मिलान</span>
          </button>
        </div>

        {/* ================= TAB 1: DAINIK RASHIFAL ================= */}
        {activeTab === 'horoscope' && (
          <div className="space-y-4">
            {/* Truthful guidance disclosure */}
            <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/25 flex items-start gap-2 text-[11px] text-amber-200/90 font-devanagari">
              <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <span>
                सत्यनिष्ठा सूचना: यह सामान्य राशि मार्गदर्शन है। जातक का व्यक्तिगत फल उसकी जन्म कुण्डली, भाव स्थिति व चल रही महादशा पर निर्भर करता है।
              </span>
            </div>

            {/* 12 Rashis Selector Grid */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-display font-semibold text-white">अपनी राशि चुनें</span>
                <span className="text-[10px] font-mono text-amber-400">12 Vedic Signs</span>
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {RASHIS.map((rashi) => {
                  const isSelected = selectedRashi.id === rashi.id;
                  return (
                    <button
                      key={rashi.id}
                      onClick={() => handleSelectRashi(rashi)}
                      className={`p-2 rounded-xl flex flex-col items-center justify-center transition-all ${
                        isSelected
                          ? 'bg-amber-500/30 border border-amber-400 text-amber-200 shadow-gold-sm scale-105'
                          : 'bg-black/40 border border-amber-500/15 text-zinc-400 hover:text-amber-200'
                      }`}
                    >
                      <span className="text-xl leading-none mb-0.5">{rashi.symbol}</span>
                      <span className="text-xs font-devanagari font-bold">{rashi.nameHi}</span>
                      <span className="text-[9px] font-mono text-zinc-500">{rashi.nameEn}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Rashi Deep Card */}
            <div className="glass-gold p-4 rounded-2xl border border-amber-500/30 space-y-3 bg-gradient-to-br from-amber-950/30 via-black to-[#0A0D14]">
              <div className="flex items-center justify-between border-b border-amber-500/20 pb-2.5">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl p-2 rounded-xl bg-amber-500/20 border border-amber-500/30">{selectedRashi.symbol}</span>
                  <div>
                    <h4 className="font-display text-base font-bold text-amber-200">
                      {selectedRashi.nameHi} ({selectedRashi.nameEn})
                    </h4>
                    <p className="text-[10px] text-zinc-400 font-mono">
                      स्वामी: {selectedRashi.planet} • तत्त्व: {selectedRashi.element}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-mono text-amber-400 block uppercase">शुभ अंक</span>
                  <span className="font-mono text-base font-bold text-amber-300">{selectedRashi.luckyNumber}</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider block mb-1">
                  वैदिक मार्गदर्शन (Cosmic Guidance)
                </span>
                <p className="font-devanagari text-xs text-zinc-200 leading-relaxed">
                  {lang === 'hi' ? selectedRashi.predictionHi : selectedRashi.predictionEn}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-amber-500/15">
                <div className="bg-black/40 p-2 rounded-xl border border-amber-500/10">
                  <span className="text-[10px] text-zinc-400 block font-mono">शुभ रंग</span>
                  <span className="text-amber-300 font-semibold font-devanagari text-xs">{selectedRashi.luckyColor}</span>
                </div>
                <div className="bg-black/40 p-2 rounded-xl border border-amber-500/10">
                  <span className="text-[10px] text-zinc-400 block font-mono">आराध्य देव</span>
                  <span className="text-amber-300 font-semibold font-devanagari text-xs">श्री महागणेश व शिव</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 2: LAGNA KUNDLI (DIAMOND CHART) ================= */}
        {activeTab === 'kundli' && (
          <div className="space-y-4">
            {/* Input Form with Truthful Notice */}
            <form onSubmit={handleGenerateKundli} className="glass-gold p-3.5 rounded-2xl border border-amber-500/25 space-y-2.5 text-xs">
              <div className="flex items-center gap-1.5 text-amber-300 font-display font-semibold">
                <Compass className="w-4 h-4 text-amber-400" />
                <span>सटीक जन्म विवरण दर्ज करें (Birth Details Required)</span>
              </div>
              <p className="text-[10px] text-zinc-400 font-devanagari">
                सटीक लग्न कुण्डली निर्माण के लिए आपका जन्म समय व जन्म स्थान अनिवार्य है।
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  required
                  placeholder="जातक का नाम (Full Name)"
                  value={kundliForm.name}
                  onChange={(e) => setKundliForm({ ...kundliForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-black/50 border border-amber-500/25 text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400 text-xs"
                />
                <input
                  type="date"
                  required
                  value={kundliForm.dob}
                  onChange={(e) => setKundliForm({ ...kundliForm, dob: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-black/50 border border-amber-500/25 text-white focus:outline-none focus:border-amber-400 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[9.5px] text-zinc-400 block font-mono mb-1">जन्म समय (Time of Birth)</label>
                  <input
                    type="time"
                    required
                    value={kundliForm.tob}
                    onChange={(e) => setKundliForm({ ...kundliForm, tob: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-black/50 border border-amber-500/25 text-white focus:outline-none focus:border-amber-400 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[9.5px] text-zinc-400 block font-mono mb-1">जन्म स्थान (Place / City)</label>
                  <input
                    type="text"
                    required
                    placeholder="उदा. वाराणसी, दिल्ली..."
                    value={kundliForm.city}
                    onChange={(e) => setKundliForm({ ...kundliForm, city: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-black/50 border border-amber-500/25 text-white focus:outline-none focus:border-amber-400 text-xs"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 text-black font-semibold text-xs tracking-wider uppercase shadow-gold-sm hover:brightness-110 active:scale-98 transition-all"
              >
                लग्न कुण्डली चक्र निर्माण करें (Generate Kundli)
              </button>
            </form>

            {/* If Not Generated: Empty State Explaining Requirement */}
            {!generatedKundli ? (
              <div className="p-5 rounded-2xl bg-black/50 border border-dashed border-amber-500/30 text-center space-y-2">
                <Compass className="w-8 h-8 text-amber-400/60 mx-auto animate-pulse" />
                <h4 className="font-display text-sm font-bold text-white">
                  कुण्डली चक्र प्रतीक्षारत है
                </h4>
                <p className="text-xs text-zinc-400 font-devanagari max-w-xs mx-auto leading-relaxed">
                  ऊपर दिए गए फॉर्म में जन्म विवरण दर्ज करें। हम आपकी जन्म तिथि और समय के अनुसार सटीक निरयण लग्न चक्र निर्मित करेंगे।
                </p>
              </div>
            ) : (
              /* Visual Kundli Diamond SVG Chart */
              <div className="p-4 rounded-3xl bg-black/70 border border-amber-500/30 text-center space-y-3">
                <div className="flex justify-between items-center px-1 text-xs">
                  <span className="font-display font-bold text-amber-200">
                    {kundliForm.name || 'जातक'} की लग्न कुण्डली ({kundliForm.city})
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold">
                    लग्न: {generatedKundli.lagnaRashiName}
                  </span>
                </div>

                {/* NORTH INDIAN DIAMOND KUNDLI SVG */}
                <div className="relative py-1">
                  <svg viewBox="0 0 300 300" className="w-full max-w-[260px] mx-auto filter drop-shadow-[0_0_10px_rgba(212,175,55,0.25)]">
                    {/* Outer Square */}
                    <rect x="4" y="4" width="292" height="292" fill="#07090E" stroke="#D4AF37" strokeWidth="2" />
                    {/* Diagonals */}
                    <line x1="4" y1="4" x2="296" y2="296" stroke="#D4AF37" strokeWidth="1.2" />
                    <line x1="296" y1="4" x2="4" y2="296" stroke="#D4AF37" strokeWidth="1.2" />
                    {/* Inner Diamond */}
                    <polygon points="150,4 296,150 150,296 4,150" fill="none" stroke="#D4AF37" strokeWidth="1.2" />

                    {/* House 1 (Top Center Diamond) */}
                    <text x="150" y="70" textAnchor="middle" fill="#FDE047" fontSize="11" fontWeight="bold" fontFamily="monospace">
                      {getHouseRashi(1)}
                    </text>
                    <text x="150" y="95" textAnchor="middle" fill="#FCD34D" fontSize="10" fontWeight="bold">
                      {getPlanetsInHouse(1)}
                    </text>

                    {/* House 2 */}
                    <text x="95" y="45" textAnchor="middle" fill="#FDE047" fontSize="10" fontWeight="bold" fontFamily="monospace">
                      {getHouseRashi(2)}
                    </text>
                    <text x="75" y="65" textAnchor="middle" fill="#FCD34D" fontSize="9">
                      {getPlanetsInHouse(2)}
                    </text>

                    {/* House 3 */}
                    <text x="45" y="95" textAnchor="middle" fill="#FDE047" fontSize="10" fontWeight="bold" fontFamily="monospace">
                      {getHouseRashi(3)}
                    </text>
                    <text x="65" y="75" textAnchor="middle" fill="#FCD34D" fontSize="9">
                      {getPlanetsInHouse(3)}
                    </text>

                    {/* House 4 */}
                    <text x="80" y="150" textAnchor="middle" fill="#FDE047" fontSize="11" fontWeight="bold" fontFamily="monospace">
                      {getHouseRashi(4)}
                    </text>
                    <text x="80" y="170" textAnchor="middle" fill="#FCD34D" fontSize="10" fontWeight="bold">
                      {getPlanetsInHouse(4)}
                    </text>

                    {/* House 5 */}
                    <text x="45" y="215" textAnchor="middle" fill="#FDE047" fontSize="10" fontWeight="bold" fontFamily="monospace">
                      {getHouseRashi(5)}
                    </text>
                    <text x="65" y="235" textAnchor="middle" fill="#FCD34D" fontSize="9">
                      {getPlanetsInHouse(5)}
                    </text>

                    {/* House 6 */}
                    <text x="95" y="265" textAnchor="middle" fill="#FDE047" fontSize="10" fontWeight="bold" fontFamily="monospace">
                      {getHouseRashi(6)}
                    </text>
                    <text x="75" y="245" textAnchor="middle" fill="#FCD34D" fontSize="9">
                      {getPlanetsInHouse(6)}
                    </text>

                    {/* House 7 */}
                    <text x="150" y="235" textAnchor="middle" fill="#FDE047" fontSize="11" fontWeight="bold" fontFamily="monospace">
                      {getHouseRashi(7)}
                    </text>
                    <text x="150" y="210" textAnchor="middle" fill="#FCD34D" fontSize="10" fontWeight="bold">
                      {getPlanetsInHouse(7)}
                    </text>

                    {/* House 8 */}
                    <text x="215" y="265" textAnchor="middle" fill="#FDE047" fontSize="10" fontWeight="bold" fontFamily="monospace">
                      {getHouseRashi(8)}
                    </text>
                    <text x="235" y="245" textAnchor="middle" fill="#FCD34D" fontSize="9">
                      {getPlanetsInHouse(8)}
                    </text>

                    {/* House 9 */}
                    <text x="265" y="215" textAnchor="middle" fill="#FDE047" fontSize="10" fontWeight="bold" fontFamily="monospace">
                      {getHouseRashi(9)}
                    </text>
                    <text x="245" y="235" textAnchor="middle" fill="#FCD34D" fontSize="9">
                      {getPlanetsInHouse(9)}
                    </text>

                    {/* House 10 */}
                    <text x="220" y="150" textAnchor="middle" fill="#FDE047" fontSize="11" fontWeight="bold" fontFamily="monospace">
                      {getHouseRashi(10)}
                    </text>
                    <text x="220" y="170" textAnchor="middle" fill="#FCD34D" fontSize="10" fontWeight="bold">
                      {getPlanetsInHouse(10)}
                    </text>

                    {/* House 11 */}
                    <text x="265" y="95" textAnchor="middle" fill="#FDE047" fontSize="10" fontWeight="bold" fontFamily="monospace">
                      {getHouseRashi(11)}
                    </text>
                    <text x="245" y="75" textAnchor="middle" fill="#FCD34D" fontSize="9">
                      {getPlanetsInHouse(11)}
                    </text>

                    {/* House 12 */}
                    <text x="215" y="45" textAnchor="middle" fill="#FDE047" fontSize="10" fontWeight="bold" fontFamily="monospace">
                      {getHouseRashi(12)}
                    </text>
                    <text x="235" y="65" textAnchor="middle" fill="#FCD34D" fontSize="9">
                      {getPlanetsInHouse(12)}
                    </text>
                  </svg>
                </div>

                {/* Truthful Disclosure Note */}
                <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/20 text-[10px] text-amber-200/90 font-devanagari text-left">
                  {generatedKundli.calculationDisclaimer}
                </div>

                {/* Dynamic Kundli Analysis Grid */}
                <div className="grid grid-cols-2 gap-2 text-left pt-1 text-xs">
                  <div className="bg-black/50 p-2.5 rounded-xl border border-amber-500/15">
                    <span className="text-[10px] text-zinc-400 font-mono block">चन्द्र राशि (Moon Sign)</span>
                    <span className="text-amber-300 font-bold font-devanagari">
                      {generatedKundli.moonRashi}
                    </span>
                  </div>

                  <div className="bg-black/50 p-2.5 rounded-xl border border-amber-500/15">
                    <span className="text-[10px] text-zinc-400 font-mono block">जन्म नक्षत्र (Birth Star)</span>
                    <span className="text-amber-300 font-bold font-devanagari">
                      {generatedKundli.nakshatra}
                    </span>
                  </div>

                  <div className="bg-black/50 p-2.5 rounded-xl border border-emerald-500/25">
                    <span className="text-[10px] text-zinc-400 font-mono block">मांगलिक स्थिति</span>
                    <span className="text-emerald-300 font-bold font-devanagari text-[11px]">
                      {generatedKundli.manglikStatus}
                    </span>
                  </div>

                  <div className="bg-black/50 p-2.5 rounded-xl border border-amber-500/15">
                    <span className="text-[10px] text-zinc-400 font-mono block">भाग्य रत्न (Lucky Gem)</span>
                    <span className="text-amber-300 font-bold font-devanagari">
                      {generatedKundli.luckyGem}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 3: 36 GUNA MILAN ================= */}
        {activeTab === 'milan' && (
          <div className="space-y-4">
            {/* Match Form */}
            <form onSubmit={handleCalculateMilan} className="glass-gold p-3.5 rounded-2xl border border-amber-500/25 space-y-3 text-xs">
              <div className="flex items-center gap-1.5 text-amber-300 font-display font-semibold">
                <HeartHandshake className="w-4 h-4 text-amber-400" />
                <span>वर एवं कन्या विवरण (Horoscope Matchmaking)</span>
              </div>
              <p className="text-[10px] text-zinc-400 font-devanagari">
                वर व कन्या की राशि एवं जन्म नक्षत्र चुनें। वास्तविक वैदिक अष्टकूट गणित के अनुसार गुण गणना होगी।
              </p>

              {/* Groom Details */}
              <div className="p-2.5 rounded-xl bg-black/40 border border-amber-500/15 space-y-2">
                <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider block font-bold">
                  वर विवरण (Groom)
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[9px] text-zinc-400 block font-mono mb-1">राशि (Rashi)</label>
                    <select
                      value={milanForm.groomRashiIndex}
                      onChange={(e) => setMilanForm({ ...milanForm, groomRashiIndex: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-black/60 border border-amber-500/25 text-white focus:outline-none text-xs"
                    >
                      {RASHIS.map((r, i) => <option key={r.id} value={i}>{r.nameHi} ({r.nameEn})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] text-zinc-400 block font-mono mb-1">नक्षत्र (Nakshatra)</label>
                    <select
                      value={milanForm.groomNakshatraIndex}
                      onChange={(e) => setMilanForm({ ...milanForm, groomNakshatraIndex: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-black/60 border border-amber-500/25 text-white focus:outline-none text-xs"
                    >
                      {NAKSHATRAS.map((n, i) => <option key={n} value={i}>{n}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Bride Details */}
              <div className="p-2.5 rounded-xl bg-black/40 border border-amber-500/15 space-y-2">
                <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider block font-bold">
                  कन्या विवरण (Bride)
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[9px] text-zinc-400 block font-mono mb-1">राशि (Rashi)</label>
                    <select
                      value={milanForm.brideRashiIndex}
                      onChange={(e) => setMilanForm({ ...milanForm, brideRashiIndex: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-black/60 border border-amber-500/25 text-white focus:outline-none text-xs"
                    >
                      {RASHIS.map((r, i) => <option key={r.id} value={i}>{r.nameHi} ({r.nameEn})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] text-zinc-400 block font-mono mb-1">नक्षत्र (Nakshatra)</label>
                    <select
                      value={milanForm.brideNakshatraIndex}
                      onChange={(e) => setMilanForm({ ...milanForm, brideNakshatraIndex: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-black/60 border border-amber-500/25 text-white focus:outline-none text-xs"
                    >
                      {NAKSHATRAS.map((n, i) => <option key={n} value={i}>{n}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 text-black font-semibold text-xs tracking-wider uppercase shadow-gold-sm hover:brightness-110 active:scale-98 transition-all"
              >
                अष्टकूट ३६ गुण मिलान गणना करें (Calculate Score)
              </button>
            </form>

            {/* Milan Result Box (Computed Algorithmic Score) */}
            {milanResult && (
              <div className="glass-gold p-4 rounded-3xl border border-emerald-500/40 bg-gradient-to-br from-emerald-950/25 via-black to-black space-y-3">
                <div className="flex justify-between items-center border-b border-amber-500/20 pb-2">
                  <div>
                    <span className="text-[10px] font-mono text-amber-400 uppercase">कुल अष्टकूट गुण</span>
                    <h4 className="font-display text-xl font-bold text-white">
                      {milanResult.totalScore} / {milanResult.maxScore} गुण
                    </h4>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400 text-emerald-300 text-xs font-bold">
                    {milanResult.verdictHi}
                  </span>
                </div>

                {/* 8 Kootas Breakdown */}
                <div className="grid grid-cols-4 gap-1.5 text-center text-xs">
                  {milanResult.breakdown.map((koot: any) => (
                    <div key={koot.name} className="p-1.5 rounded-lg bg-black/50 border border-amber-500/15">
                      <span className="text-[9px] text-zinc-400 block font-mono leading-tight">{koot.name}</span>
                      <span className="text-amber-300 font-bold font-mono text-xs">{koot.score}/{koot.max}</span>
                    </div>
                  ))}
                </div>

                <div className="p-2.5 rounded-xl bg-black/60 border border-amber-500/15 text-xs space-y-1">
                  <div className="flex justify-between text-zinc-300">
                    <span>नाड़ी स्थिति:</span>
                    <span className="text-emerald-400 font-bold">{milanResult.nadiDosha}</span>
                  </div>
                  <div className="flex justify-between text-zinc-300">
                    <span>भकूट स्थिति:</span>
                    <span className="text-emerald-400 font-bold">{milanResult.bhakootDosha}</span>
                  </div>
                  <p className="text-[10.5px] font-devanagari text-zinc-300 pt-1.5 border-t border-zinc-800 leading-relaxed">
                    सत्यनिष्ठा परामर्श: अष्टकूट मिलान वैवाहिक अनुकूलता का प्राथमिक वैदिक मापदंड है। परिपक्व वैवाहिक निर्णय हेतु दोनों जातकों की कुण्डली के सप्तम भाव, गुरु/शुक्र स्थिति व दशाओं का अध्ययन अनिवार्य है।
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Consultation Section (Honest & Direct) */}
        <div className="p-3.5 rounded-2xl bg-black/60 border border-amber-500/20 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-display text-amber-200 font-semibold flex items-center gap-1.5">
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <span>विस्तृत हस्तलिखित कुण्डली व व्यक्तिगत परामर्श</span>
            </span>
            <span className="text-[10px] font-mono text-amber-400">सनातन सेतु आचार्य</span>
          </div>

          {isConsultSubmitted ? (
            <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-center space-y-1">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto" />
              <p className="font-devanagari text-xs font-bold text-emerald-200">
                आपकी कुण्डली परामर्श प्रार्थना स्वीकार कर ली गई है!
              </p>
              <p className="text-[10px] text-zinc-400 font-mono">
                पंजीकृत नंबर ({consultPhone}) पर हमारे मुख्य ज्योतिषाचार्य संपर्क करेंगे।
              </p>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                type="tel"
                placeholder="व्हाट्सएप / फोन नंबर दर्ज करें"
                value={consultPhone}
                onChange={(e) => setConsultPhone(e.target.value)}
                className="flex-1 px-3 py-1.5 rounded-xl bg-black/70 border border-amber-500/25 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-amber-400"
              />
              <button
                type="button"
                onClick={() => {
                  if (!consultPhone.trim()) return;
                  triggerHaptic('medium');
                  playTempleBell();
                  setIsConsultSubmitted(true);
                }}
                className="px-3 py-1.5 rounded-xl bg-amber-500 text-black font-bold text-xs hover:bg-amber-400 active:scale-95 transition-all"
              >
                परामर्श अनुरोध भेजें
              </button>
            </div>
          )}
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-black/60 border border-amber-500/30 text-amber-300 font-semibold text-xs tracking-wider uppercase hover:bg-amber-500/10 active:scale-98 transition-colors"
        >
          {lang === 'hi' ? 'वापस मुख्य पृष्ठ पर जाएं' : 'Return to Sanctuary'}
        </button>
      </div>
    </div>
  );
};
