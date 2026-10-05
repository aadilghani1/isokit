import { type CSSProperties, useEffect, useRef, useState } from "react"
import { Box, Cursor, Plate, Press, playSound, Ripple, useDemoTap } from "react-isokit"
import type { FigureMeta } from "../../catalog/figure-meta"
import "./pill-sorter.css"

export const meta = {
  slug: "pill-sorter",
  title: "Pill sorter",
  industry: "health",
  level: 3,
  blurb: "Press fill: the dispenser drops each day's dose into its cell from Monday on and the screen counts the week up to 7 of 7.",
  uses: ["Plate", "Box", "Press", "Ripple", "Cursor", "useDemoTap"],
  sounds: ["cascade", "complete", "whoosh"],
} satisfies FigureMeta

type Fill = "empty" | "filled" | "emptied"

const BASE = { x: 0, y: 0, z: 0, w: 180, d: 124, h: 8 }
const TRAY = { x: 12, y: 50, z: 8, w: 144, d: 30, h: 10 }
const PITCH = 20
const CELL = { x: 3.5, y: 5, w: 17, d: 21 }
const LID = { y: TRAY.y + 1, z: TRAY.z + TRAY.h, w: 17, d: 2, h: 13 }
const DAYS = ["M", "T", "W", "T", "F", "S", "S"] as const
const CY = TRAY.y + CELL.y + CELL.d / 2
const cellX = (day: number) => TRAY.x + CELL.x + day * PITCH + CELL.w / 2
const POSTS = [
  { x: 2, y: 55, z: 8, w: 8, d: 10, h: 56 },
  { x: 166, y: 55, z: 8, w: 8, d: 10, h: 56 },
] as const
const HOPPER = { x: 0, y: 54, z: 64, w: 176, d: 20, h: 22 }
const BIN = { x: 48, y: 57, z: HOPPER.z + HOPPER.h, w: 72, d: 14, h: 8 }
const SPOUT = { z: 48, w: 6, h: 16 }
const KEY = { x: 112, y: 94, z: 8, w: 50, d: 20, h: 6 }
const SCREEN = { x: 46, y: 4, w: 82, h: 16 }
const STAGGER_MS = 60
const FALL_MS = 460
const landing = (day: number) => FALL_MS + day * STAGGER_MS
const FILLED_MS = landing(DAYS.length - 1)
const COUNT = Array.from({ length: DAYS.length + 1 }, (_, k) => ({ k, on: k === 0 ? 0 : landing(k - 1), off: k < DAYS.length ? landing(k) : FILLED_MS }))
const BIN_PILLS = [
  [9, 5, 0],
  [17, 8, 1],
  [26, 4.6, 0],
  [35, 8.4, 1],
  [44, 5, 0],
  [53, 8.2, 1],
  [61, 4.8, 0],
] as const

function Dose({ cx }: { cx: number }) {
  return (
    <>
      <Box x={cx + 0.5} y={CY - 7} z={TRAY.z + TRAY.h} w={5.6} d={5.6} h={2.2} r={2.8} top={<path className="ik-detail" d="M1.2 2.8h3.2" />} />
      <Box x={cx - 7.5} y={CY + 0.5} z={TRAY.z + TRAY.h} w={9} d={4.4} h={3} r={2.2} top={<path className="ik-detail" d="M4.5 0.8v2.8" />} />
    </>
  )
}

