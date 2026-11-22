"""Grade CSB 2.0 campus photos so they sit on the obsidian page and glow.

Usage: python3 scripts/grade-photos.py SRC DST [--max-width N]
       python3 scripts/grade-photos.py SRC DST --band 2200x1040 [--focus-y 0.5] [--grain]
(needs Pillow and NumPy: pip install pillow numpy)

Sources are the small web-saved originals upscaled 4x with Real-ESRGAN
(x4plus) first; bands are exported at 2x (2200x1040) for sharp retina screens.

The grade keeps each photo's own colour and light:
1. Normalise exposure so a sunlit gate and a building at night sit close,
   without crushing either.
2. A gentle S-curve for contrast, saturation kept at ~90 %.
3. Split tone: shadows lean to the page's blue-black, highlights pick up a
   little saffron (#F2A93B), the UI accent, so photo and page feel lit by
   the same lamp.
4. Blacks land exactly on the page colour (#07070d) and a soft vignette lets
   the edges fall away into it.
"""
import sys
import numpy as np
from PIL import Image

OBSIDIAN = np.array([7, 7, 13]) / 255
SAFFRON = np.array([242, 169, 59]) / 255


def luminance(a):
    return 0.2126 * a[..., 0] + 0.7152 * a[..., 1] + 0.0722 * a[..., 2]


def grade(img: Image.Image) -> Image.Image:
    a = np.asarray(img.convert("RGB")).astype(np.float64) / 255

    # 1. exposure: pull every photo toward the same mid level, gently
    m = luminance(a).mean()
    a = np.clip(a * np.clip(0.36 / max(m, 1e-3), 0.7, 1.35), 0, 1)
    lo, hi = np.percentile(luminance(a), 0.8), np.percentile(luminance(a), 99.6)
    a = np.clip((a - lo) / max(hi - lo, 1e-3), 0, 1)

    # 2. S-curve and saturation
    a = a + 0.3 * (a * a * (3 - 2 * a) - a)  # blend 30 % toward smoothstep
    grey = luminance(a)[..., None]
    a = np.clip(grey + (a - grey) * 0.92, 0, 1)

    # 3. split tone
    lum = luminance(a)[..., None]
    hi_w = np.clip((lum - 0.45) / 0.55, 0, 1) ** 1.3
    sh_w = np.clip((0.35 - lum) / 0.35, 0, 1)
    a = a * (1 - 0.14 * hi_w) + SAFFRON * lum * 0.14 * hi_w * 1.25
    a = a * (1 - 0.35 * sh_w) + OBSIDIAN * 0.35 * sh_w

    # 4. black point to the page colour, highlights capped below pure white
    a = OBSIDIAN + a * (0.97 - OBSIDIAN)

    h, w = a.shape[:2]
    yy, xx = np.mgrid[0:h, 0:w]
    d = np.sqrt(((xx - w / 2) / (w / 2)) ** 2 + ((yy - h / 2) / (h / 2)) ** 2) / np.sqrt(2)
    v = (1 - 0.32 * np.clip(d - 0.3, 0, 1) ** 1.5)[..., None]
    a = a * v + OBSIDIAN * (1 - v)

    return Image.fromarray((np.clip(a, 0, 1) * 255).round().astype(np.uint8))


def band(img: Image.Image, width: int, height: int, focus_y: float) -> Image.Image:
    """Crop to the band's aspect around a vertical focus point, then resize."""
    target = width / height
    w, h = img.size
    if w / h > target:
        cw = round(h * target)
        left = (w - cw) // 2
        img = img.crop((left, 0, left + cw, h))
    else:
        ch = round(w / target)
        top = int(np.clip(focus_y * h - ch / 2, 0, h - ch))
        img = img.crop((0, top, w, top + ch))
    return img.resize((width, height), Image.LANCZOS)


def add_grain(img: Image.Image, amount: float = 0.012, seed: int = 7) -> Image.Image:
    """Monochrome film grain. It reads as texture and hides upscaling softness."""
    a = np.asarray(img).astype(np.float64) / 255
    rng = np.random.default_rng(seed)
    noise = rng.normal(0, amount, a.shape[:2])[..., None]
    return Image.fromarray((np.clip(a + noise, 0, 1) * 255).round().astype(np.uint8))


if __name__ == "__main__":
    args = sys.argv[1:]
    src, dst = args[0], args[1]
    opt = lambda name, default=None: args[args.index(name) + 1] if name in args else default
    im = Image.open(src).convert("RGB")
    if "--band" in args:
        bw, bh = (int(v) for v in opt("--band").split("x"))
        im = band(im, bw, bh, float(opt("--focus-y", "0.5")))
    elif opt("--max-width") and im.width > int(opt("--max-width")):
        mw = int(opt("--max-width"))
        im = im.resize((mw, round(im.height * mw / im.width)), Image.LANCZOS)
    out = grade(im)
    if "--grain" in args:
        out = add_grain(out)
    out.save(dst, "WEBP", quality=82, method=6)
    print(dst, out.size)
