#!/usr/bin/env python3
"""
Fetch paintings by target artists from Wikidata + Wikimedia Commons.

Much faster than the MET API because:
  1. One SPARQL query returns every painting by a given artist with image + year.
  2. Wikimedia Commons serves images directly, no per-object metadata round-trip.

Saves images to:    paintings-collection/european-paintings/<slug>.jpg
Appends metadata to: paintings-collection/catalog.json  (catalog["paintings"])

Run from repo root:
    backend/venv/bin/python3 scripts/fetch-wikidata-paintings.py
"""
from __future__ import annotations

import asyncio
import json
import re
import sys
import unicodedata
from pathlib import Path

import httpx

REPO_ROOT      = Path(__file__).resolve().parents[1]
COLLECTION_DIR = REPO_ROOT / "paintings-collection"
CATALOG_PATH   = COLLECTION_DIR / "catalog.json"
TARGET_DIR     = COLLECTION_DIR / "european-paintings"
TARGET_SUBDIR  = "european-paintings"
CATEGORY       = "european-paintings"

SPARQL_ENDPOINT = "https://query.wikidata.org/sparql"
COMMONS_BASE    = "https://commons.wikimedia.org/wiki/Special:FilePath"
USER_AGENT      = "DastanArtApp/1.0 (https://mydastan.com; contact@mydastan.com) python-httpx"

CONCURRENCY = 4
IMG_WIDTH   = 1600   # request resized from Commons (still high quality)

# (qid, display_name, nationality, default_movement)
ARTISTS = [
    ("Q41264",  "Johannes Vermeer",   "Dutch",   "Dutch Golden Age / Baroque"),
    ("Q5669",   "Sandro Botticelli",  "Italian", "Early Renaissance"),
    ("Q5597",   "Raphael",            "Italian", "High Renaissance"),
    ("Q762",    "Leonardo da Vinci",  "Italian", "High Renaissance"),
    ("Q151803", "Piet Mondrian",      "Dutch",   "De Stijl / Modernism"),
    ("Q44007",  "Paul Klee",          "Swiss-German", "Modernism / Bauhaus"),
]


def slugify(text: str) -> str:
    text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode("ascii")
    text = re.sub(r"[^\w\s-]", "", text.lower())
    text = re.sub(r"[-\s]+", "-", text).strip("-")
    return text[:80] or "untitled"


def extract_year(raw: str | None) -> str:
    """Wikidata dates look like '1665-01-01T00:00:00Z'. Return just the year, honoring BCE."""
    if not raw:
        return "Unknown"
    m = re.match(r"^(-?)(\d+)", raw)
    if not m:
        return "Unknown"
    sign, year = m.group(1), m.group(2).lstrip("0") or "0"
    return f"{year} BCE" if sign == "-" else year


async def sparql_for_artist(client: httpx.AsyncClient, qid: str, name: str) -> list[dict]:
    query = f"""
    SELECT DISTINCT ?painting ?paintingLabel ?image ?inception ?materialLabel ?genreLabel ?inv
    WHERE {{
      ?painting wdt:P31/wdt:P279* wd:Q3305213 ;  # instance of (subclass of) painting
                wdt:P170 wd:{qid} ;
                wdt:P18  ?image .
      OPTIONAL {{ ?painting wdt:P571 ?inception. }}
      OPTIONAL {{ ?painting wdt:P186 ?material. }}
      OPTIONAL {{ ?painting wdt:P136 ?genre. }}
      OPTIONAL {{ ?painting wdt:P217 ?inv. }}
      SERVICE wikibase:label {{ bd:serviceParam wikibase:language "en". }}
    }}
    """
    r = await client.get(
        SPARQL_ENDPOINT,
        params={"query": query, "format": "json"},
        headers={"Accept": "application/sparql-results+json"},
        timeout=60,
    )
    r.raise_for_status()
    bindings = r.json()["results"]["bindings"]
    out = []
    seen_qids: set[str] = set()
    for b in bindings:
        pid = b["painting"]["value"].rsplit("/", 1)[-1]
        if pid in seen_qids:
            continue
        seen_qids.add(pid)
        out.append({
            "qid":       pid,
            "title":     b.get("paintingLabel", {}).get("value") or "Untitled",
            "image_url": b["image"]["value"],
            "year":      extract_year(b.get("inception", {}).get("value")),
            "material":  b.get("materialLabel", {}).get("value") or "",
            "genre":     b.get("genreLabel", {}).get("value") or "",
            "inv":       b.get("inv", {}).get("value") or "",
        })
    print(f"  [{name}] Wikidata returned {len(out)} paintings.")
    return out


def commons_filename_from_url(image_url: str) -> str:
    """Wikidata P18 gives Commons URLs like
       http://commons.wikimedia.org/wiki/Special:FilePath/Johannes%20Vermeer%20...jpg
       We want just the filename portion (still percent-encoded)."""
    m = re.search(r"FilePath/([^?]+)", image_url)
    if m:
        return m.group(1)
    return image_url.rsplit("/", 1)[-1]


async def download_image(client: httpx.AsyncClient, image_url: str, out_path: Path) -> bool:
    if out_path.exists() and out_path.stat().st_size > 1024:
        return True
    filename = commons_filename_from_url(image_url)
    # Request resized rendering so we don't pull 30 MB originals
    url = f"{COMMONS_BASE}/{filename}?width={IMG_WIDTH}"
    delay = 0.6
    for attempt in range(4):
        try:
            async with client.stream("GET", url, timeout=90, follow_redirects=True) as r:
                if r.status_code == 200:
                    ctype = r.headers.get("content-type", "")
                    if not ctype.startswith("image/"):
                        return False
                    out_path.parent.mkdir(parents=True, exist_ok=True)
                    with out_path.open("wb") as f:
                        async for chunk in r.aiter_bytes(64 * 1024):
                            f.write(chunk)
                    if out_path.stat().st_size < 4096:
                        out_path.unlink(missing_ok=True)
                        return False
                    return True
                if r.status_code in (429, 502, 503, 504):
                    await asyncio.sleep(delay); delay *= 2
                    continue
                return False
        except (httpx.TimeoutException, httpx.ConnectError, httpx.ReadError):
            await asyncio.sleep(delay); delay *= 2
    return False


