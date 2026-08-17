// Phase 7 test: ABSLI Knowledge Seed + accessor (no DB writes; mocked).
const assert = require("assert");
const seedService = require("./abslKnowledgeSeedService");
const abslKnowledge = require("./abslKnowledgeService");

let passed = 0;
let failed = 0;
function test(name, fn) {
  const p = Promise.resolve()
    .then(fn)
    .then(() => {
      passed += 1;
      console.log(`  ok  ${name}`);
    })
    .catch((error) => {
      failed += 1;
      console.log(`  xx  ${name}: ${error.message}`);
    });
  return p;
}

async function main() {
  await test("knowledge assets exist locally (978 index + 10 static)", () => {
    const stats = abslKnowledge.knowledgeStats();
    assert.ok(stats.indexChunks >= 978, `expected >=978 index chunks, got ${stats.indexChunks}`);
    assert.ok(stats.staticChunks >= 10);
  });

  await test("getKnowledgeChunks returns chunks from a known source", async () => {
    const result = await abslKnowledge.getKnowledgeChunks("term insurance protection", 5);
    assert.ok(result.chunks.length >= 0);
    assert.ok(["mongo", "static", "index"].includes(result.origin));
  });

  await test("seed normalization maps text/source/chunkIndex correctly", () => {
    const normalized = seedService.normalizeChunk({ source: "ABSLI Brochure.pdf", text: "Life cover 10x", chunkIndex: 3, keywords: ["term"] }, 0, "knowledge-index.json");
    assert.strictEqual(normalized.content, "Life cover 10x");
    assert.strictEqual(normalized.chunkIndex, 3);
    assert.strictEqual(normalized.category, "ABSLI");
    assert.strictEqual(normalized.sourceFile, "ABSLI Brochure.pdf");
  });

  await test("seed is idempotent via (sourceFile, chunkIndex) upsert", async () => {
    const Knowledge = require("../models/Knowledge");
    const originalUpdateOne = Knowledge.updateOne;
    const originalCount = Knowledge.countDocuments;
    const calls = [];
    Knowledge.updateOne = async (filter) => {
      calls.push(filter);
      return { upsertedCount: 1 };
    };
    Knowledge.countDocuments = async () => 988;
    try {
      const result = await seedService.seedAbslKnowledge({});
      assert.ok(result.sourceChunks >= 988);
      assert.ok(calls.length >= 988);
      // Same sourceFile+chunkIndex identity is the idempotency key
      assert.ok(calls[0].sourceFile);
      assert.ok(calls[0].chunkIndex !== undefined);
    } finally {
      Knowledge.updateOne = originalUpdateOne;
      Knowledge.countDocuments = originalCount;
    }
  });

  await test("dry-run seed does not write to DB", async () => {
    const Knowledge = require("../models/Knowledge");
    const originalUpdateOne = Knowledge.updateOne;
    const originalCount = Knowledge.countDocuments;
    let updateCalled = false;
    Knowledge.updateOne = async () => { updateCalled = true; return { upsertedCount: 1 }; };
    Knowledge.countDocuments = async () => 0;
    try {
      const result = await seedService.seedAbslKnowledge({ dryRun: true });
      assert.strictEqual(updateCalled, false);
      assert.strictEqual(result.seeded, "dry_run");
    } finally {
      Knowledge.updateOne = originalUpdateOne;
      Knowledge.countDocuments = originalCount;
    }
  });

  console.log(`\nabslKnowledgeSeedService.test: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main();