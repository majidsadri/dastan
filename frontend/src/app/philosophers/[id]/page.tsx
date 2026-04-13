import type { Metadata } from "next";
import fs from "fs";
import path from "path";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPhilosopherFigures, type PhilosopherFigure } from "../illustrations";

type Philosopher = {
  id: string;
  name: string;
  era?: string;
  born?: string;
  died?: string;
  born_year?: number;
  died_year?: number;
  nationality?: string;
  school?: string;
  key_ideas?: string[];
  influenced_by?: string[];
  influenced?: string[];
  famous_quote?: string;
  fun_fact?: string;
  key_works?: string[];
  article_title?: string;
  article?: string;
  pull_quote?: string;
  image?: string;
};

type Era = {
  id: string;
  name: string;
  period: string;
  color: string;
  description: string;
};

type Catalog = {
  meta?: { eras?: Era[] };
  philosophers?: Philosopher[];
};

function loadCatalog(): Catalog {
  try {
    const raw = fs.readFileSync(
      path.join(process.cwd(), "public", "philosophers", "catalog.json"),
      "utf-8"
    );
    return JSON.parse(raw) as Catalog;
  } catch {
    return {};
  }
}

function loadPhilosophers(): Philosopher[] {
  return loadCatalog().philosophers ?? [];
}

function loadEras(): Era[] {
  return loadCatalog().meta?.eras ?? [];
}

function findPhilosopher(id: string): Philosopher | undefined {
  return loadPhilosophers().find((p) => p.id === id);
}

function findEra(id: string | undefined): Era | undefined {
  if (!id) return undefined;
  return loadEras().find((e) => e.id === id);
}

function nameFor(id: string): string {
  return findPhilosopher(id)?.name ?? id;
}

function firstParagraph(article: string | undefined): string {
  if (!article) return "";
  const para = article.split(/\n\n+/)[0] ?? "";
  return para.replace(/\s+/g, " ").trim();
}

function shortDescription(p: Philosopher): string {
  const span = p.died ? `${p.born}–${p.died}` : (p.born ?? "");
  const intro = `${p.name}${span ? ` (${span})` : ""}${
    p.nationality ? ` — ${p.nationality} philosopher` : " — philosopher"
  }${p.school ? `, ${p.school}` : ""}. `.replace(/\s+/g, " ");
  const body = firstParagraph(p.article);
  const combined = (intro + body).slice(0, 300).trim();
  return combined.length > 0
    ? combined + (combined.length === 300 ? "…" : "")
    : `${p.name}, ${p.nationality ?? ""} philosopher.`;
}

/* Roman numerals for "Key Ideas" cards — pure visual ornament. */
function toRoman(n: number): string {
  const vals = [10, 9, 5, 4, 1];
  const sym = ["X", "IX", "V", "IV", "I"];
  let out = "";
  let v = n;
  for (let i = 0; i < vals.length; i++) {
    while (v >= vals[i]) {
      out += sym[i];
      v -= vals[i];
    }
  }
  return out;
}

