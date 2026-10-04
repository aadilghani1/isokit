<div align="center">

<img src="docs/mark.svg" width="44" height="48" alt="" />

# isokit

**Isometric figures you can press.**

Rounded boxes, faces you can draw on, keys that click back, and sound you can hear.<br />
A small React kit with no dependencies, and a Claude Code skill that draws with it.

[![npm](https://img.shields.io/npm/v/react-isokit?color=161616&label=npm)](https://www.npmjs.com/package/react-isokit)
[![size](https://img.shields.io/badge/core-3.4%20kB-161616)](#performance)
[![CI](https://github.com/aadilghani1/isokit/actions/workflows/ci.yml/badge.svg)](https://github.com/aadilghani1/isokit/actions/workflows/ci.yml)
[![license](https://img.shields.io/github/license/aadilghani1/isokit?color=161616)](LICENSE)
[![Claude Code skill](https://img.shields.io/badge/Claude%20Code-skill-161616)](#the-skill)

[**Live demo**](https://aadilghani1.github.io/isokit/) · [Quick start](#quick-start) · [API](#api) · [Skill](#the-skill)

<a href="https://aadilghani1.github.io/isokit/"><img src="docs/demo.gif" width="880" alt="A desk computer typing a prompt, an approval pad allowing an agent, a webpage whose blocks drop into place, and a box reading a folder, all drawn as isometric line figures" /></a>

</div>

## Why

Most product illustrations are pictures. These are objects: the key goes down when you press it and comes back up when you let go, the screen says what happened, and you can hear it. isokit gives you the few pieces that make that easy, so a figure is a list of boxes, not an afternoon in a design tool.

- **Real isometric.** True 30° projection, no perspective, no WebGL. Plain SVG that stays crisp at any size.
- **Draw on faces, not polygons.** Every face takes ordinary `<rect>`, `<path>` and `<text>` in its own flat coordinates. Screens, labels and vents land in projection for free.
- **Presses that feel physical.** Down on press, up on release, acts on release. Pointer, touch, Enter and Space.
- **Sound, done properly.** Twelve synthesized interaction sounds, no audio files, loaded only when someone reaches for a figure, silent until the page opts in.
- **Light on the page.** 3.4 kB core, the sound engine is a separate 1.5 kB chunk, loops sleep offscreen, server rendering works.

## Quick start

```sh
npm i react-isokit
```

```tsx
import { useState } from "react"
import { Box, Plate, Press } from "react-isokit"
import "react-isokit/styles.css"

const key = { x: 0, y: 0, z: 0, w: 60, d: 60, h: 14 }

export function Key() {
  const [n, setN] = useState(0)
  return (
    <Plate label="A key you can press" fit={[key]} readout={`pressed ${n}×`}>
      <Press label="Press the key" onPress={() => setN(n + 1)}>
        <g><Box {...key} r={10} /></g>
      </Press>
    </Plate>
  )
}
```

That is a working, accessible, keyboard-operable key that sinks and springs back. Add `configureSound({ defaultOn: true })` once, and it clicks.

## How it works

**World space.** +x runs down-right, +y runs down-left, +z runs up, all 120° apart. A box is its back-left-bottom corner and its size: `{ x, y, z, w, d, h }`. Units are yours; `Plate` scales the result to fit.

**Paint order is depth.** There is no depth buffer: later shapes cover earlier ones. Emit back to front: smaller `x + y` first, lower `z` first, and for a grid, rows by `y` then columns by `x`.

**Faces are flat.** `Box` takes `top`, `front` and `side` children, each drawn in that face's own coordinates:

| Face | Faces toward | Local x | Local y | Origin |
| --- | --- | --- | --- | --- |
| `top` | up | along +x | along +y | back-left corner |
| `front` | lower-left | along +x | down | top-left corner |
| `side` | lower-right | front edge → back | down | top-front corner |

```tsx
<Box x={0} y={0} z={0} w={150} d={48} h={46} r={8}
  front={<>
    <rect className="ik-screen" x={9} y={8} width={106} height={30} rx={4} />
    <text className="ik-screen-text" x={15} y={30} fontSize={9.5}>Deploy preview?</text>
  </>}
/>
```

## API

### Components

#### `<Plate>`

The numbered plate a figure sits on, and the `<svg>` it is drawn in.

| Prop | Type | |
| --- | --- | --- |
| `label` | `string` | Required. The accessible name: what it is and how to use it. |
| `fit` | `Array<Box3 \| Vec3>` | Boxes and points to frame. Fit the most extreme pose your figure takes. |
| `aspect` | `number` | Width / height of the drawing. Default `1.25`. |
| `pad` | `number` | Padding around `fit`, as a share of its size. Default `0.07`. |
| `viewBox` | `string` | Your own viewBox instead of `fit`. |
| `fig`, `name`, `hint`, `readout` | `ReactNode` | The four corner captions. `readout` is announced to screen readers. |
| `theme` | `"light" \| "dark" \| "system"` | Unset follows a `.dark` or `[data-theme="dark"]` ancestor. |

Any other prop goes to the `<svg>`, so `data-*` attributes there can drive your CSS.

#### `<Box>`

A rounded box. Its outline is the hull of its rounded top and foot, so no vertical corner is drawn; its right side is tinted darker and its lid is lightest.

`x, y, z, w, d, h` (required), `r` (corner radius), `top`, `front`, `side` (drawn on that face), `className`, `children` (drawn after it).

#### `<Press>`

A part you can press. It goes down on press, comes up on release, and calls `onPress` on release. Wrap the boxes that should sink in one `<g>` inside it.

`label` (required), `onPress` (required), `sound` (default `true`), `disabled`, `className`. Add the class `ik-lift` for parts that lift instead of sinking.

#### `<SoundToggle>`

A small switch for interaction sound that remembers the reader's choice. Takes any `<button>` prop; its children replace the "Sound" label.

### Functions

| Function | |
| --- | --- |
| `frame(fit, aspect?, pad?)` | A viewBox around boxes and points. |
| `project(x, y, z)` | A world point on screen. |
| `top(x, y, z)`, `front(x, y, z)`, `side(x, y, z)` | SVG `transform` strings for drawing on a plane yourself. |
| `path(points)` | An open path through world points: cables, guides, wires. |
| `outline(box, r)` | The outline path of a rounded box. |
| `corners(box)`, `hull(points)`, `radius(box, r)` | The geometry underneath. |

### Sound

| | |
| --- | --- |
| `configureSound({ defaultOn, storageKey, volume })` | Sound is **off** until the page turns it on. |
| `playSound(name, options?)` | Plays a sound if sound is on; returns a `stop()` for sounds a newer action should cut short. |
| `primeSound()` | Starts loading the engine. `Plate` calls it when a pointer or focus arrives. |
| `useSoundEnabled()` | `[on, setOn]`. |
| `soundPreference` | The store, shaped for `useSyncExternalStore`. |

**The palette:** `press`, `release`, `toggle`, `boot`, `success`, `error`, `notify`, `complete`, `cascade`, `whoosh`, `paper`, `process`, `done`. `cascade` takes `{ count, stagger, delay }` so its steps land in time with your animation.

## Styling

Everything is drawn with a few classes and coloured by `--ik-*` custom properties, all at zero specificity, so your CSS always wins.

| Class | For |
| --- | --- |
| `ik-face`, `ik-top`, `ik-tint` | Solids (what `Box` uses). |
| `ik-detail` | Dim inner lines: seams, vents, text lines. |
| `ik-line` | Structure-weight lines: cables, rails. |
| `ik-live` | The one bright stroke: whatever is live right now. |
| `ik-dash` | Dotted construction guides. |
| `ik-well`, `ik-fill`, `ik-dot` | Recesses, solid marks, a bright dot. |
| `ik-screen`, `ik-screen-text`, `ik-screen-line` | Displays and what they show. |
| `ik-label` | Small engraved labels. |
| `ik-enter`, `ik-pulse`, `ik-blink`, `ik-float`, `ik-loop` | Ready-made motion; loops sleep offscreen. |

Restyle with `--ik-panel`, `--ik-top`, `--ik-front`, `--ik-side`, `--ik-well`, `--ik-line`, `--ik-detail`, `--ik-live`, `--ik-ink`, `--ik-ink-hi`, `--ik-screen`, `--ik-screen-ink`, `--ik-screen-font`, `--ik-border`, `--ik-ease` and `--ik-spring`.

## Performance

- **3.4 kB** for `Plate`, `Box`, `Press` and the math, minified and brotlied. **1.4 kB** of CSS.
- **Sound costs nothing until it is used.** The 1.5 kB engine is a separate chunk fetched when a pointer or focus reaches a plate; no `AudioContext` exists until the first press, and it is suspended again after four quiet seconds.
- **Loops sleep offscreen.** Each plate watches itself with one `IntersectionObserver`.
- **Server rendering.** Everything renders to static SVG; the package ships `"use client"` for the Next.js App Router.
- **Reduced motion** lands every transition at once and stops every loop.

## Accessibility

Every plate is an image with your `label`. Every `Press` is a focusable button with its own label; Enter and Space work like a real key, and focus shows as the live stroke. The read-out is a polite live region. Sound is never the only feedback.

## The skill

isokit ships a skill that teaches Claude Code (and Codex, Cursor and other agents that read skills) to draw interactive figures with it: decide what pressing produces, lay out the boxes, paint back to front, wire the presses and sounds, then screenshot and check its own work.

```sh
npx skills add aadilghani1/isokit
```

Or as a Claude Code plugin:

```
/plugin marketplace add aadilghani1/isokit
/plugin install isokit@isokit
```

Then ask for a figure:

```
/isokit a kitchen timer with minute buttons and a display that counts down
```

## Examples

<img src="docs/figures.gif" width="880" alt="An approval pad allowing a request, a page press publishing a page as its blocks drop into place, and an edge box reading a folder" />

The demo's four figures are in [`examples/demo/src/figures`](examples/demo/src/figures): a desk computer you can type on, an approval pad, a page whose blocks drop into place and a box that reads folders. Run them with `npm run dev`.

## Contributing

Issues and pull requests are welcome; see [CONTRIBUTING.md](CONTRIBUTING.md). Please keep to the [code of conduct](CODE_OF_CONDUCT.md).

## Credits

isokit stands on [Hairline](https://hairline.lucasmarkes.com) by Lucas Marques and [iso-figure](https://github.com/MrBongoC/ai-iso-skill) by Tolga Cohce, both MIT. See [NOTICE.md](NOTICE.md) for what came from where.

## License

[MIT](LICENSE) © [Aadil Ghani](https://github.com/aadilghani1)
