"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { TodayCanvas } from "@/lib/types";
import {
  fetchCanvasByDate,
  addFavorite,
  removeFavorite,
  checkFavorite,
} from "@/lib/api";
import PaintingCard from "@/components/canvas/PaintingCard";
import NovelPageCard from "@/components/canvas/NovelPageCard";
import LiteratureCard from "@/components/canvas/LiteratureCard";
import AICreativeMode from "@/components/canvas/AICreativeMode";
import { SkeletonPainting, SkeletonCard } from "@/components/ui/Skeleton";

interface FavState {
  isFav: boolean;
  favId: string | null;
}

function SectionBreath({ label }: { label?: string }) {
  return (
    <div className="py-12 sm:py-16 flex flex-col items-center gap-4">
      <div className="dot-divider"><span /><span /><span /><span /><span /></div>
      {label && (
        <p
          className="text-xs uppercase tracking-[0.25em] text-sepia-light/60 mt-2"
          style={{ fontFamily: "var(--font-ui)" }}
        >
          {label}
        </p>
      )}
    </div>
  );
}

export default function ArchiveDatePage() {
  const params = useParams();
  const dateStr = params.date as string;

  const [canvas, setCanvas] = useState<TodayCanvas | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [paintingFav, setPaintingFav] = useState<FavState>({ isFav: false, favId: null });
  const [novelFav, setNovelFav] = useState<FavState>({ isFav: false, favId: null });
  const [litFav, setLitFav] = useState<FavState>({ isFav: false, favId: null });

  useEffect(() => {
    fetchCanvasByDate(dateStr)
      .then((data) => {
        const c = data.canvas;
        setCanvas(c);
        if (c.painting) {
          checkFavorite("painting", c.painting.title)
            .then((r) => setPaintingFav({ isFav: r.is_favorited, favId: r.favorite_id }))
            .catch(() => {});
        }
        if (c.novel_page) {
          checkFavorite("novel", c.novel_page.novel_title)
            .then((r) => setNovelFav({ isFav: r.is_favorited, favId: r.favorite_id }))
            .catch(() => {});
        }
        if (c.literature) {
          checkFavorite("literature", c.literature.title)
            .then((r) => setLitFav({ isFav: r.is_favorited, favId: r.favorite_id }))
            .catch(() => {});
        }
      })
      .catch(() => setError("Could not load this canvas. It may not exist yet."))
      .finally(() => setLoading(false));
  }, [dateStr]);

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

  function formatDate(d: string) {
    const dt = new Date(d + "T00:00:00");
    return dt.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
        <div className="text-center mb-16">
          <div className="h-5 w-40 mx-auto bg-warm-border/50 rounded animate-pulse-warm mb-4" />
          <div className="h-10 w-64 mx-auto bg-warm-border/50 rounded animate-pulse-warm" />
        </div>
        <SkeletonPainting />
        <div className="mt-20"><SkeletonCard /></div>
        <div className="mt-20"><SkeletonCard /></div>
      </div>
    );
  }

  if (error || !canvas) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-20 text-center">
        <h2 className="text-2xl text-sepia mb-4" style={{ fontFamily: "var(--font-heading)" }}>
          Canvas not found
        </h2>
        <p className="text-sepia-light mb-6">
          {error || "This day's canvas is not available."}
        </p>
        <Link
          href="/archive"
          className="text-gold hover:text-gold-hover transition-colors text-sm"
          style={{ fontFamily: "var(--font-ui)" }}
        >
          &larr; Back to Archive
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Painting */}
      {canvas.painting && (
        <section className="relative">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 pb-4 flex items-center justify-between">
            <Link
              href="/archive"
              className="text-xs text-sepia-light/50 hover:text-gold transition-colors uppercase tracking-[0.2em]"
              style={{ fontFamily: "var(--font-ui)" }}
            >
              &larr; Archive
            </Link>
            <p
              className="text-xs text-sepia-light/70 uppercase tracking-[0.2em]"
              style={{ fontFamily: "var(--font-ui)" }}
            >
              {formatDate(canvas.date)}
            </p>
          </div>

          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <PaintingCard
              painting={canvas.painting}
              isFavorite={paintingFav.isFav}
              onFavoriteToggle={() => toggleFav("painting", canvas.painting.title, `${canvas.painting.artist}, ${canvas.painting.year}`, canvas.painting.image_url, paintingFav, setPaintingFav)}
            />
          </div>

          <SectionBreath />
        </section>
      )}

      {/* Novel Page */}
      {canvas.novel_page && (
        <>
          <section className="max-w-3xl mx-auto px-4 sm:px-6 pb-8">
            <p
              className="text-xs uppercase tracking-[0.25em] text-sepia-light/60 mb-2"
              style={{ fontFamily: "var(--font-ui)" }}
            >
              One page, one world
            </p>
            <NovelPageCard
              novelPage={canvas.novel_page}
              isFavorite={novelFav.isFav}
              onFavoriteToggle={() => toggleFav("novel", canvas.novel_page.novel_title, `${canvas.novel_page.author} — Page ${canvas.novel_page.page_number}`, null, novelFav, setNovelFav)}
            />
          </section>
        </>
      )}

      {/* Literature */}
      {canvas.literature && (
        <>
          <SectionBreath label="from the world's shelves" />
          <section className="max-w-3xl mx-auto px-4 sm:px-6 pb-8">
            <LiteratureCard
              literature={canvas.literature}
              isFavorite={litFav.isFav}
              onFavoriteToggle={() => toggleFav("literature", canvas.literature.title, `${canvas.literature.author} — ${canvas.literature.genre}`, null, litFav, setLitFav)}
            />
          </section>
        </>
      )}

      {/* Creative Mode */}
      <SectionBreath label="now, your turn" />
      <section className="max-w-3xl mx-auto px-4 sm:px-6 pb-20">
        <AICreativeMode
          prompt={canvas.ai_prompt}
          painting={canvas.painting}
          literature={canvas.literature}
          novel={canvas.novel_page}
          paintingContext={canvas.painting ? `${canvas.painting.title} by ${canvas.painting.artist}` : ""}
          literatureContext={canvas.literature ? `${canvas.literature.title} by ${canvas.literature.author}` : ""}
        />
      </section>
    </div>
  );
}
