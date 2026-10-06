import { type CSSProperties, type ReactNode, type RefObject, type SVGProps, useEffect, useRef, useState } from "react"
import { classNames } from "../class-names"
import { check, DEV } from "../development-checks"
import { canObserveIntersection } from "../environment"
import { frame } from "../geometry/framing"
import type { Box3, Vec3 } from "../schema"
import { primeSound } from "../sound/sound-player"

export type PlateProps = {
  label: string
  fit?: ReadonlyArray<Box3 | Vec3>
  aspect?: number
  pad?: number
  viewBox?: string
  fig?: ReactNode
  name?: ReactNode
  hint?: ReactNode
  readout?: ReactNode
  credit?: boolean
  theme?: "light" | "dark" | "system"
  className?: string
  style?: CSSProperties
  children?: ReactNode
} & Omit<SVGProps<SVGSVGElement>, "viewBox" | "children" | "className" | "style" | "fit" | "name">

const NEAR_VIEWPORT: IntersectionObserverInit = { rootMargin: "80px" }

function useNearViewport(): [RefObject<HTMLDivElement | null>, boolean] {
  const plate = useRef<HTMLDivElement>(null)
  const [near, setNear] = useState(false)
  useEffect(() => {
    const element = plate.current
    if (!element || !canObserveIntersection()) {
      setNear(true)
      return
    }
    const observer = new IntersectionObserver((entries) => setNear(entries.some((entry) => entry.isIntersecting)), NEAR_VIEWPORT)
    observer.observe(element)
    return () => observer.disconnect()
  }, [])
  return [plate, near]
}

export function Plate({ label, fit, aspect = 1.25, pad = 0.07, viewBox, fig, name, hint, readout, credit = true, theme, className, style, children, ...svg }: PlateProps): ReactNode {
  const [plate, awake] = useNearViewport()
  if (DEV && !viewBox && !fit?.length) check("fit", undefined, `<Plate label="${label}"> needs a fit (boxes or points) or a viewBox`)
  const box = viewBox ?? frame(fit ?? [], aspect, pad)
  const hasHeader = fig != null || name != null
  const hasFooter = hint !== undefined || readout !== undefined
  return (
    <div ref={plate} className={classNames("ik-plate", className)} style={style} data-theme={theme} data-awake={awake || undefined} onPointerEnter={primeSound} onFocusCapture={primeSound}>
      {hasHeader && (
        <div className="ik-cap">
          <span className="ik-cap-hi">{fig}</span>
          <span>{name}</span>
        </div>
      )}
      <svg viewBox={box} role="group" aria-label={label} {...svg}>
        {children}
      </svg>
      {(hasFooter || credit) && (
        <div className="ik-footer">
          {hasFooter && (
            <div className="ik-cap">
              <span>{hint}</span>
              <span className="ik-cap-hi" aria-live="polite">
                {readout}
              </span>
            </div>
          )}
          {credit && <a className="ik-credit" href="https://pushary.com/?utm_source=isokit&utm_medium=referral&utm_campaign=figure-credit" target="_blank" rel="noopener noreferrer">Made with isokit · pushary.com</a>}
        </div>
      )}
    </div>
  )
}
