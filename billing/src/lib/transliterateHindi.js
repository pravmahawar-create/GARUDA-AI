// Comprehensive Devanagari to Roman Hinglish Transliteration Boundary
// Converts full Devanagari script text into canonical Roman Hinglish for NLU processing.

const VOWELS = {
  'अ': 'a', 'आ': 'aa', 'इ': 'i', 'ई': 'ee', 'उ': 'u', 'ऊ': 'oo', 'ऋ': 'ri',
  'ए': 'e', 'ऐ': 'ai', 'ओ': 'o', 'औ': 'au', 'अं': 'an', 'अः': 'ah'
}

const MATRAS = {
  'ा': 'a', 'ि': 'i', 'ी': 'ee', 'ु': 'u', 'ू': 'oo', 'ृ': 'ri',
  'े': 'e', 'ै': 'ai', 'ो': 'o', 'ौ': 'au', 'ं': 'n', 'ँ': 'n', 'ः': 'h'
}

const CONSONANTS = {
  'क': 'k', 'ख': 'kh', 'ग': 'g', 'घ': 'gh', 'ङ': 'n',
  'च': 'ch', 'छ': 'chh', 'ज': 'j', 'झ': 'jh', 'ञ': 'n',
  'ट': 't', 'ठ': 'th', 'ड': 'd', 'ढ': 'dh', 'ण': 'n',
  'त': 't', 'थ': 'th', 'द': 'd', 'ध': 'dh', 'न': 'n',
  'प': 'p', 'फ': 'f', 'ब': 'b', 'भ': 'bh', 'म': 'm',
  'य': 'y', 'र': 'r', 'ल': 'l', 'व': 'v', 'श': 'sh',
  'ष': 'sh', 'स': 's', 'ह': 'h', 'क्ष': 'ksh', 'त्र': 'tr', 'ज्ञ': 'gy'
}

const DIGITS = {
  '०': '0', '१': '1', '२': '2', '३': '3', '४': '4',
  '५': '5', '६': '6', '७': '7', '८': '8', '९': '9'
}

const HINDI_WORD_MAP = {
  'अभी': 'abhi',
  'टोटल': 'total',
  'स्टॉक': 'stock',
  'स्टोक': 'stock',
  'सीमेंट': 'cement',
  'सरिया': 'sariya',
  'स्टील': 'steel',
  'रुपये': 'rupaye',
  'रुपए': 'rupaye',
  'बिल': 'bill',
  'बना': 'bana',
  'दो': 'do',
  'कितनी': 'kitni',
  'कितना': 'kitna',
  'कितने': 'kitne',
  'कितनी': 'kitni',
  'है': 'hai',
  'हैं': 'hai',
  'में': 'mein',
  'का': 'ka',
  'की': 'ki',
  'के': 'ke',
  'नाम': 'naam',
  'बोरी': 'bori',
  'गाड़ी': 'gaadi',
  'गाडी': 'gaadi',
  'नहीं': 'nahi',
  'नही': 'nahi',
  'बिना': 'bina',
  'बिल्कुल': 'bilkul',
  'ट्रांसपोर्ट': 'transport'
}

export function transliterateDevanagariToHinglish(text) {
  if (!text || typeof text !== 'string') return ''
  let str = text.trim()
  if (!/[\u0900-\u097F]/.test(str)) return str // Already Latin Hinglish / English

  // 1. Check known word mapping first
  const words = str.split(/\s+/)
  const mappedWords = words.map((w) => {
    const clean = w.replace(/[^\u0900-\u097F]/g, '')
    if (HINDI_WORD_MAP[clean]) {
      return w.replace(clean, HINDI_WORD_MAP[clean])
    }
    return w
  })
  str = mappedWords.join(' ')

  // 2. Character-by-character transliteration for any remaining Devanagari script
  let res = ''
  for (let i = 0; i < str.length; i++) {
    const char = str[i]
    if (DIGITS[char]) {
      res += DIGITS[char]
    } else if (VOWELS[char]) {
      res += VOWELS[char]
    } else if (MATRAS[char]) {
      res += MATRAS[char]
    } else if (CONSONANTS[char]) {
      const nextChar = str[i + 1]
      res += CONSONANTS[char]
      // Add implicit schwa 'a' if next char is a consonant and not a halant/matra
      if (nextChar && CONSONANTS[nextChar] && nextChar !== '्') {
        res += 'a'
      }
    } else if (char === '्') {
      // Halant suppresses schwa
      continue
    } else {
      res += char
    }
  }

  return res.replace(/\s+/g, ' ').trim()
}
