import { useEffect, useId, useRef, useState } from "react"
import { Box, Cursor, front, Plate, Press, playSound, Ripple, useDemoTap } from "react-isokit"
import type { FigureMeta } from "../../catalog/figure-meta"
import "./parcel-locker.css"

export const meta = {
  slug: "parcel-locker",
  title: "Parcel locker",
  industry: "logistics",
  level: 1,
  blurb: "Press the code key: a pickup code goes in, one locker door swings open on its parcel and the last one shuts.",
  uses: ["Plate", "Box", "Press", "Ripple", "Cursor", "useDemoTap", "front"],
  sounds: ["press", "release", "toggle"],
} satisfies FigureMeta

type Row = { y: number; h: number }
type Locker = { n: number; x: number; row: Row; parcel: { w: number; d: number; h: number } }

const BASE = { x: 0, y: 0, z: 0, w: 184, d: 88, h: 8 }
const BANK = { x: 10, y: 10, z: BASE.h, w: 164, d: 34, h: 94 }
const FRONT_Y = BANK.y + BANK.d
const TOP_Z = BANK.z + BANK.h
const CANOPY = { x: 6, y: 6, z: TOP_Z, w: 172, d: 42, h: 7 }
const SHELF = { x: BANK.x + 62, y: FRONT_Y, z: TOP_Z - 52, w: 40, d: 16, h: 6 }
const BRACKET = { x: BANK.x + 66, y: FRONT_Y, z: SHELF.z - 8, w: 32, d: 8, h: 8 }
const KEY = { x: SHELF.x + 19, y: SHELF.y + 2.5, z: SHELF.z + SHELF.h, w: 18, d: 11, h: 3 }
const SCREEN = { x: 61, y: 6, w: 42, h: 22 }
const DOOR_W = 24
const COLUMNS = [5, 31, 109, 135] as const
const ROWS: readonly Row[] = [
  { y: 5, h: 14 },
  { y: 21, h: 14 },
  { y: 37, h: 22 },
  { y: 61, h: 28 },
]
const PARCELS = [
  { w: 13, d: 5, h: 6 },
  { w: 13, d: 5, h: 6 },
  { w: 11, d: 8, h: 10 },
  { w: 10, d: 9, h: 13 },
] as const
const LOCKERS: readonly Locker[] = COLUMNS.flatMap((x, col) =>
  ROWS.map((row, r) => ({ n: col * ROWS.length + r + 1, x, row, parcel: PARCELS[r] ?? PARCELS[0] })),
)
const PAINTED = [...LOCKERS].sort((a, b) => b.row.y - a.row.y || a.x - b.x)
const LOCKER_BY_NUMBER: ReadonlyMap<number, Locker> = new Map(LOCKERS.map((locker) => [locker.n, locker]))
const PICKUPS = [
  { n: 7, code: "4821" },
  { n: 12, code: "0396" },
  { n: 2, code: "7154" },
  { n: 14, code: "2608" },
  { n: 8, code: "5932" },
  { n: 15, code: "1470" },
] as const
const PICKUP_LOCKERS = PICKUPS.flatMap(({ n }) => LOCKER_BY_NUMBER.get(n) ?? [])
const KEYPAD = Array.from({ length: 12 }, (_, k) => ({ x: 3 + (k % 3) * 5.2, y: 2 + Math.floor(k / 3) * 3.4 }))

const hinge = (locker: Locker) => front(BANK.x + locker.x, FRONT_Y, TOP_Z - locker.row.y)
const parcelBox = (locker: Locker) => ({
  x: BANK.x + locker.x + 3,
  y: FRONT_Y - 1 - locker.parcel.d,
  z: TOP_Z - locker.row.y - locker.row.h + 0.5,
  ...locker.parcel,
})
const label = (n: number) => String(n).padStart(2, "0")

function Door({ locker, state }: { locker: Locker; state: "open" | "shut" | "closed" }) {
  const { h } = locker.row
  return (
    <g transform={hinge(locker)}>
      <g className="door" data-state={state}>
        <rect className="leaf" width={DOOR_W} height={h} rx={1} />
        <rect className="inside" width={DOOR_W} height={h} rx={1} />
        <rect className="outline" width={DOOR_W} height={h} rx={1} />
        <rect className="ik-detail" x={2} y={2} width={DOOR_W - 4} height={h - 4} rx={0.8} />
        <g className="mark">
          <text className="ik-label pl-number" x={3.6} y={6.6}>
            {label(locker.n)}
          </text>
          <rect className="ik-well" x={DOOR_W - 4.6} y={h / 2 - 3} width={1.6} height={6} rx={0.8} />
        </g>
      </g>
    </g>
  )
}

function Opening({ locker }: { locker: Locker }) {
  const { h } = locker.row
  const run = Math.min(h, DOOR_W)
  return (
    <g transform={hinge(locker)}>
      <rect className="ik-well" width={DOOR_W} height={h} rx={1} />
      <path className="ik-detail" d={`M0 ${h}l${run} ${-run}`} />
    </g>
  )
}

