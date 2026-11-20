import { useEffect, useRef, useState } from "react";
import axios from "axios";
import {
  Camera, Download, LoaderCircle, AlertTriangle, CheckCircle2, X, RefreshCw, Aperture, Focus,
} from "lucide-react";
import Dropzone from "./Dropzone";
import BeforeAfter from "./BeforeAfter";
import { Stat } from "./ImageStudio";
import { CAMERA_LOOKS, CAMERA_SLIDERS, CAMERA_RESOLUTIONS, formatSize } from "../presets";

const MAX_BYTES = 25 * 1024 * 1024;
const IMAGE_RE = /\.(jpe?g|png|webp|bmp|tiff?|heic|heif|avif)$/i;

export default function CameraStudio() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [previewOk, setPreviewOk] = useState(true);
  const [dims, setDims] = useState(null);
  const [look, setLook] = useState("iphone");
  const [settings, setSettings] = useState(CAMERA_LOOKS[0].settings);
  const [focus, setFocus] = useState({ x: 0.5, y: 0.45 });
  const [format, setFormat] = useState("JPEG");
  const [status, setStatus] = useState("idle");
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const timer = useRef(null);
  const resultRef = useRef(null);

  useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview]);
  useEffect(() => () => result && URL.revokeObjectURL(result.url), [result]);
  useEffect(() => () => clearInterval(timer.current), []);

  const onFile = (f) => {
    if (!IMAGE_RE.test(f.name)) return setError("Unsupported file. Use JPG, PNG, WebP, HEIC, AVIF, BMP or TIFF.");
    if (f.size > MAX_BYTES) return setError("Image is larger than 25 MB.");
    setError("");
    setResult(null);
    setStatus("idle");
    setDims(null);
    setPreviewOk(true);
    setFocus({ x: 0.5, y: 0.45 });
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const pickLook = (l) => {
    setLook(l.id);
    setSettings(l.settings);
  };

  const set = (key, value) => setSettings((s) => ({ ...s, [key]: value }));

  const clear = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError("");
    setStatus("idle");
  };

  const onPreviewClick = (e) => {
    if (!settings.bokeh) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setFocus({
      x: Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width)),
      y: Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height)),
    });
  };

  const develop = async () => {
    if (!file || status === "processing") return;
    setStatus("processing");
    setError("");
    setProgress(0);
    setResult(null);

    const form = new FormData();
    form.append("file", file);
    form.append("settings", JSON.stringify({ ...settings, look, focus_x: focus.x, focus_y: focus.y }));
    form.append("output_format", format);

    clearInterval(timer.current);
    try {
      const res = await axios.post("/api/camera/image", form, {
        responseType: "blob",
        timeout: 600000,
        onUploadProgress: (e) => {
          if (!e.total) return;
          setProgress(Math.round((e.loaded / e.total) * 20));
          if (e.loaded >= e.total) {
            timer.current = setInterval(() => setProgress((v) => (v < 95 ? v + (95 - v) * 0.05 : v)), 250);
          }
        },
      });
      const h = res.headers;
      setResult({
        url: URL.createObjectURL(res.data),
        filename: decodeURIComponent(h["x-filename"] || "camera.jpg"),
        originalWidth: +h["x-original-width"],
        originalHeight: +h["x-original-height"],
        width: +h["x-output-width"],
        height: +h["x-output-height"],
        originalSize: +h["x-original-size"],
        size: +h["x-output-size"],
        format: h["x-output-format"],
        time: +h["x-process-time"],
        subject: h["x-subject-coverage"] ? +h["x-subject-coverage"] : null,
        lookName: CAMERA_LOOKS.find((l) => l.id === look)?.name || "Camera",
      });
      setProgress(100);
      setStatus("done");
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 120);
    } catch (err) {
      let msg = "Processing failed. Please try again.";
      if (!err.response) msg = "Cannot reach the ClarityForge server. Is the backend running on port 8002?";
      else if (err.response.data instanceof Blob) {
        try {
          msg = JSON.parse(await err.response.data.text()).detail || msg;
        } catch {
          /* keep default */
        }
      }
      setError(msg);
      setStatus("error");
    } finally {
      clearInterval(timer.current);
    }
  };

  const download = () => {
    const a = document.createElement("a");
    a.href = result.url;
    a.download = result.filename;
    a.click();
  };

  const processing = status === "processing";
  const current = CAMERA_LOOKS.find((l) => l.id === look);
  const targetMp = settings.resolution === "original" ? null : Number(settings.resolution);
  const estMp = dims
    ? targetMp
      ? Math.min(targetMp, ((dims.w * dims.h) / 1e6) * 16)
      : (dims.w * dims.h) / 1e6
    : null;

  return (
    <>
      <section className="look-strip">
        {CAMERA_LOOKS.map((l) => (
          <button
            type="button"
            key={l.id}
            className={`look-card ${look === l.id ? "active" : ""}`}
            onClick={() => pickLook(l)}
            disabled={processing}
          >
            <span className="look-emoji">{l.emoji}</span>
            <span className="look-name">{l.name}</span>
            <span className="look-badge">{l.badge}</span>
            <span className="look-desc">{l.description}</span>
          </button>
        ))}
      </section>

      <section className="workspace">
        <div className="panel">
          {!file ? (
            <>
              <div className="section-heading">
                <div>
                  <h2>
                    <Camera size={19} /> Upload any photo
                  </h2>
                  <p>Phone snapshot, webcam shot or old picture — we'll give it a pro camera look.</p>
                </div>
              </div>
              <Dropzone
                accept="image/*,.heic,.heif"
                onFile={onFile}
                title="Drop your photo here"
                subtitle="Drag & drop"
                formats={["JPG", "PNG", "WebP", "HEIC", "AVIF"]}
                limit="Up to 25 MB · Output up to 24 MP"
              />
            </>
          ) : (
            <>
              <div className="file-head">
                <div className="file-meta">
                  <strong title={file.name}>{file.name}</strong>
                  <small>
                    {formatSize(file.size)}
                    {dims && ` · ${dims.w}×${dims.h}px`}
                  </small>
                </div>
                <button type="button" className="icon-button" onClick={clear} disabled={processing} aria-label="Remove">
                  <X size={18} />
                </button>
              </div>

              <div className="focus-stage">
                {previewOk ? (
                  <div className={`focus-box ${settings.bokeh ? "can-focus" : ""}`} onClick={onPreviewClick}>
                    <img
                      src={preview}
                      alt="Original"
                      draggable={false}
                      onLoad={(e) => setDims({ w: e.target.naturalWidth, h: e.target.naturalHeight })}
                      onError={() => setPreviewOk(false)}
                    />
                    {settings.bokeh > 0 && (
                      <span
                        key={`${focus.x}-${focus.y}`}
                        className="focus-square"
                        style={{ left: `${focus.x * 100}%`, top: `${focus.y * 100}%` }}
                      />
                    )}
                  </div>
                ) : (
                  <div className="preview-placeholder">
                    <Camera size={34} />
                    <span>Preview not supported by your browser (HEIC) — processing still works.</span>
                  </div>
                )}
              </div>
              {settings.bokeh > 0 ? (
                <p className="focus-hint">
                  <Focus size={14} /> Tap your subject to set the focus point — everything else gets lens blur.
                </p>
              ) : (
                <p className="focus-hint muted-hint">
                  <Aperture size={14} /> Turn on <b>Background Blur</b> (or pick a Portrait look) for portrait mode.
                </p>
              )}
            </>
          )}
        </div>

        <aside className="panel">
          <div className="section-heading">
            <div>
              <h2>
                <Aperture size={19} /> {current?.name} look
              </h2>
              <p>{current?.description}</p>
            </div>
          </div>

          <label className="field-label">Output resolution</label>
          <div className="segmented">
            {CAMERA_RESOLUTIONS.map((r) => (
              <button
                type="button"
                key={r.id}
                className={settings.resolution === r.id ? "active" : ""}
                onClick={() => set("resolution", r.id)}
                disabled={processing}
              >
                {r.label}
              </button>
            ))}
          </div>

          <div className="sliders">
            {CAMERA_SLIDERS.map((sl) => {
              const value = settings[sl.key];
              const pct = ((value - sl.min) / (sl.max - sl.min)) * 100;
              return (
                <div className="slider" key={sl.key}>
                  <div className="slider-top">
                    <label htmlFor={`cam-${sl.key}`}>{sl.label}</label>
                    <strong>{sl.key === "warmth" && value > 0 ? `+${value}` : value}</strong>
                  </div>
                  <input
                    id={`cam-${sl.key}`}
                    type="range"
                    min={sl.min}
                    max={sl.max}
                    value={value}
                    disabled={processing}
                    style={{ "--pct": `${pct}%` }}
                    onChange={(e) => set(sl.key, Number(e.target.value))}
                  />
                  <small>{sl.hint}</small>
                </div>
              );
            })}
          </div>

          <label className="field-label" htmlFor="cam-format">Output format</label>
          <select id="cam-format" value={format} onChange={(e) => setFormat(e.target.value)} disabled={processing}>
            <option value="JPEG">JPEG — like a camera (quality 95)</option>
            <option value="PNG">PNG — lossless</option>
            <option value="WEBP">WebP — compact</option>
          </select>

          {estMp && (
            <div className="estimate">
              <span>{dims.w}×{dims.h}</span>
              <span className="arrow">→</span>
              <strong>≈ {estMp.toFixed(1)} MP</strong>
              {targetMp && estMp < targetMp && <small>(max 4× upscale)</small>}
            </div>
          )}

          <button type="button" className="primary-button" onClick={develop} disabled={!file || processing}>
            {processing ? (
              <>
                <LoaderCircle size={18} className="spin" /> Developing photo… {Math.round(progress)}%
              </>
            ) : (
              <>
                <Camera size={18} /> Apply {current?.name} look
              </>
            )}
          </button>
          {processing && (
            <div className="progress-track">
              <div className="progress-bar" style={{ width: `${progress}%` }} />
            </div>
          )}
        </aside>
      </section>

      {error && (
        <div className="error-message">
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      {result && (
        <section className="panel result" ref={resultRef}>
          <div className="result-heading">
            <div>
              <div className="success-label">
                <CheckCircle2 size={16} /> {result.lookName.toUpperCase()} LOOK APPLIED
              </div>
              <h2>Your photo now looks like it was shot on a {look.startsWith("dslr") ? "DSLR" : "flagship phone"}.</h2>
            </div>
            <button type="button" className="text-button" onClick={develop} disabled={processing}>
              <RefreshCw size={14} /> Re-develop with current settings
            </button>
          </div>

          <div className="stats-grid">
            <Stat label="Resolution" value={`${result.width}×${result.height}`} sub={`from ${result.originalWidth}×${result.originalHeight}`} />
            <Stat
              label="Megapixels"
              value={`${((result.width * result.height) / 1e6).toFixed(1)} MP`}
              sub={`was ${((result.originalWidth * result.originalHeight) / 1e6).toFixed(1)} MP`}
              highlight
            />
            <Stat
              label={result.subject != null ? "Subject detected" : "File size"}
              value={result.subject != null ? `${result.subject}% of frame` : formatSize(result.size)}
              sub={result.subject != null ? "portrait-mode mask" : `${result.format} · was ${formatSize(result.originalSize)}`}
            />
            <Stat label="Processing time" value={`${result.time.toFixed(1)}s`} sub="local camera pipeline" />
          </div>

          {previewOk ? (
            <BeforeAfter before={preview} after={result.url} beforeLabel="Original" afterLabel={result.lookName} />
          ) : (
            <div className="preview-frame large">
              <img src={result.url} alt="Result" />
            </div>
          )}

          <button type="button" className="primary-button download" onClick={download}>
            <Download size={18} /> Download {result.format} ({formatSize(result.size)})
          </button>
        </section>
      )}
    </>
  );
}
