import { type CSSProperties, useEffect, useRef, useState } from "react"
import { Box, Cursor, curve, Plate, Press, path, playSound, project, Ripple, Signal, useDemoTap, type Vec3 } from "react-isokit"
import type { FigureMeta } from "../../site/registry"
import "./BatteryStack.css"

/**
 * An energy-storage pack: four cell modules standing on an enclosure, their
 * terminals joined by a bus bar, and a charging plug lying unplugged in
 * front. Press charge and the plug seats, current runs along the bus bar and
 * the cells fill level by level. Press again and the pack discharges.
 */

export const meta: FigureMeta = {
  slug: "battery-stack",
  title: "Battery stack",
  category: "deeptech",
  blurb: "Press charge: the plug seats, current runs along the bus bar and four cells fill up level by level.",
  uses: ["Plate", "Box", "Press", "Signal", "Ripple", "Cursor", "useDemoTap", "project", "curve", "path"],
  sounds: ["toggle", "cascade", "whoosh"],
}

type Phase = "flat" | "charged" | "drained"

const CASE = { x: 0, y: 0, z: 0, w: 168, d: 74, h: 30 }
const CELL = { y: 12, z: CASE.h, w: 30, d: 34, h: 50 }
const CELLS = [0, 1, 2, 3] as const
const cellX = (i: number) => 10 + i * 38
const POST = { y: CELL.y + CELL.d / 2 - 2.5, z: CELL.z + CELL.h, w: 5, d: 5, h: 4 }
const POSTS = CELLS.flatMap((i) => [cellX(i) + 5, cellX(i) + CELL.w - 10])
const RISER = { x: 158, y: POST.y, z: CASE.h, w: 6, d: 5, h: CELL.h + POST.h }
const BUS = { x: 12, y: POST.y, z: POST.z + POST.h, w: RISER.x + RISER.w - 12, d: 5, h: 2.5 }
const KEY = { x: 110, y: 56, z: CASE.h, w: 46, d: 14, h: 5 }
const GAP = 12
const PLUG = { x: 135, y: CASE.y + CASE.d + GAP, z: 0, w: 14, d: 10, h: 9 }
const EXIT = PLUG.x + PLUG.w / 2
const TAIL = path([
  [EXIT, PLUG.y + PLUG.d, 4.5],
  [EXIT, PLUG.y + PLUG.d + 5, 1.5],
  [EXIT, PLUG.y + PLUG.d + 7 + GAP, 1.5],
])
/** Lies under the tail at rest and carries on past it, so the cable stays whole when the plug moves in. */
const LEAD = path([[EXIT, PLUG.y + PLUG.d + 5, 1.5], ...curve([EXIT, PLUG.y + PLUG.d + 7 + GAP, 1.5], [EXIT, 136, 1.5], [96, 112, 1.5], [62, 136, 1.5], 36)])
const [SEAT_X, SEAT_Y] = project(0, -GAP, 0)
const BUS_TOP = BUS.z + BUS.h
const CHARGE_PATH: readonly Vec3[] = [
  [RISER.x + RISER.w / 2, RISER.y + RISER.d, CASE.h + 2],
  [RISER.x + RISER.w / 2, RISER.y + RISER.d, BUS.z],
  [RISER.x + RISER.w / 2, BUS.y + BUS.d / 2, BUS_TOP],
  [BUS.x + 2, BUS.y + BUS.d / 2, BUS_TOP],
]
const DRAIN_PATH = [...CHARGE_PATH].reverse()

