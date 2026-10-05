import { type CSSProperties, useEffect, useReducer, useRef } from "react"
import { Box, Cursor, Flight, Plate, Press, playSound, project, Ripple, useDemoTap } from "react-isokit"
import type { FigureMeta } from "../../catalog/figure-meta"
import "./lab-analyzer.css"

export const meta = {
  slug: "lab-analyzer",
  title: "Lab analyser",
  industry: "health",
  level: 4,
  blurb: "Press load, then run: the arm carries each tube from the rack to the reader and the results fill the screen, one of them flagged.",
  uses: ["Plate", "Box", "Press", "Flight", "Ripple", "Cursor", "useDemoTap", "project"],
  sounds: ["cascade", "process", "done", "error", "complete", "whoosh"],
} satisfies FigureMeta

type Stage = "empty" | "loaded" | "running" | "done"
type State = { stage: Stage; read: number; trip: number; rack: number; back: boolean }
type Action = { type: "load" } | { type: "run" } | { type: "read" }

const BASE = { x: 0, y: 0, z: 0, w: 184, d: 126, h: 8 }
const CABINET = { x: 6, y: 6, z: 8, w: 172, d: 26, h: 88 }
const RAIL = { x: 14, y: CABINET.y + CABINET.d, z: 58, w: 156, d: 6, h: 8 }
const ROW_Y = 60
const RACK = { x: 20, y: ROW_Y - 8, z: 8, w: 54, d: 16, h: 14 }
const READER = { x: 104, y: ROW_Y - 12, z: 8, w: 60, d: 24, h: 14 }
const TUBES = [0, 1, 2, 3] as const
const RACK_X = TUBES.map((k) => RACK.x + 11 + k * 12)
const READER_X = TUBES.map((k) => READER.x + 12 + k * 12)
const SEAT_Z = RACK.z + RACK.h
const HOME_X = 88
const CARRIAGE = { x: HOME_X - 8, y: RAIL.y + 2, z: 54, w: 16, d: 32, h: 14 }
const ROD = { x: HOME_X - 1.5, y: ROW_Y - 1.5, z: 50, w: 3, d: 3, h: 4 }
const GRIPPER = { x: HOME_X - 5, y: ROW_Y - 3, z: 46, w: 10, d: 6, h: 4 }
const LOAD_KEY = { x: 26, y: 94, z: 8, w: 46, d: 20, h: 6 }
const RUN_KEY = { x: 82, y: 94, z: 8, w: 46, d: 20, h: 6 }
const SCREEN = { x: 40, y: 2, w: 104, h: 26 }
const COLUMN_W = 50
const ROW_H = 7.4
const STEP_MS = 1300
const TAKEOFF_MS = 520
const CARRY_MS = 546
const LAND_MS = TAKEOFF_MS + CARRY_MS
const READ_MS = 1150
const NORMAL = ["5.4", "6.1", "4.9", "5.8"] as const
const HIGH = "11.2"
const TRIPS = 4

const START: State = { stage: "empty", read: 0, trip: 0, rack: 0, back: false }

function advance(state: State, action: Action): State {
  switch (action.type) {
    case "load":
      return state.stage === "empty" || state.stage === "done" ? { ...state, stage: "loaded", read: 0, rack: (state.rack % 2) + 1, back: state.stage === "done" } : state
    case "run":
      return state.stage === "loaded" ? { ...state, stage: "running", read: 0, trip: (state.trip % TRIPS) + 1, back: false } : state
    case "read":
      if (state.stage !== "running") return state
      return state.read + 1 === TUBES.length ? { ...state, stage: "done", read: TUBES.length } : { ...state, read: state.read + 1 }
  }
}

const flaggedOf = (trip: number) => (trip + 1) % TUBES.length
const resultOf = (trip: number, k: number): string => (k === flaggedOf(trip) ? HIGH : (NORMAL[k] ?? HIGH))

function readoutOf(state: State): string {
  if (state.stage === "loaded") return "loaded · 4 tubes"
  if (state.stage === "running") return `running · ${state.read} of 4`
  if (state.stage === "done") return "4 of 4 · 1 flagged"
  return "idle · rack empty"
}

function headerOf(state: State): string {
  if (state.stage === "loaded") return "rack · 4 tubes"
  if (state.stage === "running") return `reading s${state.read + 1}`
  if (state.stage === "done") return "done · 1 flagged"
  return "no rack"
}

