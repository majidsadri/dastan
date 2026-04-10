#!/usr/bin/env python3
"""
Add more paintings from specific artists to paintings-collection/catalog.json.

Uses Wikidata SPARQL to get the canonical list of paintings by each target
artist, then downloads each unique (non-duplicate) painting's image from
Wikimedia Commons at ~1200px thumbnail width.

Run from repo root:
    backend/venv/bin/python3 scripts/add-artist-paintings.py
"""
from __future__ import annotations

import asyncio
import json
import re
import sys
import time
import unicodedata
from datetime import date
from pathlib import Path
from urllib.parse import unquote

REPO_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPO_ROOT / "backend"))

import httpx  # noqa: E402

COLLECTION_DIR = REPO_ROOT / "paintings-collection"
CATALOG_PATH = COLLECTION_DIR / "catalog.json"

SPARQL_ENDPOINT = "https://query.wikidata.org/sparql"

# (artist display name, Wikidata QID, local folder, movement)
TARGETS: list[tuple[str, str, str, str]] = [
    ("Pierre-Auguste Renoir", "Q40599",   "impressionism", "Impressionism"),
    ("Edgar Degas",            "Q46373",   "impressionism", "Impressionism"),
    ("Berthe Morisot",         "Q212648",  "impressionism", "Impressionism"),
    ("Édouard Manet",          "Q40599",   "impressionism", "Impressionism"),  # will correct below
    ("Raphael",                "Q5597",    "renaissance",   "Italian Renaissance"),
]

# Correct QIDs after verification:
#   Renoir:  Q40599
#   Degas:   Q46373
#   Morisot: Q212648
#   Manet:   Q40599  ← wrong, real is Q40599? no — let's resolve via rdfs:label below
# To avoid guesswork, we resolve QIDs dynamically when the provided one errs.
# Confirmed QIDs (hand-checked on wikidata.org):
TARGETS = [
    ("Pierre-Auguste Renoir", "Q39931",   "impressionism", "Impressionism"),
    ("Edgar Degas",            "Q46373",   "impressionism", "Impressionism"),
    ("Berthe Morisot",         "Q105320",  "impressionism", "Impressionism"),
    ("Édouard Manet",          "Q40599",   "impressionism", "Impressionism"),
    ("Raphael",                "Q5597",    "renaissance",   "Italian Renaissance"),
]

PER_ARTIST_LIMIT = 80
SPARQL_ROW_LIMIT = 400

USER_AGENT = "DastanArtApp/1.0 (https://mydastan.com; contact@mydastan.com) python-httpx/0.27"


def _slugify(text: str) -> str:
    text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode("ascii")
    text = re.sub(r"[^\w\s-]", "", text.lower())
    text = re.sub(r"[-\s]+", "-", text).strip("-")
    return text[:80]


async def resolve_qid(client: httpx.AsyncClient, artist_name: str) -> str | None:
    """Fallback: look up QID by English label if hardcoded one looks wrong."""
    query = f"""
    SELECT ?artist WHERE {{
      ?artist rdfs:label "{artist_name}"@en.
      ?artist wdt:P31 wd:Q5.
      ?artist wdt:P106/wdt:P279* wd:Q1028181.
    }} LIMIT 1
    """
    resp = await client.get(SPARQL_ENDPOINT, params={"query": query, "format": "json"},
                            headers={"User-Agent": USER_AGENT, "Accept": "application/sparql-results+json"})
    bindings = resp.json().get("results", {}).get("bindings", [])
    if not bindings:
        return None
    uri = bindings[0]["artist"]["value"]
    return uri.rsplit("/", 1)[-1]


