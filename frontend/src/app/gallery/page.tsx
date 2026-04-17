"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import MuseumCollections from "@/components/ui/MuseumCollections";

interface GalleryPainting {
  title: string;
  artist: string;
  year: string;
  movement: string;
  category: string;
  origin_country: string;
  image_url: string;
}

const CATEGORIES = [
  "All",
  "Impressionism",
  "Renaissance",
  "Baroque",
  "Romanticism",
  "Surrealism",
  "Cubism",
  "Abstract",
  "Expressionism",
  "Realism",
  "Ukiyo-e",
  "Art Nouveau",
  "Symbolism",
  "Pre-Raphaelite",
  "Fauvism",
];

function GalleryImage({ painting, onClick, index }: {
  painting: GalleryPainting;
  onClick: () => void;
  index: number;
}) {
  const [loaded, setLoaded] = useState(false);
  const ref = useRef<HTMLButtonElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { rootMargin: "100px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <button
      ref={ref}
      onClick={onClick}
      className="group block w-full mb-3 sm:mb-4 break-inside-avoid cursor-pointer text-left
                 transition-all duration-500"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(12px)",
        transitionDelay: `${Math.min(index % 8, 4) * 80}ms`,
      }}
    >
      <div className="relative overflow-hidden rounded-lg border border-warm-border/50
                      bg-linen transition-all duration-400
                      group-hover:border-gold/30 group-hover:shadow-lg
                      group-hover:shadow-sepia/[0.06]
                      active:scale-[0.98] active:duration-100">
        {!loaded && (
          <div className="aspect-[3/4] bg-warm-border/20 animate-pulse-warm" />
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={painting.image_url}
          alt={painting.title}
          className={`w-full block transition-all duration-700 ease-out
                     group-hover:scale-[1.02]
                     ${loaded ? "opacity-100" : "opacity-0 absolute inset-0"}`}
          loading="lazy"
          onLoad={() => setLoaded(true)}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent
                       opacity-0 group-hover:opacity-100 transition-opacity duration-400 pointer-events-none" />
      </div>

      <div className="mt-1.5 sm:mt-2 px-0.5">
        <p
          className="text-[11px] sm:text-xs text-sepia leading-tight line-clamp-1
                     group-hover:text-gold transition-colors duration-300"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          {painting.title}
        </p>
        <p
          className="text-[10px] sm:text-[11px] text-sepia-light/60 mt-0.5 line-clamp-1"
          style={{ fontFamily: "var(--font-ui)" }}
        >
          {painting.artist}{painting.year !== "Unknown" && ` · ${painting.year}`}
        </p>
      </div>
    </button>
  );
}

