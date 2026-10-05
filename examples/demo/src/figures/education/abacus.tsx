import { type CSSProperties, useState } from "react"
import { Box, Cursor, Plate, Press, path, Ripple, useDemoTap } from "react-isokit"
import type { FigureMeta } from "../../catalog/figure-meta"
import "./abacus.css"

export const meta = {
  slug: "abacus",
  title: "Abacus",
  industry: "education",
  level: 1,
  blurb: "Press a bead: it slides across its rod, and the slate below writes the sum, 3 + 4 = 7.",
  uses: ["Plate", "Box", "Press", "Ripple", "Cursor", "useDemoTap", "path"],
  sounds: ["press", "release"],
} satisfies FigureMeta

type Rod = { name: string; z: number }
type Tally = { counts: readonly [number, number]; last: { rod: number; bead: number; from: number } | null }

const BASE = { x: 0, y: 0, z: 0, w: 174, d: 46, h: 10 }
const POST = { y: 16, z: BASE.h, w: 8, d: 12, h: 76 }
const LEFT_POST_X = 6
const RIGHT_POST_X = 160
const CAP = { z: POST.z + POST.h, w: 12, d: 16, h: 3 }
const BOARD = { x: LEFT_POST_X + POST.w, y: 20, z: BASE.h, w: RIGHT_POST_X - LEFT_POST_X - POST.w, d: 4, h: 28 }
const CHALK = { x: 26, y: 36.4, z: BASE.h, w: 16, d: 3.4, h: 3.4 }
const ROD_Y = POST.y + POST.d / 2
const TOP_ROD: Rod = { name: "top", z: 75 }
const BOTTOM_ROD: Rod = { name: "bottom", z: 51.5 }
const RODS: readonly Rod[] = [TOP_ROD, BOTTOM_ROD]
const PAINT_ORDER = [1, 0] as const
const BEAD = { w: 9.6, d: 9.6, h: 10 }
const PITCH = 10
const BEADS = Array.from({ length: 10 }, (_, j) => j)
const INNER_LEFT = LEFT_POST_X + POST.w
const INNER_RIGHT = RIGHT_POST_X
const REST_X = INNER_RIGHT - 12 - (BEADS.length - 1) * PITCH - BEAD.w
const TRAVEL = REST_X - INNER_LEFT - 0.6
const ACROSS = `translate(${(-TRAVEL * Math.cos(Math.PI / 6)).toFixed(3)}px, ${(-TRAVEL * Math.sin(Math.PI / 6)).toFixed(3)}px)`
const STAGGER_MS = 40
const START: Tally = { counts: [3, 0], last: null }
const SLATE = { x: 8, y: 4.5, w: BOARD.w - 16, h: 19 }

const beadBox = (rod: Rod, j: number) => ({ x: REST_X + j * PITCH, y: ROD_Y - BEAD.d / 2, z: rod.z - BEAD.h / 2, ...BEAD })
const FIRST = beadBox(BOTTOM_ROD, 0)
const HALO = { x: FIRST.x - 3, y: FIRST.y - 3, z: FIRST.z + FIRST.h, w: FIRST.w + 6, d: FIRST.d + 6 }

function delayOf(tally: Tally, rod: number, j: number): number {
  const last = tally.last
  if (!last || last.rod !== rod) return 0
  const to = tally.counts[rod] ?? 0
  if (to > last.from) return Math.max(0, j - last.from) * STAGGER_MS
  return Math.max(0, last.from - 1 - j) * STAGGER_MS
}