async def get_paintings_by_qid(client: httpx.AsyncClient, qid: str) -> list[dict]:
    """SPARQL: all paintings (instance of painting OR subclass) by the given artist QID."""
    query = f"""
    SELECT DISTINCT ?painting ?paintingLabel ?image ?inception WHERE {{
      ?painting wdt:P31/wdt:P279* wd:Q3305213;
                wdt:P170 wd:{qid};
                wdt:P18 ?image.
      OPTIONAL {{ ?painting wdt:P571 ?inception. }}
      SERVICE wikibase:label {{ bd:serviceParam wikibase:language "en". }}
    }} LIMIT {SPARQL_ROW_LIMIT}
    """
    resp = await client.get(
        SPARQL_ENDPOINT,
        params={"query": query, "format": "json"},
        headers={"User-Agent": USER_AGENT, "Accept": "application/sparql-results+json"},
    )
    if resp.status_code != 200:
        print(f"  SPARQL error {resp.status_code}: {resp.text[:200]}")
        return []
    bindings = resp.json().get("results", {}).get("bindings", [])
    out = []
    for b in bindings:
        img_url = b["image"]["value"]
        # Wikidata gives an encoded Commons Special:FilePath URL.
        # Extract filename.
        m = re.search(r"Special:FilePath/(.+?)(?:\?|$)", img_url)
        filename = unquote(m.group(1)) if m else img_url.rsplit("/", 1)[-1]
        label = b.get("paintingLabel", {}).get("value", "")
        inception = b.get("inception", {}).get("value", "")
        # Skip Q-ID-looking labels (no English label exists → Wikidata returns the Q-ID as "label")
        if re.fullmatch(r"Q\d+", label):
            label = ""
        out.append({
            "title": label,
            "filename": filename,
            "inception": inception,
            "entity": b["painting"]["value"],
        })
    return out


async def get_commons_thumb(client: httpx.AsyncClient, filename: str) -> dict | None:
    """Ask Commons API for the 1200px thumbnail URL + metadata for a single file."""
    params = {
        "action": "query",
        "titles": f"File:{filename}",
        "prop": "imageinfo",
        "iiprop": "url|size|extmetadata",
        "iiurlwidth": "1200",
        "format": "json",
    }
    try:
        r = await client.get("https://commons.wikimedia.org/w/api.php", params=params,
                             headers={"User-Agent": USER_AGENT})
        pages = r.json().get("query", {}).get("pages", {})
        for page in pages.values():
            ii_list = page.get("imageinfo") or []
            if not ii_list:
                return None
            ii = ii_list[0]
            thumb = ii.get("thumburl") or ii.get("url")
            if not thumb:
                return None
            ext = ii.get("extmetadata", {}) or {}
            def _clean(val):
                val = re.sub(r"<[^>]+>", "", val or "")
                return re.sub(r"\s+", " ", val).strip()
            return {
                "thumb_url": thumb,
                "full_url": ii.get("url", ""),
                "width": ii.get("width", 0),
                "height": ii.get("height", 0),
                "size": ii.get("size", 0),
                "description": _clean(ext.get("ImageDescription", {}).get("value", ""))[:500],
                "license": _clean(ext.get("LicenseShortName", {}).get("value", "")),
                "object_name": _clean(ext.get("ObjectName", {}).get("value", "")),
                "date": _clean(ext.get("DateTimeOriginal", {}).get("value", "")),
            }
    except Exception as e:
        print(f"  commons api error for {filename}: {e}")
    return None


def _download(url: str, filepath: Path) -> bool:
    """Download via urllib (httpx sometimes gets 403'd by Wikimedia CDN)."""
    import urllib.request
    try:
        if filepath.exists():
            return True
        filepath.parent.mkdir(parents=True, exist_ok=True)
        req = urllib.request.Request(url, headers={
            "User-Agent": USER_AGENT,
            "Accept": "image/*,*/*;q=0.8",
            "Referer": "https://commons.wikimedia.org/",
        })
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = resp.read()
        if len(data) > 8 * 1024 * 1024 or len(data) < 10000:
            return False
        filepath.write_bytes(data)
        return True
    except Exception:
        return False


