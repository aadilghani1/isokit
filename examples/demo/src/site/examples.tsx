import { type ComponentType, type CSSProperties, useEffect, useRef, useState } from "react"
import { Box, Cursor, curve, Flight, front, Plate, Press, path, playSound, Ripple, Signal, SoundToggle, side, top, useDemoTap } from "react-isokit"

const KEY = { x: 0, y: 0, z: 0, w: 60, d: 60, h: 14 }
const KEY_TOP = [KEY.x + KEY.w / 2, KEY.y + KEY.d / 2, KEY.z + KEY.h] as const

function PlateExample() {
  const [n, setN] = useState(0)
  return (
    <Plate fig="Fig 1" name="Key" hint="Press it" readout={`pressed ${n}×`} fit={[KEY]} aspect={1.6} label="A single key on a plate, with a caption in each corner. Press it to count.">
      <Press label="Press the key" onPress={() => setN(n + 1)}>
        <g>
          <Box {...KEY} r={10} />
        </g>
      </Press>
    </Plate>
  )
}

const DEVICE = { x: 0, y: 0, z: 0, w: 120, d: 70, h: 52 }

function BoxExample() {
  return (
    <Plate
      role="img"
      fit={[DEVICE]}
      aspect={1.6}
      hint="Three faces, three planes"
      readout="top · front · side"
      label="A rounded box with a label drawn on its lid, a screen on its front face and vents on its side."
    >
      <Box
        {...DEVICE}
        r={10}
        top={
          <text className="ik-label" x={12} y={24}>
            TOP
          </text>
        }
        front={
          <>
            <rect className="ik-screen" x={10} y={8} width={70} height={24} rx={4} />
            <text className="ik-screen-text" x={16} y={24} fontSize={8}>
              front
            </text>
          </>
        }
        side={
          <>
            {[0, 1, 2, 3, 4, 5].map((k) => (
              <path key={k} className="ik-detail" d={`M${12 + k * 4} 12v20`} />
            ))}
            <text className="ik-label" x={40} y={30}>
              SIDE
            </text>
          </>
        }
      />
    </Plate>
  )
}

function PressExample() {
  const [n, setN] = useState(0)
  return (
    <Plate hint="Pointer, Enter or Space" readout={n ? `released ${n}×` : "at rest"} fit={[KEY]} aspect={1.6} label="A key that goes down when pressed and acts on release.">
      <Press label="Press the key" onPress={() => setN(n + 1)} data-hot={n === 0}>
        <g>
          <Box {...KEY} r={10} />
        </g>
      </Press>
    </Plate>
  )
}

function DemoTapExample() {
  const [n, setN] = useState(0)
  const [touched, setTouched] = useState(false)
  const demo = useDemoTap(() => setN((count) => count + 1), { delay: 400 })
  const press = () => {
    demo.dismiss()
    setTouched(true)
    setN(n + 1)
  }
  return (
    <Plate
      {...demo.plate}
      hint={touched ? "Your turn" : "Watch, then press"}
      readout={n ? `pressed ${n}× · ${touched ? "by you" : "by the demo"}` : "waiting for view"}
      fit={[KEY, [KEY.x + KEY.w, KEY.y + KEY.d, KEY.z + 30]]}
      aspect={1.6}
      label="A key that presses itself once when it first comes into view, then waits for you."
    >
      <g ref={demo.ref}>
        {!touched && demo.phase !== "aim" && demo.phase !== "press" ? <Ripple {...KEY} r={10} /> : null}
        <Press label="Press the key" onPress={press} data-hot={!touched}>
          <g>
            <Box {...KEY} r={10} />
          </g>
        </Press>
        <Cursor at={KEY_TOP} phase={demo.phase} />
      </g>
    </Plate>
  )
}

function ReplayDemo() {
  const [run, setRun] = useState(0)
  return (
    <div className="example-stack">
      <DemoTapExample key={run} />
      <button type="button" className="pill" onClick={() => setRun(run + 1)}>
        Replay the demo
      </button>
    </div>
  )
}

function RippleExample() {
  const [touched, setTouched] = useState(false)
  return (
    <Plate hint={touched ? "Pressed · ripple gone" : "The ripple says: here"} readout={touched ? "touched" : "untouched"} fit={[KEY, { ...KEY, x: -8, y: -8, w: 76, d: 76 }]} aspect={1.6} label="A key with a ripple breathing out from under it until it is pressed.">
      {touched ? null : <Ripple {...KEY} r={10} />}
      <Press label="Press the key" onPress={() => setTouched(!touched)} data-hot={!touched}>
        <g>
          <Box {...KEY} r={10} />
        </g>
      </Press>
    </Plate>
  )
}

const HUB = { x: 0, y: 70, z: 0, w: 56, d: 40, h: 20 }
const LAMP = { x: 110, y: 0, z: 0, w: 34, d: 34, h: 30 }
const WIRE = curve([HUB.x + HUB.w, HUB.y + 20, 1], [HUB.x + HUB.w + 40, HUB.y + 20, 1], [LAMP.x + 17, LAMP.y + LAMP.d + 40, 1], [LAMP.x + 17, LAMP.y + LAMP.d, 1])

