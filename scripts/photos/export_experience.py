"""Export the experience photos for the web.

Reads the originals in ~/Pictures/Portfolio (never modified), writes upright, metadata-free WebP files to
public/images/xp/<set>/ (a full size and a strip thumbnail) and the list the page reads to src/data/photos.json.

    python3 scripts/photos/export_experience.py

To add a photo: put it in the right folder, add a line below (file-name prefix, description), run again.
Only the files listed below are exported; anything else in those folders stays out unless Diego adds it here.
"""
import json
import subprocess
import tempfile
from pathlib import Path

from PIL import Image, ImageOps

Image.MAX_IMAGE_PIXELS = None   # one original is 96 MP
SOURCE = Path.home() / "Pictures/Portfolio"
ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "public/images/xp"
FULL_EDGE, THUMB_HEIGHT = 1800, 520

# set -> (source folder, [(file-name prefix, description, optional crop (left, top, right, bottom) as fractions)])
SETS = {
    "l3harris-2026": ("L3Harris2026", [
        ("C83D5236", "Outside the L3Harris building, by the reflecting pool"),
        ("27FE3EFE", "Selfie in the L3Harris polo and lanyard"),
        ("1E9E18CF", "Four friends in Spider-Man masks outside a cinema"),
        ("87AC1F91", "Fireworks over a torii gate at night"),
        ("2ED3ED7E", "In the company polo in front of the L3Harris building"),
        ("B222C670", "A Spider-Man mask up close, arms reaching for the camera"),
        ("8E507E05", "The Slinky Dog coaster against a cloudy sky"),
        ("FDE46B54", "A glittering pair of Mickey ears against a blue sky"),
    ]),
    "rocs": ("ROCS", [
        ("533B7E5E", "Beside the projected title slide of the ROCS presentation"),
        ("AD7EEE8C", "At the podium with the microphone, teammates alongside"),
        ("13B6AE8C", "The team on stage during the acknowledgements"),
    ]),
    "l3harris-2025": ("L3Harris2025", [
        ("IMG_5903", "Next to the L3Harris sign and its red lattice sphere"),
        ("thumbnail_Perez", "Intern headshot, summer 2025"),
        ("IMG_6189", "Beside a LEGO Spider-Man climbing a doorway"),
        ("C80347E6", "Toy Story Land under towering clouds"),
    ]),
    "evertec": ("Evertec", [
        ("c712f30c", "The intern class in a meeting room"),
        ("3b5cdf54", "Six of us in front of the office mural"),
        ("b77b4181", "With a colleague at the Evertec twenty-years sign"),
    ]),
    "mcs": ("MCS", [
        ("IMG_8378", "Next to the opening slide of my final presentation at MCS"),
        ("f0924b63", "With the team at the MCS Classicare five-star sign"),
        ("IMG_8370", "Selfie with the team in the training room"),
    ]),
    "pandahat": ("PandaHat", [
        ("e73a69ea", "Soldering a circuit board at the lab bench"),
    ]),
    "team-made": ("TeamMade", [
        ("4927D742", "A collage of group photos from Prepa Week 2022, the orientation week for first-year students"),
        ("IMG_2332", "An orientation talk in the auditorium, seen from the back rows"),
        ("IMG_2357", "With fellow counselors in green shirts around a table"),
        ("IMG_2340", "Selfie in a mask and the counselor lanyard"),
    ]),
    "tech-exchange": ("TechX", [
        ("FF14737B", "Beside a Google G made of balloons, with TECH X spelled out"),
        ("4e36897e", "The Puerto Rico group holding the flag at the Tech Exchange closing"),
        ("7b6ec49d", "The cohort lined up at the Golden Gate Bridge"),
        ("009F234C", "At a Golden Gate Bridge overlook"),
        ("7B805811", "A Google Noogler propeller hat in a display case"),
        ("IMG_4156", "Mirror selfie in a room of colored discs"),
        ("BE81F183", "Looking up inside an aquarium tunnel"),
        ("D46AB05D", "A silhouette at a round aquarium window"),
        ("5D8534DE", "In front of a floor-to-ceiling aquarium tank"),
        ("IMG_7535", "Back at the Golden Gate in August"),
    ]),
    "gmis-2026": ("Gmis2026", [
        ("IMG_0949", "Conference headshot in an olive blazer"),
        ("IMG_0891", "At the Great Minds in STEM backdrop, in a blazer"),
        ("a7a7f12a", "Six of us stacked with arms out at the conference backdrop"),
        ("4d83e927", "At the backdrop in a CAHSI shirt"),
        ("DSC00082", "Bronze statues of Walter White and Jesse Pinkman"),
        ("DSC00034", "A Welcome to Albuquerque banner on Route 66"),
        ("IMG_0835", "A giant Route 66 sign"),
        ("IMG_0845", "Standing in a red-lit tunnel"),
    ]),
    "gmis-2025": ("Gmis2025", [
        ("01e8038b", "A large group in black shirts holding the Puerto Rico flag on a terrace"),
        ("75e0fa7b", "The team in pink shirts with the Puerto Rico flag, laptops open"),
        ("IMG_8245", "Selfie with friends on the expo floor", (0, 0, 1, 0.8)),   # crop out the name badges and their QR codes
        ("IMG_8285", "Four of us under a Howl-O-Scream sign lit in red"),
    ]),
}


