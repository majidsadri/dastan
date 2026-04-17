#!/usr/bin/env python3
"""
Fetch iconic Salvador Dalí paintings from WikiArt and add them to
paintings-collection/catalog.json.

Also prunes weak existing Dalí entries so the iOS app surfaces the
famous works rather than obscure minor pieces.

Run from repo root:
    backend/venv/bin/python3 scripts/fetch-dali-wikiart.py
"""
from __future__ import annotations

import json
import re
import sys
import time
import urllib.request
from datetime import date
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
COLLECTION = REPO / "paintings-collection"
CATALOG_PATH = COLLECTION / "catalog.json"
FOLDER = COLLECTION / "surrealism"

UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X) DastanArtApp/1.0"

# (slug_on_wikiart, display_title, year, medium, location)
ICONIC: list[tuple[str, str, str, str, str]] = [
    ("the-persistence-of-memory-1931", "The Persistence of Memory", "1931",
     "Oil on canvas", "Museum of Modern Art, New York"),
    ("the-metamorphosis-of-narcissus", "Metamorphosis of Narcissus", "1937",
     "Oil on canvas", "Tate Modern, London"),
    ("christ-of-st-john-of-the-cross-1951", "Christ of Saint John of the Cross", "1951",
     "Oil on canvas", "Kelvingrove Art Gallery, Glasgow"),
    ("dream-caused-by-the-flight-of-a-bee-around-a-pomegranate-one-second-before-awakening",
     "Dream Caused by the Flight of a Bee around a Pomegranate a Second Before Awakening",
     "1944", "Oil on panel", "Thyssen-Bornemisza Museum, Madrid"),
    ("crucifixion-corpus-hypercubicus-1954", "Crucifixion (Corpus Hypercubicus)", "1954",
     "Oil on canvas", "Metropolitan Museum of Art, New York"),
    ("galatea-of-the-spheres", "Galatea of the Spheres", "1952",
     "Oil on canvas", "Dalí Theatre-Museum, Figueres"),
    ("the-disintegration-of-the-persistence-of-memory",
     "The Disintegration of the Persistence of Memory", "1954",
     "Oil on canvas", "Salvador Dalí Museum, St. Petersburg, Florida"),
    ("the-sacrament-of-the-last-supper-1955", "The Sacrament of the Last Supper", "1955",
     "Oil on canvas", "National Gallery of Art, Washington"),
    ("the-temptation-of-st-anthony", "The Temptation of Saint Anthony", "1946",
     "Oil on canvas", "Royal Museums of Fine Arts, Brussels"),
    ("soft-construction-with-boiled-beans-premonition-of-civil-war-1936",
     "Soft Construction with Boiled Beans (Premonition of Civil War)", "1936",
     "Oil on canvas", "Philadelphia Museum of Art"),
    ("the-elephants-large", "The Elephants", "1948",
     "Oil on canvas", "Private collection"),
    ("leda-atomica-1949", "Leda Atomica", "1949",
     "Oil on canvas", "Dalí Theatre-Museum, Figueres"),
    ("the-madonna-of-port-lligat", "The Madonna of Port Lligat", "1950",
     "Oil on canvas", "Minami Group, Tokyo"),
    ("apparition-of-face-and-fruit-dish-on-a-beach",
     "Apparition of Face and Fruit Dish on a Beach", "1938",
     "Oil on canvas", "Wadsworth Atheneum, Hartford"),
    ("the-basket-of-bread", "The Basket of Bread", "1926",
     "Oil on panel", "Dalí Theatre-Museum, Figueres"),
]

# Existing weak/minor entries to prune (matched by title).
PRUNE_TITLES = {
    "The Rainbow",
    "The Anthropomorphic Tower",
    "Untitled (Desert Landscape)",
    "The Spectre of Sex-Appeal",
    "A Chemist Lifting with Extreme Precaution the Cuticle of a Grand Piano",
    "Untitled (Dream of Venus)",
    "Portrait of Luis Buñuel",
}


def _get(url: str) -> bytes:
    req = urllib.request.Request(url, headers={
        "User-Agent": UA,
        "Accept": "*/*",
        "Referer": "https://www.wikiart.org/",
    })
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read()


