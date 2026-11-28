/**
 * All the game's sound is made here, in code: a soft bed of wind, leaves, water and birdsong, the
 * knocks and clinks of work, and the sounds of battle. Nothing is loaded, so it works offline.
 */
let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let sfx: GainNode | null = null;
let bed: GainNode | null = null;
let noise: AudioBuffer | null = null;
/** the steady layers of the background, each with its own gain */
let wind: GainNode | null = null;
let leaves: GainNode | null = null;
let water: GainNode | null = null;
let windFilter: BiquadFilterNode | null = null;
/** how loud everything is together: the sounds are made quiet, with room to add up */
const LOUD = 1.8;

export function unlockAudio() {
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return;
  if (!ctx) {
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = LOUD;
    sfx = ctx.createGain();
    bed = ctx.createGain();
    sfx.gain.value = 0.75;
    bed.gain.value = 0;
    sfx.connect(master);
    bed.connect(master);
    master.connect(ctx.destination);
    // two seconds of soft noise to make wind, leaves, water and the scrape of tools from
    const len = ctx.sampleRate * 2;
    noise = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = noise.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < len; i++) {
      // a pinkish noise: softer, more natural than plain hiss
      const w = Math.random() * 2 - 1;
      b0 = 0.99765 * b0 + w * 0.099046;
      b1 = 0.963 * b1 + w * 0.2965164;
      b2 = 0.57 * b2 + w * 1.0526913;
      data[i] = (b0 + b1 + b2 + w * 0.1848) * 0.2;
    }
    startBed();
  }
  if (ctx.state === "suspended") void ctx.resume();
}

export function setMuted(muted: boolean) {
  if (!ctx || !master) return;
  master.gain.setTargetAtTime(muted ? 0 : LOUD, ctx.currentTime, 0.03);
}

export function resumeAudio() {
  if (ctx && ctx.state === "suspended") void ctx.resume();
}

/** a looping layer of filtered noise */
function layer(type: BiquadFilterType, freq: number, q: number, rate: number) {
  const c = ctx!;
  const src = c.createBufferSource();
  src.buffer = noise;
  src.loop = true;
  src.playbackRate.value = rate;
  // start each layer at a different point of the loop so they never line up
  src.loopStart = 0;
  const f = c.createBiquadFilter();
  f.type = type;
  f.frequency.value = freq;
  f.Q.value = q;
  const g = c.createGain();
  g.gain.value = 0;
  src.connect(f);
  f.connect(g);
  g.connect(bed!);
  src.start(0, Math.random() * 1.9);
  return { g, f };
}

function startBed() {
  if (!ctx || !bed) return;
  const w = layer("lowpass", 520, 0.6, 0.55);
  wind = w.g;
  windFilter = w.f;
  leaves = layer("bandpass", 3200, 0.7, 1).g;
  water = layer("lowpass", 380, 0.9, 0.42).g;
}

/** a place for one sound: its own gain, panned left or right */
function voice(pan: number, peak: number, attack: number, dur: number, at = 0) {
  if (!ctx || !sfx) return null;
  const t = ctx.currentTime + at;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  if (ctx.createStereoPanner) {
    const p = ctx.createStereoPanner();
    p.pan.value = Math.max(-1, Math.min(1, pan));
    g.connect(p);
    p.connect(sfx);
  } else g.connect(sfx);
  return { g, t };
}

function tone(freq: number, dur: number, type: OscillatorType, peak: number, pan = 0, at = 0, slide = 1, attack = 0.005) {
  const v = voice(pan, peak, attack, dur, at);
  if (!v || !ctx) return;
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, v.t);
  if (slide !== 1) osc.frequency.exponentialRampToValueAtTime(freq * slide, v.t + dur);
  osc.connect(v.g);
  osc.start(v.t);
  osc.stop(v.t + dur + 0.03);
}

