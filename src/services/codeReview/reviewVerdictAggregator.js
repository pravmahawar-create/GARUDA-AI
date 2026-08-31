function aggregateReviews(reviews) {
  if (!reviews || reviews.length === 0) {
    return { verdict: "NO_REVIEW", score: 0, issues: [], summary: "No reviews to aggregate" };
  }
  if (reviews.length === 1) return reviews[0];

  const verdictCounts = { APPROVE: 0, REQUEST_CHANGES: 0, REJECT: 0 };
  for (const r of reviews) {
    if (verdictCounts[r.verdict] !== undefined) verdictCounts[r.verdict]++;
  }

  let finalVerdict = "APPROVE";
  if (verdictCounts.REJECT > 0) finalVerdict = "REJECT";
  else if (verdictCounts.REQUEST_CHANGES > 0) finalVerdict = "REQUEST_CHANGES";

  const avgScore = Math.round(reviews.reduce((sum, r) => sum + (r.score || 0), 0) / reviews.length);

  const allIssues = reviews.flatMap((r) => r.issues || []);
  const seen = new Set();
  const dedupedIssues = allIssues.filter((i) => {
    const key = `${i.severity}:${i.message}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const allStrengths = reviews.flatMap((r) => r.strengths || []);

  return {
    verdict: finalVerdict,
    score: avgScore,
    issues: dedupedIssues,
    strengths: allStrengths,
    summary: `Aggregated ${reviews.length} review(s). Verdict: ${finalVerdict}. Score: ${avgScore}/100.`,
    reviewCount: reviews.length,
    method: "aggregated"
  };
}

module.exports = { aggregateReviews };
