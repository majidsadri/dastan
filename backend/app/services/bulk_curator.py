"""
Bulk painting collector — fetches 500+ famous paintings across
all major movements, genres, regions, and periods from AIC & Met APIs.
Saves images in a categorized directory structure with metadata tags.

Directory structure:
  /paintings-collection/
    /impressionism/
    /surrealism/
    /renaissance/
    /baroque/
    ...
    catalog.json  (full metadata index)

Each painting image is saved as: {category}/{artist_slug}--{title_slug}.jpg
Catalog.json contains all metadata, tags, and file paths.
"""
from __future__ import annotations

import hashlib
import json
import logging
import os
import random
import re
import unicodedata
from datetime import date
from pathlib import Path

import httpx

logger = logging.getLogger(__name__)

COLLECTION_DIR = Path(__file__).resolve().parents[3] / "paintings-collection"

# ─── Search queries organized by category ───────────────────────────────────

CATEGORIES = {
    "impressionism": [
        "Monet painting", "Renoir painting", "Degas painting",
        "Pissarro painting", "Sisley painting", "Berthe Morisot painting",
        "Impressionism landscape", "Impressionism garden",
        "Monet water lilies", "Monet haystacks", "Renoir dance",
        "Degas ballet", "Manet oil painting", "Mary Cassatt painting",
        "Gustave Caillebotte painting",
    ],
    "post-impressionism": [
        "Van Gogh painting", "Cezanne painting", "Gauguin painting",
        "Seurat painting", "Toulouse-Lautrec painting",
        "Post-Impressionism painting", "Van Gogh sunflowers",
        "Van Gogh starry", "Cezanne still life", "Cezanne landscape",
        "Gauguin Tahiti", "Signac painting", "Bonnard painting",
    ],
    "surrealism": [
        "Salvador Dali painting", "Magritte painting", "Max Ernst painting",
        "Surrealism painting oil", "Remedios Varo painting",
        "Leonora Carrington painting", "surreal dream painting",
        "Yves Tanguy painting", "Giorgio de Chirico painting",
        "Joan Miro painting", "Roberto Matta painting canvas",
        "Dorothea Tanning painting", "Kay Sage painting",
        "surrealism oil canvas", "metaphysical painting",
        "automatism surrealist", "dream landscape surreal",
    ],
    "renaissance": [
        "Botticelli painting", "Raphael painting", "Leonardo painting",
        "Titian painting", "Italian Renaissance painting",
        "Renaissance portrait painting", "Renaissance religious painting",
        "Giorgione painting", "Tintoretto painting", "Veronese painting",
        "Fra Angelico painting", "Piero della Francesca painting",
        "Giovanni Bellini painting", "Andrea Mantegna painting",
        "Northern Renaissance painting", "Jan van Eyck painting",
        "Hans Holbein painting", "Albrecht Durer painting",
    ],
    "baroque": [
        "Caravaggio painting", "Rembrandt painting", "Vermeer painting",
        "Velazquez painting", "Baroque painting", "Rubens painting",
        "Dutch Golden Age painting", "Artemisia Gentileschi painting",
        "Georges de La Tour painting", "Nicolas Poussin painting",
        "Zurbarán painting", "Frans Hals painting",
        "Anthony van Dyck painting", "Rembrandt self portrait",
        "Vermeer interior painting", "Judith Leyster painting",
    ],
    "romanticism": [
        "Delacroix painting", "Turner painting", "Caspar David Friedrich painting",
        "Romanticism landscape painting", "Constable painting",
        "Romantic painting dramatic", "Géricault painting",
        "John Martin painting", "Thomas Cole painting",
        "Frederic Church painting", "Albert Bierstadt painting",
        "William Blake painting", "Francisco Goya painting",
        "Henry Fuseli painting", "romantic sublime landscape",
    ],
    "expressionism": [
        "Edvard Munch painting", "Egon Schiele painting", "Kirchner painting",
        "Kandinsky painting", "Expressionism painting",
        "Franz Marc painting", "Emil Nolde painting",
        "Ernst Ludwig Kirchner painting", "Alexej von Jawlensky painting",
        "Oskar Kokoschka painting", "Max Beckmann painting",
        "August Macke painting", "German Expressionism oil canvas",
        "Die Brücke painting", "Der Blaue Reiter painting",
    ],
    "realism": [
        "Courbet painting", "Millet painting", "Realism painting",
        "Winslow Homer painting", "Thomas Eakins painting",
        "Realism portrait painting", "Honoré Daumier oil painting",
        "Rosa Bonheur painting", "Ilya Repin painting",
        "Joaquín Sorolla painting", "Anders Zorn painting",
        "American realism painting", "social realism painting",
    ],
    "modern": [
        "Picasso painting", "Matisse painting", "Chagall painting",
        "Modigliani painting", "Tamara de Lempicka painting",
        "Edward Hopper painting", "Georgia O'Keeffe painting",
        "Andrew Wyeth painting", "Fernand Léger painting",
        "Stuart Davis painting", "Marsden Hartley painting",
        "Arthur Dove painting", "Charles Demuth painting",
        "Milton Avery painting", "Balthus painting",
    ],
    "symbolism": [
        "Gustave Moreau painting", "Odilon Redon painting",
        "Symbolism painting", "Pre-Raphaelite painting",
        "Rossetti painting", "Burne-Jones painting",
        "John William Waterhouse painting", "Arnold Böcklin painting",
        "Fernand Khnopff painting", "Gustav Klimt allegory",
        "Puvis de Chavannes painting", "symbolist oil canvas",
    ],
    "art-nouveau": [
        "Klimt painting", "Art Nouveau painting", "Mucha painting",
        "Vienna Secession painting", "Klimt portrait gold",
        "Klimt landscape painting", "Gustav Klimt oil canvas",
    ],
    "neoclassicism": [
        "Jacques-Louis David painting", "Ingres painting",
        "Neoclassicism painting", "history painting neoclassical",
        "Angelica Kauffman painting", "Benjamin West painting",
        "Antonio Canova painting", "neoclassical oil canvas",
    ],
    "rococo": [
        "Watteau painting", "Fragonard painting", "Boucher painting",
        "Rococo painting", "fete galante painting",
        "Tiepolo painting", "Canaletto painting",
        "Elisabeth Vigée Le Brun painting", "Chardin painting",
    ],
    "latin-american": [
        "Frida Kahlo painting", "Diego Rivera painting",
        "Latin American painting", "Mexican muralism",
        "Roberto Matta painting", "Wifredo Lam painting",
        "Latin American surrealism", "Rufino Tamayo painting",
        "José Clemente Orozco painting", "David Alfaro Siqueiros painting",
        "Joaquín Torres-García painting", "Fernando Botero painting",
        "Tarsila do Amaral painting", "Mexican painting oil",
        "South American painting canvas", "Cuban painting",
    ],
    "asian": [
        "Japanese painting", "Chinese painting scroll",
        "Hokusai painting", "Hiroshige painting",
        "Indian Mughal painting", "Persian miniature painting",
        "Korean painting", "Chinese landscape painting",
        "Japanese screen painting", "Utamaro painting",
        "Hasegawa Tohaku painting", "Sesshu painting",
        "Zhang Daqian painting", "Qi Baishi painting",
        "Amrita Sher-Gil painting", "Raja Ravi Varma painting",
    ],
    "landscape": [
        "landscape painting oil", "seascape painting",
        "mountain landscape painting", "pastoral painting",
        "garden painting", "night landscape painting",
        "Hudson River School painting", "Barbizon landscape",
        "sunset landscape oil", "winter landscape painting",
        "tropical landscape painting", "Italian landscape painting",
    ],
    "portrait": [
        "portrait painting oil", "self portrait painting",
        "John Singer Sargent portrait", "royal portrait painting",
        "woman portrait painting", "gentleman portrait oil",
        "child portrait painting", "group portrait painting",
        "Rembrandt portrait", "Reynolds portrait painting",
        "Gainsborough portrait", "Vigée Le Brun portrait",
    ],
    "still-life": [
        "still life painting", "flower painting",
        "vanitas painting", "Dutch still life painting",
        "fruit painting", "kitchen still life",
        "Cézanne still life", "Chardin still life painting",
        "flower arrangement painting", "table setting painting oil",
    ],
    "mythology-religion": [
        "mythological painting", "religious painting oil",
        "allegorical painting", "biblical painting",
        "Greek mythology painting", "Madonna painting oil",
        "Annunciation painting", "crucifixion painting oil",
        "Venus painting oil", "Diana painting mythology",
    ],
    "abstract": [
        "Abstract Expressionism painting", "Mondrian painting",
        "abstract painting canvas", "Rothko painting",
        "Pollock painting", "Kazimir Malevich painting",
        "Piet Mondrian oil", "Willem de Kooning painting",
        "Franz Kline painting", "Clyfford Still painting",
        "Helen Frankenthaler painting", "color field painting",
        "geometric abstraction painting", "Hilma af Klint painting",
    ],
}


