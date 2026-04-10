"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArchiveDay } from "@/lib/types";
import { fetchArchive, seedArchiveTestData } from "@/lib/api";

interface ArchiveWeek {
  label: string;
  sublabel: string;
  days: ArchiveDay[];
}

function groupByWeek(days: ArchiveDay[]): ArchiveWeek[] {
  if (days.length === 0) return [];

  const weeks: ArchiveWeek[] = [];

  // Local date string helper (avoids UTC timezone shift)
  const toLocalDateStr = (d: Date): string =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  // Get start of week (Monday) for a local date
  const startOfWeek = (d: Date): Date => {
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day; // Monday = 1
    return new Date(d.getFullYear(), d.getMonth(), d.getDate() + diff);
  };

  const now = new Date();
  const currentWeekKey = toLocalDateStr(startOfWeek(now));
  const lastWeekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay() + (now.getDay() === 0 ? -13 : -6));
  const lastWeekKey = toLocalDateStr(startOfWeek(lastWeekStart));

  // Group days by their week
  const weekMap = new Map<string, ArchiveDay[]>();
  for (const day of days) {
    const d = new Date(day.date + "T12:00:00"); // noon to avoid DST edge cases
    const ws = startOfWeek(d);
    const key = toLocalDateStr(ws);
    if (!weekMap.has(key)) weekMap.set(key, []);
    weekMap.get(key)!.push(day);
  }

  // Sort weeks by date descending
  const sortedKeys = Array.from(weekMap.keys()).sort((a, b) => b.localeCompare(a));

  for (const key of sortedKeys) {
    const weekDays = weekMap.get(key)!;
    weekDays.sort((a, b) => b.date.localeCompare(a.date));

    const ws = new Date(key + "T12:00:00");
    const we = new Date(ws.getFullYear(), ws.getMonth(), ws.getDate() + 6);

    const isThisWeek = key === currentWeekKey;
    const isLastWeek = key === lastWeekKey;

    const fmtShort = (d: Date) =>
      d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

    const label = isThisWeek
      ? "This week"
      : isLastWeek
      ? "Last week"
      : `${fmtShort(ws)} — ${fmtShort(we)}`;

    const sublabel = `${weekDays.length} ${weekDays.length === 1 ? "day" : "days"}`;

    weeks.push({ label, sublabel, days: weekDays });
  }

  return weeks;
}

