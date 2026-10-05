---
"react-isokit": minor
---

Guided motion, so a first-time reader sees what to press and what pressing does.

- `useDemoTap(onTap, { delay, threshold })` presses a figure's hot part once, silently, the first time it is mostly in view, then hands it over. It cancels if the figure leaves view before the press, stops for good when the reader presses or types in the figure, and never plays under reduced motion or without IntersectionObserver.
- `<Cursor>`, `<Ripple>`, `<Signal>` and `<Flight>`: the demo's pointer, a "press here" ring, a dash that runs along a path, and a part carried along an arc between two world points. None of them catch the pointer, and all sleep offscreen.

Also:

- Your own `onPointerDown`, `onPointerUp`, `onPointerLeave` and `onPointerCancel` on `Press` now run after its own handlers instead of replacing them, and a part that became disabled while held no longer acts when released.
- `Plate` renders its live region whenever a `readout` is passed, even as `null`, so the first announcement is read.
- The sound engine waits for the longest scheduled sound before suspending, so a delayed cascade is no longer cut off.
- Only the main entry carries `"use client"`: `react-isokit/schema` can be imported from server code again.
