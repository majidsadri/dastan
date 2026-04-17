import fs from "fs";
import path from "path";
import Link from "next/link";

type Scene = {
  id: string;
  number: number;
  title: string;
  chapter: string;
  image: string;
  image_caption: string;
  french_quote: string;
  english_quote: string;
  essay: string;
  pull_quote: string;
};

type Catalog = {
  title: string;
  subtitle: string;
  author: string;
  published: string;
  dedication: string;
  introduction: string;
  scenes: Scene[];
};

const ROMAN = [
  "", "I", "II", "III", "IV", "V", "VI", "VII",
  "VIII", "IX", "X", "XI", "XII", "XIII", "XIV",
];

function loadCatalog(): Catalog | null {
  try {
    const raw = fs.readFileSync(
      path.join(process.cwd(), "public", "little-prince", "catalog.json"),
      "utf-8"
    );
    return JSON.parse(raw) as Catalog;
  } catch {
    return null;
  }
}

/* ── Decorative: twinkling star field ── */
function StarField({ count = 60 }: { count?: number }) {
  const stars = Array.from({ length: count }).map((_, i) => {
    // Deterministic pseudo-random so SSR matches CSR
    const seed = (i * 9301 + 49297) % 233280;
    const rx = (seed % 1000) / 10; // 0..100
    const ry = (((seed * 7) % 1000) / 10);
    const d = 2.6 + ((seed % 40) / 10); // 2.6..6.6s
    const dly = (seed % 30) / 10; // 0..3s
    const cls =
      seed % 11 === 0 ? "big white" :
      seed % 5  === 0 ? "big" :
      seed % 3  === 0 ? "tiny" : "";
    return (
      <span
        key={i}
        className={cls}
        style={{
          left: `${rx}%`,
          top:  `${ry}%`,
          "--d": `${d}s`,
          "--dly": `${dly}s`,
        } as React.CSSProperties}
      />
    );
  });
  return (
    <div aria-hidden className="lp-stars pointer-events-none absolute inset-0 overflow-hidden">
      {stars}
    </div>
  );
}

