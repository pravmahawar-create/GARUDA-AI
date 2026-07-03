const documentService = require("../services/documentService");

exports.uploadDocument = async (req, res) => {
  try {
    const result = await documentService.processUploadedPDF(req.file);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
