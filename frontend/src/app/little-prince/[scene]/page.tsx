import type { Metadata } from "next";
import fs from "fs";
import path from "path";
import Link from "next/link";
import { notFound } from "next/navigation";
import ConstellationStrip from "../_components/ConstellationStrip";

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
  author: string;
  published: string;
  scenes: Scene[];
};

const ROMAN = [
  "", "I", "II", "III", "IV", "V", "VI", "VII",
  "VIII", "IX", "X", "XI", "XII", "XIII", "XIV",
];

// Scenes that get the night-sky treatment
const NIGHT_SCENES = new Set([
  "serpent",
  "farewell-stars",
  "dedication",
  "asteroid-b612",
]);

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

function findScene(id: string): {
  scene: Scene;
  prev: Scene | null;
  next: Scene | null;
  index: number;
  total: number;
  all: Scene[];
} | null {
  const catalog = loadCatalog();
  if (!catalog) return null;
  const idx = catalog.scenes.findIndex((s) => s.id === id);
  if (idx < 0) return null;
  return {
    scene: catalog.scenes[idx],
    prev: idx > 0 ? catalog.scenes[idx - 1] : null,
    next: idx < catalog.scenes.length - 1 ? catalog.scenes[idx + 1] : null,
    index: idx,
    total: catalog.scenes.length,
    all: catalog.scenes,
  };
}

