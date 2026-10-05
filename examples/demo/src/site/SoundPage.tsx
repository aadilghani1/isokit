import { type ReactNode, useEffect, useRef, useState } from "react"
import { playSound, type SoundName, useSoundEnabled } from "react-isokit"
import { SoundBoard } from "../figures/SoundBoard"
import { FIGURES } from "./registry"
import { href } from "./route"

type SoundDoc = { name: SoundName; feel: string; when: string; seconds: number }

const SOUNDS: readonly SoundDoc[] = [
  { name: "press", feel: "A short click on a low thump.", when: "A part goes down. Press plays it for you.", seconds: 0.1 },
  { name: "release", feel: "A lighter tick, a touch higher.", when: "A part comes back up. Press plays it for you.", seconds: 0.1 },
  { name: "toggle", feel: "A soft two-step click.", when: "Something switches on or off: a flag, a mode, the sound switch itself.", seconds: 0.1 },
  { name: "boot", feel: "One warm chord, slow to fade.", when: "A device wakes up. Use it once, never on a loop.", seconds: 1.4 },
  { name: "success", feel: "Two bright bells, the second higher.", when: "A request is allowed or a job succeeds.", seconds: 0.6 },
  { name: "error", feel: "A low, short buzz.", when: "Something is denied or fails. Pair it with what to do next.", seconds: 0.35 },
  { name: "notify", feel: "Two small, high bells, like a notification across the room.", when: "Something new arrived: a lead, a message, the next request.", seconds: 0.3 },
  { name: "complete", feel: "A short resolving phrase.", when: "The last step of a sequence lands: all channels live, all items done.", seconds: 0.7 },
  { name: "cascade", feel: "Rising tocks, then a small bell.", when: "Several parts land one after another. Match count, stagger and delay to the motion.", seconds: 1 },
  { name: "whoosh", feel: "A short breath of air.", when: "Something is undone or flies away: unpublish, eject, reset.", seconds: 0.4 },
  { name: "paper", feel: "A crisp rustle.", when: "A document, folder or card is picked up.", seconds: 0.2 },
  { name: "process", feel: "A faint hum under a few quiet ticks.", when: "Work is happening for a moment. Keep its stop() and cut it when the work ends.", seconds: 0.6 },
  { name: "done", feel: "Two soft bells, small and warm.", when: "A short piece of work finished: a part seated, a file read.", seconds: 0.4 },
]

function SoundRow({ sound, focused }: { sound: SoundDoc; focused: boolean }): ReactNode {
  const [playing, setPlaying] = useState(false)
  const timer = useRef(0)
  useEffect(() => () => window.clearTimeout(timer.current), [])
  const play = () => {
    playSound(sound.name)
    setPlaying(true)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setPlaying(false), sound.seconds * 1000)
  }
  const figures = FIGURES.filter((figure) => figure.sounds.includes(sound.name))
  return (
    <li id={`sound-${sound.name}`} className="sound-row" data-focused={focused || undefined}>
      <button type="button" className="sound-play" onClick={play} aria-pressed={playing} aria-label={`Play ${sound.name}`}>
        <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
          <path d="M5 3.5v9l7-4.5z" fill="currentColor" />
        </svg>
      </button>
      <div>
        <h3>
          <code>{sound.name}</code> <span>{sound.seconds}s</span>
        </h3>
        <p>
          {sound.feel} {sound.when}
        </p>
        {figures.length ? (
          <ul className="chips">
            {figures.map((figure) => (
              <li key={figure.slug}>
                <a href={href("figures", figure.slug)}>{figure.title}</a>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </li>
  )
}

export function SoundPage({ focus }: { focus: string | undefined }): ReactNode {
  const [on, setOn] = useSoundEnabled()
  useEffect(() => {
    if (focus) document.getElementById(`sound-${focus}`)?.scrollIntoView({ block: "center" })
  }, [focus])
  return (
    <main className="page">
      <header className="page-head">
        <p className="eyebrow">Sound design · 13 sounds · 1.6 kB engine</p>
        <h1>Thirteen sounds, no files.</h1>
        <p className="lede">Each sound is synthesized in the browser from a shaped tone and a band of noise. The engine loads when a pointer first reaches a figure, nothing plays until the page opts in, and every sound answers something the reader did.</p>
        {on ? null : (
          <button type="button" className="pill" onClick={() => setOn(true)}>
            Sound is off · turn it on
          </button>
        )}
      </header>
      <div className="sound-stage">
        <SoundBoard />
      </div>
      <section className="figure-section" aria-labelledby="palette">
        <div className="section-head">
          <h2 id="palette">The palette</h2>
          <p>What each sound feels like, when to reach for it, and the figures that use it.</p>
        </div>
        <ol className="sound-list">
          {SOUNDS.map((sound) => (
            <SoundRow key={sound.name} sound={sound} focused={focus === sound.name} />
          ))}
        </ol>
      </section>
      <section className="figure-section" aria-labelledby="rules">
        <div className="section-head">
          <h2 id="rules">Four rules</h2>
        </div>
        <ul className="notes">
          <li>Sound follows the reader: play only what they caused, at the moment the visual change happens. A demo press is silent.</li>
          <li>Quiet by default: nothing plays until the page calls configureSound or the reader presses a SoundToggle.</li>
          <li>Cut stale sounds: keep the stop() a sound returns and call it when a newer action replaces it.</li>
          <li>Never the only feedback: every sound has a visible change and a read-out beside it.</li>
        </ul>
      </section>
    </main>
  )
}