const LEVELS = [0, 1, 2, 3, 4] as const
const SEG = { x: 10.5, w: 9, h: 5.4, gap: 1.05, bottom: 41.6 }
const segY = (k: number) => SEG.bottom - (k + 1) * SEG.h - k * SEG.gap
const SIGNAL_AT = 260
const SIGNAL_MS = 420
const FILL_AT = 420
const DRAIN_AT = 140
const LEVEL_MS = 110
const CELL_MS = 60
const PLAN: Readonly<Record<Phase, { level: number; pct: string; kwh: string; readout: string; next: Phase }>> = {
  flat: { level: 1, pct: "18%", kwh: "0.7 kWh", readout: "18% · unplugged", next: "charged" },
  charged: { level: 4, pct: "82%", kwh: "3.2 kWh", readout: "82% · 3.2 kWh", next: "drained" },
  drained: { level: 1, pct: "18%", kwh: "0.7 kWh", readout: "18% · 2.5 kWh out", next: "charged" },
}
const LOW = PLAN.flat.level
const HIGH = PLAN.charged.level
const SETTLE = { charged: FILL_AT + (HIGH - LOW - 1) * LEVEL_MS + 3 * CELL_MS, drained: DRAIN_AT + (HIGH - LOW - 1) * LEVEL_MS + 3 * CELL_MS }

/** When segment `k` of cell `i` changes: charging fills upward from the riser end, draining empties downward from the far end. */
function delayOf(phase: Phase, i: number, k: number) {
  if (k < LOW || k >= HIGH) return 0
  if (phase === "charged") return FILL_AT + (k - LOW) * LEVEL_MS + (CELLS.length - 1 - i) * CELL_MS
  if (phase === "drained") return DRAIN_AT + (HIGH - 1 - k) * LEVEL_MS + i * CELL_MS
  return 0
}

