/**
 * GARUDA CYBERSHIELD™ — Multi-Tier Toxicity & Criminal Intent Classifier
 * Categorizes online toxicity into 5 actionable legal severity tiers.
 */

const normalizer = require('./phonetic-normalizer');

class ToxicityClassifier {
  constructor() {
    // 5-Tier Lexicon and Regex Patterns
    this.threatPatterns = {
      TIER_5_CRIMINAL_THREAT: {
        name: 'CRIMINAL_THREAT',
        level: 5,
        baseScore: 0.98,
        legalSections: [
          'BNS Section 351(2) (Criminal Intimidation)',
          'BNS Section 79 (Word/Gesture Outraging Modesty)',
          'IT Act Section 66F (Cyber Terrorism / Threat to Life)'
        ],
        keywords: [
          'mar dunga', 'jaan se mar', 'kill you', 'rape kar', 'gangrape', 'bullet in head',
          'acid fek', 'ghar me ghus ke', 'suicide kar le', 'terko khatam', 'kat dunga',
          'murder karunga', 'murder karwa', 'murder kar', 'murder', 'will slaughter', 'goli marunga',
          'goli maar', 'goli mar', 'marwa dunga', 'mar dalunga', 'jaan se hath', 'zinda jala'
        ]
      },
      TIER_4_HATE_SPEECH: {
        name: 'HATE_SPEECH_COMMUNAL',
        level: 4,
        baseScore: 0.88,
        legalSections: [
          'BNS Section 196 (Promoting Enmity between Groups)',
          'BNS Section 299 (Deliberate Malicious Acts to Outrage Religious Feelings)'
        ],
        keywords: [
          'katue', 'jihadi', 'mulle', 'kafir', 'chamar', 'bhangi', 'dalit kutte',
          'anti national', 'terrorist breed', 'deshdrohi kutte', 'parasite religion'
        ]
      },
      TIER_3_DEFAMATION: {
        name: 'DEFAMATION_EXTORTION',
        level: 3,
        baseScore: 0.75,
        legalSections: [
          'BNS Section 356 (Defamation)',
          'BNS Section 308 (Extortion)',
          'IT Act Section 66E (Violation of Privacy)'
        ],
        keywords: [
          'fraud hai', 'fraud', 'chor company', 'chor', 'paise khaye', 'private photo leak', 'nude viral',
          'scamster', 'dhokebaaz', 'characterless aurat', 'randi hai', 'fake degrees',
          'bribe li hai', 'blackmail'
        ]
      },
      TIER_2_HARASSMENT: {
        name: 'HARASSMENT_ABUSE',
        level: 2,
        baseScore: 0.55,
        legalSections: [
          'IT (Intermediary Guidelines) Rules 2021 Rule 3(1)(b)',
          'BNS Section 79 (Insulting Modesty)'
        ],
        keywords: [
          'chutiya', 'bhenchod', 'madarchod', 'gand mara', 'bhosdike', 'harami', 'kameene',
          'ugly cow', 'shakal dekh apni', 'worthless pig', 'fat bitch', 'besharam kutti',
          'lavde', 'lodu', 'chomu', 'tatti', 'kutta', 'kutte', 'kutti', 'kamina', 'saale'
        ]
      },
      TIER_1_CRITICISM_BANTER: {
        name: 'CRITICISM_OR_BANTER',
        level: 1,
        baseScore: 0.20,
        legalSections: [],
        keywords: [
          'bakwaas', 'kharab product', 'worst customer service', 'dislike this',
          'disagree', 'flop video', 'overrated', 'not funny', 'boring content',
          'improve your acting', 'bad quality'
        ]
      }
    };
  }

  /**
   * Evaluates text and returns complete forensic classification.
   */
  classify(rawText) {
    if (!rawText || !rawText.trim()) {
      return {
        severityLevel: 0,
        tierName: 'CLEAN',
        toxicityScore: 0.0,
        detectedKeywords: [],
        legalSectionsTriggered: [],
        recommendedAction: 'ALLOW'
      };
    }

    const { normalized, signature } = normalizer.getPhoneticSignature(rawText);

    let highestTier = null;
    let matchedKeywords = [];

    // Check tiers from highest (Tier 5) to lowest (Tier 1)
    const tiers = [
      this.threatPatterns.TIER_5_CRIMINAL_THREAT,
      this.threatPatterns.TIER_4_HATE_SPEECH,
      this.threatPatterns.TIER_3_DEFAMATION,
      this.threatPatterns.TIER_2_HARASSMENT,
      this.threatPatterns.TIER_1_CRITICISM_BANTER
    ];

    for (const tier of tiers) {
      const foundInTier = [];
      for (const kw of tier.keywords) {
        // Match both in raw normalized text and phonetic signature
        if (normalized.includes(kw) || signature.includes(normalizer.normalize(kw))) {
          foundInTier.push(kw);
        }
      }

      if (foundInTier.length > 0 && !highestTier) {
        highestTier = tier;
        matchedKeywords = foundInTier;
        break;
      }
    }

    if (!highestTier) {
      return {
        severityLevel: 0,
        tierName: 'SAFE_CONTENT',
        toxicityScore: 0.05,
        detectedKeywords: [],
        legalSectionsTriggered: [],
        recommendedAction: 'ALLOW'
      };
    }

    // Determine recommended action based on severity tier
    let recommendedAction = 'LOG_ONLY';
    if (highestTier.level === 5) {
      recommendedAction = 'INSTANT_SHADOW_HIDE_AND_CYBER_FIR_DISPATCH';
    } else if (highestTier.level === 4) {
      recommendedAction = 'INSTANT_SHADOW_HIDE_AND_GRIEVANCE_ESCALATION';
    } else if (highestTier.level === 3) {
      recommendedAction = 'SHADOW_HIDE_AND_LEGAL_WARNING_NOTICE';
    } else if (highestTier.level === 2) {
      recommendedAction = 'AUTO_HIDE_AND_TROLL_WARNING';
    } else {
      recommendedAction = 'ALLOW_WITH_OPTIONAL_LOG';
    }

    return {
      severityLevel: highestTier.level,
      tierName: highestTier.name,
      toxicityScore: highestTier.baseScore,
      detectedKeywords: matchedKeywords,
      legalSectionsTriggered: highestTier.legalSections,
      recommendedAction,
      processedText: normalized
    };
  }
}

module.exports = new ToxicityClassifier();
