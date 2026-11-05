/**
 * 🦅 GARUDA MOTHER BRAIN — DYNAMIC TEAM ORCHESTRATOR
 * 
 * Orchestrates multi-agent teams under strict Mother Brain governance:
 * - Dynamic workforce sizing (3, 5, 7 agents based on mission scope)
 * - DAG dependency resolution & topological task dispatching
 * - Parallel execution for independent tasks (Promise.all with concurrency bounds)
 * - Sequential execution for dependent tasks
 * - Shared blackboard context distribution
 * - Closed-loop failure recovery & reassignment
 * - Real-time terminal progress streaming & ASCII visualization
 */

const { AGENT_ROLES } = require("./AgentRoles");
const { IntelligentAgent } = require("./IntelligentAgent");
const { MissionState } = require("./MissionState");

// Terminal Colors (ANSI)
const C = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  gold: "\x1b[38;5;220m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  gray: "\x1b[90m"
};

class TeamOrchestrator {
  constructor(options = {}) {
    this.maxConcurrency = Math.min(options.maxConcurrency || 3, 5); // Bounded to 5 max parallel agents
    this.approvalGate = options.approvalGate;
    this.onProgress = typeof options.onProgress === "function" ? options.onProgress : () => {};
  }

  /**
   * Plans the dynamic workforce team and task DAG from a natural-language mission objective.
   */
  planMission(objective, teamSize = 5) {
    const mission = new MissionState({ objective });
    const lower = objective.toLowerCase();

    // 1. Determine Roles based on requested team size and keywords
    const selectedRoles = [
      AGENT_ROLES.COORDINATOR,
      AGENT_ROLES.ARCHITECT,
      AGENT_ROLES.ENGINEER,
      AGENT_ROLES.TESTER
    ];

    const isComplexMission = teamSize >= 5 || lower.includes("coordinate") || lower.includes("workforce") ||
      lower.includes("analytics") || lower.includes("security") || lower.includes("complete") || lower.includes("required agents");

    if (isComplexMission || lower.includes("security") || lower.includes("audit") || lower.includes("protect")) {
      selectedRoles.push(AGENT_ROLES.SECURITY_AGENT);
    }
    if (isComplexMission || teamSize >= 6 || lower.includes("review") || lower.includes("diff") || lower.includes("quality")) {
      selectedRoles.push(AGENT_ROLES.REVIEWER);
    }
    if (isComplexMission || teamSize >= 7 || lower.includes("research") || lower.includes("explore") || lower.includes("inspect")) {
      selectedRoles.push(AGENT_ROLES.RESEARCHER);
    }

    // 2. Instantiate and Register Intelligent Agents
    const workforce = new Map();
    for (const role of selectedRoles) {
      const agent = new IntelligentAgent({ role });
      workforce.set(role, agent);
      mission.registerAgent(agent);
    }

    const isAnalytics = lower.includes("analytics");
    const targetModule = isAnalytics ? "src/services/customerAnalytics.js" : null;
    const testPath = isAnalytics ? "tests/customerAnalytics.test.js" : null;
    const docPath = isAnalytics ? "docs/customerAnalytics.md" : null;

    // 3. Build Task DAG
    // Task 1: ARCHITECT designs blueprint & interfaces
    mission.addTask({
      id: "TASK-001-ARCHITECT",
      title: "System Architecture & Interface Blueprint",
      assignedRole: AGENT_ROLES.ARCHITECT,
      dependencies: [],
      input: { scope: "design_system", objective, targetModule }
    });

    // Task 2: RESEARCHER inspects existing codebase patterns (Runs in parallel with Architect if Researcher present)
    if (workforce.has(AGENT_ROLES.RESEARCHER)) {
      mission.addTask({
        id: "TASK-002-RESEARCH",
        title: "Codebase Inspection & Dependency Research",
        assignedRole: AGENT_ROLES.RESEARCHER,
        dependencies: [], // Independent! Can run in parallel with Architect
        input: { scope: "inspect_dependencies", targetModule }
      });
    }

    // Task 3: ENGINEER implements core modules (Depends on Architect & Researcher)
    const engDeps = ["TASK-001-ARCHITECT"];
    if (workforce.has(AGENT_ROLES.RESEARCHER)) engDeps.push("TASK-002-RESEARCH");

    mission.addTask({
      id: "TASK-003-ENGINEER",
      title: "Core Feature & Module Implementation",
      assignedRole: AGENT_ROLES.ENGINEER,
      dependencies: engDeps,
      input: { scope: "implement_code", targetModule, testPath, docPath }
    });

    // Task 4: TESTER runs verification suite (Depends on Engineer)
    mission.addTask({
      id: "TASK-004-TESTER",
      title: "Automated Verification & Unit Testing",
      assignedRole: AGENT_ROLES.TESTER,
      dependencies: ["TASK-003-ENGINEER"],
      input: { scope: "verify_tests", testPath, command: testPath ? `node ${testPath}` : "npm test" }
    });

    // Task 5: SECURITY_AGENT audits governance (Runs in parallel with Tester if present)
    if (workforce.has(AGENT_ROLES.SECURITY_AGENT)) {
      mission.addTask({
        id: "TASK-005-SECURITY",
        title: "Sovereign Security & Boundary Enforcement",
        assignedRole: AGENT_ROLES.SECURITY_AGENT,
        dependencies: ["TASK-003-ENGINEER"], // Independent of Tester! Can run in parallel with Tester
        input: { scope: "audit_security", targetModule }
      });
    }

    // Task 6: REVIEWER audits diffs (Depends on Tester & Security)
    if (workforce.has(AGENT_ROLES.REVIEWER)) {
      const revDeps = ["TASK-004-TESTER"];
      if (workforce.has(AGENT_ROLES.SECURITY_AGENT)) revDeps.push("TASK-005-SECURITY");

      mission.addTask({
        id: "TASK-006-REVIEWER",
        title: "Principal Code Review & Quality Audit",
        assignedRole: AGENT_ROLES.REVIEWER,
        dependencies: revDeps,
        input: { scope: "review_diffs", targetModule }
      });
    }

    // Task 7: COORDINATOR synthesizes mission deliverable & final verification (Depends on Reviewer)
    const coordDeps = [];
    if (workforce.has(AGENT_ROLES.REVIEWER)) coordDeps.push("TASK-006-REVIEWER");
    else if (workforce.has(AGENT_ROLES.TESTER)) coordDeps.push("TASK-004-TESTER");

    mission.addTask({
      id: "TASK-007-COORDINATOR",
      title: "Mission Deliverable Synthesis & Final Sign-off",
      assignedRole: AGENT_ROLES.COORDINATOR,
      dependencies: coordDeps,
      input: { scope: "synthesize_mission", targetModule }
    });

    return { mission, workforce };
  }

