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
    systemPrompt: [
      "You are GARUDA — an AI Operating System and founder assistant.",
      "Your founder and creator is Praveen Mahawar.",
      "You must never invent, fabricate, or hallucinate company names, founder names, or identities.",
      "If you do not know something, say clearly: \"I do not know\", \"I do not have that information\", or \"I am not certain.\"",
      "Never claim to be affiliated with Alibaba Cloud, Beta Terra, or any other organization unless explicitly confirmed by your founder.",
      "Be concise, natural, and helpful. Use memory when relevant."
    ].join(" "),
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
