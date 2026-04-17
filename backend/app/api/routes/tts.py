"""Text-to-Speech: Gemini first (Achernar voice), OpenAI fallback.

Gemini TTS produces proper Iranian Farsi with the Achernar voice but has
a hard 100/day cap on the preview model. When that cap hits we fall back
to OpenAI `shimmer` so the feature keeps working instead of failing.

Pre-generated audio: poems can be pre-generated in high quality via
`scripts/generate-faal-audio.py` and served as static files from
`/faal/audio/{id}-{lang}.mp3`. The `/api/tts/poem/:id/:lang` endpoint
serves these directly with cache headers.
"""

from __future__ import annotations

import asyncio
import base64
import hashlib
import logging
import struct
from io import BytesIO
from pathlib import Path

import httpx
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import BaseModel

from app.core.config import settings

log = logging.getLogger(__name__)

router = APIRouter(prefix="/api/tts", tags=["tts"])

GEMINI_TTS_URL = (
    "https://generativelanguage.googleapis.com/v1beta/"
    "models/gemini-2.5-flash-preview-tts:generateContent"
)
OPENAI_TTS_URL = "https://api.openai.com/v1/audio/speech"

# In-memory cache: hash(text+voice+prompt) -> (media_type, audio bytes)
_cache: dict[str, tuple[str, bytes]] = {}
_CACHE_MAX = 50

DEFAULT_GEMINI_VOICE = "Achernar"   # soft female, proper Iranian Persian
DEFAULT_PROMPT = "Read this poem aloud slowly and beautifully, with feeling"
OPENAI_FALLBACK_VOICE = "shimmer"
OPENAI_MODEL = "tts-1"


class TTSRequest(BaseModel):
    text: str
    voice: str = DEFAULT_GEMINI_VOICE
    prompt: str = DEFAULT_PROMPT


