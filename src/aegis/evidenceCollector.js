/**
 * 🦅 GARUDA AEGIS — EVIDENCE COLLECTOR
 * 
 * Collects, writes, and cryptographically tracks all evaluation session artifacts:
 * - Rendered transcripts (JSON)
 * - Binary PNG Screenshots
 * - Raw DOM HTML Snapshots
 * - Network & Console Logs
 * - Evidence Manifest (SHA-256)
 * 
 * Core Doctrine: 100% Anti-Fabrication Law ("Show > Tell")
 */

const fs = require("fs");
const path = require("path");
const { EvidenceIntegrity } = require("./evidenceIntegrity");

const BASE_EVIDENCE_DIR = path.resolve(__dirname, "..", "..", "data", "aegis", "evidence");

class EvidenceCollector {
  constructor(missionId, options = {}) {
    this.missionId = missionId;
    this.missionDir = path.join(options.baseDir || BASE_EVIDENCE_DIR, missionId);
    this.artifacts = [];
    this._ensureDir();
  }

  _ensureDir() {
    if (!fs.existsSync(this.missionDir)) {
      fs.mkdirSync(this.missionDir, { recursive: true });
    }
  }

  /**
   * Save a binary PNG screenshot and track its SHA-256 hash
   */
  recordScreenshot(scenarioId, turnIndex, bufferOrPath) {
    this._ensureDir();
    const filename = `screen_${scenarioId}_turn${turnIndex}_${Date.now()}.png`;
    const destPath = path.join(this.missionDir, filename);

    if (Buffer.isBuffer(bufferOrPath)) {
      fs.writeFileSync(destPath, bufferOrPath);
    } else if (typeof bufferOrPath === "string" && fs.existsSync(bufferOrPath) && bufferOrPath !== destPath) {
      fs.copyFileSync(bufferOrPath, destPath);
    }

    const sha256 = EvidenceIntegrity.computeSha256(destPath);
    this.artifacts.push({
      name: filename,
      type: "screenshot_png",
      path: destPath,
      sha256,
      scenarioId,
      turnIndex,
      timestamp: new Date().toISOString()
    });

    return { filePath: destPath, sha256 };
  }

  /**
   * Save DOM snapshot HTML and record hash
   */
  recordDomSnapshot(scenarioId, turnIndex, domHtml) {
    this._ensureDir();
    const filename = `dom_${scenarioId}_turn${turnIndex}.html`;
    const destPath = path.join(this.missionDir, filename);
    fs.writeFileSync(destPath, domHtml || "", "utf8");

    const sha256 = EvidenceIntegrity.computeSha256(destPath);
    this.artifacts.push({
      name: filename,
      type: "dom_html",
      path: destPath,
      sha256,
      scenarioId,
      turnIndex,
      timestamp: new Date().toISOString()
    });

    return { filePath: destPath, sha256 };
  }

  /**
   * Record raw scenario execution transcript
   */
  recordTranscript(scenarioId, transcriptData) {
    this._ensureDir();
    const filename = `transcript_${scenarioId}.json`;
    const destPath = path.join(this.missionDir, filename);
    fs.writeFileSync(destPath, JSON.stringify(transcriptData, null, 2), "utf8");

    const sha256 = EvidenceIntegrity.computeSha256(destPath);
    this.artifacts.push({
      name: filename,
      type: "transcript_json",
      path: destPath,
      sha256,
      scenarioId,
      timestamp: new Date().toISOString()
    });

    return { filePath: destPath, sha256 };
  }

  /**
   * Build and persist the cryptographic evidence manifest
   */
  generateEvidenceManifest() {
    this._ensureDir();
    const manifest = EvidenceIntegrity.buildManifest(this.artifacts);
    const manifestPath = path.join(this.missionDir, "evidence-manifest.json");
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), "utf8");

    return {
      manifestPath,
      manifest
    };
  }
}

module.exports = { EvidenceCollector, BASE_EVIDENCE_DIR };
