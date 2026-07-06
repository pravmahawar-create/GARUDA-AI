function prioritize(tasks = []) {
  const priority = {
    "Analyze current Mother architecture": 1,
    "Find missing brain modules": 2,
    "Generate implementation plan": 3,
    "Run validation": 4,
    "Analyze backend": 2,
    "Improve RAG": 3,
    "Analyze frontend": 2,
    "Create UI improvement plan": 3,
    "Analyze project": 5
  };

  return [...tasks].sort(
    (a, b) => (priority[a] || 999) - (priority[b] || 999)
  );
}

module.exports = { prioritize };