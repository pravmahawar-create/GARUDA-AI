const crypto = require("crypto");
const { promisify } = require("util");
const mongoose = require("mongoose");
const scrypt = promisify(crypto.scrypt);

const COLLECTION_NAME = "garuda_founder_secret";
const KIND = "founder_access";

async function connectCredentialStore() {
  if (!process.env.MONGODB_URI) return false;
  if (mongoose.connection.readyState === 1) return true;
  if (!global.garudaFounderCredentialConnection) {
    global.garudaFounderCredentialConnection = mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000
    });
  }
  try {
    await global.garudaFounderCredentialConnection;
    return true;
  } catch {
    return false;
  }
}

async function getSecretDoc() {
  const connected = await connectCredentialStore();
  if (!connected) return null;
  const collection = mongoose.connection.db.collection(COLLECTION_NAME);
  return collection.findOne({ kind: KIND });
}

async function isFounderCredentialReady() {
  try {
    const doc = await getSecretDoc();
    return Boolean(doc && doc.passwordHash && doc.passwordSalt);
  } catch {
    return false;
  }
}

async function setFounderPassword(password) {
  const connected = await connectCredentialStore();
  if (!connected) return { stored: false, message: "MongoDB is not configured for founder credential storage" };
  if (typeof password !== "string" || password.length < 12) {
    return { stored: false, message: "Password must be at least 12 characters" };
  }
  const passwordSalt = crypto.randomBytes(16).toString("base64url");
  const passwordHash = (await scrypt(password, passwordSalt, 64)).toString("base64url");
  const collection = mongoose.connection.db.collection(COLLECTION_NAME);
  await collection.updateOne(
    { kind: KIND },
    { $set: { passwordHash, passwordSalt, updatedAt: new Date().toISOString() } },
    { upsert: true }
  );
  return { stored: true };
}

async function passwordMatches(password) {
  const doc = await getSecretDoc();
  if (!doc) return false;
  try {
    const hash = await scrypt(String(password || ""), doc.passwordSalt, 64);
    return crypto.timingSafeEqual(hash, Buffer.from(doc.passwordHash, "base64url"));
  } catch {
    return false;
  }
}

async function clearCredential() {
  const connected = await connectCredentialStore();
  if (!connected) return false;
  await mongoose.connection.db.collection(COLLECTION_NAME).deleteMany({ kind: KIND });
  return true;
}

module.exports = {
  clearCredential,
  connectCredentialStore,
  getSecretDoc,
  isFounderCredentialReady,
  passwordMatches,
  setFounderPassword
};