export default function ParcelLocker() {
  const [presses, setPresses] = useState(0)
  const stop = useRef(() => {})
  const clip = useId().replace(/:/g, "")
  useEffect(() => () => stop.current(), [])

  const demo = useDemoTap(() => setPresses((count) => count + 1), { delay: 500 })
  const press = () => {
    demo.dismiss()
    stop.current()
    stop.current = playSound("toggle")
    setPresses(presses + 1)
  }

  const pickup = presses > 0 ? PICKUPS[(presses - 1) % PICKUPS.length] : undefined
  const previous = presses > 1 ? PICKUPS[(presses - 2) % PICKUPS.length] : undefined
  const aiming = demo.phase === "aim" || demo.phase === "press"
  const stateOf = (n: number) => (n === pickup?.n ? "open" : n === previous?.n ? "shut" : "closed")

  return (
    <Plate
      {...demo.plate}
      fig="Logistics"
      name="Parcel locker"
      hint="Press the code key"
      readout={pickup ? `locker ${pickup.n} · open` : "ready · enter a code"}
      className="fig-parcel-locker"
      fit={[BASE, CANOPY]}
      aspect={1.2}
      label="A bank of sixteen parcel lockers with a screen and a keypad shelf. Press the code key to enter the next pickup code; that locker's door swings open on its parcel and the one before it shuts."
    >
      <g ref={demo.ref}>
        <Box {...BASE} r={10} top={[8, BASE.w - 8].map((x) => <circle key={x} className="ik-detail" cx={x} cy={BASE.d - 8} r={1.8} />)} />
        <Box
          {...BANK}
          r={3}
          front={
            <>
              <defs>
                <clipPath id={`${clip}-screen`}>
                  <rect x={SCREEN.x} y={SCREEN.y} width={SCREEN.w} height={SCREEN.h} rx={3} />
                </clipPath>
              </defs>
              <rect className="ik-screen" x={SCREEN.x} y={SCREEN.y} width={SCREEN.w} height={SCREEN.h} rx={3} />
              <g clipPath={`url(#${clip}-screen)`}>
                <g key={presses} className="ik-enter">
                  <text className="ik-screen-text ik-dim" x={SCREEN.x + 3.5} y={SCREEN.y + 7.5} fontSize={5.6}>
                    {pickup ? `code ${pickup.code}` : "enter code"}
                  </text>
                  <text className="ik-screen-text" x={SCREEN.x + 3.5} y={SCREEN.y + 17.5} fontSize={6.2}>
                    {pickup ? `locker ${label(pickup.n)}` : "- - - -"}
                  </text>
                </g>
              </g>
              <rect className="ik-well" x={70} y={32} width={24} height={6} rx={1.5} />
              <path className="ik-detail" d="M73 35h18" />
              <rect className="ik-well" x={68} y={72} width={28} height={3.4} rx={1.7} />
              <text className="ik-label pl-tag" x={82} y={81} textAnchor="middle">
                RETURNS
              </text>
              {Array.from({ length: 4 }, (_, k) => (
                <path key={k} className="ik-detail" d={`M68 ${84 + k * 2}h28`} />
              ))}
            </>
          }
          side={
            <>
              {Array.from({ length: 6 }, (_, k) => (
                <path key={k} className="ik-detail" d={`M${8 + k * 3.2} 12v20`} />
              ))}
              <rect className="ik-well" x={22} y={50} width={5} height={8} rx={1.2} />
              <circle className="ik-fill" cx={24.5} cy={53} r={0.9} />
            </>
          }
        />
        <Box
          {...CANOPY}
          r={4}
          top={<rect className="ik-detail" x={6} y={6} width={CANOPY.w - 12} height={CANOPY.d - 12} rx={3} />}
          front={
            <>
              <text className="ik-label pl-sign" x={10} y={5.2}>
                PARCELS
              </text>
              {[0, 1, 2].map((k) => (
                <circle key={k} className="ik-fill" cx={CANOPY.w - 12 - k * 5} cy={3.5} r={1.1} />
              ))}
            </>
          }
        />

        {PICKUP_LOCKERS.map((locker) => (
          <g key={locker.n}>
            <Opening locker={locker} />
            <Box {...parcelBox(locker)} r={1} top={<path className="ik-detail" d={`M${locker.parcel.w / 2} 0.6v${locker.parcel.d - 1.2}`} />} />
          </g>
        ))}
        {PAINTED.map((locker) => (
          <Door key={locker.n} locker={locker} state={stateOf(locker.n)} />
        ))}

        <Box {...BRACKET} r={2} front={<path className="ik-detail" d={`M4 3h${BRACKET.w - 8}`} />} />
        <Box
          {...SHELF}
          r={3}
          top={KEYPAD.map((cap) => (
            <rect key={`${cap.x}-${cap.y}`} className="ik-detail" x={cap.x} y={cap.y} width={4.2} height={2.5} rx={0.6} />
          ))}
          front={<path className="ik-detail" d={`M4 3h${SHELF.w - 8}`} />}
        />
        {presses || aiming ? null : <Ripple {...KEY} r={3} />}
        <Press label="Enter the next pickup code" onPress={press} data-hot={presses === 0}>
          <g>
            <Box
              {...KEY}
              r={3}
              top={
                <text className="ik-label pl-key" x={2.8} y={7.4}>
                  CODE
                </text>
              }
            />
          </g>
        </Press>
        <Cursor at={[KEY.x + KEY.w / 2, KEY.y + KEY.d / 2, KEY.z + KEY.h]} phase={demo.phase} />
      </g>
    </Plate>
  )
}
