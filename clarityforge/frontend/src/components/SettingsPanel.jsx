import { Settings2, RotateCcw } from "lucide-react";
import { PRESETS, SLIDERS } from "../presets";

export default function SettingsPanel({
  settings,
  onChange,
  preset,
  onPreset,
  scales,
  extra,
  disabled,
}) {
  const set = (key, value) => onChange({ ...settings, [key]: value });

  return (
    <div className="settings">
      <div className="section-heading">
        <div>
          <h2>
            <Settings2 size={19} /> Enhancement
          </h2>
          <p>Pick a preset, then fine-tune.</p>
        </div>
        <button
          type="button"
          className="text-button"
          onClick={() => onPreset(PRESETS[0])}
          disabled={disabled}
          title="Reset to Smart Auto"
        >
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <div className="preset-grid">
        {PRESETS.map((p) => (
          <button
            type="button"
            key={p.id}
            className={`preset ${preset === p.id ? "active" : ""}`}
            onClick={() => onPreset(p)}
            disabled={disabled}
            title={p.description}
          >
            <span className="preset-emoji">{p.emoji}</span>
            <span className="preset-name">{p.name}</span>
          </button>
        ))}
      </div>

      <label className="field-label">Upscale (increase pixels)</label>
      <div className="segmented">
        {scales.map((s) => (
          <button
            type="button"
            key={s}
            className={Number(settings.scale) === s ? "active" : ""}
            onClick={() => set("scale", s)}
            disabled={disabled}
          >
            {s === 1 ? "Original" : `${s}×`}
          </button>
        ))}
      </div>

      <div className="sliders">
        {SLIDERS.map((sl) => {
          const value = settings[sl.key];
          const pct = ((value - sl.min) / (sl.max - sl.min)) * 100;
          return (
            <div className="slider" key={sl.key}>
              <div className="slider-top">
                <label htmlFor={sl.key}>{sl.label}</label>
                <strong>{sl.key === "brightness" && value > 0 ? `+${value}` : value}</strong>
              </div>
              <input
                id={sl.key}
                type="range"
                min={sl.min}
                max={sl.max}
                value={value}
                disabled={disabled}
                style={{ "--pct": `${pct}%` }}
                onChange={(e) => set(sl.key, Number(e.target.value))}
              />
              <small>{sl.hint}</small>
            </div>
          );
        })}
      </div>

      {extra}
    </div>
  );
}
