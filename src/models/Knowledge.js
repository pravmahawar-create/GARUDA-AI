const mongoose = require("mongoose");

const knowledgeSchema = new mongoose.Schema({
  sourceFile: { type: String, required: true, index: true },
  content: { type: String, required: true },
  page: { type: Number, default: null },
  category: { type: String, default: "ABSLI" }
}, { timestamps: true });

knowledgeSchema.index({ content: "text", sourceFile: "text", category: "text" });

module.exports = mongoose.model("Knowledge", knowledgeSchema);
