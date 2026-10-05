import { type CSSProperties, useEffect, useId, useRef, useState } from "react"
import { Box, Cursor, Plate, Press, playSound, project, Ripple, useDemoTap } from "react-isokit"
import type { FigureMeta } from "../../catalog/figure-meta"
import "./quality-gauge.css"

export const meta = {
  slug: "quality-gauge",
  title: "Quality gauge",
  industry: "manufacturing",
  level: 2,
  blurb: "Press check: the next part slides along the gauge, drops through the go slot into pass or rides off the end into reject.",
  uses: ["Plate", "Box", "Press", "Ripple", "Cursor", "useDemoTap", "project"],
  sounds: ["press", "release", "process", "success", "error"],
} satisfies FigureMeta

type Run = { lot: number; n: number; passed: number; step: number }
type Part = { w: number; h: number }

const BASE = { x: 0, y: 0, z: 0, w: 164, d: 118, h: 8 }
const TRACK_Y = 55
const DECK = 54
const BIN = { y: 36, z: 8, w: 34, d: 40, h: 18 }
const PASS_BIN = { ...BIN, x: 71 }
const REJECT_BIN = { ...BIN, x: 118 }
const BIN_TOP = BIN.z + BIN.h
const POST = { x: 16, y: 36, z: 8, w: 10, d: 6, h: 96 }
const LEGS = [
  { x: 30, y: 50, z: 8, w: 8, d: 10, h: 42 },
  { x: 107, y: 50, z: 8, w: 8, d: 10, h: 38 },
] as const
const CHUTE = { x: 2, y: 44, z: 50, w: 70, d: 22, h: 4 }
const PUSHER = { x: 2, y: 50, z: DECK, w: 10, d: 10, h: 7 }
const PUSH_HEAD = { x: 12, y: 51.5, z: DECK + 1, w: 2.5, d: 7, h: 5 }
const GAUGE = { z: 46, h: 8 }
const SLOT = { x: 80, y: 49, w: 16, d: 12 }
const GAUGE_IN = { ...GAUGE, x: 72, y: 44, w: SLOT.x - 72, d: 22 }
const GAUGE_BACK = { ...GAUGE, x: SLOT.x, y: 44, w: SLOT.w, d: SLOT.y - 44 }
const GAUGE_FRONT = { ...GAUGE, x: SLOT.x, y: SLOT.y + SLOT.d, w: SLOT.w, d: 66 - SLOT.y - SLOT.d }
const GAUGE_OUT = { ...GAUGE, x: SLOT.x + SLOT.w, y: 44, w: 24, d: 22 }
const GAUGE_END = GAUGE_OUT.x + GAUGE_OUT.w
const CLAMP = { x: 17, y: 40, z: 90, w: 8, d: 10, h: 6 }
const TUBE = { x: 13, y: 47, z: 66, w: 18, d: 16, h: 38 }
const CONSOLE = { x: 8, y: 80, z: 8, w: 60, d: 28, h: 24 }
const KEY = { x: 98, y: 90, z: BASE.h, w: 46, d: 20, h: 5 }
const SCREEN = { x: 4, y: 4, w: 52, h: 16 }
const GOOD: Part = { w: 10, h: 8 }
const OVERSIZE: Part = { w: 15, h: 9 }
const START_X = TUBE.x + TUBE.w / 2
const SLOT_X = SLOT.x + SLOT.w / 2
const REJECT_X = REJECT_BIN.x + REJECT_BIN.w / 2
const RISE = TUBE.z - DECK
const DROP = DECK - BIN_TOP
const LAND_MS = 1000
const LOT_SIZE = 40
const START: Run = { lot: 3, n: 33, passed: 32, step: 0 }

const goes = (n: number) => n % 7 !== 0
const pct = (run: Run) => Math.round((run.passed / run.n) * 100)
const px = (n: number) => `${Math.round(n * 1000) / 1000}px`
const shift = (dx: number) => project(dx, 0, 0)
const GO_MID = shift(SLOT_X - START_X)
const REJECT_MID = shift(GAUGE_END - START_X)
const REJECT_END = shift(REJECT_X - START_X)
const RIDE_GO = { "--mx": px(GO_MID[0]), "--my": px(GO_MID[1]), "--rise": px(-RISE), "--drop": px(DROP) } as CSSProperties
const RIDE_REJECT = {
  "--mx": px(REJECT_MID[0]),
  "--my": px(REJECT_MID[1]),
  "--ex": px(REJECT_END[0]),
  "--ey": px(REJECT_END[1]),
  "--rise": px(-RISE),
  "--drop": px(DROP),
} as CSSProperties
const LANDING = { "--land": `${LAND_MS}ms` } as CSSProperties

