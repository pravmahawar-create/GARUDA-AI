const crypto = require('crypto');

const INTELLIGENCE_TYPES = {
  EXPERIENCE: 'experience',
  LESSON: 'lesson',
  RULE: 'rule',
  CAPABILITY: 'capability',
  CANON: 'canon'
};

const PROMOTION_HIERARCHY = [
  INTELLIGENCE_TYPES.EXPERIENCE,
  INTELLIGENCE_TYPES.LESSON,
  INTELLIGENCE_TYPES.RULE,
  INTELLIGENCE_TYPES.CAPABILITY,
  INTELLIGENCE_TYPES.CANON
];

const VERIFICATION_STATUS = {
  UNVERIFIED: 'UNVERIFIED',
  PARTIAL: 'PARTIAL',
  VERIFIED: 'VERIFIED',
  REJECTED: 'REJECTED',
  CONFLICTED: 'CONFLICTED',
  SUPERSEDED: 'SUPERSEDED'
};

const SCOPE = {
  AGENT_LOCAL: 'agent_local',
  MISSION_SPECIFIC: 'mission_specific',
  PROJECT_WIDE: 'project_wide',
  GARUDA_WIDE: 'garuda_wide',
  CANONICAL: 'canonical'
};

function generateId() {
  const ts = Date.now().toString(36);
  const rand = crypto.randomBytes(4).toString('hex');
  return `int-${ts}-${rand}`;
}

function createIntelligenceItem({
  type,
  content,
  sourceAgent,
  sourceMission,
  scope = SCOPE.AGENT_LOCAL,
  evidence = [],
  confidence = 0.5,
  relatedFiles = [],
  relatedCapabilities = [],
  relatedFailures = [],
  supersedes = null,
  conflictsWith = [],
  tags = [],
  metadata = {}
}) {
  if (!PROMOTION_HIERARCHY.includes(type)) {
    throw new Error(`Invalid intelligence type: ${type}. Must be one of: ${PROMOTION_HIERARCHY.join(', ')}`);
  }
  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    throw new Error('Intelligence item must have non-empty content');
  }

  return {
    id: generateId(),
    type,
    content: content.trim(),
    sourceAgent: sourceAgent || 'unknown',
    sourceMission: sourceMission || null,
    timestamp: new Date().toISOString(),
    scope,
    evidence: Array.isArray(evidence) ? evidence : [evidence],
    verificationStatus: VERIFICATION_STATUS.UNVERIFIED,
    confidence: Math.max(0, Math.min(1, confidence)),
    relatedFiles: Array.isArray(relatedFiles) ? relatedFiles : [relatedFiles],
    relatedCapabilities: Array.isArray(relatedCapabilities) ? relatedCapabilities : [relatedCapabilities],
    relatedFailures: Array.isArray(relatedFailures) ? relatedFailures : [relatedFailures],
    supersedes,
    conflictsWith: Array.isArray(conflictsWith) ? conflictsWith : [conflictsWith],
    tags: Array.isArray(tags) ? tags : [tags],
    createdBy: sourceAgent || 'unknown',
    validatedBy: null,
    version: 1,
    metadata: { ...metadata, createdAt: new Date().toISOString() }
  };
}

function canPromote(fromType, toType) {
  const fromIdx = PROMOTION_HIERARCHY.indexOf(fromType);
  const toIdx = PROMOTION_HIERARCHY.indexOf(toType);
  if (fromIdx === -1 || toIdx === -1) return false;
  return toIdx === fromIdx + 1;
}

function promoteItem(item, promotedBy, evidence = []) {
  const nextIdx = PROMOTION_HIERARCHY.indexOf(item.type) + 1;
  if (nextIdx >= PROMOTION_HIERARCHY.length) {
    throw new Error(`Cannot promote ${item.type} further — already at CANON level`);
  }
  return {
    ...item,
    type: PROMOTION_HIERARCHY[nextIdx],
    version: item.version + 1,
    validatedBy: promotedBy,
    evidence: [...item.evidence, ...evidence],
    metadata: {
      ...item.metadata,
      promotedAt: new Date().toISOString(),
      promotedFrom: item.type,
      promotedBy
    }
  };
}

module.exports = {
  INTELLIGENCE_TYPES,
  PROMOTION_HIERARCHY,
  VERIFICATION_STATUS,
  SCOPE,
  generateId,
  createIntelligenceItem,
  canPromote,
  promoteItem
};
