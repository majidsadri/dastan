import type { Metadata } from "next";
import fs from "fs";
import path from "path";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Motif, MotifType } from "../_components/motif";
import StationStrip from "../_components/StationStrip";

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
  author: string;
  published: string;
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
  if (!entry) return { title: "Chapter not found" };
  const { scene } = entry;

  const description = `${scene.english_quote} — ${scene.essay
    .split(/\n\n+/)[0]
    .slice(0, 160)}`;

  return {
    title: `${scene.title} — Siddhartha, ${scene.chapter}`,
    description,
    alternates: { canonical: `/siddhartha/${scene.id}` },
    openGraph: {
      type: "article",
      url: `https://www.mydastan.com/siddhartha/${scene.id}`,
      title: `${scene.title} | Siddhartha | Dastan`,
      description,
    },
    twitter: {
      card: "summary",
      title: `${scene.title} | Siddhartha | Dastan`,
      description,
    },
  };
}

/* ── Thin ink hairline divider ── */
function InkRule({ className = "" }: { className?: string }) {
  return <div aria-hidden className={`sd-rule ${className}`} />;
}

export default async function SiddharthaScenePage({
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

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: `${scene.title} — Siddhartha`,
    about: {
      "@type": "Book",
      name: "Siddhartha",
      author: { "@type": "Person", name: "Hermann Hesse" },
    },
    url: `https://www.mydastan.com/siddhartha/${scene.id}`,
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
      { "@type": "ListItem", position: 2, name: "Siddhartha", item: "https://www.mydastan.com/siddhartha" },
      { "@type": "ListItem", position: 3, name: scene.title, item: `https://www.mydastan.com/siddhartha/${scene.id}` },
    ],
  };

  return (
    <main className="relative min-h-screen sd-ink">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      {/* ─── OVERTURE ─── Stone dawn, Roman numeral, motif as hero ─── */}
      <section className="relative overflow-hidden sd-dawn">
        <div className="relative mx-auto flex min-h-[66vh] w-full max-w-3xl flex-col items-center justify-center px-6 py-20 text-center">
          {/* Breadcrumb */}
          <div
            className="absolute left-5 top-5 text-[10px] uppercase tracking-[0.3em]"
            style={{ fontFamily: "var(--font-ui)", color: "rgba(30,26,21,0.55)" }}
          >
            <Link href="/siddhartha" className="hover:text-gold transition">
              ← The Reading Room
            </Link>
          </div>
          <div
            className="absolute right-5 top-5 text-[10px] uppercase tracking-[0.3em]"
            style={{ fontFamily: "var(--font-ui)", color: "rgba(30,26,21,0.45)" }}
          >
            {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
          </div>

          <p
            className="sd-brush mb-6 text-[11px] uppercase tracking-[0.5em]"
            style={{ fontFamily: "var(--font-ui)", color: "rgba(30,26,21,0.55)", animationDelay: "0.05s" }}
          >
            {scene.chapter}
          </p>

          {/* Large Roman numeral */}
          <div
            className="sd-brush mb-2 font-[family-name:var(--font-heading)] text-6xl italic leading-none sm:text-7xl"
            style={{ color: "rgba(30,26,21,0.18)", animationDelay: "0.15s" }}
          >
            {ROMAN[scene.number]}
          </div>

          <h1
            className="sd-brush font-[family-name:var(--font-heading)] text-5xl italic leading-[1.05] sm:text-6xl"
            style={{ color: "#1E1A15", animationDelay: "0.3s" }}
          >
            {scene.title}
          </h1>

          <div className="sd-brush mt-10" style={{ animationDelay: "0.5s" }}>
            <Motif
              type={scene.motif}
              size={140}
              className="sd-motif sd-breath"
              inkColor="rgba(30,26,21,0.85)"
            />
          </div>
        </div>
      </section>

      {/* ─── MOTIF CAPTION — handwritten slip ─── */}
      <section className="relative sd-paper">
        <div className="mx-auto flex max-w-2xl flex-col items-center px-6 pt-14 pb-6">
          <InkRule className="w-16" />
          <p
            className="mt-5 text-center font-[family-name:var(--font-heading)] text-[13px] italic leading-relaxed sm:text-sm"
            style={{ color: "rgba(30,26,21,0.65)" }}
          >
            {scene.motif_caption}
          </p>
        </div>
      </section>

      {/* ─── GERMAN QUOTE — hero-size, watermark guillemets ─── */}
      <section className="relative sd-paper overflow-hidden">
        <span
          aria-hidden
          className="pointer-events-none absolute left-[-2rem] top-[-1rem] select-none font-[family-name:var(--font-heading)] text-[14rem] leading-none sm:text-[20rem]"
          style={{ color: "rgba(30,26,21,0.06)" }}
        >
          «
        </span>
        <span
          aria-hidden
          className="pointer-events-none absolute right-[-2rem] bottom-[-6rem] select-none font-[family-name:var(--font-heading)] text-[14rem] leading-none sm:text-[20rem]"
          style={{ color: "rgba(30,26,21,0.06)" }}
        >
          »
        </span>

        <div className="relative mx-auto max-w-3xl px-6 py-16 text-center sm:py-20">
          <InkRule className="mx-auto mb-10 max-w-xs" />

          <blockquote>
            <p
              className="sd-german text-3xl leading-[1.3] sm:text-[2.4rem] sm:leading-[1.25]"
              style={{ color: "#1E1A15" }}
            >
              {scene.german_quote}
            </p>
            <p
              className="mt-6 font-[family-name:var(--font-heading)] text-base italic sm:text-lg"
              style={{ color: "rgba(30,26,21,0.6)" }}
            >
              {scene.english_quote}
            </p>
          </blockquote>

          <InkRule className="mx-auto mt-12 max-w-xs" />
        </div>
      </section>

      {/* ─── ESSAY ─── Generous prose with drop cap ─── */}
      <article className="relative sd-paper">
        <div className="mx-auto max-w-2xl px-6 pb-8 sm:pb-12">
          {paragraphs.map((p, i) => (
            <p
              key={i}
              className={
                i === 0
                  ? "sd-dropcap prose-reading text-[1.08rem] leading-[1.95] sm:text-[1.18rem]"
                  : "prose-reading mt-5 text-[1.08rem] leading-[1.95] sm:text-[1.18rem]"
              }
              style={{ color: "rgba(30,26,21,0.88)" }}
            >
              {p}
            </p>
          ))}

          {/* Pull quote */}
          <div className="mt-16 mb-6 flex justify-center">
            <Motif type="river" size={56} className="sd-ink-muted sd-stream" />
          </div>
          <blockquote className="text-center">
            <p
              className="mx-auto max-w-xl font-[family-name:var(--font-heading)] text-2xl italic leading-snug sm:text-3xl"
              style={{ color: "#1E1A15" }}
            >
              {scene.pull_quote}
            </p>
          </blockquote>
          <div className="mt-6 flex justify-center">
            <Motif type="river" size={56} className="sd-ink-muted sd-stream" />
          </div>

          {/* Closing mark */}
          <div
            className="mt-10 text-center font-[family-name:var(--font-heading)] text-2xl italic"
            aria-hidden
            style={{ color: "rgba(30,26,21,0.45)" }}
          >
            ◯
          </div>
        </div>

        {/* ─── STATION PICKER — swipeable strip, readable on iPhone ─── */}
        <div className="mx-auto max-w-5xl pb-6 pt-14 sm:pt-20">
          <p
            className="mb-5 text-center text-[10px] uppercase tracking-[0.4em]"
            style={{ fontFamily: "var(--font-ui)", color: "rgba(30,26,21,0.55)" }}
          >
            The Path · Station {String(index + 1).padStart(2, "0")} of {String(total).padStart(2, "0")}
          </p>
          <StationStrip all={all} index={index} />
        </div>

        {/* ─── PAGE-TURN NAV ─── */}
        <div className="mx-auto max-w-3xl px-6 pb-24 pt-10">
          <div
            className="grid grid-cols-2 gap-6 pt-8"
            style={{ borderTop: "1px solid rgba(30,26,21,0.15)" }}
          >
            <div>
              {prev ? (
                <Link href={`/siddhartha/${prev.id}`} className="group block">
                  <p
                    className="text-[10px] uppercase tracking-[0.3em]"
                    style={{ fontFamily: "var(--font-ui)", color: "rgba(30,26,21,0.55)" }}
                  >
                    <span className="inline-block transition-transform group-hover:-translate-x-1">←</span>
                    {" "}Previous · {ROMAN[prev.number]}
                  </p>
                  <p
                    className="mt-1.5 font-[family-name:var(--font-heading)] text-lg italic transition-colors sm:text-xl"
                    style={{ color: "#1E1A15" }}
                  >
                    {prev.title}
                  </p>
                </Link>
              ) : (
                <span />
              )}
            </div>
            <div className="text-right">
              {next ? (
                <Link href={`/siddhartha/${next.id}`} className="group block">
                  <p
                    className="text-[10px] uppercase tracking-[0.3em]"
                    style={{ fontFamily: "var(--font-ui)", color: "rgba(30,26,21,0.55)" }}
                  >
                    Next · {ROMAN[next.number]}{" "}
                    <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
                  </p>
                  <p
                    className="mt-1.5 font-[family-name:var(--font-heading)] text-lg italic transition-colors sm:text-xl"
                    style={{ color: "#1E1A15" }}
                  >
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
              href="/siddhartha"
              className="inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.3em] hover:text-gold transition"
              style={{ fontFamily: "var(--font-ui)", color: "rgba(30,26,21,0.6)" }}
            >
              <span aria-hidden>◯</span>
              Return to the path
              <span aria-hidden>◯</span>
            </Link>
          </div>
        </div>
      </article>
    </main>
  );
}
