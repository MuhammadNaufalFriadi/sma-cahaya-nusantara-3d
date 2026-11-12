let audioCtx: AudioContext | null = null;
let soundOn = false;
let bgmTimer: any = null;
const bgmNotes = [261.6, 293.7, 329.6, 392.0, 329.6, 293.7, 261.6, 196.0];
let bIdx = 0;

export function initAudio() {
  if (typeof window === "undefined") return;
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume();
  }
}

export function isSoundActive() {
  return soundOn;
}

export function sfx(type: "click" | "jump" | "star" | "enter" | "door" | "gate" | "step") {
  if (!soundOn || !audioCtx) return;
  const now = audioCtx.currentTime;

  if (type === "click") {
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(540, now);
    o.frequency.exponentialRampToValueAtTime(320, now + 0.05);
    g.gain.setValueAtTime(0.08, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    o.connect(g);
    g.connect(audioCtx.destination);
    o.start(now);
    o.stop(now + 0.05);
  } else if (type === "jump") {
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(220, now);
    o.frequency.exponentialRampToValueAtTime(560, now + 0.16);
    g.gain.setValueAtTime(0.12, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
    o.connect(g);
    g.connect(audioCtx.destination);
    o.start(now);
    o.stop(now + 0.16);
  } else if (type === "star") {
    [523, 659, 784, 1046].forEach((f, i) => {
      if (!audioCtx) return;
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.type = "sine";
      o.frequency.value = f;
      const st = now + i * 0.07;
      g.gain.setValueAtTime(0.12, st);
      g.gain.exponentialRampToValueAtTime(0.001, st + 0.3);
      o.connect(g);
      g.connect(audioCtx.destination);
      o.start(st);
      o.stop(st + 0.3);
    });
  } else if (type === "enter") {
    [330, 440, 554, 659].forEach((f, i) => {
      if (!audioCtx) return;
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.type = "triangle";
      o.frequency.value = f;
      const st = now + i * 0.08;
      g.gain.setValueAtTime(0.1, st);
      g.gain.exponentialRampToValueAtTime(0.001, st + 0.4);
      o.connect(g);
      g.connect(audioCtx.destination);
      o.start(st);
      o.stop(st + 0.4);
    });
  } else if (type === "door") {
    const o1 = audioCtx.createOscillator();
    const g1 = audioCtx.createGain();
    o1.type = "sine";
    o1.frequency.setValueAtTime(160, now);
    o1.frequency.exponentialRampToValueAtTime(320, now + 0.24);
    g1.gain.setValueAtTime(0.12, now);
    g1.gain.exponentialRampToValueAtTime(0.001, now + 0.26);
    o1.connect(g1);
    g1.connect(audioCtx.destination);
    o1.start(now);
    o1.stop(now + 0.26);

    const o2 = audioCtx.createOscillator();
    const g2 = audioCtx.createGain();
    o2.type = "triangle";
    o2.frequency.setValueAtTime(420, now + 0.08);
    o2.frequency.exponentialRampToValueAtTime(680, now + 0.32);
    g2.gain.setValueAtTime(0.08, now + 0.08);
    g2.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
    o2.connect(g2);
    g2.connect(audioCtx.destination);
    o2.start(now + 0.08);
    o2.stop(now + 0.32);
  } else if (type === "gate") {
    const o1 = audioCtx.createOscillator();
    const g1 = audioCtx.createGain();
    o1.type = "sawtooth";
    o1.frequency.setValueAtTime(140, now);
    o1.frequency.linearRampToValueAtTime(105, now + 0.35);
    g1.gain.setValueAtTime(0.09, now);
    g1.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
    o1.connect(g1);
    g1.connect(audioCtx.destination);
    o1.start(now);
    o1.stop(now + 0.38);

    const o2 = audioCtx.createOscillator();
    const g2 = audioCtx.createGain();
    o2.type = "sine";
    o2.frequency.setValueAtTime(280, now + 0.18);
    o2.frequency.exponentialRampToValueAtTime(120, now + 0.45);
    g2.gain.setValueAtTime(0.11, now + 0.18);
    g2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    o2.connect(g2);
    g2.connect(audioCtx.destination);
    o2.start(now + 0.18);
    o2.stop(now + 0.45);
  } else if (type === "step") {
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = "triangle";
    o.frequency.setValueAtTime(100, now);
    o.frequency.exponentialRampToValueAtTime(40, now + 0.06);
    g.gain.setValueAtTime(0.03, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    o.connect(g);
    g.connect(audioCtx.destination);
    o.start(now);
    o.stop(now + 0.06);
  }
}

export function toggleBGM(callback?: (active: boolean) => void) {
  initAudio();
  soundOn = !soundOn;
  if (soundOn) {
    if (!bgmTimer) {
      bgmTimer = setInterval(() => {
        if (!soundOn || !audioCtx || audioCtx.state !== "running") return;
        const now = audioCtx.currentTime;
        const o = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        o.type = "sine";
        o.frequency.setValueAtTime(bgmNotes[bIdx % bgmNotes.length], now);
        bIdx++;
        g.gain.setValueAtTime(0.025, now);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);
        o.connect(g);
        g.connect(audioCtx.destination);
        o.start(now);
        o.stop(now + 0.4);
      }, 480);
    }
  } else {
    if (bgmTimer) {
      clearInterval(bgmTimer);
      bgmTimer = null;
    }
  }
  if (callback) callback(soundOn);
  return soundOn;
}

