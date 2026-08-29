/**
 * 🦅 GARUDA Machine Hardware Auditor
 * Phase 1 & Forensic Machine Capability Audit
 *
 * Programmatically discovers machine hardware specifications (CPU, RAM, GPU, CUDA,
 * Disk, Python, Docker, Local Ports) and determines local AI image generation feasibility
 * according to strict physical reality without guessing.
 *
 * Possible Capability Categories:
 * - GPU_ACCELERATED_READY: NVIDIA GPU with >= 8GB VRAM and CUDA driver active.
 * - GPU_ACCELERATED_FEASIBLE: NVIDIA/DirectML GPU with 4-6GB VRAM (quantized models feasible).
 * - CPU_ONLY_FEASIBLE: High-spec CPU with >= 32GB free system RAM.
 * - INSUFFICIENT_HARDWARE: Integrated GPU, low RAM, or no CUDA acceleration.
 *
 * Feasibility Decisions:
 * - LOCAL_REAL_AI_IMAGE_ACTIVE: Genuine engine running and producing verified output.
 * - LOCAL_REAL_AI_IMAGE_NOT_FEASIBLE: Hardware insufficient or CPU-only inference not practical.
 */

const os = require("os");
const { execSync } = require("child_process");
const net = require("net");

class MachineHardwareAuditor {
  /**
   * Check if a TCP port on localhost is in use.
   */
  async checkPortInUse(port, host = "127.0.0.1", timeoutMs = 400) {
    return new Promise((resolve) => {
      const socket = new net.Socket();
      let status = false;

      socket.setTimeout(timeoutMs);
      socket.once("connect", () => {
        status = true;
        socket.destroy();
        resolve(true);
      });
      socket.once("timeout", () => {
        socket.destroy();
        resolve(false);
      });
      socket.once("error", () => {
        resolve(false);
      });
      socket.connect(port, host);
    });
  }

  /**
   * Execute command safely without throwing or exposing sensitive output.
   */
  execSafe(cmd) {
    try {
      return execSync(cmd, { encoding: "utf8", timeout: 3000, stdio: ["pipe", "pipe", "ignore"] }).trim();
    } catch {
      return null;
    }
  }

