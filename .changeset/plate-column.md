---
"react-isokit": patch
---

`Plate`'s grid has an explicit `minmax(0, 1fr)` column. A plate given a fixed height can no longer have its drawing widen the column past the plate's own edge.
