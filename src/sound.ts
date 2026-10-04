import { check, DEV } from "./dev"
import type { SoundConfig, SoundName, SoundOptions } from "./schema"

/**
 * Interaction sound, the cheap half: a preference and a loader. The synthesis
 * lives in ./sound-engine, a separate chunk that is only fetched once someone
 * reaches for a figure, and no AudioContext exists until the first press. Sound
 * is off until the page turns it on: `configureSound({ defaultOn: true })`, or
 * a `<SoundToggle />` the reader presses.
 */

export type { SoundConfig, SoundName, SoundOptions }

type Settings = { defaultOn: boolean; storageKey: string | null; volume: number }

const settings: Settings = { defaultOn: false, storageKey: "isokit:sound", volume: 0.55 }
const listeners = new Set<() => void>()
let enabled: boolean | null = null
let engine: Promise<typeof import("./sound-engine")> | null = null
const noop = () => {}

/**
 * Page-wide sound settings. Call it once, early. Invalid values are reported in
 * development and ignored (or clamped) in production.
 */
export function configureSound(next: SoundConfig): void {
  if (DEV) check("soundConfig", next, "configureSound() was given settings it cannot use")
  if (typeof next.defaultOn === "boolean") settings.defaultOn = next.defaultOn
  if (next.storageKey === null || (typeof next.storageKey === "string" && next.storageKey)) settings.storageKey = next.storageKey
  if (typeof next.volume === "number" && Number.isFinite(next.volume)) settings.volume = Math.min(1, Math.max(0, next.volume))
  enabled = null
  engine?.then((m) => m.setVolume(settings.volume), noop)
  for (const fn of listeners) fn()
}

function read(): boolean {
  if (enabled === null) {
    let stored: string | null = null
    try {
      if (settings.storageKey) stored = localStorage.getItem(settings.storageKey)
    } catch {}
    // Storage is not ours alone: anything but our two values means "not chosen yet".
    enabled = stored === "on" ? true : stored === "off" ? false : settings.defaultOn
  }
  return enabled
}

/** The reader's sound preference, shaped for `useSyncExternalStore`. */
export const soundPreference: {
  subscribe(fn: () => void): () => void
  get(): boolean
  getServer(): boolean
  set(on: boolean): void
} = {
  subscribe(fn) {
    listeners.add(fn)
    return () => {
      listeners.delete(fn)
    }
  },
  get: read,
  getServer: () => settings.defaultOn,
  set(on) {
    enabled = on
    try {
      if (settings.storageKey) localStorage.setItem(settings.storageKey, on ? "on" : "off")
    } catch {}
    for (const fn of listeners) fn()
  },
}

/** Starts fetching the engine. Call it on intent (pointer enters, focus arrives) so the first press is on time. */
export function primeSound(): void {
  if (engine || typeof window === "undefined" || !read()) return
  engine = import("./sound-engine").then((m) => {
    m.setVolume(settings.volume)
    return m
  })
  engine.catch(() => {
    engine = null
  })
}

/** Browsers hold audio until the reader has interacted; sounds asked for before that are dropped, not queued. */
const activated = () => (navigator as Navigator & { userActivation?: { hasBeenActive: boolean } }).userActivation?.hasBeenActive ?? true

/** Plays a sound if sound is on. Returns a stop, for sounds a newer action should cut short. */
export function playSound(name: SoundName, options?: SoundOptions): () => void {
  if (DEV) check("soundName", name, `playSound("${String(name)}") is not a sound isokit has`)
  if (DEV && options) check("soundOptions", options, `playSound("${String(name)}") was given options it cannot use`)
  if (typeof window === "undefined" || !read() || !activated()) return noop
  primeSound()
  let stopped = false
  let stop = noop
  engine?.then((m) => {
    if (!stopped) stop = m.play(name, options)
  }, noop)
  return () => {
    stopped = true
    stop()
  }
}
