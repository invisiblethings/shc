import { parseNote } from "./notes.js";

// "Evening Study": a short original piece in D major, 3/4 at 66 bpm.
const BEAT = 60 / 66;

// One entry per bar: bass note, chord, and melody as [beat, note, length].
const BARS = [
  { bass: "G2", chord: ["B3", "D4", "F#4"], melody: [] },
  { bass: "D2", chord: ["A3", "C#4", "F#4"], melody: [] },
  { bass: "G2", chord: ["B3", "D4", "F#4"], melody: [[0, "F#5", 2], [2, "E5", 1]] },
  { bass: "D2", chord: ["A3", "C#4", "F#4"], melody: [[0, "D5", 3]] },
  { bass: "E2", chord: ["B3", "D4", "G4"], melody: [[0, "G5", 1.5], [1.5, "F#5", 1.5]] },
  { bass: "A1", chord: ["G3", "C#4", "E4"], melody: [[0, "E5", 2], [2, "C#5", 1]] },
  { bass: "D2", chord: ["A3", "C#4", "F#4"], melody: [[0, "D5", 1], [1, "F#5", 1], [2, "A5", 1]] },
  { bass: "D2", chord: ["A3", "C#4", "F#4"], melody: [[0, "A5", 3]] },
  { bass: "G2", chord: ["B3", "D4", "F#4"], melody: [[0, "B5", 2], [2, "A5", 1]] },
  { bass: "D2", chord: ["A3", "C#4", "F#4"], melody: [[0, "F#5", 3]] },
  { bass: "E2", chord: ["B3", "D4", "G4"], melody: [[0, "G5", 1], [1, "F#5", 1], [2, "E5", 1]] },
  { bass: "A1", chord: ["G3", "C#4", "E4"], melody: [[0, "C#5", 2], [2, "E5", 1]] },
  { bass: "D2", chord: ["A3", "C#4", "F#4"], melody: [[0, "D5", 3]] },
  { bass: "G2", chord: ["B3", "D4", "F#4"], melody: [[0, "B4", 1.5], [1.5, "D5", 1.5]] },
  { bass: "A1", chord: ["G3", "C#4", "E4"], melody: [[0, "C#5", 2], [2, "E5", 1]] },
  { bass: "D2", chord: ["A3", "D4", "F#4", "A4"], melody: [[0, "D5", 3]] },
];

/** Flatten the demo score into timed events (seconds from the start). */
export function buildEvents() {
  const events = [];
  const note = (beat, name, len, vel) => {
    const midi = parseNote(name);
    events.push({ at: beat * BEAT, type: "on", midi, vel });
    events.push({ at: (beat + len) * BEAT - 0.04, type: "off", midi });
  };

  BARS.forEach((bar, i) => {
    const start = i * 3;
    // Lift the pedal for an instant at each barline so harmonies don't smear.
    events.push({ at: start * BEAT - 0.06, type: "pedal", down: false });
    events.push({ at: start * BEAT + 0.04, type: "pedal", down: true });
    note(start, bar.bass, 3, 0.5);
    bar.chord.forEach((n, k) => {
      note(start + 1, n, 1, 0.34 + k * 0.01);
      note(start + 2, n, 1, 0.3 + k * 0.01);
    });
    for (const [beat, n, len] of bar.melody) note(start + beat, n, len, 0.62);
  });
  const end = BARS.length * 3 * BEAT + 2.5;
  events.push({ at: end - 1.2, type: "pedal", down: false });
  events.push({ at: end, type: "end" });
  return events.filter((e) => e.at >= 0).sort((a, b) => a.at - b.at);
}

/** Plays a list of timed events through press/release/pedal callbacks. */
export class SongPlayer {
  constructor({ press, release, pedal, onEnd }) {
    this.press = press;
    this.release = release;
    this.pedal = pedal;
    this.onEnd = onEnd;
    this.timers = [];
    this.sounding = new Set();
    this.playing = false;
  }

  play(events = buildEvents()) {
    this.stop();
    this.playing = true;
    for (const e of events) {
      this.timers.push(
        setTimeout(() => {
          if (e.type === "on") {
            this.sounding.add(e.midi);
            this.press(e.midi, Math.min(1, Math.max(0.1, e.vel + (Math.random() - 0.5) * 0.08)));
          } else if (e.type === "off") {
            this.sounding.delete(e.midi);
            this.release(e.midi);
          } else if (e.type === "pedal") this.pedal(e.down);
          else if (e.type === "end") this.#finish();
        }, e.at * 1000 + 200),
      );
    }
  }

  stop() {
    if (!this.playing) return;
    this.timers.forEach(clearTimeout);
    this.timers = [];
    this.#finish();
  }

  #finish() {
    this.playing = false;
    for (const midi of this.sounding) this.release(midi); // stopped mid-phrase: let go of held notes
    this.sounding.clear();
    this.pedal(false);
    this.onEnd?.();
  }
}
