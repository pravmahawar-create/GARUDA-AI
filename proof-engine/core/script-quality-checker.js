/**
 * 🦅 GARUDA PRODUCT PROOF ENGINE - SCRIPT QUALITY CHECKER
 * 
 * Inspects narration scripts for Human Presenter characteristics:
 * - Flags robotic jargon, monotonous length, and marketing puffery.
 * - Enforces Anti-Fabrication Law: rejects unverified speed/perfection claims.
 * - Verifies presence of natural conversational markers and spoken cadence.
 */

class ScriptQualityChecker {
  constructor() {
    this.forbiddenClaims = [
      /\bzero\s*lag\b/i,
      /\b5\s*seconds?\b/i,
      /\bsub-?50ms\b/i,
      /\b100%\s*secure\b/i,
      /\bguaranteed\b/i,
      /\bworld'?s\s*best\b/i,
      /\bnumber\s*(?:one|1)\b/i,
      /\bfastest\b/i,
      /\brevolutionary\b/i
    ];

    this.conversationalMarkers = [
      'dekhiye', 'ab', 'bas', 'aur yahan', 'notice kijiye',
      'matlab', 'isi liye', 'koi problem nahi', 'seedha',
      'ek tap', 'simple', 'sabse pehle'
    ];
  }

  /**
   * Inspects a list of scenes for Human Presenter compliance
   */
  inspectScenes(scenes, productName = 'Product') {
    const report = {
      product: productName,
      timestamp: new Date().toISOString(),
      passed: true,
      flags: [],
      stats: {
        totalScenes: scenes.length,
        avgWordsPerSentence: 0,
        conversationalMarkerScore: 0
      }
    };

    let totalWords = 0;
    let totalSentences = 0;
    let markerCount = 0;

    for (const scene of scenes) {
      const text = scene.narration || '';
      if (!text) continue;

      // 1. Check forbidden claims (Strict Anti-Fabrication Law)
      for (const pattern of this.forbiddenClaims) {
        if (pattern.test(text)) {
          report.passed = false;
          report.flags.push({
            sceneId: scene.id,
            type: 'FORBIDDEN_CLAIM',
            detail: `Found unverified claim matching ${pattern}: "${text}"`
          });
        }
      }

      // 2. Sentence Length & Rhythm Check
      const sentences = text.split(/[.?!।]\s*/).filter(Boolean);
      for (const sentence of sentences) {
        const words = sentence.trim().split(/\s+/).filter(Boolean);
        totalWords += words.length;
        totalSentences++;

        if (words.length > 22) {
          report.flags.push({
            sceneId: scene.id,
            type: 'EXCESSIVE_LENGTH',
            detail: `Sentence too long for spoken demo (${words.length} words): "${sentence}"`
          });
        }
      }

      // 3. Conversational Markers
      const lower = text.toLowerCase();
      for (const m of this.conversationalMarkers) {
        if (lower.includes(m)) markerCount++;
      }

      // 4. Intent Tag Verification
      if (!scene.intent) {
        report.flags.push({
          sceneId: scene.id,
          type: 'MISSING_INTENT',
          detail: `Scene [${scene.id}] is missing delivery intent classification.`
        });
      }
    }

    report.stats.avgWordsPerSentence = totalSentences > 0 ? parseFloat((totalWords / totalSentences).toFixed(1)) : 0;
    report.stats.conversationalMarkerScore = markerCount;

    if (report.stats.conversationalMarkerScore < 3) {
      report.flags.push({
        type: 'LOW_NATURALNESS',
        detail: `Script has low conversational marker count (${markerCount}). Ensure natural spoken transitions.`
      });
    }

    const hasFatal = report.flags.some(f => f.type === 'FORBIDDEN_CLAIM');
    if (hasFatal) report.passed = false;

    return report;
  }
}

module.exports = new ScriptQualityChecker();
