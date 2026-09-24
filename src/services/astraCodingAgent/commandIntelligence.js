/**
 * GARUDA PAWAN ASTRA™ — Command Intelligence & Failure Classifier
 * 
 * Determines when terminal commands are necessary and classifies build,
 * test, and dependency failures with surgical precision.
 * 
 * Distinct Defect Categories:
 * - CODE_DEFECT (Syntax, Type, Export mismatch)
 * - DEPENDENCY_DEFECT (Missing third-party package)
 * - CONFIGURATION_DEFECT (Bad config, JSON syntax, missing env var)
 * - ENVIRONMENT_DEFECT (Port conflict, EACCES, missing runtime)
 */

const path = require("path");
const fs = require("fs");

class CommandIntelligence {
  constructor(options = {}) {
    this.rootDir = options.rootDir || path.resolve(__dirname, "../../../");
  }

  /**
   * Decide command sequence based on intent and repository state
   */
  decideCommands(intent, context = {}) {
    const lower = (intent || "").toLowerCase();

    if (lower.includes("build") || lower.includes("compile") || lower.includes("bundle")) {
      return {
        strategy: "BUILD_VERIFICATION",
        commands: [
          {
            purpose: "Check frontend/module build integrity",
            command: context.buildCommand || "npm run build",
            cwd: context.cwd || "frontend",
            required: true
          }
        ],
        description: "Execute build pipeline to intercept compiler/bundler errors"
      };
    }

    if (lower.includes("test") || lower.includes("unit test") || lower.includes("regression")) {
      return {
        strategy: "TEST_EXECUTION",
        commands: [
          {
            purpose: "Run test suite",
            command: context.testCommand || "npm test",
            cwd: context.cwd || ".",
            required: true
          }
        ],
        description: "Execute targeted unit tests to verify behavioral correctness"
      };
    }

    if (lower.includes("status") || lower.includes("git status") || lower.includes("diff")) {
      return {
        strategy: "INSPECTION",
        commands: [
          {
            purpose: "Inspect git working tree status",
            command: "git status -s",
            cwd: ".",
            required: true
          }
        ],
        description: "Audit working tree modifications"
      };
    }

    return {
      strategy: "TARGETED_PATCH_THEN_VERIFY",
      commands: [],
      description: "Direct in-process AST patch and local verification preferred over blind terminal executions"
    };
  }

