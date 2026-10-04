import { useCallback, useEffect, useId, useRef, useState } from "react"
import { Box, Plate, Press, path, playSound, top, type Vec3 } from "react-isokit"
import { Mark } from "../Mark"

/**
 * A desk computer: a compact all-in-one on a desk pad, a keyboard in front of
 * it and a coiled cable between them. Click it to switch it on, then type on
 * it, with your keyboard or its own keys. The first time it scrolls into view
 * it boots and types a line by itself.
 */

const MAT = { x: 0, y: 0, z: 0, w: 236, d: 244, h: 5 }
const PC = { x: 70, y: 8, z: 5, w: 120, d: 130, h: 172 }
const KB = { x: 16, y: 160, z: 5, w: 171, d: 63, h: 7 }
const U = 11, KEY = 9.4, KEY_H = 3.4
const GLASS = { x: 19, y: 20, w: 82, h: 70 }
const COLS = 19
const AUTOTYPE = "make it feel physical"

/** Each row as [key, width in keys]: fifteen keys wide, sixty-one in all. */
const one = (s: string) => s.split(" ").map((c): [string, number] => [c, 1])
const ROWS: Array<Array<[string, number]>> = [
  [...one("` 1 2 3 4 5 6 7 8 9 0 - ="), ["backspace", 2]],
  [["tab", 1.5], ...one("q w e r t y u i o p [ ]"), ["\\", 1.5]],
  [["caps", 1.75], ...one("a s d f g h j k l ; '"), ["return", 2.25]],
  [["shift", 2.25], ...one("z x c v b n m , . /"), ["shift r", 2.75]],
  [["control", 1.5], ["option", 1.25], ["command", 1.5], ["space", 6.5], ["command r", 1.5], ["option r", 1.25], ["control r", 1.5]],
]
const KEYS = ROWS.flatMap((row, r) => {
  let at = 0
  return row.map(([id, w]) => {
    const k = { id, x: KB.x + 3 + at * U + (U - KEY) / 2, y: KB.y + 3 + r * U + (U - KEY) / 2, w: w * U - (U - KEY) }
    at += w
    return k
  })
})
const KEY_IDS = new Set(KEYS.map((k) => k.id))
const SHIFTED: Record<string, string> = { "~": "`", "!": "1", "@": "2", "#": "3", $: "4", "%": "5", "^": "6", "&": "7", "*": "8", "(": "9", ")": "0", _: "-", "+": "=", "{": "[", "}": "]", "|": "\\", ":": ";", '"': "'", "<": ",", ">": ".", "?": "/" }
const NAMED: Record<string, string> = { " ": "space", Backspace: "backspace", Enter: "return", Shift: "shift", CapsLock: "caps", Control: "control", Alt: "option", Meta: "command" }
const keyFor = (key: string) => NAMED[key] ?? (key.length === 1 ? SHIFTED[key] ?? key.toLowerCase() : null)

/** A curve from the keyboard's back to the side port, coiled along its middle. */
const CABLE = (() => {
  const p: Vec3[] = [[KB.x + KB.w - 6, KB.y + 2, KB.z + 3], [214, 164, 7], [222, 126, 7], [PC.x + PC.w + 5, PC.y + PC.d - 12.5, PC.z + 24]]
  const at = (t: number) => [0, 1, 2].map((i) => (1 - t) ** 3 * p[0][i] + 3 * (1 - t) ** 2 * t * p[1][i] + 3 * (1 - t) * t * t * p[2][i] + t ** 3 * p[3][i])
  const pts: Vec3[] = []
  for (let i = 0; i <= 260; i++) {
    const t = i / 260, a = at(Math.max(0, t - 0.002)), b = at(Math.min(1, t + 0.002)), c = at(t)
    const tx = b[0] - a[0], ty = b[1] - a[1], n = Math.hypot(tx, ty) || 1
    const e = Math.sin(Math.PI * Math.min(1, Math.max(0, (t - 0.08) / 0.76))) ** 0.5, th = t * Math.PI * 34, r = 3.2 * e
    pts.push([c[0] - (ty / n) * r * Math.cos(th), c[1] + (tx / n) * r * Math.cos(th), c[2] + r * Math.sin(th) + r])
  }
  return path(pts)
})()

