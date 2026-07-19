#!/usr/bin/env python3
"""
Fair Pour Toi — batch photo watermarking tool.

Usage:
    python3 watermark.py <input_folder> <output_folder> [options]

Example (no cropping, watermark applied to the original photo shape):
    python3 watermark.py ./new_photos ./watermarked --position bottom-right --opacity 0.55 --scale 0.16

Example (crop to match a carousel's display shape BEFORE watermarking,
so the watermark placement matches exactly what visitors will see):
    python3 watermark.py ./new_photos ./watermarked --crop-ratio 4:5

Drop any new event/product photos into an input folder, run this script,
and get finished, watermarked, web-ready copies in the output folder —
originals are never modified.
"""

import argparse
import os
import sys
from PIL import Image

SUPPORTED_EXTS = {".jpg", ".jpeg", ".png", ".webp"}

def parse_ratio(ratio_str):
    """Parse a 'W:H' string like '4:5' into a float (width / height)."""
    try:
        w, h = ratio_str.split(":")
        w, h = float(w), float(h)
        if w <= 0 or h <= 0:
            raise ValueError
        return w / h
    except Exception:
        raise argparse.ArgumentTypeError(
            f"Invalid --crop-ratio '{ratio_str}'. Use the format WIDTH:HEIGHT, e.g. 4:5"
        )

def center_crop_to_ratio(img, target_ratio):
    """Center-crop img (a PIL Image) to match target_ratio (width/height),
    trimming the longer dimension evenly from both sides."""
    w, h = img.size
    current_ratio = w / h

    if abs(current_ratio - target_ratio) < 1e-6:
        return img  # already the right shape

    if current_ratio > target_ratio:
        # image is too wide -> trim left/right
        new_w = int(h * target_ratio)
        left = (w - new_w) // 2
        box = (left, 0, left + new_w, h)
    else:
        # image is too tall -> trim top/bottom
        new_h = int(w / target_ratio)
        top = (h - new_h) // 2
        box = (0, top, w, top + new_h)

    return img.crop(box)

def load_logo(logo_path, target_width, opacity):
    """Load the logo, resize it to target_width (preserving aspect ratio),
    and scale its alpha channel by `opacity` (0-1)."""
    logo = Image.open(logo_path).convert("RGBA")
    aspect = logo.height / logo.width
    target_height = int(target_width * aspect)
    logo = logo.resize((target_width, target_height), Image.LANCZOS)

    if opacity < 1.0:
        r, g, b, a = logo.split()
        a = a.point(lambda px: int(px * opacity))
        logo = Image.merge("RGBA", (r, g, b, a))

    return logo

def get_position(base_size, logo_size, position, margin):
    bw, bh = base_size
    lw, lh = logo_size

    positions = {
        "bottom-right": (bw - lw - margin, bh - lh - margin),
        "bottom-left": (margin, bh - lh - margin),
        "bottom-center": ((bw - lw) // 2, bh - lh - margin),
        "top-right": (bw - lw - margin, margin),
        "top-left": (margin, margin),
        "center": ((bw - lw) // 2, (bh - lh) // 2),
    }
    if position not in positions:
        raise ValueError(f"Unknown position '{position}'. Choose from: {', '.join(positions)}")
    return positions[position]

def watermark_image(src_path, dest_path, logo_path, position, opacity, scale, margin_pct, crop_ratio):
    base = Image.open(src_path).convert("RGBA")

    if crop_ratio is not None:
        base = center_crop_to_ratio(base, crop_ratio)

    bw, bh = base.size

    logo_target_width = max(1, int(bw * scale))
    logo = load_logo(logo_path, logo_target_width, opacity)

    margin = int(bw * margin_pct)
    pos = get_position((bw, bh), logo.size, position, margin)

    composited = Image.alpha_composite(base, Image.new("RGBA", base.size, (0, 0, 0, 0)))
    composited.paste(logo, pos, logo)

    out = composited.convert("RGB")

    ext = os.path.splitext(dest_path)[1].lower()
    if ext in (".jpg", ".jpeg"):
        out.save(dest_path, quality=90, optimize=True)
    elif ext == ".webp":
        out.save(dest_path, quality=88, method=6)
    else:
        out.save(dest_path)

def main():
    parser = argparse.ArgumentParser(description="Batch-watermark photos with the Fair Pour Toi logo.")
    parser.add_argument("input_folder", help="Folder containing source photos")
    parser.add_argument("output_folder", help="Folder to write watermarked photos to")
    parser.add_argument("--logo", default="logo.png", help="Path to the logo PNG (default: logo.png next to this script)")
    parser.add_argument("--position", default="bottom-right",
                         choices=["bottom-right", "bottom-left", "bottom-center", "top-right", "top-left", "center"],
                         help="Where to place the watermark (default: bottom-right)")
    parser.add_argument("--opacity", type=float, default=0.55, help="Watermark opacity, 0-1 (default: 0.55)")
    parser.add_argument("--scale", type=float, default=0.16, help="Logo width as a fraction of photo width (default: 0.16)")
    parser.add_argument("--margin", type=float, default=0.03, help="Margin from edge as a fraction of photo width (default: 0.03)")
    parser.add_argument("--crop-ratio", type=parse_ratio, default=None,
                         help="Optional: center-crop to this WIDTH:HEIGHT ratio BEFORE watermarking, "
                              "so the watermark lines up with how the image will actually display "
                              "(e.g. 4:5 to match a portrait carousel). Omit to skip cropping.")
    args = parser.parse_args()

    if not os.path.isdir(args.input_folder):
        print(f"Input folder not found: {args.input_folder}")
        sys.exit(1)

    os.makedirs(args.output_folder, exist_ok=True)

    logo_path = args.logo
    if not os.path.isfile(logo_path):
        print(f"Logo file not found: {logo_path}")
        sys.exit(1)

    processed = 0
    for filename in sorted(os.listdir(args.input_folder)):
        ext = os.path.splitext(filename)[1].lower()
        if ext not in SUPPORTED_EXTS:
            continue
        src = os.path.join(args.input_folder, filename)
        dest = os.path.join(args.output_folder, filename)
        watermark_image(src, dest, logo_path, args.position, args.opacity, args.scale, args.margin, args.crop_ratio)
        print(f"  watermarked: {filename}")
        processed += 1

    print(f"\nDone — {processed} image(s) watermarked, saved to {args.output_folder}/")

if __name__ == "__main__":
    main()
