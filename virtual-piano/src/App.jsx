import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Aurora from "./Aurora.jsx";
import Keyboard from "./Keyboard.jsx";
import { AudioEngine } from "./audio/engine.js";
import { SAMPLE_MANIFEST } from "./audio/samples.js";
import { connectMidi } from "./midi.js";
import { buildKeys, fitRange, keyHints, keyToMidi, noteName } from "./notes.js";
import { SongPlayer } from "./song.js";

const MIN_BASE = 24;
const MAX_BASE = 84;
const AURORA_HEIGHT = 300;

export default function App() {
  const engine = useRef(null);
  if (!engine.current) engine.current = new AudioEngine();
  const aurora = useRef(null);
  const stageRef = useRef(null);

  const [phase, setPhase] = useState("idle"); // idle | loading | ready | error
  const [progress, setProgress] = useState([0, 0]);
  const [volume, setVolume] = useState(0.85);
  const [reverb, setReverb] = useState(0.35);
  const [base, setBase] = useState(48);
  const [width, setWidth] = useState(1000);
  const [active, setActive] = useState(() => new Set());
  const [pedal, setPedal] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [midiNames, setMidiNames] = useState(null);
  const held = useRef(new Map()); // computer key -> midi
  const pedalSources = useRef(new Set()); // who is holding the pedal: "key" | "ui" | "midi" | "song"

  useEffect(() => {
    if (new URLSearchParams(location.search).has("debug")) window.__nocturne = { engine: engine.current };
  }, []);

  useEffect(() => {
    const el = stageRef.current;
    const ro = new ResizeObserver(([entry]) => setWidth(Math.floor(entry.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const range = useMemo(() => fitRange(width, base), [width, base]);
  const { keys, whiteCount } = useMemo(() => buildKeys(range.first, range.last), [range]);
  const whiteWidth = width / whiteCount;
  const keyX = useMemo(() => {
    const byMidi = new Map(keys.map((k) => [k.midi, k]));
    return (midi) => {
      const k = byMidi.get(midi);
      if (!k) return -100;
      return k.black ? (k.whiteIndex + 1) * whiteWidth : (k.whiteIndex + 0.5) * whiteWidth;
    };
  }, [keys, whiteWidth]);
  const hints = useMemo(() => keyHints(base), [base]);

  const press = useCallback((midi, vel = 0.7) => {
    setActive((prev) => (prev.has(midi) ? prev : new Set(prev).add(midi)));
    engine.current.noteOn(midi, vel);
    aurora.current?.noteOn(midi, vel);
  }, []);

  const release = useCallback((midi) => {
    setActive((prev) => {
      if (!prev.has(midi)) return prev;
      const next = new Set(prev);
      next.delete(midi);
      return next;
    });
    engine.current.noteOff(midi);
    aurora.current?.noteOff(midi);
  }, []);

  const holdPedal = useCallback((source, down) => {
    const set = pedalSources.current;
    if (down) set.add(source);
    else set.delete(source);
    const on = set.size > 0;
    engine.current.setSustain(on);
    setPedal(on);
  }, []);

  const song = useRef(null);
  if (!song.current) {
    song.current = new SongPlayer({
      press: (m, v) => press(m, v),
      release: (m) => release(m),
      pedal: (down) => holdPedal("song", down),
      onEnd: () => setPlaying(false),
    });
  }

  const silence = useCallback(() => {
    held.current.clear();
    engine.current.allNotesOff();
    pedalSources.current.clear();
    engine.current.setSustain(false);
    setPedal(false);
    setActive((prev) => {
      for (const m of prev) aurora.current?.noteOff(m);
      return new Set();
    });
  }, []);

  const begin = async () => {
    setPhase("loading");
    try {
      await engine.current.start();
      const loaded = await engine.current.loadSamples(SAMPLE_MANIFEST, (done, total) => setProgress([done, total]));
      if (!loaded) throw new Error("no samples");
      setPhase("ready");
      connectMidi({
        onNoteOn: (m, v) => press(m, v),
        onNoteOff: (m) => release(m),
        onSustain: (down) => holdPedal("midi", down),
        onDevices: (names) => setMidiNames(names),
      });
    } catch (err) {
      console.error(err);
      setPhase("error");
    }
  };

  useEffect(() => engine.current.setVolume(volume), [volume, phase]);
  useEffect(() => engine.current.setReverb(reverb), [reverb, phase]);

  useEffect(() => {
    if (phase !== "ready") return undefined;
    const down = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.code === "Space") {
        e.preventDefault();
        if (!e.repeat) holdPedal("key", true);
        return;
      }
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        e.preventDefault();
        setBase((b) => Math.min(MAX_BASE, Math.max(MIN_BASE, b + (e.key === "ArrowLeft" ? -12 : 12))));
        return;
      }
      if (e.repeat) return;
      const midi = keyToMidi(e.key, base);
      if (midi === null || midi > 108 || held.current.has(e.code)) return;
      held.current.set(e.code, midi);
      press(midi, 0.55 + Math.random() * 0.15);
    };
    const up = (e) => {
      if (e.code === "Space") {
        e.preventDefault();
        holdPedal("key", false);
        return;
      }
      const midi = held.current.get(e.code);
      if (midi === undefined) return;
      held.current.delete(e.code);
      release(midi);
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", silence);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", silence);
    };
  }, [phase, base, press, release, holdPedal, silence]);

  const toggleSong = () => {
    if (song.current.playing) song.current.stop();
    else {
      song.current.play();
      setPlaying(true);
    }
  };

  const shift = (dir) => setBase((b) => Math.min(MAX_BASE, Math.max(MIN_BASE, b + dir * 12)));
  const zone = [base, base + 24];
  const loading = phase === "loading";

  return (
    <div className="app" data-phase={phase}>
      <div className="backdrop" aria-hidden="true" />

      <header className="top">
        <div className="brand">
          <h1>Noc<em>turne</em></h1>
          <p>Concert grand · played in your browser</p>
        </div>
        <div className="chips">
          <span className={`chip${pedal ? " on" : ""}`}><i /> Sustain</span>
          <span className={`chip${midiNames?.length ? " on" : ""}`}>
            <i /> {midiNames?.length ? midiNames[0] : "MIDI: none"}
          </span>
        </div>
      </header>

      <main className="stage-wrap">
        <div className="stage" ref={stageRef}>
          <div className="glow" aria-hidden="true">
            <Aurora
              ref={aurora}
              width={width}
              height={AURORA_HEIGHT}
              keyX={keyX}
              whiteWidth={whiteWidth}
              getLevel={() => engine.current.level()}
            />
          </div>
          <div className="case">
            <div className="lip"><span>Nocturne</span><b>Concert Grand</b></div>
            <div className="felt" />
            <div className="bed" style={{ height: Math.min(240, Math.max(150, whiteWidth * 7.2)) }}>
              <Keyboard
                first={range.first}
                last={range.last}
                active={active}
                hints={hints}
                zone={zone}
                onDown={press}
                onUp={release}
              />
            </div>
          </div>
        </div>

        <section className="dock" aria-label="Controls">
          <div className="ctl pedal-ctl">
            <button
              type="button"
              className={`pedal${pedal ? " down" : ""}`}
              onPointerDown={() => holdPedal("ui", true)}
              onPointerUp={() => holdPedal("ui", false)}
              onPointerLeave={() => holdPedal("ui", false)}
              onKeyDown={(e) => e.key === " " && e.preventDefault()}
              aria-label="Sustain pedal (hold)"
            />
            <label>Sustain<small>hold Space</small></label>
          </div>

          <div className="ctl">
            <label htmlFor="rev">Hall</label>
            <input id="rev" type="range" min="0" max="1" step="0.01" value={reverb} onChange={(e) => setReverb(+e.target.value)} />
          </div>

          <div className="ctl">
            <label htmlFor="vol">Volume</label>
            <input id="vol" type="range" min="0" max="1" step="0.01" value={volume} onChange={(e) => setVolume(+e.target.value)} />
          </div>

          <div className="ctl octave">
            <label>Keys on keyboard</label>
            <div className="stepper">
              <button type="button" onClick={() => shift(-1)} disabled={base <= MIN_BASE} aria-label="Octave down">‹</button>
              <output>{noteName(base)} – {noteName(Math.min(108, base + 24))}</output>
              <button type="button" onClick={() => shift(1)} disabled={base >= MAX_BASE} aria-label="Octave up">›</button>
            </div>
          </div>

          <button type="button" className={`demo${playing ? " on" : ""}`} onClick={toggleSong}>
            <span className="icon" aria-hidden="true">{playing ? "■" : "▶"}</span>
            {playing ? "Stop" : "Play “Evening Study”"}
          </button>
        </section>

        <p className="help">
          Play with the mouse, touch, a MIDI keyboard, or your keys: <kbd>Z</kbd>–<kbd>M</kbd> is the lower row,
          <kbd>Q</kbd>–<kbd>U</kbd> the upper, <kbd>S D G H J</kbd> and <kbd>2 3 5 6 7</kbd> are the black keys.
          <kbd>←</kbd> <kbd>→</kbd> move by an octave. Strike a key nearer its front edge to play louder.
        </p>
      </main>

      <footer className="foot">
        Piano samples: Salamander Grand Piano V3 by Alexander Holm, licensed{" "}
        <a href="https://creativecommons.org/licenses/by/3.0/" target="_blank" rel="noreferrer">CC BY 3.0</a>.
      </footer>

      {phase !== "ready" && (
        <div className="splash" role="dialog" aria-label="Start">
          <div className="card">
            <h2>Noc<em>turne</em></h2>
            <p className="tag">A sampled concert grand, with light.</p>
            {phase === "idle" && <button className="begin" onClick={begin}>Begin</button>}
            {loading && (
              <div className="loading" aria-live="polite">
                <div className="bar"><i style={{ width: `${progress[1] ? (progress[0] / progress[1]) * 100 : 0}%` }} /></div>
                <span>Tuning the strings… {progress[0]}/{progress[1] || SAMPLE_MANIFEST_SIZE}</span>
              </div>
            )}
            {phase === "error" && (
              <div className="loading">
                <span>The piano samples could not be loaded.</span>
                <button className="begin" onClick={begin}>Try again</button>
              </div>
            )}
            <small>Headphones recommended · about 2 MB of samples</small>
          </div>
        </div>
      )}
    </div>
  );
}

const SAMPLE_MANIFEST_SIZE = Object.keys(SAMPLE_MANIFEST).length;
