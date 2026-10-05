import type { ReactNode } from "react"
import { classNames } from "../class-names"
import { top } from "../geometry/projection"
import { cornerRadius } from "../geometry/rounded-outline"
import type { Box3 } from "../schema"

export type RippleProps = Omit<Box3, "h"> & {
  r?: number | undefined
  className?: string | undefined
}

export function Ripple({ x, y, z, w, d, r = 0, className }: RippleProps): ReactNode {
  return (
    <g transform={top(x, y, z)}>
      <g className={classNames("ik-ripple ik-loop", className)}>
        <rect width={w} height={d} rx={cornerRadius(w, d, r)} />
      </g>
    </g>
  )
}
