import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "react-isokit/styles.css"
import "./demo.css"
import { App } from "./App"

if (matchMedia("(prefers-color-scheme: dark)").matches) document.documentElement.classList.add("dark")

createRoot(document.getElementById("root") as HTMLElement).render(<StrictMode><App /></StrictMode>)
