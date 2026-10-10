import { nearestSample, playbackRate } from "../notes.js";

const MAX_VOICES = 64;

/**
 * Sampled grand piano on the Web Audio API.
 *
 * Each note is a pitch-shifted sample through a velocity-controlled low-pass
 * (soft playing is darker), an amplitude envelope and a shared convolution
 * reverb, into a gentle compressor. A sustain pedal keeps released notes ringing.
 */
export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.buffers = new Map(); // midi -> AudioBuffer
    this.sampleKeys = [];
    this.voices = new Map(); // midi -> { src, gain }
    this.sustained = new Set(); // keys released while the pedal was down
    this.sustainOn = false;
    this.meter = null;
  }

  /** Must run inside a user gesture; browsers keep the context suspended until then. */
  async start() {
    if (!this.ctx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      const ctx = new Ctx({ latencyHint: "interactive" });
      this.ctx = ctx;

      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.value = -16;
      compressor.knee.value = 24;
      compressor.ratio.value = 3;
      compressor.attack.value = 0.004;
      compressor.release.value = 0.25;

      this.master = ctx.createGain();
      this.master.gain.value = 0.85;
      this.analyser = ctx.createAnalyser();
      this.analyser.fftSize = 512;
      this.analyser.smoothingTimeConstant = 0.8;
      this.meter = new Uint8Array(this.analyser.fftSize);
      compressor.connect(this.master).connect(this.analyser).connect(ctx.destination);

      this.dry = ctx.createGain();
      this.dry.connect(compressor);

      const convolver = ctx.createConvolver();
      convolver.buffer = this.#impulseResponse(2.8);
      this.send = ctx.createGain();
      this.send.gain.value = 0.18;
      this.send.connect(convolver).connect(compressor);
    }
    if (this.ctx.state === "suspended") await this.ctx.resume();
  }

  /** manifest: { [midi]: url }. Resolves to the number of samples that loaded. */
  async loadSamples(manifest, onProgress = () => {}) {
    await this.start();
    const entries = Object.entries(manifest);
    let done = 0;
    await Promise.all(
      entries.map(async ([midi, url]) => {
        try {
          const res = await fetch(url);
          if (!res.ok) throw new Error(`${res.status} ${url}`);
          const data = await res.arrayBuffer();
          this.buffers.set(Number(midi), await this.ctx.decodeAudioData(data));
        } catch (err) {
          console.warn("Sample failed to load:", err);
        } finally {
          onProgress(++done, entries.length);
        }
      }),
    );
    this.sampleKeys = [...this.buffers.keys()];
    return this.buffers.size;
  }

  get ready() {
    return this.ctx?.state === "running" && this.buffers.size > 0;
  }

  setVolume(v) {
    if (this.master) this.master.gain.setTargetAtTime(v, this.ctx.currentTime, 0.02);
  }

  setReverb(v) {
    if (this.send) this.send.gain.setTargetAtTime(v * 0.55, this.ctx.currentTime, 0.05);
  }

  /** Current output loudness, 0..1. */
  level() {
    if (!this.analyser) return 0;
    this.analyser.getByteTimeDomainData(this.meter);
    let sum = 0;
    for (const s of this.meter) sum += ((s - 128) / 128) ** 2;
    return Math.min(1, Math.sqrt(sum / this.meter.length) * 3);
  }

  noteOn(midi, velocity = 0.7) {
    if (!this.ready) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;
    this.sustained.delete(midi);
    this.#release(midi, 0.03); // retrigger: damp the previous strike of this key

    const v = Math.min(1, Math.max(0.05, velocity));
    const sampleMidi = nearestSample(this.sampleKeys, midi);

    const src = ctx.createBufferSource();
    src.buffer = this.buffers.get(sampleMidi);
    src.playbackRate.value = playbackRate(sampleMidi, midi);

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 1600 + v ** 1.3 * 16000;
    filter.Q.value = 0.3;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.12 + 0.88 * v ** 1.5, t + 0.003);

    src.connect(filter).connect(gain);
    gain.connect(this.dry);
    gain.connect(this.send);
    src.start(t);

    const voice = { src, gain };
    this.voices.set(midi, voice);
    src.onended = () => {
      gain.disconnect();
      if (this.voices.get(midi) === voice) this.voices.delete(midi);
    };

    if (this.voices.size > MAX_VOICES) this.#release(this.voices.keys().next().value, 0.05);
  }

  noteOff(midi) {
    if (this.sustainOn) this.sustained.add(midi);
    else this.#release(midi);
  }

  setSustain(on) {
    this.sustainOn = on;
    if (on) return;
    for (const midi of this.sustained) this.#release(midi);
    this.sustained.clear();
  }

  allNotesOff() {
    this.sustained.clear();
    for (const midi of [...this.voices.keys()]) this.#release(midi, 0.08);
  }

  // Damper falls: low strings ring a little longer than high ones.
  #release(midi, tau = 0.09 + (1 - (midi - 21) / 87) * 0.14) {
    const voice = this.voices.get(midi);
    if (!voice) return;
    this.voices.delete(midi);
    const t = this.ctx.currentTime;
    voice.gain.gain.cancelScheduledValues(t);
    voice.gain.gain.setValueAtTime(voice.gain.gain.value, t);
    voice.gain.gain.setTargetAtTime(0, t, tau);
    voice.src.stop(t + tau * 8);
  }

  // Generated hall: decaying stereo noise that darkens as it fades.
  #impulseResponse(seconds) {
    const rate = this.ctx.sampleRate;
    const length = Math.floor(rate * seconds);
    const ir = this.ctx.createBuffer(2, length, rate);
    for (let ch = 0; ch < 2; ch++) {
      const data = ir.getChannelData(ch);
      let lp = 0;
      for (let i = 0; i < length; i++) {
        const x = i / length;
        lp += (0.08 + 0.6 * (1 - x)) * ((Math.random() * 2 - 1) - lp);
        data[i] = lp * (1 - x) ** 2.4 * (i < rate * 0.012 ? i / (rate * 0.012) : 1);
      }
    }
    return ir;
  }
}
