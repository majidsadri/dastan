"use client";

import { useState, useMemo } from "react";
import { generateCreative } from "@/lib/api";
import type { Painting, LiteratureHighlight, NovelPage } from "@/lib/types";

interface AICreativeModeProps {
  prompt?: string;
  painting?: Painting | null;
  literature?: LiteratureHighlight | null;
  novel?: NovelPage | null;
  paintingContext: string;
  literatureContext: string;
}

type Mode = "haiku" | "micro_story";

function extractKeywords(
  painting?: Painting | null,
  literature?: LiteratureHighlight | null,
  novel?: NovelPage | null,
): string[] {
  const words: string[] = [];
  const seen = new Set<string>();
  const add = (w: string) => {
    const key = w.toLowerCase();
    if (key.length > 1 && !seen.has(key)) { seen.add(key); words.push(w); }
  };

  if (painting) {
    if (painting.movement && painting.movement !== "Unknown") add(painting.movement);
    if (painting.origin_country && painting.origin_country !== "Unknown") add(painting.origin_country);
    // Evocative words from title (capitalized, 4+ chars)
    painting.title.split(/[\s,—–\-:]+/).filter(w => w.length >= 4 && /^[A-Z]/.test(w)).slice(0, 2).forEach(add);
    if (painting.artist) {
      const last = painting.artist.split(" ").pop();
      if (last) add(last);
    }
  }

  if (literature) {
    if (literature.genre && literature.genre !== "Unknown") add(literature.genre);
    if (literature.author_country && literature.author_country !== "Unknown") add(literature.author_country);
    if (literature.original_language && literature.original_language !== "English") add(literature.original_language);
    if (literature.author) {
      const last = literature.author.split(" ").pop();
      if (last) add(last);
    }
  }

  if (novel) {
    if (novel.author) {
      const last = novel.author.split(" ").pop();
      if (last) add(last);
    }
    const novelWords = novel.novel_title.split(/[\s,—–\-:]+/).filter(w => w.length >= 4 && /^[A-Z]/.test(w));
    if (novelWords.length > 0) add(novelWords[0]);
  }

  return words.slice(0, 10);
}

