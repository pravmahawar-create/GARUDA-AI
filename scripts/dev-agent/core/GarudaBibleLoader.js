const fs = require("fs");
const path = require("path");

const REQUIRED_CHAPTER_IDS = [
  "00_MASTER_INDEX",
  "01_IDENTITY",
  "02_CONSTITUTION",
  "03_FOUNDER_PRINCIPLES",
  "04_SYSTEM_ARCHITECTURE",
  "05_BRAIN_STANDARD",
  "06_WORKER_STANDARD",
  "07_ENGINEERING_STANDARD",
  "08_MEMORY_STANDARD",
  "09_ROADMAP",
  "10_DECISION_REGISTRY"
];

function normalizePath(filePath) {
  return filePath.replace(/\\/g, "/");
}

class GarudaBibleLoader {
  constructor(options = {}) {
    this.basePath = options.basePath || path.join(process.cwd(), "GARUDA_BIBLE");
    this.requiredChapterIds = options.requiredChapterIds || REQUIRED_CHAPTER_IDS.slice();
  }

  _assertBibleFolderExists() {
    if (!fs.existsSync(this.basePath)) {
      throw new Error(`GARUDA_BIBLE folder not found at ${this.basePath}`);
    }
  }

  _safeReadJson(filePath) {
    let raw;

    try {
      raw = fs.readFileSync(filePath, "utf8");
    } catch (error) {
      throw new Error(`Unable to read JSON file: ${normalizePath(filePath)} (${error.message})`);
    }

    try {
      return JSON.parse(raw);
    } catch (error) {
      throw new Error(`Invalid JSON syntax: ${normalizePath(filePath)} (${error.message})`);
    }
  }

  _chapterIdFromFilename(filePath) {
    return path.basename(filePath, ".json").trim();
  }

