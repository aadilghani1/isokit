import { type CSSProperties, useEffect, useRef, useState } from "react"
import { Box, Cursor, Plate, Press, path, playSound, Ripple, Signal, useDemoTap } from "react-isokit"
import type { FigureMeta } from "../../site/registry"
import "./ChannelDock.css"

/**
 * A channel dock: three ad-channel cards hover over the slots of a small
 * console. Press a card and it seats; a signal runs from its slot to the
 * screen and the next card becomes the one to press.
 */

export const meta: FigureMeta = {
  slug: "channel-dock",
  title: "Channel dock",
  category: "marketing",
  blurb: "Press a channel card: it seats in its slot, a signal reaches the screen and the next card lights up.",
  uses: ["Plate", "Box", "Press", "Signal", "Ripple", "Cursor", "useDemoTap", "path"],
  sounds: ["done", "complete", "whoosh"],
}

type Channel = "meta" | "google" | "tiktok"
type Card = { channel: Channel; name: string; short: string; x: number; glyph: readonly string[] }

const DOCK = { x: 0, y: 0, z: 0, w: 150, d: 72, h: 30 }
const CARD = { y: 14, w: 34, d: 6, h: 42 }
const HOVER = 18
const CARD_Z = DOCK.h + HOVER
const LIGHT_Y = CARD.y + CARD.d + 11
const SEAT_MS = 420
const CARDS: readonly Card[] = [
  { channel: "meta", name: "Meta Ads", short: "META", x: 12, glyph: ["M7 5C5.5 2 1 2 1 5s4.5 3 6 0 6-3 6 0-4.5 3-6 0"] },
  { channel: "google", name: "Google Ads", short: "GOOGLE", x: 58, glyph: ["M3.6 8.6L7 1.8l3.6 6.8", "M3.4 8.8h.01"] },
  { channel: "tiktok", name: "TikTok Ads", short: "TIKTOK", x: 104, glyph: ["M7.4 1.2v6a2.4 2.4 0 1 1-2.4-2.4", "M7.4 1.2c.4 1.7 1.7 2.7 3.6 2.8"] },
]
const FIRST = CARDS[0] as Card
const trace = (card: Card) => [[card.x + CARD.w / 2, LIGHT_Y, DOCK.h], [card.x + CARD.w / 2, DOCK.d - 4, DOCK.h]] as const
const guides = (card: Card) =>
  [card.x, card.x + CARD.w].map((x) => path([[x, CARD.y + CARD.d, DOCK.h], [x, CARD.y + CARD.d, CARD_Z]])).join("")

