export interface PalmChapter {
  id: string;
  titleHi: string;
  titleEn: string;
  bodyHi: string[];
  bodyEn: string[];
}

export const PALMISTRY_CHAPTERS: PalmChapter[] = [
  {
    id: 'intro',
    titleHi: 'हस्तरेखा विज्ञान — परिचय',
    titleEn: 'Palmistry — Introduction',
    bodyHi: [
      'हस्तरेखा (Chiromancy) प्राचीन भारतीय व ग्रीक परंपरा की आध्यात्मिक विज्ञान शाखा है। हथेली की रेखाएँ, पर्वत व उंगलियों का अध्ययन जीवन-स्वभाव की झलक देता है।',
      'यह शास्त्र भाग्य को कठोर नियति नहीं, अपितु प्रवृत्ति-मार्गदर्शन मानता है। कर्म से पथ बदलते हैं — यही सनातन सिद्धांत है।',
      'सत्यनिष्ठा सूचना: यह शैक्षिक अध्ययन है। चिकित्सकीय या वित्तीय निर्णय हेतु पारंपरिक आचार्य से परामर्श लें।'
    ],
    bodyEn: [
      'Palmistry (Chiromancy) is a spiritual science from ancient Indian and Greek traditions. Lines, mounts and fingers reveal glimpses of temperament.',
      'This science treats fate not as hard destiny but as tendency and guidance. Karma can change the path — the Sanatan view.',
      'Disclosure: this is educational study. For medical or financial decisions, consult a qualified traditional guide.'
    ]
  },
  {
    id: 'majorLines',
    titleHi: 'प्रमुख रेखाएँ — हृदय, मस्तिष्क, जीवन',
    titleEn: 'Major Lines — Heart, Head, Life',
    bodyHi: [
      'हृदय रेखा (Heart Line): भावनात्मक परिपक्वता, प्रेम-स्वभाव व संबंधों की गहराई दर्शाती है। स्पष्ट व लंबी रेखा स्थिर हृदय-बुद्धि का संकेत है।',
      'मस्तिष्क रेखा (Head Line): निर्णय-शक्ति, विश्लेषण व कल्पना की गुणवत्ता बताती है। यह रेखा जीवन में सीखने-समझने की शैली प्रकट करती है।',
      'जीवन रेखा (Life Line): ऊर्जा, आत्मविश्वास व जीवन-उत्साह का प्रतीक है — यह अवधि नहीं, जीवन-गुणवत्ता दर्शाती है।'
    ],
    bodyEn: [
      'Heart Line: emotional maturity, love nature and depth of bonds. A clear long line suggests steady emotional intelligence.',
      'Head Line: decision power, analysis and imagination. Shows how you learn and judge through life.',
      'Life Line: vitality, confidence and zest — it reflects quality of living, not mere lifespan.'
    ]
  },
  {
    id: 'otherLines',
    titleHi: 'अन्य रेखाएँ — भाग्य, सूर्य, विवाह',
    titleEn: 'Other Lines — Fate, Sun, Marriage',
    bodyHi: [
      'भाग्य रेखा (Fence/Fate): कर्म-क्षेत्र में उपलब्धि व दिशा-परिवर्तन के क्षण दर्शाती है।',
      'सूर्य रेखा (Sun Line): यश, कला व प्रसिद्धि की संभावना — अनुशासित साधना से प्रबल होती है।',
      'विवाह/संबंध रेखाएँ: जीवनसाथी-संबंध की प्रकृति की शैक्षिक झलक देती हैं; एकल निर्णय-आधार नहीं।'
    ],
    bodyEn: [
      'Fate line: peaks of achievement and turning points in career karma.',
      'Sun line: fame, art and recognition — strengthened by disciplined sadhana.',
      'Marriage/relationship lines: educational glimpse of partnership nature — never a single verdict.'
    ]
  },
  {
    id: 'mounts',
    titleHi: 'पर्वत व उंगलियाँ',
    titleEn: 'Mounts & Fingers',
    bodyHi: [
      'शनि पर्वत (चंद्र पर्वत के नीचे): अनुशासन, धैर्य व आध्यात्मिक गहराई।',
      'गुरु पर्वत (तर्जनी के नीचे): ज्ञान-पिपासा, वैवाहिक सुख व उदारता।',
      'बुध पर्वत (अंगूठे के पास): व्यावसायिक बुद्धि, वाणी व व्यापार-कौशल।',
      'उंगली अनुपात: तर्जनी नेतृत्व, मध्यमा कर्तव्य-बुद्धि, अनामिका कला-यश, कनिष्ठा व्यवहार-विवेक दर्शाती है।'
    ],
    bodyEn: [
      'Saturn mount (below Moon): discipline, patience and spiritual depth.',
      'Jupiter mount (below index): wisdom, marital happiness and generosity.',
      'Mercury mount (near thumb): business intellect, speech and trade skill.',
      'Finger ratios: index = leadership, middle = duty-intelligence, ring = art-fame, little = practical wit.'
    ]
  },
  {
    id: 'guidance',
    titleHi: 'मार्गदर्शन व निष्कर्ष',
    titleEn: 'Guidance & Conclusion',
    bodyHi: [
      'रेखाएँ समय के साथ सूक्ष्म परिवर्तन ला सकती हैं — सत्संग, सेवा व साधना उन्हें प्रबल करती है।',
      'सनातन दृष्टि: हस्त देखो, कर्म करो। भाग्य-कल्पना निरर्थक है यदि कर्म-मार्ग शिथिल हो।',
      'GARUDA सत्यनिष्ठा: यह सामग्री शैक्षिक है — कोई चमत्कारिक दावा नहीं।'
    ],
    bodyEn: [
      'Lines may subtly shift with time — satsang, seva and sadhana strengthen them.',
      'Sanatan view: read the hand, do the karma. Fate-fantasy is empty without action.',
      'GARUDA honesty: educational content only — no miraculous claims.'
    ]
  }
];
