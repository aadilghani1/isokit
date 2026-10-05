import { useEffect, useRef, useState } from "react"
import { Box, Cursor, Plate, Press, playSound, Ripple, useDemoTap } from "react-isokit"
import type { FigureMeta } from "../../catalog/figure-meta"
import "./card-terminal.css"

export const meta = {
  slug: "card-terminal",
  title: "Card terminal",
  industry: "fintech",
  level: 1,
  blurb: "Press OK: the screen goes from the amount to approved and the status light comes on.",
  uses: ["Plate", "Box", "Press", "Ripple", "Cursor", "useDemoTap"],
  sounds: ["press", "release", "success"],
} satisfies FigureMeta

const DECK = { x: 0, y: 0, z: 0, w: 96, d: 164, h: 14 }
const HEAD = { x: 0, y: 0, z: DECK.h, w: 96, d: 56, h: 34 }
const ROLL = { x: 10, y: 6, z: HEAD.z + HEAD.h, w: 76, d: 24, h: 6 }
const PAPER = { x: 24, y: ROLL.y + ROLL.d + 2, z: HEAD.z + HEAD.h, w: 48, d: 1.5, h: 11 }
const KEY = { w: 22, d: 13, h: 3 }
const COL_X = 9.5
const COL_PITCH = 29
const ROW_Y = 66
const ROW_PITCH = 17
const DIGITS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "0", "#"] as const
const KEYS = DIGITS.map((label, i) => ({ label, x: COL_X + (i % 3) * COL_PITCH, y: ROW_Y + Math.floor(i / 3) * ROW_PITCH }))
const FN_Y = ROW_Y + 4 * ROW_PITCH + 2
const CANCEL = { x: COL_X, y: FN_Y, z: DECK.h, w: KEY.w, d: 15, h: KEY.h }
const CLEAR = { ...CANCEL, x: COL_X + COL_PITCH }
const OK = { ...CANCEL, x: COL_X + 2 * COL_PITCH, h: 4 }
const CARD = { x: 20, y: DECK.d, z: 3.4, w: 56, d: 30, h: 1.6 }
const SCREEN = { x: 13, y: 5, w: 70, h: 24 }
const SALES = ["€24.90", "€8.40", "€61.00", "€3.20"] as const
const CYCLE = 2 * SALES.length

const saleOf = (presses: number) => SALES[Math.floor(presses / 2) % SALES.length] ?? SALES[0]

