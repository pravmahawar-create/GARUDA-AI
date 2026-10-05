/**
 * 🦅 GARUDA PRODUCT PROOF ENGINE - MASTER ORCHESTRATOR
 * 
 * Modular, multi-format product film generation engine:
 * Config -> Narration -> Screencast -> Annotations -> Audio Mix -> Packaging -> QC
 * 
 * Usage: node proof-engine/index.js --product=billing
 */

const path = require('path');
const fs = require('fs');

const browserController = require('./core/browser-controller');
const ScreenRecorder = require('./core/screen-recorder');
const annotationEngine = require('./core/annotation-engine');
const narrationEngine = require('./core/narration-engine');
const audioMixer = require('./core/audio-mixer');
const videoCompositor = require('./core/video-compositor');
const subtitleEngine = require('./core/subtitle-engine');
const contentPackager = require('./core/content-packager');
const qualityControl = require('./core/quality-control');
const scriptQualityChecker = require('./core/script-quality-checker');
const pronunciationEngine = require('./core/pronunciation-engine');

// Parse CLI flags
const args = process.argv.slice(2);
let targetProduct = 'billing';
let targetFormat = 'all'; // all, short, master
let forceRegenerate = true; // Always regenerate with Human Presenter prosody

args.forEach(arg => {
  if (arg.startsWith('--product=')) targetProduct = arg.split('=')[1];
  if (arg.startsWith('--format=')) targetFormat = arg.split('=')[1];
});

