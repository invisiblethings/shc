// Note maths, keyboard layout and key mapping. Pure functions, no DOM.

const NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const BLACK = new Set([1, 3, 6, 8, 10]);
const LETTERS = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

export const LOWEST = 21; // A0
export const HIGHEST = 108; // C8

export const isBlack = (midi) => BLACK.has(midi % 12);
export const noteName = (midi) => `${NAMES[midi % 12]}${Math.floor(midi / 12) - 1}`;
export const midiToFrequency = (midi) => 440 * 2 ** ((midi - 69) / 12);

/** "F#4" -> 66. Accepts "#" and "b" accidentals and sample-style "Fs4" / "Db4". */
export function parseNote(name) {
  const m = /^([A-G])(#|b|s)?(-?\d)$/.exec(name);
  if (!m) throw new Error(`Bad note name: ${name}`);
  const shift = m[2] === "#" || m[2] === "s" ? 1 : m[2] === "b" ? -1 : 0;
  return 12 * (Number(m[3]) + 1) + LETTERS[m[1]] + shift;
}

/** playbackRate that shifts a sample recorded at `sampleMidi` to `targetMidi`. */
export const playbackRate = (sampleMidi, targetMidi) => 2 ** ((targetMidi - sampleMidi) / 12);

/** The sample key closest to `midi`, or null when there are none. */
export function nearestSample(sampleMidis, midi) {
  let best = null;
  for (const m of sampleMidis) {
    if (best === null || Math.abs(m - midi) < Math.abs(best - midi)) best = m;
  }
  return best;
}

/** Hue (degrees) for a pitch: amber in the bass, through rose and violet, to ice blue. */
export const pitchHue = (midi) => {
  const t = Math.min(1, Math.max(0, (midi - LOWEST) / (HIGHEST - LOWEST)));
  return (((32 - t * 192) % 360) + 360) % 360;
};

/**
 * Keys for the on-screen keyboard. White keys get a slot index; black keys sit
 * on the boundary after the white key below them.
 */
export function buildKeys(first, last) {
  const keys = [];
  let whiteIndex = 0;
  for (let midi = first; midi <= last; midi++) {
    if (isBlack(midi)) keys.push({ midi, black: true, whiteIndex: whiteIndex - 1 });
    else keys.push({ midi, black: false, whiteIndex: whiteIndex++ });
  }
  return { keys, whiteCount: whiteIndex };
}

/**
 * Pick the visible range for a container width. Wide screens show all 88 keys;
 * narrower ones show a window of white keys starting at `base`.
 */
export function fitRange(width, base, { minWhite = 34, fullAt = 1000 } = {}) {
  if (width >= fullAt) return { first: LOWEST, last: HIGHEST, whiteCount: 52 };
  const target = Math.max(8, Math.floor(width / minWhite));
  let first = Math.min(Math.max(base, LOWEST), HIGHEST);
  while (isBlack(first)) first++;
  let whites = 0;
  let last = first;
  for (let m = first; m <= HIGHEST; m++) {
    if (!isBlack(m)) whites++;
    last = m;
    if (whites === target) break;
  }
  return { first, last, whiteCount: whites };
}

// Semitone offset from the base C for each physical key (KeyboardEvent.code),
// so the layout is the same on QWERTY, AZERTY and QWERTZ keyboards.
export const KEY_CODES = {
  KeyZ: 0, KeyS: 1, KeyX: 2, KeyD: 3, KeyC: 4, KeyV: 5, KeyG: 6, KeyB: 7, KeyH: 8, KeyN: 9, KeyJ: 10, KeyM: 11,
  KeyQ: 12, Digit2: 13, KeyW: 14, Digit3: 15, KeyE: 16, KeyR: 17, Digit5: 18, KeyT: 19, Digit6: 20, KeyY: 21, Digit7: 22, KeyU: 23,
  KeyI: 24,
};

/** "KeyZ" -> "Z", "Digit2" -> "2" (the QWERTY label). */
export const codeLabel = (code) => code.replace(/^(Key|Digit)/, "");

export const keyToMidi = (code, baseMidi) => {
  const offset = KEY_CODES[code];
  return offset === undefined ? null : baseMidi + offset;
};

/**
 * midi -> label shown on the key for the current base octave. `layout` is an
 * optional Map of code -> character (navigator.keyboard.getLayoutMap()).
 */
export function keyHints(baseMidi, layout = null) {
  const hints = new Map();
  for (const [code, offset] of Object.entries(KEY_CODES)) {
    const label = layout?.get(code) ?? codeLabel(code);
    hints.set(baseMidi + offset, label.toUpperCase());
  }
  return hints;
}