export default function CardTerminal() {
  const [presses, setPresses] = useState(0)
  const stop = useRef(() => {})
  useEffect(() => () => stop.current(), [])

  const approved = presses % 2 === 1
  const amount = saleOf(presses)
  const next = (audible: boolean) => {
    const following = (presses % CYCLE) + 1
    stop.current()
    if (audible && following % 2 === 1) stop.current = playSound("success")
    setPresses(following)
  }
  const demo = useDemoTap(
    () => {
      if (presses === 0) next(false)
    },
    { delay: 500 },
  )
  const press = () => {
    demo.dismiss()
    next(true)
  }
  const aiming = demo.phase === "aim" || demo.phase === "press"

  return (
    <Plate
      {...demo.plate}
      fig="Fintech"
      name="Card terminal"
      hint={approved ? "Press OK for the next sale" : "Press OK"}
      readout={`${amount} · ${approved ? "approved" : "enter pin"}`}
      className="fig-card-terminal"
      data-approved={approved}
      fit={[DECK, { ...HEAD, z: 0, h: HEAD.z + HEAD.h }, PAPER, CARD]}
      aspect={1.25}
      label="A countertop card terminal with a receipt printer, a screen, a keypad and a card in its chip slot. Press the OK key to approve the payment; press it again to ring up the next sale."
    >
      <g ref={demo.ref}>
        <Box
          {...DECK}
          r={12}
          top={
            <>
              <rect className="ik-detail" x={4} y={HEAD.d + 4} width={DECK.w - 8} height={DECK.d - HEAD.d - 9} rx={6} />
              <circle className="ik-fill" cx={DECK.w / 2} cy={DECK.d - 2.5} r={0.9} />
            </>
          }
          front={
            <>
              <rect className="ik-well" x={CARD.x - DECK.x - 4} y={DECK.h - CARD.z - CARD.h - 0.8} width={CARD.w + 8} height={CARD.h + 1.6} rx={1.2} />
              <path className="ik-detail" d={`M15 3.5h${DECK.w - 30}`} />
            </>
          }
          side={<path className="ik-detail" d={`M15 7h${DECK.d - 30}`} />}
        />
        <Box
          {...HEAD}
          r={12}
          top={
            <>
              <path className="ik-detail" d={`M8 ${PAPER.y - HEAD.y + 3.5}h${HEAD.w - 16}`} />
              <g className="ik-detail" transform={`translate(${HEAD.w / 2 - 6} ${HEAD.d - 10})`}>
                <path d="M0 -2.2a3 3 0 0 1 0 4.4" />
                <path d="M2.4 -4.4a6 6 0 0 1 0 8.8" />
                <path d="M4.8 -6.6a9 9 0 0 1 0 13.2" />
              </g>
              <circle className="ct-lamp" cx={HEAD.w - 14} cy={HEAD.d - 10} r={2.6} />
            </>
          }
          front={
            <>
              <rect className="ik-screen" x={SCREEN.x} y={SCREEN.y} width={SCREEN.w} height={SCREEN.h} rx={3} />
              <g key={presses} className="ik-enter">
                <text className="ik-screen-text ik-dim" x={SCREEN.x + 6} y={SCREEN.y + 8} fontSize={5.6}>
                  {approved ? `${amount} · ••42` : "enter pin · ••••"}
                </text>
                <text className="ik-screen-text" x={SCREEN.x + 6} y={SCREEN.y + 19.5} fontSize={9}>
                  {approved ? "approved" : amount}
                </text>
                {approved ? <path className="ik-screen-line" d={`M${SCREEN.x + 60} ${SCREEN.y + 15}l3 3 6-6.5`} /> : null}
              </g>
            </>
          }
          side={
            <>
              <rect className="ik-well" x={15} y={9} width={HEAD.d - 30} height={2.4} rx={1.2} />
              {Array.from({ length: 5 }, (_, k) => (
                <path key={k} className="ik-detail" d={`M${17 + k * 3.4} 17v11`} />
              ))}
            </>
          }
        />
        <Box {...ROLL} r={8} top={<path className="ik-detail" d={`M6 ${ROLL.d - 6}h${ROLL.w - 12}`} />} />
        <Box
          {...PAPER}
          front={
            <>
              <path className="ik-detail" d={`M6 4h${PAPER.w - 24}M6 7h${PAPER.w - 30}`} />
              <path className="ik-detail" d={`M${PAPER.w - 12} 4h6M${PAPER.w - 12} 7h6`} />
            </>
          }
        />

        {KEYS.map((key) => (
          <Box
            key={key.label}
            x={key.x}
            y={key.y}
            z={DECK.h}
            w={KEY.w}
            d={KEY.d}
            h={KEY.h}
            r={3}
            top={
              <text className="ik-label ct-digit" x={KEY.w / 2} y={KEY.d / 2 + 2.2} textAnchor="middle">
                {key.label}
              </text>
            }
          />
        ))}
        <Box {...CANCEL} r={3} top={<path className="ik-detail ik-thick" d={`M${CANCEL.w / 2 - 2.6} ${CANCEL.d / 2 - 2.6}l5.2 5.2m0-5.2l-5.2 5.2`} />} />
        <Box {...CLEAR} r={3} top={<path className="ik-detail ik-thick" d={`M${CLEAR.w / 2 + 1.6} ${CLEAR.d / 2 - 3}l-3.2 3 3.2 3`} />} />

        {presses || aiming ? null : <Ripple {...OK} r={3} />}
        <Press label={approved ? "Ring up the next sale" : "Approve the payment"} onPress={press} data-hot={!approved}>
          <g>
            <Box
              {...OK}
              r={3}
              top={
                <>
                  <circle className="ik-detail ik-thick" cx={6.5} cy={OK.d / 2} r={2.6} />
                  <text className="ik-label ct-ok" x={11} y={OK.d / 2 + 2.2}>
                    OK
                  </text>
                </>
              }
            />
          </g>
        </Press>

        <Box
          {...CARD}
          r={2}
          top={
            <>
              <path className="ik-detail" d={`M6 ${CARD.d - 13}h8M17 ${CARD.d - 13}h8M28 ${CARD.d - 13}h8M39 ${CARD.d - 13}h8`} />
              <path className="ik-detail" d={`M6 ${CARD.d - 7}h20`} />
              <circle className="ik-detail" cx={CARD.w - 12} cy={CARD.d - 7} r={3} />
              <circle className="ik-detail" cx={CARD.w - 8} cy={CARD.d - 7} r={3} />
            </>
          }
        />

        <Cursor at={[OK.x + OK.w / 2, OK.y + OK.d / 2, OK.z + OK.h]} phase={demo.phase} />
      </g>
    </Plate>
  )
}