export default function ChannelDock() {
  const [linked, setLinked] = useState<ReadonlySet<Channel>>(() => new Set())
  const [last, setLast] = useState<{ channel: Channel; on: boolean; n: number } | null>(null)
  const [touched, setTouched] = useState(false)
  const stop = useRef(() => {})
  useEffect(() => () => stop.current(), [])

  const total = CARDS.length
  const target = CARDS.find((card) => !linked.has(card.channel)) ?? null
  const toggle = (channel: Channel, audible: boolean) => {
    const on = !linked.has(channel)
    const next = new Set(on ? [...linked, channel] : [...linked].filter((c) => c !== channel))
    stop.current()
    if (audible) stop.current = on ? playSound(next.size === total ? "complete" : "done", { delay: SEAT_MS / 1000 }) : playSound("whoosh")
    setLinked(next)
    setLast({ channel, on, n: (last?.n ?? 0) + 1 })
  }
  const demo = useDemoTap(() => {
    if (!linked.has(FIRST.channel)) toggle(FIRST.channel, false)
  }, { delay: 500 })
  const press = (channel: Channel) => {
    demo.dismiss()
    setTouched(true)
    toggle(channel, true)
  }

  const name = last ? (CARDS.find((card) => card.channel === last.channel)?.name.toLowerCase() ?? "") : ""
  const count = linked.size
  const seated = last?.on ? CARDS.find((card) => card.channel === last.channel) : undefined
  const readout = !last ? `0 of ${total} linked` : count === total ? "all channels live · ready" : `${name} ${last.on ? "linked" : "unlinked"} · ${count} of ${total}`

  return (
    <Plate
      {...demo.plate}
      fig="Marketing"
      name="Channel dock"
      hint="Press a card"
      readout={readout}
      className="fig-channel-dock"
      data-live={count === total}
      fit={[DOCK, { x: 12, y: CARD.y, z: CARD_Z, w: 126, d: CARD.d, h: CARD.h }]}
      aspect={1.3}
      label="A dock with three ad-channel cards. Press a card to seat it and connect that channel."
    >
      <g ref={demo.ref}>
        <Box
          {...DOCK}
          r={10}
          top={
            <>
              <rect className="ik-detail" x={6} y={6} width={DOCK.w - 12} height={DOCK.d - 12} rx={6} />
              {CARDS.map((card, i) => (
                <g key={card.channel}>
                  <rect className="ik-well" x={card.x - 2} y={CARD.y - 2} width={CARD.w + 4} height={CARD.d + 4} rx={2} />
                  <path className="ik-detail" d={`M${card.x + CARD.w / 2} ${LIGHT_Y}V${DOCK.d - 6}`} />
                  <circle className="light" data-on={linked.has(card.channel)} style={{ "--i": i } as CSSProperties} cx={card.x + CARD.w / 2} cy={LIGHT_Y} r={1.8} />
                </g>
              ))}
            </>
          }
          front={
            <>
              <rect className="ik-screen" x={8} y={6} width={100} height={19} rx={3} />
              <g key={last?.n ?? 0} className="ik-enter" style={{ animationDelay: seated ? `${SEAT_MS + 220}ms` : "100ms" }}>
                <text className="ik-screen-text ik-dim" x={13} y={12.6} fontSize={5}>
                  {last ? `${name} · ${last.on ? "linked" : "unlinked"}` : "no channels yet"}
                </text>
                <text className="ik-screen-text" x={13} y={21.6} fontSize={7}>
                  {count === total ? "all channels live" : `${count} of ${total} linked`}
                </text>
              </g>
              {[0, 1, 2, 3, 4, 5, 6].map((k) => (
                <path key={k} className="ik-detail" d={`M${117 + k * 3.4} 8v14`} />
              ))}
            </>
          }
          side={<rect className="ik-well" x={10} y={11} width={12} height={8} rx={1.4} />}
        />
        {seated ? <Signal key={last?.n} points={trace(seated)} delay={SEAT_MS} duration={240} /> : null}
        {!touched && target && demo.phase !== "aim" && demo.phase !== "press" ? <Ripple x={target.x - 2} y={CARD.y - 2} z={DOCK.h} w={CARD.w + 4} d={CARD.d + 4} r={2} /> : null}
        {CARDS.map((card) => (
          <path key={card.channel} className="ik-dash guide" data-on={linked.has(card.channel)} d={guides(card)} />
        ))}
        {CARDS.map((card, i) => {
          const on = linked.has(card.channel)
          return (
            <Press key={card.channel} className="seat" label={`${on ? "Disconnect" : "Connect"} ${card.name}`} onPress={() => press(card.channel)} data-on={on} data-hot={target?.channel === card.channel}>
              <g>
                <g className="card">
                  <g className="bob ik-loop" style={{ animationDelay: `${-i * 1.3}s` }}>
                    <Box
                      x={card.x}
                      y={CARD.y}
                      z={CARD_Z}
                      w={CARD.w}
                      d={CARD.d}
                      h={CARD.h}
                      r={2}
                      front={
                        <>
                          <g transform="translate(10 6)">
                            {card.glyph.map((stroke) => (
                              <path key={stroke} className="ik-line ik-thick glyph" d={stroke} />
                            ))}
                          </g>
                          <text className="ik-label name" x={CARD.w / 2} y={26} textAnchor="middle">
                            {card.short}
                          </text>
                          {[0, 1, 2, 3, 4].map((k) => (
                            <rect key={k} className="ik-fill contact" x={7.2 + k * 4.2} y={33} width={2.2} height={5} rx={0.6} />
                          ))}
                        </>
                      }
                    />
                  </g>
                </g>
              </g>
            </Press>
          )
        })}
        <Cursor at={[FIRST.x + CARD.w / 2, CARD.y + CARD.d, CARD_Z + CARD.h / 2]} phase={demo.phase} />
      </g>
    </Plate>
  )
}
