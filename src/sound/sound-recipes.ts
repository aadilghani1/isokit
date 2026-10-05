import type { SoundName } from "../schema"
import { bell, type Mixer, noise, tone } from "./sound-voices"

export type CascadeShape = { count: number; stagger: number; delay: number }

export type Recipe = (mixer: Mixer, pitch: number, cascade: CascadeShape, still: boolean) => number

const CASCADE_SCALE = [392, 493.88, 587.33, 783.99, 987.77, 1174.66]
const BOOT_CHORD = [174.61, 220, 261.63, 349.23, 523.25]
const COMPLETE_PHRASE = [523.25, 659.25, 783.99]
const PROCESS_TICKS = [0.08, 0.19, 0.27, 0.42, 0.5]

export const RECIPES: Record<SoundName, Recipe> = {
  press: (mixer, pitch) => {
    noise(mixer, { frequency: 3400 * pitch, q: 1.4, decay: 0.016, peak: 0.3 })
    tone(mixer, { frequency: 170 * pitch, glideTo: 70, attack: 0.002, decay: 0.05, peak: 0.26 })
    return 0.08
  },
  release: (mixer, pitch) => {
    noise(mixer, { frequency: 5200 * pitch, q: 2, decay: 0.01, peak: 0.1 })
    tone(mixer, { frequency: 320 * pitch, glideTo: 220, decay: 0.022, peak: 0.06 })
    return 0.05
  },
  toggle: (mixer, pitch) => {
    noise(mixer, { frequency: 4200 * pitch, q: 1.8, decay: 0.012, peak: 0.16 })
    tone(mixer, { frequency: 900 * pitch, wave: "triangle", decay: 0.03, peak: 0.04 })
    return 0.06
  },
  boot: (mixer) => {
    for (const [index, frequency] of BOOT_CHORD.entries()) {
      tone(mixer, { frequency, wave: "triangle", at: index * 0.006, attack: 0.012, decay: 1.3, peak: 0.05 })
      tone(mixer, { frequency: frequency * 1.003, at: index * 0.006, attack: 0.012, decay: 1.1, peak: 0.03 })
    }
    return 1.4
  },
  success: (mixer) => {
    bell(mixer, 659.25, 0, 0.12)
    bell(mixer, 987.77, 0.075, 0.12, 0.5)
    return 0.6
  },
  error: (mixer) => {
    tone(mixer, { frequency: 392, wave: "triangle", decay: 0.15, peak: 0.1 })
    tone(mixer, { frequency: 311.13, wave: "triangle", at: 0.085, decay: 0.2, peak: 0.1 })
    return 0.32
  },
  notify: (mixer) => {
    bell(mixer, 1567.98, 0, 0.045, 0.22)
    bell(mixer, 2349.32, 0.06, 0.03, 0.2)
    return 0.3
  },
  complete: (mixer) => {
    for (const [index, frequency] of COMPLETE_PHRASE.entries()) bell(mixer, frequency, index * 0.07, 0.08, 0.5)
    return 0.7
  },
  cascade: (mixer, _pitch, cascade, still) => {
    const land = still ? 0 : cascade.delay
    const step = still ? 0 : cascade.stagger
    for (let index = 0; index < cascade.count; index++) {
      const base = (CASCADE_SCALE[index % CASCADE_SCALE.length] ?? 392) * 2 ** Math.floor(index / CASCADE_SCALE.length)
      tone(mixer, { frequency: base * 1.5, glideTo: base, at: land + index * step, attack: 0.001, decay: 0.07, peak: 0.13 })
      noise(mixer, { frequency: 1400, filter: "lowpass", at: land + index * step, decay: 0.016, peak: 0.06 })
    }
    const lastLanding = land + (cascade.count - 1) * step
    bell(mixer, 1046.5, lastLanding + 0.14, 0.06, 0.32)
    bell(mixer, 1567.98, lastLanding + 0.19, 0.04, 0.3)
    return lastLanding + 0.6
  },
  whoosh: (mixer) => {
    noise(mixer, { frequency: 500, glideTo: 2600, q: 0.8, attack: 0.06, decay: 0.26, peak: 0.07 })
    tone(mixer, { frequency: 260, glideTo: 520, attack: 0.03, decay: 0.2, peak: 0.02 })
    return 0.36
  },
  paper: (mixer, pitch) => {
    noise(mixer, { frequency: 1500 * pitch, glideTo: 3200, q: 0.6, attack: 0.025, decay: 0.15, peak: 0.12 })
    noise(mixer, { frequency: 6000, filter: "highpass", q: 0.5, attack: 0.01, decay: 0.06, peak: 0.025 })
    return 0.2
  },
  process: (mixer) => {
    tone(mixer, { frequency: 110, attack: 0.08, decay: 0.5, peak: 0.014 })
    for (const at of PROCESS_TICKS) noise(mixer, { frequency: 3600 + Math.random() * 1600, q: 4, at, decay: 0.007, peak: 0.06 })
    return 0.62
  },
  done: (mixer) => {
    bell(mixer, 880, 0, 0.075, 0.32)
    bell(mixer, 1318.51, 0.045, 0.04, 0.26)
    return 0.4
  },
}