export async function generateStaticParams() {
  const catalog = loadCatalog();
  return (catalog?.scenes ?? []).map((s) => ({ scene: s.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ scene: string }>;
}): Promise<Metadata> {
  const { scene: sceneId } = await params;
  const entry = findScene(sceneId);
  if (!entry) return { title: "Scene not found" };
  const { scene } = entry;

  const description = `${scene.english_quote} — ${scene.essay
    .split(/\n\n+/)[0]
    .slice(0, 160)}`;

  return {
    title: `${scene.title} — The Little Prince, ${scene.chapter}`,
    description,
    alternates: { canonical: `/little-prince/${scene.id}` },
    openGraph: {
      type: "article",
      url: `https://www.mydastan.com/little-prince/${scene.id}`,
      title: `${scene.title} | Le Petit Prince | Dastan`,
      description,
      images: [{ url: scene.image, alt: scene.image_caption }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${scene.title} | Le Petit Prince | Dastan`,
      description,
      images: [scene.image],
    },
  };
}

/* ── Decorative: twinkling star field ── */
function StarField({ count = 40 }: { count?: number }) {
  const stars = Array.from({ length: count }).map((_, i) => {
    const seed = (i * 9301 + 49297) % 233280;
    const rx = (seed % 1000) / 10;
    const ry = (((seed * 7) % 1000) / 10);
    const d = 2.6 + ((seed % 40) / 10);
    const dly = (seed % 30) / 10;
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
          top: `${ry}%`,
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

/* ── Decorative fleuron ── */
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
      <circle cx="80"  cy="10" r="2.2" fill="currentColor" opacity="0.7" />
      <circle cx="30"  cy="10" r="1"   fill="currentColor" opacity="0.5" />
      <circle cx="130" cy="10" r="1"   fill="currentColor" opacity="0.5" />
    </svg>
  );
}

export default async function LittlePrinceScenePage({
  params,
}: {
  params: Promise<{ scene: string }>;
}) {
  const { scene: sceneId } = await params;
  const entry = findScene(sceneId);
  if (!entry) notFound();
  const { scene, prev, next, index, total, all } = entry;

  const paragraphs = scene.essay
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  const isNight = NIGHT_SCENES.has(scene.id);

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: `${scene.title} — The Little Prince`,
    image: `https://www.mydastan.com${scene.image}`,
    about: {
      "@type": "Book",
      name: "Le Petit Prince",
      author: { "@type": "Person", name: "Antoine de Saint-Exupéry" },
    },
    url: `https://www.mydastan.com/little-prince/${scene.id}`,
    publisher: {
      "@type": "Organization",
      name: "Dastan",
      logo: {
        "@type": "ImageObject",
        url: "https://www.mydastan.com/dastan_icon_1024x1024.png",
      },
    },
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Dastan", item: "https://www.mydastan.com" },
      { "@type": "ListItem", position: 2, name: "Le Petit Prince", item: "https://www.mydastan.com/little-prince" },
      { "@type": "ListItem", position: 3, name: scene.title, item: `https://www.mydastan.com/little-prince/${scene.id}` },
    ],
  };

  return (
    <main className="relative min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      {/* ─── OVERTURE ─── Chapter heading, on atmosphere-appropriate sky ─── */}
      <section className={`relative overflow-hidden ${isNight ? "lp-night" : "lp-dawn"}`}>
        <StarField count={isNight ? 70 : 40} />

        <div className="relative mx-auto flex min-h-[58vh] w-full max-w-3xl flex-col items-center justify-center px-6 py-20 text-center">
          {/* Breadcrumb */}
          <div className="absolute left-5 top-5 flex items-center gap-3 text-[10px] uppercase tracking-[0.3em] text-white/55"
               style={{ fontFamily: "var(--font-ui)" }}>
            <Link href="/little-prince" className="hover:text-[#F4D06F] transition">
              ← The Exhibit
            </Link>
          </div>
          <div className="absolute right-5 top-5 text-[10px] uppercase tracking-[0.3em] text-white/45"
               style={{ fontFamily: "var(--font-ui)" }}>
            {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
          </div>

          <p
            className="lp-ink-bloom mb-6 text-[11px] uppercase tracking-[0.5em] text-[#F4D06F]/80"
            style={{ fontFamily: "var(--font-ui)", animationDelay: "0.05s" }}
          >
            {scene.chapter}
          </p>

          {/* Giant Roman numeral — like a chapter page in an antique book */}
          <div
            className="lp-ink-bloom mb-4 font-[family-name:var(--font-heading)] text-7xl italic leading-none text-[#F4D06F]/30 sm:text-8xl"
            style={{ animationDelay: "0.15s" }}
          >
            {ROMAN[scene.number]}
          </div>

          <h1
            className="lp-ink-bloom font-[family-name:var(--font-heading)] text-5xl italic leading-[1.05] text-white sm:text-6xl"
            style={{ textShadow: "0 2px 40px rgba(244, 208, 111, 0.25)", animationDelay: "0.3s" }}
          >
            {scene.title}
          </h1>

          <div
            className="lp-ink-bloom mt-8 text-[#F4D06F]/50"
            style={{ animationDelay: "0.5s" }}
          >
            <Fleuron />
          </div>
        </div>

        {/* Soft fade into the paper below */}
        <div aria-hidden className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-[#FBF6EB]" />
      </section>

      {/* ─── ILLUSTRATION ─── Bare on paper, like a page from the book ─── */}
      <section className="relative lp-paper">
        <div className="mx-auto flex max-w-4xl flex-col items-center px-6 pt-20 pb-10 sm:pt-28 sm:pb-14">
          <figure className="relative w-full">
            <div className="relative flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={scene.image}
                alt={scene.image_caption}
                className="lp-illustration h-auto w-full max-w-[720px] object-contain"
                style={{ maxHeight: "min(72vh, 680px)" }}
              />
            </div>
            {/* Hand-drawn baseline, like an ink line under a plate in an antique book */}
            <div aria-hidden className="mx-auto mt-8 h-px w-16 bg-sepia/20" />
            <figcaption className="mt-5 text-center font-[family-name:var(--font-heading)] text-[13px] italic leading-relaxed text-sepia-light/70 sm:text-sm">
              {scene.image_caption}
            </figcaption>
          </figure>
        </div>
      </section>

      {/* ─── FRENCH QUOTE — hero-size, with watermark guillemets ─── */}
      <section className="relative lp-paper overflow-hidden">
        <span
          aria-hidden
          className="pointer-events-none absolute left-[-2rem] top-[-1rem] select-none font-[family-name:var(--font-heading)] text-[14rem] leading-none text-gold/10 sm:text-[20rem]"
        >
          «
        </span>
        <span
          aria-hidden
          className="pointer-events-none absolute right-[-2rem] bottom-[-6rem] select-none font-[family-name:var(--font-heading)] text-[14rem] leading-none text-gold/10 sm:text-[20rem]"
        >
          »
        </span>

        <div className="relative mx-auto max-w-3xl px-6 py-16 text-center sm:py-20">
          <div className="mb-8 flex justify-center text-gold/45">
            <Fleuron />
          </div>

          <blockquote>
            <p className="lp-french text-3xl leading-[1.25] sm:text-[2.6rem] sm:leading-[1.2]">
              {scene.french_quote}
            </p>
            <p className="mt-6 font-[family-name:var(--font-heading)] text-base italic text-sepia-light sm:text-lg">
              {scene.english_quote}
            </p>
          </blockquote>

          <div className="mt-10 flex justify-center text-gold/45">
            <Fleuron />
          </div>
        </div>
      </section>

      {/* ─── ESSAY ─── Drop cap, generous prose ─── */}
      <article className="relative lp-paper">
        <div className="mx-auto max-w-2xl px-6 pb-8 sm:pb-12">
          {paragraphs.map((p, i) => (
            <p
              key={i}
              className={
                i === 0
                  ? "lp-dropcap prose-reading text-[1.08rem] leading-[1.95] sm:text-[1.18rem]"
                  : "prose-reading mt-5 text-[1.08rem] leading-[1.95] sm:text-[1.18rem]"
              }
            >
              {p}
            </p>
          ))}

          {/* Pull quote — chapter-break style */}
          <div className="mt-16 mb-6 flex justify-center text-gold/60">
            <Fleuron />
          </div>
          <blockquote className="text-center">
            <p className="mx-auto max-w-xl font-[family-name:var(--font-heading)] text-2xl italic leading-snug text-sepia sm:text-3xl">
              {scene.pull_quote}
            </p>
          </blockquote>
          <div className="mt-6 flex justify-center text-gold/60">
            <Fleuron />
          </div>

          {/* Closing star — fin */}
          <div
            className="mt-10 text-center text-gold/60"
            aria-hidden
            style={{ fontFamily: "var(--font-heading)" }}
          >
            <span className="text-2xl italic">✦</span>
          </div>
        </div>

        {/* ─── ROOM PICKER — swipeable chapter strip, tap to leap ─── */}
        <div className="mx-auto max-w-5xl pb-6 pt-14 sm:pt-20">
          <p
            className="mb-5 text-center text-[10px] uppercase tracking-[0.4em] text-sepia-light/55"
            style={{ fontFamily: "var(--font-ui)" }}
          >
            The Constellation · Room {String(index + 1).padStart(2, "0")} of {String(total).padStart(2, "0")}
          </p>
          <ConstellationStrip all={all} index={index} />
        </div>

        {/* ─── PAGE-TURN NAV ─── */}
        <div className="mx-auto max-w-3xl px-6 pb-24 pt-10">
          <div className="grid grid-cols-2 gap-6 border-t border-sepia/15 pt-8">
            <div>
              {prev ? (
                <Link href={`/little-prince/${prev.id}`} className="group block">
                  <p
                    className="text-[10px] uppercase tracking-[0.3em] text-sepia-light/60"
                    style={{ fontFamily: "var(--font-ui)" }}
                  >
                    <span className="inline-block transition-transform group-hover:-translate-x-1">←</span>
                    {" "}Previous · {ROMAN[prev.number]}
                  </p>
                  <p className="mt-1.5 font-[family-name:var(--font-heading)] text-lg italic text-sepia group-hover:text-gold transition-colors sm:text-xl">
                    {prev.title}
                  </p>
                </Link>
              ) : (
                <span />
              )}
            </div>
            <div className="text-right">
              {next ? (
                <Link href={`/little-prince/${next.id}`} className="group block">
                  <p
                    className="text-[10px] uppercase tracking-[0.3em] text-sepia-light/60"
                    style={{ fontFamily: "var(--font-ui)" }}
                  >
                    Next · {ROMAN[next.number]}{" "}
                    <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
                  </p>
                  <p className="mt-1.5 font-[family-name:var(--font-heading)] text-lg italic text-sepia group-hover:text-gold transition-colors sm:text-xl">
                    {next.title}
                  </p>
                </Link>
              ) : (
                <span />
              )}
            </div>
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/little-prince"
              className="inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.3em] text-sepia-light/70 hover:text-gold transition"
              style={{ fontFamily: "var(--font-ui)" }}
            >
              <span aria-hidden>✦</span>
              Return to the exhibit
              <span aria-hidden>✦</span>
            </Link>
          </div>
        </div>
      </article>
    </main>
  );
}
