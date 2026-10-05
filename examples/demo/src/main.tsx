import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { configureSound } from "react-isokit"
import "react-isokit/styles.css"
import "./demo.css"
import "./site/site.css"
import { Site } from "./site/Site"

configureSound({ defaultOn: true, storageKey: "isokit-demo:sound" })

if (matchMedia("(prefers-color-scheme: dark)").matches) document.documentElement.classList.add("dark")

createRoot(document.getElementById("root") as HTMLElement).render(
  <StrictMode>
    <Site />
  </StrictMode>,
)