  /**
   * Executes the full mission through the intelligent multi-agent runtime.
   */
  async executeMission(mission, workforce) {
    mission.status = "EXECUTING";
    mission.save();

    this._renderBanner(mission, workforce);

    const maxIterations = 20;
    let iteration = 0;

    while (iteration < maxIterations) {
      iteration++;
      const eligibleTasks = mission.getEligibleTasks();

      if (eligibleTasks.length === 0) {
        // Check if all tasks are completed
        const allTasks = Array.from(mission.tasks.values());
        const hasFailed = allTasks.some(t => t.status === "FAILED");
        const allCompleted = allTasks.every(t => t.status === "COMPLETED");

        if (allCompleted) {
          mission.status = "COMPLETED";
          break;
        } else if (hasFailed) {
          // Attempt Closed-Loop Recovery
          const recovered = await this._handleMissionRecovery(mission, workforce);
          if (!recovered) {
            mission.status = "FAILED";
            break;
          }
          continue;
        } else {
          // No eligible tasks, but not completed -> deadlock or blocked
          break;
        }
      }

      // Limit batch to bounded concurrency
      const batch = eligibleTasks.slice(0, this.maxConcurrency);
      const isParallel = batch.length > 1;

      if (isParallel) {
        this.onProgress({
          event: "PARALLEL_DISPATCH",
          count: batch.length,
          taskIds: batch.map(t => t.id)
        });
        console.log(`\n${C.gold}⚡ [MOTHER BRAIN] Dispatching ${batch.length} independent tasks concurrently...${C.reset}`);
      }

      // Execute batch concurrently using Promise.all
      await Promise.all(
        batch.map(async (task) => {
          mission.updateTaskStatus(task.id, "RUNNING");
          const agent = workforce.get(task.assignedRole) || workforce.get(AGENT_ROLES.ENGINEER);
          mission.updateAgentStatus(agent.id, "EXECUTING", task.id);

          console.log(`  ${C.cyan}▶ [${agent.role}]${C.reset} Starting ${C.bright}${task.id}${C.reset}: "${task.title}"`);

          const outcome = await agent.executeTask(task, mission, (evt) => this.onProgress(evt));

          if (outcome.success) {
            mission.updateTaskStatus(task.id, "COMPLETED", outcome);
            mission.updateAgentStatus(agent.id, "IDLE", null);
            // Publish outcome to blackboard for peer agents
            mission.setBlackboard(task.id, outcome.output, agent.id);
            console.log(`  ${C.green}✔ [${agent.role}]${C.reset} Completed ${C.bright}${task.id}${C.reset} (${outcome.durationMs}ms)`);
          } else {
            mission.updateTaskStatus(task.id, "FAILED", outcome);
            mission.updateAgentStatus(agent.id, "FAILED", null);
            console.log(`  ${C.red}✖ [${agent.role}]${C.reset} Failed ${C.bright}${task.id}${C.reset}: ${outcome.error}`);
          }
        })
      );

      mission.save();
    }

    // Synthesize final deliverable
    const finalReport = this._synthesizeMissionDeliverable(mission, workforce);
    mission.summary = finalReport;
    mission.save();

    return {
      missionId: mission.missionId,
      status: mission.status,
      tasks: Array.from(mission.tasks.values()),
      events: mission.events,
      blackboard: mission.getAllBlackboard(),
      finalReport
    };
  }

