import { useRef, useState } from "react";
import { ZoomIn, ZoomOut, MoveHorizontal } from "lucide-react";

/**
 * Before / after comparison. Drag anywhere to move the divider.
 * Zoom mode magnifies both images identically and pans with the mouse
 * so you can inspect fine detail (sharpness, noise) side by side.
 */
export default function BeforeAfter({ before, after, beforeLabel = "Before", afterLabel = "After" }) {
  const ref = useRef(null);
  const [pos, setPos] = useState(50);
  const [zoom, setZoom] = useState(false);
  const [origin, setOrigin] = useState({ x: 50, y: 50 });
  const dragging = useRef(false);

  const locate = (e) => {
    const rect = ref.current.getBoundingClientRect();
    return {
      x: Math.min(100, Math.max(0, ((e.clientX - rect.left) / rect.width) * 100)),
      y: Math.min(100, Math.max(0, ((e.clientY - rect.top) / rect.height) * 100)),
    };
  };

  const onDown = (e) => {
    dragging.current = true;
    ref.current.setPointerCapture?.(e.pointerId);
    setPos(locate(e).x);
  };
  const onMove = (e) => {
    const p = locate(e);
    if (dragging.current) setPos(p.x);
    else if (zoom) setOrigin(p);
  };
  const onUp = () => {
    dragging.current = false;
  };

  const layerStyle = zoom
    ? { transform: "scale(2.6)", transformOrigin: `${origin.x}% ${origin.y}%` }
    : undefined;

  return (
    <div className="compare-wrap">
      <div
        ref={ref}
        className={`compare ${zoom ? "zoomed" : ""}`}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      >
        <div className="compare-layer">
          <img src={after} alt={afterLabel} style={layerStyle} draggable={false} />
        </div>
        <div className="compare-layer" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
          <img src={before} alt={beforeLabel} style={layerStyle} draggable={false} />
        </div>

        <div className="compare-divider" style={{ left: `${pos}%` }}>
          <span className="compare-handle">
            <MoveHorizontal size={16} />
          </span>
        </div>
        <span className="compare-tag left">{beforeLabel}</span>
        <span className="compare-tag right">{afterLabel}</span>
      </div>

      <div className="compare-toolbar">
        <small>Drag to compare{zoom ? " · move the mouse to inspect details" : ""}</small>
        <button type="button" className="chip-button" onClick={() => setZoom((z) => !z)}>
          {zoom ? <ZoomOut size={14} /> : <ZoomIn size={14} />}
          {zoom ? "Fit view" : "Zoom 2.6×"}
        </button>
      </div>
    </div>
  );
}
