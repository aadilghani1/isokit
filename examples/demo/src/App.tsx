import { useState } from "react"
import { Box, Plate, Press, playSound } from "react-isokit"
import { ApprovalPad } from "./figures/ApprovalPad"
import { DeskComputer } from "./figures/DeskComputer"
import { EdgeBox } from "./figures/EdgeBox"
import { PagePress } from "./figures/PagePress"
import { Phone } from "./figures/Phone"
import { SoundBoard } from "./figures/SoundBoard"
import { TallyCounter } from "./figures/TallyCounter"
import { PUSHARY_HOME, SiteFooter, SiteHeader } from "./site/SiteChrome"

const PUSHARY = "https://pushary.com/sign-up?from=agent&utm_source=isokit&utm_medium=referral&utm_campaign=landing"

const SNIPPET = `import { useState } from "react"
import { Box, Plate, Press } from "react-isokit"
import "react-isokit/styles.css"

const key = { x: 0, y: 0, z: 0, w: 60, d: 60, h: 14 }

export function Key() {
  const [n, setN] = useState(0)
  return (
    <Plate label="A key" fit={[key]} readout={\`pressed \${n}×\`}>
      <Press label="Press the key" onPress={() => setN(n + 1)}>
        <g><Box {...key} r={10} /></g>
      </Press>
    </Plate>
  )
}`

function Copy({ text, label }: { text: string; label?: string }) {
  const [done, setDone] = useState(false)
  const copy = () => {
    navigator.clipboard?.writeText(text).then(
      () => {
        setDone(true)
        playSound("toggle")
        window.setTimeout(() => setDone(false), 1400)
      },
      () => {},
    )
  }
  return (
    <button type="button" className="command" onClick={copy} aria-label={`Copy ${label ?? text}`}>
      <span aria-hidden="true">$</span>
      <code>{text}</code>
      <span className="copied" aria-live="polite">
        {done ? "copied" : "copy"}
      </span>
    </button>
  )
}

const KEY = { x: 0, y: 0, z: 0, w: 60, d: 60, h: 14 }

function TinyKey() {
  const [n, setN] = useState(0)
  return (
    <Plate label="A single key" fit={[KEY]} aspect={1.5} readout={`pressed ${n}×`} hint="Press it">
      <Press label="Press the key" onPress={() => setN(n + 1)}>
        <g>
          <Box {...KEY} r={10} />
        </g>
      </Press>
    </Plate>
  )
}

const STEPS: ReadonlyArray<{ title: string; body: string; command?: string }> = [
  { title: "Teach your agent", body: "Add the isokit skill. Claude Code, Codex, Cursor and any agent that reads skills can use it.", command: "npx skills add aadilghani1/isokit" },
  { title: "Add the kit to your app", body: "One package, one stylesheet. Server rendering and the App Router work out of the box.", command: "npm i react-isokit" },
  { title: "Ask for a figure", body: "Name an object and what pressing it should do. The skill decides the output first, then lays out the boxes.", command: "/isokit a coffee grinder with a dial that sets the grind" },
  { title: "It draws, looks and fixes", body: "Your agent writes the component, screenshots it in light and dark at desktop and phone width, and fixes what it sees." },
  { title: "Approve from your phone", body: "When it stops to install a package or start the dev server, Pushary sends the question to your phone. Tap approve and it keeps working." },
]

