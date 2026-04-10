"use client";

import { NovelPage } from "@/lib/types";
import FavoriteButton from "@/components/ui/FavoriteButton";

interface NovelPageCardProps {
  novelPage: NovelPage;
  isFavorite: boolean;
  onFavoriteToggle: () => void;
}

export default function NovelPageCard({
  novelPage,
  isFavorite,
  onFavoriteToggle,
}: NovelPageCardProps) {
  return (
    <div className="paper-card dot-accent p-5 sm:p-10 animate-fade-in">
      <div className="flex items-start justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div>
          <h3
            className="text-xl sm:text-3xl text-sepia"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            {novelPage.novel_title}
          </h3>
          <p className="text-sm sm:text-base text-sepia-light mt-0.5 sm:mt-1">{novelPage.author}</p>
        </div>
        <FavoriteButton isFavorite={isFavorite} onClick={onFavoriteToggle} />
      </div>

      {/* Page indicator */}
      <div className="flex items-center gap-2.5 sm:gap-3 mb-5 sm:mb-8">
        <span
          className="text-[10px] sm:text-xs uppercase tracking-widest text-gold"
          style={{ fontFamily: "var(--font-ui)" }}
        >
          Page {novelPage.page_number} of {novelPage.total_pages}
        </span>
        <div className="flex-1 h-px bg-warm-border" />
        <div className="h-1 rounded-full bg-gold/20 w-16 sm:w-24 overflow-hidden">
          <div
            className="h-full bg-gold rounded-full transition-all duration-500"
            style={{
              width: `${(novelPage.page_number / novelPage.total_pages) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="prose-reading">
        {novelPage.content.split("\n").map((paragraph, i) => (
          <p key={i}>{paragraph}</p>
        ))}
      </div>
    </div>
  );
}
