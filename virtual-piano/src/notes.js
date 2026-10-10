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

// Semitone offset from the base C for each computer key.
export const KEY_OFFSETS = {
  z: 0, s: 1, x: 2, d: 3, c: 4, v: 5, g: 6, b: 7, h: 8, n: 9, j: 10, m: 11,
  q: 12, 2: 13, w: 14, 3: 15, e: 16, r: 17, 5: 18, t: 19, 6: 20, y: 21, 7: 22, u: 23,
  i: 24,
};

export const keyToMidi = (key, baseMidi) => {
  const offset = KEY_OFFSETS[key.toLowerCase()];
  return offset === undefined ? null : baseMidi + offset;
};

/** midi -> label shown on the key for the current base octave. */
export function keyHints(baseMidi) {
  const hints = new Map();
  for (const [key, offset] of Object.entries(KEY_OFFSETS)) hints.set(baseMidi + offset, key.toUpperCase());
  return hints;
}
