const knowledgeService = require("../services/knowledgeService");

exports.search = async (req, res) => {
  try {
    const query = (req.query.q || "").trim();

    if (!query) {
      return res.status(400).json({
        success: false,
        message: "Query is required. Use ?q=your question"
      });
    }

    const results = await knowledgeService.searchKnowledge(query);

    return res.json({
      success: true,
      query,
      count: results.length,
      results
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Knowledge search failed",
      error: error.message
    });
  }
};
