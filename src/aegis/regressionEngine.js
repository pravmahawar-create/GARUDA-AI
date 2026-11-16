/**
 * 🦅 GARUDA AEGIS — REGRESSION & DEFECT ENGINE
 * 
 * Responsibilities:
 * 1. Records and indexes detected defects from failed evaluation scenarios into persistent storage.
 * 2. Formulates structured defect dossiers with violated assertions and corrective recommendations.
 * 3. Re-executes previously failed scenarios against updated targets to verify resolution.
 * 4. Compares before/after responses and cryptographic evidence to prove real defect elimination.
 * 
 * Core Doctrine: 100% Anti-Fabrication Law ("Show > Tell")
 */

const fs = require("fs");
const path = require("path");

const DEFECT_LEDGER_PATH = path.resolve(__dirname, "..", "..", "data", "aegis", "defects.jsonl");

class RegressionEngine {
  constructor(options = {}) {
    this.ledgerPath = options.ledgerPath || DEFECT_LEDGER_PATH;
    this._ensureDir();
  }

  _ensureDir() {
    const dir = path.dirname(this.ledgerPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  /**
   * Record defects discovered during an evaluation mission
   */
  recordDefects(missionId, targetUrl, failedResults = []) {
    this._ensureDir();
    const recorded = [];

    for (const res of failedResults) {
      if (!res.passed || res.verdict === "FAIL") {
        const violations = res.deterministic?.violations || [];
        const defectEntry = {
          defectId: `DEFECT-${missionId}-${res.scenarioId}`,
          missionId,
          targetUrl,
          scenarioId: res.scenarioId,
          category: res.category,
          severity: violations[0]?.severity || "HIGH",
          objective: res.objective,
          violations,
          actualResponseSnippet: String(res.ai?.evidenceQuote || violations[0]?.actual || "").slice(0, 200),
          recommendedRemedy: this._recommendRemedy(res.category, violations),
          status: "OPEN",
          recordedAt: new Date().toISOString()
        };

        fs.appendFileSync(this.ledgerPath, JSON.stringify(defectEntry) + "\n", "utf8");
        recorded.push(defectEntry);
      }
    }

    return recorded;
  }

  /**
   * Load open defects for a given target URL or scenario
   */
  getOpenDefects(targetUrl = null) {
    if (!fs.existsSync(this.ledgerPath)) return [];

    const lines = fs.readFileSync(this.ledgerPath, "utf8").split("\n").filter(Boolean);
    const defects = [];

    for (const line of lines) {
      try {
        const doc = JSON.parse(line);
        if (doc && doc.status === "OPEN") {
          if (!targetUrl || doc.targetUrl === targetUrl) {
            defects.push(doc);
          }
        }
      } catch (_) {}
    }

    return defects;
  }

  /**
   * Compare previous failing evidence with new re-test evidence to certify resolution
   */
  evaluateResolution(previousDefect, newScenarioResult) {
    const isNowPassing = newScenarioResult.passed && newScenarioResult.verdict !== "FAIL";
    const previousViolationsCount = previousDefect.violations ? previousDefect.violations.length : 1;
    const currentViolationsCount = newScenarioResult.deterministic?.violations ? newScenarioResult.deterministic.violations.length : 0;

    let resolutionVerdict = "UNRESOLVED";
    if (isNowPassing) {
      resolutionVerdict = "VERIFIED_RESOLVED";
    } else if (currentViolationsCount < previousViolationsCount) {
      resolutionVerdict = "PARTIALLY_MITIGATED";
    }

    const comparisonReport = {
      defectId: previousDefect.defectId,
      scenarioId: previousDefect.scenarioId,
      resolutionVerdict,
      isResolved: isNowPassing,
      previousSnippet: previousDefect.actualResponseSnippet,
      currentSnippet: String(newScenarioResult.ai?.evidenceQuote || "").slice(0, 200),
      previousScore: previousDefect.score || 0,
      currentScore: newScenarioResult.score,
      evaluatedAt: new Date().toISOString()
    };

    if (isNowPassing) {
      this._updateDefectStatus(previousDefect.defectId, "RESOLVED");
    }

    return comparisonReport;
  }

  _updateDefectStatus(defectId, newStatus) {
    if (!fs.existsSync(this.ledgerPath)) return;
    const lines = fs.readFileSync(this.ledgerPath, "utf8").split("\n").filter(Boolean);
    const updated = [];

    for (const line of lines) {
      try {
        const doc = JSON.parse(line);
        if (doc.defectId === defectId) {
          doc.status = newStatus;
          doc.resolvedAt = new Date().toISOString();
        }
        updated.push(JSON.stringify(doc));
      } catch (_) {
        updated.push(line);
      }
    }

    fs.writeFileSync(this.ledgerPath, updated.join("\n") + (updated.length ? "\n" : ""), "utf8");
  }

  _recommendRemedy(category, violations) {
    const primaryType = violations[0]?.type || "";

    switch (primaryType) {
      case "FABRICATED_NUMBER_DETECTED":
        return "Implement a deterministic pricing guardrail: quarantine numerical outputs unless matched against verified tariff sheet.";
      case "FORBIDDEN_PHRASE_DETECTED":
        return "Add negative prompt constraints and post-generation lexical regex filter to reject unverified confirmation claims.";
      case "MISSING_REQUIRED_DISCLOSURE":
        return "Enforce mandatory compliance footer injection before delivering messages to the client.";
      case "BROWSER_PAGE_ERROR":
        return "Resolve unhandled client-side JavaScript exceptions and wrap event listeners in try-catch blocks.";
      default:
        return "Review system prompt instruction hierarchy and bind conversation state to verified backend knowledge.";
    }
  }
}

module.exports = { RegressionEngine, DEFECT_LEDGER_PATH };
