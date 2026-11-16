/**
 * 🦅 GARUDA AEGIS — REPORT GENERATOR
 * 
 * Generates authoritative machine-readable JSON and human-readable Markdown reports
 * for every evaluation mission, complete with cryptographic SHA-256 evidence tables.
 * 
 * Core Doctrine: 100% Anti-Fabrication Law ("Show > Tell")
 */

const fs = require("fs");
const path = require("path");
const { EvidenceIntegrity } = require("./evidenceIntegrity");

const BASE_REPORTS_DIR = path.resolve(__dirname, "..", "..", "data", "aegis", "reports");

class ReportGenerator {
  constructor(options = {}) {
    this.reportsDir = options.reportsDir || BASE_REPORTS_DIR;
    this._ensureDir();
  }

  _ensureDir() {
    if (!fs.existsSync(this.reportsDir)) {
      fs.mkdirSync(this.reportsDir, { recursive: true });
    }
  }

  /**
   * Generate both JSON and Markdown reports for a completed evaluation mission
   */
  generateMissionReports(missionSummary) {
    this._ensureDir();
    const missionId = missionSummary.missionId;
    const jsonPath = path.join(this.reportsDir, `aegis-${missionId}.json`);
    const mdPath = path.join(this.reportsDir, `aegis-${missionId}.md`);

    // 1. Write Machine-Readable JSON
    fs.writeFileSync(jsonPath, JSON.stringify(missionSummary, null, 2), "utf8");
    const jsonSha256 = EvidenceIntegrity.computeSha256(jsonPath);

    // 2. Generate Markdown Report
    const markdownContent = this._renderMarkdown(missionSummary, jsonSha256);
    fs.writeFileSync(mdPath, markdownContent, "utf8");
    const mdSha256 = EvidenceIntegrity.computeSha256(mdPath);

    return {
      jsonReport: { path: jsonPath, sha256: jsonSha256 },
      markdownReport: { path: mdPath, sha256: mdSha256 }
    };
  }

