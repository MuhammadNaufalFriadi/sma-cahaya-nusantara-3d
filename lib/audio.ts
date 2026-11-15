/* ============================================================
   SMA Cahaya Nusantara 3D - High-Quality Game Audio Engine
   Features:
   - Algorithmic Multi-Track Campus BGM (Marimba, Bell Lead, Bass, Shaker)
   - Procedural Nature Ambiance (Daytime Birds, Night Crickets, Rain Ambience)
   - Tactile Sound Effects (Jump, Footsteps, School Bell, Gate, Door, Star, Click)
   - Zero External Dependencies, 100% Web Audio API, Zero Lag
   ============================================================ */

let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let bgmGain: GainNode | null = null;
let sfxGain: GainNode | null = null;
let ambientGain: GainNode | null = null;
let rainGain: GainNode | null = null;

let soundOn = false;
let bgmTimer: any = null;
let birdTimer: any = null;
let rainSource: AudioBufferSourceNode | null = null;

let isRainingState = false;
let isNightState = false;

// 32-Step Loop Chord Progression (Key of C Major / A Minor)
// Each step is an 8th note at 116 BPM (~258ms per step)
const STEP_MS = 258;
let currentStep = 0;

// Chord Definitions (frequencies in Hz)
const CHORD_C_MAJ7 = [261.63, 329.63, 392.00, 493.88]; // C4, E4, G4, B4
const CHORD_A_MIN7 = [220.00, 261.63, 329.63, 392.00]; // A3, C4, E4, G4
const CHORD_D_MIN7 = [293.66, 349.23, 440.00, 523.25]; // D4, F4, A4, C5
const CHORD_G7     = [196.00, 246.94, 293.66, 349.23]; // G3, B3, D4, F4
const CHORD_E_MIN7 = [164.81, 196.00, 246.94, 293.66]; // E3, G3, B3, D4
const CHORD_F_MAJ7 = [174.61, 220.00, 261.63, 329.63]; // F3, A3, C4, E4
const CHORD_G11    = [196.00, 261.63, 293.66, 349.23]; // G3, C4, D4, F4

// 8 Bars = 32 steps (4 steps per bar)
const BAR_CHORDS = [
  CHORD_C_MAJ7,
  CHORD_A_MIN7,
  CHORD_D_MIN7,
  CHORD_G7,
  CHORD_E_MIN7,
  CHORD_A_MIN7,
  CHORD_F_MAJ7,
  CHORD_G11,
];

// Bass Notes (octave 1-2, warm walking bass)
const BASS_NOTES = [
  65.41, 0, 98.00, 0,   // Bar 1: C2, G2
  55.00, 0, 82.41, 0,   // Bar 2: A1, E2
  73.42, 0, 110.00, 0,  // Bar 3: D2, A2
  49.00, 0, 73.42, 0,   // Bar 4: G1, D2
  82.41, 0, 123.47, 0,  // Bar 5: E2, B2
  55.00, 0, 65.41, 0,   // Bar 6: A1, C2
  43.65, 0, 65.41, 0,   // Bar 7: F1, C2
  49.00, 0, 98.00, 0,   // Bar 8: G1, G2
];

// Cheerful Main School Adventure Melody (32 steps)
const MELODY_NOTES = [
  // Bar 1 (Cmaj7)
  659.25, 0, 784.00, 880.00,
  // Bar 2 (Am7)
  784.00, 659.25, 587.33, 523.25,
  // Bar 3 (Dm7)
  587.33, 0, 698.46, 880.00,
  // Bar 4 (G7)
  1046.50, 987.77, 784.00, 587.33,
  // Bar 5 (Em7)
  659.25, 0, 784.00, 987.77,
  // Bar 6 (Am7)
  1174.66, 1046.50, 880.00, 784.00,
  // Bar 7 (Fmaj7)
  880.00, 1046.50, 1174.66, 1318.51,
  // Bar 8 (G11 -> C resolve)
  1174.66, 987.77, 1046.50, 0,
];

/* ============================================================
   Audio Context & Gain Setup
   ============================================================ */