def upright(path: Path) -> Image.Image:
    """Open any of the originals (HEIC included) the right way up, without its metadata."""
    if path.suffix.lower() in (".heic", ".heif"):
        with tempfile.NamedTemporaryFile(suffix=".jpg") as tmp:
            subprocess.run(["sips", "-s", "format", "jpeg", "-s", "formatOptions", "95", str(path), "--out", tmp.name], check=True, capture_output=True)
            image = Image.open(tmp.name); image.load()
    else:
        image = Image.open(path); image.load()
    image = ImageOps.exif_transpose(image)
    return image.convert("RGBA" if "A" in image.getbands() else "RGB")


def main():
    data = {}
    for name, (folder, items) in SETS.items():
        target = OUT / name
        target.mkdir(parents=True, exist_ok=True)
        for stale in target.glob("*.webp"): stale.unlink()
        data[name] = []
        for index, (prefix, alt, *crop) in enumerate(items, 1):
            matches = [f for f in (SOURCE / folder).iterdir() if f.name.startswith(prefix)]
            assert len(matches) == 1, f"{folder}/{prefix}: expected one file, found {len(matches)}"
            image = upright(matches[0])
            if crop:
                left, top, right, bottom = crop[0]
                image = image.crop((int(left * image.width), int(top * image.height), int(right * image.width), int(bottom * image.height)))
            full = image.copy(); full.thumbnail((FULL_EDGE, FULL_EDGE), Image.LANCZOS)
            thumb = image.copy(); thumb.thumbnail((THUMB_HEIGHT * 4, THUMB_HEIGHT), Image.LANCZOS)
            full.save(target / f"{index:02d}.webp", "WEBP", quality=80, method=6)
            thumb.save(target / f"{index:02d}-thumb.webp", "WEBP", quality=76, method=6)
            data[name].append({"src": f"/images/xp/{name}/{index:02d}.webp", "thumb": f"/images/xp/{name}/{index:02d}-thumb.webp",
                               "width": full.width, "height": full.height, "alt": alt, "cutout": "A" in image.getbands()})
            assert not Image.open(target / f"{index:02d}.webp").getexif(), "metadata survived the export"
    (ROOT / "src/data/photos.json").write_text(json.dumps(data, indent=1, ensure_ascii=False) + "\n")
    count = sum(len(v) for v in data.values())
    size = sum(f.stat().st_size for f in OUT.rglob("*.webp")) / 1e6
    print(f"{count} photos in {len(data)} sets, {size:.1f} MB in {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
