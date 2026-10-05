import type { ComponentType } from "react"
import type { SoundName } from "react-isokit"

export type FigureCategory = "saas" | "deeptech" | "marketing" | "agents"

/** What every figure file exports next to its default component, so the gallery can find and describe it. */
export type FigureMeta = {
  /** Unique, kebab-case: the figure's URL is #/figures/<slug>. */
  slug: string
  title: string
  category: FigureCategory
  /** One sentence: what you press and what it produces. */
  blurb: string
  /** The library pieces it is built from, as exported names: "Press", "Signal", "useDemoTap"... */
  uses: readonly string[]
  /** The sounds it plays, so the sound page can point to it. */
  sounds: readonly SoundName[]
}

export type FigureEntry = FigureMeta & { Figure: ComponentType }

type FigureModule = { meta?: FigureMeta; default?: ComponentType }

export const CATEGORIES: ReadonlyArray<{ id: FigureCategory; title: string; blurb: string }> = [
  { id: "saas", title: "SaaS", blurb: "Deploys, billing, flags, keys, webhooks and the dashboards around them." },
  { id: "deeptech", title: "Deep tech", blurb: "Compute, chips, energy, robots and the instruments that run them." },
  { id: "marketing", title: "Marketing", blurb: "Channels, pages, budgets and campaigns, explained by pressing them." },
  { id: "agents", title: "Agents", blurb: "The figures that started isokit: computers, approvals and phones." },
]

const order = (category: FigureCategory) => CATEGORIES.findIndex((c) => c.id === category)
const modules = import.meta.glob<FigureModule>("../figures/**/*.tsx", { eager: true })

export const FIGURES: readonly FigureEntry[] = Object.values(modules)
  .flatMap((module) => (module.meta && module.default ? [{ ...module.meta, Figure: module.default }] : []))
  .sort((a, b) => order(a.category) - order(b.category) || a.title.localeCompare(b.title))

export const figureBySlug = (slug: string | undefined): FigureEntry | undefined => FIGURES.find((figure) => figure.slug === slug)
