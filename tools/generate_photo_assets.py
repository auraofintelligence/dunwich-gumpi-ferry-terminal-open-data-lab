from __future__ import annotations

import json
import os
import zipfile
from datetime import datetime
from pathlib import Path

from PIL import ExifTags, Image, ImageEnhance


ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIR = Path(
    os.environ.get("DUNWICH_GUMPI_SOURCE_DIR", str(ROOT.parent / "Dunwich Ferry Terminal"))
).resolve()
PANOS_DIR = ROOT / "assets" / "panos"
IMAGES_DIR = ROOT / "assets" / "images"
DOWNLOADS_DIR = ROOT / "assets" / "downloads"
DATA_PATH = ROOT / "assets" / "photo-data.js"
MANIFEST_PATH = ROOT / "docs" / "photo-manifest.json"
ALL_ZIP_NAME = "dunwich-gumpi-public-360-panoramas.zip"
MAPPED_ZIP_NAME = "dunwich-gumpi-mapped-360-panoramas.zip"


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


def read_capture_time(image: Image.Image, source: Path) -> datetime:
    exif = image.getexif()
    exif_values = {}
    for key, value in exif.items():
        exif_values[ExifTags.TAGS.get(key, key)] = value

    for tag in ("DateTimeOriginal", "DateTimeDigitized", "DateTime"):
        value = exif_values.get(tag)
        if not value:
            continue
        try:
            return datetime.strptime(str(value), "%Y:%m:%d %H:%M:%S")
        except ValueError:
            continue

    return datetime.fromtimestamp(source.stat().st_mtime)


def format_capture_time(value: datetime) -> str:
    hour = value.strftime("%I").lstrip("0") or "0"
    return f"{value.day} {value.strftime('%B %Y')}, {hour}:{value.strftime('%M')} {value.strftime('%p').lower()}"


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


def clean_generated_assets() -> None:
    PANOS_DIR.mkdir(parents=True, exist_ok=True)
    DOWNLOADS_DIR.mkdir(parents=True, exist_ok=True)
    for path in PANOS_DIR.glob("*.webp"):
        path.unlink()
    for path in DOWNLOADS_DIR.glob("*.zip"):
        path.unlink()


def create_zip(path: Path, files: list[tuple[Path, str]]) -> None:
    with zipfile.ZipFile(path, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        for source, public_name in files:
            archive.write(source, arcname=public_name)


def main() -> None:
    PANOS_DIR.mkdir(parents=True, exist_ok=True)
    IMAGES_DIR.mkdir(parents=True, exist_ok=True)
    DOWNLOADS_DIR.mkdir(parents=True, exist_ok=True)
    clean_generated_assets()

    manifest = []
    photo_points = []
    zip_all = []
    zip_mapped = []

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

    scanned = []
    for source in sorted(SOURCE_DIR.glob("GS__*.JPG")):
        with Image.open(source) as image:
            scanned.append(
                {
                    "source": source,
                    "sourceId": source.stem.replace("GS__", ""),
                    "gps": read_gps(image),
                    "captureTime": read_capture_time(image, source),
                    "width": image.width,
                    "height": image.height,
                }
            )

    mapped_sources = [
        item for item in sorted(scanned, key=lambda item: (item["captureTime"], item["source"].name))
        if item["gps"]
    ]
    sequence_by_source = {
        item["source"]: index + 1 for index, item in enumerate(mapped_sources)
    }

    for item in scanned:
        source = item["source"]
        sequence = sequence_by_source.get(source)
        if sequence:
            base_name = f"dunwich-gumpi-360-{sequence:02d}"
            title = f"360 map photo {sequence}"
            public_name = f"Dunwich Gumpi 360 map photo {sequence}"
            download_name = f"{base_name}.webp"
        else:
            base_name = f"dunwich-gumpi-360-unmapped-{item['sourceId']}"
            title = "360 unmapped reference photo"
            public_name = "Dunwich Gumpi 360 unmapped reference photo"
            download_name = f"{base_name}.webp"

        pano_name = f"{base_name}.webp"
        thumb_name = f"{base_name}-thumb.webp"
        pano_path = PANOS_DIR / pano_name
        thumb_path = PANOS_DIR / thumb_name

        with Image.open(source) as image:
            save_webp(resize_to_width(image, 2400), pano_path, quality=70)
            save_webp(resize_to_width(image, 720), thumb_path, quality=68)
            if sequence == 1:
                make_hero_from_pano(image, IMAGES_DIR / "terminal-foreshore-hero.webp")
                make_card_from_pano(image, IMAGES_DIR / "terminal-foreshore-card.webp")

        zip_all.append((pano_path, download_name))

        record = {
            "sourceFile": source.name,
            "publicName": public_name,
            "captureOrder": sequence,
            "captureTimeLocal": format_capture_time(item["captureTime"]),
            "pano": str(pano_path.relative_to(ROOT)).replace("\\", "/"),
            "thumb": str(thumb_path.relative_to(ROOT)).replace("\\", "/"),
            "downloadName": download_name,
            "width": item["width"],
            "height": item["height"],
            "gps": None,
        }

        if item["gps"]:
            lat, lon = item["gps"]
            record["gps"] = {
                "lat": round(lat, 5),
                "lon": round(lon, 5),
                "precision": "rounded from photo EXIF, not survey-grade",
            }
            zip_mapped.append((pano_path, download_name))
            photo_points.append(
                {
                    "id": f"photo-{sequence:02d}",
                    "sequence": sequence,
                    "title": title,
                    "publicName": public_name,
                    "captureLabel": record["captureTimeLocal"],
                    "lat": record["gps"]["lat"],
                    "lon": record["gps"]["lon"],
                    "pano": record["pano"],
                    "thumb": record["thumb"],
                    "downloadName": download_name,
                    "notes": "Mapped 360 panorama from the community GoPro Max intake.",
                }
            )

        manifest.append(record)

    create_zip(DOWNLOADS_DIR / ALL_ZIP_NAME, zip_all)
    create_zip(DOWNLOADS_DIR / MAPPED_ZIP_NAME, zip_mapped)

    downloads = {
        "allPanos": f"assets/downloads/{ALL_ZIP_NAME}",
        "mappedPanos": f"assets/downloads/{MAPPED_ZIP_NAME}",
        "totalPublicPanos": len(zip_all),
        "totalMappedPanos": len(zip_mapped),
    }

    DATA_PATH.write_text(
        "window.DUNWICH_GUMPI_PHOTO_POINTS = "
        + json.dumps(photo_points, indent=2)
        + ";\nwindow.DUNWICH_GUMPI_DOWNLOADS = "
        + json.dumps(downloads, indent=2)
        + ";\n",
        encoding="utf-8",
    )
    MANIFEST_PATH.write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    print(f"Wrote {len(photo_points)} mapped photo points")
    print(f"Wrote {len(manifest)} manifest records")
    print(f"Wrote {ALL_ZIP_NAME} and {MAPPED_ZIP_NAME}")


if __name__ == "__main__":
    main()
