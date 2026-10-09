import { useMemo } from "react";
import { buildKeys, noteName } from "./notes.js";

export default function Keyboard({ first, last, active, onDown, onUp }) {
  const { keys, whiteCount } = useMemo(() => buildKeys(first, last), [first, last]);
  const whiteWidth = 100 / whiteCount;

  return (
    <div className="keyboard" onContextMenu={(e) => e.preventDefault()}>
      {keys.map(({ midi, black, whiteIndex }) => {
        const style = black
          ? { left: `${(whiteIndex + 1) * whiteWidth - whiteWidth * 0.3}%`, width: `${whiteWidth * 0.6}%` }
          : { left: `${whiteIndex * whiteWidth}%`, width: `${whiteWidth}%` };
        return (
          <button
            key={midi}
            type="button"
            tabIndex={-1}
            aria-label={noteName(midi)}
            className={`key ${black ? "black" : "white"}${active.has(midi) ? " active" : ""}`}
            style={style}
            onPointerDown={(e) => {
              e.currentTarget.releasePointerCapture?.(e.pointerId);
              onDown(midi);
            }}
            onPointerUp={() => onUp(midi)}
            onPointerLeave={() => active.has(midi) && onUp(midi)}
            onPointerEnter={(e) => e.buttons === 1 && onDown(midi)}
          >
            {!black && <span className="label">{noteName(midi)}</span>}
          </button>
        );
      })}
    </div>
  );
}
