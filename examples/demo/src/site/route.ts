import { useSyncExternalStore } from "react"

const subscribe = (onChange: () => void) => {
  window.addEventListener("hashchange", onChange)
  return () => window.removeEventListener("hashchange", onChange)
}

/** The hash route as path segments: "#/figures/gpu-rack" is ["figures", "gpu-rack"]. */
export function useRoute(): readonly string[] {
  const hash = useSyncExternalStore(subscribe, () => window.location.hash, () => "")
  return hash.replace(/^#\/?/, "").split("/").filter(Boolean)
}

/** A link to a route that works under any base path. */
export const href = (...segments: readonly string[]) => `#/${segments.join("/")}`
