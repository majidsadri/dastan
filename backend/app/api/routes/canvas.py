from __future__ import annotations

import asyncio
import random
import logging
from datetime import date, datetime
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.auth import get_current_user_id, get_jwt_payload
from app.models.models import Painting, NovelPage, LiteratureHighlight, UserProfile, UserCanvasHistory
from app.schemas.schemas import (
    TodayCanvas,
    DailyContent,
    ArchiveDay,
    PaintingResponse,
    NovelPageResponse,
    LiteratureHighlightResponse,
)

router = APIRouter(prefix="/api/canvas", tags=["canvas"])

# ── Singleton async Anthropic client (reuse connections) ──
_anthropic_client = None

def _get_anthropic():
    global _anthropic_client
    if _anthropic_client is None:
        from app.core.config import settings
        import anthropic
        if settings.ANTHROPIC_API_KEY:
            _anthropic_client = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
    return _anthropic_client


def _build_ai_prompt(
    painting: Painting | None,
    novel: NovelPage | None,
    literature: LiteratureHighlight | None,
) -> str:
    parts = []
    if painting:
        parts.append(
            f'Today\'s painting is "{painting.title}" by {painting.artist} '
            f"({painting.year}), a masterwork of {painting.movement} from {painting.origin_country}."
        )
    if novel:
        parts.append(
            f'You are reading page {novel.page_number} of {novel.total_pages} '
            f'of "{novel.novel_title}" by {novel.author}.'
        )
    if literature:
        parts.append(
            f'The literary highlight is "{literature.title}" by {literature.author}, '
            f"a {literature.genre} from {literature.author_country}."
        )

    if parts:
        return (
            " ".join(parts)
            + " Let these works inspire your imagination. "
            "What connections do you see between today's art and literature?"
        )
    return "Welcome to Dastan. Explore the intersection of art and literature."


async def _get_canvas_for_date(
    target_date: date, db: AsyncSession
) -> TodayCanvas:
    # Seed data may have multiple rows per display_date (a rotating pool).
    # Pick the deterministic first by id so every request for the same date
    # returns the same canvas.
    painting_result = await db.execute(
        select(Painting)
        .where(Painting.display_date == target_date)
        .order_by(Painting.id)
        .limit(1)
    )
    painting = painting_result.scalars().first()

    novel_result = await db.execute(
        select(NovelPage)
        .where(NovelPage.display_date == target_date)
        .order_by(NovelPage.id)
        .limit(1)
    )
    novel_page = novel_result.scalars().first()

    lit_result = await db.execute(
        select(LiteratureHighlight)
        .where(LiteratureHighlight.display_date == target_date)
        .order_by(LiteratureHighlight.id)
        .limit(1)
    )
    literature = lit_result.scalars().first()

    ai_prompt = _build_ai_prompt(painting, novel_page, literature)

    return TodayCanvas(
        date=target_date,
        painting=PaintingResponse.model_validate(painting) if painting else None,
        novel_page=NovelPageResponse.model_validate(novel_page) if novel_page else None,
        literature=LiteratureHighlightResponse.model_validate(literature) if literature else None,
        ai_prompt=ai_prompt,
    )


# Simple in-memory cache for today's live painting (keyed by date)
_today_painting_cache: dict[str, PaintingResponse] = {}
_profile_changed = False

# Track which collection paintings have already been shown (by title)
_shown_collection: set[str] = set()
_catalog_cache: list[dict] | None = None

# Track last movement used for live API, so we rotate through profile movements
_last_movement_index: int = 0


def _find_in_collection(profile, preferred_movement: str | None = None) -> dict | None:
    """Search paintings-collection/catalog.json for a profile-matched painting.

    When *preferred_movement* is given, only paintings matching that specific
    movement score as PRIMARY.  This allows the caller to rotate through the
    user's movements so each gets a turn.  If the catalog can't satisfy the
    preferred movement, returns None so live APIs handle it.

    Scoring uses two tiers:
      - PRIMARY (10 pts): painting's movement/category exactly matches a
        profile art movement (or the preferred_movement if given)
      - SECONDARY (2 pts): painting's category is a loose relative
      - TAG bonus (1 pt): painting tags overlap with any profile term
      - REGION bonus (3 pts): painting's origin matches a profile region

    A minimum score of 8 is required to return a local result.
    """
    global _catalog_cache
    from pathlib import Path

    catalog_path = Path(__file__).resolve().parents[4] / "paintings-collection" / "catalog.json"

    if _catalog_cache is None:
        import json
        if not catalog_path.exists():
            return None
        try:
            with open(catalog_path) as f:
                _catalog_cache = json.load(f).get("paintings", [])
            logger.info(f"Loaded painting catalog: {len(_catalog_cache)} paintings")
        except Exception:
            return None

    paintings = _catalog_cache
    if not paintings:
        return None

    # ── Build profile sets ──
    # When preferred_movement is given, only score for that specific movement
    if preferred_movement:
        movements = {preferred_movement.lower()}
    else:
        movements = set(m.lower() for m in (profile.art_movements or []))
    themes = set(t.lower() for t in (profile.themes or []))
    regions = set(r.lower() for r in (profile.regions or []))
    all_terms = movements | themes | regions

    # ── Primary categories: exact movement → catalog category ──
    _movement_to_categories = {
        "impressionism":      (["impressionism"], []),
        "post-impressionism": (["post-impressionism"], ["impressionism"]),
        "surrealism":         (["surrealism"], ["symbolism"]),
        "expressionism":      (["expressionism"], []),
        "realism":            (["realism"], []),
        "romanticism":        (["romanticism"], []),
        "renaissance":        (["renaissance"], []),
        "baroque":            (["baroque"], []),
        "rococo":             (["rococo"], ["baroque"]),
        "neoclassicism":      (["neoclassicism"], []),
        "art nouveau":        ([], ["symbolism", "modern"]),
        "symbolism":          (["symbolism"], []),
        "abstract":           (["abstract"], ["modern"]),
        "modern":             (["modern"], ["abstract"]),
        "cubism":             ([], ["modern", "abstract"]),
        "minimalism":         ([], ["abstract", "modern"]),
        "pop art":            ([], ["modern"]),
        "fauvism":            ([], ["expressionism", "post-impressionism"]),
        "pointillism":        ([], ["post-impressionism", "impressionism"]),
        "pre-raphaelite":     (["pre-raphaelite"], ["romanticism", "symbolism"]),
        "gothic":             ([], ["renaissance", "baroque"]),
        "ukiyo-e":            (["asian"], []),
        "contemporary":       ([], ["modern", "abstract"]),
    }

    primary_categories = set()
    secondary_categories = set()
    for mov in movements:
        entry = _movement_to_categories.get(mov)
        if entry:
            primary_categories.update(entry[0])
            secondary_categories.update(entry[1])
        else:
            primary_categories.add(mov)
    secondary_categories -= primary_categories

    # Region → category mapping
    _region_to_categories = {
        "latin america": "latin-american", "caribbean": "latin-american",
        "east asia": "asian", "south asia": "asian", "southeast asia": "asian",
        "middle east": "asian", "central asia": "asian",
    }

    # ── Score each painting ──
    SCORE_PRIMARY = 10     # exact movement match
    SCORE_SECONDARY = 2    # loosely related movement
    SCORE_REGION = 3       # origin region match
    SCORE_TAG = 1          # tag overlap with any profile term
    SCORE_MOVEMENT_TEXT = 6  # painting's own "movement" field matches profile
    MIN_QUALITY = 8        # minimum score to serve from local catalog

    # Reset tracking if we've shown most of the catalog (allow re-showing)
    if len(_shown_collection) > len(paintings) * 0.7:
        _shown_collection.clear()
        logger.info("Reset shown paintings tracker — cycled through most of the catalog")

    scored = []
    for p in paintings:
        if p["title"] in _shown_collection:
            continue

        img_path = catalog_path.parent / p["file"]
        if not img_path.exists():
            continue

        score = 0
        category = p.get("category", "").lower()
        p_movement = p.get("movement", "").lower()
        tags = set(t.lower() for t in p.get("tags", []))

        # Primary category match (exact movement in catalog)
        if category in primary_categories:
            score += SCORE_PRIMARY

        # Secondary category match (loose relative)
        elif category in secondary_categories:
            score += SCORE_SECONDARY

        # Direct movement text match — painting's "movement" field
        # matches a user-selected movement. Use exact word match to
        # prevent "realism" from matching "surrealism".
        for mov in movements:
            if mov == p_movement or mov == category:
                score += SCORE_MOVEMENT_TEXT
                break

        # Region match
        origin = p.get("origin_country", "").lower()
        for region in regions:
            mapped_cat = _region_to_categories.get(region)
            if mapped_cat and mapped_cat == category:
                score += SCORE_REGION
            if _region_matches_country(region, origin):
                score += SCORE_REGION

        # Tag overlap — exact match only (prevents "realism"↔"surrealism")
        for term in all_terms:
            if term in tags:
                score += SCORE_TAG

        scored.append((score, random.random(), p))

    if not scored:
        return None

    scored.sort(key=lambda x: (-x[0], x[1]))
    best_score = scored[0][0]

    # If the best match is below the quality threshold, the local catalog
    # can't serve this profile well — return None so the live APIs are used.
    if best_score < MIN_QUALITY:
        logger.info(
            f"Local collection best score {best_score} < {MIN_QUALITY} "
            f"for movements={list(movements)}; falling through to live APIs"
        )
        return None

    # Use ALL qualifying paintings, not just top 15 — prevents repetition
    # in large categories like Impressionism (200+ paintings).
    qualified = [s for s in scored if s[0] >= MIN_QUALITY]
    if not qualified:
        return None

    # Weighted random from the full qualified pool
    weights = [s[0] for s in qualified]
    chosen = random.choices(qualified, weights=weights, k=1)[0][2]

    _shown_collection.add(chosen["title"])

    # Return as painting dict with local image path
    return {
        "title": chosen["title"],
        "artist": chosen["artist"],
        "year": chosen.get("year", "Unknown"),
        "origin_country": chosen.get("origin_country", "Unknown"),
        "movement": chosen.get("movement", ""),
        "image_url": f"/collection/{chosen['file']}",
        "description": chosen.get("description", ""),
        "artist_bio": chosen.get("artist_bio", ""),
        "colors": [],
        "display_date": date.today(),
    }


