const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");

const CHROME_USER_DATA = "C:\\Users\\hp\\AppData\\Local\\Google\\Chrome\\User Data";
const TEMP_USER_DATA = path.resolve(__dirname, "../data/browser-sessions/chrome-temp");

async function testProfile(profileName) {
  console.log(`\n=== Testing ${profileName} ===`);
  const srcProfileDir = path.join(CHROME_USER_DATA, profileName);
  const srcLocalState = path.join(CHROME_USER_DATA, "Local State");

  if (!fs.existsSync(srcProfileDir)) {
    console.log(`Profile dir not found: ${srcProfileDir}`);
    return false;
  }

  // Clear temp dir
  if (fs.existsSync(TEMP_USER_DATA)) {
    fs.rmSync(TEMP_USER_DATA, { recursive: true, force: true });
  }
  fs.mkdirSync(TEMP_USER_DATA, { recursive: true });

  // Copy Local State
  if (fs.existsSync(srcLocalState)) {
    fs.copyFileSync(srcLocalState, path.join(TEMP_USER_DATA, "Local State"));
  }

  // Copy Profile to Default in temp
  const destDefault = path.join(TEMP_USER_DATA, "Default");
  fs.mkdirSync(destDefault, { recursive: true });

  const dirsToCopy = ["Network", "Local Storage", "Session Storage", "IndexedDB"];
  for (const d of dirsToCopy) {
    const srcSub = path.join(srcProfileDir, d);
    if (fs.existsSync(srcSub)) {
      fs.cpSync(srcSub, path.join(destDefault, d), { recursive: true });
    }
  }

  // Copy Preferences
  const prefFile = path.join(srcProfileDir, "Preferences");
  if (fs.existsSync(prefFile)) {
    fs.copyFileSync(prefFile, path.join(destDefault, "Preferences"));
  }

  console.log(`Copied session files from ${profileName}. Launching test browser...`);

  const browser = await puppeteer.launch({
    headless: "new",
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      `--user-data-dir=${TEMP_USER_DATA}`
    ]
  });

  try {
    const page = await browser.newPage();
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36");
    console.log("Navigating to https://www.linkedin.com/feed/...");
    await page.goto("https://www.linkedin.com/feed/", { waitUntil: "domcontentloaded", timeout: 30000 });
    await new Promise(r => setTimeout(r, 4000));

    const url = page.url();
    const title = await page.title();
    console.log(`Result for ${profileName}:`);
    console.log(`URL: ${url}`);
    console.log(`Title: ${title}`);

    if (url.includes("/feed") || (url.includes("/in/") && !url.includes("/login"))) {
      console.log(`✔ SUCCESS: ${profileName} is authenticated on LinkedIn!`);
      return true;
    }
  } catch (err) {
    console.error(`Error in ${profileName}:`, err.message);
  } finally {
    await browser.close();
  }
  return false;
}

async function run() {
  const p1 = await testProfile("Profile 1");
  if (p1) {
    console.log("\nFOUND AUTHENTICATED PROFILE: Profile 1");
    return;
  }
  const p3 = await testProfile("Profile 3");
  if (p3) {
    console.log("\nFOUND AUTHENTICATED PROFILE: Profile 3");
    return;
  }
  const def = await testProfile("Default");
  if (def) {
    console.log("\nFOUND AUTHENTICATED PROFILE: Default");
    return;
  }
  console.log("\nNone of the profiles were authenticated on LinkedIn feed.");
}

run();
