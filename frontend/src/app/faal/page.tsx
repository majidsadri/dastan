"use client";

import { useState } from "react";
import FaalCard from "@/components/canvas/FaalCard";

export default function FaalPage() {
  // refreshKey 0 → today's seeded poem. Increment on "Draw again" for a random one.
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10 pb-24 sm:pb-16 animate-fade-in">
      {/* ── Hero header ── */}
      <div className="relative text-center mb-8 sm:mb-12 overflow-hidden">
        {/* Subtle dotted backdrop */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.04]"
          style={{
            backgroundImage: "radial-gradient(circle, #2C2418 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />

        {/* Divan illustration */}
        <div className="flex justify-center mb-4 sm:mb-5">
          <svg
            width="52"
            height="52"
            viewBox="0 0 64 64"
            fill="none"
            className="sm:w-16 sm:h-16"
          >
            <circle cx="32" cy="32" r="30" stroke="#2C2418" strokeWidth="0.5" opacity="0.12" />
            <circle
              cx="32"
              cy="32"
              r="26"
              stroke="#8B6914"
              strokeWidth="0.35"
              opacity="0.18"
              strokeDasharray="2 3"
            />
            {/* Open book with calligraphic stroke */}
            <path
              d="M18 22 Q32 18 46 22 L46 44 Q32 40 18 44 Z"
              fill="#2C2418"
              opacity="0.05"
              stroke="#2C2418"
              strokeWidth="0.6"
            />
            <line x1="32" y1="20" x2="32" y2="42" stroke="#2C2418" strokeWidth="0.4" opacity="0.2" />
            <path
              d="M22 28 Q28 26 30 28"
              stroke="#8B6914"
              strokeWidth="0.55"
              fill="none"
              opacity="0.5"
            />
            <path
              d="M22 32 Q28 30 30 32"
              stroke="#8B6914"
              strokeWidth="0.55"
              fill="none"
              opacity="0.4"
            />
            <path
              d="M34 28 Q40 26 42 28"
              stroke="#8B6914"
              strokeWidth="0.55"
              fill="none"
              opacity="0.5"
            />
            <path
              d="M34 32 Q40 30 42 32"
              stroke="#8B6914"
              strokeWidth="0.55"
              fill="none"
              opacity="0.4"
            />
            {/* Star decorations */}
            <circle cx="32" cy="10" r="1.5" fill="#8B6914" opacity="0.3" />
            <circle cx="32" cy="54" r="1.5" fill="#8B6914" opacity="0.3" />
          </svg>
        </div>

        <p
          className="text-[10px] sm:text-[11px] uppercase tracking-[0.35em] text-sepia-light/50 mb-3 sm:mb-4"
          style={{ fontFamily: "var(--font-ui)" }}
        >
          An Ancient Persian Tradition
        </p>
        <h2
          className="text-[28px] sm:text-[42px] text-sepia leading-none"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Faal-e Hafez
        </h2>
        <p
          className="text-[14px] sm:text-[16px] text-sepia/50 mt-2 sm:mt-3"
          style={{ fontFamily: "var(--font-farsi), Georgia, serif" }}
          dir="rtl"
        >
          فال حافظ
        </p>

        <p
          className="text-[13px] sm:text-[15px] text-sepia/50 mt-4 sm:mt-5 max-w-md mx-auto leading-relaxed italic px-4 sm:px-0"
          style={{ fontFamily: "var(--font-body)" }}
        >
          For seven centuries, Persians have opened the Divan of Hafez with a
          question in their heart. The ghazal they meet is the answer.
        </p>

        {/* Ornamental divider */}
        <div className="flex items-center justify-center gap-2.5 mt-5 sm:mt-7">
          <svg width="48" height="8" viewBox="0 0 48 8" className="sm:w-16">
            <line x1="0" y1="4" x2="20" y2="4" stroke="#8B6914" strokeWidth="0.6" opacity="0.3" />
            <circle cx="24" cy="4" r="1.5" fill="#8B6914" opacity="0.35" />
            <line x1="28" y1="4" x2="48" y2="4" stroke="#8B6914" strokeWidth="0.6" opacity="0.3" />
          </svg>
          <span
            className="text-sepia/25 text-[11px] sm:text-[12px] tracking-wider"
            style={{ fontFamily: "var(--font-farsi), Georgia, serif" }}
            dir="rtl"
          >
            غزل
          </span>
          <svg width="48" height="8" viewBox="0 0 48 8" className="sm:w-16" style={{ transform: "scaleX(-1)" }}>
            <line x1="0" y1="4" x2="20" y2="4" stroke="#8B6914" strokeWidth="0.6" opacity="0.3" />
            <circle cx="24" cy="4" r="1.5" fill="#8B6914" opacity="0.35" />
            <line x1="28" y1="4" x2="48" y2="4" stroke="#8B6914" strokeWidth="0.6" opacity="0.3" />
          </svg>
        </div>
      </div>

      {/* ── How it works (brief) ── */}
      <div
        className="max-w-xl mx-auto mb-6 sm:mb-8 p-4 sm:p-5 rounded-xl border border-warm-border/40"
        style={{ backgroundColor: "var(--color-linen)" }}
      >
        <p
          className="text-[12px] sm:text-[13px] text-sepia/70 leading-[1.7] text-center"
          style={{ fontFamily: "var(--font-body)" }}
        >
          Close your eyes. Hold a single question in your heart — a choice, a
          worry, a longing. When you are ready, draw a ghazal. Read it slowly.
          The answer is there, between the lines.
        </p>
      </div>

      {/* ── Draw button ── */}
      <div className="flex justify-center mb-8 sm:mb-10">
        <button
          onClick={() => setRefreshKey((k) => k + 1)}
          className="px-7 py-3 rounded-full bg-sepia text-parchment text-[13px] sm:text-[14px]
                     tracking-[0.08em] shadow-md hover:bg-gold transition-all duration-300
                     cursor-pointer active:scale-[0.97]"
          style={{
            fontFamily: "var(--font-ui)",
            boxShadow: "0 4px 14px rgba(44,36,24,0.22)",
          }}
        >
          {refreshKey === 0 ? "Draw your Faal" : "Draw another"}
        </button>
      </div>

      {/* ── The poem ── */}
      <FaalCard refreshKey={refreshKey} />

      {/* ── Footer note ── */}
      <div className="text-center mt-12 sm:mt-16">
        <p
          className="text-[12px] sm:text-[13px] text-sepia/40 italic mb-1.5 max-w-md mx-auto leading-relaxed px-4"
          style={{ fontFamily: "var(--font-body)" }}
        >
          &ldquo;I am the slave of the Magian elder — he has set me free.&rdquo;
        </p>
        <p
          className="text-[10px] sm:text-[11px] text-sepia-light/35"
          style={{ fontFamily: "var(--font-ui)" }}
        >
          — Hafez of Shiraz, 14th century
        </p>
      </div>
    </div>
  );
}
