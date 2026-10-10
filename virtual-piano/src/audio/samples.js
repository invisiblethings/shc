// Salamander Grand Piano V3 (Alexander Holm), CC BY 3.0. One sample every minor
// third (A0 ... C8); the engine pitch-shifts the notes in between.
import { parseNote } from "../notes.js";

const BASE = import.meta.env?.BASE_URL ?? "/";
const names = ["A0"];
for (let octave = 1; octave <= 7; octave++) {
  for (const n of ["C", "Ds", "Fs", "A"]) names.push(`${n}${octave}`);
}
names.push("C8");

export const SAMPLE_MANIFEST = Object.fromEntries(
  names.map((name) => [parseNote(name), `${BASE}samples/${name}.mp3`]),
);