  /**
   * Classify build, test, and dependency failures with root-cause identification
   */
  classifyFailure(output, exitCode = 1) {
    const text = typeof output === "string" ? output : (output?.stderr || output?.stdout || "");

    // 1. Dependency Defect (Missing node package)
    const depMatch = text.match(/Cannot find module ['"]([^'"/][^'"]*)['"]/i) ||
                     text.match(/Failed to resolve import ['"]([^'"/][^'"]*)['"]/i) ||
                     text.match(/Module not found: Can't resolve ['"]([^'"]+)['"]/i);
    if (depMatch) {
      const pkgName = depMatch[1];
      const isInternalRelative = pkgName.startsWith(".") || pkgName.startsWith("/");
      if (!isInternalRelative) {
        return {
          category: "DEPENDENCY_DEFECT",
          type: "MISSING_PACKAGE",
          missingTarget: pkgName,
          file: this._extractFilePath(text),
          line: this._extractLineNumber(text),
          explanation: `External dependency '${pkgName}' is imported but not found in node_modules or package.json.`,
          recommendation: "Check package.json to verify if dependency is authorized before running npm install."
        };
      }
    }

    // 2. Code Defect: Broken relative import / path typo
    const relativeImportMatch = text.match(/Cannot find module ['"](\.[^'"]+)['"]/i) ||
                                text.match(/Failed to resolve import ['"](\.[^'"]+)['"]/i);
    if (relativeImportMatch) {
      return {
        category: "CODE_DEFECT",
        type: "BROKEN_RELATIVE_IMPORT",
        missingTarget: relativeImportMatch[1],
        file: this._extractFilePath(text),
        line: this._extractLineNumber(text),
        explanation: `Internal file import '${relativeImportMatch[1]}' could not be resolved. Likely relative path typo or moved file.`,
        recommendation: "Surgically patch the relative import path to point to the correct file location."
      };
    }

    // 3. Code Defect: Export mismatch (named export not found)
    const exportMatch = text.match(/does not provide an export named ['"]([^'"]+)['"]/i) ||
                        text.match(/['"]([^'"]+)['"] is not exported by/i);
    if (exportMatch) {
      return {
        category: "CODE_DEFECT",
        type: "EXPORT_NOT_FOUND",
        missingSymbol: exportMatch[1],
        file: this._extractFilePath(text),
        line: this._extractLineNumber(text),
        explanation: `Symbol '${exportMatch[1]}' is imported but not exported by the target module.`,
        recommendation: "Verify available exports in target file and align the import statement or add the missing export."
      };
    }

    // 4. Code Defect: Syntax Error
    if (/SyntaxError/i.test(text) || /Unexpected token/i.test(text) || /Parsing error/i.test(text)) {
      return {
        category: "CODE_DEFECT",
        type: "BUILD_SYNTAX",
        file: this._extractFilePath(text),
        line: this._extractLineNumber(text),
        rawError: this._extractErrorLine(text, /SyntaxError/i),
        explanation: "Parser encountered invalid syntax during bundling or compilation.",
        recommendation: "Surgically repair the syntax flaw (missing bracket, invalid token, unbalanced JSX)."
      };
    }

    // 5. Code Defect: Type Mismatch / ReferenceError
    if (/ReferenceError/i.test(text) || /TypeError/i.test(text) || /is not defined/i.test(text) || /cannot read propert/i.test(text)) {
      return {
        category: "CODE_DEFECT",
        type: "TYPE_OR_REFERENCE_ERROR",
        file: this._extractFilePath(text),
        line: this._extractLineNumber(text),
        rawError: this._extractErrorLine(text, /(?:ReferenceError|TypeError)/i),
        explanation: "Runtime or evaluation defect: symbol is referenced before declaration or property accessed on undefined.",
        recommendation: "Surgically declare the symbol or introduce a safe guardrail."
      };
    }

    // 6. Configuration Defect
    if (/tsconfig\.json/i.test(text) || /vite\.config/i.test(text) || /package\.json.*error/i.test(text) || /JSON\.parse/i.test(text)) {
      return {
        category: "CONFIGURATION_DEFECT",
        type: "CONFIG_PARSING_OR_SCHEMA_ERROR",
        file: this._extractFilePath(text),
        explanation: "Configuration file contains invalid JSON or schema violation.",
        recommendation: "Verify and format the target configuration file."
      };
    }

    // 7. Environment Defect
    if (/EADDRINUSE/i.test(text) || /EACCES/i.test(text) || /spawn .* ENOENT/i.test(text) || /ENOSPC/i.test(text)) {
      return {
        category: "ENVIRONMENT_DEFECT",
        type: "SYSTEM_ENVIRONMENT_CONFLICT",
        explanation: "Operating system or runtime resource collision (port occupied, permission denied, missing system binary).",
        recommendation: "Free the bound port or resolve permission constraint."
      };
    }

    // Fallback Unclassified
    return {
      category: "CODE_DEFECT",
      type: "UNCLASSIFIED_BUILD_OR_TEST_FAILURE",
      file: this._extractFilePath(text),
      rawError: text.slice(0, 300),
      explanation: "Build or test process exited with non-zero status.",
      recommendation: "Inspect full terminal logs to pinpoint exact failing assertion or stack trace."
    };
  }

  _extractFilePath(text) {
    const match = text.match(/(?:[a-zA-Z]:[\\\/]|\.\/|\/|[a-zA-Z0-9_\-]+\/)[a-zA-Z0-9_\-\\\/\.]+\.(?:js|jsx|ts|tsx|json|html|vue|svelte)/);
    return match ? match[0] : null;
  }

  _extractLineNumber(text) {
    const match = text.match(/:(\d+):(\d+)/) || text.match(/line\s+(\d+)/i);
    return match ? parseInt(match[1], 10) : null;
  }

  _extractErrorLine(text, regex) {
    const lines = text.split("\n");
    for (const line of lines) {
      if (regex.test(line)) return line.trim();
    }
    return lines[0]?.trim() || "";
  }
}

module.exports = {
  CommandIntelligence,
  commandIntelligence: new CommandIntelligence()
};
