const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + file.originalname.replace(/\s+/g, "-");
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === "application/pdf") cb(null, true);
  else cb(new Error("Only PDF files are allowed"), false);
};

// GARUDA Creative Ingest — governed media upload for EDIT workflows (reuse existing multer, extend allowed mimetypes)
const creativeStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), "uploads", "creative-ingest");
    try { require("fs").mkdirSync(uploadDir, { recursive: true }); } catch {}
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "-");
    cb(null, `${Date.now()}-${safe}`);
  }
});
const ALLOWED_CREATIVE_MIMES = new Set([
  "image/jpeg","image/png","image/webp","image/svg+xml",
  "video/mp4","video/quicktime","video/webm","video/x-matroska",
  "audio/mpeg","audio/wav","audio/ogg","audio/mp4","audio/x-wav"
]);
const creativeFileFilter = (req, file, cb) => {
  if (ALLOWED_CREATIVE_MIMES.has(file.mimetype) || file.mimetype.startsWith("image/") || file.mimetype.startsWith("video/") || file.mimetype.startsWith("audio/")) cb(null, true);
  else cb(new Error(`Creative ingest: unsupported mimetype ${file.mimetype}`), false);
};
const creativeUpload = multer({
  storage: creativeStorage,
  fileFilter: creativeFileFilter,
  limits: { fileSize: 200 * 1024 * 1024 }
});

module.exports = multer({ storage, fileFilter });
module.exports.creativeUpload = creativeUpload;
module.exports.ALLOWED_CREATIVE_MIMES = ALLOWED_CREATIVE_MIMES;
