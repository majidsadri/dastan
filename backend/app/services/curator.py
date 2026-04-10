"""
Dastan Painting Curator
=======================
Uses Claude as an art curator brain to:
1. Analyze user profile (movements, themes, regions, genres)
2. Generate intelligent, diverse museum search queries
3. Fetch actual paintings from AIC & Met APIs (filtered — no prints, no sculptures)
4. Use Claude to write rich descriptions and artist context
5. Download images locally for fast loading
6. Save to DB with upcoming display dates

Designed to run:
- On profile create/update (auto-curate)
- On demand via /api/canvas/curate
- On server startup if no curated content exists
"""
from __future__ import annotations

import asyncio
import hashlib
import json
import logging
import random
from datetime import date, timedelta
from pathlib import Path

import httpx
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.models import Painting, UserProfile

logger = logging.getLogger(__name__)

PAINTINGS_DIR = Path(__file__).resolve().parents[3] / "frontend" / "public" / "paintings"

# Track running curation to prevent double-triggers
_curation_lock = asyncio.Lock()


# ─── Step 1: Claude generates search queries from profile ──────────────────

async def _ask_claude_for_queries(profile: UserProfile, count: int = 10) -> list[dict]:
    """
    Claude acts as a senior art curator. Given the user's taste profile,
    it generates museum-optimized search queries that balance:
    - Relevance to user's stated preferences
    - Diversity across periods, regions, moods
    - Surprise — at least 2 queries that push beyond comfort zone
    """
    import anthropic

    movements = ", ".join(profile.art_movements or []) or "not specified"
    themes = ", ".join(profile.themes or []) or "not specified"
    regions = ", ".join(profile.regions or []) or "not specified"
    genres = ", ".join(profile.literary_genres or []) or "not specified"
    artists = ", ".join(profile.favorite_artists or []) or "not specified"
    periods = ", ".join(profile.art_periods or []) or "not specified"

    client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
    message = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=2000,
        messages=[{
            "role": "user",
            "content": (
                "You are a world-class art curator building a personalized painting "
                "collection for a user of Dastan, a daily art discovery app.\n\n"
                f"USER TASTE PROFILE:\n"
                f"  Art movements: {movements}\n"
                f"  Art periods: {periods}\n"
                f"  Favorite artists: {artists}\n"
                f"  Themes they love: {themes}\n"
                f"  Regions of interest: {regions}\n"
                f"  Literary genres (for cross-pollination): {genres}\n\n"
                f"Generate exactly {count} search queries to find PAINTINGS (oil on canvas, "
                f"watercolor, fresco — NOT prints, photographs, or sculptures) from the "
                f"Art Institute of Chicago and Metropolitan Museum of Art APIs.\n\n"
                "CURATORIAL STRATEGY:\n"
                "- 4 queries deeply aligned with user's stated movements/regions\n"
                "- 3 queries that connect their themes to unexpected art traditions\n"
                "- 2 queries targeting specific famous artists from their preferred regions\n"
                "- 1 wildcard query — a masterpiece from outside their comfort zone\n\n"
                "QUERY FORMAT RULES:\n"
                "- Each query: 2-5 words, optimized for museum collection search\n"
                "- Include artist names when targeting specific artists\n"
                "- Use terms like 'painting', 'oil', 'canvas' to bias toward paintings\n"
                "- Avoid generic terms like 'art' or 'artwork' alone\n\n"
                "For each query, also specify:\n"
                "- intent: what kind of painting you hope to find (1 sentence)\n"
                "- mood: the emotional tone (1-2 words)\n"
                "- why: why this fits the user's profile (1 sentence)\n\n"
                f"Reply ONLY with valid JSON array of {count} objects:\n"
                '[{"query": "...", "intent": "...", "mood": "...", "why": "..."}]\n'
                "No markdown fences, no explanation."
            ),
        }],
    )

    text = message.content[0].text.strip()
    if text.startswith("```"):
        text = text.split("\n", 1)[1]
        if text.endswith("```"):
            text = text.rsplit("```", 1)[0]
        text = text.strip()

    queries = json.loads(text)
    logger.info(f"Claude generated {len(queries)} queries for profile '{profile.display_name}'")
    return queries


# ─── Step 2: Claude enriches painting metadata ─────────────────────────────

