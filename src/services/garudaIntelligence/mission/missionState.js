const fs = require('fs');
const path = require('path');
const { generateId } = require('../intelligenceSchema');

const MISSION_STAGES = {
  INITIALIZED: 'INITIALIZED',
  UNDERSTANDING: 'UNDERSTANDING',
  INTELLIGENCE_SEARCH: 'INTELLIGENCE_SEARCH',
  REPOSITORY_SEARCH: 'REPOSITORY_SEARCH',
  PLANNING: 'PLANNING',
  NAZAR_INVESTIGATION: 'NAZAR_INVESTIGATION',
  EXECUTING: 'EXECUTING',
  TESTING: 'TESTING',
  POST_BUILD_AUDIT: 'POST_BUILD_AUDIT',
  EVIDENCE_COLLECTION: 'EVIDENCE_COLLECTION',
  LEARNING: 'LEARNING',
  COMPLETE: 'COMPLETE',
  FAILED: 'FAILED',
  PAUSED: 'PAUSED'
};

const MISSION_DATA_DIR = path.join(process.cwd(), 'data', 'intelligence', 'missions');

class MissionState {
  constructor(options = {}) {
    this.dataDir = options.dataDir || MISSION_DATA_DIR;
    this._ensureDataDir();
  }

  _ensureDataDir() {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
  }

  createMission(goal, options = {}) {
    const mission = {
      missionId: `mission-${Date.now().toString(36)}-${generateId().substring(4, 8)}`,
      goal,
      plan: options.plan || null,
      currentStage: MISSION_STAGES.INITIALIZED,
      completedStages: [],
      pendingStages: Object.values(MISSION_STAGES).filter(s => s !== MISSION_STAGES.INITIALIZED),
      decisions: [],
      evidence: [],
      artifacts: [],
      failures: [],
      retries: [],
      learningCandidates: [],
      finalResult: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      checkpointHistory: [],
      context: {
        currentGoal: goal,
        currentPlan: null,
        currentFacts: [],
        constraints: options.constraints || [],
        nextAction: null
      }
    };
    this._saveMission(mission);
    return mission;
  }

  loadMission(missionId) {
    const filePath = path.join(this.dataDir, `${missionId}.json`);
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  }

  _saveMission(mission) {
    const filePath = path.join(this.dataDir, `${mission.missionId}.json`);
    mission.updatedAt = new Date().toISOString();
    fs.writeFileSync(filePath, JSON.stringify(mission, null, 2), 'utf-8');
  }

  transitionStage(missionId, newStage, evidence = null) {
    const mission = this.loadMission(missionId);
    if (!mission) return { error: `Mission ${missionId} not found` };
    const currentStage = mission.currentStage;
    mission.completedStages.push({
      stage: currentStage,
      completedAt: new Date().toISOString(),
      evidence
    });
    mission.currentStage = newStage;
    mission.pendingStages = mission.pendingStages.filter(s => s !== newStage);
    mission.updatedAt = new Date().toISOString();
    this._saveMission(mission);
    return { success: true, from: currentStage, to: newStage, missionId };
  }

  addDecision(missionId, decision) {
    const mission = this.loadMission(missionId);
    if (!mission) return { error: `Mission ${missionId} not found` };
    mission.decisions.push({
      ...decision,
      timestamp: new Date().toISOString()
    });
    mission.updatedAt = new Date().toISOString();
    this._saveMission(mission);
    return { success: true, decisionCount: mission.decisions.length };
  }

  addEvidence(missionId, evidence) {
    const mission = this.loadMission(missionId);
    if (!mission) return { error: `Mission ${missionId} not found` };
    mission.evidence.push({
      ...evidence,
      timestamp: new Date().toISOString()
    });
    mission.updatedAt = new Date().toISOString();
    this._saveMission(mission);
    return { success: true, evidenceCount: mission.evidence.length };
  }

