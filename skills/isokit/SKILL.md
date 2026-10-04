---
name: isokit
description: Draw an interactive isometric figure in React with react-isokit — a line-art object on a numbered plate whose parts you can press, that produce real output (text on a screen, a count, a state change) with optional synthesized sound. Use when someone asks for an isometric illustration, an "iso figure", a 2.5D product drawing, an interactive hero object, a pressable diagram, a playable desk object (computer, keypad, timer, synth), or runs /isokit with an idea.
argument-hint: "[object or idea]"
license: MIT
---

# isokit: draw a figure you can press

You are making one figure: an isometric line drawing of an object, on a plate, built from rounded boxes, whose parts work when pressed. It ships as one React component that uses `react-isokit`. The four figures in this repo's `examples/demo/src/figures` are the bar; read the one nearest your idea before you write.

Read `references/api.md` once before writing code. Read `references/rules.md` before you check your work. Reach for `references/recipes.md` when you need a common part (keys, screens, cables, antennas, folders, exploded layers).

## 1. Decide what pressing produces

Before drawing anything, name the output: typed text on a screen, a number, a request answered, a page published, a file read. A figure you can only watch is decoration. If the object has nothing to press, choose a different object.

Write it as one line and keep it:

> **Object.** What the pointer presses. What changes, and what the read-out says.

For a product, find the physical object behind it. A deploy tool is not boxes and arrows; it is an approval pad with an "allow" key, or a press that seats a page. One figure, one idea.

## 2. Lay out the boxes

Decompose the object into 3 to 8 boxes. Write them as constants before any JSX, in world units (+x down-right, +y down-left, +z up):

```ts
const BASE  = { x: 0,  y: 0,  z: 0,  w: 150, d: 124, h: 14 }
const RISER = { x: 0,  y: 0,  z: 14, w: 150, d: 48,  h: 46 }   // sits on BASE, at the back
const KEY   = { x: 10, y: 60, z: 14, w: 82,  d: 52,  h: 9 }    // on BASE, in front of RISER
```

- The object's "front" (a screen, a display) goes on a box's `front` face, which looks lower-left. Things a hand reaches for go at larger `y`, in front.
- For each part, name the two or three features that make it what it is (a tapered stand, a slot, vents, a tab) and draw those. A part with none of them is just a rounded block.
- Pick one surface that shows state: a screen, a light, a read-out.

## 3. Draw back to front

There is no depth buffer. Emit in paint order:

1. Lower `z` before higher, smaller `x + y` before larger.
2. Grids (keys, buttons): rows by increasing `y`, then columns by increasing `x`.
3. A part sitting on another goes after it. Thin overlapping slabs: the higher one goes last.

Draw details on faces through `top`, `front` and `side`, in that face's flat coordinates. Never hand-compute skewed polygons. Use `ik-detail` for inner lines, `ik-screen` and `ik-screen-text` for displays, `ik-label` for engraved labels, and keep exactly one thing in `ik-live` at a time.

## 4. Wire it

- One component, a few `useState`s, no global state.
- Every pressable part is a `<Press label="…" onPress={…}>` around one `<g>` holding its boxes. It goes down on press and acts on release, from pointer, Enter or Space.
- Write the read-out on every interaction: terse, lowercase, dot-separated (`on · 14 chars · key q`, `allowed · back to work`).
- Timed follow-ups (the next request arriving, a reading finishing) go in a `setTimeout` stored in a ref and cleared on unmount.
- Sound: `playSound("success")` and friends at the moment the visual change happens. Keep the `stop` that `playSound` returns for anything a newer action should cut short. Never play a sound the reader did not cause.
- Motion is CSS: transitions on a `<g>` that has no `transform` attribute of its own. Discrete changes take 700 ms on `var(--ik-ease)`; presses spring back on `var(--ik-spring)`. Stagger by physical position (lowest first, nearest the pointer first), 40 to 60 ms apart. Mark looping animations `ik-loop` so they sleep offscreen.

## 5. Frame it

Pass `fit` the boxes and points of the most extreme pose (raised parts at their highest, exploded layers at their widest) so nothing leaves the plate when it moves. Use `aspect` around 1.2 for a card and 1.6 for a wide hero.

## 6. Check it in a browser

Run the app, then `node <this skill>/scripts/shoot.mjs <url> --selector <plate selector> --click "<button label>"`. It screenshots light and dark, before and after the presses, at desktop and phone width, and fails on any console error. Read every picture against `references/rules.md`:

- Faces cover what is behind them; nothing shows through, nothing pokes past a rounded corner.
- Exactly one live stroke at rest, and it moves to what was pressed.
- Text fits its screen at both widths.
- The read-out changed on every press.
- Nothing leaves the plate at the most extreme pose.

Fix and shoot again until it holds. Do not hand over a figure you have not looked at.

## 7. Hand over

Say in one line each: the object and what pressing it produces, the files you added, and anything you could not verify.
