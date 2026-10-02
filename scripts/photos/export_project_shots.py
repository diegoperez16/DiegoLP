"""Turn the project screenshots into what the project sheets load.

Every PNG or JPEG in public/images/projects/<project>/ becomes <name>.webp (at most 1600 px wide) and
<name>-thumb.webp (the small picture in the row under the sheet's art); the original is then removed.

    python3 scripts/photos/export_project_shots.py

To add a screenshot: drop it in the project's folder, run this, and list the .webp under `shots` in
src/data/callingCard.js. The page finds the thumbnail by name, so the two files must stay together.
"""
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[2] / "public/images/projects"
FULL_WIDTH = 1600
THUMB = (252, 168)   # drawn at 84 x 56 CSS pixels, from the picture's top-left corner like the cover


def main():
    sources = sorted(p for p in ROOT.glob("*/*") if p.suffix.lower() in (".png", ".jpg", ".jpeg"))
    for source in sources:
        image = Image.open(source).convert("RGB")
        full = image.copy(); full.thumbnail((FULL_WIDTH, FULL_WIDTH * 4), Image.LANCZOS)
        full.save(source.with_suffix(".webp"), "WEBP", quality=84, method=6)
        ImageOps.fit(image, THUMB, Image.LANCZOS, centering=(0, 0)).save(source.with_name(source.stem + "-thumb.webp"), "WEBP", quality=78, method=6)
        source.unlink()
        print(f"{source.relative_to(ROOT)} -> {full.width} x {full.height}, {source.with_suffix('.webp').stat().st_size // 1024} KB")
    if not sources: print("nothing to convert")


if __name__ == "__main__":
    main()
