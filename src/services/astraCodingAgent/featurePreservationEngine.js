/**
 * 🦅 GARUDA PAWAN ASTRA™ — FEATURE PRESERVATION ENGINE
 * 
 * Prevents Regression & Unintentional Destruction of Existing Functionality.
 * 
 * Historical Problem:
 * During iterative code alterations, autonomous agents frequently overwrite entire files,
 * accidentally erasing existing buttons, inputs, styles, routes, or helper functions.
 * 
 * Capabilities:
 * 1. Feature Inventory Extraction (DOM elements, IDs, form inputs, buttons, functions, exports, routes)
 * 2. AST & Structural Diff Analysis (Compares BEFORE and AFTER code)
 * 3. Regression Protection: Detects unexpected deletions of existing features
 * 4. Preservation Scoring & Threshold Enforcement: Rejects destructive patches
 * 5. Transactional Rollback Trigger
 */

const crypto = require("crypto");

class FeaturePreservationEngine {
  constructor(options = {}) {
    // Maximum allowed percentage of existing features deleted without explicit deletion intent (default: 0% for protected elements)
    this.strictPreservation = options.strictPreservation !== undefined ? options.strictPreservation : true;
  }

  /**
   * Extract comprehensive feature inventory from HTML or JavaScript/JSX
   */
  extractFeatureInventory(code, fileType = "html") {
    if (!code || typeof code !== "string") {
      return {
        domIds: [],
        interactiveElements: [],
        formInputs: [],
        functions: [],
        exports: [],
        routes: [],
        libraries: [],
        totalFeatureCount: 0
      };
    }

    const type = String(fileType).toLowerCase().replace(".", "");

    if (type === "html" || type === "htm" || code.includes("<html") || code.includes("<!DOCTYPE")) {
      return this._extractHtmlFeatures(code);
    } else {
      return this._extractJsFeatures(code);
    }
  }

  _extractHtmlFeatures(html) {
    const domIds = new Set();
    const interactiveElements = [];
    const formInputs = [];
    const functions = new Set();
    const libraries = new Set();

    // 1. Extract all element IDs: id="my-id" or id='my-id'
    const idRegex = /\bid=["']([a-zA-Z0-9_\-]+)["']/gi;
    let match;
    while ((match = idRegex.exec(html)) !== null) {
      domIds.add(match[1]);
    }

    // 2. Extract Buttons, Links, Actions
    const buttonRegex = /<button\b([^>]*)>([\s\S]*?)<\/button>/gi;
    while ((match = buttonRegex.exec(html)) !== null) {
      const attrs = match[1];
      const text = match[2].replace(/<[^>]+>/g, "").trim().slice(0, 30);
      const idMatch = attrs.match(/\bid=["']([^"']+)["']/i);
      interactiveElements.push({
        type: "button",
        id: idMatch ? idMatch[1] : null,
        label: text || "button"
      });
    }

    // 3. Extract Form Inputs & Fields
    const inputRegex = /<(?:input|textarea|select)\b([^>]*)>/gi;
    while ((match = inputRegex.exec(html)) !== null) {
      const attrs = match[1];
      const idMatch = attrs.match(/\bid=["']([^"']+)["']/i);
      const nameMatch = attrs.match(/\bname=["']([^"']+)["']/i);
      const typeMatch = attrs.match(/\btype=["']([^"']+)["']/i);
      formInputs.push({
        id: idMatch ? idMatch[1] : null,
        name: nameMatch ? nameMatch[1] : null,
        inputType: typeMatch ? typeMatch[1] : "text"
      });
    }

    // 4. Extract JS Functions inside inline <script> tags
    const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
    while ((match = scriptRegex.exec(html)) !== null) {
      const scriptBody = match[1];
      const fnRegex = /(?:function\s+([a-zA-Z0-9_$]+)|const\s+([a-zA-Z0-9_$]+)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>)/g;
      let fnMatch;
      while ((fnMatch = fnRegex.exec(scriptBody)) !== null) {
        functions.add(fnMatch[1] || fnMatch[2]);
      }
    }

    // 5. Extract External CDN Libraries & Scripts
    const libRegex = /<script\b[^>]*\bsrc=["']([^"']+)["']/gi;
    while ((match = libRegex.exec(html)) !== null) {
      libraries.add(match[1]);
    }

    return {
      domIds: Array.from(domIds),
      interactiveElements,
      formInputs,
      functions: Array.from(functions),
      exports: [],
      routes: [],
      libraries: Array.from(libraries),
      totalFeatureCount: domIds.size + interactiveElements.length + formInputs.length + functions.size
    };
  }

  _extractJsFeatures(code) {
    const functions = new Set();
    const exports = new Set();
    const routes = [];
    const domIds = new Set();

    // 1. Function and Component declarations
    const fnRegex = /(?:export\s+)?(?:async\s+)?function\s+([a-zA-Z0-9_$]+)/g;
    let match;
    while ((match = fnRegex.exec(code)) !== null) {
      functions.add(match[1]);
    }

    // Const arrow functions
    const arrowRegex = /(?:export\s+)?const\s+([a-zA-Z0-9_$]+)\s*=\s*(?:async\s*)?(?:\([^)]*\)|[a-zA-Z0-9_$]+)\s*=>/g;
    while ((match = arrowRegex.exec(code)) !== null) {
      functions.add(match[1]);
    }

    // 2. Named and default exports
    const exportRegex = /export\s+(?:default\s+)?(?:class|function|const|let|var)?\s*([a-zA-Z0-9_$]+)?/g;
    while ((match = exportRegex.exec(code)) !== null) {
      if (match[1]) exports.add(match[1]);
    }

    // module.exports
    const cjsExportRegex = /module\.exports\s*=\s*\{([^}]+)\}/g;
    while ((match = cjsExportRegex.exec(code)) !== null) {
      const items = match[1].split(",").map(i => i.trim().split(":")[0].trim());
      items.forEach(it => { if (it) exports.add(it); });
    }

