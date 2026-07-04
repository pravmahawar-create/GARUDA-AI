const { applyPatch } = require("./patchEngine");

function patchKnowledgeService() {
    return applyPatch("src/services/knowledgeService.js", (content) => {
        if (content.includes('require("../retrieval/hybridRetriever")')) {
            return content;
        }

        return `const { normalizeQuery } = require("../retrieval/queryNormalizer");
const { detectIntent } = require("../retrieval/intentDetector");
const { expandQuery } = require("../retrieval/queryExpander");
const { applyProductAliases } = require("../retrieval/productAliasEngine");
const { retrieveHybrid } = require("../retrieval/hybridRetriever");

exports.searchKnowledge = async (query) => {
  const cleanQuery = String(query || "").trim();

  if (!cleanQuery) return [];

  const normalized = normalizeQuery(cleanQuery);
  const withIntent = detectIntent(normalized);
  const expanded = expandQuery(withIntent);
  const withAliases = applyProductAliases(expanded);

  return retrieveHybrid(withAliases);
};
`;
    });
}

module.exports = {
    patchKnowledgeService
};
