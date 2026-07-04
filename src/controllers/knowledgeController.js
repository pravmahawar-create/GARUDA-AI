const ragEngine = require("../rag/engine");

exports.search = async (req, res) => {
  try {
    const query = (req.query.q || "").trim();

    if (!query) {
      return res.status(400).json({
        success: false,
        message: "Query is required. Use ?q=your question"
      });
    }

    const response = await ragEngine.generateAnswer(query);

    return res.json({
      success: true,
      ...response
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Knowledge search failed"
    });
  }
};
