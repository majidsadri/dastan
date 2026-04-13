from __future__ import annotations

import json
import logging
import re
from typing import List, Optional

from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.core.config import settings

router = APIRouter(prefix="/api/ai", tags=["ai"])
logger = logging.getLogger(__name__)


class AIContinueRequest(BaseModel):
    text: str
    painting_context: str
    literature_context: str


class AIContinueResponse(BaseModel):
    continuation: str
    style_note: str


class AICreativeRequest(BaseModel):
    mode: str  # "poem", "letter", "ekphrasis", "story", "dialogue"
    painting_context: str
    literature_context: str
    user_input: str = ""  # optional user text for some modes


class AICreativeResponse(BaseModel):
    content: str
    mode: str
    label: str


def _call_claude(prompt: str, max_tokens: int = 800) -> Optional[str]:
    if not settings.ANTHROPIC_API_KEY:
        return None
    try:
        import anthropic
        client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
        message = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=max_tokens,
            messages=[{"role": "user", "content": prompt}],
        )
        return message.content[0].text
    except Exception as e:
        logger.warning(f"Claude API error: {e}")
        return None


@router.post("/continue", response_model=AIContinueResponse)
async def ai_continue(request: AIContinueRequest):
    prompt = (
        f"You are a poetic, contemplative writing companion for Dastan, "
        f"a daily art and literature app. The user is viewing:\n\n"
        f"Painting: {request.painting_context}\n"
        f"Literature: {request.literature_context}\n\n"
        f"The user wrote:\n\"{request.text}\"\n\n"
        f"Continue their writing in a style that weaves together the painting "
        f"and literature above. Be lyrical but grounded. 2-3 paragraphs max. "
        f"Do not explain what you're doing — just write the continuation."
    )
    result = _call_claude(prompt)
    if result:
        return AIContinueResponse(continuation=result, style_note="")
    return AIContinueResponse(
        continuation=_fallback(request.painting_context, request.literature_context),
        style_note="AI temporarily unavailable.",
    )