@router.get("/today", response_model=DailyContent)
async def get_today_canvas(
    db: AsyncSession = Depends(get_db),
    user_id: Optional[str] = Depends(get_current_user_id),
    jwt_payload: Optional[dict] = Depends(get_jwt_payload),
):
    today = date.today()
    today_str = today.isoformat()

    # Get profile for personalized painting
    if user_id:
        profile_result = await db.execute(
            select(UserProfile).where(UserProfile.user_id == user_id)
        )
        profile = profile_result.scalar_one_or_none()
        # Self-heal: if profile sync from frontend failed (common on Safari),
        # auto-create it from JWT user_metadata so personalization works.
        if not profile and jwt_payload:
            profile = await _ensure_profile_from_jwt(db, user_id, jwt_payload)
    else:
        profile_result = await db.execute(select(UserProfile).limit(1))
        profile = profile_result.scalar_one_or_none()

    # Try to find a painting for today
    global _profile_changed, _last_movement_index
    painting_resp = None

    # 1. Check cache — skipped if profile just changed
    if today_str in _today_painting_cache and not _profile_changed:
        painting_resp = _today_painting_cache[today_str]
    else:
        _profile_changed = False

        # Pick a movement for today (rotation ensures variety across restarts)
        preferred = None
        if profile and profile.art_movements:
            idx = _last_movement_index % len(profile.art_movements)
            preferred = profile.art_movements[idx]
            _last_movement_index = idx + 1
            logger.info(f"Today: trying movement '{preferred}' ({idx+1}/{len(profile.art_movements)})")

        # 2. Profile exists → prefer local collection (fast, profile-matched)
        if profile:
            match = _find_in_collection(profile, preferred_movement=preferred)
            if match:
                painting_resp = PaintingResponse(
                    id=0, created_at=datetime.now(), **match,
                )
                logger.info(f"Local collection match: {match['title']}")

        # 3. No profile match → try DB curated paintings for today
        if not painting_resp:
            curated_result = await db.execute(
                select(Painting)
                .where(Painting.display_date == today)
                .where(Painting.source.isnot(None))
                .limit(1)
            )
            curated = curated_result.scalar_one_or_none()
            if curated:
                painting_resp = PaintingResponse.model_validate(curated)

        # 4. Still nothing → fetch live from API (pass preferred movement)
        if not painting_resp and profile:
            live = await _fetch_live_painting(profile, preferred_movement=preferred)
            if live:
                painting_resp = PaintingResponse(
                    id=0, created_at=datetime.now(), **live,
                )

        if painting_resp:
            _today_painting_cache.clear()
            _today_painting_cache[today_str] = painting_resp

    # 5. Fall back to seeded DB painting
    if painting_resp is None:
        canvas = await _get_canvas_for_date(today, db)
        if canvas.painting is None and canvas.novel_page is None and canvas.literature is None:
            most_recent = await db.execute(
                select(Painting.display_date)
                .where(Painting.display_date <= today)
                .order_by(Painting.display_date.desc())
                .limit(1)
            )
            recent_date = most_recent.scalar_one_or_none()
            if recent_date is None:
                raise HTTPException(status_code=404, detail="No content available yet.")
            canvas = await _get_canvas_for_date(recent_date, db)
        painting_resp = canvas.painting

    # Novel and literature: fetch in parallel
    live_lit, live_novel = await asyncio.gather(
        _fetch_live_literature(profile),
        _fetch_live_novel(profile),
    )

    if live_lit:
        lit_resp = LiteratureHighlightResponse(**live_lit)
    else:
        all_lit = (await db.execute(select(LiteratureHighlight))).scalars().all()
        literature = _pick_best(all_lit, profile, "literature") if all_lit else None
        lit_resp = LiteratureHighlightResponse.model_validate(literature) if literature else None

    if live_novel:
        novel_resp = NovelPageResponse(**live_novel)
    else:
        all_novels = (await db.execute(select(NovelPage))).scalars().all()
        novel = _pick_best(all_novels, profile, "novel") if all_novels else None
        novel_resp = NovelPageResponse.model_validate(novel) if novel else None

    ai_prompt = _build_ai_prompt_from_resp(painting_resp, lit_resp)
    mood = await _generate_mood_word(painting_resp, lit_resp)

    canvas = TodayCanvas(
        date=today,
        painting=painting_resp,
        novel_page=novel_resp,
        literature=lit_resp,
        ai_prompt=ai_prompt,
        mood_word=mood,
    )

    # Save to user's canvas history
    if user_id:
        await _save_canvas_history(db, user_id, today, canvas)

    return DailyContent(canvas=canvas, message="Today's canvas is ready.")


@router.get("/date/{date_str}", response_model=DailyContent)
async def get_canvas_by_date(date_str: str, db: AsyncSession = Depends(get_db)):
    try:
        target_date = date.fromisoformat(date_str)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD.")

    canvas = await _get_canvas_for_date(target_date, db)

    if canvas.painting is None and canvas.novel_page is None and canvas.literature is None:
        raise HTTPException(
            status_code=404, detail=f"No content available for {date_str}."
        )

    return DailyContent(canvas=canvas, message=f"Canvas for {date_str}.")


