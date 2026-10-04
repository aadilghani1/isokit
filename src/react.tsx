import { type ButtonHTMLAttributes, type KeyboardEvent, type ReactNode, type SVGProps, useEffect, useRef, useState, useSyncExternalStore } from "react"
import { type Box3, frame, front, outline, radius, side, top, type Vec3 } from "./iso"
import { playSound, primeSound, soundPreference } from "./sound"

const cx = (...names: Array<string | false | undefined>) => names.filter(Boolean).join(" ")

/* ---------- Plate ---------- */

export type PlateProps = {
  /** The accessible name: what the figure is and how to use it. */
  label: string
  /** Boxes and points to frame. The viewBox is fitted to them. */
  fit?: ReadonlyArray<Box3 | Vec3>
  /** Width / height of the drawing. Default 1.25. */
  aspect?: number
  /** Padding around `fit`, as a share of its size. Default 0.07. */
  pad?: number
  /** Your own viewBox, instead of `fit`. */
  viewBox?: string
  /** Top-left caption, as in "Fig 2". */
  fig?: ReactNode
  /** Top-right caption: the object's name. */
  name?: ReactNode
  /** Bottom-left caption: what to do. */
  hint?: ReactNode
  /** Bottom-right caption: what just happened. Announced politely to screen readers. */
  readout?: ReactNode
  /** Unset follows a `.dark` or `[data-theme="dark"]` ancestor; `"system"` follows the OS. */
  theme?: "light" | "dark" | "system"
  className?: string
  style?: React.CSSProperties
  children?: ReactNode
} & Omit<SVGProps<SVGSVGElement>, "viewBox" | "children" | "className" | "style" | "fit" | "name">

/**
 * The numbered plate a figure sits on, and the svg it is drawn in. Captions
 * are optional. Looping animations inside it only run while it is near the
 * viewport, and sound starts loading when a pointer or focus arrives.
 */
export function Plate({ label, fit, aspect = 1.25, pad = 0.07, viewBox, fig, name, hint, readout, theme, className, style, children, ...svg }: PlateProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [awake, setAwake] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === "undefined") return setAwake(true)
    const io = new IntersectionObserver(([e]) => setAwake(e.isIntersecting), { rootMargin: "80px" })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  const box = viewBox ?? frame(fit ?? [], aspect, pad)
  const head = fig != null || name != null, foot = hint != null || readout != null
  return <div ref={ref} className={cx("ik-plate", className)} style={style} data-theme={theme} data-awake={awake || undefined}
    onPointerEnter={primeSound} onFocusCapture={primeSound}>
    {head && <div className="ik-cap"><span className="ik-cap-hi">{fig}</span><span>{name}</span></div>}
    <svg viewBox={box} role="img" aria-label={label} {...svg}>{children}</svg>
    {foot && <div className="ik-cap"><span>{hint}</span><span className="ik-cap-hi" aria-live="polite">{readout}</span></div>}
  </div>
}

/* ---------- Box ---------- */

export type BoxProps = Box3 & {
  /** Corner radius of the footprint, in world units. */
  r?: number
  className?: string
  /** Drawn on the lid. Local x runs along +x, local y along +y, from the back-left corner. */
  top?: ReactNode
  /** Drawn on the face toward lower-left. Local x runs along +x, local y runs down, from the top-left corner. */
  front?: ReactNode
  /** Drawn on the face toward lower-right. Local x runs from the front edge to the back, local y runs down. */
  side?: ReactNode
  /** Drawn after the box, in world-projected screen space. */
  children?: ReactNode
}

/**
 * A rounded box: an outline that is the hull of its rounded top and foot, a
 * darker right side and a lighter lid. Draw on its faces through `top`,
 * `front` and `side`, in that face's own flat coordinates.
 */
export function Box({ x, y, z, w, d, h, r = 0, className, top: onTop, front: onFront, side: onSide, children }: BoxProps) {
  const b = { x, y, z, w, d, h }, rr = radius(b, r)
  return <g className={className}>
    <path className="ik-face" d={outline(b, rr)} />
    {d > 2 * rr && <g transform={side(x + w, y + d - rr, z + h)}><rect className="ik-tint" width={d - 2 * rr} height={h} /></g>}
    <g transform={top(x, y, z + h)}><rect className="ik-face ik-top" width={w} height={d} rx={rr} /></g>
    {onSide != null && <g transform={side(x + w, y + d, z + h)}>{onSide}</g>}
    {onFront != null && <g transform={front(x, y + d, z + h)}>{onFront}</g>}
    {onTop != null && <g transform={top(x, y, z + h)}>{onTop}</g>}
    {children}
  </g>
}

/* ---------- Press ---------- */

export type PressProps = {
  /** The accessible name of the part, as in "Publish the page". */
  label: string
  onPress: () => void
  /** Play the press and release clicks. Default true; sound must also be on. */
  sound?: boolean
  disabled?: boolean
  className?: string
  children: ReactNode
} & Omit<SVGProps<SVGGElement>, "onClick" | "onKeyDown" | "onKeyUp" | "children" | "className">

const activates = (e: KeyboardEvent) => e.key === "Enter" || e.key === " "

/**
 * A part you can press, the way a real key works: it goes down on press, comes
 * up on release and acts on release. Pointer, Enter and Space all work. Wrap
 * the boxes that should sink in one `<g>` inside it.
 */
export function Press({ label, onPress, sound = true, disabled, className, children, ...rest }: PressProps) {
  const [down, setDown] = useState(false)
  const push = () => { if (disabled) return; setDown(true); if (sound) playSound("press") }
  const lift = () => { setDown(false); if (sound) playSound("release") }
  return <g className={cx("ik-press", className)} role="button" tabIndex={disabled ? -1 : 0} aria-label={label} aria-disabled={disabled || undefined} data-down={down}
    onPointerDown={(e) => { if (e.button === 0) push() }}
    onPointerUp={() => { if (down) lift() }}
    onPointerLeave={() => setDown(false)}
    onPointerCancel={() => setDown(false)}
    onClick={() => { if (!disabled) onPress() }}
    onKeyDown={(e) => { if (!activates(e)) return; e.preventDefault(); if (!e.repeat) push() }}
    onKeyUp={(e) => { if (!activates(e) || !down) return; e.preventDefault(); lift(); onPress() }}
    {...rest}>{children}</g>
}

/* ---------- Sound ---------- */

/** The reader's sound preference and a setter. */
export function useSoundEnabled(): [boolean, (on: boolean) => void] {
  const on = useSyncExternalStore(soundPreference.subscribe, soundPreference.get, soundPreference.getServer)
  return [on, soundPreference.set]
}

export type SoundToggleProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onClick" | "aria-pressed">

/** A small switch for interaction sound. Remembers the reader's choice. */
export function SoundToggle({ className, children = "Sound", ...rest }: SoundToggleProps) {
  const [on, set] = useSoundEnabled()
  const toggle = () => {
    set(!on)
    if (!on) playSound("toggle")
  }
  return <button type="button" className={cx("ik-sound-toggle", className)} aria-pressed={on} onClick={toggle} onPointerEnter={primeSound} {...rest}>
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.5 6h2.2L8 3.2v9.6L4.7 10H2.5z" />
      {on ? <path d="M10.6 5.6a3.4 3.4 0 0 1 0 4.8M12.5 3.8a6 6 0 0 1 0 8.4" /> : <path d="M10.5 6l3.5 4M14 6l-3.5 4" />}
    </svg>
    {children}
  </button>
}