function hiss(dur: number, peak: number, type: BiquadFilterType, freq: number, q = 1, pan = 0, at = 0, sweep = 1, rate = 1) {
  if (!ctx || !noise) return;
  const v = voice(pan, peak, 0.004, dur, at);
  if (!v) return;
  const src = ctx.createBufferSource();
  src.buffer = noise;
  src.playbackRate.value = rate;
  const f = ctx.createBiquadFilter();
  f.type = type;
  f.frequency.setValueAtTime(freq, v.t);
  if (sweep !== 1) f.frequency.exponentialRampToValueAtTime(freq * sweep, v.t + dur);
  f.Q.value = q;
  src.connect(f);
  f.connect(v.g);
  src.start(v.t, Math.random() * 1.5);
  src.stop(v.t + dur + 0.03);
}

/** How much of each layer of the background to hear: 0 to 1 each. Gusts come and go on their own. */
export function setAmbience(on: boolean, trees: number, wet: number, gust: number) {
  if (!ctx || !bed || !wind || !leaves || !water || !windFilter) return;
  const t = ctx.currentTime;
  bed.gain.setTargetAtTime(on ? 0.6 : 0, t, 0.8);
  wind.gain.setTargetAtTime(0.05 + gust * 0.09, t, 0.9);
  windFilter.frequency.setTargetAtTime(380 + gust * 420, t, 1.2);
  leaves.gain.setTargetAtTime((0.008 + gust * 0.03) * trees, t, 0.7);
  water.gain.setTargetAtTime(wet * (0.05 + 0.03 * Math.sin(t * 0.9)), t, 1.5);
}

/** a bird somewhere about: a few kinds of song */
export function bird(pan: number, vol: number) {
  if (!ctx) return;
  const kind = Math.floor(Math.random() * 4);
  const p = vol * 0.05;
  if (kind === 0) {
    // a quick trill
    const f = 3400 + Math.random() * 1400;
    const n = 3 + Math.floor(Math.random() * 5);
    for (let i = 0; i < n; i++) tone(f * (1 + i * 0.015), 0.05, "sine", p, pan, i * 0.075, 1.18);
  } else if (kind === 1) {
    // two clear whistled notes, high then lower
    const f = 2600 + Math.random() * 900;
    tone(f, 0.22, "sine", p * 0.9, pan, 0, 1.02, 0.03);
    tone(f * 0.84, 0.26, "sine", p * 0.8, pan, 0.28, 0.98, 0.03);
  } else if (kind === 2) {
    // a rising warble
    const f = 1900 + Math.random() * 800;
    for (let i = 0; i < 3; i++) tone(f * (1 + i * 0.12), 0.09, "sine", p, pan, i * 0.11, 1.35);
  } else {
    // a single bright chirp, far away
    tone(4200 + Math.random() * 900, 0.06, "sine", p * 0.7, pan, 0, 0.72);
  }
}

