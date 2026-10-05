import { type CSSProperties, useEffect, useRef, useState } from "react"
import { Box, Cursor, Flight, Plate, Press, playSound, Ripple, useDemoTap } from "react-isokit"
import type { FigureMeta } from "../../catalog/figure-meta"
import "./budget-rack.css"

export const meta = {
  slug: "budget-rack",
  title: "Budget rack",
  industry: "marketing",
  level: 4,
  blurb: "Press run: the weakest ad pauses and its budget coins fly onto the winner.",
  uses: ["Plate", "Box", "Press", "Flight", "Ripple", "Cursor", "useDemoTap"],
  sounds: ["cascade", "whoosh"],
} satisfies FigureMeta

type Ad = "a" | "b" | "c"
type Day = "launch" | "prune" | "scale"
type Coins = Readonly<Record<Ad, number>>
type Coin = { ad: Ad; level: number }
type Move = { from: Coin; to: Coin; lift: number }

const BASE = { x: 0, y: 0, z: 0, w: 168, d: 104, h: 10 }
const CARD = { y: 12, w: 40, d: 5, h: 56 }
const COIN = { y: 40, w: 24, d: 24, h: 4, step: 5, inset: 8 }
const KEY = { x: 112, y: 80, z: BASE.h, w: 48, d: 16, h: 5 }
const PAUSE_MS = 260
const GAP_MS = 110
const FLIGHT_MS = 520
const ADS: ReadonlyArray<{ ad: Ad; x: number }> = [
  { ad: "a", x: 10 },
  { ad: "b", x: 64 },
  { ad: "c", x: 118 },
]
const LEVELS = [0, 1, 2, 3, 4, 5, 6] as const
const PLAN: Readonly<Record<Day, { coins: Coins; next: Day; day: number; readout: string }>> = {
  launch: { coins: { a: 3, b: 3, c: 3 }, next: "prune", day: 1, readout: "3 ads live · even split" },
  prune: { coins: { a: 5, b: 4, c: 0 }, next: "scale", day: 4, readout: "day 4 · ad c paused" },
  scale: { coins: { a: 7, b: 2, c: 0 }, next: "launch", day: 9, readout: "day 9 · budget → ad a" },
}

const xOf = (ad: Ad) => (ADS.find((slot) => slot.ad === ad)?.x ?? 0) + COIN.inset
const at = (coin: Coin) => [xOf(coin.ad), COIN.y, BASE.h + coin.level * COIN.step] as const
const between = (from: number, to: number) => LEVELS.filter((level) => level >= from && level < to)

function moves(before: Coins, after: Coins): readonly Move[] {
  const lost = ADS.flatMap(({ ad }) => [...between(after[ad], before[ad])].reverse().map((level) => ({ ad, level })))
  const won = ADS.flatMap(({ ad }) => between(before[ad], after[ad]).map((level) => ({ ad, level })))
  return won.flatMap((to, i) => {
    const from = lost[i]
    return from ? [{ from, to, lift: PAUSE_MS + i * GAP_MS }] : []
  })
}

function delayOf(coin: Coin, list: readonly Move[]) {
  const same = (other: Coin) => other.ad === coin.ad && other.level === coin.level
  const leaving = list.find((move) => same(move.from))
  if (leaving) return leaving.lift
  const arriving = list.find((move) => same(move.to))
  return arriving ? arriving.lift + FLIGHT_MS : 0
}

function CoinFace() {
  return <circle className="ik-detail" cx={COIN.w / 2} cy={COIN.d / 2} r={7} />
}

