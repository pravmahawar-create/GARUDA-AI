import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import SEOHead from "../components/SEOHead";

// Colors & Design Tokens
const GOLD = "#d4af37";
const GOLD_LIGHT = "#fef08a";
const CYAN = "#38bdf8";
const RED = "#ef4444";
const GREEN = "#10b981";
const PURPLE = "#a855f7";
const ORANGE = "#f97316";
const BG_DARK = "#020714";

// Map Resolution
const CANVAS_WIDTH = 1000;
const CANVAS_HEIGHT = 600;

// High-Tech Pathway Waypoints
const PATH_WAYPOINTS = [
  { x: 0, y: 140 },
  { x: 260, y: 140 },
  { x: 260, y: 440 },
  { x: 540, y: 440 },
  { x: 540, y: 180 },
  { x: 800, y: 180 },
  { x: 800, y: 480 },
  { x: 1000, y: 480 }
];

// Turrets Specification
const TOWER_TYPES = {
  pawan: {
    id: "pawan",
    name: "Pawan Lightning",
    icon: "⚡",
    cost: 100,
    range: 130,
    damage: 22,
    fireRate: 18,
    color: CYAN,
    accent: "#67e8f9",
    desc: "Continuous high-voltage lightning arc that fries fast scouts."
  },
  agni: {
    id: "agni",
    name: "Agni Mortar",
    icon: "💥",
    cost: 160,
    range: 150,
    damage: 65,
    fireRate: 50,
    splashRadius: 65,
    color: ORANGE,
    accent: "#fdba74",
    desc: "Heavy explosive ordnance with massive shockwave blast radius."
  },
  vajra: {
    id: "vajra",
    name: "Vajra Frost",
    icon: "❄️",
    cost: 130,
    range: 120,
    damage: 12,
    fireRate: 32,
    slowFactor: 0.5,
    color: PURPLE,
    accent: "#d8b4fe",
    desc: "Cryogenic wave emitter that freezes and slows enemy swarms by 50%."
  },
  garuda: {
    id: "garuda",
    name: "Garuda Titan",
    icon: "👑",
    cost: 320,
    range: 175,
    damage: 160,
    fireRate: 60,
    color: GOLD,
    accent: GOLD_LIGHT,
    desc: "Devastating golden ion plasma cannon with penetrating boss damage."
  }
};

