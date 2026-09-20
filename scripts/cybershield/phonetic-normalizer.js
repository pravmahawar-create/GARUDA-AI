/**
 * GARUDA CYBERSHIELD™ — Phonetic & Leetspeak Normalizer
 * Normalizes obfuscated Hinglish, symbol substitutions, and leetspeak slurs.
 */

class PhoneticNormalizer {
  constructor() {
    // Leetspeak and symbol substitutions
    this.charMap = {
      '@': 'a',
      '4': 'a',
      '8': 'b',
      '(': 'c',
      '3': 'e',
      '1': 'i',
      '!': 'i',
      '|': 'i',
      '0': 'o',
      '5': 's',
      '$': 's',
      '7': 't',
      '+': 't',
      'v': 'u',
      'vv': 'w',
      '\\/\\/': 'w'
    };

    // Phonetic root simplifications for Hinglish
    this.phoneticReplacements = [
      { regex: /bh/gi, repl: 'b' },
      { regex: /dh/gi, repl: 'd' },
      { regex: /th/gi, repl: 't' },
      { regex: /kh/gi, repl: 'k' },
      { regex: /gh/gi, repl: 'g' },
      { regex: /ch/gi, repl: 'c' },
      { regex: /ph/gi, repl: 'f' },
      { regex: /sh/gi, repl: 's' },
      { regex: /ee/gi, repl: 'i' },
      { regex: /oo/gi, repl: 'u' }
    ];
  }

  /**
   * Normalizes raw text into clean searchable tokens.
   */
  normalize(text) {
    if (!text || typeof text !== 'string') return '';

    let clean = text.toLowerCase();

    // 1. Remove zero-width spaces and invisible control characters
    clean = clean.replace(/[\u200B-\u200D\uFEFF]/g, '');

    // 2. Remove common masking asterisks/dots in words (e.g. b*tch -> bitch, g**nd -> gand)
    clean = clean.replace(/([a-z0-9])[*#@_.-]+([a-z0-9])/gi, '$1$2');

    // 3. Map leetspeak characters
    let unleet = '';
    for (let i = 0; i < clean.length; i++) {
      const char = clean[i];
      unleet += this.charMap[char] || char;
    }
    clean = unleet;

    // 4. Compress repeated characters (e.g. kuttteeeeeee -> kutte)
    clean = clean.replace(/(.)\1{2,}/gi, '$1$1');

    // 5. Remove excessive non-alphanumeric punctuation but keep words separated
    clean = clean.replace(/[^a-z0-9\s]/gi, ' ').replace(/\s+/g, ' ').trim();

    return clean;
  }

  /**
   * Returns both raw normalized text and phonetic-compressed representation
   */
  getPhoneticSignature(text) {
    let normalized = this.normalize(text);
    let signature = normalized;
    for (const { regex, repl } of this.phoneticReplacements) {
      signature = signature.replace(regex, repl);
    }
    return {
      raw: text,
      normalized,
      signature
    };
  }
}

module.exports = new PhoneticNormalizer();
