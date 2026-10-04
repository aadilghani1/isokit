# Contributing to isokit

Thanks for helping. isokit is small on purpose, so the bar for adding things is "does it make figures easier to draw or nicer to press?"

## Setup

```sh
git clone https://github.com/aadilghani1/isokit.git
cd isokit
npm install
npm run dev        # the demo at http://localhost:5173, importing from src/
```

## Before you open a pull request

```sh
npm run check      # lint, types, tests, build, publint, attw and size budgets
npx changeset      # describe your change for the changelog (skip for docs-only changes)
```

`npm run check` is exactly what CI runs.

## What we look for

- **Small and dependency-free.** The core has to stay under its size budget (`npm run size`). Anything that can be done in a figure should stay in the figure.
- **Honest geometry.** True isometric, paint order back to front, no perspective.
- **Physical interaction.** Parts act on release, work from the keyboard, and are labelled.
- **Quiet by default.** No sound until a page opts in; no motion for readers who asked for less.
- **Tests for math.** Changes to `src/iso.ts` come with a test in `test/`.

## Figures and the skill

New example figures go in `examples/demo/src/figures`. The skill lives in `skills/isokit`; if you change the API, update `skills/isokit/references/api.md` in the same pull request so agents keep drawing correctly.

## Releasing (maintainers)

Merging a pull request with changesets opens a "Version packages" pull request. Merging that one publishes to npm from GitHub Actions through [trusted publishing](https://docs.npmjs.com/trusted-publishers): no token is stored anywhere, and every release carries a provenance statement linking it to the commit and workflow that built it.
