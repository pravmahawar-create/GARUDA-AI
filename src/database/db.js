const mongoose = require("mongoose");

const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/garuda_ai";

  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000
    });

    console.log(`? MongoDB connected: ${mongoose.connection.name}`);
  } catch (error) {
    console.error("? MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
