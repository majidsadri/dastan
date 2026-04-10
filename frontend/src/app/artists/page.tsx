"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";

interface Artist {
  id: string;
  name: string;
  type: "painter" | "poet" | "author";
  born: string;
  died: string;
  nationality: string;
  movement: string;
  key_works: string[];
  article_title: string;
  article: string;
  pull_quote: string;
  image: string;
}

interface CollectionPainting {
  title: string;
  artist: string;
  year: string;
  file: string;
  movement?: string;
}

const TYPE_FILTERS = ["All", "Painters", "Poets", "Authors"] as const;

const TYPE_ICONS: Record<string, string> = {
  painter: "🎨",
  poet: "🪶",
  author: "📖",
};

/* ─── Artist Card ─── */
function ArtistCard({
  artist,
  index,
  onClick,
}: {
  artist: Artist;
  index: number;
  onClick: () => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "80px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <button
      ref={ref}
      onClick={onClick}
      className="group block w-full text-left cursor-pointer transition-all duration-500
                 bg-linen rounded-xl border border-warm-border/50 overflow-hidden
                 hover:border-gold/30 hover:shadow-lg hover:shadow-sepia/[0.06]
                 active:scale-[0.98] active:duration-100"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(16px)",
        transitionDelay: `${Math.min(index % 6, 3) * 100}ms`,
      }}
    >
      {/* Image + gradient overlay */}
      <div className="relative h-40 sm:h-48 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={artist.image}
          alt={artist.name}
          className="w-full h-full object-cover group-hover:scale-105
                     transition-transform duration-700 ease-out"
        />
        {/* Bottom gradient for text readability */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.1) 40%, transparent 70%)",
          }}
        />
        {/* Type + dates overlay — top-left */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
          <span
            className="px-2 py-0.5 text-[8px] sm:text-[9px] uppercase tracking-[0.15em]
                       text-white/80 bg-black/30 backdrop-blur-sm rounded-full"
            style={{ fontFamily: "var(--font-ui)" }}
          >
            {artist.type}
          </span>
          <span
            className="text-[8px] sm:text-[9px] text-white/50 tabular-nums"
            style={{ fontFamily: "var(--font-ui)" }}
          >
            {artist.born}–{artist.died}
          </span>
        </div>
        {/* Name overlay — bottom-left */}
        <div className="absolute bottom-3 left-4 right-4">
          <h3
            className="text-lg sm:text-xl text-white leading-tight drop-shadow-lg"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            {artist.name}
          </h3>
          <p
            className="text-[10px] sm:text-[11px] text-white/50 mt-0.5"
            style={{ fontFamily: "var(--font-ui)" }}
          >
            {artist.nationality}
          </p>
        </div>
      </div>

      {/* Text content below image */}
      <div className="px-4 sm:px-5 py-4 sm:py-5">
        {/* Article title */}
        <p
          className="text-xs sm:text-sm text-sepia-light/60 italic mb-2.5"
          style={{ fontFamily: "var(--font-body)" }}
        >
          {artist.article_title}
        </p>

        {/* Pull quote */}
        <p
          className="text-[11px] sm:text-xs text-sepia/45 leading-relaxed line-clamp-2"
          style={{ fontFamily: "var(--font-body)" }}
        >
          &ldquo;{artist.pull_quote}&rdquo;
        </p>

        {/* Movement badge */}
        <div className="mt-3">
          <span
            className="px-2 py-0.5 text-[8px] sm:text-[9px] uppercase tracking-widest
                       text-sepia-light/30 border border-warm-border/60 rounded-full"
            style={{ fontFamily: "var(--font-ui)" }}
          >
            {artist.movement}
          </span>
        </div>
      </div>
    </button>
  );
}

