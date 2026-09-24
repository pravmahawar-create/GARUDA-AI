// Haptics import removed — vibration completely disabled per founder mandate

// WebAudio Context for synthetic authentic sacred sounds
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// 1. Play Sacred Om Chant — full complete recording from archive.org
let omAudioElement: HTMLAudioElement | null = null;
let omPreloadEl: HTMLAudioElement | null = null;
let omWarmStarted = false;

// Warm cache at app boot so splash pe INSTANT play ho, full Om (om_new.mp3 8.4MB) bhi complete chale
export function warmOmAudio(): void {
  if (omWarmStarted) return;
  omWarmStarted = true;
  try {
    const el = new Audio();
    el.preload = 'auto';
    el.src = '/assets/audio/om_new.mp3';
    el.load();
    omPreloadEl = el;
  } catch (err) {
    console.warn('Om warm preload failed:', err);
  }
}

export function playOmAudio(): HTMLAudioElement | null {
  try {
    stopOmAudio(0);
    // om_new.mp3 = COMPLETE full Om (not cut). Preloaded at boot via warmOmAudio() → no 4s delay.
    const el = omPreloadEl || new Audio('/assets/audio/om_new.mp3');
    omPreloadEl = null;
    el.preload = 'auto';
    el.volume = 0.7;
    el.loop = true;
    el.play().catch((err) => {
      console.warn('Om audio play failed:', err);
      // Fallback: if warm element fails, fresh load
      if (el !== omAudioElement) return;
      const retry = new Audio('/assets/audio/om_new.mp3');
      retry.preload = 'auto';
      retry.volume = 0.7;
      retry.loop = true;
      retry.play().catch(() => {});
      omAudioElement = retry;
    });
    omAudioElement = el;
    return el;
  } catch (err) {
    console.warn('Om audio error:', err);
    return null;
  }
}

export function stopOmAudio(fadeMs = 1500): void {
  try {
    if (omAudioElement) {
      const el = omAudioElement;
      if (fadeMs <= 0) {
        el.pause();
        el.currentTime = 0;
        omAudioElement = null;
        return;
      }
      const steps = 20;
      const stepDur = fadeMs / steps;
      let step = 0;
      const fadeInterval = setInterval(() => {
        step++;
        el.volume = Math.max(0, el.volume - 0.7 / steps);
        if (step >= steps) {
          clearInterval(fadeInterval);
          el.pause();
          el.currentTime = 0;
          omAudioElement = null;
        }
      }, stepDur);
    }
  } catch (err) {
    console.warn('Stop Om audio error:', err);
  }
}

// 2. Play Authentic Temple Bell Chime (deep resonant gong, not synthetic ting)
export function playTempleBell(): void {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Deep bronze temple bell: lower frequencies, soft attack, long warm decay
    const freqs = [196, 262, 392, 523]; // G3, C4, G4, C5 — deep bell harmonics
    const gains = [0.18, 0.12, 0.06, 0.03];
    const delays = [0, 0.02, 0.05, 0.08]; // staggered attack for realism

    freqs.forEach((f, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now + delays[idx]);

      // Soft attack envelope — no harsh transient
      gain.gain.setValueAtTime(0.001, now + delays[idx]);
      gain.gain.linearRampToValueAtTime(gains[idx], now + delays[idx] + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 4.0);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + delays[idx]);
      osc.stop(now + 4.0);
    });

    triggerHaptic('light');
  } catch (err) {
    console.warn('Audio Context Bell error:', err);
  }
}

// 2. Play Japa Mala Bead Click & Chime
export function playBeadClick(): void {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.08);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.08);

    triggerHaptic('light');
  } catch (err) {
    console.warn('Bead click audio error:', err);
  }
}

// 3. Play Cosmic OM Vibration Drone (136.1 Hz)
let omOsc: OscillatorNode | null = null;
let omGain: GainNode | null = null;

export function startOmDrone(): void {
  try {
    const ctx = getAudioContext();
    if (omOsc) return;

    const now = ctx.currentTime;
    omOsc = ctx.createOscillator();
    omGain = ctx.createGain();

    // 136.1 Hz is the astronomical frequency of the Earth year / traditional Om tuning
    omOsc.type = 'sine';
    omOsc.frequency.setValueAtTime(136.1, now);

    omGain.gain.setValueAtTime(0.001, now);
    omGain.gain.linearRampToValueAtTime(0.25, now + 2.5);

    omOsc.connect(omGain);
    omGain.connect(ctx.destination);

    omOsc.start(now);
  } catch (err) {
    console.warn('OM Drone error:', err);
  }
}

export function stopOmDrone(): void {
  try {
    if (omOsc && omGain && audioCtx) {
      const now = audioCtx.currentTime;
      omGain.gain.linearRampToValueAtTime(0.0001, now + 1.0);
      setTimeout(() => {
        omOsc?.stop();
        omOsc?.disconnect();
        omOsc = null;
        omGain = null;
      }, 1000);
    }
  } catch (err) {
    console.warn('Stop OM Drone error:', err);
  }
}

// 4. Haptic Vibration Trigger — SILENT MODE for sacred/sacred app feel
// All vibration removed per founder mandate: opening must feel SILENT → SACRED → ROYAL → CINEMATIC
export async function triggerHaptic(_style: 'light' | 'medium' | 'heavy' = 'medium'): Promise<void> {
  // Vibration completely disabled — no navigator.vibrate, no Capacitor Haptics
  // The app must feel sacred and silent on launch and interaction
}

// 5. Global HTML5 Devotional Music Player
class DevotionalAudioPlayer {
  private audio: HTMLAudioElement;
  public isPlaying: boolean = false;
  public currentTrackId: string | null = null;
  public currentTime: number = 0;
  public duration: number = 0;
  private onStateChangeCallbacks: Array<() => void> = [];

  constructor() {
    this.audio = new Audio();
    this.audio.preload = 'auto';

    this.audio.addEventListener('play', () => {
      this.isPlaying = true;
      this.notify();
    });

    this.audio.addEventListener('pause', () => {
      this.isPlaying = false;
      this.notify();
    });

    this.audio.addEventListener('timeupdate', () => {
      this.currentTime = this.audio.currentTime;
      this.duration = this.audio.duration || 0;
      this.notify();
    });

    this.audio.addEventListener('ended', () => {
      this.isPlaying = false;
      this.currentTime = 0;
      this.notify();
    });
  }

  public playTrack(trackUrl: string, trackId: string) {
    if (this.currentTrackId === trackId && this.audio.src) {
      if (this.isPlaying) {
        this.audio.pause();
      } else {
        this.audio.play().catch(() => {
          console.warn('Audio resume failed for:', trackId);
        });
      }
      return;
    }

    this.currentTrackId = trackId;
    this.audio.src = trackUrl;
    this.audio.currentTime = 0;
    this.audio.play().catch((err) => {
      console.warn('Audio playback failed:', trackId, err);
      this.isPlaying = false;
      this.notify();
    });
  }

  public togglePlayPause() {
    if (this.isPlaying) {
      this.audio.pause();
    } else {
      this.audio.play().catch(console.warn);
    }
  }

  public seek(timeSeconds: number) {
    if (this.audio && this.audio.duration) {
      this.audio.currentTime = timeSeconds;
    }
  }

  public subscribe(cb: () => void) {
    this.onStateChangeCallbacks.push(cb);
    return () => {
      this.onStateChangeCallbacks = this.onStateChangeCallbacks.filter(c => c !== cb);
    };
  }

  private notify() {
    this.onStateChangeCallbacks.forEach(cb => cb());
  }
}

export const devotionalPlayer = new DevotionalAudioPlayer();
