/**
 * 🦅 GARUDA PAWAN ASTRA — REPOSITORY INTELLIGENCE 2.0 & IMPACT ANALYSIS
 * 
 * Capabilities:
 * 1. Deep Project Mapping: File trees, extensions, sizes
 * 2. Symbol Extraction: Functions, Classes, React Components, Express Endpoints, Exports
 * 3. Dependency Graph: AST & Regex import/require tracking (forward and reverse edges)
 * 4. Surgical Impact Analysis: Traces cascade effects of changing module X (downstream consumers & tests)
 * 5. Intent-Based Semantic Search: Retrieves relevant implementation files for user requests
 */

const fs = require("fs");
const path = require("path");

const DEFAULT_IGNORES = new Set([
  "node_modules",
  ".git",
  ".next",
  "dist",
  "build",
  "data",
  ".gemini",
  "coverage",
  ".cache"
]);

class RepoIndexEngine {
  constructor(options = {}) {
    this.rootDir = options.rootDir || process.cwd();
    this.fileCache = new Map(); // relPath -> { mtime, size, symbols, imports, exports }
    this.forwardGraph = new Map(); // file -> Set of imported files
    this.reverseGraph = new Map(); // file -> Set of files that import this file
    this.lastIndexedAt = null;
  }

  /**
   * Scan repository tree and return list of relative file paths
   */
  scanTree(maxFiles = 1000) {
    const fileList = [];

    const walk = (dir) => {
      if (fileList.length >= maxFiles) return;
      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          if (DEFAULT_IGNORES.has(entry.name)) continue;
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            walk(fullPath);
            if (fileList.length >= maxFiles) return;
          } else if (entry.isFile()) {
            const relPath = path.relative(this.rootDir, fullPath).replace(/\\/g, "/");
            const ext = path.extname(entry.name).toLowerCase();
            if ([".js", ".jsx", ".ts", ".tsx", ".json", ".html", ".css", ".md", ".yaml", ".yml"].includes(ext)) {
              fileList.push({
                path: relPath,
                ext,
                name: entry.name
              });
              if (fileList.length >= maxFiles) break;
            }
          }
        }
      } catch (err) {}
    };

    walk(this.rootDir);
    this.lastIndexedAt = new Date().toISOString();
    return fileList;
  }

  /**
   * Extract key symbols, imports, and exports from file content
   */
  extractSymbols(filePath, content) {
    const symbols = [];
    const imports = [];
    const exports = [];
    const ext = path.extname(filePath).toLowerCase();

    if (![".js", ".jsx", ".ts", ".tsx"].includes(ext) || !content) {
      return { symbols, imports, exports };
    }

    try {
      // 1. Functions
      const fnRegex = /(?:export\s+)?(?:async\s+)?function\s+([a-zA-Z0-9_$]+)/g;
      let m;
      while ((m = fnRegex.exec(content)) !== null) {
        const name = m[1];
        const isComponent = /^[A-Z]/.test(name);
        symbols.push({ type: isComponent ? "component" : "function", name });
      }

      // 2. Classes
      const classRegex = /(?:export\s+)?class\s+([a-zA-Z0-9_$]+)/g;
      while ((m = classRegex.exec(content)) !== null) {
        symbols.push({ type: "class", name: m[1] });
      }

      // 3. Arrow Functions & Component Constants
      const constFnRegex = /(?:export\s+)?const\s+([a-zA-Z0-9_$]+)\s*=\s*(?:async\s*)?(?:\([^)]*\)|[a-zA-Z0-9_$]+)\s*=>/g;
      while ((m = constFnRegex.exec(content)) !== null) {
        const name = m[1];
        const isComponent = /^[A-Z]/.test(name);
        symbols.push({ type: isComponent ? "component" : "arrow_function", name });
      }

      // 4. Class Methods
      const methodRegex = /^\s*(?:async\s+)?([a-zA-Z0-9_$]+)\s*\([^)]*\)\s*\{/gm;
      while ((m = methodRegex.exec(content)) !== null) {
        const name = m[1];
        if (!["if", "for", "while", "switch", "catch", "function", "constructor"].includes(name)) {
          symbols.push({ type: "method", name });
        }
      }

      // 4. Express Route Endpoints: router.get('/path', ...) or app.post(...)
      const routeRegex = /(?:router|app)\.(get|post|put|delete|patch)\s*\(\s*["']([^"']+)["']/g;
      while ((m = routeRegex.exec(content)) !== null) {
        symbols.push({ type: "endpoint", method: m[1].toUpperCase(), route: m[2], name: `${m[1].toUpperCase()} ${m[2]}` });
      }

      // 5. Imports extraction: import ... from '...' or require('...')
      const esImportRegex = /import\s+(?:[\w*\s{},]+from\s+)?["']([^"']+)["']/g;
      while ((m = esImportRegex.exec(content)) !== null) {
        imports.push(m[1]);
      }
      const cjsRequireRegex = /require\s*\(\s*["']([^"']+)["']\s*\)/g;
      while ((m = cjsRequireRegex.exec(content)) !== null) {
        imports.push(m[1]);
      }

      // 6. Exports
      const namedExportRegex = /export\s+(?:const|let|var|function|class)\s+([a-zA-Z0-9_$]+)/g;
      while ((m = namedExportRegex.exec(content)) !== null) {
        exports.push(m[1]);
      }
      const moduleExportRegex = /module\.exports\s*=\s*([a-zA-Z0-9_$]+|\{[^}]+\})/g;
      while ((m = moduleExportRegex.exec(content)) !== null) {
        exports.push(m[1]);
      }
    } catch {}

    return { symbols, imports, exports };
  }

  /**
   * Resolve a relative import specifier (e.g. './service' or '../utils') to project path
   */
  resolveImportPath(importerPath, specifier) {
    if (!specifier.startsWith(".")) return null; // Ignore third-party packages (e.g. 'express')

    const importerDir = path.dirname(importerPath);
    const resolvedRaw = path.join(importerDir, specifier).replace(/\\/g, "/");

    // Candidate extensions
    const candidates = [
      resolvedRaw,
      `${resolvedRaw}.js`,
      `${resolvedRaw}.jsx`,
      `${resolvedRaw}.ts`,
      `${resolvedRaw}.tsx`,
      `${resolvedRaw}/index.js`,
      `${resolvedRaw}/index.jsx`
    ];

    for (const c of candidates) {
      if (this.fileCache.has(c)) return c;
      const full = path.join(this.rootDir, c);
      if (fs.existsSync(full) && fs.statSync(full).isFile()) {
        return c;
      }
    }

    return resolvedRaw;
  }

  /**
   * Index entire project workspace or repository files into graph
   */
  indexRepository(filesList = null) {
    const files = filesList || this.scanTree(500);
    this.forwardGraph.clear();
    this.reverseGraph.clear();

    for (const f of files) {
      const relPath = f.path || f;
      const fullPath = path.join(this.rootDir, relPath);
      let content = "";
      try {
        if (fs.existsSync(fullPath)) {
          content = fs.readFileSync(fullPath, "utf8");
        }
      } catch {}

      const analysis = this.extractSymbols(relPath, content);
      this.fileCache.set(relPath, {
        path: relPath,
        symbols: analysis.symbols,
        imports: analysis.imports,
        exports: analysis.exports
      });

      if (!this.forwardGraph.has(relPath)) this.forwardGraph.set(relPath, new Set());
      if (!this.reverseGraph.has(relPath)) this.reverseGraph.set(relPath, new Set());
    }

    // Build dependency graph edges
    for (const [relPath, data] of this.fileCache.entries()) {
      for (const imp of data.imports) {
        const resolved = this.resolveImportPath(relPath, imp);
        if (resolved) {
          this.forwardGraph.get(relPath).add(resolved);
          if (!this.reverseGraph.has(resolved)) {
            this.reverseGraph.set(resolved, new Set());
          }
          this.reverseGraph.get(resolved).add(relPath);
        }
      }
    }

    return {
      indexedFilesCount: this.fileCache.size,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Incrementally update index and dependency graph for a single modified file
   */
  updateFile(filePath, content = null) {
    const relPath = filePath.replace(/\\/g, "/").replace(/^\/+/, "");
    let fileContent = content;

    if (fileContent === null) {
      try {
        const full = path.join(this.rootDir, relPath);
        if (fs.existsSync(full)) {
          fileContent = fs.readFileSync(full, "utf8");
        }
      } catch {}
    }

    // 1. Remove old reverse dependency links
    const oldImports = this.forwardGraph.get(relPath) || new Set();
    for (const oldDep of oldImports) {
      const consumers = this.reverseGraph.get(oldDep);
      if (consumers) {
        consumers.delete(relPath);
      }
    }
    this.forwardGraph.set(relPath, new Set());
    if (!this.reverseGraph.has(relPath)) {
      this.reverseGraph.set(relPath, new Set());
    }

    // 2. Extract new symbols, imports, exports
    const analysis = this.extractSymbols(relPath, fileContent || "");
    this.fileCache.set(relPath, {
      path: relPath,
      symbols: analysis.symbols,
      imports: analysis.imports,
      exports: analysis.exports
    });

    // 3. Re-link new forward and reverse edges
    const newResolvedDeps = [];
    for (const imp of analysis.imports) {
      const resolved = this.resolveImportPath(relPath, imp);
      if (resolved) {
        this.forwardGraph.get(relPath).add(resolved);
        if (!this.reverseGraph.has(resolved)) {
          this.reverseGraph.set(resolved, new Set());
        }
        this.reverseGraph.get(resolved).add(relPath);
        newResolvedDeps.push(resolved);
      }
    }

    const consumers = Array.from(this.reverseGraph.get(relPath) || []);

    return {
      updatedFile: relPath,
      symbolsCount: analysis.symbols.length,
      importsCount: analysis.imports.length,
      resolvedDependencies: newResolvedDeps,
      affectedConsumers: consumers,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Calculate exact impact surface of modifying target files
   */
  calculateImpact(targetFiles = []) {
    const targets = Array.isArray(targetFiles) ? targetFiles : [targetFiles];
    const affectedFiles = new Set(targets);
    const affectedTests = new Set();
    const downstreamConsumers = new Set();

    for (const target of targets) {
      const normalized = target.replace(/\\/g, "/").replace(/^\/+/, "");

      // Discover downstream consumers
      const consumers = this.reverseGraph.get(normalized) || new Set();
      for (const consumer of consumers) {
        downstreamConsumers.add(consumer);
        affectedFiles.add(consumer);
        if (consumer.includes(".test.") || consumer.includes("__tests__")) {
          affectedTests.add(consumer);
        }
      }

      // Check associated test files
      const baseName = path.basename(normalized, path.extname(normalized));
      for (const [filePath] of this.fileCache.entries()) {
        if (filePath.includes(baseName) && (filePath.includes(".test.") || filePath.includes(".spec."))) {
          affectedTests.add(filePath);
          affectedFiles.add(filePath);
        }
      }
    }

    // Risk classification based on dependency fan-out
    let risk = "low";
    if (downstreamConsumers.size > 5) {
      risk = "high";
    } else if (downstreamConsumers.size > 1 || affectedTests.size > 2) {
      risk = "medium";
    }

    return {
      targetFiles: targets,
      affectedFilesCount: affectedFiles.size,
      downstreamConsumers: Array.from(downstreamConsumers),
      affectedTests: Array.from(affectedTests),
      allAffectedFiles: Array.from(affectedFiles),
      risk,
      recommendedVerificationMethod: affectedTests.size > 0 ? "unit_and_regression_tests" : "static_and_syntax"
    };
  }

  /**
   * Search for symbols across the project
   */
  findSymbol(symbolName) {
    const results = [];
    const lowerName = symbolName.toLowerCase();

    for (const [filePath, data] of this.fileCache.entries()) {
      for (const sym of data.symbols) {
        if (sym.name && sym.name.toLowerCase() === lowerName) {
          results.push({ file: filePath, ...sym, exact: sym.name === symbolName });
        } else if (sym.name && sym.name.toLowerCase().includes(lowerName)) {
          results.push({ file: filePath, ...sym, exact: false });
        }
      }
    }

    results.sort((a, b) => (b.exact ? 1 : 0) - (a.exact ? 1 : 0));
    return results;
  }

  /**
   * Search files and symbols relevant to a user query or engineering intent
   */
  searchByIntent(intentQuery, maxResults = 8) {
    if (!intentQuery) return [];
    const tokens = intentQuery.toLowerCase().split(/\s+/).filter(t => t.length > 2);
    const scored = [];

    // Ensure index exists
    if (this.fileCache.size === 0) {
      this.indexRepository();
    }

    for (const [filePath, data] of this.fileCache.entries()) {
      let score = 0;
      const lowerPath = filePath.toLowerCase();
      const fileName = path.basename(filePath).toLowerCase();

      for (const t of tokens) {
        if (fileName.includes(t)) score += 15;
        if (lowerPath.includes(t)) score += 8;

        // Check symbols
        for (const sym of data.symbols) {
          if (sym.name && sym.name.toLowerCase().includes(t)) {
            score += sym.type === "component" || sym.type === "endpoint" ? 12 : 6;
          }
        }
      }

      if (score > 0) {
        scored.push({
          path: filePath,
          score,
          symbols: data.symbols.slice(0, 5),
          downstreamCount: (this.reverseGraph.get(filePath) || new Set()).size
        });
      }
    }

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, maxResults);
  }
}

module.exports = { RepoIndexEngine, DEFAULT_IGNORES };
