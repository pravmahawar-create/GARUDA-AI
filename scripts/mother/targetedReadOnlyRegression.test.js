const assert = require("assert");
const { understandGoal } = require("./goalEngine");
const { routeTask } = require("./router");
const { execute } = require("./executor");

const requestedFiles = [
  "src/routes/motherAgentRoutes.js",
  "src/rag/llmAdapter.js",
  "src/services/localInferenceGateway.js"
];

const request = `Inspect only ${requestedFiles.join(", ")}. Read only; do not modify files.`;
assert.deepStrictEqual(understandGoal(request).targetPaths, requestedFiles);
assert.strictEqual(routeTask(request), "general");

const [result] = execute([{ id: "targeted-read-only", task: request }]);
assert.strictEqual(result.status, "SUCCESS");
assert.deepStrictEqual(
  result.result.output.fileSample.map((file) => file.path),
  requestedFiles
);
assert.deepStrictEqual(result.result.output.missingTargets, []);
console.log("Exact targets are inspected without repository expansion");

const missingRequest = "Inspect only src/rag/llmAdapter.js and src/missing/notFound.js. Read only.";
const [missingResult] = execute([{ id: "missing-target", task: missingRequest }]);
assert.strictEqual(missingResult.status, "SUCCESS");
assert.deepStrictEqual(missingResult.result.output.missingTargets, ["src/missing/notFound.js"]);
console.log("Missing explicit target is reported without a compensating scan");
