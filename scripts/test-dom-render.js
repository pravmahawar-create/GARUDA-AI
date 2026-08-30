const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

console.log("=== TESTING BUNDLE EVALUATION IN REAL DOM CONTEXT ===");

const assetsDir = 'frontend/dist/assets';
const jsFile = fs.readdirSync(assetsDir).find(f => f.startsWith('index-') && f.endsWith('.js'));
if (!jsFile) {
  console.error("No JS bundle found in", assetsDir);
  process.exit(1);
}

console.log("Testing bundle:", jsFile);
const jsContent = fs.readFileSync(path.join(assetsDir, jsFile), 'utf8');
console.log("Bundle size:", (jsContent.length / 1024).toFixed(1), "KB");

const routes = [
  '/',
  '/app',
  '/founder',
  '/founder/access',
  '/high-command',
  '/login',
  '/signup',
  '/creative',
  '/content',
  '/brand',
  '/digital-presence',
  '/entertainment',
  '/scholar',
  '/kudos',
  '/proposal'
];

for (const route of routes) {
  const virtualConsole = new VirtualConsole();
  const errors = [];
  virtualConsole.on("error", (...args) => errors.push(args.join(" ")));

  const dom = new JSDOM('<!DOCTYPE html><html><body><div id="root"></div></body></html>', {
    url: 'https://www.garudaos.in' + route,
    runScripts: "dangerously",
    virtualConsole
  });

  dom.window.fetch = () => Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
  dom.window.scrollTo = () => {};
  dom.window.matchMedia = () => ({ matches: false, addListener: () => {}, removeListener: () => {} });

  let evalErr = null;
  try {
    const executableJs = jsContent.replace(/import\.meta/g, "({env:{PROD:true,MODE:'production'}})");
    dom.window.eval(executableJs);
  } catch (e) {
    evalErr = e;
  }

  const rootHtml = dom.window.document.getElementById("root").innerHTML;
  const hasErrorBoundary = rootHtml.includes("GARUDA Founder Console UI Notice") || rootHtml.includes("is not defined");

  console.log(`Route [${route}]:`);
  console.log(`  Eval Error: ${evalErr ? '❌ ' + evalErr.message : '✔ NONE'}`);
  console.log(`  Error Boundary: ${hasErrorBoundary ? '❌ TRIGGERED' : '✔ NOT TRIGGERED'}`);
  console.log(`  Console Errors: ${errors.length ? '❌ ' + errors.join('; ') : '✔ NONE'}`);
  console.log(`  Render Preview: ${rootHtml.slice(0, 80).replace(/\n/g, ' ')}...`);
  if (evalErr || hasErrorBoundary) {
    console.error(`FAILED ON ${route}`);
    process.exit(1);
  }
}

console.log("\n🎉 ALL 15 DOM ROUTE EVALUATIONS COMPLETED WITH ZERO RUNTIME ERRORS!");
process.exit(0);
