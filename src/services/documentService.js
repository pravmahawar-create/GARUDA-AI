const pdfParse = require("pdf-parse");
const fs = require("fs");

exports.processUploadedPDF = async (file) => {
    if (!file) {
        throw new Error("No PDF uploaded.");
    }

    const buffer = fs.readFileSync(file.path);
    const pdf = await pdfParse(buffer);

    return {
        success: true,
        filename: file.filename,
        pages: pdf.numpages,
        words: pdf.text.trim().split(/\s+/).length,
        preview: pdf.text.substring(0, 500)
    };
};
