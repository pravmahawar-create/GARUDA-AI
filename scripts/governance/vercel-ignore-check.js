#!/usr/bin/env node
/**
 * 🦅 GARUDA Vercel Ignored Build Step Gatekeeper
 * 
 * Determines whether a commit requires a Vercel production deployment.
 * 
 * Vercel Ignored Build Step Semantics:
 * - Exit code 1: DO NOT IGNORE -> Proceed with build.
 * - Exit code 0: IGNORE -> Skip / cancel build (saves time and quota).
 * 
 * Web-Relevant Paths (Triggers Build):
 * - frontend/** (React UI, assets, pages, components)
 * - api/** (Serverless Functions)
 * - src/services/** (Backend business logic imported by api/*.js)
 * - scripts/generate-sitemap.js, scripts/generate-favicons.js, scripts/prerender-seo.js (Build scripts)
 * - scripts/governance/vercel-ignore-check.js (This script itself)
 * - vite.config.*, vercel.json, .vercelignore, package.json, package-lock.json
 * - data/proposals.json
 * 
 * Non-Web Paths (Skips Build):
 * - scripts/daemons/**, scripts/radar/**, scripts/scratch/**, scripts/mother/**
 * - social-engine/**, backend-node/**, sanatan-setu-app/**, garuda-*-app/**
 * - projects/**, GARUDA_BIBLE/**, docs/**, *.md, tests/**
 */

const { execSync } = require("child_process");

const WEB_RELEVANT_PATTERNS = [
  /^frontend\//,
  /^api\//,
  /^src\/services\//,
  /^scripts\/generate-sitemap\.js$/,
  /^scripts\/generate-favicons\.js$/,
  /^scripts\/prerender-seo\.js$/,
  /^scripts\/governance\/vercel-ignore-check\.js$/,
  /^vite\.config\./,
  /^vercel\.json$/,
  /^\.vercelignore$/,
  /^package\.json$/,
  /^package-lock\.json$/,
  /^data\/proposals\.json$/
];

const SKIP_KEYWORDS = [
  "[skip vercel]",
  "[vercel skip]",
  "[skip ci]",
  "[ci skip]"
];

function runGit(cmd) {
  try {
    return execSync(cmd, { encoding: "utf8", stdio: ["pipe", "pipe", "ignore"] }).trim();
  } catch (err) {
    return null;
  }
}

function shouldBuild() {
  console.log("🦅 [GARUDA VERCEL BUILD GATE] Evaluating commit diff...");

  // 1. Check commit message for explicit skip directives
  const commitMsg = process.env.VERCEL_GIT_COMMIT_MESSAGE || runGit("git log -1 --pretty=%B") || "";
  for (const kw of SKIP_KEYWORDS) {
    if (commitMsg.toLowerCase().includes(kw)) {
      console.log(`🛑 [GARUDA VERCEL BUILD GATE] Explicit skip tag detected: "${kw}". Skipping build.`);
      return false; // Exit 0 -> Skip
    }
  }

  // 2. Identify diff target (Vercel provides commit SHAs via env or we use HEAD~1 HEAD)
  let diffRange = "HEAD~1 HEAD";
  const prevSha = process.env.VERCEL_GIT_PREVIOUS_SHA;
  const currentSha = process.env.VERCEL_GIT_COMMIT_SHA;

  if (prevSha && currentSha && prevSha !== currentSha) {
    diffRange = `${prevSha} ${currentSha}`;
  }

  const rawDiff = runGit(`git diff --name-only ${diffRange}`);
  if (!rawDiff) {
    console.log("⚠️ [GARUDA VERCEL BUILD GATE] Unable to compute git diff (first commit, shallow clone, or empty diff).");
    console.log("🛡️ Fail-safe: Proceeding with build to avoid dropping changes.");
    return true; // Exit 1 -> Build
  }

  const changedFiles = rawDiff.split("\n").map(f => f.trim()).filter(Boolean);
  if (changedFiles.length === 0) {
    console.log("ℹ️ [GARUDA VERCEL BUILD GATE] No changed files in diff. Skipping build.");
    return false; // Exit 0 -> Skip
  }

  const webChanges = [];
  const skippedChanges = [];

  for (const file of changedFiles) {
    const isWeb = WEB_RELEVANT_PATTERNS.some(regex => regex.test(file));
    if (isWeb) {
      webChanges.push(file);
    } else {
      skippedChanges.push(file);
    }
  }

  if (webChanges.length > 0) {
    console.log(`✅ [GARUDA VERCEL BUILD GATE] Web-relevant changes detected (${webChanges.length} files):`);
    webChanges.slice(0, 5).forEach(f => console.log(`   + ${f}`));
    if (webChanges.length > 5) console.log(`   ... and ${webChanges.length - 5} more`);
    console.log("🚀 Proceeding with Vercel deployment.");
    return true; // Exit 1 -> Build
  }

  console.log(`🛑 [GARUDA VERCEL BUILD GATE] All ${changedFiles.length} changes are non-web paths:`);
  skippedChanges.slice(0, 5).forEach(f => console.log(`   - ${f}`));
  if (skippedChanges.length > 5) console.log(`   ... and ${skippedChanges.length - 5} more`);
  console.log("⚡ Skipping Vercel build (0 seconds consumed).");
  return false; // Exit 0 -> Skip
}

try {
  const proceedWithBuild = shouldBuild();
  // Vercel exit code convention:
  // 1 = DO NOT IGNORE (Build)
  // 0 = IGNORE (Skip)
  process.exit(proceedWithBuild ? 1 : 0);
} catch (err) {
  console.warn("⚠️ [GARUDA VERCEL BUILD GATE] Error in check:", err.message);
  console.log("🛡️ Fail-safe: Defaulting to BUILD.");
  process.exit(1);
}
