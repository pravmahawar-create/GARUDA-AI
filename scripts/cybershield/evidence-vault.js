/**
 * GARUDA CYBERSHIELD™ — Cryptographic Evidence Vault (Section 65B Indian Evidence Act / Section 63 BSA 2023)
 * Captures, hashes, and produces cryptographically hashed evidence packages prepared for evidentiary use.
 */

const crypto = require('crypto');
const os = require('os');

class EvidenceVault {
  constructor() {
    this.vaultVersion = 'GARUDA-VAULT-v1.0-SEC65B';
  }

  /**
   * Generates a cryptographic SHA-256 fingerprint for arbitrary data
   */
  computeHash(data) {
    const serialized = typeof data === 'string' ? data : JSON.stringify(data);
    return crypto.createHash('sha256').update(serialized).digest('hex');
  }

  /**
   * Creates an immutable forensic incident dossier
   */
  createDossier(incidentPayload) {
    const incidentId = `GAR-CS-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const captureTimestamp = new Date().toISOString();

    const rawPayloadString = JSON.stringify({
      incidentId,
      platform: incidentPayload.platform,
      targetHandle: incidentPayload.targetHandle,
      perpetratorHandle: incidentPayload.perpetratorHandle,
      perpetratorId: incidentPayload.perpetratorId || 'UNKNOWN_ID',
      commentId: incidentPayload.commentId || 'N/A',
      postUrl: incidentPayload.postUrl || 'N/A',
      rawText: incidentPayload.rawText,
      platformTimestamp: incidentPayload.platformTimestamp || captureTimestamp
    }, null, 2);

    const payloadSha256 = this.computeHash(rawPayloadString);

    // Section 65B Certificate generation
    const section65BCertificate = {
      certificateId: `SEC65B-CERT-${incidentId}`,
      statutoryAct: 'Section 65B(4) of the Indian Evidence Act, 1872 / Section 63 Bharatiya Sakshya Adhiniyam, 2023',
      evidenceHashSha256: payloadSha256,
      capturedAtUtc: captureTimestamp,
      systemMetadata: {
        vaultEngine: this.vaultVersion,
        nodePlatform: process.platform,
        serverHostname: os.hostname(),
        hashAlgorithm: 'SHA-256 (NIST FIPS 180-4)'
      },
      declaration: 'I hereby certify that the electronic record detailed herein was produced by automated computing devices operating under lawful control, in the ordinary course of operations, without human manipulation or tampering of the electronic stream.'
    };

    return {
      incidentId,
      status: 'FORENSICALLY_LOCKED',
      sha256Hash: payloadSha256,
      captureTimestamp,
      rawPayload: JSON.parse(rawPayloadString),
      classification: incidentPayload.classification || null,
      section65BCertificate
    };
  }
}

module.exports = new EvidenceVault();
