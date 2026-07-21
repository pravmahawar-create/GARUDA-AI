function routeTask(task = "") {
  const normalized = task.toLowerCase();

  if (normalized.includes("revenue")) return "revenue";
  if (normalized.includes("commit")) return "git";
  if (normalized.includes("build")) return "builder";
  if (normalized.includes("valid")) return "validator";
  if (normalized.includes("analy")) return "thinker";
  if (normalized.includes("patch")) return "patch";
  if (normalized.includes("test")) return "test";

  return "general";
}

module.exports = { routeTask };
