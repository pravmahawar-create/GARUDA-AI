const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = 4000;
const filePath = path.resolve(__dirname, "..", "public", "apps", "apex-dental-ai", "index.html");

const server = http.createServer((req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/html; charset=utf-8",
    "Access-Control-Allow-Origin": "*"
  });
  fs.createReadStream(filePath).pipe(res);
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`[APEX-DENTAL-AI] Demo server live at http://localhost:${PORT}`);
});
