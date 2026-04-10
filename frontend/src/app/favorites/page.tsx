"use client";

import { useEffect, useState } from "react";
import { Favorite } from "@/lib/types";
import { fetchFavorites, removeFavorite } from "@/lib/api";

function typeLabel(t: string) {
  switch (t) {
    case "painting": return "Painting";
    case "novel": return "Novel";
    case "literature": return "Literature";
    default: return t;
  }
}

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchFavorites()
      .then(setFavorites)
      .catch(() => setError("Could not load favorites. Make sure the backend server is running."))
      .finally(() => setLoading(false));
  }, []);

  async function handleRemove(id: string) {
    try {
      await removeFavorite(id);
      setFavorites((prev) => prev.filter((f) => f.id !== id));
    } catch {
      // silently fail
    }
  }

  const paintings = favorites.filter((f) => f.item_type === "painting");
  const novels = favorites.filter((f) => f.item_type === "novel");
  const literature = favorites.filter((f) => f.item_type === "literature");

  function FavoriteGroup({
    title,
    items,
  }: {
    title: string;
    items: Favorite[];
  }) {
    if (items.length === 0) return null;
    return (
      <div className="mb-8 sm:mb-12">
        <h3
          className="text-lg sm:text-xl text-sepia mb-3 sm:mb-4"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          {title}
        </h3>
        <div className="space-y-2 sm:space-y-3">
          {items.map((fav) => (
            <div
              key={fav.id}
              className="paper-card overflow-hidden flex items-stretch"
            >
              {/* Thumbnail */}
              {fav.image_url && (
                <div className="w-16 sm:w-28 shrink-0 bg-linen">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={fav.image_url}
                    alt={fav.title || ""}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              )}

              <div className="flex-1 p-3 sm:p-5 flex items-center justify-between gap-3 sm:gap-4">
                <div className="min-w-0">
                  {fav.title ? (
                    <>
                      <p
                        className="text-sm sm:text-base text-sepia font-medium truncate"
                        style={{ fontFamily: "var(--font-heading)" }}
                      >
                        {fav.title}
                      </p>
                      {fav.subtitle && (
                        <p className="text-xs sm:text-sm text-sepia-light mt-0.5 truncate">
                          {fav.subtitle}
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-sepia-light italic text-sm">
                      {typeLabel(fav.item_type)} (no longer available)
                    </p>
                  )}
                  <p
                    className="text-[10px] sm:text-xs text-sepia-light/40 mt-0.5 sm:mt-1"
                    style={{ fontFamily: "var(--font-ui)" }}
                  >
                    Saved{" "}
                    {new Date(fav.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <button
                  onClick={() => handleRemove(fav.id)}
                  className="shrink-0 p-2.5 sm:p-2 rounded-full hover:bg-highlight active:bg-highlight
                             transition-colors group cursor-pointer"
                  aria-label="Remove favorite"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="#8B6914"
                    stroke="#8B6914"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="group-hover:fill-red-400 group-hover:stroke-red-400
                               group-active:fill-red-400 group-active:stroke-red-400 transition-colors"
                  >
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-3 sm:px-6 py-8 sm:py-20 pb-24 sm:pb-20 animate-fade-in">
      <div className="text-center mb-8 sm:mb-12">
        <h2
          className="text-2xl sm:text-4xl text-sepia"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Favorites
        </h2>
        <p className="text-sm text-sepia-light mt-1 sm:mt-2">Your saved treasures</p>
        <div className="dot-divider mt-4 sm:mt-6"><span /><span /><span /><span /><span /></div>
      </div>

      {loading && (
        <div className="space-y-3 sm:space-y-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="paper-card p-4 sm:p-5 animate-pulse-warm"
            >
              <div className="h-4 sm:h-5 bg-warm-border/50 rounded w-2/3 mb-2" />
              <div className="h-3 sm:h-4 bg-warm-border/50 rounded w-1/3" />
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="text-center py-12">
          <p className="text-sepia-light">{error}</p>
        </div>
      )}

      {!loading && !error && favorites.length === 0 && (
        <div className="text-center py-12 sm:py-16">
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#E8E0D0"
            strokeWidth="1"
            className="mx-auto mb-4"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
          <h3
            className="text-lg sm:text-xl text-sepia mb-2"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            No favorites yet
          </h3>
          <p className="text-sm text-sepia-light max-w-xs mx-auto">
            Tap the heart icon on paintings, literature, and novel pages to save them here.
          </p>
        </div>
      )}

      {!loading && !error && (
        <>
          <FavoriteGroup title="Paintings" items={paintings} />
          <FavoriteGroup title="Novel Pages" items={novels} />
          <FavoriteGroup title="Literature" items={literature} />
        </>
      )}
    </div>
  );
}
