import { midiToFrequency, nearestSample, playbackRate } from "../notes.js";

const ATTACK = 0.005;
const RELEASE = 0.18;

/**
 * Web Audio piano. Plays decoded samples pitch-shifted with playbackRate, and
 * falls back to a simple additive synth when no samples are loaded.
 */
export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.reverbSend = null;
    this.buffers = new Map(); // midi -> AudioBuffer
    this.voices = new Map(); // midi -> { gain, stop }
  }

  /** Must be called from a user gesture; browsers keep the context suspended until then. */
  async start() {
    if (!this.ctx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new Ctx();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.8;
      this.master.connect(this.ctx.destination);

      const convolver = this.ctx.createConvolver();
      convolver.buffer = this.#impulseResponse(1.8);
      this.reverbSend = this.ctx.createGain();
      this.reverbSend.gain.value = 0.18;
      this.reverbSend.connect(convolver).connect(this.master);
    }
    if (this.ctx.state === "suspended") await this.ctx.resume();
  }

  get hasSamples() {
    return this.buffers.size > 0;
  }

  setVolume(value) {
    if (this.master) this.master.gain.value = value;
  }

  /** manifest: { [midi]: url }. Missing or failing files are skipped. */
  async loadSamples(manifest) {
    await this.start();
    await Promise.all(
      Object.entries(manifest).map(async ([midi, url]) => {
        try {
          const res = await fetch(url);
          if (!res.ok) return;
          const data = await res.arrayBuffer();
          this.buffers.set(Number(midi), await this.ctx.decodeAudioData(data));
        } catch {
          // Leave this note to the nearest loaded sample or the synth fallback.
        }
      }),
    );
    return this.buffers.size;
  }

  noteOn(midi, velocity = 0.8) {
    if (!this.ctx || this.ctx.state !== "running") return;
    this.noteOff(midi, true); // retrigger: cut the previous voice for this key
    const t = this.ctx.currentTime;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(velocity, t + ATTACK);
    gain.connect(this.master);
    gain.connect(this.reverbSend);

    const stoppers = this.hasSamples
      ? this.#sampleVoice(midi, gain, t)
      : this.#synthVoice(midi, gain, t, velocity);
    this.voices.set(midi, { gain, stop: stoppers });
  }

  noteOff(midi, immediate = false) {
    const voice = this.voices.get(midi);
    if (!voice || !this.ctx) return;
    this.voices.delete(midi);
    const t = this.ctx.currentTime;
    const release = immediate ? 0.02 : RELEASE;
    voice.gain.gain.cancelScheduledValues(t);
    voice.gain.gain.setValueAtTime(voice.gain.gain.value, t);
    voice.gain.gain.setTargetAtTime(0, t, release / 3);
    voice.stop(t + release * 4);
  }

  allNotesOff() {
    for (const midi of [...this.voices.keys()]) this.noteOff(midi);
  }

  #sampleVoice(midi, out, t) {
    const sampleMidi = nearestSample([...this.buffers.keys()], midi);
    const src = this.ctx.createBufferSource();
    src.buffer = this.buffers.get(sampleMidi);
    src.playbackRate.value = playbackRate(sampleMidi, midi);
    src.connect(out);
    src.start(t);
    return (when) => src.stop(when);
  }

  // Additive tone with a piano-like decay: a few harmonics, higher ones fade faster.
  #synthVoice(midi, out, t, velocity) {
    const f0 = midiToFrequency(midi);
    const partials = [1, 2, 3, 4, 6];
    const oscs = partials.map((n, i) => {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = f0 * n;
      g.gain.setValueAtTime((0.5 / n) * velocity, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 3.5 / (1 + i * 0.6));
      osc.connect(g).connect(out);
      osc.start(t);
      return osc;
    });
    return (when) => oscs.forEach((o) => o.stop(when));
  }

  #impulseResponse(seconds) {
    const rate = this.ctx.sampleRate;
    const length = Math.floor(rate * seconds);
    const ir = this.ctx.createBuffer(2, length, rate);
    for (let ch = 0; ch < 2; ch++) {
      const data = ir.getChannelData(ch);
      for (let i = 0; i < length; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / length) ** 3;
      }
    }
    return ir;
  }
}