  _findChapterFiles() {
    this._assertBibleFolderExists();

    return fs
      .readdirSync(this.basePath, { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
      .filter((entry) => entry.name !== "package.json")
      .map((entry) => path.join(this.basePath, entry.name))
      .sort();
  }

  _readChapterById(chapterId) {
    const normalizedId = String(chapterId || "").trim();
    if (!normalizedId) {
      throw new Error("Chapter ID is required.");
    }

    const filePath = path.join(this.basePath, `${normalizedId}.json`);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Chapter not found: ${normalizedId} (${normalizePath(filePath)})`);
    }

    const chapter = this._safeReadJson(filePath);
    return this._normalizeChapter(chapter, filePath);
  }

  _normalizeChapter(chapter, filePath) {
    const chapterId = String(chapter.chapterId || this._chapterIdFromFilename(filePath)).trim();

    if (!chapterId) {
      throw new Error(`Chapter ID missing for ${normalizePath(filePath)}`);
    }

    const status = String(chapter.status || "draft").trim().toLowerCase();

    return {
      ...chapter,
      chapterId,
      status,
      sourcePath: normalizePath(path.relative(process.cwd(), filePath) || filePath),
      sourceAbsolutePath: normalizePath(filePath)
    };
  }

  _indexByChapterId(chapters) {
    const map = new Map();

    chapters.forEach((chapter) => {
      if (!map.has(chapter.chapterId)) {
        map.set(chapter.chapterId, chapter);
      }
    });

    return map;
  }

  _assertRequiredChaptersPresent(chapterMap) {
    const missing = this.requiredChapterIds.filter((chapterId) => !chapterMap.has(chapterId));

    if (missing.length > 0) {
      throw new Error(`Missing required chapters: ${missing.join(", ")}`);
    }
  }

  loadMasterIndex() {
    this._assertBibleFolderExists();

    const filePath = path.join(this.basePath, "00_MASTER_INDEX.json");
    if (!fs.existsSync(filePath)) {
      throw new Error(`Missing required chapter: 00_MASTER_INDEX (${normalizePath(filePath)})`);
    }

    const chapter = this._safeReadJson(filePath);
    const normalized = this._normalizeChapter(chapter, filePath);

    return {
      chapter: normalized,
      sourcePath: normalized.sourcePath,
      sourceAbsolutePath: normalized.sourceAbsolutePath
    };
  }

  loadChapter(chapterId, options = {}) {
    const targetId = String(chapterId || "").trim();
    if (!targetId) {
      throw new Error("loadChapter requires a chapterId.");
    }

    const allowInactive = options.allowInactive !== false;
    const chapter = this._readChapterById(targetId);

    if (!allowInactive && chapter.status !== "active") {
      throw new Error(`Chapter is not active: ${targetId} (${chapter.status})`);
    }

    const master = this.loadMasterIndex();

    return {
      chapter,
      version: {
        bibleVersion: String(master.chapter.bibleVersion || "unknown"),
        schemaVersion: String(master.chapter.schemaVersion || "unknown")
      },
      sourcePaths: [chapter.sourcePath]
    };
  }

  loadAll(options = {}) {
    const onlyActive = options.onlyActive === true;
    const requestedChapterIds = Array.isArray(options.requestedChapterIds)
      ? options.requestedChapterIds.map((value) => String(value).trim()).filter(Boolean)
      : null;
    const mandatoryChapterIds = Array.isArray(options.mandatoryChapterIds)
      ? options.mandatoryChapterIds.map((value) => String(value).trim()).filter(Boolean)
      : [];
    const requireRequired = options.requireRequired !== false;

    const masterIndex = this.loadMasterIndex();
    const chapters = requestedChapterIds && requestedChapterIds.length > 0
      ? requestedChapterIds.map((chapterId) => this._readChapterById(chapterId))
      : this._findChapterFiles().map((filePath) => this._normalizeChapter(this._safeReadJson(filePath), filePath));
    const chapterIndex = this._indexByChapterId(chapters);

    if (requireRequired && (!requestedChapterIds || requestedChapterIds.length === 0)) {
      this._assertRequiredChaptersPresent(chapterIndex);
    }

    if (mandatoryChapterIds.length > 0) {
      const missingMandatory = mandatoryChapterIds.filter((chapterId) => !chapterIndex.has(chapterId));
      if (missingMandatory.length > 0) {
        throw new Error(`Missing mandatory chapters: ${missingMandatory.join(", ")}`);
      }
    }

    if (requestedChapterIds && requestedChapterIds.length > 0) {
      const missingRequested = requestedChapterIds.filter((id) => !chapterIndex.has(id));
      if (missingRequested.length > 0) {
        throw new Error(`Requested chapters not found: ${missingRequested.join(", ")}`);
      }
    }

    let selected = chapters.slice();

    if (requestedChapterIds && requestedChapterIds.length > 0) {
      const requestedSet = new Set(requestedChapterIds);
      selected = selected.filter((chapter) => requestedSet.has(chapter.chapterId));
    }

    if (onlyActive) {
      selected = selected.filter((chapter) => chapter.status === "active");
    }

    const chapterMap = {};
    selected.forEach((chapter) => {
      chapterMap[chapter.chapterId] = chapter;
    });

    const sourcePaths = selected.map((chapter) => chapter.sourcePath);

    return {
      engine: "GARUDA Bible Loader v1",
      loadedAt: new Date().toISOString(),
      basePath: normalizePath(this.basePath),
      masterIndexPath: masterIndex.sourcePath,
      version: {
        bibleVersion: String(masterIndex.chapter.bibleVersion || "unknown"),
        schemaVersion: String(masterIndex.chapter.schemaVersion || "unknown")
      },
      sourcePaths,
      masterIndex: masterIndex.chapter,
      chapters: selected,
      chapterMap
    };
  }

  loadCompactContext(options = {}) {
    const payload = this.loadAll({
      onlyActive: options.onlyActive !== false,
      requestedChapterIds: options.requestedChapterIds,
      mandatoryChapterIds: options.mandatoryChapterIds,
      requireRequired: options.requireRequired !== false
    });

    const mergedRules = payload.chapters
      .flatMap((chapter) => (Array.isArray(chapter.rules) ? chapter.rules : []))
      .map((rule) => ({ ...rule }));

    return {
      engine: "GARUDA Bible Loader v1",
      type: "compact_context",
      loadedAt: payload.loadedAt,
      version: payload.version,
      sourcePaths: payload.sourcePaths,
      chapterCount: payload.chapters.length,
      rulesCount: mergedRules.length,
      rules: mergedRules,
      chapterSummaries: payload.chapters.map((chapter) => ({
        chapterId: chapter.chapterId,
        title: chapter.title || "Untitled",
        status: chapter.status,
        authorityLevel: chapter.authorityLevel || "unspecified"
      }))
    };
  }

  loadWorkerContext(brainType, options = {}) {
    const worker = String(brainType || "").trim().toLowerCase();
    if (!worker) {
      throw new Error("loadWorkerContext requires a worker or brain identifier.");
    }

    const requested = options.requestedChapterIds || [
      "02_CONSTITUTION",
      "03_FOUNDER_PRINCIPLES",
      "05_BRAIN_STANDARD",
      "06_WORKER_STANDARD",
      "07_ENGINEERING_STANDARD"
    ];

    const compact = this.loadCompactContext({
      requestedChapterIds: requested,
      onlyActive: true,
      requireRequired: options.requireRequired !== false
    });

    const workerRules = compact.rules.filter((rule) => {
      const appliesTo = Array.isArray(rule.appliesTo)
        ? rule.appliesTo.map((value) => String(value).toLowerCase())
        : [];

      return appliesTo.length === 0 || appliesTo.includes("all") || appliesTo.includes(worker);
    });

    return {
      engine: "GARUDA Bible Loader v1",
      type: "worker_context",
      worker,
      version: compact.version,
      sourcePaths: compact.sourcePaths,
      authorityChain: [
        "Constitution",
        "Founder Locked Decisions",
        "Current Architecture",
        "Roadmap",
        "Historical Reports"
      ],
      rulesCount: workerRules.length,
      rules: workerRules
    };
  }

  loadMotherContext(options = {}) {
    const requested = options.requestedChapterIds || [
      "01_IDENTITY",
      "02_CONSTITUTION",
      "03_FOUNDER_PRINCIPLES",
      "04_SYSTEM_ARCHITECTURE",
      "07_ENGINEERING_STANDARD",
      "08_MEMORY_STANDARD",
      "10_DECISION_REGISTRY"
    ];

    const compact = this.loadCompactContext({
      requestedChapterIds: requested,
      onlyActive: true,
      requireRequired: options.requireRequired !== false
    });

    return {
      engine: "GARUDA Bible Loader v1",
      type: "mother_context",
      version: compact.version,
      sourcePaths: compact.sourcePaths,
      chapterCount: compact.chapterCount,
      rulesCount: compact.rulesCount,
      authorityChain: [
        "Constitution",
        "Founder Locked Decisions",
        "Current Architecture",
        "Roadmap",
        "Historical Reports"
      ],
      chapters: compact.chapterSummaries,
      rules: compact.rules
    };
  }
}

module.exports = GarudaBibleLoader;
module.exports.GarudaBibleLoader = GarudaBibleLoader;
module.exports.REQUIRED_CHAPTER_IDS = REQUIRED_CHAPTER_IDS;
