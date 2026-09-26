const fs = require('fs');
const path = require('path');

const EVIDENCE_STATUS = {
  VERIFIED: 'VERIFIED',
  PARTIAL: 'PARTIAL',
  UNKNOWN: 'UNKNOWN',
  NOT_APPLICABLE: 'NOT_APPLICABLE'
};

class NazarInvestigator {
  constructor(workspaceRoot) {
    this.workspaceRoot = workspaceRoot || process.cwd();
  }

  _readFileSafe(relPath) {
    try {
      const abs = path.resolve(this.workspaceRoot, relPath);
      if (!abs.startsWith(this.workspaceRoot)) return null;
      return fs.readFileSync(abs, 'utf-8');
    } catch { return null; }
  }

  _fileExists(relPath) {
    try {
      const abs = path.resolve(this.workspaceRoot, relPath);
      if (!abs.startsWith(this.workspaceRoot)) return false;
      return fs.existsSync(abs);
    } catch { return false; }
  }

  _scanDir(relDir, extensions) {
    try {
      const abs = path.resolve(this.workspaceRoot, relDir);
      if (!abs.startsWith(this.workspaceRoot)) return [];
      if (!fs.existsSync(abs)) return [];
      const results = [];
      const exts = extensions || [];
      const walk = (dir) => {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const e of entries) {
          const full = path.join(dir, e.name);
          if (e.isDirectory()) { walk(full); continue; }
          if (exts.length === 0 || exts.some(ext => e.name.endsWith(ext))) {
            results.push({ relative: path.relative(this.workspaceRoot, full), size: fs.statSync(full).size });
          }
        }
      };
      walk(abs);
      return results;
    } catch { return []; }
  }

  _grepInFiles(pattern, relDir, extensions) {
    try {
      const abs = path.resolve(this.workspaceRoot, relDir);
      if (!abs.startsWith(this.workspaceRoot)) return [];
      if (!fs.existsSync(abs)) return [];
      const regex = new RegExp(pattern, 'gi');
      const exts = extensions || [];
      const matches = [];
      const walk = (dir) => {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const e of entries) {
          const full = path.join(dir, e.name);
          if (e.isDirectory()) { walk(full); continue; }
          if (exts.length > 0 && !exts.some(ext => e.name.endsWith(ext))) continue;
          try {
            const content = fs.readFileSync(full, 'utf-8');
            const lines = content.split('\n');
            for (let i = 0; i < lines.length; i++) {
              regex.lastIndex = 0;
              if (regex.test(lines[i])) {
                matches.push({
                  file: path.relative(this.workspaceRoot, full),
                  line: i + 1,
                  text: lines[i].trim().substring(0, 200)
                });
              }
            }
          } catch {}
        }
      };
      walk(abs);
      return matches;
    } catch { return []; }
  }

  investigateIntent(missionDescription, context = {}) {
    const evidence = [];
    const srcFiles = this._scanDir('src', ['.js', '.ts', '.tsx', '.jsx']);
    evidence.push({ type: 'codebase_scan', status: EVIDENCE_STATUS.VERIFIED, finding: 'Codebase has ' + srcFiles.length + ' source files', data: { count: srcFiles.length } });
    if (context.targetFiles) {
      const existing = context.targetFiles.filter(f => this._fileExists(f));
      const missing = context.targetFiles.filter(f => !this._fileExists(f));
      evidence.push({ type: 'target_verification', status: existing.length > 0 ? EVIDENCE_STATUS.VERIFIED : EVIDENCE_STATUS.UNKNOWN, finding: existing.length + '/' + context.targetFiles.length + ' target files exist', data: { existing, missing } });
    }
    const missionWords = missionDescription.toLowerCase().split(/\s+/);
    const searchPattern = missionWords.filter(w => w.length > 3).slice(0, 3).join('|');
    if (searchPattern) {
      const codeHints = this._grepInFiles(searchPattern, 'src', ['.js', '.ts']);
      if (codeHints.length > 0) {
        evidence.push({ type: 'code_relevance', status: EVIDENCE_STATUS.VERIFIED, finding: 'Found ' + codeHints.length + ' code references matching mission keywords', data: { sample: codeHints.slice(0, 5) } });
      } else {
        evidence.push({ type: 'code_relevance', status: EVIDENCE_STATUS.PARTIAL, finding: 'No direct code references found for mission keywords', data: {} });
      }
    }
    return { lensId: 1, lensName: 'INTENT', evidence, confidence: evidence.some(e => e.status === EVIDENCE_STATUS.VERIFIED) ? 0.7 : 0.3 };
  }

  investigateArchitecture(missionDescription, context = {}) {
    const evidence = [];
    const srcStructure = this._scanDir('src', []);
    const dirSet = new Set();
    for (const f of srcStructure) {
      const parts = f.relative.split(path.sep);
      if (parts.length >= 2) dirSet.add(parts[0] + path.sep + parts[1]);
    }
    evidence.push({ type: 'directory_structure', status: EVIDENCE_STATUS.VERIFIED, finding: 'Found ' + dirSet.size + ' top-level module directories', data: { directories: [...dirSet].slice(0, 20) } });
    if (context.targetFiles && context.targetFiles.length > 0) {
      const targetDir = path.dirname(context.targetFiles[0]);
      const siblings = srcStructure.filter(f => path.dirname(f.relative) === targetDir);
      evidence.push({ type: 'placement_context', status: EVIDENCE_STATUS.VERIFIED, finding: 'Target directory has ' + siblings.length + ' sibling files', data: { siblings: siblings.map(s => s.relative) } });
    }
    const imports = this._grepInFiles('require\\(|import ', 'src', ['.js', '.ts']);
    evidence.push({ type: 'dependency_graph_signal', status: EVIDENCE_STATUS.PARTIAL, finding: 'Found ' + imports.length + ' import/require statements', data: { sample: imports.slice(0, 10) } });
    const packageJson = this._readFileSafe('package.json');
    if (packageJson) {
      try {
        const pkg = JSON.parse(packageJson);
        evidence.push({ type: 'package_manifest', status: EVIDENCE_STATUS.VERIFIED, finding: 'Package: ' + (pkg.name || 'unknown'), data: { name: pkg.name, dependencies: Object.keys(pkg.dependencies || {}).length, devDeps: Object.keys(pkg.devDependencies || {}).length } });
      } catch {
        evidence.push({ type: 'package_manifest', status: EVIDENCE_STATUS.PARTIAL, finding: 'package.json exists but is unparseable', data: {} });
      }
    }
    return { lensId: 2, lensName: 'ARCHITECTURE', evidence, confidence: evidence.filter(e => e.status === EVIDENCE_STATUS.VERIFIED).length / Math.max(evidence.length, 1) };
  }

  investigateCode(missionDescription, context = {}) {
    const evidence = [];
    const jsFiles = this._scanDir('src', ['.js', '.ts']);
    let syntaxErrors = 0;
    let checked = 0;
    const errors = [];
    const filesToCheck = context.targetFiles || jsFiles.slice(0, 20).map(f => f.relative);
    for (const f of filesToCheck) {
      const content = this._readFileSafe(f);
      if (content === null) continue;
      checked++;
      try { new Function(content); } catch (err) {
        syntaxErrors++;
        errors.push({ file: f, error: err.message.substring(0, 150) });
      }
    }
    evidence.push({ type: 'syntax_check', status: checked > 0 ? EVIDENCE_STATUS.VERIFIED : EVIDENCE_STATUS.UNKNOWN, finding: checked + ' files checked, ' + syntaxErrors + ' syntax errors', data: { checked, syntaxErrors, errors: errors.slice(0, 10) } });
    const errorPaths = this._grepInFiles('catch|throw|Error', 'src', ['.js', '.ts']);
    evidence.push({ type: 'error_handling_signal', status: EVIDENCE_STATUS.PARTIAL, finding: 'Found ' + errorPaths.length + ' error handling patterns', data: { sample: errorPaths.slice(0, 5) } });
    const todoFixme = this._grepInFiles('TODO|FIXME|HACK|XXX', 'src', ['.js', '.ts']);
    if (todoFixme.length > 0) {
      evidence.push({ type: 'tech_debt', status: EVIDENCE_STATUS.VERIFIED, finding: 'Found ' + todoFixme.length + ' TODO/FIXME markers', data: { markers: todoFixme.slice(0, 10) } });
    }
    const conf = syntaxErrors === 0 && checked > 0 ? 0.8 : checked > 0 ? 0.4 : 0.2;
    return { lensId: 3, lensName: 'CODE', evidence, confidence: conf };
  }

  investigateDependency(missionDescription, context = {}) {
    const evidence = [];
    const packageJson = this._readFileSafe('package.json');
    if (!packageJson) {
      evidence.push({ type: 'manifest_check', status: EVIDENCE_STATUS.UNKNOWN, finding: 'No package.json found', data: {} });
      return { lensId: 4, lensName: 'DEPENDENCY', evidence, confidence: 0.2 };
    }
    try {
      const pkg = JSON.parse(packageJson);
      const deps = Object.entries(pkg.dependencies || {});
      const devDeps = Object.entries(pkg.devDependencies || {});
      evidence.push({ type: 'dependency_manifest', status: EVIDENCE_STATUS.VERIFIED, finding: deps.length + ' production, ' + devDeps.length + ' dev dependencies', data: { prod: deps.map(([n, v]) => n + '@' + v), dev: devDeps.map(([n, v]) => n + '@' + v) } });
      const lockfile = this._fileExists('package-lock.json') || this._fileExists('yarn.lock') || this._fileExists('pnpm-lock.yaml');
      evidence.push({ type: 'lockfile_check', status: lockfile ? EVIDENCE_STATUS.VERIFIED : EVIDENCE_STATUS.PARTIAL, finding: lockfile ? 'Lockfile present' : 'No lockfile found', data: { lockfile } });
      const nodeModules = this._fileExists('node_modules');
      evidence.push({ type: 'installation_check', status: nodeModules ? EVIDENCE_STATUS.VERIFIED : EVIDENCE_STATUS.PARTIAL, finding: nodeModules ? 'node_modules present' : 'node_modules missing', data: { installed: nodeModules } });
    } catch {
      evidence.push({ type: 'manifest_parse', status: EVIDENCE_STATUS.PARTIAL, finding: 'package.json is unparseable', data: {} });
    }
    return { lensId: 4, lensName: 'DEPENDENCY', evidence, confidence: evidence.filter(e => e.status === EVIDENCE_STATUS.VERIFIED).length / Math.max(evidence.length, 1) };
  }

  investigateRuntime(missionDescription, context = {}) {
    const evidence = [];
    const uncaughtHandlers = this._grepInFiles('uncaughtException|unhandledRejection|process\\.on', 'src', ['.js', '.ts']);
    evidence.push({ type: 'process_handlers', status: EVIDENCE_STATUS.PARTIAL, finding: 'Found ' + uncaughtHandlers.length + ' process-level error handlers', data: { handlers: uncaughtHandlers.slice(0, 5) } });
    const asyncPatterns = this._grepInFiles('async|await|Promise', 'src', ['.js', '.ts']);
    evidence.push({ type: 'async_patterns', status: EVIDENCE_STATUS.PARTIAL, finding: 'Found ' + asyncPatterns.length + ' async patterns', data: { sample: asyncPatterns.slice(0, 5) } });
    const concurrency = this._grepInFiles('setInterval|setTimeout|EventEmitter|Worker', 'src', ['.js', '.ts']);
    evidence.push({ type: 'concurrency_patterns', status: EVIDENCE_STATUS.PARTIAL, finding: 'Found ' + concurrency.length + ' concurrency patterns', data: { sample: concurrency.slice(0, 5) } });
    return { lensId: 5, lensName: 'RUNTIME', evidence, confidence: 0.4 };
  }

  investigateSecurity(missionDescription, context = {}) {
    const evidence = [];
    const secrets = this._grepInFiles('password|secret|api_key|apikey|token|PRIVATE_KEY', 'src', ['.js', '.ts']);
    if (secrets.length > 0) {
      evidence.push({ type: 'secret_detection', status: EVIDENCE_STATUS.VERIFIED, finding: 'ALERT: Found ' + secrets.length + ' potential secret references', data: { matches: secrets.slice(0, 10) } });
    } else {
      evidence.push({ type: 'secret_detection', status: EVIDENCE_STATUS.VERIFIED, finding: 'No obvious secret literals found in source', data: {} });
    }
    const envFiles = this._fileExists('.env') || this._fileExists('.env.local') || this._fileExists('.env.production');
    evidence.push({ type: 'env_file_check', status: EVIDENCE_STATUS.VERIFIED, finding: envFiles ? '.env files exist' : 'No .env files in workspace root', data: { envFiles } });
    const injections = this._grepInFiles('eval\\(|exec\\(|innerHTML|dangerouslySetInnerHTML', 'src', ['.js', '.ts', '.jsx', '.tsx']);
    if (injections.length > 0) {
      evidence.push({ type: 'injection_vectors', status: EVIDENCE_STATUS.VERIFIED, finding: 'Found ' + injections.length + ' potential injection vectors', data: { matches: injections.slice(0, 10) } });
    } else {
      evidence.push({ type: 'injection_vectors', status: EVIDENCE_STATUS.VERIFIED, finding: 'No obvious injection patterns found', data: {} });
    }
    return { lensId: 7, lensName: 'SECURITY', evidence, confidence: 0.6 };
  }

  investigatePerformance(missionDescription, context = {}) {
    const evidence = [];
    const loops = this._grepInFiles('for \\(|forEach|\\.map\\(|\\.filter\\(', 'src', ['.js', '.ts']);
    evidence.push({ type: 'loop_patterns', status: EVIDENCE_STATUS.PARTIAL, finding: 'Found ' + loops.length + ' loop/iteration patterns', data: { sample: loops.slice(0, 5) } });
    const caching = this._grepInFiles('cache|memoize|localStorage|sessionStorage', 'src', ['.js', '.ts']);
    evidence.push({ type: 'caching_signal', status: EVIDENCE_STATUS.PARTIAL, finding: 'Found ' + caching.length + ' caching patterns', data: { sample: caching.slice(0, 5) } });
    const largeFiles = this._scanDir('src', ['.js', '.ts']).filter(f => f.size > 50000);
    if (largeFiles.length > 0) {
      evidence.push({ type: 'large_files', status: EVIDENCE_STATUS.VERIFIED, finding: 'Found ' + largeFiles.length + ' files over 50KB', data: { files: largeFiles.map(f => ({ path: f.relative, size: f.size })) } });
    }
    return { lensId: 8, lensName: 'PERFORMANCE', evidence, confidence: 0.4 };
  }

  investigateRegression(missionDescription, context = {}) {
    const evidence = [];
    const testFiles = this._scanDir('.', ['.test.js', '.test.ts', '.spec.js', '.spec.ts']);
    evidence.push({ type: 'test_coverage_scan', status: EVIDENCE_STATUS.VERIFIED, finding: 'Found ' + testFiles.length + ' test files', data: { files: testFiles.map(f => f.relative) } });
    if (context.targetFiles) {
      for (const tf of context.targetFiles) {
        const base = path.basename(tf).replace(/\.[^.]+$/, '');
        const relatedTests = testFiles.filter(t => t.relative.toLowerCase().includes(base.toLowerCase()));
        evidence.push({ type: 'target_test_mapping', status: relatedTests.length > 0 ? EVIDENCE_STATUS.VERIFIED : EVIDENCE_STATUS.PARTIAL, finding: tf + ' -> ' + relatedTests.length + ' related test files', data: { target: tf, tests: relatedTests.map(t => t.relative) } });
      }
    }
    return { lensId: 9, lensName: 'REGRESSION', evidence, confidence: testFiles.length > 0 ? 0.7 : 0.3 };
  }

  investigateBusiness(missionDescription, context = {}) {
    const evidence = [];
    const readme = this._readFileSafe('README.md');
    if (readme) {
      const missionWords = missionDescription.toLowerCase().split(/\s+/).filter(w => w.length > 3);
      const matches = missionWords.filter(w => readme.toLowerCase().includes(w));
      evidence.push({ type: 'readme_alignment', status: EVIDENCE_STATUS.VERIFIED, finding: matches.length + '/' + missionWords.length + ' mission keywords found in README', data: { matched: matches, total: missionWords.length } });
    } else {
      evidence.push({ type: 'readme_alignment', status: EVIDENCE_STATUS.UNKNOWN, finding: 'No README.md found', data: {} });
    }
    const packageJson = this._readFileSafe('package.json');
    if (packageJson) {
      try {
        const pkg = JSON.parse(packageJson);
        evidence.push({ type: 'package_identity', status: EVIDENCE_STATUS.VERIFIED, finding: 'Package: ' + (pkg.name || 'unknown') + ' v' + (pkg.version || '0.0.0'), data: { name: pkg.name, version: pkg.version, description: pkg.description } });
      } catch {}
    }
    return { lensId: 10, lensName: 'BUSINESS', evidence, confidence: evidence.some(e => e.status === EVIDENCE_STATUS.VERIFIED) ? 0.6 : 0.3 };
  }

  investigateTruth(missionDescription, context = {}) {
    const evidence = [];
    const claims = context.claims || [];
    for (const claim of claims) {
      if (claim.type === 'file_exists') {
        const exists = this._fileExists(claim.path);
        evidence.push({ type: 'claim_verification', status: EVIDENCE_STATUS.VERIFIED, finding: 'File ' + claim.path + ': ' + (exists ? 'EXISTS' : 'MISSING'), data: { path: claim.path, exists } });
      } else if (claim.type === 'test_passing') {
        evidence.push({ type: 'claim_verification', status: EVIDENCE_STATUS.PARTIAL, finding: 'Test verification requires execution', data: { claim } });
      } else {
        evidence.push({ type: 'claim_verification', status: EVIDENCE_STATUS.UNKNOWN, finding: 'Cannot verify claim type: ' + claim.type, data: { claim } });
      }
    }
    if (claims.length === 0) {
      const testFiles = this._scanDir('.', ['.test.js', '.test.ts']);
      const hasTests = testFiles.length > 0;
      evidence.push({ type: 'evidence_infrastructure', status: hasTests ? EVIDENCE_STATUS.VERIFIED : EVIDENCE_STATUS.PARTIAL, finding: hasTests ? testFiles.length + ' test files available for verification' : 'No test files found', data: { testFiles: testFiles.length } });
    }
    return { lensId: 11, lensName: 'TRUTH', evidence, confidence: evidence.some(e => e.status === EVIDENCE_STATUS.VERIFIED) ? 0.7 : 0.3 };
  }
}

module.exports = { NazarInvestigator, EVIDENCE_STATUS };