const px = (n: number) => `${Math.round(n * 1000) / 1000}px`

function moveVars(from: number, via: number, to: number): CSSProperties {
  const [a, b, c] = [from, via, to].map((x) => project(x - HOME_X, 0, 0))
  return { "--x0": px(a?.[0] ?? 0), "--y0": px(a?.[1] ?? 0), "--x1": px(b?.[0] ?? 0), "--y1": px(b?.[1] ?? 0), "--x2": px(c?.[0] ?? 0), "--y2": px(c?.[1] ?? 0) } as CSSProperties
}

function Tube({ cx }: { cx: number }) {
  return (
    <>
      <Box x={cx - 3} y={ROW_Y - 3} z={SEAT_Z} w={6} d={6} h={18} r={3} front={<rect className="ik-detail" x={1.4} y={4} width={3.2} height={8} rx={0.8} />} />
      <Box x={cx - 3.5} y={ROW_Y - 3.5} z={SEAT_Z + 18} w={7} d={7} h={4} r={3.5} top={<circle className="ik-fill" cx={3.5} cy={3.5} r={1.2} />} />
    </>
  )
}

function Result({ x, y, value, high }: { x: number; y: number; value: string; high: boolean }) {
  return (
    <>
      <text className="ik-screen-text" x={x} y={y} fontSize={7.6}>
        {value}
      </text>
      {high ? <path className="flag" d={`M${x + 19} ${y - 0.4}l2-3.8 2 3.8z`} /> : null}
    </>
  )
}

type Timers = { current: number[] }
type Stops = { current: Array<() => void> }

function release(timers: Timers, stops: Stops) {
  for (const timer of timers.current) window.clearTimeout(timer)
  for (const stop of stops.current) stop()
  timers.current = []
  stops.current = []
}

