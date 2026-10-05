---
"react-isokit": patch
---

Keyboard focus is visible on parts that are already live. 0.2.1 stopped host pages' focus rings from drawing around pressed parts and relied on the live stroke alone, so a `data-hot` key (or one a figure marks as picked) looked the same focused or not. A focused part's faces now also draw at a heavier stroke.