export function initAudio() {
  if (typeof window === "undefined") return;

  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();

      // Master Gain
      masterGain = audioCtx.createGain();
      masterGain.gain.setValueAtTime(0.85, audioCtx.currentTime);
      masterGain.connect(audioCtx.destination);

      // BGM Gain
      bgmGain = audioCtx.createGain();
      bgmGain.gain.setValueAtTime(0.42, audioCtx.currentTime);
      bgmGain.connect(masterGain);

      // SFX Gain
      sfxGain = audioCtx.createGain();
      sfxGain.gain.setValueAtTime(0.65, audioCtx.currentTime);
      sfxGain.connect(masterGain);

      // Ambient Nature Gain
      ambientGain = audioCtx.createGain();
      ambientGain.gain.setValueAtTime(0.28, audioCtx.currentTime);
      ambientGain.connect(masterGain);

      // Rain Gain
      rainGain = audioCtx.createGain();
      rainGain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
      rainGain.connect(masterGain);

      // Setup continuous rain noise buffer
      setupRainBuffer();
    }
  }

  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume();
  }
}

export function isSoundActive() {
  return soundOn;
}

/* ============================================================
   Procedural Instruments Synthesis
   ============================================================ */

/** Warm Marimba / Kalimba note for background harmony */
function playMarimbaNote(freq: number, time: number, duration = 0.32, gainLevel = 0.045) {
  if (!audioCtx || !bgmGain) return;

  const osc1 = audioCtx.createOscillator();
  const osc2 = audioCtx.createOscillator();
  const filter = audioCtx.createBiquadFilter();
  const noteGain = audioCtx.createGain();

  osc1.type = "sine";
  osc1.frequency.setValueAtTime(freq, time);

  // Subtle 2nd harmonic for rich wood marimba timbre
  osc2.type = "triangle";
  osc2.frequency.setValueAtTime(freq * 2, time);

  filter.type = "lowpass";
  filter.frequency.setValueAtTime(1400, time);
  filter.frequency.exponentialRampToValueAtTime(400, time + duration);

  noteGain.gain.setValueAtTime(0.0001, time);
  noteGain.gain.linearRampToValueAtTime(gainLevel, time + 0.008);
  noteGain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

  osc1.connect(filter);
  osc2.connect(filter);
  filter.connect(noteGain);
  noteGain.connect(bgmGain);

  osc1.start(time);
  osc2.start(time);
  osc1.stop(time + duration);
  osc2.stop(time + duration);
}

/** Bright Bell / Music Box note for main melody */
function playBellNote(freq: number, time: number, duration = 0.42, gainLevel = 0.065) {
  if (!audioCtx || !bgmGain) return;

  const osc = audioCtx.createOscillator();
  const overtone = audioCtx.createOscillator();
  const noteGain = audioCtx.createGain();

  osc.type = "sine";
  osc.frequency.setValueAtTime(freq, time);

  overtone.type = "sine";
  overtone.frequency.setValueAtTime(freq * 2.76, time); // Bell chime overtone

  noteGain.gain.setValueAtTime(0.0001, time);
  noteGain.gain.linearRampToValueAtTime(gainLevel, time + 0.004);
  noteGain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

  const overtoneGain = audioCtx.createGain();
  overtoneGain.gain.setValueAtTime(gainLevel * 0.25, time);
  overtoneGain.gain.exponentialRampToValueAtTime(0.0001, time + duration * 0.5);

  osc.connect(noteGain);
  overtone.connect(overtoneGain);
  overtoneGain.connect(noteGain);
  noteGain.connect(bgmGain);

  osc.start(time);
  overtone.start(time);
  osc.stop(time + duration);
  overtone.stop(time + duration);
}

