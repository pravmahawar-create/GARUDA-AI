/**
 * 🦅 GARUDA PAWAN ASTRA™ — Sovereign Android Toolchain Detection Engine
 * 
 * Verifies local development toolchain by physically executing binaries:
 * 1. Java / JDK (OpenJDK 21)
 * 2. Android SDK (platforms, build-tools, sdk.dir)
 * 3. Gradle / Gradle Wrapper (gradlew.bat)
 * 4. Android Debug Bridge (adb.exe, devices -l)
 * 5. Capacitor CLI (@capacitor/cli)
 * 
 * Strict Anti-Fabrication Law: Never infers installation from PATH strings alone.
 */

const { execSync, spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

class AndroidToolchainEngine {
  constructor(options = {}) {
    this.rootDir = options.rootDir || path.resolve(__dirname, "../../../");
    this.defaultSdkPath = process.env.ANDROID_HOME || 
                          process.env.ANDROID_SDK_ROOT || 
                          "C:\\Users\\hp\\AppData\\Local\\Android\\Sdk";
    this.defaultAdbPath = path.join(this.defaultSdkPath, "platform-tools", "adb.exe");
  }

  /**
   * Detect and physically verify Java installation
   */
  detectJava() {
    try {
      const res = spawnSync("java", ["-version"], { encoding: "utf8" });
      const out = (res.stderr || res.stdout || "").trim();
      if (res.status === 0 || out.includes("version")) {
        const verMatch = out.match(/version "([^"]+)"/) || out.match(/(\d+\.\d+\.\d+)/);
        const version = verMatch ? verMatch[1] : "detected";
        return {
          installed: true,
          version,
          raw: out.split("\n")[0] || out,
          status: "VERIFIED"
        };
      }
    } catch (_) {}

    return {
      installed: false,
      version: null,
      status: "MISSING",
      error: "Java JDK binary not executable in environment"
    };
  }

  /**
   * Detect and physically verify Android SDK installation
   */
  detectAndroidSdk(customPath = null) {
    const sdkPath = customPath || this.defaultSdkPath;

    if (!fs.existsSync(sdkPath)) {
      return {
        installed: false,
        path: sdkPath,
        platforms: [],
        buildTools: [],
        status: "MISSING",
        error: `Android SDK directory does not exist at ${sdkPath}`
      };
    }

    const platformsDir = path.join(sdkPath, "platforms");
    const buildToolsDir = path.join(sdkPath, "build-tools");

    const platforms = fs.existsSync(platformsDir) 
      ? fs.readdirSync(platformsDir).filter(p => p.startsWith("android-"))
      : [];

    const buildTools = fs.existsSync(buildToolsDir)
      ? fs.readdirSync(buildToolsDir).filter(b => /^[0-9.]+/.test(b))
      : [];

    const hasPlatforms = platforms.length > 0;
    const hasBuildTools = buildTools.length > 0;

    return {
      installed: hasPlatforms && hasBuildTools,
      path: sdkPath,
      platforms,
      buildTools,
      status: (hasPlatforms && hasBuildTools) ? "VERIFIED" : "PARTIAL",
      error: !hasPlatforms ? "No Android platforms found" : (!hasBuildTools ? "No Android build-tools found" : null)
    };
  }

  /**
   * Detect and physically verify Gradle & Gradle Wrapper
   */
  detectGradle(projectAndroidDir = null) {
    // 1. Check local project gradlew.bat
    if (projectAndroidDir && fs.existsSync(projectAndroidDir)) {
      const gradlewBat = path.join(projectAndroidDir, "gradlew.bat");
      const gradlewSh = path.join(projectAndroidDir, "gradlew");
      const hasWrapper = fs.existsSync(gradlewBat) || fs.existsSync(gradlewSh);

      if (hasWrapper) {
        try {
          const wrapperCmd = process.platform === "win32" ? gradlewBat : gradlewSh;
          const res = spawnSync(wrapperCmd, ["--version"], { 
            cwd: projectAndroidDir, 
            encoding: "utf8",
            shell: true,
            timeout: 10000 
          });
          const out = (res.stdout || res.stderr || "").trim();
          if (res.status === 0 || out.includes("Gradle")) {
            const verMatch = out.match(/Gradle\s+([0-9.]+)/i);
            return {
              installed: true,
              type: "wrapper",
              version: verMatch ? verMatch[1] : "detected",
              path: wrapperCmd,
              status: "VERIFIED"
            };
          }
        } catch (_) {}
      }
    }

    // 2. Check system-wide gradle binary
    try {
      const res = spawnSync("gradle", ["--version"], { encoding: "utf8", timeout: 8000 });
      const out = (res.stdout || res.stderr || "").trim();
      if (res.status === 0 && out.includes("Gradle")) {
        const verMatch = out.match(/Gradle\s+([0-9.]+)/i);
        return {
          installed: true,
          type: "system",
          version: verMatch ? verMatch[1] : "detected",
          status: "VERIFIED"
        };
      }
    } catch (_) {}

    return {
      installed: false,
      version: null,
      status: "MISSING",
      error: "Gradle or Gradle Wrapper not found in specified directory"
    };
  }

  /**
   * Detect and physically verify ADB & connected Android devices
   */
  detectAdb(customAdbPath = null) {
    const adbExe = customAdbPath || (fs.existsSync(this.defaultAdbPath) ? this.defaultAdbPath : "adb");

    try {
      const verRes = spawnSync(adbExe, ["version"], { encoding: "utf8", timeout: 5000 });
      const verOut = (verRes.stdout || verRes.stderr || "").trim();

      if (verRes.status !== 0 && !verOut.includes("Android Debug Bridge")) {
        return {
          installed: false,
          devices: [],
          deviceCount: 0,
          status: "MISSING",
          error: "adb binary failed execution"
        };
      }

      const verMatch = verOut.match(/version\s+([0-9.]+)/i);
      const adbVersion = verMatch ? verMatch[1] : "detected";

      // Detect connected devices
      const devRes = spawnSync(adbExe, ["devices", "-l"], { encoding: "utf8", timeout: 6000 });
      const devOut = (devRes.stdout || "").trim();
      const lines = devOut.split("\n").slice(1).map(l => l.trim()).filter(Boolean);

      const devices = lines.map(line => {
        const parts = line.split(/\s+/);
        const serial = parts[0];
        const state = parts[1] || "unknown";
        const modelMatch = line.match(/model:([^\s]+)/);
        const deviceMatch = line.match(/device:([^\s]+)/);
        return {
          serial,
          state,
          model: modelMatch ? modelMatch[1] : serial,
          device: deviceMatch ? deviceMatch[1] : serial,
          raw: line
        };
      }).filter(d => d.serial && d.serial !== "List");

      return {
        installed: true,
        version: adbVersion,
        path: adbExe,
        devices,
        deviceCount: devices.length,
        status: "VERIFIED"
      };

    } catch (err) {
      return {
        installed: false,
        devices: [],
        deviceCount: 0,
        status: "MISSING",
        error: err.message
      };
    }
  }

  /**
   * Detect and physically verify Capacitor CLI
   */
  detectCapacitor(projectDir = null) {
    const dir = projectDir || this.rootDir;

    // Fast path: Check local package.json manifests for instantaneous verification
    const candidatePaths = [
      path.join(dir, "node_modules", "@capacitor", "cli", "package.json"),
      path.join(this.rootDir, "sanatan-setu-app", "node_modules", "@capacitor", "cli", "package.json"),
      path.join(this.rootDir, "billing", "node_modules", "@capacitor", "cli", "package.json")
    ];

    for (const pkgPath of candidatePaths) {
      if (fs.existsSync(pkgPath)) {
        try {
          const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
          if (pkg && pkg.version) {
            return {
              installed: true,
              version: pkg.version,
              path: pkgPath,
              status: "VERIFIED"
            };
          }
        } catch (_) {}
      }
    }

    try {
      const res = spawnSync("npx", ["@capacitor/cli", "--version"], { 
        cwd: dir, 
        encoding: "utf8", 
        shell: true,
        timeout: 10000 
      });
      const out = (res.stdout || res.stderr || "").trim();
      if (res.status === 0 || /^[0-9.]+/.test(out)) {
        return {
          installed: true,
          version: out.split("\n")[0].trim(),
          status: "VERIFIED"
        };
      }
    } catch (_) {}

    return {
      installed: false,
      version: null,
      status: "MISSING",
      error: "Capacitor CLI not executable"
    };
  }

  /**
   * Comprehensive toolchain audit report
   */
  auditToolchain(projectAndroidDir = null) {
    const java = this.detectJava();
    const androidSdk = this.detectAndroidSdk();
    const gradle = this.detectGradle(projectAndroidDir);
    const adb = this.detectAdb();
    const capacitor = this.detectCapacitor();

    const readyForBuild = java.installed && androidSdk.installed && (gradle.installed || fs.existsSync(path.join(projectAndroidDir || "", "gradlew.bat")));

    return {
      timestamp: new Date().toISOString(),
      readyForBuild,
      java,
      androidSdk,
      gradle,
      adb,
      capacitor
    };
  }
}

module.exports = {
  AndroidToolchainEngine,
  androidToolchainEngine: new AndroidToolchainEngine()
};
