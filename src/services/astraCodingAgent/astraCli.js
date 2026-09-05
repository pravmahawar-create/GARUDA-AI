#!/usr/bin/env node
/**
 * 🦅 GARUDA ASTRA CODING AGENT CLI
 * Run directly from terminal:
 *   node src/services/astraCodingAgent/astraCli.js "instruction" [targetFile]
 */

const { AstraExecutionEngine } = require("./astraExecutionEngine");

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.log(`\n======================================================`);
    console.log(`🦅 GARUDA ASTRA AUTONOMOUS CODING AGENT`);
    console.log(`Founder: Praveen Mahawar`);
    console.log(`======================================================`);
    console.log(`Usage:`);
    console.log(`  node src/services/astraCodingAgent/astraCli.js "<task-instruction>" [target-file]`);
    console.log(`Example:`);
    console.log(`  node src/services/astraCodingAgent/astraCli.js "Create a utility to hash passwords with salt" src/utils/hashUtil.js\n`);
    process.exit(0);
  }

  const instruction = args[0];
  const targetFile = args[1] || null;

  console.log(`\n🦅 [ASTRA] Initiating task: "${instruction}"`);
  if (targetFile) console.log(`🎯 [ASTRA] Target File: ${targetFile}`);

  const engine = new AstraExecutionEngine();
  const startTime = Date.now();
  const result = await engine.executeTask(instruction, { targetFile });
  const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log(`\n------------------------------------------------------`);
  console.log(`Task ID:       ${result.taskId}`);
  console.log(`Status:        ${result.success ? "✅ SUCCESS" : "❌ FAILED"}`);
  console.log(`File:          ${result.file}`);
  console.log(`SHA-256:       ${result.sha256}`);
  console.log(`Heal Cycles:   ${result.healCyclesRun}`);
  console.log(`Execution Time:${durationSec}s`);
  console.log(`Trajectory Steps: ${result.trajectory.length}`);
  console.log(`------------------------------------------------------\n`);
}

main().catch(err => {
  console.error("FATAL Astra Error:", err);
  process.exit(1);
});