/** The sound of someone at work or in a fight, at a place in the view (pan) and a nearness (vol). */
export function work(kind: string, pan: number, vol: number) {
  if (!ctx) return;
  const v = Math.max(0.05, Math.min(1, vol));
  const w = 0.93 + Math.random() * 0.14;
  if (kind === "chop") {
    // an axe into wood: a dull thunk with a woody knock
    hiss(0.07, 0.22 * v, "lowpass", 900 * w, 0.8, pan);
    tone(190 * w, 0.09, "triangle", 0.16 * v, pan, 0, 0.7);
    tone(420 * w, 0.04, "sine", 0.05 * v, pan, 0.005, 0.8);
  } else if (kind === "pick") {
    // a pick on rock: a bright clink
    tone(1750 * w, 0.16, "sine", 0.07 * v, pan, 0, 0.98);
    tone(2630 * w, 0.11, "sine", 0.045 * v, pan, 0, 0.98);
    hiss(0.03, 0.12 * v, "highpass", 2500, 0.7, pan);
  } else if (kind === "hammer") {
    // a mallet on timber, sometimes twice
    tone(260 * w, 0.07, "triangle", 0.14 * v, pan, 0, 0.85);
    hiss(0.04, 0.12 * v, "bandpass", 1300 * w, 1.2, pan);
    if (Math.random() < 0.4) {
      tone(250 * w, 0.06, "triangle", 0.1 * v, pan, 0.16, 0.85);
      hiss(0.03, 0.08 * v, "bandpass", 1300 * w, 1.2, pan, 0.16);
    }
  } else if (kind === "hoe") {
    // a hoe or sickle in the soil: a soft scrape
    hiss(0.16, 0.32 * v, "bandpass", 1700 * w, 0.9, pan, 0, 0.7);
  } else if (kind === "pluck") {
    // picking berries: leaves rustling
    hiss(0.18, 0.28 * v, "bandpass", 4200 * w, 0.8, pan, 0, 1.2);
  } else if (kind === "clash") {
    // swords meeting
    tone(1240 * w, 0.22, "square", 0.018 * v, pan, 0, 0.97);
    tone(2110 * w, 0.18, "sine", 0.05 * v, pan, 0, 0.99);
    tone(3330 * w, 0.12, "sine", 0.03 * v, pan, 0, 0.99);
    hiss(0.05, 0.14 * v, "highpass", 1800, 0.8, pan);
  } else if (kind === "thud") {
    // a blow that lands on a body or a wall
    hiss(0.1, 0.18 * v, "lowpass", 500 * w, 0.7, pan);
    tone(110 * w, 0.12, "sine", 0.14 * v, pan, 0, 0.6);
  } else if (kind === "arrow") {
    // a whoosh as it flies
    hiss(0.16, 0.36 * v, "bandpass", 900 * w, 2.5, pan, 0, 2.8);
  } else if (kind === "boom") {
    // a bombard firing
    hiss(0.5, 0.3 * v, "lowpass", 320, 0.7, pan, 0, 0.4);
    tone(70, 0.4, "sine", 0.22 * v, pan, 0, 0.55);
  } else if (kind === "hoof") {
    tone(150 * w, 0.04, "triangle", 0.06 * v, pan, 0, 0.8);
    tone(140 * w, 0.04, "triangle", 0.05 * v, pan, 0.09, 0.8);
  } else if (kind === "splash") {
    // oars or a net in the water
    hiss(0.22, 0.26 * v, "bandpass", 1100 * w, 0.8, pan, 0, 0.6);
  }
}

export function playSfx(name: string) {
  if (!ctx) return;
  const w = 0.96 + Math.random() * 0.08;
  if (name === "coin") {
    // goods set down at a store: a soft wooden tok and a little clink
    tone(330 * w, 0.06, "triangle", 0.08, 0, 0, 0.9);
    tone(1320 * w, 0.12, "sine", 0.04, 0, 0.04);
  } else if (name === "hit") {
    work("thud", (Math.random() - 0.5) * 0.4, 0.7);
  } else if (name === "shoot") {
    work("arrow", 0, 0.6);
  } else if (name === "raise") {
    // something finished: a warm little chime
    tone(523 * w, 0.35, "sine", 0.07, 0, 0, 1, 0.01);
    tone(784 * w, 0.4, "sine", 0.05, 0, 0.09, 1, 0.01);
    tone(1046 * w, 0.45, "sine", 0.03, 0, 0.18, 1, 0.01);
  } else if (name === "ui" || name === "click") {
    // a soft wooden tick
    tone(620 * w, 0.035, "triangle", 0.05, 0, 0, 0.8);
  } else if (name === "win") {
    [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.5, "sine", 0.08, 0, i * 0.14, 1, 0.01));
    [262, 330, 392].forEach((f) => tone(f, 1.2, "triangle", 0.04, 0, 0.56, 1, 0.05));
  } else if (name === "lose") {
    [392, 349, 294, 262].forEach((f, i) => tone(f, 0.55, "sine", 0.07, 0, i * 0.2, 1, 0.02));
  }
}
