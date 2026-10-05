import { type CSSProperties, useEffect, useRef, useState } from "react"
import { Box, Cursor, curve, front, Plate, Press, path, playSound, project, Ripple, useDemoTap, type Vec3 } from "react-isokit"
import type { FigureMeta } from "../../catalog/figure-meta"
import "./wind-turbine.css"

export const meta = {
  slug: "wind-turbine",
  title: "Wind turbine",
  industry: "energy",
  level: 3,
  blurb: "Press start: the brake caliper lifts, the three blades ramp up to speed and the output bar fills step by step to 2.1 MW.",
  uses: ["Plate", "Box", "Press", "Ripple", "Cursor", "useDemoTap", "front", "project", "curve", "path"],
  sounds: ["press", "release", "cascade", "complete", "whoosh"],
} satisfies FigureMeta

type State = "parked" | "running" | "stopped"

const BASE = { x: 0, y: 0, z: 0, w: 162, d: 108, h: 8 }
const TX = 48
const TY = 52
const round = (half: number, z: number, h: number) => ({ x: TX - half, y: TY - half, z, w: 2 * half, d: 2 * half, h })
const FOOTING = round(17, BASE.h, 5)
const TOWER = [round(10, 13, 32), round(11, 45, 2), round(8.5, 47, 32), round(9.5, 79, 2), round(7, 81, 30)] as const
const NACELLE = { x: TX - 10, y: TY - 26, z: 111, w: 20, d: 44, h: 16 }
const MAST = { x: TX - 1, y: NACELLE.y + 5, z: NACELLE.z + NACELLE.h, w: 2, d: 2, h: 8 }
const VANE: readonly Vec3[] = [
  [TX - 4, MAST.y + 1, MAST.z + MAST.h],
  [TX + 4, MAST.y + 1, MAST.z + MAST.h],
]
const CUPS = VANE.map((point) => project(...point))
const HUB = { y: NACELLE.y + NACELLE.d + 5, z: NACELLE.z + NACELLE.h / 2 }
const DISC = { y: NACELLE.y + NACELLE.d + 1, r: 9.5 }
const CALIPER = { x: TX - 3.5, y: DISC.y - 2, z: HUB.z + DISC.r - 3.5, w: 7, d: 4, h: 6 }
const BLADE = 58
const SPAN = BLADE * 0.37
const BLADE_PATH = `M-2.6 -6.4C-4.2 -11 -5 -15 -4.4 -${SPAN}L-1.4 -${BLADE - 0.8}Q-0.4 -${BLADE + 0.6} 0.9 -${BLADE - 0.4}L3.4 -${SPAN}C3.8 -15 3.4 -10 2.6 -6.4Z`
const BLADE_ANGLES = [60, 180, 300] as const
const CABINET = { x: 96, y: 46, z: BASE.h, w: 58, d: 34, h: 44 }
const KEY = { x: 101, y: 52, z: CABINET.z + CABINET.h, w: 48, d: 20, h: 5 }
const SCREEN = { x: 5, y: 5, w: 48, h: 28 }
const CONDUIT = path(curve([TX + 14, TY + 8, BASE.h + 0.6], [TX + 30, TY + 18, BASE.h + 0.6], [86, 66, BASE.h + 0.6], [102, 64, BASE.h + 0.6], 24))
const STEPS = [0, 1, 2, 3, 4, 5] as const
const OUTPUT = ["0.4", "0.7", "1.1", "1.4", "1.8", "2.1"] as const
const FILL_AT = 600
const STEP_MS = 160
const LEAVE_MS = 60
const DONE_MS = FILL_AT + (STEPS.length - 1) * STEP_MS
const READOUTS: Readonly<Record<State, string>> = { parked: "parked · brake on", running: "12 m/s · 2.1 MW", stopped: "stopped · brake on" }
const NEXT: Readonly<Record<State, State>> = { parked: "running", running: "stopped", stopped: "running" }

const segOn = (k: number) => FILL_AT + k * STEP_MS

function Rotor({ move }: { move: "rest" | "start" | "stop" }) {
  return (
    <g className="wt-turn" data-move={move}>
      {BLADE_ANGLES.map((deg) => (
        <path key={deg} className="ik-face" d={BLADE_PATH} transform={`rotate(${deg})`} />
      ))}
      <circle className="ik-face ik-top" r={6.6} />
      <circle className="ik-detail" r={3} />
      {BLADE_ANGLES.map((deg) => (
        <circle key={deg} className="ik-fill" cx={0} cy={-4.8} r={0.7} transform={`rotate(${deg + 60})`} />
      ))}
    </g>
  )
}