def _slugify(text: str) -> str:
    """Convert text to filesystem-safe slug."""
    text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode("ascii")
    text = re.sub(r"[^\w\s-]", "", text.lower())
    text = re.sub(r"[-\s]+", "-", text).strip("-")
    return text[:80]


async def _fetch_artic_batch(query: str, client: httpx.AsyncClient, page: int = 1) -> list[dict]:
    """Fetch paintings from AIC."""
    results = []
    try:
        resp = await client.get(
            "https://api.artic.edu/api/v1/artworks/search",
            params={
                "q": query,
                "query[term][is_public_domain]": "true",
                "fields": "id,title,artist_title,date_display,place_of_origin,"
                          "style_titles,image_id,thumbnail,artist_display,"
                          "classification_title,artwork_type_title,medium_display",
                "limit": 10,
                "page": page,
            },
        )
        data = resp.json()

        for a in data.get("data", []):
            if not a.get("image_id"):
                continue

            art_type = (a.get("artwork_type_title") or "").lower()
            medium = (a.get("medium_display") or "").lower()

            is_painting = (
                "painting" in art_type
                or "oil" in medium or "canvas" in medium
                or "watercolor" in medium or "tempera" in medium
                or "fresco" in medium or "acrylic" in medium
                or "gouache" in medium
            )
            is_excluded = any(x in art_type for x in [
                "print", "photograph", "sculpture", "textile", "ceramic"
            ])
            if not is_painting and is_excluded:
                continue

            image_id = a["image_id"]
            styles = a.get("style_titles") or []

            description = ""
            if a.get("thumbnail") and a["thumbnail"].get("alt_text"):
                description = a["thumbnail"]["alt_text"]

            results.append({
                "title": a.get("title", "Untitled"),
                "artist": a.get("artist_title") or a.get("artist_display") or "Unknown",
                "year": a.get("date_display") or "Unknown",
                "origin_country": a.get("place_of_origin") or "Unknown",
                "movement": styles[0] if styles else (a.get("classification_title") or ""),
                "medium": a.get("medium_display") or "",
                "image_url": f"https://www.artic.edu/iiif/2/{image_id}/full/843,/0/default.jpg",
                "description": description,
                "artist_bio": "",
                "source": "artic",
                "source_id": str(a.get("id", "")),
            })
    except Exception as e:
        logger.warning(f"AIC fetch failed for '{query}': {e}")
    return results


