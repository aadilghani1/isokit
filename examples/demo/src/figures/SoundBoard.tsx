import { useEffect, useRef, useState } from "react"
import { Box, Plate, Press, playSound, type SoundName, useSoundEnabled } from "react-isokit"
import "./SoundBoard.css"
import type { FigureMeta } from "../site/registry"

/**
 * Fig 5, a sound board: every sound isokit can make, one pad each, in three
 * staggered rows. Press a pad to hear it; it stays lit while it plays.
 */

const ROWS: ReadonlyArray<readonly SoundName[]> = [
  ["press", "release", "toggle", "boot", "success"],
  ["error", "notify", "complete", "cascade"],
  ["whoosh", "paper", "process", "done"],
]
const BASE = { x: 0, y: 0, z: 0, w: 224, d: 116, h: 10 }
const PAD = { w: 36, d: 28, h: 5 }
const LENGTH: Record<SoundName, number> = { press: 0.1, release: 0.1, toggle: 0.1, boot: 1.4, success: 0.6, error: 0.35, notify: 0.3, complete: 0.7, cascade: 1, whoosh: 0.4, paper: 0.2, process: 0.6, done: 0.4 }
const PADS = ROWS.flatMap((row, r) => row.map((name, c) => ({ name, x: 10 + r * 21 + c * 42, y: 10 + r * 34 })))

export function SoundBoard() {
  const [lit, setLit] = useState<SoundName | null>(null)
  const [last, setLast] = useState<SoundName | null>(null)
  const [on] = useSoundEnabled()
  const timer = useRef(0)
  useEffect(() => () => window.clearTimeout(timer.current), [])
  const play = (name: SoundName) => {
    playSound(name)
    setLit(name)
    setLast(name)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setLit(null), LENGTH[name] * 1000)
  }

  return (
    <Plate
      fig="Fig 5"
      name="Sound board"
      hint={on ? "Press a pad" : "Sound is off · switch it on"}
      readout={last ? `${last} · ${LENGTH[last]}s` : "13 sounds"}
      className="board"
      fit={[BASE, { ...BASE, h: BASE.h + PAD.h }]}
      aspect={1.4}
      label="A sound board with a pad for each of isokit's thirteen interaction sounds. Press a pad to hear it."
    >
      <Box {...BASE} r={10} front={<path className="ik-detail" d={`M8 ${BASE.h / 2}h${BASE.w - 16}`} />} />
      {PADS.map((p) => (
        <Press key={p.name} label={`Play ${p.name}`} onPress={() => play(p.name)} sound={false} data-hot={lit === p.name}>
          <g>
            <Box
              x={p.x}
              y={p.y}
              z={BASE.h}
              {...PAD}
              r={5}
              top={
                <>
                  <circle className={lit === p.name ? "ik-dot" : "ik-fill"} cx={6} cy={6} r={1.6} />
                  <text className="ik-label" x={5} y={22}>
                    {p.name}
                  </text>
                </>
              }
            />
          </g>
        </Press>
      ))}
    </Plate>
  )
}

export const meta: FigureMeta = {
  slug: "sound-board",
  title: "Sound board",
  category: "agents",
  blurb: "Every sound the kit can make, one pad each: press a pad to hear it.",
  uses: ["Plate", "Box", "Press", "playSound"],
  sounds: ["press", "release", "toggle", "boot", "success", "error", "notify", "complete", "cascade", "whoosh", "paper", "process", "done"],
}

export default SoundBoard