  addArtifact(missionId, artifact) {
    const mission = this.loadMission(missionId);
    if (!mission) return { error: `Mission ${missionId} not found` };
    mission.artifacts.push({
      ...artifact,
      timestamp: new Date().toISOString()
    });
    mission.updatedAt = new Date().toISOString();
    this._saveMission(mission);
    return { success: true, artifactCount: mission.artifacts.length };
  }

  recordFailure(missionId, failure) {
    const mission = this.loadMission(missionId);
    if (!mission) return { error: `Mission ${missionId} not found` };
    mission.failures.push({
      ...failure,
      timestamp: new Date().toISOString()
    });
    mission.updatedAt = new Date().toISOString();
    this._saveMission(mission);
    return { success: true, failureCount: mission.failures.length };
  }

  recordRetry(missionId, retry) {
    const mission = this.loadMission(missionId);
    if (!mission) return { error: `Mission ${missionId} not found` };
    mission.retries.push({
      ...retry,
      timestamp: new Date().toISOString()
    });
    mission.updatedAt = new Date().toISOString();
    this._saveMission(mission);
    return { success: true, retryCount: mission.retries.length };
  }

  addLearningCandidate(missionId, learning) {
    const mission = this.loadMission(missionId);
    if (!mission) return { error: `Mission ${missionId} not found` };
    mission.learningCandidates.push({
      ...learning,
      timestamp: new Date().toISOString()
    });
    mission.updatedAt = new Date().toISOString();
    this._saveMission(mission);
    return { success: true, learningCount: mission.learningCandidates.length };
  }

  completeMission(missionId, result) {
    const mission = this.loadMission(missionId);
    if (!mission) return { error: `Mission ${missionId} not found` };
    mission.currentStage = MISSION_STAGES.COMPLETE;
    mission.finalResult = {
      ...result,
      completedAt: new Date().toISOString()
    };
    mission.completedStages.push({
      stage: MISSION_STAGES.COMPLETE,
      completedAt: new Date().toISOString(),
      evidence: result
    });
    mission.updatedAt = new Date().toISOString();
    this._saveMission(mission);
    return { success: true, mission };
  }

  failMission(missionId, reason) {
    const mission = this.loadMission(missionId);
    if (!mission) return { error: `Mission ${missionId} not found` };
    mission.currentStage = MISSION_STAGES.FAILED;
    mission.finalResult = {
      success: false,
      reason,
      failedAt: new Date().toISOString()
    };
    mission.updatedAt = new Date().toISOString();
    this._saveMission(mission);
    return { success: true, mission };
  }

  updateContext(missionId, contextUpdates) {
    const mission = this.loadMission(missionId);
    if (!mission) return { error: `Mission ${missionId} not found` };
    mission.context = { ...mission.context, ...contextUpdates };
    mission.updatedAt = new Date().toISOString();
    this._saveMission(mission);
    return { success: true, context: mission.context };
  }

  listMissions(filter = {}) {
    const files = fs.readdirSync(this.dataDir).filter(f => f.endsWith('.json'));
    let missions = files.map(f => {
      try { return JSON.parse(fs.readFileSync(path.join(this.dataDir, f), 'utf-8')); }
      catch { return null; }
    }).filter(Boolean);
    if (filter.status) {
      missions = missions.filter(m => m.currentStage === filter.status);
    }
    if (filter.limit) {
      missions = missions.slice(0, filter.limit);
    }
    return missions.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  }

  getStats() {
    const missions = this.listMissions();
    return {
      total: missions.length,
      byStage: missions.reduce((acc, m) => {
        acc[m.currentStage] = (acc[m.currentStage] || 0) + 1;
        return acc;
      }, {}),
      completed: missions.filter(m => m.currentStage === MISSION_STAGES.COMPLETE).length,
      failed: missions.filter(m => m.currentStage === MISSION_STAGES.FAILED).length,
      active: missions.filter(m => ![MISSION_STAGES.COMPLETE, MISSION_STAGES.FAILED].includes(m.currentStage)).length
    };
  }
}

module.exports = { MissionState, MISSION_STAGES, MISSION_DATA_DIR };
