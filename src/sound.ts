/**
 * Interaction sound, the cheap half: a preference and a loader. The synthesis
 * lives in ./sound-engine, a separate chunk that is only fetched once someone
 * reaches for a figure, and no AudioContext exists until the first press. Sound
 * is off until the page turns it on: `configureSound({ defaultOn: true })`, or
 * a `<SoundToggle />` the reader presses.
 */

export type SoundName =
  | "press" | "release" | "toggle" | "boot"
  | "success" | "error" | "notify" | "complete"
  | "cascade" | "whoosh" | "paper" | "process" | "done"

export type SoundOptions = {
  /** For `cascade`: how many steps land, the gap between them and when the first lands, in seconds. */
  count?: number
  stagger?: number
  delay?: number
}

export type SoundConfig = {
  /** Whether sound is on before the reader has chosen. Default `false`. */
  defaultOn?: boolean
  /** Where the reader's choice is remembered. Default `"isokit:sound"`; `null` remembers nothing. */
  storageKey?: string | null
  /** Master volume, 0 to 1. Default `0.55`. */
  volume?: number
}

const config: Required<SoundConfig> = { defaultOn: false, storageKey: "isokit:sound", volume: 0.55 }
const listeners = new Set<() => void>()
let enabled: boolean | null = null
let engine: Promise<typeof import("./sound-engine")> | null = null
const noop = () => {}

export function configureSound(next: SoundConfig) {
  Object.assign(config, next)
  enabled = null
  engine?.then((m) => m.setVolume(config.volume), noop)
  for (const fn of listeners) fn()
}

function read(): boolean {
  if (enabled === null) {
    let stored: string | null = null
    try { if (config.storageKey) stored = localStorage.getItem(config.storageKey) } catch {}
    enabled = stored === null ? config.defaultOn : stored === "on"
  }
  return enabled
}

/** The reader's sound preference, shaped for `useSyncExternalStore`. */
export const soundPreference = {
  subscribe(fn: () => void) {
    listeners.add(fn)
    return () => { listeners.delete(fn) }
  },
  get: read,
  getServer: () => config.defaultOn,
  set(on: boolean) {
    enabled = on
    try { if (config.storageKey) localStorage.setItem(config.storageKey, on ? "on" : "off") } catch {}
    for (const fn of listeners) fn()
  },
}

/** Starts fetching the engine. Call it on intent (pointer enters, focus arrives) so the first press is on time. */
export function primeSound() {
  if (engine || !read() || typeof window === "undefined") return
  engine = import("./sound-engine").then((m) => { m.setVolume(config.volume); return m })
  engine.catch(() => { engine = null })
}

/** Browsers hold audio until the reader has interacted; sounds asked for before that are dropped, not queued. */
const activated = () => (navigator as Navigator & { userActivation?: { hasBeenActive: boolean } }).userActivation?.hasBeenActive ?? true

/** Plays a sound if sound is on. Returns a stop, for sounds a newer action should cut short. */
export function playSound(name: SoundName, options?: SoundOptions): () => void {
  if (typeof window === "undefined" || !read() || !activated()) return noop
  primeSound()
  let stopped = false
  let stop = noop
  engine?.then((m) => { if (!stopped) stop = m.play(name, options) }, noop)
  return () => { stopped = true; stop() }
}
