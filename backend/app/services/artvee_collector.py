"""
Artvee Painting Collector
=========================
Downloads public-domain paintings from artvee.com by artist,
then merges them into the paintings-collection/catalog.json.

Usage (from repo root):
    python -m backend.app.services.artvee_collector

Or via the API endpoint:
    POST /api/canvas/collect-artvee

Image URL pattern:
    ft/  = thumbnail  (~100 KB)
    sftb/ = standard  (~150-200 KB)  ← we use this
"""
from __future__ import annotations

import json
import logging
import os
import re
import time
import unicodedata
from datetime import date
from pathlib import Path
from urllib.parse import unquote

import httpx

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

COLLECTION_DIR = Path(__file__).resolve().parents[3] / "paintings-collection"
CATALOG_PATH = COLLECTION_DIR / "catalog.json"

UA = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
)

# ─── Artists organized by movement/category ──────────────────────────────────
# Each entry: (artvee artist slug, display name, movement, category, country)

ARTISTS = {
    "impressionism": [
        ("claude-monet", "Claude Monet", "Impressionism", "France"),
        ("pierre-auguste-renoir", "Pierre-Auguste Renoir", "Impressionism", "France"),
        ("edgar-degas", "Edgar Degas", "Impressionism", "France"),
        ("camille-pissarro", "Camille Pissarro", "Impressionism", "France"),
        ("berthe-morisot", "Berthe Morisot", "Impressionism", "France"),
        ("mary-cassatt", "Mary Cassatt", "Impressionism", "United States"),
    ],
    "post-impressionism": [
        ("vincent-van-gogh", "Vincent van Gogh", "Post-Impressionism", "Netherlands"),
        ("paul-cezanne", "Paul Cézanne", "Post-Impressionism", "France"),
        ("paul-gauguin", "Paul Gauguin", "Post-Impressionism", "France"),
        ("henri-de-toulouse-lautrec", "Henri de Toulouse-Lautrec", "Post-Impressionism", "France"),
    ],
    "renaissance": [
        ("leonardo-da-vinci", "Leonardo da Vinci", "Renaissance", "Italy"),
        ("michelangelo", "Michelangelo", "Renaissance", "Italy"),
        ("raphael", "Raphael", "Renaissance", "Italy"),
        ("sandro-botticelli", "Sandro Botticelli", "Renaissance", "Italy"),
        ("titian-tiziano-vecellio", "Titian", "Renaissance", "Italy"),
        ("amedeo-modigliani", "Amedeo Modigliani", "Modern", "Italy"),
    ],
    "baroque": [
        ("rembrandt-van-rijn", "Rembrandt", "Baroque", "Netherlands"),
        ("johannes-vermeer", "Johannes Vermeer", "Baroque", "Netherlands"),
        ("caravaggio", "Caravaggio", "Baroque", "Italy"),
        ("peter-paul-rubens", "Peter Paul Rubens", "Baroque", "Belgium"),
    ],
    "romanticism": [
        ("eugene-delacroix", "Eugène Delacroix", "Romanticism", "France"),
        ("caspar-david-friedrich", "Caspar David Friedrich", "Romanticism", "Germany"),
        ("j-m-w-turner", "J.M.W. Turner", "Romanticism", "England"),
        ("francisco-goya", "Francisco Goya", "Romanticism", "Spain"),
    ],
    "realism": [
        ("gustave-courbet", "Gustave Courbet", "Realism", "France"),
        ("jean-francois-millet", "Jean-François Millet", "Realism", "France"),
        ("ilya-repin", "Ilya Repin", "Realism", "Russia"),
    ],
    "surrealism": [
        ("salvador-dali", "Salvador Dalí", "Surrealism", "Spain"),
        ("rene-magritte", "René Magritte", "Surrealism", "Belgium"),
        ("max-ernst", "Max Ernst", "Surrealism", "Germany"),
        ("giorgio-de-chirico", "Giorgio de Chirico", "Surrealism", "Italy"),
        ("frida-kahlo", "Frida Kahlo", "Surrealism", "Mexico"),
    ],
    "cubism": [
        ("pablo-picasso", "Pablo Picasso", "Cubism", "Spain"),
        ("juan-gris", "Juan Gris", "Cubism", "Spain"),
        ("fernand-leger", "Fernand Léger", "Cubism", "France"),
        ("georges-braque", "Georges Braque", "Cubism", "France"),
    ],
    "expressionism": [
        ("edvard-munch", "Edvard Munch", "Expressionism", "Norway"),
        ("egon-schiele", "Egon Schiele", "Expressionism", "Austria"),
        ("ernst-ludwig-kirchner", "Ernst Ludwig Kirchner", "Expressionism", "Germany"),
        ("wassily-kandinsky", "Wassily Kandinsky", "Expressionism", "Russia"),
    ],
    "abstract": [
        ("piet-mondrian", "Piet Mondrian", "Abstract", "Netherlands"),
        ("kazimir-malevich", "Kazimir Malevich", "Abstract", "Russia"),
        ("paul-klee", "Paul Klee", "Abstract", "Switzerland"),
    ],
    "symbolism": [
        ("gustave-moreau", "Gustave Moreau", "Symbolism", "France"),
        ("odilon-redon", "Odilon Redon", "Symbolism", "France"),
        ("arnold-bocklin", "Arnold Böcklin", "Symbolism", "Switzerland"),
    ],
    "art-nouveau": [
        ("alphonse-mucha", "Alphonse Mucha", "Art Nouveau", "Czech Republic"),
        ("gustav-klimt", "Gustav Klimt", "Art Nouveau", "Austria"),
        ("aubrey-beardsley", "Aubrey Beardsley", "Art Nouveau", "England"),
    ],
    "pre-raphaelite": [
        ("john-william-waterhouse", "John William Waterhouse", "Pre-Raphaelite", "England"),
        ("dante-gabriel-rossetti", "Dante Gabriel Rossetti", "Pre-Raphaelite", "England"),
        ("john-everett-millais", "John Everett Millais", "Pre-Raphaelite", "England"),
    ],
    "neoclassicism": [
        ("jacques-louis-david", "Jacques-Louis David", "Neoclassicism", "France"),
        ("jean-auguste-dominique-ingres", "Jean-Auguste-Dominique Ingres", "Neoclassicism", "France"),
    ],
    "rococo": [
        ("jean-honore-fragonard", "Jean-Honoré Fragonard", "Rococo", "France"),
        ("francois-boucher", "François Boucher", "Rococo", "France"),
        ("jean-antoine-watteau", "Jean-Antoine Watteau", "Rococo", "France"),
    ],
    "ukiyo-e": [
        ("katsushika-hokusai", "Katsushika Hokusai", "Ukiyo-e", "Japan"),
        ("utagawa-hiroshige", "Utagawa Hiroshige", "Ukiyo-e", "Japan"),
    ],
    "fauvism": [
        ("henri-matisse", "Henri Matisse", "Fauvism", "France"),
        ("andre-derain", "André Derain", "Fauvism", "France"),
    ],
    "pointillism": [
        ("georges-seurat", "Georges Seurat", "Pointillism", "France"),
        ("paul-signac", "Paul Signac", "Pointillism", "France"),
    ],
}

