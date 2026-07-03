const express = require("express");

const router = express.Router();

const upload = require("../middleware/upload");
const documentController = require("../controllers/documentController");

router.post(
    "/upload",
    upload.single("document"),
    documentController.uploadDocument
);

module.exports = router;
