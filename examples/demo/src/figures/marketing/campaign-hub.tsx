import { useEffect, useRef, useState } from "react"
import { Box, Cursor, curve, Plate, Press, path, playSound, Ripple, Signal, useDemoTap, type Vec3 } from "react-isokit"
import type { FigureMeta } from "../../catalog/figure-meta"
import "./campaign-hub.css"

export const meta = {
  slug: "campaign-hub",
  title: "Campaign hub",
  industry: "marketing",
  level: 4,
  blurb: "Press launch: one campaign runs down three cables and each channel lights up in its own format.",
  uses: ["Plate", "Box", "Press", "Signal", "Ripple", "Cursor", "useDemoTap", "curve", "path"],
  sounds: ["cascade", "whoosh"],
} satisfies FigureMeta

type Channel = "feed" | "search" | "video"
type Screen = { channel: Channel; name: string; format: string; x: number; w: number; h: number; screen: number; hubX: number; arrive: number }
type Guide = "fresh" | "launched" | "explored"

const BASE = { x: 0, y: 0, z: 0, w: 190, d: 132, h: 8 }
const STAND = { y: 18, d: 6 }
const HUB = { x: 47, y: 80, z: BASE.h, w: 96, d: 40, h: 26 }
const KEY = { x: 73, y: 90, z: BASE.h + HUB.h, w: 44, d: 20, h: 4 }
const GROUND = BASE.h + 0.6
const TRAVEL_MS = 300
const SCREENS: readonly Screen[] = [
  { channel: "feed", name: "Social", format: "feed post", x: 8, w: 52, h: 60, screen: 46, hubX: 76, arrive: 300 },
  { channel: "search", name: "Search", format: "search ad", x: 70, w: 58, h: 44, screen: 30, hubX: 95, arrive: 450 },
  { channel: "video", name: "Video", format: "9:16 video", x: 140, w: 36, h: 66, screen: 53, hubX: 114, arrive: 600 },
]
const FIRST = SCREENS[0] as Screen

function cable(screen: Screen): Vec3[] {
  const center = screen.x + screen.w / 2
  const front = STAND.y + STAND.d
  return curve([screen.hubX, HUB.y, GROUND], [screen.hubX, HUB.y - 26, GROUND], [center, front + 26, GROUND], [center, front, GROUND])
}
const CABLES: Readonly<Record<Channel, Vec3[]>> = { feed: cable(SCREENS[0] as Screen), search: cable(SCREENS[1] as Screen), video: cable(SCREENS[2] as Screen) }

function Placement({ channel }: { channel: Channel }) {
  switch (channel) {
    case "feed":
      return (
        <>
          <circle className="ik-fill" cx={8} cy={9} r={2} />
          <path className="ik-detail" d="M12 9h14" />
          <rect className="ik-well" x={6} y={14} width={40} height={24} rx={1.5} />
          <path className="ik-detail" d="M7 37l10-9 7 6 6-5 15 8M6 42.5h30M6 46h20" />
        </>
      )
    case "search":
      return (
        <>
          <rect className="ik-fill" x={7} y={8} width={8} height={4.5} rx={1} />
          <path className="ik-detail" d="M18 10.3h20" />
          <rect className="ik-fill" x={7} y={15.5} width={40} height={4} rx={2} />
          <path className="ik-detail" d="M7 24.5h42M7 28.5h30" />
        </>
      )
    case "video":
      return (
        <>
          <rect className="ik-well" x={5} y={5} width={26} height={49} rx={2} />
          <path className="ik-line" d="M15 24l7 4.5-7 4.5z" />
          <path className="ik-detail" d="M8 46h14M8 49.5h10" />
        </>
      )
  }
}

