#!/usr/bin/env python3
"""
Fetch 30 famous Hafez Shirazi poems (Farsi + English translation)
from hafizonlove.com and save as structured JSON for the Dastan app.

Usage: python3 scripts/fetch-hafez.py
Output: /Users/sizarta/dastan/hafez/hafez-collection.json
        /Users/sizarta/dastan/hafez/poems/001.json ... 030.json
"""

import json
import os
import re
import time
import urllib.request
from html.parser import HTMLParser
from pathlib import Path
from typing import Optional, List

BASE_URL = "https://www.hafizonlove.com/divan"
OUTPUT_DIR = Path(__file__).resolve().parent.parent / "hafez"
POEMS_DIR = OUTPUT_DIR / "poems"

# 30 famous Hafez ghazals — using verified URLs from hafizonlove.com
# Format: (group_folder, poem_number, common_title/first_line)
FAMOUS_POEMS = [
    ("01", "001", "Arise, O Cup-Bearer"),
    ("01", "002", "The Curling Locks"),
    ("01", "003", "If That Turk of Shiraz"),
    ("01", "004", "The Morning Breeze"),
    ("01", "005", "The Heart's Desire"),
    ("01", "011", "The East Wind"),
    ("01", "012", "The Beloved's Lane"),
    ("01", "022", "The Rose Garden"),
    ("01", "026", "The Dawn Prayer"),
    ("01", "033", "Spring Breeze"),
    ("01", "042", "The Wine-Bringer"),
    ("02", "051", "The Moth and Flame"),
    ("02", "053", "The Hidden Treasure"),
    ("02", "057", "The Tavern Door"),
    ("02", "059", "The Garden Path"),
    ("02", "067", "Twilight Song"),
    ("02", "071", "The Riddle of Fate"),
    ("03", "107", "The Lover's Complaint"),
    ("03", "112", "Hidden Love"),
    ("03", "118", "The Secret"),
    ("03", "132", "The Nightingale"),
    ("04", "169", "The Wind of Grace"),
    ("04", "177", "The Eternal Tavern"),
    ("04", "184", "The Cup of Jamshid"),
    ("05", "203", "The Garden of Love"),
    ("06", "270", "The Divine Beloved"),
    ("07", "315", "Reflection"),
    ("08", "351", "The Wanderer"),
    ("09", "415", "The Beloved's Face"),
    ("10", "453", "The Wine of Love"),
]


class HafezHTMLParser(HTMLParser):
    """Extract Farsi and English text from hafizonlove.com poem pages."""

    def __init__(self):
        super().__init__()
        self.in_farsi = False
        self.in_eng = False
        self.in_title = False
        self.farsi_lines = []
        self.eng_lines = []
        self.title = ""
        self._current_text = []
        self._in_p = False
        self._in_br_mode = False
        self._skip_tags = {"script", "style"}
        self._skip_depth = 0

    def handle_starttag(self, tag, attrs):
        attr_dict = dict(attrs)

        if tag in self._skip_tags:
            self._skip_depth += 1
            return

        tag_id = attr_dict.get("id", "").lower()
        tag_class = attr_dict.get("class", "").lower()

        if tag == "div":
            if tag_id == "farsi" or "farsi" in tag_class:
                self.in_farsi = True
                self.in_eng = False
            elif tag_id == "eng" or "eng" in tag_class or tag_id == "english":
                self.in_eng = True
                self.in_farsi = False

        if tag == "title":
            self.in_title = True

        if tag == "br":
            if self.in_farsi:
                text = "".join(self._current_text).strip()
                if text:
                    self.farsi_lines.append(text)
                self._current_text = []
            elif self.in_eng:
                text = "".join(self._current_text).strip()
                if text:
                    self.eng_lines.append(text)
                self._current_text = []

        if tag == "p":
            self._in_p = True

    def handle_endtag(self, tag):
        if tag in self._skip_tags:
            self._skip_depth -= 1
            return

        if tag == "title":
            self.in_title = False

        if tag == "div":
            # Flush remaining text
            text = "".join(self._current_text).strip()
            if text:
                if self.in_farsi:
                    self.farsi_lines.append(text)
                elif self.in_eng:
                    self.eng_lines.append(text)
            self._current_text = []
            if self.in_farsi:
                self.in_farsi = False
            elif self.in_eng:
                self.in_eng = False

        if tag == "p":
            text = "".join(self._current_text).strip()
            if text:
                if self.in_farsi:
                    self.farsi_lines.append(text)
                elif self.in_eng:
                    self.eng_lines.append(text)
            self._current_text = []
            self._in_p = False

    def handle_data(self, data):
        if self._skip_depth > 0:
            return

        if self.in_title and not self.title:
            self.title = data.strip()

        if self.in_farsi or self.in_eng:
            self._current_text.append(data)


def clean_lines(lines: List[str]) -> List[str]:
    """Clean up extracted text lines."""
    cleaned = []
    for line in lines:
        line = line.strip()
        # Remove numbering prefixes like "1." or "(1)"
        line = re.sub(r"^\(\d+\)\s*", "", line)
        line = re.sub(r"^\d+\.\s*", "", line)
        # Remove HTML entities
        line = line.replace("&nbsp;", " ").replace("&amp;", "&")
        # Collapse whitespace
        line = re.sub(r"\s+", " ", line).strip()
        if line and len(line) > 1:
            cleaned.append(line)
    return cleaned


