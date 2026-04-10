import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

logging.basicConfig(level=logging.INFO)

from app.core.config import settings
from app.core.database import engine, Base
from app.api.routes import canvas, favorites, ai, profile, tts

# Import models so they are registered with Base.metadata
import app.models.models  # noqa: F401


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    await engine.dispose()


app = FastAPI(
    title=settings.APP_NAME,
    description="A daily art and literature experience",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(canvas.router)
app.include_router(favorites.router)
app.include_router(ai.router)
app.include_router(profile.router)
app.include_router(tts.router)


@app.get("/")
async def root():
    return {
        "app": settings.APP_NAME,
        "version": "1.0.0",
        "description": "A daily art and literature experience",
        "endpoints": {
            "canvas_today": "/api/canvas/today",
            "canvas_date": "/api/canvas/date/{YYYY-MM-DD}",
            "canvas_archive": "/api/canvas/archive",
            "favorites": "/api/favorites",
            "ai_continue": "/api/ai/continue",
            "docs": "/docs",
        },
    }