@router.get("/archive", response_model=list[ArchiveDay])
async def get_archive(
    db: AsyncSession = Depends(get_db),
    user_id: Optional[str] = Depends(get_current_user_id),
):
    """Return the user's personal canvas history as their archive."""
    if user_id:
        # Per-user archive from their canvas history
        result = await db.execute(
            select(UserCanvasHistory)
            .where(UserCanvasHistory.user_id == user_id)
            .order_by(UserCanvasHistory.canvas_date.desc())
        )
        history = result.scalars().all()

        return [
            ArchiveDay(
                date=h.canvas_date,
                painting_title=h.painting_title,
                painting_artist=h.painting_artist,
                painting_image_url=h.painting_image_url,
                novel_title=h.novel_title,
                novel_page=h.novel_page,
                literature_title=h.literature_title,
                literature_author=h.literature_author,
            )
            for h in history
        ]

    # Fallback: global archive from content tables (for unauthenticated)
    today = date.today()
    painting_dates = await db.execute(
        select(
            Painting.display_date,
            Painting.title.label("painting_title"),
            Painting.artist.label("painting_artist"),
            Painting.image_url.label("painting_image_url"),
        )
        .where(Painting.display_date <= today)
        .order_by(Painting.display_date.desc())
    )
    paintings_by_date = {
        row.display_date: (row.painting_title, row.painting_artist, row.painting_image_url)
        for row in painting_dates
    }

    novel_dates = await db.execute(
        select(
            NovelPage.display_date,
            NovelPage.novel_title,
            NovelPage.page_number,
        )
        .where(NovelPage.display_date <= today)
        .order_by(NovelPage.display_date.desc())
    )
    novels_by_date = {
        row.display_date: (row.novel_title, row.page_number) for row in novel_dates
    }

    lit_dates = await db.execute(
        select(
            LiteratureHighlight.display_date,
            LiteratureHighlight.title,
            LiteratureHighlight.author,
        )
        .where(LiteratureHighlight.display_date <= today)
        .order_by(LiteratureHighlight.display_date.desc())
    )
    lits_by_date = {
        row.display_date: (row.title, row.author) for row in lit_dates
    }

    all_dates = sorted(
        set(paintings_by_date) | set(novels_by_date) | set(lits_by_date),
        reverse=True,
    )

    return [
        ArchiveDay(
            date=d,
            painting_title=(p := paintings_by_date.get(d)) and p[0],
            painting_artist=p and p[1],
            painting_image_url=p and p[2],
            novel_title=(n := novels_by_date.get(d)) and n[0],
            novel_page=n and n[1],
            literature_title=(l := lits_by_date.get(d)) and l[0],
            literature_author=l and l[1],
        )
        for d in all_dates
    ]


logger = logging.getLogger(__name__)


async def _ensure_profile_from_jwt(
    db: AsyncSession, user_id: str, jwt_payload: dict
) -> Optional[UserProfile]:
    """If no DB profile exists, auto-create one from JWT user_metadata.

    Supabase JWTs include user_metadata which the frontend stores profile
    preferences into. On iPhone Safari the fire-and-forget sync to the
    backend often fails silently, so this acts as a self-healing fallback.
    """
    meta = (jwt_payload or {}).get("user_metadata") or {}
    if not meta.get("display_name"):
        return None

    # Check if profile already exists (may have been created between queries)
    result = await db.execute(
        select(UserProfile).where(UserProfile.user_id == user_id)
    )
    existing = result.scalar_one_or_none()
    if existing:
        return existing

    profile = UserProfile(
        user_id=user_id,
        display_name=meta.get("display_name", ""),
        avatar=meta.get("avatar"),
        art_movements=meta.get("art_movements") or [],
        art_periods=meta.get("art_periods") or [],
        favorite_artists=meta.get("favorite_artists") or [],
        literary_genres=meta.get("literary_genres") or [],
        favorite_authors=meta.get("favorite_authors") or [],
        preferred_languages=meta.get("preferred_languages") or [],
        themes=meta.get("themes") or [],
        regions=meta.get("regions") or [],
    )
    db.add(profile)
    await db.flush()
    await db.refresh(profile)
    logger.info(f"Auto-created profile from JWT for user {user_id}")
    return profile


async def _fetch_from_artic(query: str) -> dict | None:
    """Fetch a PAINTING from Art Institute of Chicago API."""
    import httpx

    # Only accept actual paintings/drawings — not furniture, ceramics, etc.
    _PAINTING_TYPES = {
        "painting", "oil on canvas", "watercolor", "tempera", "drawing",
        "print", "acrylic", "gouache", "pastel", "fresco",
    }

    try:
        # Extract the movement keyword from the query for style matching
        query_words = set(w.lower() for w in query.replace(" painting", "").split())

        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(
                "https://api.artic.edu/api/v1/artworks/search",
                params={
                    "q": query + " painting",
                    "query[term][is_public_domain]": "true",
                    "fields": "id,title,artist_title,date_display,place_of_origin,"
                              "style_titles,image_id,thumbnail,artist_display,"
                              "classification_title,artwork_type_title",
                    "limit": 40,
                    "page": 1,
                },
            )
            data = resp.json()

            # Filter: must have image AND be a painting-type work
            artworks = []
            style_matched = []
            for a in data.get("data", []):
                if not a.get("image_id"):
                    continue
                art_type = (a.get("artwork_type_title") or "").lower()
                classification = (a.get("classification_title") or "").lower()
                if any(t in art_type or t in classification for t in _PAINTING_TYPES):
                    artworks.append(a)
                    # Check if style_titles contain the queried movement
                    styles_lower = set(s.lower() for s in (a.get("style_titles") or []))
                    if query_words & styles_lower:
                        style_matched.append(a)

            if not artworks:
                return None

            # Prefer paintings whose style actually matches the query
            art = random.choice(style_matched) if style_matched else random.choice(artworks)
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
                "colors": [],
                "display_date": date.today(),
            }
    except Exception as e:
        logger.warning(f"Art Institute of Chicago fetch failed: {e}")
        return None


async def _fetch_from_met(query: str) -> dict | None:
    """Fetch a PAINTING from The Metropolitan Museum of Art API."""
    import httpx

    # Departments/classifications that are actual paintings
    _PAINTING_DEPTS = {
        "european paintings", "the american wing", "asian art",
        "modern and contemporary art", "drawings and prints",
        "medieval art", "islamic art",
    }
    _EXCLUDE_TYPES = {
        "ceramics", "porcelain", "furniture", "textile", "armor",
        "silver", "glass", "jewelry", "costume", "metalwork",
        "woodwork", "basket", "vessel", "plate", "bowl", "vase",
        "cup", "jug", "ewer", "flask", "jar", "urn", "box",
    }

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            search_resp = await client.get(
                "https://collectionapi.metmuseum.org/public/collection/v1/search",
                params={"q": query + " painting", "hasImages": "true", "isPublicDomain": "true"},
            )
            search_data = search_resp.json()
            object_ids = search_data.get("objectIDs") or []
            if not object_ids:
                return None

            # Try up to 5 random objects to find an actual painting
            random.shuffle(object_ids)
            for obj_id in object_ids[:15]:
                obj_resp = await client.get(
                    f"https://collectionapi.metmuseum.org/public/collection/v1/objects/{obj_id}"
                )
                obj = obj_resp.json()

                image_url = obj.get("primaryImage") or obj.get("primaryImageSmall")
                if not image_url:
                    continue

                # Filter out non-painting objects
                classification = (obj.get("classification") or "").lower()
                department = (obj.get("department") or "").lower()
                medium = (obj.get("medium") or "").lower()
                obj_name = (obj.get("objectName") or "").lower()

                if any(ex in classification or ex in obj_name for ex in _EXCLUDE_TYPES):
                    continue

                # Prefer painting departments
                is_painting_dept = any(d in department for d in _PAINTING_DEPTS)
                is_painting_medium = any(m in medium for m in ["oil", "canvas", "watercolor", "tempera", "gouache", "pastel", "acrylic"])
                is_painting_type = "painting" in classification or "painting" in obj_name or "drawing" in classification

                if not (is_painting_dept or is_painting_medium or is_painting_type):
                    continue

                return {
                    "title": obj.get("title", "Untitled"),
                    "artist": obj.get("artistDisplayName") or "Unknown",
                    "year": obj.get("objectDate") or "Unknown",
                    "origin_country": obj.get("country") or obj.get("culture") or "Unknown",
                    "movement": obj.get("classification") or obj.get("department") or "Fine Art",
                    "image_url": image_url,
                    "description": obj.get("medium") or "",
                    "artist_bio": obj.get("artistDisplayBio") or "",
                    "colors": [],
                    "display_date": date.today(),
                }

            return None
    except Exception as e:
        logger.warning(f"Met Museum fetch failed: {e}")
        return None


