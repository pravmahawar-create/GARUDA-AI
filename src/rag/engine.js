const knowledgeService = require("../services/knowledgeService");
const llmAdapter = require("./llmAdapter");

const cleanText = (value = "") =>
  String(value)
    .replace(/\r?\n|\r/g, " ")
    .replace(/\s+/g, " ")
    .replace(/R(?=\d)/g, "?")
    .replace(/`/g, "?")
    .trim();

exports.generateAnswer = async (question) => {
  const cleanQuestion = cleanText(question);

  if (!cleanQuestion) {
    const error = new Error("Question is required");
    error.statusCode = 400;
    throw error;
  }

  let retrievedChunks = [];
  try {
    retrievedChunks = await knowledgeService.searchKnowledge(cleanQuestion);
  } catch (err) {
    // Knowledge retrieval failed; continue without context
    retrievedChunks = [];
  }

  const llmResult = await llmAdapter.generateAnswer({
    query: cleanQuestion,
    context: retrievedChunks,
    systemPrompt: "You are the GARUDA Founder Assistant. Be concise, natural, and helpful. Use memory when relevant.",
    metadata: { engine: "garuda-rag" }
  });

  return {
    question: cleanQuestion,
    answer: llmResult.answer || "I'm not sure, could you give more detail?",
    provider: llmResult.provider,
    model: llmResult.model,
    grounded: llmResult.grounded,
    warnings: llmResult.warnings || [],
    sources: [],
    citations: [],
    context: ""
  };
};
