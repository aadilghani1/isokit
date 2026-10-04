---
"react-isokit": minor
---

Runtime validation and a stricter type setup.

- New `react-isokit/schema` entry: zod schemas for boxes, points, framing and sound settings (`box3Schema`, `vec3Schema`, `fitSchema`, `soundConfigSchema`, `soundOptionsSchema`, `soundNameSchema`) and a readable `describe(error)`. Every public type is now inferred from them.
- In development, `Plate`, `Box`, `frame`, `playSound` and `configureSound` check what they are given and explain problems once in the console. Production builds skip the checks entirely and clamp bad input instead of breaking.
- New `curve(a, b, c, d, steps)` helper for cables and rails.
- Built with tsdown; the type setup now uses `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`, with type tests.
