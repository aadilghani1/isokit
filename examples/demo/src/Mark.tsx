/** The isokit mark: one isometric cube, its three faces lit from one side. */
export function Mark({ x = 0, y = 0, size = 10, className }: { x?: number; y?: number; size?: number; className?: string }) {
  const c = Math.cos(Math.PI / 6) * size, s = size / 2
  const topFace = `M0 ${-size}L${c} ${-s}L0 0L${-c} ${-s}Z`
  const left = `M${-c} ${-s}L0 0L0 ${size}L${-c} ${s}Z`
  const right = `M${c} ${-s}L0 0L0 ${size}L${c} ${s}Z`
  return <g className={className} transform={`translate(${x} ${y})`}>
    <path d={topFace} />
    <path d={left} opacity={0.72} />
    <path d={right} opacity={0.45} />
  </g>
}
