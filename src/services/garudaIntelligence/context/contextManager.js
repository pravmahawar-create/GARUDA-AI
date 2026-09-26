const MAX_CONTEXT_SIZE = 50000;

class ContextManager {
  constructor() {
    this.activeContexts = new Map();
  }

  createContext(missionId, initialData = {}) {
    const context = {
      missionId,
      currentGoal: initialData.goal || '',
      currentPlan: initialData.plan || null,
      currentFacts: initialData.facts || [],
      decisions: initialData.decisions || [],
      constraints: initialData.constraints || [],
      evidence: initialData.evidence || [],
      failures: initialData.failures || [],
      nextAction: initialData.nextAction || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      size: 0
    };
    context.size = this._estimateSize(context);
    this.activeContexts.set(missionId, context);
    return context;
  }

  getContext(missionId) {
    return this.activeContexts.get(missionId) || null;
  }

  updateContext(missionId, updates) {
    const context = this.activeContexts.get(missionId);
    if (!context) return { error: `Context for mission ${missionId} not found` };
    for (const [key, value] of Object.entries(updates)) {
      if (key === 'currentFacts' || key === 'decisions' || key === 'evidence' || key === 'failures') {
        if (Array.isArray(value)) {
          context[key] = [...context[key], ...value];
        }
      } else {
        context[key] = value;
      }
    }
    context.updatedAt = new Date().toISOString();
    context.size = this._estimateSize(context);
    if (context.size > MAX_CONTEXT_SIZE) {
      this.compactContext(context);
    }
    if (context.currentFacts.length > 20 || context.decisions.length > 20 ||
        context.evidence.length > 30 || context.failures.length > 10) {
      this.compactContext(context);
    }
    return { success: true, context };
  }

  addFact(missionId, fact) {
    return this.updateContext(missionId, { currentFacts: [fact] });
  }

  addDecision(missionId, decision) {
    return this.updateContext(missionId, { decisions: [{ ...decision, timestamp: new Date().toISOString() }] });
  }

  addEvidence(missionId, evidence) {
    return this.updateContext(missionId, { evidence: [{ ...evidence, timestamp: new Date().toISOString() }] });
  }

  addFailure(missionId, failure) {
    return this.updateContext(missionId, { failures: [{ ...failure, timestamp: new Date().toISOString() }] });
  }

  setNextAction(missionId, action) {
    return this.updateContext(missionId, { nextAction: action });
  }

  compactContext(context) {
    if (context.currentFacts.length > 20) {
      context.currentFacts = context.currentFacts.slice(-20);
    }
    if (context.evidence.length > 30) {
      context.evidence = context.evidence.slice(-30);
    }
    if (context.failures.length > 10) {
      context.failures = context.failures.slice(-10);
    }
    if (context.decisions.length > 20) {
      context.decisions = context.decisions.slice(-20);
    }
    if (context.currentPlan && typeof context.currentPlan === 'object') {
      const planStr = JSON.stringify(context.currentPlan);
      if (planStr.length > 5000) {
        context.currentPlan = { summary: 'Plan truncated due to context size', taskCount: (context.currentPlan.tasks || []).length };
      }
    }
    context.size = this._estimateSize(context);
    return context;
  }

  _estimateSize(obj) {
    try { return JSON.stringify(obj).length; }
    catch { return 0; }
  }

  getCompactView(missionId) {
    const context = this.activeContexts.get(missionId);
    if (!context) return null;
    return {
      goal: context.currentGoal,
      stage: context.currentPlan ? context.currentPlan.stage : 'unknown',
      factsCount: context.currentFacts.length,
      decisionsCount: context.decisions.length,
      evidenceCount: context.evidence.length,
      failuresCount: context.failures.length,
      nextAction: context.nextAction,
      size: context.size
    };
  }

  exportContext(missionId) {
    const context = this.activeContexts.get(missionId);
    if (!context) return null;
    return JSON.parse(JSON.stringify(context));
  }

  clearContext(missionId) {
    this.activeContexts.delete(missionId);
    return { success: true };
  }

  getStats() {
    return {
      activeContexts: this.activeContexts.size,
      contextSizes: Array.from(this.activeContexts.entries()).map(([id, ctx]) => ({
        missionId: id,
        size: ctx.size
      }))
    };
  }
}

module.exports = { ContextManager, MAX_CONTEXT_SIZE };
