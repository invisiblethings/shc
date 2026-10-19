import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import Aurora from "./Aurora.jsx";
import Keyboard from "./Keyboard.jsx";
import { AudioEngine } from "./audio/engine.js";
import { SAMPLE_MANIFEST } from "./audio/samples.js";
import { songBySlug, melodyEvents, parseMelody } from "./data/songs.js";
import { connectMidi } from "./midi.js";
import { KEY_CODES, buildKeys, fitRange, keyHints, keyToMidi, noteName } from "./notes.js";
import { SongPlayer } from "./song.js";

const MIN_BASE = 24;
const MAX_BASE = 84;
const SAMPLE_COUNT = Object.keys(SAMPLE_MANIFEST).length;

/**
 * The playable piano. Rendered into any page element with data-piano.
 * labels: "keys" (computer-key letters) | "notes" (note names)
 * song: slug of a song to learn (adds Listen and the glowing next key)
 * demo: show the "Evening Study" demo button
 */
export default function Piano({ labels = "keys", song: songSlug = null, demo = false, base: initialBase = 48 }) {
  const engine = useRef(null);
  if (!engine.current) engine.current = new AudioEngine();
  const aurora = useRef(null);
  const rootRef = useRef(null);
  const stageRef = useRef(null);
  const glowRef = useRef(null);

  const [phase, setPhase] = useState("idle"); // idle | loading | ready | error
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(0.85);
  const [reverb, setReverb] = useState(0.35);
  const [base, setBase] = useState(initialBase);
  const [width, setWidth] = useState(1000);
  const [glowHeight, setGlowHeight] = useState(200);
  const [active, setActive] = useState(() => new Set());
  const [pedal, setPedal] = useState(false);
  const [playing, setPlaying] = useState(null); // null | "demo" | "song"
  const [midiNames, setMidiNames] = useState(null);
  const [inView, setInView] = useState(true);
  const [layout, setLayout] = useState(null);
  const held = useRef(new Map()); // KeyboardEvent.code -> midi
  const pedalSources = useRef(new Set()); // "key" | "ui" | "midi" | "song"

  // Song learning
  const song = useMemo(() => (songSlug ? songBySlug(songSlug) : null), [songSlug]);
  const notes = useMemo(() => (song ? parseMelody(song.melody).flat() : []), [song]);
  const [step, setStep] = useState(0);
  const stepRef = useRef(0);
  stepRef.current = step;
  const nextMidi = song && step < notes.length ? notes[step].midi : null;

  useEffect(() => {
    if (new URLSearchParams(location.search).has("debug")) window.__nocturne = { engine: engine.current };
    navigator.keyboard?.getLayoutMap?.().then(setLayout).catch(() => {});
  }, []);

  // Measure before the first paint so the keys don't jump (layout shift).
  useLayoutEffect(() => {
    setWidth(Math.floor(stageRef.current.getBoundingClientRect().width));
    setGlowHeight(Math.floor(glowRef.current.getBoundingClientRect().height));
  }, []);

  useEffect(() => {
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === stageRef.current) setWidth(Math.floor(entry.contentRect.width));
        else setGlowHeight(Math.floor(entry.contentRect.height));
      }
    });
    ro.observe(stageRef.current);
    ro.observe(glowRef.current);
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.3 });
    io.observe(rootRef.current);
    return () => {
      ro.disconnect();
      io.disconnect();
    };
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
  const hints = useMemo(() => keyHints(base, layout), [base, layout]);

  const sound = useCallback((midi, vel) => {
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

  // A note played by the user: also advances the song guide.
  const press = useCallback(
    (midi, vel = 0.7) => {
      sound(midi, vel);
      if (song && notes[stepRef.current]?.midi === midi) setStep((s) => s + 1);
    },
    [sound, song, notes],
  );

  const holdPedal = useCallback((source, down) => {
    const set = pedalSources.current;
    if (down) set.add(source);
    else set.delete(source);
    const on = set.size > 0;
    engine.current.setSustain(on);
    setPedal(on);
  }, []);

  const player = useRef(null);
  if (!player.current) {
    player.current = new SongPlayer({
      press: (m, v) => sound(m, v),
      release: (m) => release(m),
      pedal: (down) => holdPedal("song", down),
      onEnd: () => setPlaying(null),
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

  const begin = useCallback(async () => {
    if (phase === "loading" || phase === "ready") return phase === "ready";
    setPhase("loading");
    try {
      await engine.current.start();
      const loaded = await engine.current.loadSamples(SAMPLE_MANIFEST, (done) => setProgress(done));
      if (!loaded) throw new Error("no samples");
      setPhase("ready");
      connectMidi({
        onNoteOn: (m, v) => press(m, v),
        onNoteOff: (m) => release(m),
        onSustain: (down) => holdPedal("midi", down),
        onDevices: (names) => setMidiNames(names),
      });
      return true;
    } catch (err) {
      console.error(err);
      setPhase("error");
      return false;
    }
  }, [phase, press, release, holdPedal]);

  useEffect(() => engine.current.setVolume(volume), [volume, phase]);
  useEffect(() => engine.current.setReverb(reverb), [reverb, phase]);
  useEffect(() => () => player.current.stop(), []);

  // Computer keyboard: only while the piano is on screen, so the rest of the page scrolls normally.
  useEffect(() => {
    if (!inView) return undefined;
    const down = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.target instanceof HTMLElement && e.target.closest("input, textarea, select, [contenteditable]")) return;
      if (phase !== "ready") {
        if (KEY_CODES[e.code] !== undefined && phase === "idle") begin();
        return;
      }
      if (e.code === "Space") {
        e.preventDefault();
        if (!e.repeat) holdPedal("key", true);
        return;
      }
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        e.preventDefault();
        setBase((b) => Math.min(MAX_BASE, Math.max(MIN_BASE, b + (e.key === "ArrowLeft" ? -12 : 12))));
        return;
      }
      if (e.repeat) return;
      const midi = keyToMidi(e.code, base);
      if (midi === null || midi > 108 || held.current.has(e.code)) return;
      e.preventDefault();
      held.current.set(e.code, midi);
      press(midi, 0.55 + Math.random() * 0.15);
    };
    const up = (e) => {
      if (e.code === "Space" && pedalSources.current.has("key")) {
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
  }, [inView, phase, base, press, release, holdPedal, silence, begin]);

  // Leaving the piano's view lets go of anything held from the keyboard.
  useEffect(() => {
    if (!inView && held.current.size) {
      for (const midi of held.current.values()) release(midi);
      held.current.clear();
      holdPedal("key", false);
    }
  }, [inView, release, holdPedal]);

  const listen = async (kind) => {
    if (playing) {
      player.current.stop();
      return;
    }
    if (!(await begin())) return;
    player.current.play(kind === "song" ? melodyEvents(song) : undefined);
    setPlaying(kind);
  };

  const shift = (dir) => setBase((b) => Math.min(MAX_BASE, Math.max(MIN_BASE, b + dir * 12)));
  const zone = [base, base + 24];

  return (
    <div className="piano" ref={rootRef} data-phase={phase}>
      <div className="stage" ref={stageRef}>
        <div className="glow" aria-hidden="true" ref={glowRef}>
          <Aurora ref={aurora} width={width} height={glowHeight} keyX={keyX} whiteWidth={whiteWidth} getLevel={() => engine.current.level()} />
        </div>
        <div className="case">
          <div className="lip">
            <span>Nocturne</span>
            <b>Concert Grand</b>
          </div>
          <div className="felt" />
          <div className="bed" style={{ height: Math.min(250, Math.max(150, whiteWidth * 7.2, window.innerHeight * 0.24)) }}>
            <Keyboard
              first={range.first}
              last={range.last}
              active={active}
              hints={hints}
              labels={labels}
              zone={zone}
              next={nextMidi}
              onDown={press}
              onUp={release}
            />
          </div>
        </div>

        {phase !== "ready" && (
          <div className="gate">
            {phase === "idle" && (
              <button type="button" className="begin" onClick={begin}>
                <span aria-hidden="true">▶</span> Start playing
              </button>
            )}
            {phase === "loading" && (
              <div className="loading" role="status">
                <div className="bar"><i style={{ width: `${(progress / SAMPLE_COUNT) * 100}%` }} /></div>
                <span>Tuning the strings… {progress}/{SAMPLE_COUNT}</span>
              </div>
            )}
            {phase === "error" && (
              <div className="loading" role="alert">
                <span>The piano sound could not be loaded.</span>
                <button type="button" className="begin" onClick={() => { setPhase("idle"); setTimeout(begin); }}>Try again</button>
              </div>
            )}
            {phase === "idle" && <small>Click, tap, or press any letter key · sound loads once (2 MB)</small>}
          </div>
        )}
      </div>

      {song && (
        <div className="guide" aria-live="polite">
          <div className="guide-text">
            {step < notes.length ? (
              <>
                <span className="eyebrow">Next note</span>
                <strong>{notes[step].name.replace("#", "♯")}</strong>
                <span className="muted">
                  key <kbd>{hints.get(notes[step].midi) ?? "—"}</kbd> · {step + 1} of {notes.length}
                </span>
              </>
            ) : (
              <>
                <span className="eyebrow">Well played</span>
                <strong>That’s the whole melody.</strong>
              </>
            )}
          </div>
          <div className="guide-bar" aria-hidden="true">
            <i style={{ width: `${(step / notes.length) * 100}%` }} />
          </div>
          <div className="guide-actions">
            <button type="button" className={`pill${playing === "song" ? " on" : ""}`} onClick={() => listen("song")}>
              {playing === "song" ? "■ Stop" : "▶ Listen"}
            </button>
            <button type="button" className="pill ghost" onClick={() => setStep(0)} disabled={step === 0}>
              ↺ Restart
            </button>
          </div>
        </div>
      )}

      <section className="dock" aria-label="Piano controls">
        <div className="ctl pedal-ctl">
          <button
            type="button"
            className={`pedal${pedal ? " down" : ""}`}
            onPointerDown={() => holdPedal("ui", true)}
            onPointerUp={() => holdPedal("ui", false)}
            onPointerLeave={() => holdPedal("ui", false)}
            onKeyDown={(e) => e.key === " " && e.preventDefault()}
            aria-label="Sustain pedal (hold)"
            aria-pressed={pedal}
          />
          <span className="ctl-label">Sustain<small>hold Space</small></span>
        </div>

        <div className="ctl">
          <label htmlFor={`rev-${songSlug ?? "p"}`}>Hall</label>
          <input id={`rev-${songSlug ?? "p"}`} type="range" min="0" max="1" step="0.01" value={reverb} onChange={(e) => setReverb(+e.target.value)} />
        </div>

        <div className="ctl">
          <label htmlFor={`vol-${songSlug ?? "p"}`}>Volume</label>
          <input id={`vol-${songSlug ?? "p"}`} type="range" min="0" max="1" step="0.01" value={volume} onChange={(e) => setVolume(+e.target.value)} />
        </div>

        <div className="ctl octave">
          <span className="ctl-label">Keys on keyboard</span>
          <div className="stepper">
            <button type="button" onClick={() => shift(-1)} disabled={base <= MIN_BASE} aria-label="Octave down">‹</button>
            <output>{noteName(base)} – {noteName(Math.min(108, base + 24))}</output>
            <button type="button" onClick={() => shift(1)} disabled={base >= MAX_BASE} aria-label="Octave up">›</button>
          </div>
        </div>

        <div className="dock-end">
          <span className={`chip${midiNames?.length ? " on" : ""}`} title="MIDI input">
            <i /> {midiNames?.length ? midiNames[0] : "MIDI"}
          </span>
          {demo && (
            <button type="button" className={`pill${playing === "demo" ? " on" : ""}`} onClick={() => listen("demo")}>
              {playing === "demo" ? "■ Stop" : "▶ Play “Evening Study”"}
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
