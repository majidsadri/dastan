"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/lib/auth";
import PaintingBackdrop from "@/components/ui/PaintingBackdrop";
import MuseumCollections from "@/components/ui/MuseumCollections";

const QUOTES = [
  { text: "Every artist dips his brush in his own soul, and paints his own nature into his pictures.", author: "Henry Ward Beecher" },
  { text: "Art is not what you see, but what you make others see.", author: "Edgar Degas" },
  { text: "The purpose of art is washing the dust of daily life off our souls.", author: "Pablo Picasso" },
  { text: "A book must be the axe for the frozen sea within us.", author: "Franz Kafka" },
  { text: "We read to know we are not alone.", author: "C.S. Lewis" },
  { text: "In the midst of winter, I found there was, within me, an invincible summer.", author: "Albert Camus" },
  { text: "The wound is the place where the Light enters you.", author: "Rumi" },
];

export default function SignInPage() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [readingRoomOpen, setReadingRoomOpen] = useState(false);

  const [quote, setQuote] = useState(QUOTES[0]);
  useEffect(() => {
    setQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)]);
  }, []);

  // iPhone Safari sometimes auto-focuses the first login form field on
  // page load (Keychain / password autofill heuristics). On mount, scroll
  // to the top of the hero and blur anything that may already have focus,
  // so the keyboard does not pop up before the user taps an input.
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.scrollTo(0, 0);
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const err = await signIn(email, password);
    if (err) {
      setError(err);
      setLoading(false);
    }
  }

  return (
    <div className="relative overflow-x-hidden">
      {/* ══════════════════════════════════════════════════════════════ */}
      {/* ── Desktop hero region — fixed-height stage ────────────────── */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <div className="hidden lg:block relative h-[100dvh] w-full">
        {/* Desktop-only full-bleed backdrop */}
        <div className="absolute inset-0 overflow-hidden">
          <PaintingBackdrop />
        </div>

        {/* Desktop layout: explore left, card right */}
        <div className="absolute inset-0 flex items-center justify-between px-12 xl:px-20">
        {/* Left side — explore links */}
        <div className="flex flex-col gap-3 max-w-[280px]">
          {/* Gallery */}
          <Link
            href="/gallery"
            className="group flex items-center gap-4 px-5 py-4 rounded-2xl
                       bg-black/40 backdrop-blur-md border border-white/[0.08]
                       hover:bg-black/55 hover:border-white/[0.15]
                       transition-all duration-300"
            style={{ boxShadow: "0 4px 30px rgba(0,0,0,0.35)" }}
          >
            <div
              className="w-14 h-14 rounded-xl overflow-hidden shrink-0"
              style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.4)" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/paintings/monalisa.jpg" alt=""
                className="w-full h-full object-cover object-top group-hover:scale-110 transition-transform duration-700" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[17px] text-white font-medium group-hover:text-gold transition-colors duration-300"
                style={{ fontFamily: "var(--font-heading)" }}>Gallery</p>
              <p className="text-[11px] text-white/35 mt-0.5 tracking-wide"
                style={{ fontFamily: "var(--font-ui)" }}>1,300+ masterworks</p>
            </div>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="1.5" strokeLinecap="round"
                 className="text-white/20 group-hover:text-white/50 group-hover:translate-x-0.5 transition-all duration-300">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Link>

          {/* Artists */}
          <Link
            href="/artists"
            className="group flex items-center gap-4 px-5 py-4 rounded-2xl
                       bg-black/40 backdrop-blur-md border border-white/[0.08]
                       hover:bg-black/55 hover:border-white/[0.15]
                       transition-all duration-300"
            style={{ boxShadow: "0 4px 30px rgba(0,0,0,0.35)" }}
          >
            <div
              className="w-14 h-14 rounded-xl overflow-hidden shrink-0"
              style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.4)" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/paintings/vangogh.jpg" alt=""
                className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-700" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[17px] text-white font-medium group-hover:text-gold transition-colors duration-300"
                style={{ fontFamily: "var(--font-heading)" }}>The Artists</p>
              <p className="text-[11px] text-white/35 mt-0.5 tracking-wide"
                style={{ fontFamily: "var(--font-ui)" }}>Lives &amp; legacies</p>
            </div>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="1.5" strokeLinecap="round"
                 className="text-white/20 group-hover:text-white/50 group-hover:translate-x-0.5 transition-all duration-300">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Link>

          {/* Philosophers */}
          <Link
            href="/philosophers"
            className="group flex items-center gap-4 px-5 py-4 rounded-2xl
                       bg-black/40 backdrop-blur-md border border-white/[0.08]
                       hover:bg-black/55 hover:border-white/[0.15]
                       transition-all duration-300"
            style={{ boxShadow: "0 4px 30px rgba(0,0,0,0.35)" }}
          >
            <div
              className="w-14 h-14 rounded-xl overflow-hidden shrink-0 flex items-center justify-center"
              style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.4)", background: "linear-gradient(135deg, #2C2418 0%, #4A3828 100%)" }}
            >
              <svg width="32" height="32" viewBox="0 0 48 48" fill="none"
                className="group-hover:scale-105 transition-transform duration-500">
                <circle cx="24" cy="24" r="16" stroke="rgba(196,164,78,0.3)" strokeWidth="0.8" />
                <circle cx="24" cy="24" r="12" stroke="rgba(196,164,78,0.15)" strokeWidth="0.5" strokeDasharray="2 3" />
                <text x="24" y="29" textAnchor="middle" fill="rgba(196,164,78,0.7)" fontSize="18" fontFamily="Georgia, serif">φ</text>
                <circle cx="24" cy="10" r="1.5" fill="rgba(139,105,20,0.4)" />
                <circle cx="24" cy="38" r="1.5" fill="rgba(44,74,110,0.4)" />
                <circle cx="10" cy="24" r="1.2" fill="rgba(91,44,110,0.3)" />
                <circle cx="38" cy="24" r="1.2" fill="rgba(74,103,65,0.3)" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[17px] text-white font-medium group-hover:text-gold transition-colors duration-300"
                style={{ fontFamily: "var(--font-heading)" }}>The Thinkers</p>
              <p className="text-[11px] text-white/35 mt-0.5 tracking-wide"
                style={{ fontFamily: "var(--font-ui)" }}>Minds &amp; millennia</p>
            </div>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="1.5" strokeLinecap="round"
                 className="text-white/20 group-hover:text-white/50 group-hover:translate-x-0.5 transition-all duration-300">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Link>

          {/* ── The Reading Room — clickable tile that expands to reveal the three books ── */}
          <button
            type="button"
            onClick={() => setReadingRoomOpen((v) => !v)}
            className="group flex items-center gap-4 px-5 py-4 rounded-2xl
                       bg-black/40 backdrop-blur-md border border-white/[0.08]
                       hover:bg-black/55 hover:border-white/[0.15]
                       transition-all duration-300 text-left cursor-pointer"
            style={{ boxShadow: "0 4px 30px rgba(0,0,0,0.35)" }}
            aria-expanded={readingRoomOpen}
          >
            <div
              className="w-14 h-14 rounded-xl overflow-hidden shrink-0 flex items-center justify-center"
              style={{
                boxShadow: "0 2px 10px rgba(0,0,0,0.4)",
                background: "linear-gradient(135deg, #3A2A18 0%, #5A3F22 100%)",
              }}
            >
              {/* Stack of books */}
              <svg width="32" height="32" viewBox="0 0 40 40" fill="none"
                className="group-hover:scale-105 transition-transform duration-500">
                <rect x="8" y="9" width="24" height="5" rx="0.8"
                  stroke="rgba(196,164,78,0.65)" strokeWidth="0.9" fill="rgba(196,164,78,0.08)" />
                <line x1="12" y1="11.5" x2="15" y2="11.5" stroke="rgba(196,164,78,0.55)" strokeWidth="0.6" />
                <rect x="10" y="16" width="22" height="5" rx="0.8"
                  stroke="rgba(196,164,78,0.6)" strokeWidth="0.9" fill="rgba(196,164,78,0.06)" />
                <line x1="14" y1="18.5" x2="17" y2="18.5" stroke="rgba(196,164,78,0.5)" strokeWidth="0.6" />
                <rect x="7" y="23" width="26" height="5" rx="0.8"
                  stroke="rgba(196,164,78,0.55)" strokeWidth="0.9" fill="rgba(196,164,78,0.05)" />
                <line x1="11" y1="25.5" x2="14" y2="25.5" stroke="rgba(196,164,78,0.45)" strokeWidth="0.6" />
                <line x1="8" y1="31" x2="32" y2="31" stroke="rgba(196,164,78,0.3)" strokeWidth="0.6" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[17px] text-white font-medium group-hover:text-gold transition-colors duration-300"
                style={{ fontFamily: "var(--font-heading)" }}>The Reading Room</p>
            </div>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="1.5" strokeLinecap="round"
                 className={`text-white/25 group-hover:text-white/55 transition-all duration-300 ${
                   readingRoomOpen ? "rotate-90" : ""
                 }`}>
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>

          {/* Expandable list of books */}
          <div
            className={`grid transition-all duration-500 ease-out ${
              readingRoomOpen
                ? "grid-rows-[1fr] opacity-100"
                : "grid-rows-[0fr] opacity-0 pointer-events-none"
            }`}
          >
            <div className="overflow-hidden">
              <div className="flex flex-col gap-2.5 pl-4 border-l border-white/10 ml-5">

          {/* Faal-e Hafez */}
          <Link
            href="/faal"
            className="group flex items-center gap-4 px-5 py-4 rounded-2xl
                       bg-black/40 backdrop-blur-md border border-white/[0.08]
                       hover:bg-black/55 hover:border-white/[0.15]
                       transition-all duration-300"
            style={{ boxShadow: "0 4px 30px rgba(0,0,0,0.35)" }}
          >
            <div
              className="w-14 h-14 rounded-xl overflow-hidden shrink-0 flex items-center justify-center"
              style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.4)", background: "linear-gradient(135deg, #3A2A18 0%, #5A3F22 100%)" }}
            >
              <svg width="30" height="30" viewBox="0 0 40 40" fill="none"
                className="group-hover:scale-105 transition-transform duration-500">
                {/* Open Divan of Hafez */}
                <path d="M8 12 Q20 9 32 12 L32 30 Q20 27 8 30 Z"
                  fill="rgba(196,164,78,0.1)" stroke="rgba(196,164,78,0.55)" strokeWidth="0.9" />
                <line x1="20" y1="10" x2="20" y2="28" stroke="rgba(196,164,78,0.4)" strokeWidth="0.6" />
                <path d="M11 16 Q15 15 17 16" stroke="rgba(196,164,78,0.55)" strokeWidth="0.6" fill="none" />
                <path d="M11 19 Q15 18 17 19" stroke="rgba(196,164,78,0.45)" strokeWidth="0.6" fill="none" />
                <path d="M11 22 Q15 21 17 22" stroke="rgba(196,164,78,0.35)" strokeWidth="0.6" fill="none" />
                <path d="M23 16 Q27 15 29 16" stroke="rgba(196,164,78,0.55)" strokeWidth="0.6" fill="none" />
                <path d="M23 19 Q27 18 29 19" stroke="rgba(196,164,78,0.45)" strokeWidth="0.6" fill="none" />
                <path d="M23 22 Q27 21 29 22" stroke="rgba(196,164,78,0.35)" strokeWidth="0.6" fill="none" />
                {/* Star above */}
                <circle cx="20" cy="5" r="1.3" fill="rgba(196,164,78,0.55)" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[17px] text-white font-medium group-hover:text-gold transition-colors duration-300"
                style={{ fontFamily: "var(--font-heading)" }}>Faal-e Hafez</p>
              <p className="text-[11px] text-white/35 mt-0.5 tracking-wide"
                style={{ fontFamily: "var(--font-ui)" }}>Ask the Divan &mdash; فال حافظ</p>
            </div>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="1.5" strokeLinecap="round"
                 className="text-white/20 group-hover:text-white/50 group-hover:translate-x-0.5 transition-all duration-300">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Link>

          {/* Le Petit Prince */}
          <Link
            href="/little-prince"
            className="group flex items-center gap-4 px-5 py-4 rounded-2xl
                       bg-black/40 backdrop-blur-md border border-white/[0.08]
                       hover:bg-black/55 hover:border-white/[0.15]
                       transition-all duration-300"
            style={{ boxShadow: "0 4px 30px rgba(0,0,0,0.35)" }}
          >
            <div
              className="w-14 h-14 rounded-xl overflow-hidden shrink-0 flex items-center justify-center bg-parchment"
              style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.4)" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/little-prince/09-fox.png" alt=""
                className="w-full h-full object-contain p-1 group-hover:scale-105 transition-transform duration-700" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[17px] text-white font-medium group-hover:text-gold transition-colors duration-300"
                style={{ fontFamily: "var(--font-heading)" }}>Le Petit Prince</p>
              <p className="text-[11px] text-white/35 mt-0.5 tracking-wide"
                style={{ fontFamily: "var(--font-ui)" }}>Saint-Exupéry, 1943</p>
            </div>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="1.5" strokeLinecap="round"
                 className="text-white/20 group-hover:text-white/50 group-hover:translate-x-0.5 transition-all duration-300">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Link>

          {/* Siddhartha */}
          <Link
            href="/siddhartha"
            className="group flex items-center gap-4 px-5 py-4 rounded-2xl
                       bg-black/40 backdrop-blur-md border border-white/[0.08]
                       hover:bg-black/55 hover:border-white/[0.15]
                       transition-all duration-300"
            style={{ boxShadow: "0 4px 30px rgba(0,0,0,0.35)" }}
          >
            <div
              className="w-14 h-14 rounded-xl overflow-hidden shrink-0 flex items-center justify-center"
              style={{
                boxShadow: "0 2px 10px rgba(0,0,0,0.4)",
                background: "linear-gradient(135deg, #F0E9D8 0%, #E4DCC9 100%)",
              }}
            >
              <svg
                width="34" height="34" viewBox="0 0 100 100" fill="none"
                stroke="#1E1A15" strokeWidth="3" strokeLinecap="round"
                className="group-hover:scale-105 transition-transform duration-500"
              >
                <path d="M 78 30 A 32 32 0 1 0 72 78 L 68 82" opacity="0.85" />
                <circle cx="68" cy="82" r="2" fill="#1E1A15" opacity="0.6" stroke="none" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[17px] text-white font-medium group-hover:text-gold transition-colors duration-300"
                style={{ fontFamily: "var(--font-heading)" }}>Siddhartha</p>
              <p className="text-[11px] text-white/35 mt-0.5 tracking-wide"
                style={{ fontFamily: "var(--font-ui)" }}>Hermann Hesse, 1922</p>
            </div>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="1.5" strokeLinecap="round"
                 className="text-white/20 group-hover:text-white/50 group-hover:translate-x-0.5 transition-all duration-300">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Link>

          {/* Tao Te Ching */}
          <Link
            href="/tao"
            className="group flex items-center gap-4 px-5 py-4 rounded-2xl
                       bg-black/40 backdrop-blur-md border border-white/[0.08]
                       hover:bg-black/55 hover:border-white/[0.15]
                       transition-all duration-300"
            style={{ boxShadow: "0 4px 30px rgba(0,0,0,0.35)" }}
          >
            <div
              className="w-14 h-14 rounded-xl overflow-hidden shrink-0 flex items-center justify-center"
              style={{
                boxShadow: "0 2px 10px rgba(0,0,0,0.4)",
                background: "linear-gradient(135deg, #0E1810 0%, #1F2E24 100%)",
              }}
            >
              <span
                aria-hidden
                className="text-[26px] leading-none group-hover:scale-105 transition-transform duration-500"
                style={{ fontFamily: "var(--font-heading)", color: "rgba(127,168,130,0.9)" }}
              >
                道
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[17px] text-white font-medium group-hover:text-gold transition-colors duration-300"
                style={{ fontFamily: "var(--font-heading)" }}>Tao Te Ching</p>
              <p className="text-[11px] text-white/35 mt-0.5 tracking-wide"
                style={{ fontFamily: "var(--font-ui)" }}>Lao Tzu · Twelve passages</p>
            </div>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="1.5" strokeLinecap="round"
                 className="text-white/20 group-hover:text-white/50 group-hover:translate-x-0.5 transition-all duration-300">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Link>

          {/* In Search of Lost Time */}
          <Link
            href="/proust"
            className="group flex items-center gap-4 px-5 py-4 rounded-2xl
                       bg-black/40 backdrop-blur-md border border-white/[0.08]
                       hover:bg-black/55 hover:border-white/[0.15]
                       transition-all duration-300"
            style={{ boxShadow: "0 4px 30px rgba(0,0,0,0.35)" }}
          >
            <div
              className="w-14 h-14 rounded-xl overflow-hidden shrink-0 flex items-center justify-center"
              style={{
                boxShadow: "0 2px 10px rgba(0,0,0,0.4)",
                background: "linear-gradient(135deg, #371620 0%, #5A2836 100%)",
              }}
            >
              <span
                aria-hidden
                className="text-[22px] leading-none group-hover:scale-105 transition-transform duration-500"
                style={{ fontFamily: "var(--font-heading)", color: "rgba(217,164,164,0.9)" }}
              >
                ❦
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[17px] text-white font-medium group-hover:text-gold transition-colors duration-300"
                style={{ fontFamily: "var(--font-heading)" }}>In Search of Lost Time</p>
              <p className="text-[11px] text-white/35 mt-0.5 tracking-wide"
                style={{ fontFamily: "var(--font-ui)" }}>Marcel Proust, 1913</p>
            </div>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="1.5" strokeLinecap="round"
                 className="text-white/20 group-hover:text-white/50 group-hover:translate-x-0.5 transition-all duration-300">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Right side — login card (opaque on desktop) */}
        <div className="w-[390px] animate-fade-in">
          <div
            className="bg-parchment rounded-2xl overflow-hidden"
            style={{ boxShadow: "0 12px 50px rgba(0,0,0,0.3), 0 2px 8px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.6)" }}
          >
            <div className="h-[2px]" style={{ background: "linear-gradient(to right, transparent 10%, #C4A44E 30%, #D4B85A 50%, #C4A44E 70%, transparent 90%)" }} />

            <div className="px-9 pt-8 pb-7">
              {/* Logo */}
              <div className="flex items-center justify-center gap-3 mb-6">
                <Image src="/logo.svg" alt="Dastan" width={40} height={40} className="rounded-lg" />
                <div>
                  <h1 className="text-xl text-sepia" style={{ fontFamily: "var(--font-heading)" }}>Dastan</h1>
                  <p className="text-[8px] text-sepia-light/35 uppercase tracking-[0.22em]" style={{ fontFamily: "var(--font-ui)" }}>Every day, a new tale</p>
                </div>
              </div>

              {/* Quote */}
              <div className="relative mb-6 text-center px-2">
                <span className="absolute -top-3 -left-1 text-gold/15 select-none pointer-events-none"
                  style={{ fontFamily: "var(--font-heading)", fontSize: "48px", lineHeight: 1 }} aria-hidden="true">&ldquo;</span>
                <p className="text-sepia/55 text-[13px] leading-[1.75] italic relative z-[1]"
                  style={{ fontFamily: "var(--font-body)" }}>{quote.text}</p>
                <p className="text-sepia-light/30 text-[9px] tracking-[0.18em] uppercase mt-2"
                  style={{ fontFamily: "var(--font-ui)" }}>{quote.author}</p>
              </div>

              <div className="dot-divider mb-6"><span /><span /><span /><span /><span /></div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="d-email" className="block text-[10px] text-sepia-light/40 uppercase tracking-[0.2em] mb-1.5"
                    style={{ fontFamily: "var(--font-ui)" }}>Email</label>
                  <input id="d-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email"
                    className="w-full px-0 py-2.5 bg-transparent border-b border-warm-border/60 text-sepia placeholder:text-sepia-light/18 focus:border-gold focus:outline-none transition-colors duration-300"
                    style={{ fontFamily: "var(--font-body)", fontSize: "16px" }} placeholder="your@email.com" />
                </div>
                <div>
                  <label htmlFor="d-password" className="block text-[10px] text-sepia-light/40 uppercase tracking-[0.2em] mb-1.5"
                    style={{ fontFamily: "var(--font-ui)" }}>Password</label>
                  <div className="relative">
                    <input id="d-password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password"
                      className="w-full px-0 py-2.5 pr-10 bg-transparent border-b border-warm-border/60 text-sepia placeholder:text-sepia-light/18 focus:border-gold focus:outline-none transition-colors duration-300"
                      style={{ fontFamily: "var(--font-body)", fontSize: "16px" }} placeholder="your password" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-sepia-light/20 active:text-sepia-light transition-colors cursor-pointer" tabIndex={-1}>
                      {showPassword ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
                {error && (
                  <div className="flex items-start gap-2 animate-fade-in px-3 py-2 rounded-lg bg-[#9B4D4D]/5 border border-[#9B4D4D]/10">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9B4D4D" strokeWidth="1.5" className="shrink-0 mt-0.5">
                      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <p className="text-[12px]" style={{ fontFamily: "var(--font-ui)", color: "#9B4D4D" }}>{error}</p>
                  </div>
                )}
                <button type="submit" disabled={loading}
                  className="w-full py-3 bg-sepia text-parchment text-[12.5px] tracking-[0.12em] uppercase rounded-lg active:scale-[0.98] transition-all duration-300 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed mt-1.5"
                  style={{ fontFamily: "var(--font-ui)", boxShadow: "0 2px 8px rgba(44,36,24,0.2)" }}>
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="block w-1.5 h-1.5 rounded-full bg-parchment" style={{ animation: "pulse-dot 1s ease-in-out infinite" }} />
                      <span className="block w-1.5 h-1.5 rounded-full bg-parchment" style={{ animation: "pulse-dot 1s ease-in-out 0.2s infinite" }} />
                      <span className="block w-1.5 h-1.5 rounded-full bg-parchment" style={{ animation: "pulse-dot 1s ease-in-out 0.4s infinite" }} />
                    </span>
                  ) : "Enter the Gallery"}
                </button>
              </form>
              <div className="flex items-center gap-3 my-4">
                <span className="flex-1 h-[1px] bg-warm-border/30" />
                <span className="text-[8px] text-sepia-light/20 uppercase tracking-[0.3em]" style={{ fontFamily: "var(--font-ui)" }}>or</span>
                <span className="flex-1 h-[1px] bg-warm-border/30" />
              </div>
              <Link href="/signup"
                className="block w-full py-2.5 text-center text-[12.5px] text-sepia-light/45 border border-warm-border/40 rounded-lg active:border-gold active:text-gold transition-all duration-200"
                style={{ fontFamily: "var(--font-ui)" }}>Create your account</Link>
              <p className="text-center text-[9px] text-sepia-light/20 italic mt-5"
                style={{ fontFamily: "var(--font-body)" }}>Beauty, one day at a time.</p>

              {/* Instagram + Privacy — small, quiet, art-lover tone */}
              <nav
                className="mt-3 flex items-center justify-center gap-3 text-[9px]"
                style={{ fontFamily: "var(--font-ui)", letterSpacing: "0.18em" }}
              >
                <a
                  href="https://www.instagram.com/dastan.journal/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Follow Dastan on Instagram"
                  className="text-sepia-light/35 hover:text-sepia-light/80 uppercase inline-flex items-center gap-1 transition-colors"
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="3" y="3" width="18" height="18" rx="5" />
                    <circle cx="12" cy="12" r="4" />
                    <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" stroke="none" />
                  </svg>
                  Instagram
                </a>
                <span className="text-sepia-light/20" aria-hidden="true">·</span>
                <Link
                  href="/privacy"
                  className="text-sepia-light/35 hover:text-sepia-light/80 uppercase transition-colors"
                >
                  Privacy
                </Link>
              </nav>
            </div>
          </div>
        </div>
      </div>
      </div>

      {/* ── Desktop: Open Museum Collections (scrolls below the hero) ── */}
      <div className="hidden lg:block bg-parchment">
        <MuseumCollections />
      </div>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* ── Mobile: natural-flow layout, Safari-safe ────────────────── */}
      {/* Hero (painting + logo + quote) → Form (parchment) → Explore   */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <div className="lg:hidden flex flex-col min-h-[100dvh]">

        {/* ── Hero: painting + logo + quote ─────────────────────────── */}
        <header
          className="relative overflow-hidden"
          style={{ height: "min(58dvh, 520px)", minHeight: "340px" }}
        >
          {/* Backdrop, confined to the hero region */}
          <PaintingBackdrop />

          {/* Extra bottom fade into parchment so the seam is invisible */}
          <div
            className="absolute inset-x-0 bottom-0 h-32 z-[6] pointer-events-none"
            style={{
              background:
                "linear-gradient(to bottom, rgba(253,251,247,0) 0%, rgba(253,251,247,0.55) 60%, #FDFBF7 100%)",
            }}
          />

          {/* Logo + wordmark — top, safe-area aware */}
          <div
            className="relative z-10 flex flex-col items-center"
            style={{ paddingTop: "max(28px, calc(env(safe-area-inset-top) + 18px))" }}
          >
            <Image
              src="/logo.svg"
              alt="Dastan"
              width={56}
              height={56}
              className="rounded-2xl mb-3"
              style={{ filter: "drop-shadow(0 4px 16px rgba(0,0,0,0.45))" }}
            />
            <h1
              className="text-[30px] text-white tracking-tight leading-none"
              style={{
                fontFamily: "var(--font-heading)",
                textShadow: "0 2px 16px rgba(0,0,0,0.55)",
              }}
            >
              Dastan
            </h1>
            <p
              className="text-[10px] text-white/75 uppercase tracking-[0.3em] mt-1.5"
              style={{
                fontFamily: "var(--font-ui)",
                textShadow: "0 1px 6px rgba(0,0,0,0.55)",
              }}
            >
              Every day, a new tale
            </p>
          </div>

          {/* Quote — readable, floats near bottom of hero */}
          <div className="absolute bottom-10 inset-x-0 z-10 px-7">
            <p
              className="text-white/95 text-[14px] leading-[1.6] italic text-center"
              style={{
                fontFamily: "var(--font-body)",
                textShadow: "0 1px 10px rgba(0,0,0,0.65)",
              }}
            >
              &ldquo;{quote.text}&rdquo;
            </p>
            <p
              className="text-white/70 text-[10px] not-italic tracking-[0.2em] uppercase text-center mt-2"
              style={{
                fontFamily: "var(--font-ui)",
                textShadow: "0 1px 6px rgba(0,0,0,0.65)",
              }}
            >
              — {quote.author}
            </p>
          </div>
        </header>

        {/* ── Form section: parchment, flows naturally, keyboard-safe ── */}
        <main
          className="relative bg-parchment flex-1 px-6 pt-7"
          style={{ paddingBottom: "max(40px, calc(env(safe-area-inset-bottom) + 24px))" }}
        >
          {/* Top gold seam */}
          <div
            className="absolute inset-x-12 top-0 h-[2px]"
            style={{
              background:
                "linear-gradient(to right, transparent 0%, #C4A44E 40%, #D4B85A 50%, #C4A44E 60%, transparent 100%)",
            }}
          />

          {/* ── Explore as a guest — ABOVE the login form ── */}
          <div className="max-w-sm mx-auto mb-6">
            <p
              className="text-[10px] text-sepia-light/60 uppercase tracking-[0.22em] text-center mb-3"
              style={{ fontFamily: "var(--font-ui)" }}
            >
              Explore as a guest
            </p>

            <div
              className="flex gap-2.5 overflow-x-auto -mx-6 px-6 pb-2 dastan-explore-scroll"
              style={{
                scrollSnapType: "x mandatory",
                WebkitOverflowScrolling: "touch",
                scrollbarWidth: "none",
              }}
            >
              <style>{`
                .dastan-explore-scroll::-webkit-scrollbar { display: none; }
              `}</style>
              {[
                { href: "/gallery", label: "Gallery", sub: "1,300+ masterworks", img: "/paintings/monalisa.jpg" },
                { href: "/artists", label: "The Artists", sub: "Lives & legacies", img: "/paintings/vangogh.jpg" },
                { href: "/philosophers", label: "The Thinkers", sub: "Minds & millennia", icon: "φ" },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="shrink-0 flex items-center gap-2.5 pl-1.5 pr-4 py-2 rounded-2xl
                             bg-white/80 border border-warm-border
                             active:bg-white active:scale-[0.97] transition-all duration-150"
                  style={{
                    scrollSnapAlign: "start",
                    minHeight: "52px",
                    boxShadow: "0 2px 10px rgba(44,36,24,0.06)",
                  }}
                >
                  <div
                    className="w-9 h-9 rounded-xl overflow-hidden shrink-0 flex items-center justify-center"
                    style={{
                      background: item.img
                        ? undefined
                        : "linear-gradient(135deg, #2C2418 0%, #4A3828 100%)",
                    }}
                  >
                    {item.img ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.img} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span
                        className="text-gold/80 text-[18px]"
                        style={{ fontFamily: "Georgia, serif" }}
                      >
                        {item.icon}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col leading-tight pr-1">
                    <span
                      className="text-[13px] text-sepia font-medium whitespace-nowrap"
                      style={{ fontFamily: "var(--font-heading)" }}
                    >
                      {item.label}
                    </span>
                    <span
                      className="text-[10px] text-sepia-light/60 mt-0.5 whitespace-nowrap"
                      style={{ fontFamily: "var(--font-ui)" }}
                    >
                      {item.sub}
                    </span>
                  </div>
                </Link>
              ))}
            </div>

            {/* ── The Reading Room — foldable chapter on iPhone ── */}
            <div className="mt-7 -mx-6">
              <style>{`
                @keyframes bookOpenIn {
                  0%   { opacity: 0; transform: translateY(14px) rotate(-3deg) scale(0.9); }
                  60%  { opacity: 1; }
                  100% { opacity: 1; transform: translateY(0) rotate(0) scale(1); }
                }
                @keyframes curtainDraw {
                  from { transform: scaleX(0); }
                  to   { transform: scaleX(1); }
                }
                .reading-room-open .dastan-book-card {
                  animation: bookOpenIn 0.62s cubic-bezier(0.22, 1, 0.36, 1) both;
                }
                .reading-room-open .dastan-book-card:nth-child(1) { animation-delay: 0.06s; }
                .reading-room-open .dastan-book-card:nth-child(2) { animation-delay: 0.18s; }
                .reading-room-open .dastan-book-card:nth-child(3) { animation-delay: 0.30s; }
                .reading-room-open .reading-room-curtain {
                  animation: curtainDraw 0.55s ease-out both;
                }
              `}</style>

              <div className="px-6">
                <button
                  type="button"
                  onClick={() => setReadingRoomOpen((v) => !v)}
                  aria-expanded={readingRoomOpen}
                  className="w-full flex items-center gap-3 pl-3 pr-4 py-3 rounded-2xl
                             bg-white/85 border border-warm-border
                             active:bg-white active:scale-[0.98]
                             transition-all duration-200"
                  style={{
                    WebkitTapHighlightColor: "transparent",
                    touchAction: "manipulation",
                    boxShadow: readingRoomOpen
                      ? "0 6px 22px -6px rgba(139,105,20,0.28), 0 1px 2px rgba(44,36,24,0.08)"
                      : "0 2px 10px rgba(44,36,24,0.06)",
                  }}
                >
                  {/* Stack-of-books icon in a warm sepia chip */}
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 overflow-hidden relative"
                    style={{
                      background: "linear-gradient(135deg, #3A2A18 0%, #5A3F22 100%)",
                      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)",
                    }}
                  >
                    <svg width="26" height="26" viewBox="0 0 40 40" fill="none">
                      <rect x="8" y="9" width="24" height="5" rx="0.8"
                        stroke="rgba(196,164,78,0.72)" strokeWidth="0.9" fill="rgba(196,164,78,0.08)" />
                      <line x1="12" y1="11.5" x2="15" y2="11.5" stroke="rgba(196,164,78,0.6)" strokeWidth="0.6" />
                      <rect x="10" y="16" width="22" height="5" rx="0.8"
                        stroke="rgba(196,164,78,0.65)" strokeWidth="0.9" fill="rgba(196,164,78,0.06)" />
                      <line x1="14" y1="18.5" x2="17" y2="18.5" stroke="rgba(196,164,78,0.55)" strokeWidth="0.6" />
                      <rect x="7" y="23" width="26" height="5" rx="0.8"
                        stroke="rgba(196,164,78,0.6)" strokeWidth="0.9" fill="rgba(196,164,78,0.05)" />
                      <line x1="11" y1="25.5" x2="14" y2="25.5" stroke="rgba(196,164,78,0.5)" strokeWidth="0.6" />
                      <line x1="8" y1="31" x2="32" y2="31" stroke="rgba(196,164,78,0.35)" strokeWidth="0.6" />
                    </svg>
                    {/* A tiny gold spark when closed */}
                    {!readingRoomOpen && (
                      <span
                        className="absolute top-1.5 right-1.5 w-1 h-1 rounded-full"
                        style={{ background: "#E6CC7A", boxShadow: "0 0 4px #E6CC7A" }}
                      />
                    )}
                  </div>

                  <div className="flex-1 min-w-0 text-left">
                    <p
                      className="text-[15px] text-sepia font-medium leading-tight"
                      style={{ fontFamily: "var(--font-heading)" }}
                    >
                      The Reading Room
                    </p>
                    <p
                      className="text-[10px] text-sepia-light/65 mt-0.5 tracking-wide italic"
                      style={{ fontFamily: "var(--font-heading)" }}
                    >
                      {readingRoomOpen ? "Swipe and choose a book" : "Three quiet books inside"}
                    </p>
                  </div>

                  {/* Fold indicator — two elegant hairlines that cross when closed, open when toggled */}
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 relative"
                    style={{
                      background: readingRoomOpen ? "rgba(139,105,20,0.1)" : "rgba(44,36,24,0.04)",
                      transition: "background 250ms ease",
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                         stroke={readingRoomOpen ? "#8B6914" : "#6B5D4D"}
                         strokeWidth="1.6" strokeLinecap="round"
                         className="transition-transform duration-500"
                         style={{ transform: readingRoomOpen ? "rotate(90deg)" : "rotate(0deg)" }}>
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </div>
                </button>

                {/* Curtain — thin gold line that sweeps across when opened */}
                <div
                  className={`mt-2 mx-4 h-px origin-left ${
                    readingRoomOpen ? "reading-room-curtain" : "scale-x-0"
                  }`}
                  style={{
                    background:
                      "linear-gradient(to right, transparent 0%, #C4A44E 20%, #D4B85A 50%, #C4A44E 80%, transparent 100%)",
                    opacity: readingRoomOpen ? 0.7 : 0,
                    transition: "opacity 450ms ease",
                  }}
                  aria-hidden
                />
              </div>

              {/* Expandable panel — opens like a book */}
              <div
                className={`grid transition-[grid-template-rows,opacity] duration-600 ease-out ${
                  readingRoomOpen
                    ? "grid-rows-[1fr] opacity-100 reading-room-open"
                    : "grid-rows-[0fr] opacity-0 pointer-events-none"
                }`}
                style={{ transitionDuration: "600ms" }}
              >
                <div className="overflow-hidden">
                  <p
                    className="text-center text-[11px] italic text-sepia-light/55 mt-4 mb-3"
                    style={{ fontFamily: "var(--font-heading)" }}
                  >
                    Tap a book to enter its reading room
                  </p>

                  <div
                    className="flex gap-3 overflow-x-auto px-6 pb-5 dastan-reading-scroll"
                style={{
                  scrollSnapType: "x mandatory",
                  WebkitOverflowScrolling: "touch",
                  scrollbarWidth: "none",
                  scrollPaddingLeft: "24px",
                }}
              >
                <style>{`
                  .dastan-reading-scroll::-webkit-scrollbar { display: none; }
                  .dastan-book-card {
                    -webkit-tap-highlight-color: transparent;
                    touch-action: manipulation;
                    transform: translateZ(0);
                  }
                  .dastan-book-card:active { transform: scale(0.97); }
                `}</style>

                {/* ═══ Faal-e Hafez — Persian crimson, gold lattice ═══ */}
                <Link
                  href="/faal"
                  className="dastan-book-card shrink-0 relative overflow-hidden rounded-[18px]
                             w-[42vw] max-w-[160px] aspect-[2/3] transition-transform duration-150"
                  style={{
                    scrollSnapAlign: "start",
                    boxShadow:
                      "0 12px 34px -8px rgba(58,18,14,0.55), 0 4px 10px -2px rgba(0,0,0,0.25), inset 0 0 0 0.5px rgba(196,164,78,0.35)",
                  }}
                >
                  {/* Deep crimson / rosewood gradient */}
                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        "linear-gradient(168deg, #4A1810 0%, #6A1F18 35%, #4A1208 72%, #2A0D08 100%)",
                    }}
                  />
                  {/* Gold geometric lattice — Persian medallion */}
                  <svg
                    aria-hidden
                    className="absolute inset-0 w-full h-full"
                    viewBox="0 0 120 172"
                    preserveAspectRatio="xMidYMid slice"
                  >
                    {/* Border ornament — top */}
                    <g stroke="#C4A44E" strokeWidth="0.4" fill="none" opacity="0.4">
                      <path d="M 12 10 L 108 10" />
                      <path d="M 12 14 L 108 14" strokeWidth="0.25" />
                      <path d="M 18 7 L 22 13 L 26 7 L 30 13 L 34 7 L 38 13 L 42 7 L 46 13 L 50 7 L 54 13 L 58 7 L 62 13 L 66 7 L 70 13 L 74 7 L 78 13 L 82 7 L 86 13 L 90 7 L 94 13 L 98 7 L 102 13" strokeWidth="0.35" />
                    </g>
                    {/* Central medallion — eight-point star */}
                    <g transform="translate(60, 72)" opacity="0.8">
                      <g stroke="#C4A44E" fill="none" strokeWidth="0.45">
                        <circle r="28" opacity="0.3" />
                        <circle r="22" opacity="0.55" />
                        <circle r="10" opacity="0.75" />
                      </g>
                      {/* Eight-point star */}
                      <g stroke="#D4B85A" strokeWidth="0.5" fill="rgba(196,164,78,0.08)">
                        <path d="M 0 -22 L 4 -4 L 22 0 L 4 4 L 0 22 L -4 4 L -22 0 L -4 -4 Z" />
                        <path d="M 15.5 -15.5 L 4 -2 L 15.5 15.5 L 2 4 L -15.5 15.5 L -4 2 L -15.5 -15.5 L -2 -4 Z" opacity="0.7" />
                      </g>
                      {/* Center */}
                      <circle r="4" fill="#D4B85A" opacity="0.9" />
                      <circle r="1.8" fill="#4A1810" />
                    </g>
                    {/* Calligraphic flourish — suggests a verse */}
                    <g stroke="#C4A44E" strokeWidth="0.5" fill="none" opacity="0.55" strokeLinecap="round">
                      <path d="M 30 120 Q 45 114, 60 120 Q 75 126, 90 118" />
                      <path d="M 34 126 Q 50 122, 60 126 Q 72 130, 86 124" opacity="0.6" />
                    </g>
                    {/* Border ornament — bottom */}
                    <g stroke="#C4A44E" strokeWidth="0.4" fill="none" opacity="0.4">
                      <path d="M 12 138 L 108 138" strokeWidth="0.25" />
                      <path d="M 12 142 L 108 142" />
                    </g>
                    {/* Four corner diamonds */}
                    <g fill="#C4A44E" opacity="0.6">
                      <path d="M 12 10 L 15 13 L 12 16 L 9 13 Z" />
                      <path d="M 108 10 L 111 13 L 108 16 L 105 13 Z" />
                      <path d="M 12 138 L 15 141 L 12 144 L 9 141 Z" />
                      <path d="M 108 138 L 111 141 L 108 144 L 105 141 Z" />
                    </g>
                  </svg>
                  {/* Vignette to lift bottom title */}
                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        "linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.2) 38%, rgba(0,0,0,0) 65%)",
                    }}
                  />
                  {/* Gold spine seam */}
                  <div
                    className="absolute left-0 top-4 bottom-4 w-[3px]"
                    style={{
                      background:
                        "linear-gradient(to bottom, transparent 0%, #C4A44E 18%, #E6CC7A 50%, #C4A44E 82%, transparent 100%)",
                      boxShadow: "0 0 4px rgba(196,164,78,0.5)",
                      opacity: 0.85,
                    }}
                  />
                  {/* Text plate */}
                  <div className="absolute inset-x-0 bottom-0 p-2.5">
                    <p
                      className="text-[8px] uppercase tracking-[0.26em]"
                      style={{ fontFamily: "var(--font-ui)", color: "rgba(230,204,122,0.85)" }}
                    >
                      Hafez of Shiraz
                    </p>
                    <p
                      className="mt-1 text-[15px] leading-[1.05] text-white"
                      style={{
                        fontFamily: "var(--font-heading)",
                        fontStyle: "italic",
                        textShadow: "0 1px 8px rgba(0,0,0,0.65)",
                      }}
                    >
                      Faal-e Hafez
                    </p>
                    <p
                      className="mt-0.5 text-[9px] tracking-wide"
                      style={{ fontFamily: "var(--font-ui)", color: "rgba(255,255,255,0.55)" }}
                    >
                      Ask the Divan · فال حافظ
                    </p>
                  </div>
                </Link>

                {/* ═══ Le Petit Prince — night sky, asteroid B-612 ═══ */}
                <Link
                  href="/little-prince"
                  className="dastan-book-card shrink-0 relative overflow-hidden rounded-[18px]
                             w-[42vw] max-w-[160px] aspect-[2/3] transition-transform duration-150"
                  style={{
                    scrollSnapAlign: "start",
                    boxShadow:
                      "0 12px 34px -8px rgba(15,27,60,0.55), 0 4px 10px -2px rgba(0,0,0,0.25), inset 0 0 0 0.5px rgba(244,215,158,0.22)",
                  }}
                >
                  {/* Dusk-to-night gradient */}
                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        "linear-gradient(172deg, #0A1130 0%, #1B2450 28%, #2C2D58 52%, #4A3050 78%, #6E3930 100%)",
                    }}
                  />
                  {/* Stars + moon + asteroid */}
                  <svg
                    aria-hidden
                    className="absolute inset-0 w-full h-full"
                    viewBox="0 0 120 172"
                    preserveAspectRatio="xMidYMid slice"
                  >
                    {/* Milky band suggestion */}
                    <ellipse cx="70" cy="40" rx="60" ry="10" fill="rgba(244,215,158,0.04)" />
                    {/* Starfield */}
                    <g fill="#F4D79E">
                      <circle cx="15" cy="16" r="0.9" opacity="0.95" />
                      <circle cx="34" cy="8" r="0.5" opacity="0.55" />
                      <circle cx="52" cy="22" r="0.7" opacity="0.8" />
                      <circle cx="68" cy="10" r="0.45" opacity="0.55" />
                      <circle cx="84" cy="28" r="0.6" opacity="0.7" />
                      <circle cx="102" cy="14" r="0.9" opacity="0.95" />
                      <circle cx="112" cy="34" r="0.5" opacity="0.55" />
                      <circle cx="10" cy="44" r="0.55" opacity="0.6" />
                      <circle cx="28" cy="54" r="0.4" opacity="0.45" />
                      <circle cx="44" cy="40" r="0.5" opacity="0.55" />
                      <circle cx="76" cy="48" r="0.4" opacity="0.5" />
                      <circle cx="96" cy="58" r="0.55" opacity="0.65" />
                      <circle cx="20" cy="72" r="0.45" opacity="0.5" />
                      <circle cx="60" cy="64" r="0.4" opacity="0.45" />
                      <circle cx="108" cy="76" r="0.5" opacity="0.55" />
                    </g>
                    {/* Sparkle stars */}
                    <g stroke="#F4E4BF" strokeWidth="0.35" strokeLinecap="round" opacity="0.85">
                      <g transform="translate(90, 20)">
                        <line x1="-3.5" y1="0" x2="3.5" y2="0" />
                        <line x1="0" y1="-3.5" x2="0" y2="3.5" />
                      </g>
                      <g transform="translate(24, 32)" opacity="0.7">
                        <line x1="-2.5" y1="0" x2="2.5" y2="0" />
                        <line x1="0" y1="-2.5" x2="0" y2="2.5" />
                      </g>
                      <g transform="translate(60, 88)" opacity="0.7">
                        <line x1="-2" y1="0" x2="2" y2="0" />
                        <line x1="0" y1="-2" x2="0" y2="2" />
                      </g>
                    </g>
                    {/* Crescent moon, upper right */}
                    <g transform="translate(92, 56)">
                      <circle cx="0" cy="0" r="14" fill="#F4E4BF" opacity="0.1" />
                      <circle cx="0" cy="0" r="9" fill="#F4E4BF" opacity="0.18" />
                      <path
                        d="M 4.5 -8.5 A 10.5 10.5 0 1 0 4.5 8.5 A 7.5 7.5 0 1 1 4.5 -8.5 Z"
                        fill="#F4E4BF"
                        opacity="0.88"
                      />
                    </g>
                    {/* Shooting star trail */}
                    <path
                      d="M 16 80 L 40 96"
                      stroke="url(#lppTrail)"
                      strokeWidth="0.6"
                      opacity="0.7"
                    />
                    <defs>
                      <linearGradient id="lppTrail" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#F4D79E" stopOpacity="0" />
                        <stop offset="100%" stopColor="#F4D79E" stopOpacity="0.95" />
                      </linearGradient>
                    </defs>
                    <circle cx="40" cy="96" r="0.9" fill="#F4E4BF" opacity="0.95" />
                    {/* Asteroid B-612 with the Prince + rose, bottom centre */}
                    <g transform="translate(60, 138)">
                      {/* soft ground shadow */}
                      <ellipse cx="0" cy="16" rx="22" ry="3" fill="rgba(0,0,0,0.4)" />
                      {/* asteroid body */}
                      <circle
                        cx="0"
                        cy="0"
                        r="14"
                        fill="url(#lppPlanet)"
                        stroke="rgba(244,215,158,0.4)"
                        strokeWidth="0.4"
                      />
                      <defs>
                        <radialGradient id="lppPlanet" cx="35%" cy="30%" r="70%">
                          <stop offset="0%" stopColor="#8A5A3E" />
                          <stop offset="60%" stopColor="#4E2C20" />
                          <stop offset="100%" stopColor="#2A1810" />
                        </radialGradient>
                      </defs>
                      {/* a tiny baobab sprout */}
                      <g stroke="#F4D79E" strokeWidth="0.4" fill="none" opacity="0.55">
                        <path d="M -9 -2 L -9 -6" />
                        <path d="M -9 -6 L -11 -8" />
                        <path d="M -9 -6 L -7 -8" />
                      </g>
                      {/* the prince silhouette — body + round head + scarf */}
                      <g fill="#F4D79E" opacity="0.95">
                        <path d="M -1.4 -10 L -1.4 -14 L 1.4 -14 L 1.4 -10 Z" />
                        <path d="M -2.8 -11 Q 0 -9, 2.8 -11 L 2.8 -10 Q 0 -8.5, -2.8 -10 Z" opacity="0.7" />
                        <circle cx="0" cy="-16.5" r="1.8" />
                        {/* faint scarf fluttering */}
                        <path d="M 1.4 -13.5 Q 5 -13, 6.5 -15" stroke="#F4D79E" strokeWidth="0.3" fill="none" opacity="0.5" />
                      </g>
                      {/* the rose */}
                      <g transform="translate(9, -4)" opacity="0.9">
                        <path d="M 0 0 L 0 -5" stroke="#6B8E4E" strokeWidth="0.4" opacity="0.7" />
                        <circle cx="0" cy="-6" r="1.5" fill="#D47070" />
                        <circle cx="0" cy="-6" r="0.9" fill="#F4A5A5" opacity="0.8" />
                      </g>
                    </g>
                  </svg>
                  {/* Vignette */}
                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        "linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.15) 48%, rgba(0,0,0,0) 70%)",
                    }}
                  />
                  {/* Gold spine seam */}
                  <div
                    className="absolute left-0 top-4 bottom-4 w-[3px]"
                    style={{
                      background:
                        "linear-gradient(to bottom, transparent 0%, #C4A44E 18%, #E6CC7A 50%, #C4A44E 82%, transparent 100%)",
                      boxShadow: "0 0 4px rgba(196,164,78,0.45)",
                      opacity: 0.75,
                    }}
                  />
                  {/* Text plate */}
                  <div className="absolute inset-x-0 bottom-0 p-2.5">
                    <p
                      className="text-[8px] uppercase tracking-[0.26em]"
                      style={{ fontFamily: "var(--font-ui)", color: "rgba(244,215,158,0.85)" }}
                    >
                      Saint-Exupéry
                    </p>
                    <p
                      className="mt-1 text-[15px] leading-[1.05] text-white"
                      style={{
                        fontFamily: "var(--font-heading)",
                        fontStyle: "italic",
                        textShadow: "0 1px 8px rgba(0,0,0,0.6)",
                      }}
                    >
                      Le Petit Prince
                    </p>
                    <p
                      className="mt-0.5 text-[9px] tracking-wide"
                      style={{ fontFamily: "var(--font-ui)", color: "rgba(255,255,255,0.55)" }}
                    >
                      1943 · Twenty-seven rooms
                    </p>
                  </div>
                </Link>

                {/* ═══ Siddhartha — stone dawn, ensō + river ═══ */}
                <Link
                  href="/siddhartha"
                  className="dastan-book-card shrink-0 relative overflow-hidden rounded-[18px]
                             w-[42vw] max-w-[160px] aspect-[2/3] transition-transform duration-150"
                  style={{
                    scrollSnapAlign: "start",
                    boxShadow:
                      "0 12px 34px -8px rgba(30,26,21,0.3), 0 4px 10px -2px rgba(30,26,21,0.14), inset 0 0 0 0.5px rgba(30,26,21,0.1)",
                  }}
                >
                  {/* Stone-dawn cream gradient */}
                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        "linear-gradient(172deg, #D8CDB3 0%, #E4DCC9 30%, #EFE7D5 62%, #F6F1E6 100%)",
                    }}
                  />
                  {/* Rice-paper speckle */}
                  <div
                    className="absolute inset-0 opacity-[0.4] mix-blend-multiply"
                    style={{
                      backgroundImage:
                        "radial-gradient(circle at 18% 22%, rgba(30,26,21,0.1) 0.6px, transparent 1px), radial-gradient(circle at 72% 58%, rgba(30,26,21,0.08) 0.6px, transparent 1px), radial-gradient(circle at 40% 82%, rgba(30,26,21,0.07) 0.5px, transparent 1px), radial-gradient(circle at 88% 18%, rgba(30,26,21,0.06) 0.5px, transparent 1px)",
                      backgroundSize: "34px 34px, 42px 42px, 28px 28px, 50px 50px",
                    }}
                  />
                  {/* Distant mountain silhouette at bottom */}
                  <svg
                    aria-hidden
                    className="absolute inset-x-0 bottom-[32%] w-full"
                    viewBox="0 0 120 28"
                    preserveAspectRatio="none"
                    fill="none"
                  >
                    <path
                      d="M 0 22 L 22 10 L 34 16 L 48 6 L 62 18 L 78 8 L 92 14 L 108 4 L 120 12 L 120 28 L 0 28 Z"
                      fill="rgba(30,26,21,0.08)"
                    />
                    <path
                      d="M 0 26 L 16 20 L 28 24 L 44 18 L 58 26 L 74 20 L 88 24 L 104 18 L 120 22 L 120 28 L 0 28 Z"
                      fill="rgba(30,26,21,0.06)"
                    />
                  </svg>
                  {/* Large brushed ensō, top-centered */}
                  <svg
                    aria-hidden
                    className="absolute left-1/2 top-[18%] -translate-x-1/2"
                    width="104"
                    height="104"
                    viewBox="0 0 100 100"
                    fill="none"
                    stroke="#1E1A15"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path
                      d="M 78 30 A 32 32 0 1 0 72 78 L 66 83"
                      strokeWidth="3.2"
                      opacity="0.82"
                    />
                    <circle cx="66" cy="83" r="2.2" fill="#1E1A15" opacity="0.58" stroke="none" />
                  </svg>
                  {/* River waves below ensō */}
                  <svg
                    aria-hidden
                    className="absolute left-0 right-0 top-[55%] w-full"
                    viewBox="0 0 100 20"
                    preserveAspectRatio="none"
                    fill="none"
                    stroke="#1E1A15"
                    strokeLinecap="round"
                  >
                    <path d="M 6 4 Q 26 0, 50 4 T 94 4" opacity="0.38" strokeWidth="0.6" vectorEffect="non-scaling-stroke" />
                    <path d="M 6 10 Q 26 6, 50 10 T 94 10" opacity="0.28" strokeWidth="0.55" vectorEffect="non-scaling-stroke" />
                    <path d="M 6 16 Q 26 12, 50 16 T 94 16" opacity="0.18" strokeWidth="0.5" vectorEffect="non-scaling-stroke" />
                  </svg>
                  {/* Subtle warm vignette at bottom for text legibility */}
                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        "linear-gradient(to top, rgba(30,26,21,0.18) 0%, rgba(30,26,21,0.04) 32%, rgba(30,26,21,0) 55%)",
                    }}
                  />
                  {/* Sumi-ink spine seam */}
                  <div
                    className="absolute left-0 top-4 bottom-4 w-[3px]"
                    style={{
                      background:
                        "linear-gradient(to bottom, transparent 0%, rgba(30,26,21,0.6) 18%, rgba(30,26,21,0.85) 50%, rgba(30,26,21,0.6) 82%, transparent 100%)",
                      opacity: 0.7,
                    }}
                  />
                  {/* Text plate */}
                  <div className="absolute inset-x-0 bottom-0 p-2.5">
                    <p
                      className="text-[8px] uppercase tracking-[0.26em]"
                      style={{ fontFamily: "var(--font-ui)", color: "rgba(30,26,21,0.6)" }}
                    >
                      Hermann Hesse
                    </p>
                    <p
                      className="mt-1 text-[15px] leading-[1.05]"
                      style={{
                        fontFamily: "var(--font-heading)",
                        fontStyle: "italic",
                        color: "#1E1A15",
                      }}
                    >
                      Siddhartha
                    </p>
                    <p
                      className="mt-0.5 text-[9px] tracking-wide"
                      style={{ fontFamily: "var(--font-ui)", color: "rgba(30,26,21,0.5)" }}
                    >
                      1922 · Twelve stations
                    </p>
                  </div>
                </Link>

                {/* ═══ Tao Te Ching — deep jade, 道 calligraphy, mountains ═══ */}
                <Link
                  href="/tao"
                  className="dastan-book-card shrink-0 relative overflow-hidden rounded-[18px]
                             w-[42vw] max-w-[160px] aspect-[2/3] transition-transform duration-150"
                  style={{
                    scrollSnapAlign: "start",
                    boxShadow:
                      "0 12px 34px -8px rgba(14,24,16,0.55), 0 4px 10px -2px rgba(0,0,0,0.25), inset 0 0 0 0.5px rgba(127,168,130,0.22)",
                  }}
                >
                  {/* Deep forest gradient */}
                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        "linear-gradient(170deg, #0E1810 0%, #182218 32%, #1F2E24 64%, #0E1810 100%)",
                    }}
                  />
                  {/* Mountains silhouette */}
                  <svg
                    aria-hidden
                    className="absolute inset-x-0 bottom-[28%] w-full"
                    viewBox="0 0 120 28"
                    preserveAspectRatio="none"
                    fill="none"
                  >
                    <path
                      d="M 0 24 L 20 8 L 32 16 L 50 4 L 66 18 L 82 6 L 96 14 L 112 2 L 120 10 L 120 28 L 0 28 Z"
                      fill="rgba(127,168,130,0.18)"
                    />
                    <path
                      d="M 0 26 L 16 20 L 30 24 L 48 16 L 62 26 L 78 18 L 92 22 L 108 14 L 120 20 L 120 28 L 0 28 Z"
                      fill="rgba(127,168,130,0.10)"
                    />
                  </svg>
                  {/* Large 道 calligraphy */}
                  <div
                    aria-hidden
                    className="absolute left-1/2 top-[16%] -translate-x-1/2 text-[88px] leading-none opacity-85"
                    style={{
                      fontFamily: "var(--font-heading)",
                      color: "rgba(216,224,212,0.92)",
                    }}
                  >
                    道
                  </div>
                  {/* Moon — upper right */}
                  <div
                    aria-hidden
                    className="absolute right-3 top-3 w-5 h-5 rounded-full"
                    style={{
                      background: "rgba(216,224,212,0.45)",
                      boxShadow: "0 0 10px rgba(216,224,212,0.25)",
                    }}
                  />
                  {/* Vignette */}
                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        "linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.15) 45%, rgba(0,0,0,0) 70%)",
                    }}
                  />
                  {/* Jade spine seam */}
                  <div
                    className="absolute left-0 top-4 bottom-4 w-[3px]"
                    style={{
                      background:
                        "linear-gradient(to bottom, transparent 0%, rgba(127,168,130,0.75) 18%, rgba(168,206,170,0.9) 50%, rgba(127,168,130,0.75) 82%, transparent 100%)",
                      opacity: 0.8,
                    }}
                  />
                  {/* Text plate */}
                  <div className="absolute inset-x-0 bottom-0 p-2.5">
                    <p
                      className="text-[8px] uppercase tracking-[0.26em]"
                      style={{ fontFamily: "var(--font-ui)", color: "rgba(168,206,170,0.85)" }}
                    >
                      Lao Tzu
                    </p>
                    <p
                      className="mt-1 text-[15px] leading-[1.05] text-white"
                      style={{
                        fontFamily: "var(--font-heading)",
                        fontStyle: "italic",
                        textShadow: "0 1px 8px rgba(0,0,0,0.6)",
                      }}
                    >
                      Tao Te Ching
                    </p>
                    <p
                      className="mt-0.5 text-[9px] tracking-wide"
                      style={{ fontFamily: "var(--font-ui)", color: "rgba(255,255,255,0.55)" }}
                    >
                      Twelve passages
                    </p>
                  </div>
                </Link>

                {/* ═══ Proust — belle époque rose, madeleine on saucer ═══ */}
                <Link
                  href="/proust"
                  className="dastan-book-card shrink-0 relative overflow-hidden rounded-[18px]
                             w-[42vw] max-w-[160px] aspect-[2/3] transition-transform duration-150"
                  style={{
                    scrollSnapAlign: "start",
                    boxShadow:
                      "0 12px 34px -8px rgba(55,22,32,0.55), 0 4px 10px -2px rgba(0,0,0,0.25), inset 0 0 0 0.5px rgba(217,164,164,0.25)",
                  }}
                >
                  {/* Deep rose / aubergine gradient */}
                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        "linear-gradient(170deg, #371620 0%, #4A1D2A 32%, #5A2836 64%, #2E1018 100%)",
                    }}
                  />
                  {/* Ornamental frame */}
                  <svg
                    aria-hidden
                    className="absolute inset-0 w-full h-full"
                    viewBox="0 0 120 172"
                    preserveAspectRatio="xMidYMid slice"
                  >
                    <g stroke="rgba(217,164,164,0.45)" strokeWidth="0.4" fill="none">
                      <path d="M 12 10 L 108 10 L 108 162 L 12 162 Z" />
                      <path d="M 14 12 L 106 12 L 106 160 L 14 160 Z" strokeWidth="0.25" opacity="0.6" />
                    </g>
                    {/* Corner fleurons */}
                    <g fill="rgba(217,164,164,0.55)">
                      <circle cx="12" cy="10" r="1.5" />
                      <circle cx="108" cy="10" r="1.5" />
                      <circle cx="12" cy="162" r="1.5" />
                      <circle cx="108" cy="162" r="1.5" />
                    </g>
                    {/* Large ❦ motif — centered */}
                    <text
                      x="60"
                      y="78"
                      textAnchor="middle"
                      fontSize="56"
                      fill="rgba(217,164,164,0.55)"
                      fontFamily="serif"
                    >
                      ❦
                    </text>
                    {/* Teacup suggestion — a simple saucer + cup */}
                    <g
                      stroke="rgba(243,230,216,0.7)"
                      strokeWidth="0.55"
                      fill="none"
                      strokeLinecap="round"
                    >
                      <ellipse cx="60" cy="108" rx="16" ry="3" />
                      <path d="M 50 108 Q 52 118, 60 118 Q 68 118, 70 108" />
                      {/* Steam */}
                      <path d="M 56 100 Q 58 96, 56 92" opacity="0.5" strokeWidth="0.4" />
                      <path d="M 62 100 Q 60 96, 62 92" opacity="0.4" strokeWidth="0.4" />
                    </g>
                  </svg>
                  {/* Vignette */}
                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        "linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.2) 42%, rgba(0,0,0,0) 68%)",
                    }}
                  />
                  {/* Rose spine seam */}
                  <div
                    className="absolute left-0 top-4 bottom-4 w-[3px]"
                    style={{
                      background:
                        "linear-gradient(to bottom, transparent 0%, rgba(217,164,164,0.7) 18%, rgba(243,200,200,0.9) 50%, rgba(217,164,164,0.7) 82%, transparent 100%)",
                      opacity: 0.8,
                    }}
                  />
                  {/* Text plate */}
                  <div className="absolute inset-x-0 bottom-0 p-2.5">
                    <p
                      className="text-[8px] uppercase tracking-[0.26em]"
                      style={{ fontFamily: "var(--font-ui)", color: "rgba(243,230,216,0.85)" }}
                    >
                      Marcel Proust
                    </p>
                    <p
                      className="mt-1 text-[14px] leading-[1.05] text-white"
                      style={{
                        fontFamily: "var(--font-heading)",
                        fontStyle: "italic",
                        textShadow: "0 1px 8px rgba(0,0,0,0.6)",
                      }}
                    >
                      In Search of Lost Time
                    </p>
                    <p
                      className="mt-0.5 text-[9px] tracking-wide"
                      style={{ fontFamily: "var(--font-ui)", color: "rgba(255,255,255,0.55)" }}
                    >
                      1913 · Twelve stations
                    </p>
                  </div>
                </Link>

                {/* Right-edge spacer so the last card can snap flush */}
                <div className="shrink-0 w-2" aria-hidden />
              </div>

                  {/* Swipe hint — three small dots */}
                  <div className="px-6 flex items-center justify-center gap-1.5 pb-2">
                    <span className="h-1 w-5 rounded-full bg-sepia-light/45" />
                    <span className="h-1 w-1 rounded-full bg-sepia-light/25" />
                    <span className="h-1 w-1 rounded-full bg-sepia-light/25" />
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Divider between explore and sign-in */}
          <div className="max-w-sm mx-auto flex items-center gap-3 mb-5">
            <span className="flex-1 h-[1px] bg-warm-border/60" />
            <span
              className="text-[10px] text-sepia-light/55 uppercase tracking-[0.22em]"
              style={{ fontFamily: "var(--font-ui)" }}
            >
              Or sign in
            </span>
            <span className="flex-1 h-[1px] bg-warm-border/60" />
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-4 max-w-sm mx-auto"
          >
            <div>
              <label
                htmlFor="m-email"
                className="block text-[11px] text-sepia-light/70 uppercase tracking-[0.18em] mb-2"
                style={{ fontFamily: "var(--font-ui)" }}
              >
                Email
              </label>
              <input
                id="m-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                inputMode="email"
                enterKeyHint="next"
                className="w-full px-4 py-3.5 rounded-xl bg-white/80 text-sepia
                           placeholder:text-sepia-light/40
                           border border-warm-border focus:border-gold focus:bg-white
                           focus:outline-none focus:ring-2 focus:ring-gold/15
                           transition-all duration-200"
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "16px",
                  caretColor: "#8B6914",
                }}
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label
                htmlFor="m-password"
                className="block text-[11px] text-sepia-light/70 uppercase tracking-[0.18em] mb-2"
                style={{ fontFamily: "var(--font-ui)" }}
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="m-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  enterKeyHint="go"
                  className="w-full pl-4 pr-12 py-3.5 rounded-xl bg-white/80 text-sepia
                             placeholder:text-sepia-light/40
                             border border-warm-border focus:border-gold focus:bg-white
                             focus:outline-none focus:ring-2 focus:ring-gold/15
                             transition-all duration-200"
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "16px",
                    caretColor: "#8B6914",
                  }}
                  placeholder="your password"
                />
                {/* 44pt tap target for eye toggle */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-1 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center
                             text-sepia-light/50 active:text-gold transition-colors cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div
                className="flex items-start gap-2 animate-fade-in px-3 py-2.5 rounded-xl"
                style={{
                  background: "rgba(155, 77, 77, 0.08)",
                  border: "1px solid rgba(155, 77, 77, 0.2)",
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" strokeWidth="1.6" className="shrink-0 mt-0.5" stroke="#9B4D4D">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <p className="text-[13px] leading-snug" style={{ fontFamily: "var(--font-ui)", color: "#9B4D4D" }}>
                  {error}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full min-h-[52px] text-[13px] tracking-[0.14em] uppercase rounded-xl
                         active:scale-[0.98] transition-all duration-300 cursor-pointer
                         disabled:opacity-40 disabled:cursor-not-allowed mt-2"
              style={{
                fontFamily: "var(--font-ui)",
                background:
                  "linear-gradient(135deg, #8B6914 0%, #C4A44E 50%, #8B6914 100%)",
                color: "#FDFBF7",
                boxShadow:
                  "0 6px 22px rgba(139,105,20,0.35), inset 0 1px 0 rgba(255,255,255,0.18)",
                letterSpacing: "0.14em",
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2.5">
                  <span className="block w-1.5 h-1.5 rounded-full bg-parchment/80" style={{ animation: "pulse-dot 1s ease-in-out infinite" }} />
                  <span className="block w-1.5 h-1.5 rounded-full bg-parchment/80" style={{ animation: "pulse-dot 1s ease-in-out 0.2s infinite" }} />
                  <span className="block w-1.5 h-1.5 rounded-full bg-parchment/80" style={{ animation: "pulse-dot 1s ease-in-out 0.4s infinite" }} />
                </span>
              ) : (
                "Enter the Gallery"
              )}
            </button>
          </form>

          {/* Sign up — 44pt tap target */}
          <div className="mt-5 flex items-center justify-center max-w-sm mx-auto">
            <span
              className="text-[13px] text-sepia-light/70"
              style={{ fontFamily: "var(--font-ui)" }}
            >
              New here?
            </span>
            <Link
              href="/signup"
              className="ml-2 inline-flex items-center min-h-[44px] px-2 text-[13px] text-gold font-medium active:opacity-60 transition-opacity"
              style={{ fontFamily: "var(--font-ui)" }}
            >
              Create an account
            </Link>
          </div>

          {/* Open Museum Collections — mobile */}
          <div className="mt-8 -mx-6 border-t border-warm-border/60">
            <MuseumCollections />
          </div>

          {/* Instagram + Privacy — mobile */}
          <nav
            className="mt-4 mb-6 flex items-center justify-center gap-4 text-[11px]"
            style={{ fontFamily: "var(--font-ui)", letterSpacing: "0.15em" }}
          >
            <a
              href="https://www.instagram.com/dastan.journal/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Follow Dastan on Instagram"
              className="text-sepia-light/55 active:text-sepia uppercase inline-flex items-center gap-1.5 transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="3" width="18" height="18" rx="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" stroke="none" />
              </svg>
              Instagram
            </a>
            <span className="text-sepia-light/25" aria-hidden="true">·</span>
            <Link
              href="/privacy"
              className="text-sepia-light/55 active:text-sepia uppercase transition-colors"
            >
              Privacy
            </Link>
          </nav>
        </main>
      </div>
    </div>
  );
}
