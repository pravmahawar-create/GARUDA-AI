/**
 * 🦅 GARUDA BRIDGE — ADVERSARIAL AGENT COUNCIL (MISSION B005 - SEQUENCE 2)
 * 
 * Capabilities:
 * 1. Multi-Agent Autonomous Council:
 *    - Agent 1 (System Architect): Proposes technical/operational approach.
 *    - Agent 2 (Hostile Critic): Aggressively challenges proposal for vulnerabilities, race conditions, cost, and assumptions.
 *    - Agent 3 (Lead Adjudicator): Resolves disputes, enforces Anti-Fabrication Law, and synthesizes final governed execution plan.
 * 2. Zero Mandatory OpenAI API:
 *    - Uses sovereignAiCascadeService (Gemini, Groq, Cerebras, NVIDIA) + localModelService (Ollama) + deterministic sovereign fallback.
 * 3. Transparent Attribution & Telemetry:
 *    - Per-agent tracking: provider, model, latencyMs, tokens, fallbackTriggered, errors.
 * 4. Governance & Sovereign Approval Gate:
 *    - Detects protected operations (git commit, git push, deploy, production delete);
 *    - Sets status to BLOCKED_APPROVAL and tags WAITING_FOUNDER_APPROVAL.
 * 5. Full schema validation conforming to task.schema.json.
 * 
 * Operating Doctrine: 100% Anti-Fabrication Law ("Show > Tell")
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const schemaValidator = require('./schemaValidator');
const sovereignAiCascade = require('../../src/services/sovereignAiCascadeService');
const localModelService = require('../../src/services/localModelService');

const VALID_TASK_TYPES = new Set([
  'file_read',
  'file_modify',
  'file_create',
  'file_delete',
  'command_exec',
  'analysis',
  'test_verification'
]);

function normalizeTaskType(rawType, isProtected = false) {
  if (isProtected) return 'command_exec';
  if (typeof rawType === 'string') {
    const lower = rawType.toLowerCase().trim();
    if (VALID_TASK_TYPES.has(lower)) return lower;
    if (lower.includes('read') || lower.includes('inspect')) return 'file_read';
    if (lower.includes('create') || lower.includes('write')) return 'file_create';
    if (lower.includes('delete') || lower.includes('remove')) return 'file_delete';
    if (lower.includes('test') || lower.includes('verify')) return 'test_verification';
    if (lower.includes('command') || lower.includes('exec') || lower.includes('git') || lower.includes('deploy')) return 'command_exec';
    if (lower.includes('analysis') || lower.includes('audit') || lower.includes('security')) return 'analysis';
    if (lower.includes('modify') || lower.includes('update') || lower.includes('fix')) return 'file_modify';
  }
  return 'file_modify';
}

class AdversarialCouncilEngine {
  constructor(options = {}) {
    this.options = options;
    this.telemetryRecords = [];
  }

  /**
   * Safe JSON parser that extracts JSON blocks from model responses
   */
  extractJson(text) {
    if (!text || typeof text !== 'string') return null;
    
    // 1. Try direct JSON parse
    try {
      return JSON.parse(text.trim());
    } catch (_) {}

    // 2. Try fenced markdown ```json ... ```
    const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (match && match[1]) {
      try {
        return JSON.parse(match[1].trim());
      } catch (_) {}
    }

    // 3. Try finding first { and last }
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      try {
        return JSON.parse(text.substring(firstBrace, lastBrace + 1));
      } catch (_) {}
    }

    return null;
  }

  /**
   * Invokes an LLM with cascade failover, recording detailed telemetry
   */
  async invokeAgent({ role, systemPrompt, userPrompt, preferredModel, mockResponse = null }) {
    const startTime = Date.now();
    const telemetry = {
      agentRole: role,
      preferredModel: preferredModel || 'auto',
      provider: 'unknown',
      model: 'unknown',
      latencyMs: 0,
      tokens: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
      fallbackTriggered: false,
      error: null
    };

    // If mock provided (for testing / simulation)
    if (mockResponse) {
      telemetry.provider = mockResponse.provider || 'mock-provider';
      telemetry.model = mockResponse.model || preferredModel || 'mock-model';
      telemetry.latencyMs = mockResponse.latencyMs || (Date.now() - startTime);
      telemetry.tokens = mockResponse.tokens || { promptTokens: 120, completionTokens: 250, totalTokens: 370 };
      this.telemetryRecords.push(telemetry);
      return { text: mockResponse.text, telemetry, parsed: this.extractJson(mockResponse.text) };
    }

    // Tier 1: Try Sovereign AI Cascade (Gemini, Groq, Cerebras, NVIDIA)
    try {
      const cascadeResult = await sovereignAiCascade.generateCompletion({
        systemPrompt,
        prompt: userPrompt,
        temperature: role === 'critic' ? 0.4 : 0.2,
        maxTokens: 1200,
        maxDurationMs: 8000
      });

      if (cascadeResult && cascadeResult.success && cascadeResult.text) {
        telemetry.provider = cascadeResult.provider;
        telemetry.model = cascadeResult.model || preferredModel;
        telemetry.latencyMs = cascadeResult.latencyMs || (Date.now() - startTime);
        telemetry.tokens = cascadeResult.tokens || { promptTokens: 'auto', completionTokens: 'auto', totalTokens: 'auto' };
        telemetry.fallbackTriggered = (cascadeResult.cascadeAttempts && cascadeResult.cascadeAttempts.length > 0) || false;
        
        this.telemetryRecords.push(telemetry);
        return {
          text: cascadeResult.text,
          telemetry,
          parsed: this.extractJson(cascadeResult.text)
        };
      }
    } catch (cascadeErr) {
      telemetry.error = `Cascade failed: ${cascadeErr.message}`;
      telemetry.fallbackTriggered = true;
    }

    // Tier 2: Try Local Ollama Model
    try {
      const isOllamaUp = await localModelService.isAvailable(1000);
      if (isOllamaUp) {
        const localModel = role === 'architect' ? 'qwen2.5-coder:3b' : 'phi3:mini';
        const localResult = await localModelService.generateCompletion({
          model: localModel,
          prompt: `${systemPrompt}\n\nTask:\n${userPrompt}`,
          options: { temperature: 0.2 }
        });

        if (localResult && localResult.text) {
          telemetry.provider = 'ollama-local';
          telemetry.model = localModel;
          telemetry.latencyMs = Date.now() - startTime;
          telemetry.tokens = { promptTokens: 'local', completionTokens: localResult.evalCount || 'local', totalTokens: 'local' };
          telemetry.fallbackTriggered = true;

          this.telemetryRecords.push(telemetry);
          return {
            text: localResult.text,
            telemetry,
            parsed: this.extractJson(localResult.text)
          };
        }
      }
    } catch (ollamaErr) {
      telemetry.error = `${telemetry.error ? telemetry.error + '; ' : ''}Ollama failed: ${ollamaErr.message}`;
      telemetry.fallbackTriggered = true;
    }

    // Tier 3: Deterministic Sovereign Fallback
    telemetry.provider = 'deterministic_sovereign_fallback';
    telemetry.model = 'garuda-sovereign-engine-v1';
    telemetry.latencyMs = Date.now() - startTime;
    telemetry.tokens = { promptTokens: 50, completionTokens: 150, totalTokens: 200 };
    telemetry.fallbackTriggered = true;

    const deterministicText = this.generateDeterministicAgentResponse(role, userPrompt);
    this.telemetryRecords.push(telemetry);

    return {
      text: deterministicText,
      telemetry,
      parsed: this.extractJson(deterministicText)
    };
  }

  /**
   * Deterministic sovereign agent response generator (guarantees zero crash air-gapped fallback)
   */
  generateDeterministicAgentResponse(role, userPrompt) {
    const isProtected = /(git\s+commit|git\s+push|deploy|production|drop\s+table)/i.test(userPrompt);
    const fileMatches = userPrompt.match(/(?:[a-zA-Z0-9_\-\.\/]+\.(?:js|json|md|html|css|ts|jsx|tsx|py|gradle))/g) || [];
    const targetFile = fileMatches.length > 0 ? fileMatches[0] : 'scripts/bridge/mobileTaskIntake.js';

    if (role === 'architect') {
      return JSON.stringify({
        role: 'system_architect',
        approach: `Autonomous engineering resolution for: ${userPrompt.slice(0, 100)}`,
        targetFiles: [targetFile],
        taskType: isProtected ? 'command_exec' : 'file_modify',
        proposedChanges: `Implement deterministic verification and safeguard routines inside ${targetFile}.`,
        verificationCommand: isProtected ? 'git status' : `node -c ${targetFile}`,
        riskLevel: isProtected ? 'CRITICAL' : 'MEDIUM',
        isProtectedAction: isProtected,
        requiresFounderApproval: isProtected
      }, null, 2);
    }

    if (role === 'critic') {
      return JSON.stringify({
        role: 'hostile_critic',
        vulnerabilitiesIdentified: [
          `Potential regression if target file ${targetFile} syntax check fails in production environment.`,
          isProtected ? 'CRITICAL GOVERNANCE VIOLATION: Operation attempts protected git/deploy action without explicit Founder authorization.' : 'Missing automated regression test coverage for edge case null inputs.',
          'Possible race condition during simultaneous file writes if locking mechanism is absent.'
        ],
        unsupportedAssumptions: [
          'Assumes node runtime is available and environment variables are populated.',
          'Assumes current branch has clean working directory.'
        ],
        requiredFixes: [
          'Enforce strict pre-flight syntax check (node -c) before staging.',
          'Hold task in BLOCKED_APPROVAL state if git commit or push is requested.',
          'Ensure atomic write via temporary file rename.'
        ]
      }, null, 2);
    }

    // Adjudicator
    return JSON.stringify({
      role: 'lead_adjudicator',
      resolvedVerdict: 'APPROVED_WITH_SAFEGUARDS',
      resolutionSummary: 'Architect proposal adopted with Critic required safeguards (atomic write, syntax verification, and Founder approval gate).',
      finalPlan: {
        taskType: isProtected ? 'command_exec' : 'file_modify',
        title: isProtected ? 'Protected Git Operation' : `Engineered Update to ${path.basename(targetFile)}`,
        description: `Adjudicated execution plan for: ${userPrompt.slice(0, 150)}`,
        targetFiles: [targetFile],
        verificationCommand: isProtected ? 'git status' : `node -c ${targetFile}`,
        governance: {
          isProtectedAction: isProtected,
          requiresFounderApproval: isProtected,
          riskLevel: isProtected ? 'CRITICAL' : 'LOW',
          isolationMode: isProtected ? 'worktree' : 'inherit'
        }
      }
    }, null, 2);
  }

  /**
   * Full Council Deliberation Pipeline
   */
  async deliberate({ task, userPrompt, founderContext = '', mockResponses = null }) {
    const promptText = userPrompt || (task ? `${task.title}: ${task.description}` : 'Bridge engineering task');
    
    // 1. Run Agent 1: System Architect
    const architectSysPrompt = 
      "You are the System Architect of GARUDA OS. You propose high-velocity, rigorous technical and operational blueprints.\n" +
      "Analyze the requested task. Detail target files, modifications, risk assessment, and verification command.\n" +
      "Output strictly valid JSON with keys: role, approach, targetFiles, taskType, proposedChanges, verificationCommand, riskLevel, isProtectedAction, requiresFounderApproval.";

    const architectResult = await this.invokeAgent({
      role: 'architect',
      systemPrompt: architectSysPrompt,
      userPrompt: `Task:\n${promptText}\n\nFounder Context:\n${founderContext}`,
      preferredModel: 'gemini-2.5-flash',
      mockResponse: mockResponses ? mockResponses.architect : null
    });

    const architectProposal = architectResult.parsed || JSON.parse(this.generateDeterministicAgentResponse('architect', promptText));

    // 2. Run Agent 2: Hostile Critic
    const criticSysPrompt =
      "You are the Hostile Critic of GARUDA OS. Your sole job is to aggressively challenge the System Architect's proposal.\n" +
      "Identify security flaws, race conditions, edge-case failure modes, missing dependencies, unsupported assumptions, and governance violations.\n" +
      "Output strictly valid JSON with keys: role, vulnerabilitiesIdentified (array), unsupportedAssumptions (array), requiredFixes (array).";

    const criticResult = await this.invokeAgent({
      role: 'critic',
      systemPrompt: criticSysPrompt,
      userPrompt: `Architect Proposal:\n${JSON.stringify(architectProposal, null, 2)}\n\nOriginal Task:\n${promptText}`,
      preferredModel: 'deepseek-r1-distill-llama-70b',
      mockResponse: mockResponses ? mockResponses.critic : null
    });

    const criticChallenges = criticResult.parsed || JSON.parse(this.generateDeterministicAgentResponse('critic', promptText));

    // 3. Run Agent 3: Lead Adjudicator
    const adjudicatorSysPrompt =
      "You are the Lead Adjudicator of GARUDA OS. You evaluate the Architect's proposal against the Hostile Critic's challenges.\n" +
      "Enforce Founder Praveen's Anti-Fabrication Law and Governance rules. Discard invalid nitpicks, resolve valid disputes, and synthesize the final executable plan.\n" +
      "Output strictly valid JSON with keys: role, resolvedVerdict, resolutionSummary, finalPlan (object with taskType, title, description, targetFiles, verificationCommand, governance).";

    const adjudicatorResult = await this.invokeAgent({
      role: 'adjudicator',
      systemPrompt: adjudicatorSysPrompt,
      userPrompt: `Architect Proposal:\n${JSON.stringify(architectProposal, null, 2)}\n\nCritic Challenges:\n${JSON.stringify(criticChallenges, null, 2)}\n\nOriginal Task:\n${promptText}`,
      preferredModel: 'phi3:mini',
      mockResponse: mockResponses ? mockResponses.adjudicator : null
    });

    const adjudicatorResolution = adjudicatorResult.parsed || JSON.parse(this.generateDeterministicAgentResponse('adjudicator', promptText));

    // 4. Governance Gate Check
    const plan = (adjudicatorResolution && adjudicatorResolution.finalPlan) ? adjudicatorResolution.finalPlan : architectProposal;
    const isProtected = Boolean(
      plan.governance?.isProtectedAction ||
      plan.isProtectedAction ||
      /(git\s+commit|git\s+push|deploy|production|drop\s+table)/i.test(promptText) ||
      (criticChallenges.vulnerabilitiesIdentified && criticChallenges.vulnerabilitiesIdentified.some(v => v.includes('GOVERNANCE VIOLATION') || v.includes('git')))
    );

    const now = Date.now();
    const taskId = task?.taskId || `TASK_${now}_${crypto.randomBytes(4).toString('hex')}`;
    const correlationId = task?.correlationId || `CORR_${now}_${crypto.randomBytes(4).toString('hex')}`;
    const missionId = task?.missionId || 'B005';
    const sequenceNumber = (task?.sequenceNumber || 1) + 1;

    const taskStatus = isProtected ? 'BLOCKED_APPROVAL' : 'CREATED';

    if (isProtected) {
      console.warn(`[GARUDA-COUNCIL-GOVERNANCE] Protected operation detected in council plan. Halted at WAITING_FOUNDER_APPROVAL.`);
    }

    const finalizedTask = {
      taskId,
      correlationId,
      missionId,
      sequenceNumber,
      taskType: normalizeTaskType(plan.taskType, isProtected),
      title: plan.title || (isProtected ? 'Protected Operation Approval Gate' : 'Adjudicated Operational Plan'),
      description: plan.description || promptText,
      targetFiles: Array.isArray(plan.targetFiles) ? plan.targetFiles : [],
      verificationCommand: plan.verificationCommand || (isProtected ? 'git status' : null),
      governance: {
        isProtectedAction: isProtected,
        requiresFounderApproval: isProtected,
        riskLevel: isProtected ? 'CRITICAL' : (plan.governance?.riskLevel || 'LOW'),
        isolationMode: isProtected ? 'worktree' : 'inherit'
      },
      context: {
        councilDeliberation: {
          architectModel: architectResult.telemetry.model,
          criticModel: criticResult.telemetry.model,
          adjudicatorModel: adjudicatorResult.telemetry.model,
          criticVulnerabilitiesCount: criticChallenges.vulnerabilitiesIdentified?.length || 0,
          resolutionVerdict: adjudicatorResolution.resolvedVerdict || 'APPROVED'
        },
        waitingFounderApproval: isProtected
      },
      status: taskStatus,
      createdAt: new Date(now).toISOString()
    };

    // Schema validation
    const validation = schemaValidator.validateTask(finalizedTask);
    if (!validation.valid) {
      throw new Error(`Adjudicated task failed schema validation: ${validation.errors.join('; ')}`);
    }

    return {
      success: true,
      taskId,
      correlationId,
      finalizedTask,
      isProtected,
      governanceGate: isProtected ? 'WAITING_FOUNDER_APPROVAL' : 'AUTO_AUTHORIZED',
      council: {
        architect: {
          proposal: architectProposal,
          telemetry: architectResult.telemetry
        },
        critic: {
          challenges: criticChallenges,
          telemetry: criticResult.telemetry
        },
        adjudicator: {
          resolution: adjudicatorResolution,
          telemetry: adjudicatorResult.telemetry
        }
      },
      telemetry: {
        totalAgents: 3,
        totalDurationMs: architectResult.telemetry.latencyMs + criticResult.telemetry.latencyMs + adjudicatorResult.telemetry.latencyMs,
        records: [architectResult.telemetry, criticResult.telemetry, adjudicatorResult.telemetry]
      }
    };
  }

  /**
   * Retrieves aggregated telemetry history
   */
  getTelemetryHistory() {
    return this.telemetryRecords;
  }
}

module.exports = AdversarialCouncilEngine;
