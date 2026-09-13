/**
 * GARUDA Reasoning Engine
 *
 * Phase 5: Soch ke decision leta hai.
 *
 * Chain of Thought reasoning:
 * - Problem samjho
 * - Options dhundho
 * - Har option ka analysis karo
 * - Best choose karo
 * - Explain kyun
 */

const brain = require("./garudaBrain");
const semanticMemory = require("./semanticMemoryService");

// ──────────────────────────────────────────────────────────────────────────────
// 1. CHAIN OF THOUGHT — Step by step soch
// ──────────────────────────────────────────────────────────────────────────────

async function chainOfThought(problem, { context, constraints, goals } = {}) {
  // Step 1: Gather relevant memories
  const memories = semanticMemory.retrieveMemories(problem, { limit: 5 });
  const memoryContext = memories.map(m => `[${m.type}] ${m.content}`).join("\n");

  const systemPrompt = `You are GARUDA's reasoning engine. Think step by step.

PROCESS:
1. UNDERSTAND: What exactly is the problem?
2. GATHER: What information do we have? What's missing?
3. OPTIONS: What are all possible approaches?
4. ANALYZE: Pros/cons of each option
5. DECIDE: Best option with reasoning
6. RISK: What could go wrong?
7. ACTION: Immediate next steps

Return your reasoning in this format:
## UNDERSTAND
[Problem understanding]

## INFORMATION
[What we know]

## OPTIONS
1. [Option A] - Pros: ... - Cons: ...
2. [Option B] - Pros: ... - Cons: ...
3. [Option C] - Pros: ... - Cons: ...

## DECISION
[Best option and why]

## RISKS
[Potential issues]

## ACTION
[Immediate next steps]`;

  const prompt = `PROBLEM: ${problem}
${context ? `CONTEXT: ${context}` : ""}
${constraints ? `CONSTRAINTS: ${constraints}` : ""}
${goals ? `GOALS: ${goals}` : ""}
${memoryContext ? `RELEVANT MEMORIES:\n${memoryContext}` : ""}

Think step by step.`;

  const result = await brain.think(prompt, { systemPrompt, temperature: 0.3 });
  return { reasoning: result.content, provider: result.provider };
}

// ──────────────────────────────────────────────────────────────────────────────
// 2. DECIDE WITH CONFIDENCE — Confidence score ke saath decision
// ──────────────────────────────────────────────────────────────────────────────

async function decideWithConfidence({ situation, options, context }) {
  const systemPrompt = `You are GARUDA's decision engine with confidence scoring.

Return JSON:
{
  "bestOption": "chosen option",
  "confidence": 0-100,
  "reasoning": "why this option",
  "alternatives": [
    { "option": "...", "confidence": 0-100, "whenToChoose": "scenario" }
  ],
  "assumptions": ["what we're assuming"],
  "informationGaps": ["what we don't know"],
  "recommendation": "final recommendation with caveats"
}

Be honest about uncertainty. Low confidence = need more info.`;

  const prompt = `SITUATION: ${situation}
OPTIONS: ${JSON.stringify(options)}
${context ? `CONTEXT: ${context}` : ""}

Decide with confidence scoring.`;

  const result = await brain.think(prompt, { systemPrompt, temperature: 0.2 });
  try {
    return { decision: JSON.parse(result.content), provider: result.provider };
  } catch {
    return { decision: { bestOption: result.content, confidence: 50 }, provider: result.provider };
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// 3. ANALYZE TRADEOFFS — Tradeoff analysis
// ──────────────────────────────────────────────────────────────────────────────

async function analyzeTradeoffs({ optionA, optionB, criteria }) {
  const systemPrompt = `You are GARUDA's tradeoff analyzer. Compare two options objectively.

Return JSON:
{
  "comparison": {
    "criteria1": { "optionA": "score 1-10", "optionB": "score 1-10", "winner": "A/B/tie" },
    ...
  },
  "overallWinner": "A/B/tie",
  "recommendation": "which to choose and why",
  "hybridOption": "if there's a way to combine best of both"
}`;

  const prompt = `OPTION A: ${optionA}
OPTION B: ${optionB}
CRITERIA: ${criteria || "cost, time, quality, scalability, risk"}

Compare objectively.`;

  const result = await brain.think(prompt, { systemPrompt, temperature: 0.2 });
  try {
    return { tradeoff: JSON.parse(result.content), provider: result.provider };
  } catch {
    return { tradeoff: { analysis: result.content }, provider: result.provider };
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// 4. PREDICT OUTCOME — Outcome predict karo
// ──────────────────────────────────────────────────────────────────────────────

async function predictOutcome({ action, context, timeframe }) {
  const systemPrompt = `You are GARUDA's prediction engine. Predict likely outcomes.

Return JSON:
{
  "bestCase": "best possible outcome",
  "worstCase": "worst possible outcome",
  "mostLikely": "what will probably happen",
  "probability": { "success": 0-100, "partial": 0-100, "failure": 0-100 },
  "factors": ["key factors affecting outcome"],
  "mitigations": ["how to improve chances"]
}`;

  const prompt = `ACTION: ${action}
CONTEXT: ${context || "None"}
TIMEFRAME: ${timeframe || "immediate"}

Predict outcomes realistically.`;

  const result = await brain.think(prompt, { systemPrompt, temperature: 0.3 });
  try {
    return { prediction: JSON.parse(result.content), provider: result.provider };
  } catch {
    return { prediction: { summary: result.content }, provider: result.provider };
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// 5. SOLVE PROBLEM — Structured problem solving
// ──────────────────────────────────────────────────────────────────────────────

async function solveProblem(problem, { domain, urgency, resources } = {}) {
  const systemPrompt = `You are GARUDA's problem solver. Use structured problem-solving.

PROCESS:
1. DEFINE: Clear problem statement
2. ROOT CAUSE: Why is this happening?
3. IDEAS: Brainstorm solutions
4. EVALUATE: Which ideas are feasible?
5. PLAN: Step-by-step implementation
6. METRICS: How to measure success

Be practical and actionable.`;

  const prompt = `PROBLEM: ${problem}
${domain ? `DOMAIN: ${domain}` : ""}
${urgency ? `URGENCY: ${urgency}` : ""}
${resources ? `RESOURCES: ${resources}` : ""}

Solve this problem.`;

  const result = await brain.think(prompt, { systemPrompt, temperature: 0.4 });
  return { solution: result.content, provider: result.provider };
}

// ──────────────────────────────────────────────────────────────────────────────
// 6. PRIORITIZE — Tasks prioritize karo
// ──────────────────────────────────────────────────────────────────────────────

async function prioritize(tasks) {
  const systemPrompt = `You are GARUDA's prioritization engine. Rank these tasks by importance and urgency.

Return JSON:
{
  "prioritized": [
    { "task": "...", "priority": "P1/P2/P3/P4", "urgency": "high/medium/low", "impact": "high/medium/low", "reasoning": "why this rank" }
  ],
  "quickWins": ["tasks that give maximum output with minimum effort"],
  "blockers": ["tasks blocking other tasks"]
}`;

  const prompt = `TASKS: ${JSON.stringify(tasks)}

Prioritize based on: impact, urgency, dependencies, effort.`;

  const result = await brain.think(prompt, { systemPrompt, temperature: 0.2 });
  try {
    return { priorities: JSON.parse(result.content), provider: result.provider };
  } catch {
    return { priorities: { ranking: result.content }, provider: result.provider };
  }
}

module.exports = {
  chainOfThought,
  decideWithConfidence,
  analyzeTradeoffs,
  predictOutcome,
  solveProblem,
  prioritize
};