export default function BudgetRack() {
  const [run, setRun] = useState<{ day: Day; previous: Day | null; step: number }>({ day: "launch", previous: null, step: 0 })
  const [touched, setTouched] = useState(false)
  const stop = useRef(() => {})
  useEffect(() => () => stop.current(), [])

  const { day } = run
  const coins = PLAN[day].coins
  const flights = run.previous ? moves(PLAN[run.previous].coins, coins) : []
  const lead = day === "launch" ? null : ADS.reduce((best, slot) => (coins[slot.ad] > coins[best.ad] ? slot : best)).ad
  const advance = (audible: boolean) => {
    const next = PLAN[day].next
    const count = moves(coins, PLAN[next].coins).length
    stop.current()
    if (audible) stop.current = count ? playSound("cascade", { count, stagger: GAP_MS / 1000, delay: (PAUSE_MS + FLIGHT_MS) / 1000 }) : playSound("whoosh")
    setRun({ day: next, previous: day, step: run.step + 1 })
  }
  const demo = useDemoTap(() => {
    if (day === "launch") advance(false)
  }, { delay: 700 })
  const press = () => {
    demo.dismiss()
    setTouched(true)
    advance(true)
  }

  return (
    <Plate
      {...demo.plate}
      fig="Marketing"
      name="Budget rack"
      hint={day === "scale" ? "Press for a new test" : "Press run"}
      readout={PLAN[day].readout}
      className="fig-budget-rack"
      data-day={day}
      fit={[BASE, { x: 10, y: CARD.y, z: 0, w: 148, d: CARD.d, h: BASE.h + CARD.h }]}
      aspect={1.3}
      label="Three ads, each with a stack of budget coins. Press run and the weakest ad pauses while its coins fly onto the strongest."
    >
      <g ref={demo.ref}>
        <Box
          {...BASE}
          r={10}
          top={
            <>
              {ADS.map(({ ad, x }) => (
                <g key={ad}>
                  <rect className="ik-well" x={x - 2} y={CARD.y - 2} width={CARD.w + 4} height={CARD.d + 4} rx={2} />
                  <rect className="ik-detail" x={x + COIN.inset - 3} y={COIN.y - 3} width={COIN.w + 6} height={COIN.d + 6} rx={(COIN.w + 6) / 2} />
                </g>
              ))}
              <g key={day} className="ik-enter">
                <text className="ik-label day" x={10} y={95}>
                  DAY {PLAN[day].day}
                </text>
              </g>
            </>
          }
        />
        {ADS.map(({ ad, x }) => (
          <g key={ad} className="card" data-paused={coins[ad] === 0} data-lead={lead === ad}>
            <Box
              x={x}
              y={CARD.y}
              z={BASE.h}
              w={CARD.w}
              d={CARD.d}
              h={CARD.h}
              r={2}
              front={
                <>
                  <rect className="ik-well" x={4} y={4} width={32} height={28} rx={2} />
                  <g className="art">
                    <circle className="ik-detail" cx={28} cy={11} r={2.5} />
                    <path className="ik-detail" d="M5 31l9-9 6 6 5-4 10 7M4 37.5h26M4 41.5h18" />
                    <rect className="ik-fill" x={4} y={46} width={16} height={5.5} rx={2.75} />
                  </g>
                  <path className="ik-line ik-thick pause" d="M16.5 12v12M23.5 12v12" />
                  <text className="ik-label letter" x={36} y={51} textAnchor="end">
                    {ad.toUpperCase()}
                  </text>
                </>
              }
            />
          </g>
        ))}
        {ADS.map(({ ad }) =>
          LEVELS.map((level) => (
            <g key={`${ad}-${level}`} className="coin" data-on={level < coins[ad]} style={{ "--t": `${delayOf({ ad, level }, flights)}ms` } as CSSProperties}>
              <Box x={xOf(ad)} y={COIN.y} z={BASE.h + level * COIN.step} w={COIN.w} d={COIN.d} h={COIN.h} r={COIN.w / 2} top={<CoinFace />} />
            </g>
          )),
        )}
        {!touched && day === "launch" && demo.phase !== "aim" && demo.phase !== "press" ? <Ripple {...KEY} r={6} /> : null}
        <Press label={day === "scale" ? "Start a new test" : "Let it move the budget"} onPress={press} data-hot={day === "launch"}>
          <g>
            <Box
              {...KEY}
              r={6}
              top={
                <>
                  <text className="ik-label key" x={7} y={10.6}>
                    RUN
                  </text>
                  <path className="ik-detail ik-thick play" d="M0 0l5 3.2L0 6.4z" transform={`translate(${KEY.w - 13} 4.8)`} />
                </>
              }
            />
          </g>
        </Press>
        <g key={run.step}>
          {flights.map((move) => (
            <Flight key={`${move.from.ad}-${move.from.level}`} from={at(move.from)} to={at(move.to)} delay={move.lift} duration={FLIGHT_MS}>
              <Box x={xOf(move.from.ad)} y={COIN.y} z={BASE.h + move.from.level * COIN.step} w={COIN.w} d={COIN.d} h={COIN.h} r={COIN.w / 2} top={<CoinFace />} />
            </Flight>
          ))}
        </g>
        <Cursor at={[KEY.x + KEY.w / 2, KEY.y + KEY.d / 2, KEY.z + KEY.h]} phase={demo.phase} />
      </g>
    </Plate>
  )
}