async def _fetch_met_batch(query: str, client: httpx.AsyncClient, count: int = 5) -> list[dict]:
    """Fetch paintings from Met Museum."""
    results = []
    try:
        search_resp = await client.get(
            "https://collectionapi.metmuseum.org/public/collection/v1/search",
            params={"q": query, "hasImages": "true", "isPublicDomain": "true", "medium": "Paintings"},
        )
        object_ids = search_resp.json().get("objectIDs") or []
        if not object_ids:
            return results

        sample = random.sample(object_ids[:150], min(count, len(object_ids[:150])))

        for obj_id in sample:
            try:
                obj_resp = await client.get(
                    f"https://collectionapi.metmuseum.org/public/collection/v1/objects/{obj_id}"
                )
                obj = obj_resp.json()
                image_url = obj.get("primaryImage") or obj.get("primaryImageSmall")
                if not image_url:
                    continue

                medium = (obj.get("medium") or "").lower()
                obj_name = (obj.get("objectName") or "").lower()

                is_painting = (
                    "painting" in obj_name or "oil" in medium
                    or "canvas" in medium or "watercolor" in medium
                    or "tempera" in medium
                )
                if not is_painting:
                    continue

                results.append({
                    "title": obj.get("title", "Untitled"),
                    "artist": obj.get("artistDisplayName") or "Unknown",
                    "year": obj.get("objectDate") or "Unknown",
                    "origin_country": obj.get("country") or obj.get("culture") or "Unknown",
                    "movement": obj.get("classification") or obj.get("department") or "",
                    "medium": obj.get("medium") or "",
                    "image_url": image_url,
                    "description": "",
                    "artist_bio": obj.get("artistDisplayBio") or "",
                    "source": "met",
                    "source_id": str(obj_id),
                })
            except Exception:
                continue
    except Exception as e:
        logger.warning(f"Met fetch failed for '{query}': {e}")
    return results


async def _download_image(url: str, filepath: Path, client: httpx.AsyncClient) -> bool:
    """Download image to specific path."""
    try:
        if filepath.exists():
            return True
        filepath.parent.mkdir(parents=True, exist_ok=True)

        resp = await client.get(url, follow_redirects=True, timeout=20)
        if resp.status_code != 200:
            return False

        content_len = len(resp.content)
        if content_len > 5 * 1024 * 1024 or content_len < 5000:
            return False

        filepath.write_bytes(resp.content)
        return True
    except Exception:
        return False


