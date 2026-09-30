/**
 * Portfolio Cardiac Heartbeat & Clinical Monitor Synthesizer
 * Uses the Web Audio API to create authentic cardiac sounds:
 * 1. "lub-dub" physiological mechanical valve closures (S1 + S2)
 * 2. "monitor-beep" authentic clinical patient telemetry QRS beep with pitch mapped to portfolio health
 */

let audioCtx: AudioContext | null = null;
let isMuted: boolean = false;
let currentVolume: number = 0.22;
let currentSoundMode: 'lub-dub' | 'beep' = 'lub-dub';

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioCtxClass) return null;

  if (!audioCtx) {
    audioCtx = new AudioCtxClass();
  }

  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }

  return audioCtx;
}

/**
 * Plays a single physiological "lub-dub" heartbeat pulse.
 * @param bpm Current beats per minute
 * @param intensity 0 (calm) to 1 (high stress/tachycardia)
 */
export function playHeartbeatPulse(bpm: number = 72, intensity: number = 0.5): void {
  if (isMuted) return;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const baseFreq = 48 + intensity * 26;
    const secondFreq = baseFreq * 1.38;

    // --- S1: "Lub" (Mitral & Tricuspid valve closure, low thud) ---
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    const filter1 = ctx.createBiquadFilter();

    filter1.type = 'lowpass';
    filter1.frequency.setValueAtTime(130 + intensity * 60, now);

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(baseFreq, now);
    osc1.frequency.exponentialRampToValueAtTime(baseFreq * 0.72, now + 0.12);

    gain1.gain.setValueAtTime(0.001, now);
    gain1.gain.linearRampToValueAtTime(currentVolume, now + 0.02);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    osc1.connect(filter1);
    filter1.connect(gain1);
    gain1.connect(ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.15);

    // --- S2: "Dub" (Aortic & Pulmonary valve closure, snappier) ---
    const s2Delay = 0.13;
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    const filter2 = ctx.createBiquadFilter();

    filter2.type = 'lowpass';
    filter2.frequency.setValueAtTime(170 + intensity * 70, now + s2Delay);

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(secondFreq, now + s2Delay);
    osc2.frequency.exponentialRampToValueAtTime(secondFreq * 0.68, now + s2Delay + 0.09);

    gain2.gain.setValueAtTime(0.001, now + s2Delay);
    gain2.gain.linearRampToValueAtTime(currentVolume * 0.85, now + s2Delay + 0.015);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + s2Delay + 0.11);

    osc2.connect(filter2);
    filter2.connect(gain2);
    gain2.connect(ctx.destination);

    osc2.start(now + s2Delay);
    osc2.stop(now + s2Delay + 0.12);
  } catch {
    // AudioContext might be blocked until user gesture
  }
}

/**
 * Plays an authentic clinical monitor QRS beep tone (like hospital telemetry/pulse oximeters).
 * Frequency scales with portfolio health (600 Hz - 920 Hz).
 */
export function playMonitorBeep(healthScore: number = 75, intensity: number = 0.5): void {
  if (isMuted) return;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    // Real medical monitors pitch higher when SpO2/vitals are optimal (~880Hz A5) and lower when distressed (~580Hz)
    const normHealth = Math.max(0, Math.min(100, healthScore)) / 100;
    const freq = 560 + normHealth * 340; // 560Hz (stressed) to 900Hz (optimal)

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(freq, now);
    filter.Q.setValueAtTime(3.5, now);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);

    // Crisp medical telemetry envelope: fast 8ms attack, 65ms exponential decay
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(currentVolume * 0.75, now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.075);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.08);
  } catch {
    // AudioContext might be blocked
  }
}

export function playActiveSound(bpm: number, intensity: number, healthScore: number): void {
  if (currentSoundMode === 'beep') {
    playMonitorBeep(healthScore, intensity);
  } else {
    playHeartbeatPulse(bpm, intensity);
  }
}

class PortfolioHeartbeatService {
  private active: boolean = false;
  private currentBpm: number = 72;
  private currentIntensity: number = 0.5;
  private currentHealthScore: number = 75;
  private intervalId: any = null;
  private listeners: Array<(active: boolean) => void> = [];

  public setSoundMode(mode: 'lub-dub' | 'beep'): void {
    currentSoundMode = mode;
  }

  public getSoundMode(): 'lub-dub' | 'beep' {
    return currentSoundMode;
  }

  public start(bpm: number, intensity: number = 0.5, healthScore: number = 75): void {
    this.currentBpm = bpm;
    this.currentIntensity = intensity;
    this.currentHealthScore = healthScore;
    this.active = true;
    this.scheduleNextBeat();
    this.notifyListeners();
  }

  public updateMetrics(bpm: number, intensity: number = 0.5, healthScore: number = 75): void {
    this.currentBpm = bpm;
    this.currentIntensity = intensity;
    this.currentHealthScore = healthScore;
  }

  public stop(): void {
    this.active = false;
    if (this.intervalId) {
      clearTimeout(this.intervalId);
      this.intervalId = null;
    }
    this.notifyListeners();
  }

  public toggle(bpm: number, intensity: number = 0.5, healthScore: number = 75): boolean {
    if (this.active) {
      this.stop();
      return false;
    } else {
      this.start(bpm, intensity, healthScore);
      return true;
    }
  }

  public isActive(): boolean {
    return this.active;
  }

  public subscribe(fn: (active: boolean) => void): () => void {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== fn);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach((l) => l(this.active));
  }

  private scheduleNextBeat(): void {
    if (!this.active) return;

    playActiveSound(this.currentBpm, this.currentIntensity, this.currentHealthScore);

    const delayMs = Math.max(350, Math.min(2000, Math.round(60000 / this.currentBpm)));

    this.intervalId = setTimeout(() => {
      this.scheduleNextBeat();
    }, delayMs);
  }
}

export const portfolioHeartbeatService = new PortfolioHeartbeatService();
