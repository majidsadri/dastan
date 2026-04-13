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
    <div className="relative min-h-[100dvh] overflow-x-hidden">
      {/* ── Desktop-only full-bleed backdrop ── */}
      <div className="hidden lg:block absolute inset-0 overflow-hidden">
        <PaintingBackdrop />
      </div>

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
                { href: "/faal", label: "Faal-e Hafez", sub: "Ask the Divan", icon: "❋" },
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