export default function AICreativeMode({
  painting,
  literature,
  novel,
  paintingContext,
  literatureContext,
}: AICreativeModeProps) {
  const [mode, setMode] = useState<Mode>("haiku");
  const [selectedKeywords, setSelectedKeywords] = useState<Set<string>>(new Set());
  const [result, setResult] = useState<{ content: string; label: string; mode: Mode } | null>(null);
  const [loading, setLoading] = useState(false);

  const keywords = useMemo(
    () => extractKeywords(painting, literature, novel),
    [painting, literature, novel],
  );

  function toggleKeyword(word: string) {
    setSelectedKeywords((prev) => {
      const next = new Set(prev);
      if (next.has(word)) next.delete(word); else next.add(word);
      return next;
    });
  }

  async function handleGenerate(targetMode: Mode) {
    setLoading(true);
    setResult(null);
    try {
      const keywordStr = Array.from(selectedKeywords).join(", ");
      const r = await generateCreative(targetMode, paintingContext, literatureContext, keywordStr);
      setResult({ content: r.content, label: r.label, mode: targetMode });
    } catch {
      setResult({
        content: "The muse is resting. Please try again in a moment.",
        label: "Error",
        mode: targetMode,
      });
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setResult(null);
    setSelectedKeywords(new Set());
  }

  const otherMode: Mode = result?.mode === "haiku" ? "micro_story" : "haiku";
  const otherLabel = otherMode === "haiku" ? "a haiku" : "a micro story";

  return (
    <div className="paper-card overflow-hidden animate-fade-in">
      {/* Header */}
      <div
        className="px-5 sm:px-10 pt-6 sm:pt-10 pb-0"
        style={{
          background: "linear-gradient(180deg, rgba(139,105,20,0.04) 0%, transparent 100%)",
        }}
      >
        <p
          className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-gold/80 mb-2"
          style={{ fontFamily: "var(--font-ui)" }}
        >
          Now, your turn
        </p>
        <h3
          className="text-xl sm:text-2xl text-sepia leading-tight"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          {result ? (
            result.mode === "haiku" ? "Your haiku" : "Your micro story"
          ) : (
            "Create from today\u2019s canvas"
          )}
        </h3>

        {/* Source line */}
        {!result && (paintingContext || literatureContext) && (
          <p
            className="text-[11px] sm:text-xs text-sepia-light/50 mt-1.5 leading-relaxed"
            style={{ fontFamily: "var(--font-ui)" }}
          >
            from{" "}
            {paintingContext && <span className="text-sepia-light/70">{paintingContext}</span>}
            {paintingContext && literatureContext && " & "}
            {literatureContext && <span className="text-sepia-light/70">{literatureContext}</span>}
          </p>
        )}
      </div>

      <div className="px-5 sm:px-10 pb-6 sm:pb-10">
        {/* ── Pre-generate: keyword selection + mode ── */}
        {!result && !loading && (
          <>
            {/* Keywords */}
            {keywords.length > 0 && (
              <div className="mt-5 sm:mt-6">
                <p
                  className="text-[10px] sm:text-[11px] uppercase tracking-[0.15em] text-sepia-light/40 mb-2.5"
                  style={{ fontFamily: "var(--font-ui)" }}
                >
                  Pick words that speak to you
                </p>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {keywords.map((word) => {
                    const isOn = selectedKeywords.has(word);
                    return (
                      <button
                        key={word}
                        onClick={() => toggleKeyword(word)}
                        className={`px-3 sm:px-3.5 py-1.5 rounded-full text-[11px] sm:text-xs
                                   tracking-wide transition-all duration-200 cursor-pointer border
                                   ${isOn
                                     ? "bg-sepia text-parchment border-sepia shadow-sm"
                                     : "bg-transparent text-sepia-light/60 border-warm-border hover:border-sepia/30 hover:text-sepia"
                                   }`}
                        style={{ fontFamily: "var(--font-ui)" }}
                      >
                        {word}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Mode selector + Generate */}
            <div className="mt-6 sm:mt-8">
              {/* Mode tabs */}
              <div className="flex items-center gap-0 mb-5 sm:mb-6">
                {([
                  { id: "haiku" as Mode, label: "Haiku", sub: "three lines, one breath" },
                  { id: "micro_story" as Mode, label: "Micro story", sub: "three sentences, one world" },
                ]).map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setMode(m.id)}
                    className={`flex-1 py-3 sm:py-3.5 text-center cursor-pointer
                               transition-all duration-200 border-b-2
                               ${mode === m.id
                                 ? "border-sepia"
                                 : "border-warm-border/50 hover:border-warm-border"
                               }`}
                  >
                    <p
                      className={`text-xs sm:text-sm transition-colors duration-200
                                 ${mode === m.id ? "text-sepia font-medium" : "text-sepia-light/50"}`}
                      style={{ fontFamily: "var(--font-heading)" }}
                    >
                      {m.label}
                    </p>
                    <p
                      className={`text-[9px] sm:text-[10px] mt-0.5 transition-colors duration-200
                                 ${mode === m.id ? "text-sepia-light/50" : "text-sepia-light/25"}`}
                      style={{ fontFamily: "var(--font-ui)" }}
                    >
                      {m.sub}
                    </p>
                  </button>
                ))}
              </div>

              {/* Generate button */}
              <button
                onClick={() => handleGenerate(mode)}
                className="w-full py-3 sm:py-3.5 rounded-lg text-sm sm:text-base
                          bg-sepia text-parchment font-medium cursor-pointer
                          hover:bg-sepia/90 active:bg-sepia/80
                          transition-all duration-200
                          disabled:opacity-30 disabled:cursor-not-allowed"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                {mode === "haiku" ? "Write my haiku" : "Write my story"}
              </button>

              {selectedKeywords.size > 0 && (
                <p
                  className="text-center text-[10px] text-sepia-light/30 mt-2"
                  style={{ fontFamily: "var(--font-ui)" }}
                >
                  with {Array.from(selectedKeywords).join(", ")}
                </p>
              )}
            </div>
          </>
        )}

        {/* ── Loading — orbiting dots "magic" ── */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-14 sm:py-18">
            {/* Orbiting constellation — matches refresh overlay */}
            <div className="relative mb-8" style={{ width: 90, height: 90 }}>
              {/* Faint golden halo */}
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background: "radial-gradient(circle, rgba(139,105,20,0.06) 30%, transparent 70%)",
                  transform: "scale(1.8)",
                }}
              />

              {/* Large sepia dot — orbits slowly */}
              <span
                className="absolute block rounded-full"
                style={{
                  width: 28, height: 28,
                  left: "50%", top: "50%",
                  marginLeft: -14, marginTop: -14,
                  background: "radial-gradient(circle at 38% 35%, #3D3225, #2C2418)",
                  boxShadow: "0 2px 10px rgba(44,36,24,0.15)",
                  animation: "dot-orbit-left 2.8s cubic-bezier(0.45, 0, 0.55, 1) infinite",
                }}
              >
                <span
                  className="absolute rounded-full bg-white/20"
                  style={{ width: "30%", height: "25%", top: "18%", left: "28%", filter: "blur(1px)" }}
                />
              </span>

              {/* Medium gold dot — counter-orbits */}
              <span
                className="absolute block rounded-full"
                style={{
                  width: 20, height: 20,
                  left: "50%", top: "50%",
                  marginLeft: -10, marginTop: -10,
                  background: "radial-gradient(circle at 40% 32%, #C49A2C, #8B6914)",
                  boxShadow: "0 2px 8px rgba(139,105,20,0.2)",
                  animation: "dot-orbit-right 2.8s cubic-bezier(0.45, 0, 0.55, 1) infinite",
                }}
              >
                <span
                  className="absolute rounded-full bg-white/25"
                  style={{ width: "28%", height: "22%", top: "16%", left: "26%", filter: "blur(0.8px)" }}
                />
              </span>

              {/* Tiny trailing spark */}
              <span
                className="absolute block rounded-full"
                style={{
                  width: 8, height: 8,
                  left: "50%", top: "50%",
                  marginLeft: -4, marginTop: -4,
                  background: "radial-gradient(circle at 40% 35%, #D4AA3C, #A67C1A)",
                  boxShadow: "0 0 6px rgba(139,105,20,0.3)",
                  animation: "dot-orbit-trail 2.8s cubic-bezier(0.45, 0, 0.55, 1) infinite",
                  opacity: 0.6,
                }}
              />

              {/* Faint orbit ring */}
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 90 90">
                <ellipse
                  cx="45" cy="45" rx="32" ry="16"
                  fill="none" stroke="#8B6914" strokeWidth="0.4"
                  opacity="0.08" transform="rotate(-8 45 45)"
                />
              </svg>
            </div>

            {/* Poetic loading message */}
            <p
              className="text-[11px] sm:text-xs text-sepia-light/40 tracking-[0.15em] uppercase"
              style={{
                fontFamily: "var(--font-ui)",
                animation: "matisse-fade 0.6s ease-in 0.3s forwards",
                opacity: 0,
              }}
            >
              {mode === "haiku" ? "composing your haiku" : "imagining your story"}
            </p>
          </div>
        )}

        {/* ── Result ── */}
        {result && !loading && (
          <div className="mt-5 sm:mt-6 animate-fade-in">
            {/* The generated piece */}
            <div className="py-4 sm:py-6">
              <p
                className={`text-sepia whitespace-pre-line
                           ${result.mode === "haiku"
                             ? "text-center text-lg sm:text-xl leading-[2.2] sm:leading-[2.4]"
                             : "text-sm sm:text-base leading-[1.9] sm:leading-[2]"
                           }`}
                style={{ fontFamily: "var(--font-body)" }}
              >
                {result.content}
              </p>
            </div>

            {/* Divider */}
            <div className="dot-divider my-5 sm:my-6"><span /><span /><span /><span /><span /></div>

            {/* Actions */}
            <div className="flex flex-col gap-3">
              {/* Try again with same mode */}
              <button
                onClick={() => handleGenerate(result.mode)}
                className="w-full py-2.5 sm:py-3 rounded-lg text-xs sm:text-sm
                          border border-warm-border text-sepia-light
                          hover:border-sepia/30 hover:text-sepia
                          transition-all duration-200 cursor-pointer"
                style={{ fontFamily: "var(--font-ui)" }}
              >
                {result.mode === "haiku" ? "Another haiku" : "Another story"}
              </button>

              {/* Switch mode */}
              <button
                onClick={() => handleGenerate(otherMode)}
                className="w-full py-2.5 sm:py-3 rounded-lg text-xs sm:text-sm
                          border border-warm-border text-sepia-light
                          hover:border-sepia/30 hover:text-sepia
                          transition-all duration-200 cursor-pointer"
                style={{ fontFamily: "var(--font-ui)" }}
              >
                Try {otherLabel} instead
              </button>

              {/* Start over */}
              <button
                onClick={handleReset}
                className="text-[11px] text-sepia-light/25 hover:text-sepia-light/50
                          transition-colors cursor-pointer py-1"
                style={{ fontFamily: "var(--font-ui)" }}
              >
                Start over with new words
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