  _renderMarkdown(summary, jsonSha256) {
    const passedCount = summary.results.filter(r => r.verdict === "PASS").length;
    const warnCount = summary.results.filter(r => r.verdict === "WARN").length;
    const failCount = summary.results.filter(r => r.verdict === "FAIL").length;
    const totalCount = summary.results.length;
    const overallVerdict = failCount === 0 ? (warnCount === 0 ? "PASSED_CLEAN" : "PASSED_WITH_WARNINGS") : "FAILED";

    // Category Aggregates
    const categories = {};
    for (const res of summary.results) {
      if (!categories[res.category]) {
        categories[res.category] = { total: 0, passed: 0, failed: 0, warned: 0 };
      }
      categories[res.category].total++;
      if (res.verdict === "PASS") categories[res.category].passed++;
      else if (res.verdict === "WARN") categories[res.category].warned++;
      else categories[res.category].failed++;
    }

    const categoryRows = Object.entries(categories).map(([cat, stats]) => {
      const rate = Math.round((stats.passed / stats.total) * 100);
      return `| \`${cat}\` | ${stats.total} | ${stats.passed} | ${stats.warned} | ${stats.failed} | ${rate}% |`;
    }).join("\n");

    // Defect Registry
    const defects = [];
    for (const res of summary.results) {
      if (res.verdict === "FAIL" || res.deterministic?.violations?.length > 0) {
        for (const v of (res.deterministic?.violations || [])) {
          defects.push({
            scenarioId: res.scenarioId,
            category: res.category,
            severity: v.severity,
            rule: v.rule,
            actual: v.actual,
            detail: v.detail
          });
        }
      }
    }

    const defectRows = defects.length > 0 
      ? defects.map((d, i) => `| ${i + 1} | \`${d.scenarioId}\` | **${d.severity}** | ${d.rule} | \`${d.actual}\` |`).join("\n")
      : "| - | None | - | Zero deterministic defects detected | Clean |";

    // Evidence Manifest Table
    const manifestRows = (summary.manifest?.artifacts || []).map((art, i) => {
      return `| ${i + 1} | \`${art.name}\` | \`${art.type}\` | ${art.sizeBytes} B | \`${art.sha256.slice(0, 16)}...\` |`;
    }).join("\n");

    // Scenario Interaction Transcripts
    const transcriptBlocks = summary.results.map((r, i) => {
      const turnsText = (r.turns || []).map((t) => {
        const userClean = (t.userMessage || "").replace(/\n/g, " ");
        const botClean = (t.agentResponse || "[No response recorded]").replace(/\n/g, "\n> ");
        return `**Turn ${t.turnIndex}** (${t.durationMs || 0} ms):\n- **User**: *${userClean}*\n- **Agent**:\n> ${botClean}`;
      }).join("\n\n");

      return `### ${i + 1}. [${r.verdict}] \`${r.scenarioId}\` — ${r.category}
**Objective**: ${r.objective}  
**Verdict**: **${r.verdict}** (Score: ${r.score}/100)  

${turnsText || "*No turn details available*"}
`;
    }).join("\n---\n\n");

    return `# 🦅 GARUDA AEGIS — FORENSIC EVALUATION REPORT
**Mission ID**: \`${summary.missionId}\`  
**Authority**: Founder Praveen Mahawar (\`founder_garuda\`)  
**Core Doctrine**: 100% Anti-Fabrication Law ("Show > Tell")  
**Evaluation Target**: \`${summary.targetUrl}\` (\`${summary.targetMode}\`)  
**Completed At**: ${summary.completedAt || new Date().toISOString()}  
**Overall Verdict**: **${overallVerdict}**  
**Composite Quality Score**: **${summary.overallScore}/100**  
**Raw JSON Hash**: \`${jsonSha256}\`  

---

## 1. Executive Evaluation Summary

| Metric | Measured Value |
| :--- | :--- |
| **Total Scenarios Evaluated** | ${totalCount} |
| **Passed (Zero Defects)** | ${passedCount} (${Math.round((passedCount/totalCount)*100)}%) |
| **Warnings (Non-Critical)** | ${warnCount} |
| **Failures (Deterministic Breach)** | ${failCount} |
| **Average Turn Latency** | ${summary.avgLatencyMs || "N/A"} ms |
| **Cryptographic Evidence Artifacts** | ${summary.manifest?.totalArtifacts || 0} files verified |

---

## 2. Category Performance Breakdown

| Evaluation Category | Total | Pass | Warn | Fail | Pass Rate |
| :--- | :---: | :---: | :---: | :---: | :---: |
${categoryRows}

---

## 3. Defect & Violation Registry

| # | Scenario ID | Severity | Violated Rule | Captured Artifact / Text |
| :-: | :--- | :---: | :--- | :--- |
${defectRows}

---

## 4. Scenario Interaction Transcripts & Forensic Proof

${transcriptBlocks}

---

## 5. Cryptographic Evidence Manifest (SHA-256)

Every turn transcript, rendered DOM snapshot, and binary screenshot is cryptographically hashed to establish immutable provenance:

| # | Artifact Name | Type | Size | SHA-256 (Prefix) |
| :-: | :--- | :--- | :---: | :--- |
${manifestRows || "| - | No artifacts recorded | - | - | - |"}

**Manifest Signature**: \`${summary.manifest?.manifestSignature || "N/A"}\`

---

## 6. Sovereign Verification Declaration

All findings documented in this report represent real execution evidence captured via the GARUDA AEGIS evaluation harness. Layer A deterministic assertions strictly governed scoring; no AI-generated score was permitted to override detected pricing fabrications, false booking confirmations, or consent breaches.
`;
  }
}

module.exports = { ReportGenerator, BASE_REPORTS_DIR };
