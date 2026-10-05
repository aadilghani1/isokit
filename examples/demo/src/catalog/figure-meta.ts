import type * as Kit from "react-isokit"
import type { SoundName } from "react-isokit"
import type { IndustryId } from "./industries"
import type { LevelNumber } from "./levels"

export type KitExport = keyof typeof Kit

export type FigureMeta = {
  slug: string
  title: string
  industry: IndustryId
  level: LevelNumber
  blurb: string
  uses: readonly KitExport[]
  sounds: readonly SoundName[]
}
