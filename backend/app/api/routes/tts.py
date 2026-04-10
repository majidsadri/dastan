"""Text-to-Speech via Gemini Pro TTS — reads poetry aloud in Farsi or English."""

import asyncio
import base64
import hashlib
import logging
import struct
from io import BytesIO

import httpx
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from app.core.config import settings

log = logging.getLogger(__name__)

router = APIRouter(prefix="/api/tts", tags=["tts"])

GEMINI_TTS_URL = (
    "https://generativelanguage.googleapis.com/v1beta/"
    "models/gemini-2.5-flash-preview-tts:generateContent"
)

# In-memory cache: hash(text+voice+prompt) -> WAV bytes (keeps last 50)
_cache: dict[str, bytes] = {}
_CACHE_MAX = 50


class TTSRequest(BaseModel):
    text: str
    voice: str = "Achernar"
    prompt: str = "Read this poem aloud slowly and beautifully, with feeling"


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
    buf.write(struct.pack("<I", 16))               # chunk size
    buf.write(struct.pack("<H", 1))                 # PCM format
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


@router.post("/speak")
async def speak(req: TTSRequest):
    api_key = settings.GEMINI_API_KEY
    if not api_key:
        raise HTTPException(status_code=500, detail="Gemini API key not configured")

    # Check cache first — instant response for repeated requests
    key = _cache_key(req)
    if key in _cache:
        log.info("TTS cache hit")
        return StreamingResponse(
            BytesIO(_cache[key]),
            media_type="audio/wav",
            headers={"Content-Disposition": "inline; filename=poem.wav"},
        )

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
                    "prebuiltVoiceConfig": {"voiceName": req.voice}
                }
            },
        },
    }

    # Retry up to 2 times on Gemini 500 errors
    last_error = ""
    async with httpx.AsyncClient(timeout=90.0) as client:
        for attempt in range(3):
            resp = await client.post(
                f"{GEMINI_TTS_URL}?key={api_key}",
                json=payload,
            )
            if resp.status_code == 200:
                break
            last_error = resp.text[:300]
            log.warning("Gemini TTS attempt %d failed: %d", attempt + 1, resp.status_code)
            if resp.status_code >= 500 and attempt < 2:
                await asyncio.sleep(1)
                continue
            raise HTTPException(status_code=502, detail=f"Gemini TTS error: {last_error}")

    data = resp.json()
    try:
        audio_b64 = data["candidates"][0]["content"]["parts"][0]["inlineData"]["data"]
    except (KeyError, IndexError):
        raise HTTPException(status_code=502, detail="Unexpected Gemini response format")

    pcm_bytes = base64.b64decode(audio_b64)
    wav_bytes = _pcm_to_wav(pcm_bytes)

    # Cache the result
    if len(_cache) >= _CACHE_MAX:
        _cache.pop(next(iter(_cache)))
    _cache[key] = wav_bytes

    return StreamingResponse(
        BytesIO(wav_bytes),
        media_type="audio/wav",
        headers={"Content-Disposition": "inline; filename=poem.wav"},
    )
