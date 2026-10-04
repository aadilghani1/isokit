import { useEffect, useState } from "react"
import { Box, configureSound, Plate, Press, playSound, SoundToggle } from "react-isokit"
import { ApprovalPad } from "./figures/ApprovalPad"
import { DeskComputer } from "./figures/DeskComputer"
import { EdgeBox } from "./figures/EdgeBox"
import { PagePress } from "./figures/PagePress"
import { Mark } from "./Mark"

configureSound({ defaultOn: true, storageKey: "isokit-demo:sound" })

const SNIPPET = `import { Box, Plate, Press } from "react-isokit"
import "react-isokit/styles.css"

const key = { x: 0, y: 0, z: 0, w: 60, d: 60, h: 14 }

export function Button() {
  const [n, setN] = useState(0)
  return (
    <Plate label="A key" fit={[key]} readout={\`pressed \${n}×\`}>
      <Press label="Press the key" onPress={() => setN(n + 1)}>
        <g><Box {...key} r={10} /></g>
      </Press>
    </Plate>
  )
}`

function Copy({ text }: { text: string }) {
  const [done, setDone] = useState(false)
  const copy = () => {
    navigator.clipboard?.writeText(text).then(() => { setDone(true); playSound("toggle"); window.setTimeout(() => setDone(false), 1400) }, () => {})
  }
  return <button type="button" className="command" onClick={copy} aria-label={`Copy ${text}`}>
    <span aria-hidden="true">$</span><code>{text}</code><span className="copied" aria-live="polite">{done ? "copied" : "copy"}</span>
  </button>
}

function ThemeToggle() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"))
  useEffect(() => { document.documentElement.classList.toggle("dark", dark) }, [dark])
  return <button type="button" className="pill" onClick={() => setDark(!dark)} aria-pressed={dark}>{dark ? "Dark" : "Light"}</button>
}

const KEY = { x: 0, y: 0, z: 0, w: 60, d: 60, h: 14 }

function TinyKey() {
  const [n, setN] = useState(0)
  return <Plate label="A single key" fit={[KEY]} aspect={1.5} readout={`pressed ${n}×`} hint="Press it">
    <Press label="Press the key" onPress={() => setN(n + 1)}>
      <g><Box {...KEY} r={10} /></g>
    </Press>
  </Plate>
}

export function App() {
  return <>
    <header className="bar">
      <a className="brand" href="./"><svg viewBox="-10 -11 20 22" width="18" height="20" aria-hidden="true"><Mark className="mark" /></svg>isokit</a>
      <nav>
        <a href="https://github.com/aadilghani1/isokit#readme">Docs</a>
        <a href="https://github.com/aadilghani1/isokit">GitHub</a>
        <a href="https://www.npmjs.com/package/react-isokit">npm</a>
        <SoundToggle className="pill" />
        <ThemeToggle />
      </nav>
    </header>

    <main>
      <section className="hero">
        <h1>Isometric figures<br />you can press.</h1>
        <p>Rounded boxes, faces you can draw on, keys that click back and sound you can hear. A small React kit with no dependencies, and a Claude Code skill that draws with it.</p>
        <div className="commands">
          <Copy text="npm i react-isokit" />
          <Copy text="npx skills add aadilghani1/isokit" />
        </div>
      </section>

      <figure className="wide"><DeskComputer /></figure>

      <div className="grid">
        <figure><ApprovalPad /><figcaption><strong>Approval pad</strong><span>Allow or deny an agent, with a light that waits.</span></figcaption></figure>
        <figure><PagePress /><figcaption><strong>Page press</strong><span>Blocks click into place, lowest first.</span></figcaption></figure>
        <figure><EdgeBox /><figcaption><strong>Edge box</strong><span>Folders lift; the box reads them offline.</span></figcaption></figure>
      </div>

      <section className="howto">
        <div>
          <h2>Twelve lines to a key.</h2>
          <p>Describe boxes in world units. <code>Plate</code> frames them, <code>Box</code> draws one with rounded corners and faces you can draw on, and <code>Press</code> makes it sink and click. Paint back to front and you are done.</p>
          <pre><code>{SNIPPET}</code></pre>
        </div>
        <div className="tiny"><TinyKey /></div>
      </section>
    </main>

    <footer>
      <span>MIT · made by <a href="https://github.com/aadilghani1">Aadil Ghani</a></span>
      <span>Standing on <a href="https://hairline.lucasmarkes.com">Hairline</a> and <a href="https://github.com/MrBongoC/ai-iso-skill">iso-figure</a>.</span>
    </footer>
  </>
}
