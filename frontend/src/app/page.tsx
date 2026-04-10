"use client";

import { useEffect, useState, useCallback, useRef, lazy, Suspense } from "react";
import { TodayCanvas } from "@/lib/types";
import { fetchTodayCanvas, fetchRefreshedCanvas, addFavorite, removeFavorite, checkFavorite, saveCanvasHistory } from "@/lib/api";
import PaintingCard from "@/components/canvas/PaintingCard";
import NovelPageCard from "@/components/canvas/NovelPageCard";
import LiteratureCard from "@/components/canvas/LiteratureCard";
import FaalCard from "@/components/canvas/FaalCard";

const AICreativeMode = lazy(() => import("@/components/canvas/AICreativeMode"));

interface FavState {
  isFav: boolean;
  favId: string | null;
}

type TabId = "painting" | "novel" | "literature" | "faal";

const TABS: { id: TabId; label: string; sublabel: string }[] = [
  { id: "painting", label: "Canvas", sublabel: "painting" },
  { id: "novel", label: "One Page", sublabel: "novel" },
  { id: "literature", label: "Verse", sublabel: "literature" },
  { id: "faal", label: "Faal", sublabel: "فال حافظ" },
];

/* ── Refresh loading overlay — elevated orbiting dots ── */

const CURATING_MESSAGES = [
  "Curating your tale",
  "Mixing the palette",
  "Unrolling the scroll",
  "Choosing the light",
  "Setting the scene",
  "Finding the thread",
];

function RefreshOverlay() {
  const [msgIndex, setMsgIndex] = useState(0);
  useEffect(() => {
    setMsgIndex(Math.floor(Math.random() * CURATING_MESSAGES.length));
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-parchment animate-fade-in">
      {/* Orbiting constellation */}
      <div className="relative mb-14" style={{ width: 120, height: 120 }}>
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
            width: 38, height: 38,
            left: "50%", top: "50%",
            marginLeft: -19, marginTop: -19,
            background: "radial-gradient(circle at 38% 35%, #3D3225, #2C2418)",
            boxShadow: "0 2px 12px rgba(44,36,24,0.15)",
            animation: "dot-orbit-left 2.8s cubic-bezier(0.45, 0, 0.55, 1) infinite",
          }}
        >
          {/* Specular highlight */}
          <span
            className="absolute rounded-full bg-white/20"
            style={{ width: "30%", height: "25%", top: "18%", left: "28%", filter: "blur(1px)" }}
          />
        </span>

        {/* Medium gold dot — counter-orbits */}
        <span
          className="absolute block rounded-full"
          style={{
            width: 26, height: 26,
            left: "50%", top: "50%",
            marginLeft: -13, marginTop: -13,
            background: "radial-gradient(circle at 40% 32%, #C49A2C, #8B6914)",
            boxShadow: "0 2px 10px rgba(139,105,20,0.2)",
            animation: "dot-orbit-right 2.8s cubic-bezier(0.45, 0, 0.55, 1) infinite",
          }}
        >
          <span
            className="absolute rounded-full bg-white/25"
            style={{ width: "28%", height: "22%", top: "16%", left: "26%", filter: "blur(0.8px)" }}
          />
        </span>

        {/* Tiny trailing dot — a spark that follows the gold */}
        <span
          className="absolute block rounded-full"
          style={{
            width: 10, height: 10,
            left: "50%", top: "50%",
            marginLeft: -5, marginTop: -5,
            background: "radial-gradient(circle at 40% 35%, #D4AA3C, #A67C1A)",
            boxShadow: "0 0 8px rgba(139,105,20,0.3)",
            animation: "dot-orbit-trail 2.8s cubic-bezier(0.45, 0, 0.55, 1) infinite",
            opacity: 0.6,
          }}
        />

        {/* Subtle ring trace — ghostly orbit path */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 120 120">
          <ellipse
            cx="60" cy="60" rx="42" ry="22"
            fill="none"
            stroke="#8B6914"
            strokeWidth="0.5"
            opacity="0.08"
            transform="rotate(-8 60 60)"
          />
        </svg>
      </div>

      {/* Poetic message — fades in gently */}
      <p
        className="text-sm text-sepia-light/60 tracking-[0.2em] uppercase"
        style={{
          fontFamily: "var(--font-ui)",
          animation: "matisse-fade 0.8s ease-in 0.4s forwards",
          opacity: 0,
        }}
      >
        {CURATING_MESSAGES[msgIndex]}
      </p>

      {/* Five-dot divider fades in last */}
      <div
        className="dot-divider mt-5"
        style={{
          animation: "matisse-fade 0.5s ease-in 1.2s forwards",
          opacity: 0,
        }}
      >
        <span /><span /><span /><span /><span />
      </div>
    </div>
  );
}

