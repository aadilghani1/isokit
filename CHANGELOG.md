# react-isokit

## 0.2.1

### Patch Changes

- [#10](https://github.com/aadilghani1/isokit/pull/10) [`a313c70`](https://github.com/aadilghani1/isokit/commit/a313c709217f8eceb4b6c290662b9210d8c577e6) Thanks [@aadilghani1](https://github.com/aadilghani1)! - Production builds no longer run the development checks. The library was built for the browser platform, which inlined `process.env.NODE_ENV` at build time, so every app loaded the zod schemas and validated each box on every render. The published code now leaves `process.env.NODE_ENV` for your bundler, and a post-build check keeps it that way.
  
  Also:
  
  - A `Press` held from the keyboard comes back up when focus leaves it, instead of staying down.
  - `Plate` renders its svg as a labelled `group` instead of an `img`, since an image's children are presentational and a figure holds buttons. Pass `role="img"` for a figure with nothing to press.
  - A host page's `:focus-visible` outline no longer draws a misplaced box around a focused part; focus shows as the live stroke.
  - Looping animations sleep offscreen even when a figure sets its own `animation` shorthand.

## 0.2.0

### Minor Changes

- [`73b449d`](https://github.com/aadilghani1/isokit/commit/73b449d684294082dbb60acb77cb6764af87c904) Thanks [@aadilghani1](https://github.com/aadilghani1)! - Runtime validation and a stricter type setup.
  
  - New `react-isokit/schema` entry: zod schemas for boxes, points, framing and sound settings (`box3Schema`, `vec3Schema`, `fitSchema`, `soundConfigSchema`, `soundOptionsSchema`, `soundNameSchema`) and a readable `describe(error)`. Every public type is now inferred from them.
  - In development, `Plate`, `Box`, `frame`, `playSound` and `configureSound` check what they are given and explain problems once in the console. Production builds skip the checks entirely and clamp bad input instead of breaking.
  - New `curve(a, b, c, d, steps)` helper for cables and rails.
  - Built with tsdown; the type setup now uses `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`, with type tests.

## 0.1.0

First release.

- `Plate`, `Box` and `Press`: frame a figure, draw rounded boxes with faces you can draw on, and make parts that press like real keys.
- `frame`, `project`, `top`, `front`, `side`, `path`, `outline`: the isometric geometry underneath.
- Thirteen synthesized interaction sounds, off until a page opts in, loaded only on intent, and suspended when idle.
- A Claude Code skill, `isokit`, that draws interactive figures with the kit and checks them in a browser.
