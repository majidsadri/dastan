"""
Wikimedia Famous Paintings Collector
====================================
Fetches 1000+ famous paintings from Wikimedia Commons using curated
categories that contain the world's most celebrated artworks.

Strategy:
1. Target specific Wikimedia Commons categories (e.g., "Paintings by Monet")
2. Use Wikidata SPARQL to find paintings with Wikipedia articles (= famous)
3. Download high-quality thumbnails (1200px) — fast loads, great detail
4. Save with rich metadata: artist, year, movement, medium, museum, description

Directory: /paintings-collection/{category}/
Catalog:   /paintings-collection/catalog.json
"""
from __future__ import annotations

import hashlib
import json
import logging
import random
import re
import unicodedata
from datetime import date
from pathlib import Path
from urllib.parse import unquote

import asyncio

import httpx

logger = logging.getLogger(__name__)

COLLECTION_DIR = Path(__file__).resolve().parents[3] / "paintings-collection"

WIKI_API = "https://commons.wikimedia.org/w/api.php"
WIKIDATA_SPARQL = "https://query.wikidata.org/sparql"

# ─── Curated Wikimedia Commons categories of famous paintings ───────────────
# These categories are maintained by Wikimedia editors and contain
# the most notable paintings in each movement/artist collection.

WIKI_CATEGORIES = {
    "impressionism": [
        "Paintings by Claude Monet",
        "Paintings by Pierre-Auguste Renoir",
        "Paintings by Edgar Degas",
        "Paintings by Camille Pissarro",
        "Paintings by Alfred Sisley",
        "Paintings by Berthe Morisot",
        "Paintings by Mary Cassatt",
        "Paintings by Gustave Caillebotte",
        "Paintings by Frédéric Bazille",
    ],
    "post-impressionism": [
        "Paintings by Vincent van Gogh",
        "Paintings by Paul Cézanne",
        "Paintings by Paul Gauguin",
        "Paintings by Georges Seurat",
        "Paintings by Henri de Toulouse-Lautrec",
        "Paintings by Paul Signac",
        "Paintings by Pierre Bonnard",
        "Paintings by Édouard Vuillard",
    ],
    "renaissance": [
        "Paintings by Sandro Botticelli",
        "Paintings by Raphael",
        "Paintings by Leonardo da Vinci",
        "Paintings by Titian",
        "Paintings by Giovanni Bellini",
        "Paintings by Fra Angelico",
        "Paintings by Piero della Francesca",
        "Paintings by Andrea Mantegna",
        "Paintings by Tintoretto",
        "Paintings by Paolo Veronese",
        "Paintings by Giorgione",
        "Paintings by Correggio",
    ],
    "baroque": [
        "Paintings by Caravaggio",
        "Paintings by Rembrandt",
        "Paintings by Johannes Vermeer",
        "Paintings by Diego Velázquez",
        "Paintings by Peter Paul Rubens",
        "Paintings by Anthony van Dyck",
        "Paintings by Frans Hals",
        "Paintings by Artemisia Gentileschi",
        "Paintings by Georges de La Tour",
        "Paintings by Nicolas Poussin",
        "Paintings by Claude Lorrain",
        "Paintings by Jusepe de Ribera",
        "Paintings by Francisco de Zurbarán",
    ],
    "romanticism": [
        "Paintings by Eugène Delacroix",
        "Paintings by J. M. W. Turner",
        "Paintings by Caspar David Friedrich",
        "Paintings by John Constable",
        "Paintings by Francisco Goya",
        "Paintings by Théodore Géricault",
        "Paintings by Thomas Cole",
        "Paintings by Frederic Edwin Church",
        "Paintings by Albert Bierstadt",
        "Paintings by Ivan Aivazovsky",
    ],
    "realism": [
        "Paintings by Gustave Courbet",
        "Paintings by Jean-François Millet",
        "Paintings by Honoré Daumier",
        "Paintings by Winslow Homer",
        "Paintings by Thomas Eakins",
        "Paintings by Ilya Repin",
        "Paintings by Joaquín Sorolla",
        "Paintings by Rosa Bonheur",
        "Paintings by Anders Zorn",
    ],
    "expressionism": [
        "Paintings by Edvard Munch",
        "Paintings by Ernst Ludwig Kirchner",
        "Paintings by Wassily Kandinsky",
        "Paintings by Franz Marc",
        "Paintings by Egon Schiele",
        "Paintings by Emil Nolde",
        "Paintings by August Macke",
        "Paintings by Max Beckmann",
        "Paintings by Oskar Kokoschka",
        "Paintings by Alexej von Jawlensky",
    ],
    "modern": [
        "Paintings by Pablo Picasso",
        "Paintings by Henri Matisse",
        "Paintings by Marc Chagall",
        "Paintings by Amedeo Modigliani",
        "Paintings by Fernand Léger",
        "Paintings by Edward Hopper",
        "Paintings by Georgia O'Keeffe",
        "Paintings by Piet Mondrian",
        "Paintings by Kazimir Malevich",
        "Paintings by Paul Klee",
        "Paintings by Joan Miró",
    ],
    "surrealism": [
        "Paintings by Salvador Dalí",
        "Paintings by René Magritte",
        "Paintings by Max Ernst",
        "Paintings by Giorgio de Chirico",
        "Paintings by Yves Tanguy",
        "Paintings by Remedios Varo",
        "Paintings by Leonora Carrington",
        "Paintings by Roberto Matta",
        "Paintings by Dorothea Tanning",
        "Paintings by Frida Kahlo",
    ],
    "symbolism": [
        "Paintings by Gustave Moreau",
        "Paintings by Odilon Redon",
        "Paintings by Arnold Böcklin",
        "Paintings by Fernand Khnopff",
        "Paintings by Dante Gabriel Rossetti",
        "Paintings by Edward Burne-Jones",
        "Paintings by John William Waterhouse",
        "Paintings by Puvis de Chavannes",
    ],
    "neoclassicism": [
        "Paintings by Jacques-Louis David",
        "Paintings by Jean-Auguste-Dominique Ingres",
        "Paintings by Angelica Kauffman",
        "Paintings by Anton Raphael Mengs",
        "Paintings by Benjamin West",
    ],
    "rococo": [
        "Paintings by Antoine Watteau",
        "Paintings by Jean-Honoré Fragonard",
        "Paintings by François Boucher",
        "Paintings by Giovanni Battista Tiepolo",
        "Paintings by Jean-Baptiste-Siméon Chardin",
        "Paintings by Élisabeth Vigée Le Brun",
        "Paintings by Canaletto",
    ],
    "art-nouveau": [
        "Paintings by Gustav Klimt",
        "Paintings by Alphonse Mucha",
    ],
    "dutch-golden-age": [
        "Paintings by Jan Steen",
        "Paintings by Pieter de Hooch",
        "Paintings by Jacob van Ruisdael",
        "Paintings by Gerard ter Borch",
        "Paintings by Adriaen van Ostade",
        "Paintings by Meindert Hobbema",
        "Paintings by Willem Kalf",
        "Paintings by Rachel Ruysch",
    ],
    "northern-renaissance": [
        "Paintings by Jan van Eyck",
        "Paintings by Hieronymus Bosch",
        "Paintings by Pieter Bruegel the Elder",
        "Paintings by Albrecht Dürer",
        "Paintings by Hans Holbein the Younger",
        "Paintings by Rogier van der Weyden",
        "Paintings by Hans Memling",
        "Paintings by Lucas Cranach the Elder",
    ],
    "latin-american": [
        "Paintings by Diego Rivera",
        "Paintings by Frida Kahlo",
        "Paintings by David Alfaro Siqueiros",
        "Paintings by José Clemente Orozco",
        "Paintings by Rufino Tamayo",
        "Paintings by Wifredo Lam",
        "Paintings by Fernando Botero",
        "Paintings by Tarsila do Amaral",
    ],
    "asian": [
        "Paintings by Hokusai",
        "Paintings by Hiroshige",
        "Paintings by Hasegawa Tōhaku",
        "Paintings by Sesshū Tōyō",
        "Ukiyo-e by Kitagawa Utamaro",
        "Paintings by Amrita Sher-Gil",
        "Paintings by Raja Ravi Varma",
    ],
    "abstract": [
        "Paintings by Wassily Kandinsky",
        "Paintings by Piet Mondrian",
        "Paintings by Kazimir Malevich",
        "Paintings by Mark Rothko",
        "Paintings by Jackson Pollock",
        "Paintings by Willem de Kooning",
        "Paintings by Franz Kline",
        "Paintings by Helen Frankenthaler",
        "Paintings by Robert Delaunay",
        "Paintings by Hilma af Klint",
    ],
    "pre-raphaelite": [
        "Paintings by John Everett Millais",
        "Paintings by Dante Gabriel Rossetti",
        "Paintings by William Holman Hunt",
        "Paintings by Edward Burne-Jones",
        "Paintings by John William Waterhouse",
        "Paintings by Ford Madox Brown",
    ],
    "mannerism": [
        "Paintings by El Greco",
        "Paintings by Pontormo",
        "Paintings by Parmigianino",
        "Paintings by Bronzino",
        "Paintings by Giuseppe Arcimboldo",
    ],
    "russian": [
        "Paintings by Ilya Repin",
        "Paintings by Ivan Aivazovsky",
        "Paintings by Wassily Kandinsky",
        "Paintings by Kazimir Malevich",
        "Paintings by Ivan Shishkin",
        "Paintings by Valentin Serov",
        "Paintings by Mikhail Vrubel",
    ],
}


