const knowledgeService = require("../services/knowledgeService");

const MAX_CONTEXT_CHARS = 7000;
const MAX_CITATIONS = 5;
const MAX_ANSWER_POINTS = 4;

const stopWords = new Set([
  "what", "when", "where", "which", "whose", "whom", "about", "with", "from",
  "that", "this", "there", "their", "have", "has", "does", "into", "your",
  "please", "tell", "explain", "policy", "plan", "benefit", "benefits"
]);

const cleanText = (value = "") =>
  String(value)
    .replace(/\r?\n|\r/g, " ")
    .replace(/\s+/g, " ")
    .replace(/R(?=\d)/g, "?")
    .replace(/`/g, "?")
    .trim();

const normalizeKey = (value = "") =>
  cleanText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const getKeywords = (question = "") =>
  normalizeKey(question)
    .split(" ")
    .filter(word => word.length > 2 && !stopWords.has(word));

const isReadableSentence = (sentence = "") => {
  const text = cleanText(sentence);
  const digitCount = (text.match(/\d/g) || []).length;
  const alphaCount = (text.match(/[a-zA-Z]/g) || []).length;
  const commaCount = (text.match(/,/g) || []).length;
  const percentCount = (text.match(/%/g) || []).length;

  if (text.length < 45 || text.length > 420) return false;
  if (digitCount > alphaCount * 0.45) return false;
  if (commaCount > 10) return false;
  if (percentCount > 3) return false;
  if (/\bIRR\b/i.test(text) && digitCount > 8) return false;

  return true;
};

const splitSentences = (text = "") =>
  cleanText(text)
    .split(/(?<=[.!?])\s+|(?<=\))\s+|;\s+/)
    .map(sentence => sentence.trim())
    .filter(isReadableSentence);

const scoreSentence = (sentence, keywords = []) => {
  const lower = normalizeKey(sentence);
  return keywords.reduce((total, word) => {
    if (lower.includes(word)) return total + 2;
    return total;
  }, 0);
};

const createCitationId = (index) => `S${index + 1}`;

const buildCitationEngine = (question, chunks = []) => {
  const keywords = getKeywords(question);
  const citations = [];
  const seenSentences = new Set();
  const seenSources = new Set();

  for (const chunk of chunks) {
    const sentences = splitSentences(chunk.text)
      .map(sentence => ({
        text: sentence,
        score: scoreSentence(sentence, keywords),
        sourceFile: chunk.sourceFile,
        page: chunk.page || null,
        category: chunk.category || "ABSLI",
        retrievalScore: chunk.score || 0
      }))
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score);

    for (const item of sentences) {
      const sentenceKey = normalizeKey(item.text).slice(0, 180);
      const sourceKey = `${item.sourceFile}::${item.page || "unknown"}::${sentenceKey}`;

      if (seenSentences.has(sentenceKey) || seenSources.has(sourceKey)) continue;

      seenSentences.add(sentenceKey);
      seenSources.add(sourceKey);

      citations.push({
        id: createCitationId(citations.length),
        text: item.text,
        sourceFile: item.sourceFile,
        page: item.page,
        category: item.category,
        score: item.score,
        retrievalScore: item.retrievalScore
      });

      if (citations.length >= MAX_CITATIONS) break;
    }

    if (citations.length >= MAX_CITATIONS) break;
  }

  return citations;
};

const buildCleanContext = (citations = []) =>
  citations
    .map(citation => {
      const page = citation.page ? `Page ${citation.page}` : "Page unknown";
      return `[${citation.id}] ${citation.sourceFile} | ${page}\n${citation.text}`;
    })
    .join("\n\n")
    .slice(0, MAX_CONTEXT_CHARS);

const buildReadableAnswer = (citations = []) => {
  if (!citations.length) {
    return [
      "Mujhe uploaded ABSLI knowledge base me is question ka direct clear answer nahi mila.",
      "Please question ko thoda specific karke poochho, jaise plan name, premium term, maturity benefit ya death benefit."
    ].join(" ");
  }

  return [
    "Uploaded ABSLI documents ke basis par:",
    ...citations.slice(0, MAX_ANSWER_POINTS).map(citation => `� ${citation.text} [${citation.id}]`)
  ].join("\n");
};

const buildSources = (citations = []) =>
  citations.map((citation, index) => ({
    rank: index + 1,
    citationId: citation.id,
    sourceFile: citation.sourceFile,
    page: citation.page,
    category: citation.category,
    score: citation.score,
    retrievalScore: citation.retrievalScore
  }));

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
      citations: [],
      context: ""
    };
  }

  const citations = buildCitationEngine(cleanQuestion, retrievedChunks);
  const answer = buildReadableAnswer(citations);
  const context = buildCleanContext(citations);
  const sources = buildSources(citations);

  return {
    question: cleanQuestion,
    answer,
    confidence: citations.length >= 3 ? "medium" : "low",
    sources,
    citations,
    context
  };
};
