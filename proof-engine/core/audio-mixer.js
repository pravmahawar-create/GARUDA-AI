/**
 * 🦅 GARUDA PRODUCT PROOF ENGINE - REUSABLE AUDIO MIXER
 * 
 * Mixes narration, tactile UI clicks, confirmation chimes, and ambient score.
 * Strict Audio Hierarchy:
 * VOICE (0 dB) > UI SFX (-14 dB) > AMBIENT BED (-26 dB)
 */

const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const FFMPEG_BIN = path.join(__dirname, '..', '..', 'node_modules', 'ffmpeg-static', 'ffmpeg.exe');
const ASSETS_DIR = path.join(__dirname, '..', 'assets', 'audio');

class AudioMixer {
  constructor() {
    this.ensureAudioAssets();
  }

  /**
   * Generates clean synthetic SFX and ambient bed if not already present
   */
  ensureAudioAssets() {
    fs.mkdirSync(ASSETS_DIR, { recursive: true });

    const clickWav = path.join(ASSETS_DIR, 'click.wav');
    const confirmWav = path.join(ASSETS_DIR, 'confirm.wav');
    const ambientMp3 = path.join(ASSETS_DIR, 'ambient_bed.mp3');

    // 1. Tactile UI Click (50ms subtle pop)
    if (!fs.existsSync(clickWav)) {
      spawnSync(FFMPEG_BIN, [
        '-y', '-f', 'lavfi',
        '-i', 'sine=frequency=1200:duration=0.04',
        '-af', 'volume=0.25,afade=t=out:st=0.01:d=0.03',
        clickWav
      ]);
    }

    // 2. Success Confirmation Chime (400ms warm chord)
    if (!fs.existsSync(confirmWav)) {
      spawnSync(FFMPEG_BIN, [
        '-y', '-f', 'lavfi',
        '-i', 'sine=frequency=880:duration=0.4',
        '-af', 'volume=0.3,afade=t=out:st=0.1:d=0.3',
        confirmWav
      ]);
    }

    // 3. Restrained Warm Ambient Bed (warm, subtle 60s pad)
    if (!fs.existsSync(ambientMp3)) {
      spawnSync(FFMPEG_BIN, [
        '-y', '-f', 'lavfi',
        '-i', 'sine=frequency=110:duration=90',
        '-af', 'volume=0.04,lowpass=f=250',
        '-c:a', 'libmp3lame', '-b:a', '128k',
        ambientMp3
      ]);
    }
  }

  /**
   * Stitches scene audio files into a single master narration track with precise timestamps
   */
  stitchNarration(sceneAudios, totalDurationSec, outputPath) {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });

    // Build FFmpeg concat / delay filter
    // e.g. [0:a]adelay=0|0[a0]; [1:a]adelay=5500|5500[a1]; [a0][a1]amix=inputs=2:dropout_transition=0
    const inputs = [];
    const filterParts = [];
    const mixLabels = [];

    let currentOffsetMs = 300; // Small intro padding

    for (let i = 0; i < sceneAudios.length; i++) {
      const item = sceneAudios[i];
      inputs.push('-i', item.file);

      filterParts.push(`[${i}:a]adelay=${Math.round(currentOffsetMs)}|${Math.round(currentOffsetMs)}[a${i}]`);
      mixLabels.push(`[a${i}]`);

      // Scene duration + pause
      currentOffsetMs += (item.durationSec * 1000) + 600;
    }

    const filterComplex = `${filterParts.join('; ')}; ${mixLabels.join('')}amix=inputs=${sceneAudios.length}:duration=longest:dropout_transition=0:normalize=0,volume=1.0[outa]`;

    const args = [
      '-y',
      ...inputs,
      '-filter_complex', filterComplex,
      '-map', '[outa]',
      '-c:a', 'libmp3lame',
      '-b:a', '192k',
      outputPath
    ];

    const res = spawnSync(FFMPEG_BIN, args, { encoding: 'utf-8' });
    if (!fs.existsSync(outputPath) || fs.statSync(outputPath).size < 100) {
      throw new Error(`[AudioMixer] Narration stitching failed: ${res.stderr || res.stdout}`);
    }

    return { file: outputPath, totalDurationSec: currentOffsetMs / 1000 };
  }

  /**
   * Mixes narration track with ambient bed and SFX clicks into final audio track
   */
  mixMasterAudio(narrationPath, totalDurationSec, sfxMoments = [], outputPath) {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });

    const clickWav = path.join(ASSETS_DIR, 'click.wav');
    const confirmWav = path.join(ASSETS_DIR, 'confirm.wav');
    const ambientMp3 = path.join(ASSETS_DIR, 'ambient_bed.mp3');

    // Inputs:
    // 0: narrationPath
    // 1: ambientMp3
    // 2: clickWav
    // 3: confirmWav
    const inputs = [
      '-i', narrationPath,
      '-i', ambientMp3,
      '-i', clickWav,
      '-i', confirmWav
    ];

    // Intelligent Sidechain Ducking:
    // [0:a] is narration voice (0 dB reference)
    // [1:a] is ambient music bed
    // When narration speaks, sidechaincompress smoothly attenuates music by -8dB with 40ms attack & 350ms release.
    const filterParts = [
      `[0:a]volume=1.25,asplit=2[narr_out][narr_sidechain]`,
      `[1:a]atrim=0:${totalDurationSec},volume=0.07,afade=t=in:st=0:d=1.5,afade=t=out:st=${Math.max(1, totalDurationSec - 2.5)}:d=2.5[raw_bg]`,
      `[raw_bg][narr_sidechain]sidechaincompress=threshold=0.035:ratio=4:attack=40:release=350[ducked_bg]`
    ];

    const mixLabels = ['[narr_out]', '[ducked_bg]'];
    let mixCount = 2;

    sfxMoments.forEach((mom, idx) => {
      const srcIdx = mom.type === 'confirm' ? 3 : 2;
      const delayMs = Math.round(mom.timeSec * 1000);
      filterParts.push(`[${srcIdx}:a]adelay=${delayMs}|${delayMs},volume=0.35[sfx${idx}]`);
      mixLabels.push(`[sfx${idx}]`);
      mixCount++;
    });

    filterParts.push(`${mixLabels.join('')}amix=inputs=${mixCount}:dropout_transition=0:normalize=0[final_audio]`);

    const args = [
      '-y',
      ...inputs,
      '-filter_complex', filterParts.join('; '),
      '-map', '[final_audio]',
      '-c:a', 'aac',
      '-b:a', '192k',
      '-t', String(totalDurationSec),
      outputPath
    ];

    const res = spawnSync(FFMPEG_BIN, args, { encoding: 'utf-8' });
    if (!fs.existsSync(outputPath) || fs.statSync(outputPath).size < 100) {
      console.warn(`[AudioMixer] Advanced mix warning, falling back to clean narration:`, res.stderr);
      fs.copyFileSync(narrationPath, outputPath);
    }

    return outputPath;
  }
}

module.exports = new AudioMixer();