def _pcm_to_wav(pcm_data: bytes, sample_rate: int = 24000, channels: int = 1, bits: int = 16) -> bytes:
    """Wrap raw PCM bytes in a WAV header."""
    data_size = len(pcm_data)
    byte_rate = sample_rate * channels * (bits // 8)
    block_align = channels * (bits // 8)
    buf = BytesIO()
    buf.write(b"RIFF")
    buf.write(struct.pack("<I", 36 + data_size))
    buf.write(b"WAVE")
    buf.write(b"fmt ")
    buf.write(struct.pack("<I", 16))
    buf.write(struct.pack("<H", 1))
    buf.write(struct.pack("<H", channels))
    buf.write(struct.pack("<I", sample_rate))
    buf.write(struct.pack("<I", byte_rate))
    buf.write(struct.pack("<H", block_align))
    buf.write(struct.pack("<H", bits))
    buf.write(b"data")
    buf.write(struct.pack("<I", data_size))
    buf.write(pcm_data)
    return buf.getvalue()


def _cache_key(req: TTSRequest) -> str:
    raw = f"{req.text}|{req.voice}|{req.prompt}"
    return hashlib.sha256(raw.encode()).hexdigest()[:16]


async def _try_gemini(req: TTSRequest, client: httpx.AsyncClient) -> tuple[str, bytes] | None:
    """Call Gemini TTS. Return (media_type, audio bytes) or None if quota hit.

    Raises HTTPException on non-quota errors so the caller can surface them.
    """
    api_key = settings.GEMINI_API_KEY
    if not api_key:
        return None

    payload = {
        "contents": [
            {
                "role": "user",
                "parts": [{"text": f"{req.prompt}: {req.text}"}],
            }
        ],
        "generationConfig": {
            "responseModalities": ["AUDIO"],
            "speechConfig": {
                "voiceConfig": {
                    "prebuiltVoiceConfig": {"voiceName": req.voice or DEFAULT_GEMINI_VOICE}
                }
            },
        },
    }

    for attempt in range(3):
        resp = await client.post(
            f"{GEMINI_TTS_URL}?key={api_key}",
            json=payload,
        )
        if resp.status_code == 200:
            data = resp.json()
            try:
                audio_b64 = data["candidates"][0]["content"]["parts"][0]["inlineData"]["data"]
            except (KeyError, IndexError):
                log.warning("Unexpected Gemini TTS response: %s", resp.text[:300])
                return None
            pcm = base64.b64decode(audio_b64)
            return ("audio/wav", _pcm_to_wav(pcm))

        # 429 = RESOURCE_EXHAUSTED (daily quota). Fall back silently.
        if resp.status_code == 429:
            log.info("Gemini TTS quota exhausted — falling back to OpenAI")
            return None

        # Retry transient 5xx; anything else → fall back too.
        if 500 <= resp.status_code < 600 and attempt < 2:
            log.warning("Gemini TTS %d on attempt %d, retrying", resp.status_code, attempt + 1)
            await asyncio.sleep(1)
            continue

        log.warning("Gemini TTS failed: %d — %s", resp.status_code, resp.text[:300])
        return None

    return None


async def _try_openai(req: TTSRequest, client: httpx.AsyncClient) -> tuple[str, bytes]:
    """Call OpenAI TTS. Raises HTTPException on failure."""
    api_key = settings.OPENAI_API_KEY
    if not api_key:
        raise HTTPException(status_code=500, detail="No TTS provider configured")

    payload = {
        "model": OPENAI_MODEL,
        "input": req.text,
        "voice": OPENAI_FALLBACK_VOICE,
        "response_format": "mp3",
        "speed": 0.92,
    }
    resp = await client.post(
        OPENAI_TTS_URL,
        json=payload,
        headers={"Authorization": f"Bearer {api_key}"},
    )
    if resp.status_code != 200:
        err = resp.text[:1500]
        log.warning("OpenAI TTS fallback failed: %d — %s", resp.status_code, err)
        raise HTTPException(status_code=502, detail=f"TTS error: {err}")
    return ("audio/mpeg", resp.content)


@router.post("/speak")
async def speak(req: TTSRequest):
    key = _cache_key(req)
    if key in _cache:
        log.info("TTS cache hit")
        media_type, audio = _cache[key]
        return StreamingResponse(
            BytesIO(audio),
            media_type=media_type,
            headers={"Content-Disposition": "inline; filename=poem"},
        )

    async with httpx.AsyncClient(timeout=90.0) as client:
        result = await _try_gemini(req, client)
        if result is None:
            result = await _try_openai(req, client)

    media_type, audio = result
    if len(_cache) >= _CACHE_MAX:
        _cache.pop(next(iter(_cache)))
    _cache[key] = result

    return StreamingResponse(
        BytesIO(audio),
        media_type=media_type,
        headers={"Content-Disposition": "inline; filename=poem"},
    )


# ── Pre-generated poem audio ─────────────────────────────────────────

# Look for static audio files relative to the project root's
# frontend/public/faal/audio/ directory.
_STATIC_AUDIO_DIR = Path(__file__).resolve().parents[3] / "frontend" / "public" / "faal" / "audio"


@router.get("/poem/{poem_id}/{lang}")
async def poem_audio(poem_id: int, lang: str):
    """Serve pre-generated high-quality poem audio.

    Files are named {id:03d}-{lang}.mp3 and generated via
    scripts/generate-faal-audio.py using OpenAI tts-1-hd.
    """
    if lang not in ("en", "fa"):
        raise HTTPException(status_code=400, detail="lang must be 'en' or 'fa'")

    audio_file = _STATIC_AUDIO_DIR / f"{poem_id:03d}-{lang}.mp3"
    if not audio_file.exists():
        raise HTTPException(status_code=404, detail="Audio not yet generated")

    return FileResponse(
        audio_file,
        media_type="audio/mpeg",
        headers={
            "Cache-Control": "public, max-age=31536000, immutable",
        },
    )