@router.post("/creative", response_model=AICreativeResponse)
async def ai_creative(request: AICreativeRequest):
    """Multi-mode creative generation inspired by today's canvas."""

    # Build keyword context if provided
    keyword_hint = ""
    if request.user_input.strip():
        keyword_hint = (
            f"\n\nThe reader selected these keywords as inspiration: {request.user_input}. "
            f"Weave them naturally into the piece — they should feel essential, not forced."
        )

    prompts = {
        "haiku": (
            f"Write a single haiku (5-7-5 syllables, three lines) inspired by the painting "
            f"\"{request.painting_context}\" and the literary work "
            f"\"{request.literature_context}\". "
            f"The haiku should capture one precise moment — a color, a feeling, "
            f"a detail that bridges the painting and the text. "
            f"Just the three lines, nothing else. No title, no explanation."
            f"{keyword_hint}"
        ),
        "micro_story": (
            f"Write a micro story (exactly 3-4 sentences, no more than 60 words) "
            f"inspired by the painting \"{request.painting_context}\" and "
            f"\"{request.literature_context}\". "
            f"It should feel complete — a beginning, a turn, an ending. "
            f"Poetic but grounded. No title, no explanation. Just the story."
            f"{keyword_hint}"
        ),
        "poem": (
            f"Write an original poem (8-16 lines) inspired by the painting "
            f"\"{request.painting_context}\" and the literary work "
            f"\"{request.literature_context}\". "
            f"The poem should feel like it lives between the visual and the written — "
            f"borrow colors from the painting, rhythms from the literature. "
            f"No title needed. Just the poem."
        ),
        "letter": (
            f"Write a short, intimate letter (150-250 words) from the artist of "
            f"\"{request.painting_context}\" to the author of "
            f"\"{request.literature_context}\". "
            f"The letter should reveal what the artist was feeling while painting, "
            f"and draw a surprising connection to the writer's work. "
            f"Use period-appropriate language but keep it warm and personal. "
            f"Start with 'Dear' and end with a closing. Nothing else."
        ),
        "ekphrasis": (
            f"Write an ekphrasis — a vivid literary description that brings "
            f"\"{request.painting_context}\" to life through words. "
            f"200-300 words. Enter the painting. Describe not just what you see "
            f"but what you smell, hear, feel. What happened a moment before this "
            f"scene? What will happen next? Channel the style of "
            f"\"{request.literature_context}\" in your prose. "
            f"Just the ekphrasis, no explanation."
        ),
        "story": (
            f"Write the opening paragraph (200-300 words) of a short story "
            f"that begins inside the world of \"{request.painting_context}\". "
            f"A character in or near the painting is about to make a decision "
            f"that will change everything. The tone should echo "
            f"\"{request.literature_context}\". "
            f"End at a moment of tension. Just the story opening, nothing else."
        ),
        "dialogue": (
            f"Write a short, unexpected dialogue (8-12 exchanges) between "
            f"a figure from the painting \"{request.painting_context}\" and "
            f"a character from \"{request.literature_context}\". "
            f"They meet in a liminal space — a dream, a museum after hours, "
            f"a train station between worlds. The conversation should reveal "
            f"something surprising about both works. "
            f"Format as:\n\nFIGURE: ...\nCHARACTER: ...\n\nNo stage directions, no explanation."
        ),
    }

    labels = {
        "haiku": "A haiku",
        "micro_story": "A micro story",
        "poem": "A poem between brush and page",
        "letter": "A letter across centuries",
        "ekphrasis": "Walking into the painting",
        "story": "A story born from the canvas",
        "dialogue": "A conversation between worlds",
    }

    mode = request.mode
    if mode not in prompts:
        mode = "haiku"

    prompt = prompts[mode]
    # For legacy modes (not haiku/micro_story), append user input the old way
    if mode not in ("haiku", "micro_story") and request.user_input.strip():
        prompt += (
            f"\n\nThe reader also shared this thought: \"{request.user_input}\". "
            f"Let it subtly influence the piece."
        )

    result = _call_claude(prompt, max_tokens=1000)
    if result:
        return AICreativeResponse(content=result, mode=mode, label=labels[mode])

    return AICreativeResponse(
        content="The muse is resting. Please try again in a moment.",
        mode=mode,
        label=labels[mode],
    )


def _fallback(painting_ctx: str, literature_ctx: str) -> str:
    return (
        f"The words linger like brushstrokes on canvas. {painting_ctx} seems to "
        f"whisper the same truth that echoes through {literature_ctx}. "
        f"And so the thread continues, weaving between color and language."
    )


# ─────────────────────────────────────────────────────────────
#  Ask the Thinkers — consult up to 3 philosophers in character
# ─────────────────────────────────────────────────────────────


class PhilosopherProfile(BaseModel):
    id: str
    name: str
    school: Optional[str] = ""
    key_ideas: List[str] = Field(default_factory=list)
    famous_quote: Optional[str] = ""
    pull_quote: Optional[str] = ""
    article_excerpt: Optional[str] = ""


class AIConsultRequest(BaseModel):
    question: str
    philosophers: List[PhilosopherProfile]


class ConsultResponseItem(BaseModel):
    id: str
    name: str
    response: str


class AIConsultResponse(BaseModel):
    responses: List[ConsultResponseItem]
    error: Optional[str] = None


PERSIAN_VOICES = {"omar-khayyam", "mulla-sadra", "ibn-sina"}


def _contains_persian_script(text: str) -> bool:
    """Return True if the text has any Arabic/Persian script characters."""
    for ch in text:
        code = ord(ch)
        # Arabic (0600–06FF), Arabic Supplement (0750–077F),
        # Arabic Extended-A (08A0–08FF), Arabic Presentation Forms-A/B (FB50–FEFF).
        if (
            0x0600 <= code <= 0x06FF
            or 0x0750 <= code <= 0x077F
            or 0x08A0 <= code <= 0x08FF
            or 0xFB50 <= code <= 0xFEFC
        ):
            return True
    return False


