"""Grade CSB 2.0 campus photos to the obsidian / ivory / sand palette.

Usage: python3 scripts/grade-photos.py SRC DST [--max-width N]
       python3 scripts/grade-photos.py SRC DST --band 1100x520 [--focus-y 0.5] --grain
(needs Pillow and NumPy: pip install pillow numpy)

The grade:
1. Pull exposure down and roll off highlights so skies and white walls stop
   glowing (nothing ends up brighter than warm stone).
2. Desaturate heavily, keeping a little of the photo's own colour.
3. Gradient-map luminance onto obsidian -> umber -> sand -> ivory, so every
   photo shares the same shadows and highlights as the UI.
4. A soft vignette, so edges fall away towards the page background.
"""
import sys
import numpy as np
from PIL import Image, ImageFilter

OBSIDIAN = np.array([7, 7, 13]) / 255
UMBER = np.array([52, 40, 33]) / 255
SAND = np.array([168, 141, 118]) / 255
IVORY = np.array([228, 216, 200]) / 255


def gradient_map(lum):
    # stops: 0 -> obsidian, 0.35 -> umber, 0.75 -> sand, 1 -> ivory
    stops = [(0.0, OBSIDIAN), (0.35, UMBER), (0.75, SAND), (1.0, IVORY)]
    out = np.zeros(lum.shape + (3,))
    for (p0, c0), (p1, c1) in zip(stops, stops[1:]):
        m = (lum >= p0) & (lum <= p1)
        t = ((lum[m] - p0) / (p1 - p0))[:, None]
        out[m] = c0 * (1 - t) + c1 * t
    return out


def grade(img: Image.Image) -> Image.Image:
    a = np.asarray(img.convert("RGB")).astype(np.float64) / 255

    # 1. exposure and highlight roll-off (soft shoulder above 0.45)
    a = a * 0.82
    shoulder = 0.45
    hi = a > shoulder
    a[hi] = shoulder + (1 - shoulder) * np.tanh((a[hi] - shoulder) / (1 - shoulder) * 1.1) * 0.55
    # gentle contrast around the mids
    a = np.clip((a - 0.5) * 1.08 + 0.48, 0, 1)

    lum = 0.2126 * a[..., 0] + 0.7152 * a[..., 1] + 0.0722 * a[..., 2]

    # auto exposure: bring every photo to the same dim average, so a white
    # gate in sunshine and a building at night sit at the same level
    target = 0.25
    gain = np.clip(target / max(lum.mean(), 1e-3), 0.4, 1.15)
    a = np.clip(a * gain, 0, 1)
    lum = np.clip(lum * gain, 0, 1)

    # levels: same black point and same brightest highlight for every photo
    lo, hi_ = np.percentile(lum, 1.5), np.percentile(lum, 99.2)
    black, white = 0.02, 0.68
    scale = (white - black) / max(hi_ - lo, 1e-3)
    a = np.clip((a - lo) * scale + black, 0, 1)
    lum = np.clip((lum - lo) * scale + black, 0, 1)

    # 2. selective desaturation: keep warm light (brick, lamps, sand) at 60 %,
    #    mute cool colour (sky, foliage) to 15 %
    warmth = np.clip((a[..., 0] - a[..., 2]) * 3, 0, 1)[..., None]
    keep = 0.15 + 0.45 * warmth
    grey = lum[..., None].repeat(3, axis=2)
    desat = grey + (a - grey) * keep

    # 3. gradient map, blended with the desaturated photo
    mapped = gradient_map(np.clip(lum * 1.05, 0, 1))
    out = mapped * 0.5 + desat * 0.5

    # high-key photos (white walls in sun) still sit brighter than the rest:
    # bend the mids down with a gamma until the average matches the others
    m = float((0.2126 * out[..., 0] + 0.7152 * out[..., 1] + 0.0722 * out[..., 2]).mean())
    if m > 0.2:
        out = np.clip(out, 1e-4, 1) ** (np.log(0.2) / np.log(m))

    # 4. vignette
    h, w = lum.shape
    yy, xx = np.mgrid[0:h, 0:w]
    d = np.sqrt(((xx - w / 2) / (w / 2)) ** 2 + ((yy - h / 2) / (h / 2)) ** 2) / np.sqrt(2)
    vignette = 1 - 0.45 * np.clip(d - 0.25, 0, 1) ** 1.4
    out = out * vignette[..., None] + OBSIDIAN * (1 - vignette[..., None])

    res = Image.fromarray((np.clip(out, 0, 1) * 255).round().astype(np.uint8))
    # a whisper of softening hides upscale and JPEG artefacts on these small sources
    return res.filter(ImageFilter.GaussianBlur(0.35))


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


def add_grain(img: Image.Image, amount: float = 0.035, seed: int = 7) -> Image.Image:
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
        im = im.filter(ImageFilter.GaussianBlur(0.6))
    elif opt("--max-width") and im.width > int(opt("--max-width")):
        mw = int(opt("--max-width"))
        im = im.resize((mw, round(im.height * mw / im.width)), Image.LANCZOS)
    out = grade(im)
    if "--grain" in args:
        out = add_grain(out)
    out.save(dst, "WEBP", quality=84, method=6)
    print(dst, out.size)