export function DeskComputer() {
  const [on, setOn] = useState(false)
  const [text, setText] = useState("")
  const [past, setPast] = useState("")
  const [down, setDown] = useState<ReadonlySet<string>>(new Set())
  const [last, setLast] = useState<string | null>(null)
  const host = useRef<HTMLDivElement>(null)
  const timers = useRef(new Map<string, number>())
  const auto = useRef({ done: false, timer: 0 })
  const id = useId().replace(/:/g, "")

  const press = useCallback((key: string, char?: string, quiet = false) => {
    window.clearTimeout(timers.current.get(key))
    setDown((d) => new Set(d).add(key))
    timers.current.set(key, window.setTimeout(() => setDown((d) => { const n = new Set(d); n.delete(key); return n }), 110))
    setLast(key)
    if (!quiet) playSound("press")
    if (key === "backspace") setText((t) => t.slice(0, -1))
    else if (key === "return") setText((t) => { if (t) setPast(t); return "" })
    else if (char) setText((t) => (t + char).slice(-200))
  }, [])
  const stopAuto = () => { auto.current.done = true; window.clearTimeout(auto.current.timer) }

  // Boots once on first sight and types a line, unless someone gets there first.
  useEffect(() => {
    const el = host.current, run = auto.current, timer = timers.current
    if (!el) return
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting || run.done) return
      io.disconnect()
      if (still) { run.done = true; setOn(true); setText(AUTOTYPE); return }
      let i = 0
      const step = () => {
        if (run.done) return
        if (i === AUTOTYPE.length) { run.done = true; return }
        const ch = AUTOTYPE[i++]
        press(ch === " " ? "space" : ch, ch, true)
        run.timer = window.setTimeout(step, 70 + Math.random() * 70)
      }
      run.timer = window.setTimeout(() => { if (run.done) return; setOn(true); run.timer = window.setTimeout(step, 900) }, 500)
    }, { threshold: 0.5 })
    io.observe(el)
    return () => { io.disconnect(); window.clearTimeout(run.timer); for (const t of timer.values()) window.clearTimeout(t) }
  }, [press])

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.metaKey || e.ctrlKey || e.altKey || e.key === "Tab") return
    const key = keyFor(e.key)
    if (!key || !KEY_IDS.has(key)) return
    e.preventDefault()
    stopAuto()
    press(key, on && e.key.length === 1 ? e.key : undefined)
  }
  const toggle = () => { stopAuto(); setOn(!on); setLast(null); playSound(on ? "toggle" : "boot") }
  const typeKey = (e: React.PointerEvent, key: string) => {
    e.preventDefault()
    stopAuto()
    ;(e.currentTarget.closest("svg") as SVGSVGElement | null)?.focus({ preventScroll: true })
    press(key, !on ? undefined : key === "space" ? " " : key.length === 1 ? key : undefined)
  }

  const name = last === "space" || last === "return" || last === "backspace" ? last : last?.replace(/ r$/, "")
  const readout = (on ? `on · ${text.length} chars` : "off") + (name ? ` · key ${name}` : "")

  return <div ref={host} className="desk-host">
    <Plate fig="Fig 1" name="Desk computer" hint="Type on it · click it to switch" readout={readout} className="desk" data-on={on}
      fit={[MAT, PC]} aspect={1.6} pad={0.05} tabIndex={0} onKeyDown={onKeyDown} onPointerDown={stopAuto}
      label="A desk computer with a keyboard and a coiled cable. Click the computer to switch it on, then type to write on its screen.">
      <defs>
        <clipPath id={`${id}-glass`}><rect x={GLASS.x} y={GLASS.y} width={GLASS.w} height={GLASS.h} rx={11} /></clipPath>
        <radialGradient id={`${id}-glow`} cx="50%" cy="45%" r="65%"><stop offset="0" className="glow-in" /><stop offset="1" className="glow-out" /></radialGradient>
      </defs>

      <Box {...MAT} r={14} className="mat" />

      <Press className="ik-lift pc" label={on ? "Switch the computer off" : "Switch the computer on"} onPress={toggle} sound={false}>
        <Box {...PC} r={10}
          top={<>
            <rect className="ik-well" x={14} y={9} width={92} height={13} rx={6.5} />
            {[0, 1, 2, 3, 4, 5].map((i) => <path key={i} className="ik-detail" d={`M28 ${32 + i * 4.5}h64`} />)}
            <path className="ik-detail" d={`M4 ${PC.d - 12}h${PC.w - 8}`} />
          </>}
          side={<>
            <path className="ik-detail" d={`M12 4v${PC.h - 8}`} />
            {Array.from({ length: 9 }, (_, i) => <path key={i} className="ik-detail" d={`M${92 + i * 3.4} 18v46`} />)}
            {Array.from({ length: 6 }, (_, i) => <path key={i} className="ik-detail" d={`M${98 + i * 3.4} 128v16`} />)}
            <rect className="ik-well" x={100} y={150} width={9} height={8} rx={1.5} />
            <rect className="ik-well" x={112} y={150} width={9} height={8} rx={1.5} />
            <rect className="ik-well" x={8} y={148} width={9} height={9} rx={1.5} />
          </>}
          front={<>
            <rect className="ik-well" x={10} y={11} width={100} height={88} rx={9} />
            <rect className="ik-detail" x={13} y={14} width={94} height={82} rx={8} />
            <rect className="glass" x={GLASS.x} y={GLASS.y} width={GLASS.w} height={GLASS.h} rx={11} />
            <g className="crt" clipPath={`url(#${id}-glass)`}>
              <rect x={GLASS.x} y={GLASS.y} width={GLASS.w} height={GLASS.h} fill={`url(#${id}-glow)`} />
              {Array.from({ length: 23 }, (_, i) => <path key={i} className="scan" d={`M${GLASS.x} ${GLASS.y + 2 + i * 3}h${GLASS.w}`} />)}
              <Mark x={GLASS.x + GLASS.w / 2} y={GLASS.y + 22} size={11} className="phosphor" />
              <text className="screen-text dim" x={GLASS.x + 7} y={GLASS.y + 47}>{past ? `> ${past.slice(-(COLS - 2))}` : ""}</text>
              <text className="screen-text" x={GLASS.x + 7} y={GLASS.y + 57}>{`> ${text.slice(-(COLS - 2))}`}<tspan className="cursor ik-loop">_</tspan></text>
            </g>
            <path className="ik-detail" d="M8 106h104" />
            {Array.from({ length: 6 }, (_, i) => <path key={i} className="ik-detail" d={`M${15 + i * 3} 114v15`} />)}
            <rect className="ik-well" x={58} y={124} width={44} height={5.5} rx={2.75} />
            <path className="ik-detail" d="M62 133h12" />
            <circle className="led" cx={14} cy={151} r={1.7} />
            <path className="ik-detail" d={`M6 ${PC.h - 10}h108`} />
          </>} />
      </Press>

      <Box x={PC.x + PC.w} y={PC.y + PC.d - 17} z={PC.z + 20} w={5} d={9} h={9} r={1.5} />
      <path className="ik-line" d={CABLE} />

      <Box {...KB} r={4} />
      <g transform={top(KB.x, KB.y, KB.z + KB.h)}><rect className="ik-detail" x={2} y={2} width={KB.w - 4} height={KB.d - 4} rx={3} /></g>
      {KEYS.map((k) => <g key={k.id} className="key" data-down={down.has(k.id)} onPointerDown={(e) => typeKey(e, k.id)}>
        <Box x={k.x} y={k.y} z={KB.z + KB.h} w={k.w} d={KEY} h={KEY_H} r={1.6} />
      </g>)}
    </Plate>
  </div>
}