/* ── Decorative: hand-drawn fleuron divider ── */
function Fleuron({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 160 20"
      className={`lp-ink-wave ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinecap="round"
    >
      <path d="M4 10 Q 30 4, 56 10 T 108 10 Q 134 16, 156 10" opacity="0.7" />
      <circle cx="80" cy="10" r="2.2" fill="currentColor" opacity="0.7" />
      <circle cx="30" cy="10" r="1"   fill="currentColor" opacity="0.5" />
      <circle cx="130" cy="10" r="1"  fill="currentColor" opacity="0.5" />
    </svg>
  );
}

export default function LittlePrincePage() {
  const catalog = loadCatalog();
  if (!catalog) {
    return (
      <main className="mx-auto w-full max-w-2xl px-6 py-16 text-sepia">
        <p>The exhibit catalog is currently unavailable.</p>
      </main>
    );
  }

  const bookJsonLd = {
    "@context": "https://schema.org",
    "@type": "Book",
    name: catalog.title,
    alternateName: "The Little Prince",
    author: { "@type": "Person", name: catalog.author },
    datePublished: catalog.published,
    inLanguage: "fr",
    url: "https://www.mydastan.com/little-prince",
    description: catalog.introduction.slice(0, 280),
  };

  return (
    <main className="relative min-h-screen text-sepia">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(bookJsonLd) }}
      />

      {/* ─── HERO ─── Deep dusk sky, crescent moon, drifting stars ─── */}
      <section className="relative overflow-hidden">
        <div aria-hidden className="absolute inset-0 lp-dawn" />
        <StarField count={80} />

        {/* Crescent moon, top-right */}
        <svg
          aria-hidden
          viewBox="0 0 100 100"
          className="lp-ink-bloom absolute right-[8%] top-[12%] h-20 w-20 sm:right-[12%] sm:top-[14%] sm:h-28 sm:w-28"
          style={{ animationDelay: "0.4s" }}
        >
          <defs>
            <radialGradient id="moonGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#F4D06F" stopOpacity="0.35" />
              <stop offset="60%" stopColor="#F4D06F" stopOpacity="0.05" />
              <stop offset="100%" stopColor="#F4D06F" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="50" cy="50" r="48" fill="url(#moonGlow)" />
          <path
            d="M 60 18 A 32 32 0 1 0 60 82 A 24 24 0 1 1 60 18 Z"
            fill="#F4D06F"
            opacity="0.85"
          />
        </svg>

        <div className="relative mx-auto flex min-h-[80vh] w-full max-w-5xl flex-col items-center justify-center px-5 py-24 text-center">
          <Link
            href="/signin"
            className="absolute left-5 top-5 text-[11px] uppercase tracking-[0.3em] text-white/60 hover:text-white transition"
            style={{ fontFamily: "var(--font-ui)" }}
          >
            ← Dastan
          </Link>

          <p
            className="lp-ink-bloom mb-6 text-[10px] uppercase tracking-[0.6em] text-[#F4D06F]/80 sm:text-[11px]"
            style={{ fontFamily: "var(--font-ui)", animationDelay: "0.1s" }}
          >
            ✦ An Illuminated Exhibit ✦
          </p>

          <h1
            className="lp-ink-bloom font-[family-name:var(--font-heading)] text-6xl italic leading-[0.95] text-white sm:text-8xl"
            style={{ textShadow: "0 2px 40px rgba(244, 208, 111, 0.25)", animationDelay: "0.25s" }}
          >
            Le Petit
            <span className="mt-1 block text-[#F4D06F]">Prince</span>
          </h1>

          <p
            className="lp-ink-bloom mt-8 font-[family-name:var(--font-heading)] text-lg italic text-white/70 sm:text-xl"
            style={{ animationDelay: "0.5s" }}
          >
            by {catalog.author}
            <span className="mx-3 text-[#F4D06F]/60">·</span>
            {catalog.published}
          </p>

          <p
            className="lp-ink-bloom mx-auto mt-6 max-w-md text-sm italic leading-relaxed text-white/55 sm:text-base"
            style={{ fontFamily: "var(--font-heading)", animationDelay: "0.6s" }}
          >
            Thirteen small rooms — one picture, one sentence in French, one story for company.
          </p>

          <div
            className="lp-ink-bloom mt-10 text-[#F4D06F]/50"
            style={{ animationDelay: "0.75s" }}
          >
            <Fleuron />
          </div>

          <a
            href="#introduction"
            className="lp-ink-bloom mt-12 inline-flex flex-col items-center gap-2 text-[11px] uppercase tracking-[0.3em] text-white/60 hover:text-[#F4D06F] transition"
            style={{ fontFamily: "var(--font-ui)", animationDelay: "0.9s" }}
          >
            Enter the exhibit
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                 className="animate-[lp-twinkle_2.4s_ease-in-out_infinite]">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </a>
        </div>
      </section>

      {/* ─── INTRODUCTION ─── Paper, first-person aviator voice ─── */}
      <section id="introduction" className="relative lp-paper">
        <div className="mx-auto max-w-2xl px-6 py-24 sm:py-32">
          <div className="mb-10 flex justify-center text-sepia/50">
            <Fleuron />
          </div>

          <div className="prose-reading space-y-5 text-center">
            {catalog.introduction.split(/\n\n+/).map((p, i) => (
              <p
                key={i}
                className={i === 0
                  ? "lp-dropcap text-left text-[1.05rem] sm:text-[1.15rem]"
                  : "text-[1.05rem] italic sm:text-[1.15rem]"}
              >
                {p}
              </p>
            ))}
          </div>

          <div className="mt-14 flex justify-center text-sepia/40">
            <Fleuron />
          </div>

          <p
            className="mt-10 text-center font-[family-name:var(--font-heading)] text-base italic text-sepia-light"
          >
            {catalog.dedication}
          </p>
        </div>
      </section>

      {/* ─── SCENES ─── Pinboard of thirteen watercolors ─── */}
      <section className="relative lp-paper">
        <div className="mx-auto max-w-6xl px-5 pb-24 pt-8 sm:pb-32">
          <header className="mb-16 text-center">
            <p
              className="mb-3 text-[11px] uppercase tracking-[0.4em] text-sepia-light/70"
              style={{ fontFamily: "var(--font-ui)" }}
            >
              Thirteen Scenes
            </p>
            <h2 className="font-[family-name:var(--font-heading)] text-4xl italic text-sepia sm:text-5xl">
              The Prince's Planets
            </h2>
            <div className="mt-6 flex justify-center text-gold/50">
              <Fleuron />
            </div>
          </header>

          <ol className="grid grid-cols-1 gap-x-10 gap-y-20 sm:grid-cols-2 sm:gap-y-24 lg:grid-cols-3">
            {catalog.scenes.map((scene, i) => {
              // First scene gets a full-width hero treatment — the boa opens the book
              const isFeature = i === 0;
              return (
                <li
                  key={scene.id}
                  className={isFeature ? "sm:col-span-2 lg:col-span-3" : ""}
                >
                  <Link
                    href={`/little-prince/${scene.id}`}
                    className="group block"
                  >
                    {/* Chapter label + Roman numeral — floating above, like a page heading */}
                    <div className="mb-4 flex items-baseline justify-center gap-4">
                      <span
                        className="text-[10px] uppercase tracking-[0.35em] text-sepia-light/60"
                        style={{ fontFamily: "var(--font-ui)" }}
                      >
                        {scene.chapter}
                      </span>
                      <span className="font-[family-name:var(--font-heading)] text-xl italic text-gold/70">
                        {ROMAN[scene.number]}
                      </span>
                    </div>

                    {/* Illustration floats directly on parchment — no frame */}
                    <div
                      className={`relative flex items-center justify-center ${
                        isFeature ? "min-h-[380px] sm:min-h-[460px]" : "min-h-[260px] sm:min-h-[300px]"
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={scene.image}
                        alt={scene.image_caption}
                        loading="lazy"
                        className="lp-illustration h-auto w-auto object-contain transition-transform duration-700 group-hover:scale-[1.03]"
                        style={{
                          maxHeight: isFeature ? "min(60vh, 520px)" : "300px",
                          maxWidth: "100%",
                        }}
                      />
                    </div>

                    {/* Title + French pull */}
                    <div className="mx-auto mt-6 max-w-md text-center">
                      <h3
                        className={`font-[family-name:var(--font-heading)] italic leading-tight text-sepia group-hover:text-gold transition-colors ${
                          isFeature ? "text-3xl sm:text-4xl" : "text-xl sm:text-2xl"
                        }`}
                      >
                        {scene.title}
                      </h3>
                      <div
                        aria-hidden
                        className="mx-auto mt-3 h-px w-10 bg-sepia/15 group-hover:bg-gold/40 transition-colors"
                      />
                      <p
                        className={`lp-french mt-3 leading-snug opacity-70 ${
                          isFeature ? "text-base sm:text-lg" : "text-[13px] sm:text-sm"
                        }`}
                      >
                        « {scene.french_quote.length > (isFeature ? 140 : 70)
                          ? scene.french_quote.slice(0, isFeature ? 140 : 70).trim() + "…"
                          : scene.french_quote} »
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ol>

          {/* Colophon */}
          <footer className="mx-auto mt-24 max-w-xl text-center">
            <div className="mb-8 flex justify-center text-sepia/40">
              <Fleuron />
            </div>
            <p
              className="text-[12px] leading-relaxed text-sepia-light/80"
              style={{ fontFamily: "var(--font-body)" }}
            >
              All illustrations are watercolors by Antoine de Saint-Exupéry (1900–1944).
              French quotations are from the 1943 edition, public domain in France and most
              of the world. The essays are original to Dastan.
            </p>
          </footer>
        </div>
      </section>
    </main>
  );
}
