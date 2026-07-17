class CostGuard {
  classify(input = {}) {
    const complexity = Number(input.complexity || 1);
    const fileCount = Number(input.fileCount || 0);
    const risk = String(input.risk || "low").toLowerCase();
    const duplicateDetected = Boolean(input.duplicateDetected);
    const localCapabilities = Boolean(input.localCapabilities);
    const requiresExternal = Boolean(input.requiresExternal);
    const paidRequested = Boolean(input.paidRequested);
    const creditsAvailable = Number(input.creditsAvailable || 0);

    if (paidRequested) {
      return {
        allowed: false,
        classification: "paid_execution_blocked",
        estimatedCost: "blocked",
        estimatedCostLevel: "blocked",
        reason: "Paid API execution is not allowed by GARUDA cost policy.",
        paidApiAllowed: false,
        useExternalWorker: false,
        requiresFounderApproval: true
      };
    }

    if (!requiresExternal || localCapabilities) {
      return {
        allowed: true,
        classification: "zero_external_cost",
        estimatedCost: "zero_external_cost",
        estimatedCostLevel: "zero_external_cost",
        reason: duplicateDetected
          ? "A similar goal exists and local capabilities are sufficient."
          : "Task can be handled locally without external API cost.",
        paidApiAllowed: false,
        useExternalWorker: false,
        requiresFounderApproval: false
      };
    }

    if (creditsAvailable > 0) {
      return {
        allowed: true,
        classification: "free_external_execution",
        estimatedCost: "free_credit_only",
        estimatedCostLevel: "free_credit_only",
        reason: "External execution is allowed only through configured free credits.",
        paidApiAllowed: false,
        useExternalWorker: true,
        requiresFounderApproval: risk === "high" || complexity >= 4 || fileCount > 3
      };
    }

    return {
      allowed: true,
      classification: "external_execution_unavailable",
      estimatedCost: "zero_external_cost",
      estimatedCostLevel: "zero_external_cost",
      reason: "External worker may be useful, but no free execution credit is enabled. Falling back safely.",
      paidApiAllowed: false,
      useExternalWorker: false,
      requiresFounderApproval: risk === "high" || complexity >= 4 || fileCount > 3
    };
  }

  evaluate(input = {}) {
    return this.classify(input);
  }
}

module.exports = { CostGuard };