export default function GarudaCyberTycoon() {
  const canvasRef = useRef(null);

  // Economy & Game Status
  const [gold, setGold] = useState(380);
  const [lives, setLives] = useState(20);
  const [wave, setWave] = useState(1);
  const [waveActive, setWaveActive] = useState(false);
  const [selectedTool, setSelectedTool] = useState("pawan"); // "pawan", "agni", "vajra", "garuda"
  const [selectedTower, setSelectedTower] = useState(null);
  const [gameSpeed, setGameSpeed] = useState(1);
  const [soundOn, setSoundOn] = useState(true);
  const [gameOver, setGameOver] = useState(false);
  const [victory, setVictory] = useState(false);
  const [score, setScore] = useState(0);

  // Active Sovereign Astra Super-Powers Cooldowns (in seconds)
  const [orbitalCooldown, setOrbitalCooldown] = useState(0);
  const [empCooldown, setEmpCooldown] = useState(0);
  const [overclockCooldown, setOverclockCooldown] = useState(0);
  const [overclockActiveTimer, setOverclockActiveTimer] = useState(0);
  const [targetingOrbital, setTargetingOrbital] = useState(false);

  // Audio Context Ref
  const audioCtxRef = useRef(null);

  const initAudio = () => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) audioCtxRef.current = new AudioCtx();
    }
    if (audioCtxRef.current && audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }
  };

  const playSfx = (type) => {
    if (!soundOn) return;
    try {
      initAudio();
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      const t = ctx.currentTime;

      if (type === "laser") {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(1200, t);
        osc.frequency.exponentialRampToValueAtTime(300, t + 0.08);
        gain.gain.setValueAtTime(0.12, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.08);
      } else if (type === "cannon") {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(160, t);
        osc.frequency.exponentialRampToValueAtTime(30, t + 0.3);
        gain.gain.setValueAtTime(0.35, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.3);
      } else if (type === "orbital") {
        // Deep cosmic orbital laser blast
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(80, t);
        osc.frequency.linearRampToValueAtTime(600, t + 0.2);
        osc.frequency.exponentialRampToValueAtTime(35, t + 0.8);
        gain.gain.setValueAtTime(0.4, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.8);
      } else if (type === "emp") {
        // High-frequency EMP static power down
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(1400, t);
        osc.frequency.exponentialRampToValueAtTime(120, t + 0.4);
        gain.gain.setValueAtTime(0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.4);
      } else if (type === "coin") {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(987.77, t);
        osc.frequency.setValueAtTime(1318.51, t + 0.05);
        gain.gain.setValueAtTime(0.14, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.18);
      } else if (type === "hit") {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(150, t);
        osc.frequency.exponentialRampToValueAtTime(40, t + 0.15);
        gain.gain.setValueAtTime(0.25, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.15);
      }
    } catch {
      // Audio safety
    }
  };

  // Cooldown decrement loop (1 sec intervals)
  useEffect(() => {
    const timer = setInterval(() => {
      setOrbitalCooldown(c => Math.max(0, c - 1));
      setEmpCooldown(c => Math.max(0, c - 1));
      setOverclockCooldown(c => Math.max(0, c - 1));
      setOverclockActiveTimer(t => Math.max(0, t - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Mutable High-Performance 60 FPS Engine State
  const engineRef = useRef({
    towers: [],
    enemies: [],
    projectiles: [],
    laserBeams: [], // Real-time continuous electric arcs
    shockwaves: [], // Expanding blast ripples
    damageNumbers: [], // Floating combat text (-18, CRIT -140)
    particles: [], // Sparks, embers, shrapnel
    orbitalStrikes: [], // Incoming satellite orbital laser animations
    spawnQueue: [],
    spawnTimer: 0,
    waveNumber: 1,
    screenShake: 0
  });

  const isPositionOnPath = (x, y) => {
    for (let i = 0; i < PATH_WAYPOINTS.length - 1; i++) {
      const p1 = PATH_WAYPOINTS[i];
      const p2 = PATH_WAYPOINTS[i + 1];
      const minX = Math.min(p1.x, p2.x) - 38;
      const maxX = Math.max(p1.x, p2.x) + 38;
      const minY = Math.min(p1.y, p2.y) - 38;
      const maxY = Math.max(p1.y, p2.y) + 38;
      if (x >= minX && x <= maxX && y >= minY && y <= maxY) return true;
    }
    return false;
  };

  const startNextWave = () => {
    if (waveActive || gameOver) return;
    initAudio();
    setWaveActive(true);

    const eng = engineRef.current;
    eng.waveNumber = wave;

    const count = 9 + wave * 4;
    const queue = [];

    for (let i = 0; i < count; i++) {
      let type = "drone";
      if (wave >= 2 && i % 3 === 0) type = "spider";
      if (wave >= 3 && i % 5 === 0) type = "tank";
      if (i === count - 1 && wave % 3 === 0) type = "boss";

      let hp = 75 + wave * 32;
      let speed = 1.35 + Math.min(1.2, wave * 0.07);
      let reward = 12 + wave * 2;
      let size = 13;
      let color = RED;

      if (type === "spider") {
        hp *= 1.4;
        speed *= 1.25;
        reward *= 1.5;
        size = 14;
        color = "#fb923c";
      } else if (type === "tank") {
        hp *= 2.6;
        speed *= 0.65;
        reward *= 2.0;
        size = 18;
        color = "#e11d48";
      } else if (type === "boss") {
        hp *= 6.5;
        speed *= 0.5;
        reward *= 4.5;
        size = 26;
        color = PURPLE;
      }

      queue.push({
        id: Math.random(),
        type,
        hp,
        maxHp: hp,
        speed,
        baseSpeed: speed,
        slowTimer: 0,
        freezeTimer: 0,
        reward: Math.floor(reward),
        size,
        color,
        waypointIdx: 0,
        x: PATH_WAYPOINTS[0].x - i * 36,
        y: PATH_WAYPOINTS[0].y,
        animFrame: Math.random() * 10
      });
    }

    eng.spawnQueue = queue;
    eng.spawnTimer = 0;
  };

  // Cast Orbital Strike
  const triggerOrbitalStrikeAt = (x, y) => {
    playSfx("orbital");
    setOrbitalCooldown(25);
    setTargetingOrbital(false);

    const eng = engineRef.current;
    eng.screenShake = 18; // Heavy camera shake
    eng.orbitalStrikes.push({
      x,
      y,
      radius: 95,
      progress: 0,
      maxFrames: 45
    });
  };

  // Cast EMP Freeze
  const triggerEmpFreeze = () => {
    if (empCooldown > 0) return;
    playSfx("emp");
    setEmpCooldown(20);

    const eng = engineRef.current;
    eng.screenShake = 8;
    eng.shockwaves.push({ x: 500, y: 300, radius: 10, maxRadius: 600, color: CYAN, speed: 18 });

    // Freeze all live enemies for 4.5 seconds (270 frames)
    eng.enemies.forEach(e => {
      e.freezeTimer = 270;
    });

    eng.damageNumbers.push({
      x: 500,
      y: 280,
      vy: -1.5,
      text: "⚡ EMP CHRONO-FREEZE ACTIVE (4.5s)!",
      color: CYAN,
      size: 18,
      life: 50
    });
  };

  // Cast Overclock Protocol
  const triggerOverclock = () => {
    if (overclockCooldown > 0) return;
    playSfx("orbital");
    setOverclockCooldown(28);
    setOverclockActiveTimer(6);

    const eng = engineRef.current;
    eng.screenShake = 10;
    eng.shockwaves.push({ x: 500, y: 300, radius: 10, maxRadius: 500, color: GOLD, speed: 16 });

    eng.damageNumbers.push({
      x: 500,
      y: 280,
      vy: -1.5,
      text: "⚡ OVERCLOCK PROTOCOL: 3X FIRE RATE (6s)!",
      color: GOLD_LIGHT,
      size: 18,
      life: 50
    });
  };

  // 60 FPS Canvas Game Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animId;

    let globalFrame = 0;

    const gameLoop = () => {
      animId = requestAnimationFrame(gameLoop);
      const eng = engineRef.current;
      const speedMult = gameSpeed;
      globalFrame++;

      // Multiple simulation substeps for 2x speed
      for (let step = 0; step < speedMult; step++) {
        // 1. Spawning enemies
        if (eng.spawnQueue.length > 0) {
          eng.spawnTimer++;
          if (eng.spawnTimer >= 22) {
            eng.spawnTimer = 0;
            eng.enemies.push(eng.spawnQueue.shift());
          }
        }

        // 2. Enemy Movement & Animation
        for (let i = eng.enemies.length - 1; i >= 0; i--) {
          const e = eng.enemies[i];
          e.animFrame += 0.15;

          if (e.freezeTimer > 0) {
            e.freezeTimer--;
            continue; // Completely frozen by EMP
          }

          if (e.slowTimer > 0) {
            e.slowTimer--;
            e.speed = e.baseSpeed * 0.5;
          } else {
            e.speed = e.baseSpeed;
          }

          const targetWp = PATH_WAYPOINTS[e.waypointIdx + 1];
          if (targetWp) {
            const dx = targetWp.x - e.x;
            const dy = targetWp.y - e.y;
            const dist = Math.hypot(dx, dy);

            if (dist < e.speed + 1) {
              e.x = targetWp.x;
              e.y = targetWp.y;
              e.waypointIdx++;
            } else {
              e.x += (dx / dist) * e.speed;
              e.y += (dy / dist) * e.speed;
            }
          } else {
            // Reached core
            playSfx("hit");
            eng.screenShake = 12;
            eng.enemies.splice(i, 1);
            setLives(prev => {
              const newLives = prev - 1;
              if (newLives <= 0) {
                setGameOver(true);
                setWaveActive(false);
              }
              return Math.max(0, newLives);
            });
            eng.shockwaves.push({ x: 970, y: 480, radius: 10, maxRadius: 80, color: RED, speed: 5 });
          }
        }

        // 3. Orbital Strikes Detonation
        for (let i = eng.orbitalStrikes.length - 1; i >= 0; i--) {
          const os = eng.orbitalStrikes[i];
          os.progress++;

          if (os.progress === 15) {
            // Detonation frame
            eng.shockwaves.push({ x: os.x, y: os.y, radius: 15, maxRadius: os.radius * 1.5, color: CYAN, speed: 8 });

            // Damage all enemies in radius
            eng.enemies.forEach(e => {
              const d = Math.hypot(e.x - os.x, e.y - os.y);
              if (d <= os.radius) {
                const dmg = 350;
                e.hp -= dmg;
                eng.damageNumbers.push({
                  x: e.x + (Math.random() - 0.5) * 20,
                  y: e.y - 10,
                  vy: -2,
                  text: `ORBITAL! -${dmg}`,
                  color: CYAN,
                  size: 16,
                  life: 35
                });
              }
            });

            // Particles
            for (let pt = 0; pt < 40; pt++) {
              eng.particles.push({
                x: os.x,
                y: os.y,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                life: 30,
                color: CYAN,
                size: 3.5
              });
            }
          }

          if (os.progress >= os.maxFrames) {
            eng.orbitalStrikes.splice(i, 1);
          }
        }

        // Clear previous frame laser beams
        eng.laserBeams = [];

        // 4. Towers Aiming & Firing
        const isOverclocked = overclockActiveTimer > 0;

        eng.towers.forEach(t => {
          const effectiveFireRate = isOverclocked ? Math.max(5, Math.floor(t.fireRate / 3)) : t.fireRate;
          t.cooldown = (t.cooldown || 0) + 1;

          let bestEnemy = null;
          let bestProgress = -1;

          eng.enemies.forEach(e => {
            if (e.x < 0) return;
            const dist = Math.hypot(e.x - t.x, e.y - t.y);
            if (dist <= t.range) {
              const progress = e.waypointIdx * 1000 + e.x;
              if (progress > bestProgress) {
                bestProgress = progress;
                bestEnemy = e;
              }
            }
          });

          if (bestEnemy) {
            t.angle = Math.atan2(bestEnemy.y - t.y, bestEnemy.x - t.x);

            if (t.cooldown >= effectiveFireRate) {
              t.cooldown = 0;

              // Tower-Specific Visual FX
              if (t.type === "pawan") {
                // Continuous lightning arc
                playSfx("laser");
                eng.laserBeams.push({
                  x1: t.x,
                  y1: t.y,
                  x2: bestEnemy.x,
                  y2: bestEnemy.y,
                  color: t.color,
                  accent: t.accent,
                  width: 3
                });

                // Direct instant hit
                const isCrit = Math.random() < 0.2;
                const dmg = Math.floor(t.damage * (isCrit ? 1.8 : 1.0));
                bestEnemy.hp -= dmg;

                eng.damageNumbers.push({
                  x: bestEnemy.x,
                  y: bestEnemy.y - 12,
                  vy: -1.2,
                  text: isCrit ? `CRIT! -${dmg}` : `-${dmg}`,
                  color: isCrit ? GOLD_LIGHT : CYAN,
                  size: isCrit ? 14 : 11,
                  life: 25
                });

                // Sparks on enemy hull
                for (let s = 0; s < 5; s++) {
                  eng.particles.push({
                    x: bestEnemy.x,
                    y: bestEnemy.y,
                    vx: (Math.random() - 0.5) * 4,
                    vy: (Math.random() - 0.5) * 4,
                    life: 12,
                    color: CYAN,
                    size: 2
                  });
                }
              } else if (t.type === "agni") {
                playSfx("cannon");
                eng.projectiles.push({
                  x: t.x,
                  y: t.y,
                  targetEnemy: bestEnemy,
                  targetPos: { x: bestEnemy.x, y: bestEnemy.y },
                  type: "agni",
                  damage: t.damage,
                  splashRadius: t.splashRadius,
                  color: t.color,
                  speed: 10
                });
              } else if (t.type === "vajra") {
                playSfx("laser");
                // Cryo ring pulse
                eng.shockwaves.push({ x: t.x, y: t.y, radius: 10, maxRadius: t.range, color: PURPLE, speed: 7 });
                eng.enemies.forEach(e => {
                  if (Math.hypot(e.x - t.x, e.y - t.y) <= t.range) {
                    e.hp -= t.damage;
                    e.slowTimer = 90; // 1.5s slow
                    eng.damageNumbers.push({
                      x: e.x,
                      y: e.y - 10,
                      vy: -1,
                      text: `SLOW -${t.damage}`,
                      color: PURPLE,
                      size: 11,
                      life: 20
                    });
                  }
                });
              } else if (t.type === "garuda") {
                playSfx("cannon");
                eng.screenShake = 6;
                // Heavy Titan Beam
                eng.laserBeams.push({
                  x1: t.x,
                  y1: t.y,
                  x2: bestEnemy.x,
                  y2: bestEnemy.y,
                  color: GOLD,
                  accent: "#ffffff",
                  width: 7
                });

                bestEnemy.hp -= t.damage;
                eng.damageNumbers.push({
                  x: bestEnemy.x,
                  y: bestEnemy.y - 15,
                  vy: -1.6,
                  text: `TITAN! -${t.damage}`,
                  color: GOLD_LIGHT,
                  size: 16,
                  life: 30
                });

                for (let s = 0; s < 12; s++) {
                  eng.particles.push({
                    x: bestEnemy.x,
                    y: bestEnemy.y,
                    vx: (Math.random() - 0.5) * 6,
                    vy: (Math.random() - 0.5) * 6,
                    life: 20,
                    color: GOLD,
                    size: 3
                  });
                }
              }
            }
          }
        });

        // 5. Projectiles Trajectory & Collisions
        for (let i = eng.projectiles.length - 1; i >= 0; i--) {
          const p = eng.projectiles[i];
          const destX = p.targetEnemy.hp > 0 ? p.targetEnemy.x : p.targetPos.x;
          const destY = p.targetEnemy.hp > 0 ? p.targetEnemy.y : p.targetPos.y;

          const dx = destX - p.x;
          const dy = destY - p.y;
          const dist = Math.hypot(dx, dy);

          // Smoke trail
          eng.particles.push({
            x: p.x,
            y: p.y,
            vx: (Math.random() - 0.5) * 0.8,
            vy: (Math.random() - 0.5) * 0.8,
            life: 14,
            color: "rgba(249, 115, 22, 0.4)",
            size: 3
          });

          if (dist < p.speed + 4) {
            // Cannon impact
            eng.screenShake = 7;
            eng.shockwaves.push({ x: p.x, y: p.y, radius: 8, maxRadius: p.splashRadius, color: ORANGE, speed: 6 });

            eng.enemies.forEach(e => {
              const d = Math.hypot(e.x - p.x, e.y - p.y);
              if (d <= p.splashRadius) {
                e.hp -= p.damage;
                eng.damageNumbers.push({
                  x: e.x + (Math.random() - 0.5) * 16,
                  y: e.y - 12,
                  vy: -1.4,
                  text: `BLAST -${p.damage}`,
                  color: ORANGE,
                  size: 13,
                  life: 25
                });
              }
            });

            // Fire embers
            for (let pt = 0; pt < 18; pt++) {
              eng.particles.push({
                x: p.x,
                y: p.y,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                life: 22,
                color: ORANGE,
                size: 3
              });
            }

            eng.projectiles.splice(i, 1);
          } else {
            p.x += (dx / dist) * p.speed;
            p.y += (dy / dist) * p.speed;
          }
        }

        // 6. Shockwaves Expansion
        for (let i = eng.shockwaves.length - 1; i >= 0; i--) {
          const sw = eng.shockwaves[i];
          sw.radius += sw.speed;
          if (sw.radius >= sw.maxRadius) {
            eng.shockwaves.splice(i, 1);
          }
        }

        // 7. Enemy Shatter & Death
        for (let i = eng.enemies.length - 1; i >= 0; i--) {
          const e = eng.enemies[i];
          if (e.hp <= 0) {
            playSfx("coin");
            setGold(g => g + e.reward);
            setScore(s => s + e.reward * 12);

            // Sharded cyber explosion
            for (let pt = 0; pt < 14; pt++) {
              const angle = Math.random() * Math.PI * 2;
              const spd = 2 + Math.random() * 4;
              eng.particles.push({
                x: e.x,
                y: e.y,
                vx: Math.cos(angle) * spd,
                vy: Math.sin(angle) * spd,
                life: 24,
                color: e.color,
                size: 2.8
              });
            }

            // Coin drop text
            eng.damageNumbers.push({
              x: e.x,
              y: e.y - 20,
              vy: -1.2,
              text: `+${e.reward}g`,
              color: GOLD_LIGHT,
              size: 14,
              life: 30
            });

            eng.enemies.splice(i, 1);
          }
        }

        // 8. Damage Numbers Drift
        for (let i = eng.damageNumbers.length - 1; i >= 0; i--) {
          const dn = eng.damageNumbers[i];
          dn.y += dn.vy;
          dn.life--;
          if (dn.life <= 0) {
            eng.damageNumbers.splice(i, 1);
          }
        }

        // 9. Particles Decay
        for (let i = eng.particles.length - 1; i >= 0; i--) {
          const pt = eng.particles[i];
          pt.x += pt.vx;
          pt.y += pt.vy;
          pt.life--;
          if (pt.life <= 0) {
            eng.particles.splice(i, 1);
          }
        }

        // 10. Wave Clear Check
        if (eng.spawnQueue.length === 0 && eng.enemies.length === 0 && waveActive) {
          setWaveActive(false);
          setGold(g => g + 60 + wave * 15);
          if (wave >= 15) {
            setVictory(true);
          } else {
            setWave(w => w + 1);
          }
        }
      }

      // --- 11. GRAPHICS RENDERING (CANVAS 2D WITH SCREEN SHAKE) ---
      ctx.save();

      // Screen Shake translation
      if (eng.screenShake > 0) {
        ctx.translate((Math.random() - 0.5) * eng.screenShake, (Math.random() - 0.5) * eng.screenShake);
        eng.screenShake *= 0.88;
        if (eng.screenShake < 0.2) eng.screenShake = 0;
      }

      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Deep Motherboard Carbon Background
      ctx.fillStyle = BG_DARK;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Cyber Circuit Traces across ground
      ctx.strokeStyle = "rgba(56, 189, 248, 0.05)";
      ctx.lineWidth = 1;
      for (let x = 0; x < CANVAS_WIDTH; x += 35) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, CANVAS_HEIGHT);
        ctx.stroke();
      }
      for (let y = 0; y < CANVAS_HEIGHT; y += 35) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(CANVAS_WIDTH, y);
        ctx.stroke();
      }

      // Draw Highway Road (Futuristic Energy Conduits)
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      // Highway Bed
      ctx.strokeStyle = "rgba(30, 41, 59, 0.9)";
      ctx.lineWidth = 50;
      ctx.beginPath();
      ctx.moveTo(PATH_WAYPOINTS[0].x, PATH_WAYPOINTS[0].y);
      for (let i = 1; i < PATH_WAYPOINTS.length; i++) {
        ctx.lineTo(PATH_WAYPOINTS[i].x, PATH_WAYPOINTS[i].y);
      }
      ctx.stroke();

      // Neon Highway Edge Rails
      ctx.strokeStyle = "rgba(56, 189, 248, 0.35)";
      ctx.lineWidth = 54;
      ctx.beginPath();
      ctx.moveTo(PATH_WAYPOINTS[0].x, PATH_WAYPOINTS[0].y);
      for (let i = 1; i < PATH_WAYPOINTS.length; i++) {
        ctx.lineTo(PATH_WAYPOINTS[i].x, PATH_WAYPOINTS[i].y);
      }
      ctx.stroke();

      ctx.strokeStyle = "#090d1a";
      ctx.lineWidth = 44;
      ctx.stroke();

      // Animated Arrow Chevrons along road showing enemy direction
      ctx.strokeStyle = "rgba(56, 189, 248, 0.25)";
      ctx.lineWidth = 2;
      ctx.setLineDash([10, 15]);
      ctx.lineDashOffset = -globalFrame * 0.8;
      ctx.stroke();
      ctx.setLineDash([]); // reset

      // Draw Home Sanctuary Core Reactor (Goal)
      const coreX = 970, coreY = 480;
      const corePulse = Math.sin(globalFrame * 0.08) * 4;

      ctx.fillStyle = "rgba(212, 175, 55, 0.15)";
      ctx.beginPath();
      ctx.arc(coreX, coreY, 36 + corePulse, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = GOLD;
      ctx.shadowColor = GOLD;
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.arc(coreX, coreY, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.fillStyle = "#000";
      ctx.font = "bold 13px system-ui";
      ctx.textAlign = "center";
      ctx.fillText("CORE", coreX, coreY + 5);

      // Draw Placed Towers
      const isOverclockedNow = overclockActiveTimer > 0;

      eng.towers.forEach(t => {
        const isSelected = selectedTower && selectedTower.id === t.id;

        // Overclock Frenzy Aura
        if (isOverclockedNow) {
          ctx.strokeStyle = "rgba(212, 175, 55, 0.6)";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(t.x, t.y, 24 + Math.sin(globalFrame * 0.2) * 4, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Range Circle
        if (isSelected) {
          ctx.strokeStyle = "rgba(212, 175, 55, 0.5)";
          ctx.fillStyle = "rgba(212, 175, 55, 0.08)";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(t.x, t.y, t.range, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }

        // Turret Base Plinth
        ctx.fillStyle = "#1e293b";
        ctx.strokeStyle = isSelected ? GOLD : t.color;
        ctx.lineWidth = isSelected ? 3 : 1.5;
        ctx.shadowColor = t.color;
        ctx.shadowBlur = isSelected ? 12 : 5;
        ctx.beginPath();
        ctx.arc(t.x, t.y, 19, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Rotating Turret Barrel with Human Defender Soldier Operator
        ctx.save();
        ctx.translate(t.x, t.y);
        ctx.rotate(t.angle || 0);

        // Turret Cannon Barrel
        ctx.fillStyle = t.color;
        ctx.fillRect(0, -4, 20, 8);

        ctx.fillStyle = "#020617";
        ctx.beginPath();
        ctx.arc(0, 0, 9, 0, Math.PI * 2);
        ctx.fill();

        // Muzzle Glow
        ctx.fillStyle = t.accent;
        ctx.beginPath();
        ctx.arc(14, 0, 3, 0, Math.PI * 2);
        ctx.fill();

        // Human Defender Operator behind the controls
        ctx.fillStyle = "#1e3a8a"; // Defender Tactical Uniform
        ctx.fillRect(-8, -5, 6, 10);

        // Hands on handles
        ctx.fillStyle = "#fed7aa";
        ctx.beginPath();
        ctx.arc(-1, -4, 2, 0, Math.PI * 2);
        ctx.arc(-1, 4, 2, 0, Math.PI * 2);
        ctx.fill();

        // Defender Head with Golden Helmet
        ctx.fillStyle = GOLD;
        ctx.beginPath();
        ctx.arc(-6, 0, 4.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        // Tower Level
        ctx.fillStyle = GOLD_LIGHT;
        ctx.font = "bold 10px monospace";
        ctx.textAlign = "center";
        ctx.fillText(`L${t.level || 1}`, t.x, t.y + 30);
      });

      // Draw Laser Beams (High-Tech Electric Arcs)
      eng.laserBeams.forEach(lb => {
        ctx.strokeStyle = lb.accent;
        ctx.shadowColor = lb.color;
        ctx.shadowBlur = 15;
        ctx.lineWidth = lb.width;
        ctx.beginPath();
        ctx.moveTo(lb.x1, lb.y1);
        // Jagged electric jitter
        const midX = (lb.x1 + lb.x2) / 2 + (Math.random() - 0.5) * 8;
        const midY = (lb.y1 + lb.y2) / 2 + (Math.random() - 0.5) * 8;
        ctx.lineTo(midX, midY);
        ctx.lineTo(lb.x2, lb.y2);
        ctx.stroke();
        ctx.shadowBlur = 0;
      });

      // Draw Enemies (Animated Human Soldiers, Commandos, Heavies, and Warlords)
      eng.enemies.forEach(e => {
        if (e.x < 0) return;

        // Calculate walking orientation angle
        const targetWp = PATH_WAYPOINTS[e.waypointIdx + 1];
        let angle = 0;
        if (targetWp) {
          angle = Math.atan2(targetWp.y - e.y, targetWp.x - e.x);
        }

        ctx.save();
        ctx.translate(e.x, e.y);

        // Freeze / Slow Aura
        if (e.freezeTimer > 0) {
          ctx.strokeStyle = CYAN;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(0, 0, e.size + 8, 0, Math.PI * 2);
          ctx.stroke();
        } else if (e.slowTimer > 0) {
          ctx.strokeStyle = PURPLE;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(0, 0, e.size + 6, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Rotate in march direction
        ctx.rotate(angle);

        // 1. Soft Oval Ground Shadow Under Feet
        ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
        ctx.beginPath();
        ctx.ellipse(0, 4, e.size * 0.95, e.size * 0.55, 0, 0, Math.PI * 2);
        ctx.fill();

        // Walking Leg Strides Animation
        const isFrozen = e.freezeTimer > 0;
        const stride = isFrozen ? 0 : Math.sin(e.animFrame * 1.6) * (e.size * 0.65);
        const bob = isFrozen ? 0 : Math.abs(Math.cos(e.animFrame * 1.6)) * 1.5;

        // 2. Human Walking Legs (Left & Right Leg Alternating)
        ctx.fillStyle = "#1e293b"; // Tactical Combat Trousers
        ctx.fillRect(-e.size * 0.35, -stride - 3, e.size * 0.35, e.size * 0.85);
        ctx.fillRect(e.size * 0.05, stride - 3, e.size * 0.35, e.size * 0.85);

        // Combat Boots
        ctx.fillStyle = "#0f172a";
        ctx.fillRect(-e.size * 0.4, -stride + e.size * 0.45, e.size * 0.4, e.size * 0.4);
        ctx.fillRect(e.size * 0.05, stride + e.size * 0.45, e.size * 0.4, e.size * 0.4);

        // 3. Human Torso & Armor Uniform
        ctx.fillStyle = e.color;
        ctx.beginPath();
        ctx.roundRect(-e.size * 0.55, -e.size * 0.45 - bob, e.size * 1.1, e.size * 0.95, 3);
        ctx.fill();

        // Tactical Flak Vest / Chestplate
        ctx.fillStyle = "#090d16";
        ctx.fillRect(-e.size * 0.35, -e.size * 0.35 - bob, e.size * 0.7, e.size * 0.55);

        // 4. Arms & Hands holding Military Carbine / Rifle
        const armSwing = isFrozen ? 0 : Math.cos(e.animFrame * 1.6) * 3;
        ctx.fillStyle = "#fed7aa"; // Human Skin Tone Hands
        ctx.beginPath();
        ctx.arc(e.size * 0.55, -bob + armSwing, 2.5, 0, Math.PI * 2);
        ctx.arc(e.size * 0.55, 6 - bob, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Combat Weapon Pointing in March Direction
        ctx.fillStyle = "#334155";
        ctx.fillRect(e.size * 0.25, -bob + 2, e.size * 0.95, 4);
        ctx.fillStyle = e.color; // Muzzle
        ctx.fillRect(e.size * 1.15, -bob + 2.5, 3.5, 3);

        // 5. Human Head, Face & Combat Helmet
        // Neck & Face Skin
        ctx.fillStyle = "#fed7aa";
        ctx.beginPath();
        ctx.arc(0, -e.size * 0.15 - bob, e.size * 0.35, 0, Math.PI * 2);
        ctx.fill();

        // Combat Helmet / Beret / Warlord Crown
        ctx.fillStyle = e.type === "boss" ? GOLD : e.color;
        ctx.beginPath();
        ctx.arc(0, -e.size * 0.25 - bob, e.size * 0.45, 0, Math.PI * 2);
        ctx.fill();

        // Glowing Tactical Visor / Goggles
        ctx.fillStyle = CYAN;
        ctx.fillRect(e.size * 0.05, -e.size * 0.35 - bob, e.size * 0.35, 3);

        // Warlord Boss Crimson Cape Fluttering
        if (e.type === "boss") {
          const capeWave = Math.sin(e.animFrame * 2) * 5;
          ctx.fillStyle = "#dc2626";
          ctx.beginPath();
          ctx.moveTo(-e.size * 0.5, -bob);
          ctx.lineTo(-e.size * 1.5, -e.size * 0.8 + capeWave);
          ctx.lineTo(-e.size * 1.3, e.size * 0.8 + capeWave);
          ctx.closePath();
          ctx.fill();
        }

        ctx.restore();

        // Health Bar above soldier
        const barW = Math.max(26, e.size * 2);
        const barH = 4;
        const barX = e.x - barW / 2;
        const barY = e.y - e.size - 12;

        ctx.fillStyle = "rgba(0,0,0,0.85)";
        ctx.fillRect(barX, barY, barW, barH);
        ctx.fillStyle = GREEN;
        ctx.fillRect(barX, barY, barW * Math.max(0, e.hp / e.maxHp), barH);
      });

      // Draw Projectiles
      eng.projectiles.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // Draw Shockwaves (Expanding Ripple Rings)
      eng.shockwaves.forEach(sw => {
        const alpha = Math.max(0, 1 - sw.radius / sw.maxRadius);
        ctx.strokeStyle = sw.color;
        ctx.lineWidth = 3;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1.0;
      });

      // Draw Orbital Strike Laser Animation
      eng.orbitalStrikes.forEach(os => {
        // Reticle
        ctx.strokeStyle = CYAN;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(os.x, os.y, os.radius, 0, Math.PI * 2);
        ctx.stroke();

        if (os.progress > 8 && os.progress < 22) {
          // Blinding Sky Laser
          ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
          ctx.shadowColor = CYAN;
          ctx.shadowBlur = 30;
          ctx.fillRect(os.x - 25, 0, 50, os.y);
          ctx.shadowBlur = 0;
        }
      });

      // Draw Floating Damage Numbers
      eng.damageNumbers.forEach(dn => {
        ctx.fillStyle = dn.color;
        ctx.font = `bold ${dn.size}px monospace`;
        ctx.textAlign = "center";
        ctx.fillText(dn.text, dn.x, dn.y);
      });

      // Draw Particles
      eng.particles.forEach(pt => {
        ctx.fillStyle = pt.color;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.restore(); // Restore screen shake
    };

    animId = requestAnimationFrame(gameLoop);

    return () => cancelAnimationFrame(animId);
  }, [gameSpeed, waveActive, gameOver, selectedTower, overclockActiveTimer]);

  // Canvas Click: Build Tower or Cast Orbital Strike
  const handleCanvasClick = (e) => {
    initAudio();
    if (gameOver || victory) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;
    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;

    // If casting orbital strike
    if (targetingOrbital) {
      triggerOrbitalStrikeAt(clickX, clickY);
      return;
    }

    const eng = engineRef.current;

    // Check if clicked an existing tower
    const clickedTower = eng.towers.find(t => Math.hypot(t.x - clickX, t.y - clickY) <= 24);
    if (clickedTower) {
      playSfx("laser");
      setSelectedTower(clickedTower);
      return;
    }

    setSelectedTower(null);

    // Can't build on highway road
    if (isPositionOnPath(clickX, clickY)) {
      playSfx("hit");
      return;
    }

    // Check overlap
    const overlap = eng.towers.some(t => Math.hypot(t.x - clickX, t.y - clickY) < 38);
    if (overlap) return;

    const towerDef = TOWER_TYPES[selectedTool];
    if (!towerDef || gold < towerDef.cost) {
      playSfx("hit");
      return;
    }

    playSfx("cannon");
    setGold(g => g - towerDef.cost);

    const newTower = {
      id: Math.random(),
      type: towerDef.id,
      name: towerDef.name,
      x: clickX,
      y: clickY,
      range: towerDef.range,
      damage: towerDef.damage,
      fireRate: towerDef.fireRate,
      splashRadius: towerDef.splashRadius || 0,
      slowFactor: towerDef.slowFactor || 0,
      color: towerDef.color,
      accent: towerDef.accent,
      level: 1,
      cooldown: 0,
      angle: 0
    };

    eng.towers.push(newTower);
    setSelectedTower(newTower);
  };

  const handleUpgradeTower = () => {
    if (!selectedTower) return;
    const upgradeCost = Math.floor(TOWER_TYPES[selectedTower.type].cost * 1.25 * (selectedTower.level || 1));
    if (gold < upgradeCost) return;

    playSfx("cannon");
    setGold(g => g - upgradeCost);
    selectedTower.level = (selectedTower.level || 1) + 1;
    selectedTower.damage = Math.floor(selectedTower.damage * 1.4);
    selectedTower.range = Math.floor(selectedTower.range * 1.12);
    setSelectedTower({ ...selectedTower });
  };

  const handleSellTower = () => {
    if (!selectedTower) return;
    const refund = Math.floor(TOWER_TYPES[selectedTower.type].cost * 0.65);
    playSfx("coin");
    setGold(g => g + refund);

    const eng = engineRef.current;
    eng.towers = eng.towers.filter(t => t.id !== selectedTower.id);
    setSelectedTower(null);
  };

  const handleRestart = () => {
    const eng = engineRef.current;
    eng.towers = [];
    eng.enemies = [];
    eng.projectiles = [];
    eng.laserBeams = [];
    eng.shockwaves = [];
    eng.damageNumbers = [];
    eng.particles = [];
    eng.orbitalStrikes = [];
    eng.spawnQueue = [];
    eng.spawnTimer = 0;
    eng.waveNumber = 1;
    eng.screenShake = 0;

    setGold(380);
    setLives(20);
    setWave(1);
    setScore(0);
    setWaveActive(false);
    setGameOver(false);
    setVictory(false);
    setSelectedTower(null);
    setOrbitalCooldown(0);
    setEmpCooldown(0);
    setOverclockCooldown(0);
    setOverclockActiveTimer(0);
  };

  return (
    <div style={{ minHeight: "100vh", background: BG_DARK, color: "#f8fafc", fontFamily: "system-ui, sans-serif", display: "flex", flexDirection: "column" }}>
      <SEOHead
        title="GARUDA Sovereign Defense — High-Tech Tower Defense Arcade"
        description="High-octane, neon cybernetic tower defense. Electric lightning turrets, orbital satellite strikes, EMP chrono-freezes, and Goliath mech bosses in 60 FPS Canvas."
        canonical="https://www.garudaos.in/play"
      />

      {/* --- Top Sovereign Cyber HUD --- */}
      <header style={{ background: "rgba(15, 23, 42, 0.95)", borderBottom: `1px solid rgba(56,189,248,0.25)`, padding: "0.6rem 1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <Link to="/entertainment" style={{ textDecoration: "none", color: GOLD, fontSize: "0.85rem", fontWeight: "bold" }}>
            ← Back to Studio
          </Link>
          <div style={{ width: "1px", height: "18px", background: "rgba(255,255,255,0.2)" }} />
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontSize: "1.3rem" }}>🦅</span>
            <span style={{ color: "#fff", fontWeight: "900", fontSize: "1.1rem", letterSpacing: "0.03em" }}>
              GARUDA: SOVEREIGN DEFENSE
            </span>
            <span style={{ background: "rgba(56,189,248,0.15)", color: CYAN, border: `1px solid rgba(56,189,248,0.3)`, padding: "2px 8px", borderRadius: "999px", fontSize: "0.7rem", fontWeight: "bold" }}>
              HIGH-TECH ARCADE
            </span>
          </div>
        </div>

        {/* Real-time Status Badges */}
        <div style={{ display: "flex", alignItems: "center", gap: "1.25rem", flexWrap: "wrap" }}>
          <div style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(239,68,68,0.35)", borderRadius: "8px", padding: "0.3rem 0.8rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <span style={{ fontSize: "1.1rem" }}>❤️</span>
            <span style={{ fontWeight: "900", color: RED, fontSize: "1.05rem" }}>{lives}</span>
            <span style={{ fontSize: "0.7rem", color: "#94a3b8" }}>LIVES</span>
          </div>

          <div style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(212,175,55,0.35)", borderRadius: "8px", padding: "0.3rem 0.8rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <span style={{ fontSize: "1.1rem" }}>💰</span>
            <span style={{ fontWeight: "900", color: GOLD_LIGHT, fontSize: "1.05rem" }}>{gold}</span>
            <span style={{ fontSize: "0.7rem", color: "#94a3b8" }}>GOLD</span>
          </div>

          <div style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(56,189,248,0.35)", borderRadius: "8px", padding: "0.3rem 0.8rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <span style={{ fontSize: "1.1rem" }}>🌊</span>
            <span style={{ fontWeight: "900", color: CYAN, fontSize: "1.05rem" }}>WAVE {wave}/15</span>
          </div>

          <div style={{ display: "flex", gap: "0.4rem" }}>
            <button
              type="button"
              onClick={() => setGameSpeed(s => s === 1 ? 2 : 1)}
              style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "6px", color: gameSpeed === 2 ? GOLD : "#fff", padding: "0.35rem 0.7rem", fontSize: "0.75rem", fontWeight: "bold", cursor: "pointer" }}
            >
              ⏩ {gameSpeed}x Speed
            </button>
            <button
              type="button"
              onClick={() => setSoundOn(!soundOn)}
              style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "6px", color: soundOn ? CYAN : "#64748b", padding: "0.35rem 0.6rem", fontSize: "0.75rem", cursor: "pointer" }}
            >
              {soundOn ? "🔊" : "🔇"}
            </button>
          </div>
        </div>
      </header>

      {/* --- Main Battlefield Area --- */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "0.75rem", maxWidth: "1200px", margin: "0 auto", width: "100%", boxSizing: "border-box" }}>
        
        {/* The 60 FPS Canvas Map Viewport */}
        <div style={{ position: "relative", width: "100%", maxWidth: "1000px", borderRadius: "14px", overflow: "hidden", border: `2px solid rgba(56,189,248,0.3)`, boxShadow: "0 10px 40px rgba(0,0,0,0.9)" }}>
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            onClick={handleCanvasClick}
            style={{ width: "100%", height: "auto", display: "block", cursor: targetingOrbital ? "crosshair" : "crosshair" }}
          />

          {/* Active Targeting Banner if Orbital Strike is Selected */}
          {targetingOrbital && (
            <div style={{ position: "absolute", top: "1rem", left: "50%", transform: "translateX(-50%)", background: "rgba(239,68,68,0.9)", padding: "0.4rem 1.5rem", borderRadius: "999px", color: "#fff", fontWeight: "bold", fontSize: "0.85rem", zIndex: 15, boxShadow: "0 0 20px rgba(239,68,68,0.8)" }}>
              🎯 CLICK ANYWHERE ON MAP TO CALL ORBITAL LASER STRIKE!
            </div>
          )}

          {/* Start Next Wave Floating Button */}
          {!waveActive && !gameOver && !victory && !targetingOrbital && (
            <div style={{ position: "absolute", bottom: "1.5rem", left: "50%", transform: "translateX(-50%)", zIndex: 10 }}>
              <button
                type="button"
                onClick={startNextWave}
                style={{
                  background: "linear-gradient(135deg, #10b981, #059669)",
                  color: "#fff",
                  border: "none",
                  borderRadius: "999px",
                  padding: "0.85rem 2.5rem",
                  fontSize: "1.1rem",
                  fontWeight: "900",
                  letterSpacing: "0.05em",
                  cursor: "pointer",
                  boxShadow: "0 0 25px rgba(16,185,129,0.7)",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.6rem"
                }}
              >
                <span>▶</span> START WAVE {wave}
              </button>
            </div>
          )}

          {/* Game Over Screen */}
          {gameOver && (
            <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 20 }}>
              <span style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>💀</span>
              <h2 style={{ color: RED, fontSize: "2rem", margin: "0 0 0.5rem" }}>SANCTUARY CORE BREACHED!</h2>
              <p style={{ color: "#94a3b8", margin: "0 0 1.5rem", fontSize: "0.95rem" }}>Reached Wave {wave} · Final Score: {score.toLocaleString()}</p>
              <button
                type="button"
                onClick={handleRestart}
                style={{ background: "linear-gradient(135deg, #ef4444, #b91c1c)", color: "#fff", fontWeight: "bold", border: "none", borderRadius: "8px", padding: "0.75rem 2rem", fontSize: "1rem", cursor: "pointer" }}
              >
                🔄 Deploy Again
              </button>
            </div>
          )}

          {/* Victory Screen */}
          {victory && (
            <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 20 }}>
              <span style={{ fontSize: "3.5rem", marginBottom: "0.5rem" }}>👑</span>
              <h2 style={{ color: GOLD_LIGHT, fontSize: "2.2rem", margin: "0 0 0.5rem" }}>TOTAL SOVEREIGN VICTORY!</h2>
              <p style={{ color: "#cbd5e1", margin: "0 0 1.5rem", fontSize: "1rem" }}>All 15 Waves annihilated. Core preserved. Score: {score.toLocaleString()}</p>
              <button
                type="button"
                onClick={handleRestart}
                style={{ background: "linear-gradient(135deg, #d4af37, #b8860b)", color: "#000", fontWeight: "bold", border: "none", borderRadius: "8px", padding: "0.75rem 2rem", fontSize: "1rem", cursor: "pointer" }}
              >
                🔄 Play Again
              </button>
            </div>
          )}
        </div>

        {/* --- Sovereign Active Astra Super-Powers Bar (Player God Powers) --- */}
        <div style={{ width: "100%", maxWidth: "1000px", marginTop: "0.75rem", background: "rgba(15, 23, 42, 0.9)", border: "1px solid rgba(56,189,248,0.25)", borderRadius: "12px", padding: "0.6rem 1rem", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ color: GOLD, fontSize: "1.1rem" }}>⚡</span>
            <span style={{ fontSize: "0.8rem", fontWeight: "bold", color: "#fff", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              SOVEREIGN ACTIVE ASTRAS:
            </span>
          </div>

          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            {/* Astra 1: Orbital Strike */}
            <button
              type="button"
              onClick={() => setTargetingOrbital(!targetingOrbital)}
              disabled={orbitalCooldown > 0}
              style={{
                background: orbitalCooldown > 0 ? "rgba(255,255,255,0.08)" : targetingOrbital ? "rgba(239,68,68,0.4)" : "linear-gradient(135deg, #0284c7, #38bdf8)",
                border: targetingOrbital ? `2px solid ${RED}` : "none",
                borderRadius: "8px",
                color: orbitalCooldown > 0 ? "#64748b" : "#fff",
                padding: "0.45rem 0.9rem",
                fontSize: "0.8rem",
                fontWeight: "bold",
                cursor: orbitalCooldown > 0 ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.4rem"
              }}
            >
              <span>🛰️</span> Orbital Strike {orbitalCooldown > 0 ? `(${orbitalCooldown}s)` : targetingOrbital ? "[READY TARGET]" : "[ACTIVATE]"}
            </button>

            {/* Astra 2: EMP Chrono Freeze */}
            <button
              type="button"
              onClick={triggerEmpFreeze}
              disabled={empCooldown > 0}
              style={{
                background: empCooldown > 0 ? "rgba(255,255,255,0.08)" : "linear-gradient(135deg, #7c3aed, #a855f7)",
                border: "none",
                borderRadius: "8px",
                color: empCooldown > 0 ? "#64748b" : "#fff",
                padding: "0.45rem 0.9rem",
                fontSize: "0.8rem",
                fontWeight: "bold",
                cursor: empCooldown > 0 ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.4rem"
              }}
            >
              <span>⏱️</span> EMP Freeze (4.5s) {empCooldown > 0 ? `(${empCooldown}s)` : "[ACTIVATE]"}
            </button>

            {/* Astra 3: Overclock Gatling Protocol */}
            <button
              type="button"
              onClick={triggerOverclock}
              disabled={overclockCooldown > 0}
              style={{
                background: overclockCooldown > 0 ? "rgba(255,255,255,0.08)" : overclockActiveTimer > 0 ? "rgba(212,175,55,0.4)" : "linear-gradient(135deg, #d4af37, #b8860b)",
                border: overclockActiveTimer > 0 ? `2px solid ${GOLD}` : "none",
                borderRadius: "8px",
                color: overclockCooldown > 0 ? "#64748b" : "#000",
                padding: "0.45rem 0.9rem",
                fontSize: "0.8rem",
                fontWeight: "bold",
                cursor: overclockCooldown > 0 ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.4rem"
              }}
            >
              <span>🔥</span> Overclock 3x {overclockActiveTimer > 0 ? `[FRENZY: ${overclockActiveTimer}s]` : overclockCooldown > 0 ? `(${overclockCooldown}s)` : "[ACTIVATE]"}
            </button>
          </div>
        </div>

        {/* --- Bottom Arsenal Dock: Turret Selection & Inspector --- */}
        <div style={{ width: "100%", maxWidth: "1000px", marginTop: "0.75rem", display: "grid", gridTemplateColumns: selectedTower ? "1fr 310px" : "1fr", gap: "0.75rem" }}>
          
          {/* Tower Selection Palette */}
          <div style={{ background: "rgba(15, 23, 42, 0.8)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", padding: "0.75rem 1rem", display: "flex", alignItems: "center", justifyContent: "space-around", flexWrap: "wrap", gap: "0.6rem" }}>
            <div style={{ fontSize: "0.75rem", color: "#94a3b8", fontWeight: "bold" }}>BUILD TURRET:</div>
            {Object.values(TOWER_TYPES).map(t => {
              const isSelected = selectedTool === t.id;
              const canAfford = gold >= t.cost;

              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => { setSelectedTool(t.id); setSelectedTower(null); setTargetingOrbital(false); }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.55rem",
                    padding: "0.45rem 0.9rem",
                    borderRadius: "10px",
                    border: isSelected ? `2px solid ${t.color}` : "1px solid rgba(255,255,255,0.1)",
                    background: isSelected ? "rgba(56, 189, 248, 0.2)" : "rgba(0,0,0,0.4)",
                    color: canAfford ? "#fff" : "#64748b",
                    cursor: "pointer",
                    transition: "transform 0.1s ease",
                    transform: isSelected ? "scale(1.05)" : "scale(1)"
                  }}
                >
                  <span style={{ fontSize: "1.3rem" }}>{t.icon}</span>
                  <div style={{ textAlign: "left" }}>
                    <div style={{ fontWeight: "bold", fontSize: "0.82rem", color: t.color }}>{t.name}</div>
                    <div style={{ fontSize: "0.72rem", color: GOLD_LIGHT }}>{t.cost} Gold</div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Selected Tower Inspector */}
          {selectedTower && (
            <div style={{ background: "rgba(15, 23, 42, 0.95)", border: `1px solid ${GOLD}`, borderRadius: "12px", padding: "0.75rem 1rem", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: "bold", color: GOLD_LIGHT, fontSize: "0.88rem" }}>
                    {selectedTower.name} (L{selectedTower.level || 1})
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedTower(null)}
                    style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "1rem" }}
                  >
                    ✕
                  </button>
                </div>
                <div style={{ fontSize: "0.72rem", color: "#cbd5e1", margin: "0.25rem 0" }}>
                  Damage: <strong style={{ color: RED }}>{selectedTower.damage}</strong> · Range: <strong style={{ color: CYAN }}>{selectedTower.range}</strong>
                </div>
              </div>

              <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.4rem" }}>
                <button
                  type="button"
                  onClick={handleUpgradeTower}
                  disabled={gold < Math.floor(TOWER_TYPES[selectedTower.type].cost * 1.25 * (selectedTower.level || 1))}
                  style={{
                    flex: 1,
                    background: "linear-gradient(135deg, #10b981, #059669)",
                    color: "#fff",
                    border: "none",
                    borderRadius: "6px",
                    padding: "0.4rem",
                    fontWeight: "bold",
                    fontSize: "0.75rem",
                    cursor: "pointer"
                  }}
                >
                  ⚡ Upgrade ({Math.floor(TOWER_TYPES[selectedTower.type].cost * 1.25 * (selectedTower.level || 1))}g)
                </button>
                <button
                  type="button"
                  onClick={handleSellTower}
                  style={{
                    background: "rgba(239,68,68,0.2)",
                    color: RED,
                    border: "1px solid rgba(239,68,68,0.4)",
                    borderRadius: "6px",
                    padding: "0.4rem 0.8rem",
                    fontWeight: "bold",
                    fontSize: "0.75rem",
                    cursor: "pointer"
                  }}
                >
                  Sell ({Math.floor(TOWER_TYPES[selectedTower.type].cost * 0.65)}g)
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
