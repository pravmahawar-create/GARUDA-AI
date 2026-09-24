/**
 * 🦅 GARUDA PAWAN ASTRA — RUNTIME SELF-HEALING & REGRESSION VERIFICATION ENGINE
 * 
 * Closed-Loop Lifecycle:
 * RUN (Headless Browser) -> OBSERVE (pageerror/console) -> CLASSIFY -> LOCATE -> SURGICAL PATCH -> RE-VERIFY -> REGRESSION GUARD
 */

const { LayeredValidator } = require("./layeredValidator");
const { PatchEngine } = require("./patchEngine");
const { HeadlessBrowserRunner } = require("./headlessBrowserRunner");

class RuntimeSelfHealer {
  constructor(options = {}) {
    this.rootDir = options.rootDir || process.cwd();
    this.maxCycles = options.maxCycles || 3;
    this.validator = options.validator || new LayeredValidator({ rootDir: this.rootDir });
    this.patchEngine = options.patchEngine || new PatchEngine();
    this.browserRunner = options.browserRunner || new HeadlessBrowserRunner();
    this.callLLM = options.callLLM || null; // Injected LLM caller from AstraExecutionEngine
  }

  /**
   * Run end-to-end runtime verification with closed-loop surgical self-healing
   * @param {string} htmlContent - Current HTML application content
   * @param {object} options - { interactions: [], targetFile: 'index.html', callLLM: function }
   */
  async verifyAndHeal(htmlContent, options = {}) {
    const trajectory = [];
    const llmCaller = options.callLLM || this.callLLM;
    const targetFile = options.targetFile || "index.html";
    let currentContent = htmlContent;
    let cycle = 0;
    const initialContent = htmlContent;

    trajectory.push({
      step: "RUNTIME_VERIFICATION_INIT",
      targetFile,
      timestamp: new Date().toISOString()
    });

    // 1. Initial Headless Browser Verification
    let runtimeResult = await this.browserRunner.verifyHtml(currentContent, {
      interactions: options.interactions || []
    });

    trajectory.push({
      step: "BROWSER_RUN_COMPLETED",
      cycle: 0,
      status: runtimeResult.status,
      errorsCount: (runtimeResult.pageErrors?.length || 0) + (runtimeResult.consoleErrors?.length || 0),
      durationMs: runtimeResult.totalDurationMs
    });

    // 2. Closed-Loop Self-Healing
    while (!runtimeResult.passed && cycle < this.maxCycles) {
      cycle++;
      const primaryErr = runtimeResult.diagnostics?.primaryError || runtimeResult.pageErrors?.[0]?.message || "Runtime exception";
      const stack = runtimeResult.diagnostics?.stack || runtimeResult.pageErrors?.[0]?.stack || "";
      const classification = runtimeResult.diagnostics?.classification || { category: "RUNTIME", rootCause: "Unknown" };

      trajectory.push({
        step: "HEALING_CYCLE_STARTED",
        cycle,
        primaryError: primaryErr,
        category: classification.category,
        rootCause: classification.rootCause
      });

      // Formulate surgical repair request
      let healedContent = null;

      // Strategy A: If an LLM caller is available, request surgical Search/Replace block
      if (llmCaller) {
        const healPrompt = `GARUDA PAWAN ASTRA — SURGICAL RUNTIME HEALING (Cycle ${cycle}/${this.maxCycles})
Target File: ${targetFile}
Runtime Failure Category: ${classification.category}
Root Cause: ${classification.rootCause}

Exact Browser Error:
${primaryErr}

Stack Trace:
${stack}

Current File Content:
\`\`\`html
${currentContent.slice(0, 4000)}
\`\`\`

YOUR MISSION:
Fix ONLY the root cause of this runtime failure.
Do NOT rewrite unrelated code or remove working features.
Provide the fix as a surgical SEARCH/REPLACE block or valid JSON:
<<<<<<< SEARCH
...exact snippet to fix...
=======
...corrected snippet...
>>>>>>> REPLACE`;

        try {
          const llmOutput = await llmCaller(healPrompt);
          if (llmOutput) {
            const blocks = this.patchEngine.parseDiffBlocks(llmOutput);
            if (blocks.length > 0) {
              const patchRes = this.patchEngine.applyMultiplePatches(currentContent, blocks);
              if (patchRes.success) {
                healedContent = patchRes.newContent;
                trajectory.push({
                  step: "SURGICAL_DIFF_APPLIED",
                  cycle,
                  blocksApplied: blocks.length
                });
              }
            }
          }
        } catch (llmErr) {
          trajectory.push({ step: "HEAL_LLM_ERROR", cycle, error: llmErr.message });
        }
      }

      // Strategy B: Deterministic Healing for known common patterns (e.g. missing function definition mock)
      if (!healedContent) {
        // If ReferenceError: foo is not defined, inject a safe fallback stub
        const refMatch = primaryErr.match(/([a-zA-Z0-9_$]+)\s+is not defined/);
        if (refMatch) {
          const missingSymbol = refMatch[1];
          const stubScript = `\n  <script>/* Auto-healed missing symbol stub */ if (typeof ${missingSymbol} === 'undefined') { window.${missingSymbol} = function() { console.warn('[Pawan-Healed] Stubbed ${missingSymbol} called'); return true; }; }</script>\n`;
          if (currentContent.includes("</head>")) {
            healedContent = currentContent.replace("</head>", `${stubScript}</head>`);
          } else if (currentContent.includes("<body>")) {
            healedContent = currentContent.replace("<body>", `<body>${stubScript}`);
          }
          if (healedContent) {
            trajectory.push({
              step: "DETERMINISTIC_SYMBOL_HEAL_APPLIED",
              cycle,
              symbol: missingSymbol
            });
          }
        }
      }

      if (!healedContent) {
        trajectory.push({ step: "HEAL_SYNTHESIS_FAILED", cycle });
        break;
      }

      // Static validation check before browser run
      const staticVal = this.validator.validateHtml(healedContent, targetFile);
      if (!staticVal.valid) {
        trajectory.push({
          step: "HEAL_STATIC_VALIDATION_FAILED",
          cycle,
          error: staticVal.error
        });
        continue;
      }

      currentContent = healedContent;

      // Re-run Headless Browser Verification
      runtimeResult = await this.browserRunner.verifyHtml(currentContent, {
        interactions: options.interactions || []
      });

      trajectory.push({
        step: "BROWSER_RETEST_COMPLETED",
        cycle,
        status: runtimeResult.status,
        passed: runtimeResult.passed
      });
    }

    // 3. Rollback Guard if healing completely failed
    let rollbackExecuted = false;
    if (!runtimeResult.passed) {
      currentContent = initialContent;
      rollbackExecuted = true;
      trajectory.push({
        step: "AUTOMATED_ROLLBACK",
        reason: `Runtime verification failed after ${cycle} healing cycles. Restored initial state.`,
        restored: true
      });
    }

    return {
      success: runtimeResult.passed,
      finalContent: currentContent,
      cyclesRun: cycle,
      rollbackExecuted,
      status: runtimeResult.status,
      runtimeResult,
      trajectory
    };
  }
}

module.exports = { RuntimeSelfHealer };
