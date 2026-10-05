import { useEffect, useState } from "react"
import { SoundToggle } from "react-isokit"
import { Mark } from "../Mark"
import { href } from "./route"

export const PUSHARY_HOME = "https://pushary.com/?utm_source=isokit&utm_medium=referral&utm_campaign=landing"

function ThemeToggle() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"))
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark)
  }, [dark])
  return (
    <button type="button" className="pill" onClick={() => setDark(!dark)} aria-pressed={dark}>
      {dark ? "Dark" : "Light"}
    </button>
  )
}

const LINKS = [
  { to: "figures", label: "Figures" },
  { to: "components", label: "Components" },
  { to: "sound", label: "Sound" },
] as const

export function SiteHeader({ current }: { current?: string }) {
  return (
    <header className="bar">
      <a className="brand" href={href()}>
        <svg viewBox="-10 -11 20 22" width="18" height="20" aria-hidden="true">
          <Mark className="mark" />
        </svg>
        isokit
      </a>
      <nav aria-label="Site">
        {LINKS.map((link) => (
          <a key={link.to} href={href(link.to)} aria-current={current === link.to ? "page" : undefined}>
            {link.label}
          </a>
        ))}
        <a href="https://github.com/aadilghani1/isokit">GitHub</a>
        <SoundToggle className="pill" />
        <ThemeToggle />
      </nav>
    </header>
  )
}

export function SiteFooter() {
  return (
    <footer>
      <span>
        MIT · made by <a href="https://github.com/aadilghani1">Aadil Ghani</a>, maker of{" "}
        <a href={PUSHARY_HOME} target="_blank" rel="noopener">
          Pushary
        </a>
      </span>
      <span>
        Standing on <a href="https://hairline.lucasmarkes.com">Hairline</a> and <a href="https://github.com/MrBongoC/ai-iso-skill">iso-figure</a>.
      </span>
    </footer>
  )
}