function advance(run: Run): Run {
  const rolled = run.n >= LOT_SIZE
  const n = rolled ? 1 : run.n + 1
  return { lot: rolled ? (run.lot % 9) + 1 : run.lot, n, passed: (rolled ? 0 : run.passed) + (goes(n) ? 1 : 0), step: run.step + 1 }
}

function Bushing({ part, cx, z }: { part: Part; cx: number; z: number }) {
  return (
    <Box
      x={cx - part.w / 2}
      y={TRACK_Y - part.w / 2}
      z={z}
      w={part.w}
      d={part.w}
      h={part.h}
      r={part.w / 2}
      top={<circle className="ik-well" cx={part.w / 2} cy={part.w / 2} r={part.w * 0.24} />}
    />
  )
}

function Riding({ go }: { go: boolean }) {
  return (
    <g className={go ? "qg-go" : "qg-reject"} style={go ? RIDE_GO : RIDE_REJECT}>
      <g className="qg-fall">
        <Bushing part={go ? GOOD : OVERSIZE} cx={START_X} z={DECK} />
      </g>
    </g>
  )
}

function Resting({ go }: { go: boolean }) {
  return (
    <g className="qg-old">
      <Bushing part={go ? GOOD : OVERSIZE} cx={go ? SLOT_X : REJECT_X} z={BIN_TOP} />
    </g>
  )
}

function Tote({ bin, name, on, step, pile }: { bin: typeof PASS_BIN; name: string; on: boolean; step: number; pile: readonly (readonly [number, number])[] }) {
  return (
    <Box
      {...bin}
      r={4}
      top={
        <>
          <rect className="ik-well" x={3} y={3} width={bin.w - 6} height={bin.d - 6} rx={2.5} />
          {pile.map(([cx, cy]) => (
            <circle key={`${cx}-${cy}`} className="ik-fill" cx={cx} cy={cy} r={2.6} />
          ))}
        </>
      }
      front={
        <>
          <text className="ik-label qg-bin-name" x={4} y={13.4}>
            {name}
          </text>
          <circle key={step} className="qg-lamp" data-on={on} style={LANDING} cx={bin.w - 4.5} cy={4.4} r={1.8} />
        </>
      }
      side={<path className="ik-detail" d={`M5 4h${bin.d - 10}`} />}
    />
  )
}

const PASS_PILE = [
  [8, 9],
  [26, 8],
  [9, 30],
  [25, 31],
] as const
const REJECT_PILE = [[9, 30]] as const

