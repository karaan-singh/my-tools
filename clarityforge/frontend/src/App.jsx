import { useEffect, useState } from "react";
import axios from "axios";
import { Sparkles, Image as ImageIcon, Film, Maximize2, Focus, Palette, Eraser } from "lucide-react";
import ImageStudio from "./components/ImageStudio";
import VideoStudio from "./components/VideoStudio";

export default function App() {
  const [mode, setMode] = useState("image");
  const [online, setOnline] = useState(null);

  useEffect(() => {
    let alive = true;
    const check = () =>
      axios
        .get("/api/health", { timeout: 4000 })
        .then(() => alive && setOnline(true))
        .catch(() => alive && setOnline(false));
    check();
    const id = setInterval(check, 15000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  return (
    <main className="app">
      <nav className="navbar">
        <a href="#" className="brand">
          <span className="brand-icon">
            <Sparkles />
          </span>
          Clarity<span>Forge</span>
        </a>
        <span className="nav-label">IMAGE &amp; VIDEO ENHANCEMENT STUDIO</span>
        <div className={`status-pill ${online === false ? "offline" : ""}`}>
          <span className="status-dot" />
          {online === null ? "Connecting…" : online ? "Engine online" : "Engine offline"}
        </div>
      </nav>

      <section className="hero">
        <div className="eyebrow">
          <Sparkles size={14} /> UPSCALE · DEBLUR · COLOR FIX · DENOISE
        </div>
        <h1>
          Turn blurry, dull media into
          <br />
          <span>crisp, vivid, high-res.</span>
        </h1>
        <p>
          Increase resolution up to 4×, recover sharp detail from blurry shots, fix washed-out or tinted colors and
          remove grain — for photos and videos, processed privately on your own machine.
        </p>

        <div className="feature-row">
          <Feature icon={<Maximize2 size={16} />} label="Super resolution" />
          <Feature icon={<Focus size={16} />} label="Deblur & sharpen" />
          <Feature icon={<Palette size={16} />} label="Auto color fix" />
          <Feature icon={<Eraser size={16} />} label="Noise removal" />
        </div>
      </section>

      <div className="mode-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={mode === "image"}
          className={mode === "image" ? "active" : ""}
          onClick={() => setMode("image")}
        >
          <ImageIcon size={17} /> Photo Enhancer
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "video"}
          className={mode === "video" ? "active" : ""}
          onClick={() => setMode("video")}
        >
          <Film size={17} /> Video Enhancer
        </button>
      </div>

      {/* Keep both mounted so switching tabs doesn't lose work in progress */}
      <div hidden={mode !== "image"}>
        <ImageStudio />
      </div>
      <div hidden={mode !== "video"}>
        <VideoStudio />
      </div>

      <footer>
        <p>ClarityForge · Make every pixel count.</p>
        <small>OpenCV super-resolution &amp; detail recovery · FFmpeg video pipeline · 100% local processing</small>
      </footer>
    </main>
  );
}

function Feature({ icon, label }) {
  return (
    <span className="feature">
      {icon}
      {label}
    </span>
  );
}
