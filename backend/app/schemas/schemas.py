from __future__ import annotations

from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel


# --- Painting ---

class PaintingBase(BaseModel):
    title: str
    artist: str
    year: str
    origin_country: str
    movement: str
    image_url: str
    description: str
    artist_bio: str
    colors: list[str]
    display_date: date


class PaintingCreate(PaintingBase):
    pass


class PaintingResponse(PaintingBase):
    id: int
    created_at: datetime

    model_config = {"from_attributes": True}


# --- NovelPage ---

class NovelPageBase(BaseModel):
    novel_title: str
    author: str
    author_country: str
    page_number: int
    total_pages: int
    content: str
    display_date: date


class NovelPageCreate(NovelPageBase):
    pass


class NovelPageResponse(NovelPageBase):
    id: int
    created_at: datetime

    model_config = {"from_attributes": True}


# --- LiteratureHighlight ---

class LiteratureHighlightBase(BaseModel):
    title: str
    author: str
    author_country: str
    genre: str
    content: str
    original_language: str
    original_text: Optional[str] = None
    display_date: date


class LiteratureHighlightCreate(LiteratureHighlightBase):
    pass


class LiteratureHighlightResponse(LiteratureHighlightBase):
    id: int
    created_at: datetime

    model_config = {"from_attributes": True}


# --- Favorite ---

class FavoriteBase(BaseModel):
    item_type: str
    item_id: int


class FavoriteCreate(FavoriteBase):
    pass


class FavoriteResponse(FavoriteBase):
    id: int
    created_at: datetime

    model_config = {"from_attributes": True}


class FavoriteCheck(BaseModel):
    is_favorited: bool
    favorite_id: Optional[int] = None


# --- Canvas / Daily Content ---

class TodayCanvas(BaseModel):
    date: date
    painting: Optional[PaintingResponse] = None
    novel_page: Optional[NovelPageResponse] = None
    literature: Optional[LiteratureHighlightResponse] = None
    ai_prompt: str
    mood_word: Optional[str] = None


class ArchiveDay(BaseModel):
    date: date
    painting_title: Optional[str] = None
    painting_artist: Optional[str] = None
    painting_image_url: Optional[str] = None
    novel_title: Optional[str] = None
    novel_page: Optional[int] = None
    literature_title: Optional[str] = None
    literature_author: Optional[str] = None


class DailyContent(BaseModel):
    canvas: TodayCanvas
    message: str


# --- AI ---

class AIContinueRequest(BaseModel):
    text: str
    painting_context: str
    literature_context: str


class AIContinueResponse(BaseModel):
    continuation: str
    style_note: str


# --- UserProfile ---

class UserProfileCreate(BaseModel):
    display_name: str
    avatar: Optional[str] = None
    art_movements: list[str] = []
    art_periods: list[str] = []
    favorite_artists: list[str] = []
    literary_genres: list[str] = []
    favorite_authors: list[str] = []
    preferred_languages: list[str] = []
    themes: list[str] = []
    regions: list[str] = []


class UserProfileUpdate(UserProfileCreate):
    pass


class UserProfileResponse(UserProfileCreate):
    id: int
    created_at: datetime
    updated_at: datetime
    model_config = {"from_attributes": True}