export function App() {
  return (
    <>
      <SiteHeader />

      <main>
        <section className="hero">
          <p className="eyebrow">react-isokit · MIT · 2.5 kB core</p>
          <h1>
            Isometric figures
            <br />
            you can press.
          </h1>
          <p className="lede">Rounded boxes, faces you can draw on, keys that click back and sound you can hear. A small React kit, and a skill your coding agent uses to draw with it.</p>
          <div className="commands">
            <Copy text="npm i react-isokit" />
            <Copy text="npx skills add aadilghani1/isokit" />
          </div>
          <p className="maker">
            Made by the maker of{" "}
            <a href={PUSHARY_HOME} target="_blank" rel="noopener">
              Pushary
            </a>
            , the control panel that unblocks your coding agents from your phone.
          </p>
        </section>

        <figure className="wide">
          <DeskComputer />
        </figure>

        <div className="grid">
          <figure>
            <ApprovalPad />
            <figcaption>
              <strong>Approval pad</strong>
              <span>Allow or deny an agent, with a light that waits.</span>
            </figcaption>
          </figure>
          <figure>
            <PagePress />
            <figcaption>
              <strong>Page press</strong>
              <span>Blocks click into place, lowest first.</span>
            </figcaption>
          </figure>
          <figure>
            <EdgeBox />
            <figcaption>
              <strong>Edge box</strong>
              <span>Folders lift; the box reads them offline.</span>
            </figcaption>
          </figure>
        </div>

        <section className="split">
          <div>
            <p className="eyebrow">Sound</p>
            <h2>Thirteen sounds, no files.</h2>
            <p>Every sound is synthesized in the browser from a shaped tone and a band of noise. The engine is a 1.6 kB chunk fetched when someone reaches for a figure, nothing plays until your page opts in, and the audio device is released after four quiet seconds.</p>
            <pre>
              <code>{`configureSound({ defaultOn: true })
playSound("cascade", { count: 4, stagger: 0.06 })`}</code>
            </pre>
          </div>
          <SoundBoard />
        </section>

        <section className="themes">
          <div className="section-head">
            <p className="eyebrow">Theming</p>
            <h2>Same figure, your colours.</h2>
            <p>Sixteen custom properties at zero specificity. Set them on any ancestor and the figure follows; it follows your dark mode on its own.</p>
          </div>
          <div className="grid">
            <div className="theme-paper">
              <TallyCounter theme="Paper" />
            </div>
            <div className="theme-blueprint">
              <TallyCounter theme="Blueprint" />
            </div>
            <div className="theme-phosphor">
              <TallyCounter theme="Phosphor" />
            </div>
          </div>
        </section>

        <section className="agent" id="agent">
          <div className="section-head">
            <p className="eyebrow">End to end</p>
            <h2>From a sentence to a figure, with your agent.</h2>
          </div>
          <ol className="steps">
            {STEPS.map((s, i) => (
              <li key={s.title}>
                <span className="n">{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <h3>{s.title}</h3>
                  <p>{s.body}</p>
                </div>
                {s.command ? <Copy text={s.command} /> : <span />}
              </li>
            ))}
          </ol>
        </section>

        <aside className="pushary" aria-labelledby="pushary-title">
          <div className="pushary-copy">
            <p className="eyebrow">
              From the maker of isokit · <span>Pushary</span>
            </p>
            <h2 id="pushary-title">Your agent froze, waiting for your yes.</h2>
            <p>Pushary sends the question to your phone. Tap approve and it keeps working, in Claude Code, Codex, Cursor, Windsurf, Gemini CLI or any MCP agent.</p>
            <ul className="plans">
              <li>
                <strong>Agent</strong>
                <span className="price">$9.99/mo</span>
                <span>5,000 notifications · 3-day free trial</span>
              </li>
              <li>
                <strong>Agent Pro</strong>
                <span className="price">$19.99/mo</span>
                <span>Unlimited · budgets · up to 5 users</span>
              </li>
            </ul>
            <div className="cta">
              <a className="button" href={PUSHARY} target="_blank" rel="noopener">
                Start your free trial →
              </a>
              <Copy text="npx pushary@latest setup" />
            </div>
            <p className="fine">Setup finds your agents and pairs your phone in under two minutes.</p>
          </div>
          <Phone />
        </aside>

        <section className="split code">
          <div>
            <p className="eyebrow">The whole API</p>
            <h2>Fifteen lines to a key.</h2>
            <p>
              Describe boxes in world units. <code>Plate</code> frames them, <code>Box</code> draws one with rounded corners and faces you can draw on, and <code>Press</code> makes it sink and click. Paint back to front and you are done. Bad input is
              explained in development by zod schemas you can also import yourself.
            </p>
            <pre>
              <code>{SNIPPET}</code>
            </pre>
          </div>
          <TinyKey />
        </section>
      </main>

      <SiteFooter />
    </>
  )
}
