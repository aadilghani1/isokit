import { useEffect, useRef, useState } from "react"
import { Box, Plate, Press, playSound, project } from "react-isokit"
import "./approval-pad.css"
import type { FigureMeta } from "../../catalog/figure-meta"

type Request = { agent: string; where: string; ask: string }
const QUEUE: readonly Request[] = [
  { agent: "claude code", where: "portfolio/main", ask: "Deploy preview?" },
  { agent: "codex", where: "api/staging", ask: "Run migration?" },
  { agent: "cursor", where: "web · 3 commits", ask: "Push to main?" },
  { agent: "claude code", where: "scripts/cleanup", ask: "Delete 2 files?" },
]
const BASE = { x: 0, y: 0, z: 0, w: 150, d: 124, h: 14 }
const RISER = { x: 0, y: 0, z: 14, w: 150, d: 48, h: 46 }
const ALLOW = { x: 10, y: 60, z: 14, w: 82, d: 52, h: 9 }
const DENY = { x: 100, y: 60, z: 14, w: 40, d: 52, h: 9 }
const MAST = { x: 126, y: 8, z: 60, w: 8, d: 8, h: 24 }
const [TX, TY] = project(MAST.x + 4, MAST.y + 4, MAST.z + MAST.h + 4)
const CHECK = "M0 5.5l3.6 3.6L11 1.5"
const CROSS = "M1 1l7.5 7.5M8.5 1L1 8.5"

type Phase = "waiting" | "allowed" | "denied"

export function ApprovalPad() {
  const [at, setAt] = useState(0)
  const [phase, setPhase] = useState<Phase>("waiting")
  const timer = useRef(0)
  useEffect(() => () => window.clearTimeout(timer.current), [])

  const request = QUEUE[at]
  const decide = (kind: "allow" | "deny") => {
    if (!request) {
      setAt(0)
      setPhase("waiting")
      playSound("notify")
      return
    }
    if (phase !== "waiting") return
    setPhase(kind === "allow" ? "allowed" : "denied")
    playSound(kind === "allow" ? "success" : "error")
    const next = at + 1
    timer.current = window.setTimeout(() => {
      setAt(next)
      setPhase("waiting")
      playSound(next >= QUEUE.length ? "complete" : "notify")
    }, 1500)
  }

  const decided = request !== undefined && phase !== "waiting"
  const [small, big, readout] = !request
    ? ["no agents waiting", "All clear.", "all clear · 0 waiting"]
    : phase === "allowed"
      ? ["agent back to work", "Approved", "allowed · back to work"]
      : phase === "denied"
        ? ["agent paused", "Denied", "denied · agent paused"]
        : [request.where, request.ask, `${request.agent} · ${QUEUE.length - at} waiting`]

  return (
    <Plate
      fig="Fig 2"
      name="Approval pad"
      hint="Allow or deny"
      readout={readout}
      className="approval"
      data-phase={request ? phase : "clear"}
      fit={[BASE, { ...RISER, z: 0, h: RISER.z + RISER.h }, [MAST.x, MAST.y, MAST.z + MAST.h + 10]]}
      aspect={1.18}
      label="An approval pad. An agent's request waits on its screen; press allow or deny to answer it."
    >
      <Box {...BASE} r={10} />
      <Box
        {...RISER}
        r={8}
        front={
          <>
            <rect className="ik-screen" x={9} y={8} width={106} height={30} rx={4} />
            <g key={`${at}-${phase}`} className="ik-enter">
              <text className="ik-screen-text ik-dim" x={15} y={18} fontSize={5.6}>
                {small}
              </text>
              {decided && <path className="ik-screen-line" d={phase === "allowed" ? CHECK : CROSS} transform="translate(15 23.5)" />}
              <text className="ik-screen-text" x={decided ? 30 : 15} y={32} fontSize={9.5}>
                {big}
              </text>
            </g>
            {QUEUE.map((r, i) => (
              <rect key={`${r.where}-${i}`} className="pip" data-on={i >= at} x={92 + i * 5} y={12} width={3} height={3} rx={0.6} />
            ))}
            <circle className="light ik-loop" cx={132} cy={13} r={2.4} />
            {Array.from({ length: 6 }, (_, i) => (
              <path key={i} className="ik-detail" d={`M${123.5 + i * 3.4} 21v16`} />
            ))}
          </>
        }
      />
      <Box {...MAST} r={4} />
      <circle className="ik-face ik-top" cx={TX} cy={TY} r={4.6} />
      {phase === "allowed" && (
        <g className="ping">
          {[0, 1, 2].map((i) => (
            <path key={i} className="ik-live" style={{ animationDelay: `${i * 120}ms` }} d={`M${TX - 8 - i * 5} ${TY - 3 - i * 3}a${10 + i * 6} ${10 + i * 6} 0 0 1 ${16 + i * 10} 0`} />
          ))}
        </g>
      )}

      <Press label="Allow the request" onPress={() => decide("allow")}>
        <g>
          <Box
            {...ALLOW}
            r={7}
            top={
              <>
                <text className="ik-label" x={12} y={30}>
                  ALLOW
                </text>
                <path className="ik-detail" d="M12 36h22" />
              </>
            }
          />
        </g>
      </Press>
      <Press label="Deny the request" onPress={() => decide("deny")}>
        <g>
          <Box
            {...DENY}
            r={7}
            top={
              <>
                <path className="ik-detail ik-thick" d={CROSS} transform="translate(9 14) scale(1.1)" />
                <text className="ik-label" x={8} y={40}>
                  DENY
                </text>
              </>
            }
          />
        </g>
      </Press>
    </Plate>
  )
}

export const meta = {
  slug: "approval-pad",
  title: "Approval pad",
  industry: "agents",
  level: 2,
  blurb: "An agent request waits on the screen; press allow or deny and the next one arrives.",
  uses: ["Plate", "Box", "Press"],
  sounds: ["success", "error", "notify", "complete"],
} satisfies FigureMeta

export default ApprovalPad
