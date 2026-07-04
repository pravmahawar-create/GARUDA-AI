const mongoose = require("mongoose");

const knowledgeSchema = new mongoose.Schema({
  sourceFile: { type: String, required: true, index: true },
  title: { type: String, default: "", index: true },
  content: { type: String, required: true },
  keywords: [{ type: String, index: true }],
  chunkIndex: { type: Number, default: 0, index: true },
  page: { type: Number, default: null },
  category: { type: String, default: "ABSLI", index: true }
}, { timestamps: true });

knowledgeSchema.index({
  content: "text",
  title: "text",
  sourceFile: "text",
  category: "text",
  keywords: "text"
});

module.exports = mongoose.model("Knowledge", knowledgeSchema);
