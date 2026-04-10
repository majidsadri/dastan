"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/lib/auth";
import PaintingBackdrop from "@/components/ui/PaintingBackdrop";

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

  const [quote, setQuote] = useState(QUOTES[0]);
  useEffect(() => {
    setQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)]);
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
    <div className="relative min-h-screen overflow-hidden">
      {/* ── Full-bleed painting backdrop ── */}
      <PaintingBackdrop />

      {/* ── Desktop layout: explore left, card right ── */}
      <div className="hidden lg:flex absolute inset-0 items-center justify-between px-12 xl:px-20">
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

          {/* Wisdom for Today */}
          <Link
            href="/philosophers?view=wisdom"
            className="group flex items-center gap-4 px-5 py-4 rounded-2xl
                       bg-black/40 backdrop-blur-md border border-white/[0.08]
                       hover:bg-black/55 hover:border-white/[0.15]
                       transition-all duration-300"
            style={{ boxShadow: "0 4px 30px rgba(0,0,0,0.35)" }}
          >
            <div
              className="w-14 h-14 rounded-xl overflow-hidden shrink-0 flex items-center justify-center"
              style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.4)", background: "linear-gradient(135deg, #1B3A2D 0%, #2A4A3A 100%)" }}
            >
              <svg width="30" height="30" viewBox="0 0 40 40" fill="none"
                className="group-hover:scale-105 transition-transform duration-500">
                {/* Flame — timeless symbol of illumination */}
                <path d="M20 6 C20 6 13 16 13 23 C13 27.5 16 31 20 31 C24 31 27 27.5 27 23 C27 16 20 6 20 6Z"
                  fill="rgba(196,164,78,0.15)" stroke="rgba(196,164,78,0.5)" strokeWidth="0.8" />
                <path d="M20 14 C20 14 16.5 20 16.5 24 C16.5 26.5 18 28.5 20 28.5 C22 28.5 23.5 26.5 23.5 24 C23.5 20 20 14 20 14Z"
                  fill="rgba(196,164,78,0.25)" />
                {/* Base */}
                <line x1="15" y1="34" x2="25" y2="34" stroke="rgba(196,164,78,0.3)" strokeWidth="0.8" strokeLinecap="round" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[17px] text-white font-medium group-hover:text-gold transition-colors duration-300"
                style={{ fontFamily: "var(--font-heading)" }}>Wisdom for Today</p>
              <p className="text-[11px] text-white/35 mt-0.5 tracking-wide"
                style={{ fontFamily: "var(--font-ui)" }}>Ancient wisdom, modern life</p>
            </div>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="1.5" strokeLinecap="round"
                 className="text-white/20 group-hover:text-white/50 group-hover:translate-x-0.5 transition-all duration-300">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Link>
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
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* ── Mobile: painting is the experience, form floats within it ── */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <div className="lg:hidden absolute inset-0">

        {/* Gradient fog — rises from bottom, painting dissolves into warmth */}
        <div className="absolute inset-0 z-[1]" style={{
          background: `linear-gradient(
            to top,
            rgba(35, 28, 18, 0.92) 0%,
            rgba(35, 28, 18, 0.78) 18%,
            rgba(35, 28, 18, 0.45) 38%,
            rgba(20, 15, 10, 0.15) 55%,
            transparent 70%
          )`
        }} />

        {/* Explore links — left side, stacked, museum wayfinding style */}
        <div
          className="absolute top-0 left-0 z-20 flex flex-col gap-2 pl-4 pr-6"
          style={{ paddingTop: "max(14px, env(safe-area-inset-top))" }}
        >
          <Link href="/gallery"
            className="group flex items-center gap-3 pl-1.5 pr-4 py-1.5 rounded-2xl
                       bg-black/35 backdrop-blur-xl border border-white/[0.06]
                       active:scale-[0.97] transition-all duration-200"
            style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.35), inset 0 0 0 0.5px rgba(196,164,78,0.1)" }}>
            <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0"
              style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.3), inset 0 0 0 1px rgba(255,255,255,0.06)" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/paintings/monalisa.jpg" alt="" className="w-full h-full object-cover object-top" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] text-white/90 font-medium leading-tight"
                style={{ fontFamily: "var(--font-heading)" }}>Gallery</p>
              <p className="text-[9px] text-white/30 mt-0.5 tracking-wide"
                style={{ fontFamily: "var(--font-ui)" }}>1,300+ masterworks</p>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="1.8" strokeLinecap="round" className="text-white/20 shrink-0">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Link>

          <Link href="/artists"
            className="group flex items-center gap-3 pl-1.5 pr-4 py-1.5 rounded-2xl
                       bg-black/35 backdrop-blur-xl border border-white/[0.06]
                       active:scale-[0.97] transition-all duration-200"
            style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.35), inset 0 0 0 0.5px rgba(196,164,78,0.1)" }}>
            <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0"
              style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.3), inset 0 0 0 1px rgba(255,255,255,0.06)" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/paintings/vangogh.jpg" alt="" className="w-full h-full object-cover object-center" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] text-white/90 font-medium leading-tight"
                style={{ fontFamily: "var(--font-heading)" }}>Artists</p>
              <p className="text-[9px] text-white/30 mt-0.5 tracking-wide"
                style={{ fontFamily: "var(--font-ui)" }}>Lives & legacies</p>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="1.8" strokeLinecap="round" className="text-white/20 shrink-0">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Link>

          <Link href="/philosophers"
            className="group flex items-center gap-3 pl-1.5 pr-4 py-1.5 rounded-2xl
                       bg-black/35 backdrop-blur-xl border border-white/[0.06]
                       active:scale-[0.97] transition-all duration-200"
            style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.35), inset 0 0 0 0.5px rgba(196,164,78,0.1)" }}>
            <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 flex items-center justify-center"
              style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.3), inset 0 0 0 1px rgba(255,255,255,0.06)", background: "linear-gradient(135deg, #2C2418 0%, #4A3828 100%)" }}>
              <svg width="24" height="24" viewBox="0 0 48 48" fill="none">
                <circle cx="24" cy="24" r="14" stroke="rgba(196,164,78,0.3)" strokeWidth="0.8" />
                <text x="24" y="29" textAnchor="middle" fill="rgba(196,164,78,0.6)" fontSize="16" fontFamily="Georgia, serif">φ</text>
                <circle cx="24" cy="12" r="1.2" fill="rgba(139,105,20,0.35)" />
                <circle cx="24" cy="36" r="1.2" fill="rgba(44,74,110,0.35)" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] text-white/90 font-medium leading-tight"
                style={{ fontFamily: "var(--font-heading)" }}>Thinkers</p>
              <p className="text-[9px] text-white/30 mt-0.5 tracking-wide"
                style={{ fontFamily: "var(--font-ui)" }}>Minds & millennia</p>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="1.8" strokeLinecap="round" className="text-white/20 shrink-0">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Link>

          <Link href="/philosophers?view=wisdom"
            className="group flex items-center gap-3 pl-1.5 pr-4 py-1.5 rounded-2xl
                       bg-black/35 backdrop-blur-xl border border-white/[0.06]
                       active:scale-[0.97] transition-all duration-200"
            style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.35), inset 0 0 0 0.5px rgba(196,164,78,0.1)" }}>
            <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 flex items-center justify-center"
              style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.3), inset 0 0 0 1px rgba(255,255,255,0.06)", background: "linear-gradient(135deg, #1B3A2D 0%, #2A4A3A 100%)" }}>
              <svg width="22" height="22" viewBox="0 0 40 40" fill="none">
                <path d="M20 8 C20 8 14 16 14 22 C14 26 16.5 29 20 29 C23.5 29 26 26 26 22 C26 16 20 8 20 8Z"
                  fill="rgba(196,164,78,0.15)" stroke="rgba(196,164,78,0.45)" strokeWidth="0.7" />
                <path d="M20 15 C20 15 17 19.5 17 22.5 C17 24.5 18.3 26 20 26 C21.7 26 23 24.5 23 22.5 C23 19.5 20 15 20 15Z"
                  fill="rgba(196,164,78,0.25)" />
                <line x1="16" y1="33" x2="24" y2="33" stroke="rgba(196,164,78,0.25)" strokeWidth="0.7" strokeLinecap="round" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] text-white/90 font-medium leading-tight"
                style={{ fontFamily: "var(--font-heading)" }}>Wisdom</p>
              <p className="text-[9px] text-white/30 mt-0.5 tracking-wide"
                style={{ fontFamily: "var(--font-ui)" }}>Ancient wisdom, modern life</p>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="1.8" strokeLinecap="round" className="text-white/20 shrink-0">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Link>
        </div>

        {/* ── Content: floats at bottom over the gradient ── */}
        <div
          className="absolute bottom-0 left-0 right-0 z-10 px-8 animate-fade-in"
          style={{ paddingBottom: "max(28px, env(safe-area-inset-bottom))" }}
        >
          {/* Logo + branding */}
          <div className="flex flex-col items-center mb-5">
            <Image src="/logo.svg" alt="Dastan" width={44} height={44}
              className="rounded-xl mb-2"
              style={{ filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.3))" }} />
            <h1 className="text-[22px] text-white/90 tracking-wide"
              style={{ fontFamily: "var(--font-heading)", textShadow: "0 1px 12px rgba(0,0,0,0.4)" }}>
              Dastan
            </h1>
            <p className="text-[8px] text-white/25 uppercase tracking-[0.3em] mt-0.5"
              style={{ fontFamily: "var(--font-ui)" }}>Every day, a new tale</p>
          </div>

          {/* Quote — elegant, 2-line max */}
          <p className="text-white/30 text-[11px] leading-[1.7] italic text-center mb-5 mx-2 line-clamp-2"
            style={{ fontFamily: "var(--font-body)" }}>
            &ldquo;{quote.text}&rdquo;
            <span className="text-[9px] not-italic tracking-[0.12em] text-white/20 ml-1"
              style={{ fontFamily: "var(--font-ui)" }}>— {quote.author}</span>
          </p>

          {/* Gold divider */}
          <div className="h-[1px] mx-6 mb-5" style={{
            background: "linear-gradient(to right, transparent, rgba(196,164,78,0.3) 30%, rgba(212,184,90,0.4) 50%, rgba(196,164,78,0.3) 70%, transparent)"
          }} />

          {/* Form — frosted glass inputs on dark background */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-[9px] text-white/35 uppercase tracking-[0.2em] mb-1.5"
                style={{ fontFamily: "var(--font-ui)" }}>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email"
                className="w-full px-4 py-3 rounded-xl
                           text-white placeholder:text-white/30
                           border border-white/[0.12]
                           focus:border-gold/50 focus:outline-none transition-all duration-300"
                style={{
                  fontFamily: "var(--font-body)", fontSize: "16px", caretColor: "#C4A44E",
                  background: "rgba(255,255,255,0.08)",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                }}
                placeholder="your@email.com" />
            </div>

            <div>
              <label className="block text-[9px] text-white/35 uppercase tracking-[0.2em] mb-1.5"
                style={{ fontFamily: "var(--font-ui)" }}>Password</label>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password"
                  className="w-full px-4 py-3 pr-12 rounded-xl
                             text-white placeholder:text-white/30
                             border border-white/[0.12]
                             focus:border-gold/50 focus:outline-none transition-all duration-300"
                  style={{
                    fontFamily: "var(--font-body)", fontSize: "16px", caretColor: "#C4A44E",
                    background: "rgba(255,255,255,0.08)",
                    backdropFilter: "blur(12px)",
                    WebkitBackdropFilter: "blur(12px)",
                  }}
                  placeholder="your password" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-white/25 active:text-white/50 transition-colors cursor-pointer" tabIndex={-1}>
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
              <div className="flex items-center gap-2 animate-fade-in px-3 py-2.5 rounded-xl"
                style={{ background: "rgba(155, 77, 77, 0.15)", border: "1px solid rgba(155, 77, 77, 0.2)" }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" className="shrink-0"
                  stroke="rgba(210, 140, 140, 0.8)">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <p className="text-[11.5px]" style={{ fontFamily: "var(--font-ui)", color: "rgba(210, 140, 140, 0.9)" }}>{error}</p>
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full py-3.5 text-[12px] tracking-[0.15em] uppercase rounded-2xl
                         active:scale-[0.97] transition-all duration-300 cursor-pointer
                         disabled:opacity-40 disabled:cursor-not-allowed mt-2"
              style={{
                fontFamily: "var(--font-ui)",
                background: "linear-gradient(135deg, #8B6914 0%, #C4A44E 50%, #8B6914 100%)",
                color: "#FDFBF7",
                boxShadow: "0 4px 20px rgba(139,105,20,0.35), inset 0 1px 0 rgba(255,255,255,0.15)",
                letterSpacing: "0.15em",
              }}>
              {loading ? (
                <span className="flex items-center justify-center gap-2.5">
                  <span className="block w-1.5 h-1.5 rounded-full bg-parchment/80" style={{ animation: "pulse-dot 1s ease-in-out infinite" }} />
                  <span className="block w-1.5 h-1.5 rounded-full bg-parchment/80" style={{ animation: "pulse-dot 1s ease-in-out 0.2s infinite" }} />
                  <span className="block w-1.5 h-1.5 rounded-full bg-parchment/80" style={{ animation: "pulse-dot 1s ease-in-out 0.4s infinite" }} />
                </span>
              ) : "Enter the Gallery"}
            </button>
          </form>

          {/* Sign up link */}
          <div className="mt-5 flex items-center justify-center gap-1.5">
            <span className="text-[11px] text-white/20" style={{ fontFamily: "var(--font-ui)" }}>New here?</span>
            <Link href="/signup" className="text-[11px] text-gold/70 font-medium active:text-gold transition-colors"
              style={{ fontFamily: "var(--font-ui)" }}>Create an account</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
