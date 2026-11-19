import { useEffect, useRef, useState } from "react";
import axios from "axios";
import {
  Wand2, Download, LoaderCircle, ScanSearch, AlertTriangle, CheckCircle2, X, Image as ImageIcon, RefreshCw,
} from "lucide-react";
import Dropzone from "./Dropzone";
import BeforeAfter from "./BeforeAfter";
import SettingsPanel from "./SettingsPanel";
import { PRESETS, IMAGE_SCALES, formatSize } from "../presets";

const MAX_BYTES = 25 * 1024 * 1024;
const MAX_OUTPUT_PIXELS = 24_000_000;
const IMAGE_RE = /\.(jpe?g|png|webp|bmp|tiff?|heic|heif|avif|gif)$/i;

function errorMessage(err, fallback) {
  if (!err.response) return "Cannot reach the ClarityForge server. Is the backend running on port 8002?";
  return err.response.data?.detail || fallback;
}

async function blobError(err, fallback) {
  if (err.response?.data instanceof Blob) {
    try {
      return JSON.parse(await err.response.data.text()).detail || fallback;
    } catch {
      return fallback;
    }
  }
  return errorMessage(err, fallback);
}

export default function ImageStudio() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [previewOk, setPreviewOk] = useState(true);
  const [settings, setSettings] = useState(PRESETS[0].settings);
  const [preset, setPreset] = useState("auto");
  const [format, setFormat] = useState("PNG");
  const [analysis, setAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [status, setStatus] = useState("idle");
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const timer = useRef(null);
  const resultRef = useRef(null);
  const presetRef = useRef(preset);

  useEffect(() => {
    presetRef.current = preset;
  }, [preset]);

  useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview]);
  useEffect(() => () => result && URL.revokeObjectURL(result.url), [result]);
  useEffect(() => () => clearInterval(timer.current), []);

  const onFile = async (f) => {
    if (!IMAGE_RE.test(f.name)) return setError("Unsupported file. Use JPG, PNG, WebP, HEIC, AVIF, BMP or TIFF.");
    if (f.size > MAX_BYTES) return setError("Image is larger than 25 MB.");
    setError("");
    setResult(null);
    setAnalysis(null);
    setStatus("idle");
    setFile(f);
    setPreviewOk(true);
    setPreview(URL.createObjectURL(f));

    setAnalyzing(true);
    try {
      const form = new FormData();
      form.append("file", f);
      const { data } = await axios.post("/api/analyze/image", form);
      setAnalysis(data);
      if (presetRef.current === "auto") setSettings(data.recommended);
    } catch (err) {
      setError(errorMessage(err, "Could not analyze this image."));
    } finally {
      setAnalyzing(false);
    }
  };

  const applyPreset = (p) => {
    setPreset(p.id);
    setSettings(p.id === "auto" && analysis ? analysis.recommended : p.settings);
  };

  const changeSettings = (next) => {
    setSettings(next);
    setPreset("custom");
  };

  const clear = () => {
    setFile(null);
    setPreview(null);
    setAnalysis(null);
    setResult(null);
    setError("");
    setStatus("idle");
    setPreset("auto");
    setSettings(PRESETS[0].settings);
  };

  const enhance = async () => {
    if (!file || status === "processing") return;
    setStatus("processing");
    setError("");
    setProgress(0);
    setResult(null);

    const form = new FormData();
    form.append("file", file);
    form.append("settings", JSON.stringify(settings));
    form.append("output_format", format);

    clearInterval(timer.current);
    try {
      const res = await axios.post("/api/enhance/image", form, {
        responseType: "blob",
        timeout: 600000,
        onUploadProgress: (e) => {
          if (!e.total) return;
          const p = Math.round((e.loaded / e.total) * 25);
          setProgress(p);
          if (e.loaded >= e.total) {
            // Server-side processing: ease toward 95% while we wait
            timer.current = setInterval(() => setProgress((v) => (v < 95 ? v + (95 - v) * 0.06 : v)), 250);
          }
        },
      });
      const h = res.headers;
      setResult({
        url: URL.createObjectURL(res.data),
        blob: res.data,
        filename: decodeURIComponent(h["x-filename"] || "enhanced.png"),
        originalWidth: +h["x-original-width"],
        originalHeight: +h["x-original-height"],
        width: +h["x-output-width"],
        height: +h["x-output-height"],
        scale: +h["x-scale"],
        originalSize: +h["x-original-size"],
        size: +h["x-output-size"],
        format: h["x-output-format"],
        time: +h["x-process-time"],
      });
      setProgress(100);
      setStatus("done");
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 120);
    } catch (err) {
      setError(await blobError(err, "Enhancement failed. Please try again."));
      setStatus("error");
    } finally {
      clearInterval(timer.current);
    }
  };

  const download = () => {
    if (!result) return;
    const a = document.createElement("a");
    a.href = result.url;
    a.download = result.filename;
    a.click();
  };

  // Output size estimate
  const est = (() => {
    if (!analysis) return null;
    const { width: w, height: h } = analysis;
    let s = Number(settings.scale);
    if (s > 1) s = Math.min(s, Math.sqrt(MAX_OUTPUT_PIXELS / (w * h)));
    s = Math.max(1, s);
    return { w, h, ow: Math.round(w * s), oh: Math.round(h * s), capped: s < Number(settings.scale) };
  })();

  const processing = status === "processing";

  return (
    <>
      <section className="workspace">
        <div className="panel">
          {!file ? (
            <>
              <div className="section-heading">
                <div>
                  <h2>
                    <ImageIcon size={19} /> Upload a photo
                  </h2>
                  <p>We'll analyze it and suggest the best fix automatically.</p>
                </div>
              </div>
              <Dropzone
                accept="image/*,.heic,.heif"
                onFile={onFile}
                title="Drop your photo here"
                subtitle="Drag & drop"
                formats={["JPG", "PNG", "WebP", "HEIC", "AVIF", "TIFF"]}
                limit="Up to 25 MB · Output up to 24 megapixels"
              />
            </>
          ) : (
            <>
              <div className="file-head">
                <div className="file-meta">
                  <strong title={file.name}>{file.name}</strong>
                  <small>
                    {formatSize(file.size)}
                    {analysis && ` · ${analysis.width}×${analysis.height}px`}
                  </small>
                </div>
                <button type="button" className="icon-button" onClick={clear} disabled={processing} aria-label="Remove">
                  <X size={18} />
                </button>
              </div>

              <div className="preview-frame">
                {previewOk ? (
                  <img src={preview} alt="Original" onError={() => setPreviewOk(false)} />
                ) : (
                  <div className="preview-placeholder">
                    <ImageIcon size={34} />
                    <span>Preview not supported by your browser (HEIC) — enhancement still works.</span>
                  </div>
                )}
              </div>

              <div className="analysis">
                <div className="analysis-title">
                  <ScanSearch size={16} /> Smart analysis
                  {analyzing && <LoaderCircle size={14} className="spin" />}
                </div>
                {analysis ? (
                  <>
                    <div className="meters">
                      <Meter label="Sharpness" value={analysis.metrics.sharpness} />
                      <Meter label="Brightness" value={analysis.metrics.brightness} />
                      <Meter label="Saturation" value={analysis.metrics.saturation} />
                      <Meter label="Noise" value={Math.min(100, analysis.metrics.noise * 10)} invert />
                    </div>
                    <ul className="issues">
                      {analysis.issues.map((i) => (
                        <li key={i}>
                          {i.includes("good shape") ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
                          {i}
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  !analyzing && <small className="muted">Analysis unavailable.</small>
                )}
              </div>
            </>
          )}
        </div>

        <aside className="panel">
          <SettingsPanel
            settings={settings}
            onChange={changeSettings}
            preset={preset}
            onPreset={applyPreset}
            scales={IMAGE_SCALES}
            disabled={processing}
            extra={
              <>
                <label className="field-label" htmlFor="format">Output format</label>
                <select id="format" value={format} onChange={(e) => setFormat(e.target.value)} disabled={processing}>
                  <option value="PNG">PNG — lossless, best quality</option>
                  <option value="JPEG">JPEG — smaller file (quality 95)</option>
                  <option value="WEBP">WebP — modern & compact</option>
                </select>

                {est && (
                  <div className="estimate">
                    <span>{est.w}×{est.h}</span>
                    <span className="arrow">→</span>
                    <strong>{est.ow}×{est.oh}</strong>
                    {est.capped && <small>(capped at 24 MP)</small>}
                  </div>
                )}

                <button type="button" className="primary-button" onClick={enhance} disabled={!file || processing || analyzing}>
                  {processing ? (
                    <>
                      <LoaderCircle size={18} className="spin" /> Enhancing… {Math.round(progress)}%
                    </>
                  ) : (
                    <>
                      <Wand2 size={18} /> Enhance photo
                    </>
                  )}
                </button>
                {processing && (
                  <div className="progress-track">
                    <div className="progress-bar" style={{ width: `${progress}%` }} />
                  </div>
                )}
              </>
            }
          />
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
                <CheckCircle2 size={16} /> ENHANCEMENT COMPLETE
              </div>
              <h2>Your photo is sharper, cleaner and {result.scale > 1 ? `${result.scale}× bigger` : "more vibrant"}.</h2>
            </div>
            <button type="button" className="text-button" onClick={enhance} disabled={processing}>
              <RefreshCw size={14} /> Re-run with current settings
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
            <Stat label="File size" value={formatSize(result.size)} sub={`${result.format} · was ${formatSize(result.originalSize)}`} />
            <Stat label="Processing time" value={`${result.time.toFixed(1)}s`} sub="local CPU engine" />
          </div>

          {previewOk ? (
            <BeforeAfter before={preview} after={result.url} beforeLabel="Original" afterLabel="Enhanced" />
          ) : (
            <div className="preview-frame large">
              <img src={result.url} alt="Enhanced" />
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

function Meter({ label, value, invert }) {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  const good = invert ? v < 40 : v >= 40 && v <= 85;
  return (
    <div className="meter">
      <div className="meter-top">
        <span>{label}</span>
        <strong>{invert ? (v < 30 ? "Low" : v < 60 ? "Medium" : "High") : `${v}%`}</strong>
      </div>
      <div className="meter-track">
        <div className={`meter-fill ${good ? "good" : "warn"}`} style={{ width: `${Math.max(4, v)}%` }} />
      </div>
    </div>
  );
}

function Stat({ label, value, sub, highlight }) {
  return (
    <div className={`stat ${highlight ? "highlight" : ""}`}>
      <small>{label}</small>
      <strong>{value}</strong>
      {sub && <span>{sub}</span>}
    </div>
  );
}

export { Stat };
