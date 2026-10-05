/**
 * 🦅 GARUDA PRODUCT PROOF ENGINE - REUSABLE SUBTITLE ENGINE
 * 
 * Generates frame-accurate .srt subtitle files for English and Hinglish/Hindi.
 */

const fs = require('fs');
const path = require('path');

class SubtitleEngine {
  /**
   * Formats seconds into SRT timestamp: 00:01:23,456
   */
  formatSrtTime(totalSeconds) {
    const pad = (num, size = 2) => String(Math.floor(num)).padStart(size, '0');
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);
    const milliseconds = Math.floor((totalSeconds - Math.floor(totalSeconds)) * 1000);

    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)},${pad(milliseconds, 3)}`;
  }

  /**
   * Generates English and Hinglish SRT files based on scene timeline
   */
  generateSubtitles(scenesWithTiming, outputDir, baseName = 'video') {
    fs.mkdirSync(outputDir, { recursive: true });

    let srtEn = '';
    let srtHi = '';
    let counter = 1;

    for (const scene of scenesWithTiming) {
      if (!scene.durationSec || (!scene.narration && !scene.narrationEn)) continue;

      const startTime = this.formatSrtTime(scene.startTimeSec);
      const endTime = this.formatSrtTime(scene.startTimeSec + scene.durationSec);

      // 1. English Subtitles
      if (scene.narrationEn || scene.narration) {
        srtEn += `${counter}\n`;
        srtEn += `${startTime} --> ${endTime}\n`;
        srtEn += `${(scene.narrationEn || scene.narration).trim()}\n\n`;
      }

      // 2. Hinglish Subtitles
      if (scene.narration) {
        srtHi += `${counter}\n`;
        srtHi += `${startTime} --> ${endTime}\n`;
        srtHi += `${scene.narration.trim()}\n\n`;
      }

      counter++;
    }

    const enPath = path.join(outputDir, `${baseName}_en.srt`);
    const hiPath = path.join(outputDir, `${baseName}_hi.srt`);

    fs.writeFileSync(enPath, srtEn, 'utf-8');
    fs.writeFileSync(hiPath, srtHi, 'utf-8');

    console.log(`✔ [SubtitleEngine] Generated subtitles:\n   ${enPath}\n   ${hiPath}`);
    return { en: enPath, hi: hiPath };
  }
}

module.exports = new SubtitleEngine();
