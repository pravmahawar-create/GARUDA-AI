class CostOptimizer {
  classify(input = {}) {
    const complexity = Number(input.complexity || 0);
    const fileCount = Number(input.fileCount || 0);
    const risk = String(input.risk || "low").toLowerCase();
    const duplicateDetected = Boolean(input.duplicateDetected);
    const localCapabilities = Boolean(input.localCapabilities !== false);
    const creditsAvailable = Number.isFinite(input.creditsAvailable) ? Number(input.creditsAvailable) : 0;
    const requiresExternal = Boolean(input.requiresExternal);
    const paidRequested = Boolean(input.paidRequested);

    if (paidRequested) {
      return {
        classification: "paid_blocked",
        reason: "Paid API usage is blocked by GARUDA policy.",
        externalAllowed: false,
        useCompactContext: true,
        reuseMemoryFirst: true
      };
    }

    if (duplicateDetected) {
      return {
        classification: "zero_external_cost",
        reason: "Similar validated memory record exists. Reuse previous results.",
        externalAllowed: false,
        useCompactContext: true,
        reuseMemoryFirst: true
      };
    }

    if (localCapabilities && complexity <= 2 && fileCount <= 2 && risk !== "high") {
      return {
        classification: "local_preferred",
        reason: "Deterministic or local execution is sufficient for this scope.",
        externalAllowed: false,
        useCompactContext: true,
        reuseMemoryFirst: true
      };
    }

    if (requiresExternal && creditsAvailable <= 0) {
      return {
        classification: "credit_sensitive",
        reason: "External worker may help but available credits are limited.",
        externalAllowed: false,
        useCompactContext: true,
        reuseMemoryFirst: true
      };
    }

    if (requiresExternal) {
      return {
        classification: "free_external_allowed",
        reason: "Task complexity may require external help if free integration exists.",
        externalAllowed: true,
        useCompactContext: true,
        reuseMemoryFirst: true
      };
    }

    return {
      classification: "zero_external_cost",
      reason: "No external worker requirement detected.",
      externalAllowed: false,
      useCompactContext: true,
      reuseMemoryFirst: true
    };
  }
}

module.exports = CostOptimizer;
module.exports.CostOptimizer = CostOptimizer;
