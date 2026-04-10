"use client";

import { useState, useRef } from "react";
import { LiteratureHighlight } from "@/lib/types";
import { speakText } from "@/lib/api";
import Badge from "@/components/ui/Badge";
import FavoriteButton from "@/components/ui/FavoriteButton";

interface LiteratureCardProps {
  literature: LiteratureHighlight;
  isFavorite: boolean;
  onFavoriteToggle: () => void;
}

export default function LiteratureCard({
  literature,
  isFavorite,
  onFavoriteToggle,
}: LiteratureCardProps) {
  const [ttsState, setTtsState] = useState<"idle" | "loading" | "playing" | "paused">("idle");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const blobUrlRef = useRef<string | null>(null);

  function handleTtsToggle() {
    if (ttsState === "playing" && audioRef.current) {
      audioRef.current.pause();
      setTtsState("paused");
      return;
    }
    if (ttsState === "paused" && audioRef.current) {
      audioRef.current.play();
      setTtsState("playing");
      return;
    }
    if (ttsState === "loading") return;
    playAudio();
  }

  function handleStop() {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setTtsState("idle");
  }

  async function playAudio() {
    setTtsState("loading");
    try {
      const blob = await speakText(
        literature.content,
        "Achernar",
        "Read this poem aloud slowly and beautifully, with feeling"
      );

      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);

      const url = URL.createObjectURL(blob);
      blobUrlRef.current = url;

      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => setTtsState("idle");
      audio.onerror = () => setTtsState("idle");
      await audio.play();
      setTtsState("playing");
    } catch {
      setTtsState("idle");
    }
  }

  return (
    <div className="paper-card dot-accent p-5 sm:p-10 animate-fade-in">
      <div className="flex items-start justify-between gap-3 sm:gap-4 mb-3 sm:mb-4">
        <div>
          <h3
            className="text-xl sm:text-3xl text-sepia"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            {literature.title}
          </h3>
          <p className="text-sm sm:text-base text-sepia-light mt-0.5 sm:mt-1">
            {literature.author}
            {literature.author_country && ` \u2014 ${literature.author_country}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Play / Pause button */}
          <button
            onClick={handleTtsToggle}
            disabled={ttsState === "loading"}
            className={`flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-full
                       border transition-all duration-300 cursor-pointer
                       ${ttsState === "playing" || ttsState === "paused"
                         ? "bg-gold/10 border-gold text-gold"
                         : "bg-transparent border-warm-border/50 text-sepia-light/50 hover:text-gold hover:border-gold/50"
                       }
                       ${ttsState === "loading" ? "opacity-50 cursor-wait" : "active:scale-90"}`}
            aria-label={ttsState === "playing" ? "Pause" : ttsState === "paused" ? "Resume" : "Read aloud"}
          >
            {ttsState === "loading" ? (
              <svg width="18" height="18" viewBox="0 0 24 24" className="animate-spin">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" strokeDasharray="31.4" strokeDashoffset="10" strokeLinecap="round" />
              </svg>
            ) : ttsState === "playing" ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="5" width="4" height="14" rx="1" />
                <rect x="14" y="5" width="4" height="14" rx="1" />
              </svg>
            ) : ttsState === "paused" ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="6 3 20 12 6 21 6 3" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" stroke="none" />
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
              </svg>
            )}
          </button>
          {/* Stop button */}
          {(ttsState === "playing" || ttsState === "paused") && (
            <button
              onClick={handleStop}
              className="flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-full
                        border border-warm-border/50 text-sepia-light/50 hover:text-red-400 hover:border-red-400/50
                        transition-all duration-300 cursor-pointer active:scale-90"
              aria-label="Stop"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <rect x="5" y="5" width="14" height="14" rx="2" />
              </svg>
            </button>
          )}
          <FavoriteButton isFavorite={isFavorite} onClick={onFavoriteToggle} />
        </div>
      </div>

      {/* Genre tag */}
      <div className="mb-5 sm:mb-8">
        <Badge variant="gold">{literature.genre}</Badge>
      </div>

      {/* Content */}
      <div
        className={`prose-reading ${
          literature.genre === "poem" ? "whitespace-pre-line" : ""
        }`}
      >
        {literature.content.split("\n").map((paragraph, i) => (
          <p key={i}>{paragraph}</p>
        ))}
      </div>

      {/* Original language text */}
      {literature.original_text && (
        <div className="mt-6 sm:mt-8 p-4 sm:p-5 bg-highlight rounded-lg border border-warm-border">
          <p
            className="text-[10px] sm:text-xs uppercase tracking-widest text-sepia-light mb-2 sm:mb-3"
            style={{ fontFamily: "var(--font-ui)" }}
          >
            {literature.original_language
              ? `Original (${literature.original_language})`
              : "Original text"}
          </p>
          <div className="text-sm sm:text-base text-sepia-light italic leading-relaxed whitespace-pre-line">
            {literature.original_text}
          </div>
        </div>
      )}
    </div>
  );
}
