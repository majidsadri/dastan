from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.auth import get_current_user_id
from app.models.models import Favorite, Painting, NovelPage, LiteratureHighlight
from app.schemas.schemas import FavoriteCreate, FavoriteResponse, FavoriteCheck

router = APIRouter(prefix="/api/favorites", tags=["favorites"])

VALID_ITEM_TYPES = {"painting", "novel", "literature"}


@router.get("")
async def list_favorites(
    db: AsyncSession = Depends(get_db),
    user_id: Optional[str] = Depends(get_current_user_id),
):
    query = select(Favorite).order_by(Favorite.created_at.desc())
    if user_id:
        query = query.where(Favorite.user_id == user_id)

    result = await db.execute(query)
    favorites = result.scalars().all()

    # Enrich each favorite with actual item data
    enriched = []
    for fav in favorites:
        entry = {
            "id": fav.id,
            "item_type": fav.item_type,
            "item_id": fav.item_id,
            "created_at": fav.created_at.isoformat(),
            "title": None,
            "subtitle": None,
            "image_url": None,
        }

        if fav.item_type == "painting":
            p = await db.execute(select(Painting).where(Painting.id == fav.item_id))
            painting = p.scalar_one_or_none()
            if painting:
                entry["title"] = painting.title
                entry["subtitle"] = f"{painting.artist}, {painting.year}"
                entry["image_url"] = painting.image_url

        elif fav.item_type == "novel":
            n = await db.execute(select(NovelPage).where(NovelPage.id == fav.item_id))
            novel = n.scalar_one_or_none()
            if novel:
                entry["title"] = novel.novel_title
                entry["subtitle"] = f"{novel.author} — Page {novel.page_number}"

        elif fav.item_type == "literature":
            l = await db.execute(select(LiteratureHighlight).where(LiteratureHighlight.id == fav.item_id))
            lit = l.scalar_one_or_none()
            if lit:
                entry["title"] = lit.title
                entry["subtitle"] = f"{lit.author} — {lit.genre}"

        enriched.append(entry)

    return enriched


@router.post("", response_model=FavoriteResponse, status_code=201)
async def add_favorite(
    data: FavoriteCreate,
    db: AsyncSession = Depends(get_db),
    user_id: Optional[str] = Depends(get_current_user_id),
):
    if data.item_type not in VALID_ITEM_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"item_type must be one of: {', '.join(VALID_ITEM_TYPES)}",
        )

    # Check for duplicates (per user)
    conditions = [
        Favorite.item_type == data.item_type,
        Favorite.item_id == data.item_id,
    ]
    if user_id:
        conditions.append(Favorite.user_id == user_id)

    existing = await db.execute(select(Favorite).where(and_(*conditions)))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Already favorited.")

    favorite = Favorite(
        item_type=data.item_type,
        item_id=data.item_id,
        user_id=user_id,
    )
    db.add(favorite)
    await db.flush()
    await db.refresh(favorite)
    return favorite


@router.delete("/{favorite_id}", status_code=204)
async def remove_favorite(
    favorite_id: int,
    db: AsyncSession = Depends(get_db),
    user_id: Optional[str] = Depends(get_current_user_id),
):
    query = select(Favorite).where(Favorite.id == favorite_id)
    if user_id:
        query = query.where(Favorite.user_id == user_id)

    result = await db.execute(query)
    favorite = result.scalar_one_or_none()
    if not favorite:
        raise HTTPException(status_code=404, detail="Favorite not found.")
    await db.delete(favorite)


@router.get("/check/{item_type}/{item_id}", response_model=FavoriteCheck)
async def check_favorite(
    item_type: str,
    item_id: int,
    db: AsyncSession = Depends(get_db),
    user_id: Optional[str] = Depends(get_current_user_id),
):
    conditions = [
        Favorite.item_type == item_type,
        Favorite.item_id == item_id,
    ]
    if user_id:
        conditions.append(Favorite.user_id == user_id)

    result = await db.execute(select(Favorite).where(and_(*conditions)))
    favorite = result.scalar_one_or_none()
    if favorite:
        return FavoriteCheck(is_favorited=True, favorite_id=favorite.id)
    return FavoriteCheck(is_favorited=False, favorite_id=None)