export async function generateStaticParams() {
  return loadPhilosophers().map((p) => ({ id: p.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const philosopher = findPhilosopher(id);
  if (!philosopher) return { title: "Philosopher not found" };

  const description = shortDescription(philosopher);
  const ogImage = philosopher.image ?? "/og-image.png";

  return {
    title: `${philosopher.name} — Biography, Ideas & Works`,
    description,
    alternates: { canonical: `/philosophers/${philosopher.id}` },
    openGraph: {
      type: "profile",
      url: `https://www.mydastan.com/philosophers/${philosopher.id}`,
      title: `${philosopher.name} | Dastan`,
      description,
      images: [{ url: ogImage, alt: philosopher.name }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${philosopher.name} | Dastan`,
      description,
      images: [ogImage],
    },
  };
}

export default async function PhilosopherPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const philosopher = findPhilosopher(id);
  if (!philosopher) notFound();

  const eras = loadEras();
  const era = findEra(philosopher.era);
  const eraColor = era?.color ?? "#8B6914"; // fallback to gold
  const currentEraIndex = era ? eras.findIndex((e) => e.id === era.id) : -1;
  const figures = getPhilosopherFigures(philosopher.id);

  const lifeSpan = philosopher.died
    ? `${philosopher.born} – ${philosopher.died}`
    : philosopher.born
      ? `b. ${philosopher.born}`
      : "";

  const paragraphs = (philosopher.article ?? "")
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  const personJsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: philosopher.name,
    url: `https://www.mydastan.com/philosophers/${philosopher.id}`,
    description: shortDescription(philosopher),
    jobTitle: "Philosopher",
  };
  if (philosopher.nationality) personJsonLd.nationality = philosopher.nationality;
  if (philosopher.born) personJsonLd.birthDate = philosopher.born;
  if (philosopher.died) personJsonLd.deathDate = philosopher.died;
  if (philosopher.image) {
    personJsonLd.image = `https://www.mydastan.com${philosopher.image}`;
  }
  const knowsAbout: string[] = [];
  if (philosopher.school) knowsAbout.push(philosopher.school);
  if (philosopher.key_ideas) knowsAbout.push(...philosopher.key_ideas);
  if (knowsAbout.length) personJsonLd.knowsAbout = knowsAbout;

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Dastan",
        item: "https://www.mydastan.com",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Philosophers",
        item: "https://www.mydastan.com/philosophers",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: philosopher.name,
        item: `https://www.mydastan.com/philosophers/${philosopher.id}`,
      },
    ],
  };

  return (
    <main className="relative text-sepia">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      {/* ═════════ ATMOSPHERIC HERO ═════════ */}
      <section className="relative overflow-hidden">
        {/* Soft radial gradient tinted by era color */}
        <div
          aria-hidden
          className="absolute inset-0 -z-10"
          style={{
            background: `radial-gradient(ellipse 80% 60% at 50% 20%, ${eraColor}18, transparent 70%), linear-gradient(180deg, #FDFBF7 0%, #F5F0E8 100%)`,
          }}
        />
        {/* Dot texture overlay */}
        <div aria-hidden className="absolute inset-0 -z-10 dot-pattern-sparse opacity-50" />

        <div className="mx-auto w-full max-w-3xl px-6 pt-10 pb-14">
          {/* Breadcrumb */}
          <nav className="mb-10 text-xs tracking-wide uppercase opacity-60"
               style={{ fontFamily: "var(--font-ui)" }}>
            <Link href="/" className="hover:text-gold transition-colors">Dastan</Link>
            <span className="mx-2 opacity-50">/</span>
            <Link href="/philosophers" className="hover:text-gold transition-colors">Philosophers</Link>
            <span className="mx-2 opacity-50">/</span>
            <span className="opacity-80">{philosopher.name}</span>
          </nav>

          {/* Portrait + identity card */}
          <div className="flex flex-col items-center text-center sm:flex-row sm:items-end sm:text-left sm:gap-10">
            {philosopher.image && (
              <div className="relative mb-6 sm:mb-0 shrink-0">
                {/* Gold hairline frame */}
                <div
                  aria-hidden
                  className="absolute -inset-1.5 rounded-2xl"
                  style={{
                    border: `1px solid ${eraColor}40`,
                    boxShadow: `0 20px 50px -20px ${eraColor}50, 0 8px 24px rgba(44,36,24,0.10)`,
                  }}
                />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={philosopher.image}
                  alt={`Portrait of ${philosopher.name}`}
                  className="relative h-44 w-44 sm:h-52 sm:w-52 rounded-2xl object-cover"
                  style={{ filter: "sepia(0.08) contrast(1.02)" }}
                />
                {/* Era tag pinned to bottom-left corner of portrait */}
                {era && (
                  <div
                    className="absolute -bottom-3 left-1/2 sm:left-4 -translate-x-1/2 sm:translate-x-0
                               px-3 py-1 rounded-full text-[10px] font-medium tracking-[0.15em] uppercase
                               backdrop-blur-sm"
                    style={{
                      background: "#FDFBF7",
                      color: eraColor,
                      border: `1px solid ${eraColor}55`,
                      fontFamily: "var(--font-ui)",
                      boxShadow: "0 2px 10px rgba(44,36,24,0.08)",
                    }}
                  >
                    {era.name}
                  </div>
                )}
              </div>
            )}

            <div className="flex-1 min-w-0">
              <h1
                className="text-5xl sm:text-6xl leading-[0.95] tracking-tight"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                {philosopher.name}
              </h1>
              {philosopher.school && (
                <p
                  className="mt-3 text-base italic opacity-75"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  {philosopher.school}
                </p>
              )}

              {/* Meta strip with tiny icons */}
              <ul
                className="mt-5 flex flex-wrap items-center justify-center sm:justify-start gap-x-5 gap-y-2 text-[13px] opacity-80"
                style={{ fontFamily: "var(--font-ui)" }}
              >
                {lifeSpan && (
                  <li className="flex items-center gap-1.5">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                         stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="9" />
                      <path d="M12 7v5l3 2" />
                    </svg>
                    <span>{lifeSpan}</span>
                  </li>
                )}
                {philosopher.nationality && (
                  <li className="flex items-center gap-1.5">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                         stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s-7-6-7-13a7 7 0 1114 0c0 7-7 13-7 13z" />
                      <circle cx="12" cy="9" r="2.5" />
                    </svg>
                    <span>{philosopher.nationality}</span>
                  </li>
                )}
                {era && (
                  <li className="flex items-center gap-1.5">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                         stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 6h16M4 12h16M4 18h10" />
                    </svg>
                    <span>{era.period}</span>
                  </li>
                )}
              </ul>
            </div>
          </div>

          {/* ═════════ ERA TIMELINE STRIP ═════════ */}
          {eras.length > 0 && currentEraIndex >= 0 && (
            <div className="mt-12">
              <div className="relative h-[2px] bg-warm-border/80 rounded-full">
                {eras.map((e, i) => {
                  const pct = eras.length === 1 ? 50 : (i / (eras.length - 1)) * 100;
                  const active = i === currentEraIndex;
                  return (
                    <div
                      key={e.id}
                      className="absolute -translate-x-1/2 -translate-y-1/2 top-1/2"
                      style={{ left: `${pct}%` }}
                    >
                      <div
                        className="rounded-full transition-all"
                        style={{
                          width: active ? 14 : 6,
                          height: active ? 14 : 6,
                          background: active ? e.color : "#D8CFBC",
                          boxShadow: active
                            ? `0 0 0 4px ${e.color}22, 0 2px 8px ${e.color}44`
                            : "none",
                        }}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 flex justify-between text-[10px] tracking-[0.12em] uppercase opacity-60"
                   style={{ fontFamily: "var(--font-ui)" }}>
                {eras.map((e, i) => (
                  <span
                    key={e.id}
                    className="text-center"
                    style={{
                      color: i === currentEraIndex ? e.color : undefined,
                      opacity: i === currentEraIndex ? 1 : 0.5,
                      fontWeight: i === currentEraIndex ? 600 : 400,
                    }}
                  >
                    {e.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ═════════ ARTICLE BODY ═════════ */}
      <article className="mx-auto w-full max-w-3xl px-6 pb-16">
        {/* Decorative flame ornament divider */}
        <div className="my-10 flex items-center justify-center gap-4" aria-hidden>
          <div className="h-px flex-1 max-w-[120px]" style={{ background: `linear-gradient(90deg, transparent, ${eraColor}40)` }} />
          <svg width="22" height="28" viewBox="0 0 40 48" fill="none">
            <path
              d="M20 4 C20 4 12 16 12 26 C12 32 16 37 20 37 C24 37 28 32 28 26 C28 16 20 4 20 4Z"
              fill={`${eraColor}18`}
              stroke={`${eraColor}80`}
              strokeWidth="0.8"
            />
            <path
              d="M20 14 C20 14 16 22 16 28 C16 31 18 34 20 34 C22 34 24 31 24 28 C24 22 20 14 20 14Z"
              fill={`${eraColor}40`}
            />
            <line x1="13" y1="43" x2="27" y2="43" stroke={`${eraColor}60`} strokeWidth="0.8" strokeLinecap="round" />
          </svg>
          <div className="h-px flex-1 max-w-[120px]" style={{ background: `linear-gradient(270deg, transparent, ${eraColor}40)` }} />
        </div>

        {philosopher.article_title && (
          <h2
            className="mb-2 text-center text-3xl sm:text-4xl italic leading-tight"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            {philosopher.article_title}
          </h2>
        )}
        {philosopher.article_title && (
          <div className="mb-10 flex justify-center">
            <div className="h-[2px] w-12 rounded-full" style={{ background: eraColor }} />
          </div>
        )}

        {/* Body with drop cap on first paragraph — figures interleaved */}
        <div className="prose-reading space-y-5 text-[17px] sm:text-[18px] leading-[1.8]">
          {paragraphs.map((p, i) => {
            const figuresAfter = figures.filter((f) => f.afterParagraph === i);
            return (
              <div key={i} className="space-y-5">
                <p>
                  {i === 0 ? (
                    <>
                      <span
                        style={{
                          fontFamily: "var(--font-heading)",
                          color: eraColor,
                          float: "left",
                          fontSize: "4.5rem",
                          lineHeight: "0.85",
                          marginRight: "0.5rem",
                          marginTop: "0.25rem",
                        }}
                      >
                        {p.charAt(0)}
                      </span>
                      {p.slice(1)}
                    </>
                  ) : (
                    p
                  )}
                </p>
                {figuresAfter.map((fig, fi) => (
                  <PhilosopherFigureBlock
                    key={`fig-${i}-${fi}`}
                    figure={fig}
                    color={eraColor}
                  />
                ))}
              </div>
            );
          })}
        </div>

        {/* Pull quote — full-width feature */}
        {philosopher.pull_quote && (
          <figure className="my-14 relative">
            <div
              aria-hidden
              className="absolute -top-2 -left-2 sm:-left-4 text-[120px] leading-[0.7] font-serif select-none pointer-events-none"
              style={{ color: `${eraColor}20`, fontFamily: "var(--font-heading)" }}
            >
              “
            </div>
            <blockquote
              className="relative pl-6 sm:pl-10 border-l-2 text-2xl sm:text-[28px] italic leading-snug"
              style={{
                borderColor: eraColor,
                fontFamily: "var(--font-heading)",
                color: "#2C2418",
              }}
            >
              {philosopher.pull_quote}
            </blockquote>
          </figure>
        )}

        {/* Famous quote — more modest than pull quote */}
        {philosopher.famous_quote && (
          <figure className="my-10 rounded-xl border border-warm-border bg-linen/60 px-6 py-5 text-center">
            <blockquote
              className="text-lg sm:text-xl italic leading-snug"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              “{philosopher.famous_quote}”
            </blockquote>
            <figcaption
              className="mt-3 text-[11px] tracking-[0.2em] uppercase opacity-60"
              style={{ fontFamily: "var(--font-ui)" }}
            >
              — {philosopher.name}
            </figcaption>
          </figure>
        )}

        {/* ═════════ KEY IDEAS — numbered cards ═════════ */}
        {philosopher.key_ideas && philosopher.key_ideas.length > 0 && (
          <section className="mt-14">
            <SectionHeading eraColor={eraColor} kicker="Philosophy" title="Key Ideas" />
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {philosopher.key_ideas.map((idea, i) => (
                <div
                  key={idea}
                  className="relative overflow-hidden rounded-xl border border-warm-border bg-parchment px-5 py-5 pl-14"
                  style={{ boxShadow: "0 1px 3px rgba(44,36,24,0.04)" }}
                >
                  <span
                    className="absolute left-4 top-4 text-[13px] tracking-[0.15em]"
                    style={{
                      fontFamily: "var(--font-heading)",
                      color: eraColor,
                      fontStyle: "italic",
                    }}
                  >
                    {toRoman(i + 1)}
                  </span>
                  {/* Thin gold divider between numeral and text */}
                  <span
                    aria-hidden
                    className="absolute left-4 top-10 h-[2px] w-6"
                    style={{ background: `${eraColor}55` }}
                  />
                  <p
                    className="text-[15px] leading-snug"
                    style={{ fontFamily: "var(--font-heading)" }}
                  >
                    {idea}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ═════════ KEY WORKS — manuscript list ═════════ */}
        {philosopher.key_works && philosopher.key_works.length > 0 && (
          <section className="mt-14">
            <SectionHeading eraColor={eraColor} kicker="Bibliography" title="Key Works" />
            <ol className="mt-8 space-y-3">
              {philosopher.key_works.map((w, i) => (
                <li
                  key={w}
                  className="flex items-baseline gap-4 border-b border-warm-border/70 pb-3 last:border-0"
                >
                  <span
                    className="shrink-0 text-[11px] tracking-[0.15em] tabular-nums"
                    style={{ color: eraColor, fontFamily: "var(--font-ui)" }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span
                    className="flex-1 text-[16px] italic"
                    style={{ fontFamily: "var(--font-heading)" }}
                  >
                    {w}
                  </span>
                </li>
              ))}
            </ol>
          </section>
        )}

        {/* ═════════ INTELLECTUAL LINEAGE ═════════ */}
        {((philosopher.influenced_by && philosopher.influenced_by.length > 0) ||
          (philosopher.influenced && philosopher.influenced.length > 0)) && (
          <section className="mt-14">
            <SectionHeading eraColor={eraColor} kicker="Connections" title="Intellectual Lineage" />

            <div className="mt-8 grid gap-8 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
              {/* Influenced BY (left) */}
              <div className="sm:text-right">
                <p
                  className="mb-3 text-[10px] tracking-[0.2em] uppercase opacity-60"
                  style={{ fontFamily: "var(--font-ui)" }}
                >
                  Influenced by
                </p>
                {philosopher.influenced_by && philosopher.influenced_by.length > 0 ? (
                  <ul className="space-y-2">
                    {philosopher.influenced_by.map((pid) => (
                      <li key={pid} className="flex sm:justify-end items-center gap-2">
                        <Link
                          href={`/philosophers/${pid}`}
                          className="inline-flex items-center gap-2 rounded-full border border-warm-border bg-parchment px-4 py-1.5
                                     text-[13px] hover:border-transparent hover:shadow-sm transition-all"
                          style={{ fontFamily: "var(--font-heading)" }}
                        >
                          <span>{nameFor(pid)}</span>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                               stroke={eraColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M5 12h14M13 6l6 6-6 6" />
                          </svg>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[13px] opacity-50 italic">—</p>
                )}
              </div>

              {/* Center medallion */}
              <div className="flex flex-col items-center">
                <div
                  className="relative h-20 w-20 rounded-full flex items-center justify-center"
                  style={{
                    background: `radial-gradient(circle at 30% 30%, ${eraColor}25, ${eraColor}10)`,
                    border: `1.5px solid ${eraColor}80`,
                    boxShadow: `0 8px 28px ${eraColor}30, inset 0 1px 0 rgba(255,255,255,0.4)`,
                  }}
                >
                  <span
                    className="text-2xl"
                    style={{ fontFamily: "var(--font-heading)", color: eraColor }}
                  >
                    {philosopher.name.charAt(0)}
                  </span>
                </div>
                <p
                  className="mt-2 text-[11px] tracking-[0.1em] uppercase opacity-70"
                  style={{ fontFamily: "var(--font-ui)" }}
                >
                  {philosopher.name.split(" ")[0]}
                </p>
              </div>

              {/* Influenced (right) */}
              <div className="sm:text-left">
                <p
                  className="mb-3 text-[10px] tracking-[0.2em] uppercase opacity-60"
                  style={{ fontFamily: "var(--font-ui)" }}
                >
                  He influenced
                </p>
                {philosopher.influenced && philosopher.influenced.length > 0 ? (
                  <ul className="space-y-2">
                    {philosopher.influenced.map((pid) => (
                      <li key={pid} className="flex sm:justify-start items-center gap-2">
                        <Link
                          href={`/philosophers/${pid}`}
                          className="inline-flex items-center gap-2 rounded-full border border-warm-border bg-parchment px-4 py-1.5
                                     text-[13px] hover:border-transparent hover:shadow-sm transition-all"
                          style={{ fontFamily: "var(--font-heading)" }}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                               stroke={eraColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M5 12h14M13 6l6 6-6 6" />
                          </svg>
                          <span>{nameFor(pid)}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[13px] opacity-50 italic">—</p>
                )}
              </div>
            </div>
          </section>
        )}

        {/* ═════════ FUN FACT — margin note ═════════ */}
        {philosopher.fun_fact && (
          <section
            className="mt-14 relative rounded-2xl border px-6 py-5 pl-14"
            style={{
              background: `linear-gradient(135deg, ${eraColor}08 0%, transparent 70%), #FDFBF7`,
              borderColor: `${eraColor}30`,
            }}
          >
            {/* Spark icon */}
            <div
              className="absolute left-4 top-5 h-7 w-7 rounded-full flex items-center justify-center"
              style={{
                background: `${eraColor}18`,
                border: `1px solid ${eraColor}40`,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                   stroke={eraColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
            </div>
            <p
              className="text-[11px] tracking-[0.2em] uppercase mb-1"
              style={{ color: eraColor, fontFamily: "var(--font-ui)" }}
            >
              Did you know
            </p>
            <p className="text-[15px] italic leading-relaxed opacity-85"
               style={{ fontFamily: "var(--font-heading)" }}>
              {philosopher.fun_fact}
            </p>
          </section>
        )}

        {/* Footer divider + link */}
        <div className="mt-16 flex flex-col items-center gap-6">
          <div className="dot-divider">
            <span /><span /><span /><span /><span />
          </div>
          <Link
            href="/philosophers"
            className="inline-flex items-center gap-2 text-[13px] tracking-wide uppercase opacity-70 hover:opacity-100 hover:text-gold transition-all"
            style={{ fontFamily: "var(--font-ui)" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M11 18l-6-6 6-6" />
            </svg>
            Browse the timeline
          </Link>
        </div>
      </article>
    </main>
  );
}

/* ─── Inline figure block ─── */
function PhilosopherFigureBlock({
  figure,
  color,
}: {
  figure: PhilosopherFigure;
  color: string;
}) {
  const Render = figure.render;
  return (
    <figure className="my-10">
      <div
        className={`mx-auto ${figure.wide ? "max-w-[560px]" : "max-w-[360px]"}`}
      >
        <Render color={color} />
      </div>
      <figcaption
        className="mt-3 text-center text-[12px] italic opacity-60"
        style={{ fontFamily: "var(--font-heading)" }}
      >
        {figure.caption}
      </figcaption>
    </figure>
  );
}

/* ─── Local section heading component ─── */
function SectionHeading({
  kicker,
  title,
  eraColor,
}: {
  kicker: string;
  title: string;
  eraColor: string;
}) {
  return (
    <div className="flex flex-col items-center text-center">
      <span
        className="text-[10px] tracking-[0.3em] uppercase"
        style={{ color: eraColor, fontFamily: "var(--font-ui)" }}
      >
        {kicker}
      </span>
      <h3
        className="mt-1 text-2xl sm:text-[28px]"
        style={{ fontFamily: "var(--font-heading)" }}
      >
        {title}
      </h3>
      <div
        className="mt-3 h-[2px] w-10 rounded-full"
        style={{ background: eraColor }}
      />
    </div>
  );
}
