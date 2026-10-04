import { copyFileSync } from "node:fs"
import { defineConfig } from "tsup"

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: true,
  target: "es2020",
  external: ["react", "react/jsx-runtime"],
  // Every module here is a client module; the sound engine stays its own chunk.
  banner: { js: '"use client";' },
  onSuccess: async () => { copyFileSync("src/styles.css", "dist/styles.css") },
})
