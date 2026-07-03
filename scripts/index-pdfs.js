const fs = require("fs");
const path = require("path");

const pdfModule = require("pdf-parse");
const pdfParse = pdfModule.default || pdfModule;

const uploadsDir = path.join(__dirname, "..", "uploads");
const outputFile = path.join(__dirname, "..", "data", "knowledge-index.json");

function chunkText(text, size = 1200) {
  const clean = text.replace(/\s+/g, " ").trim();
  const chunks = [];
  for (let i = 0; i < clean.length; i += size) {
    chunks.push(clean.slice(i, i + size));
  }
  return chunks;
}

async function indexPDFs() {
  const files = fs.readdirSync(uploadsDir).filter(file => file.toLowerCase().endsWith(".pdf"));
  const index = [];

  for (const file of files) {
    const filePath = path.join(uploadsDir, file);
    console.log("Reading:", file);

    try {
      const buffer = fs.readFileSync(filePath);
      const pdf = await pdfParse(buffer);
      const chunks = chunkText(pdf.text || "");

      chunks.forEach((chunk, i) => {
        index.push({ id: `${file}-${i + 1}`, source: file, chunk: i + 1, text: chunk });
      });
    } catch (err) {
      console.log("Failed:", file, err.message);
    }
  }

  fs.writeFileSync(outputFile, JSON.stringify(index, null, 2));
  console.log(`DONE: ${index.length} chunks created from ${files.length} PDFs`);
}

indexPDFs();
