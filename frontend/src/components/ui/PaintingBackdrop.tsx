"use client";

/**
 * PaintingBackdrop
 * ─────────────────
 * A full-bleed, art-museum-quality backdrop for auth pages.
 * Picks one painting per visit from a curated gallery and renders:
 *   • The source image with a very slow Ken-Burns pan+zoom
 *   • A layered overlay (corner vignette + bottom darken for form legibility
 *     + faint warm tone)
 *   • A faint SVG film-grain for analog texture
 *   • A museum-style credit card in the bottom corner
 *
 * Designed to sit as an absolutely-positioned layer behind the auth form
 * content. Place it inside a `relative` parent.
 */

import Image from "next/image";
import { useEffect, useState } from "react";

interface Painting {
  id: string;
  src: string;
  artist: string;
  title: string;
  year: string;
  objectPosition: string;
  kbClass: string; // ken-burns variant
}

const GALLERY: Painting[] = [
  {
    id: "botticelli-venus",
    src: "/paintings/botticelli-venus.jpg",
    artist: "Sandro Botticelli",
    title: "The Birth of Venus",
    year: "c. 1485",
    objectPosition: "center 45%",
    kbClass: "animate-ken-burns-a",
  },
  {
    id: "vermeer-pearl",
    src: "/paintings/vermeer-pearl.jpg",
    artist: "Johannes Vermeer",
    title: "Girl with a Pearl Earring",
    year: "1665",
    objectPosition: "center 30%",
    kbClass: "animate-ken-burns-b",
  },
  {
    id: "renoir-boating",
    src: "/paintings/renoir-boating.jpg",
    artist: "Pierre-Auguste Renoir",
    title: "Luncheon of the Boating Party",
    year: "1880–81",
    objectPosition: "center 38%",
    kbClass: "animate-ken-burns-c",
  },
];

export default function PaintingBackdrop() {
  // Start with a deterministic pick for SSR, then randomise on mount.
  // The initial render uses index 0 so hydration is stable; after mount
  // we swap in a random painting (this flicker is hidden by the
  // backdrop-enter fade-in).
  const [painting, setPainting] = useState<Painting>(GALLERY[0]);

  useEffect(() => {
    setPainting(GALLERY[Math.floor(Math.random() * GALLERY.length)]);
  }, []);

  return (
    <>
      {/* ── Layer 1: the painting itself ── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div
          key={painting.id}
          className={`absolute inset-0 animate-backdrop-enter ${painting.kbClass}`}
          style={{ willChange: "transform" }}
        >
          <Image
            src={painting.src}
            alt={`${painting.title} — ${painting.artist}`}
            fill
            priority
            sizes="100vw"
            quality={88}
            className="object-cover"
            style={{ objectPosition: painting.objectPosition }}
          />
        </div>
      </div>

      {/* ── Layer 2: corner vignette (gentle) ── */}
      <div
        className="absolute inset-0 pointer-events-none z-[1]"
        style={{
          background:
            "radial-gradient(ellipse 120% 90% at 50% 42%, rgba(10,8,5,0) 0%, rgba(10,8,5,0.25) 55%, rgba(10,8,5,0.65) 100%)",
        }}
      />

      {/* ── Layer 3: bottom darken for form legibility ── */}
      <div
        className="absolute inset-0 pointer-events-none z-[2]"
        style={{
          background:
            "linear-gradient(180deg, rgba(10,8,5,0) 0%, rgba(10,8,5,0) 45%, rgba(10,8,5,0.38) 82%, rgba(10,8,5,0.62) 100%)",
        }}
      />

      {/* ── Layer 4: warm tonal wash — unifies palette across paintings ── */}
      <div
        className="absolute inset-0 pointer-events-none z-[3] mix-blend-multiply"
        style={{
          background:
            "linear-gradient(160deg, rgba(60,40,20,0.22) 0%, rgba(20,15,10,0) 50%, rgba(30,20,12,0.28) 100%)",
        }}
      />

      {/* ── Layer 5: film grain (SVG fractal noise) ── */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none z-[4] opacity-[0.09] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>\")",
          backgroundSize: "220px 220px",
        }}
      />

      {/* ── Layer 6: museum-style credit card (bottom-left) ── */}
      <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 z-[5] pointer-events-none select-none">
        <div
          className="flex items-center gap-3 px-3.5 py-2 rounded-md backdrop-blur-[2px]"
          style={{
            background: "rgba(12, 8, 4, 0.28)",
            border: "1px solid rgba(255, 248, 230, 0.10)",
            boxShadow: "0 4px 16px rgba(0,0,0,0.35)",
          }}
        >
          {/* Left marker — a tiny gold serif dot */}
          <span
            className="block w-1 h-6 rounded-full shrink-0"
            style={{ backgroundColor: "rgba(196, 164, 78, 0.5)" }}
          />
          <div className="flex flex-col leading-tight">
            <span
              className="text-[10px] sm:text-[11px] text-white/85 tracking-wide"
              style={{
                fontFamily: "var(--font-heading)",
                textShadow: "0 1px 4px rgba(0,0,0,0.5)",
              }}
            >
              {painting.title}
            </span>
            <span
              className="text-[8px] sm:text-[9px] text-white/45 uppercase tracking-[0.18em] mt-0.5"
              style={{ fontFamily: "var(--font-ui)" }}
            >
              {painting.artist} · {painting.year}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
