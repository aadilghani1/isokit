import { type CSSProperties, useEffect, useId, useRef, useState } from "react"
import { Box, Cursor, Plate, Press, playSound, Ripple, side, useDemoTap } from "react-isokit"
import type { FigureMeta } from "../../catalog/figure-meta"
import "./assembly-line.css"

export const meta = {
  slug: "assembly-line",
  title: "Assembly line",
  industry: "manufacturing",
  level: 3,
  blurb: "Press run: a truck chassis rides down the line and three stations lower in its battery, its body and its cab.",
  uses: ["Plate", "Box", "Press", "Ripple", "Cursor", "useDemoTap", "side"],
  sounds: ["press", "release", "cascade", "complete"],
} satisfies FigureMeta

type PartId = "battery" | "body" | "cab"
type Part = { id: PartId; x: number; y: number; z: number; w: number; d: number; h: number }
type Run = { unit: number; step: number }

const BASE = { x: 0, y: 0, z: 0, w: 204, d: 104, h: 8 }
const CONSOLE = { x: 8, y: 74, z: 8, w: 66, d: 22, h: 18 }
const SCREEN = { x: 4, y: 2.5, w: 58, h: 13 }
const BELT = { x: 6, y: 26, z: 8, w: 192, d: 36, h: 12 }
const CY = BELT.y + BELT.d / 2
const IN = 26
const DOCKS = [64, 102, 140] as const
const OUT = 178
const CHASSIS = { x: -9, y: -17, z: 25, w: 18, d: 34, h: 4 }
const WHEEL = { at: [7, 27] as const, cy: 4, r: 5 }
const PARTS: readonly Part[] = [
  { id: "battery", x: -7, y: -14, z: 29, w: 14, d: 28, h: 4 },
  { id: "body", x: -8, y: -16, z: 33, w: 16, d: 18, h: 16 },
  { id: "cab", x: -7, y: 4, z: 33, w: 14, d: 11, h: 12 },
]
const LIFT = 22
const COLUMN = { y: 12, z: 8, w: 10, d: 10, h: 86 }
const ARM = { y: 12, z: COLUMN.z + COLUMN.h, w: 12, d: 50, h: 8 }
const GRIP = { w: 12, d: 8, h: 5 }
const ROD = 4
const KEY = { x: 15, y: 76, z: CONSOLE.z + CONSOLE.h, w: 50, d: 14, h: 5 }
const FEED_MS = 200
const HOP_MS = 320
const DOWN_MS = 140
const WORK_MS = 380
const PITCH_MS = HOP_MS + WORK_MS
const arriveAt = (k: number) => FEED_MS + HOP_MS + k * PITCH_MS
const landAt = (k: number) => arriveAt(k) + DOWN_MS
const DONE_MS = arriveAt(DOCKS.length - 1) + WORK_MS + HOP_MS
const START: Run = { unit: 11, step: 0 }
const PROGRESS = [
  { text: "loading", on: 0, off: landAt(0) },
  { text: "station 1", on: landAt(0), off: landAt(1) },
  { text: "station 2", on: landAt(1), off: landAt(2) },
  { text: "station 3", on: landAt(2), off: DONE_MS },
] as const

const place = (part: Omit<Part, "id">, cx: number) => ({ x: cx + part.x, y: CY + part.y, z: part.z, w: part.w, d: part.d, h: part.h })
const ms = (n: number) => `${n}ms`

function Wheels() {
  return (
    <>
      {WHEEL.at.map((x) => (
        <g key={x}>
          <circle className="ik-face" cx={x} cy={WHEEL.cy} r={WHEEL.r} />
          <circle className="ik-detail" cx={x} cy={WHEEL.cy} r={1.8} />
        </g>
      ))}
    </>
  )
}

function Chassis({ cx }: { cx: number }) {
  const box = place(CHASSIS, cx)
  return (
    <>
      <g transform={side(box.x, box.y + box.d, box.z + box.h)}>
        <Wheels />
      </g>
      <Box {...box} r={1.5} front={<path className="ik-detail" d={`M3 2h${box.w - 6}`} />} side={<Wheels />} />
    </>
  )
}

function PartBox({ part, cx, z = part.z, built }: { part: Part; cx: number; z?: number; built?: string | undefined }) {
  const box = { ...place(part, cx), z }
  if (part.id === "battery") {
    return (
      <Box
        {...box}
        r={1.5}
        side={Array.from({ length: 6 }, (_, k) => (
          <path key={k} className="ik-detail" d={`M${3 + k * 4.4} 1v2`} />
        ))}
      />
    )
  }
  if (part.id === "body") {
    return (
      <Box
        {...box}
        r={1.5}
        top={<rect className="ik-detail" x={3} y={3} width={part.w - 6} height={part.d - 6} rx={1} />}
        side={Array.from({ length: 4 }, (_, k) => (
          <path key={k} className="ik-detail" d={`M${3.5 + k * 3.6} 3v${part.h - 6}`} />
        ))}
      />
    )
  }
  return (
    <Box
      {...box}
      r={2}
      top={<circle className="al-beacon" data-on={built !== undefined} style={built === undefined ? undefined : ({ "--t": built } as CSSProperties)} cx={part.w / 2} cy={part.d / 2} r={1.8} />}
      front={
        <>
          <rect className="ik-well" x={2} y={2} width={part.w - 4} height={4.6} rx={1} />
          <circle className="ik-fill" cx={3.4} cy={9} r={1.1} />
          <circle className="ik-fill" cx={part.w - 3.4} cy={9} r={1.1} />
        </>
      }
      side={<rect className="ik-well" x={2} y={2} width={5} height={4.6} rx={1} />}
    />
  )
}

