import { defineConfig } from "tsdown"

export default defineConfig({
  entry: { index: "src/index.ts", schema: "src/schema.ts" },
  format: "esm",
  platform: "browser",
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
