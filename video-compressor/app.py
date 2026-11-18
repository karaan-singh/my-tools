import os
import sys
import time
import shutil
from datetime import datetime

# Ensure local modules can be found regardless of current working directory
APP_DIR = os.path.dirname(os.path.abspath(__file__))
if APP_DIR not in sys.path:
    sys.path.insert(0, APP_DIR)

import streamlit as st
import compressor

# ---------------------------------------------------------
# Page Configuration & Ice Silver, Deep Aubergine, Marigold Theme
# ---------------------------------------------------------
st.set_page_config(
    page_title="OptiVideo — Video Compression Studio",
    page_icon="🎬",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS: Ice Silver, Deep Aubergine & Marigold
st.markdown("""
<style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Space+Grotesk:wght@500;600;700&display=swap');

    html, body, [class*="css"] {
        font-family: 'Plus Jakarta Sans', sans-serif;
    }

    /* Overall Background: Deep Aubergine Canvas */
    .stApp {
        background: radial-gradient(ellipse at 18% 18%, #2d0b38 0%, #1a0624 55%, #0e0314 100%);
        color: #f1f5f9; /* Ice Silver primary text */
    }

    /* Sidebar Background: Deep Aubergine */
    [data-testid="stSidebar"] {
        background: linear-gradient(180deg, #1f072c 0%, #14041e 100%) !important;
        border-right: 1px solid rgba(226, 232, 240, 0.12) !important;
    }

    /* Glowing Hero Banner: Deep Aubergine + Ice Silver + Marigold Accents */
    .hero-card {
        background: linear-gradient(135deg, rgba(45, 11, 56, 0.85) 0%, rgba(26, 6, 36, 0.92) 50%, rgba(245, 158, 11, 0.14) 100%);
        border: 1px solid rgba(245, 158, 11, 0.35);
        border-radius: 20px;
        padding: 28px 36px;
        margin-bottom: 24px;
        box-shadow: 0 14px 40px -10px rgba(14, 3, 20, 0.8), 0 0 25px rgba(245, 158, 11, 0.12);
        backdrop-filter: blur(14px);
        position: relative;
        overflow: hidden;
    }

    .hero-card::after {
        content: "";
        position: absolute;
        top: 0;
        right: 0;
        width: 260px;
        height: 100%;
        background: radial-gradient(circle at 100% 50%, rgba(251, 191, 36, 0.15) 0%, transparent 70%);
        pointer-events: none;
    }
    
    .hero-title {
        font-family: 'Space Grotesk', sans-serif;
        font-size: 2.3rem;
        font-weight: 800;
        letter-spacing: -0.02em;
        background: linear-gradient(135deg, #ffffff 0%, #e2e8f0 40%, #cbd5e1 70%, #fbbf24 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        margin-bottom: 6px;
    }

    .hero-subtitle {
        color: #cbd5e1; /* Ice Silver */
        font-size: 1.05rem;
        margin-top: 0;
        line-height: 1.5;
    }
    
    .hero-highlight {
        color: #fbbf24; /* Marigold */
        font-weight: 600;
    }

    /* Glass Cards: Deep Aubergine with Ice Silver Frosted Border */
    .glass-card {
        background: rgba(40, 12, 53, 0.68);
        border: 1px solid rgba(226, 232, 240, 0.18);
        border-radius: 16px;
        padding: 22px;
        margin-bottom: 20px;
        backdrop-filter: blur(12px);
        box-shadow: 0 10px 30px rgba(10, 2, 15, 0.45);
        transition: border-color 0.25s ease;
    }
    .glass-card:hover {
        border-color: rgba(245, 158, 11, 0.35);
    }

    /* Badges */
    .badge {
        display: inline-block;
        padding: 5px 14px;
        font-size: 0.82rem;
        font-weight: 600;
        border-radius: 20px;
        margin-right: 6px;
        margin-bottom: 6px;
        letter-spacing: 0.02em;
    }
    
    /* Marigold Badge */
    .badge-marigold {
        background: rgba(245, 158, 11, 0.18);
        border: 1px solid rgba(245, 158, 11, 0.5);
        color: #fbbf24;
    }

    /* Ice Silver Badge */
    .badge-silver {
        background: rgba(226, 232, 240, 0.12);
        border: 1px solid rgba(226, 232, 240, 0.3);
        color: #f8fafc;
    }

    /* Deep Aubergine Badge */
    .badge-aubergine {
        background: rgba(85, 23, 112, 0.5);
        border: 1px solid rgba(216, 180, 254, 0.3);
        color: #f3e8ff;
    }

    /* Metric Box */
    .metric-box {
        background: linear-gradient(145deg, rgba(46, 14, 61, 0.75) 0%, rgba(28, 7, 39, 0.85) 100%);
        border: 1px solid rgba(226, 232, 240, 0.16);
        border-radius: 16px;
        padding: 18px 14px;
        text-align: center;
        box-shadow: 0 8px 24px rgba(12, 3, 18, 0.4);
        position: relative;
    }
    .metric-box::before {
        content: "";
        position: absolute;
        top: 0;
        left: 20%;
        right: 20%;
        height: 2px;
        background: linear-gradient(90deg, transparent, rgba(245, 158, 11, 0.6), transparent);
    }
    .metric-value {
        font-family: 'Space Grotesk', sans-serif;
        font-size: 1.85rem;
        font-weight: 700;
        color: #ffffff; /* Ice Silver Highlight */
        margin-top: 6px;
        letter-spacing: -0.02em;
    }
    .metric-label {
        font-size: 0.8rem;
        color: #cbd5e1; /* Ice Silver Muted */
        text-transform: uppercase;
        letter-spacing: 0.08em;
        font-weight: 600;
    }
    .metric-savings {
        font-family: 'Space Grotesk', sans-serif;
        font-size: 1.85rem;
        font-weight: 800;
        background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 60%, #d97706 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
    }

    /* Action Buttons: Marigold Glowing Primary */
    div.stButton > button:first-child {
        background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%) !important;
        color: #120317 !important;
        font-family: 'Space Grotesk', sans-serif !important;
        font-weight: 700 !important;
        font-size: 1.02rem !important;
        border: 1px solid rgba(251, 191, 36, 0.6) !important;
        border-radius: 14px !important;
        padding: 13px 26px !important;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
        box-shadow: 0 6px 20px rgba(245, 158, 11, 0.35) !important;
        letter-spacing: 0.01em !important;
    }
    div.stButton > button:first-child:hover {
        background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%) !important;
        color: #08010b !important;
        box-shadow: 0 8px 30px rgba(245, 158, 11, 0.6) !important;
        transform: translateY(-2px) !important;
    }
    div.stButton > button:first-child:active {
        transform: translateY(0px) !important;
    }

    /* Download button: Ice Silver Metallic Sheen with Marigold Glow */
    div.stDownloadButton > button:first-child {
        background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 45%, #d97706 100%) !important;
        color: #14041d !important;
        font-family: 'Space Grotesk', sans-serif !important;
        font-weight: 800 !important;
        font-size: 1.05rem !important;
        border-radius: 14px !important;
        padding: 14px 30px !important;
        border: 1px solid rgba(255, 255, 255, 0.4) !important;
        box-shadow: 0 6px 24px rgba(245, 158, 11, 0.45) !important;
        transition: all 0.3s ease !important;
    }
    div.stDownloadButton > button:first-child:hover {
        background: linear-gradient(135deg, #fef3c7 0%, #fbbf24 40%, #f59e0b 100%) !important;
        color: #0b020f !important;
        box-shadow: 0 10px 34px rgba(245, 158, 11, 0.7) !important;
        transform: translateY(-2px) !important;
    }

    /* Progress bar: Marigold into Ice Silver */
    .stProgress > div > div > div > div {
        background: linear-gradient(90deg, #d97706 0%, #f59e0b 50%, #fbbf24 85%, #f8fafc 100%) !important;
        border-radius: 8px !important;
    }
    .stProgress > div > div {
        background: rgba(35, 10, 47, 0.8) !important;
        border: 1px solid rgba(226, 232, 240, 0.12) !important;
        border-radius: 8px !important;
    }

    /* Streamlit Tabs: Deep Aubergine + Marigold active underline */
    .stTabs [data-baseweb="tab-list"] {
        gap: 10px;
        background: rgba(29, 8, 40, 0.6);
        padding: 6px 10px;
        border-radius: 14px;
        border: 1px solid rgba(226, 232, 240, 0.1);
    }
    .stTabs [data-baseweb="tab"] {
        color: #cbd5e1 !important; /* Ice Silver */
        font-weight: 600 !important;
        padding: 10px 18px !important;
        border-radius: 10px !important;
        transition: all 0.2s ease !important;
    }
    .stTabs [data-baseweb="tab"]:hover {
        color: #ffffff !important;
        background: rgba(245, 158, 11, 0.08) !important;
    }
    .stTabs [aria-selected="true"] {
        color: #fbbf24 !important; /* Marigold */
        background: rgba(245, 158, 11, 0.16) !important;
        border-bottom: 2px solid #f59e0b !important;
    }

    /* File Uploader styling */
    [data-testid="stFileUploader"] {
        background: rgba(38, 11, 52, 0.5);
        border: 1px dashed rgba(226, 232, 240, 0.28);
        border-radius: 16px;
        padding: 16px;
        transition: all 0.25s ease;
    }
    [data-testid="stFileUploader"]:hover {
        border-color: rgba(245, 158, 11, 0.7);
        background: rgba(45, 13, 62, 0.65);
    }
    [data-testid="stFileUploader"] section button {
        background: rgba(245, 158, 11, 0.18) !important;
        color: #fbbf24 !important;
        border: 1px solid rgba(245, 158, 11, 0.4) !important;
    }
    [data-testid="stFileUploader"] section button:hover {
        background: rgba(245, 158, 11, 0.3) !important;
    }

    /* Radio buttons / Checkboxes */
    .stRadio [role="radiogroup"] {
        background: rgba(33, 9, 45, 0.5);
        padding: 10px 16px;
        border-radius: 12px;
        border: 1px solid rgba(226, 232, 240, 0.1);
    }
    .stRadio [data-checked="true"] > div {
        border-color: #f59e0b !important;
        background-color: #f59e0b !important;
    }

    /* Sliders: Marigold track */
    div[data-baseweb="slider"] div {
        color: #f59e0b !important;
    }

    /* Table styling in guide */
    table {
        color: #f1f5f9;
        border-collapse: collapse;
        width: 100%;
    }
    th {
        background-color: rgba(55, 16, 75, 0.8) !important;
        color: #fbbf24 !important;
        border-bottom: 2px solid #f59e0b !important;
        padding: 10px 14px !important;
    }
    td {
        border-bottom: 1px solid rgba(226, 232, 240, 0.12) !important;
        padding: 10px 14px !important;
    }
    tr:nth-child(even) {
        background-color: rgba(34, 10, 46, 0.4);
    }
</style>
""", unsafe_allow_html=True)

# ---------------------------------------------------------
# Setup Directories & State
# ---------------------------------------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOADS_DIR = os.path.join(BASE_DIR, "uploads")
COMPRESSED_DIR = os.path.join(BASE_DIR, "compressed")

os.makedirs(UPLOADS_DIR, exist_ok=True)
os.makedirs(COMPRESSED_DIR, exist_ok=True)

if "history" not in st.session_state:
    st.session_state.history = []

# Verify FFmpeg
ffmpeg_ready = False
ffmpeg_path = ""
try:
    ffmpeg_path = compressor.get_ffmpeg_path()
    ffmpeg_ready = True
except Exception as e:
    ffmpeg_ready = False
    ffmpeg_error_msg = str(e)

# ---------------------------------------------------------
# Sidebar Navigation & Engine Status
# ---------------------------------------------------------
with st.sidebar:
    st.markdown("### 🎬 OptiVideo Studio")
    st.markdown("<span style='color: #cbd5e1; font-size: 0.9rem;'>High-efficiency GPU/CPU video compression powered by FFmpeg.</span>", unsafe_allow_html=True)

    st.markdown("---")
    st.markdown("#### ⚙️ Engine Status")
    if ffmpeg_ready:
        st.markdown(f"""
        <div style="background: rgba(245, 158, 11, 0.12); border: 1px solid rgba(245, 158, 11, 0.4); border-radius: 12px; padding: 12px;">
            <div style="color: #fbbf24; font-weight: 700; font-size: 0.88rem; display: flex; align-items: center; gap: 6px;">
                <span style="display:inline-block; width:8px; height:8px; background:#fbbf24; border-radius:50%; box-shadow: 0 0 8px #fbbf24;"></span>
                FFmpeg Engine Active
            </div>
            <div style="color: #cbd5e1; font-size: 0.74rem; word-break: break-all; margin-top: 6px;">{os.path.basename(ffmpeg_path)}</div>
        </div>
        """, unsafe_allow_html=True)
    else:
        st.error("FFmpeg not found! Please check installation.")

    st.markdown("---")
    st.markdown("#### 💡 Pro Tips")
    st.markdown("""
    - **CRF 26-28**: Optimal balance of crisp quality and big size reduction (~60-80%).
    - **720p HD**: Halves bandwidth while looking pristine on phones & laptops.
    - **H.264 (AVC)**: Maximum playback compatibility across every browser & device.
    - **H.265 (HEVC)**: 35-45% smaller than H.264 at identical visual quality.
    """)

    st.markdown("---")
    if st.button("🧹 Clear All Temp Files"):
        try:
            for f in os.listdir(UPLOADS_DIR):
                os.remove(os.path.join(UPLOADS_DIR, f))
            for f in os.listdir(COMPRESSED_DIR):
                os.remove(os.path.join(COMPRESSED_DIR, f))
            st.session_state.history = []
            st.success("All temporary files and history cleared!")
            time.sleep(1)
            st.rerun()
        except Exception as err:
            st.warning(f"Could not clear some files: {err}")

# ---------------------------------------------------------
# Main App Header
# ---------------------------------------------------------
st.markdown("""
<div class="hero-card">
    <div class="hero-title">Video Compression Tool</div>
    <div class="hero-subtitle">Compress <span class="hero-highlight">MP4, MOV, MKV, AVI & WebM</span> videos with near-lossless visual quality. Fast, private, and 100% locally processed.</div>
</div>
""", unsafe_allow_html=True)

# Tabs
tab_single, tab_batch, tab_history, tab_guide = st.tabs([
    "🚀 Single Compressor",
    "📁 Batch Compression",
    "📜 History & Savings",
    "📘 Guide & Codecs"
])

# ---------------------------------------------------------
# TAB 1: Single Video Compressor
# ---------------------------------------------------------
with tab_single:
    col_upload, col_settings = st.columns([1.1, 1], gap="large")

    with col_upload:
        st.markdown("#### 1. Upload Video")
        uploaded_file = st.file_uploader(
            "Drag and drop your video file here",
            type=["mp4", "mov", "mkv", "avi", "webm", "flv", "m4v"],
            help="Supported: MP4, MOV, MKV, AVI, WebM, M4V (up to 2 GB)"
        )

        video_meta = None
        saved_input_path = None

        if uploaded_file is not None:
            # Save upload to uploads directory
            safe_name = uploaded_file.name.replace(" ", "_")
            saved_input_path = os.path.join(UPLOADS_DIR, f"input_{safe_name}")
            with open(saved_input_path, "wb") as f:
                f.write(uploaded_file.getbuffer())

            try:
                video_meta = compressor.get_video_metadata(saved_input_path)
            except Exception as e:
                st.error(f"Failed to read video metadata: {e}")

            if video_meta:
                # Video Preview & Details Card in Ice Silver & Deep Aubergine
                st.markdown(f"""
                <div class="glass-card">
                    <div style="font-weight: 700; font-size: 1.05rem; margin-bottom: 10px; color: #ffffff;">🎞️ {uploaded_file.name}</div>
                    <span class="badge badge-marigold">{video_meta['resolution_name']} ({video_meta['resolution']})</span>
                    <span class="badge badge-silver">{video_meta['duration_formatted']}</span>
                    <span class="badge badge-marigold">{video_meta['file_size_formatted']}</span>
                    <span class="badge badge-aubergine">{video_meta['video_codec'].upper()}</span>
                    <span class="badge badge-silver">{video_meta['fps']:.1f} FPS</span>
                </div>
                """, unsafe_allow_html=True)

                st.video(saved_input_path)

    with col_settings:
        st.markdown("#### 2. Compression Settings")

        # Compression Preset Mode Selector
        preset_mode = st.radio(
            "Compression Strategy",
            ["⚡ Smart Presets", "🛠️ Custom / Pro Controls"],
            horizontal=True
        )

        options = {}

        if preset_mode == "⚡ Smart Presets":
            smart_choice = st.selectbox(
                "Choose Optimization Goal",
                [
                    "🚀 Web & Social Media (Balanced — High quality, 60-75% reduction)",
                    "💬 Discord Target (< 8 MB limit)",
                    "📧 Email Attachment Target (< 25 MB limit)",
                    "💎 High Quality / Archival (Near-lossless, 30-50% reduction)",
                    "🗜️ Maximum Space Saver (Aggressive, 75-90% reduction)"
                ]
            )

            if "Web & Social Media" in smart_choice:
                options = {
                    "mode": "crf",
                    "crf": 26,
                    "preset": "fast",
                    "resolution": "1080p" if (video_meta and video_meta["width"] > 1920) else "original",
                    "codec": "libx264",
                    "audio_mode": "aac",
                    "audio_bitrate": 128
                }
                st.info("💡 **Recommended for sharing**: Encodes with H.264 (CRF 26), 1080p max resolution, high compatibility on all devices.")
            elif "Discord Target" in smart_choice:
                options = {
                    "mode": "target_size",
                    "target_size_mb": 7.8,
                    "preset": "medium",
                    "resolution": "720p",
                    "codec": "libx264",
                    "audio_mode": "aac",
                    "audio_bitrate": 96
                }
                st.info("💡 **Discord Friendly**: Automatically calculates bitrate to compress the file under 8 MB.")
            elif "Email Attachment" in smart_choice:
                options = {
                    "mode": "target_size",
                    "target_size_mb": 24.0,
                    "preset": "medium",
                    "resolution": "1080p",
                    "codec": "libx264",
                    "audio_mode": "aac",
                    "audio_bitrate": 128
                }
                st.info("💡 **Email Friendly**: Automatically calculates bitrate to fit under standard 25 MB email limits.")
            elif "High Quality" in smart_choice:
                options = {
                    "mode": "crf",
                    "crf": 20,
                    "preset": "medium",
                    "resolution": "original",
                    "codec": "libx264",
                    "audio_mode": "copy",
                    "audio_bitrate": 192
                }
                st.info("💡 **Archival Grade**: CRF 20 keeps pristine visual quality and untouched audio while trimming redundant bitrate.")
            else: # Maximum Space Saver
                options = {
                    "mode": "crf",
                    "crf": 32,
                    "preset": "medium",
                    "resolution": "720p",
                    "codec": "libx264",
                    "audio_mode": "aac",
                    "audio_bitrate": 96
                }
                st.info("💡 **Max Space Saver**: Downscales to 720p with CRF 32 for maximum size reduction.")

            out_format = st.selectbox("Output Format", ["MP4 (Universal)", "WebM (Web Optimized)", "MKV", "MOV"], index=0)
            format_map = {"MP4 (Universal)": ".mp4", "WebM (Web Optimized)": ".webm", "MKV": ".mkv", "MOV": ".mov"}
            target_ext = format_map[out_format]
            if target_ext == ".webm":
                options["codec"] = "libvpx-vp9"

        else: # Custom / Pro Controls
            rate_mode = st.selectbox(
                "Rate Control Method",
                ["CRF (Constant Rate Factor — Recommended)", "Target File Size (MB)", "Target Video Bitrate (kbps)"]
            )

            if rate_mode.startswith("CRF"):
                options["mode"] = "crf"
                options["crf"] = st.slider("Quality (CRF)", min_value=18, max_value=40, value=26, step=1,
                    help="Lower = Higher quality & larger file. 18 is visually lossless; 26-28 is standard web quality; 32+ is heavy compression.")
            elif rate_mode.startswith("Target File Size"):
                options["mode"] = "target_size"
                options["target_size_mb"] = st.number_input("Target Size in MB", min_value=1.0, max_value=2000.0, value=15.0, step=1.0)
            else:
                options["mode"] = "bitrate"
                options["video_bitrate_kbps"] = st.slider("Video Bitrate (kbps)", min_value=200, max_value=10000, value=1500, step=100)

            col_res, col_codec = st.columns(2)
            with col_res:
                res_choice = st.selectbox(
                    "Resolution",
                    ["Keep Original", "1080p FHD", "720p HD", "480p SD", "360p", "Scale 75%", "Scale 50%"]
                )
                res_map = {
                    "Keep Original": "original",
                    "1080p FHD": "1080p",
                    "720p HD": "720p",
                    "480p SD": "480p",
                    "360p": "360p",
                    "Scale 75%": "75%",
                    "Scale 50%": "50%"
                }
                options["resolution"] = res_map[res_choice]

            with col_codec:
                codec_choice = st.selectbox(
                    "Video Codec",
                    ["H.264 / AVC (Most Compatible)", "H.265 / HEVC (High Efficiency)", "VP9 (WebM)"]
                )
                codec_map = {
                    "H.264 / AVC (Most Compatible)": "libx264",
                    "H.265 / HEVC (High Efficiency)": "libx265",
                    "VP9 (WebM)": "libvpx-vp9"
                }
                options["codec"] = codec_map[codec_choice]

            col_preset, col_audio = st.columns(2)
            with col_preset:
                preset_choice = st.selectbox(
                    "Encoding Speed Preset",
                    ["fast", "medium", "slow", "ultrafast"],
                    index=1,
                    help="Slower presets achieve better compression efficiency at the exact same quality level."
                )
                options["preset"] = preset_choice

            with col_audio:
                audio_choice = st.selectbox(
                    "Audio Handling",
                    ["Compress to AAC 128 kbps", "Compress to AAC 96 kbps", "Keep Original Audio (Copy)", "Mute / Remove Audio"]
                )
                if "Keep Original" in audio_choice:
                    options["audio_mode"] = "copy"
                elif "Mute" in audio_choice:
                    options["audio_mode"] = "mute"
                elif "96" in audio_choice:
                    options["audio_mode"] = "aac"
                    options["audio_bitrate"] = 96
                else:
                    options["audio_mode"] = "aac"
                    options["audio_bitrate"] = 128

            out_format = st.selectbox("Output Container", ["MP4 (.mp4)", "WebM (.webm)", "MKV (.mkv)", "MOV (.mov)"], index=0)
            format_map = {"MP4 (.mp4)": ".mp4", "WebM (.webm)": ".webm", "MKV (.mkv)": ".mkv", "MOV (.mov)": ".mov"}
            target_ext = format_map[out_format]

            # Optional video trimming
            with st.expander("✂️ Optional Video Trimming"):
                max_dur = video_meta["duration"] if video_meta else 100.0
                trim_range = st.slider(
                    "Select Segment (seconds)",
                    min_value=0.0,
                    max_value=max(1.0, max_dur),
                    value=(0.0, max(1.0, max_dur)),
                    step=0.5
                )
                if trim_range[0] > 0 or (video_meta and trim_range[1] < video_meta["duration"]):
                    options["trim_start"] = trim_range[0]
                    options["trim_end"] = trim_range[1]

        # ---------------------------------------------------------
        # Action: Start Compression
        # ---------------------------------------------------------
        st.markdown("<br>", unsafe_allow_html=True)
        start_btn = st.button("🚀 Start Compression", use_container_width=True, disabled=(uploaded_file is None or not ffmpeg_ready))

    # ---------------------------------------------------------
    # Processing & Progress Display
    # ---------------------------------------------------------
    if start_btn and saved_input_path and video_meta:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        base_name, _ = os.path.splitext(uploaded_file.name)
        output_filename = f"{base_name}_compressed_{timestamp}{target_ext}"
        output_path = os.path.join(COMPRESSED_DIR, output_filename)

        st.markdown("---")
        st.markdown("### ⏳ Compressing Video...")

        progress_bar = st.progress(0.0)
        status_box = st.empty()

        def update_progress(info):
            prog = info.get("progress", 0.0)
            progress_bar.progress(prog)
            status_box.markdown(f"""
            <div style="font-size: 0.95rem; color: #fbbf24; font-weight: 500;">
                <b>Progress:</b> {prog * 100:.1f}% &nbsp;|&nbsp; 
                <b>Speed:</b> {info.get('speed', '1x')} &nbsp;|&nbsp; 
                <b>FPS:</b> {info.get('fps', 0):.1f} &nbsp;|&nbsp; 
                <b>Processed:</b> {compressor.format_duration(info.get('out_time', 0))} / {video_meta['duration_formatted']}
            </div>
            """, unsafe_allow_html=True)

        start_time = time.time()
        success, message = compressor.compress_video(
            saved_input_path,
            output_path,
            options,
            progress_callback=update_progress
        )
        elapsed_sec = time.time() - start_time

        if success and os.path.exists(output_path):
            progress_bar.progress(1.0)
            status_box.empty()
            st.success("🎉 Video Compression Completed Successfully!")

            orig_size = os.path.getsize(saved_input_path)
            comp_size = os.path.getsize(output_path)
            savings_bytes = orig_size - comp_size
            savings_pct = (savings_bytes / orig_size) * 100 if orig_size > 0 else 0

            # Store in session history
            st.session_state.history.append({
                "timestamp": datetime.now().strftime("%H:%M:%S"),
                "filename": uploaded_file.name,
                "output_filename": output_filename,
                "original_size": orig_size,
                "compressed_size": comp_size,
                "savings_pct": savings_pct,
                "path": output_path
            })

            # Metrics Row with Marigold & Ice Silver Accents
            m1, m2, m3, m4 = st.columns(4)
            with m1:
                st.markdown(f"""
                <div class="metric-box">
                    <div class="metric-label">Original Size</div>
                    <div class="metric-value">{compressor.format_size(orig_size)}</div>
                </div>
                """, unsafe_allow_html=True)
            with m2:
                st.markdown(f"""
                <div class="metric-box">
                    <div class="metric-label">Compressed Size</div>
                    <div class="metric-value" style="color: #fbbf24;">{compressor.format_size(comp_size)}</div>
                </div>
                """, unsafe_allow_html=True)
            with m3:
                savings_color = "#fbbf24" if savings_pct >= 0 else "#f87171"
                prefix = "-" if savings_pct >= 0 else "+"
                st.markdown(f"""
                <div class="metric-box">
                    <div class="metric-label">Size Reduction</div>
                    <div class="metric-value" style="color: {savings_color};">{prefix}{abs(savings_pct):.1f}%</div>
                </div>
                """, unsafe_allow_html=True)
            with m4:
                st.markdown(f"""
                <div class="metric-box">
                    <div class="metric-label">Time Elapsed</div>
                    <div class="metric-value">{elapsed_sec:.1f}s</div>
                </div>
                """, unsafe_allow_html=True)

            st.markdown("<br>", unsafe_allow_html=True)

            # Before & After Video Comparison
            c_orig, c_comp = st.columns(2)
            with c_orig:
                st.markdown("##### 📹 Original Video")
                st.video(saved_input_path)
            with c_comp:
                st.markdown("##### ✨ Compressed Video")
                st.video(output_path)

            st.markdown("<br>", unsafe_allow_html=True)

            # Download Button
            with open(output_path, "rb") as f_out:
                st.download_button(
                    label=f"⬇️ Download Compressed Video ({compressor.format_size(comp_size)})",
                    data=f_out.read(),
                    file_name=output_filename,
                    mime="video/mp4" if target_ext == ".mp4" else f"video/{target_ext.replace('.', '')}",
                    use_container_width=True
                )
        else:
            st.error(f"Compression failed: {message}")

# ---------------------------------------------------------
# TAB 2: Batch Compression
# ---------------------------------------------------------
with tab_batch:
    st.markdown("#### 📁 Batch Video Compressor")
    st.markdown("Upload multiple videos and compress them all with unified optimization settings.")

    batch_files = st.file_uploader(
        "Upload multiple video files",
        type=["mp4", "mov", "mkv", "avi", "webm"],
        accept_multiple_files=True,
        key="batch_uploader"
    )

    if batch_files:
        st.markdown(f"**{len(batch_files)} videos queued for compression.**")

        b_col1, b_col2 = st.columns(2)
        with b_col1:
            batch_crf = st.slider("Quality (CRF)", 18, 36, 26, key="batch_crf_slider")
            batch_res = st.selectbox("Max Resolution", ["Keep Original", "1080p FHD", "720p HD", "480p SD"], key="batch_res")
            b_res_map = {"Keep Original": "original", "1080p FHD": "1080p", "720p HD": "720p", "480p SD": "480p"}
        with b_col2:
            batch_preset = st.selectbox("Preset Speed", ["ultrafast", "fast", "medium"], index=1, key="batch_preset")
            batch_audio = st.selectbox("Audio", ["AAC 128k", "AAC 96k", "Copy Audio", "Mute"], index=0, key="batch_audio")

        if st.button("🚀 Compress All Videos", key="batch_start_btn"):
            batch_progress = st.progress(0.0)
            overall_status = st.empty()

            total_orig_size = 0
            total_comp_size = 0

            for idx, b_file in enumerate(batch_files):
                overall_status.info(f"Processing ({idx + 1}/{len(batch_files)}): {b_file.name}")
                safe_name = b_file.name.replace(" ", "_")
                b_in_path = os.path.join(UPLOADS_DIR, f"batch_{safe_name}")
                with open(b_in_path, "wb") as f:
                    f.write(b_file.getbuffer())

                b_out_name = f"compressed_{safe_name}"
                if not b_out_name.lower().endswith(".mp4"):
                    b_out_name += ".mp4"
                b_out_path = os.path.join(COMPRESSED_DIR, b_out_name)

                b_opts = {
                    "mode": "crf",
                    "crf": batch_crf,
                    "preset": batch_preset,
                    "resolution": b_res_map[batch_res],
                    "codec": "libx264",
                    "audio_mode": "mute" if batch_audio == "Mute" else ("copy" if batch_audio == "Copy Audio" else "aac"),
                    "audio_bitrate": 96 if "96" in batch_audio else 128
                }

                success, _ = compressor.compress_video(b_in_path, b_out_path, b_opts)
                if success and os.path.exists(b_out_path):
                    orig_s = os.path.getsize(b_in_path)
                    comp_s = os.path.getsize(b_out_path)
                    total_orig_size += orig_s
                    total_comp_size += comp_s

                    st.session_state.history.append({
                        "timestamp": datetime.now().strftime("%H:%M:%S"),
                        "filename": b_file.name,
                        "output_filename": b_out_name,
                        "original_size": orig_s,
                        "compressed_size": comp_s,
                        "savings_pct": ((orig_s - comp_s) / orig_s) * 100 if orig_s > 0 else 0,
                        "path": b_out_path
                    })

                batch_progress.progress((idx + 1) / len(batch_files))

            overall_status.success("🎉 Batch compression complete!")
            b_saved = total_orig_size - total_comp_size
            b_pct = (b_saved / total_orig_size) * 100 if total_orig_size > 0 else 0
            st.metric("Total Space Saved", f"{compressor.format_size(b_saved)} ({b_pct:.1f}% reduction)")

# ---------------------------------------------------------
# TAB 3: History & Savings
# ---------------------------------------------------------
with tab_history:
    st.markdown("#### 📜 Compression History & Statistics")

    if not st.session_state.history:
        st.info("No videos compressed yet in this session. Start by compressing your first video!")
    else:
        tot_orig = sum(item["original_size"] for item in st.session_state.history)
        tot_comp = sum(item["compressed_size"] for item in st.session_state.history)
        tot_saved = tot_orig - tot_comp
        tot_pct = (tot_saved / tot_orig) * 100 if tot_orig > 0 else 0

        h1, h2, h3, h4 = st.columns(4)
        h1.metric("Videos Processed", len(st.session_state.history))
        h2.metric("Total Original Data", compressor.format_size(tot_orig))
        h3.metric("Total Compressed Data", compressor.format_size(tot_comp))
        h4.metric("Total Saved", f"{compressor.format_size(tot_saved)} ({tot_pct:.1f}%)")

        st.markdown("---")
        for idx, item in enumerate(reversed(st.session_state.history)):
            with st.container():
                st.markdown(f"""
                <div class="glass-card">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-weight: 700; font-size: 1.05rem; color: #f8fafc;">{item['filename']}</span>
                        <span style="color: #fbbf24; font-weight: 800; font-size: 1.1rem;">-{item['savings_pct']:.1f}%</span>
                    </div>
                    <div style="color: #cbd5e1; font-size: 0.84rem; margin-top: 6px;">
                        Original: <span style="color:#ffffff;">{compressor.format_size(item['original_size'])}</span> &nbsp;➜&nbsp; 
                        Compressed: <span style="color:#fbbf24; font-weight:600;">{compressor.format_size(item['compressed_size'])}</span> &nbsp;|&nbsp; 
                        At {item['timestamp']}
                    </div>
                </div>
                """, unsafe_allow_html=True)
                if os.path.exists(item["path"]):
                    with open(item["path"], "rb") as f_down:
                        st.download_button(
                            f"⬇️ Re-download {item['output_filename']}",
                            data=f_down.read(),
                            file_name=item["output_filename"],
                            key=f"hist_down_{idx}"
                        )

# ---------------------------------------------------------
# TAB 4: Guide & Codecs
# ---------------------------------------------------------
with tab_guide:
    st.markdown("""
    ### 📘 Video Compression Fundamentals

    #### 1. What is CRF (Constant Rate Factor)?
    CRF is the default quality-setting mode for x264 and x265 encoders. Rather than allocating a rigid bitrate, it keeps visual quality constant across varying scenes:
    - **CRF 18**: Visually lossless (virtually indistinguishable from uncompressed source).
    - **CRF 23**: Default FFmpeg balance.
    - **CRF 26-28**: Optimal for web streaming & YouTube uploads (60-80% smaller file).
    - **CRF 32+**: High compression for low bandwidth, discord limits, or mobile devices.

    #### 2. Choosing the Right Codec
    | Codec | Compatibility | Compression Efficiency | Recommended For |
    | :--- | :--- | :--- | :--- |
    | **H.264 (AVC)** | 99.9% of all devices & browsers | Good | Social Media, Email, Universal Sharing |
    | **H.265 (HEVC)** | Newer phones, PCs, 4K TVs | ~40% better than H.264 | Archival, 4K / 1080p high quality |
    | **VP9** | Chrome, Firefox, Android | Excellent | WebM web embeds |

    #### 3. Resolution vs Bitrate
    Downscaling a 4K or 1080p video to 720p HD can reduce file size by **up to 75%** with very little noticeable degradation on smartphone or laptop displays.
    """)