def fetch_poem(group: str, number: str) -> Optional[dict]:
    """Fetch a single poem page and parse it."""
    url = f"{BASE_URL}/{group}/{number}.htm"
    try:
        req = urllib.request.Request(url, headers={
            "User-Agent": "Mozilla/5.0 (Macintosh; Dastan Art App)",
        })
        with urllib.request.urlopen(req, timeout=15) as resp:
            # Try multiple encodings
            raw = resp.read()
            for enc in ("utf-8", "windows-1256", "iso-8859-1"):
                try:
                    html = raw.decode(enc)
                    break
                except UnicodeDecodeError:
                    continue
            else:
                html = raw.decode("utf-8", errors="replace")

        parser = HafezHTMLParser()
        parser.feed(html)

        farsi = clean_lines(parser.farsi_lines)
        english = clean_lines(parser.eng_lines)

        if not farsi and not english:
            # Try a simpler regex approach as fallback
            farsi_match = re.search(
                r'<[Dd]iv[^>]*(?:id|class)=["\']?[Ff]arsi["\']?[^>]*>(.*?)</[Dd]iv>',
                html, re.DOTALL
            )
            eng_match = re.search(
                r'<[Dd]iv[^>]*(?:id|class)=["\']?[Ee]ng(?:lish)?["\']?[^>]*>(.*?)</[Dd]iv>',
                html, re.DOTALL
            )
            if farsi_match:
                text = re.sub(r"<[^>]+>", "\n", farsi_match.group(1))
                farsi = clean_lines(text.split("\n"))
            if eng_match:
                text = re.sub(r"<[^>]+>", "\n", eng_match.group(1))
                english = clean_lines(text.split("\n"))

        return {
            "title_page": parser.title,
            "farsi_lines": farsi,
            "english_lines": english,
            "source_url": url,
        }

    except Exception as e:
        print(f"  ✗ Failed to fetch {url}: {e}")
        return None


def pair_couplets(lines: List[str]) -> List[List[str]]:
    """Group lines into couplets (بیت) — pairs of two."""
    couplets = []
    for i in range(0, len(lines), 2):
        pair = lines[i:i+2]
        if pair:
            couplets.append(pair)
    return couplets


def main():
    POEMS_DIR.mkdir(parents=True, exist_ok=True)

    print(f"Fetching 30 famous Hafez poems from hafizonlove.com")
    print(f"Output: {OUTPUT_DIR}\n")

    collection = []
    success = 0

    for idx, (group, number, title_hint) in enumerate(FAMOUS_POEMS, 1):
        print(f"  [{idx:2d}/30] Ghazal #{number} — {title_hint}...", end=" ", flush=True)

        result = fetch_poem(group, number)
        if not result:
            print("✗")
            continue

        farsi = result["farsi_lines"]
        english = result["english_lines"]

        if not farsi and not english:
            print("✗ (empty)")
            continue

        poem = {
            "id": idx,
            "ghazal_number": int(number),
            "title_en": title_hint,
            "title_fa": farsi[0] if farsi else "",
            "poet": "Hafez",
            "poet_fa": "حافظ",
            "poet_full_name": "Khwaja Shams-ud-Din Muhammad Hafez-e Shirazi",
            "poet_full_name_fa": "خواجه شمس‌الدین محمد حافظ شیرازی",
            "era": "14th century",
            "origin": "Shiraz, Iran",
            "form": "Ghazal",
            "form_fa": "غزل",
            "farsi": {
                "lines": farsi,
                "couplets": pair_couplets(farsi),
                "full_text": "\n".join(farsi),
            },
            "english": {
                "lines": english,
                "couplets": pair_couplets(english),
                "full_text": "\n".join(english),
            },
            "source": "hafizonlove.com",
            "source_url": result["source_url"],
        }

        # Save individual poem
        poem_path = POEMS_DIR / f"{idx:03d}.json"
        with open(poem_path, "w", encoding="utf-8") as f:
            json.dump(poem, f, ensure_ascii=False, indent=2)

        collection.append(poem)
        success += 1
        line_info = f"{len(farsi)}fa/{len(english)}en lines"
        print(f"✓ ({line_info})")

        # Be polite to the server
        time.sleep(1.5)

    # Save full collection
    output = {
        "poet": "Hafez",
        "poet_fa": "حافظ",
        "poet_full_name": "Khwaja Shams-ud-Din Muhammad Hafez-e Shirazi",
        "poet_full_name_fa": "خواجه شمس‌الدین محمد حافظ شیرازی",
        "description": "30 famous ghazals from the Divan of Hafez, in Farsi with English translation",
        "source": "hafizonlove.com",
        "total_poems": len(collection),
        "poems": collection,
    }

    collection_path = OUTPUT_DIR / "hafez-collection.json"
    with open(collection_path, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print(f"\n{'='*50}")
    print(f"Done! {success}/30 poems saved")
    print(f"  Collection: {collection_path}")
    print(f"  Individual: {POEMS_DIR}/001.json — {success:03d}.json")


if __name__ == "__main__":
    main()