async def _fetch_live_painting(profile, preferred_movement: str | None = None) -> dict | None:
    """Fetch a random painting from AIC or the Met, guided by user profile.

    When *preferred_movement* is given, always use that as the primary query
    (passed from the caller's rotation logic).
    """
    secondary = []
    if profile:
        if profile.regions:
            region_art = {
                "Latin America": ["Latin American art", "Mexican art", "Colombian art"],
                "Caribbean": ["Caribbean art", "Cuban art"],
                "East Asia": ["Japanese art", "Chinese painting"],
                "South Asia": ["Indian art", "Mughal painting"],
                "Middle East": ["Islamic art", "Persian art"],
                "Western Europe": ["European painting", "French art"],
                "Eastern Europe": ["Russian art"],
                "Scandinavia": ["Nordic art"],
                "Mediterranean": ["Italian art", "Greek art"],
            }
            for r in profile.regions:
                matches = region_art.get(r, [r + " art"])
                secondary.extend(matches)
        if profile.themes:
            secondary.extend(profile.themes)

    if preferred_movement:
        query = preferred_movement
    elif profile and profile.art_movements:
        query = random.choice(profile.art_movements)
    else:
        query = random.choice(["Surrealism", "Impressionism", "Renaissance", "Expressionism"])

    logger.info(f"Live API query: '{query}'")

    if secondary and random.random() < 0.5:
        query += " " + random.choice(secondary)

    # Randomly pick a source for variety
    sources = [_fetch_from_artic, _fetch_from_met]
    random.shuffle(sources)

    for fetch_fn in sources:
        result = await fetch_fn(query)
        if result:
            return result

    return None


# ══════════════════════════════════════════════════════════
#   LIVE POETRY — PoetryDB
# ══════════════════════════════════════════════════════════

# Map user preferences → PoetryDB-compatible poet names
_POETS_BY_THEME = {
    "mythology": ["John Keats", "Percy Bysshe Shelley", "Alfred Lord Tennyson", "William Butler Yeats", "William Morris"],
    "philosophy": ["Walt Whitman", "William Blake", "Emily Dickinson", "Ralph Waldo Emerson", "John Milton"],
    "beauty": ["John Keats", "William Shakespeare", "William Butler Yeats", "Christina Rossetti", "Elizabeth Barrett Browning"],
    "love": ["William Shakespeare", "Elizabeth Barrett Browning", "Emily Dickinson", "Edgar Allan Poe", "Christina Rossetti"],
    "nature": ["William Wordsworth", "Robert Frost", "Walt Whitman", "Percy Bysshe Shelley", "John Keats"],
    "time": ["William Shakespeare", "John Keats", "Percy Bysshe Shelley", "Robert Frost", "Andrew Marvell"],
    "death": ["Emily Dickinson", "John Keats", "Edgar Allan Poe", "Dylan Thomas", "Walt Whitman"],
    "war": ["Wilfred Owen", "Siegfried Sassoon", "Walt Whitman", "Rupert Brooke"],
    "spirituality": ["William Blake", "John Milton", "George Herbert", "Gerard Manley Hopkins"],
    "solitude": ["Emily Dickinson", "Robert Frost", "Walt Whitman", "William Wordsworth"],
    "freedom": ["Walt Whitman", "William Blake", "Percy Bysshe Shelley", "Langston Hughes"],
    "dreams": ["Edgar Allan Poe", "William Butler Yeats", "Samuel Taylor Coleridge", "John Keats"],
}

_POETS_BY_REGION = {
    "Western Europe": ["William Shakespeare", "John Keats", "Percy Bysshe Shelley", "William Wordsworth",
                        "Lord Byron", "William Blake", "Alfred Lord Tennyson", "Robert Browning",
                        "Elizabeth Barrett Browning", "Christina Rossetti", "Gerard Manley Hopkins",
                        "Dylan Thomas", "Wilfred Owen", "W. H. Auden"],
    "North America": ["Walt Whitman", "Emily Dickinson", "Robert Frost", "Edgar Allan Poe",
                       "Langston Hughes", "Ralph Waldo Emerson", "Henry Wadsworth Longfellow",
                       "Carl Sandburg", "E. E. Cummings"],
    "Eastern Europe": ["Alexander Pushkin"],
}

_POETS_BY_GENRE = {
    "poetry": None,  # all poets
    "philosophy": ["Walt Whitman", "William Blake", "Ralph Waldo Emerson", "Emily Dickinson", "John Milton"],
    "mysticism": ["William Blake", "John Milton", "George Herbert", "Gerard Manley Hopkins"],
    "romanticism": ["John Keats", "Percy Bysshe Shelley", "William Wordsworth", "Lord Byron", "Samuel Taylor Coleridge"],
}

_POET_COUNTRIES = {
    "William Shakespeare": "England", "John Keats": "England", "Percy Bysshe Shelley": "England",
    "William Wordsworth": "England", "Lord Byron": "England", "William Blake": "England",
    "Alfred Lord Tennyson": "England", "Robert Browning": "England", "Gerard Manley Hopkins": "England",
    "Elizabeth Barrett Browning": "England", "Christina Rossetti": "England", "Wilfred Owen": "England",
    "Siegfried Sassoon": "England", "Rupert Brooke": "England", "W. H. Auden": "England",
    "Andrew Marvell": "England", "George Herbert": "England", "William Morris": "England",
    "Dylan Thomas": "Wales", "Samuel Taylor Coleridge": "England",
    "Walt Whitman": "United States", "Emily Dickinson": "United States", "Robert Frost": "United States",
    "Edgar Allan Poe": "United States", "Langston Hughes": "United States",
    "Ralph Waldo Emerson": "United States", "Henry Wadsworth Longfellow": "United States",
    "Carl Sandburg": "United States", "E. E. Cummings": "United States",
    "William Butler Yeats": "Ireland", "John Milton": "England",
    "Alexander Pushkin": "Russia",
}

# Track recently served poems to avoid repeats
_recent_poems: list[str] = []

async def _fetch_live_literature(profile) -> Optional[dict]:
    """Fetch a poem from PoetryDB, guided by user profile."""
    import httpx

    # Build a list of candidate poets from user preferences
    candidates = set()
    if profile:
        for theme in (profile.themes or []):
            candidates.update(_POETS_BY_THEME.get(theme.lower(), []))
        for region in (profile.regions or []):
            candidates.update(_POETS_BY_REGION.get(region, []))
        for genre in (profile.literary_genres or []):
            poets = _POETS_BY_GENRE.get(genre.lower())
            if poets:
                candidates.update(poets)

    if not candidates:
        # Default: a good mix of major poets
        candidates = {"William Shakespeare", "John Keats", "Emily Dickinson",
                      "Walt Whitman", "Robert Frost", "William Butler Yeats",
                      "Percy Bysshe Shelley", "William Wordsworth", "Edgar Allan Poe"}

    poet = random.choice(list(candidates))
    logger.info(f"Live poetry: trying '{poet}' from PoetryDB")

    try:
        async with httpx.AsyncClient(timeout=8) as client:
            # Fetch poems by this poet
            resp = await client.get(f"https://poetrydb.org/author/{poet}/title,author,lines,linecount")
            if resp.status_code != 200:
                logger.warning(f"PoetryDB returned {resp.status_code} for '{poet}'")
                return None

            poems = resp.json()
            if isinstance(poems, dict) and poems.get("status") == 404:
                return None
            if not poems:
                return None

            # Filter: prefer poems 4-40 lines (not too short, not epic-length)
            good_poems = [p for p in poems if 4 <= int(p.get("linecount", 0)) <= 40]
            if not good_poems:
                good_poems = poems

            # Avoid recently shown
            fresh = [p for p in good_poems if p["title"] not in _recent_poems]
            if not fresh:
                fresh = good_poems

            poem = random.choice(fresh)

            # Track it
            _recent_poems.append(poem["title"])
            if len(_recent_poems) > 30:
                _recent_poems.pop(0)

            content = "\n".join(poem.get("lines", []))
            country = _POET_COUNTRIES.get(poem["author"], "Unknown")

            logger.info(f"Live poetry: got '{poem['title']}' by {poem['author']}")

            return {
                "title": poem["title"],
                "author": poem["author"],
                "author_country": country,
                "genre": "poetry",
                "content": content,
                "original_language": "English",
                "original_text": None,
                "display_date": date.today(),
                "id": 0,
                "created_at": datetime.now(),
            }

    except Exception as e:
        logger.warning(f"PoetryDB fetch failed: {e}")
        return None


