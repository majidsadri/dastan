#!/usr/bin/env python3
"""
Download 500 high-quality public-domain paintings from
The Metropolitan Museum of Art — European Paintings department.

Uses the MET's Open Access API (no key required, CC0 works only):
    https://metmuseum.github.io/

Saves images to:
    paintings-collection/european-paintings/<slug>.jpg
And appends metadata to:
    paintings-collection/catalog.json   (under key "european-paintings")

Run from repo root:
    backend/venv/bin/python3 scripts/fetch-met-paintings.py
"""
from __future__ import annotations

import asyncio
import json
import re
import sys
import unicodedata
from pathlib import Path

import httpx

REPO_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPO_ROOT / "backend"))

COLLECTION_DIR = REPO_ROOT / "paintings-collection"
CATALOG_PATH   = COLLECTION_DIR / "catalog.json"
TARGET_DIR     = COLLECTION_DIR / "european-paintings"
TARGET_SUBDIR  = "european-paintings"   # used as path prefix in catalog["paintings"][].file
CATEGORY       = "european-paintings"

API_BASE = "https://collectionapi.metmuseum.org/public/collection/v1"
# Broaden the source pool. Each dept has its own classification quirks,
# so we sweep several and rely on is_eligible() + dedup to filter.
DEPARTMENTS = [
    (11, "European Paintings"),
    (21, "Modern and Contemporary Art"),
    (1,  "American Decorative Arts"),   # contains American paintings too
    (6,  "Asian Art"),
    (9,  "Drawings and Prints"),        # filters out via classification
]
TARGET_COUNT  = 500

# Politeness — MET API rate-limits aggressively; lower concurrency + retries
CONCURRENCY  = 3
RETRIES      = 4
USER_AGENT   = "DastanArtApp/1.0 (https://mydastan.com; contact@mydastan.com) python-httpx"


def slugify(text: str) -> str:
    text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode("ascii")
    text = re.sub(r"[^\w\s-]", "", text.lower())
    text = re.sub(r"[-\s]+", "-", text).strip("-")
    return text[:80] or "untitled"


async def fetch_object_ids(client: httpx.AsyncClient) -> list[int]:
    """Get candidate object IDs across several departments (with images)."""
    all_ids: list[int] = []
    seen: set[int] = set()
    for dept_id, dept_name in DEPARTMENTS:
        print(f"→ Fetching object IDs from {dept_name} (dept {dept_id})...")
        try:
            r = await client.get(
                f"{API_BASE}/search",
                params={"departmentIds": dept_id, "hasImages": "true", "q": "painting"},
                timeout=60,
            )
            r.raise_for_status()
            ids = r.json().get("objectIDs") or []
        except Exception as e:
            print(f"  ! failed for dept {dept_id}: {e}")
            continue
        fresh = [i for i in ids if i not in seen]
        seen.update(fresh)
        all_ids.extend(fresh)
        print(f"  + {len(fresh)} new ({len(all_ids)} total)")
    print(f"  Got {len(all_ids)} unique candidate IDs across departments.")
    return all_ids


async def fetch_object(client: httpx.AsyncClient, object_id: int) -> dict | None:
    delay = 0.5
    for attempt in range(RETRIES):
        try:
            r = await client.get(f"{API_BASE}/objects/{object_id}", timeout=30)
            if r.status_code == 200:
                return r.json()
            if r.status_code in (429, 502, 503, 504):
                await asyncio.sleep(delay)
                delay *= 2
                continue
            return None
        except (httpx.TimeoutException, httpx.ConnectError, httpx.ReadError):
            await asyncio.sleep(delay)
            delay *= 2
    return None


def is_eligible(obj: dict) -> bool:
    if not obj.get("isPublicDomain"):
        return False
    if not obj.get("primaryImage"):
        return False
    classification = (obj.get("classification") or "").lower()
    if "painting" not in classification:
        return False
    return True


async def download_image(client: httpx.AsyncClient, url: str, out_path: Path) -> bool:
    if out_path.exists() and out_path.stat().st_size > 0:
        return True
    try:
        async with client.stream("GET", url, timeout=120) as r:
            if r.status_code != 200:
                return False
            out_path.parent.mkdir(parents=True, exist_ok=True)
            with out_path.open("wb") as f:
                async for chunk in r.aiter_bytes(64 * 1024):
                    f.write(chunk)
        return True
    except Exception:
        if out_path.exists():
            out_path.unlink(missing_ok=True)
        return False


def derive_movement(obj: dict) -> str:
    """Pick a sensible movement label from MET's loose period/classification fields."""
    period = (obj.get("period") or "").strip()
    if period and period.lower() not in ("paintings",):
        return period
    # Heuristic by century from objectDate
    date = obj.get("objectDate") or ""
    m = re.search(r"(\d{4})", date)
    if m:
        year = int(m.group(1))
        if year < 1500:  return "Medieval"
        if year < 1600:  return "Renaissance"
        if year < 1700:  return "Baroque"
        if year < 1780:  return "Rococo"
        if year < 1850:  return "Neoclassicism / Romanticism"
        if year < 1900:  return "19th-Century European"
        return "Early 20th-Century"
    return "European Painting"


