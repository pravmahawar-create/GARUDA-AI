const assert = require("assert");

const originalFetch = global.fetch;
const originalProvider = process.env.GARUDA_LLM_PROVIDER;
const originalKey = process.env.GARUDA_LLM_API_KEY;
const originalBackoff = process.env.GARUDA_LLM_RETRY_BACKOFF_MS;

function jsonResponse(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  };
}

(async () => {
  process.env.GARUDA_LLM_PROVIDER = "gemini";
  process.env.GARUDA_LLM_API_KEY = "test-key";
  process.env.GARUDA_LLM_RETRY_BACKOFF_MS = "1,2,4";

  const { generateAnswer } = require("./llmAdapter");

  let attempts = 0;
  global.fetch = async () => {
    attempts += 1;
    if (attempts < 3) {
      return jsonResponse(503, { error: { message: "high demand, try again later" } });
    }
    return jsonResponse(200, {
      candidates: [{ content: { parts: [{ text: "hello from gemini" }] } }],
    });
  };

  const result = await generateAnswer({ query: "hi" });
  assert.strictEqual(attempts, 3, "expected 3 attempts (2x503 then 200)");
  assert.strictEqual(result.answer, "hello from gemini");
  assert.strictEqual(result.provider, "gemini");

  attempts = 0;
  global.fetch = async () => {
    attempts += 1;
    return jsonResponse(503, { error: { message: "busy" } });
  };

  const result2 = await generateAnswer({ query: "hi" });
  assert.ok(attempts > 4, "should try multiple candidate models after exhausting same-model retries");
  assert.ok(result2.error && result2.error.includes("gemini_http_503"), "should preserve the 503 error after all models fail");
  assert.ok(Array.isArray(result2.warnings) && result2.warnings.includes("GENERATIVE_ENGINE_UNAVAILABLE"));

  attempts = 0;
  global.fetch = async () => {
    attempts += 1;
    return jsonResponse(403, { error: { message: "forbidden" } });
  };

  const result3 = await generateAnswer({ query: "hi" });
  assert.ok(attempts <= 2, "403 must be fatal inside gemini (no retry / no model walk); only the openai fallback adds one call");
  assert.ok(result3.error && result3.error.includes("gemini_http_403"));

  console.log("llmAdapter.retry.test.js -> PASS (503 retry -> 200, all-503 model walk, 403 fatal)");
})().catch((err) => {
  console.error(err);
  process.exit(1);
}).finally(() => {
  global.fetch = originalFetch;
  if (originalProvider === undefined) delete process.env.GARUDA_LLM_PROVIDER;
  else process.env.GARUDA_LLM_PROVIDER = originalProvider;
  if (originalKey === undefined) delete process.env.GARUDA_LLM_API_KEY;
  else process.env.GARUDA_LLM_API_KEY = originalKey;
  if (originalBackoff === undefined) delete process.env.GARUDA_LLM_RETRY_BACKOFF_MS;
  else process.env.GARUDA_LLM_RETRY_BACKOFF_MS = originalBackoff;
});