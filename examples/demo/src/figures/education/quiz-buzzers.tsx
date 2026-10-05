import { type CSSProperties, useEffect, useReducer, useRef } from "react"
import { Box, Cursor, Flight, Plate, Press, playSound, Ripple, useDemoTap } from "react-isokit"
import type { FigureMeta } from "../../catalog/figure-meta"
import "./quiz-buzzers.css"

export const meta = {
  slug: "quiz-buzzers",
  title: "Quiz buzzers",
  industry: "education",
  level: 4,
  blurb: "Press a buzzer, then judge: a right answer flies the point from the question card to that team's stack and the scoreboard counts it.",
  uses: ["Plate", "Box", "Press", "Flight", "Ripple", "Cursor", "useDemoTap"],
  sounds: ["press", "release", "notify", "process", "done", "complete", "error", "whoosh"],
} satisfies FigureMeta

type Scores = readonly [number, number, number]
type Last = "fresh" | "buzz" | "right" | "wrong" | "reset"
type State = { scores: Scores; question: number; buzzed: number | null; team: number; last: Last; step: number }
type Action = { type: "buzz"; team: number } | { type: "right" } | { type: "wrong" } | { type: "reset" }

const BASE = { x: 0, y: 0, z: 0, w: 192, d: 146, h: 8 }
const BOARD = { x: 16, y: 8, z: BASE.h, w: 150, d: 12, h: 58 }
const CROWN = { x: 12, y: 6, z: BOARD.z + BOARD.h, w: 158, d: 16, h: 6 }
const TRAY = { x: 16, y: BOARD.y + BOARD.d, z: BASE.h, w: 150, d: 18, h: 5 }
const TRAY_TOP = TRAY.z + TRAY.h
const WELL_Y = TRAY.y + TRAY.d / 2
const WINDOW = { w: 34, h: 24, y: 12 }
const TOKEN = { w: 11, d: 11, h: 2.4 }
const LECTERN = { x: 72, y: 58, z: BASE.h, w: 46, d: 34, h: 12 }
const CARD = { x: 75, y: 61, z: LECTERN.z + LECTERN.h, w: 40, d: 28, h: 1.6 }
const CARD_TOKEN = { x: CARD.x + 24.5, y: CARD.y + 8.5, z: CARD.z + CARD.h, ...TOKEN }
const PAD = { x: 136, y: 58, z: BASE.h, w: 50, d: 42, h: 6 }
const RIGHT_KEY = { x: 139, y: 61, z: PAD.z + PAD.h, w: 44, d: 14, h: 5 }
const WRONG_KEY = { x: 139, y: 79, z: PAD.z + PAD.h, w: 44, d: 14, h: 5 }
const PODIUM = { y: 108, z: BASE.h, w: 44, d: 30, h: 10 }
const HOUSING = { w: 26, h: 5 }
const CAP = { w: 19, h: 4 }
const DOME = { w: 12, h: 2.5 }
const TEAMS = [
  { letter: "A", x: 16 },
  { letter: "B", x: 74 },
  { letter: "C", x: 132 },
] as const
const COLUMNS = [29, 75, 121] as const
const WIN = 5
const LEVELS = Array.from({ length: WIN }, (_, k) => k)
const FLY_MS = 640
const LAND_MS = FLY_MS
const CARD_IN_MS = LAND_MS + 120
const LEAVE_STAGGER_MS = 50
const START: State = { scores: [2, 3, 1], question: 7, buzzed: null, team: 1, last: "fresh", step: 0 }

const ms = (value: number) => `${value}ms`
const letterOf = (team: number) => TEAMS[team]?.letter ?? "A"
const wellX = (team: number) => BOARD.x + (COLUMNS[team] ?? 0)
const tokenAt = (team: number, level: number) => ({ x: wellX(team) - TOKEN.w / 2, y: WELL_Y - TOKEN.d / 2, z: TRAY_TOP + level * TOKEN.h, ...TOKEN })
const center = (podiumX: number) => ({ x: podiumX + PODIUM.w / 2, y: PODIUM.y + PODIUM.d / 2 })
const disc = (podiumX: number, z: number, part: { w: number; h: number }) => {
  const c = center(podiumX)
  return { x: c.x - part.w / 2, y: c.y - part.w / 2, z, w: part.w, d: part.w, h: part.h }
}
const HOUSING_Z = PODIUM.z + PODIUM.h
const CAP_Z = HOUSING_Z + HOUSING.h
const DOME_Z = CAP_Z + CAP.h
const isWon = (scores: Scores) => scores.some((score) => score >= WIN)
const points = (n: number) => `${n} point${n === 1 ? "" : "s"}`