export default function BatteryStack() {
  const [run, setRun] = useState<{ phase: Phase; step: number }>({ phase: "flat", step: 0 })
  const [touched, setTouched] = useState(false)
  const stop = useRef(() => {})
  useEffect(() => () => stop.current(), [])

  const { phase, step } = run
  const charged = phase === "charged"
  const plan = PLAN[phase]
  const toggle = (audible: boolean) => {
    const next = plan.next
    stop.current()
    if (audible) {
      if (next === "charged") {
        const click = playSound("toggle")
        const fill = playSound("cascade", { count: HIGH - LOW, stagger: LEVEL_MS / 1000, delay: FILL_AT / 1000 })
        stop.current = () => {
          click()
          fill()
        }
      } else stop.current = playSound("whoosh")
    }
    setRun({ phase: next, step: step + 1 })
  }
  const demo = useDemoTap(
    () => {
      if (phase === "flat") toggle(false)
    },
    { delay: 1700 },
  )
  const press = () => {
    demo.dismiss()
    setTouched(true)
    toggle(true)
  }

  return (
    <Plate
      {...demo.plate}
      fig="Deep tech"
      name="Battery stack"
      hint={charged ? "Press to discharge" : "Press charge"}
      readout={plan.readout}
      className="fig-battery-stack"
      data-charged={charged}
      fit={[CASE, { x: cellX(0), y: CELL.y, z: 0, w: BUS.x + BUS.w - cellX(0), d: CELL.d, h: BUS_TOP }, PLUG, [62, 136, 0]]}
      aspect={1.3}
      label="An energy-storage pack: four battery cells on an enclosure, joined by a bus bar, with a charging plug lying unplugged in front. Press charge to plug it in and fill the cells; press again to discharge."
    >
      <g ref={demo.ref}>
        <Box
          {...CASE}
          r={6}
          top={
            <text className="ik-label spec" x={cellX(0)} y={63}>
              LFP · 4S · 48V
            </text>
          }
          front={
            <>
              <rect className="ik-screen" x={8} y={6} width={58} height={18} rx={3} />
              <g key={step} className="ik-enter" style={{ animationDelay: `${step ? SETTLE[phase === "charged" ? "charged" : "drained"] : 0}ms` }}>
                <text className="ik-screen-text" x={13} y={19.5} fontSize={9}>
                  {plan.pct}
                </text>
                <text className="ik-screen-text ik-dim" x={35} y={19} fontSize={5.6}>
                  {plan.kwh}
                </text>
              </g>
              {Array.from({ length: 10 }, (_, k) => (
                <path key={k} className="ik-detail" d={`M${76 + k * 3.2} 8v14`} />
              ))}
              <text className="ik-label tag" x={112} y={12}>
                DC IN
              </text>
              <rect className="ik-well" x={PLUG.x + 1} y={CASE.h - 8.5} width={PLUG.w - 2} height={6.5} rx={1.2} />
              <path className="ik-detail" d={`M${PLUG.x + 4.5} ${CASE.h - 5.25}h${PLUG.w - 9}`} />
            </>
          }
          side={
            <>
              {Array.from({ length: 9 }, (_, k) => (
                <path key={k} className="ik-detail" d={`M${8 + k * 4} 7v16`} />
              ))}
              <rect className="ik-well" x={52} y={8} width={10} height={13} rx={1.5} />
              <path className="ik-line ik-thick" d="M57 11v5" />
            </>
          }
        />
        {CELLS.map((i) => (
          <Box
            key={i}
            x={cellX(i)}
            {...CELL}
            r={3}
            top={<path className="ik-detail" d={`M4 ${CELL.d - 5}h${CELL.w - 8}`} />}
            front={
              <>
                <path className="ik-detail" d={`M4 4.5h${CELL.w - 8}`} />
                <rect className="ik-screen" x={9} y={9} width={12} height={34} rx={2} />
                {LEVELS.map((k) => (
                  <rect
                    key={k}
                    className="seg"
                    data-on={k < plan.level}
                    style={{ "--t": `${delayOf(phase, i, k)}ms` } as CSSProperties}
                    x={SEG.x}
                    y={segY(k)}
                    width={SEG.w}
                    height={SEG.h}
                    rx={0.8}
                  />
                ))}
                <text className="ik-label tag" x={24} y={47.5}>
                  {i + 1}
                </text>
              </>
            }
          />
        ))}
        {POSTS.map((x) => (
          <Box key={x} x={x} {...POST} r={2.5} />
        ))}
        <Box {...RISER} r={1.5} />
        <Box {...BUS} r={1.5} className="bus" />
        {step > 0 ? <Signal key={step} points={charged ? CHARGE_PATH : DRAIN_PATH} delay={charged ? SIGNAL_AT : 0} duration={SIGNAL_MS} /> : null}

        {!touched && phase === "flat" && demo.phase !== "aim" && demo.phase !== "press" ? <Ripple {...KEY} r={5} /> : null}
        <Press label={charged ? "Discharge the pack" : "Charge the pack"} onPress={press} data-hot={!charged}>
          <g>
            <Box
              {...KEY}
              r={5}
              top={
                <>
                  <text className="ik-label key" x={7} y={9.6}>
                    CHARGE
                  </text>
                  <path className="ik-detail ik-thick bolt" d="M3.4 0L0.4 4.4h3L2.4 8l3.4-4.8h-3L3.8 0z" transform={`translate(${KEY.w - 11} 3)`} />
                </>
              }
            />
          </g>
        </Press>

        <g className="plug" style={{ "--seat-x": `${SEAT_X}px`, "--seat-y": `${SEAT_Y}px` } as CSSProperties}>
          <Box
            {...PLUG}
            r={2}
            top={<path className="ik-detail" d={`M3 ${PLUG.d - 3}h${PLUG.w - 6}M3 ${PLUG.d - 5.5}h${PLUG.w - 6}`} />}
            front={<circle className="ik-detail" cx={PLUG.w / 2} cy={4.5} r={2} />}
          />
          <path className="ik-line" d={TAIL} />
        </g>
        <path className="ik-line" d={LEAD} />
        <Cursor at={[KEY.x + KEY.w / 2, KEY.y + KEY.d / 2, KEY.z + KEY.h]} phase={demo.phase} />
      </g>
    </Plate>
  )
}
