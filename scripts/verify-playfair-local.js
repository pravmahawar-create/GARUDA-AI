const http = require("http");
const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");

const DIST_DIR = path.join(__dirname, "..", "frontend", "dist");

// Simple static server
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
    // SPA fallback
    const indexHtml = path.join(DIST_DIR, "index.html");
    res.writeHead(200, { "Content-Type": "text/html" });
    fs.createReadStream(indexHtml).pipe(res);
  }
});

server.listen(5188, async () => {
  console.log("Local test server listening on http://localhost:5188");

  try {
    const browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1440,1000"]
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 1000 });

    await page.goto("http://localhost:5188/war-room", { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 2000));

    // Verify computed font-family of various elements on the page!
    const fontAudit = await page.evaluate(() => {
      const heading = document.querySelector("h1");
      const kpiNumber = document.querySelector(".garuda-war-room-root div[style*='32px']");
      const button = document.querySelector(".garuda-war-room-root button");
      const navItem = document.querySelector("aside button");
      const body = document.body;

      return {
        h1Font: heading ? window.getComputedStyle(heading).fontFamily : "NOT_FOUND",
        kpiNumberFont: kpiNumber ? window.getComputedStyle(kpiNumber).fontFamily : "NOT_FOUND",
        buttonFont: button ? window.getComputedStyle(button).fontFamily : "NOT_FOUND",
        navItemFont: navItem ? window.getComputedStyle(navItem).fontFamily : "NOT_FOUND",
        bodyFont: window.getComputedStyle(body).fontFamily
      };
    });

    console.log("=== COMPUTED FONT AUDIT (LOCAL BUILD) ===");
    console.log(JSON.stringify(fontAudit, null, 2));

    const ssPath = path.join(__dirname, "output", "playfair-unified-war-room.png");
    await page.screenshot({ path: ssPath });
    console.log("Screenshot saved to:", ssPath);

    await browser.close();
  } catch (err) {
    console.error("Test error:", err);
  } finally {
    server.close();
    process.exit(0);
  }
});
