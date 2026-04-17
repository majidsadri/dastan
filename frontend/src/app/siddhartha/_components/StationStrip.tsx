"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { Motif, MotifType } from "./motif";

const ROMAN = [
  "", "I", "II", "III", "IV", "V", "VI",
  "VII", "VIII", "IX", "X", "XI", "XII",
];

type Station = { id: string; number: number; title: string; motif: MotifType };

export default function StationStrip({
  all,
  index,
}: {
  all: Station[];
  index: number;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const currentRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const el = currentRef.current;
    const container = scrollRef.current;
    if (!el || !container) return;
    const target =
      el.offsetLeft - container.clientWidth / 2 + el.clientWidth / 2;
    container.scrollTo({ left: Math.max(0, target), behavior: "auto" });
  }, []);

  const progress = ((index + 1) / all.length) * 100;

  return (
    <>
      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto px-5 pb-3 sd-station-strip"
        style={{
          scrollSnapType: "x mandatory",
          WebkitOverflowScrolling: "touch",
          scrollbarWidth: "none",
        }}
      >
        <style>{`
          .sd-station-strip::-webkit-scrollbar { display: none; }
          .sd-station-chip {
            -webkit-tap-highlight-color: transparent;
            touch-action: manipulation;
          }
          .sd-station-chip:active { transform: scale(0.94); }
        `}</style>
        {all.map((s, i) => {
          const isCurrent = i === index;
          const isPast = i < index;
          return (
            <Link
              key={s.id}
              href={`/siddhartha/${s.id}`}
              ref={isCurrent ? currentRef : undefined}
              aria-label={`Station ${s.number}: ${s.title}`}
              aria-current={isCurrent ? "page" : undefined}
              className="sd-station-chip shrink-0 flex flex-col items-center justify-start
                         rounded-2xl transition-all duration-300 ease-out"
              style={{
                scrollSnapAlign: "center",
                width: isCurrent ? "128px" : "58px",
                minHeight: "86px",
                padding: isCurrent ? "10px 10px 9px" : "9px 6px 8px",
                background: isCurrent
                  ? "linear-gradient(180deg, #2A2319 0%, #1E1A15 100%)"
                  : "transparent",
                border: isCurrent
                  ? "1px solid rgba(30,26,21,0.9)"
                  : "1px solid rgba(30,26,21,0.12)",
                boxShadow: isCurrent
                  ? "0 10px 22px -8px rgba(30,26,21,0.5), inset 0 1px 0 rgba(255,255,255,0.06)"
                  : "none",
                opacity: isCurrent ? 1 : isPast ? 0.82 : 0.62,
              }}
            >
              {/* Motif preview */}
              <div
                className="flex items-center justify-center"
                style={{
                  width: "32px",
                  height: "32px",
                  color: isCurrent ? "rgba(246,241,230,0.92)" : "rgba(30,26,21,0.7)",
                }}
              >
                <Motif type={s.motif} size={32} inkColor="currentColor" />
              </div>
              {/* Roman numeral */}
              <span
                className="font-[family-name:var(--font-heading)] italic leading-none mt-1"
                style={{
                  fontSize: "12px",
                  color: isCurrent ? "rgba(246,241,230,0.75)" : "rgba(30,26,21,0.55)",
                  letterSpacing: "0.05em",
                }}
              >
                {ROMAN[s.number]}
              </span>
              {/* Title — only visible on current chip */}
              {isCurrent && (
                <span
                  className="mt-1.5 text-[10px] tracking-[0.2em] uppercase leading-tight text-center"
                  style={{
                    fontFamily: "var(--font-ui)",
                    color: "rgba(246,241,230,0.85)",
                    maxWidth: "108px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {s.title}
                </span>
              )}
            </Link>
          );
        })}
        <div className="shrink-0 w-1" aria-hidden />
      </div>

      {/* Reading-progress hairline */}
      <div className="mx-auto mt-2 max-w-xs px-5">
        <div
          className="relative h-[2px] rounded-full overflow-hidden"
          style={{ background: "rgba(30,26,21,0.1)" }}
        >
          <div
            className="absolute inset-y-0 left-0 rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${progress}%`,
              background:
                "linear-gradient(to right, rgba(30,26,21,0.4) 0%, rgba(30,26,21,0.85) 100%)",
            }}
          />
        </div>
      </div>
    </>
  );
}
