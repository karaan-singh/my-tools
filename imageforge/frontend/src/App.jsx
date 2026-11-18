import { useEffect, useRef, useState } from "react";
import axios from "axios";
import {
  UploadCloud,
  Image as ImageIcon,
  Download,
  X,
  Zap,
  FileImage,
  CheckCircle2,
  LoaderCircle,
  Settings2,
  ArrowDown,
  Trash2,
  Sliders,
  Sparkles
} from "lucide-react";
import "./App.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";
const formats = ["AUTO", "JPEG", "PNG", "WEBP", "AVIF", "GIF"];

function formatSize(bytes) {
  if (!bytes) return "0 KB";
  return bytes >= 1024 * 1024
    ? (bytes / (1024 * 1024)).toFixed(2) + " MB"
    : (bytes / 1024).toFixed(1) + " KB";
}

export default function App() {
  const [files, setFiles] = useState([]);
  const [originalPreviews, setOriginalPreviews] = useState([]);
  const [format, setFormat] = useState("AUTO");
  const [quality, setQuality] = useState(82);
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [status, setStatus] = useState("idle");
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const [compareMode, setCompareMode] = useState("side-by-side"); // "side-by-side" or "slider"
  const [sliderPos, setSliderPos] = useState(50);
  const inputRef = useRef(null);

  const addFiles = (selected) => {
    const valid = Array.from(selected).filter(file => {
      const allowed = /\.(jpe?g|png|webp|avif|gif|heic|heif)$/i.test(file.name);
      return allowed && file.size <= 15 * 1024 * 1024;
    });

    if (!valid.length) {
      setError("Please select supported images (JPG, PNG, WebP, AVIF, GIF, HEIC) under 15 MB each.");
      return;
    }

    setError("");
    setResult(null);

    setFiles(old => {
      const combined = [...old, ...valid].slice(0, 20);
      return combined;
    });
  };

  // Generate local previews for uploaded files
  useEffect(() => {
    const urls = files.map(file => {
      try {
        return URL.createObjectURL(file);
      } catch {
        return null;
      }
    });
    setOriginalPreviews(urls);

    return () => {
      urls.forEach(u => {
        if (u) URL.revokeObjectURL(u);
      });
    };
  }, [files]);

  const removeFile = (index) => {
    setFiles(old => old.filter((_, i) => i !== index));
    setResult(null);
  };

  const clearFiles = () => {
    setFiles([]);
    setResult(null);
    setError("");
  };

  useEffect(() => {
    return () => {
      if (result?.preview) URL.revokeObjectURL(result.preview);
    };
  }, [result]);

  const compress = async () => {
    if (!files.length || status === "processing") return;
    setStatus("processing");
    setProgress(0);
    setError("");
    setResult(null);

    const form = new FormData();
    files.forEach(file =>
      form.append(files.length === 1 ? "file" : "files", file)
    );
    form.append("quality", quality);
    form.append("output_format", format);
    form.append("width", width || 0);
    form.append("height", height || 0);

    try {
      const endpoint = files.length === 1 ? `${API}/compress` : `${API}/compress/batch`;
      const response = await axios.post(endpoint, form, {
        responseType: "blob",
        timeout: 300000,
        onUploadProgress: event => {
          if (event.total) {
            setProgress(Math.round((event.loaded / event.total) * 35));
          }
        }
      });

      const originalSize = Number(response.headers["x-original-size"] || 0);
      const compressedSize = Number(response.headers["x-compressed-size"] || response.data.size);
      const reduction = originalSize
        ? ((originalSize - compressedSize) / originalSize) * 100
        : 0;
      const isBatch = files.length > 1;
      const preview = isBatch ? null : URL.createObjectURL(response.data);

      setResult({
        blob: response.data,
        preview,
        originalSize,
        compressedSize,
        reduction,
        isBatch,
        outputFormat: response.headers["x-output-format"] || (isBatch ? "ZIP" : "WEBP")
      });
      setProgress(100);
      setStatus("done");
    } catch (err) {
      let message = "Compression failed. Please try again.";
      if (err.response?.data instanceof Blob) {
        try {
          const body = JSON.parse(await err.response.data.text());
          message = body.detail || message;
        } catch {
          message = "The server returned an invalid response.";
        }
      } else if (err.code === "ECONNABORTED") {
        message = "The request timed out.";
      } else if (!err.response) {
        message = "Cannot connect to backend server. Make sure FastAPI is running on port 8000.";
      }
      setError(message);
      setStatus("error");
    }
  };

  const download = () => {
    if (!result) return;
    const url = URL.createObjectURL(result.blob);
    const link = document.createElement("a");
    link.href = url;
    const ext = result.outputFormat.toLowerCase() === "jpeg" ? "jpg" : result.outputFormat.toLowerCase();
    link.download = result.isBatch
      ? "imageforge_compressed.zip"
      : `imageforge_optimized.${ext}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const reset = () => {
    clearFiles();
    setStatus("idle");
    setProgress(0);
  };

  return (
    <main className="app">
      <nav className="navbar">
        <a href="#" className="brand">
          <span className="brand-icon"><ImageIcon /></span>
          Image<span>Forge</span>
        </a>
        <span className="nav-label">IMAGE OPTIMIZATION STUDIO</span>
        <div className="status-pill">
          <span className="status-dot" /> Engine Active
        </div>
      </nav>

      <section className="hero">
        <div className="eyebrow">
          <Zap size={14} /> SMART IMAGE OPTIMIZATION
        </div>
        <h1>
          Make images lighter.<br />
          <span>Keep them beautiful.</span>
        </h1>
        <p>
          Compress, optimize, and convert JPG, PNG, WebP, AVIF, GIF &amp; HEIC images without sacrificing visual quality.
        </p>
      </section>

      <section className="workspace">
        {/* Upload Panel */}
        <div className="panel upload-panel">
          <div className="section-heading">
            <div>
              <h2>Upload images</h2>
              <p>Choose one image or upload a batch.</p>
            </div>
            <span className="file-count">{files.length}/20</span>
          </div>

          <div
            className={`dropzone ${dragging ? "dragging" : ""}`}
            onDragOver={e => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={e => {
              e.preventDefault();
              setDragging(false);
              addFiles(e.dataTransfer.files);
            }}
            onClick={() => inputRef.current?.click()}
          >
            <div className="upload-icon"><UploadCloud size={28} /></div>
            <h3>Drop your images here</h3>
            <p>or <span>browse files</span> from your computer</p>
            <div className="format-tags">
              {["JPG", "PNG", "WebP", "AVIF", "GIF", "HEIC"].map(f => (
                <span key={f}>{f}</span>
              ))}
            </div>
            <small>Maximum 15 MB per image · Up to 20 images in batch</small>
          </div>

          <input
            ref={inputRef}
            type="file"
            hidden
            multiple
            accept="image/jpeg,image/png,image/webp,image/avif,image/gif,image/heic,image/heif"
            onChange={e => {
              addFiles(e.target.files);
              e.target.value = "";
            }}
          />

          {files.length > 0 && (
            <div className="file-list">
              <div className="list-heading">
                <strong>Selected files ({files.length})</strong>
                <button className="text-button" onClick={clearFiles}>
                  <Trash2 size={14} /> Clear all
                </button>
              </div>
              {files.map((file, index) => (
                <div className="file-row" key={`${file.name}-${index}`}>
                  <div className="file-icon">
                    {originalPreviews[index] ? (
                      <img src={originalPreviews[index]} alt="" style={{ width: '28px', height: '28px', objectFit: 'cover', borderRadius: '4px' }} />
                    ) : (
                      <FileImage size={19} />
                    )}
                  </div>
                  <div className="file-info">
                    <strong>{file.name}</strong>
                    <small>{formatSize(file.size)}</small>
                  </div>
                  <button
                    className="icon-button"
                    onClick={() => removeFile(index)}
                    aria-label="Remove file"
                  >
                    <X size={17} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Settings Panel */}
        <aside className="panel settings-panel">
          <div className="section-heading">
            <div>
              <h2><Settings2 size={19} /> Settings</h2>
              <p>Customize your output.</p>
            </div>
          </div>

          <label>Compression mode</label>
          <div className="smart-card">
            <Zap size={19} />
            <div>
              <strong>Smart compression</strong>
              <small>Auto chooses format &amp; preserves transparency / animations</small>
            </div>
            <CheckCircle2 size={18} className="check" />
          </div>

          <label htmlFor="format">Output format</label>
          <select
            id="format"
            value={format}
            onChange={e => setFormat(e.target.value)}
          >
            {formats.map(f => (
              <option key={f} value={f}>
                {f === "AUTO" ? "Auto (Smart choice: WebP/GIF)" : f}
              </option>
            ))}
          </select>

          <div className="setting-label">
            <label htmlFor="quality">Quality Level</label>
            <strong>{quality}%</strong>
          </div>
          <input
            id="quality"
            type="range"
            min="30"
            max="100"
            value={quality}
            onChange={e => setQuality(Number(e.target.value))}
          />
          <div className="range-labels">
            <span>Smaller file (30%)</span>
            <span>Maximum quality (100%)</span>
          </div>

          <label>Resize dimensions (optional)</label>
          <div className="dimensions">
            <input
              type="number"
              min="1"
              max="10000"
              placeholder="Width (px)"
              value={width}
              onChange={e => setWidth(e.target.value)}
            />
            <span>×</span>
            <input
              type="number"
              min="1"
              max="10000"
              placeholder="Height (px)"
              value={height}
              onChange={e => setHeight(e.target.value)}
            />
          </div>
          <small className="hint">
            Images maintain their aspect ratio and fit proportionally inside bounds.
          </small>

          <button
            className="compress-button"
            onClick={compress}
            disabled={!files.length || status === "processing"}
          >
            {status === "processing" ? (
              <>
                <LoaderCircle className="spin" size={18} /> Processing...
              </>
            ) : (
              <>
                <Zap size={18} /> Compress {files.length || ""} {files.length === 1 ? "image" : "images"}
              </>
            )}
          </button>

          {status === "processing" && (
            <div className="progress-area">
              <div className="progress-label">
                <span>Uploading and compressing</span>
                <strong>{progress}%</strong>
              </div>
              <div className="progress-track">
                <div className="progress-fill" />
              </div>
              <small>Optimizing images with Pillow...</small>
            </div>
          )}
        </aside>
      </section>

      {error && <div className="error-message">⚠️ {error}</div>}

      {/* Results Section */}
      {result && (
        <section className="panel result-panel">
          <div className="result-heading">
            <div>
              <div className="success-label">
                <CheckCircle2 size={17} /> COMPRESSION COMPLETE
              </div>
              <h2>Your optimized {result.isBatch ? "images are" : "image is"} ready.</h2>
            </div>
            <button className="text-button" onClick={reset}>Start over</button>
          </div>

          <div className="stats-grid">
            <div className="stat">
              <small>Original size</small>
              <strong>{formatSize(result.originalSize)}</strong>
            </div>
            <div className="stat">
              <small>Optimized size</small>
              <strong>{formatSize(result.compressedSize)}</strong>
            </div>
            <div className="stat highlight-stat">
              <small>Size reduction</small>
              <strong>
                {result.reduction >= 0
                  ? `${result.reduction.toFixed(1)}% smaller`
                  : `${Math.abs(result.reduction).toFixed(1)}% larger`}
              </strong>
            </div>
          </div>

          {/* Single Image Before / After Comparison */}
          {!result.isBatch && result.preview && originalPreviews[0] && (
            <div style={{ marginTop: '20px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#c4b5fd', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={16} /> Visual Quality Comparison
                </span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={() => setCompareMode("side-by-side")}
                    style={{
                      background: compareMode === "side-by-side" ? "#8b5cf6" : "#ffffff10",
                      color: "white",
                      border: "none",
                      padding: "5px 12px",
                      borderRadius: "6px",
                      fontSize: "11px",
                      fontWeight: 600
                    }}
                  >
                    Side-by-side
                  </button>
                  <button
                    onClick={() => setCompareMode("slider")}
                    style={{
                      background: compareMode === "slider" ? "#8b5cf6" : "#ffffff10",
                      color: "white",
                      border: "none",
                      padding: "5px 12px",
                      borderRadius: "6px",
                      fontSize: "11px",
                      fontWeight: 600
                    }}
                  >
                    Interactive Slider
                  </button>
                </div>
              </div>

              {compareMode === "side-by-side" ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="preview-box" style={{ flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <small style={{ color: '#938da1' }}>Original ({formatSize(result.originalSize)})</small>
                    <img src={originalPreviews[0]} alt="Original" style={{ maxHeight: '280px' }} />
                  </div>
                  <div className="preview-box" style={{ flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <small style={{ color: '#4ade80', fontWeight: 700 }}>Optimized ({formatSize(result.compressedSize)}) — {result.outputFormat}</small>
                    <img src={result.preview} alt="Compressed result" style={{ maxHeight: '280px' }} />
                  </div>
                </div>
              ) : (
                <div style={{ position: 'relative', width: '100%', height: '360px', overflow: 'hidden', borderRadius: '12px', background: '#09090e', border: '1px solid #ffffff18' }}>
                  {/* Optimized image background */}
                  <img
                    src={result.preview}
                    alt="Optimized"
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                  {/* Original image clipped on left */}
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: `${sliderPos}%`,
                    height: '100%',
                    overflow: 'hidden',
                    borderRight: '2px solid #8b5cf6'
                  }}>
                    <img
                      src={originalPreviews[0]}
                      alt="Original"
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        maxWidth: 'none',
                        objectFit: 'contain'
                      }}
                    />
                    <span style={{
                      position: 'absolute',
                      top: '12px',
                      left: '12px',
                      background: 'rgba(0,0,0,0.7)',
                      color: '#ffffff',
                      fontSize: '11px',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontWeight: 600
                    }}>
                      Original
                    </span>
                  </div>

                  <span style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    background: 'rgba(0,0,0,0.7)',
                    color: '#4ade80',
                    fontSize: '11px',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontWeight: 600
                  }}>
                    Optimized
                  </span>

                  {/* Slider Control Handle */}
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={sliderPos}
                    onChange={e => setSliderPos(Number(e.target.value))}
                    style={{
                      position: 'absolute',
                      bottom: '16px',
                      left: '10%',
                      width: '80%',
                      zIndex: 10,
                      accentColor: '#8b5cf6'
                    }}
                  />
                </div>
              )}
            </div>
          )}

          {result.isBatch && (
            <p className="batch-note">
              🎉 Your {files.length} optimized images are packaged in one high-compression ZIP archive.
            </p>
          )}

          <button className="download-button" onClick={download}>
            <Download size={19} /> Download {result.isBatch ? "ZIP archive" : `optimized ${result.outputFormat}`}
          </button>
        </section>
      )}

      <footer>
        <p>ImageForge · Optimize your images beautifully.</p>
        <small>Supports JPG, PNG, WebP, AVIF, GIF &amp; HEIC · 100% Local Python Engine</small>
      </footer>
    </main>
  );
}
