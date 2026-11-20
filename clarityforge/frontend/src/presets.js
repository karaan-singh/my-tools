// Enhancement presets. Values: scale (1/2/4), sliders 0-100, brightness -50..50
export const PRESETS = [
  {
    id: "auto",
    name: "Smart Auto",
    emoji: "✨",
    description: "Analyzes your file and picks the best fix",
    settings: { scale: 2, sharpen: 45, denoise: 20, color_fix: 60, contrast: 35, vibrance: 25, brightness: 0 },
  },
  {
    id: "portrait",
    name: "Portrait",
    emoji: "🙂",
    description: "Soft skin, clear eyes, natural tones",
    settings: { scale: 2, sharpen: 32, denoise: 38, color_fix: 50, contrast: 20, vibrance: 15, brightness: 5 },
  },
  {
    id: "vivid",
    name: "Vivid Landscape",
    emoji: "🏞️",
    description: "Punchy colors and crisp detail",
    settings: { scale: 2, sharpen: 52, denoise: 10, color_fix: 60, contrast: 55, vibrance: 55, brightness: 0 },
  },
  {
    id: "lowlight",
    name: "Low Light",
    emoji: "🌙",
    description: "Brighten dark shots and remove grain",
    settings: { scale: 1, sharpen: 30, denoise: 62, color_fix: 72, contrast: 45, vibrance: 25, brightness: 25 },
  },
  {
    id: "restore",
    name: "Old Photo Restore",
    emoji: "🖼️",
    description: "Upscale 4×, fix fading, recover detail",
    settings: { scale: 4, sharpen: 68, denoise: 45, color_fix: 80, contrast: 40, vibrance: 30, brightness: 5 },
  },
  {
    id: "deblur",
    name: "Fix Blur",
    emoji: "🎯",
    description: "Strong deblur and edge recovery",
    settings: { scale: 1, sharpen: 88, denoise: 15, color_fix: 0, contrast: 15, vibrance: 0, brightness: 0 },
  },
  {
    id: "upscale",
    name: "Upscale Only",
    emoji: "🔍",
    description: "More pixels, colors untouched",
    settings: { scale: 4, sharpen: 35, denoise: 15, color_fix: 0, contrast: 0, vibrance: 0, brightness: 0 },
  },
];

export const SLIDERS = [
  { key: "sharpen", label: "Deblur & Sharpen", hint: "Recovers soft edges and fine texture", min: 0, max: 100 },
  { key: "denoise", label: "Denoise", hint: "Removes grain and compression artifacts", min: 0, max: 100 },
  { key: "color_fix", label: "Auto Color Fix", hint: "White balance, levels and exposure", min: 0, max: 100 },
  { key: "contrast", label: "Local Contrast", hint: "Brings out depth and detail", min: 0, max: 100 },
  { key: "vibrance", label: "Vibrance", hint: "Richer colors without oversaturating", min: 0, max: 100 },
  { key: "brightness", label: "Brightness", hint: "Manual exposure adjustment", min: -50, max: 50 },
];

export const IMAGE_SCALES = [1, 2, 4];
export const VIDEO_SCALES = [1, 1.5, 2];

// Pro Camera looks (hidden tone/color science lives in backend/camera_look.py)
export const CAMERA_LOOKS = [
  {
    id: "iphone",
    name: "iPhone",
    badge: "Smart HDR",
    emoji: "📱",
    description: "Bright, clean and crisp — Smart HDR + Deep Fusion detail",
    settings: { intensity: 80, hdr: 60, detail: 55, color: 32, bokeh: 0, warmth: 4, vignette: 0, grain: 0, resolution: "12" },
  },
  {
    id: "iphone_portrait",
    name: "iPhone Portrait",
    badge: "Portrait mode",
    emoji: "🤳",
    description: "iPhone look with natural background blur",
    settings: { intensity: 80, hdr: 55, detail: 45, color: 28, bokeh: 60, warmth: 6, vignette: 10, grain: 0, resolution: "12" },
  },
  {
    id: "dslr",
    name: "DSLR",
    badge: "Full-frame",
    emoji: "📷",
    description: "Rich filmic tones, lens character, 24 MP detail",
    settings: { intensity: 80, hdr: 35, detail: 50, color: 24, bokeh: 0, warmth: 6, vignette: 20, grain: 10, resolution: "24" },
  },
  {
    id: "dslr_portrait",
    name: "DSLR Portrait",
    badge: "85mm f/1.8",
    emoji: "🎞️",
    description: "Creamy bokeh, subject pops off the background",
    settings: { intensity: 80, hdr: 30, detail: 42, color: 20, bokeh: 85, warmth: 8, vignette: 24, grain: 8, resolution: "24" },
  },
  {
    id: "night",
    name: "Night Mode",
    badge: "Low light",
    emoji: "🌃",
    description: "Brighter, cleaner low-light shots without grain",
    settings: { intensity: 80, hdr: 80, detail: 35, color: 25, bokeh: 0, warmth: -4, vignette: 8, grain: 0, resolution: "12" },
  },
];

export const CAMERA_SLIDERS = [
  { key: "intensity", label: "Look Strength", hint: "Overall intensity of the camera look", min: 0, max: 100 },
  { key: "hdr", label: "Smart HDR", hint: "Opens up shadows and holds bright skies", min: 0, max: 100 },
  { key: "detail", label: "Detail (Deep Fusion)", hint: "Fine texture in hair, fabric and foliage", min: 0, max: 100 },
  { key: "color", label: "Color Pop", hint: "Richer colors with skin-tone protection", min: 0, max: 100 },
  { key: "bokeh", label: "Background Blur", hint: "Portrait-mode lens blur around the focus point", min: 0, max: 100 },
  { key: "warmth", label: "Warmth", hint: "Cooler ← white balance → warmer", min: -50, max: 50 },
  { key: "vignette", label: "Lens Vignette", hint: "Darkens corners to draw the eye in", min: 0, max: 100 },
  { key: "grain", label: "Film Grain", hint: "Fine organic texture of a big sensor", min: 0, max: 100 },
];

export const CAMERA_RESOLUTIONS = [
  { id: "original", label: "Original" },
  { id: "12", label: "12 MP" },
  { id: "24", label: "24 MP" },
];

export function formatSize(bytes) {
  if (!bytes && bytes !== 0) return "—";
  if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  return (bytes / 1024).toFixed(1) + " KB";
}

export function formatTime(seconds) {
  if (seconds == null || !isFinite(seconds)) return "—";
  const s = Math.max(0, Math.round(seconds));
  const m = Math.floor(s / 60);
  return m ? `${m}m ${String(s % 60).padStart(2, "0")}s` : `${s}s`;
}
