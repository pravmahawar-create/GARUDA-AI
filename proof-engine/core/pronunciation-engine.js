/**
 * 🦅 GARUDA PRODUCT PROOF ENGINE - HINDI / HINGLISH PRONUNCIATION ENGINE
 * 
 * Preprocessing layer for Microsoft hi-IN-SwaraNeural:
 * 1. Separates display_text (clean Hinglish for subtitles/HUD) from speech_text (phonetic Devanagari for TTS).
 * 2. Normalizes English business/tech terms, acronyms, and Indian currency/percentages.
 * 3. Classifies vocabulary into linguistic tiers (Native Hindi, Natural Hinglish, Acronym, Brand, Currency).
 * 4. Strictly avoids Sanskritized book Hindi — targets polished Urban Indian Product Specialist delivery.
 */

const fs = require('fs');
const path = require('path');

class PronunciationEngine {
  constructor() {
    // 1. Reusable GARUDA Pronunciation Dictionary
    this.dictionary = {
      // Brand & Product
      'GARUDA Billing': 'गरुड़ बिलिंग',
      'GARUDA': 'गरुड़',
      'Garuda': 'गरुड़',
      'garuda': 'गरुड़',
      'garudaos.in': 'गरुड़ ओ एस डॉट इन',
      'garudaos.in/chat': 'गरुड़ ओ एस डॉट इन स्लैश चैट',

      // Technical Acronyms
      'GSTIN': 'जीएसटीआईएन',
      'GST': 'जीएसटी',
      'CGST': 'सी जीएसटी',
      'SGST': 'एस जीएसटी',
      'IGST': 'आई जीएसटी',
      'POS': 'पीओएस',
      'UPI': 'यूपीआई',
      'PDF': 'पीडीएफ',
      'QR': 'क्यूआर',
      'SMS': 'एसएमएस',
      'HSN': 'एचएसएन',
      'UI': 'यूआई',
      'CTA': 'सीटीए',
      'IndexedDB': 'इंडेक्स डीबी',
      'indexedDB': 'इंडेक्स डीबी',

      // Core Business & Software Terms (Urban Hinglish delivery)
      'Billing': 'बिलिंग',
      'billing': 'बिलिंग',
      'Bill': 'बिल',
      'bill': 'बिल',
      'Bills': 'बिल्स',
      'bills': 'बिल्स',
      'Customer': 'कस्टमर',
      'customer': 'कस्टमर',
      'Customers': 'कस्टमर्स',
      'customers': 'कस्टमर्स',
      'Software': 'सॉफ्टवेयर',
      'software': 'सॉफ्टवेयर',
      'Receipt': 'रिसीट',
      'receipt': 'रिसीट',
      'Offline': 'ऑफलाइन',
      'offline': 'ऑफलाइन',
      'Online': 'ऑनलाइन',
      'online': 'ऑनलाइन',
      'Workflow': 'वर्कफ़्लो',
      'workflow': 'वर्कफ़्लो',
      'Workflows': 'वर्कफ़्लोज़',
      'workflows': 'वर्कफ़्लोज़',
      'Feature': 'फीचर',
      'feature': 'फीचर',
      'Features': 'फीचर्स',
      'features': 'फीचर्स',
      'Business': 'बिज़नेस',
      'business': 'बिज़नेस',
      'Product': 'प्रोडक्ट',
      'product': 'प्रोडक्ट',
      'Tax': 'टैक्स',
      'tax': 'टैक्स',
      'Taxes': 'टैक्सेस',
      'taxes': 'टैक्सेस',
      'Total': 'टोटल',
      'total': 'टोटल',
      'Grand Total': 'ग्रैंड टोटल',
      'grand total': 'ग्रैंड टोटल',
      'Subtotal': 'सबटोटल',
      'subtotal': 'सबटोटल',
      'Thermal': 'थर्मल',
      'thermal': 'थर्मल',
      'Printer': 'प्रिंटर',
      'printer': 'प्रिंटर',
      'Data': 'डेटा',
      'data': 'डेटा',
      'Local': 'लोकल',
      'local': 'लोकल',
      'Database': 'डेटाबेस',
      'database': 'डेटाबेस',
      'Save': 'सेव',
      'save': 'सेव',
      'Generate': 'जनरेट',
      'generate': 'जनरेट',
      'System': 'सिस्टम',
      'system': 'सिस्टम',
      'Systems': 'सिस्टम्स',
      'systems': 'सिस्टम्स',
      'Engineering': 'इंजीनियरिंग',
      'engineering': 'इंजीनियरिंग',
      'Engineered': 'इंजीनियर्ड',
      'engineered': 'इंजीनियर्ड',
      'Custom': 'कस्टम',
      'custom': 'कस्टम',
      'Customized': 'कस्टमाइज़्ड',
      'customized': 'कस्टमाइज़्ड',
      'Template': 'टेम्प्लेट',
      'template': 'टेम्प्लेट',
      'Templates': 'टेम्प्लेट्स',
      'templates': 'टेम्प्लेट्स',
      'Invoice': 'इनवॉइस',
      'invoice': 'इनवॉइस',
      'Invoices': 'इनवॉइसेस',
      'invoices': 'इनवॉइसेस',
      'Item': 'आइटम',
      'item': 'आइटम',
      'Items': 'आइटम्स',
      'items': 'आइटम्स',
      'Catalog': 'कैटलॉग',
      'catalog': 'कैटलॉग',
      'Select': 'सेलेक्ट',
      'select': 'सेलेक्ट',
      'Add': 'ऐड',
      'add': 'ऐड',
      'Update': 'अपडेट',
      'update': 'अपडेट',
      'Click': 'क्लिक',
      'click': 'क्लिक',
      'Tap': 'टैप',
      'tap': 'टैप',
      'Format': 'फॉर्मेट',
      'format': 'फॉर्मेट',
      'Print': 'प्रिंट',
      'print': 'प्रिंट',
      'Printing': 'प्रिंटिंग',
      'printing': 'प्रिंटिंग',
      'Counter': 'काउंटर',
      'counter': 'काउंटर',
      'Setup': 'सेटअप',
      'setup': 'सेटअप',
      'Live': 'लाइव',
      'live': 'लाइव',
      'Real-time': 'रियल-टाइम',
      'real-time': 'रियल-टाइम',
      'Real time': 'रियल टाइम',
      'real time': 'रियल टाइम',
      'Proof': 'प्रूफ',
      'proof': 'प्रूफ',
      'Verified': 'वेरिफाइड',
      'verified': 'वेरिफाइड',
      'Ready': 'रेडी',
      'ready': 'रेडी',
      'Single-click': 'सिंगल क्लिक',
      'single-click': 'सिंगल क्लिक',
      'One-click': 'वन क्लिक',
      'one-click': 'वन क्लिक',
      'Single tap': 'सिंगल टैप',
      'single tap': 'सिंगल टैप',
      'Mode': 'मोड',
      'mode': 'मोड',
      'Hardware': 'हार्डवेयर',
      'hardware': 'हार्डवेयर',
      'Cement': 'सीमेंट',
      'cement': 'सीमेंट',
      'Steel': 'स्टील',
      'steel': 'स्टील',
      'UltraTech': 'अल्ट्राटेक',
      'TMT': 'टी एम टी',
      'Sharma': 'शर्मा',
      'Internet': 'इंटरनेट',
      'internet': 'इंटरनेट',
      'Calculation': 'कैलकुलेशन',
      'calculation': 'कैलकुलेशन',
      'Auto': 'ऑटो',
      'auto': 'ऑटो',
      'Automatically': 'ऑटोमैटिकली',
      'automatically': 'ऑटोमैटिकली',
      'Actual': 'एक्चुअल',
      'actual': 'एक्चुअल',
      'Continue': 'कंटिन्यू',
      'continue': 'कंटिन्यू',
      'Breakup': 'ब्रेकअप',
      'breakup': 'ब्रेकअप',
      'Rate': 'रेट',
      'rate': 'रेट',
      'Generic': 'जेनेरिक',
      'generic': 'जेनेरिक',
      'Tailored': 'टेलर-मेड',
      'tailored': 'टेलर-मेड',
      'Focus': 'फोकस',
      'focus': 'फोकस',
      'Difference': 'डिफरेंस',
      'difference': 'डिफरेंस',
      'Solution': 'सॉल्यूशन',
      'solution': 'सॉल्यूशन',
      'Excuses': 'एक्सक्यूज़ेस',
      'excuses': 'एक्सक्यूज़ेस',
      'Platform': 'प्लेटफॉर्म',
      'platform': 'प्लेटफॉर्म',
      'Architecture': 'आर्किटेक्चर',
      'architecture': 'आर्किटेक्चर',
      'Visit': 'विज़िट',
      'visit': 'विज़िट',
      'Connect': 'कनेक्ट',
      'connect': 'कनेक्ट',
      'Mobile': 'मोबाइल',
      'mobile': 'मोबाइल',
      'Number': 'नंबर',
      'number': 'नंबर'
    };

    // Words commonly mispronounced in Hindi when written in Latin script
    this.hindiPronunciationMap = {
      'kyun': 'क्यों',
      'kyunki': 'क्योंकि',
      'yaani': 'यानी',
      'zaroori': 'ज़रूरी',
      'zaruri': 'ज़रूरी',
      'seedhe': 'सीधे',
      'seedha': 'सीधा',
      'banaiye': 'बनाइए',
      'kijiye': 'कीजिए',
      'dikhiye': 'देखिए',
      'dekhiye': 'देखिए',
      'yahan': 'यहाँ',
      'wahan': 'वहाँ',
      'abhi': 'अभी',
      'phir': 'फिर',
      'bina': 'बिना',
      'sirf': 'सिर्फ़',
      'lekin': 'लेकिन',
      'aapke': 'आपके',
      'vyavasay': 'व्यवसाय',
      'hisaab': 'हिसाब',
      'matlab': 'मतलब',
      'chahiye': 'चाहिए',
      'rehti': 'रहती',
      'chalana': 'चलाना',
      'hai': 'है',
      'hain': 'हैं',
      'aur': 'और',
      'toh': 'तो',
      'bahut': 'बहुत',
      'kahan': 'कहाँ',
      'kar': 'कर',
      'karte': 'करते',
      'karta': 'करता',
      'sakte': 'सकते',
      'sakti': 'सकती',
      'tab': 'तब',
      'ho': 'हो',
      'ye': 'ये',
      'wo': 'वो',
      'ab': 'अब',
      'huye': 'हुए',
      'hua': 'हुआ',
      'apne': 'अपने',
      'apna': 'अपना',
      'aap': 'आप',
      'kuch': 'कुछ',
      'koi': 'कोई',
      'sabse': 'सबसे',
      'pehle': 'पहले',
      'baad': 'बाद',
      'saath': 'साथ',
      'hoga': 'होगा',
      'hogi': 'होगी',
      'honge': 'होंगे',
      'karenge': 'करेंगे',
      'chaliye': 'चलिए',
      'rakhiye': 'रखिए',
      'dekha': 'देखा',
      'par': 'पर',
      'ka': 'का',
      'ke': 'के',
      'ki': 'की',
      'ko': 'को',
      'se': 'से',
      'mein': 'में',
      'bhi': 'भी',
      'gaya': 'गया',
      'na': 'ना',
      'rukti': 'रुकती',
      'nahi': 'नहीं',
      'yahi': 'यही',
      'wala': 'वाला',
      'wali': 'वाली',
      'wale': 'वाले',
      'baat': 'बात'
    };

    // Currency & Number Phonetic Mappings
    this.numberWords = {
      '0': 'ज़ीरो',
      '1': 'एक',
      '2': 'दो',
      '3': 'तीन',
      '4': 'चार',
      '5': 'पाँच',
      '6': 'छह',
      '7': 'सात',
      '8': 'आठ',
      '9': 'नौ',
      '10': 'दस',
      '12': 'बारह',
      '15': 'पंद्रह',
      '18': 'अठारह',
      '50': 'पचास',
      '61': 'इकसठ',
      '100': 'सौ',
      '395': 'तीन सौ पचानवे',
      '4661': 'चार हज़ार छह सौ इकसठ',
      '8975': 'आठ हज़ार नौ सौ पचहत्तर'
    };
  }

