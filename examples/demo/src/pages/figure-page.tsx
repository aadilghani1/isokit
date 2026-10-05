import type { ReactNode } from "react"
import { href } from "../app/route-store"
import { docSlugForExport } from "../catalog/component-docs"
import { type FigureEntry, figureBySlug } from "../catalog/figure-registry"
import { INDUSTRIES } from "../catalog/industries"
import { FiguresPage, LevelBadge } from "./figures-page"

const VARIATIONS = [
  { id: "default", title: "Default", className: "" },
  { id: "paper", title: "Paper", className: "theme-paper" },
  { id: "blueprint", title: "Blueprint", className: "theme-blueprint" },
  { id: "phosphor", title: "Phosphor", className: "theme-phosphor" },
  { id: "dark", title: "Dark", className: "dark" },
] as const

const INDUSTRY_TITLES: ReadonlyMap<string, string> = new Map(INDUSTRIES.map((industry) => [industry.id, industry.title]))

function BuiltFrom({ figure }: { figure: FigureEntry }): ReactNode {
  return (
    <ul className="chips" aria-label="Built from">
      {figure.uses.map((name) => (
        <li key={name}>
          <a href={href("components", docSlugForExport(name))}>
            <code>{name}</code>
          </a>
        </li>
      ))}
    </ul>
  )
}

function FigureSounds({ figure }: { figure: FigureEntry }): ReactNode {
  if (!figure.sounds.length) return null
  return (
    <section className="figure-section" aria-labelledby="sounds">
      <div className="section-head">
        <h2 id="sounds">Sounds</h2>
        <p>
          Played only for the reader's own presses. <a href={href("sound")}>Hear every sound</a>.
        </p>
      </div>
      <ul className="chips">
        {figure.sounds.map((sound) => (
          <li key={sound}>
            <a href={href("sound", sound)}>
              <code>{sound}</code>
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}

function FigureDetail({ figure }: { figure: FigureEntry }): ReactNode {
  const { Figure } = figure
  return (
    <main className="page">
      <header className="page-head">
        <p className="eyebrow">
          <a href={href("figures")}>Figures</a> · {INDUSTRY_TITLES.get(figure.industry)} · <a href={href("studio")}>studio</a>
        </p>
        <h1>{figure.title}</h1>
        <p className="lede">{figure.blurb}</p>
        <LevelBadge level={figure.level} />
        <BuiltFrom figure={figure} />
      </header>
      <div className="figure-stage">
        <Figure />
      </div>
      <section className="figure-section" aria-labelledby="variations">
        <div className="section-head">
          <h2 id="variations">Variations</h2>
          <p>The same component under different themes. Nothing in it changes: every colour comes from the --ik-* properties.</p>
        </div>
        <div className="variation-grid">
          {VARIATIONS.map((variation) => (
            <figure key={variation.id} className={variation.className}>
              <Figure />
              <figcaption>
                <strong>{variation.title}</strong>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>
      <FigureSounds figure={figure} />
    </main>
  )
}

export function FigurePage({ slug }: { slug: string }): ReactNode {
  const figure = figureBySlug.get(slug)
  return figure ? <FigureDetail key={figure.slug} figure={figure} /> : <FiguresPage />
}