# How many paintings to download per artist (max)
PER_ARTIST = 20
# Max per category
PER_CATEGORY = 60


def _slugify(text: str) -> str:
    text = unicodedata.normalize("NFKD", text)
    text = text.encode("ascii", "ignore").decode()
    text = re.sub(r"[^\w\s-]", "", text.lower())
    return re.sub(r"[-\s]+", "-", text).strip("-")[:80]


def _extract_year(title: str) -> str:
    m = re.search(r"\((\d{4}(?:\s*[-–]\s*\d{4})?)\)", title)
    if m:
        return m.group(1)
    m = re.search(r"\((\d{4})", title)
    if m:
        return m.group(1)
    return "Unknown"


def _clean_title(title: str) -> str:
    """Remove year suffix from title."""
    return re.sub(r"\s*\(\d{4}[^)]*\)\s*$", "", title).strip()


def _parse_listing_page(html: str) -> list[dict]:
    """Parse an artvee listing page, return list of painting info dicts."""
    results = []
    titles = re.findall(r'class="product-title"[^>]*><a[^>]*>([^<]+)', html)
    imgs = re.findall(r'class="lazy" src="(https://mdl\.artvee\.com/ft/[^"]+)"', html)

    for i, raw_title in enumerate(titles):
        if i >= len(imgs):
            break
        import html as h
        title = h.unescape(raw_title).strip()
        ft_url = imgs[i]
        # Use sftb/ for higher quality
        sftb_url = ft_url.replace("/ft/", "/sftb/")
        year = _extract_year(title)
        clean = _clean_title(title)

        results.append({
            "raw_title": title,
            "title": clean,
            "year": year,
            "image_url": sftb_url,
            "ft_url": ft_url,
        })
    return results