  /**
   * Closed-Loop Failure Recovery:
   * Detects failing task, diagnoses error, spawns recovery task, and re-executes.
   */
  async _handleMissionRecovery(mission, workforce) {
    const failedTask = Array.from(mission.tasks.values()).find(t => t.status === "FAILED");
    if (!failedTask || failedTask.retryCount >= 2) return false;

    console.log(`\n${C.yellow}🔄 [MOTHER BRAIN RECOVERY] Intercepting failure in ${failedTask.id}...${C.reset}`);
    console.log(`  Error: ${failedTask.error}`);
    console.log(`  Diagnosing and routing recovery patch to Senior Engineer...`);

    failedTask.retryCount++;
    failedTask.status = "RECOVERING";
    mission.logEvent("MISSION_RECOVERY_TRIGGERED", { taskId: failedTask.id, retry: failedTask.retryCount });

    // Assign recovery task to Engineer
    const engineer = workforce.get(AGENT_ROLES.ENGINEER);
    if (!engineer) return false;

    const recoveryTask = {
      id: `${failedTask.id}-RECOVERY-${failedTask.retryCount}`,
      title: `Recovery Patch for ${failedTask.title}`,
      assignedRole: AGENT_ROLES.ENGINEER,
      input: {
        error: failedTask.error,
        previousTask: failedTask.id
      }
    };

    const recoveryOutcome = await engineer.executeTask(recoveryTask, mission, this.onProgress);
    if (recoveryOutcome.success) {
      console.log(`  ${C.green}✔ [RECOVERY] Corrective patch applied. Re-running ${failedTask.id}...${C.reset}`);
      failedTask.status = "PENDING"; // Re-queue task
      mission.updateTaskStatus(failedTask.id, "PENDING");
      return true;
    }

    return false;
  }

  _renderBanner(mission, workforce) {
    console.log(`${C.gold}========================================================================================${C.reset}`);
    console.log(`${C.bright}${C.gold}🦅 GARUDA MOTHER BRAIN — AUTONOMOUS WORKFORCE ORCHESTRATION${C.reset}`);
    console.log(`${C.cyan}Mission ID:${C.reset} ${C.bright}${mission.missionId}${C.reset} | ${C.cyan}Concurrency:${C.reset} ${this.maxConcurrency} parallel workers`);
    console.log(`${C.cyan}Objective:${C.reset}  "${mission.objective}"`);
    console.log(`${C.gold}----------------------------------------------------------------------------------------${C.reset}`);
    console.log(`${C.bright}Active Workforce (${workforce.size} AI Agents):${C.reset}`);
    for (const [role, ag] of workforce.entries()) {
      console.log(`  • ${C.cyan}${role.padEnd(16)}${C.reset} ${C.bright}${ag.name}${C.reset} | Model: ${C.green}${ag.preferredModel}${C.reset}`);
    }
    console.log(`${C.gold}----------------------------------------------------------------------------------------${C.reset}`);
    console.log(`${C.bright}Execution Task Dependency Graph (${mission.tasks.size} steps):${C.reset}`);
    for (const t of mission.tasks.values()) {
      const depStr = t.dependencies.length > 0 ? ` (depends on: ${t.dependencies.join(", ")})` : ` ${C.green}[PARALLEL ELIGIBLE]${C.reset}`;
      console.log(`  [ ] ${C.bright}${t.id.padEnd(20)}${C.reset} → Role: ${C.cyan}${t.assignedRole.padEnd(14)}${C.reset} "${t.title}"${depStr}`);
    }
    console.log(`${C.gold}========================================================================================${C.reset}\n`);
  }

  _synthesizeMissionDeliverable(mission, workforce) {
    const completedCount = Array.from(mission.tasks.values()).filter(t => t.status === "COMPLETED").length;
    const totalCount = mission.tasks.size;

    const lines = [
      `========================================================================================`,
      `🦅 GARUDA MOTHER BRAIN — MISSION COMPLETE REPORT`,
      `Mission ID:  ${mission.missionId}`,
      `Objective:   "${mission.objective}"`,
      `Workforce:   ${workforce.size} specialized AI agents coordinated`,
      `Tasks:       ${completedCount} / ${totalCount} completed successfully`,
      `Status:      ${mission.status === "COMPLETED" ? "🟢 VERIFIED SUCCESS" : "🔴 " + mission.status}`,
      `========================================================================================\n`,
      `CONSOLIDATED WORKFORCE DELIVERABLES:`
    ];

    for (const task of mission.tasks.values()) {
      lines.push(`\n[${task.id}] — Role: ${task.assignedRole} | Status: ${task.status}`);
      if (task.output) {
        lines.push(`Output: ${typeof task.output === "string" ? task.output.slice(0, 300) : JSON.stringify(task.output)}`);
      }
      if (task.toolCalls && task.toolCalls.length > 0) {
        lines.push(`Tools Executed: ${task.toolCalls.map(tc => tc.tool).join(", ")}`);
      }
    }

    return lines.join("\n");
  }
}

module.exports = {
  TeamOrchestrator
};