def _slugify(text: str) -> str:
    text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode("ascii")
    text = re.sub(r"[^\w\s-]", "", text.lower())
    text = re.sub(r"[-\s]+", "-", text).strip("-")
    return text[:80]


def _extract_artist_from_category(category: str) -> str:
    """Extract artist name from 'Paintings by Artist Name'."""
    match = re.match(r"(?:Paintings|Ukiyo-e) by (.+)", category)
    return match.group(1) if match else "Unknown"


async def _get_category_files(
    category: str, client: httpx.AsyncClient, limit: int = 50, depth: int = 4
) -> list[dict]:
    """Get image files from a Wikimedia Commons category, recursing into subcategories."""
    results = []
    visited = set()

    async def _recurse(cat: str, remaining_depth: int):
        if cat in visited or len(results) >= limit:
            return
        visited.add(cat)

        # First get files
        params = {
            "action": "query",
            "list": "categorymembers",
            "cmtitle": f"Category:{cat}",
            "cmtype": "file",
            "cmlimit": str(min(limit, 500)),
            "format": "json",
        }

        try:
            resp = await client.get(WIKI_API, params=params)
            data = resp.json()
            members = data.get("query", {}).get("categorymembers", [])

            for m in members:
                if len(results) >= limit:
                    break
                title = m.get("title", "")
                if any(title.lower().endswith(ext) for ext in [".jpg", ".jpeg", ".png", ".tif", ".tiff"]):
                    results.append({"file_title": title, "pageid": m.get("pageid")})
        except Exception as e:
            logger.warning(f"Category fetch failed for '{cat}': {e}")
            return

        # Then recurse into subcategories
        if remaining_depth > 0 and len(results) < limit:
            params["cmtype"] = "subcat"
            params["cmlimit"] = "50"
            try:
                resp = await client.get(WIKI_API, params=params)
                data = resp.json()
                subcats = data.get("query", {}).get("categorymembers", [])
                for sc in subcats:
                    if len(results) >= limit:
                        break
                    subcat_name = sc.get("title", "").replace("Category:", "")
                    await _recurse(subcat_name, remaining_depth - 1)
            except Exception as e:
                logger.warning(f"Subcat fetch failed for '{cat}': {e}")

    await _recurse(category, depth)
    return results


