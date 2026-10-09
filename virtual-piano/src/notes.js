// Note table, key layout and computer-keyboard mapping. Pure functions, no DOM.

const NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const BLACK = new Set([1, 3, 6, 8, 10]);

export const isBlack = (midi) => BLACK.has(midi % 12);
export const noteName = (midi) => `${NAMES[midi % 12]}${Math.floor(midi / 12) - 1}`;
export const midiToFrequency = (midi) => 440 * 2 ** ((midi - 69) / 12);

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
