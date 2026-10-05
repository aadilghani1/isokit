import { type ReactNode, useState } from "react"
import { componentSlug } from "./docs"
import { CATEGORIES, FIGURES, type FigureCategory, type FigureEntry, figureBySlug } from "./registry"
import { href } from "./route"

const VARIATIONS = [
  { id: "default", title: "Default", className: "" },
  { id: "paper", title: "Paper", className: "theme-paper" },
  { id: "blueprint", title: "Blueprint", className: "theme-blueprint" },
  { id: "phosphor", title: "Phosphor", className: "theme-phosphor" },
  { id: "dark", title: "Dark", className: "dark" },
] as const

function Chips({ figure }: { figure: FigureEntry }): ReactNode {
  return (
    <ul className="chips" aria-label="Built from">
      {figure.uses.map((name) => (
        <li key={name}>
          <a href={href("components", componentSlug(name))}>
            <code>{name}</code>
          </a>
        </li>
      ))}
    </ul>
  )
}

function FigureCard({ figure }: { figure: FigureEntry }): ReactNode {
  const { Figure } = figure
  return (
    <figure className="figure-card">
      <Figure />
      <figcaption>
        <a href={href("figures", figure.slug)}>
          <strong>{figure.title}</strong>
        </a>
        <span>{figure.blurb}</span>
      </figcaption>
    </figure>
  )
}

function FigureIndex(): ReactNode {
  const [category, setCategory] = useState<FigureCategory | "all">("all")
  const shown = CATEGORIES.filter((c) => category === "all" || c.id === category)
  return (
    <main className="page">
      <header className="page-head">
        <p className="eyebrow">Figures · {FIGURES.length}</p>
        <h1>Press any of them.</h1>
        <p className="lede">Every figure here is a plain React component built from the kit. Each one shows you what to press, presses it once for you when it first comes into view, and then hands it over.</p>
        <div className="filters" role="group" aria-label="Category">
          {[{ id: "all" as const, title: "All" }, ...CATEGORIES].map((c) => (
            <button key={c.id} type="button" className="pill" aria-pressed={category === c.id} onClick={() => setCategory(c.id)}>
              {c.title}
            </button>
          ))}
        </div>
      </header>
      {shown.map((c) => {
        const figures = FIGURES.filter((figure) => figure.category === c.id)
        if (!figures.length) return null
        return (
          <section key={c.id} className="figure-section" aria-labelledby={`cat-${c.id}`}>
            <div className="section-head">
              <h2 id={`cat-${c.id}`}>{c.title}</h2>
              <p>{c.blurb}</p>
            </div>
            <div className="figure-grid">
              {figures.map((figure) => (
                <FigureCard key={figure.slug} figure={figure} />
              ))}
            </div>
          </section>
        )
      })}
    </main>
  )
}

function FigureDetail({ figure }: { figure: FigureEntry }): ReactNode {
  const { Figure } = figure
  const category = CATEGORIES.find((c) => c.id === figure.category)
  return (
    <main className="page">
      <header className="page-head">
        <p className="eyebrow">
          <a href={href("figures")}>Figures</a> · {category?.title}
        </p>
        <h1>{figure.title}</h1>
        <p className="lede">{figure.blurb}</p>
        <Chips figure={figure} />
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
      {figure.sounds.length ? (
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
      ) : null}
    </main>
  )
}

export function FiguresPage({ slug }: { slug: string | undefined }): ReactNode {
  const figure = figureBySlug(slug)
  return figure ? <FigureDetail key={figure.slug} figure={figure} /> : <FigureIndex />
}