/** Warm Walking Acoustic Bass */
function playBassNote(freq: number, time: number, duration = 0.28, gainLevel = 0.075) {
  if (!audioCtx || !bgmGain) return;

  const osc = audioCtx.createOscillator();
  const filter = audioCtx.createBiquadFilter();
  const noteGain = audioCtx.createGain();

  osc.type = "triangle";
  osc.frequency.setValueAtTime(freq, time);

  filter.type = "lowpass";
  filter.frequency.setValueAtTime(260, time);

  noteGain.gain.setValueAtTime(0.0001, time);
  noteGain.gain.linearRampToValueAtTime(gainLevel, time + 0.01);
  noteGain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

  osc.connect(filter);
  filter.connect(noteGain);
  noteGain.connect(bgmGain);

  osc.start(time);
  osc.stop(time + duration);
}

/** Soft Shaker / Off-beat Hat */
function playShaker(time: number, gainLevel = 0.018) {
  if (!audioCtx || !bgmGain) return;

  const bufferSize = Math.floor(audioCtx.sampleRate * 0.04);
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  const noise = audioCtx.createBufferSource();
  noise.buffer = buffer;

  const filter = audioCtx.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.setValueAtTime(5500, time);

  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(gainLevel, time);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.038);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(bgmGain);

  noise.start(time);
  noise.stop(time + 0.04);
}

/** Cheerful Daytime Bird Chirp in Campus Trees */
function playBirdChirp() {
  if (!soundOn || !audioCtx || !ambientGain || isNightState || isRainingState) return;

  const now = audioCtx.currentTime;
  const count = 2 + Math.floor(Math.random() * 2);

  for (let i = 0; i < count; i++) {
    const t = now + i * 0.14;
    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();

    const startFreq = 2200 + Math.random() * 400;
    const peakFreq = startFreq + 900 + Math.random() * 300;

    osc.type = "sine";
    osc.frequency.setValueAtTime(startFreq, t);
    osc.frequency.linearRampToValueAtTime(peakFreq, t + 0.04);
    osc.frequency.linearRampToValueAtTime(startFreq - 200, t + 0.09);

    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.035, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);

    osc.connect(g);
    g.connect(ambientGain);

    osc.start(t);
    osc.stop(t + 0.1);
  }
}

/** Procedural Rain Audio Loop */
function setupRainBuffer() {
  if (!audioCtx || !rainGain) return;

  try {
    const bufferSize = audioCtx.sampleRate * 2;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const output = buffer.getChannelData(0);

    // Pink noise generation
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      output[i] = (b0 + b1 + b2 + white * 0.5362) * 0.11;
    }

    rainSource = audioCtx.createBufferSource();
    rainSource.buffer = buffer;
    rainSource.loop = true;

    const filter = audioCtx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(950, audioCtx.currentTime);

    rainSource.connect(filter);
    filter.connect(rainGain);
    rainSource.start();
  } catch {
    // Ignore audio buffer error
  }
}

/* ============================================================
   BGM Step Sequencer
   ============================================================ */
function stepBGM() {
  if (!soundOn || !audioCtx || audioCtx.state !== "running") return;

  const now = audioCtx.currentTime + 0.05;
  const barIdx = Math.floor((currentStep % 32) / 4);
  const stepInBar = currentStep % 4;
  const chord = BAR_CHORDS[barIdx];

  // 1. Arpeggiated chord notes (Marimba)
  if (chord) {
    const note = chord[stepInBar % chord.length];
    playMarimbaNote(note, now, 0.35, 0.04);

    // Add gentle root octave on beat 1
    if (stepInBar === 0) {
      playMarimbaNote(chord[0] * 0.5, now, 0.45, 0.035);
    }
  }

  // 2. Main melody (Bell lead)
  const mel = MELODY_NOTES[currentStep % 32];
  if (mel && mel > 0) {
    playBellNote(mel, now, 0.45, 0.055);
  }

  // 3. Bassline
  const bass = BASS_NOTES[currentStep % 32];
  if (bass && bass > 0) {
    playBassNote(bass, now, 0.32, 0.065);
  }

  // 4. Shaker rhythm (on off-beats 1 and 3)
  if (stepInBar === 1 || stepInBar === 3) {
    playShaker(now, 0.016);
  }

  currentStep = (currentStep + 1) % 32;
}

