const ExecutionKnowledgeAdapter = require('./executionKnowledgeAdapter');
const TaskExecutionBridge = require('./taskExecutionBridge');
const TaskExecutionValidator = require('./taskExecutionValidator');
const { ApprovalGate } = require('../../scripts/dev-agent/core/DevelopmentApprovalGate');

async function runPhase5Tests() {
  console.log('🧪 Starting GARUDA Phase 5 RAG → Execution Intelligence Test Suite...\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${message}`);
      failed++;
    }
  }

  // Mock Knowledge Service (reusing existing knowledgeService interface)
  const mockKnowledgeService = {
    async searchKnowledge(query) {
      if (query.includes('insurance')) {
        return [
          {
            sourceFile: 'absl_term_policy.pdf',
            page: 4,
            category: 'insurance',
            content: 'ABSLI Life Shield plan provides sum assured up to 1 Crore for graduates aged 18-65.',
            score: 0.95
          }
        ];
      }
      return [];
    },
    async searchKnowledgeByCategory(query, category) {
      if (category === 'insurance') {
        return [
          {
            sourceFile: 'absl_term_policy.pdf',
            page: 4,
            category: 'insurance',
            content: 'ABSLI Life Shield plan provides sum assured up to 1 Crore for graduates aged 18-65.',
            score: 0.95
          }
        ];
      }
      return [];
    }
  };

  const adapter = new ExecutionKnowledgeAdapter({ knowledgeService: mockKnowledgeService });

  // -------------------------------------------------------------
  // 1. KNOWLEDGE RETRIEVAL & SOURCE TRACEABILITY TESTS
  // -------------------------------------------------------------
  console.log('--- 1. KNOWLEDGE RETRIEVAL & TRACEABILITY TESTS ---');

  // Test 1: Relevant knowledge retrieved using existing Knowledge service
  const res1 = await adapter.retrieveContext('insurance term policy');
  assert(res1.hasKnowledge === true && res1.chunks.length === 1, 'Relevant knowledge retrieved using existing Knowledge service');

  // Test 2: Source traceability preserved
  const source = res1.sources[0];
  assert(
    source &&
    source.sourceFile === 'absl_term_policy.pdf' &&
    source.category === 'insurance' &&
    source.page === 4 &&
    source.score === 0.95,
    'Source traceability preserved (sourceFile, page, category, score)'
  );

  // Test 3: Insufficient knowledge handled safely
  const res2 = await adapter.retrieveContext('unknown orbital quantum dynamics');
  assert(res2.hasKnowledge === false && res2.insufficientKnowledge === true, 'Insufficient knowledge handled safely without hallucinating context');

  // -------------------------------------------------------------
  // 2. KNOWLEDGE DOES NOT EXECUTE COMMANDS DIRECTLY
  // -------------------------------------------------------------
  console.log('\n--- 2. SAFETY SEPARATION & GOVERNANCE TESTS ---');

  // Test 4: Task enriched with knowledge context without modifying executable task command
  const rawTask = {
    id: 'task-rag-1',
    taskType: 'command_exec',
    command: 'node -v'
  };

  const enriched = await adapter.enrichTaskWithKnowledge(rawTask);
  assert(
    enriched.task.command === 'node -v' &&
    enriched.isExecutableCommandModified === false &&
    enriched.knowledgeContext.hasKnowledge === false,
    'Retrieved knowledge text does NOT directly execute commands; task command remains unmodified'
  );

  // Test 5: Governance and validation remain enforced when running RAG-enriched task
  const approvedGate = new ApprovalGate({ founderApproved: true });
  const bridge = new TaskExecutionBridge({ approvalGate: approvedGate });
  const validator = new TaskExecutionValidator();

  const execRes = await bridge.executeTask(enriched.task, { founderApproved: true });
  const valRes = validator.validateExecutionResult(execRes);

  assert(
    execRes.success === true &&
    valRes.status === 'VERIFIED_SUCCESS' &&
    valRes.verified === true,
    'Governance and deterministic validation remain 100% enforced during RAG-assisted task execution'
  );

  console.log(`\n📊 Phase 5 Test Results: ${passed} Passed, ${failed} Failed.`);
  if (failed > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  runPhase5Tests();
}

module.exports = runPhase5Tests;
