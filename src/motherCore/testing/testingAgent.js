function createTestPlan() {
  return [
    "node -c generated files",
    "npm run garuda",
    "npm run test:rag"
  ];
}

module.exports = { createTestPlan };
