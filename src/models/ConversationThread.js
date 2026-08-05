const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  id: { type: String, required: true },
  role: { type: String, required: true, enum: ["user", "garuda", "agent", "system"] },
  text: { type: String, required: true },
  mode: { type: String, default: "conversation" },
  missionStatus: { type: String, default: null },
  evidence: { type: mongoose.Schema.Types.Mixed, default: null },
  timestamp: { type: Date, default: Date.now }
}, { _id: false });

const conversationThreadSchema = new mongoose.Schema({
  threadId: { type: String, required: true, unique: true, index: true },
  title: { type: String, default: "Founder Conversation", index: true },
  messages: [messageSchema],
  activeMission: { type: mongoose.Schema.Types.Mixed, default: null }
}, { timestamps: true });

module.exports = mongoose.model("ConversationThread", conversationThreadSchema);