export default function QualityGauge() {
  const [run, setRun] = useState<Run>(START)
  const stop = useRef(() => {})
  const timer = useRef(0)
  const clip = useId().replace(/:/g, "")
  useEffect(
    () => () => {
      window.clearTimeout(timer.current)
      stop.current()
    },
    [],
  )

  const check = (audible: boolean) => {
    const next = advance(run)
    const go = goes(next.n)
    window.clearTimeout(timer.current)
    stop.current()
    if (audible) {
      stop.current = playSound("process")
      timer.current = window.setTimeout(() => {
        stop.current()
        stop.current = playSound(go ? "success" : "error")
      }, LAND_MS)
    }
    setRun(next)
  }
  const demo = useDemoTap(
    () => {
      if (run.step === 0) check(false)
    },
    { delay: 1100 },
  )
  const press = () => {
    demo.dismiss()
    check(true)
  }

  const { step } = run
  const fresh = step === 0
  const go = goes(run.n)
  const previousGo = goes(run.n === 1 ? LOT_SIZE : run.n - 1)
  const settled = step > 1
  const aiming = demo.phase === "aim" || demo.phase === "press"
  const readout = fresh ? `lot ${run.lot} · ${run.n} checked` : `${pct(run)}% pass · lot ${run.lot} · #${run.n} ${go ? "go" : "no-go"}`

  return (
    <Plate
      {...demo.plate}
      fig="Manufacturing"
      name="Quality gauge"
      hint="Press check"
      readout={readout}
      className="fig-quality-gauge"
      fit={[BASE, { ...TUBE, z: 0, h: TUBE.z + TUBE.h }, { ...POST, z: 0, h: POST.z + POST.h }]}
      aspect={1.3}
      label="A go/no-go gauge over two bins, fed by a magazine of bushings and run from a console. Press check to push the next bushing along the gauge: a good one drops through the go slot into the pass bin, an oversize one rides off the end into reject."
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
        <Box {...POST} r={2} front={<path className="ik-detail" d={`M${POST.w / 2} 6v${POST.h - 50}`} />} />
        <Box {...LEGS[0]} r={2} />
        <Tote bin={PASS_BIN} name="PASS" on={!fresh && go} step={step} pile={PASS_PILE} />
        <Box {...LEGS[1]} r={2} />
        <Tote bin={REJECT_BIN} name="REJECT" on={!fresh && !go} step={step} pile={REJECT_PILE} />
        <Box {...CLAMP} r={1.5} />
        <Box
          {...CHUTE}
          r={2}
          top={<path className="ik-detail" d={`M14 ${TRACK_Y - 44 - 7}h${CHUTE.w - 14}M14 ${TRACK_Y - 44 + 7}h${CHUTE.w - 14}`} />}
        />
        <Box {...PUSHER} r={2} top={<path className="ik-detail" d="M3 5h4" />} />
        <g key={`jab-${step}`} className={fresh ? undefined : "qg-jab"}>
          <Box {...PUSH_HEAD} r={1} />
        </g>
        <Box {...GAUGE_IN} r={1.5} />
        <Box {...GAUGE_BACK} r={0.8} />

        {settled && previousGo ? <Resting key={`old-${step}`} go /> : null}
        {!fresh && go ? <Riding key={`new-${step}`} go /> : null}

        <Box
          {...GAUGE_FRONT}
          r={0.8}
          front={
            <text className="ik-label qg-mark" x={SLOT.w / 2} y={5.6} textAnchor="middle">
              GO
            </text>
          }
        />
        <Box
          {...GAUGE_OUT}
          r={1.5}
          top={<path className="ik-detail" d={`M${GAUGE_OUT.w - 5} 4v${GAUGE_OUT.d - 8}`} />}
          front={
            <text className="ik-label qg-mark" x={GAUGE_OUT.w / 2} y={5.6} textAnchor="middle">
              NO GO
            </text>
          }
          side={<path className="ik-detail" d="M4 4h14" />}
        />

        {settled && !previousGo ? <Resting key={`old-${step}`} go={false} /> : null}
        {!fresh && !go ? <Riding key={`new-${step}`} go={false} /> : null}

        <Box
          {...TUBE}
          r={TUBE.w / 2}
          front={
            <>
              <rect className="ik-well" x={TUBE.w / 2 - 3} y={5} width={6} height={TUBE.h - 10} rx={2} />
              {Array.from({ length: 6 }, (_, k) => (
                <path key={k} className="ik-detail" d={`M${TUBE.w / 2 - 3} ${9 + k * 4.4}h6`} />
              ))}
            </>
          }
        />

        <Box
          {...CONSOLE}
          r={5}
          front={
            <>
              <defs>
                <clipPath id={`${clip}-screen`}>
                  <rect x={SCREEN.x} y={SCREEN.y} width={SCREEN.w} height={SCREEN.h} rx={2.5} />
                </clipPath>
              </defs>
              <rect className="ik-screen" x={SCREEN.x} y={SCREEN.y} width={SCREEN.w} height={SCREEN.h} rx={2.5} />
              <g clipPath={`url(#${clip}-screen)`}>
                <g key={step} className="ik-enter" style={{ animationDelay: fresh ? "0ms" : `${LAND_MS}ms` }}>
                  <text className="ik-screen-text ik-dim" x={SCREEN.x + 4} y={SCREEN.y + 6} fontSize={5}>
                    {`lot ${run.lot} · #${run.n}`}
                  </text>
                  <text className="ik-screen-text" x={SCREEN.x + 4} y={SCREEN.y + 13.6} fontSize={7}>
                    {fresh ? "ready" : go ? "GO" : "NO-GO"}
                  </text>
                  <text className="ik-screen-text ik-dim" x={SCREEN.x + SCREEN.w - 4} y={SCREEN.y + 13.6} fontSize={6} textAnchor="end">
                    {`${pct(run)}%`}
                  </text>
                </g>
              </g>
            </>
          }
          side={Array.from({ length: 5 }, (_, k) => (
            <path key={k} className="ik-detail" d={`M${8 + k * 3.4} 7v12`} />
          ))}
        />
        {fresh && !aiming ? <Ripple {...KEY} r={5} /> : null}
        <Press label="Check the next part" onPress={press} data-hot={fresh}>
          <g>
            <Box
              {...KEY}
              r={5}
              top={
                <>
                  <text className="ik-label qg-key" x={7} y={12.4}>
                    CHECK
                  </text>
                  <path className="ik-detail ik-thick qg-tick" d="M0 3l2.6 2.6L8 0" transform={`translate(${KEY.w - 14} 7)`} />
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
