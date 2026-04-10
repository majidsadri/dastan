"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { speakText } from "@/lib/api";

// Cache TTS blobs so repeat plays are instant
const ttsCache = new Map<string, Blob>();

interface HafezPoem {
  id: number;
  ghazal_number: number;
  title_en: string;
  title_fa: string;
  poet: string;
  poet_fa: string;
  era: string;
  origin: string;
  form: string;
  form_fa: string;
  farsi: { lines: string[]; couplets: string[][]; full_text: string };
  english: { lines: string[]; couplets: string[][]; full_text: string };
}

// Background setar music volume
const SETAR_VOLUME = 0.35;

export default function FaalCard({ refreshKey = 0 }: { refreshKey?: number }) {
  const [poem, setPoem] = useState<HafezPoem | null>(null);
  const [showFarsi, setShowFarsi] = useState(false);
  const [loading, setLoading] = useState(true);
  const [ttsLang, setTtsLang] = useState<"farsi" | "english">("farsi");
  const [ttsState, setTtsState] = useState<"idle" | "loading" | "playing" | "paused">("idle");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const blobUrlRef = useRef<string | null>(null);
  const setarRef = useRef<HTMLAudioElement | null>(null);

  function startAmbient() {
    if (setarRef.current) return;
    const setar = new Audio("/audio/setar-ambient.mp3");
    setar.loop = true;
    setar.volume = SETAR_VOLUME;
    setarRef.current = setar;
    setar.play().then(() => {
      console.log("[Setar] playing at volume", SETAR_VOLUME);
    }).catch((err) => {
      console.error("[Setar] play failed:", err);
      // Retry once after a short delay
      setTimeout(() => {
        setar.play().catch((e) => console.error("[Setar] retry failed:", e));
      }, 500);
    });
  }

  function pauseAmbient() {
    if (setarRef.current) setarRef.current.pause();
  }

  function resumeAmbient() {
    if (setarRef.current) setarRef.current.play().catch(() => {});
  }

  function stopAmbient() {
    const setar = setarRef.current;
    if (!setar) return;
    // Fade out over ~1 second
    const step = SETAR_VOLUME / 20;
    const fade = setInterval(() => {
      const next = setar.volume - step;
      if (next <= 0) {
        clearInterval(fade);
        setar.pause();
        setar.currentTime = 0;
        setar.volume = 0;
        setarRef.current = null;
      } else {
        setar.volume = next;
      }
    }, 50);
  }

  function handleTtsToggle() {
    if (ttsState === "playing" && audioRef.current) {
      audioRef.current.pause();
      pauseAmbient();
      setTtsState("paused");
      return;
    }
    if (ttsState === "paused" && audioRef.current) {
      audioRef.current.play();
      resumeAmbient();
      setTtsState("playing");
      return;
    }
    if (ttsState === "loading" || !poem) return;
    playPoem();
  }

  function handleStop() {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    stopAmbient();
    setTtsState("idle");
  }

  async function playPoem() {
    if (!poem) return;
    const isFarsi = ttsLang === "farsi";

    // Start setar immediately — must be inside the user gesture (tap)
    // so the browser allows audio playback
    if (isFarsi) startAmbient();

    setTtsState("loading");
    try {
      const textToRead = isFarsi ? poem.farsi.full_text : poem.english.full_text;
      const prompt = isFarsi
        ? "این غزل حافظ را با لحن گرم، آرام و شاعرانه بخوان"
        : "Read this Hafez poem aloud slowly and beautifully, with feeling";

      const cacheKey = `${poem.id}-${ttsLang}`;
      let blob = ttsCache.get(cacheKey);
      if (!blob) {
        blob = await speakText(textToRead, "Achernar", prompt);
        ttsCache.set(cacheKey, blob);
      }

      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
      const url = URL.createObjectURL(blob);
      blobUrlRef.current = url;

      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => { stopAmbient(); setTtsState("idle"); };
      audio.onerror = () => { stopAmbient(); setTtsState("idle"); };

      await audio.play();
      setTtsState("playing");
    } catch {
      stopAmbient();
      setTtsState("idle");
    }
  }

  useEffect(() => {
    setShowFarsi(false);
    setLoading(true);
    fetch("/hafez/hafez-collection.json")
      .then((r) => r.json())
      .then((data) => {
        const poems: HafezPoem[] = data.poems;
        if (refreshKey === 0) {
          // Default: seeded by today's date so it stays consistent per day
          const today = new Date();
          const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
          const idx = seed % poems.length;
          setPoem(poems[idx]);
        } else {
          // On refresh: truly random
          const idx = Math.floor(Math.random() * poems.length);
          setPoem(poems[idx]);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [refreshKey]);

  if (loading) {
    return (
      <div className="paper-card p-6 sm:p-10 animate-pulse-warm">
        <div className="h-4 w-24 bg-warm-border/30 rounded mb-4" />
        <div className="space-y-3">
          <div className="h-3 w-full bg-warm-border/20 rounded" />
          <div className="h-3 w-5/6 bg-warm-border/20 rounded" />
          <div className="h-3 w-4/6 bg-warm-border/20 rounded" />
        </div>
      </div>
    );
  }

  if (!poem) return null;

  return (
    <div className="paper-card overflow-hidden animate-fade-in">
      {/* Header */}
      <div
        className="px-5 sm:px-10 pt-6 sm:pt-10 pb-4 sm:pb-5"
        style={{
          background: "linear-gradient(180deg, rgba(139,105,20,0.04) 0%, transparent 100%)",
        }}
      >
        <div className="flex items-center gap-2 mb-2">
          {/* Small book/divan icon */}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8B6914" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-50">
            <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
            <path d="M8 7h8M8 11h6" />
          </svg>
          <p
            className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-gold/60"
            style={{ fontFamily: "var(--font-ui)" }}
          >
            Faal-e Hafez
          </p>
        </div>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3
              className="text-lg sm:text-xl text-sepia leading-snug"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              {poem.title_en}
            </h3>
            <p
              className="text-[11px] sm:text-xs text-sepia-light/40 mt-1"
              style={{ fontFamily: "var(--font-ui)" }}
            >
              Ghazal #{poem.ghazal_number} &middot; {poem.era} &middot; {poem.origin}
            </p>
          </div>

          {/* TTS controls */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Language toggle */}
            <div className="flex items-center rounded-full border border-warm-border/50 overflow-hidden text-[11px] sm:text-xs">
              <button
                onClick={() => { setTtsLang("farsi"); if (ttsState !== "idle") handleStop(); }}
                className={`px-2.5 py-1.5 sm:px-3 sm:py-1.5 transition-all duration-200 cursor-pointer
                  ${ttsLang === "farsi"
                    ? "bg-gold/15 text-gold font-medium"
                    : "text-sepia-light/50 hover:text-sepia-light"
                  }`}
                style={{ fontFamily: "var(--font-ui)" }}
              >
                فارسی
              </button>
              <button
                onClick={() => { setTtsLang("english"); if (ttsState !== "idle") handleStop(); }}
                className={`px-2.5 py-1.5 sm:px-3 sm:py-1.5 transition-all duration-200 cursor-pointer
                  ${ttsLang === "english"
                    ? "bg-gold/15 text-gold font-medium"
                    : "text-sepia-light/50 hover:text-sepia-light"
                  }`}
                style={{ fontFamily: "var(--font-ui)" }}
              >
                EN
              </button>
            </div>

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

            {/* Stop button — only when playing or paused */}
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
          </div>
        </div>
      </div>

      {/* Poem body */}
      <div className="px-5 sm:px-10 pb-6 sm:pb-10">
        {/* English couplets */}
        <div className="space-y-5 sm:space-y-6 py-2">
          {poem.english.couplets.map((couplet, i) => (
            <div key={i} className="space-y-0.5">
              {couplet.map((line, j) => (
                <p
                  key={j}
                  className="text-[13px] sm:text-sm text-sepia leading-[1.9] sm:leading-[2]"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  {line}
                </p>
              ))}
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="dot-divider my-5 sm:my-6"><span /><span /><span /><span /><span /></div>

        {/* Toggle Farsi button */}
        <button
          onClick={() => setShowFarsi(!showFarsi)}
          className="flex items-center gap-2 text-gold/60 hover:text-gold
                     transition-colors duration-200 cursor-pointer py-1 group"
        >
          {/* Small Farsi calligraphy icon */}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"
            className="text-gold/40 group-hover:text-gold/70 transition-colors duration-200"
            stroke="currentColor"
          >
            <path d="M17 3C17 3 14 8 8 8C5 8 3 6.5 3 6.5" />
            <path d="M3 6.5C3 6.5 5.5 10 10 10C13 10 15.5 8.5 17 7" />
            <circle cx="7" cy="14" r="3" />
            <path d="M10 14C10 14 12 12 14 14C16 16 18 14 18 14" />
            <path d="M18 14V20" />
            <circle cx="18" cy="21" r="1" fill="currentColor" />
          </svg>
          <span
            className="text-[11px] sm:text-xs tracking-wide"
            style={{ fontFamily: "var(--font-ui)" }}
          >
            {showFarsi ? "Hide Farsi" : "Show in Farsi"}
          </span>
        </button>

        {/* Farsi text — revealed on toggle */}
        {showFarsi && (
          <div
            className="mt-4 sm:mt-5 pt-4 sm:pt-5 border-t border-warm-border/30 animate-fade-in"
            dir="rtl"
          >
            <p
              className="text-xs text-sepia-light/30 mb-3 text-right tracking-wide"
              style={{ fontFamily: "var(--font-ui)" }}
              dir="ltr"
            >
              {poem.poet_fa} &middot; {poem.form_fa}
            </p>
            <div className="space-y-4 sm:space-y-5">
              {poem.farsi.couplets.map((couplet, i) => (
                <div key={i} className="space-y-0.5 text-center">
                  {couplet.map((line, j) => (
                    <p
                      key={j}
                      className="text-[14px] sm:text-base text-sepia leading-[2.2] sm:leading-[2.4]"
                      style={{ fontFamily: "var(--font-farsi), Georgia, serif" }}
                    >
                      {line}
                    </p>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Attribution */}
        <p
          className="text-[9px] text-sepia-light/20 mt-5 sm:mt-6"
          style={{ fontFamily: "var(--font-ui)" }}
        >
          Source: hafizonlove.com
        </p>
      </div>
    </div>
  );
}
