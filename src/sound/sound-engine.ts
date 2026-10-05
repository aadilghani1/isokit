import type { SoundName, SoundOptions } from "../schema"
import { type CascadeShape, RECIPES } from "./sound-recipes"

type AudioGraph = { context: AudioContext; master: GainNode; noise: AudioBuffer }

const START_OFFSET_SECONDS = 0.005
const PITCH_SPREAD = 0.06
const BUS_RELEASE_SECONDS = 0.2
const STOP_FADE_SECONDS = 0.015
const STOP_DISCONNECT_MS = 150
const MIN_IDLE_SECONDS = 4
const IDLE_MARGIN_SECONDS = 0.5

const clamp = (value: number | undefined, low: number, high: number, fallback: number): number => (value === undefined || !Number.isFinite(value) ? fallback : Math.min(high, Math.max(low, value)))

const cascadeShape = (options: SoundOptions): CascadeShape => ({
  count: Math.round(clamp(options.count, 1, 32, 4)),
  stagger: clamp(options.stagger, 0, 2, 0.06),
  delay: clamp(options.delay, 0, 5, 0.3),
})

const prefersStillness = (): boolean => typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches

function buildGraph(volume: number): AudioGraph {
  const AudioContextClass = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
  const context = new AudioContextClass({ latencyHint: "interactive" })
  const limiter = context.createDynamicsCompressor()
  limiter.threshold.value = -14
  limiter.knee.value = 8
  limiter.ratio.value = 4
  limiter.attack.value = 0.002
  limiter.release.value = 0.12
  const master = context.createGain()
  master.gain.value = volume
  master.connect(limiter).connect(context.destination)
  const noise = context.createBuffer(1, context.sampleRate / 2, context.sampleRate)
  const samples = noise.getChannelData(0)
  for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1
  return { context, master, noise }
}

let graph: AudioGraph | null = null
let volume = 0.55
let idleTimer = 0
let quietAt = 0

function suspendWhenQuiet(context: AudioContext, length: number): void {
  quietAt = Math.max(quietAt, context.currentTime + length)
  window.clearTimeout(idleTimer)
  const waitSeconds = Math.max(MIN_IDLE_SECONDS, quietAt - context.currentTime + IDLE_MARGIN_SECONDS)
  idleTimer = window.setTimeout(() => {
    if (context.state === "running") context.suspend()
  }, waitSeconds * 1000)
}

export function setVolume(next: number): void {
  volume = Math.max(0, Math.min(1, next))
  if (graph) graph.master.gain.value = volume
}

export function play(name: SoundName, options: SoundOptions = {}): () => void {
  const recipe = Object.hasOwn(RECIPES, name) ? RECIPES[name] : undefined
  if (!recipe) return () => {}
  graph ??= buildGraph(volume)
  const { context, master, noise } = graph
  const bus = context.createGain()
  bus.connect(master)
  const shape = cascadeShape(options)
  let stopped = false
  const start = () => {
    if (stopped) return
    const pitch = 1 + (Math.random() - 0.5) * PITCH_SPREAD
    const length = recipe({ context, bus, noise, startAt: context.currentTime + START_OFFSET_SECONDS }, pitch, shape, prefersStillness())
    window.setTimeout(() => bus.disconnect(), (length + BUS_RELEASE_SECONDS) * 1000)
    suspendWhenQuiet(context, length)
  }
  if (context.state === "running") start()
  else context.resume().then(start, () => {})
  return () => {
    if (stopped) return
    stopped = true
    bus.gain.setTargetAtTime(0, context.currentTime, STOP_FADE_SECONDS)
    window.setTimeout(() => bus.disconnect(), STOP_DISCONNECT_MS)
  }
}