function scoreUp(scores: Scores, team: number): Scores {
  return [scores[0] + (team === 0 ? 1 : 0), scores[1] + (team === 1 ? 1 : 0), scores[2] + (team === 2 ? 1 : 0)]
}

function quiz(state: State, action: Action): State {
  const step = state.step + 1
  switch (action.type) {
    case "buzz":
      return state.buzzed === null && !isWon(state.scores) ? { ...state, buzzed: action.team, team: action.team, last: "buzz", step } : state
    case "right":
      return state.buzzed === null ? state : { ...state, scores: scoreUp(state.scores, state.buzzed), question: state.question + 1, buzzed: null, last: "right", step }
    case "wrong":
      return state.buzzed === null ? state : { ...state, buzzed: null, last: "wrong", step }
    case "reset":
      return isWon(state.scores) ? { ...START, scores: [0, 0, 0], question: 1, team: state.team, last: "reset", step } : state
  }
}

function readoutOf(state: State): string {
  const team = `team ${letterOf(state.team)}`
  const score = state.scores[state.team] ?? 0
  if (state.last === "buzz") return `${team} buzzed · judge it`
  if (state.last === "right") return isWon(state.scores) ? `${team} wins · ${points(score)}` : `${team} · ${points(score)}`
  if (state.last === "wrong") return `${team} · wrong · buzzers open`
  if (state.last === "reset") return "new game · question 1"
  return `question ${state.question} · buzzers open`
}