def _build_consult_prompt(question: str, profiles: List[PhilosopherProfile]) -> str:
    lines: List[str] = []
    lines.append(
        "You are helping a reader consult philosophers about a real question."
    )
    lines.append(
        "Respond AS each philosopher, in first person, strictly grounded in "
        "their documented positions. Do not soften their views into generic "
        "self-help. Do not invent ideas they never held."
    )
    lines.append("")
    lines.append("THE READER'S QUESTION:")
    lines.append(f'"{question.strip()}"')
    question_is_persian = _contains_persian_script(question)

    selected_ids = {p.id for p in profiles}
    persian_selected = selected_ids & PERSIAN_VOICES

    # ── HARD LANGUAGE OVERRIDE ──
    # If the reader wrote in Persian AND a Persian thinker is selected,
    # put the language rule BEFORE everything else so the model sees it first
    # and can't let the English-centric rules below override it.
    if question_is_persian and persian_selected:
        lines.append("")
        lines.append("╔══════════════════════════════════════════════════════╗")
        lines.append("║  HARD LANGUAGE CONSTRAINT — READ BEFORE ANYTHING ELSE ║")
        lines.append("╚══════════════════════════════════════════════════════╝")
        lines.append(
            "The reader wrote in Persian (Farsi script). For the Persian-"
            "tradition thinkers selected below, the response MUST be written "
            "ENTIRELY in Persian script. No English. No transliteration. No "
            "meta-preface. Just Persian."
        )
        lines.append(
            "This language rule OVERRIDES the 60–90 word cap, the \"begin "
            "immediately\" rule, the temperament notes, and the signature-"
            "concept rule below. Persian thinkers respond in Persian, period."
        )
        lines.append("")
        lines.append("Required format by thinker:")
        if "omar-khayyam" in persian_selected:
            lines.append(
                "  • Omar Khayyam: ONE ruba'i — exactly four lines of Persian "
                "verse in the voice of his Rubaiyat (wine, dust, the turning "
                "wheel of the heavens, the rose, the moving finger). Nothing "
                "before the four lines. Nothing after. No gloss. No advice. "
                "Just the quatrain. You may adapt one of his real rubaiyat "
                "or compose one freshly in his unmistakable voice. Example "
                "of the shape (do NOT copy; write one that answers THIS "
                "reader's actual question):"
            )
            lines.append("      این کوزه چو من عاشق زاری بوده‌است")
            lines.append("      در بند سر زلف نگاری بوده‌است")
            lines.append("      این دسته که بر گردن او می‌بینی")
            lines.append("      دستی‌ست که بر گردن یاری بوده‌است")
        if "mulla-sadra" in persian_selected:
            lines.append(
                "  • Mulla Sadra: 3–5 sentences of Persian prose, reverent and "
                "metaphysical. Name his own concepts in Persian/Arabic: "
                "اصالت وجود, حرکت جوهری, تشکیک وجود."
            )
        if "ibn-sina" in persian_selected:
            lines.append(
                "  • Ibn Sina (Avicenna): 3–5 sentences of Persian prose, "
                "physician-metaphysician's measured voice. Use وجود, ماهیت, "
                "واجب‌الوجود where apt."
            )
        if selected_ids - PERSIAN_VOICES:
            lines.append(
                "  • Non-Persian thinkers (any others in the list) still "
                "answer in their usual language (English) per the rules "
                "below — ONLY the Persian-tradition thinkers switch language."
            )
        lines.append("")

    lines.append("PHILOSOPHERS (respond in this exact order):")
    lines.append("")

    for i, p in enumerate(profiles, start=1):
        ideas = ", ".join(p.key_ideas[:6]) if p.key_ideas else ""
        excerpt = (p.article_excerpt or "").strip()
        # Allow more context so the model can ground in the thinker's own text
        if len(excerpt) > 1400:
            excerpt = excerpt[:1400].rsplit(" ", 1)[0] + "…"
        lines.append(f"{i}. {p.name}")
        lines.append(f"   id: {p.id}")
        if p.school:
            lines.append(f"   school: {p.school}")
        if ideas:
            lines.append(f"   key ideas: {ideas}")
        if p.famous_quote:
            lines.append(f'   famous quote: "{p.famous_quote}"')
        if p.pull_quote:
            lines.append(f'   voice: "{p.pull_quote}"')
        if excerpt:
            lines.append(f"   context: {excerpt}")
        lines.append("")

    lines.append("RULES FOR EACH RESPONSE:")
    lines.append("")
    lines.append(
        "• Length: 60–90 words. Tight. No padding. A short, direct reply — not "
        "an essay. EXCEPTION: Omar Khayyam may go up to 110 words when he is "
        "delivering a full ruba'i (quatrain) plus a brief gloss."
    )
    lines.append(
        "• Begin immediately with the thought itself. No 'As X,' no 'Speaking "
        "from my view,' no 'I hear you,' no meta-framing of any kind."
    )
    lines.append(
        "• Use at least ONE signature concept from the thinker's own tradition "
        "by its real name — e.g. Marcus Aurelius: hegemonikon, amor fati, "
        "memento mori, logos; Epicurus: ataraxia, katastematic pleasure; "
        "Aristotle: eudaimonia, the golden mean, telos, phronesis; "
        "Kant: categorical imperative, maxim, duty, dignity; "
        "Spinoza: conatus, adequate ideas, sub specie aeternitatis; "
        "Nietzsche: will to power, self-overcoming, herd morality, eternal "
        "recurrence, becoming; Sartre: bad faith, facticity, condemned to "
        "freedom; Kierkegaard: leap of faith, anxiety as the dizziness of "
        "freedom, the aesthetic/ethical/religious; Heidegger: being-toward-"
        "death, authenticity, thrownness; Arendt: the banality of evil, "
        "natality, the vita activa; Beauvoir: situation, the Other, ambiguity. "
        "Pick whichever actually fits — but name it."
    )
    lines.append(
        "• Match the thinker's temperament: Stoics — measured, plain, weary-"
        "but-kind. Epicureans — warm, gentle about fear. Rationalists (Spinoza, "
        "Descartes) — calm, ordered, almost geometric. German idealists "
        "(Kant, Hegel) — precise, abstract, dignified. Existentialists "
        "(Kierkegaard, Nietzsche, Sartre, Beauvoir) — urgent, personal, "
        "sometimes confrontational. Moderns (Arendt, Heidegger) — grave, "
        "careful, political. Medievals (Augustine, Aquinas, Ibn Sina) — "
        "reverent, theological."
    )
    lines.append(
        "• Address the reader's SPECIFIC question. Answer the actual situation "
        "they described, not an abstract version of it."
    )
    lines.append(
        "• Include one concrete image, example, or turn of phrase the thinker "
        "would actually use — not generic self-help metaphors."
    )
    lines.append(
        "• Do NOT quote their famous quote verbatim. You may rephrase its idea."
    )
    lines.append(
        "• Do NOT give therapy-speak: no 'I hear you,' 'that's valid,' 'take "
        "your time,' 'be kind to yourself,' 'trust the process.'"
    )
    lines.append(
        "• No motivational-poster platitudes. If the thinker would give a "
        "hard or uncomfortable answer, give the hard answer."
    )

    # Persian-tradition thinkers answering an ENGLISH question — they may
    # still lean into their tradition's voice, but the hard-override block
    # above only fires when the question itself is in Persian.
    if persian_selected and not question_is_persian:
        lines.append("")
        lines.append("• PERSIAN TRADITION — voice notes:")
        if "omar-khayyam" in persian_selected:
            lines.append(
                "  – Omar Khayyam answers as a ruba'i poet, not as a lecturer. "
                "Speak in the voice of the Rubaiyat: wine, dust, the turning "
                "jar of the heavens, the rose that opens and falls, the moving "
                "finger that writes and moves on. Deliver ONE quatrain of "
                "four lines, then at most one short sentence of earthly "
                "advice. Never moralize. Never preach. The ruba'i IS the "
                "answer. He may answer in Persian (Farsi script) with a "
                "short English gloss on the next line if the question "
                "invites it — otherwise English verse in his cadence."
            )
        if "mulla-sadra" in persian_selected:
            lines.append(
                "  – Mulla Sadra speaks with the gravitas of the ḥakīm. Use "
                "his actual vocabulary by name: aṣālat al-wujūd (the primacy "
                "of existence over essence), ḥarakat jawhariyya (substantial "
                "motion — the self itself is a flowing, not a fixed thing), "
                "tashkīk al-wujūd (the gradation of being). Reverent, "
                "metaphysical, patient."
            )
        if "ibn-sina" in persian_selected:
            lines.append(
                "  – Ibn Sina (Avicenna) speaks as physician and metaphysician "
                "together. Use wujūd (existence), māhiyya (essence), wājib "
                "al-wujūd (the Necessary Existent), and where apt the Floating "
                "Man thought-experiment. Measured, lucid, diagnostic."
            )

    lines.append("")
    lines.append(
        "Return ONLY a JSON array — no markdown, no code fences, no commentary — "
        "in this exact shape:"
    )
    lines.append('[{"id": "<philosopher id>", "response": "<their answer>"}, ...]')
    lines.append("Preserve the order given above.")
    return "\n".join(lines)


