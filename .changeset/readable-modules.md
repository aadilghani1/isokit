---
"react-isokit": patch
---

The source is reorganised into small modules with one job each: geometry, components, guided motion and sound (store, player, engine, recipes, voices). The public API is unchanged.

- `frame` fits boxes in a single pass, with no array spreads, so a large `fit` can no longer overflow the stack.
- `Box` recomputes its outline only when its numbers change.
- Sound state lives in two lazily created module singletons, and the engine chunk still imports nothing at runtime from the main entry.
- The type declarations no longer carry doc comments. The props and usage for every component are on the docs site.