export default function CampaignHub() {
  const [live, setLive] = useState(false)
  const [focus, setFocus] = useState<Channel | null>(null)
  const [guide, setGuide] = useState<Guide>("fresh")
  const [launches, setLaunches] = useState(0)
  const stop = useRef(() => {})
  useEffect(() => () => stop.current(), [])

  const launch = (audible: boolean) => {
    stop.current()
    if (audible) stop.current = live ? playSound("whoosh") : playSound("cascade", { count: SCREENS.length, stagger: 0.15, delay: 0.3 })
    if (!live) setLaunches(launches + 1)
    setLive(!live)
    setFocus(null)
  }
  const demo = useDemoTap(() => {
    if (!live) launch(false)
  }, { delay: 600 })
  const pressLaunch = () => {
    demo.dismiss()
    setGuide(guide === "explored" ? "explored" : "launched")
    launch(true)
  }
  const pressScreen = (channel: Channel) => {
    demo.dismiss()
    setGuide("explored")
    setFocus(channel)
  }

  const suggested = live && guide !== "explored" ? FIRST : null
  const hot = focus ?? suggested?.channel ?? null
  const focused = SCREENS.find((screen) => screen.channel === focus)
  const readout = focused ? `${focused.name.toLowerCase()} · ${focused.format} · ${live ? "live" : "ready"}` : live ? `live on ${SCREENS.length} channels` : `draft · ${SCREENS.length} channels`

  return (
    <Plate
      {...demo.plate}
      fig="Marketing"
      name="Campaign hub"
      hint={live ? "Press a channel" : "Press launch"}
      readout={readout}
      className="fig-campaign-hub"
      data-live={live}
      data-focus={focus ?? undefined}
      fit={[BASE, { x: 8, y: STAND.y, z: 0, w: 168, d: STAND.d, h: BASE.h + 66 }, { ...KEY, h: KEY.h + 2 }]}
      aspect={1.3}
      label="A campaign hub wired to three channel screens. Press launch to send the campaign to every channel, or press a screen to see its format."
    >
      <g ref={demo.ref}>
        <Box
          {...BASE}
          r={12}
          top={SCREENS.map((screen) => (
            <rect key={screen.channel} className="ik-well" x={screen.x - 2} y={STAND.y - 2} width={screen.w + 4} height={STAND.d + 4} rx={2} />
          ))}
        />
        {SCREENS.map((screen) => (
          <Press key={screen.channel} label={`Show the ${screen.name.toLowerCase()} placement`} onPress={() => pressScreen(screen.channel)} data-hot={hot === screen.channel}>
            <g>
              <Box
                x={screen.x}
                y={STAND.y}
                z={BASE.h}
                w={screen.w}
                d={STAND.d}
                h={screen.h}
                r={2.5}
                front={
                  <>
                    <rect className="ik-screen" x={3} y={3} width={screen.w - 6} height={screen.screen} rx={2.5} />
                    {live ? (
                      <g key={launches} className="ik-enter" style={{ animationDelay: `${screen.arrive}ms` }}>
                        <Placement channel={screen.channel} />
                        <circle className="dot" cx={screen.w - 7} cy={7} r={1.7} style={{ animationDelay: `${screen.arrive}ms` }} />
                      </g>
                    ) : (
                      <rect className="ik-dash" x={7} y={7} width={screen.w - 14} height={screen.screen - 8} rx={2} />
                    )}
                    <text className="ik-label name" x={screen.w / 2} y={screen.screen + 10.5} textAnchor="middle">
                      {screen.name.toUpperCase()}
                    </text>
                  </>
                }
              />
            </g>
          </Press>
        ))}
        {SCREENS.map((screen) => (
          <g key={screen.channel} className="wire" data-focus={focus === screen.channel} style={{ transitionDelay: `${screen.arrive}ms` }}>
            <path className="ik-dash draft" d={path(CABLES[screen.channel])} />
            <path className="ik-line solid" d={path(CABLES[screen.channel])} />
          </g>
        ))}
        {live
          ? SCREENS.map((screen) => <Signal key={`${launches}-${screen.channel}`} points={CABLES[screen.channel]} delay={screen.arrive - TRAVEL_MS} duration={TRAVEL_MS} />)
          : null}
        <Box
          {...HUB}
          r={8}
          top={<rect className="ik-detail" x={4} y={4} width={HUB.w - 8} height={HUB.d - 8} rx={5} />}
          front={
            <>
              <g className="glyph">
                <circle className="ik-line" cx={15} cy={13} r={2.6} />
                <path className="ik-detail" d="M9.5 7.5a8 8 0 0 0 0 11M20.5 7.5a8 8 0 0 1 0 11" />
              </g>
              <rect className="ik-screen" x={28} y={5} width={52} height={16} rx={3} />
              <g key={`${live}-${focus ?? "all"}`} className="ik-enter">
                <text className="ik-screen-text ik-dim" x={32} y={11} fontSize={4}>
                  {focused ? `${focused.name.toLowerCase()} · ${live ? "live" : "ready"}` : `campaign · ${live ? "live" : "draft"}`}
                </text>
                <text className="ik-screen-text" x={32} y={18.4} fontSize={6}>
                  {focused ? focused.format : live ? "3 channels" : "ready"}
                </text>
              </g>
              <circle className="hub-light ik-loop" cx={84.5} cy={9.5} r={1.6} />
            </>
          }
        />
        {suggested && demo.phase !== "aim" && demo.phase !== "press" ? <Ripple x={suggested.x - 2} y={STAND.y - 2} z={BASE.h} w={suggested.w + 4} d={STAND.d + 4} r={2} /> : null}
        {guide === "fresh" && !live && demo.phase !== "aim" && demo.phase !== "press" ? <Ripple {...KEY} r={5} /> : null}
        <Press label={live ? "Pause the campaign" : "Launch the campaign on every channel"} onPress={pressLaunch} data-hot={!live && !focus}>
          <g>
            <Box
              {...KEY}
              r={5}
              top={
                <text className="ik-label key" x={5} y={12.6}>
                  LAUNCH
                </text>
              }
            />
          </g>
        </Press>
        <Cursor at={[KEY.x + KEY.w / 2, KEY.y + KEY.d / 2, KEY.z + KEY.h]} phase={demo.phase} />
      </g>
    </Plate>
  )
}
