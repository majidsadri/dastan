import fs from "fs";
import path from "path";
import Link from "next/link";

type Scene = {
  id: string;
  number: number;
  title: string;
  chapter: string;
  theme: string;
  chinese_text: string;
  essay: string;
  pull_quote: string;
  editor_note?: string;
};

type Catalog = {
  title: string;
  author: string;
  published: string;
  translator?: string;
  curator_note?: string;
  curator_signature?: string;
  scenes: Scene[];
};

const ROMAN = [
  "",
  "I",
  "II",
  "III",
  "IV",
  "V",
  "VI",
  "VII",
  "VIII",
  "IX",
  "X",
  "XI",
  "XII",
];

function loadCatalog(): Catalog | null {
  try {
    const raw = fs.readFileSync(
      path.join(process.cwd(), "public", "tao", "catalog.json"),
      "utf-8",
    );
    return JSON.parse(raw) as Catalog;
  } catch {
    return null;
  }
}

const INK = "#D8E0D4";
const INK_SOFT = "rgba(216,224,212,0.88)";
const INK_MUTED = "rgba(216,224,212,0.55)";
const JADE = "#7FA882";
const PAPER_BG =
  "linear-gradient(178deg, #0E1810 0%, #162018 30%, #1F2E24 62%, #0E1810 100%)";

export default function TaoPage() {
  const catalog = loadCatalog();
  if (!catalog) {
    return (
      <main
        className="mx-auto w-full max-w-2xl px-6 py-16"
        style={{ color: INK }}
      >
        <p>The reading room is currently unavailable.</p>
      </main>
    );
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Book",
    name: catalog.title,
    author: { "@type": "Person", name: catalog.author },
    datePublished: catalog.published,
    inLanguage: "zh",
    url: "https://www.mydastan.com/tao",
  };

  return (
    <main style={{ background: PAPER_BG, minHeight: "100vh", color: INK }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="relative mx-auto flex min-h-[68vh] w-full max-w-5xl flex-col items-center justify-center px-5 py-24 text-center">
          <Link
            href="/signin"
            className="absolute left-5 top-5 text-[11px] uppercase tracking-[0.3em] transition hover:opacity-100"
            style={{
              fontFamily: "var(--font-ui)",
              color: INK_MUTED,
            }}
          >
            ← Dastan
          </Link>

          <p
            className="mb-5 text-[10px] uppercase tracking-[0.6em] sm:text-[11px]"
            style={{ fontFamily: "var(--font-ui)", color: INK_MUTED }}
          >
            Twelve Passages
          </p>

          <div
            aria-hidden
            className="mb-3 text-[110px] leading-none opacity-20 sm:text-[140px]"
            style={{ fontFamily: "var(--font-heading)", color: JADE }}
          >
            道
          </div>

          <h1
            className="font-[family-name:var(--font-heading)] text-6xl italic leading-[0.95] sm:text-8xl"
            style={{ color: INK }}
          >
            {catalog.title}
          </h1>

          <p
            className="mt-6 font-[family-name:var(--font-heading)] italic sm:text-lg"
            style={{ color: INK_MUTED }}
          >
            {catalog.author}
            <span className="mx-3 opacity-40">·</span>
            {catalog.published}
          </p>

          {catalog.translator ? (
            <p
              className="mt-2 text-[11px] italic tracking-wide"
              style={{
                fontFamily: "var(--font-heading)",
                color: INK_MUTED,
              }}
            >
              {catalog.translator}
            </p>
          ) : null}
        </div>
      </section>

      {/* Editor's note */}
      {catalog.curator_note ? (
        <section className="relative">
          <div className="mx-auto max-w-2xl px-6 py-16">
            <div
              className="mx-auto mb-8 h-px w-16"
              style={{ background: JADE, opacity: 0.45 }}
            />
            <p
              className="mb-4 text-center text-[11px] uppercase tracking-[0.35em]"
              style={{ fontFamily: "var(--font-ui)", color: INK_MUTED }}
            >
              Editor&rsquo;s Note
            </p>
            <div className="space-y-5 text-center">
              {catalog.curator_note
                .split(/\n\n+/)
                .map((p, i) => (
                  <p
                    key={i}
                    className="text-[1.05rem] italic leading-[1.85] sm:text-[1.1rem]"
                    style={{
                      fontFamily: "var(--font-heading)",
                      color: INK_SOFT,
                    }}
                  >
                    {p}
                  </p>
                ))}
            </div>
            {catalog.curator_signature ? (
              <p
                className="mt-8 text-center text-[10px] uppercase tracking-[0.3em]"
                style={{
                  fontFamily: "var(--font-ui)",
                  color: INK_MUTED,
                }}
              >
                {catalog.curator_signature}
              </p>
            ) : null}
          </div>
        </section>
      ) : null}

      {/* Stations */}
      <section>
        <div className="mx-auto max-w-2xl px-6 pb-28 pt-4">
          {catalog.scenes.map((scene, i) => (
            <article
              key={scene.id}
              id={scene.id}
              className="border-t py-16"
              style={{ borderColor: "rgba(216,224,212,0.12)" }}
            >
              <header className="mb-8 text-center">
                <p
                  className="mb-2 text-[10px] uppercase tracking-[0.4em]"
                  style={{ fontFamily: "var(--font-ui)", color: INK_MUTED }}
                >
                  Passage {ROMAN[scene.number] ?? scene.number}
                </p>
                <h2
                  className="font-[family-name:var(--font-heading)] text-3xl italic sm:text-4xl"
                  style={{ color: INK }}
                >
                  {scene.title}
                </h2>
                <p
                  className="mt-2 text-[10px] uppercase tracking-[0.3em]"
                  style={{ fontFamily: "var(--font-ui)", color: INK_MUTED }}
                >
                  {scene.chapter}
                </p>
              </header>

              <blockquote
                className="mx-auto mb-10 max-w-md text-center text-lg leading-relaxed sm:text-xl"
                style={{
                  fontFamily: "var(--font-heading)",
                  color: JADE,
                  opacity: 0.9,
                }}
              >
                {scene.chinese_text}
              </blockquote>

              <div className="space-y-5">
                {scene.essay.split(/\n\n+/).map((p, j) => (
                  <p
                    key={j}
                    className="text-[1.05rem] leading-[1.85] sm:text-[1.1rem]"
                    style={{
                      fontFamily: "var(--font-body)",
                      color: INK_SOFT,
                    }}
                  >
                    {p}
                  </p>
                ))}
              </div>

              <div
                className="mt-10 border-l-2 py-2 pl-5 italic"
                style={{ borderColor: JADE }}
              >
                <p
                  className="text-lg leading-snug sm:text-xl"
                  style={{
                    fontFamily: "var(--font-heading)",
                    color: INK,
                  }}
                >
                  {scene.pull_quote}
                </p>
              </div>

              {scene.editor_note ? (
                <p
                  className="mx-auto mt-8 max-w-md text-center text-[13px] italic leading-relaxed"
                  style={{
                    fontFamily: "var(--font-heading)",
                    color: INK_MUTED,
                  }}
                >
                  {scene.editor_note}
                </p>
              ) : null}
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