# ══════════════════════════════════════════════════════════
#   LIVE NOVELS — Project Gutenberg
# ══════════════════════════════════════════════════════════

# Curated list of great public-domain novels on Project Gutenberg
_GUTENBERG_NOVELS = [
    # Western Europe
    {"id": 1342, "title": "Pride and Prejudice", "author": "Jane Austen", "country": "England", "themes": ["love", "beauty"], "genres": ["romanticism"], "region": "Western Europe"},
    {"id": 1260, "title": "Jane Eyre", "author": "Charlotte Brontë", "country": "England", "themes": ["love", "freedom"], "genres": ["romanticism"], "region": "Western Europe"},
    {"id": 768, "title": "Wuthering Heights", "author": "Emily Brontë", "country": "England", "themes": ["love", "nature", "death"], "genres": ["romanticism"], "region": "Western Europe"},
    {"id": 174, "title": "The Picture of Dorian Gray", "author": "Oscar Wilde", "country": "Ireland", "themes": ["beauty", "philosophy", "time"], "genres": ["philosophy"], "region": "Western Europe"},
    {"id": 98, "title": "A Tale of Two Cities", "author": "Charles Dickens", "country": "England", "themes": ["war", "freedom"], "genres": ["realism"], "region": "Western Europe"},
    {"id": 1400, "title": "Great Expectations", "author": "Charles Dickens", "country": "England", "themes": ["dreams", "love"], "genres": ["realism"], "region": "Western Europe"},
    {"id": 84, "title": "Frankenstein", "author": "Mary Shelley", "country": "England", "themes": ["philosophy", "death", "solitude"], "genres": ["romanticism"], "region": "Western Europe"},
    {"id": 345, "title": "Dracula", "author": "Bram Stoker", "country": "Ireland", "themes": ["death", "dreams"], "genres": ["gothic"], "region": "Western Europe"},
    {"id": 135, "title": "Les Misérables", "author": "Victor Hugo", "country": "France", "themes": ["freedom", "love", "war"], "genres": ["romanticism"], "region": "Western Europe"},
    {"id": 1184, "title": "The Count of Monte Cristo", "author": "Alexandre Dumas", "country": "France", "themes": ["freedom", "time"], "genres": ["romanticism"], "region": "Western Europe"},
    {"id": 2413, "title": "Madame Bovary", "author": "Gustave Flaubert", "country": "France", "themes": ["love", "beauty", "dreams"], "genres": ["realism"], "region": "Western Europe"},
    {"id": 5200, "title": "Metamorphosis", "author": "Franz Kafka", "country": "Austria-Hungary", "themes": ["solitude", "philosophy"], "genres": ["philosophy"], "region": "Western Europe"},
    # Eastern Europe
    {"id": 2554, "title": "Crime and Punishment", "author": "Fyodor Dostoevsky", "country": "Russia", "themes": ["philosophy", "death"], "genres": ["philosophy"], "region": "Eastern Europe"},
    {"id": 28054, "title": "The Brothers Karamazov", "author": "Fyodor Dostoevsky", "country": "Russia", "themes": ["philosophy", "spirituality"], "genres": ["philosophy"], "region": "Eastern Europe"},
    {"id": 2600, "title": "War and Peace", "author": "Leo Tolstoy", "country": "Russia", "themes": ["war", "love", "time"], "genres": ["realism"], "region": "Eastern Europe"},
    {"id": 1399, "title": "Anna Karenina", "author": "Leo Tolstoy", "country": "Russia", "themes": ["love", "beauty"], "genres": ["realism"], "region": "Eastern Europe"},
    {"id": 600, "title": "Notes from Underground", "author": "Fyodor Dostoevsky", "country": "Russia", "themes": ["philosophy", "solitude"], "genres": ["philosophy"], "region": "Eastern Europe"},
    # North America
    {"id": 2701, "title": "Moby Dick", "author": "Herman Melville", "country": "United States", "themes": ["nature", "philosophy", "solitude"], "genres": ["romanticism"], "region": "North America"},
    {"id": 76, "title": "Adventures of Huckleberry Finn", "author": "Mark Twain", "country": "United States", "themes": ["freedom", "nature"], "genres": ["realism"], "region": "North America"},
    {"id": 25344, "title": "The Scarlet Letter", "author": "Nathaniel Hawthorne", "country": "United States", "themes": ["love", "spirituality"], "genres": ["romanticism"], "region": "North America"},
    {"id": 514, "title": "Little Women", "author": "Louisa May Alcott", "country": "United States", "themes": ["love", "dreams", "beauty"], "genres": ["realism"], "region": "North America"},
    {"id": 1322, "title": "Leaves of Grass", "author": "Walt Whitman", "country": "United States", "themes": ["nature", "freedom", "spirituality"], "genres": ["poetry"], "region": "North America"},
    # Classics / Mediterranean
    {"id": 1727, "title": "The Odyssey", "author": "Homer", "country": "Greece", "themes": ["mythology", "nature", "war"], "genres": ["mythology"], "region": "Mediterranean"},
    {"id": 6130, "title": "The Iliad", "author": "Homer", "country": "Greece", "themes": ["war", "mythology", "death"], "genres": ["mythology"], "region": "Mediterranean"},
    {"id": 8800, "title": "The Divine Comedy", "author": "Dante Alighieri", "country": "Italy", "themes": ["spirituality", "love", "mythology"], "genres": ["mysticism"], "region": "Mediterranean"},
    # East Asia
    {"id": 2500, "title": "Siddhartha", "author": "Hermann Hesse", "country": "Germany", "themes": ["philosophy", "spirituality", "nature"], "genres": ["philosophy", "mysticism"], "region": "South Asia"},
    # Middle East
    {"id": 3608, "title": "The Rubaiyat of Omar Khayyam", "author": "Omar Khayyám", "country": "Persia", "themes": ["philosophy", "beauty", "time"], "genres": ["poetry", "philosophy", "mysticism"], "region": "Middle East"},
    {"id": 34206, "title": "One Thousand and One Nights", "author": "Anonymous", "country": "Middle East", "themes": ["mythology", "love", "dreams"], "genres": ["mythology"], "region": "Middle East"},
]

# In-memory cache: gutenberg_id → cleaned text
_gutenberg_cache: dict[int, str] = {}
_recent_novels: list[str] = []


def _strip_gutenberg(full_text: str) -> str:
    """Strip Gutenberg headers/footers, normalize line endings, return book content."""
    # Normalize \r\n → \n (many Gutenberg texts use Windows line endings)
    full_text = full_text.replace('\r\n', '\n')

    start_idx = 0
    for marker in ["*** START OF THE PROJECT", "*** START OF THIS PROJECT", "***START OF"]:
        pos = full_text.find(marker)
        if pos != -1:
            start_idx = full_text.index('\n', pos) + 1
            break

    end_idx = len(full_text)
    for marker in ["*** END OF THE PROJECT", "*** END OF THIS PROJECT", "***END OF"]:
        pos = full_text.find(marker)
        if pos != -1:
            end_idx = pos
            break

    return full_text[start_idx:end_idx].strip()