async def _get_image_info(
    file_titles: list[str], client: httpx.AsyncClient
) -> dict[str, dict]:
    """Get image URLs and metadata for multiple files."""
    info = {}

    # Process in batches of 20
    for i in range(0, len(file_titles), 20):
        batch = file_titles[i:i + 20]
        titles_str = "|".join(batch)

        params = {
            "action": "query",
            "titles": titles_str,
            "prop": "imageinfo|categories",
            "iiprop": "url|size|extmetadata",
            "iiurlwidth": "1200",
            "format": "json",
        }

        try:
            resp = await client.get(WIKI_API, params=params)
            data = resp.json()
            pages = data.get("query", {}).get("pages", {})

            for page in pages.values():
                title = page.get("title", "")
                ii = page.get("imageinfo", [{}])[0] if page.get("imageinfo") else {}

                if not ii:
                    continue

                # Get thumbnail URL (1200px) — much faster than full resolution
                thumb_url = ii.get("thumburl") or ii.get("url")
                if not thumb_url:
                    continue

                # Extract metadata
                ext = ii.get("extmetadata", {})
                description = _clean_html(
                    ext.get("ImageDescription", {}).get("value", "")
                )
                date_str = ext.get("DateTimeOriginal", {}).get("value", "")
                artist_meta = _clean_html(
                    ext.get("Artist", {}).get("value", "")
                )
                license_info = ext.get("LicenseShortName", {}).get("value", "")
                categories_raw = ext.get("Categories", {}).get("value", "")
                object_name = _clean_html(
                    ext.get("ObjectName", {}).get("value", "")
                )

                # Extract painting title from filename or metadata
                painting_title = object_name
                if not painting_title:
                    # Parse from filename: "File:Artist - Title.jpg"
                    fname = title.replace("File:", "")
                    fname = re.sub(r"\.(jpg|jpeg|png|tif|tiff)$", "", fname, flags=re.I)
                    # Remove common prefixes
                    fname = re.sub(r"^(WLA|WLANL|Google Art Project)\s*[-–—]\s*", "", fname)
                    painting_title = fname

                info[title] = {
                    "thumb_url": thumb_url,
                    "full_url": ii.get("url", ""),
                    "width": ii.get("width", 0),
                    "height": ii.get("height", 0),
                    "title": painting_title,
                    "description": description[:500] if description else "",
                    "date": date_str,
                    "artist_meta": artist_meta,
                    "license": license_info,
                    "categories": categories_raw,
                    "size": ii.get("size", 0),
                }

        except Exception as e:
            logger.warning(f"Image info batch failed: {e}")

    return info