/* ─── Works Gallery — paintings for painters, books for authors ─── */
function WorksGallery({ artist }: { artist: Artist }) {
  const [paintings, setPaintings] = useState<CollectionPainting[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (artist.type !== "painter") {
      setLoaded(true);
      return;
    }
    let cancelled = false;
    // Normalize: strip diacritics, lowercase, collapse whitespace
    const norm = (s: string) =>
      s
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim();
    fetch("/collection/catalog.json")
      .then((r) => r.json())
      .then((data: { paintings: CollectionPainting[] }) => {
        if (cancelled) return;
        const needle = norm(artist.name);
        // Match when the artist name equals OR is a suffix of the
        // collection's artist name. Suffix-match catches variants like
        // "Hilaire Germain Edgar Degas" without false positives like
        // "Caravaggio (Michelangelo Merisi)" ending in "merisi".
        const matches = (data.paintings || []).filter((p) => {
          const hay = norm(p.artist || "");
          return hay === needle || hay.endsWith(" " + needle);
        });
        setPaintings(matches);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [artist.name, artist.type]);

  const isPainter = artist.type === "painter";
  const hasPaintings = isPainter && paintings.length > 0;

  // Icon: palette for painters, open book for authors/poets
  const HeaderIcon = () =>
    isPainter ? (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
           strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22a10 10 0 1 1 10-10c0 2.5-2 3-3.5 3H16a2 2 0 0 0-1.5 3.3 2 2 0 0 1-1.5 3.3Z" />
        <circle cx="7.5" cy="10.5" r="1.2" fill="currentColor" />
        <circle cx="12" cy="7" r="1.2" fill="currentColor" />
        <circle cx="16.5" cy="10.5" r="1.2" fill="currentColor" />
      </svg>
    ) : (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
           strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 4.5A1.5 1.5 0 0 1 3.5 3H10a3 3 0 0 1 2 5.2V20a3 3 0 0 0-2-1H3.5A1.5 1.5 0 0 1 2 17.5Z" />
        <path d="M22 4.5A1.5 1.5 0 0 0 20.5 3H14a3 3 0 0 0-2 5.2V20a3 3 0 0 1 2-1h6.5a1.5 1.5 0 0 0 1.5-1.5Z" />
      </svg>
    );

  const label = isPainter
    ? hasPaintings
      ? `Paintings (${paintings.length})`
      : "Notable Works"
    : "Literary Works";

  return (
    <div className="mt-10 pt-6 border-t border-warm-border/30">
      {/* Section header with icon */}
      <div className="flex items-center gap-2 mb-4 text-gold/70">
        <HeaderIcon />
        <p
          className="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] text-sepia-light/50"
          style={{ fontFamily: "var(--font-ui)" }}
        >
          {label}
        </p>
      </div>

      {/* Painter gallery — real thumbnails from the collection */}
      {isPainter && !loaded && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="aspect-[4/5] bg-warm-border/15 rounded-md animate-pulse-warm"
            />
          ))}
        </div>
      )}

      {isPainter && loaded && hasPaintings && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
          {paintings.slice(0, 9).map((p) => (
            <figure key={p.file} className="group">
              <div
                className="relative aspect-[4/5] overflow-hidden rounded-md
                           border border-warm-border/40 bg-warm-border/10"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/collection/${p.file}`}
                  alt={p.title}
                  loading="lazy"
                  className="w-full h-full object-cover
                             group-hover:scale-[1.04] transition-transform duration-500 ease-out"
                />
              </div>
              <figcaption
                className="mt-1.5 text-[10px] sm:text-[11px] text-sepia/60 leading-tight line-clamp-2"
                style={{ fontFamily: "var(--font-body)" }}
              >
                {p.title}
                {p.year && (
                  <span className="text-sepia-light/40"> · {p.year}</span>
                )}
              </figcaption>
            </figure>
          ))}
        </div>
      )}

      {/* Fallback for painters with no matches in the collection */}
      {isPainter && loaded && !hasPaintings && (
        <div className="flex flex-wrap gap-2">
          {artist.key_works.map((work) => (
            <span
              key={work}
              className="px-3 py-1.5 text-[11px] text-sepia-light/50
                         border border-warm-border/40 rounded-full"
              style={{ fontFamily: "var(--font-ui)" }}
            >
              {work}
            </span>
          ))}
        </div>
      )}

      {/* Author / poet — styled book list */}
      {!isPainter && (
        <ul className="space-y-2">
          {artist.key_works.map((work) => (
            <li
              key={work}
              className="flex items-start gap-3 px-3.5 py-2.5 rounded-md
                         border border-warm-border/40 bg-linen/40"
            >
              <svg
                width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"
                strokeLinejoin="round"
                className="mt-[3px] shrink-0 text-gold/60"
              >
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
              </svg>
              <span
                className="text-[12px] sm:text-[13px] text-sepia/75 leading-snug italic"
                style={{ fontFamily: "var(--font-body)" }}
              >
                {work}
              </span>
            </li>
          ))}
        </ul>
      )}

      {/* Movement badge */}
      <div className="mt-5">
        <span
          className="px-3 py-1.5 text-[9px] sm:text-[10px] uppercase tracking-widest
                     text-gold/50 border border-gold/20 rounded-full"
          style={{ fontFamily: "var(--font-ui)" }}
        >
          {artist.movement}
        </span>
      </div>
    </div>
  );
}