export default function LabAnalyzer() {
  const [state, dispatch] = useReducer(advance, START)
  const timers = useRef<number[]>([])
  const stops = useRef<Array<() => void>>([])
  useEffect(() => () => release(timers, stops), [])

  const { stage, read, trip, rack, back } = state
  const running = stage === "running"
  const done = stage === "done"
  const current = running ? read : -1
  const flagged = flaggedOf(trip)
  const later = (wait: number, step: () => void) => timers.current.push(window.setTimeout(step, wait))

  const load = (audible: boolean) => {
    release(timers, stops)
    if (audible) {
      if (done) stops.current.push(playSound("whoosh"))
      stops.current.push(playSound("cascade", { count: TUBES.length, stagger: 0.06, delay: 0.3 }))
    }
    dispatch({ type: "load" })
  }
  const run = () => {
    release(timers, stops)
    const next = (trip % TRIPS) + 1
    stops.current.push(playSound("process"))
    for (const k of TUBES) {
      later(k * STEP_MS + READ_MS, () => {
        for (const stop of stops.current) stop()
        stops.current = [playSound(k === flaggedOf(next) ? "error" : k === TUBES.length - 1 ? "complete" : "done")]
      })
      later((k + 1) * STEP_MS, () => dispatch({ type: "read" }))
    }
    dispatch({ type: "run" })
  }
  const demo = useDemoTap(() => {
    if (stage === "empty") load(false)
  }, { delay: 1700 })
  const pressLoad = () => {
    demo.dismiss()
    load(true)
  }
  const pressRun = () => {
    demo.dismiss()
    run()
  }

  const head = running
    ? { key: `go-${trip}-${read}`, className: "head go", style: moveVars(read === 0 ? HOME_X : (READER_X[read - 1] ?? HOME_X), RACK_X[read] ?? HOME_X, READER_X[read] ?? HOME_X) }
    : done
      ? { key: "parked", className: "head parked", style: moveVars(HOME_X, HOME_X, READER_X[TUBES.length - 1] ?? HOME_X) }
      : back
        ? { key: `back-${rack}`, className: "head back", style: moveVars(READER_X[TUBES.length - 1] ?? HOME_X, HOME_X, HOME_X) }
        : { key: "home", className: "head", style: undefined }

  return (
    <Plate
      {...demo.plate}
      fig="Health"
      name="Lab analyser"
      hint={stage === "loaded" ? "Press run" : done ? "Press load again" : running ? "Reading the rack" : "Press load"}
      readout={readoutOf(state)}
      className="fig-lab-analyzer"
      fit={[BASE, CABINET]}
      aspect={1.25}
      label="A lab analyser with a sample rack, a reader and an arm on a rail, under a results screen. Press load to fill the rack with four tubes, then run: the arm carries each tube to the reader and the results fill the screen, one of them flagged."
    >
      <g ref={demo.ref}>
        <Box {...BASE} r={12} top={<rect className="ik-detail" x={8} y={CABINET.y + CABINET.d + 6} width={BASE.w - 16} height={BASE.d - CABINET.y - CABINET.d - 14} rx={7} />} />
        <Box
          {...CABINET}
          r={6}
          top={
            <>
              <rect className="ik-detail" x={8} y={6} width={CABINET.w - 16} height={CABINET.d - 12} rx={3} />
              {Array.from({ length: 10 }, (_, k) => (
                <path key={k} className="ik-detail" d={`M${118 + k * 5} 10v8`} />
              ))}
            </>
          }
          front={
            <>
              <rect className="ik-screen" x={SCREEN.x} y={SCREEN.y} width={SCREEN.w} height={SCREEN.h} rx={3} />
              <g key={`head-${stage}-${read}`} className="ik-enter">
                <text className="ik-screen-text ik-dim" x={46} y={9.2} fontSize={5.8}>
                  {headerOf(state)}
                </text>
              </g>
              <text className="ik-screen-text ik-dim" x={118} y={9.2} fontSize={5.8}>
                mmol/l
              </text>
              <g key={`cells-${trip}-${rack}`}>
                {stage === "empty"
                  ? null
                  : TUBES.map((k) => {
                      const x = 46 + Math.floor(k / 2) * COLUMN_W
                      const y = 18.4 + (k % 2) * ROW_H
                      const shown = done || (running && k < read)
                      return (
                        <g key={k}>
                          <text className="ik-screen-text ik-dim" x={x} y={y} fontSize={5.8}>
                            {`s${k + 1}`}
                          </text>
                          {shown ? (
                            <Result x={x + 12} y={y} value={resultOf(trip, k)} high={k === flagged} />
                          ) : k === current ? (
                            <>
                              <g className="ik-dim">
                                <text className="ik-screen-text passing" x={x + 12} y={y} fontSize={7.6} style={{ "--off": `${READ_MS}ms` } as CSSProperties}>
                                  ···
                                </text>
                              </g>
                              <g className="ik-enter" style={{ animationDelay: `${READ_MS}ms` }}>
                                <Result x={x + 12} y={y} value={resultOf(trip, k)} high={k === flagged} />
                              </g>
                            </>
                          ) : (
                            <text className="ik-screen-text ik-dim" x={x + 12} y={y} fontSize={7.6}>
                              ···
                            </text>
                          )}
                        </g>
                      )
                    })}
              </g>
              {[0, 1, 2, 3, 4, 5].map((k) => (
                <path key={k} className="ik-detail" d={`M${10 + k * 3.4} 8v18`} />
              ))}
              <circle className="ik-fill" cx={160} cy={10} r={1.8} />
              <text className="ik-label tag" x={152} y={24}>
                CHEM
              </text>
              <path className="ik-detail" d={`M8 46h${CABINET.w - 16}`} />
            </>
          }
          side={
            <>
              {Array.from({ length: 6 }, (_, k) => (
                <path key={k} className="ik-detail" d={`M6 ${10 + k * 3.4}h16`} />
              ))}
              <rect className="ik-well" x={6} y={70} width={8} height={6} rx={1.2} />
            </>
          }
        />
        <Box {...RAIL} r={2} front={<path className="ik-detail" d={`M4 4h${RAIL.w - 8}`} />} />

        <Box
          {...RACK}
          r={3}
          top={RACK_X.map((cx) => (
            <circle key={cx} className="ik-well" cx={cx - RACK.x} cy={ROW_Y - RACK.y} r={3.6} />
          ))}
          front={
            <>
              <path className="ik-detail" d={`M4 3.5h${RACK.w - 8}`} />
              {RACK_X.map((cx) => (
                <path key={cx} className="ik-detail" d={`M${cx - RACK.x - 2} 7v4M${cx - RACK.x} 7v4M${cx - RACK.x + 1.5} 7v4`} />
              ))}
            </>
          }
        />
        <g key={`rack-${rack}`}>
          {stage === "empty"
            ? null
            : TUBES.map((k) => (
                <g
                  key={k}
                  className="tube"
                  data-on={stage === "loaded" || (running && k > current)}
                  style={{ "--t": `${k === current ? TAKEOFF_MS : 0}ms` } as CSSProperties}
                >
                  <g className="drop" style={{ "--i": k } as CSSProperties}>
                    <Tube cx={RACK_X[k] ?? 0} />
                  </g>
                </g>
              ))}
        </g>

        <Box
          {...READER}
          r={4}
          top={
            <>
              {READER_X.map((cx) => (
                <circle key={cx} className="ik-well" cx={cx - READER.x} cy={ROW_Y - READER.y} r={3.6} />
              ))}
              <path className="ik-detail" d={`M6 ${READER.d - 4}h${READER.w - 12}`} />
            </>
          }
          front={
            <>
              {READER_X.map((cx, k) => (
                <circle
                  key={cx}
                  className="lamp"
                  data-state={done || k < read || k === current ? (k === flagged ? "flag" : "ok") : "off"}
                  style={{ "--t": `${k === current ? READ_MS : 0}ms` } as CSSProperties}
                  cx={cx - READER.x}
                  cy={7}
                  r={2}
                />
              ))}
              <rect className="ik-well" x={3} y={10.5} width={5} height={2} rx={1} />
            </>
          }
          side={<path className="ik-detail" d="M4 4h16M4 7h16" />}
        />
        {TUBES.map((k) => (
          <g
            key={k}
            className="tube"
            data-on={done || (running && (k < read || k === current))}
            style={{ "--t": `${k === current ? LAND_MS : stage === "loaded" ? (TUBES.length - 1 - k) * 60 : 0}ms` } as CSSProperties}
          >
            <Tube cx={READER_X[k] ?? 0} />
          </g>
        ))}

        <g key={`flight-${trip}-${read}`}>
          {running ? (
            <Flight from={[RACK_X[read] ?? 0, ROW_Y, SEAT_Z]} to={[READER_X[read] ?? 0, ROW_Y, SEAT_Z]} delay={TAKEOFF_MS} duration={CARRY_MS} lift={8}>
              <Tube cx={RACK_X[read] ?? 0} />
            </Flight>
          ) : null}
        </g>

        <g key={head.key} className={head.className} style={head.style}>
          <g className={running ? "gripper go" : "gripper"}>
            <Box {...ROD} r={1.5} />
            <Box {...GRIPPER} r={1.5} front={<path className="ik-detail" d="M2 1v3M8 1v3" />} />
          </g>
          <Box
            {...CARRIAGE}
            r={3}
            top={
              <>
                <path className="ik-detail" d={`M4 5h${CARRIAGE.w - 8}`} />
                <circle className="ik-detail" cx={CARRIAGE.w / 2} cy={ROW_Y - CARRIAGE.y} r={2.4} />
              </>
            }
            front={<circle className="ik-fill" cx={CARRIAGE.w / 2} cy={5} r={1.4} />}
            side={<path className="ik-detail" d={`M4 4h${CARRIAGE.d - 8}`} />}
          />
        </g>

        {stage === "empty" && demo.phase !== "aim" && demo.phase !== "press" ? <Ripple {...LOAD_KEY} r={6} /> : null}
        <Press label={done ? "Load the next rack" : "Load the sample rack"} onPress={pressLoad} disabled={stage === "loaded" || running} data-hot={stage === "empty"}>
          <g>
            <Box
              {...LOAD_KEY}
              r={6}
              top={
                <>
                  <text className="ik-label key" x={8} y={12.6}>
                    LOAD
                  </text>
                  <path className="ik-detail ik-thick glyph" d="M0 0v7M-3 4l3 3 3-3" transform={`translate(${LOAD_KEY.w - 10} 6.5)`} />
                </>
              }
            />
          </g>
        </Press>
        <Press label="Run the analyser" onPress={pressRun} disabled={stage !== "loaded"} data-hot={stage === "loaded"}>
          <g>
            <Box
              {...RUN_KEY}
              r={6}
              top={
                <>
                  <text className="ik-label key" x={8} y={12.6}>
                    RUN
                  </text>
                  <path className="ik-detail ik-thick glyph" d="M0 0l5.4 3.4L0 6.8z" transform={`translate(${RUN_KEY.w - 13} 6.6)`} />
                </>
              }
            />
          </g>
        </Press>
        <Cursor at={[LOAD_KEY.x + LOAD_KEY.w / 2, LOAD_KEY.y + LOAD_KEY.d / 2, LOAD_KEY.z + LOAD_KEY.h]} phase={demo.phase} />
      </g>
    </Plate>
  )
}