def derive_movement(year_str: str, default: str) -> str:
    m = re.search(r"(\d{3,4})", year_str)
    if not m:
        return default
    y = int(m.group(1))
    if y < 1500: return "Early Renaissance"
    if y < 1600: return "High Renaissance"
    if y < 1700: return "Baroque"
    if y < 1780: return "Rococo"
    if y < 1850: return "Neoclassicism / Romanticism"
    if y < 1900: return "19th-Century European"
    return default


def to_record(painting: dict, artist_name: str, nationality: str,
              default_movement: str, image_filename: str) -> dict:
    movement = derive_movement(painting["year"], default_movement)
    material = (painting.get("material") or "").lower()
    tags = []
    if "oil"        in material: tags.append("oil")
    if "canvas"     in material: tags.append("canvas")
    if "panel"      in material or "wood" in material: tags.append("panel")
    if "tempera"    in material: tags.append("tempera")
    if "watercolor" in material: tags.append("watercolor")
    if painting.get("genre"):    tags.append(painting["genre"].lower())
    if movement:                 tags.append(movement.lower().split(" / ")[0])
    tags.append(artist_name.lower().split(" ")[-1])
    tags.append(CATEGORY)

    return {
        "title":          painting["title"],
        "artist":         artist_name,
        "year":           painting["year"],
        "origin_country": nationality,
        "movement":       movement,
        "medium":         painting.get("material") or "",
        "description":    f"Wikidata {painting['qid']}" + (f" · Inv. {painting['inv']}" if painting.get('inv') else ""),
        "artist_bio":     "",
        "category":       CATEGORY,
        "tags":           tags,
        "file":           f"{TARGET_SUBDIR}/{image_filename}",
        "source":         "wikidata",
        "source_id":      painting["qid"],
        "source_url":     f"https://www.wikidata.org/wiki/{painting['qid']}",
        "license":        "Public domain (via Wikimedia Commons)",
    }


async def main() -> None:
    TARGET_DIR.mkdir(parents=True, exist_ok=True)

    catalog: dict = json.loads(CATALOG_PATH.read_text()) if CATALOG_PATH.exists() else {}
    paintings: list = catalog.get("paintings", [])

    # Dedup keys
    existing_qids = {r.get("source_id") for r in paintings
                     if r.get("source") == "wikidata" and r.get("source_id")}
    existing_titles_by_artist: dict[str, set[str]] = {}
    for r in paintings:
        a = (r.get("artist") or "").lower().strip()
        t = (r.get("title")  or "").lower().strip()
        existing_titles_by_artist.setdefault(a, set()).add(t)
    existing_files = {r.get("file") for r in paintings}

    print(f"→ Catalog starts with {len(paintings)} paintings.")
    for q, name, _nat, _mov in ARTISTS:
        a = name.lower().strip()
        print(f"   · {name}: {len(existing_titles_by_artist.get(a, set()))} already in catalog.")

    headers = {"User-Agent": USER_AGENT}
    limits  = httpx.Limits(max_connections=CONCURRENCY, max_keepalive_connections=CONCURRENCY)

    async with httpx.AsyncClient(headers=headers, limits=limits) as client:
        all_candidates: list[tuple[dict, str, str, str]] = []
        for qid, name, nat, mov in ARTISTS:
            try:
                rows = await sparql_for_artist(client, qid, name)
            except Exception as e:
                print(f"  ! SPARQL failed for {name}: {e}")
                continue
            for row in rows:
                if row["qid"] in existing_qids:
                    continue
                seen = existing_titles_by_artist.get(name.lower().strip(), set())
                if row["title"].lower().strip() in seen:
                    continue
                all_candidates.append((row, name, nat, mov))

        print(f"→ {len(all_candidates)} new paintings to try.")

        sem  = asyncio.Semaphore(CONCURRENCY)
        added: list[dict] = []

        async def process(row: dict, artist_name: str, nat: str, mov: str) -> None:
            async with sem:
                slug = slugify(f"{artist_name}-{row['title']}")
                filename = f"{slug}-{row['qid']}.jpg"
                if f"{TARGET_SUBDIR}/{filename}" in existing_files:
                    return
                out_path = TARGET_DIR / filename
                ok = await download_image(client, row["image_url"], out_path)
                if not ok:
                    return
                record = to_record(row, artist_name, nat, mov, filename)
                added.append(record)
                if len(added) % 10 == 0:
                    print(f"  ✓ {len(added)} — {artist_name}: {row['title'][:60]}", flush=True)

        await asyncio.gather(*(process(r, n, na, m) for (r, n, na, m) in all_candidates))

        print(f"→ Downloaded {len(added)} new paintings.")
        by_artist: dict[str, int] = {}
        for r in added:
            by_artist[r["artist"]] = by_artist.get(r["artist"], 0) + 1
        for a, c in sorted(by_artist.items(), key=lambda x: -x[1]):
            print(f"     {a}: +{c}")

        catalog["paintings"] = paintings + added
        CATALOG_PATH.write_text(json.dumps(catalog, indent=2, ensure_ascii=False))
        print(f"→ Catalog updated: {CATALOG_PATH}")
        print(f"→ Total paintings in catalog: {len(catalog['paintings'])}")


if __name__ == "__main__":
    asyncio.run(main())
