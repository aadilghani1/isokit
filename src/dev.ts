import type * as Schemas from "./schema"

/**
 * Development-only checks. Bundlers replace `process.env.NODE_ENV`; with no
 * bundler, isokit assumes production. In production every `check` returns at
 * once and the schemas are never loaded, so they cost nothing.
 */
export const DEV: boolean = (() => {
  try {
    return process.env.NODE_ENV !== "production"
  } catch {
    return false
  }
})()

export type Checked = "box" | "fit" | "plate" | "soundName" | "soundOptions" | "soundConfig"

let schemas: Promise<typeof Schemas> | null = null
const told = new Set<string>()

const pick = (s: typeof Schemas, kind: Checked) =>
  ({
    box: s.box3Schema,
    fit: s.fitSchema,
    plate: s.plateFrameSchema,
    soundName: s.soundNameSchema,
    soundOptions: s.soundOptionsSchema,
    soundConfig: s.soundConfigSchema,
  })[kind]

/** In development, checks a value against its schema and warns once for each distinct problem. */
export function check(kind: Checked, value: unknown, where: string): void {
  if (!DEV) return
  schemas ??= import("./schema")
  schemas.then(
    (s) => {
      const result = pick(s, kind).safeParse(value)
      if (result.success) return
      const text = `react-isokit: ${where}\n${s.describe(result.error)}`
      if (told.has(text)) return
      told.add(text)
      console.warn(text)
    },
    () => {},
  )
}
