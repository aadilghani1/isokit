import { type CSSProperties, useEffect, useRef, useState } from "react"
import { Box, Plate, Press, path, playSound } from "react-isokit"
import "./PagePress.css"
import type { FigureMeta } from "../site/registry"

/**
 * Fig 3, a page press: a webpage taken apart into blocks that hover over the
 * page they belong to. Press publish and they drop into place, lowest first,
 * each one clicking home, and the address goes live.
 */

const BASE = { x: 0, y: 0, z: 0, w: 168, d: 150, h: 10 }
const KEY = { x: 98, y: 124, z: 10, w: 60, d: 19, h: 6 }
const Z = BASE.h
const T = 3
type Part = { x: number; y: number; w: number; d: number }
type Block = { name: "nav" | "hero" | "cards" | "footer"; lift: number; parts: readonly Part[] }
/** Back to front; `lift` is how high each block floats while it is still a draft. */
const BLOCKS: readonly Block[] = [
  { name: "nav", lift: 62, parts: [{ x: 17, y: 23, w: 134, d: 8 }] },
  { name: "hero", lift: 44, parts: [{ x: 17, y: 35, w: 134, d: 32 }] },
  { name: "cards", lift: 27, parts: [{ x: 17, y: 71, w: 65, d: 26 }, { x: 86, y: 71, w: 65, d: 26 }] },
  { name: "footer", lift: 12, parts: [{ x: 17, y: 101, w: 134, d: 9 }] },
]
const ARROW = "M0 8L8 0M2.5 0H8V5.5"

function Marks({ block, part, i }: { block: Block["name"]; part: Part; i: number }) {
  switch (block) {
    case "nav":
      return (
        <>
          <rect className="ik-fill" x={4} y={2.5} width={3} height={3} rx={1} />
          {[0, 1, 2].map((k) => (
            <path key={k} className="ik-detail" d={`M${92 + k * 12} 4h8`} />
          ))}
        </>
      )
    case "hero":
      return (
        <>
          <rect className="ik-fill" x={8} y={7} width={78} height={4} rx={2} />
          <rect className="ik-fill" x={8} y={14} width={52} height={4} rx={2} />
          <path className="ik-detail" d="M8 22.5h40" />
          <rect className="ik-face ik-top" x={98} y={9} width={26} height={9} rx={4.5} />
        </>
      )
    case "cards":
      return (
        <>
          <rect className="ik-well" x={4} y={3} width={part.w - 8} height={12} rx={2} />
          <path className="ik-detail" d={`M4 19.5h${i ? 34 : 44}M4 22.5h${i ? 22 : 28}`} />
        </>
      )
    case "footer":
      return <path className="ik-detail" d="M4 4.5h22M110 4.5h20" />
  }
}

export function PagePress() {
  const [live, setLive] = useState(false)
  const stop = useRef(() => {})
  useEffect(() => () => stop.current(), [])
  const publish = () => {
    stop.current()
    stop.current = live ? playSound("whoosh") : playSound("cascade", { count: BLOCKS.length, stagger: 0.06, delay: 0.3 })
    setLive(!live)
  }

  return (
    <Plate
      fig="Fig 3"
      name="Page press"
      hint={live ? "Press again" : "Press publish"}
      readout={live ? "live · your-idea.site" : `draft · ${BLOCKS.length} blocks`}
      className="page-press"
      data-live={live}
      fit={[BASE, { x: 17, y: 23, z: Z + 62, w: 134, d: 8, h: T + 3 }]}
      aspect={1.18}
      label="A webpage taken apart into blocks that float above their page. Press publish and they drop into place."
    >
      <Box
        {...BASE}
        r={10}
        top={
          <>
            <rect className="ik-detail" x={9} y={8} width={150} height={110} rx={6} />
            <path className="ik-detail" d="M9 19h150" />
            {[0, 1, 2].map((k) => (
              <circle key={k} className="ik-fill" cx={16 + k * 5.5} cy={13.5} r={1.6} />
            ))}
            <rect className="url" x={43} y={10.5} width={82} height={6} rx={3} />
            <circle className="url-dot" cx={47} cy={13.5} r={1.4} />
            {BLOCKS.flatMap((b) => b.parts.map((p, k) => <rect key={`${b.name}-${k}`} className="ik-dash" x={p.x} y={p.y} width={p.w} height={p.d} rx={2} />))}
          </>
        }
      />

      {BLOCKS.flatMap((b) =>
        b.parts.map((p, k) => (
          <path
            key={`${b.name}-${k}`}
            className="ik-dash guide"
            d={path([[p.x, p.y + p.d, Z], [p.x, p.y + p.d, Z + b.lift]]) + path([[p.x + p.w, p.y + p.d, Z], [p.x + p.w, p.y + p.d, Z + b.lift]])}
          />
        )),
      )}

      {BLOCKS.map((b, i) => (
        <g key={b.name} className="block" style={{ "--drop": `${b.lift}px`, "--i": BLOCKS.length - 1 - i, "--j": i } as CSSProperties}>
          <g className="ik-float" style={{ animationDelay: `${-i * 0.9}s` }}>
            {b.parts.map((p, k) => (
              <Box key={`${b.name}-${k}`} x={p.x} y={p.y} z={Z + b.lift} w={p.w} d={p.d} h={T} r={2} top={<Marks block={b.name} part={p} i={k} />} />
            ))}
          </g>
        </g>
      ))}

      <Press label={live ? "Unpublish the page" : "Publish the page"} onPress={publish} data-hot={!live}>
        <g>
          <Box
            {...KEY}
            r={6}
            top={
              <>
                <text className="ik-label" x={7} y={12.5}>
                  PUBLISH
                </text>
                <path className="ik-live ik-thick" d={ARROW} transform="translate(46 5.5) scale(.95)" />
              </>
            }
          />
        </g>
      </Press>
    </Plate>
  )
}

export const meta: FigureMeta = {
  slug: "page-press",
  title: "Page press",
  category: "agents",
  blurb: "Press publish: the page blocks drop into place, lowest first, and the address goes live.",
  uses: ["Plate", "Box", "Press", "path"],
  sounds: ["cascade", "whoosh"],
}

export default PagePress