def extract_image_url(html: str) -> str | None:
    # og:image is the canonical full-res URL
    m = re.search(r'<meta\s+property="og:image"\s+content="([^"]+)"', html)
    if m:
        return m.group(1)
    m = re.search(r'https://uploads[0-9]*\.wikiart\.org/[^"\'\\s]+\.(?:jpg|jpeg|png)!Large\.jpg', html)
    return m.group(0) if m else None


def slugify(s: str) -> str:
    s = re.sub(r"[^\w\s-]", "", s.lower())
    s = re.sub(r"[-\s]+", "-", s).strip("-")
    return s[:60]


def main() -> None:
    FOLDER.mkdir(parents=True, exist_ok=True)
    with open(CATALOG_PATH) as f:
        catalog = json.load(f)

    before = len(catalog["paintings"])

    # Prune weak Dalí entries
    pruned: list[str] = []
    kept: list[dict] = []
    for p in catalog["paintings"]:
        is_dali = "dalí" in p.get("artist", "").lower() or "dali" in p.get("artist", "").lower()
        if is_dali and p.get("title") in PRUNE_TITLES:
            pruned.append(p["title"])
            f = COLLECTION / p.get("file", "")
            if f.exists():
                try:
                    f.unlink()
                except Exception:
                    pass
            continue
        kept.append(p)
    catalog["paintings"] = kept
    print(f"Pruned {len(pruned)} weak Dalí entries: {pruned}")

    existing_titles = {p["title"].lower() for p in catalog["paintings"]}
    existing_files = {p["file"] for p in catalog["paintings"]}

    added = 0
    for slug, title, year, medium, location in ICONIC:
        if title.lower() in existing_titles:
            print(f"  skip (already present): {title}")
            continue

        print(f"→ {title} ({year})")
        try:
            page = _get(f"https://www.wikiart.org/en/salvador-dali/{slug}").decode("utf-8", errors="ignore")
        except Exception as e:
            print(f"   page fetch failed: {e}")
            continue

        img_url = extract_image_url(page)
        if not img_url:
            print(f"   no image URL found")
            continue

        local_name = f"salvador-dali--{slugify(title)}.jpg"
        rel_path = f"surrealism/{local_name}"
        if rel_path in existing_files:
            print(f"   skip (file exists)")
            continue
        local_path = FOLDER / local_name

        try:
            data = _get(img_url)
        except Exception as e:
            print(f"   image fetch failed: {e}")
            continue
        if len(data) < 15_000:
            print(f"   image too small ({len(data)}B), skipping")
            continue
        local_path.write_bytes(data)
        print(f"   saved {local_path.name} ({len(data)//1024}KB)")

        entry = {
            "title": title,
            "artist": "Salvador Dalí",
            "year": year,
            "origin_country": "Spain",
            "movement": "Surrealism",
            "medium": medium,
            "description": "",
            "artist_bio": "",
            "category": "surrealism",
            "tags": ["surrealism", "salvador dalí", "20th century"],
            "file": rel_path,
            "source": "wikiart",
            "source_url": f"https://www.wikiart.org/en/salvador-dali/{slug}",
            "location": location,
            "collected_at": date.today().isoformat(),
        }
        catalog["paintings"].append(entry)
        existing_titles.add(title.lower())
        existing_files.add(rel_path)
        added += 1
        time.sleep(0.8)

    # Refresh stats
    by_cat: dict[str, int] = {}
    by_src: dict[str, int] = {}
    for p in catalog["paintings"]:
        by_cat[p["category"]] = by_cat.get(p["category"], 0) + 1
        by_src[p.get("source", "unknown")] = by_src.get(p.get("source", "unknown"), 0) + 1
    catalog["stats"] = {
        "total": len(catalog["paintings"]),
        "by_category": by_cat,
        "by_source": by_src,
        "last_updated": date.today().isoformat(),
    }

    with open(CATALOG_PATH, "w") as f:
        json.dump(catalog, f, indent=2, ensure_ascii=False)

    after = len(catalog["paintings"])
    print(f"\nCatalog: {before} → {after}  (added {added}, pruned {len(pruned)})")


if __name__ == "__main__":
    main()
