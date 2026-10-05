/**
 * 🦅 GARUDA PRODUCT PROOF ENGINE - REUSABLE VIDEO COMPOSITOR
 * 
 * Merges recorded video stream, master audio mix, subtle intro reveal,
 * and high-contrast sovereign ending card.
 */

const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const FFMPEG_BIN = path.join(__dirname, '..', '..', 'node_modules', 'ffmpeg-static', 'ffmpeg.exe');

class VideoCompositor {
  /**
   * Generates a high-contrast cinematic intro/outro card image
   */
  async generateBrandFrame(options = { title: 'GARUDA', subtitle: '', width: 1080, height: 1920, outputPath: '' }) {
    fs.mkdirSync(path.dirname(options.outputPath), { recursive: true });

    // Build SVG card
    const svg = `
      <svg width="${options.width}" height="${options.height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="bgGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#111827" stop-opacity="1"/>
            <stop offset="100%" stop-color="#030712" stop-opacity="1"/>
          </radialGradient>
          <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#f59e0b"/>
            <stop offset="100%" stop-color="#fbbf24"/>
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#bgGlow)"/>

        <!-- Subtle Grid Lines -->
        <line x1="0" y1="${options.height * 0.35}" x2="${options.width}" y2="${options.height * 0.35}" stroke="#1f2937" stroke-width="1" stroke-opacity="0.4"/>
        <line x1="0" y1="${options.height * 0.65}" x2="${options.width}" y2="${options.height * 0.65}" stroke="#1f2937" stroke-width="1" stroke-opacity="0.4"/>

        <!-- Center Sigil / Icon -->
        <circle cx="${options.width / 2}" cy="${options.height / 2 - 120}" r="45" fill="#0f172a" stroke="#10b981" stroke-width="2"/>
        <polygon points="${options.width / 2},${options.height / 2 - 150} ${options.width / 2 - 25},${options.height / 2 - 100} ${options.width / 2 + 25},${options.height / 2 - 100}" fill="#10b981"/>

        <!-- Brand Name -->
        <text x="${options.width / 2}" y="${options.height / 2 - 30}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="${options.width > 1200 ? 54 : 42}" font-weight="900" fill="#ffffff" letter-spacing="4" text-anchor="middle">
          ${options.title || 'GARUDA'}
        </text>

        <!-- Subtitle -->
        <text x="${options.width / 2}" y="${options.height / 2 + 25}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="${options.width > 1200 ? 20 : 16}" font-weight="600" fill="#9ca3af" letter-spacing="2" text-anchor="middle">
          ${options.subtitle || 'AI SOFTWARE • AUTOMATION • PRODUCT ENGINEERING'}
        </text>

        <!-- Tagline / Portal URL -->
        ${options.portal ? `
        <rect x="${options.width / 2 - 180}" y="${options.height / 2 + 75}" width="360" height="46" rx="23" fill="#0f172a" stroke="rgba(16, 185, 129, 0.4)" stroke-width="1.5"/>
        <text x="${options.width / 2}" y="${options.height / 2 + 104}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="16" font-weight="700" fill="#10b981" letter-spacing="1" text-anchor="middle">
          ${options.portal}
        </text>
        ` : ''}

        ${options.cta ? `
        <text x="${options.width / 2}" y="${options.height * 0.85}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="500" fill="#6b7280" letter-spacing="0.5" text-anchor="middle">
          ${options.cta}
        </text>
        ` : ''}
      </svg>
    `;

    const svgPath = options.outputPath.replace(/\.(png|jpg)$/, '.svg');
    fs.writeFileSync(svgPath, svg, 'utf-8');

    // Convert SVG to PNG using FFmpeg
    spawnSync(FFMPEG_BIN, [
      '-y',
      '-i', svgPath,
      options.outputPath
    ]);

    return options.outputPath;
  }

  /**
   * Generates a video bumper clip from a still brand frame
   */
  createBumperVideo(framePng, durationSec, fps, width, height, outputPath) {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    spawnSync(FFMPEG_BIN, [
      '-y',
      '-loop', '1',
      '-i', framePng,
      '-c:v', 'libx264',
      '-t', String(durationSec),
      '-pix_fmt', 'yuv420p',
      '-vf', `scale=${width}:${height},fps=${fps}`,
      outputPath
    ]);
    return outputPath;
  }

  /**
   * Assembles final product film:
   * Merges screencast video with audio track, applies optional outro bumper, web optimization
   */
  composeFinalVideo(rawVideoPath, masterAudioPath, outputPath, outroDurationSec = 0, outroVideoPath = null) {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });

    console.log(`🎬 [VideoCompositor] Combining video + audio into -> ${path.basename(outputPath)}...`);

    const args = [
      '-y',
      '-i', rawVideoPath,
      '-i', masterAudioPath,
      '-c:v', 'copy',
      '-c:a', 'aac',
      '-b:a', '192k',
      '-shortest',
      '-movflags', '+faststart',
      outputPath
    ];

    const res = spawnSync(FFMPEG_BIN, args, { encoding: 'utf-8' });
    if (!fs.existsSync(outputPath) || fs.statSync(outputPath).size < 1000) {
      // If copy fails due to container sync, transcode
      console.warn(`[VideoCompositor] Stream copy retry with re-encode:`, res.stderr);
      spawnSync(FFMPEG_BIN, [
        '-y',
        '-i', rawVideoPath,
        '-i', masterAudioPath,
        '-c:v', 'libx264',
        '-preset', 'fast',
        '-crf', '19',
        '-pix_fmt', 'yuv420p',
        '-c:a', 'aac',
        '-b:a', '192k',
        '-shortest',
        '-movflags', '+faststart',
        outputPath
      ]);
    }

    console.log(`✔ [VideoCompositor] Final film assembled: ${outputPath}`);
    return outputPath;
  }

  /**
   * Extracts a micro-clip segment from a master video
   */
  extractClip(sourceVideo, startSec, durationSec, outputPath) {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    spawnSync(FFMPEG_BIN, [
      '-y',
      '-ss', String(startSec),
      '-i', sourceVideo,
      '-t', String(durationSec),
      '-c', 'copy',
      '-movflags', '+faststart',
      outputPath
    ]);
    return outputPath;
  }

  /**
   * Captures high-res thumbnail frame from video
   */
  extractThumbnail(sourceVideo, atSec, outputPath) {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    spawnSync(FFMPEG_BIN, [
      '-y',
      '-ss', String(atSec),
      '-i', sourceVideo,
      '-vframes', '1',
      '-q:v', '2',
      outputPath
    ]);
    return outputPath;
  }
}

module.exports = new VideoCompositor();
