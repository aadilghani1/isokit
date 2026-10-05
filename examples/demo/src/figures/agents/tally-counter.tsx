import { useState } from "react"
import { Box, Plate, Press, playSound } from "react-isokit"
import type { FigureMeta } from "../../catalog/figure-meta"

const BODY = { x: 0, y: 0, z: 0, w: 64, d: 40, h: 50 }
const STEM = { x: 22, y: 10, z: 50, w: 20, d: 20, h: 10 }
const CAP = { x: 18, y: 6, z: 60, w: 28, d: 28, h: 4 }
const KNOB = { x: 64, y: 13, z: 28, w: 6, d: 12, h: 12 }

export function TallyCounter({ theme }: { theme: string }) {
  const [count, setCount] = useState(0)
  const digits = String(count % 10000).padStart(4, "0").split("")

  return (
    <Plate
      fig="Fig 6"
      name={theme}
      hint="Press the top"
      readout={`count ${digits.join("")}`}
      fit={[BODY, CAP, KNOB]}
      aspect={1.1}
      pad={0.14}
      label={`A tally counter in the ${theme} theme. Press the top to count; the side knob resets it.`}
    >
      <Box
        {...BODY}
        r={14}
        front={
          <>
            <rect className="ik-screen" x={8} y={10} width={48} height={18} rx={3} />
            {digits.map((d, i) => (
              <g key={`${i}-${d}`} className="ik-enter">
                <text className="ik-screen-text" x={14.5 + i * 12} y={23.5} fontSize={11}>
                  {d}
                </text>
              </g>
            ))}
            {[1, 2, 3].map((i) => (
              <path key={i} className="ik-detail" d={`M${8 + i * 12} 12v14`} />
            ))}
            <circle className="ik-well" cx={32} cy={39} r={4} />
          </>
        }
      />
      <Press label="Reset the count" onPress={() => { setCount(0); playSound("whoosh") }}>
        <g>
          <Box {...KNOB} r={3} />
        </g>
      </Press>
      <Press label="Count one more" onPress={() => setCount(count + 1)}>
        <g>
          <Box {...STEM} r={9} />
          <Box {...CAP} r={13} />
        </g>
      </Press>
    </Plate>
  )
}

export const meta = {
  slug: "tally-counter",
  title: "Tally counter",
  industry: "agents",
  level: 1,
  blurb: "Press the plunger and the count rolls on; the side knob resets it.",
  uses: ["Plate", "Box", "Press"],
  sounds: ["press", "whoosh"],
} satisfies FigureMeta

export default function TallyCounterFigure() {
  return <TallyCounter theme="Default" />
}
