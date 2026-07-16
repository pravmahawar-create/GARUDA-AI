const fs = require("fs");
const path = require("path");
const { GarudaBibleLoader, REQUIRED_CHAPTER_IDS } = require("./GarudaBibleLoader");

const VALID_STATUSES = new Set(["active", "draft", "deprecated", "locked", "planned"]);
const VALID_AUTHORITY = new Set([
  "constitution",
  "founder_locked",
  "architecture",
  "roadmap",
  "historical_report"
]);

function normalizePath(filePath) {
  return filePath.replace(/\\/g, "/");
}

class GarudaBibleValidator {
  constructor(options = {}) {
    this.basePath = options.basePath || path.join(process.cwd(), "GARUDA_BIBLE");
    this.schemaPath = options.schemaPath || path.join(this.basePath, "schema");
    this.loader = options.loader || new GarudaBibleLoader({ basePath: this.basePath });
  }

  _push(report, level, code, message, details = {}) {
    report.messages.push({ level, code, message, details });
    if (level === "error") {
      report.summary.errors += 1;
    } else if (level === "warning") {
      report.summary.warnings += 1;
    }
  }

  _checkSchemaFiles(report) {
    const required = [
      "garuda-bible.schema.json",
      "garuda-chapter.schema.json",
      "brain-definition.schema.json",
      "worker-definition.schema.json",
      "decision-record.schema.json"
    ];

    required.forEach((fileName) => {
      const filePath = path.join(this.schemaPath, fileName);
      if (!fs.existsSync(filePath)) {
        this._push(report, "error", "SCHEMA_MISSING", `Missing schema file: ${fileName}`, {
          path: normalizePath(filePath)
        });
        return;
      }

      try {
        JSON.parse(fs.readFileSync(filePath, "utf8"));
      } catch (error) {
        this._push(report, "error", "SCHEMA_INVALID_JSON", `Invalid schema JSON: ${fileName}`, {
          path: normalizePath(filePath),
          reason: error.message
        });
      }
    });
  }

  _validateChapterFields(report, chapter) {
    const requiredFields = [
      "schemaVersion",
      "bibleVersion",
      "chapterId",
      "title",
      "status",
      "authorityLevel",
      "sourceReferences",
      "rules"
    ];

    requiredFields.forEach((fieldName) => {
      if (chapter[fieldName] === undefined || chapter[fieldName] === null) {
        this._push(report, "error", "REQUIRED_FIELD_MISSING", `Missing required field ${fieldName}`, {
          chapterId: chapter.chapterId,
          sourcePath: chapter.sourcePath
        });
      }
    });

    if (chapter.status && !VALID_STATUSES.has(String(chapter.status).toLowerCase())) {
      this._push(report, "error", "INVALID_STATUS", `Invalid chapter status: ${chapter.status}`, {
        chapterId: chapter.chapterId,
        sourcePath: chapter.sourcePath
      });
    }

    if (chapter.authorityLevel && !VALID_AUTHORITY.has(String(chapter.authorityLevel).toLowerCase())) {
      this._push(report, "error", "INVALID_AUTHORITY_LEVEL", `Invalid authorityLevel: ${chapter.authorityLevel}`, {
        chapterId: chapter.chapterId,
        sourcePath: chapter.sourcePath
      });
    }

    if (!Array.isArray(chapter.sourceReferences)) {
      this._push(report, "error", "INVALID_SOURCE_REFERENCES", "sourceReferences must be an array", {
        chapterId: chapter.chapterId,
        sourcePath: chapter.sourcePath
      });
    }

    if (!Array.isArray(chapter.rules)) {
      this._push(report, "error", "INVALID_RULES", "rules must be an array", {
        chapterId: chapter.chapterId,
        sourcePath: chapter.sourcePath
      });
    }
  }

  _validateMarkdownPartner(report, chapter) {
    const markdownPath = path.join(this.basePath, `${chapter.chapterId}.md`);
    if (!fs.existsSync(markdownPath)) {
      this._push(report, "error", "MISSING_MARKDOWN_PARTNER", `Missing Markdown partner for ${chapter.chapterId}`, {
        chapterId: chapter.chapterId,
        expectedPath: normalizePath(markdownPath)
      });
    }
  }

  _validateDuplicateChapterIds(report, chapters) {
    const counts = {};

    chapters.forEach((chapter) => {
      counts[chapter.chapterId] = (counts[chapter.chapterId] || 0) + 1;
    });

    Object.keys(counts).forEach((chapterId) => {
      if (counts[chapterId] > 1) {
        this._push(report, "error", "DUPLICATE_CHAPTER_ID", `Duplicate chapterId detected: ${chapterId}`, {
          chapterId,
          occurrences: counts[chapterId]
        });
      }
    });
  }