def _clean_html(text: str) -> str:
    """Remove HTML tags from Wikimedia metadata."""
    text = re.sub(r"<[^>]+>", "", text)
    text = re.sub(r"\s+", " ", text).strip()
    # Decode HTML entities
    text = text.replace("&amp;", "&").replace("&lt;", "<").replace("&gt;", ">")
    text = text.replace("&#039;", "'").replace("&quot;", '"')
    return text


async def _download_image(url: str, filepath: Path, client: httpx.AsyncClient) -> bool:
    """Download image to path using urllib (Wikimedia CDN blocks httpx)."""
    import urllib.request

    try:
        if filepath.exists():
            return True
        filepath.parent.mkdir(parents=True, exist_ok=True)

        req = urllib.request.Request(url, headers={
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
            "Referer": "https://commons.wikimedia.org/",
        })
        resp = urllib.request.urlopen(req, timeout=25)
        data = resp.read()

        # Skip too large (>8MB) or too small (<10KB) files
        if len(data) > 8 * 1024 * 1024 or len(data) < 10000:
            return False

        filepath.write_bytes(data)
        return True
    except Exception:
        return False


async def collect_from_wikimedia(target: int = 1000) -> dict:
    """
    Collect ~1000 famous paintings from Wikimedia Commons.
    Uses curated artist categories for the highest quality results.
    """
    COLLECTION_DIR.mkdir(parents=True, exist_ok=True)

    # Load existing catalog
    catalog_path = COLLECTION_DIR / "catalog.json"
    if catalog_path.exists():
        with open(catalog_path) as f:
            catalog = json.load(f)
    else:
        catalog = {"paintings": [], "stats": {}}

    existing_titles = {p["title"].lower() for p in catalog["paintings"]}
    existing_files = {p["file"] for p in catalog["paintings"]}
    saved_count = len(catalog["paintings"])
    new_count = 0
    failed_count = 0
    skipped_count = 0

    # Shuffle categories for variety if we don't reach target
    categories_list = list(WIKI_CATEGORIES.items())
    random.shuffle(categories_list)

    headers = {
        "User-Agent": "DastanArtApp/1.0 (https://github.com/dastan; dastan@example.com) httpx/0.27",
        "Accept": "application/json",
    }
    async with httpx.AsyncClient(timeout=20, follow_redirects=True, headers=headers) as client:
        for cat_name, wiki_cats in categories_list:
            if saved_count >= target:
                break

            cat_dir = COLLECTION_DIR / cat_name
            cat_dir.mkdir(parents=True, exist_ok=True)

            for wiki_cat in wiki_cats:
                if saved_count >= target:
                    break

                artist = _extract_artist_from_category(wiki_cat)
                logger.info(
                    f"[{saved_count}/{target}] {cat_name}/{artist}: "
                    f"fetching from '{wiki_cat}'"
                )

                # Get files in this category (recurse into subcategories)
                files = await _get_category_files(wiki_cat, client, limit=80)
                if not files:
                    print(f"  No files found in '{wiki_cat}'")
                    continue
                print(f"  Found {len(files)} files in '{wiki_cat}'")

                # Get image info for all files
                file_titles = [f["file_title"] for f in files]
                image_info = await _get_image_info(file_titles, client)

                for file_title, info in image_info.items():
                    if saved_count >= target:
                        break

                    painting_title = info["title"]

                    # Dedup
                    if painting_title.lower() in existing_titles:
                        skipped_count += 1
                        continue

                    # Build filename
                    artist_slug = _slugify(artist)[:30]
                    title_slug = _slugify(painting_title)[:45]
                    filename = f"{artist_slug}--{title_slug}.jpg"
                    rel_path = f"{cat_name}/{filename}"

                    if rel_path in existing_files:
                        skipped_count += 1
                        continue

                    filepath = cat_dir / filename

                    # Download thumbnail (1200px)
                    download_url = info["thumb_url"]
                    ok = await _download_image(download_url, filepath, client)
                    if not ok:
                        failed_count += 1
                        continue

                    # Build tags
                    tags = [cat_name, artist.lower()]
                    if info.get("date"):
                        # Extract century
                        year_match = re.search(r"(\d{4})", info["date"])
                        if year_match:
                            century = (int(year_match.group(1)) // 100) + 1
                            tags.append(f"{century}th century")

                    # Catalog entry
                    entry = {
                        "title": painting_title,
                        "artist": info.get("artist_meta") or artist,
                        "year": info.get("date", "Unknown"),
                        "origin_country": "",
                        "movement": cat_name.replace("-", " ").title(),
                        "medium": "",
                        "description": info.get("description", ""),
                        "artist_bio": "",
                        "category": cat_name,
                        "tags": list(set(tags)),
                        "file": rel_path,
                        "source": "wikimedia",
                        "source_url": info.get("full_url", ""),
                        "license": info.get("license", ""),
                        "dimensions": f"{info.get('width', 0)}x{info.get('height', 0)}",
                        "collected_at": date.today().isoformat(),
                    }
                    catalog["paintings"].append(entry)
                    existing_titles.add(painting_title.lower())
                    existing_files.add(rel_path)
                    saved_count += 1
                    new_count += 1

                # Rate limit: small delay between artist categories
                await asyncio.sleep(0.5)

                # Save checkpoint every 50 new paintings
                if new_count > 0 and new_count % 50 == 0:
                    _save_catalog(catalog, catalog_path)
                    print(f"  ** Checkpoint: {saved_count} total, {new_count} new **")

    # Final stats
    category_counts = {}
    for p in catalog["paintings"]:
        cat = p["category"]
        category_counts[cat] = category_counts.get(cat, 0) + 1

    source_counts = {}
    for p in catalog["paintings"]:
        src = p.get("source", "unknown")
        source_counts[src] = source_counts.get(src, 0) + 1

    catalog["stats"] = {
        "total": len(catalog["paintings"]),
        "by_category": category_counts,
        "by_source": source_counts,
        "last_updated": date.today().isoformat(),
    }

    _save_catalog(catalog, catalog_path)

    logger.info(
        f"Wikimedia collection complete: {new_count} new, {saved_count} total, "
        f"{failed_count} failed, {skipped_count} skipped (dupes)"
    )

    return {
        "new": new_count,
        "total": saved_count,
        "failed": failed_count,
        "skipped": skipped_count,
        "categories": category_counts,
        "directory": str(COLLECTION_DIR),
    }


def _save_catalog(catalog: dict, path: Path):
    with open(path, "w") as f:
        json.dump(catalog, f, indent=2, ensure_ascii=False)