export default function QuizBuzzers() {
  const [state, dispatch] = useReducer(quiz, START)
  const timer = useRef(0)
  const stop = useRef(() => {})
  useEffect(
    () => () => {
      window.clearTimeout(timer.current)
      stop.current()
    },
    [],
  )

  const won = isWon(state.scores)
  const open = state.buzzed === null && !won
  const cut = () => {
    window.clearTimeout(timer.current)
    stop.current()
    stop.current = () => {}
  }
  const buzz = (team: number, audible: boolean) => {
    if (!open) return
    cut()
    if (audible) stop.current = playSound("notify")
    dispatch({ type: "buzz", team })
  }
  const right = () => {
    cut()
    if (won) {
      stop.current = playSound("whoosh")
      dispatch({ type: "reset" })
      return
    }
    if (state.buzzed === null) return
    const winning = (state.scores[state.buzzed] ?? 0) + 1 >= WIN
    stop.current = playSound("process")
    timer.current = window.setTimeout(() => {
      stop.current()
      stop.current = playSound(winning ? "complete" : "done")
    }, LAND_MS)
    dispatch({ type: "right" })
  }
  const wrong = () => {
    cut()
    stop.current = playSound("error")
    dispatch({ type: "wrong" })
  }
  const demo = useDemoTap(
    () => {
      if (state.step === 0) buzz(1, false)
    },
    { delay: 1700 },
  )
  const act = (then: () => void) => () => {
    demo.dismiss()
    then()
  }

  const flying = state.last === "right"
  const scored = state.team
  const reset = state.last === "reset"
  const aiming = demo.phase === "aim" || demo.phase === "press"
  const before = (state.scores[scored] ?? 1) - 1
  const hint = won ? "Press new for a new game" : state.buzzed !== null ? "Now judge it" : "Press a buzzer"
  const tokenDelay = (team: number, level: number) => {
    if (flying && team === scored && level === before) return LAND_MS
    if (reset) return (WIN - 1 - level) * LEAVE_STAGGER_MS
    return 0
  }

  return (
    <Plate
      {...demo.plate}
      fig="Education"
      name="Quiz buzzers"
      hint={hint}
      readout={readoutOf(state)}
      className="fig-quiz-buzzers"
      fit={[BASE, CROWN, { ...BOARD, z: 0, h: CROWN.z + CROWN.h }]}
      aspect={1.3}
      label="A quiz table: a scoreboard for teams A, B and C with a tray of point tokens, a question card on a lectern, a judge's pad with right and wrong keys, and three buzzers. Press a buzzer, then judge; a right answer flies the point from the question card to that team."
    >
      <g ref={demo.ref}>
        <Box
          {...BASE}
          r={12}
          top={
            <>
              <rect className="ik-detail" x={8} y={8} width={BASE.w - 16} height={BASE.d - 16} rx={7} />
              <path className="ik-detail" d={`M12 ${PODIUM.y - 6}h${BASE.w - 24}`} />
            </>
          }
        />
        <Box
          {...BOARD}
          r={3}
          front={COLUMNS.map((column, team) => {
                const live = team === scored && state.last === "right"
                const score = state.scores[team] ?? 0
                const changing = (flying && team === scored) || reset
                const t = ms(reset ? 0 : LAND_MS)
                return (
                  <g key={column}>
                    <text className="ik-label qb-letter" x={column} y={WINDOW.y - 3} textAnchor="middle">
                      {letterOf(team)}
                    </text>
                    <rect
                      className="qb-window"
                      data-live={live}
                      x={column - WINDOW.w / 2}
                      y={WINDOW.y}
                      width={WINDOW.w}
                      height={WINDOW.h}
                      rx={3}
                      style={{ "--t": ms(LAND_MS) } as CSSProperties}
                    />
                    {changing && !reset ? (
                      <g key={`was-${state.step}`} className="qb-was" style={{ "--t": t } as CSSProperties}>
                        <Digit column={column} value={score - 1} />
                      </g>
                    ) : null}
                    <g key={changing ? `now-${state.step}` : "steady"} className={changing ? "qb-now" : undefined} style={{ "--t": t } as CSSProperties}>
                      <Digit column={column} value={score} />
                    </g>
                  </g>
                )
              })}
          side={<path className="ik-detail" d={`M3 8v${BOARD.h - 16}`} />}
        />
        <Box
          {...CROWN}
          r={3}
          front={Array.from({ length: 17 }, (_, k) => (
            <circle key={k} className="qb-bulb" cx={7 + k * 9} cy={3} r={1.2} />
          ))}
        />
        <Box
          {...TRAY}
          r={3}
          top={COLUMNS.map((column) => (
            <rect key={column} className="ik-well" x={column - 8} y={TRAY.d / 2 - 7} width={16} height={14} rx={7} />
          ))}
        />
        {COLUMNS.map((column, team) =>
          LEVELS.map((level) => (
            <g
              key={`${column}-${level}`}
              className="qb-token"
              data-on={level < (state.scores[team] ?? 0)}
              style={{ "--t": ms(tokenDelay(team, level)) } as CSSProperties}
            >
              <Token {...tokenAt(team, level)} />
            </g>
          )),
        )}

        <Box
          {...LECTERN}
          r={4}
          front={
            <>
              <text className="ik-label qb-team" x={6} y={8}>
                QUESTION
              </text>
              <circle className="ik-fill" cx={LECTERN.w - 6} cy={5.5} r={1.2} />
            </>
          }
          side={<path className="ik-detail" d="M4 3v6M7 3v6M10 3v6" />}
        />
        {flying ? (
          <g key={`card-was-${state.step}`} className="qb-card-out" style={{ "--t": ms(LAND_MS) } as CSSProperties}>
            <Card question={state.question - 1} live={false} withToken={false} />
          </g>
        ) : null}
        <g key={`card-${state.question}`} className={flying ? "qb-card-in" : undefined} style={{ "--t": ms(CARD_IN_MS) } as CSSProperties}>
          <Card question={state.question} live={state.last === "wrong" || reset} withToken />
        </g>

        <Box {...PAD} r={5} top={<path className="ik-detail" d={`M6 ${PAD.d - 4}h${PAD.w - 12}`} />} />
        <Press label={won ? "Start a new game" : "Judge the answer right"} onPress={act(right)} disabled={!won && state.buzzed === null}>
          <g>
            <Box
              {...RIGHT_KEY}
              r={4}
              top={
                <>
                  <text className="ik-label qb-key" x={6} y={9.4}>
                    {won ? "NEW" : "RIGHT"}
                  </text>
                  <path className="qb-mark" d={won ? "M-3 0a3 3 0 1 0 3 -3M0 -3l-1.6 -1.6M0 -3l-1.6 1.6" : "M-3.2 0.2l2 2.2l4.2 -4.6"} transform={`translate(${RIGHT_KEY.w - 7.5} 7)`} />
                </>
              }
            />
          </g>
        </Press>
        <Press label="Judge the answer wrong" onPress={act(wrong)} disabled={state.buzzed === null}>
          <g>
            <Box
              {...WRONG_KEY}
              r={4}
              top={
                <>
                  <text className="ik-label qb-key" x={6} y={9.4}>
                    WRONG
                  </text>
                  <path className="qb-mark" d="M-2.6 -2.6l5.2 5.2M2.6 -2.6l-5.2 5.2" transform={`translate(${WRONG_KEY.w - 7.5} 7)`} />
                </>
              }
            />
          </g>
        </Press>

        {TEAMS.map((team, t) => (
          <g key={team.letter}>
            <Box
              x={team.x}
              {...PODIUM}
              r={5}
              front={
                <>
                  <text className="ik-label qb-team" x={6} y={7}>
                    TEAM {team.letter}
                  </text>
                  <circle className="ik-fill" cx={PODIUM.w - 6} cy={5} r={1.2} />
                </>
              }
            />
            <Box {...disc(team.x, HOUSING_Z, HOUSING)} r={HOUSING.w / 2} />
            {t === 1 && state.step === 0 && !aiming ? <Ripple {...disc(team.x, CAP_Z, HOUSING)} r={HOUSING.w / 2} /> : null}
            <Press
              label={`Buzz in for team ${team.letter}`}
              onPress={act(() => buzz(t, true))}
              disabled={!open}
              className="qb-buzzer"
              data-hot={state.step === 0 && t === 1}
              data-lit={state.last === "buzz" && state.buzzed === t}
            >
              <g>
                <Box {...disc(team.x, CAP_Z, CAP)} r={CAP.w / 2} />
                <g className="qb-dome">
                  <Box {...disc(team.x, DOME_Z, DOME)} r={DOME.w / 2} />
                </g>
              </g>
            </Press>
          </g>
        ))}

        <g key={`flight-${state.step}`}>
          {flying ? (
            <Flight from={[CARD_TOKEN.x, CARD_TOKEN.y, CARD_TOKEN.z]} to={[tokenAt(scored, before).x, tokenAt(scored, before).y, tokenAt(scored, before).z]} duration={FLY_MS} lift={30}>
              <Token {...CARD_TOKEN} />
            </Flight>
          ) : null}
        </g>
        <Cursor at={[center(TEAMS[1].x).x, center(TEAMS[1].x).y, DOME_Z + DOME.h]} phase={demo.phase} />
      </g>
    </Plate>
  )
}

function Digit({ column, value }: { column: number; value: number }) {
  return (
    <text className="ik-screen-text" x={column} y={WINDOW.y + 18} fontSize={16} textAnchor="middle">
      {value}
    </text>
  )
}

function Token(box: { x: number; y: number; z: number; w: number; d: number; h: number }) {
  return <Box {...box} r={box.w / 2} top={<circle className="ik-detail" cx={box.w / 2} cy={box.d / 2} r={2.6} />} />
}

function Card({ question, live, withToken }: { question: number; live: boolean; withToken: boolean }) {
  return (
    <>
      <g className="qb-card" data-live={live}>
        <Box
          {...CARD}
          r={2}
          top={
            <>
              <text className="ik-label qb-q" x={4} y={9.5}>
                Q{question}
              </text>
              <path className="ik-detail" d="M4 15h17M4 19h13M4 23h18" />
            </>
          }
        />
      </g>
      {withToken ? <Token {...CARD_TOKEN} /> : null}
    </>
  )
}
