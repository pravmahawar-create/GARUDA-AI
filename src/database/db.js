const mongoose = require("mongoose");

let connected = false;

const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/garuda_ai";

  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000
    });

    connected = true;
    console.log(`[GARUDA_DB] MongoDB connected: ${mongoose.connection.name}`);
  } catch (error) {
    // Graceful degrade: GARUDA keeps running without MongoDB.
    // Lead-gen, outreach, affiliate, RAG and public chat all work on
    // file/Supabase/NVIDIA — only Mongo-backed features are unavailable.
    connected = false;
    console.error(`[GARUDA_DB] MongoDB connection failed (continuing without DB): ${error.message}`);
  }

  return connected;
};

function isMongoConnected() {
  return connected && mongoose.connection && mongoose.connection.readyState === 1;
}

module.exports = connectDB;
module.exports.isMongoConnected = isMongoConnected;
