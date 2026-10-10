import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { isBlack, pitchHue } from "./notes.js";

const RISE = 150; // px per second
const MAX_PARTICLES = 360;

/**
 * Canvas of light that rises from the keys: every note draws a ribbon that grows
 * while the key is held and lifts away when it is released, shedding sparks.
 * Imperative handle: noteOn(midi, velocity), noteOff(midi).
 */
const Aurora = forwardRef(function Aurora({ width, height, keyX, whiteWidth, getLevel }, ref) {
  const canvasRef = useRef(null);
  const state = useRef({ ribbons: [], open: new Map(), particles: [], raf: 0, last: 0 });
  const props = useRef({});
  props.current = { width, height, keyX, whiteWidth, getLevel };

  const frame = (now) => {
    const canvas = canvasRef.current;
    const s = state.current;
    if (!canvas) return;
    const { width: w, height: h, keyX: xOf, getLevel: level } = props.current;
    const ctx = canvas.getContext("2d");
    const dt = Math.min(0.05, (now - (s.last || now)) / 1000);
    s.last = now;

    // Let the page glow with the loudness of the piano.
    const lvl = level ? level() : 0;
    canvas.parentElement?.style.setProperty("--level", lvl.toFixed(3));

    ctx.setTransform(canvas.width / w, 0, 0, canvas.height / h, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.globalCompositeOperation = "lighter";

    const t = now / 1000;
    for (const r of s.ribbons) {
      const top = h - (t - r.t0) * RISE * r.speed;
      const bottom = r.t1 === null ? h : h - (t - r.t1) * RISE * r.speed;
      if (bottom < 0) {
        r.dead = true;
        continue;
      }
      const x = xOf(r.midi);
      const half = r.width / 2;
      const fade = Math.min(1, Math.max(0, bottom / (h * 0.55)));
      const a = (0.25 + 0.6 * r.vel) * (r.t1 === null ? 1 : fade);

      const grad = ctx.createLinearGradient(0, Math.max(0, top), 0, bottom);
      grad.addColorStop(0, `hsla(${r.hue}, 95%, 70%, 0)`);
      grad.addColorStop(0.35, `hsla(${r.hue}, 95%, 65%, ${a * 0.55})`);
      grad.addColorStop(1, `hsla(${r.hue}, 100%, 78%, ${a})`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(x - half, Math.max(-20, top), r.width, Math.max(2, bottom - Math.max(-20, top)), half);
      ctx.fill();

      // Soft halo around the ribbon.
      const halo = ctx.createLinearGradient(x - half * 3.4, 0, x + half * 3.4, 0);
      halo.addColorStop(0, `hsla(${r.hue}, 100%, 60%, 0)`);
      halo.addColorStop(0.5, `hsla(${r.hue}, 100%, 62%, ${a * 0.16})`);
      halo.addColorStop(1, `hsla(${r.hue}, 100%, 60%, 0)`);
      ctx.fillStyle = halo;
      ctx.fillRect(x - half * 3.4, Math.max(0, top), half * 6.8, Math.max(0, bottom - Math.max(0, top)));

      // Sparks leave the head of a held note.
      if (r.t1 === null && s.particles.length < MAX_PARTICLES && Math.random() < 0.55 + r.vel * 0.4) {
        s.particles.push({
          x: x + (Math.random() - 0.5) * r.width * 1.6,
          y: Math.max(0, top),
          vx: (Math.random() - 0.5) * 18,
          vy: -(20 + Math.random() * 50),
          life: 0,
          max: 0.9 + Math.random() * 1.1,
          size: 0.8 + Math.random() * 1.8,
          hue: r.hue,
        });
      }
    }

    for (const p of s.particles) {
      p.life += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy *= 0.985;
      const k = 1 - p.life / p.max;
      if (k <= 0) continue;
      ctx.fillStyle = `hsla(${p.hue}, 100%, 78%, ${k * 0.85})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (0.5 + k), 0, Math.PI * 2);
      ctx.fill();
    }

    s.ribbons = s.ribbons.filter((r) => !r.dead);
    s.particles = s.particles.filter((p) => p.life < p.max);

    if (s.ribbons.length || s.particles.length) s.raf = requestAnimationFrame(frame);
    else {
      s.raf = 0;
      s.last = 0;
      ctx.clearRect(0, 0, w, h);
    }
  };

  const wake = () => {
    if (!state.current.raf) state.current.raf = requestAnimationFrame(frame);
  };

  useImperativeHandle(ref, () => ({
    noteOn(midi, vel = 0.7) {
      const s = state.current;
      const { whiteWidth: ww } = props.current;
      const ribbon = {
        midi, vel, hue: pitchHue(midi),
        width: ww * (isBlack(midi) ? 0.34 : 0.5),
        t0: performance.now() / 1000,
        t1: null,
        speed: 0.8 + vel * 0.5,
      };
      s.open.get(midi) && (s.open.get(midi).t1 ??= ribbon.t0);
      s.open.set(midi, ribbon);
      s.ribbons.push(ribbon);
      wake();
    },
    noteOff(midi) {
      const r = state.current.open.get(midi);
      if (r && r.t1 === null) r.t1 = performance.now() / 1000;
      state.current.open.delete(midi);
      wake();
    },
  }));

  useEffect(() => () => cancelAnimationFrame(state.current.raf), []);

  const dpr = typeof window === "undefined" ? 1 : Math.min(2, window.devicePixelRatio || 1);
  return (
    <canvas
      ref={canvasRef}
      className="aurora"
      width={Math.round(width * dpr)}
      height={Math.round(height * dpr)}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
});

export default Aurora;
