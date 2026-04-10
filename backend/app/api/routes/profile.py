from __future__ import annotations

import asyncio
import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.auth import get_current_user_id
from app.models.models import UserProfile
from app.schemas.schemas import UserProfileCreate, UserProfileUpdate, UserProfileResponse
from app.services.curator import curate_paintings
import app.api.routes.canvas as canvas_module

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/profile", tags=["profile"])


@router.get("", response_model=Optional[UserProfileResponse])
async def get_profile(
    db: AsyncSession = Depends(get_db),
    user_id: Optional[str] = Depends(get_current_user_id),
):
    if user_id:
        result = await db.execute(
            select(UserProfile).where(UserProfile.user_id == user_id)
        )
    else:
        result = await db.execute(select(UserProfile).limit(1))
    profile = result.scalar_one_or_none()
    if not profile:
        return None
    return profile


@router.post("", response_model=UserProfileResponse, status_code=201)
async def create_profile(
    data: UserProfileCreate,
    db: AsyncSession = Depends(get_db),
    user_id: Optional[str] = Depends(get_current_user_id),
):
    # Check if profile already exists for this user
    if user_id:
        existing = await db.execute(
            select(UserProfile).where(UserProfile.user_id == user_id)
        )
    else:
        existing = await db.execute(select(UserProfile).limit(1))

    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Profile already exists. Use PUT to update.")

    profile = UserProfile(**data.model_dump(), user_id=user_id)
    db.add(profile)
    await db.flush()
    await db.refresh(profile)

    # Clear cache and flag profile change
    canvas_module._today_painting_cache.clear()
    canvas_module._profile_changed = True

    # Auto-curate paintings based on new profile
    asyncio.create_task(_background_curate(db))

    return profile


@router.put("", response_model=UserProfileResponse)
async def update_profile(
    data: UserProfileUpdate,
    db: AsyncSession = Depends(get_db),
    user_id: Optional[str] = Depends(get_current_user_id),
):
    if user_id:
        result = await db.execute(
            select(UserProfile).where(UserProfile.user_id == user_id)
        )
    else:
        result = await db.execute(select(UserProfile).limit(1))
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=404, detail="No profile found. Create one first.")

    for key, value in data.model_dump().items():
        setattr(profile, key, value)

    await db.flush()
    await db.refresh(profile)

    # Clear cache and flag profile change
    canvas_module._today_painting_cache.clear()
    canvas_module._profile_changed = True

    # Auto-curate paintings when profile changes
    asyncio.create_task(_background_curate(db))

    return profile


async def _background_curate(db: AsyncSession):
    """Run curation in background after profile save."""
    try:
        result = await curate_paintings(db, days=7)
        if result.get("error"):
            logger.warning(f"Auto-curation failed: {result['error']}")
        else:
            logger.info(f"Auto-curation complete: {result['curated']} paintings curated")
    except Exception as e:
        logger.error(f"Auto-curation error: {e}")


@router.delete("", status_code=204)
async def delete_profile(
    db: AsyncSession = Depends(get_db),
    user_id: Optional[str] = Depends(get_current_user_id),
):
    if user_id:
        result = await db.execute(
            select(UserProfile).where(UserProfile.user_id == user_id)
        )
    else:
        result = await db.execute(select(UserProfile).limit(1))
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=404, detail="No profile found.")
    await db.delete(profile)
