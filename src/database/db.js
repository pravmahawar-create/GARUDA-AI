const mongoose = require("mongoose");

let connected = false;

const connectDB = async (retries = 3) => {
  const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/garuda_ai";

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 5000
      });
      connected = true;
      console.log(`[GARUDA_DB] MongoDB connected: ${mongoose.connection.name} (attempt ${attempt})`);
      mongoose.connection.on("disconnected", () => {
        connected = false;
        console.warn("[GARUDA_DB] MongoDB disconnected — attempting reconnect in 5s");
        setTimeout(() => connectDB(1).catch(()=>{}), 5000);
      });
      mongoose.connection.on("reconnected", () => { connected = true; console.log("[GARUDA_DB] MongoDB reconnected"); });
      return true;
    } catch (error) {
      connected = false;
      console.error(`[GARUDA_DB] MongoDB connection failed (attempt ${attempt}/${retries}): ${error.message}`);
      if (attempt < retries) {
        const backoff = attempt * 2000;
        await new Promise(r => setTimeout(r, backoff));
      }
    }
  }
  console.error("[GARUDA_DB] MongoDB all retries exhausted — continuing degraded (file/Supabase features live)");
  return false;
};

function isMongoConnected() {
  return connected && mongoose.connection && mongoose.connection.readyState === 1;
}

module.exports = connectDB;
module.exports.isMongoConnected = isMongoConnected;