/* ─── Lightbox ─── */
function Lightbox({
  painting,
  index,
  total,
  onClose,
  onNav,
}: {
  painting: GalleryPainting;
  index: number;
  total: number;
  onClose: () => void;
  onNav: (dir: 1 | -1) => void;
}) {
  const touchStart = useRef({ x: 0, y: 0 });
  const [swiping, setSwiping] = useState(false);
  const [swipeX, setSwipeX] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // iOS scroll lock: fix the body in place, restore on close
  useEffect(() => {
    const scrollY = window.scrollY;
    const body = document.body;
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.overflow = "hidden";

    return () => {
      body.style.position = "";
      body.style.top = "";
      body.style.left = "";
      body.style.right = "";
      body.style.overflow = "";
      window.scrollTo(0, scrollY);
    };
  }, []);

  // Keyboard nav
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onNav(1);
      if (e.key === "ArrowLeft") onNav(-1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, onNav]);

  // Touch handling — horizontal swipe with visual feedback
  function onTouchStart(e: React.TouchEvent) {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    setSwiping(false);
    setSwipeX(0);
  }

  function onTouchMove(e: React.TouchEvent) {
    const dx = e.touches[0].clientX - touchStart.current.x;
    const dy = e.touches[0].clientY - touchStart.current.y;
    // Only track horizontal swipes (prevent vertical scroll interference)
    if (!swiping && Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy)) {
      setSwiping(true);
    }
    if (swiping) {
      // Dampen the swipe so it feels weighty
      setSwipeX(dx * 0.4);
      e.preventDefault();
    }
  }

  function onTouchEnd() {
    if (swiping && Math.abs(swipeX) > 30) {
      onNav(swipeX < 0 ? 1 : -1);
    }
    setSwiping(false);
    setSwipeX(0);
  }

  // Tap zones: left 25% = prev, right 25% = next, center = nothing
  function onTapNav(e: React.MouseEvent) {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = x / rect.width;
    if (pct < 0.25) onNav(-1);
    else if (pct > 0.75) onNav(1);
  }

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[100] animate-fade-in select-none"
      style={{ touchAction: "none" }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Backdrop — no blur on mobile for performance */}
      <div
        className="absolute inset-0 bg-black/94 sm:backdrop-blur-md sm:bg-black/92"
        onClick={onClose}
      />

      {/* Top bar — safe area aware */}
      <div
        className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between
                   px-4 sm:px-6"
        style={{ paddingTop: "max(12px, env(safe-area-inset-top))" }}
      >
        <p
          className="text-white/30 text-[11px] sm:text-xs tabular-nums"
          style={{ fontFamily: "var(--font-ui)" }}
        >
          {index + 1} / {total}
        </p>
        <button
          onClick={onClose}
          className="w-10 h-10 flex items-center justify-center
                    rounded-full bg-white/[0.07] active:bg-white/20 sm:hover:bg-white/15
                    transition-colors duration-150 cursor-pointer"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Desktop nav arrows */}
      <button
        onClick={(e) => { e.stopPropagation(); onNav(-1); }}
        className="hidden sm:flex absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 z-20
                   w-11 h-11 items-center justify-center rounded-full
                   bg-white/[0.05] hover:bg-white/12 transition-all duration-200 cursor-pointer
                   hover:scale-105"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); onNav(1); }}
        className="hidden sm:flex absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 z-20
                   w-11 h-11 items-center justify-center rounded-full
                   bg-white/[0.05] hover:bg-white/12 transition-all duration-200 cursor-pointer
                   hover:scale-105"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>

      {/* Mobile edge tap zones — subtle chevrons */}
      <div
        className="sm:hidden absolute inset-0 z-15"
        onClick={onTapNav}
      >
        {/* Left chevron hint */}
        <div className="absolute left-2 top-1/2 -translate-y-1/2 text-white/10">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </div>
        {/* Right chevron hint */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 text-white/10">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </div>
      </div>

      {/* Painting + info */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center
                   px-4 sm:px-16 pt-14 z-10 pointer-events-none"
        style={{
          paddingBottom: "max(16px, env(safe-area-inset-bottom))",
          transform: swipeX ? `translateX(${swipeX}px)` : undefined,
          transition: swiping ? "none" : "transform 0.25s ease-out",
        }}
      >
        <div
          className="flex flex-col items-center max-w-5xl w-full pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={painting.image_url}
            alt={painting.title}
            className="max-h-[55vh] sm:max-h-[72vh] w-auto max-w-full
                      object-contain rounded-sm
                      shadow-[0_8px_60px_rgba(0,0,0,0.6)]"
            draggable={false}
          />

          {/* Info panel */}
          <div className="mt-4 sm:mt-7 text-center max-w-md px-2">
            <h3
              className="text-white/90 text-[15px] sm:text-lg leading-tight"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              {painting.title}
            </h3>
            <p
              className="text-white/40 text-[11px] sm:text-sm mt-1 sm:mt-1.5 tracking-wide"
              style={{ fontFamily: "var(--font-ui)" }}
            >
              {painting.artist}
              {painting.year !== "Unknown" && (
                <span className="text-white/20">{` · ${painting.year}`}</span>
              )}
            </p>

            {(painting.movement || painting.origin_country !== "Unknown") && (
              <div className="flex items-center justify-center gap-1.5 sm:gap-2 mt-2.5 sm:mt-4">
                {painting.movement && (
                  <span
                    className="px-2 sm:px-2.5 py-0.5 text-[9px] sm:text-[10px] uppercase tracking-widest
                               text-white/20 border border-white/[0.07] rounded-full"
                    style={{ fontFamily: "var(--font-ui)" }}
                  >
                    {painting.movement}
                  </span>
                )}
                {painting.origin_country !== "Unknown" && (
                  <span
                    className="px-2 sm:px-2.5 py-0.5 text-[9px] sm:text-[10px] uppercase tracking-widest
                               text-white/20 border border-white/[0.07] rounded-full"
                    style={{ fontFamily: "var(--font-ui)" }}
                  >
                    {painting.origin_country}
                  </span>
                )}
              </div>
            )}

            {/* Mobile hints */}
            <p
              className="sm:hidden text-white/10 text-[9px] mt-4 tracking-wider uppercase"
              style={{ fontFamily: "var(--font-ui)" }}
            >
              Swipe or tap edges to browse
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}

/* ─── Gallery Page ─── */
export default function GalleryPage() {
  const [paintings, setPaintings] = useState<GalleryPainting[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [selected, setSelected] = useState<GalleryPainting | null>(null);
  const [transitioning, setTransitioning] = useState(false);

  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_API_URL ?? "";
    fetch(`${base}/api/canvas/gallery?count=200`)
      .then((r) => r.json())
      .then(setPaintings)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === "All"
    ? paintings
    : paintings.filter(
        (p) =>
          p.category.toLowerCase() === filter.toLowerCase() ||
          p.movement.toLowerCase().includes(filter.toLowerCase())
      );

  const switchFilter = useCallback((cat: string) => {
    if (cat === filter) return;
    setTransitioning(true);
    setTimeout(() => {
      setFilter(cat);
      setTransitioning(false);
    }, 200);
  }, [filter]);

  const closeLightbox = useCallback(() => setSelected(null), []);

  const navigateLightbox = useCallback((dir: 1 | -1) => {
    setSelected((prev) => {
      if (!prev) return null;
      const idx = filtered.findIndex((p) => p.title === prev.title);
      if (idx === -1) return prev;
      return filtered[(idx + dir + filtered.length) % filtered.length];
    });
  }, [filtered]);

  const selectedIdx = selected ? filtered.findIndex((p) => p.title === selected.title) : -1;

  return (
    <>
      <div className="max-w-7xl mx-auto px-3 sm:px-6 pt-6 sm:pt-10 pb-24 sm:pb-12 animate-fade-in">
        {/* ── Header ── */}
        <div className="text-center mb-6 sm:mb-8">
          <p
            className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-sepia-light/50 mb-2 sm:mb-3"
            style={{ fontFamily: "var(--font-ui)" }}
          >
            The Collection
          </p>
          <h2
            className="text-2xl sm:text-4xl text-sepia"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Gallery
          </h2>
          <div className="dot-divider mt-4 sm:mt-5"><span /><span /><span /><span /><span /></div>
        </div>

        {/* ── Sticky filter bar ── */}
        <div
          className="sticky top-[57px] sm:top-[73px] z-30 bg-parchment/95 backdrop-blur-sm
                     -mx-3 px-3 sm:mx-0 sm:px-0 pb-3 sm:pb-4 pt-2"
        >
          <div className="flex gap-1.5 sm:gap-2 overflow-x-auto scrollbar-hide
                         sm:flex-wrap sm:justify-center
                         -webkit-overflow-scrolling-touch">
            {CATEGORIES.map((cat) => {
              const isActive = filter === cat;
              const count = cat === "All"
                ? paintings.length
                : paintings.filter(
                    (p) =>
                      p.category.toLowerCase() === cat.toLowerCase() ||
                      p.movement.toLowerCase().includes(cat.toLowerCase())
                  ).length;
              if (cat !== "All" && count === 0) return null;
              return (
                <button
                  key={cat}
                  onClick={() => switchFilter(cat)}
                  className={`shrink-0 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm
                             transition-all duration-300 cursor-pointer border
                             active:scale-95 active:duration-100
                             ${isActive
                               ? "bg-sepia text-parchment border-sepia shadow-sm"
                               : "bg-transparent text-sepia-light border-warm-border/80 hover:border-sepia/30 hover:text-sepia"
                             }`}
                  style={{ fontFamily: "var(--font-ui)" }}
                >
                  {cat}
                  <span className={`ml-1.5 text-[10px] tabular-nums ${isActive ? "text-parchment/50" : "text-sepia-light/30"}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between mt-2.5 sm:mt-3 px-0.5">
            <p
              className="text-[10px] sm:text-xs text-sepia-light/40"
              style={{ fontFamily: "var(--font-ui)" }}
            >
              {filtered.length} {filtered.length === 1 ? "work" : "works"}
            </p>
            {filter !== "All" && (
              <button
                onClick={() => switchFilter("All")}
                className="text-[10px] sm:text-xs text-sepia-light/40 hover:text-gold
                           transition-colors cursor-pointer"
                style={{ fontFamily: "var(--font-ui)" }}
              >
                Clear filter
              </button>
            )}
          </div>
        </div>

        {/* ── Loading ── */}
        {loading && (
          <div className="columns-2 sm:columns-3 lg:columns-4 gap-3 sm:gap-4 mt-2">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="mb-3 sm:mb-4 break-inside-avoid">
                <div
                  className="bg-warm-border/20 rounded-lg animate-pulse-warm"
                  style={{ aspectRatio: `3 / ${3.5 + (i % 3) * 0.5}` }}
                />
                <div className="mt-2 space-y-1.5">
                  <div className="h-3 w-3/4 bg-warm-border/20 rounded animate-pulse-warm" />
                  <div className="h-2.5 w-1/2 bg-warm-border/15 rounded animate-pulse-warm" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Grid ── */}
        {!loading && (
          <div
            className={`columns-2 sm:columns-3 lg:columns-4 gap-3 sm:gap-4 mt-2
                       transition-opacity duration-200
                       ${transitioning ? "opacity-0" : "opacity-100"}`}
          >
            {filtered.map((p, i) => (
              <GalleryImage
                key={`${p.title}-${p.artist}-${i}`}
                painting={p}
                onClick={() => setSelected(p)}
                index={i}
              />
            ))}
          </div>
        )}

        {/* ── Empty ── */}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-20 sm:py-28">
            <div className="dot-divider mb-5"><span /><span /><span /><span /><span /></div>
            <p
              className="text-sepia-light/50 text-sm"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              No works in this collection yet
            </p>
            <button
              onClick={() => switchFilter("All")}
              className="mt-3 text-xs text-gold hover:text-gold-hover transition-colors cursor-pointer"
              style={{ fontFamily: "var(--font-ui)" }}
            >
              View all works
            </button>
          </div>
        )}
      </div>

      {/* ═══ Open Museum Collections ═══ */}
      {!loading && <MuseumCollections />}

      {/* ═══ Lightbox ═══ */}
      {selected && selectedIdx >= 0 && (
        <Lightbox
          painting={selected}
          index={selectedIdx}
          total={filtered.length}
          onClose={closeLightbox}
          onNav={navigateLightbox}
        />
      )}
    </>
  );
}
