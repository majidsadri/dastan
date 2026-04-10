import type { Metadata } from "next";
import fs from "fs";
import path from "path";
import Link from "next/link";
import { notFound } from "next/navigation";

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

function loadPhilosophers(): Philosopher[] {
  try {
    const raw = fs.readFileSync(
      path.join(process.cwd(), "public", "philosophers", "catalog.json"),
      "utf-8"
    );
    const parsed = JSON.parse(raw);
    return (parsed?.philosophers ?? []) as Philosopher[];
  } catch {
    return [];
  }
}

function findPhilosopher(id: string): Philosopher | undefined {
  return loadPhilosophers().find((p) => p.id === id);
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
    <main className="mx-auto w-full max-w-3xl px-6 py-12 text-sepia">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <nav className="mb-8 text-sm opacity-80">
        <Link href="/" className="underline underline-offset-4">
          Dastan
        </Link>
        <span className="mx-2">·</span>
        <Link href="/philosophers" className="underline underline-offset-4">
          Philosophers
        </Link>
      </nav>

      <article>
        <header className="mb-8 flex flex-col items-center text-center sm:flex-row sm:items-start sm:text-left sm:gap-8">
          {philosopher.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={philosopher.image}
              alt={`Portrait of ${philosopher.name}`}
              className="mb-4 h-40 w-40 flex-shrink-0 rounded-full object-cover shadow-md sm:mb-0"
            />
          )}
          <div>
            <h1 className="font-[var(--font-heading)] text-4xl leading-tight sm:text-5xl">
              {philosopher.name}
            </h1>
            <p className="mt-2 text-sm opacity-75">
              {["Philosopher", philosopher.nationality, lifeSpan]
                .filter(Boolean)
                .join(" · ")}
            </p>
            {philosopher.school && (
              <p className="mt-1 text-sm italic opacity-70">
                {philosopher.school}
              </p>
            )}
          </div>
        </header>

        {philosopher.article_title && (
          <h2 className="mb-6 font-[var(--font-heading)] text-2xl italic">
            {philosopher.article_title}
          </h2>
        )}

        <div className="space-y-5 text-lg leading-relaxed">
          {paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>

        {philosopher.pull_quote && (
          <blockquote className="my-10 border-l-4 border-sepia/40 pl-6 font-[var(--font-heading)] text-xl italic opacity-90">
            {philosopher.pull_quote}
          </blockquote>
        )}

        {philosopher.famous_quote && (
          <blockquote className="my-8 border-l-4 border-sepia/40 pl-6 italic opacity-90">
            “{philosopher.famous_quote}”
            <footer className="mt-2 text-sm not-italic opacity-70">
              — {philosopher.name}
            </footer>
          </blockquote>
        )}

        {philosopher.key_ideas && philosopher.key_ideas.length > 0 && (
          <section className="mt-10">
            <h3 className="mb-3 font-[var(--font-heading)] text-xl">
              Key Ideas
            </h3>
            <ul className="list-disc space-y-1 pl-6">
              {philosopher.key_ideas.map((idea) => (
                <li key={idea}>{idea}</li>
              ))}
            </ul>
          </section>
        )}

        {philosopher.key_works && philosopher.key_works.length > 0 && (
          <section className="mt-8">
            <h3 className="mb-3 font-[var(--font-heading)] text-xl">
              Key Works
            </h3>
            <ul className="list-disc space-y-1 pl-6">
              {philosopher.key_works.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          </section>
        )}

        {((philosopher.influenced_by && philosopher.influenced_by.length > 0) ||
          (philosopher.influenced && philosopher.influenced.length > 0)) && (
          <section className="mt-8 grid gap-6 sm:grid-cols-2">
            {philosopher.influenced_by && philosopher.influenced_by.length > 0 && (
              <div>
                <h3 className="mb-3 font-[var(--font-heading)] text-xl">
                  Influenced by
                </h3>
                <ul className="space-y-1">
                  {philosopher.influenced_by.map((pid) => (
                    <li key={pid}>
                      <Link
                        href={`/philosophers/${pid}`}
                        className="underline underline-offset-4"
                      >
                        {nameFor(pid)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {philosopher.influenced && philosopher.influenced.length > 0 && (
              <div>
                <h3 className="mb-3 font-[var(--font-heading)] text-xl">
                  Influenced
                </h3>
                <ul className="space-y-1">
                  {philosopher.influenced.map((pid) => (
                    <li key={pid}>
                      <Link
                        href={`/philosophers/${pid}`}
                        className="underline underline-offset-4"
                      >
                        {nameFor(pid)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}

        {philosopher.fun_fact && (
          <section className="mt-10 rounded-lg border border-sepia/20 bg-sepia/5 p-4 text-sm italic">
            <strong className="not-italic">Did you know?</strong>{" "}
            {philosopher.fun_fact}
          </section>
        )}

        <footer className="mt-12 border-t border-sepia/20 pt-6 text-sm opacity-80">
          <Link href="/philosophers" className="underline underline-offset-4">
            ← Browse the philosophy timeline
          </Link>
        </footer>
      </article>
    </main>
  );
}
