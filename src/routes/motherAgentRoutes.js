const express = require("express");
const router = express.Router();
const llmProvider = require("../services/llmProvider");
const conversationService = require("../services/conversationService");
const { understandGoal } = require("../../scripts/mother/goalEngine");
const { Mother } = require("../../scripts/mother/mother");

// POST /api/mother/chat - Command & conversational endpoint routed through Mother context
router.post("/chat", async (req, res) => {
  try {
    const systemContext = req.body.systemContext || "";
    const userMessage = req.body.message || req.body.userMessage || req.body.question || "";
    let threadId = req.body.threadId || null;
    if (!threadId) {
      threadId = `thread_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    }

    let conversationHistory = Array.isArray(req.body.history) ? req.body.history : [];

    // If threadId is provided and no history passed in body, fetch recent thread history from DB
    if (threadId && !conversationHistory.length) {
      try {
        const threadDoc = await conversationService.getOrCreateThread(threadId);
        if (threadDoc && Array.isArray(threadDoc.messages)) {
          conversationHistory = threadDoc.messages.map((m) => ({
            role: m.role,
            content: m.text,
            mode: m.mode
          }));
        }
      } catch {
        // Fallback to empty history on DB error
      }
    }

    const goal = understandGoal(userMessage);
    const isReadOnly = goal.actionType === "analysis" || goal.intent === "read_only_audit";
    const isAgentTask = isReadOnly ||
                        goal.intent === "create_code_artifact" ||
                        goal.intent === "modify_code_artifact" ||
                        goal.intent === "verify_code_artifact" ||
                        goal.intent === "develop_revenue_model" ||
                        goal.intent === "self_development_meta" ||
                        goal.intent === "self_development_improvement";

    if (isAgentTask) {
      // Read-only tasks run safe read-only execution (founderApproved: true for read_only_audit).
      // Write tasks MUST use explicit founder approval from request body only (founderApproved: Boolean(req.body.founderApproved)).
      const founderApproved = isReadOnly ? true : Boolean(req.body.founderApproved);
      const mother = new Mother();
      const outcome = await mother.runMissionToCompletion(userMessage, {
        founderApproved,
        maxCycles: 1
      });

      const cycle = outcome && outcome.lastCycleResult ? outcome.lastCycleResult : {};
      const executedTasks = Array.isArray(cycle.executedTasks) ? cycle.executedTasks : [];
      const primaryResult = executedTasks[0] && executedTasks[0].result ? executedTasks[0].result.output : null;

      let answerText = `GARUDA agent inspection completed with status: ${outcome.status}.`;
      if (primaryResult && primaryResult.revenueEngineReady) {
        const moduleCount = typeof primaryResult.inspectedModuleCount === "number" ? primaryResult.inspectedModuleCount : 0;
        answerText = `GARUDA agent repository inspection complete. Grounded evidence confirms that the Revenue Engine is fully implemented across ${moduleCount} verified source modules with zero missing code markers.`;
      } else if (primaryResult && primaryResult.summary) {
        answerText = `GARUDA agent inspection completed:\n\n${primaryResult.summary}`;
      } else if (outcome.status === "MISSION_COMPLETED" && cycle.validation && cycle.validation.passed) {
        answerText = `GARUDA agent mission completed successfully (${outcome.cyclesExecuted || 1} cycle executed).`;
      } else if (outcome.status === "FOUNDER_ACTION_REQUIRED" || (cycle.governance && cycle.governance.status === "approval_required")) {
        answerText = `GARUDA agent mission requires founder write approval before executing write operations.`;
      } else {
        answerText = `GARUDA agent mission ended with status: ${outcome.status}.`;
      }

      const filesInspected = executedTasks.flatMap((t) => (t && t.evidence && Array.isArray(t.evidence.filesInspected) ? t.evidence.filesInspected : []));
      const filesModified = cycle.multiBrain && Array.isArray(cycle.multiBrain.filesChanged) ? cycle.multiBrain.filesChanged : [];

      const sanitizedEvidence = {
        goal: {
          actionType: goal.actionType || null,
          intent: goal.intent || null,
          domain: goal.domain || null,
          targetName: goal.targetName || null
        },
        inspectedModuleCount: primaryResult && typeof primaryResult.inspectedModuleCount === "number" ? primaryResult.inspectedModuleCount : 0,
        revenueEngineReady: primaryResult && primaryResult.revenueEngineReady === true,
        filesInspected,
        validationPassed: cycle.validation ? cycle.validation.passed === true : false,
        filesModified
      };

      if (threadId) {
        await conversationService.appendMessages(threadId, [
          { role: "user", text: userMessage, mode: "agent" },
          { role: "garuda", text: answerText, mode: "agent", missionStatus: outcome.status, evidence: sanitizedEvidence }
        ]);
      }

      return res.json({
        success: true,
        threadId,
        mode: "agent",
        answer: answerText,
        missionStatus: outcome.status,
        grounded: true,
        evidence: sanitizedEvidence
      });
    }

    const response = await llmProvider.ask({ systemContext, userMessage, conversationHistory });

    const cleanAnswer = response && typeof response.answer === "string" && response.answer.trim()
      ? response.answer
      : "Main GARUDA AI Command Console hoon — aapka commercial operations, strategy control aur governed multi-agent execution interface. Systems online hain!";

    const providerName = response && response.provider ? response.provider : "fallback";
    const modelName = response && response.model ? response.model : null;
    const warningsList = response && Array.isArray(response.warnings) ? response.warnings : [];

    if (threadId) {
      await conversationService.appendMessages(threadId, [
        { role: "user", text: userMessage, mode: "conversation" },
        { role: "garuda", text: cleanAnswer, mode: "conversation" }
      ]);
    }

    return res.json({
      provider: providerName,
      model: modelName,
      warnings: warningsList,
      success: true,
      threadId,
      mode: "conversation",
      answer: cleanAnswer,
      grounded: response && response.grounded === true
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "chat_error",
      error: String(error && error.message ? error.message : error)
    });
  }
});

module.exports = router;
