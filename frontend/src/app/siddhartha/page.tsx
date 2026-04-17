import fs from "fs";
import path from "path";
import Link from "next/link";
import { Motif, MotifType } from "./_components/motif";

type Scene = {
  id: string;
  number: number;
  title: string;
  chapter: string;
  motif: MotifType;
  motif_caption: string;
  german_quote: string;
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
  "", "I", "II", "III", "IV", "V", "VI",
  "VII", "VIII", "IX", "X", "XI", "XII",
];

function loadCatalog(): Catalog | null {
  try {
    const raw = fs.readFileSync(
      path.join(process.cwd(), "public", "siddhartha", "catalog.json"),
      "utf-8"
    );
    return JSON.parse(raw) as Catalog;
  } catch {
    return null;
  }
}

/* ── Thin ink hairline divider ── */
function InkRule({ className = "" }: { className?: string }) {
  return <div aria-hidden className={`sd-rule ${className}`} />;
}

export default function SiddharthaPage() {
  const catalog = loadCatalog();
  if (!catalog) {
    return (
      <main className="mx-auto w-full max-w-2xl px-6 py-16 text-sepia">
        <p>The reading room is currently unavailable.</p>
      </main>
    );
  }

  const bookJsonLd = {
    "@context": "https://schema.org",
    "@type": "Book",
    name: catalog.title,
    author: { "@type": "Person", name: catalog.author },
    datePublished: catalog.published,
    inLanguage: "de",
    url: "https://www.mydastan.com/siddhartha",
    description: catalog.introduction.slice(0, 280),
  };

  return (
    <main className="relative min-h-screen sd-ink">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(bookJsonLd) }}
      />

      {/* ─── HERO ─── Stone dawn, brushed ensō, title ─── */}
      <section className="relative overflow-hidden sd-dawn">
        <div className="relative mx-auto flex min-h-[78vh] w-full max-w-5xl flex-col items-center justify-center px-5 py-24 text-center">
          <Link
            href="/signin"
            className="absolute left-5 top-5 text-[11px] uppercase tracking-[0.3em] text-sd-ink/55 hover:text-sd-ink transition"
            style={{ fontFamily: "var(--font-ui)", color: "rgba(30,26,21,0.55)" }}
          >
            ← Dastan
          </Link>

          <div className="relative">
            <p
              className="sd-brush mb-5 text-[10px] uppercase tracking-[0.6em] text-sd-ink/60 sm:text-[11px]"
              style={{ fontFamily: "var(--font-ui)", color: "rgba(30,26,21,0.55)", animationDelay: "0.1s" }}
            >
              Twelve Stations
            </p>

            <h1
              className="sd-brush font-[family-name:var(--font-heading)] text-7xl italic leading-[0.95] text-sd-ink sm:text-9xl"
              style={{ color: "#1E1A15", animationDelay: "0.3s" }}
            >
              Siddhartha
            </h1>

            <p
              className="sd-brush mt-6 font-[family-name:var(--font-heading)] italic text-sd-ink/70 sm:text-lg"
              style={{ color: "rgba(30,26,21,0.7)", animationDelay: "0.55s" }}
            >
              {catalog.author}
              <span className="mx-3 text-sd-ink/40">·</span>
              {catalog.published}
            </p>

            <p
              className="sd-brush mx-auto mt-8 max-w-md text-sm italic leading-relaxed text-sd-ink/55 sm:text-base"
              style={{ fontFamily: "var(--font-heading)", color: "rgba(30,26,21,0.55)", animationDelay: "0.7s" }}
            >
              {catalog.subtitle}
            </p>

            <a
              href="#introduction"
              className="sd-brush mt-12 inline-flex flex-col items-center gap-2 text-[11px] uppercase tracking-[0.3em] text-sd-ink/55 hover:text-sd-ink transition"
              style={{ fontFamily: "var(--font-ui)", color: "rgba(30,26,21,0.55)", animationDelay: "0.9s" }}
            >
              Enter the reading room
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </a>
          </div>
        </div>
      </section>

      {/* ─── INTRODUCTION ─── Spare centered prose ─── */}
      <section id="introduction" className="relative sd-paper">
        <div className="mx-auto max-w-2xl px-6 py-24 sm:py-32">
          <div className="flex justify-center">
            <Motif type="river" size={72} className="sd-ink-muted sd-stream" />
          </div>
          <InkRule className="mt-8 mb-12 mx-auto max-w-xs" />

          <div className="prose-reading space-y-5 text-center">
            {catalog.introduction.split(/\n\n+/).map((p, i) => (
              <p
                key={i}
                className={i === 0
                  ? "sd-dropcap text-left text-[1.05rem] leading-[1.9] sm:text-[1.15rem]"
                  : "text-[1.05rem] italic leading-[1.9] sm:text-[1.15rem]"}
                style={{ color: "rgba(30,26,21,0.85)" }}
              >
                {p}
              </p>
            ))}
          </div>

          <InkRule className="mt-14 mx-auto max-w-xs" />
          <p
            className="mt-10 text-center font-[family-name:var(--font-heading)] text-sm italic text-sd-ink/55"
            style={{ color: "rgba(30,26,21,0.55)" }}
          >
            {catalog.dedication}
          </p>
        </div>
      </section>

      {/* ─── STATIONS ─── A vertical meditation: one chapter per step ─── */}
      <section className="relative sd-paper">
        <div className="mx-auto max-w-2xl px-6 pb-24 pt-4 sm:pb-32">
          <header className="mb-20 text-center">
            <p
              className="mb-3 text-[11px] uppercase tracking-[0.4em] text-sd-ink/55"
              style={{ fontFamily: "var(--font-ui)", color: "rgba(30,26,21,0.55)" }}
            >
              The Twelve Stations
            </p>
            <h2 className="font-[family-name:var(--font-heading)] text-4xl italic sm:text-5xl"
                style={{ color: "#1E1A15" }}>
              The Path to the River
            </h2>
            <div className="mt-6 flex justify-center">
              <Motif type="path" size={100} className="sd-ink-muted" />
            </div>
          </header>

          <ol className="relative">
            {/* Central river — a soft braid of wave-lines flowing through the stations */}
            <svg
              aria-hidden
              className="pointer-events-none absolute left-1/2 top-0 h-full w-20 -translate-x-1/2"
              viewBox="0 0 40 2000"
              preserveAspectRatio="none"
              fill="none"
            >
              {/* Primary current */}
              <path
                d="M 20 0
                   Q 26 25, 20 50 T 20 100 T 20 150 T 20 200 T 20 250 T 20 300
                   T 20 350 T 20 400 T 20 450 T 20 500 T 20 550 T 20 600
                   T 20 650 T 20 700 T 20 750 T 20 800 T 20 850 T 20 900
                   T 20 950 T 20 1000 T 20 1050 T 20 1100 T 20 1150 T 20 1200
                   T 20 1250 T 20 1300 T 20 1350 T 20 1400 T 20 1450 T 20 1500
                   T 20 1550 T 20 1600 T 20 1650 T 20 1700 T 20 1750 T 20 1800
                   T 20 1850 T 20 1900 T 20 1950 T 20 2000"
                stroke="rgba(30,26,21,0.1)"
                strokeWidth="0.7"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
              {/* Secondary current — opposite phase, fainter */}
              <path
                d="M 20 0
                   Q 14 25, 20 50 T 20 100 T 20 150 T 20 200 T 20 250 T 20 300
                   T 20 350 T 20 400 T 20 450 T 20 500 T 20 550 T 20 600
                   T 20 650 T 20 700 T 20 750 T 20 800 T 20 850 T 20 900
                   T 20 950 T 20 1000 T 20 1050 T 20 1100 T 20 1150 T 20 1200
                   T 20 1250 T 20 1300 T 20 1350 T 20 1400 T 20 1450 T 20 1500
                   T 20 1550 T 20 1600 T 20 1650 T 20 1700 T 20 1750 T 20 1800
                   T 20 1850 T 20 1900 T 20 1950 T 20 2000"
                stroke="rgba(30,26,21,0.06)"
                strokeWidth="0.5"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
            {catalog.scenes.map((scene, i) => (
              <li key={scene.id} className="sd-station relative pb-20 last:pb-0">
                <Link
                  href={`/siddhartha/${scene.id}`}
                  className="group block text-center"
                >
                  {/* Roman numeral — small, floating above */}
                  <p
                    className="font-[family-name:var(--font-heading)] text-sm italic text-sd-ink/45 sd-station-ink transition-colors"
                    style={{ color: "rgba(30,26,21,0.45)" }}
                  >
                    {ROMAN[scene.number]}
                  </p>

                  {/* Motif — centered, breathes on a parchment disc */}
                  <div className="relative mx-auto mt-4 mb-6 flex h-32 w-32 items-center justify-center">
                    {/* Soft circular wash behind the motif */}
                    <span
                      aria-hidden
                      className="absolute inset-0 rounded-full"
                      style={{
                        background: "radial-gradient(circle, rgba(246,241,230,1) 0%, rgba(246,241,230,0) 70%)",
                      }}
                    />
                    <Motif
                      type={scene.motif}
                      size={110}
                      className="relative sd-motif transition-transform duration-700 group-hover:scale-110"
                      inkColor="rgba(30,26,21,0.82)"
                    />
                  </div>

                  {/* Title */}
                  <h3
                    className="font-[family-name:var(--font-heading)] text-2xl italic leading-tight text-sd-ink sd-station-ink transition-colors sm:text-3xl"
                    style={{ color: "#1E1A15" }}
                  >
                    {scene.title}
                  </h3>

                  {/* Chapter label */}
                  <p
                    className="mt-2 text-[10px] uppercase tracking-[0.35em] text-sd-ink/45"
                    style={{ fontFamily: "var(--font-ui)", color: "rgba(30,26,21,0.45)" }}
                  >
                    {scene.chapter}
                  </p>

                  {/* German pull — short fragment */}
                  <p
                    className="sd-german mx-auto mt-5 max-w-md text-[15px] leading-relaxed opacity-70 sm:text-base"
                    style={{ color: "rgba(30,26,21,0.7)" }}
                  >
                    «&nbsp;{scene.german_quote.length > 110
                      ? scene.german_quote.slice(0, 110).trim() + "…"
                      : scene.german_quote}&nbsp;»
                  </p>

                  {/* A single mark at the foot of each station — bead on the thread */}
                  {i < catalog.scenes.length - 1 && (
                    <div
                      aria-hidden
                      className="mx-auto mt-12 h-1.5 w-1.5 rounded-full"
                      style={{ background: "rgba(30,26,21,0.35)" }}
                    />
                  )}
                </Link>
              </li>
            ))}
          </ol>

          {/* Colophon */}
          <footer className="mx-auto mt-28 max-w-xl text-center">
            <InkRule className="mx-auto mb-10 max-w-xs" />
            <p
              className="text-[12px] leading-relaxed text-sd-ink/60"
              style={{ fontFamily: "var(--font-body)", color: "rgba(30,26,21,0.6)" }}
            >
              Siddhartha was written by Hermann Hesse between 1919 and 1922, and published by
              S. Fischer Verlag in Berlin. The German sentences shown here are drawn from or
              composed in the spirit of the book. The essays are original to Dastan.
            </p>
          </footer>
        </div>
      </section>
    </main>
  );
}