/* ============================================================
   Public API: startBGM, stopBGM, toggleBGM, setWeatherAudio
   ============================================================ */
export function startBGM(callback?: (active: boolean) => void) {
  initAudio();
  soundOn = true;

  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume();
  }

  if (masterGain && audioCtx) {
    masterGain.gain.setValueAtTime(0.85, audioCtx.currentTime);
  }

  if (!bgmTimer) {
    currentStep = 0;
    // Immediate first beat
    stepBGM();
    bgmTimer = setInterval(stepBGM, STEP_MS);
  }

  if (!birdTimer) {
    birdTimer = setInterval(() => {
      if (Math.random() < 0.6) playBirdChirp();
    }, 6500);
  }

  updateWeatherAudio();

  if (callback) callback(true);
  return true;
}

export function stopBGM(callback?: (active: boolean) => void) {
  soundOn = false;

  if (bgmTimer) {
    clearInterval(bgmTimer);
    bgmTimer = null;
  }

  if (birdTimer) {
    clearInterval(birdTimer);
    birdTimer = null;
  }

  if (rainGain && audioCtx) {
    rainGain.gain.linearRampToValueAtTime(0.0001, audioCtx.currentTime + 0.2);
  }

  if (callback) callback(false);
  return false;
}

export function toggleBGM(callback?: (active: boolean) => void) {
  if (soundOn) {
    return stopBGM(callback);
  } else {
    return startBGM(callback);
  }
}

/** Update weather and time-of-day audio ambience */
export function setWeatherAudio(weather: { isRaining?: boolean; isNight?: boolean }) {
  if (weather.isRaining !== undefined) isRainingState = weather.isRaining;
  if (weather.isNight !== undefined) isNightState = weather.isNight;
  updateWeatherAudio();
}

function updateWeatherAudio() {
  if (!audioCtx || !soundOn) return;
  const now = audioCtx.currentTime;

  // Rain Sound volume control
  if (rainGain) {
    if (isRainingState) {
      rainGain.gain.linearRampToValueAtTime(0.18, now + 0.6);
    } else {
      rainGain.gain.linearRampToValueAtTime(0.0001, now + 0.6);
    }
  }

  // Adjust BGM warmth at night
  if (bgmGain) {
    if (isNightState) {
      bgmGain.gain.linearRampToValueAtTime(0.32, now + 0.8);
    } else {
      bgmGain.gain.linearRampToValueAtTime(0.42, now + 0.8);
    }
  }
}

/* ============================================================
   Sound Effects (SFX)
   ============================================================ */
