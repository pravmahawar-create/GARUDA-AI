/**
 * 🦅 GARUDA AEGIS — EVIDENCE INTEGRITY
 * 
 * Cryptographic hashing and verification utilities for audit records.
 * Generates and validates SHA-256 manifests across all captured evidence files.
 * 
 * Core Doctrine: 100% Anti-Fabrication Law ("Show > Tell")
 */

const crypto = require("crypto");
const fs = require("fs");

class EvidenceIntegrity {
  /**
   * Compute SHA-256 hash of a file or string/buffer
   */
  static computeSha256(input) {
    if (Buffer.isBuffer(input)) {
      return crypto.createHash("sha256").update(input).digest("hex");
    }
    if (typeof input === "string") {
      // If it's a file path that exists on disk, hash the file contents
      if (fs.existsSync(input) && fs.statSync(input).isFile()) {
        const fileBuf = fs.readFileSync(input);
        return crypto.createHash("sha256").update(fileBuf).digest("hex");
      }
      return crypto.createHash("sha256").update(input, "utf8").digest("hex");
    }
    return crypto.createHash("sha256").update(JSON.stringify(input)).digest("hex");
  }

  /**
   * Build a cryptographic manifest mapping artifact names to their SHA-256 hashes
   */
  static buildManifest(artifacts = []) {
    const items = [];

    for (const art of artifacts) {
      const sha256 = this.computeSha256(art.path || art.content || art.data);
      let sizeBytes = 0;
      if (art.path && fs.existsSync(art.path)) {
        sizeBytes = fs.statSync(art.path).size;
      } else if (art.content) {
        sizeBytes = Buffer.byteLength(String(art.content));
      }

      items.push({
        name: art.name,
        type: art.type || "artifact",
        path: art.path || null,
        sizeBytes,
        sha256,
        capturedAt: art.timestamp || new Date().toISOString()
      });
    }

    const manifestSignature = crypto
      .createHash("sha256")
      .update(JSON.stringify(items))
      .digest("hex");

    return {
      totalArtifacts: items.length,
      manifestSignature,
      generatedAt: new Date().toISOString(),
      artifacts: items
    };
  }

  /**
   * Verify an existing manifest against current disk state
   */
  static verifyManifest(manifest) {
    if (!manifest || !Array.isArray(manifest.artifacts)) {
      return { valid: false, reason: "Malformed manifest structure." };
    }

    const discrepancies = [];
    for (const art of manifest.artifacts) {
      if (!art.path || !fs.existsSync(art.path)) {
        discrepancies.push({ name: art.name, error: "File missing on disk" });
        continue;
      }
      const currentSha = this.computeSha256(art.path);
      if (currentSha !== art.sha256) {
        discrepancies.push({
          name: art.name,
          error: "SHA-256 mismatch: file has been tampered with or modified",
          expected: art.sha256,
          actual: currentSha
        });
      }
    }

    return {
      valid: discrepancies.length === 0,
      discrepanciesCount: discrepancies.length,
      discrepancies
    };
  }
}

module.exports = { EvidenceIntegrity };
