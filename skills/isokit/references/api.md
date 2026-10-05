# react-isokit API, for agents

```tsx
import { Box, Plate, Press, SoundToggle, configureSound, playSound, path, project, top, front, side, type Box3, type Vec3 } from "react-isokit"
import "react-isokit/styles.css"   // once, at the app root
```

## World

- `+x` runs down-right, `+y` down-left, `+z` up. True isometric, no perspective.
- A box is `{ x, y, z, w, d, h }`: its back-left-bottom corner and its size along x, y and z.
- `project(x, y, z)` gives the screen point `[sx, sy]` in viewBox units.

## `<Plate label fit aspect pad viewBox fig name hint readout theme>`

The plate and its `<svg>`, a group named by `label` (required; pass `role="img"` for a figure with nothing to press). `fit` takes boxes and `[x, y, z]` points and frames them; `aspect` is width over height (default 1.25). `fig`, `name`, `hint`, `readout` are the four corner captions; `readout` is a polite live region. Any other prop lands on the `<svg>`: put state there as `data-*` attributes and style descendants from CSS (`.my-figure svg[data-live="true"] .block { … }`). `theme`: unset follows a `.dark` / `[data-theme="dark"]` ancestor, or `"light"`, `"dark"`, `"system"`.

## `<Box x y z w d h r className top front side>`

A rounded box: hull outline, darker right side, lighter lid. `r` is the footprint corner radius. `top`, `front`, `side` are drawn on those faces in flat local coordinates:

| Face | Looks | Local x | Local y | Origin |
| --- | --- | --- | --- | --- |
| `top` | up | +x | +y | back-left corner, at z + h |
| `front` | lower-left | +x | down (−z) | top-left corner of the y + d face |
| `side` | lower-right | from the front edge toward −y | down (−z) | top-front corner of the x + w face |

`children` are drawn after the box in screen space.

## `<Press label onPress sound disabled className>`

A focusable button part. Wrap exactly one `<g>` holding the boxes that move: `<Press …><g><Box …/></g></Press>`. It sets `data-down` while held; the `<g>` sinks 3px and every face inside turns live. Add `className="ik-lift"` for parts that should lift rather than sink, and style `.ik-lift[data-down="true"] > g` yourself. `sound={false}` silences the press clicks (play your own instead). Extra props, `data-*` included, land on the `<g role="button">`.

## Planes, for drawing outside a box

`top(x, y, z)`, `front(x, y, z)`, `side(x, y, z)` return a `transform` string. `<g transform={front(…)}>…</g>` puts anything in that plane. Never put a CSS `transform` on an element that has a `transform` attribute: wrap it in another `<g>` and move that.

`path([[x, y, z], …])` is an open path through world points, for cables and guides; give it the class `ik-line`. `curve(a, b, c, d, steps)` returns points along a cubic Bézier, so a cable is `path(curve(…))`.

## Classes

`ik-face` `ik-top` `ik-tint` (solids) · `ik-detail` (dim lines) · `ik-line` (structure lines) · `ik-live` (the one bright stroke) · `ik-dash` (guides) · `ik-well` (recesses) · `ik-fill` (solid marks) · `ik-dot` (bright dot) · `ik-screen` `ik-screen-text` `ik-screen-line` (displays) · `ik-label` (engraved text) · `ik-thick` (heavier stroke) · `ik-dim` (half strength) · `ik-enter` `ik-pulse` `ik-blink` `ik-float` `ik-loop` (motion).

Custom properties: `--ik-panel --ik-top --ik-front --ik-side --ik-well --ik-line --ik-detail --ik-live --ik-ink --ik-ink-hi --ik-screen --ik-screen-ink --ik-screen-font --ik-border --ik-ease --ik-spring`.

Size `ik-label` text with CSS `font-size`, not the `fontSize` attribute: the class sets a `font` shorthand, and CSS wins over presentation attributes.

## Validation

All input types come from zod schemas in `react-isokit/schema` (`box3Schema`, `vec3Schema`, `fitSchema`, `soundConfigSchema`, `soundOptionsSchema`, `soundNameSchema`, `describe`). In development the components warn in the console about bad boxes, frames and sounds: read the console when you check a figure, and fix every `react-isokit:` warning. If a figure's data comes from JSON or another tool, validate it with the schemas before drawing.

## Sound

- Off until the app calls `configureSound({ defaultOn: true })` once, or the reader presses a `<SoundToggle />`.
- `playSound(name, options?)` returns `stop()`. Names: `press release toggle boot success error notify complete cascade whoosh paper process done`.
- `playSound("cascade", { count, stagger, delay })` lands `count` rising tocks `stagger` seconds apart starting at `delay`, then a small bell: match it to a staggered CSS animation.
- Sounds asked for before the reader has interacted with the page are dropped, never queued.