def _get_candidate_chunk(content: str, chunk_words: int = 1500) -> str:
    """Pick a random ~1500-word chunk from the book's middle to send to AI."""
    paragraphs = [p.strip() for p in content.split('\n\n') if p.strip()]

    # Filter out obvious junk: TOC, headings, very short lines
    good = []
    for p in paragraphs:
        cleaned = ' '.join(p.split())
        words = cleaned.split()
        if len(words) < 10:
            continue
        upper = cleaned.upper()
        if upper.startswith(("CHAPTER", "PART ", "BOOK ", "VOLUME", "TABLE OF",
                             "CONTENTS", "PREFACE", "INTRODUCTION", "FOOTNOTE",
                             "ILLUSTRATION", "TRANSCRIBER")):
            continue
        # Skip lines that are mostly uppercase (headings)
        if len(cleaned) > 5 and sum(1 for c in cleaned if c.isupper()) / len(cleaned) > 0.6:
            continue
        good.append(cleaned)

    if not good:
        return ""

    # Skip first 10% and last 10% (preface, appendix, index)
    margin = max(1, len(good) * 10 // 100)
    body = good[margin : len(good) - margin]
    if not body:
        body = good

    # Pick a random starting point and collect ~chunk_words
    idx = random.randint(0, max(0, len(body) - 1))
    parts = []
    wc = 0
    for p in body[idx:]:
        parts.append(p)
        wc += len(p.split())
        if wc >= chunk_words:
            break

    return '\n\n'.join(parts)


async def _ai_select_passage(chunk: str, book_title: str, author: str) -> Optional[str]:
    """Use Claude to select the most beautiful passage from a raw text chunk."""
    from app.core.config import settings

    if not settings.ANTHROPIC_API_KEY:
        return None

    try:
        import anthropic

        client = _get_anthropic()
        if not client:
            return None
        message = await client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=600,
            messages=[{
                "role": "user",
                "content": f"""From this excerpt of "{book_title}" by {author}, select the most beautiful, evocative, and self-contained passage. Pick 2-3 consecutive paragraphs that a reader would find captivating — rich prose, vivid imagery, emotional depth, or a memorable scene.

Rules:
- Return ONLY the passage text, nothing else — no intro, no commentary, no quotation marks around it
- Keep it 150-250 words
- It must be actual text from the excerpt, not paraphrased
- Pick prose that stands on its own — a reader should enjoy it without needing context
- Avoid dialogue-heavy sections unless exceptionally beautiful
- Prefer descriptive, reflective, or emotionally resonant passages

Excerpt:
{chunk[:4000]}"""
            }],
        )
        result = message.content[0].text.strip()
        # Sanity check: AI should return actual prose, not meta-commentary
        if len(result.split()) < 40 or result.startswith(("I ", "Here ", "This ", "The passage")):
            return None
        return result

    except Exception as e:
        logger.warning(f"AI passage selection failed: {e}")
        return None


