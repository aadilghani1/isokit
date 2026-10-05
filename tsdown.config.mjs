import { defineConfig } from "tsdown"

// Plain JavaScript, so every supported Node version can load it without a TypeScript loader.

export default defineConfig({
  entry: { index: "src/index.ts", schema: "src/schema.ts" },
  format: "esm",
  // Neutral, not browser: the browser platform defines process.env.NODE_ENV at library build time,
  // which baked the development checks into the published code. Neutral leaves it for the app's bundler.
  platform: "neutral",
  target: "es2020",
  dts: true,
  sourcemap: true,
  clean: true,
  hash: false,
  fixedExtension: false,
  // Every module here is a client module; the sound engine and the dev-only validator stay their own chunks.
  outputOptions: { banner: '"use client";' },
  copy: [{ from: "src/styles.css", to: "dist" }],
})