    // 3. Express Route definitions
    const routeRegex = /(?:app|router)\.(get|post|put|delete|patch)\s*\(\s*["']([^"']+)["']/g;
    while ((match = routeRegex.exec(code)) !== null) {
      routes.push({ method: match[1].toUpperCase(), path: match[2] });
    }

    // 4. Queried DOM IDs in JS
    const domQueryRegex = /(?:getElementById|querySelector)\s*\(\s*["']#?([a-zA-Z0-9_\-]+)["']/g;
    while ((match = domQueryRegex.exec(code)) !== null) {
      domIds.add(match[1]);
    }

    return {
      domIds: Array.from(domIds),
      interactiveElements: [],
      formInputs: [],
      functions: Array.from(functions),
      exports: Array.from(exports),
      routes,
      libraries: [],
      totalFeatureCount: functions.size + exports.size + routes.length
    };
  }

  /**
   * Compare BEFORE and AFTER feature inventories and verify that existing features are preserved
   */
  evaluatePreservation(beforeCode, afterCode, options = {}) {
    const fileType = options.fileType || "html";
    const userIntent = (options.userIntent || "").toLowerCase();

    const beforeInv = this.extractFeatureInventory(beforeCode, fileType);
    const afterInv = this.extractFeatureInventory(afterCode, fileType);

    const deletedIds = beforeInv.domIds.filter(id => !afterInv.domIds.includes(id));
    const deletedFunctions = beforeInv.functions.filter(fn => !afterInv.functions.includes(fn));
    const deletedExports = beforeInv.exports.filter(exp => !afterInv.exports.includes(exp));

    // Form inputs check: missing input IDs or names
    const beforeInputKeys = new Set(beforeInv.formInputs.map(i => i.id || i.name).filter(Boolean));
    const afterInputKeys = new Set(afterInv.formInputs.map(i => i.id || i.name).filter(Boolean));
    const deletedInputs = Array.from(beforeInputKeys).filter(k => !afterInputKeys.has(k));

    // Interactive button check
    const beforeButtons = new Set(beforeInv.interactiveElements.map(b => b.id || b.label).filter(Boolean));
    const afterButtons = new Set(afterInv.interactiveElements.map(b => b.id || b.label).filter(Boolean));
    const deletedButtons = Array.from(beforeButtons).filter(b => !afterButtons.has(b));

    // Check if user explicitly requested removal
    const intentMentionsRemoval =
      userIntent.includes("remove") ||
      userIntent.includes("delete") ||
      userIntent.includes("hatao") ||
      userIntent.includes("replace completely") ||
      userIntent.includes("start from scratch");

    const unexpectedDeletions = {
      domIds: deletedIds,
      functions: deletedFunctions,
      exports: deletedExports,
      formInputs: deletedInputs,
      buttons: deletedButtons
    };

    const totalDeletions =
      deletedIds.length +
      deletedFunctions.length +
      deletedExports.length +
      deletedInputs.length +
      deletedButtons.length;

    // Calculate preservation score (1.0 = 100% preserved)
    const baselineCount = Math.max(1, beforeInv.totalFeatureCount);
    const preservedCount = Math.max(0, baselineCount - totalDeletions);
    const preservationRatio = Math.round((preservedCount / baselineCount) * 100);

    // Violation rules:
    // If user did NOT request removal and critical features (IDs, Inputs, Functions, Buttons) disappeared
    let isPreserved = true;
    const violations = [];

    if (!intentMentionsRemoval) {
      if (deletedInputs.length > 0) {
        isPreserved = false;
        violations.push(`Unexpected deletion of critical form inputs: ${deletedInputs.join(", ")}`);
      }
      if (deletedButtons.length > 0 && beforeInv.interactiveElements.length > 1) {
        // If more than 50% of buttons disappeared
        if (deletedButtons.length >= Math.ceil(beforeInv.interactiveElements.length * 0.5)) {
          isPreserved = false;
          violations.push(`Unexpected mass deletion of interactive buttons: ${deletedButtons.join(", ")}`);
        }
      }
      if (deletedExports.length > 0) {
        isPreserved = false;
        violations.push(`Unexpected deletion of module exports: ${deletedExports.join(", ")}`);
      }
      if (deletedFunctions.length > 0 && beforeInv.functions.length >= 2) {
        // More than 30% of existing functions erased
        if (deletedFunctions.length > Math.ceil(beforeInv.functions.length * 0.3)) {
          isPreserved = false;
          violations.push(`Unexpected deletion of core functions: ${deletedFunctions.join(", ")}`);
        }
      }
      if (deletedIds.length > 2 && beforeInv.domIds.length >= 4) {
        if (deletedIds.length >= Math.ceil(beforeInv.domIds.length * 0.4)) {
          isPreserved = false;
          violations.push(`Unexpected deletion of structural element IDs: ${deletedIds.join(", ")}`);
        }
      }
    }

    return {
      passed: isPreserved,
      preservationRatio,
      baselineFeatureCount: beforeInv.totalFeatureCount,
      retainedFeatureCount: afterInv.totalFeatureCount,
      unexpectedDeletions,
      totalDeletions,
      violations,
      status: isPreserved ? "FEATURE_PRESERVATION_VERIFIED" : "PRESERVATION_VIOLATION_DETECTED"
    };
  }
}

const featurePreservationEngine = new FeaturePreservationEngine();

module.exports = {
  FeaturePreservationEngine,
  featurePreservationEngine
};
