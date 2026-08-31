function parseReviewResponse(llmResponse) {
  let cleaned = llmResponse.trim();
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;
  try {
    const parsed = JSON.parse(jsonMatch[0]);
    return {
      verdict: validateVerdict(parsed.verdict),
      score: validateScore(parsed.score),
      issues: validateIssues(parsed.issues || []),
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
      summary: typeof parsed.summary === "string" ? parsed.summary : "",
      method: "llm"
    };
  } catch {
    return null;
  }
}

function validateVerdict(verdict) {
  const valid = ["APPROVE", "REQUEST_CHANGES", "REJECT"];
  return valid.includes(verdict) ? verdict : "REQUEST_CHANGES";
}

function validateScore(score) {
  const num = parseInt(score, 10);
  if (isNaN(num)) return 50;
  return Math.max(0, Math.min(100, num));
}

function validateIssues(issues) {
  if (!Array.isArray(issues)) return [];
  return issues.filter((i) => i && typeof i === "object").map((i) => ({
    severity: ["critical", "warning", "info"].includes(i.severity) ? i.severity : "info",
    line: typeof i.line === "number" ? i.line : null,
    message: typeof i.message === "string" ? i.message : "Unknown issue",
    suggestion: typeof i.suggestion === "string" ? i.suggestion : ""
  }));
}

function mergeReviewResults(structuralReview, llmReview) {
  if (!llmReview) return structuralReview;
  const allIssues = [...(structuralReview.issues || []), ...(llmReview.issues || [])];
  const seen = new Set();
  const uniqueIssues = allIssues.filter((i) => {
    const key = `${i.severity}:${i.message}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  const avgScore = Math.round(((structuralReview.score || 0) + (llmReview.score || 0)) / 2);
  const verdicts = [structuralReview.verdict, llmReview.verdict];
  let finalVerdict = "APPROVE";
  if (verdicts.includes("REJECT")) finalVerdict = "REJECT";
  else if (verdicts.includes("REQUEST_CHANGES")) finalVerdict = "REQUEST_CHANGES";
  return {
    verdict: finalVerdict,
    score: avgScore,
    issues: uniqueIssues,
    strengths: [...(structuralReview.strengths || []), ...(llmReview.strengths || [])],
    summary: llmReview.summary || structuralReview.summary,
    method: "combined"
  };
}

module.exports = { parseReviewResponse, mergeReviewResults, validateVerdict, validateScore };