export function sfx(
  type:
    | "click"
    | "jump"
    | "star"
    | "enter"
    | "door"
    | "gate"
    | "step"
    | "weather"
) {
  if (!soundOn || !audioCtx || !sfxGain || audioCtx.state !== "running") return;
  const now = audioCtx.currentTime;

  if (type === "click") {
    // Crisp tactile bubble pop
    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(440, now + 0.045);
    g.gain.setValueAtTime(0.12, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.045);
    osc.connect(g);
    g.connect(sfxGain);
    osc.start(now);
    osc.stop(now + 0.05);
  } else if (type === "jump") {
    // Cheerful springy adventure jump
    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(240, now);
    osc.frequency.exponentialRampToValueAtTime(620, now + 0.16);
    g.gain.setValueAtTime(0.14, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
    osc.connect(g);
    g.connect(sfxGain);
    osc.start(now);
    osc.stop(now + 0.16);
  } else if (type === "star") {
    // Magical crystalline reward arpeggio (C5 -> E5 -> G5 -> C6 -> E6)
    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
    notes.forEach((freq, idx) => {
      if (!audioCtx || !sfxGain) return;
      const t = now + idx * 0.065;
      const osc = audioCtx.createOscillator();
      const overtone = audioCtx.createOscillator();
      const g = audioCtx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, t);

      overtone.type = "triangle";
      overtone.frequency.setValueAtTime(freq * 2, t);

      g.gain.setValueAtTime(0.11, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

      osc.connect(g);
      overtone.connect(g);
      g.connect(sfxGain);

      osc.start(t);
      overtone.start(t);
      osc.stop(t + 0.36);
      overtone.stop(t + 0.36);
    });
  } else if (type === "enter") {
    // Iconic School Bell Chime (Westminster 4-Note Chime: E4, G4, F4, C4)
    const schoolBell = [
      { f: 659.25, delay: 0.0 },  // E4 (659Hz)
      { f: 523.25, delay: 0.18 }, // C4 (523Hz)
      { f: 587.33, delay: 0.36 }, // D4 (587Hz)
      { f: 392.00, delay: 0.54 }, // G3 (392Hz)
    ];

    schoolBell.forEach(({ f, delay }) => {
      if (!audioCtx || !sfxGain) return;
      const st = now + delay;
      const osc = audioCtx.createOscillator();
      const bellHarmonic = audioCtx.createOscillator();
      const g = audioCtx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(f, st);

      bellHarmonic.type = "sine";
      bellHarmonic.frequency.setValueAtTime(f * 2.76, st); // Bell partial

      g.gain.setValueAtTime(0.12, st);
      g.gain.exponentialRampToValueAtTime(0.0001, st + 0.55);

      osc.connect(g);
      bellHarmonic.connect(g);
      g.connect(sfxGain);

      osc.start(st);
      bellHarmonic.start(st);
      osc.stop(st + 0.56);
      bellHarmonic.stop(st + 0.56);
    });
  } else if (type === "door") {
    // Realistic wooden door latch & slide
    const o1 = audioCtx.createOscillator();
    const g1 = audioCtx.createGain();
    o1.type = "triangle";
    o1.frequency.setValueAtTime(140, now);
    o1.frequency.exponentialRampToValueAtTime(280, now + 0.18);
    g1.gain.setValueAtTime(0.09, now);
    g1.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    o1.connect(g1);
    g1.connect(sfxGain);
    o1.start(now);
    o1.stop(now + 0.2);

    const o2 = audioCtx.createOscillator();
    const g2 = audioCtx.createGain();
    o2.type = "sine";
    o2.frequency.setValueAtTime(520, now + 0.08);
    o2.frequency.exponentialRampToValueAtTime(680, now + 0.28);
    g2.gain.setValueAtTime(0.08, now + 0.08);
    g2.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
    o2.connect(g2);
    g2.connect(sfxGain);
    o2.start(now + 0.08);
    o2.stop(now + 0.28);
  } else if (type === "gate") {
    // Grand metallic campus gate creak & clank
    const o1 = audioCtx.createOscillator();
    const g1 = audioCtx.createGain();
    o1.type = "sawtooth";
    o1.frequency.setValueAtTime(130, now);
    o1.frequency.linearRampToValueAtTime(95, now + 0.32);
    g1.gain.setValueAtTime(0.08, now);
    g1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    o1.connect(g1);
    g1.connect(sfxGain);
    o1.start(now);
    o1.stop(now + 0.35);

    const o2 = audioCtx.createOscillator();
    const g2 = audioCtx.createGain();
    o2.type = "sine";
    o2.frequency.setValueAtTime(320, now + 0.14);
    o2.frequency.exponentialRampToValueAtTime(110, now + 0.42);
    g2.gain.setValueAtTime(0.1, now + 0.14);
    g2.gain.exponentialRampToValueAtTime(0.001, now + 0.42);
    o2.connect(g2);
    g2.connect(sfxGain);
    o2.start(now + 0.14);
    o2.stop(now + 0.42);
  } else if (type === "step") {
    // Soft organic campus footstep
    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(80, now);
    osc.frequency.exponentialRampToValueAtTime(35, now + 0.05);
    g.gain.setValueAtTime(0.024, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    osc.connect(g);
    g.connect(sfxGain);
    osc.start(now);
    osc.stop(now + 0.055);
  } else if (type === "weather") {
    // Atmospheric whoosh transition
    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.25);
    g.gain.setValueAtTime(0.06, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    osc.connect(g);
    g.connect(sfxGain);
    osc.start(now);
    osc.stop(now + 0.26);
  }
}
