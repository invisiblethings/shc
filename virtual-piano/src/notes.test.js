import test from "node:test";
import assert from "node:assert/strict";
import { buildKeys, keyToMidi, midiToFrequency, nearestSample, noteName, playbackRate } from "./notes.js";

test("A4 is 440 Hz and an octave doubles", () => {
  assert.equal(midiToFrequency(69), 440);
  assert.equal(midiToFrequency(81), 880);
});

test("note names", () => {
  assert.equal(noteName(60), "C4");
  assert.equal(noteName(61), "C#4");
});

test("playbackRate shifts by semitones", () => {
  assert.equal(playbackRate(60, 72), 2);
  assert.equal(playbackRate(60, 60), 1);
  assert.ok(Math.abs(playbackRate(60, 63) - 2 ** (3 / 12)) < 1e-12);
});

test("nearestSample picks the closest key", () => {
  assert.equal(nearestSample([48, 51, 54], 53), 54);
  assert.equal(nearestSample([], 60), null);
});

test("buildKeys: one octave has 7 white and 5 black keys", () => {
  const { keys, whiteCount } = buildKeys(60, 71);
  assert.equal(whiteCount, 7);
  assert.equal(keys.filter((k) => k.black).length, 5);
  const cSharp = keys.find((k) => k.midi === 61);
  assert.equal(cSharp.whiteIndex, 0);
});

test("computer keyboard mapping", () => {
  assert.equal(keyToMidi("z", 48), 48);
  assert.equal(keyToMidi("Q", 48), 60);
  assert.equal(keyToMidi("-", 48), null);
});
