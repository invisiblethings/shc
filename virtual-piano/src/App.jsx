import { useCallback, useEffect, useRef, useState } from "react";
import Keyboard from "./Keyboard.jsx";
import { AudioEngine } from "./audio/engine.js";
import { SAMPLE_MANIFEST } from "./audio/samples.js";
import { keyToMidi } from "./notes.js";

const FIRST = 48; // C3
const LAST = 83; // B5
const MIN_BASE = 24;
const MAX_BASE = 72;

export default function App() {
  const engine = useRef(null);
  if (!engine.current) engine.current = new AudioEngine();

  const [ready, setReady] = useState(false);
  const [sampleCount, setSampleCount] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [base, setBase] = useState(48); // computer keys start here
  const [active, setActive] = useState(() => new Set());
  const held = useRef(new Map()); // computer key -> midi, so keyup releases the note it started

  const press = useCallback((midi) => {
    setActive((prev) => (prev.has(midi) ? prev : new Set(prev).add(midi)));
    engine.current.noteOn(midi);
  }, []);

  const release = useCallback((midi) => {
    setActive((prev) => {
      if (!prev.has(midi)) return prev;
      const next = new Set(prev);
      next.delete(midi);
      return next;
    });
    engine.current.noteOff(midi);
  }, []);

  const start = async () => {
    await engine.current.start();
    setReady(true);
    setSampleCount(await engine.current.loadSamples(SAMPLE_MANIFEST));
  };

  useEffect(() => engine.current.setVolume(volume), [volume]);

  useEffect(() => {
    if (!ready) return undefined;
    const down = (e) => {
      if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        const step = e.key === "ArrowLeft" ? -12 : 12;
        setBase((b) => Math.min(MAX_BASE, Math.max(MIN_BASE, b + step)));
        return;
      }
      const midi = keyToMidi(e.key, base);
      if (midi === null || held.current.has(e.key)) return;
      held.current.set(e.key, midi);
      press(midi);
    };
    const up = (e) => {
      const midi = held.current.get(e.key);
      if (midi === undefined) return;
      held.current.delete(e.key);
      release(midi);
    };
    const blur = () => {
      held.current.clear();
      engine.current.allNotesOff();
      setActive(new Set());
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
    };
  }, [ready, base, press, release]);

  return (
    <main>
      <h1>Virtual Piano</h1>
      {!ready ? (
        <button className="start" onClick={start}>Click to start audio</button>
      ) : (
        <>
          <p className="hint">
            Play with the mouse, or keys <kbd>Z</kbd>–<kbd>M</kbd> and <kbd>Q</kbd>–<kbd>U</kbd> (<kbd>S D G H J</kbd> /
            <kbd>2 3 5 6 7</kbd> for sharps). <kbd>←</kbd>/<kbd>→</kbd> shift octave.
            Sound: {sampleCount > 0 ? `${sampleCount} samples` : "built-in synth (no samples found)"}.
          </p>
          <label className="volume">
            Volume
            <input type="range" min="0" max="1" step="0.01" value={volume} onChange={(e) => setVolume(Number(e.target.value))} />
          </label>
          <Keyboard first={FIRST} last={LAST} active={active} onDown={press} onUp={release} />
        </>
      )}
    </main>
  );
}
