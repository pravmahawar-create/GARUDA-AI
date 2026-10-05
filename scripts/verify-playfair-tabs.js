const http = require("http");
const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");

const DIST_DIR = path.join(__dirname, "..", "frontend", "dist");

const server = http.createServer((req, res) => {
  let reqPath = req.url.split("?")[0];
  if (reqPath === "/") reqPath = "/index.html";
  if (reqPath === "/war-room") reqPath = "/war-room.html";

  let filePath = path.join(DIST_DIR, reqPath);
  if (!fs.existsSync(filePath) && fs.existsSync(filePath + ".html")) {
    filePath = filePath + ".html";
  } else if (!fs.existsSync(filePath) && fs.existsSync(path.join(filePath, "index.html"))) {
    filePath = path.join(filePath, "index.html");
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath);
    const contentType = {
      ".html": "text/html",
      ".js": "text/javascript",
      ".css": "text/css",
      ".json": "application/json",
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".svg": "image/svg+xml"
    }[ext] || "application/octet-stream";

    res.writeHead(200, { "Content-Type": contentType });
    fs.createReadStream(filePath).pipe(res);
  } else {
    const indexHtml = path.join(DIST_DIR, "index.html");
    res.writeHead(200, { "Content-Type": "text/html" });
    fs.createReadStream(indexHtml).pipe(res);
  }
});

server.listen(5189, async () => {
  console.log("Serving on http://localhost:5189");
  try {
    const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox"] });
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 1000 });
    await page.goto("http://localhost:5189/war-room", { waitUntil: "networkidle2" });
    await new Promise(r => setTimeout(r, 1500));

    const outDir = path.join(__dirname, "output", "playfair_tabs");
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    // Test Commercial tab
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("aside button"));
      const commercialBtn = btns.find(b => b.innerText.includes("Commercial"));
      if (commercialBtn) commercialBtn.click();
    });
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(outDir, "commercial-playfair.png") });

    // Test Voter Insights
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("aside button"));
      const btn = btns.find(b => b.innerText.includes("Voter Insights"));
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(outDir, "voter-playfair.png") });

    console.log("Playfair tabs screenshots saved successfully!");
    await browser.close();
  } catch (err) {
    console.error(err);
  } finally {
    server.close();
    process.exit(0);
  }
});