def to_record(obj: dict, image_filename: str) -> dict:
    movement = derive_movement(obj)
    medium   = (obj.get("medium") or "").lower()
    nationality = (obj.get("artistNationality") or "").lower()
    tags: list[str] = []
    if "oil"        in medium:      tags.append("oil")
    if "canvas"     in medium:      tags.append("canvas")
    if "panel"      in medium or "wood" in medium: tags.append("panel")
    if "watercolor" in medium:      tags.append("watercolor")
    if movement:                    tags.append(movement.lower().split(" / ")[0])
    if nationality:                 tags.append(nationality.split(",")[0].strip())
    tags.append("european-paintings")

    return {
        "title":          obj.get("title") or "Untitled",
        "artist":         obj.get("artistDisplayName") or "Unknown",
        "year":           obj.get("objectDate") or "Unknown",
        "origin_country": obj.get("artistNationality") or obj.get("country") or "Unknown",
        "movement":       movement,
        "medium":         obj.get("medium") or "",
        "description":    obj.get("creditLine") or "",
        "artist_bio":     obj.get("artistDisplayBio") or "",
        "category":       CATEGORY,
        "tags":           tags,
        "file":           f"{TARGET_SUBDIR}/{image_filename}",
        "source":         "met",
        "source_id":      str(obj.get("objectID") or ""),
        "source_url":     obj.get("objectURL") or "",
        "license":        "CC0 (public domain)",
    }


async def main() -> None:
    TARGET_DIR.mkdir(parents=True, exist_ok=True)

    catalog: dict = {}
    if CATALOG_PATH.exists():
        catalog = json.loads(CATALOG_PATH.read_text())
    paintings: list = catalog.get("paintings", [])

    # ── One-shot migration: any "european-paintings" bucket entries from
    #    the first run get promoted into "paintings" with the right schema.
    legacy = catalog.get("european-paintings", [])
    if legacy:
        print(f"→ Migrating {len(legacy)} entries from legacy bucket → paintings ...")
        existing_files = {p.get("file") for p in paintings}
        migrated = 0
        for r in legacy:
            fname = r.get("image_filename")
            if not fname:
                continue
            new_file = f"{TARGET_SUBDIR}/{fname}"
            if new_file in existing_files:
                continue
            promoted = {
                "title":          r.get("title") or "Untitled",
                "artist":         r.get("artist") or "Unknown",
                "year":           r.get("year") or "Unknown",
                "origin_country": r.get("origin_country") or "Unknown",
                "movement":       r.get("movement") if r.get("movement") and r.get("movement").lower() != "paintings" else "European Painting",
                "medium":         r.get("medium") or "",
                "description":    r.get("description") or "",
                "artist_bio":     r.get("artist_bio") or "",
                "category":       CATEGORY,
                "tags":           ["european-paintings"],
                "file":           new_file,
                "source":         "met",
                "source_id":      str(r.get("met_object_id") or ""),
                "source_url":     r.get("source_url") or "",
                "license":        "CC0 (public domain)",
            }
            paintings.append(promoted)
            existing_files.add(new_file)
            migrated += 1
        print(f"  migrated {migrated} entries.")

    existing_ids = {
        str(r.get("source_id")) for r in paintings
        if r.get("source") == "met" and r.get("source_id")
    }
    print(f"→ Catalog now has {len(paintings)} paintings ({len(existing_ids)} MET IDs).")

    headers = {"User-Agent": USER_AGENT}
    limits  = httpx.Limits(max_connections=CONCURRENCY, max_keepalive_connections=CONCURRENCY)

    async with httpx.AsyncClient(headers=headers, limits=limits) as client:
        all_ids = await fetch_object_ids(client)
        # Skip ones we already have (existing_ids are strs; MET returns ints)
        candidate_ids = [i for i in all_ids if str(i) not in existing_ids]
        print(f"→ {len(candidate_ids)} new candidates after dedup.")

        sem = asyncio.Semaphore(CONCURRENCY)
        added: list[dict] = []
        seen_titles: set[str] = {(r.get("title") or "").lower() for r in paintings}

        async def process(object_id: int) -> None:
            nonlocal added
            if len(added) >= TARGET_COUNT:
                return
            async with sem:
                obj = await fetch_object(client, object_id)
                if not obj or not is_eligible(obj):
                    return
                title = (obj.get("title") or "").lower()
                if title in seen_titles:
                    return
                slug = slugify(f"{obj.get('artistDisplayName') or 'unknown'}-{obj.get('title') or 'untitled'}")
                filename = f"{slug}-{object_id}.jpg"
                out_path = TARGET_DIR / filename
                ok = await download_image(client, obj["primaryImage"], out_path)
                if not ok:
                    return
                if len(added) >= TARGET_COUNT:
                    out_path.unlink(missing_ok=True)
                    return
                seen_titles.add(title)
                record = to_record(obj, filename)
                added.append(record)
                if len(added) % 25 == 0:
                    print(f"  ✓ {len(added)}/{TARGET_COUNT} — {obj.get('title')[:60]}", flush=True)

        # Process in waves so we can stop early once we hit TARGET_COUNT
        batch = 30
        for i in range(0, len(candidate_ids), batch):
            if len(added) >= TARGET_COUNT:
                break
            await asyncio.gather(*(process(oid) for oid in candidate_ids[i:i + batch]))

        print(f"→ Downloaded {len(added)} new paintings.")
        catalog["paintings"] = paintings + added
        # Drop the legacy bucket — everything lives under "paintings" now
        catalog.pop("european-paintings", None)
        CATALOG_PATH.write_text(json.dumps(catalog, indent=2, ensure_ascii=False))
        print(f"→ Catalog updated: {CATALOG_PATH}")
        print(f"→ Total paintings in catalog: {len(catalog['paintings'])}")
        print(f"→ Images saved to: {TARGET_DIR}")
        print()
        print("Tip: run scripts/optimize-paintings.sh paintings-collection/european-paintings")
        print("     to resize to 1600px and compress for web delivery.")


if __name__ == "__main__":
    asyncio.run(main())