function formatDayName(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  if (dateStr === todayStr) return "Today";
  if (dateStr === yesterdayStr) return "Yesterday";
  return d.toLocaleDateString("en-US", { weekday: "long" });
}

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function ArchivePage() {
  const [days, setDays] = useState<ArchiveDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    fetchArchive()
      .then(setDays)
      .catch(() => setError("Could not load archive."))
      .finally(() => setLoading(false));
  }, []);

  async function handleSeed() {
    setSeeding(true);
    try {
      await seedArchiveTestData();
      const fresh = await fetchArchive();
      setDays(fresh);
    } catch (e) {
      console.error("Seed failed:", e);
    } finally {
      setSeeding(false);
    }
  }

  const weeks = groupByWeek(days);

  return (
    <div className="max-w-3xl mx-auto px-3 sm:px-6 py-6 sm:py-12 pb-24 sm:pb-12 animate-fade-in">
      {/* Header */}
      <div className="text-center mb-6 sm:mb-10">
        <p
          className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-sepia-light/50 mb-2 sm:mb-3"
          style={{ fontFamily: "var(--font-ui)" }}
        >
          Your Journey
        </p>
        <h2
          className="text-2xl sm:text-4xl text-sepia"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Archive
        </h2>
        <div className="dot-divider mt-4 sm:mt-5"><span /><span /><span /><span /><span /></div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="space-y-6">
          {[0, 1].map((w) => (
            <div key={w}>
              <div className="h-4 w-24 bg-warm-border/30 rounded animate-pulse-warm mb-4" />
              <div className="space-y-2">
                {[0, 1, 2].map((d) => (
                  <div key={d} className="paper-card p-3 flex gap-3 animate-pulse-warm">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded bg-warm-border/30 shrink-0" />
                    <div className="flex-1 space-y-2 py-1">
                      <div className="h-3 w-1/3 bg-warm-border/30 rounded" />
                      <div className="h-4 w-2/3 bg-warm-border/20 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="text-center py-12">
          <p className="text-sepia-light text-sm">{error}</p>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && days.length === 0 && (
        <div className="text-center py-16 sm:py-20">
          <div className="dot-divider mb-5"><span /><span /><span /><span /><span /></div>
          <p
            className="text-sepia-light/50 text-sm mb-2"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            The archive is empty
          </p>
          <p
            className="text-sepia-light/30 text-xs max-w-xs mx-auto mb-6"
            style={{ fontFamily: "var(--font-ui)" }}
          >
            Each day you visit, your canvas is saved here.
          </p>
          <button
            onClick={handleSeed}
            disabled={seeding}
            className="text-xs text-gold/50 hover:text-gold border border-warm-border/50
                      hover:border-gold/30 px-4 py-2 rounded-full
                      transition-all duration-200 cursor-pointer
                      disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ fontFamily: "var(--font-ui)" }}
          >
            {seeding ? "Populating..." : "Populate with sample data"}
          </button>
        </div>
      )}

      {/* Weekly sections */}
      {!loading && !error && weeks.map((week, wi) => (
        <div key={week.label} className={wi > 0 ? "mt-8 sm:mt-10" : ""}>
          {/* Week header */}
          <div className="flex items-baseline justify-between mb-3 sm:mb-4 px-0.5">
            <h3
              className="text-sm sm:text-base text-sepia"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              {week.label}
            </h3>
            <span
              className="text-[10px] sm:text-xs text-sepia-light/30 tabular-nums"
              style={{ fontFamily: "var(--font-ui)" }}
            >
              {week.sublabel}
            </span>
          </div>

          {/* Day rows */}
          <div className="space-y-2 sm:space-y-2.5">
            {week.days.map((day) => (
              <Link
                key={day.date}
                href={`/archive/${day.date}`}
                className="group paper-card overflow-hidden flex items-stretch
                          hover:shadow-md active:shadow-md transition-all duration-200"
              >
                {/* Painting thumbnail */}
                <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 bg-linen overflow-hidden">
                  {day.painting_image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={day.painting_image_url}
                      alt={day.painting_title || ""}
                      className="w-full h-full object-cover group-hover:scale-105
                                transition-transform duration-500"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-warm-border">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 px-3 sm:px-4 py-2 sm:py-3 flex flex-col justify-center">
                  {/* Day name and date */}
                  <div className="flex items-center gap-2 mb-0.5">
                    <span
                      className="text-[10px] sm:text-[11px] text-sepia-light/40 uppercase tracking-wider"
                      style={{ fontFamily: "var(--font-ui)" }}
                    >
                      {formatDayName(day.date)}
                    </span>
                    <span
                      className="text-[10px] text-sepia-light/20"
                      style={{ fontFamily: "var(--font-ui)" }}
                    >
                      {formatDateShort(day.date)}
                    </span>
                  </div>

                  {/* Painting title */}
                  {day.painting_title && (
                    <p
                      className="text-[13px] sm:text-sm text-sepia leading-snug truncate
                                group-hover:text-gold transition-colors duration-200"
                      style={{ fontFamily: "var(--font-heading)" }}
                    >
                      {day.painting_title}
                    </p>
                  )}

                  {/* Meta line */}
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {day.painting_artist && (
                      <span
                        className="text-[10px] sm:text-[11px] text-sepia-light/50 truncate"
                        style={{ fontFamily: "var(--font-ui)" }}
                      >
                        {day.painting_artist}
                      </span>
                    )}
                    {day.mood_word && (
                      <>
                        <span className="text-sepia-light/15">·</span>
                        <span
                          className="text-[10px] text-gold/40 italic"
                          style={{ fontFamily: "var(--font-body)" }}
                        >
                          {day.mood_word}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Chevron */}
                <div className="flex items-center pr-3 sm:pr-4 text-sepia-light/15 group-hover:text-gold/40
                               transition-colors duration-200">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
