const fs = require("fs");
const path = require("path");
const { extractConventions } = require("./conventionExtractor");
const { buildReviewPrompt, buildStructuralReview } = require("./reviewPromptBuilder");
const { parseReviewResponse, mergeReviewResults } = require("./reviewAnalyzer");
const { aggregateReviews } = require("./reviewVerdictAggregator");

let llmAdapter = null;
try { llmAdapter = require("../../rag/llmAdapter"); } catch {}

async function reviewCode(code, filePath, options = {}) {
  const { conventions = null, useLLM = true, root = process.cwd() } = options;

  const structuralReview = buildStructuralReview(code, filePath);

  if (!useLLM || !llmAdapter || !llmAdapter.generateAnswer) {
    return { ...structuralReview, method: "structural", llmAvailable: false };
  }

  let convoConventions = conventions;
  if (!convoConventions) {
    const repoIntelPath = path.join(root, "src", "services", "repositoryIntelligence");
    if (fs.existsSync(repoIntelPath)) {
      try {
        const { buildFullGraph } = require("../repositoryIntelligence/repositoryIntelligenceService");
        const graph = buildFullGraph(root);
        const sourceFiles = graph.fileGraph.files
          ? graph.fileGraph.files.filter((f) => f.category === "source").slice(0, 30).map((f) => f.path)
          : [];
        convoConventions = extractConventions(sourceFiles, root);
      } catch { convoConventions = {}; }
    } else {
      convoConventions = {};
    }
  }

  const prompt = buildReviewPrompt(code, filePath, convoConventions);
  try {
    const response = await llmAdapter.generateAnswer({ query: prompt });
    const llmReview = parseReviewResponse(response.answer || response.text || "");
    if (llmReview) {
      return mergeReviewResults(structuralReview, llmReview);
    }
    return { ...structuralReview, method: "structural_fallback", llmParseFailed: true };
  } catch {
    return { ...structuralReview, method: "structural_fallback", llmError: true };
  }
}

function reviewFileSync(code, filePath, options = {}) {
  const structuralReview = buildStructuralReview(code, filePath);
  return { ...structuralReview, llmAvailable: false };
}

module.exports = { reviewCode, reviewFileSync, extractConventions, buildReviewPrompt, buildStructuralReview, aggregateReviews };
