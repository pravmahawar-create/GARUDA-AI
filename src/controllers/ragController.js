const ragEngine = require("../rag/engine");

exports.answer = async (req, res) => {
  try {
    const question = String(req.body.question || req.query.q || "").trim();

    if (!question) {
      return res.status(400).json({
        success: false,
        message: "Question is required. Send JSON body: { \"question\": \"your question\" }"
      });
    }

    const result = await ragEngine.generateAnswer(question);

    return res.json({
      success: true,
      ...result
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: "RAG answer generation failed",
      error: error.message
    });
  }
};
