const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { generateId } = require('../intelligenceSchema');

const CHECKPOINT_TYPES = {
  MISSION_START: 'MISSION_START',
  PLAN_COMPLETE: 'PLAN_COMPLETE',
  NAZAR_COMPLETE: 'NAZAR_COMPLETE',
  MAJOR_PATCH: 'MAJOR_PATCH',
  TEST_COMPLETE: 'TEST_COMPLETE',
  RECOVERY: 'RECOVERY',
  ARTIFACT_CREATED: 'ARTIFACT_CREATED',
  LEARNING_COMPLETE: 'LEARNING_COMPLETE',
  MISSION_COMPLETE: 'MISSION_COMPLETE'
};

const CHECKPOINT_DATA_DIR = path.join(process.cwd(), 'data', 'intelligence', 'checkpoints');

class CheckpointSystem {
  constructor(options = {}) {
    this.dataDir = options.dataDir || CHECKPOINT_DATA_DIR;
    this._ensureDataDir();
  }

  _ensureDataDir() {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
  }

  createCheckpoint(missionId, type, stateSnapshot, metadata = {}) {
    if (!CHECKPOINT_TYPES[type]) {
      return { error: `Invalid checkpoint type: ${type}` };
    }
    const checkpoint = {
      checkpointId: `cp-${Date.now().toString(36)}-${crypto.randomBytes(4).toString('hex')}`,
      missionId,
      type,
      timestamp: new Date().toISOString(),
      stateSnapshot: {
        currentStage: stateSnapshot.currentStage,
        completedStages: stateSnapshot.completedStages || [],
        pendingStages: stateSnapshot.pendingStages || [],
        decisionsCount: (stateSnapshot.decisions || []).length,
        evidenceCount: (stateSnapshot.evidence || []).length,
        artifactsCount: (stateSnapshot.artifacts || []).length,
        failuresCount: (stateSnapshot.failures || []).length,
        context: stateSnapshot.context || {}
      },
      metadata
    };
    this._saveCheckpoint(checkpoint);
    return checkpoint;
  }

  _saveCheckpoint(checkpoint) {
    const missionDir = path.join(this.dataDir, checkpoint.missionId);
    if (!fs.existsSync(missionDir)) {
      fs.mkdirSync(missionDir, { recursive: true });
    }
    const filePath = path.join(missionDir, `${checkpoint.checkpointId}.json`);
    fs.writeFileSync(filePath, JSON.stringify(checkpoint, null, 2), 'utf-8');
  }

  loadCheckpoints(missionId) {
    const missionDir = path.join(this.dataDir, missionId);
    if (!fs.existsSync(missionDir)) return [];
    const files = fs.readdirSync(missionDir).filter(f => f.endsWith('.json'));
    return files.map(f => {
      try { return JSON.parse(fs.readFileSync(path.join(missionDir, f), 'utf-8')); }
      catch { return null; }
    }).filter(Boolean).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  }

  getLatestCheckpoint(missionId) {
    const checkpoints = this.loadCheckpoints(missionId);
    return checkpoints.length > 0 ? checkpoints[checkpoints.length - 1] : null;
  }

  getCheckpointAtType(missionId, type) {
    const checkpoints = this.loadCheckpoints(missionId);
    return checkpoints.filter(c => c.type === type).pop() || null;
  }

  canResume(missionId) {
    const checkpoints = this.loadCheckpoints(missionId);
    if (checkpoints.length === 0) return { canResume: false, reason: 'No checkpoints found' };
    const latest = checkpoints[checkpoints.length - 1];
    if (latest.type === CHECKPOINT_TYPES.MISSION_COMPLETE) {
      return { canResume: false, reason: 'Mission already completed' };
    }
    return {
      canResume: true,
      resumeFrom: latest.stateSnapshot.currentStage,
      checkpointId: latest.checkpointId,
      timestamp: latest.timestamp
    };
  }

  getStats() {
    const missionDirs = fs.readdirSync(this.dataDir).filter(f => {
      return fs.statSync(path.join(this.dataDir, f)).isDirectory();
    });
    let totalCheckpoints = 0;
    const typeBreakdown = {};
    for (const dir of missionDirs) {
      const checkpoints = this.loadCheckpoints(dir);
      totalCheckpoints += checkpoints.length;
      for (const cp of checkpoints) {
        typeBreakdown[cp.type] = (typeBreakdown[cp.type] || 0) + 1;
      }
    }
    return {
      totalMissions: missionDirs.length,
      totalCheckpoints,
      typeBreakdown,
      avgCheckpointsPerMission: missionDirs.length > 0 ? (totalCheckpoints / missionDirs.length).toFixed(1) : 0
    };
  }
}

module.exports = { CheckpointSystem, CHECKPOINT_TYPES, CHECKPOINT_DATA_DIR };
