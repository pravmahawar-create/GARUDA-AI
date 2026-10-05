/**
 * 🦅 GARUDA PRODUCT PROOF ENGINE - REUSABLE NARRATION ENGINE (HUMAN PRESENTER v2)
 * 
 * Generates natural, context-aware, expressive human-presenter speech using:
 * Voice: hi-IN-SwaraNeural
 * Engine: edge-tts with dynamic prosody (rate, pitch, volume) & semantic pauses.
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const pronunciationEngine = require('./pronunciation-engine');

const FFMPEG_BIN = path.join(__dirname, '..', '..', 'node_modules', 'ffmpeg-static', 'ffmpeg.exe');

// Intent Prosody Profiles
const INTENT_PROSODY = {
  hook: { rate: '+6%', pitch: '+2Hz', pauseAfterMs: 250 },
  problem: { rate: '-2%', pitch: '-1Hz', pauseAfterMs: 300 },
  discovery: { rate: '+3%', pitch: '+1Hz', pauseAfterMs: 250 },
  feature_reveal: { rate: '+6%', pitch: '+2Hz', pauseAfterMs: 350 },
  live_demonstration: { rate: '+1%', pitch: '+0Hz', pauseAfterMs: 200 },
  benefit: { rate: '+3%', pitch: '+1Hz', pauseAfterMs: 250 },
  result: { rate: '+5%', pitch: '+2Hz', pauseAfterMs: 300 },
  reassuring: { rate: '-1%', pitch: '+0Hz', pauseAfterMs: 350 },
  confident: { rate: '+1%', pitch: '+1Hz', pauseAfterMs: 250 },
  cta: { rate: '+2%', pitch: '+1Hz', pauseAfterMs: 200 },
  calm: { rate: '-3%', pitch: '-1Hz', pauseAfterMs: 300 }
};

class NarrationEngine {
  constructor() {
    this.voiceName = 'hi-IN-SwaraNeural';
  }

  /**
   * Measures precise duration in seconds using ffmpeg probe
   */
  getAudioDuration(audioPath) {
    if (!fs.existsSync(audioPath)) return 0;
    try {
      const res = spawnSync(FFMPEG_BIN, ['-i', audioPath, '-f', 'null', '-'], { encoding: 'utf-8' });
      const output = res.stderr || res.stdout || '';
      const match = output.match(/Duration:\s*(\d+):(\d+):(\d+\.\d+)/);
      if (match) {
        const hours = parseFloat(match[1]);
        const mins = parseFloat(match[2]);
        const secs = parseFloat(match[3]);
        return hours * 3600 + mins * 60 + secs;
      }
    } catch (e) {
      console.warn(`[NarrationEngine] Duration probe fallback:`, e.message);
    }
    const stats = fs.statSync(audioPath);
    return Math.max(1.0, stats.size / 6000);
  }

  /**
   * Generates single segment audio with prosody (rate, pitch)
   */
  synthesizeSegment(text, outputPath, options = {}) {
    const rate = options.rate || '+0%';
    const pitch = options.pitch || '+0Hz';
    const volume = options.volume || '+0%';

    const args = [
      '-m', 'edge_tts',
      `--voice=${this.voiceName}`,
      `--rate=${rate}`,
      `--pitch=${pitch}`,
      `--volume=${volume}`,
      `--text=${text}`,
      `--write-media=${outputPath}`
    ];

    const res = spawnSync('python', args, { encoding: 'utf-8', timeout: 15000 });
    if (!fs.existsSync(outputPath) || fs.statSync(outputPath).size < 1000) {
      throw new Error(`[NarrationEngine] Segment synthesis failed for "${text}": ${res.stderr || res.stdout}`);
    }
    return outputPath;
  }

  /**
   * Generates audio for a scene with Human Presenter cadence
   */
  async generateSceneAudio(scene, outputDir, force = false) {
    fs.mkdirSync(outputDir, { recursive: true });
    const finalMp3 = path.join(outputDir, `${scene.id}.mp3`);

    if (fs.existsSync(finalMp3) && !force && fs.statSync(finalMp3).size > 1000) {
      const durationSec = this.getAudioDuration(finalMp3);
      return {
        id: scene.id,
        text: scene.narration,
        file: finalMp3,
        durationSec,
        durationMs: Math.round(durationSec * 1000),
        cached: true
      };
    }

    const intent = scene.intent || 'conversational';
    const profile = INTENT_PROSODY[intent] || { rate: '+0%', pitch: '+0Hz', pauseAfterMs: 250 };

    // Dynamic Prosody Calculation
    let targetRate = profile.rate;
    let targetPitch = profile.pitch;

    if (scene.pace !== undefined) {
      const pacePct = Math.round((scene.pace - 1.0) * 100);
      targetRate = (pacePct >= 0 ? `+${pacePct}%` : `${pacePct}%`);
    }

    if (scene.pitch !== undefined) {
      const pitchHz = Math.round(scene.pitch * 10);
      targetPitch = (pitchHz >= 0 ? `+${pitchHz}Hz` : `${pitchHz}Hz`);
    }

    // A. Multi-segment delivery if defined
    if (Array.isArray(scene.segments) && scene.segments.length > 0) {
      const segDir = path.join(outputDir, `seg_${scene.id}_${Date.now()}`);
      fs.mkdirSync(segDir, { recursive: true });

      const segFiles = [];
      const filterParts = [];
      const mixInputs = [];
      let segOffsetMs = scene.pauseBeforeMs || 100;

      for (let i = 0; i < scene.segments.length; i++) {
        const seg = scene.segments[i];
        const segPath = path.join(segDir, `part_${i}.mp3`);
        const sIntent = seg.intent || intent;
        const sProfile = INTENT_PROSODY[sIntent] || profile;

        this.synthesizeSegment(seg.text, segPath, {
          rate: seg.rate || sProfile.rate,
          pitch: seg.pitch || sProfile.pitch
        });

        const segDurSec = this.getAudioDuration(segPath);
        segFiles.push(segPath);
        mixInputs.push('-i', segPath);

        const currentStartMs = Math.round(segOffsetMs);
        filterParts.push(`[${i}:a]adelay=${currentStartMs}|${currentStartMs}[a${i}]`);

        // Advance offset with segment duration + micro/impact pause
        const pauseAfter = seg.pauseAfterMs !== undefined ? seg.pauseAfterMs : (sProfile.pauseAfterMs || 250);
        segOffsetMs += (segDurSec * 1000) + pauseAfter;
      }

      // Assemble segments using FFmpeg
      const amixLabels = segFiles.map((_, idx) => `[a${idx}]`).join('');
      const filterComplex = `${filterParts.join('; ')}; ${amixLabels}amix=inputs=${segFiles.length}:duration=longest:dropout_transition=0:normalize=0[outa]`;

      spawnSync(FFMPEG_BIN, [
        '-y',
        ...mixInputs,
        '-filter_complex', filterComplex,
        '-map', '[outa]',
        '-c:a', 'libmp3lame',
        '-b:a', '192k',
        finalMp3
      ]);

      fs.rmSync(segDir, { recursive: true, force: true });
    } else {
      // B. Single cohesive phrase synthesis with Intent Prosody & Phonetic Normalization
      const textToSpeak = scene.speech_text || pronunciationEngine.normalizeToSpeech(scene.narration);
      this.synthesizeSegment(textToSpeak, finalMp3, {
        rate: targetRate,
        pitch: targetPitch
      });
    }

    const durationSec = this.getAudioDuration(finalMp3);
    return {
      id: scene.id,
      text: scene.narration,
      file: finalMp3,
      intent,
      durationSec,
      durationMs: Math.round(durationSec * 1000),
      cached: false
    };
  }

  /**
   * Generates audio for all scenes in a workflow
   */
  async generateScenes(scenes, outputDir, force = false) {
    console.log(`🎙️ [NarrationEngine v2] Generating Human Presenter delivery via ${this.voiceName}...`);
    const results = [];
    for (const scene of scenes) {
      if (!scene.narration && !scene.segments) continue;
      process.stdout.write(`   Processing [${scene.id}] (${scene.intent || 'standard'})... `);
      const res = await this.generateSceneAudio(scene, outputDir, force);
      console.log(`✔ (${res.durationSec.toFixed(2)}s)`);
      results.push(res);
    }
    return results;
  }

  /**
   * Directly synthesizes speech_text to an explicit output path
   */
  async generateSceneSpeech(scene, outputPath) {
    const textToSpeak = scene.speech_text || pronunciationEngine.normalizeToSpeech(scene.narration);
    const pacePct = scene.pace ? Math.round((scene.pace - 1.0) * 100) : 0;
    const rate = pacePct >= 0 ? `+${pacePct}%` : `${pacePct}%`;
    const pitch = scene.pitch ? `${Math.round(scene.pitch * 10)}Hz` : '+0Hz';

    this.synthesizeSegment(textToSpeak, outputPath, { rate, pitch });
    const durationSec = this.getAudioDuration(outputPath);
    return { file: outputPath, durationSec };
  }
}

module.exports = new NarrationEngine();
