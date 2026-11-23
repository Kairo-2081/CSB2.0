"""Turns the raw README captures into the JPEGs README.md uses.

    python3 scripts/readme-images.py

Desktop captures become 1280 px wide at quality 82; phone captures 600 px wide.
"""
from pathlib import Path
from PIL import Image

raw = Path(".github/assets/readme/raw")
out = Path(".github/assets/readme")
for png in sorted(raw.glob("*.png")):
    im = Image.open(png).convert("RGB")
    width = 600 if png.name.startswith("phone-") else 1280
    if im.width != width:
        im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
    im.save(out / (png.stem + ".jpg"), "JPEG", quality=82, optimize=True, progressive=True)
    print(png.stem + ".jpg")