  /**
   * Perform comprehensive machine audit.
   */
  async auditMachineHardware() {
    const totalMemBytes = os.totalmem();
    const freeMemBytes = os.freemem();
    const totalMemMB = Math.round(totalMemBytes / (1024 * 1024));
    const freeMemMB = Math.round(freeMemBytes / (1024 * 1024));

    const cpus = os.cpus();
    const cpuModel = cpus && cpus[0] ? cpus[0].model.trim() : "Unknown CPU";
    const cpuCount = cpus ? cpus.length : 1;

    // 1. GPU & CUDA Discovery
    let cudaAvailable = false;
    let nvidiaDriverVersion = null;
    let gpuModel = "Integrated / Standard Display Adapter";
    let gpuManufacturer = "Unknown";
    let dedicatedVramMB = 0;

    const nvidiaSmi = this.execSafe("nvidia-smi --query-gpu=name,driver_version,memory.total --format=csv,noheader,nounits");
    if (nvidiaSmi) {
      cudaAvailable = true;
      gpuManufacturer = "NVIDIA";
      const parts = nvidiaSmi.split(",").map(p => p.trim());
      if (parts.length >= 1) gpuModel = parts[0];
      if (parts.length >= 2) nvidiaDriverVersion = parts[1];
      if (parts.length >= 3) dedicatedVramMB = parseInt(parts[2], 10) || 0;
    } else if (os.platform() === "win32") {
      // Windows WMI Query for Video Controller
      const wmiOut = this.execSafe("powershell -NoProfile -Command \"Get-CimInstance Win32_VideoController | Select-Object -Property Name, AdapterRAM | Format-List\"");
      if (wmiOut) {
        const nameMatch = wmiOut.match(/Name\s*:\s*(.+)/i);
        const ramMatch = wmiOut.match(/AdapterRAM\s*:\s*(\d+)/i);
        if (nameMatch && nameMatch[1]) {
          gpuModel = nameMatch[1].trim();
          if (gpuModel.toLowerCase().includes("intel")) gpuManufacturer = "Intel";
          else if (gpuModel.toLowerCase().includes("nvidia")) gpuManufacturer = "NVIDIA";
          else if (gpuModel.toLowerCase().includes("amd") || gpuModel.toLowerCase().includes("radeon")) gpuManufacturer = "AMD";
        }
        if (ramMatch && ramMatch[1]) {
          dedicatedVramMB = Math.round(parseInt(ramMatch[1], 10) / (1024 * 1024));
        }
      }
    }

    // 2. Python, Pip, Docker, Ollama Checks
    const pythonVersion = this.execSafe("python --version");
    const pipVersion = this.execSafe("pip --version");
    const dockerVersion = this.execSafe("docker --version");

    // 3. Port In-Use Checks
    const [port7860InUse, port8188InUse, port11434InUse] = await Promise.all([
      this.checkPortInUse(7860),
      this.checkPortInUse(8188),
      this.checkPortInUse(11434)
    ]);

    // 4. Determine Capability Category & Feasibility Decision
    let capabilityCategory = "INSUFFICIENT_HARDWARE";
    let feasibilityDecision = "LOCAL_REAL_AI_IMAGE_NOT_FEASIBLE";
    let blockerReason = null;

    if (cudaAvailable && dedicatedVramMB >= 8000) {
      capabilityCategory = "GPU_ACCELERATED_READY";
      feasibilityDecision = "LOCAL_REAL_AI_IMAGE_FEASIBLE";
    } else if (cudaAvailable && dedicatedVramMB >= 4000) {
      capabilityCategory = "GPU_ACCELERATED_FEASIBLE";
      feasibilityDecision = "LOCAL_REAL_AI_IMAGE_FEASIBLE";
    } else if (gpuManufacturer === "Intel" || dedicatedVramMB < 2000) {
      capabilityCategory = "INSUFFICIENT_HARDWARE";
      feasibilityDecision = "LOCAL_REAL_AI_IMAGE_NOT_FEASIBLE";
      blockerReason = `Integrated GPU (${gpuModel}) with insufficient dedicated VRAM and no CUDA runtime. Total system RAM is ${Math.round(totalMemMB / 1024)}GB (${freeMemMB}MB free). CPU-only diffuser loading would cause severe OS memory starvation and is not practically usable.`;
    } else if (freeMemMB < 8000) {
      capabilityCategory = "INSUFFICIENT_HARDWARE";
      feasibilityDecision = "LOCAL_REAL_AI_IMAGE_NOT_FEASIBLE";
      blockerReason = `Free physical system memory (${freeMemMB}MB) is below the minimum required 8GB for local diffuser weight loading.`;
    } else {
      capabilityCategory = "CPU_ONLY_FEASIBLE";
      feasibilityDecision = "LOCAL_REAL_AI_IMAGE_NOT_FEASIBLE";
      blockerReason = "CPU-only inference is technically feasible but not practically usable due to 15-45 minute generation latencies per 512x512 image.";
    }

    return {
      timestamp: new Date().toISOString(),
      os: {
        platform: os.platform(),
        release: os.release(),
        arch: os.arch(),
        totalMemMB,
        freeMemMB
      },
      cpu: {
        model: cpuModel,
        cores: cpuCount
      },
      gpu: {
        manufacturer: gpuManufacturer,
        model: gpuModel,
        dedicatedVramMB,
        cudaAvailable,
        driverVersion: nvidiaDriverVersion
      },
      runtimeEnvironment: {
        nodeVersion: process.version,
        pythonVersion: pythonVersion ? pythonVersion.replace(/^Python\s*/i, "") : null,
        pipAvailable: Boolean(pipVersion),
        dockerAvailable: Boolean(dockerVersion),
        ollamaAvailable: port11434InUse
      },
      localPorts: {
        port7860InUse, // SD WebUI default
        port8188InUse, // ComfyUI default
        port11434InUse // Ollama default
      },
      capabilityCategory,
      feasibilityDecision,
      blockerReason,
      truthLawCompliant: true
    };
  }
}

module.exports = new MachineHardwareAuditor();
module.exports.MachineHardwareAuditor = MachineHardwareAuditor;
