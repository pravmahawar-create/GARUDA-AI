import express from "express";
import path from "path";
import puppeteer from "puppeteer";

async function runMobileAudit() {
  console.log("=== GARUDA VYAPAR OS - MOBILE VIEWPORT FORENSIC AUDIT ===");

  const app = express();
  const distDir = path.resolve("frontend/dist");
  app.use(express.static(distDir));
  app.use((req, res) => {
    res.sendFile(path.join(distDir, "index.html"));
  });

  const server = app.listen(4188, () => {
    console.log("✓ Audit test server running at http://localhost:4188");
  });

  const viewports = [
    { name: "iPhone SE (1st gen)", width: 320, height: 568 },
    { name: "Compact Android", width: 360, height: 640 },
    { name: "iPhone SE / 8", width: 375, height: 667 },
    { name: "iPhone 13/14/15 Standard", width: 390, height: 844 },
    { name: "iPhone 15 Pro Max", width: 430, height: 932 }
  ];

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    const page = await browser.newPage();

    for (const vp of viewports) {
      console.log(`\n--- Testing Viewport: ${vp.name} (${vp.width}x${vp.height} px) ---`);
      await page.setViewport({ width: vp.width, height: vp.height });
      await page.goto("http://localhost:4188/vyapar-os", { waitUntil: "networkidle0" });

      const metrics = await page.evaluate(() => {
        const root = document.getElementById("root");
        const body = document.body;
        const html = document.documentElement;

        const bodyScrollWidth = body.scrollWidth;
        const bodyClientWidth = body.clientWidth;
        const hasHorizontalOverflow = bodyScrollWidth > bodyClientWidth;
        const overflowPixels = bodyScrollWidth - bodyClientWidth;

        // Find elements causing overflow
        const overflowingElements = [];
        const allElements = Array.from(document.querySelectorAll("*"));
        for (const el of allElements) {
          const rect = el.getBoundingClientRect();
          if (rect.right > bodyClientWidth + 1) {
            overflowingElements.push({
              tag: el.tagName,
              id: el.id || "",
              className: el.className || "",
              text: (el.textContent || "").trim().slice(0, 30),
              right: Math.round(rect.right),
              width: Math.round(rect.width)
            });
          }
        }

        return {
          bodyScrollWidth,
          bodyClientWidth,
          hasHorizontalOverflow,
          overflowPixels,
          overflowCount: overflowingElements.length,
          sampleOverflows: overflowingElements.slice(0, 4)
        };
      });

      console.log(`ScrollWidth: ${metrics.bodyScrollWidth}px | ClientWidth: ${metrics.bodyClientWidth}px`);
      if (metrics.hasHorizontalOverflow) {
        console.log(`⚠️ HORIZONTAL OVERFLOW DETECTED: +${metrics.overflowPixels}px overflow! (${metrics.overflowCount} elements exceeding viewport)`);
        console.log("Sample offending elements:", JSON.stringify(metrics.sampleOverflows, null, 2));
      } else {
        console.log(`✓ Zero horizontal overflow. Perfect fit.`);
      }
    }

  } catch (err) {
    console.error("Audit error:", err);
  } finally {
    if (browser) await browser.close();
    server.close();
    console.log("\n✓ Audit server closed.");
  }
}

runMobileAudit();
