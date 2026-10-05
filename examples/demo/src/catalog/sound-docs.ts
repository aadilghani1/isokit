import type { SoundName } from "react-isokit"

export type SoundDoc = { name: SoundName; feel: string; when: string; seconds: number }

export const SOUNDS: readonly SoundDoc[] = [
  { name: "press", feel: "A short click on a low thump.", when: "A part goes down. Press plays it for you.", seconds: 0.1 },
  { name: "release", feel: "A lighter tick, a touch higher.", when: "A part comes back up. Press plays it for you.", seconds: 0.1 },
  { name: "toggle", feel: "A soft two-step click.", when: "Something switches on or off: a flag, a mode, the sound switch itself.", seconds: 0.1 },
  { name: "boot", feel: "One warm chord, slow to fade.", when: "A device wakes up. Use it once, never on a loop.", seconds: 1.4 },
  { name: "success", feel: "Two bright bells, the second higher.", when: "A request is allowed or a job succeeds.", seconds: 0.6 },
  { name: "error", feel: "A low, short buzz.", when: "Something is denied or fails. Pair it with what to do next.", seconds: 0.35 },
  { name: "notify", feel: "Two small, high bells, like a notification across the room.", when: "Something new arrived: a lead, a message, the next request.", seconds: 0.3 },
  { name: "complete", feel: "A short resolving phrase.", when: "The last step of a sequence lands: all channels live, all items done.", seconds: 0.7 },
  { name: "cascade", feel: "Rising tocks, then a small bell.", when: "Several parts land one after another. Match count, stagger and delay to the motion.", seconds: 1 },
  { name: "whoosh", feel: "A short breath of air.", when: "Something is undone or flies away: unpublish, eject, reset.", seconds: 0.4 },
  { name: "paper", feel: "A crisp rustle.", when: "A document, folder or card is picked up.", seconds: 0.2 },
  { name: "process", feel: "A faint hum under a few quiet ticks.", when: "Work is happening for a moment. Keep its stop() and cut it when the work ends.", seconds: 0.6 },
  { name: "done", feel: "Two soft bells, small and warm.", when: "A short piece of work finished: a part seated, a file read.", seconds: 0.4 },
]

export const SOUND_RULES: readonly string[] = [
  "Sound follows the reader: play only what they caused, at the moment the visual change happens. A demo press is silent.",
  "Quiet by default: nothing plays until the page calls configureSound or the reader presses a SoundToggle.",
  "Cut stale sounds: keep the stop() a sound returns and call it when a newer action replaces it.",
  "Never the only feedback: every sound has a visible change and a read-out beside it.",
]
