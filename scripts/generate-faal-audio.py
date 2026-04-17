#!/usr/bin/env python3
"""Pre-generate high-quality TTS audio for all 30 Hafez poems (English + Farsi).

Uses OpenAI tts-1-hd (highest quality) with the 'nova' voice for English
and 'shimmer' for Farsi. Outputs MP3 files to frontend/public/faal/audio/.

Usage:
    export OPENAI_API_KEY=sk-...
    python scripts/generate-faal-audio.py

Files are named: {poem_id:03d}-en.mp3, {poem_id:03d}-fa.mp3
"""

import json
import os
import sys
import time
from pathlib import Path

import httpx

OPENAI_TTS_URL = "https://api.openai.com/v1/audio/speech"
API_KEY = os.environ.get("OPENAI_API_KEY") or os.environ.get("DASTAN_OPENAI_API_KEY")

if not API_KEY:
    print("ERROR: Set OPENAI_API_KEY or DASTAN_OPENAI_API_KEY")
    sys.exit(1)

ROOT = Path(__file__).resolve().parent.parent
POEMS_DIR = ROOT / "hafez" / "poems"
OUTPUT_DIR = ROOT / "frontend" / "public" / "faal" / "audio"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

VOICES = {
    "en": "nova",
    "fa": "shimmer",
}

PROMPTS = {
    "en": "Read this Hafez poem aloud slowly and beautifully, with feeling",
    "fa": "این غزل حافظ را با لحن گرم، آرام و شاعرانه بخوان",
}


def generate_audio(text: str, voice: str, output_path: Path) -> bool:
    if output_path.exists() and output_path.stat().st_size > 1000:
        print(f"  SKIP (exists): {output_path.name}")
        return True

    payload = {
        "model": "tts-1-hd",
        "input": text[:4096],
        "voice": voice,
        "response_format": "mp3",
        "speed": 0.9,
    }

    try:
        with httpx.Client(timeout=120.0) as client:
            resp = client.post(
                OPENAI_TTS_URL,
                json=payload,
                headers={"Authorization": f"Bearer {API_KEY}"},
            )
        if resp.status_code == 200:
            output_path.write_bytes(resp.content)
            size_kb = len(resp.content) / 1024
            print(f"  OK: {output_path.name} ({size_kb:.0f} KB)")
            return True
        elif resp.status_code == 429:
            print(f"  RATE LIMITED — waiting 30s...")
            time.sleep(30)
            return generate_audio(text, voice, output_path)
        else:
            print(f"  FAIL ({resp.status_code}): {resp.text[:200]}")
            return False
    except Exception as e:
        print(f"  ERROR: {e}")
        return False


def main():
    poem_files = sorted(POEMS_DIR.glob("*.json"))
    if not poem_files:
        print(f"No poem files found in {POEMS_DIR}")
        sys.exit(1)

    print(f"Found {len(poem_files)} poems")
    print(f"Output: {OUTPUT_DIR}")
    print(f"Model: tts-1-hd (highest quality)")
    print()

    total = 0
    generated = 0

    for pf in poem_files:
        poem = json.loads(pf.read_text())
        pid = poem["id"]
        title = poem.get("title_en", f"Poem {pid}")
        print(f"[{pid:03d}] {title}")

        for lang in ["en", "fa"]:
            total += 1
            text_key = "english" if lang == "en" else "farsi"
            text_data = poem.get(text_key, {})
            full_text = text_data.get("full_text", "")

            if not full_text:
                print(f"  SKIP ({lang}): no text")
                continue

            out_file = OUTPUT_DIR / f"{pid:03d}-{lang}.mp3"
            if generate_audio(full_text, VOICES[lang], out_file):
                generated += 1

            # Small delay to avoid rate limits
            time.sleep(1.5)

        print()

    print(f"Done: {generated}/{total} files generated")
    total_size = sum(f.stat().st_size for f in OUTPUT_DIR.glob("*.mp3"))
    print(f"Total size: {total_size / 1024 / 1024:.1f} MB")


if __name__ == "__main__":
    main()