export default function WindTurbine() {
  const [run, setRun] = useState<{ state: State; step: number }>({ state: "parked", step: 0 })
  const stops = useRef<Array<() => void>>([])
  const timer = useRef(0)
  useEffect(
    () => () => {
      window.clearTimeout(timer.current)
      for (const stop of stops.current) stop()
    },
    [],
  )

  const { state, step } = run
  const running = state === "running"
  const toggle = (audible: boolean) => {
    const next = NEXT[state]
    window.clearTimeout(timer.current)
    for (const stop of stops.current) stop()
    stops.current = []
    if (audible && next === "running") {
      stops.current.push(playSound("cascade", { count: STEPS.length, stagger: STEP_MS / 1000, delay: FILL_AT / 1000 }))
      timer.current = window.setTimeout(() => {
        stops.current.push(playSound("complete"))
      }, DONE_MS + 260)
    }
    if (audible && next === "stopped") stops.current.push(playSound("whoosh"))
    setRun({ state: next, step: step === 1 ? 2 : 1 })
  }
  const demo = useDemoTap(
    () => {
      if (state === "parked") toggle(false)
    },
    { delay: 1700 },
  )
  const press = () => {
    demo.dismiss()
    toggle(true)
  }

  return (
    <Plate
      {...demo.plate}
      fig="Energy"
      name="Wind turbine"
      hint={running ? "Press to stop" : "Press start"}
      readout={READOUTS[state]}
      className="fig-wind-turbine"
      data-run={running}
      fit={[BASE, { x: TX - BLADE - 2, y: HUB.y, z: HUB.z - BLADE - 2, w: 2 * BLADE + 4, d: 1, h: 2 * BLADE + 4 }, NACELLE, { ...MAST, h: MAST.h + 3 }]}
      aspect={1.05}
      label="A wind turbine: a tapered tower with a nacelle and three blades, and a control cabinet at its foot with a screen and a start key. Press start to release the brake; the blades ramp up and the output bar fills in steps to 2.1 megawatts. Press again to stop."
    >
      <g ref={demo.ref}>
        <Box
          {...BASE}
          r={12}
          top={
            <>
              <circle className="ik-dash" cx={TX} cy={TY} r={26} />
              {[
                [10, BASE.d - 10],
                [BASE.w - 10, 10],
                [BASE.w - 10, BASE.d - 10],
              ].map(([cx, cy]) => (
                <circle key={`${cx}-${cy}`} className="ik-fill" cx={cx} cy={cy} r={1.6} />
              ))}
            </>
          }
        />
        <path className="ik-line" d={CONDUIT} />
        <Box
          {...FOOTING}
          r={FOOTING.w / 2}
          top={Array.from({ length: 8 }, (_, k) => {
            const a = (k * Math.PI) / 4
            return <circle key={k} className="ik-fill" cx={17 + 14 * Math.cos(a)} cy={17 + 14 * Math.sin(a)} r={0.9} />
          })}
        />
        {TOWER.map((part, i) => (
          <Box
            key={part.z}
            {...part}
            r={part.w / 2}
            front={
              i === 0 ? (
                <>
                  <path className="ik-detail" d={`M${part.w / 2 - 4} ${part.h - 2}V${part.h - 13}a4 4 0 0 1 8 0V${part.h - 2}`} />
                  <circle className="ik-fill" cx={part.w / 2 + 2.4} cy={part.h - 7} r={0.6} />
                </>
              ) : null
            }
          />
        ))}
        <Box
          {...NACELLE}
          r={5}
          top={
            <>
              <rect className="ik-detail" x={4} y={10} width={NACELLE.w - 8} height={12} rx={2} />
              {Array.from({ length: 4 }, (_, k) => (
                <path key={k} className="ik-detail" d={`M5 ${26 + k * 3}h${NACELLE.w - 10}`} />
              ))}
            </>
          }
          side={
            <>
              {Array.from({ length: 5 }, (_, k) => (
                <path key={k} className="ik-detail" d={`M${18 + k * 3} 4v6`} />
              ))}
              <rect className="ik-detail" x={4} y={3} width={9} height={8} rx={1.5} />
            </>
          }
        />
        <Box {...MAST} r={1} />
        <path className="ik-line" d={path(VANE)} />
        {CUPS.map(([cx, cy]) => (
          <circle key={cx} className="ik-face ik-top" cx={cx} cy={cy} r={1.4} />
        ))}

        <g transform={front(TX, DISC.y, HUB.z)}>
          <circle className="ik-face" r={DISC.r} />
          <circle className="ik-detail" r={DISC.r - 2.4} />
        </g>
        <g className="wt-caliper">
          <Box {...CALIPER} r={1} front={<path className="ik-detail" d={`M1.4 1.6h${CALIPER.w - 2.8}`} />} />
        </g>
        <g transform={front(TX, HUB.y, HUB.z)}>
          <g className="wt-spin ik-loop">
            <Rotor key={step} move={step === 0 ? "rest" : running ? "start" : "stop"} />
          </g>
        </g>

        <Box
          {...CABINET}
          r={4}
          top={<path className="ik-detail" d={`M6 ${CABINET.d - 6}h${CABINET.w - 12}`} />}
          front={
            <>
              <rect className="ik-screen" x={SCREEN.x} y={SCREEN.y} width={SCREEN.w} height={SCREEN.h} rx={3} />
              <g key={`small-${step}`}>
                {running ? (
                  <>
                    <text className="ik-screen-text ik-dim wt-shown wt-passing" x={9} y={12.5} fontSize={5.6} style={{ "--on": "0ms", "--off": `${FILL_AT}ms` } as CSSProperties}>
                      brake off
                    </text>
                    <text className="ik-screen-text ik-dim wt-shown" x={9} y={12.5} fontSize={5.6} style={{ "--on": `${FILL_AT}ms` } as CSSProperties}>
                      wind 12 m/s
                    </text>
                  </>
                ) : (
                  <g className="ik-enter">
                    <text className="ik-screen-text ik-dim" x={9} y={12.5} fontSize={5.6}>
                      brake on
                    </text>
                  </g>
                )}
              </g>
              <g key={`big-${step}`}>
                {running ? (
                  [{ mw: "0.0", at: 0 }, ...OUTPUT.map((mw, k) => ({ mw, at: segOn(k) }))].map(({ mw, at }, k, all) => (
                    <text
                      key={mw}
                      className={k === all.length - 1 ? "ik-screen-text wt-shown" : "ik-screen-text wt-shown wt-passing"}
                      x={9}
                      y={22.5}
                      fontSize={8}
                      style={{ "--on": `${at}ms`, "--off": `${all[k + 1]?.at ?? DONE_MS}ms` } as CSSProperties}
                    >
                      {mw} MW
                    </text>
                  ))
                ) : (
                  <g className="ik-enter">
                    <text className="ik-screen-text" x={9} y={22.5} fontSize={8}>
                      0.0 MW
                    </text>
                  </g>
                )}
              </g>
              {STEPS.map((k) => (
                <rect
                  key={k}
                  className="wt-seg"
                  style={{ "--on": `${segOn(k)}ms`, "--off": `${(STEPS.length - 1 - k) * LEAVE_MS}ms` } as CSSProperties}
                  x={9 + k * 6.6}
                  y={25.4}
                  width={5.6}
                  height={4}
                  rx={0.8}
                />
              ))}
              <circle className="wt-lamp" style={{ "--t": `${DONE_MS}ms` } as CSSProperties} cx={9} cy={39} r={2} />
              <text className="ik-label wt-tag" x={13.5} y={41}>
                GRID
              </text>
              {Array.from({ length: 6 }, (_, k) => (
                <path key={k} className="ik-detail" d={`M${38 + k * 3.4} 36v7`} />
              ))}
            </>
          }
          side={
            <>
              {Array.from({ length: 6 }, (_, k) => (
                <path key={k} className="ik-detail" d={`M${8 + k * 3.4} 8v14`} />
              ))}
              <rect className="ik-well" x={26} y={30} width={3} height={8} rx={1.5} />
            </>
          }
        />

        {state === "parked" && demo.phase !== "aim" && demo.phase !== "press" ? <Ripple {...KEY} r={5} /> : null}
        <Press label={running ? "Stop the turbine" : "Start the turbine"} onPress={press} data-hot={!running}>
          <g>
            <Box
              {...KEY}
              r={5}
              top={
                <>
                  <text className="ik-label wt-key" x={7} y={12.6}>
                    {running ? "STOP" : "START"}
                  </text>
                  <path className="ik-detail ik-thick wt-play" d={running ? "M0 0h6v6H0z" : "M0 0l5.4 3.2L0 6.4z"} transform={`translate(${KEY.w - 13} 6.8)`} />
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
