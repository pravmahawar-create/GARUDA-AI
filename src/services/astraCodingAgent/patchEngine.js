/**
 * 🦅 GARUDA PAWAN ASTRA — SURGICAL CODE MODIFICATION & PATCH ENGINE
 * 
 * Hierarchy:
 * 1. Search/Replace Block Patch (Exact & Normalized Line Matching)
 * 2. Unified Diff Patch
 * 3. Rollback & Pre-condition verification
 * 4. Fallback full rewrite only when explicitly requested
 */

const crypto = require("crypto");

function computeSha256(str) {
  if (!str) return null;
  return crypto.createHash("sha256").update(Buffer.from(str, "utf8")).digest("hex");
}

class PatchEngine {
  /**
   * Apply a surgical Search/Replace block patch to content
   * @param {string} originalContent - The full original file text
   * @param {string} searchBlock - The exact snippet to replace
   * @param {string} replaceBlock - The new replacement snippet
   * @param {object} options - { allowMultiple: false }
   */
  applySearchReplace(originalContent, searchBlock, replaceBlock, options = {}) {
    if (typeof originalContent !== "string") {
      return { success: false, error: "originalContent must be a string" };
    }
    if (!searchBlock || typeof searchBlock !== "string") {
      return { success: false, error: "searchBlock must be a non-empty string" };
    }
    const allowMultiple = !!options.allowMultiple;
    const beforeSha = computeSha256(originalContent);

    // 1. Exact Substring Match
    if (originalContent.includes(searchBlock)) {
      const occurrences = originalContent.split(searchBlock).length - 1;
      if (occurrences > 1 && !allowMultiple) {
        return {
          success: false,
          error: `Ambiguous searchBlock: found ${occurrences} occurrences. Provide more surrounding context to disambiguate.`
        };
      }
      const newContent = allowMultiple
        ? originalContent.split(searchBlock).join(replaceBlock)
        : originalContent.replace(searchBlock, replaceBlock);

      return {
        success: true,
        method: "exact_substring",
        beforeSha,
        afterSha: computeSha256(newContent),
        newContent,
        bytesDelta: Buffer.byteLength(newContent) - Buffer.byteLength(originalContent),
        occurrencesReplaced: allowMultiple ? occurrences : 1
      };
    }

    // 2. Line-Ending Normalized Match (\r\n vs \n)
    const normOriginal = originalContent.replace(/\r\n/g, "\n");
    const normSearch = searchBlock.replace(/\r\n/g, "\n");
    const normReplace = (replaceBlock || "").replace(/\r\n/g, "\n");

    if (normOriginal.includes(normSearch)) {
      const occurrences = normOriginal.split(normSearch).length - 1;
      if (occurrences > 1 && !allowMultiple) {
        return {
          success: false,
          error: `Ambiguous searchBlock after normalization: found ${occurrences} occurrences.`
        };
      }
      const newContent = allowMultiple
        ? normOriginal.split(normSearch).join(normReplace)
        : normOriginal.replace(normSearch, normReplace);

      return {
        success: true,
        method: "normalized_newline",
        beforeSha,
        afterSha: computeSha256(newContent),
        newContent,
        bytesDelta: Buffer.byteLength(newContent) - Buffer.byteLength(originalContent),
        occurrencesReplaced: allowMultiple ? occurrences : 1
      };
    }

    // 3. Trimmed Line-by-Line Sliding Window Match (Tolerates indentation shifts)
    const origLines = normOriginal.split("\n");
    const searchLines = normSearch.split("\n").filter((l, i, arr) => {
      // Keep non-empty or internal empty lines, but trim outer edge blank lines
      return !( (i === 0 || i === arr.length - 1) && l.trim() === "" );
    });

    if (searchLines.length > 0) {
      const matchIndices = [];
      for (let i = 0; i <= origLines.length - searchLines.length; i++) {
        let allMatch = true;
        for (let j = 0; j < searchLines.length; j++) {
          if (origLines[i + j].trim() !== searchLines[j].trim()) {
            allMatch = false;
            break;
          }
        }
        if (allMatch) {
          matchIndices.push(i);
        }
      }

      if (matchIndices.length === 1) {
        const startLine = matchIndices[0];
        const deleteCount = searchLines.length;
        const replaceLines = normReplace.split("\n");
        const newLines = [...origLines];
        newLines.splice(startLine, deleteCount, ...replaceLines);
        const newContent = newLines.join("\n");

        return {
          success: true,
          method: "trimmed_sliding_window",
          beforeSha,
          afterSha: computeSha256(newContent),
          newContent,
          startLine: startLine + 1,
          linesReplaced: deleteCount,
          bytesDelta: Buffer.byteLength(newContent) - Buffer.byteLength(originalContent)
        };
      }

      if (matchIndices.length > 1 && !allowMultiple) {
        return {
          success: false,
          error: `Ambiguous searchBlock in trimmed mode: found ${matchIndices.length} matches. Include more unique surrounding lines.`
        };
      }
    }

    return {
      success: false,
      error: "searchBlock not found in target content. Context mismatch.",
      beforeSha
    };
  }

  /**
   * Parse LLM search/replace blocks formatted as:
   * <<<<<<< SEARCH
   * ...
   * =======
   * ...
   * >>>>>>> REPLACE
   */
  parseDiffBlocks(rawDiffText) {
    if (!rawDiffText) return [];
    const blockRegex = /<<<<<<< SEARCH\r?\n([\s\S]*?)\r?\n=======\r?\n([\s\S]*?)\r?\n>>>>>>> REPLACE/g;
    const blocks = [];
    let m;
    while ((m = blockRegex.exec(rawDiffText)) !== null) {
      blocks.push({
        search: m[1],
        replace: m[2]
      });
    }
    return blocks;
  }

  /**
   * Apply multiple search/replace blocks sequentially
   */
  applyMultiplePatches(originalContent, patchBlocks) {
    let currentContent = originalContent;
    const applied = [];

    for (let i = 0; i < patchBlocks.length; i++) {
      const block = patchBlocks[i];
      const res = this.applySearchReplace(currentContent, block.search, block.replace);
      if (!res.success) {
        return {
          success: false,
          error: `Patch block #${i + 1} failed: ${res.error}`,
          blockIndex: i,
          appliedCount: applied.length,
          partiallyPatchedContent: currentContent
        };
      }
      currentContent = res.newContent;
      applied.push({ index: i, method: res.method, afterSha: res.afterSha });
    }

    return {
      success: true,
      newContent: currentContent,
      patchesApplied: applied.length,
      beforeSha: computeSha256(originalContent),
      afterSha: computeSha256(currentContent)
    };
  }
}

module.exports = { PatchEngine, computeSha256 };