async def _enrich_with_claude(painting_data: dict, query_context: dict) -> dict:
    """Use Claude to write a rich, evocative description and artist context."""
    import anthropic

    try:
        client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
        message = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=500,
            messages=[{
                "role": "user",
                "content": (
                    "You are writing gallery wall text for Dastan, a daily art discovery app.\n\n"
                    f"PAINTING: \"{painting_data['title']}\" by {painting_data['artist']}\n"
                    f"Date: {painting_data['year']}\n"
                    f"Origin: {painting_data['origin_country']}\n"
                    f"Movement/Style: {painting_data['movement']}\n"
                    f"Medium: {painting_data.get('description', 'Unknown')}\n"
                    f"Existing bio: {painting_data.get('artist_bio', '')}\n\n"
                    "Write two things:\n"
                    "1. DESCRIPTION (2-3 sentences): An evocative, sensory description of "
                    "what the viewer sees — colors, composition, mood, technique. "
                    "Write as a curator speaking to an art lover, not an encyclopedia.\n\n"
                    "2. ARTIST_BIO (1-2 sentences): The essential context about the artist — "
                    "who they were, what drove their work. If unknown artist, describe the "
                    "cultural/historical context instead.\n\n"
                    "Reply as JSON: {\"description\": \"...\", \"artist_bio\": \"...\"}\n"
                    "No markdown, no explanation."
                ),
            }],
        )

        text = message.content[0].text.strip()
        if text.startswith("```"):
            text = text.split("\n", 1)[1]
            if text.endswith("```"):
                text = text.rsplit("```", 1)[0]
            text = text.strip()

        enriched = json.loads(text)
        painting_data["description"] = enriched.get("description", painting_data.get("description", ""))
        painting_data["artist_bio"] = enriched.get("artist_bio", painting_data.get("artist_bio", ""))
        return painting_data
    except Exception as e:
        logger.warning(f"Enrichment failed for '{painting_data['title']}': {e}")
        return painting_data


# ─── Step 3: Museum API fetchers (painting-filtered) ───────────────────────

PAINTING_CLASSIFICATIONS = {
    "painting", "paintings", "oil on canvas", "watercolor", "fresco",
    "tempera", "acrylic", "gouache", "oil painting",
}

MET_PAINTING_DEPARTMENTS = {
    "European Paintings", "American Paintings and Sculpture",
    "Asian Art", "Modern and Contemporary Art",
    "The American Wing", "Robert Lehman Collection",
}


async def _fetch_painting_artic(query: str, client: httpx.AsyncClient) -> dict | None:
    """Fetch a painting from Art Institute of Chicago, filtered to actual paintings."""
    try:
        page = random.randint(1, 3)
        resp = await client.get(
            "https://api.artic.edu/api/v1/artworks/search",
            params={
                "q": query,
                "query[term][is_public_domain]": "true",
                "fields": "id,title,artist_title,date_display,place_of_origin,"
                          "style_titles,image_id,thumbnail,artist_display,"
                          "classification_title,artwork_type_title,medium_display",
                "limit": 20,
                "page": page,
            },
        )
        data = resp.json()

        # Filter to actual paintings
        artworks = []
        for a in data.get("data", []):
            if not a.get("image_id"):
                continue
            art_type = (a.get("artwork_type_title") or "").lower()
            classification = (a.get("classification_title") or "").lower()
            medium = (a.get("medium_display") or "").lower()

            is_painting = (
                "painting" in art_type
                or "painting" in classification
                or "oil" in medium
                or "canvas" in medium
                or "watercolor" in medium
                or "tempera" in medium
                or "fresco" in medium
                or "acrylic" in medium
                or "gouache" in medium
            )

            # Exclude non-paintings
            is_excluded = any(x in art_type for x in ["print", "photograph", "sculpture", "textile", "ceramic"])

            if is_painting or (not is_excluded and a.get("image_id")):
                artworks.append(a)

        if not artworks:
            return None

        art = random.choice(artworks[:10])
        image_id = art["image_id"]
        image_url = f"https://www.artic.edu/iiif/2/{image_id}/full/843,/0/default.jpg"

        styles = art.get("style_titles") or []
        movement = styles[0] if styles else (art.get("classification_title") or "Fine Art")

        description = ""
        if art.get("thumbnail") and art["thumbnail"].get("alt_text"):
            description = art["thumbnail"]["alt_text"]

        return {
            "title": art.get("title", "Untitled"),
            "artist": art.get("artist_title") or art.get("artist_display") or "Unknown",
            "year": art.get("date_display") or "Unknown",
            "origin_country": art.get("place_of_origin") or "Unknown",
            "movement": movement,
            "image_url": image_url,
            "description": description,
            "artist_bio": "",
            "source": "artic",
        }
    except Exception as e:
        logger.warning(f"AIC fetch failed for '{query}': {e}")
        return None


