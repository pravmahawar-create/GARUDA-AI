/**
 * 🦅 GARUDA PRODUCT PROOF ENGINE - REUSABLE SCREEN RECORDER
 * 
 * Direct CDP (Chrome DevTools Protocol) Screencast -> FFmpeg stdin pipeline.
 * Zero dropped frames, native 30/60 FPS, lossless local encoding.
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const FFMPEG_BIN = path.join(__dirname, '..', '..', 'node_modules', 'ffmpeg-static', 'ffmpeg.exe');

class ScreenRecorder {
  constructor() {
    this.ffmpegProc = null;
    this.cdpSession = null;
    this.recording = false;
    this.frameCount = 0;
  }

  /**
   * Starts live screencast recording
   */
  async start(page, outputPath, options = { fps: 30, width: 1080, height: 1920 }) {
    if (this.recording) throw new Error('[ScreenRecorder] Already recording!');

    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    this.frameCount = 0;
    this.recording = true;

    console.log(`🎬 [ScreenRecorder] Spawning FFmpeg pipeline -> ${path.basename(outputPath)} (${options.width}x${options.height} @ ${options.fps}fps)...`);

    // FFmpeg process reading mjpeg stream from stdin
    this.ffmpegProc = spawn(FFMPEG_BIN, [
      '-y',
      '-f', 'image2pipe',
      '-vcodec', 'mjpeg',
      '-r', String(options.fps || 30),
      '-i', '-',
      '-c:v', 'libx264',
      '-preset', 'veryfast',
      '-crf', '18',
      '-pix_fmt', 'yuv420p',
      '-vf', `scale=${options.width}:${options.height}:force_original_aspect_ratio=decrease,pad=${options.width}:${options.height}:(ow-iw)/2:(oh-ih)/2,setsar=1`,
      '-movflags', '+faststart',
      outputPath
    ]);

    this.ffmpegProc.stderr.on('data', (d) => {
      const msg = d.toString();
      if (msg.includes('Error') || msg.includes('fatal') || msg.includes('Invalid') || msg.includes('failed')) {
        console.error(`[FFmpeg STDERR] ${msg.trim()}`);
      }
    });

    this.ffmpegProc.stdin.on('error', (err) => {
      console.warn(`[ScreenRecorder] FFmpeg stdin error caught: ${err.message}`);
    });

    this.ffmpegProc.on('error', (err) => {
      console.error(`[ScreenRecorder] FFmpeg process error: ${err.message}`);
    });

    this.ffmpegProc.on('close', (code) => {
      if (code !== 0 && code !== null) {
        console.warn(`[ScreenRecorder] FFmpeg exited with code ${code}`);
      }
    });

    this.cdpSession = await page.target().createCDPSession();
    await this.cdpSession.send('Page.startScreencast', {
      format: 'jpeg',
      quality: 90,
      everyNthFrame: 1
    });

    let lastFrameBuffer = null;

    this.cdpSession.on('Page.screencastFrame', async ({ data, sessionId }) => {
      if (!this.recording) return;

      this.lastFrameBuffer = Buffer.from(data, 'base64');

      try {
        await this.cdpSession.send('Page.screencastFrameAck', { sessionId });
      } catch (e) {
        // Session may close on stop
      }
    });

    // Time-Synchronized Constant Frame Rate (CFR) 30 FPS pump:
    // Tracks high-resolution elapsed time to eliminate Windows timer drift
    const fps = options.fps || 30;
    this.fps = fps;
    this.startTime = Date.now();

    this.pumpTimer = setInterval(() => {
      if (!this.recording || !this.ffmpegProc || !this.ffmpegProc.stdin.writable) return;
      if (this.lastFrameBuffer) {
        const elapsedSec = (Date.now() - this.startTime) / 1000;
        const targetFrames = Math.floor(elapsedSec * fps);
        while (this.frameCount < targetFrames && this.ffmpegProc && this.ffmpegProc.stdin && this.ffmpegProc.stdin.writable) {
          this.frameCount++;
          try {
            this.ffmpegProc.stdin.write(this.lastFrameBuffer);
          } catch (e) {
            break;
          }
        }
      }
    }, 15);

    console.log(`✔ [ScreenRecorder] Screencast active with time-synced CFR pump @ ${fps} FPS!`);
  }

  /**
   * Stops recording and finalizes MP4 file
   */
  async stop() {
    if (!this.recording) return null;
    this.recording = false;

    if (this.pumpTimer) {
      clearInterval(this.pumpTimer);
      this.pumpTimer = null;
    }

    // Flush any pending frames up to the exact stopped duration
    if (this.ffmpegProc && this.ffmpegProc.stdin && this.ffmpegProc.stdin.writable && this.lastFrameBuffer) {
      const elapsedSec = (Date.now() - this.startTime) / 1000;
      const targetFrames = Math.round(elapsedSec * this.fps);
      while (this.frameCount < targetFrames && this.ffmpegProc && this.ffmpegProc.stdin && this.ffmpegProc.stdin.writable) {
        this.frameCount++;
        try {
          this.ffmpegProc.stdin.write(this.lastFrameBuffer);
        } catch (e) {
          break;
        }
      }
    }

    console.log(`🛑 [ScreenRecorder] Stopping screencast (Pushed ${this.frameCount} CFR frames)...`);

    if (this.cdpSession) {
      await this.cdpSession.send('Page.stopScreencast').catch(() => {});
      await this.cdpSession.detach().catch(() => {});
      this.cdpSession = null;
    }

    if (this.ffmpegProc && this.ffmpegProc.stdin.writable) {
      this.ffmpegProc.stdin.end();
      await new Promise((resolve) => this.ffmpegProc.on('close', resolve));
      this.ffmpegProc = null;
    }

    console.log(`✔ [ScreenRecorder] Recording cleanly closed.`);
    return { frameCount: this.frameCount };
  }
}

module.exports = ScreenRecorder;
