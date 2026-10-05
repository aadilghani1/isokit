# The rules

What a finished figure holds to. Each one came from a mistake that was easy to make.

## Geometry

1. **True isometric, never perspective.** Far things do not shrink. Lift along z; never scale to fake height.
2. **Paint order is depth.** Back to front: lower z first, smaller x + y first; rows by y, then columns by x. Thin slabs that overlap on screen: the higher one is nearer and goes last.
3. **Faces are opaque.** Every solid is filled, so whatever is behind it is hidden. A far edge showing through a near face means the paint order is wrong.
4. **Rounded corners, drawn honestly.** Use `Box`: its outline is the hull of its rounded top and foot, so no vertical corner line is drawn and no flat face pokes past a rounded corner.
5. **Draw on faces, not polygons.** Anything on a surface goes in that face's flat coordinates through `top`, `front` or `side`.
6. **Frame the extreme pose.** `fit` includes every raised, opened or exploded position, so nothing leaves the plate.

## Light and colour

7. **One live thing.** At rest exactly one stroke or dot is `--ik-live`, where the eye should start. When the reader presses something, the live stroke moves to it. Never two places at once.
8. **Bright outside, dim inside.** Silhouettes in `--ik-line`, inner marks in `--ik-detail`. Texture comes from repetition (vents, key grids, ribs), never from gradients or shadows.
9. **Both themes.** Check light and dark. Never hard-code a colour; use the `--ik-*` properties.

## Interaction

10. **Pressing produces output.** Every press changes something you can read: the screen, a light, the read-out.
11. **Act on release.** `Press` goes down on press and acts on release, like a key. Parts that lift (folders, lids) use `ik-lift`.
12. **Hit areas do not jump.** If a part moves when hovered, make sure the pointer still lands on it in the moved pose, or it will flicker. Stepped stands and spacing give back parts a real target.
13. **Everything works from the keyboard.** Each `Press` has a label that says what it does.
14. **The read-out is terse.** Lowercase, dot-separated, a few words: `draft · 4 blocks`. It changes on every interaction.

## Motion

15. **Two clocks.** Discrete changes (which item, on or off) take about 700 ms on `--ik-ease`. Presses go down in 50 ms and spring back on `--ik-spring`.
16. **Stagger by position.** Things that move together start lowest-first or nearest-first, 40 to 60 ms apart, so it reads as one gesture.
17. **Loops are rare and sleep.** Only ambient motion loops (a waiting light, a floating draft); mark it `ik-loop` so it pauses offscreen. Reduced motion lands everything at once.
18. **Never CSS-transform an element that has a `transform` attribute.** Wrap it in a `<g>` and move the wrapper.

## Sound

19. **Sound follows the reader.** Only play what the reader caused, at the moment the visual change happens. The cascade lands in step with the staggered animation.
20. **Quiet by default.** Nothing plays until the page opts in and the reader has interacted. Short, soft, and never the only feedback.
21. **Cut stale sounds.** Keep the `stop` from `playSound` for anything a newer action replaces.

## Text

22. **Text fits at every width.** Screens hold a few short words; measure monospace at 0.6 em per character. If it does not fit, shorten the words before you shrink the font.
23. **Legibility over decoration.** Screen text at least about 6 units; anything smaller is texture, not content.

## Guided motion

24. **Show it once, then hand it over.** A figure presses its own primary part once, the first time it is in view (`useDemoTap`), silently, and never again after the reader touches it.
25. **Coral says "press here".** At rest the one live thing is the part to press, with a `Ripple` under it until the first press. After a press the live stroke moves to the result or to the next part to press, never to two places.
26. **Motion runs from the cause to the result.** A signal leaves the key and reaches the screen; a part flies from where it was to where it goes. The result confirms where it lands, and in the read-out.
27. **Nothing moves that is not news.** Every loop is a waiting signal (`ik-loop`); every transition reports a change of state.