def _download_image(client: httpx.Client, url: str, dest: Path) -> bool:
    """Download image to dest. Returns True on success."""
    if dest.exists():
        return True
    try:
        resp = client.get(url, headers={"User-Agent": UA})
        if resp.status_code == 200 and len(resp.content) > 5000:
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_bytes(resp.content)
            return True
    except Exception as e:
        logger.warning(f"Download failed {url}: {e}")
    return False


def collect_from_artvee(
    target_per_artist: int = PER_ARTIST,
    target_per_category: int = PER_CATEGORY,
) -> dict:
    """
    Download paintings from artvee.com by artist, save to paintings-collection/.
    Returns summary dict.
    """
    COLLECTION_DIR.mkdir(parents=True, exist_ok=True)

    # Load existing catalog
    existing_titles: set[str] = set()
    catalog: list[dict] = []
    if CATALOG_PATH.exists():
        try:
            with open(CATALOG_PATH) as f:
                data = json.load(f)
            catalog = data.get("paintings", [])
            existing_titles = {p["title"].lower() for p in catalog}
        except Exception:
            pass

    added = 0
    skipped = 0
    errors = 0
    artist_stats: dict[str, int] = {}

    client = httpx.Client(timeout=15, follow_redirects=True)

    try:
        for category, artists in ARTISTS.items():
            cat_count = sum(1 for p in catalog if p.get("category") == category)
            logger.info(f"\n{'='*60}")
            logger.info(f"Category: {category} (existing: {cat_count})")
            logger.info(f"{'='*60}")

            for slug, display_name, movement, country in artists:
                if cat_count >= target_per_category:
                    logger.info(f"  Category {category} reached {target_per_category}, skipping remaining artists")
                    break

                artist_count = 0
                logger.info(f"\n  Artist: {display_name} ({slug})")

                # Paginate through artist pages
                for page in range(1, 8):  # up to 7 pages
                    if artist_count >= target_per_artist:
                        break

                    url = f"https://artvee.com/artist/{slug}/"
                    if page > 1:
                        url += f"page/{page}/"

                    try:
                        resp = client.get(url, headers={"User-Agent": UA})
                        if resp.status_code != 200:
                            break
                    except Exception as e:
                        logger.warning(f"  Page fetch failed: {e}")
                        break

                    paintings = _parse_listing_page(resp.text)
                    if not paintings:
                        break

                    for p in paintings:
                        if artist_count >= target_per_artist:
                            break
                        if cat_count >= target_per_category:
                            break

                        # Skip duplicates
                        if p["title"].lower() in existing_titles:
                            skipped += 1
                            continue

                        # Build file path
                        artist_slug = _slugify(display_name)
                        title_slug = _slugify(p["title"])
                        filename = f"{artist_slug}--{title_slug}.jpg"
                        rel_path = f"{category}/{filename}"
                        dest = COLLECTION_DIR / rel_path

                        # Download
                        if _download_image(client, p["image_url"], dest):
                            entry = {
                                "title": p["title"],
                                "artist": display_name,
                                "year": p["year"],
                                "origin_country": country,
                                "movement": movement,
                                "medium": "",
                                "description": "",
                                "artist_bio": "",
                                "category": category,
                                "tags": [
                                    category,
                                    movement.lower(),
                                    country.lower(),
                                    _slugify(display_name),
                                ],
                                "file": rel_path,
                                "source": "artvee",
                                "source_id": "",
                                "source_url": p["image_url"],
                                "collected_at": date.today().isoformat(),
                            }
                            catalog.append(entry)
                            existing_titles.add(p["title"].lower())
                            added += 1
                            artist_count += 1
                            cat_count += 1
                            logger.info(f"    ✓ {p['title']} ({p['year']})")
                        else:
                            errors += 1

                    # Be polite — small delay between pages
                    time.sleep(0.5)

                artist_stats[display_name] = artist_count
                # Small delay between artists
                time.sleep(0.3)

    finally:
        client.close()

    # Save updated catalog
    with open(CATALOG_PATH, "w") as f:
        json.dump({"paintings": catalog}, f, indent=2, ensure_ascii=False)

    summary = {
        "added": added,
        "skipped_duplicates": skipped,
        "errors": errors,
        "total_catalog": len(catalog),
        "artist_stats": artist_stats,
    }
    logger.info(f"\n{'='*60}")
    logger.info(f"Done! Added {added} paintings, {skipped} skipped, {errors} errors")
    logger.info(f"Total catalog: {len(catalog)} paintings")
    logger.info(f"{'='*60}")

    return summary


if __name__ == "__main__":
    collect_from_artvee()
