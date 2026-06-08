from __future__ import annotations

import json
import os
from pathlib import Path

from PIL import ExifTags, Image, ImageEnhance


SOURCE_DIR = Path(os.environ.get("DUNWICH_GUMPI_SOURCE_DIR", r"..\Dunwich Ferry Terminal")).resolve()
ROOT = Path(__file__).resolve().parents[1]
PANOS_DIR = ROOT / "assets" / "panos"
IMAGES_DIR = ROOT / "assets" / "images"
DATA_PATH = ROOT / "assets" / "photo-data.js"
MANIFEST_PATH = ROOT / "docs" / "photo-manifest.json"


def gps_to_decimal(value, ref: str) -> float:
    degrees, minutes, seconds = value
    decimal = float(degrees) + float(minutes) / 60 + float(seconds) / 3600
    if ref in {"S", "W"}:
        decimal *= -1
    return decimal


def read_gps(image: Image.Image) -> tuple[float, float] | None:
    exif = image.getexif()
    if not exif:
        return None

    gps_raw = None
    gps_ifd_key = None
    for key, value in exif.items():
        if ExifTags.TAGS.get(key) == "GPSInfo":
            gps_ifd_key = key
            gps_raw = value
            break

    if gps_ifd_key is not None and not hasattr(gps_raw, "items"):
        gps_raw = exif.get_ifd(gps_ifd_key)

    if not gps_raw:
        return None

    gps_tags = {}
    for key, value in gps_raw.items():
        gps_tags[ExifTags.GPSTAGS.get(key, key)] = value

    lat = gps_tags.get("GPSLatitude")
    lat_ref = gps_tags.get("GPSLatitudeRef")
    lon = gps_tags.get("GPSLongitude")
    lon_ref = gps_tags.get("GPSLongitudeRef")
    if not (lat and lat_ref and lon and lon_ref):
        return None

    return gps_to_decimal(lat, lat_ref), gps_to_decimal(lon, lon_ref)


def resize_to_width(image: Image.Image, width: int) -> Image.Image:
    if image.width <= width:
        return image.copy()
    ratio = width / image.width
    height = int(round(image.height * ratio))
    return image.resize((width, height), Image.Resampling.LANCZOS)


def save_webp(image: Image.Image, path: Path, quality: int = 74) -> None:
    image.convert("RGB").save(path, "WEBP", quality=quality, method=6)


def make_hero_from_pano(image: Image.Image, path: Path) -> None:
    resized = resize_to_width(image, 2600)
    crop_height = min(resized.height, 880)
    top = max(0, int(resized.height * 0.24))
    if top + crop_height > resized.height:
        top = max(0, resized.height - crop_height)
    crop = resized.crop((0, top, resized.width, top + crop_height))
    save_webp(crop, path, quality=78)


def make_card_from_pano(image: Image.Image, path: Path) -> None:
    resized = resize_to_width(image, 2600)
    crop_height = int(resized.height * 0.74)
    crop_width = int(crop_height * 16 / 9)
    left = min(max(int(resized.width * 0.48), 0), resized.width - crop_width)
    top = int(resized.height * 0.13)
    crop = resized.crop((left, top, left + crop_width, top + crop_height))
    crop = crop.resize((1280, 720), Image.Resampling.LANCZOS)
    crop = ImageEnhance.Contrast(crop).enhance(1.06)
    crop = ImageEnhance.Color(crop).enhance(1.04)
    save_webp(crop, path, quality=82)


def main() -> None:
    PANOS_DIR.mkdir(parents=True, exist_ok=True)
    IMAGES_DIR.mkdir(parents=True, exist_ok=True)

    manifest = []
    photo_points = []

    hall_images = [
        ("717186719_10164985091850132_4563607167707360607_n.jpg", "hall-render-board", "Dunwich Hall artist-render board"),
        ("718086960_10164985091745132_7466536021009325346_n.jpg", "dunwich-public-hall-sign", "Dunwich Public Hall sign"),
    ]

    for filename, slug, label in hall_images:
        source = SOURCE_DIR / filename
        with Image.open(source) as image:
            out = IMAGES_DIR / f"{slug}.webp"
            save_webp(resize_to_width(image, 1800), out, quality=78)
            manifest.append(
                {
                    "sourceFile": source.name,
                    "output": str(out.relative_to(ROOT)).replace("\\", "/"),
                    "label": label,
                    "width": image.width,
                    "height": image.height,
                    "gps": None,
                }
            )

    hero_written = False
    for source in sorted(SOURCE_DIR.glob("GS__*.JPG")):
        with Image.open(source) as image:
            gps = read_gps(image)
            source_id = source.stem.replace("GS__", "")
            pano_name = f"pano-{source_id}.webp"
            thumb_name = f"thumb-{source_id}.webp"
            pano_path = PANOS_DIR / pano_name
            thumb_path = PANOS_DIR / thumb_name
            save_webp(resize_to_width(image, 2400), pano_path, quality=70)
            save_webp(resize_to_width(image, 720), thumb_path, quality=68)

            if gps and not hero_written:
                make_hero_from_pano(image, IMAGES_DIR / "terminal-foreshore-hero.webp")
                make_card_from_pano(image, IMAGES_DIR / "terminal-foreshore-card.webp")
                hero_written = True

            record = {
                "id": source_id,
                "sourceFile": source.name,
                "title": f"360 site photo {source_id}",
                "pano": f"assets/panos/{pano_name}",
                "thumb": f"assets/panos/{thumb_name}",
                "width": image.width,
                "height": image.height,
                "gps": None,
            }
            if gps:
                lat, lon = gps
                record["gps"] = {
                    "lat": round(lat, 5),
                    "lon": round(lon, 5),
                    "precision": "rounded from photo EXIF, not survey-grade",
                }
                photo_points.append(
                    {
                        "id": record["id"],
                        "title": record["title"],
                        "sourceFile": record["sourceFile"],
                        "lat": record["gps"]["lat"],
                        "lon": record["gps"]["lon"],
                        "pano": record["pano"],
                        "thumb": record["thumb"],
                        "notes": "Community site-photo point from the GoPro Max 360 intake.",
                    }
                )

            manifest.append(record)

    DATA_PATH.write_text(
        "window.DUNWICH_GUMPI_PHOTO_POINTS = "
        + json.dumps(photo_points, indent=2)
        + ";\n",
        encoding="utf-8",
    )
    MANIFEST_PATH.write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    print(f"Wrote {len(photo_points)} mapped photo points")
    print(f"Wrote {len(manifest)} manifest records")


if __name__ == "__main__":
    main()
