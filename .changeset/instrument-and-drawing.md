---
"react-isokit": minor
---

Light, looks, drafting and a fuller sound palette.

- `Glow` gives things that are switched on a soft halo that ignites fast and fades slowly, without CSS filters, so it works in Safari.
- `react-isokit/themes.css` adds the blueprint, paper and phosphor looks, each in light and dark, set with `look` on `Plate` or `data-look` on any ancestor. Blueprint lays world-aligned isometric graph paper under the figure.
- `react-isokit/drafting` adds `Dimension` and `Callout`, shown in blueprint; a dimension slides with the part it measures.
- `Press` takes a `material` (plastic, metal, rubber, glass, paper); its click follows the material, the part's size and its position in the figure.
- Six new sounds for mechanisms: `tick`, `latch`, `relay`, `motor`, `roll`, `beep`. `playSound` takes `duration`, `material`, `pan` and `size`.
- Motion is one scale of tokens (`--ik-ease-out`, `--ik-ease-move`, `--ik-ease-fall`, `--ik-t-*`, `--ik-stagger`, `--ik-travel`), and `--ik-spring` is now a real spring written as CSS `linear()`, with the old curve as the fallback.
- `Box` draws its silhouette at `--ik-weight-edge`, heavier than creases and inner marks, and evenly all the way round.
- A press sinks 2 units instead of 3, disabled parts draw in the detail ink, and reduced motion keeps short fades instead of cutting everything.
- The plate credit stays readable when the host page styles links.