function Truck({ cx }: { cx: number }) {
  return (
    <>
      <Chassis cx={cx} />
      {PARTS.map((part) => (
        <PartBox key={part.id} part={part} cx={cx} />
      ))}
    </>
  )
}

function Station({ k, part, running }: { k: number; part: Part; running: boolean }) {
  const x = DOCKS[k] ?? 0
  const at = place(part, x)
  const gripY = at.y + at.d / 2 - GRIP.d / 2
  const top = at.z + LIFT + at.h
  const timing = { "--t": ms(running ? arriveAt(k) : 0) } as CSSProperties
  return (
    <>
      <g className={running ? "al-dip" : undefined} style={timing}>
        <g className={running ? "al-held" : undefined} style={{ "--t": ms(landAt(k)) } as CSSProperties}>
          <PartBox part={part} cx={x} z={part.z + LIFT} />
        </g>
        <Box x={x - GRIP.w / 2} y={gripY} z={top} w={GRIP.w} d={GRIP.d} h={GRIP.h} r={1.5} front={<path className="ik-detail" d={`M3 2.5h${GRIP.w - 6}`} />} />
        <Box x={x - ROD / 2} y={gripY + GRIP.d / 2 - ROD / 2} z={top + GRIP.h} w={ROD} d={ROD} h={ARM.z - top - GRIP.h + LIFT + 2} r={ROD / 2} />
      </g>
      <Box
        x={x - ARM.w / 2}
        y={ARM.y}
        z={ARM.z}
        w={ARM.w}
        d={ARM.d}
        h={ARM.h}
        r={2}
        top={<path className="ik-detail" d={`M${ARM.w / 2} 14v${ARM.d - 20}`} />}
        side={<path className="ik-detail" d={`M4 3h${ARM.d - 8}`} />}
      />
    </>
  )
}

function Column({ k, running }: { k: number; running: boolean }) {
  const x = DOCKS[k] ?? 0
  return (
    <Box
      x={x - COLUMN.w / 2}
      y={COLUMN.y}
      z={COLUMN.z}
      w={COLUMN.w}
      d={COLUMN.d}
      h={COLUMN.h}
      r={2}
      front={
        <>
          <circle className="al-lamp" data-run={running} style={{ "--t": ms(arriveAt(k)) } as CSSProperties} cx={COLUMN.w / 2} cy={6} r={2} />
          <text className="ik-label al-tag" x={COLUMN.w / 2} y={16} textAnchor="middle">
            {k + 1}
          </text>
        </>
      }
    />
  )
}