def _extract_passage_fallback(content: str, target_words: int = 200) -> str:
    """Fallback: extract a passage without AI. Better filtering than before."""
    paragraphs = [p.strip() for p in content.split('\n\n') if p.strip()]

    good = []
    for p in paragraphs:
        cleaned = ' '.join(p.split())
        words = cleaned.split()
        if len(words) < 20:
            continue
        upper = cleaned.upper()
        if upper.startswith(("CHAPTER", "PART ", "BOOK ", "VOLUME", "TABLE OF",
                             "CONTENTS", "PREFACE", "INTRODUCTION")):
            continue
        if len(cleaned) > 5 and sum(1 for c in cleaned if c.isupper()) / len(cleaned) > 0.5:
            continue
        # Must have proper sentences (periods)
        if cleaned.count('.') < 2:
            continue
        good.append(cleaned)

    if not good:
        return ""

    margin = max(1, len(good) * 10 // 100)
    body = good[margin : len(good) - margin] or good

    idx = random.randint(0, max(0, len(body) - 1))

    parts = []
    word_count = 0
    for p in body[idx : idx + 3]:
        p_words = len(p.split())
        if word_count + p_words > target_words and parts:
            break
        parts.append(p)
        word_count += p_words

    return '\n\n'.join(parts)


async def _fetch_live_novel(profile) -> Optional[dict]:
    """Fetch a novel passage from Project Gutenberg, guided by user profile."""
    import httpx

    # Score novels by profile match — region is strongest signal
    scored = []
    user_regions = set(r for r in (profile.regions or [])) if profile else set()

    for novel in _GUTENBERG_NOVELS:
        score = random.random() * 0.5  # Base randomness
        if profile:
            for theme in (profile.themes or []):
                if theme.lower() in novel["themes"]:
                    score += 2
            for genre in (profile.literary_genres or []):
                if genre.lower() in novel["genres"]:
                    score += 3
            # Region is the strongest signal — user explicitly chose it
            if novel["region"] in user_regions:
                score += 5
        # Boost cached novels (instant, no download needed)
        if novel["id"] in _gutenberg_cache:
            score += 2
        # Penalize recently shown
        if novel["title"] in _recent_novels:
            score -= 10
        scored.append((score, novel))

    scored.sort(key=lambda x: -x[0])

    # Pick from top 5 candidates
    top = scored[:5]
    chosen = random.choice(top)[1]

    logger.info(f"Live novel: trying '{chosen['title']}' (Gutenberg #{chosen['id']})")

    try:
        # Check cache first
        gid = chosen["id"]
        if gid not in _gutenberg_cache:
            async with httpx.AsyncClient(timeout=6, follow_redirects=True) as client:
                # Try UTF-8 plain text first
                for url in [
                    f"https://www.gutenberg.org/cache/epub/{gid}/pg{gid}.txt",
                    f"https://www.gutenberg.org/files/{gid}/{gid}-0.txt",
                ]:
                    resp = await client.get(url)
                    if resp.status_code == 200 and len(resp.text) > 1000:
                        _gutenberg_cache[gid] = resp.text.replace('\r\n', '\n')
                        break

            if gid not in _gutenberg_cache:
                logger.warning(f"Could not fetch Gutenberg text for #{gid}")
                return None

        raw = _gutenberg_cache[gid]
        content = _strip_gutenberg(raw)
        if not content:
            return None

        # Use rule-based extraction (instant, no API call)
        # The fallback produces good paragraphs now that \r\n is normalized
        passage = _extract_passage_fallback(content)

        if not passage or len(passage.split()) < 40:
            logger.warning(f"Poor passage extracted from '{chosen['title']}'")
            return None

        # Safety: reject if passage is way too long (something went wrong)
        if len(passage.split()) > 400:
            logger.warning(f"Passage too long ({len(passage.split())} words) from '{chosen['title']}', discarding")
            return None

        # Track it
        _recent_novels.append(chosen["title"])
        if len(_recent_novels) > 15:
            _recent_novels.pop(0)

        # Calculate approximate page info
        full_len = len(content.split())
        passage_start = content.find(passage[:60])
        approx_page = max(1, int((passage_start / max(1, len(content))) * (full_len // 250)))
        total_pages = max(1, full_len // 250)

        logger.info(f"Live novel: got passage from '{chosen['title']}' (~p{approx_page}/{total_pages})")

        return {
            "novel_title": chosen["title"],
            "author": chosen["author"],
            "author_country": chosen["country"],
            "page_number": approx_page,
            "total_pages": total_pages,
            "content": passage,
            "display_date": date.today(),
            "id": 0,
            "created_at": datetime.now(),
        }

    except Exception as e:
        logger.warning(f"Gutenberg fetch failed: {e}")
        return None


@router.get("/gallery")
async def get_gallery(count: int = 100):
    """Return random paintings from the local collection for the gallery view."""
    import json
    from pathlib import Path

    catalog_path = Path(__file__).resolve().parents[4] / "paintings-collection" / "catalog.json"
    if not catalog_path.exists():
        return []

    try:
        with open(catalog_path) as f:
            catalog = json.load(f)
    except Exception:
        return []

    paintings = catalog.get("paintings", [])
    # Filter to paintings that have image files
    valid = [p for p in paintings if (catalog_path.parent / p["file"]).exists()]
    sample = random.sample(valid, min(count, len(valid)))

    return [
        {
            "title": p["title"],
            "artist": p["artist"],
            "year": p.get("year", "Unknown"),
            "movement": p.get("movement", ""),
            "category": p.get("category", ""),
            "origin_country": p.get("origin_country", "Unknown"),
            "image_url": f"/collection/{p['file']}",
        }
        for p in sample
    ]


@router.post("/curate")
async def curate_canvas(db: AsyncSession = Depends(get_db)):
    """Use Claude to curate 7 days of profile-based paintings from AIC & Met."""
    from app.services.curator import curate_paintings
    result = await curate_paintings(db)
    return result


@router.post("/collect")
async def collect_paintings():
    """Bulk-download ~500 famous paintings into categorized local collection."""
    from app.services.bulk_curator import bulk_collect_paintings
    result = await bulk_collect_paintings(target=500)
    return result


@router.post("/collect-wiki")
async def collect_wiki_paintings():
    """Collect 1000+ famous paintings from Wikimedia Commons."""
    from app.services.wiki_collector import collect_from_wikimedia
    result = await collect_from_wikimedia(target=1000)
    return result


@router.get("/refresh", response_model=DailyContent)
async def refresh_canvas(
    db: AsyncSession = Depends(get_db),
    user_id: Optional[str] = Depends(get_current_user_id),
    jwt_payload: Optional[dict] = Depends(get_jwt_payload),
):
    """Fetch a fresh painting — rotate through user's movements each refresh."""
    global _last_movement_index

    if user_id:
        profile_result = await db.execute(
            select(UserProfile).where(UserProfile.user_id == user_id)
        )
        profile = profile_result.scalar_one_or_none()
        if not profile and jwt_payload:
            profile = await _ensure_profile_from_jwt(db, user_id, jwt_payload)
    else:
        profile_result = await db.execute(select(UserProfile).limit(1))
        profile = profile_result.scalar_one_or_none()

    # Pick the next movement in rotation
    preferred = None
    if profile and profile.art_movements:
        idx = _last_movement_index % len(profile.art_movements)
        preferred = profile.art_movements[idx]
        _last_movement_index = idx + 1
        logger.info(f"Refresh: trying movement '{preferred}' ({idx+1}/{len(profile.art_movements)})")

    # ── Phase 1: Fetch all content in parallel ──
    async def _get_painting():
        if profile:
            match = _find_in_collection(profile, preferred_movement=preferred)
            if match:
                return match
        return await _fetch_live_painting(profile, preferred_movement=preferred)

    live_painting, live_lit, live_novel = await asyncio.gather(
        _get_painting(),
        _fetch_live_literature(profile),
        _fetch_live_novel(profile),
    )

    # Resolve literature
    if live_lit:
        literature = LiteratureHighlightResponse(**live_lit)
    else:
        all_lit = (await db.execute(select(LiteratureHighlight))).scalars().all()
        lit_obj = _pick_best(all_lit, profile, "literature") if all_lit else None
        literature = LiteratureHighlightResponse.model_validate(lit_obj) if lit_obj else None

    # Resolve novel
    if live_novel:
        novel = NovelPageResponse(**live_novel)
    else:
        all_novels = (await db.execute(select(NovelPage))).scalars().all()
        novel_obj = _pick_best(all_novels, profile, "novel") if all_novels else None
        novel = NovelPageResponse.model_validate(novel_obj) if novel_obj else None

    # Resolve painting
    if live_painting:
        painting_resp = PaintingResponse(
            id=0,
            created_at=datetime.now(),
            **live_painting,
        )
    else:
        all_paintings = (await db.execute(select(Painting))).scalars().all()
        p = random.choice(all_paintings) if all_paintings else None
        painting_resp = PaintingResponse.model_validate(p) if p else None

    # ── Phase 2: AI generation in parallel (both Haiku for speed) ──
    ai_prompt = _build_ai_prompt_from_resp(painting_resp, literature)
    ai_poem, mood = await asyncio.gather(
        _generate_poem_from_resp(painting_resp, literature, profile, fast=True),
        _generate_mood_word(painting_resp, literature),
    )

    canvas = TodayCanvas(
        date=date.today(),
        painting=painting_resp,
        novel_page=novel,
        literature=literature,
        ai_prompt=ai_poem if ai_poem else ai_prompt,
        mood_word=mood,
    )

    # Save/update user's canvas history
    if user_id:
        await _save_canvas_history(db, user_id, date.today(), canvas)

    # Pre-warm: fetch next Gutenberg texts in background so next refresh is faster
    asyncio.create_task(_prewarm_gutenberg_cache())

    return DailyContent(canvas=canvas, message="A fresh canvas, curated for you.")


async def _prewarm_gutenberg_cache():
    """Background task: pre-fetch 2-3 Gutenberg texts that aren't cached yet."""
    import httpx
    try:
        uncached = [n for n in _GUTENBERG_NOVELS if n["id"] not in _gutenberg_cache]
        if not uncached:
            return
        targets = random.sample(uncached, min(3, len(uncached)))
        async with httpx.AsyncClient(timeout=15, follow_redirects=True) as client:
            for novel in targets:
                gid = novel["id"]
                for url in [
                    f"https://www.gutenberg.org/cache/epub/{gid}/pg{gid}.txt",
                    f"https://www.gutenberg.org/files/{gid}/{gid}-0.txt",
                ]:
                    try:
                        resp = await client.get(url)
                        if resp.status_code == 200 and len(resp.text) > 1000:
                            _gutenberg_cache[gid] = resp.text.replace('\r\n', '\n')
                            logger.info(f"Pre-warmed Gutenberg #{gid} ({novel['title']})")
                            break
                    except Exception:
                        pass
    except Exception as e:
        logger.debug(f"Pre-warm failed: {e}")


async def _generate_mood_word(painting, literature) -> Optional[str]:
    """Use Claude to generate a single evocative mood word for today's pairing."""
    from app.core.config import settings

    if not settings.ANTHROPIC_API_KEY or not painting:
        return None

    try:
        import anthropic

        lit_ctx = ""
        if literature:
            lit_ctx = f' and the literary work "{literature.title}" by {literature.author} ({literature.genre})'

        client = _get_anthropic()
        if not client:
            return None
        message = await client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=20,
            messages=[{
                "role": "user",
                "content": (
                    f'Look at the painting "{painting.title}" by {painting.artist} '
                    f"({painting.year}, {painting.movement}){lit_ctx}. "
                    f"Reply with exactly ONE word that captures the emotional essence "
                    f"of this pairing. The word should be evocative, poetic, unexpected — "
                    f"not obvious like 'beauty' or 'art'. Just the word, nothing else."
                ),
            }],
        )
        word = message.content[0].text.strip().strip(".").strip('"').strip("'")
        # Ensure it's actually one word
        if " " not in word and len(word) < 30:
            return word.lower()
        return word.split()[0].lower()
    except Exception as e:
        logger.warning(f"Mood word generation failed: {e}")
        return None


def _build_ai_prompt_from_resp(painting, literature) -> str:
    parts = []
    if painting:
        parts.append(
            f'Today\'s painting is "{painting.title}" by {painting.artist} '
            f"({painting.year}), {painting.movement} from {painting.origin_country}."
        )
    if literature:
        parts.append(
            f'The literary highlight is "{literature.title}" by {literature.author}, '
            f"a {literature.genre} from {literature.author_country}."
        )
    if parts:
        return " ".join(parts) + " What connections do you see between today's art and literature?"
    return "Welcome to Dastan."


async def _generate_poem_from_resp(painting, literature, profile, fast: bool = False) -> Optional[str]:
    from app.core.config import settings

    if not settings.ANTHROPIC_API_KEY or not painting:
        return None

    try:
        import anthropic

        prefs = ""
        if profile and profile.themes:
            prefs = f"\n\nThe reader's interests: {', '.join(profile.themes)}."

        lit_ctx = ""
        if literature:
            lit_ctx = f'\nLiterature: "{literature.title}" by {literature.author}'

        # Use Haiku for refresh (fast=True) — 3x faster, still quality poetry
        model = "claude-haiku-4-5-20251001" if fast else "claude-sonnet-4-20250514"

        client = _get_anthropic()
        if not client:
            return None
        message = await client.messages.create(
            model=model,
            max_tokens=300,
            messages=[{
                "role": "user",
                "content": (
                    f'Write a short poem (6-12 lines) inspired by "{painting.title}" '
                    f"by {painting.artist} ({painting.year}), {painting.movement} "
                    f"from {painting.origin_country}.{lit_ctx}{prefs}\n\n"
                    f"Be evocative, specific. No title — just the poem."
                ),
            }],
        )
        return message.content[0].text
    except Exception as e:
        logger.warning(f"Poem generation failed: {e}")
        return None


async def _save_canvas_history(
    db: AsyncSession, user_id: str, canvas_date: date, canvas: TodayCanvas
):
    """Save or update the user's canvas history for a given date."""
    from sqlalchemy import and_

    # Check if we already have an entry for this user+date
    existing = await db.execute(
        select(UserCanvasHistory).where(
            and_(
                UserCanvasHistory.user_id == user_id,
                UserCanvasHistory.canvas_date == canvas_date,
            )
        )
    )
    entry = existing.scalars().first()

    p = canvas.painting
    n = canvas.novel_page
    l = canvas.literature

    if entry:
        # Update existing entry (e.g. after refresh)
        entry.painting_title = p.title if p else None
        entry.painting_artist = p.artist if p else None
        entry.painting_image_url = p.image_url if p else None
        entry.painting_year = p.year if p else None
        entry.painting_movement = p.movement if p else None
        entry.novel_title = n.novel_title if n else None
        entry.novel_author = n.author if n else None
        entry.novel_page = n.page_number if n else None
        entry.literature_title = l.title if l else None
        entry.literature_author = l.author if l else None
        entry.literature_genre = l.genre if l else None
        entry.mood_word = canvas.mood_word
    else:
        # Create new entry
        entry = UserCanvasHistory(
            user_id=user_id,
            canvas_date=canvas_date,
            painting_title=p.title if p else None,
            painting_artist=p.artist if p else None,
            painting_image_url=p.image_url if p else None,
            painting_year=p.year if p else None,
            painting_movement=p.movement if p else None,
            novel_title=n.novel_title if n else None,
            novel_author=n.author if n else None,
            novel_page=n.page_number if n else None,
            literature_title=l.title if l else None,
            literature_author=l.author if l else None,
            literature_genre=l.genre if l else None,
            mood_word=canvas.mood_word,
        )
        db.add(entry)
    await db.flush()


# Map user-facing literary genre names to DB genres (poem, prose, mysticism).
# Each profile genre maps to a list of DB genres it should match.
_LITERARY_GENRE_TO_DB = {
    "poetry": ["poem"],
    "magical realism": ["prose"],
    "philosophy": ["prose", "mysticism"],
    "gothic fiction": ["prose"],
    "existentialism": ["prose"],
    "romanticism": ["poem", "prose"],
    "epic": ["poem", "prose"],
    "memoir": ["prose"],
    "short stories": ["prose"],
    "drama": ["prose", "poem"],
    "satire": ["prose"],
    "fable": ["prose"],
    "literary fiction": ["prose"],
    "historical fiction": ["prose"],
    "mysticism": ["mysticism", "poem"],
}


def _genre_matches(profile_genre: str, db_genre: str) -> bool:
    """Check if a user-facing literary genre matches a DB genre."""
    pg = profile_genre.lower()
    dg = db_genre.lower()
    # Direct substring match (covers exact and partial)
    if pg in dg or dg in pg:
        return True
    # Alias map
    return dg in _LITERARY_GENRE_TO_DB.get(pg, [])


def _pick_best(items, profile, content_type: str):
    """Pick an item that best matches the user's profile preferences."""
    if not items:
        return None
    if not profile:
        return random.choice(items)

    scored = []
    for item in items:
        score = 0
        if content_type == "painting":
            if profile.art_movements:
                movement_lower = (item.movement or "").lower()
                for mov in profile.art_movements:
                    if mov.lower() in movement_lower:
                        score += 3
            if profile.regions:
                country = (item.origin_country or "").lower()
                for region in profile.regions:
                    if _region_matches_country(region.lower(), country):
                        score += 2
        elif content_type == "novel":
            # Match on region
            country = (item.author_country or "").lower()
            for region in (profile.regions or []):
                if _region_matches_country(region.lower(), country):
                    score += 2
            # Match on favorite authors
            author_lower = (item.author or "").lower()
            for fav in (profile.favorite_authors or []):
                if fav.lower() in author_lower or author_lower in fav.lower():
                    score += 5
            # Match on themes in content
            content_lower = (item.content or "").lower()
            for theme in (profile.themes or []):
                if theme.lower() in content_lower:
                    score += 1
            # Match novel title/content against literary genres
            title_lower = (item.novel_title or "").lower()
            for genre in (profile.literary_genres or []):
                if genre.lower() in title_lower or genre.lower() in content_lower:
                    score += 3
        elif content_type == "literature":
            # Genre matching with alias resolution
            if profile.literary_genres:
                db_genre = (item.genre or "").lower()
                for g in profile.literary_genres:
                    if _genre_matches(g, db_genre):
                        score += 3
            # Theme matching in content
            if profile.themes:
                content_lower = (item.content or "").lower()
                title_lower = (item.title or "").lower()
                for theme in profile.themes:
                    tl = theme.lower()
                    if tl in content_lower or tl in title_lower:
                        score += 1
            # Match on region
            country = (item.author_country or "").lower()
            for region in (profile.regions or []):
                if _region_matches_country(region.lower(), country):
                    score += 2
            # Match on favorite authors
            author_lower = (item.author or "").lower()
            for fav in (profile.favorite_authors or []):
                if fav.lower() in author_lower or author_lower in fav.lower():
                    score += 5
        scored.append((score, random.random(), item))  # random tiebreaker

    # Weighted random: higher-scored items are more likely but not guaranteed
    scored.sort(key=lambda x: (-x[0], x[1]))
    top = [s for s in scored if s[0] > 0]
    if not top:
        # No profile matches at all — pick randomly
        return random.choice(items)
    weights = [s[0] for s in top]
    chosen = random.choices(top, weights=weights, k=1)[0]
    return chosen[2]


def _region_matches_country(region: str, country: str) -> bool:
    """Simple mapping from region names to country substrings."""
    mapping = {
        "east asia": ["japan", "china", "korea"],
        "south asia": ["india", "bangladesh", "pakistan", "sri lanka"],
        "middle east": ["persia", "iran", "iraq", "turkey", "arab", "egypt"],
        "western europe": ["france", "germany", "netherlands", "spain", "italy",
                           "austria", "belgium", "switzerland", "uk", "britain"],
        "eastern europe": ["russia", "poland", "czech", "hungary", "romania"],
        "latin america": ["colombia", "argentina", "chile", "brazil", "mexico", "peru"],
        "north america": ["usa", "canada", "united states"],
        "scandinavia": ["norway", "sweden", "denmark", "finland", "iceland"],
        "mediterranean": ["italy", "greece", "spain", "turkey", "croatia"],
        "north africa": ["egypt", "morocco", "algeria", "tunisia"],
        "sub-saharan africa": ["nigeria", "kenya", "south africa", "ghana"],
        "southeast asia": ["vietnam", "thailand", "indonesia", "philippines"],
        "central asia": ["uzbekistan", "kazakhstan", "afghanistan"],
        "caribbean": ["cuba", "haiti", "jamaica", "trinidad"],
        "oceania": ["australia", "new zealand"],
    }
    for substr in mapping.get(region, []):
        if substr in country:
            return True
    return False


async def _generate_poem(painting, literature, profile) -> Optional[str]:
    """Use Claude to generate a short poem inspired by today's content and user tastes."""
    from app.core.config import settings

    if not settings.ANTHROPIC_API_KEY or not painting:
        return None

    try:
        import anthropic

        prefs = ""
        if profile:
            parts = []
            if profile.themes:
                parts.append(f"themes they love: {', '.join(profile.themes)}")
            if profile.art_movements:
                parts.append(f"art movements: {', '.join(profile.art_movements)}")
            if profile.literary_genres:
                parts.append(f"literary tastes: {', '.join(profile.literary_genres)}")
            if parts:
                prefs = f"\n\nThe reader's personal interests: {'; '.join(parts)}."

        lit_context = ""
        if literature:
            lit_context = f'\nLiterature highlight: "{literature.title}" by {literature.author} ({literature.genre} from {literature.author_country})'

        client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
        message = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=300,
            messages=[
                {
                    "role": "user",
                    "content": (
                        f"You are a poet for Dastan, a daily art and literature app.\n\n"
                        f'Today\'s painting: "{painting.title}" by {painting.artist} '
                        f"({painting.year}), {painting.movement} from {painting.origin_country}.\n"
                        f"{lit_context}{prefs}\n\n"
                        f"Write a short, original poem (6-12 lines) inspired by this painting "
                        f"and the reader's tastes. Be evocative, specific to the artwork, "
                        f"and emotionally resonant. No title, no explanation — just the poem."
                    ),
                }
            ],
        )
        return message.content[0].text

    except Exception as e:
        logger.warning(f"Poem generation failed: {e}")
        return None
