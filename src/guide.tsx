import { type CSSProperties, type ReactNode, useCallback, useEffect, useRef, useState } from "react"
import { cx } from "./cx"
import { DEV } from "./dev"
import { type Box3, path, project, top, type Vec3 } from "./iso"

/*
 * Guided motion: the pieces that tell a first-time reader what to press and
 * show them what pressing does. A ripple marks the part to press, a demo
 * cursor presses it once when the figure first comes into view, and signals
 * and flights carry the effect from the cause to the result.
 */

const r3 = (n: number) => Math.round(n * 1000) / 1000

/* ---------- useDemoTap ---------- */

/** Where a demo press is in its short life. */
export type DemoPhase = "waiting" | "aim" | "press" | "release" | "done"

export type DemoTapOptions = {
  /** Milliseconds the figure must be in view before the cursor appears. Default 500. */
  delay?: number | undefined
  /** Share of the figure that counts as in view, from 0 to 1. Default 0.6. A figure taller than the viewport only needs to fill it. */
  threshold?: number | undefined
}

export type DemoTap = {
  /** Put it on any svg element inside the figure; the figure's svg is what is watched. */
  ref: (element: SVGElement | null) => void
  phase: DemoPhase
  /** Stops the demo for good. It is called for you when the reader presses or types anywhere in the figure. */
  dismiss: () => void
  /** Spread onto the `Plate`, so the part marked `data-hot` sinks while the cursor presses it. */
  plate: { "data-demo"?: "press" }
}

const AIM_MS = 320
const PRESS_MS = 200
const RELEASE_MS = 560
const STEPS = Array.from({ length: 21 }, (_, i) => i / 20)

/**
 * Presses a figure once, for the reader, the first time it is mostly in view:
 * a cursor glides onto the part, presses it and calls `onTap`, then hands the
 * figure over. Scrolling away before the press cancels it and it waits for
 * the next visit. It never plays after the reader touches the figure, under
 * reduced motion, or without IntersectionObserver. It plays no sound: keep
 * `onTap` silent.
 */
export function useDemoTap(onTap: () => void, { delay = 500, threshold = 0.6 }: DemoTapOptions = {}): DemoTap {
  const node = useRef<SVGElement | null>(null)
  const [phase, setPhase] = useState<DemoPhase>("waiting")
  const latest = useRef(onTap)
  const run = useRef<{ dismissed: boolean; fired: boolean; timers: number[] }>({ dismissed: false, fired: false, timers: [] })
  const share = Math.min(1, Math.max(0, Number.isFinite(threshold) ? threshold : 0.6))
  useEffect(() => {
    latest.current = onTap
  })
  const dismiss = useCallback(() => {
    const state = run.current
    state.dismissed = true
    for (const timer of state.timers) window.clearTimeout(timer)
    state.timers = []
    setPhase("done")
  }, [])
  const ref = useCallback((element: SVGElement | null) => {
    node.current = element
    if (DEV && element && !element.ownerSVGElement) console.warn("react-isokit: useDemoTap's ref must go on an element inside the figure's svg, not on the svg itself")
  }, [])
  useEffect(() => {
    const svg = node.current?.ownerSVGElement
    const state = run.current
    if (state.fired || state.dismissed) {
      setPhase("done")
      return
    }
    setPhase("waiting")
    const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches
    if (!svg || reduced || typeof IntersectionObserver === "undefined") return
    const clear = () => {
      for (const timer of state.timers) window.clearTimeout(timer)
      state.timers = []
    }
    // The reader touching the figure, by pointer or key, takes it over before the cursor can press.
    const takeOver = () => dismiss()
    svg.addEventListener("pointerdown", takeOver, true)
    svg.addEventListener("keydown", takeOver, true)
    // The svg, not the element the ref is on: an svg group's bounding box is unreliable for IntersectionObserver.
    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[entries.length - 1]
        if (!entry || state.dismissed || state.fired) return
        const fits = entry.rootBounds && entry.boundingClientRect.height > 0 ? entry.rootBounds.height / entry.boundingClientRect.height : 1
        if (!entry.isIntersecting || entry.intersectionRatio + 0.01 < Math.min(share, fits)) {
          clear()
          setPhase("waiting")
          return
        }
        if (state.timers.length) return
        const at = (ms: number, step: () => void) => window.setTimeout(step, ms)
        state.timers = [
          at(delay, () => setPhase("aim")),
          at(delay + AIM_MS, () => setPhase("press")),
          at(delay + AIM_MS + PRESS_MS, () => {
            state.fired = true
            io.disconnect()
            setPhase("release")
            latest.current()
          }),
          at(delay + AIM_MS + PRESS_MS + RELEASE_MS, () => setPhase("done")),
        ]
      },
      { threshold: STEPS },
    )
    io.observe(svg)
    return () => {
      io.disconnect()
      svg.removeEventListener("pointerdown", takeOver, true)
      svg.removeEventListener("keydown", takeOver, true)
      clear()
    }
  }, [delay, share, dismiss])
  return { ref, phase, dismiss, plate: phase === "press" ? { "data-demo": "press" } : {} }
}