export default function Abacus() {
  const [tally, setTally] = useState<Tally>(START)
  const slide = (rod: number, j: number) => {
    const from = tally.counts[rod] ?? 0
    const to = j >= from ? j + 1 : j
    const counts: readonly [number, number] = rod === 0 ? [to, tally.counts[1]] : [tally.counts[0], to]
    setTally({ counts, last: { rod, bead: j, from } })
  }
  const demo = useDemoTap(
    () => {
      if (!tally.last) slide(1, 0)
    },
    { delay: 500 },
  )
  const press = (rod: number, j: number) => {
    demo.dismiss()
    slide(rod, j)
  }

  const [a, b] = tally.counts
  const sum = `${a} + ${b} = ${a + b}`
  const aiming = demo.phase === "aim" || demo.phase === "press"

  return (
    <Plate
      {...demo.plate}
      fig="Education"
      name="Abacus"
      hint="Press a bead"
      readout={sum}
      className="fig-abacus"
      fit={[BASE, { x: LEFT_POST_X - 2, y: POST.y - 2, z: 0, w: RIGHT_POST_X + POST.w - LEFT_POST_X + 4, d: CAP.d, h: CAP.z + CAP.h }]}
      aspect={1.3}
      label="A classroom abacus with two rods of ten beads above a slate. Press a bead to slide it across its rod; the slate writes the sum of the two rods, as in 3 + 4 = 7."
    >
      <g ref={demo.ref}>
        <Box
          {...BASE}
          r={8}
          top={
            <>
              <rect className="ik-well" x={14} y={34} width={BASE.w - 28} height={7} rx={3.5} />
              <circle className="ik-detail" cx={7} cy={7} r={1.8} />
              <circle className="ik-detail" cx={BASE.w - 7} cy={7} r={1.8} />
            </>
          }
          front={<path className="ik-detail" d={`M10 4h${BASE.w - 20}`} />}
        />
        <Box {...CHALK} r={1.7} top={<path className="ik-detail" d="M12 0.6v2.2" />} />
        <Post x={LEFT_POST_X} holes />
        <Box
          {...BOARD}
          r={1}
          front={
            <>
              <rect className="ik-screen" x={SLATE.x} y={SLATE.y} width={SLATE.w} height={SLATE.h} rx={3} />
              <g key={sum} className="ik-enter">
                <text className="ik-screen-text ab-sum" x={SLATE.x + SLATE.w / 2} y={SLATE.y + 13.2} fontSize={10} textAnchor="middle">
                  {sum}
                </text>
              </g>
              <path className="ik-detail" d={`M${SLATE.x + 4} ${SLATE.y + SLATE.h + 2.5}h${SLATE.w - 8}`} />
            </>
          }
        />

        {PAINT_ORDER.map((rod) => {
          const wire = RODS[rod] ?? TOP_ROD
          const count = tally.counts[rod] ?? 0
          return (
            <g key={wire.name}>
              <path className="ik-line ik-thick" d={path([[INNER_LEFT, ROD_Y, wire.z], [INNER_RIGHT, ROD_Y, wire.z]])} />
              {BEADS.map((j) => {
                const across = j < count
                const hot = tally.last ? tally.last.rod === rod && tally.last.bead === j : rod === 1 && j === 0
                return (
                  <g key={j} className="ab-slide" style={{ transform: across ? ACROSS : undefined, "--delay": `${delayOf(tally, rod, j)}ms` } as CSSProperties}>
                    {rod === 1 && j === 0 && !tally.last && !aiming ? <Ripple {...HALO} r={HALO.w / 2} /> : null}
                    <Press label={`Slide bead ${j + 1} on the ${wire.name} rod ${across ? "back" : "across"}`} onPress={() => press(rod, j)} data-hot={hot}>
                      <g>
                        <Box
                          {...beadBox(wire, j)}
                          r={BEAD.w / 2}
                          className={j >= 5 ? "ab-bead ab-dark" : "ab-bead"}
                          front={<path className="ik-detail" d={`M1.6 ${BEAD.h / 2}h${BEAD.w - 3.2}`} />}
                        />
                      </g>
                    </Press>
                  </g>
                )
              })}
            </g>
          )
        })}

        <Post x={RIGHT_POST_X} holes={false} />
        <Cursor at={[FIRST.x + FIRST.w / 2, FIRST.y + FIRST.d / 2, FIRST.z + FIRST.h]} phase={demo.phase} />
      </g>
    </Plate>
  )
}

function Post({ x, holes }: { x: number; holes: boolean }) {
  return (
    <>
      <Box
        {...POST}
        x={x}
        r={3}
        side={holes ? RODS.map((rod) => <circle key={rod.name} className="ik-well" cx={POST.y + POST.d - ROD_Y} cy={POST.z + POST.h - rod.z} r={2.2} />) : null}
        front={<path className="ik-detail" d={`M${POST.w / 2} 8v${POST.h - 16}`} />}
      />
      <Box x={x - 2} y={POST.y - 2} z={CAP.z} w={CAP.w} d={CAP.d} h={CAP.h} r={4} />
    </>
  )
}