export default function HomePage() {
  const [canvas, setCanvas] = useState<TodayCanvas | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<TabId>("painting");


  const [faalKey, setFaalKey] = useState(0);
  const [paintingFav, setPaintingFav] = useState<FavState>({ isFav: false, favId: null });
  const [novelFav, setNovelFav] = useState<FavState>({ isFav: false, favId: null });
  const [litFav, setLitFav] = useState<FavState>({ isFav: false, favId: null });

  // Swipe handling
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    // Only trigger if horizontal swipe is dominant and significant
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      const tabIds = TABS.map(t => t.id);
      const currentIdx = tabIds.indexOf(activeTab);
      if (dx < 0 && currentIdx < tabIds.length - 1) {
        setActiveTab(tabIds[currentIdx + 1]);
      } else if (dx > 0 && currentIdx > 0) {
        setActiveTab(tabIds[currentIdx - 1]);
      }
    }
  }

  useEffect(() => {
    fetchTodayCanvas()
      .then(async (data) => {
        const c = data.canvas;
        setCanvas(c);
        // Save canvas history + check all favorites in parallel
        const promises: Promise<void>[] = [
          saveCanvasHistory(c).catch(() => {}),
        ];
        if (c.painting) {
          promises.push(
            checkFavorite("painting", c.painting.title)
              .then((r) => setPaintingFav({ isFav: r.is_favorited, favId: r.favorite_id }))
              .catch(() => {})
          );
        }
        if (c.novel_page) {
          promises.push(
            checkFavorite("novel", c.novel_page.novel_title)
              .then((r) => setNovelFav({ isFav: r.is_favorited, favId: r.favorite_id }))
              .catch(() => {})
          );
        }
        if (c.literature) {
          promises.push(
            checkFavorite("literature", c.literature.title)
              .then((r) => setLitFav({ isFav: r.is_favorited, favId: r.favorite_id }))
              .catch(() => {})
          );
        }
        await Promise.all(promises);
      })
      .catch((e) => {
        console.error("Canvas load failed:", e);
        setError(`Could not load today's canvas: ${e?.message || e}`);
      })
      .finally(() => setLoading(false));
  }, []);

  const toggleFav = useCallback(
    async (
      type: string,
      title: string,
      subtitle: string | null,
      imageUrl: string | null,
      state: FavState,
      setter: (s: FavState) => void
    ) => {
      try {
        if (state.isFav && state.favId) {
          await removeFavorite(state.favId);
          setter({ isFav: false, favId: null });
        } else {
          const fav = await addFavorite(type, title, subtitle, imageUrl);
          setter({ isFav: true, favId: fav.id });
        }
      } catch {
        // silently fail
      }
    },
    []
  );

  async function handleRefresh() {
    setRefreshing(true);
    try {
      const data = await fetchRefreshedCanvas();
      const c = data.canvas;
      setCanvas(c);
      setPaintingFav({ isFav: false, favId: null });
      setNovelFav({ isFav: false, favId: null });
      setLitFav({ isFav: false, favId: null });
      setFaalKey((k) => k + 1);
      // Save + check all favorites in parallel
      const promises: Promise<void>[] = [
        saveCanvasHistory(c).catch(() => {}),
      ];
      if (c.painting) {
        promises.push(
          checkFavorite("painting", c.painting.title)
            .then((r) => setPaintingFav({ isFav: r.is_favorited, favId: r.favorite_id }))
            .catch(() => {})
        );
      }
      if (c.novel_page) {
        promises.push(
          checkFavorite("novel", c.novel_page.novel_title)
            .then((r) => setNovelFav({ isFav: r.is_favorited, favId: r.favorite_id }))
            .catch(() => {})
        );
      }
      if (c.literature) {
        promises.push(
          checkFavorite("literature", c.literature.title)
            .then((r) => setLitFav({ isFav: r.is_favorited, favId: r.favorite_id }))
            .catch(() => {})
        );
      }
      await Promise.all(promises);
    } catch {
      // silently fail
    } finally {
      setRefreshing(false);
    }
  }


  function formatDate(dateStr: string) {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  }

  if (loading) {
    return <RefreshOverlay />;
  }

  if (error || !canvas) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-20 text-center">
        <h2
          className="text-2xl text-sepia mb-4"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          The gallery is resting
        </h2>
        <p className="text-sepia-light">
          {error || "No canvas available today. Please check back later."}
        </p>
      </div>
    );
  }

  const activeIndex = TABS.findIndex((t) => t.id === activeTab);

  return (
    <div className="animate-fade-in">
      {refreshing && <RefreshOverlay />}

      {/* ── Header: mood word + date + refresh ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-4 sm:pt-8 pb-1 sm:pb-2">
        {canvas.mood_word && (
          <div className="flex justify-center pb-2 sm:pb-4">
            <p
              className="text-2xl sm:text-5xl text-sepia/12 tracking-[0.25em] sm:tracking-[0.3em] uppercase"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              {canvas.mood_word}
            </p>
          </div>
        )}
        <div className="flex items-center justify-between">
          <p
            className="text-[10px] sm:text-xs text-sepia-light/70 uppercase tracking-[0.15em] sm:tracking-[0.2em]"
            style={{ fontFamily: "var(--font-ui)" }}
          >
            {formatDate(canvas.date)}
          </p>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            aria-label="New canvas"
            className="group relative flex items-center justify-center w-14 h-14 sm:w-14 sm:h-14
                       cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed
                       active:scale-[0.88] transition-transform duration-150"
          >
            {/* Soft ambient glow — always visible, makes it feel alive */}
            <span
              className="absolute w-12 h-12 sm:w-12 sm:h-12 rounded-full"
              style={{
                background: "radial-gradient(circle, rgba(139,105,20,0.06) 30%, transparent 70%)",
              }}
            />

            {/* Delicate gold ring — the signature element */}
            <svg className="absolute w-10 h-10 sm:w-10 sm:h-10" viewBox="0 0 36 36">
              <circle
                cx="18" cy="18" r="15.5"
                fill="none"
                stroke="#8B6914"
                strokeWidth="0.7"
                className="opacity-35 group-hover:opacity-70 group-active:opacity-80
                           transition-opacity duration-300"
              />
              {/* Tiny decorative notches at cardinal points — like a compass or clock */}
              <line x1="18" y1="2" x2="18" y2="3.5" stroke="#8B6914" strokeWidth="0.6" opacity="0.2" />
              <line x1="18" y1="32.5" x2="18" y2="34" stroke="#8B6914" strokeWidth="0.6" opacity="0.2" />
              <line x1="2" y1="18" x2="3.5" y2="18" stroke="#8B6914" strokeWidth="0.6" opacity="0.2" />
              <line x1="32.5" y1="18" x2="34" y2="18" stroke="#8B6914" strokeWidth="0.6" opacity="0.2" />
            </svg>

            {/* Orbiting spark — a single gold dot traces the ring */}
            <svg
              className="absolute w-10 h-10 sm:w-10 sm:h-10
                         opacity-40 group-hover:opacity-80
                         transition-opacity duration-400"
              viewBox="0 0 36 36"
              style={{ animation: "refresh-orbit 4s linear infinite" }}
            >
              <circle cx="18" cy="2.5" r="1" fill="#8B6914" opacity="0.7" />
            </svg>

            {/* Core — warm gold sphere, not dark */}
            <span
              className="relative block w-3.5 h-3.5 sm:w-3.5 sm:h-3.5 rounded-full
                         transition-all duration-300 ease-out
                         group-hover:scale-110 group-active:scale-90"
              style={{
                background: "radial-gradient(circle at 40% 35%, #C49A2C, #8B6914, #6B5420)",
                boxShadow: "0 0 6px rgba(139,105,20,0.35), 0 0 12px rgba(139,105,20,0.12)",
              }}
            >
              {/* Tiny specular */}
              <span
                className="absolute rounded-full bg-white/40"
                style={{
                  width: "30%", height: "25%", top: "18%", left: "25%",
                  filter: "blur(0.5px)",
                }}
              />
            </span>
          </button>
        </div>
      </div>

      {/* ── Tab Navigation — compact on mobile ── */}
      <nav className="max-w-6xl mx-auto px-4 sm:px-6 pt-3 sm:pt-6 pb-1 sm:pb-2 sticky top-[57px] sm:top-[73px] z-30 bg-parchment sm:bg-parchment/95 sm:backdrop-blur-sm">
        <div className="relative flex items-end justify-center gap-0">
          {TABS.map((tab) => {
            const isActive = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="group relative flex-1 flex flex-col items-center cursor-pointer
                           transition-all duration-400 py-2.5 sm:py-5"
              >
                <span
                  className="text-xs sm:text-sm tracking-wide transition-all duration-400"
                  style={{
                    fontFamily: "var(--font-heading)",
                    color: isActive ? "#2C2418" : "rgba(107, 93, 77, 0.4)",
                    fontWeight: isActive ? 600 : 400,
                  }}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}

          {/* Active indicator line */}
          <div
            className="absolute bottom-0 h-[2px] bg-gold/70 transition-all duration-400 ease-out rounded-full"
            style={{
              width: `${100 / TABS.length}%`,
              left: `${(activeIndex * 100) / TABS.length}%`,
            }}
          />

          {/* Bottom border */}
          <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-warm-border/30" />
        </div>
      </nav>

      {/* ── Tab Content — swipeable on mobile ── */}
      <div
        className="min-h-[50vh] sm:min-h-[60vh]"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Painting */}
        {activeTab === "painting" && canvas.painting && (
          <section className="animate-fade-in" key="painting">
            <div className="max-w-5xl mx-auto px-3 sm:px-6 pt-4 sm:pt-8">
              <PaintingCard
                painting={canvas.painting}
                isFavorite={paintingFav.isFav}
                onFavoriteToggle={() =>
                  toggleFav("painting", canvas.painting.title, `${canvas.painting.artist}, ${canvas.painting.year}`, canvas.painting.image_url, paintingFav, setPaintingFav)
                }
              />
            </div>
          </section>
        )}

        {/* Novel */}
        {activeTab === "novel" && canvas.novel_page && (
          <section className="animate-fade-in" key="novel">
            <div className="max-w-3xl mx-auto px-3 sm:px-6 pt-4 sm:pt-8">
              <NovelPageCard
                novelPage={canvas.novel_page}
                isFavorite={novelFav.isFav}
                onFavoriteToggle={() =>
                  toggleFav("novel", canvas.novel_page.novel_title, `${canvas.novel_page.author} — Page ${canvas.novel_page.page_number}`, null, novelFav, setNovelFav)
                }
              />
            </div>
          </section>
        )}

        {/* Literature */}
        {activeTab === "literature" && canvas.literature && (
          <section className="animate-fade-in" key="literature">
            <div className="max-w-3xl mx-auto px-3 sm:px-6 pt-4 sm:pt-8">
              <LiteratureCard
                literature={canvas.literature}
                isFavorite={litFav.isFav}
                onFavoriteToggle={() =>
                  toggleFav("literature", canvas.literature.title, `${canvas.literature.author} — ${canvas.literature.genre}`, null, litFav, setLitFav)
                }
              />
            </div>
          </section>
        )}

        {/* Faal-e Hafez */}
        {activeTab === "faal" && (
          <section className="animate-fade-in" key="faal">
            <div className="max-w-3xl mx-auto px-3 sm:px-6 pt-4 sm:pt-8">
              <FaalCard refreshKey={faalKey} />
            </div>
          </section>
        )}
      </div>

      {/* ── Your Turn ── */}
      <div className="py-8 sm:py-16 flex flex-col items-center gap-3 sm:gap-4">
        <div className="dot-divider"><span /><span /><span /><span /><span /></div>
        <p
          className="text-[10px] sm:text-xs uppercase tracking-[0.25em] text-sepia-light/60 mt-1"
          style={{ fontFamily: "var(--font-ui)" }}
        >
          now, your turn
        </p>
      </div>
      <section className="max-w-3xl mx-auto px-3 sm:px-6 pb-8 sm:pb-12">
        <Suspense fallback={<div className="h-40" />}>
          <AICreativeMode
            prompt={canvas.ai_prompt}
            painting={canvas.painting}
            literature={canvas.literature}
            novel={canvas.novel_page}
            paintingContext={canvas.painting ? `${canvas.painting.title} by ${canvas.painting.artist}` : ""}
            literatureContext={canvas.literature ? `${canvas.literature.title} by ${canvas.literature.author}` : ""}
          />
        </Suspense>
      </section>

      {/* Bottom spacer for mobile nav */}
      <div className="pb-24 sm:pb-20" />
    </div>
  );
}
