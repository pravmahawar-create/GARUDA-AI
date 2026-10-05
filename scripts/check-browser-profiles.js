const fs = require("fs");
const path = require("path");

const chromeBase = "C:\\Users\\hp\\AppData\\Local\\Google\\Chrome\\User Data";
const edgeBase = "C:\\Users\\hp\\AppData\\Local\\Microsoft\\Edge\\User Data";

function checkProfiles(base, browserName) {
  if (!fs.existsSync(base)) return;
  const entries = fs.readdirSync(base);
  for (const e of entries) {
    const cookiePath = path.join(base, e, "Network", "Cookies");
    if (fs.existsSync(cookiePath)) {
      const stat = fs.statSync(cookiePath);
      const diffMin = (Date.now() - stat.mtimeMs) / (1000 * 60);
      console.log(`${browserName} [${e}] modified ${diffMin.toFixed(1)} mins ago`);
    }
  }
}

checkProfiles(chromeBase, "Chrome");
checkProfiles(edgeBase, "Edge");