async def bulk_collect_paintings(target: int = 800) -> dict:
    """
    Download ~500 famous paintings organized by category.

    Directory structure:
      paintings-collection/
        impressionism/
          claude-monet--water-lilies.jpg
          pierre-auguste-renoir--luncheon.jpg
        surrealism/
          salvador-dali--persistence.jpg
        ...
        catalog.json
    """
    COLLECTION_DIR.mkdir(parents=True, exist_ok=True)

    # Load existing catalog if any
    catalog_path = COLLECTION_DIR / "catalog.json"
    if catalog_path.exists():
        with open(catalog_path) as f:
            catalog = json.load(f)
    else:
        catalog = {"paintings": [], "stats": {}}

    existing_titles = {p["title"].lower() for p in catalog["paintings"]}
    saved_count = len(catalog["paintings"])
    new_count = 0
    failed_count = 0

    categories_order = list(CATEGORIES.keys())
    random.shuffle(categories_order)

    async with httpx.AsyncClient(timeout=15) as client:
        for category in categories_order:
            if saved_count >= target:
                break

            queries = CATEGORIES[category]
            cat_dir = COLLECTION_DIR / category
            cat_dir.mkdir(parents=True, exist_ok=True)

            for qi, query in enumerate(queries):
                if saved_count >= target:
                    break

                logger.info(
                    f"[{saved_count}/{target}] {category}: '{query}'"
                )

                # Fetch from both sources for better coverage
                paintings = []
                if qi % 3 != 0:
                    paintings = await _fetch_met_batch(query, client, count=8)
                if len(paintings) < 3:
                    artic = await _fetch_artic_batch(
                        query, client, page=random.randint(1, 5)
                    )
                    paintings.extend(artic)

                for p_data in paintings:
                    if saved_count >= target:
                        break

                    # Skip unknown artists
                    if p_data["artist"] in ("Unknown", "", None):
                        continue

                    # Dedup
                    if p_data["title"].lower() in existing_titles:
                        continue

                    # Build filename
                    artist_slug = _slugify(p_data["artist"])[:30]
                    title_slug = _slugify(p_data["title"])[:45]
                    filename = f"{artist_slug}--{title_slug}.jpg"
                    filepath = cat_dir / filename

                    # Download
                    ok = await _download_image(p_data["image_url"], filepath, client)
                    if not ok:
                        failed_count += 1
                        continue

                    # Build tags
                    tags = [category]
                    if p_data["movement"]:
                        tags.append(p_data["movement"].lower())
                    if p_data["origin_country"] and p_data["origin_country"] != "Unknown":
                        tags.append(p_data["origin_country"].lower())
                    if p_data["medium"]:
                        # Extract medium type
                        med = p_data["medium"].lower()
                        if "oil" in med:
                            tags.append("oil")
                        if "watercolor" in med:
                            tags.append("watercolor")
                        if "canvas" in med:
                            tags.append("canvas")
                        if "tempera" in med:
                            tags.append("tempera")

                    # Catalog entry
                    entry = {
                        "title": p_data["title"],
                        "artist": p_data["artist"],
                        "year": p_data["year"],
                        "origin_country": p_data["origin_country"],
                        "movement": p_data["movement"],
                        "medium": p_data["medium"],
                        "description": p_data["description"],
                        "artist_bio": p_data["artist_bio"],
                        "category": category,
                        "tags": list(set(tags)),
                        "file": f"{category}/{filename}",
                        "source": p_data["source"],
                        "source_id": p_data["source_id"],
                        "source_url": p_data["image_url"],
                        "collected_at": date.today().isoformat(),
                    }
                    catalog["paintings"].append(entry)
                    existing_titles.add(p_data["title"].lower())
                    saved_count += 1
                    new_count += 1

                # Save catalog periodically
                if new_count % 20 == 0 and new_count > 0:
                    _save_catalog(catalog, catalog_path)
                    logger.info(f"Saved catalog checkpoint: {saved_count} total paintings")

    # Final stats
    category_counts = {}
    for p in catalog["paintings"]:
        cat = p["category"]
        category_counts[cat] = category_counts.get(cat, 0) + 1

    catalog["stats"] = {
        "total": len(catalog["paintings"]),
        "by_category": category_counts,
        "sources": {
            "artic": sum(1 for p in catalog["paintings"] if p["source"] == "artic"),
            "met": sum(1 for p in catalog["paintings"] if p["source"] == "met"),
        },
        "last_updated": date.today().isoformat(),
    }

    _save_catalog(catalog, catalog_path)

    logger.info(
        f"Bulk collection complete: {new_count} new, {saved_count} total, "
        f"{failed_count} failed"
    )

    return {
        "new": new_count,
        "total": saved_count,
        "failed": failed_count,
        "categories": category_counts,
        "directory": str(COLLECTION_DIR),
    }


def _save_catalog(catalog: dict, path: Path):
    """Save catalog.json with pretty formatting."""
    with open(path, "w") as f:
        json.dump(catalog, f, indent=2, ensure_ascii=False)
