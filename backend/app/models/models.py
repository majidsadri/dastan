from datetime import date, datetime

from sqlalchemy import Column, Date, DateTime, Integer, JSON, String, Text, func
from app.core.database import Base


class Painting(Base):
    __tablename__ = "paintings"

    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(500), nullable=False)
    artist = Column(String(300), nullable=False)
    year = Column(String(50), nullable=False)
    origin_country = Column(String(100), nullable=False)
    movement = Column(String(200), nullable=False)
    image_url = Column(String(1000), nullable=False)
    description = Column(Text, nullable=False)
    artist_bio = Column(Text, nullable=False)
    colors = Column(JSON, nullable=False)
    display_date = Column(Date, index=True, nullable=False)
    source = Column(String(50), nullable=True)  # "seed", "artic", "met"
    created_at = Column(DateTime, server_default=func.now(), nullable=False)


class NovelPage(Base):
    __tablename__ = "novel_pages"

    id = Column(Integer, primary_key=True, autoincrement=True)
    novel_title = Column(String(500), nullable=False)
    author = Column(String(300), nullable=False)
    author_country = Column(String(100), nullable=False)
    page_number = Column(Integer, nullable=False)
    total_pages = Column(Integer, nullable=False)
    content = Column(Text, nullable=False)
    display_date = Column(Date, index=True, nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)


class LiteratureHighlight(Base):
    __tablename__ = "literature_highlights"

    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(500), nullable=False)
    author = Column(String(300), nullable=False)
    author_country = Column(String(100), nullable=False)
    genre = Column(String(50), nullable=False)  # poem, prose, essay, mysticism
    content = Column(Text, nullable=False)
    original_language = Column(String(100), nullable=False)
    original_text = Column(Text, nullable=True)
    display_date = Column(Date, index=True, nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)


class Favorite(Base):
    __tablename__ = "favorites"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(100), nullable=True, index=True)  # Supabase UUID
    item_type = Column(String(50), nullable=False)  # painting, novel, literature
    item_id = Column(Integer, nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)


class UserProfile(Base):
    __tablename__ = "user_profiles"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(100), nullable=True, unique=True, index=True)  # Supabase UUID
    display_name = Column(String(200), nullable=False)
    avatar = Column(String(500), nullable=True)

    # Art preferences (stored as JSON arrays)
    art_movements = Column(JSON, nullable=False, default=list)
    art_periods = Column(JSON, nullable=False, default=list)
    favorite_artists = Column(JSON, nullable=False, default=list)

    # Literature preferences
    literary_genres = Column(JSON, nullable=False, default=list)
    favorite_authors = Column(JSON, nullable=False, default=list)
    preferred_languages = Column(JSON, nullable=False, default=list)

    # Interests / themes
    themes = Column(JSON, nullable=False, default=list)

    # Cultural regions of interest
    regions = Column(JSON, nullable=False, default=list)

    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())


class UserCanvasHistory(Base):
    """Tracks what each user saw on each day — powers per-user archive."""
    __tablename__ = "user_canvas_history"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(100), nullable=False, index=True)
    canvas_date = Column(Date, nullable=False)
    painting_title = Column(String(500), nullable=True)
    painting_artist = Column(String(300), nullable=True)
    painting_image_url = Column(String(1000), nullable=True)
    painting_year = Column(String(50), nullable=True)
    painting_movement = Column(String(200), nullable=True)
    novel_title = Column(String(500), nullable=True)
    novel_author = Column(String(300), nullable=True)
    novel_page = Column(Integer, nullable=True)
    literature_title = Column(String(500), nullable=True)
    literature_author = Column(String(300), nullable=True)
    literature_genre = Column(String(50), nullable=True)
    mood_word = Column(String(100), nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