  /**
   * Normalizes a text string into Swara-friendly phonetic speech script.
   */
  normalizeToSpeech(text) {
    if (!text) return '';
    let speech = text;

    // 1. Currency Normalization (e.g. ₹4,661 -> चार हज़ार छह सौ इकसठ रुपये)
    speech = speech.replace(/₹\s*4[,.]?661/g, 'चार हज़ार छह सौ इकसठ रुपये');
    speech = speech.replace(/₹\s*8[,.]?975/g, 'आठ हज़ार नौ सौ पचहत्तर रुपये');
    speech = speech.replace(/₹\s*3[,.]?950/g, 'तीन हज़ार नौ सौ पचास रुपये');
    speech = speech.replace(/₹\s*355\.5/g, 'तीन सौ पचपन रुपये पचास पैसे');
    speech = speech.replace(/₹\s*(\d+)/g, (m, num) => {
      const spelled = this.numberWords[num] || num;
      return `${spelled} रुपये`;
    });

    // 2. Percentage Normalization (e.g. 18% -> अठारह प्रतिशत)
    speech = speech.replace(/18\s*%/g, 'अठारह प्रतिशत');
    speech = speech.replace(/9\s*%/g, 'नौ प्रतिशत');
    speech = speech.replace(/100\s*%/g, 'सौ प्रतिशत');
    speech = speech.replace(/(\d+)\s*%/g, (m, num) => `${this.numberWords[num] || num} प्रतिशत`);

    // 3. Invoice numbers (e.g. #0001 -> ज़ीरो ज़ीरो ज़ीरो वन)
    speech = speech.replace(/#0001/g, 'ज़ीरो ज़ीरो ज़ीरो वन');
    speech = speech.replace(/0001/g, 'ज़ीरो ज़ीरो ज़ीरो वन');

    // 4. Multi-word Dictionary Replacements (Sorted by length descending)
    const dictKeys = Object.keys(this.dictionary).sort((a, b) => b.length - a.length);
    for (const key of dictKeys) {
      const regex = new RegExp(`\\b${this.escapeRegExp(key)}\\b`, 'g');
      speech = speech.replace(regex, this.dictionary[key]);
    }

    // 5. Common Hindi Pronunciation Words (Ensures Swara uses natural spoken Devanagari tones)
    const hindiKeys = Object.keys(this.hindiPronunciationMap).sort((a, b) => b.length - a.length);
    for (const key of hindiKeys) {
      const regex = new RegExp(`\\b${this.escapeRegExp(key)}\\b`, 'gi');
      speech = speech.replace(regex, this.hindiPronunciationMap[key]);
    }

    // 6. Natural pause cleanup
    speech = speech.replace(/\s+/g, ' ').trim();

    return speech;
  }

  /**
   * Helper to escape regex special characters
   */
  escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Analyzes and classifies words in a sentence
   */
  analyzeWords(text) {
    if (!text) return [];
    // Tokenize words
    const tokens = text.match(/[A-Za-z0-9%₹#.-]+|[^\sA-Za-z0-9%₹#.-]+/g) || [];
    const classification = [];

    for (const token of tokens) {
      const clean = token.replace(/^[^\w₹%#]+|[^\w₹%#]+$/g, '');
      if (!clean) continue;

      let type = 'UNKNOWN';
      let phonetic = this.dictionary[clean] || this.hindiPronunciationMap[clean.toLowerCase()] || null;

      if (/^₹?\d+(?:,\d+)*(?:\.\d+)?%?$/.test(clean)) {
        type = clean.startsWith('₹') ? 'CURRENCY' : clean.endsWith('%') ? 'PERCENTAGE' : 'NUMBER';
      } else if (/^[A-Z]{2,6}$/.test(clean)) {
        type = 'ACRONYM';
      } else if (clean.toLowerCase() === 'garuda') {
        type = 'BRAND';
        phonetic = 'गरुड़';
      } else if (this.dictionary[clean] || this.dictionary[this.capitalize(clean)]) {
        type = 'ENGLISH_TERM';
      } else if (this.hindiPronunciationMap[clean.toLowerCase()]) {
        type = 'NATURAL_HINGLISH';
      } else if (/[\u0900-\u097F]/.test(clean)) {
        type = 'NATIVE_HINDI';
      } else {
        type = 'NATURAL_HINGLISH';
      }

      classification.push({
        word: clean,
        type,
        phonetic: phonetic || clean
      });
    }

    return classification;
  }

  capitalize(s) {
    if (!s) return '';
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  /**
   * Prepares a scene object by attaching display_text, speech_text, and word_analysis
   */
  prepareScene(scene) {
    const displayText = scene.narration || '';
    const speechText = this.normalizeToSpeech(displayText);
    const analysis = this.analyzeWords(displayText);

    return {
      ...scene,
      display_text: displayText,
      speech_text: speechText,
      word_analysis: analysis
    };
  }

  /**
   * Exports metadata artifacts required by V4
   */
  exportMetadata(scenes, outputDir) {
    fs.mkdirSync(outputDir, { recursive: true });

    // 1. pronunciation_dictionary.json
    const dictPath = path.join(outputDir, 'pronunciation_dictionary.json');
    fs.writeFileSync(dictPath, JSON.stringify(this.dictionary, null, 2), 'utf-8');

    // 2. narration_script_display.json
    const displayPath = path.join(outputDir, 'narration_script_display.json');
    const displayData = scenes.map(s => ({
      id: s.id,
      name: s.name,
      intent: s.intent,
      display_text: s.display_text || s.narration,
      narrationEn: s.narrationEn
    }));
    fs.writeFileSync(displayPath, JSON.stringify(displayData, null, 2), 'utf-8');

    // 3. narration_script_speech.json
    const speechPath = path.join(outputDir, 'narration_script_speech.json');
    const speechData = scenes.map(s => ({
      id: s.id,
      name: s.name,
      intent: s.intent,
      speech_text: s.speech_text || this.normalizeToSpeech(s.narration),
      energy: s.energy,
      pace: s.pace
    }));
    fs.writeFileSync(speechPath, JSON.stringify(speechData, null, 2), 'utf-8');

    console.log(`✔ [PronunciationEngine] Exported pronunciation metadata to ${outputDir}`);
    return { dictPath, displayPath, speechPath };
  }

  /**
   * Executes the mandatory pronunciation regression test audio
   */
  async runRegressionTest(testAudioPath) {
    const testPhrase = 'GARUDA Billing mein customer select kijiye. Items add kijiye. Ab GST calculation dekhiye. Internet na ho tab bhi offline workflow continue kar sakte hain. Ab bill generate karte hain. Ye actual GST bill hai.';
    const speechScript = this.normalizeToSpeech(testPhrase);

    console.log(`🧪 [PronunciationEngine] Running Pronunciation Regression Test...`);
    console.log(`   Display Text: "${testPhrase}"`);
    console.log(`   Speech Script: "${speechScript}"`);

    const edgeTTS = require('./narration-engine');
    fs.mkdirSync(path.dirname(testAudioPath), { recursive: true });
    
    // Generate test audio via NarrationEngine prosody
    const result = await edgeTTS.generateSceneSpeech(
      { id: 'test_regression', speech_text: speechScript, energy: 0.88, pace: 1.02 },
      testAudioPath
    );

    console.log(`✔ [PronunciationEngine] Regression audio rendered cleanly: ${testAudioPath} (${result.durationSec.toFixed(2)}s)`);
    return {
      phrase: testPhrase,
      speechScript,
      durationSec: result.durationSec,
      path: testAudioPath
    };
  }
}

module.exports = new PronunciationEngine();
