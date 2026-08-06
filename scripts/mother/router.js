function routeTask(task = "") {
  const normalized = String(task).toLowerCase().trim();
  if (!normalized) return "general";

  // Specialized compound routes
  if (/\b(architect plan|architecture plan|system architecture)\b/i.test(normalized)) return "architect";
  if (/\b(engineering loop|correction loop|governed loop)\b/i.test(normalized)) return "engineering_loop";
  if (/\b(review engineering|review artifact|code review)\b/i.test(normalized)) return "review";
  if (/\b(engineering artifact|scaffold validator|scaffold)\b/i.test(normalized)) return "engineering";
  const isReadOnlyInspection = /\b(read-only|read only|read_only|inspect|audit)\b/i.test(normalized);
  const hasTargetOrFileSignal = /\b(repository|file|files|code)\b/i.test(normalized) || /(?:[a-z0-9_.-]+\/)+[a-z0-9_.-]+\.[a-z0-9]+/i.test(normalized);
  if (isReadOnlyInspection && hasTargetOrFileSignal) return "general";

  // Core Intent classification
  if (/\b(revenue|income|earning|settlement|payout|opportunity|proposal|quotation|intake|crm)\b/i.test(normalized)) return "revenue";
  if (/\b(knowledge|rag|retrieval|embedding|document)\b/i.test(normalized)) return "knowledge";
  if (/\b(mother|autonomy|brain|orchestrat)\b/i.test(normalized)) return "mother";
  if (/\b(git|commit|push|repository)\b/i.test(normalized)) return "git";
  if (/\b(builder|build|compile)\b/i.test(normalized)) return "builder";
  if (/\b(patch|modify file|backup)\b/i.test(normalized)) return "patch";

  // Disambiguate Testing vs Validation vs Analysis
  if (/\b(test|tests|testing|spec|unit test|integration test)\b/i.test(normalized)) return "test";
  if (/\b(validat\w*|valid|verify|check)\b/i.test(normalized)) return "validator";
  if (/\b(analy\w*|think|inspect)\b/i.test(normalized)) return "thinker";


  return "general";
}

module.exports = { routeTask };