/* ─── Article Reader ─── */
function ArticleModal({
  artist,
  onClose,
}: {
  artist: Artist;
  onClose: () => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);

  // Lock body scroll (iOS safe)
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

  // Escape key
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Track scroll for sticky header reveal
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    function onScroll() {
      setScrolled((el?.scrollTop ?? 0) > 200);
    }
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const paragraphs = artist.article.split("\n\n");
  // Style first paragraph as a drop-cap lead
  const [firstParagraph, ...restParagraphs] = paragraphs;

  return (
    <div className="fixed inset-0 z-[100] animate-fade-in">
      {/* Backdrop — desktop only */}
      <div className="hidden sm:block absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* ── Mobile: full-screen reader | Desktop: centered card ── */}
      <div
        ref={scrollRef}
        className="absolute inset-0 sm:inset-auto sm:top-0 sm:left-0 sm:right-0 sm:bottom-0
                   overflow-y-auto overscroll-contain
                   sm:flex sm:items-start sm:justify-center sm:py-10"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {/* Desktop click-outside area */}
        <div className="hidden sm:block absolute inset-0" onClick={onClose} />

        <div
          className="relative bg-parchment min-h-full sm:min-h-0
                     sm:rounded-2xl sm:max-w-2xl sm:w-full sm:mx-4 sm:overflow-hidden"
          style={{
            boxShadow: "0 25px 80px rgba(0,0,0,0.3), 0 4px 16px rgba(0,0,0,0.15)",
          }}
        >
          {/* ── Sticky close bar — always visible (mobile) ── */}
          <div
            className="sm:hidden sticky top-0 z-30 bg-parchment/95 backdrop-blur-sm border-b border-warm-border/30"
            style={{ paddingTop: "env(safe-area-inset-top)" }}
          >
            <div className="flex items-center justify-between px-3 py-1">
              <button
                onClick={onClose}
                className="flex items-center gap-1 text-sepia/80 active:text-gold active:scale-95
                           transition-all cursor-pointer min-w-[44px] min-h-[44px] -ml-1
                           rounded-lg active:bg-warm-border/20"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                     strokeWidth="2" strokeLinecap="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
                <span
                  className="text-[13px] font-medium"
                  style={{ fontFamily: "var(--font-ui)" }}
                >
                  Back
                </span>
              </button>
              {/* Artist name — fades in on scroll */}
              <p
                className={`text-[12px] text-sepia/70 truncate max-w-[50%] transition-opacity duration-300
                           ${scrolled ? "opacity-100" : "opacity-0"}`}
                style={{ fontFamily: "var(--font-heading)" }}
              >
                {artist.name}
              </p>
              {/* Extra close X on the right */}
              <button
                onClick={onClose}
                className="flex items-center justify-center w-[44px] h-[44px] -mr-1
                           text-sepia-light/40 active:text-sepia active:scale-90
                           transition-all cursor-pointer rounded-lg active:bg-warm-border/20"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                     strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>

          {/* Desktop close button */}
          <button
            onClick={onClose}
            className="hidden sm:flex absolute top-4 right-4 z-30 w-9 h-9 items-center justify-center
                      rounded-full bg-warm-border/30 hover:bg-warm-border/60
                      transition-colors duration-200 cursor-pointer"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B5D4D"
                 strokeWidth="1.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          {/* Desktop gold accent bar */}
          <div
            className="hidden sm:block h-[2px]"
            style={{
              background: "linear-gradient(to right, transparent 10%, #C4A44E 30%, #D4B85A 50%, #C4A44E 70%, transparent 90%)",
            }}
          />

          {/* ── Hero image — tall on mobile for immersion ── */}
          <div className="relative h-64 sm:h-64 overflow-hidden sm:mt-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={artist.image}
              alt={artist.name}
              className="w-full h-full object-cover"
            />
            {/* Gradient: parchment bottom */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `
                  linear-gradient(to top, #FDFBF7 0%, rgba(253,251,247,0.7) 25%, transparent 60%)
                `,
              }}
            />
            {/* Type badge floating on image */}
            <div className="absolute top-3 sm:top-4 left-4">
              <span
                className="px-2.5 py-1 text-[9px] sm:text-[10px] uppercase tracking-[0.15em]
                           text-white/90 bg-black/30 backdrop-blur-sm rounded-full"
                style={{ fontFamily: "var(--font-ui)" }}
              >
                {artist.type}
              </span>
            </div>
          </div>

          {/* ── Content ── */}
          <div className="px-6 sm:px-10 -mt-16 relative z-10 pb-10 sm:pb-10">
            {/* Header */}
            <div className="mb-7 sm:mb-8">
              <span
                className="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] text-sepia-light/40"
                style={{ fontFamily: "var(--font-ui)" }}
              >
                {artist.nationality} · {artist.born}–{artist.died}
              </span>

              <h2
                className="text-[26px] sm:text-3xl text-sepia mt-1.5 leading-[1.15]"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                {artist.name}
              </h2>

              <p
                className="text-[15px] sm:text-lg text-gold/70 italic mt-1.5"
                style={{ fontFamily: "var(--font-body)" }}
              >
                {artist.article_title}
              </p>
            </div>

            {/* Pull quote — large and prominent */}
            <div className="relative mb-8 sm:mb-8 border-l-2 border-gold/25 pl-5 sm:pl-6 py-1">
              <p
                className="text-sepia/55 text-[15px] sm:text-base leading-[1.85] italic"
                style={{ fontFamily: "var(--font-quote, var(--font-body))" }}
              >
                &ldquo;{artist.pull_quote}&rdquo;
              </p>
            </div>

            {/* Ornamental divider */}
            <div className="dot-divider mb-7 sm:mb-8">
              <span /><span /><span /><span /><span />
            </div>

            {/* Article body — drop-cap first paragraph */}
            <div className="space-y-5 sm:space-y-5">
              {firstParagraph && (
                <p
                  className="text-sepia/80 text-[15px] sm:text-[15px] leading-[1.9]
                             first-letter:text-[3.2em] first-letter:font-bold first-letter:float-left
                             first-letter:mr-2 first-letter:mt-1 first-letter:leading-[0.8]
                             first-letter:text-sepia"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  {firstParagraph}
                </p>
              )}
              {restParagraphs.map((p, i) => (
                <p
                  key={i}
                  className="text-sepia/75 text-[15px] sm:text-[15px] leading-[1.9]"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  {p}
                </p>
              ))}
            </div>

            {/* ── Footer: works gallery (paintings or books) + movement ── */}
            <WorksGallery artist={artist} />

            {/* Bottom safe area padding on mobile */}
            <div className="h-6 sm:hidden" style={{ paddingBottom: "env(safe-area-inset-bottom)" }} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Artists Page ─── */
export default function ArtistsPage() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("All");
  const [selected, setSelected] = useState<Artist | null>(null);

  useEffect(() => {
    fetch("/artists/catalog.json")
      .then((r) => r.json())
      .then((data) => setArtists(data.artists || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered =
    filter === "All"
      ? artists
      : artists.filter(
          (a) => a.type === filter.toLowerCase().slice(0, -1) // "Painters" → "painter"
        );

  const switchFilter = useCallback(
    (f: string) => setFilter(f),
    []
  );

  const closeModal = useCallback(() => setSelected(null), []);

  return (
    <>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 sm:pt-12 pb-24 sm:pb-16 animate-fade-in">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-10">
          <p
            className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-sepia-light/50 mb-2 sm:mb-3"
            style={{ fontFamily: "var(--font-ui)" }}
          >
            Lives &amp; Legacies
          </p>
          <h2
            className="text-2xl sm:text-4xl text-sepia"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            The Artists
          </h2>
          <p
            className="text-xs sm:text-sm text-sepia-light/50 mt-2 max-w-md mx-auto leading-relaxed"
            style={{ fontFamily: "var(--font-body)" }}
          >
            Painters, poets, and authors whose work shapes the soul of Dastan
          </p>
          <div className="dot-divider mt-5 sm:mt-6">
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex justify-center gap-2 sm:gap-3 mb-8 sm:mb-10">
          {TYPE_FILTERS.map((f) => {
            const isActive = filter === f;
            return (
              <button
                key={f}
                onClick={() => switchFilter(f)}
                className={`px-4 sm:px-5 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm
                           transition-all duration-300 cursor-pointer border
                           active:scale-95 active:duration-100
                           ${
                             isActive
                               ? "bg-sepia text-parchment border-sepia shadow-sm"
                               : "bg-transparent text-sepia-light border-warm-border/80 hover:border-sepia/30 hover:text-sepia"
                           }`}
                style={{ fontFamily: "var(--font-ui)" }}
              >
                {f}
              </button>
            );
          })}
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="bg-warm-border/15 rounded-xl animate-pulse-warm p-6"
                style={{ height: `${180 + (i % 3) * 20}px` }}
              />
            ))}
          </div>
        )}

        {/* Grid */}
        {!loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            {filtered.map((artist, i) => (
              <ArtistCard
                key={artist.id}
                artist={artist}
                index={i}
                onClick={() => setSelected(artist)}
              />
            ))}
          </div>
        )}

        {/* Empty */}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-20">
            <p
              className="text-sepia-light/50 text-sm"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              No artists in this category yet
            </p>
          </div>
        )}

        {/* Back to sign in */}
        <div className="text-center mt-12 sm:mt-16">
          <div className="dot-divider mb-5">
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>
          <p
            className="text-xs text-sepia-light/40 mb-3"
            style={{ fontFamily: "var(--font-body)" }}
          >
            Discover a daily canvas of painting, literature, and poetry
          </p>
          <Link
            href="/signup"
            className="inline-block px-6 py-2.5 text-xs sm:text-sm rounded-full
                       bg-sepia text-parchment hover:bg-gold transition-colors duration-200"
            style={{ fontFamily: "var(--font-ui)" }}
          >
            Sign up free
          </Link>
        </div>
      </div>

      {/* Article modal */}
      {selected && <ArticleModal artist={selected} onClose={closeModal} />}
    </>
  );
}
