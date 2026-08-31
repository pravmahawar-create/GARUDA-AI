const fs = require("fs");
const parser = require("@babel/parser");

const PARSE_OPTIONS = {
  sourceType: "unambiguous",
  allowImportExportEverywhere: true,
  allowReturnOutsideFunction: true,
  errorRecovery: true,
  plugins: ["dynamicImport", "optionalChaining"]
};

function extractRoutesFromFile(filePath) {
  let content;
  try {
    content = fs.readFileSync(filePath, "utf8");
  } catch {
    return [];
  }

  let ast;
  try {
    ast = parser.parse(content, PARSE_OPTIONS);
  } catch {
    return [];
  }

  const routes = [];
  const routePatterns = /(?:router|app)\.(get|post|put|patch|delete|use)\s*\(\s*["'`]/g;

  let match;
  while ((match = routePatterns.exec(content)) !== null) {
    const method = match[1].toUpperCase();
    const afterMethod = content.slice(match.index + match[0].length);
    const quoteMatch = afterMethod.match(/^([^"'`]+)/);
    if (quoteMatch) {
      const routePath = quoteMatch[1];
      if (routePath.startsWith("/")) {
        const surroundingLines = content.slice(0, match.index).split("\n");
        const lineNumber = surroundingLines.length;
        let handlerName = "anonymous";
        const handlerSearch = content.slice(match.index);
        const handlerMatch = handlerSearch.match(/\)\s*,\s*(?:async\s+)?(?:function\s+(\w+)|(\w+))/);
        if (handlerMatch) {
          handlerName = handlerMatch[1] || handlerMatch[2] || "anonymous";
        }

        routes.push({
          method,
          path: routePath,
          file: filePath,
          handler: handlerName,
          line: lineNumber
        });
      }
    }
  }

  return routes;
}

function mapAllRoutes(filePaths) {
  const allRoutes = [];
  for (const filePath of filePaths) {
    if (!filePath.endsWith(".js") || filePath.includes(".test.") || filePath.includes("node_modules")) {
      continue;
    }
    const fileRoutes = extractRoutesFromFile(filePath);
    allRoutes.push(...fileRoutes);
  }

  const byFile = {};
  for (const route of allRoutes) {
    if (!byFile[route.file]) byFile[route.file] = [];
    byFile[route.file].push(route);
  }

  return {
    routes: allRoutes,
    byFile,
    summary: {
      totalRoutes: allRoutes.length,
      totalFiles: Object.keys(byFile).length,
      methods: allRoutes.reduce((acc, r) => { acc[r.method] = (acc[r.method] || 0) + 1; return acc; }, {})
    }
  };
}

module.exports = { extractRoutesFromFile, mapAllRoutes };
