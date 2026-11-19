import { useEffect, useRef, useState } from "react";
import axios from "axios";
import {
  Wand2, Download, LoaderCircle, AlertTriangle, CheckCircle2, X, Film, Play, Pause, Ban, Clock, Gauge,
} from "lucide-react";
import Dropzone from "./Dropzone";
import BeforeAfter from "./BeforeAfter";
import SettingsPanel from "./SettingsPanel";
import { Stat } from "./ImageStudio";
import { PRESETS, VIDEO_SCALES, formatSize, formatTime } from "../presets";

const MAX_BYTES = 500 * 1024 * 1024;
const VIDEO_RE = /\.(mp4|mov|mkv|webm|avi|m4v|3gp|wmv)$/i;

const videoSettings = (s) => ({ ...s, scale: Math.min(2, Number(s.scale)) });

function outputSize(w, h, scale) {
  if (!w || !h) return null;
  let s = Number(scale);
  if (s > 1) s = Math.min(s, 3840 / Math.max(w, h), 2160 / Math.min(w, h));
  s = Math.max(1, s);
  return { w: Math.floor((w * s) / 2) * 2, h: Math.floor((h * s) / 2) * 2, capped: s < Number(scale) };
}

export default function VideoStudio() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [meta, setMeta] = useState(null);
  const [settings, setSettings] = useState(videoSettings(PRESETS[0].settings));
  const [preset, setPreset] = useState("auto");
  const [quality, setQuality] = useState("high");
  const [phase, setPhase] = useState("idle"); // idle | uploading | working | done | error
  const [upload, setUpload] = useState(0);
  const [job, setJob] = useState(null);
  const [error, setError] = useState("");
  const [playing, setPlaying] = useState(false);
  const poll = useRef(null);
  const leftVideo = useRef(null);
  const rightVideo = useRef(null);
  const resultRef = useRef(null);

  useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview]);
  useEffect(() => () => clearInterval(poll.current), []);

  const onFile = (f) => {
    if (!VIDEO_RE.test(f.name)) return setError("Unsupported file. Use MP4, MOV, MKV, WebM, AVI or M4V.");
    if (f.size > MAX_BYTES) return setError("Video is larger than 500 MB.");
    setError("");
    setJob(null);
    setPhase("idle");
    setMeta(null);
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const clear = () => {
    clearInterval(poll.current);
    setFile(null);
    setPreview(null);
    setMeta(null);
    setJob(null);
    setPhase("idle");
    setError("");
  };

  const applyPreset = (p) => {
    setPreset(p.id);
    setSettings(videoSettings(p.settings));
  };

  const startPolling = (id) => {
    clearInterval(poll.current);
    poll.current = setInterval(async () => {
      try {
        const { data } = await axios.get(`/api/jobs/${id}`);
        setJob(data);
        if (["completed", "failed", "cancelled"].includes(data.status)) {
          clearInterval(poll.current);
          if (data.status === "completed") {
            setPhase("done");
            setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 150);
          } else {
            setPhase("error");
            setError(data.status === "cancelled" ? "Enhancement was cancelled." : data.error || "Enhancement failed.");
          }
        }
      } catch {
        /* transient network error - keep polling */
      }
    }, 1000);
  };

  const enhance = async () => {
    if (!file || phase === "uploading" || phase === "working") return;
    setError("");
    setJob(null);
    setUpload(0);
    setPhase("uploading");

    const form = new FormData();
    form.append("file", file);
    form.append("settings", JSON.stringify(settings));
    form.append("quality", quality);
    try {
      const { data } = await axios.post("/api/enhance/video", form, {
        onUploadProgress: (e) => e.total && setUpload(Math.round((e.loaded / e.total) * 100)),
      });
      setPhase("working");
      setJob({ id: data.job_id, status: "queued", stage: "Queued", progress: 0 });
      startPolling(data.job_id);
    } catch (err) {
      setPhase("error");
      setError(err.response?.data?.detail || "Upload failed. Is the ClarityForge server running?");
    }
  };

  const cancel = async () => {
    if (!job?.id) return;
    try {
      await axios.post(`/api/jobs/${job.id}/cancel`);
    } catch {
      /* ignore */
    }
  };

  const togglePlay = () => {
    const a = leftVideo.current;
    const b = rightVideo.current;
    if (!a || !b) return;
    if (playing) {
      a.pause();
      b.pause();
      setPlaying(false);
    } else {
      b.currentTime = a.currentTime;
      a.play();
      b.play();
      setPlaying(true);
    }
  };

  const busy = phase === "uploading" || phase === "working";
  const est = meta && outputSize(meta.w, meta.h, settings.scale);
  const fileUrl = job?.id ? `/api/jobs/${job.id}/file` : null;

  return (
    <>
      <section className="workspace">
        <div className="panel">
          {!file ? (
            <>
              <div className="section-heading">
                <div>
                  <h2>
                    <Film size={19} /> Upload a video
                  </h2>
                  <p>Denoise, color-correct, sharpen and upscale up to 4K.</p>
                </div>
              </div>
              <Dropzone
                accept="video/*,.mkv"
                onFile={onFile}
                title="Drop your video here"
                subtitle="Drag & drop"
                formats={["MP4", "MOV", "MKV", "WebM", "AVI", "M4V"]}
                limit="Up to 500 MB · 15 minutes · Output up to 4K (3840×2160)"
              />
            </>
          ) : (
            <>
              <div className="file-head">
                <div className="file-meta">
                  <strong title={file.name}>{file.name}</strong>
                  <small>
                    {formatSize(file.size)}
                    {meta && ` · ${meta.w}×${meta.h}px · ${formatTime(meta.duration)}`}
                  </small>
                </div>
                <button type="button" className="icon-button" onClick={clear} disabled={busy} aria-label="Remove">
                  <X size={18} />
                </button>
              </div>
              <div className="preview-frame video">
                <video
                  src={preview}
                  controls
                  playsInline
                  onLoadedMetadata={(e) =>
                    setMeta({ w: e.target.videoWidth, h: e.target.videoHeight, duration: e.target.duration })
                  }
                />
              </div>

              {(busy || (job && phase !== "done")) && (
                <div className="job-card">
                  <div className="job-top">
                    <strong>
                      {phase === "uploading" ? "Uploading video…" : job?.stage || "Starting…"}
                    </strong>
                    <span>{phase === "uploading" ? `${upload}%` : `${Math.round(job?.progress || 0)}%`}</span>
                  </div>
                  <div className="progress-track">
                    <div
                      className="progress-bar"
                      style={{ width: `${phase === "uploading" ? upload : job?.progress || 0}%` }}
                    />
                  </div>
                  {phase === "working" && (
                    <div className="job-meta">
                      <span><Clock size={13} /> ETA {formatTime(job?.eta_seconds)}</span>
                      <span><Gauge size={13} /> Speed {job?.speed || "—"}</span>
                      {job?.width && <span>→ {job.width}×{job.height}</span>}
                      <button type="button" className="text-button danger" onClick={cancel}>
                        <Ban size={13} /> Cancel
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        <aside className="panel">
          <SettingsPanel
            settings={settings}
            onChange={(s) => {
              setSettings(s);
              setPreset("custom");
            }}
            preset={preset}
            onPreset={applyPreset}
            scales={VIDEO_SCALES}
            disabled={busy}
            extra={
              <>
                <label className="field-label" htmlFor="vquality">Output quality</label>
                <select id="vquality" value={quality} onChange={(e) => setQuality(e.target.value)} disabled={busy}>
                  <option value="balanced">Balanced — smaller file (CRF 21)</option>
                  <option value="high">High — recommended (CRF 18)</option>
                  <option value="max">Maximum — near lossless (CRF 15)</option>
                </select>

                {est && (
                  <div className="estimate">
                    <span>{meta.w}×{meta.h}</span>
                    <span className="arrow">→</span>
                    <strong>{est.w}×{est.h}</strong>
                    {est.capped && <small>(capped at 4K)</small>}
                  </div>
                )}

                <button type="button" className="primary-button" onClick={enhance} disabled={!file || busy}>
                  {busy ? (
                    <>
                      <LoaderCircle size={18} className="spin" /> Processing…
                    </>
                  ) : (
                    <>
                      <Wand2 size={18} /> Enhance video
                    </>
                  )}
                </button>
                <small className="hint">
                  Video runs on your CPU — upscaling long or HD clips can take several minutes. Audio is preserved.
                </small>
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

      {phase === "done" && job && (
        <section className="panel result" ref={resultRef}>
          <div className="result-heading">
            <div>
              <div className="success-label">
                <CheckCircle2 size={16} /> VIDEO ENHANCED
              </div>
              <h2>Your video is ready{job.scale > 1 ? ` — upscaled to ${job.width}×${job.height}` : ""}.</h2>
            </div>
          </div>

          <div className="stats-grid">
            <Stat label="Resolution" value={`${job.width}×${job.height}`} sub={`from ${job.original_width}×${job.original_height}`} highlight />
            <Stat label="Duration" value={formatTime(job.duration)} sub={job.fps ? `${job.fps} fps` : ""} />
            <Stat label="File size" value={formatSize(job.output_size)} sub={`H.264 MP4 · was ${formatSize(job.original_size)}`} />
            <Stat label="Processing time" value={formatTime(job.process_time)} sub="local FFmpeg engine" />
          </div>

          {job.has_frames && (
            <>
              <h3 className="sub-heading">Frame comparison</h3>
              <BeforeAfter
                before={`/api/jobs/${job.id}/frame/before`}
                after={`/api/jobs/${job.id}/frame/after`}
                beforeLabel="Original"
                afterLabel="Enhanced"
              />
            </>
          )}

          <div className="sub-heading-row">
            <h3 className="sub-heading">Side-by-side playback</h3>
            <button type="button" className="chip-button" onClick={togglePlay}>
              {playing ? <Pause size={14} /> : <Play size={14} />} {playing ? "Pause both" : "Play both in sync"}
            </button>
          </div>
          <div className="video-pair">
            <figure>
              <video ref={leftVideo} src={preview} muted playsInline controls onEnded={() => setPlaying(false)} />
              <figcaption>Original</figcaption>
            </figure>
            <figure>
              <video ref={rightVideo} src={fileUrl} playsInline controls onEnded={() => setPlaying(false)} />
              <figcaption className="accent">Enhanced</figcaption>
            </figure>
          </div>

          <a className="primary-button download" href={`${fileUrl}?download=1`} download={job.filename}>
            <Download size={18} /> Download enhanced MP4 ({formatSize(job.output_size)})
          </a>
        </section>
      )}
    </>
  );
}
