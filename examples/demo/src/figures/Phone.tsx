import { useEffect, useRef, useState } from "react"
import { Box, curve, Plate, Press, path, playSound } from "react-isokit"
import "./Phone.css"

/**
 * Fig 7, a phone in its dock: an agent has stopped to ask for permission and
 * the question is waiting on the lock screen, counting the seconds. Approve
 * it and the agent is unblocked; the next question arrives a moment later.
 * This is what Pushary does for real.
 */

type Ask = { agent: string; action: string; detail: string }
const ASKS: readonly Ask[] = [
  { agent: "Claude Code", action: "wants to run", detail: "npm install" },
  { agent: "Codex", action: "wants to push", detail: "3 commits → main" },
  { agent: "Cursor", action: "wants to edit", detail: "payments.ts" },
]
const DOCK = { x: 0, y: 0, z: 0, w: 96, d: 60, h: 8 }
const PHONE = { x: 12, y: 24, z: 8, w: 72, d: 7, h: 128 }
const CABLE = path(curve([48, 0, 3], [50, -24, 1.4], [80, -10, 1.4], [92, -42, 1.4]))
const CHECK = "M0 3.4l2.4 2.4L7.4.8"

type Phase = "waiting" | "approved" | "denied"

export function Phone() {
  const [at, setAt] = useState(0)
  const [phase, setPhase] = useState<Phase>("waiting")
  const [seconds, setSeconds] = useState(0)
  const host = useRef<HTMLDivElement>(null)
  const timer = useRef(0)
  const visible = useRef(false)

  // The waiting clock ticks only while someone can see it.
  useEffect(() => {
    const el = host.current
    if (!el) return
    const io = new IntersectionObserver((entries) => {
      visible.current = entries.some((e) => e.isIntersecting)
    })
    io.observe(el)
    const tick = window.setInterval(() => {
      if (visible.current) setSeconds((s) => s + 1)
    }, 1000)
    return () => {
      io.disconnect()
      window.clearInterval(tick)
      window.clearTimeout(timer.current)
    }
  }, [])

  const ask = ASKS[at % ASKS.length] ?? ASKS[0]
  if (!ask) return null
  const answer = (approve: boolean) => {
    if (phase !== "waiting") return
    setPhase(approve ? "approved" : "denied")
    playSound(approve ? "success" : "error")
    timer.current = window.setTimeout(() => {
      setAt(at + 1)
      setPhase("waiting")
      setSeconds(0)
      playSound("notify")
    }, 2200)
  }
  const waited = `${seconds}s`
  const readout = phase === "waiting" ? `${ask.agent.toLowerCase()} · waiting ${waited}` : phase === "approved" ? `unblocked after ${waited}` : "denied · agent stopped"

  return (
    <div ref={host}>
      <Plate
        fig="Fig 7"
        name="Phone"
        hint="Tap approve"
        readout={readout}
        className="phone"
        data-phase={phase}
        fit={[DOCK, PHONE, [92, -42, 0]]}
        aspect={0.92}
        pad={0.06}
        label="A phone in a dock showing a request from a coding agent. Tap approve to unblock the agent."
      >
        <path className="ik-line" d={CABLE} />
        <Box {...DOCK} r={14} top={<rect className="ik-well" x={14} y={22} width={68} height={11} rx={4} />} />
        <Box
          {...PHONE}
          r={3.5}
          front={
            <>
              <rect className="ik-screen" x={3} y={3} width={66} height={122} rx={8} />
              <rect className="ik-fill" x={28} y={6} width={16} height={3.4} rx={1.7} />
              <text className="ik-screen-text clock" x={36} y={24} fontSize={10} textAnchor="middle">
                9:41
              </text>
              <g key={`${at}-${phase}`} className="ik-enter">
                <rect className="card" x={6} y={34} width={60} height={phase === "waiting" ? 44 : 30} rx={6} />
                <rect className="app" x={10} y={38} width={8} height={8} rx={2.2} />
                <text className="ik-screen-text" x={21} y={41.5} fontSize={4.6}>
                  {ask.agent}
                </text>
                <text className="ik-screen-text ik-dim" x={21} y={46} fontSize={3.4}>
                  via Pushary · now
                </text>
                {phase === "waiting" ? (
                  <>
                    <text className="ik-screen-text" x={10} y={54} fontSize={4.2}>
                      {ask.action}
                    </text>
                    <text className="ik-screen-text" x={10} y={59.5} fontSize={4.2}>
                      {ask.detail}
                    </text>
                    <Press className="ik-lift tap" label="Deny" onPress={() => answer(false)} sound={false}>
                      <g>
                        <rect className="button" x={10} y={65} width={24} height={9} rx={4.5} />
                        <text className="ik-screen-text" x={22} y={71} fontSize={4} textAnchor="middle">
                          Deny
                        </text>
                      </g>
                    </Press>
                    <Press className="ik-lift tap" label="Approve" onPress={() => answer(true)} data-hot={true}>
                      <g>
                        <rect className="button primary" x={38} y={65} width={24} height={9} rx={4.5} />
                        <text className="ik-screen-text approve" x={50} y={71} fontSize={4} textAnchor="middle">
                          Approve
                        </text>
                      </g>
                    </Press>
                  </>
                ) : (
                  <>
                    {phase === "approved" && <path className="ik-screen-line" d={CHECK} transform="translate(10 52.5)" />}
                    <text className="ik-screen-text" x={phase === "approved" ? 20 : 10} y={57.5} fontSize={4.6}>
                      {phase === "approved" ? "Approved · back to work" : "Denied · agent stopped"}
                    </text>
                  </>
                )}
              </g>
              <rect className="ik-fill" x={26} y={118} width={20} height={1.6} rx={0.8} />
            </>
          }
        />
      </Plate>
    </div>
  )
}
