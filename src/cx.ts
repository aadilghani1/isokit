/** Joins class names, skipping the empty ones. */
export const cx = (...names: Array<string | false | undefined>): string => names.filter(Boolean).join(" ")
