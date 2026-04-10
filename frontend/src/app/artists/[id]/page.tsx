import type { Metadata } from "next";
import fs from "fs";
import path from "path";
import Link from "next/link";
import { notFound } from "next/navigation";

type Artist = {
  id: string;
  name: string;
  type: string;
  born: string;
  died: string;
  nationality?: string;
  movement?: string;
  key_works?: string[];
  article_title?: string;
  article?: string;
  pull_quote?: string;
  image?: string;
};

function loadArtists(): Artist[] {
  try {
    const raw = fs.readFileSync(
      path.join(process.cwd(), "public", "artists", "catalog.json"),
      "utf-8"
    );
    const parsed = JSON.parse(raw);
    return (parsed?.artists ?? []) as Artist[];
  } catch {
    return [];
  }
}

function findArtist(id: string): Artist | undefined {
  return loadArtists().find((a) => a.id === id);
}

function firstParagraph(article: string | undefined): string {
  if (!article) return "";
  const para = article.split(/\n\n+/)[0] ?? "";
  return para.replace(/\s+/g, " ").trim();
}

function shortDescription(a: Artist): string {
  const role =
    a.type === "painter"
      ? "painter"
      : a.type === "poet"
        ? "poet"
        : "author";
  const span = a.died ? `${a.born}–${a.died}` : a.born;
  const intro = `${a.name} (${span}) — ${a.nationality ?? ""} ${role}${
    a.movement ? `, ${a.movement}` : ""
  }. `.replace(/\s+/g, " ");
  const body = firstParagraph(a.article);
  const combined = (intro + body).slice(0, 300).trim();
  return combined.length > 0
    ? combined + (combined.length === 300 ? "…" : "")
    : `${a.name}, ${a.nationality ?? ""} ${role}.`;
}

export async function generateStaticParams() {
  return loadArtists().map((a) => ({ id: a.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const artist = findArtist(id);
  if (!artist) return { title: "Artist not found" };

  const description = shortDescription(artist);
  const ogImage = artist.image ?? "/og-image.png";

  return {
    title: `${artist.name} — Biography, Works & Story`,
    description,
    alternates: { canonical: `/artists/${artist.id}` },
    openGraph: {
      type: "profile",
      url: `https://www.mydastan.com/artists/${artist.id}`,
      title: `${artist.name} | Dastan`,
      description,
      images: [{ url: ogImage, alt: artist.name }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${artist.name} | Dastan`,
      description,
      images: [ogImage],
    },
  };
}

export default async function ArtistPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const artist = findArtist(id);
  if (!artist) notFound();

  const roleLabel =
    artist.type === "painter"
      ? "Painter"
      : artist.type === "poet"
        ? "Poet"
        : "Author";

  const lifeSpan = artist.died
    ? `${artist.born} – ${artist.died}`
    : `b. ${artist.born}`;

  const paragraphs = (artist.article ?? "")
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  const personJsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: artist.name,
    url: `https://www.mydastan.com/artists/${artist.id}`,
    description: shortDescription(artist),
    jobTitle: roleLabel,
  };
  if (artist.nationality) personJsonLd.nationality = artist.nationality;
  if (artist.born) personJsonLd.birthDate = artist.born;
  if (artist.died) personJsonLd.deathDate = artist.died;
  if (artist.movement) personJsonLd.knowsAbout = artist.movement;
  if (artist.image) {
    personJsonLd.image = `https://www.mydastan.com${artist.image}`;
  }
  if (artist.key_works && artist.key_works.length > 0) {
    personJsonLd.knowsAbout = [
      ...(Array.isArray(personJsonLd.knowsAbout)
        ? (personJsonLd.knowsAbout as string[])
        : personJsonLd.knowsAbout
          ? [personJsonLd.knowsAbout as string]
          : []),
      ...artist.key_works,
    ];
  }

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
        name: "Artists",
        item: "https://www.mydastan.com/artists",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: artist.name,
        item: `https://www.mydastan.com/artists/${artist.id}`,
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
        <Link href="/artists" className="underline underline-offset-4">
          Artists
        </Link>
      </nav>

      <article>
        <header className="mb-8 flex flex-col items-center text-center sm:flex-row sm:items-start sm:text-left sm:gap-8">
          {artist.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={artist.image}
              alt={`Portrait of ${artist.name}`}
              className="mb-4 h-40 w-40 flex-shrink-0 rounded-full object-cover shadow-md sm:mb-0"
            />
          )}
          <div>
            <h1 className="font-[var(--font-heading)] text-4xl leading-tight sm:text-5xl">
              {artist.name}
            </h1>
            <p className="mt-2 text-sm opacity-75">
              {[roleLabel, artist.nationality, lifeSpan]
                .filter(Boolean)
                .join(" · ")}
            </p>
            {artist.movement && (
              <p className="mt-1 text-sm italic opacity-70">
                {artist.movement}
              </p>
            )}
          </div>
        </header>

        {artist.article_title && (
          <h2 className="mb-6 font-[var(--font-heading)] text-2xl italic">
            {artist.article_title}
          </h2>
        )}

        <div className="space-y-5 text-lg leading-relaxed">
          {paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>

        {artist.pull_quote && (
          <blockquote className="my-10 border-l-4 border-sepia/40 pl-6 font-[var(--font-heading)] text-xl italic opacity-90">
            {artist.pull_quote}
          </blockquote>
        )}

        {artist.key_works && artist.key_works.length > 0 && (
          <section className="mt-10">
            <h3 className="mb-3 font-[var(--font-heading)] text-xl">
              Notable Works
            </h3>
            <ul className="list-disc space-y-1 pl-6">
              {artist.key_works.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          </section>
        )}

        <footer className="mt-12 border-t border-sepia/20 pt-6 text-sm opacity-80">
          <Link href="/artists" className="underline underline-offset-4">
            ← Browse all artists, poets & authors
          </Link>
        </footer>
      </article>
    </main>
  );
}
