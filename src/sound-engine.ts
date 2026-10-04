import type { SoundName, SoundOptions } from "./sound"

/**
 * The synthesis. Every sound is built from two voices, a shaped oscillator and
 * a band of filtered noise, so there are no files to fetch. One context, made
 * on the first sound and suspended when idle so it holds no audio device open.
 * Each call gets its own bus, so a newer action can fade an older one out.
 */

type Voice = { at?: number; a?: number; d: number; peak: number }
type ToneVoice = Voice & { f: number; to?: number; type?: OscillatorType }
type NoiseVoice = Voice & { f: number; to?: number; q?: number; filter?: BiquadFilterType }
type Recipe = (c: AudioContext, bus: AudioNode, t: number, v: number, o: Required<SoundOptions>, still: boolean) => number

let ctx: AudioContext | null = null
let master: GainNode | null = null
let hiss: AudioBuffer
let idle = 0
let volume = 0.55

export function setVolume(v: number) {
  volume = Math.max(0, Math.min(1, v))
  if (master) master.gain.value = volume
}

function boot() {
  const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
  const c = new Ctx({ latencyHint: "interactive" })
  const limit = c.createDynamicsCompressor()
  limit.threshold.value = -14
  limit.knee.value = 8
  limit.ratio.value = 4
  limit.attack.value = 0.002
  limit.release.value = 0.12
  master = c.createGain()
  master.gain.value = volume
  master.connect(limit).connect(c.destination)
  hiss = c.createBuffer(1, c.sampleRate / 2, c.sampleRate)
  const data = hiss.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  ctx = c
  return c
}

function envelope(g: GainNode, t: number, a: number, d: number, peak: number) {
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(peak, t + a)
  g.gain.exponentialRampToValueAtTime(0.0001, t + a + d)
}

function tone(c: AudioContext, bus: AudioNode, t0: number, { f, to, type = "sine", at = 0, a = 0.003, d, peak }: ToneVoice) {
  const t = t0 + at
  const o = c.createOscillator()
  const g = c.createGain()
  o.type = type
  o.frequency.setValueAtTime(f, t)
  if (to) o.frequency.exponentialRampToValueAtTime(to, t + a + d)
  envelope(g, t, a, d, peak)
  o.connect(g).connect(bus)
  o.start(t)
  o.stop(t + a + d + 0.02)
}

function noise(c: AudioContext, bus: AudioNode, t0: number, { f, to, q = 1, filter = "bandpass", at = 0, a = 0.001, d, peak }: NoiseVoice) {
  const t = t0 + at
  const s = c.createBufferSource()
  const bq = c.createBiquadFilter()
  const g = c.createGain()
  s.buffer = hiss
  bq.type = filter
  bq.Q.value = q
  bq.frequency.setValueAtTime(f, t)
  if (to) bq.frequency.exponentialRampToValueAtTime(to, t + a + d)
  envelope(g, t, a, d, peak)
  s.connect(bq).connect(g).connect(bus)
  s.start(t, Math.random() * 0.3)
  s.stop(t + a + d + 0.02)
}

/** A soft bell: the note and a faint octave above it. */
function bell(c: AudioContext, bus: AudioNode, t: number, f: number, at: number, peak: number, d = 0.4) {
  tone(c, bus, t, { f, at, a: 0.004, d, peak })
  tone(c, bus, t, { f: f * 2.01, at, a: 0.002, d: d * 0.45, peak: peak * 0.18 })
}

const SCALE = [392, 493.88, 587.33, 783.99, 987.77, 1174.66]

