// Sample manifest: MIDI note -> URL. One sample every 3 semitones is plenty; the
// engine pitch-shifts the rest. Drop licensed files (e.g. Salamander Grand Piano,
// CC-BY) into public/samples/ and list them here. With none present the engine
// falls back to its built-in synth.
const NOTES = ["C", "Ds", "Fs", "A"]; // Salamander-style naming: C4.mp3, Ds4.mp3, ...
const SEMITONE = { C: 0, Ds: 3, Fs: 6, A: 9 };

export const SAMPLE_MANIFEST = {};
for (let octave = 2; octave <= 6; octave++) {
  for (const n of NOTES) {
    SAMPLE_MANIFEST[12 * (octave + 1) + SEMITONE[n]] = `/samples/${n}${octave}.mp3`;
  }
}
