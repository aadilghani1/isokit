import { describe, expect, it } from "vitest"
import { corners, frame, front, hull, outline, path, project, radius, side, top } from "../src/iso"

const near = (a: number, b: number) => expect(a).toBeCloseTo(b, 6)

describe("project", () => {
  it("puts the origin at the origin", () => expect(project(0, 0, 0)).toEqual([0, 0]))
  it("runs +x down-right and +y down-left at 30°", () => {
    const [x1, y1] = project(1, 0, 0)
    const [x2, y2] = project(0, 1, 0)
    near(Math.atan2(y1, x1), Math.PI / 6)
    near(Math.atan2(y2, x2), Math.PI - Math.PI / 6)
  })
  it("runs +z straight up, unscaled", () => expect(project(0, 0, 10)).toEqual([0, -10]))
  it("never shrinks with distance", () => {
    const a = project(0, 0, 0), b = project(10, 0, 0), c = project(100, 0, 0), d = project(110, 0, 0)
    near(b[0] - a[0], d[0] - c[0])
  })
})

describe("planes", () => {
  // matrices are written to three decimals, so compare to two
  const close = (a: number, b: number) => expect(a).toBeCloseTo(b, 2)
  const apply = (m: string, x: number, y: number) => {
    const [a, b, c, d, e, f] = m.slice(7, -1).split(" ").map(Number)
    return [a * x + c * y + e, b * x + d * y + f]
  }
  it("top maps local (u, v) to world (x + u, y + v, z)", () => {
    const [sx, sy] = apply(top(5, 6, 7), 3, 4)
    const [ex, ey] = project(8, 10, 7)
    close(sx, ex); close(sy, ey)
  })
  it("front maps local (u, v) to world (x + u, y, z − v)", () => {
    const [sx, sy] = apply(front(5, 6, 7), 3, 4)
    const [ex, ey] = project(8, 6, 3)
    close(sx, ex); close(sy, ey)
  })
  it("side maps local (u, v) to world (x, y − u, z − v)", () => {
    const [sx, sy] = apply(side(5, 6, 7), 3, 4)
    const [ex, ey] = project(5, 3, 3)
    close(sx, ex); close(sy, ey)
  })
})

describe("frame", () => {
  const box = { x: 0, y: 0, z: 0, w: 100, d: 60, h: 40 }
  it("holds the aspect ratio", () => {
    const [, , w, h] = frame([box], 1.25).split(" ").map(Number)
    near(w / h, 1.25)
  })
  it("contains every corner", () => {
    const [x, y, w, h] = frame([box], 1.25).split(" ").map(Number)
    for (const c of corners(box)) {
      const [sx, sy] = project(...c)
      expect(sx).toBeGreaterThanOrEqual(x); expect(sx).toBeLessThanOrEqual(x + w)
      expect(sy).toBeGreaterThanOrEqual(y); expect(sy).toBeLessThanOrEqual(y + h)
    }
  })
  it("accepts loose points and survives nothing", () => {
    expect(frame([[0, 0, 0], [10, 10, 10]])).toMatch(/^-?[\d.]+ -?[\d.]+ [\d.]+ [\d.]+$/)
    expect(frame([])).toBe("0 0 100 100")
  })
})

describe("solids", () => {
  it("hull keeps only the outside", () => {
    const pts = hull([[0, 0], [10, 0], [10, 10], [0, 10], [5, 5]])
    expect(pts).toHaveLength(4)
  })
  it("outline is one closed path", () => {
    const d = outline({ x: 0, y: 0, z: 0, w: 40, d: 30, h: 10 }, 6)
    expect(d.startsWith("M")).toBe(true)
    expect(d.endsWith("Z")).toBe(true)
    expect(d.split("M")).toHaveLength(2)
  })
  it("radius is cut to half the shorter side", () => {
    expect(radius({ x: 0, y: 0, z: 0, w: 10, d: 40, h: 5 }, 20)).toBe(5)
    expect(radius({ x: 0, y: 0, z: 0, w: 10, d: 40, h: 5 }, -1)).toBe(0)
  })
  it("path needs two points", () => {
    expect(path([[0, 0, 0]])).toBe("")
    expect(path([[0, 0, 0], [1, 0, 0]])).toMatch(/^M0 0L/)
  })
})