  _validateRuleIds(report, chapters) {
    const seenRuleIds = new Map();

    chapters.forEach((chapter) => {
      if (!Array.isArray(chapter.rules)) {
        return;
      }

      chapter.rules.forEach((rule, index) => {
        const ruleId = rule && rule.ruleId ? String(rule.ruleId).trim() : "";
        if (!ruleId) {
          this._push(report, "error", "RULE_ID_MISSING", `Rule at index ${index} missing ruleId`, {
            chapterId: chapter.chapterId,
            sourcePath: chapter.sourcePath
          });
          return;
        }

        if (!seenRuleIds.has(ruleId)) {
          seenRuleIds.set(ruleId, []);
        }

        seenRuleIds.get(ruleId).push({ chapterId: chapter.chapterId, sourcePath: chapter.sourcePath });
      });
    });

    seenRuleIds.forEach((locations, ruleId) => {
      if (locations.length > 1) {
        this._push(report, "error", "DUPLICATE_RULE_ID", `Duplicate ruleId detected: ${ruleId}`, {
          ruleId,
          locations
        });
      }
    });
  }

  _validateReferences(report, chapters) {
    const chapterIds = new Set(chapters.map((chapter) => chapter.chapterId));

    chapters.forEach((chapter) => {
      if (!Array.isArray(chapter.sourceReferences)) {
        return;
      }

      chapter.sourceReferences.forEach((reference) => {
        if (!reference || typeof reference !== "object") {
          this._push(report, "warning", "SOURCE_REFERENCE_INVALID", "Source reference should be an object", {
            chapterId: chapter.chapterId,
            reference
          });
          return;
        }

        if (reference.chapterId && !chapterIds.has(String(reference.chapterId))) {
          this._push(report, "error", "BROKEN_CHAPTER_REFERENCE", `Broken chapter reference: ${reference.chapterId}`, {
            chapterId: chapter.chapterId,
            sourcePath: chapter.sourcePath,
            reference
          });
        }

        if (reference.path) {
          const abs = path.isAbsolute(reference.path)
            ? reference.path
            : path.join(process.cwd(), String(reference.path));
          if (!fs.existsSync(abs)) {
            this._push(report, "warning", "BROKEN_SOURCE_PATH", `Source path does not exist: ${reference.path}`, {
              chapterId: chapter.chapterId,
              sourcePath: chapter.sourcePath
            });
          }
        }
      });
    });
  }

  _validateVersionConsistency(report, chapters) {
    const schemaVersions = new Set();
    const bibleVersions = new Set();

    chapters.forEach((chapter) => {
      if (chapter.schemaVersion) {
        schemaVersions.add(String(chapter.schemaVersion));
      }

      if (chapter.bibleVersion) {
        bibleVersions.add(String(chapter.bibleVersion));
      }
    });

    if (schemaVersions.size > 1) {
      this._push(report, "error", "SCHEMA_VERSION_MISMATCH", "Multiple schemaVersion values found across chapters", {
        schemaVersions: Array.from(schemaVersions)
      });
    }

    if (bibleVersions.size > 1) {
      this._push(report, "error", "BIBLE_VERSION_MISMATCH", "Multiple bibleVersion values found across chapters", {
        bibleVersions: Array.from(bibleVersions)
      });
    }
  }

  _validateMasterIndex(report, chapterMap) {
    const master = chapterMap["00_MASTER_INDEX"];
    if (!master) {
      this._push(report, "error", "MASTER_INDEX_MISSING", "00_MASTER_INDEX chapter not found", {});
      return;
    }

    if (!Array.isArray(master.rules)) {
      this._push(report, "error", "MASTER_INDEX_INVALID", "00_MASTER_INDEX rules must be an array", {
        sourcePath: master.sourcePath
      });
    }
  }

  _validateRequiredChapters(report, chapterMap) {
    const missing = REQUIRED_CHAPTER_IDS.filter((chapterId) => !chapterMap[chapterId]);

    if (missing.length > 0) {
      this._push(report, "error", "REQUIRED_CHAPTERS_MISSING", "Required chapters missing", {
        missing
      });
    }
  }

  validate() {
    const report = {
      engine: "GARUDA Bible Validator v1",
      validatedAt: new Date().toISOString(),
      basePath: normalizePath(this.basePath),
      schemaPath: normalizePath(this.schemaPath),
      ok: true,
      summary: {
        chaptersChecked: 0,
        errors: 0,
        warnings: 0
      },
      messages: [],
      chapters: []
    };

    this._checkSchemaFiles(report);

    let loaded;
    try {
      loaded = this.loader.loadAll({ onlyActive: false, requireRequired: false });
    } catch (error) {
      this._push(report, "error", "LOAD_FAILED", `Bible load failed: ${error.message}`, {});
      report.ok = false;
      return report;
    }

    const chapters = loaded.chapters || [];
    const chapterMap = loaded.chapterMap || {};
    report.summary.chaptersChecked = chapters.length;

    this._validateMasterIndex(report, chapterMap);
    this._validateRequiredChapters(report, chapterMap);
    this._validateDuplicateChapterIds(report, chapters);
    this._validateRuleIds(report, chapters);
    this._validateReferences(report, chapters);
    this._validateVersionConsistency(report, chapters);

    chapters.forEach((chapter) => {
      this._validateChapterFields(report, chapter);
      this._validateMarkdownPartner(report, chapter);

      report.chapters.push({
        chapterId: chapter.chapterId,
        title: chapter.title || "Untitled",
        status: chapter.status,
        authorityLevel: chapter.authorityLevel,
        sourcePath: chapter.sourcePath
      });
    });

    report.ok = report.summary.errors === 0;
    return report;
  }
}

module.exports = GarudaBibleValidator;
module.exports.GarudaBibleValidator = GarudaBibleValidator;