export default function AssemblyLine() {
  const [run, setRun] = useState<Run>(START)
  const [built, setBuilt] = useState(true)
  const stops = useRef<Array<() => void>>([])
  const timer = useRef(0)
  const clip = useId().replace(/:/g, "")
  useEffect(
    () => () => {
      window.clearTimeout(timer.current)
      for (const stop of stops.current) stop()
    },
    [],
  )

  const start = (audible: boolean) => {
    window.clearTimeout(timer.current)
    for (const stop of stops.current) stop()
    stops.current = []
    if (audible) stops.current.push(playSound("cascade", { count: DOCKS.length, stagger: PITCH_MS / 1000, delay: landAt(0) / 1000 }))
    timer.current = window.setTimeout(() => {
      setBuilt(true)
      if (audible) stops.current.push(playSound("complete"))
    }, DONE_MS)
    setRun({ unit: run.unit >= 99 ? 1 : run.unit + 1, step: run.step + 1 })
    setBuilt(false)
  }
  const demo = useDemoTap(
    () => {
      if (run.step === 0) start(false)
    },
    { delay: 1700 },
  )
  const press = () => {
    demo.dismiss()
    start(true)
  }

  const { unit, step } = run
  const running = step > 0
  const aiming = demo.phase === "aim" || demo.phase === "press"
  const readout = !running ? `ready · unit ${unit} built` : built ? `3 of 3 stations · unit ${unit} built` : `running · unit ${unit}`

  return (
    <Plate
      {...demo.plate}
      fig="Manufacturing"
      name="Assembly line"
      hint="Press run"
      readout={readout}
      className="fig-assembly-line"
      fit={[BASE, { x: DOCKS[0] - ARM.w / 2, y: ARM.y, z: 0, w: DOCKS[2] - DOCKS[0] + ARM.w, d: ARM.d, h: ARM.z + ARM.h }, { ...CONSOLE, z: 0, h: KEY.z + KEY.h }]}
      aspect={1.35}
      label="A short assembly line: a conveyor with three stations and a console with a line screen and a run key. Press run to send a truck chassis down the line; the first station lowers in the battery, the second the body and the third the cab."
    >
      <g ref={demo.ref}>
        <Box
          {...BASE}
          r={10}
          top={[
            [6, 6],
            [BASE.w - 6, BASE.d - 6],
          ].map(([cx, cy]) => (
            <circle key={`${cx}-${cy}`} className="ik-fill" cx={cx} cy={cy} r={1.6} />
          ))}
        />
        <Box
          {...CONSOLE}
          r={4}
          front={
            <>
              <defs>
                <clipPath id={`${clip}-screen`}>
                  <rect x={SCREEN.x} y={SCREEN.y} width={SCREEN.w} height={SCREEN.h} rx={2.5} />
                </clipPath>
              </defs>
              <rect className="ik-screen" x={SCREEN.x} y={SCREEN.y} width={SCREEN.w} height={SCREEN.h} rx={2.5} />
              <g clipPath={`url(#${clip}-screen)`}>
                <g key={`line-${step}`}>
                  {running ? (
                    <>
                      {PROGRESS.map((row) => (
                        <text key={row.text} className="ik-screen-text ik-dim al-window" x={SCREEN.x + 4} y={SCREEN.y + 5.6} fontSize={4.6} style={{ "--on": ms(row.on), "--span": ms(row.off - row.on) } as CSSProperties}>
                          {row.text}
                        </text>
                      ))}
                      <text className="ik-screen-text ik-dim al-shown" x={SCREEN.x + 4} y={SCREEN.y + 5.6} fontSize={4.6} style={{ "--on": ms(DONE_MS) } as CSSProperties}>
                        built
                      </text>
                    </>
                  ) : (
                    <text className="ik-screen-text ik-dim" x={SCREEN.x + 4} y={SCREEN.y + 5.6} fontSize={4.6}>
                      ready
                    </text>
                  )}
                  <g className="ik-enter">
                    <text className="ik-screen-text" x={SCREEN.x + 4} y={SCREEN.y + 11.6} fontSize={6.4}>
                      {`unit ${unit}`}
                    </text>
                  </g>
                  {DOCKS.map((dock, k) => (
                    <rect
                      key={dock}
                      className="al-pip"
                      data-on={running}
                      style={{ "--t": ms(landAt(k)) } as CSSProperties}
                      x={SCREEN.x + 44.5 + k * 4}
                      y={SCREEN.y + 2.6}
                      width={2.6}
                      height={2.6}
                      rx={0.6}
                    />
                  ))}
                </g>
              </g>
            </>
          }
          side={Array.from({ length: 5 }, (_, k) => (
            <path key={k} className="ik-detail" d={`M4 ${4 + k * 2.6}h${CONSOLE.d - 8}`} />
          ))}
        />
        {DOCKS.map((dock, k) => (
          <Column key={`${dock}-${step}`} k={k} running={running} />
        ))}
        <Box
          {...BELT}
          r={4}
          top={
            <>
              <path className="ik-detail" d={`M4 4h${BELT.w - 8}M4 ${BELT.d - 4}h${BELT.w - 8}`} />
              {Array.from({ length: 23 }, (_, k) => (
                <path key={k} className="ik-detail" d={`M${8 + k * 8} 6v${BELT.d - 12}`} />
              ))}
            </>
          }
          front={Array.from({ length: 16 }, (_, k) => (
            <circle key={k} className="ik-detail" cx={8 + k * 11.8} cy={6} r={2.4} />
          ))}
          side={<path className="ik-detail" d={`M4 6h${BELT.d - 8}`} />}
        />

        <g key={`out-${step}`} className={running ? "al-exit" : undefined}>
          <Truck cx={OUT} />
        </g>
        <g key={`ride-${step}`} className={running ? "al-ride" : undefined}>
          <Chassis cx={IN} />
          {running
            ? PARTS.map((part, k) => (
                <g key={part.id} className="al-mounted" style={{ "--t": ms(landAt(k)) } as CSSProperties}>
                  <PartBox part={part} cx={IN} built={part.id === "cab" ? ms(DONE_MS) : undefined} />
                </g>
              ))
            : null}
        </g>

        {PARTS.map((part, k) => (
          <Station key={`${part.id}-${step}`} k={k} part={part} running={running} />
        ))}

        {!running && !aiming ? <Ripple {...KEY} r={6} /> : null}
        <Press label="Run the line" onPress={press} data-hot={!running}>
          <g>
            <Box
              {...KEY}
              r={6}
              top={
                <>
                  <text className="ik-label al-key" x={9} y={10}>
                    RUN
                  </text>
                  <path className="ik-detail ik-thick al-play" d="M0 0l5.2 3.4L0 6.8z" transform={`translate(${KEY.w - 15} 3.6)`} />
                </>
              }
            />
          </g>
        </Press>
        <Cursor at={[KEY.x + KEY.w / 2, KEY.y + KEY.d / 2, KEY.z + KEY.h]} phase={demo.phase} />
      </g>
    </Plate>
  )
}