/* ---------- Cursor ---------- */

export type CursorProps = {
  /** The world point the tip lands on: the middle of the part's lid, or of its front face. */
  at: Vec3
  phase: DemoPhase
  /** Scale for figures drawn in large or small units. Default 1. */
  size?: number | undefined
  className?: string | undefined
}

const ARROW = "M0 0V15.6l3.9-3.7 2.7 5.9 2.7-1.2-2.6-5.7H12.2Z"

/**
 * The pointer a demo press is made with. It glides in from the lower right,
 * dips as it presses, rings at its tip and drifts off. Draw it last, so it
 * is on top of everything, and pass it the `phase` from `useDemoTap`.
 */
export function Cursor({ at, phase, size = 1, className }: CursorProps): ReactNode {
  if (phase === "waiting" || phase === "done") return null
  const [x, y] = project(...at)
  return (
    <g className={cx("ik-cursor", className)} data-phase={phase} transform={`translate(${r3(x)} ${r3(y)}) scale(${r3(size)})`}>
      <circle className="ik-cursor-ring" r={4} />
      <g className="ik-cursor-arrow">
        <path d={ARROW} />
      </g>
    </g>
  )
}

/* ---------- Ripple ---------- */

export type RippleProps = Omit<Box3, "h"> & {
  /** Corner radius of the footprint. */
  r?: number | undefined
  className?: string | undefined
}

/**
 * A ring that breathes out from a footprint at height `z`: the part to press.
 * Give it the footprint of the key it sits under, draw it just before the key,
 * and stop rendering it once the reader has pressed something. It never
 * catches the pointer, sleeps offscreen, and stands still under reduced motion.
 */
export function Ripple({ x, y, z, w, d, r = 0, className }: RippleProps): ReactNode {
  return (
    <g transform={top(x, y, z)}>
      <g className={cx("ik-ripple ik-loop", className)}>
        <rect width={w} height={d} rx={Math.max(0, Math.min(r, w / 2, d / 2))} />
      </g>
    </g>
  )
}

/* ---------- Signal ---------- */

export type SignalProps = {
  /** World points from the cause to the result, as for `path`. */
  points: readonly Vec3[]
  /** Milliseconds before it sets off. Default 0. */
  delay?: number | undefined
  /** Milliseconds from end to end. Default 320. */
  duration?: number | undefined
  className?: string | undefined
}

/**
 * A short bright dash that runs once along a path, from its first point to its
 * last: a request leaving a hub, a reading reaching a screen. It runs when it
 * mounts; give it a new `key` to run it again, and make the result land at
 * `delay + duration`.
 */
export function Signal({ points, delay = 0, duration = 320, className }: SignalProps): ReactNode {
  return <path className={cx("ik-signal", className)} d={path(points)} pathLength={100} style={{ animationDelay: `${delay}ms`, animationDuration: `${duration}ms` }} />
}

/* ---------- Flight ---------- */

export type FlightProps = {
  /** Where its children are drawn. */
  from: Vec3
  /** Where they land. */
  to: Vec3
  /** Milliseconds before take-off. Default 0. */
  delay?: number | undefined
  /** Milliseconds in the air. Default 520. */
  duration?: number | undefined
  /** How high the arc rises, in viewBox units. Default 26. */
  lift?: number | undefined
  className?: string | undefined
  children: ReactNode
}

/**
 * Carries its children, drawn at `from`, along an arc to `to`, and hides them
 * as they land: a coin moving between stacks, a card between slots. Hide the
 * part at `from` when it takes off (`delay`) and show it at `to` when it lands
 * (`delay + duration`). It never catches the pointer. Draw it last, and give it
 * a new `key` to fly again.
 */
export function Flight({ from, to, delay = 0, duration = 520, lift = 26, className, children }: FlightProps): ReactNode {
  const [fx, fy] = project(...from)
  const [tx, ty] = project(...to)
  const style = {
    "--ik-dx": `${r3(tx - fx)}px`,
    "--ik-dy": `${r3(ty - fy)}px`,
    "--ik-lift": `${-lift}px`,
    animationDelay: `${delay}ms`,
    animationDuration: `${duration}ms`,
  } as CSSProperties
  // Two groups, so the horizontal move and the rise and fall ease on their own: that is what makes it an arc.
  return (
    <g className={cx("ik-flight", className)} style={style}>
      <g className="ik-flight-arc">{children}</g>
    </g>
  )
}