async def _fetch_painting_met(query: str, client: httpx.AsyncClient) -> dict | None:
    """Fetch a painting from the Met Museum, filtered to painting departments."""
    try:
        search_resp = await client.get(
            "https://collectionapi.metmuseum.org/public/collection/v1/search",
            params={
                "q": query,
                "hasImages": "true",
                "isPublicDomain": "true",
                "medium": "Paintings",
            },
        )
        search_data = search_resp.json()
        object_ids = search_data.get("objectIDs") or []
        if not object_ids:
            return None

        # Try up to 3 random objects to find a good painting
        random.shuffle(object_ids)
        for obj_id in object_ids[:5]:
            try:
                obj_resp = await client.get(
                    f"https://collectionapi.metmuseum.org/public/collection/v1/objects/{obj_id}"
                )
                obj = obj_resp.json()

                image_url = obj.get("primaryImage") or obj.get("primaryImageSmall")
                if not image_url:
                    continue

                dept = obj.get("department", "")
                medium = (obj.get("medium") or "").lower()
                obj_name = (obj.get("objectName") or "").lower()

                # Prefer actual paintings
                is_painting = (
                    dept in MET_PAINTING_DEPARTMENTS
                    or "painting" in obj_name
                    or "oil" in medium
                    or "canvas" in medium
                    or "watercolor" in medium
                    or "tempera" in medium
                )

                if not is_painting:
                    continue

                return {
                    "title": obj.get("title", "Untitled"),
                    "artist": obj.get("artistDisplayName") or "Unknown",
                    "year": obj.get("objectDate") or "Unknown",
                    "origin_country": obj.get("country") or obj.get("culture") or "Unknown",
                    "movement": obj.get("classification") or dept or "Fine Art",
                    "image_url": image_url,
                    "description": obj.get("medium") or "",
                    "artist_bio": obj.get("artistDisplayBio") or "",
                    "source": "met",
                }
            except Exception:
                continue

        return None
    except Exception as e:
        logger.warning(f"Met fetch failed for '{query}': {e}")
        return None


# ─── Step 4: Image downloader ──────────────────────────────────────────────

async def _download_image(url: str, client: httpx.AsyncClient) -> str | None:
    """Download image to local paintings dir. Returns /paintings/hash.jpg path."""
    try:
        url_hash = hashlib.md5(url.encode()).hexdigest()[:12]
        filename = f"{url_hash}.jpg"
        filepath = PAINTINGS_DIR / filename

        if filepath.exists():
            return f"/paintings/{filename}"

        PAINTINGS_DIR.mkdir(parents=True, exist_ok=True)

        resp = await client.get(url, follow_redirects=True, timeout=20)
        if resp.status_code != 200:
            return None

        content_len = len(resp.content)
        if content_len > 5 * 1024 * 1024:
            logger.warning(f"Image too large ({content_len // 1024}KB), skipping")
            return None
        if content_len < 5000:
            logger.warning(f"Image too small ({content_len}B), likely error page")
            return None

        filepath.write_bytes(resp.content)
        logger.info(f"Downloaded: {filename} ({content_len // 1024}KB)")
        return f"/paintings/{filename}"
    except Exception as e:
        logger.warning(f"Image download failed: {e}")
        return None


# ─── Step 5: Main curation pipeline ────────────────────────────────────────