export default function PillSorter() {
  const [run, setRun] = useState<{ fill: Fill; step: number }>({ fill: "empty", step: 0 })
  const [touched, setTouched] = useState(false)
  const stop = useRef(() => {})
  const timer = useRef(0)
  useEffect(
    () => () => {
      window.clearTimeout(timer.current)
      stop.current()
    },
    [],
  )

  const { fill, step } = run
  const filled = fill === "filled"
  const toggle = (audible: boolean) => {
    window.clearTimeout(timer.current)
    stop.current()
    if (audible && !filled) {
      stop.current = playSound("cascade", { count: DAYS.length, stagger: STAGGER_MS / 1000, delay: FALL_MS / 1000 })
      timer.current = window.setTimeout(() => {
        stop.current = playSound("complete")
      }, FILLED_MS)
    }
    if (audible && filled) stop.current = playSound("whoosh")
    setRun({ fill: filled ? "emptied" : "filled", step: step + 1 })
  }
  const demo = useDemoTap(() => {
    if (fill === "empty") toggle(false)
  }, { delay: 1100 })
  const press = () => {
    demo.dismiss()
    setTouched(true)
    toggle(true)
  }

  const readout = filled ? "7 of 7 days · filled" : fill === "emptied" ? "0 of 7 days · emptied" : "0 of 7 days · empty"

  return (
    <Plate
      {...demo.plate}
      fig="Health"
      name="Pill sorter"
      hint={filled ? "Press to empty" : "Press fill"}
      readout={readout}
      className="fig-pill-sorter"
      data-filled={filled}
      fit={[BASE, HOPPER, BIN]}
      aspect={1.3}
      label="A seven-day pill sorter, Monday to Sunday, under a dispenser with a screen. Press fill to drop each day's dose into its cell from Monday on; press again to empty the week."
    >
      <g ref={demo.ref}>
        <Box {...BASE} r={12} top={<rect className="ik-detail" x={8} y={8} width={BASE.w - 16} height={BASE.d - 16} rx={7} />} />
        <Box {...POSTS[0]} r={2} side={<path className="ik-detail" d="M3 6h6M3 40h6" />} />
        <Box
          {...TRAY}
          r={5}
          top={DAYS.map((_, day) => (
            <rect
              key={day}
              className="ik-well cell"
              style={{ "--i": day } as CSSProperties}
              x={CELL.x + day * PITCH}
              y={CELL.y}
              width={CELL.w}
              height={CELL.d}
              rx={3}
            />
          ))}
          front={<path className="ik-detail" d={`M6 4h${TRAY.w - 12}`} />}
          side={<path className="ik-detail" d="M6 4h18" />}
        />
        {DAYS.map((letter, day) => (
          <Box
            key={day}
            x={TRAY.x + CELL.x + day * PITCH}
            {...LID}
            r={1}
            front={
              <text className="ik-label day" x={LID.w / 2} y={9.4} textAnchor="middle">
                {letter}
              </text>
            }
          />
        ))}
        {DAYS.map((_, day) => (
          <g key={day} className="dose" style={{ "--i": day, "--j": DAYS.length - 1 - day } as CSSProperties}>
            <Dose cx={cellX(day)} />
          </g>
        ))}
        {DAYS.map((_, day) => (
          <Box key={day} x={cellX(day) - SPOUT.w / 2} y={CY - SPOUT.w / 2} z={SPOUT.z} w={SPOUT.w} d={SPOUT.w} h={SPOUT.h} r={SPOUT.w / 2} />
        ))}
        <Box {...POSTS[1]} r={2} side={<path className="ik-detail" d="M3 6h6M3 40h6" />} />

        <Box
          {...HOPPER}
          r={4}
          top={<path className="ik-detail" d={`M6 ${HOPPER.d - 5}h${HOPPER.w - 12}`} />}
          front={
            <>
              <rect className="ik-screen" x={SCREEN.x} y={SCREEN.y} width={SCREEN.w} height={SCREEN.h} rx={3} />
              <g key={`small-${step}`} className="ik-enter">
                {filled ? (
                  <g className="ik-dim">
                    <text className="ik-screen-text shown passing" x={51} y={10} fontSize={5.2} style={{ "--on": "0ms", "--off": `${FILLED_MS}ms` } as CSSProperties}>
                      filling
                    </text>
                    <text className="ik-screen-text shown" x={51} y={10} fontSize={5.2} style={{ "--on": `${FILLED_MS}ms` } as CSSProperties}>
                      filled
                    </text>
                  </g>
                ) : (
                  <text className="ik-screen-text ik-dim" x={51} y={10} fontSize={5.2}>
                    {fill === "emptied" ? "emptied" : "empty"}
                  </text>
                )}
              </g>
              <g key={`count-${step}`}>
                {filled ? (
                  COUNT.map(({ k, on, off }) => (
                    <text
                      key={k}
                      className={k === DAYS.length ? "ik-screen-text shown" : "ik-screen-text shown passing"}
                      x={51}
                      y={17.4}
                      fontSize={7.4}
                      style={{ "--on": `${on}ms`, "--off": `${off}ms` } as CSSProperties}
                    >
                      {`${k} of 7`}
                    </text>
                  ))
                ) : (
                  <g className="ik-enter">
                    <text className="ik-screen-text" x={51} y={17.4} fontSize={7.4}>
                      0 of 7
                    </text>
                  </g>
                )}
              </g>
              {DAYS.map((_, day) => (
                <rect
                  key={day}
                  className="pip"
                  data-on={filled}
                  x={84 + day * 5.4}
                  y={12.6}
                  width={3.4}
                  height={4}
                  rx={0.8}
                  style={{ "--t": `${filled ? landing(day) : (DAYS.length - 1 - day) * STAGGER_MS}ms` } as CSSProperties}
                />
              ))}
              <circle className="lamp" cx={150} cy={11} r={2.4} />
              <text className="ik-label tag" x={156} y={13}>
                DONE
              </text>
              {[0, 1, 2, 3, 4].map((k) => (
                <path key={k} className="ik-detail" d={`M${8 + k * 3.4} 6v10`} />
              ))}
            </>
          }
          side={<path className="ik-detail" d="M5 5h14M5 8.5h14" />}
        />
        <Box
          {...BIN}
          r={3}
          top={
            <>
              <rect className="ik-well" x={3} y={2.5} width={BIN.w - 6} height={BIN.d - 5} rx={2} />
              {BIN_PILLS.map(([x, y, round]) =>
                round ? <circle key={x} className="ik-fill" cx={x} cy={y} r={1.8} /> : <rect key={x} className="ik-fill" x={x - 3} y={y - 1.4} width={6} height={2.8} rx={1.4} />,
              )}
            </>
          }
          front={<path className="ik-detail" d={`M4 3h${BIN.w - 8}`} />}
        />

        {!touched && fill === "empty" && demo.phase !== "aim" && demo.phase !== "press" ? <Ripple {...KEY} r={6} /> : null}
        <Press label={filled ? "Empty the week" : "Fill the week"} onPress={press} data-hot={!filled}>
          <g>
            <Box
              {...KEY}
              r={6}
              top={
                <>
                  <text className="ik-label key" x={8} y={12.6}>
                    {filled ? "EMPTY" : "FILL"}
                  </text>
                  <path
                    className="ik-detail ik-thick arrow"
                    d={filled ? "M0 7V0M-3 3l3-3 3 3" : "M0 0v7M-3 4l3 3 3-3"}
                    transform={`translate(${KEY.w - 10} 6.5)`}
                  />
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