async function runProduction() {
  console.log('================================================================');
  console.log(`🦅 GARUDA PRODUCT PROOF ENGINE — RUNNING PILOT: [${targetProduct.toUpperCase()}]`);
  console.log(`   Engine: Modular Content Production Engine (Human Presenter v2)`);
  console.log(`   Voice: hi-IN-SwaraNeural | Mode: Spoken Product Expert Delivery`);
  console.log('================================================================\n');

  // 1. Load Product Config
  const configPath = path.join(__dirname, 'config', 'products', `${targetProduct}.config.js`);
  if (!fs.existsSync(configPath)) {
    throw new Error(`[ProofEngine] Config file not found for product "${targetProduct}" at ${configPath}`);
  }
  const productConfig = require(configPath);
  const prod = productConfig.product;

  // 2. Human Presenter Script Quality Audit
  console.log(`--- STEP 0: Human Presenter Script Quality Audit ---`);
  const shortCheck = scriptQualityChecker.inspectScenes(productConfig.shortScenes, `${prod.name} (Short)`);
  const masterCheck = scriptQualityChecker.inspectScenes(productConfig.masterScenes, `${prod.name} (Master)`);
  if (!shortCheck.passed || !masterCheck.passed) {
    console.error('🚨 [ScriptQualityChecker] Fatal flaws detected:', [...shortCheck.flags, ...masterCheck.flags]);
    throw new Error('[ProofEngine] Aborting due to script quality violations.');
  }
  console.log(`✔ [ScriptQualityChecker] Scripts verified Human-Presenter compliant!`);
  console.log(`   Conversational Marker Score: ${shortCheck.stats.conversationalMarkerScore + masterCheck.stats.conversationalMarkerScore} | Avg Words/Sentence: ${shortCheck.stats.avgWordsPerSentence}`);

  const baseOutputDir = path.join(__dirname, '..', 'output');
  const tempDir = path.join(baseOutputDir, prod.id, prod.outputSubdir || '', 'temp');
  fs.mkdirSync(tempDir, { recursive: true });

  // 2.5 Hindi / Hinglish Pronunciation Preprocessing & Regression Test
  console.log(`\n--- STEP 0.5: Hindi / Hinglish Pronunciation Preprocessing & Regression ---`);
  productConfig.shortScenes = productConfig.shortScenes.map(s => pronunciationEngine.prepareScene(s));
  productConfig.masterScenes = productConfig.masterScenes.map(s => pronunciationEngine.prepareScene(s));

  const regName = prod.outputSubdir ? `pronunciation_regression_test_${prod.outputSubdir.toLowerCase()}.mp3` : 'pronunciation_regression_test.mp3';
  const regressionTestPath = path.join(baseOutputDir, prod.id, prod.outputSubdir || '', regName);
  await pronunciationEngine.runRegressionTest(regressionTestPath);
  const regFallbackPath = path.join(baseOutputDir, prod.id, prod.outputSubdir || '', 'pronunciation_regression_test.mp3');
  if (regressionTestPath !== regFallbackPath && fs.existsSync(regressionTestPath)) {
    fs.copyFileSync(regressionTestPath, regFallbackPath);
  }

  const deliverables = {
    shortVideo: null,
    masterVideo: null,
    microClips: [],
    subtitles: null,
    thumbnail: null
  };

  try {
    // 3. Ensure Local Product Preview Server
    console.log(`\n--- STEP 1: Booting Product Server ---`);
    const serverInfo = await browserController.ensureServer(prod.appDir, prod.port);

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 2: BUILD 9:16 SHORT FORM (~45-55s)
    // ─────────────────────────────────────────────────────────────────────────
    if (targetFormat === 'all' || targetFormat === 'short') {
      console.log(`\n--- STEP 2: Producing 9:16 Short Form Film (Human Presenter) ---`);

      // A. Generate scene narration with Human Presenter prosody
      const shortAudioDir = path.join(tempDir, 'short_audio');
      const sceneAudios = await narrationEngine.generateScenes(productConfig.shortScenes, shortAudioDir, forceRegenerate);

      // Map scene durations and calculate timeline
      let totalDurationSec = 0;
      const scenesWithTiming = productConfig.shortScenes.map((scene, i) => {
        const audio = sceneAudios.find(a => a.id === scene.id);
        const durationSec = audio ? audio.durationSec : 4.0;
        const timing = {
          ...scene,
          durationSec,
          startTimeSec: totalDurationSec,
          audioFile: audio?.file
        };
        totalDurationSec += durationSec + 0.6; // Audio + scene transition padding
        return timing;
      });

      console.log(`   Short Form Target Timeline: ${totalDurationSec.toFixed(2)} seconds across ${scenesWithTiming.length} scenes.`);
      deliverables.shortScenesWithTiming = scenesWithTiming;

      // B. Mix Narration Track + Ambient + Clicks
      const shortNarrPath = path.join(tempDir, 'short_narration_track.mp3');
      const stitched = audioMixer.stitchNarration(sceneAudios, totalDurationSec, shortNarrPath);

      const sfxMoments = [
        { timeSec: 2.0, type: 'click' },
        { timeSec: 7.5, type: 'click' },
        { timeSec: 14.0, type: 'click' },
        { timeSec: 22.0, type: 'confirm' }
      ];
      const masterAudioPath = path.join(tempDir, 'short_master_audio.aac');
      audioMixer.mixMasterAudio(stitched.file, totalDurationSec, sfxMoments, masterAudioPath);

      // C. Launch Browser at 1080x1920 (Vertical 9:16)
      const { browser, page } = await browserController.launchBrowser({ width: 1080, height: 1920, isMobile: true });
      const recorder = new ScreenRecorder();
      const rawShortMp4 = path.join(tempDir, 'raw_short_screencast.mp4');

      const helpers = browserController.getHelpers();

      // Navigate to app start route
      const startUrl = `http://127.0.0.1:${serverInfo.port}/${prod.startRoute || '#/'}`;
      console.log(`🌐 Navigating to ${startUrl}...`);
      await page.goto(startUrl, { waitUntil: 'networkidle2' });
      await helpers.sleep(1000);
      await annotationEngine.inject(page, true);

      // Start Screencast
      await recorder.start(page, rawShortMp4, { fps: 30, width: 1080, height: 1920 });

      // Execute each scene in sync with narration
      for (const scene of scenesWithTiming) {
        console.log(`   ▶ Executing Scene: [${scene.id}] "${scene.name}" (${scene.durationSec.toFixed(2)}s)...`);

        // Check if route switch needed
        if (scene.route) {
          await page.evaluate((r) => { window.location.hash = r; }, scene.route);
          await helpers.sleep(300);
        }

        // Brand card display
        if (scene.isBrandCard) {
          await page.evaluate((card) => {
            const el = document.createElement('div');
            el.id = 'garuda-brand-overlay';
            el.style.cssText = 'position:fixed;inset:0;background:#050811;z-index:9999999;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:-apple-system,BlinkMacSystemFont,sans-serif;color:#fff;text-align:center;padding:32px;box-sizing:border-box;';
            el.innerHTML = `
              <div style="width:72px;height:72px;border-radius:50%;background:#09121f;border:2px solid #10b981;display:flex;align-items:center;justify-content:center;margin-bottom:20px;box-shadow:0 0 24px rgba(16,185,129,0.3);">
                <div style="width:0;height:0;border-left:14px solid transparent;border-right:14px solid transparent;border-bottom:24px solid #10b981;"></div>
              </div>
              <div style="font-size:38px;font-weight:900;letter-spacing:3px;margin-bottom:10px;">${card.title}</div>
              <div style="font-size:15px;color:#94a3b8;font-weight:600;letter-spacing:1.5px;max-width:380px;line-height:1.5;margin-bottom:32px;">${card.tagline}</div>
              ${card.portal ? `<div style="background:#0b1329;border:1px solid rgba(16,185,129,0.4);border-radius:24px;padding:8px 24px;color:#10b981;font-weight:700;font-size:16px;">${card.portal}</div>` : ''}
              ${card.cta ? `<div style="font-size:13px;color:#64748b;margin-top:24px;">${card.cta}</div>` : ''}
            `;
            document.body.appendChild(el);
          }, scene.cardText);
        }

        // Show annotation before action if defined
        if (scene.annotation) {
          await annotationEngine.showAnnotation(page, scene.annotation.selector, scene.annotation.text, scene.annotation.position);
          await helpers.sleep(400);
        }

        const sceneStartTime = Date.now();

        // Run scene interaction
        if (scene.action) {
          await scene.action(page, helpers);
        }

        // Ensure visual scene duration matches narration duration + buffer
        const elapsedMs = Date.now() - sceneStartTime;
        const targetDurationMs = Math.round(scene.durationSec * 1000);
        if (elapsedMs < targetDurationMs) {
          await helpers.sleep(targetDurationMs - elapsedMs);
        }

        // Clear annotation and brand overlay (keep visible on last scene)
        if (scene.annotation) {
          await annotationEngine.clear(page);
        }
        const isLastScene = (scene === scenesWithTiming[scenesWithTiming.length - 1]);
        if (scene.isBrandCard && !isLastScene) {
          await page.evaluate(() => {
            const el = document.getElementById('garuda-brand-overlay');
            if (el) el.remove();
          });
        }

        // Scene transition buffer
        await helpers.sleep(500);
      }

      // Stop Screencast
      await recorder.stop();
      await browser.close();

      // D. Compose Final Short MP4
      const finalShortPath = path.join(tempDir, 'FINAL_SHORT_9x16.mp4');
      videoCompositor.composeFinalVideo(rawShortMp4, masterAudioPath, finalShortPath);
      deliverables.shortVideo = finalShortPath;

      // E. Generate Subtitles
      const subs = subtitleEngine.generateSubtitles(scenesWithTiming, path.join(tempDir, 'subtitles'), 'short');
      deliverables.subtitles = subs;

      // F. Generate Cover Thumbnail
      const thumbPath = path.join(tempDir, 'thumbnail_cover.png');
      videoCompositor.extractThumbnail(finalShortPath, 18, thumbPath);
      deliverables.thumbnail = thumbPath;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 3: BUILD 16:9 MASTER FILM (~75-85s)
    // ─────────────────────────────────────────────────────────────────────────
    if (targetFormat === 'all' || targetFormat === 'master') {
      console.log(`\n--- STEP 3: Producing 16:9 Master Film ---`);

      // A. Generate master scene narration with Human Presenter prosody
      const masterAudioDir = path.join(tempDir, 'master_audio');
      const sceneAudios = await narrationEngine.generateScenes(productConfig.masterScenes, masterAudioDir, forceRegenerate);

      let totalDurationSec = 0;
      const scenesWithTiming = productConfig.masterScenes.map((scene, i) => {
        const audio = sceneAudios.find(a => a.id === scene.id);
        const durationSec = audio ? audio.durationSec : 4.5;
        const timing = {
          ...scene,
          durationSec,
          startTimeSec: totalDurationSec,
          audioFile: audio?.file
        };
        totalDurationSec += durationSec + 0.6;
        return timing;
      });

      console.log(`   Master Film Target Timeline: ${totalDurationSec.toFixed(2)} seconds across ${scenesWithTiming.length} scenes.`);
      deliverables.masterScenesWithTiming = scenesWithTiming;

      // B. Mix Audio Track
      const masterNarrPath = path.join(tempDir, 'master_narration_track.mp3');
      const stitched = audioMixer.stitchNarration(sceneAudios, totalDurationSec, masterNarrPath);

      const sfxMoments = [
        { timeSec: 2.5, type: 'click' },
        { timeSec: 10.0, type: 'click' },
        { timeSec: 19.0, type: 'click' },
        { timeSec: 32.0, type: 'confirm' }
      ];
      const masterAudioPath = path.join(tempDir, 'master_master_audio.aac');
      audioMixer.mixMasterAudio(stitched.file, totalDurationSec, sfxMoments, masterAudioPath);

      // C. Launch Browser at 1920x1080 (Desktop 16:9)
      const { browser: masterBrowser, page } = await browserController.launchBrowser({ width: 1920, height: 1080, isMobile: false });
      const recorder = new ScreenRecorder();
      const rawMasterMp4 = path.join(tempDir, 'raw_master_screencast.mp4');

      const helpers = browserController.getHelpers();

      const startUrl = `http://127.0.0.1:${serverInfo.port}/${prod.startRoute || '#/'}`;
      await page.goto(startUrl, { waitUntil: 'networkidle2' });
      await helpers.sleep(1000);
      await annotationEngine.inject(page);

      await recorder.start(page, rawMasterMp4, { fps: 30, width: 1920, height: 1080 });

      for (const scene of scenesWithTiming) {
        console.log(`   ▶ Executing Master Scene: [${scene.id}] "${scene.name}" (${scene.durationSec.toFixed(2)}s)...`);

        if (scene.route) {
          await page.evaluate((r) => { window.location.hash = r; }, scene.route);
          await helpers.sleep(300);
        }

        if (scene.isBrandCard) {
          await page.evaluate((card) => {
            const el = document.createElement('div');
            el.id = 'garuda-brand-overlay';
            el.style.cssText = 'position:fixed;inset:0;background:#050811;z-index:9999999;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:-apple-system,BlinkMacSystemFont,sans-serif;color:#fff;text-align:center;padding:48px;box-sizing:border-box;';
            el.innerHTML = `
              <div style="width:90px;height:90px;border-radius:50%;background:#09121f;border:2px solid #10b981;display:flex;align-items:center;justify-content:center;margin-bottom:24px;box-shadow:0 0 32px rgba(16,185,129,0.35);">
                <div style="width:0;height:0;border-left:18px solid transparent;border-right:18px solid transparent;border-bottom:32px solid #10b981;"></div>
              </div>
              <div style="font-size:52px;font-weight:900;letter-spacing:4px;margin-bottom:14px;">${card.title}</div>
              <div style="font-size:20px;color:#94a3b8;font-weight:600;letter-spacing:2px;max-width:600px;line-height:1.5;margin-bottom:40px;">${card.tagline}</div>
              ${card.portal ? `<div style="background:#0b1329;border:1px solid rgba(16,185,129,0.4);border-radius:28px;padding:10px 32px;color:#10b981;font-weight:700;font-size:18px;">${card.portal}</div>` : ''}
              ${card.cta ? `<div style="font-size:15px;color:#64748b;margin-top:30px;">${card.cta}</div>` : ''}
            `;
            document.body.appendChild(el);
          }, scene.cardText);
        }

        if (scene.annotation) {
          await annotationEngine.showAnnotation(page, scene.annotation.selector, scene.annotation.text, scene.annotation.position);
          await helpers.sleep(400);
        }

        const sceneStartTime = Date.now();

        if (scene.action) {
          await scene.action(page, helpers);
        }

        // Ensure visual scene duration matches narration duration + buffer
        const elapsedMs = Date.now() - sceneStartTime;
        const targetDurationMs = Math.round(scene.durationSec * 1000);
        if (elapsedMs < targetDurationMs) {
          await helpers.sleep(targetDurationMs - elapsedMs);
        }

        // Clear annotation and brand overlay (keep visible on last scene)
        if (scene.annotation) {
          await annotationEngine.clear(page);
        }
        const isLastScene = (scene === scenesWithTiming[scenesWithTiming.length - 1]);
        if (scene.isBrandCard && !isLastScene) {
          await page.evaluate(() => {
            const el = document.getElementById('garuda-brand-overlay');
            if (el) el.remove();
          });
        }

        await helpers.sleep(500);
      }

      await recorder.stop();
      await masterBrowser.close();

      const finalMasterPath = path.join(tempDir, 'FINAL_MASTER_16x9.mp4');
      videoCompositor.composeFinalVideo(rawMasterMp4, masterAudioPath, finalMasterPath);
      deliverables.masterVideo = finalMasterPath;
    }

    if (!deliverables.masterVideo && fs.existsSync(path.join(tempDir, 'FINAL_MASTER_16x9.mp4'))) {
      deliverables.masterVideo = path.join(tempDir, 'FINAL_MASTER_16x9.mp4');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 4: EXTRACT MICRO-CLIPS
    // ─────────────────────────────────────────────────────────────────────────
    console.log(`\n--- STEP 4: Generating Micro-Clips ---`);
    const sourceForClips = deliverables.shortVideo || deliverables.masterVideo;
    if (sourceForClips) {
      const clip1 = path.join(tempDir, 'clip_01_invoice.mp4');
      const clip2 = path.join(tempDir, 'clip_02_receipt.mp4');
      const clip3 = path.join(tempDir, 'clip_03_offline.mp4');

      const moments = productConfig.microClipMoments || [
        { startSec: 8, durSec: 12 },
        { startSec: 36, durSec: 10 },
        { startSec: 26, durSec: 10 }
      ];

      videoCompositor.extractClip(sourceForClips, moments[0].startSec, moments[0].durSec, clip1);
      videoCompositor.extractClip(sourceForClips, moments[1].startSec, moments[1].durSec, clip2);
      videoCompositor.extractClip(sourceForClips, moments[2].startSec, moments[2].durSec, clip3);

      deliverables.microClips = [clip1, clip2, clip3];
      console.log(`✔ [ProofEngine] 3 Micro-clips extracted successfully.`);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 5: PACKAGE DELIVERABLES & SOCIAL METADATA
    // ─────────────────────────────────────────────────────────────────────────
    console.log(`\n--- STEP 5: Packaging Deliverables & Social Metadata ---`);
    const finalPackDir = contentPackager.packageContent(baseOutputDir, productConfig, deliverables);
    const allScenes = [...productConfig.shortScenes, ...productConfig.masterScenes];
    pronunciationEngine.exportMetadata(allScenes, finalPackDir);
    deliverables.packDir = finalPackDir;

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 6: AUTOMATED QUALITY CONTROL
    // ─────────────────────────────────────────────────────────────────────────
    console.log(`\n--- STEP 6: Automated Quality Control ---`);
    const qcResults = qualityControl.runForensicQC(deliverables);

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 6.5: MANDATORY HERO INVOICE FORENSIC GATE (Tesseract OCR)
    // ─────────────────────────────────────────────────────────────────────────
    console.log(`\n--- STEP 6.5: Mandatory Hero Invoice Forensic Gate ---`);
    let heroTimestampSec = 58;
    if (deliverables.masterScenesWithTiming) {
      const heroScene = deliverables.masterScenesWithTiming.find(s => s.id.includes('hero'));
      if (heroScene && typeof heroScene.startTimeSec === 'number') {
        heroTimestampSec = Math.round(heroScene.startTimeSec + 2.0);
      }
    } else if (deliverables.shortScenesWithTiming) {
      const heroScene = deliverables.shortScenesWithTiming.find(s => s.id.includes('hero'));
      if (heroScene && typeof heroScene.startTimeSec === 'number') {
        heroTimestampSec = Math.round(heroScene.startTimeSec + 2.0);
      }
    }
    const heroEvidence = await qualityControl.runHeroVerificationGate(deliverables, finalPackDir, heroTimestampSec);
    deliverables.heroEvidence = heroEvidence;

    // Synchronize to output/billing root as well (Founder directive: "udhr hi adjust kar")
    if (prod.outputSubdir) {
      const rootBillingDir = path.join(baseOutputDir, prod.id);
      if (deliverables.masterVideo && fs.existsSync(deliverables.masterVideo)) {
        fs.mkdirSync(path.join(rootBillingDir, 'master'), { recursive: true });
        fs.copyFileSync(deliverables.masterVideo, path.join(rootBillingDir, 'master', 'MASTER_16x9.mp4'));
        fs.copyFileSync(deliverables.masterVideo, path.join(rootBillingDir, 'MASTER_16x9.mp4'));
      }
      if (deliverables.shortVideo && fs.existsSync(deliverables.shortVideo)) {
        fs.mkdirSync(path.join(rootBillingDir, 'shorts'), { recursive: true });
        fs.copyFileSync(deliverables.shortVideo, path.join(rootBillingDir, 'shorts', 'SHORT_9x16.mp4'));
        fs.copyFileSync(deliverables.shortVideo, path.join(rootBillingDir, 'SHORT_9x16.mp4'));
      }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 7: GENERATE PILOT REPORT
    // ─────────────────────────────────────────────────────────────────────────
    console.log(`\n--- STEP 7: Writing Pilot Report ---`);
    const subPath = prod.outputSubdir ? `_${prod.outputSubdir.toUpperCase()}` : '';
    const reportPath = path.join(__dirname, '..', `GARUDA_VIDEO_PILOT_REPORT${subPath}.md`);
    const relBase = `output/${prod.id}/${prod.outputSubdir ? prod.outputSubdir + '/' : ''}`;

    const reportMd = 
`# 🦅 GARUDA PRODUCT PROOF ENGINE — ${prod.name.toUpperCase()} ${prod.outputSubdir ? prod.outputSubdir.toUpperCase() + ' ' : ''}REPORT

- **Product**: ${prod.name} (${prod.category})
- **Engine**: GARUDA Product Proof Engine (Modular & Reusable)
- **Voice Engine**: Microsoft \`hi-IN-SwaraNeural\` (Human Presenter v2 + Dedicated Hindi Pronunciation Engine)
- **Pronunciation Preprocessing**: Pronunciation Dictionary + Phonetic Devanagari Normalization + Word Tier Classification
- **Recording Engine**: Chrome DevTools Protocol Screencast -> FFmpeg stdin pipe (H.264 @ 30 FPS CFR Pump)
- **Audio Mix**: Voice (0 dB) + UI SFX (-14 dB) + Warm Ambient Bed (-26 dB) with Sidechain Ducking (-8 dB)
- **Date**: ${new Date().toISOString()}

---

## 📦 GENERATED DELIVERABLES

| Deliverable | File Path | Format | Size | Duration | Verified SHA-256 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Master Film (16:9)** | \`${relBase}master/MASTER_16x9${subPath}.mp4\` | 1920x1080 Landscape | ${(fs.statSync(deliverables.masterVideo).size / 1024 / 1024).toFixed(2)} MB | ${qualityControl.inspectMedia(deliverables.masterVideo).durationSec.toFixed(1)}s | \`${contentPackager.getFileSha256(deliverables.masterVideo)}\` |
| **Short Form (9:16)** | \`${relBase}shorts/SHORT_9x16${subPath}.mp4\` | 1080x1920 Portrait | ${(fs.statSync(deliverables.shortVideo).size / 1024 / 1024).toFixed(2)} MB | ${qualityControl.inspectMedia(deliverables.shortVideo).durationSec.toFixed(1)}s | \`${contentPackager.getFileSha256(deliverables.shortVideo)}\` |
| **Micro-Clip #1** | \`${relBase}micro-clips/MICRO_CLIP_01${subPath}.mp4\` | Feature Cut | ${(fs.statSync(deliverables.microClips[0]).size / 1024).toFixed(0)} KB | 12.0s | \`${contentPackager.getFileSha256(deliverables.microClips[0])}\` |
| **Micro-Clip #2** | \`${relBase}micro-clips/MICRO_CLIP_02${subPath}.mp4\` | Feature Cut | ${(fs.statSync(deliverables.microClips[1]).size / 1024).toFixed(0)} KB | 10.0s | \`${contentPackager.getFileSha256(deliverables.microClips[1])}\` |
| **Micro-Clip #3** | \`${relBase}micro-clips/MICRO_CLIP_03${subPath}.mp4\` | Feature Cut | ${(fs.statSync(deliverables.microClips[2]).size / 1024).toFixed(0)} KB | 10.0s | \`${contentPackager.getFileSha256(deliverables.microClips[2])}\` |
| **Cover Thumbnail** | \`${relBase}thumbnails/THUMBNAIL${subPath}.png\` | 1080x1920 PNG | ${(fs.statSync(deliverables.thumbnail).size / 1024).toFixed(0)} KB | Still Frame | \`${contentPackager.getFileSha256(deliverables.thumbnail)}\` |
| **English Subtitles** | \`${relBase}subtitles/subtitles_en${subPath.toLowerCase()}.srt\` | SRT File | Valid | Timed | \`${contentPackager.getFileSha256(deliverables.subtitles.en)}\` |
| **Hinglish Subtitles** | \`${relBase}subtitles/subtitles_hi${subPath.toLowerCase()}.srt\` | SRT File | Valid | Timed | \`${contentPackager.getFileSha256(deliverables.subtitles.hi)}\` |

---

## 🎙️ HINDI / HINGLISH PRONUNCIATION ENGINE ARTIFACTS

- **Pronunciation Dictionary**: \`${relBase}pronunciation_dictionary.json\`
- **Display Script (Clean Hinglish)**: \`${relBase}narration_script_display.json\`
- **Phonetic Speech Script (Swara TTS)**: \`${relBase}narration_script_speech.json\`
- **Pronunciation Regression Audio**: \`${relBase}pronunciation_regression_test.mp3\`

---

## 📱 SOCIAL MEDIA & SEO PACKAGES GENERATED

- **YouTube**: \`${relBase}youtube/YOUTUBE_METADATA.md\` (Chapters, SEO Title, 9 Tags, Description)
- **Instagram**: \`${relBase}instagram/INSTAGRAM_REEL.md\` (Viral Hook, Reel Caption, 10 High-Intent Hashtags)
- **Facebook**: \`${relBase}facebook/FACEBOOK_POST.md\` (Devanagari Hindi Copy tailored for Vyapari Groups)
- **LinkedIn**: \`${relBase}linkedin/LINKEDIN_POST.md\` (B2B Architecture & Offline-First Engineering Thesis)
- **JSON Manifest**: \`${relBase}manifest/CONTENT_INDEX.json\`

---

## 🔍 FORENSIC QUALITY CONTROL RESULTS

${qcResults.checks.map(c => `- **${c.passed ? '✔ PASS' : '✖ FAIL'}**: ${c.name} — \`${c.detail}\``).join('\n')}

**Overall QC Status**: ${qcResults.overallPass ? '✅ 100% CLEAN & VERIFIED' : '⚠️ ATTENTION REQUIRED'}

---

## 🚀 HOW TO PRODUCE THE NEXT PRODUCT USING THIS ENGINE

The engine is 100% configuration-driven. To produce films for the next product (e.g. **GARUDA Kist** or **Sanatan Setu**):

1. Create a config file in \`proof-engine/config/products/<product_name>.config.js\`
2. Define the product metadata, demo port, and scenes (narration, selector, actions).
3. Execute:
   \`\`\`bash
   node proof-engine/index.js --product=<product_name>
   \`\`\`
Zero engine code rewrite required.
`;

    fs.writeFileSync(reportPath, reportMd, 'utf-8');
    console.log(`✔ [ProofEngine] Production report saved: ${reportPath}`);

    return {
      success: true,
      deliverables,
      qcResults,
      reportPath,
      packDir: finalPackDir
    };

  } finally {
    // Cleanup browser and internal server
    await browserController.close();
  }
}

// Execute CLI
if (require.main === module) {
  runProduction().then(() => {
    console.log('\n✨ [ProofEngine] Pipeline execution finished cleanly!');
    process.exit(0);
  }).catch((err) => {
    console.error('\n🚨 [ProofEngine Fatal Error]:', err);
    process.exit(1);
  });
}

module.exports = { runProduction };
