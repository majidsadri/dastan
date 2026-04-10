"use client";

import { useState } from "react";
import { Painting } from "@/lib/types";
import Badge from "@/components/ui/Badge";
import FavoriteButton from "@/components/ui/FavoriteButton";

interface PaintingCardProps {
  painting: Painting;
  isFavorite: boolean;
  onFavoriteToggle: () => void;
}

export default function PaintingCard({
  painting,
  isFavorite,
  onFavoriteToggle,
}: PaintingCardProps) {
  const [imgError, setImgError] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const displayTitle =
    painting.title.length > 80
      ? painting.title.slice(0, 80).replace(/[,.]?\s+\S*$/, "") + "…"
      : painting.title;

  return (
    <div className="animate-fade-in" key={painting.id}>
      {/* Image */}
      <div className="relative w-full bg-linen rounded-lg overflow-hidden shadow-sm">
        {!imgError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={painting.image_url}
            src={painting.image_url}
            alt={`${painting.title} by ${painting.artist}`}
            className="w-full max-h-[55vh] sm:max-h-[70vh] object-contain"
            onError={() => setImgError(true)}
            loading="eager"
            decoding="async"
            fetchPriority="high"
          />
        ) : (
          <div className="w-full h-[300px] sm:h-[400px] flex items-center justify-center text-sepia-light">
            <p className="text-sm italic">Image unavailable</p>
          </div>
        )}
      </div>

      {/* Wall label */}
      <div className="mt-4 sm:mt-6 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3
            className="text-lg sm:text-2xl text-sepia leading-snug"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            {displayTitle}
          </h3>
          <p className="text-sm sm:text-base text-sepia-light mt-0.5" style={{ fontFamily: "var(--font-body)" }}>
            {painting.artist}
            {painting.year && <span className="text-sepia-light/60">, {painting.year}</span>}
          </p>

          {/* Tags */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-2 sm:mt-3">
            {painting.origin_country && painting.origin_country !== "Unknown" && (
              <Badge>{painting.origin_country}</Badge>
            )}
            {painting.movement && painting.movement !== "Fine Art" && (
              <Badge variant="gold">{painting.movement}</Badge>
            )}
          </div>
        </div>
        <FavoriteButton isFavorite={isFavorite} onClick={onFavoriteToggle} />
      </div>

      {/* Color palette */}
      {painting.colors && painting.colors.length > 0 && (
        <div className="flex items-center gap-2.5 sm:gap-3 mt-3 sm:mt-4">
          <span
            className="text-[10px] sm:text-xs text-sepia-light uppercase tracking-wider"
            style={{ fontFamily: "var(--font-ui)" }}
          >
            Palette
          </span>
          <div className="flex gap-1.5 sm:gap-2">
            {painting.colors.map((color, i) => (
              <div
                key={i}
                className="w-6 h-6 sm:w-7 sm:h-7 rounded-full border border-warm-border shadow-sm"
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        </div>
      )}

      {/* Description + Artist bio — expandable */}
      {(painting.description || painting.artist_bio) && (
        <div className="mt-3 sm:mt-4">
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-sm text-gold hover:text-gold-hover active:text-gold-hover
                       transition-colors cursor-pointer py-1"
            style={{ fontFamily: "var(--font-ui)" }}
          >
            {expanded ? "Less" : "About this work"}
          </button>
          {expanded && (
            <div className="mt-2 sm:mt-3 space-y-2 sm:space-y-3 animate-fade-in text-sm text-sepia-light leading-relaxed">
              {painting.description && <p>{painting.description}</p>}
              {painting.artist_bio && (
                <p className="text-sepia-light/70 italic">{painting.artist_bio}</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
