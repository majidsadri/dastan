"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

const ROMAN = [
  "", "I", "II", "III", "IV", "V", "VI", "VII",
  "VIII", "IX", "X", "XI", "XII", "XIII",
];

type Scene = { id: string; number: number; title: string; image: string };

export default function ConstellationStrip({
  all,
  index,
}: {
  all: Scene[];
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
        className="flex gap-2 overflow-x-auto px-5 pb-3 lpp-star-strip"
        style={{
          scrollSnapType: "x mandatory",
          WebkitOverflowScrolling: "touch",
          scrollbarWidth: "none",
        }}
      >
        <style>{`
          .lpp-star-strip::-webkit-scrollbar { display: none; }
          .lpp-star-chip {
            -webkit-tap-highlight-color: transparent;
            touch-action: manipulation;
          }
          .lpp-star-chip:active { transform: scale(0.94); }
        `}</style>
        {all.map((s, i) => {
          const isCurrent = i === index;
          const isPast = i < index;
          return (
            <Link
              key={s.id}
              href={`/little-prince/${s.id}`}
              ref={isCurrent ? currentRef : undefined}
              aria-label={`Chapter ${s.number}: ${s.title}`}
              aria-current={isCurrent ? "page" : undefined}
              className="lpp-star-chip shrink-0 flex flex-col items-center justify-start
                         rounded-2xl transition-all duration-300 ease-out"
              style={{
                scrollSnapAlign: "center",
                width: isCurrent ? "132px" : "58px",
                minHeight: "86px",
                padding: isCurrent ? "8px 8px 9px" : "7px 6px 8px",
                background: isCurrent
                  ? "linear-gradient(180deg, #8B6914 0%, #6E5210 100%)"
                  : "transparent",
                border: isCurrent
                  ? "1px solid #6E5210"
                  : "1px solid rgba(44,36,24,0.12)",
                boxShadow: isCurrent
                  ? "0 10px 22px -8px rgba(139,105,20,0.55), inset 0 1px 0 rgba(255,255,255,0.1)"
                  : "none",
                opacity: isCurrent ? 1 : isPast ? 0.85 : 0.65,
              }}
            >
              {/* Thumbnail — parchment tile containing the scene's illustration */}
              <div
                className="rounded-md overflow-hidden flex items-center justify-center shrink-0"
                style={{
                  width: "40px",
                  height: "40px",
                  background: "#FDFBF7",
                  boxShadow: isCurrent
                    ? "inset 0 0 0 1px rgba(253,251,247,0.55)"
                    : "inset 0 0 0 1px rgba(44,36,24,0.08)",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={s.image.startsWith("/") ? s.image : `/little-prince/${s.image}`}
                  alt=""
                  className="w-full h-full object-contain"
                  style={{ padding: "3px" }}
                  loading="lazy"
                />
              </div>
              {/* Roman numeral */}
              <span
                className="font-[family-name:var(--font-heading)] italic leading-none mt-1"
                style={{
                  fontSize: "12px",
                  color: isCurrent ? "rgba(253,251,247,0.9)" : "rgba(44,36,24,0.55)",
                  letterSpacing: "0.05em",
                }}
              >
                {ROMAN[s.number]}
              </span>
              {/* Title only on current chip */}
              {isCurrent && (
                <span
                  className="mt-1 text-[10px] tracking-[0.2em] uppercase leading-tight text-center"
                  style={{
                    fontFamily: "var(--font-ui)",
                    color: "rgba(253,251,247,0.95)",
                    maxWidth: "116px",
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

      {/* Reading-progress hairline in gold */}
      <div className="mx-auto mt-2 max-w-xs px-5">
        <div
          className="relative h-[2px] rounded-full overflow-hidden"
          style={{ background: "rgba(44,36,24,0.1)" }}
        >
          <div
            className="absolute inset-y-0 left-0 rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${progress}%`,
              background:
                "linear-gradient(to right, rgba(139,105,20,0.55) 0%, rgba(212,184,90,0.95) 100%)",
            }}
          />
        </div>
      </div>
    </>
  );
}