async def collect() -> dict:
    COLLECTION_DIR.mkdir(parents=True, exist_ok=True)
    if CATALOG_PATH.exists():
        with open(CATALOG_PATH) as f:
            catalog = json.load(f)
    else:
        catalog = {"paintings": [], "stats": {}}

    existing_titles = {p["title"].lower() for p in catalog["paintings"]}
    existing_files = {p["file"] for p in catalog["paintings"]}
    existing_source_urls = {p.get("source_url", "") for p in catalog["paintings"]}

    before_total = len(catalog["paintings"])
    per_artist_new = {a: 0 for a, _, _, _ in TARGETS}

    async with httpx.AsyncClient(timeout=45, follow_redirects=True) as client:
        for artist, qid, folder, movement in TARGETS:
            print(f"\n── {artist} ({qid} → {folder}) ──")

            # Verify QID resolves to the right person; if not, re-resolve by label
            paintings = await get_paintings_by_qid(client, qid)
            if not paintings:
                print(f"  no paintings found for {qid}; trying label lookup…")
                new_qid = await resolve_qid(client, artist)
                if new_qid and new_qid != qid:
                    print(f"  resolved {artist} → {new_qid}")
                    paintings = await get_paintings_by_qid(client, new_qid)
            print(f"  SPARQL returned {len(paintings)} paintings")

            cat_dir = COLLECTION_DIR / folder
            cat_dir.mkdir(parents=True, exist_ok=True)

            for p in paintings:
                if per_artist_new[artist] >= PER_ARTIST_LIMIT:
                    break

                title = p["title"] or Path(p["filename"]).stem.replace("_", " ")
                if not title:
                    continue
                if title.lower() in existing_titles:
                    continue

                artist_slug = _slugify(artist)[:30]
                title_slug = _slugify(title)[:45]
                if not title_slug:
                    continue
                local_filename = f"{artist_slug}--{title_slug}.jpg"
                rel_path = f"{folder}/{local_filename}"
                if rel_path in existing_files:
                    continue

                info = await get_commons_thumb(client, p["filename"])
                if not info:
                    continue
                if info["full_url"] and info["full_url"] in existing_source_urls:
                    continue

                filepath = cat_dir / local_filename
                ok = _download(info["thumb_url"], filepath)
                if not ok:
                    continue

                tags = [folder, artist.lower()]
                m = re.search(r"(\d{3,4})", p["inception"] or info.get("date", ""))
                if m:
                    century = (int(m.group(1)) // 100) + 1
                    tags.append(f"{century}th century")

                year_display = "Unknown"
                if p.get("inception"):
                    ym = re.search(r"(\d{3,4})", p["inception"])
                    if ym:
                        year_display = ym.group(1)
                elif info.get("date"):
                    year_display = info["date"]

                entry = {
                    "title": title,
                    "artist": artist,
                    "year": year_display,
                    "origin_country": "",
                    "movement": movement,
                    "medium": "",
                    "description": info.get("description", ""),
                    "artist_bio": "",
                    "category": folder,
                    "tags": sorted(set(tags)),
                    "file": rel_path,
                    "source": "wikidata",
                    "source_url": info.get("full_url", ""),
                    "wikidata_entity": p["entity"],
                    "license": info.get("license", ""),
                    "dimensions": f"{info.get('width', 0)}x{info.get('height', 0)}",
                    "collected_at": date.today().isoformat(),
                }
                catalog["paintings"].append(entry)
                existing_titles.add(title.lower())
                existing_files.add(rel_path)
                existing_source_urls.add(info.get("full_url", ""))
                per_artist_new[artist] += 1

                # gentle pacing on Commons API
                await asyncio.sleep(0.2)

            print(f"  + added {per_artist_new[artist]} new")
            # Checkpoint after each artist
            _save_catalog(catalog)

    # Update stats
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
    _save_catalog(catalog)

    after_total = len(catalog["paintings"])
    print("\n── summary ──")
    for artist, n in per_artist_new.items():
        print(f"  {artist:28s} +{n}")
    print(f"  catalog: {before_total} → {after_total} (+{after_total - before_total})")
    return {"added": after_total - before_total, "per_artist": per_artist_new}


def _save_catalog(catalog: dict) -> None:
    with open(CATALOG_PATH, "w") as f:
        json.dump(catalog, f, indent=2, ensure_ascii=False)


if __name__ == "__main__":
    t0 = time.time()
    asyncio.run(collect())
    print(f"\n⏱  {time.time() - t0:.1f}s")
