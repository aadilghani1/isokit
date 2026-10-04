# Recipes

Common parts, as they are drawn in `examples/demo/src/figures`.

## A screen with changing text

```tsx
<Box {...RISER} r={8} front={<>
  <rect className="ik-screen" x={9} y={8} width={106} height={30} rx={4} />
  <g key={state} className="ik-enter">            {/* a new key replays the entrance */}
    <text className="ik-screen-text ik-dim" x={15} y={18} fontSize={5.6}>{small}</text>
    <text className="ik-screen-text" x={15} y={32} fontSize={9.5}>{big}</text>
  </g>
</>} />
```

## A key with a label

```tsx
<Press label="Allow the request" onPress={allow}>
  <g><Box {...KEY} r={7} top={<text className="ik-label" x={12} y={30}>ALLOW</text>} /></g>
</Press>
```

## A row or grid of keys

Lay them out as data, then map in paint order (rows by y, then x). Key caps are boxes a few units tall sitting on the board's top.

```ts
const KEYS = ROWS.flatMap((row, r) => { let at = 0; return row.map(([id, w]) => { const k = { id, x: X0 + at * U, y: Y0 + r * U, w: w * U - GAP }; at += w; return k }) })
```

## A status light

```tsx
<circle className="light ik-loop" cx={132} cy={13} r={2.4} />
/* css */ .my-figure svg[data-phase="waiting"] .light { fill: var(--ik-live); animation: ik-pulse 1.8s ease-in-out infinite; }
```

## A cable

A cubic Bézier through world points, sampled, then `path()`. For a coiled cord, add a small circle around the curve: offset each sample by `r·cos θ` across the curve on the ground and `r·sin θ + r` up.

```tsx
<path className="ik-line" d={path(points)} />
```

## An antenna and a ping

```tsx
<Box x={126} y={8} z={60} w={8} d={8} h={24} r={4} />
<circle className="ik-face ik-top" cx={tip[0]} cy={tip[1]} r={4.6} />   {/* tip = project(...) */}
{pinged && <g className="ping">{[0, 1, 2].map((i) => <path key={i} className="ik-live" d={arc(i)} style={{ animationDelay: `${i * 120}ms` }} />)}</g>}
```

## Exploded layers that assemble

Draw each layer at its floating height, then drop it with CSS. The higher layers float at the back so nothing overlaps; they drop lowest first.

```tsx
<g className="block" style={{ "--drop": `${lift}px`, "--i": order }}>…</g>
/* css */
.block { transition: transform 700ms var(--ik-ease) calc(var(--i) * 60ms); }
svg[data-live="true"] .block { transform: translateY(var(--drop)); }
```

Pair it with `playSound("cascade", { count, stagger: 0.06, delay: 0.3 })`.

## Folders that lift from a stand

Thin `front`-plane paths with a tab, standing on a stepped stand so each one further back stands a step higher and stays easy to hit. Wrap each in `<Press className="ik-lift" sound={false}>` and play `paper` yourself. Lift the chosen one 20px; lift its neighbours a few pixels, staggered by distance.

## A plug that is not plugged in

A small box a few units away from an empty `ik-well` port, with its cable lying on the ground (z ≈ 1.5). It says "offline" without a word.