async def curate_paintings(db: AsyncSession, days: int = 7) -> dict:
    """
    Full curation pipeline:
    1. Read user profile
    2. Claude generates smart queries
    3. Fetch paintings from AIC + Met (painting-filtered)
    4. Claude enriches each painting with description + artist context
    5. Download images locally
    6. Save to DB with upcoming display dates
    """
    if _curation_lock.locked():
        return {"error": "Curation already in progress."}

    async with _curation_lock:
        profile_result = await db.execute(select(UserProfile).limit(1))
        profile = profile_result.scalar_one_or_none()

        if not profile:
            return {"error": "No user profile found. Create a profile first."}

        if not settings.ANTHROPIC_API_KEY:
            return {"error": "ANTHROPIC_API_KEY not configured."}

        # Generate more queries than needed (some will fail)
        query_count = days + 5
        try:
            queries = await _ask_claude_for_queries(profile, count=query_count)
        except Exception as e:
            logger.error(f"Claude query generation failed: {e}")
            return {"error": f"Query generation failed: {str(e)}"}

        # Find next available dates
        today = date.today()
        existing_result = await db.execute(
            select(Painting.display_date)
            .where(Painting.display_date >= today)
            .where(Painting.source.isnot(None))
        )
        existing_dates = {row[0] for row in existing_result}

        # Also get existing titles for dedup
        existing_titles_result = await db.execute(select(Painting.title))
        existing_titles = {row[0].lower() for row in existing_titles_result}

        next_date = today
        saved = []
        failed_queries = []

        async with httpx.AsyncClient(timeout=15) as client:
            for i, q in enumerate(queries):
                if len(saved) >= days:
                    break

                query_text = q.get("query", "") if isinstance(q, dict) else str(q)
                intent = q.get("intent", "") if isinstance(q, dict) else ""
                mood = q.get("mood", "") if isinstance(q, dict) else ""

                if not query_text:
                    continue

                # Alternate sources for variety
                if i % 2 == 0:
                    fetchers = [_fetch_painting_artic, _fetch_painting_met]
                else:
                    fetchers = [_fetch_painting_met, _fetch_painting_artic]

                painting_data = None
                for fetch_fn in fetchers:
                    painting_data = await fetch_fn(query_text, client)
                    if painting_data:
                        break

                if not painting_data:
                    failed_queries.append(query_text)
                    logger.warning(f"No painting found for: {query_text}")
                    continue

                # Dedup by title
                if painting_data["title"].lower() in existing_titles:
                    logger.info(f"Skipping duplicate: {painting_data['title']}")
                    continue

                # Download image
                local_path = await _download_image(painting_data["image_url"], client)
                if not local_path:
                    failed_queries.append(f"{query_text} (image failed)")
                    continue

                # Enrich with Claude (description + artist bio)
                painting_data = await _enrich_with_claude(painting_data, q if isinstance(q, dict) else {})

                # Assign display date
                while next_date in existing_dates:
                    next_date += timedelta(days=1)
                display_date = next_date
                next_date += timedelta(days=1)

                # Save to DB
                painting = Painting(
                    title=painting_data["title"],
                    artist=painting_data["artist"],
                    year=painting_data["year"],
                    origin_country=painting_data["origin_country"],
                    movement=painting_data["movement"],
                    image_url=local_path,
                    description=painting_data["description"] or intent,
                    artist_bio=painting_data["artist_bio"] or "",
                    colors=[],
                    display_date=display_date,
                    source=painting_data["source"],
                )
                db.add(painting)
                existing_titles.add(painting_data["title"].lower())
                existing_dates.add(display_date)

                saved.append({
                    "title": painting_data["title"],
                    "artist": painting_data["artist"],
                    "movement": painting_data["movement"],
                    "date": display_date.isoformat(),
                    "source": painting_data["source"],
                    "query": query_text,
                    "mood": mood,
                    "image": local_path,
                })

        await db.commit()

        logger.info(
            f"Curation complete: {len(saved)} paintings saved, "
            f"{len(failed_queries)} queries failed"
        )

        return {
            "curated": len(saved),
            "paintings": saved,
            "failed": failed_queries,
            "profile": profile.display_name,
        }


# ─── Background curation trigger ───────────────────────────────────────────

async def trigger_curation_background(db_factory):
    """
    Fire-and-forget curation. Called after profile create/update.
    db_factory should be an async context manager that yields a session.
    """
    async def _run():
        try:
            async for db in db_factory():
                result = await curate_paintings(db, days=7)
                if result.get("error"):
                    logger.warning(f"Background curation failed: {result['error']}")
                else:
                    logger.info(f"Background curation: {result['curated']} paintings saved")
                break
        except Exception as e:
            logger.error(f"Background curation error: {e}")

    asyncio.create_task(_run())


async def check_and_curate_if_needed(db: AsyncSession):
    """
    Called on startup. If there are no curated paintings for upcoming days,
    trigger curation.
    """
    today = date.today()
    result = await db.execute(
        select(func.count())
        .select_from(Painting)
        .where(Painting.display_date >= today)
        .where(Painting.source.isnot(None))
    )
    count = result.scalar()

    if count < 3:
        logger.info(f"Only {count} curated paintings ahead — triggering curation")
        return await curate_paintings(db, days=7)
    else:
        logger.info(f"{count} curated paintings available — skipping auto-curation")
        return {"status": "sufficient", "count": count}
