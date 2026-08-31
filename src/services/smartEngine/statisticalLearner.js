const patterns = new Map();

function recordObservation(category, event, outcome) {
  const key = `${category}::${event}`;
  if (!patterns.has(key)) patterns.set(key, { category, event, outcomes: {}, total: 0 });
  const p = patterns.get(key);
  p.outcomes[outcome] = (p.outcomes[outcome] || 0) + 1;
  p.total++;
}

function predict(category, event) {
  const key = `${category}::${event}`;
  const p = patterns.get(key);
  if (!p || p.total === 0) return null;
  let bestOutcome = null;
  let bestCount = 0;
  for (const [outcome, count] of Object.entries(p.outcomes)) {
    if (count > bestCount) { bestOutcome = outcome; bestCount = count; }
  }
  return { prediction: bestOutcome, confidence: bestCount / p.total, totalObservations: p.total };
}

function predictMulti(category, event, topN = 3) {
  const key = `${category}::${event}`;
  const p = patterns.get(key);
  if (!p || p.total === 0) return [];
  return Object.entries(p.outcomes).sort((a, b) => b[1] - a[1]).slice(0, topN).map(([outcome, count]) => ({ outcome, confidence: count / p.total, count }));
}

function getFrequentPatterns(minCount = 3) {
  const frequent = [];
  for (const [, p] of patterns) {
    for (const [outcome, count] of Object.entries(p.outcomes)) {
      if (count >= minCount) frequent.push({ category: p.category, event: p.event, outcome, count, rate: count / p.total });
    }
  }
  return frequent.sort((a, b) => b.count - a.count);
}

function getStats() {
  const stats = { totalPatterns: patterns.size, totalObservations: 0, byCategory: {} };
  for (const [, p] of patterns) {
    stats.totalObservations += p.total;
    stats.byCategory[p.category] = (stats.byCategory[p.category] || 0) + 1;
  }
  return stats;
}

function clear() { patterns.clear(); }

module.exports = { recordObservation, predict, predictMulti, getFrequentPatterns, getStats, clear };
