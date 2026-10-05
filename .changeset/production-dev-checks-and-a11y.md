---
"react-isokit": patch
---

Production builds no longer run the development checks. The library was built for the browser platform, which inlined `process.env.NODE_ENV` at build time, so every app loaded the zod schemas and validated each box on every render. The published code now leaves `process.env.NODE_ENV` for your bundler, and a post-build check keeps it that way.

Also:

- A `Press` held from the keyboard comes back up when focus leaves it, instead of staying down.
- `Plate` renders its svg as a labelled `group` instead of an `img`, since an image's children are presentational and a figure holds buttons. Pass `role="img"` for a figure with nothing to press.
- A host page's `:focus-visible` outline no longer draws a misplaced box around a focused part; focus shows as the live stroke.
- Looping animations sleep offscreen even when a figure sets its own `animation` shorthand.
