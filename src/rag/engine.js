const knowledgeService = require("../services/knowledgeService");

const MAX_CONTEXT_CHARS = 9000;

const stopWords = new Set([
  "what", "when", "where", "which", "whose", "whom", "about", "with", "from",
  "that", "this", "there", "their", "have", "has", "does", "into", "your",
  "please", "tell", "explain", "policy", "plan"
]);

const cleanText = (value = "") =>
  String(value)
    .replace(/\r?\n|\r/g, " ")
    .replace(/\s+/g, " ")
    .replace(/R(?=\d)/g, "₹")
    .replace(/\bth\b/g, "th")
    .trim();

const getKeywords = (question = "") =>
  cleanText(question)
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(word => word.length > 2 && !stopWords.has(word));

const splitSentences = (text = "") =>
  cleanText(text)
    .split(/(?<=[.!?])\s+|(?<=\))\s+|;\s+/)
    .map(sentence => sentence.trim())
    .filter(sentence => sentence.length >= 45 && sentence.length <= 700);

const rankSentences = (question, chunks = []) => {
  const keywords = getKeywords(question);

  return chunks
    .flatMap(chunk =>
      splitSentences(chunk.text).map(sentence => {
        const lower = sentence.toLowerCase();
        const score = keywords.reduce((total, word) => {
          return total + (lower.includes(word) ? 2 : 0);
        }, 0);

        return {
          sentence,
          score,
          sourceFile: chunk.sourceFile,
          page: chunk.page,
          category: chunk.category
        };
      })
    )
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);
};

const buildContext = (chunks = []) =>
  chunks
    .map((chunk, index) => {
      const page = chunk.page ? `Page ${chunk.page}` : "Page unknown";
      return `[${index + 1}] ${chunk.sourceFile} | ${page}\n${cleanText(chunk.text)}`;
    })
    .join("\n\n")
    .slice(0, MAX_CONTEXT_CHARS);

const buildReadableAnswer = (question, rankedSentences = []) => {
  if (!rankedSentences.length) {
    return [
      "Mujhe uploaded ABSLI knowledge base me is question ka direct clear answer nahi mila.",
      "Please question ko thoda specific karke poochho, jaise plan name, benefit, premium term, maturity benefit ya death benefit."
    ].join(" ");
  }

  const uniqueSentences = [];
  const seen = new Set();

  for (const item of rankedSentences) {
    const key = item.sentence.toLowerCase().slice(0, 120);
    if (!seen.has(key)) {
      seen.add(key);
      uniqueSentences.push(item.sentence);
    }
  }

  return [
    "Uploaded ABSLI documents ke basis par:",
    ...uniqueSentences.slice(0, 4).map(sentence => `• ${sentence}`)
  ].join("\n");
};

exports.generateAnswer = async (question) => {
  const cleanQuestion = cleanText(question);

  if (!cleanQuestion) {
    const error = new Error("Question is required");
    error.statusCode = 400;
    throw error;
  }

  const retrievedChunks = await knowledgeService.searchKnowledge(cleanQuestion);

  if (!retrievedChunks.length) {
    return {
      question: cleanQuestion,
      answer: "Mujhe uploaded ABSLI documents me is question se related information nahi mili.",
      confidence: "low",
      sources: [],
      context: ""
    };
  }

  const rankedSentences = rankSentences(cleanQuestion, retrievedChunks);
  const answer = buildReadableAnswer(cleanQuestion, rankedSentences);
  const context = buildContext(retrievedChunks);

  const sources = retrievedChunks.slice(0, 5).map((chunk, index) => ({
    rank: index + 1,
    sourceFile: chunk.sourceFile,
    page: chunk.page,
    category: chunk.category,
    score: chunk.score
  }));

  return {
    question: cleanQuestion,
    answer,
    confidence: rankedSentences.length >= 3 ? "medium" : "low",
    sources,
    context
  };
};
