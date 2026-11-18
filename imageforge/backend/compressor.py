from io import BytesIO
import warnings
from typing import Tuple
from PIL import Image, ImageOps, ImageSequence
import pillow_heif

# Register HEIC / HEIF opener
pillow_heif.register_heif_opener()

MAX_PIXELS = 40_000_000
Image.MAX_IMAGE_PIXELS = MAX_PIXELS

SUPPORTED_INPUTS = {"JPEG", "JPG", "PNG", "WEBP", "AVIF", "GIF", "HEIF", "HEIC"}
SUPPORTED_OUTPUTS = {"AUTO", "JPEG", "PNG", "WEBP", "AVIF", "GIF"}

MIME_TYPES = {
    "JPEG": "image/jpeg",
    "PNG": "image/png",
    "WEBP": "image/webp",
    "AVIF": "image/avif",
    "GIF": "image/gif",
}

def get_target_dimensions(orig_w: int, orig_h: int, max_w: int, max_h: int) -> Tuple[int, int]:
    """Calculate scaled dimensions preserving aspect ratio."""
    if max_w <= 0 and max_h <= 0:
        return orig_w, orig_h

    ratio = orig_w / orig_h

    if max_w > 0 and max_h > 0:
        # Fit inside bounding box
        target_w = min(orig_w, max_w)
        target_h = int(target_w / ratio)
        if target_h > max_h:
            target_h = max_h
            target_w = int(target_h * ratio)
        return max(1, target_w), max(1, target_h)
    elif max_w > 0:
        target_w = min(orig_w, max_w)
        target_h = int(target_w / ratio)
        return max(1, target_w), max(1, target_h)
    else:  # max_h > 0
        target_h = min(orig_h, max_h)
        target_w = int(target_h * ratio)
        return max(1, target_w), max(1, target_h)

def determine_smart_format(source_format: str, has_alpha: bool, is_animated: bool) -> str:
    """Choose the best output format automatically."""
    if is_animated:
        return "GIF"
    if has_alpha:
        # WebP preserves full transparency and achieves 60-80% smaller size than PNG
        return "WEBP"
    if source_format in ("JPEG", "JPG", "HEIF", "HEIC", "WEBP"):
        return "WEBP"
    return "WEBP"

def compress_image(
    data: bytes,
    quality: int = 82,
    output_format: str = "AUTO",
    width: int = 0,
    height: int = 0
) -> Tuple[bytes, str, str]:
    """
    Compress an image from bytes data and return (compressed_bytes, output_format, mime_type).
    """
    if not (1 <= quality <= 100):
        raise ValueError("Quality must be between 1 and 100")

    output_format = output_format.upper()
    if output_format not in SUPPORTED_OUTPUTS:
        raise ValueError(f"Unsupported output format: {output_format}")

    try:
        with warnings.catch_warnings():
            warnings.simplefilter("error", Image.DecompressionBombWarning)
            source = Image.open(BytesIO(data))

            if source.width * source.height > MAX_PIXELS:
                raise ValueError("Image dimensions too large (exceeds 40 megapixels).")

            raw_format = (source.format or "JPEG").upper()
            if raw_format == "HEIF" or raw_format == "HEIC":
                source_format = "HEIC"
            elif raw_format not in SUPPORTED_INPUTS:
                raise ValueError(f"Unsupported input format: {raw_format}")
            else:
                source_format = raw_format

            is_animated = (source_format == "GIF" and getattr(source, "is_animated", False))
            has_alpha = source.mode in ("RGBA", "LA", "PA") or (source.mode == "P" and "transparency" in source.info)

            # Determine final output format
            if output_format == "AUTO":
                final_format = determine_smart_format(source_format, has_alpha, is_animated)
            else:
                final_format = output_format

            # Compute target dimensions
            target_w, target_h = get_target_dimensions(source.width, source.height, width, height)
            needs_resize = (target_w != source.width or target_h != source.height)

            out_buffer = BytesIO()

            # Handle animated GIF preservation
            if is_animated and final_format == "GIF":
                frames = []
                durations = []
                loop = source.info.get("loop", 0)

                for frame in ImageSequence.Iterator(source):
                    f = frame.copy()
                    if needs_resize:
                        f = f.resize((target_w, target_h), Image.Resampling.LANCZOS)
                    frames.append(f)
                    durations.append(frame.info.get("duration", 100))

                frames[0].save(
                    out_buffer,
                    format="GIF",
                    save_all=True,
                    append_images=frames[1:],
                    duration=durations,
                    loop=loop,
                    optimize=True
                )
                compressed_bytes = out_buffer.getvalue()
                return compressed_bytes, "GIF", MIME_TYPES["GIF"]

            # Static image processing
            source.seek(0)
            image = ImageOps.exif_transpose(source)
            if needs_resize:
                image = image.resize((target_w, target_h), Image.Resampling.LANCZOS)

            # Encoding according to final_format
            if final_format == "JPEG":
                if image.mode in ("RGBA", "LA", "P"):
                    # Flatten alpha onto pure white background
                    background = Image.new("RGB", image.size, (255, 255, 255))
                    if image.mode != "RGBA":
                        image = image.convert("RGBA")
                    background.paste(image, mask=image.split()[3])
                    image = background
                elif image.mode != "RGB":
                    image = image.convert("RGB")

                image.save(
                    out_buffer,
                    format="JPEG",
                    quality=quality,
                    optimize=True,
                    progressive=True
                )

            elif final_format == "PNG":
                if image.mode not in ("RGBA", "RGB", "L", "LA"):
                    image = image.convert("RGBA")

                # If aggressive compression requested (quality < 85), quantize colors
                if quality < 85 and image.mode in ("RGBA", "RGB"):
                    num_colors = max(32, min(256, int(256 * (quality / 100))))
                    quantized = image.quantize(colors=num_colors, method=Image.Quantize.MEDIANCUT)
                    quantized.save(out_buffer, format="PNG", optimize=True, compress_level=9)
                else:
                    image.save(out_buffer, format="PNG", optimize=True, compress_level=9)

            elif final_format == "WEBP":
                if image.mode not in ("RGBA", "RGB"):
                    image = image.convert("RGBA" if has_alpha else "RGB")

                image.save(
                    out_buffer,
                    format="WEBP",
                    quality=quality,
                    method=6  # Highest compression effort
                )

            elif final_format == "AVIF":
                if image.mode not in ("RGBA", "RGB"):
                    image = image.convert("RGBA" if has_alpha else "RGB")

                image.save(
                    out_buffer,
                    format="AVIF",
                    quality=quality
                )

            elif final_format == "GIF":
                # Static GIF conversion
                if image.mode != "P":
                    image = image.convert("P", palette=Image.Palette.ADAPTIVE)
                image.save(out_buffer, format="GIF", optimize=True)

            compressed_bytes = out_buffer.getvalue()
            return compressed_bytes, final_format, MIME_TYPES.get(final_format, "application/octet-stream")

    except Exception as exc:
        if isinstance(exc, ValueError):
            raise
        raise ValueError(f"Invalid or corrupted image: {str(exc)}") from exc