function SignalExample() {
  const [sent, setSent] = useState(0)
  const [lit, setLit] = useState(false)
  const timer = useRef(0)
  useEffect(() => () => window.clearTimeout(timer.current), [])
  const send = () => {
    setSent(sent + 1)
    setLit(false)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => {
      setLit(true)
      playSound("done")
    }, 420)
  }
  return (
    <Plate hint="Press the hub" readout={sent ? (lit ? `delivered · ${sent}` : "sending") : "idle"} fit={[HUB, LAMP]} aspect={1.6} label="A hub wired to a lamp. Press the hub and a signal runs down the wire; the lamp lights when it arrives." data-lit={lit}>
      <Box {...LAMP} r={17} top={<circle className={lit ? "ik-dot" : "ik-fill"} cx={17} cy={17} r={6} />} />
      <path className="ik-line" d={path(WIRE)} />
      {sent ? <Signal key={sent} points={WIRE} delay={100} /> : null}
      <Press label="Send a signal" onPress={send} data-hot={!sent}>
        <g>
          <Box {...HUB} r={8} />
        </g>
      </Press>
    </Plate>
  )
}

const STACK = { w: 24, d: 24, h: 4, step: 5 }
const LEFT = { x: 0, y: 0 }
const RIGHT = { x: 70, y: 0 }
const MOVE = { x: 20, y: 44, z: 0, w: 50, d: 16, h: 5 }
const FLIGHT_MS = 520

const LEVELS = [0, 1, 2, 3, 4, 5] as const

function FlightExample() {
  const [left, setLeft] = useState(4)
  const [step, setStep] = useState(0)
  const [flying, setFlying] = useState(false)
  const right = LEVELS.length - left
  const move = () => {
    const canMove = left > 0
    setStep(step + 1)
    setFlying(canMove)
    setLeft(canMove ? left - 1 : LEVELS.length)
    playSound(canMove ? "done" : "whoosh", canMove ? { delay: FLIGHT_MS / 1000 } : undefined)
  }
  const coin = (x: number, level: number, on: boolean, delay: number) => (
    <g key={`${x}-${level}`} className="example-coin" data-on={on} style={{ "--t": `${delay}ms` } as CSSProperties}>
      <Box x={x} y={0} z={level * STACK.step} w={STACK.w} d={STACK.d} h={STACK.h} r={STACK.w / 2} />
    </g>
  )
  return (
    <Plate hint={left ? "Press move" : "Press to refill"} readout={`${left} left · ${right} right`} fit={[MOVE, { x: 0, y: 0, z: 0, w: 94, d: 24, h: 60 }]} aspect={1.6} label="Two stacks of coins. Press move and a coin flies from the left stack onto the right one.">
      {LEVELS.map((level) => coin(LEFT.x, level, level < left, 0))}
      {LEVELS.map((level) => coin(RIGHT.x, level, level < right, flying && level === right - 1 ? FLIGHT_MS : 0))}
      <Press label={left ? "Move a coin" : "Refill the left stack"} onPress={move} data-hot={step === 0}>
        <g>
          <Box
            {...MOVE}
            r={6}
            top={
              <text className="ik-label" x={6} y={11}>
                MOVE
              </text>
            }
          />
        </g>
      </Press>
      {flying ? (
        <Flight key={step} from={[LEFT.x, LEFT.y, left * STACK.step]} to={[RIGHT.x, RIGHT.y, (right - 1) * STACK.step]} duration={FLIGHT_MS}>
          <Box x={LEFT.x} y={LEFT.y} z={left * STACK.step} w={STACK.w} d={STACK.d} h={STACK.h} r={STACK.w / 2} />
        </Flight>
      ) : null}
    </Plate>
  )
}

function SoundToggleExample() {
  return (
    <div className="example-row">
      <SoundToggle className="pill" />
      <span>Remembers the reader's choice in localStorage.</span>
    </div>
  )
}

const CUBE = { x: 0, y: 0, z: 0, w: 60, d: 60, h: 40 }
const CORD = curve([60, 30, 1], [100, 30, 1], [100, 90, 1], [140, 90, 1])

function GeometryExample() {
  return (
    <Plate role="img" hint="x down-right · y down-left · z up" readout="true isometric" fit={[CUBE, [140, 90, 0], [0, 0, 60]]} aspect={1.6} label="A box with a word drawn on each of its three planes and a cable leaving its side.">
      <path className="ik-line" d={path(CORD)} />
      <Box {...CUBE} r={6} />
      <g transform={top(CUBE.x, CUBE.y, CUBE.h)}>
        <text className="ik-label" x={10} y={34}>
          top()
        </text>
      </g>
      <g transform={front(CUBE.x, CUBE.y + CUBE.d, CUBE.h)}>
        <text className="ik-label" x={8} y={24}>
          front()
        </text>
      </g>
      <g transform={side(CUBE.x + CUBE.w, CUBE.y + CUBE.d, CUBE.h)}>
        <text className="ik-label" x={8} y={24}>
          side()
        </text>
      </g>
    </Plate>
  )
}

export const EXAMPLES: Readonly<Record<string, ComponentType>> = {
  plate: PlateExample,
  box: BoxExample,
  press: PressExample,
  "use-demo-tap": ReplayDemo,
  cursor: ReplayDemo,
  ripple: RippleExample,
  signal: SignalExample,
  flight: FlightExample,
  "sound-toggle": SoundToggleExample,
  geometry: GeometryExample,
}