def _extract_json_array(text: str) -> Optional[list]:
    """Pull a JSON array out of the model's reply, tolerating code fences."""
    if not text:
        return None
    stripped = text.strip()
    # Strip markdown code fences if present
    fence = re.match(r"^```(?:json)?\s*(.*?)\s*```$", stripped, re.DOTALL)
    if fence:
        stripped = fence.group(1).strip()
    # Find the outermost array
    start = stripped.find("[")
    end = stripped.rfind("]")
    if start == -1 or end == -1 or end <= start:
        return None
    candidate = stripped[start : end + 1]
    try:
        parsed = json.loads(candidate)
        return parsed if isinstance(parsed, list) else None
    except json.JSONDecodeError:
        return None


@router.post("/consult", response_model=AIConsultResponse)
async def ai_consult(request: AIConsultRequest):
    """Consult 1–3 philosophers about a user's question, in character."""
    if not request.question.strip():
        return AIConsultResponse(responses=[], error="Please ask a question.")
    if not request.philosophers:
        return AIConsultResponse(
            responses=[], error="Select at least one philosopher."
        )

    # Cap at 3 to keep latency and focus
    profiles = request.philosophers[:3]

    prompt = _build_consult_prompt(request.question, profiles)
    # 90 words × 3 thinkers × ~1.6 tokens/word ≈ 430 tokens of content;
    # give headroom for JSON framing and occasional overrun.
    raw = _call_claude(prompt, max_tokens=1200)

    if not raw:
        return AIConsultResponse(
            responses=[],
            error="The thinkers are resting. Please try again in a moment.",
        )

    parsed = _extract_json_array(raw)
    if not parsed:
        logger.warning("Consult: failed to parse JSON from model response")
        return AIConsultResponse(
            responses=[],
            error="The response was unclear. Please try again.",
        )

    # Build id → name lookup for graceful matching
    by_id = {p.id: p for p in profiles}
    responses: List[ConsultResponseItem] = []
    for item in parsed:
        if not isinstance(item, dict):
            continue
        pid = str(item.get("id", "")).strip()
        reply = str(item.get("response", "")).strip()
        if not pid or not reply:
            continue
        profile = by_id.get(pid)
        if not profile:
            continue
        responses.append(
            ConsultResponseItem(id=pid, name=profile.name, response=reply)
        )

    if not responses:
        return AIConsultResponse(
            responses=[],
            error="The thinkers had nothing to say. Please try again.",
        )

    return AIConsultResponse(responses=responses)
