let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let sfx: GainNode | null = null;
let music: GainNode | null = null;
let noise: AudioBuffer | null = null;

export function unlockAudio() {
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return;
  if (!ctx) {
    ctx = new AC();
    master = ctx.createGain();
    sfx = ctx.createGain();
    music = ctx.createGain();
    sfx.gain.value = 0.4;
    music.gain.value = 0.045;
    sfx.connect(master);
    music.connect(master);
    master.connect(ctx.destination);
    const len = ctx.sampleRate * 0.4;
    noise = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    startDrone();
  }
  if (ctx.state === "suspended") void ctx.resume();
}

export function setMuted(muted: boolean) {
  if (!ctx || !master) return;
  master.gain.setTargetAtTime(muted ? 0 : 1, ctx.currentTime, 0.03);
}

export function resumeAudio() {
  if (ctx && ctx.state === "suspended") void ctx.resume();
}

function envGain(at: number, peak: number, dur: number) {
  if (!ctx || !sfx) return null;
  const g = ctx.createGain();
  g.connect(sfx);
  const t = ctx.currentTime;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(Math.max(0.001, peak), t + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  return g;
}

function tone(freq: number, dur: number, type: OscillatorType, peak: number) {
  if (!ctx || !sfx) return;
  const osc = ctx.createOscillator();
  const g = envGain(0, peak, dur);
  if (!g) return;
  osc.type = type;
  osc.frequency.value = freq;
  osc.connect(g);
  osc.start();
  osc.stop(ctx.currentTime + dur + 0.02);
}

function noiseBurst(dur: number, peak: number, rate = 1) {
  if (!ctx || !noise || !sfx) return;
  const src = ctx.createBufferSource();
  src.buffer = noise;
  src.playbackRate.value = rate;
  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 420;
  const g = envGain(0, peak, dur);
  if (!g) return;
  src.connect(filter);
  filter.connect(g);
  src.start();
  src.stop(ctx.currentTime + dur);
}

function startDrone() {
  if (!ctx || !music) return;
  const a = ctx.createOscillator();
  const b = ctx.createOscillator();
  a.type = "sine";
  b.type = "triangle";
  a.frequency.value = 98;
  b.frequency.value = 146;
  const g = ctx.createGain();
  g.gain.value = 0.2;
  a.connect(g);
  b.connect(g);
  g.connect(music);
  a.start();
  b.start();
}

export function playSfx(name: string) {
  if (!ctx) return;
  const wobble = 0.94 + Math.random() * 0.12;
  if (name === "coin") {
    tone(680 * wobble, 0.08, "square", 0.08);
    tone(980 * wobble, 0.1, "square", 0.05);
  } else if (name === "hit") {
    noiseBurst(0.08, 0.12, 0.6);
    tone(140, 0.09, "sawtooth", 0.05);
  } else if (name === "shoot") {
    noiseBurst(0.07, 0.08, 1.6);
    tone(520, 0.06, "square", 0.04);
  } else if (name === "raise") {
    tone(440, 0.08, "square", 0.06);
    tone(660, 0.12, "square", 0.05);
  } else if (name === "ui") {
    tone(300, 0.04, "square", 0.04);
  } else if (name === "win") {
    [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => tone(f, 0.18, "square", 0.07), i * 120));
  } else if (name === "lose") {
    [392, 349, 262].forEach((f, i) => setTimeout(() => tone(f, 0.22, "sawtooth", 0.06), i * 160));
  }
}