/** Each recipe schedules its voices from t and returns how long it lasts, in seconds. */
const RECIPES: Record<SoundName, Recipe> = {
  // a key going down: a short click on a low thump
  press: (c, b, t, v) => {
    noise(c, b, t, { f: 3400 * v, q: 1.4, d: 0.016, peak: 0.3 })
    tone(c, b, t, { f: 170 * v, to: 70, a: 0.002, d: 0.05, peak: 0.26 })
    return 0.08
  },
  // and coming back up: lighter and higher
  release: (c, b, t, v) => {
    noise(c, b, t, { f: 5200 * v, q: 2, d: 0.01, peak: 0.1 })
    tone(c, b, t, { f: 320 * v, to: 220, d: 0.022, peak: 0.06 })
    return 0.05
  },
  toggle: (c, b, t, v) => {
    noise(c, b, t, { f: 4200 * v, q: 1.8, d: 0.012, peak: 0.16 })
    tone(c, b, t, { f: 900 * v, type: "triangle", d: 0.03, peak: 0.04 })
    return 0.06
  },
  // a machine waking: one warm chord, slow to fade
  boot: (c, b, t) => {
    for (const [i, f] of [174.61, 220, 261.63, 349.23, 523.25].entries()) {
      tone(c, b, t, { f, type: "triangle", at: i * 0.006, a: 0.012, d: 1.3, peak: 0.05 })
      tone(c, b, t, { f: f * 1.003, at: i * 0.006, a: 0.012, d: 1.1, peak: 0.03 })
    }
    return 1.4
  },
  success: (c, b, t) => { bell(c, b, t, 659.25, 0, 0.12); bell(c, b, t, 987.77, 0.075, 0.12, 0.5); return 0.6 },
  error: (c, b, t) => {
    tone(c, b, t, { f: 392, type: "triangle", d: 0.15, peak: 0.1 })
    tone(c, b, t, { f: 311.13, type: "triangle", at: 0.085, d: 0.2, peak: 0.1 })
    return 0.32
  },
  // something arriving: small and high, like a notification across the room
  notify: (c, b, t) => { bell(c, b, t, 1567.98, 0, 0.045, 0.22); bell(c, b, t, 2349.32, 0.06, 0.03, 0.2); return 0.3 },
  complete: (c, b, t) => {
    for (const [i, f] of [523.25, 659.25, 783.99].entries()) bell(c, b, t, f, i * 0.07, 0.08, 0.5)
    return 0.7
  },
  // parts seating one after another, rising, then a small bell when the last is home
  cascade: (c, b, t, _v, o, still) => {
    const land = still ? 0 : o.delay
    const step = still ? 0 : o.stagger
    for (let i = 0; i < o.count; i++) {
      const f = SCALE[i % SCALE.length] * 2 ** Math.floor(i / SCALE.length)
      tone(c, b, t, { f: f * 1.5, to: f, at: land + i * step, a: 0.001, d: 0.07, peak: 0.13 })
      noise(c, b, t, { f: 1400, filter: "lowpass", at: land + i * step, d: 0.016, peak: 0.06 })
    }
    const end = land + (o.count - 1) * step
    bell(c, b, t, 1046.5, end + 0.14, 0.06, 0.32)
    bell(c, b, t, 1567.98, end + 0.19, 0.04, 0.3)
    return end + 0.6
  },
  // lifting off: a short breath of air
  whoosh: (c, b, t) => {
    noise(c, b, t, { f: 500, to: 2600, q: 0.8, a: 0.06, d: 0.26, peak: 0.07 })
    tone(c, b, t, { f: 260, to: 520, a: 0.03, d: 0.2, peak: 0.02 })
    return 0.36
  },
  // a sheet or a folder drawn out
  paper: (c, b, t, v) => {
    noise(c, b, t, { f: 1500 * v, to: 3200, q: 0.6, a: 0.025, d: 0.15, peak: 0.12 })
    noise(c, b, t, { f: 6000, filter: "highpass", q: 0.5, a: 0.01, d: 0.06, peak: 0.025 })
    return 0.2
  },
  // a machine working on it: a faint hum under a few quiet ticks
  process: (c, b, t) => {
    tone(c, b, t, { f: 110, a: 0.08, d: 0.5, peak: 0.014 })
    for (const at of [0.08, 0.19, 0.27, 0.42, 0.5]) noise(c, b, t, { f: 3600 + Math.random() * 1600, q: 4, at, d: 0.007, peak: 0.06 })
    return 0.62
  },
  done: (c, b, t) => { bell(c, b, t, 880, 0, 0.075, 0.32); bell(c, b, t, 1318.51, 0.045, 0.04, 0.26); return 0.4 },
}

export function play(name: SoundName, options: SoundOptions = {}): () => void {
  const c = ctx ?? boot()
  const bus = c.createGain()
  bus.connect(master as GainNode)
  const opts = { count: 4, stagger: 0.06, delay: 0.3, ...options }
  let done = false
  const start = () => {
    if (done) return
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches
    const length = RECIPES[name](c, bus, c.currentTime + 0.005, 1 + (Math.random() - 0.5) * 0.06, opts, still)
    window.setTimeout(() => bus.disconnect(), (length + 0.2) * 1000)
  }
  if (c.state === "running") start()
  else c.resume().then(start, () => {})
  window.clearTimeout(idle)
  idle = window.setTimeout(() => { if (c.state === "running") c.suspend() }, 4000)
  return () => {
    if (done) return
    done = true
    bus.gain.setTargetAtTime(0, c.currentTime, 0.015)
    window.setTimeout(() => bus.disconnect(), 150)
  }
}
