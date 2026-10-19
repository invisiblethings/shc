import { memo, useMemo } from "react";
import { buildKeys, noteName, pitchHue } from "./notes.js";

const pretty = (midi) => noteName(midi).replace("#", "♯");

const Key = memo(function Key({ midi, black, left, width, active, zone, next, hint, labels, onDown, onUp }) {
  const style = { left: `${left}%`, width: `${width}%`, "--h": Math.round(pitchHue(midi)) };
  const cls = `key ${black ? "black" : "white"}${active ? " active" : ""}${zone ? " zone" : ""}${next ? " next" : ""}`;
  const down = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const y = Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height));
    e.currentTarget.releasePointerCapture?.(e.pointerId);
    onDown(midi, 0.28 + 0.67 * y); // strike nearer the front of the key, play louder
  };
  const showNote = labels === "notes" || (!black && midi % 12 === 0);
  return (
    <button
      type="button"
      tabIndex={-1}
      aria-label={pretty(midi)}
      aria-pressed={active}
      className={cls}
      style={style}
      onPointerDown={down}
      onPointerUp={() => onUp(midi)}
      onPointerCancel={() => onUp(midi)}
      onPointerLeave={() => active && onUp(midi)}
      onPointerEnter={(e) => e.buttons === 1 && down(e)}
    >
      {showNote && <span className={labels === "notes" ? "note-label" : "c-label"}>{labels === "notes" && midi % 12 !== 0 ? pretty(midi).replace(/-?\d+$/, "") : pretty(midi)}</span>}
      {hint && <span className="hint">{hint}</span>}
    </button>
  );
});

export default function Keyboard({ first, last, active, hints, labels, zone, next, onDown, onUp }) {
  const { keys, whiteCount } = useMemo(() => buildKeys(first, last), [first, last]);
  const ww = 100 / whiteCount;
  return (
    <div className="keys" onContextMenu={(e) => e.preventDefault()}>
      {keys.map(({ midi, black, whiteIndex }) => (
        <Key
          key={midi}
          midi={midi}
          black={black}
          left={black ? (whiteIndex + 1) * ww - ww * 0.31 : whiteIndex * ww}
          width={black ? ww * 0.62 : ww}
          active={active.has(midi)}
          zone={midi >= zone[0] && midi <= zone[1]}
          next={midi === next}
          hint={hints.get(midi)}
          labels={labels}
          onDown={onDown}
          onUp={onUp}
        />
      ))}
    </div>
  );
}
