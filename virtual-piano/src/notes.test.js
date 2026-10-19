import test, { mock } from "node:test";
import assert from "node:assert/strict";
import {
  buildKeys, fitRange, keyHints, keyToMidi, midiToFrequency, nearestSample,
  noteName, parseNote, pitchHue, playbackRate,
} from "./notes.js";
import { SongPlayer, buildEvents } from "./song.js";
import { SAMPLE_MANIFEST } from "./audio/samples.js";

test("A4 is 440 Hz and an octave doubles", () => {
  assert.equal(midiToFrequency(69), 440);
  assert.equal(midiToFrequency(81), 880);
});

test("note names and parsing round-trip", () => {
  assert.equal(noteName(60), "C4");
  assert.equal(noteName(61), "C#4");
  assert.equal(parseNote("C4"), 60);
  assert.equal(parseNote("F#4"), 66);
  assert.equal(parseNote("Fs4"), 66);
  assert.equal(parseNote("Db4"), 61);
  assert.equal(parseNote("A0"), 21);
  assert.equal(parseNote("C8"), 108);
  assert.throws(() => parseNote("H4"));
});

test("playbackRate shifts by semitones", () => {
  assert.equal(playbackRate(60, 72), 2);
  assert.equal(playbackRate(60, 60), 1);
});

test("nearestSample picks the closest key", () => {
  assert.equal(nearestSample([48, 51, 54], 53), 54);
  assert.equal(nearestSample([], 60), null);
});

test("pitchHue stays in range and varies with pitch", () => {
  for (const m of [21, 60, 108]) assert.ok(pitchHue(m) >= 0 && pitchHue(m) < 360);
  assert.notEqual(pitchHue(21), pitchHue(108));
});

test("buildKeys: one octave has 7 white and 5 black keys", () => {
  const { keys, whiteCount } = buildKeys(60, 71);
  assert.equal(whiteCount, 7);
  assert.equal(keys.filter((k) => k.black).length, 5);
  assert.equal(keys.find((k) => k.midi === 61).whiteIndex, 0);
});

test("the full piano has 52 white keys", () => {
  assert.equal(buildKeys(21, 108).whiteCount, 52);
});

test("fitRange: full piano when wide, a window when narrow", () => {
  assert.deepEqual(fitRange(1400, 48), { first: 21, last: 108, whiteCount: 52 });
  const r = fitRange(480, 48);
  assert.equal(r.first, 48);
  assert.equal(r.whiteCount, 14);
  assert.equal(buildKeys(r.first, r.last).whiteCount, 14);
  assert.ok(fitRange(300, 107).last <= 108);
});

test("computer keyboard mapping and hints", () => {
  assert.equal(keyToMidi("KeyZ", 48), 48);
  assert.equal(keyToMidi("KeyQ", 48), 60);
  assert.equal(keyToMidi("Digit2", 48), 61);
  assert.equal(keyToMidi("Minus", 48), null);
  assert.equal(keyHints(48).get(48), "Z");
  // AZERTY: the physical Q position types "A".
  assert.equal(keyHints(48, new Map([["KeyQ", "a"]])).get(60), "A");
});

test("sample manifest covers A0..C8 with 30 files", () => {
  const keys = Object.keys(SAMPLE_MANIFEST).map(Number);
  assert.equal(keys.length, 30);
  assert.equal(Math.min(...keys), 21);
  assert.equal(Math.max(...keys), 108);
});

test("the demo piece is playable on an 88-key piano and balanced", () => {
  const events = buildEvents();
  const on = events.filter((e) => e.type === "on");
  const off = events.filter((e) => e.type === "off");
  assert.equal(on.length, off.length);
  for (const e of on) assert.ok(e.midi >= 21 && e.midi <= 108);
  assert.equal(events.at(-1).type, "end");
  assert.ok(events.every((e, i) => i === 0 || e.at >= events[i - 1].at));
});

test("stopping the demo mid-piece releases every held note and the pedal", () => {
  mock.timers.enable({ apis: ["setTimeout"] });
  const down = new Set();
  let pedal = null;
  let ended = 0;
  const player = new SongPlayer({
    press: (m) => down.add(m),
    release: (m) => down.delete(m),
    pedal: (d) => { pedal = d; },
    onEnd: () => { ended++; },
  });
  player.play();
  mock.timers.tick(5000);
  assert.ok(down.size > 0, "something should be sounding by 5s");
  player.stop();
  assert.equal(down.size, 0);
  assert.equal(pedal, false);
  assert.equal(ended, 1);
  assert.equal(player.playing, false);
  mock.timers.reset();
});

import { SONGS, melodyEvents, parseMelody, songBySlug } from "./data/songs.js";
import { KEY_CODES } from "./notes.js";

test("every song parses, fits the piano, and its notes are playable from the computer keys", () => {
  assert.equal(SONGS.length, 6);
  for (const song of SONGS) {
    const notes = parseMelody(song.melody).flat();
    assert.ok(notes.length > 10, song.slug);
    for (const n of notes) {
      const offset = n.midi - song.base;
      assert.ok(Object.values(KEY_CODES).includes(offset), `${song.slug}: ${n.name} not on a computer key`);
      assert.ok(n.beats > 0);
    }
    const ev = melodyEvents(song);
    assert.equal(ev.filter((e) => e.type === "on").length, notes.length);
    assert.equal(ev.at(-1).type, "end");
  }
  assert.equal(songBySlug("ode-to-joy").title, "Ode to Joy");
  assert.equal(songBySlug("nope"), null);
});

test("song bars add up: 4/4 songs fill whole bars", () => {
  const beats = (slug) => parseMelody(songBySlug(slug).melody).flat().reduce((t, n) => t + n.beats, 0);
  for (const slug of ["twinkle-twinkle-little-star", "mary-had-a-little-lamb", "ode-to-joy", "jingle-bells"]) {
    assert.equal(beats(slug) % 4, 0, slug);
  }
  assert.equal(beats("happy-birthday") % 3, 0);
  // Für Elise in 3/8 (16th = 0.5): a 2-note pickup, whole bars, seven whole bars, then a long final A.
  assert.equal((beats("fur-elise") - 1 - 3) % 3, 0);
});
