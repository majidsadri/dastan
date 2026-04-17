interface Museum {
  name: string;
  url: string;
  domain: string;
}

const MUSEUMS: Museum[] = [
  { name: "The Met",                 url: "https://www.metmuseum.org/art/collection",  domain: "metmuseum.org" },
  { name: "Rijksmuseum",             url: "https://www.rijksmuseum.nl/en/rijksstudio", domain: "rijksmuseum.nl" },
  { name: "Art Institute of Chicago",url: "https://www.artic.edu/collection",          domain: "artic.edu" },
  { name: "National Gallery of Art", url: "https://www.nga.gov/collection.html",       domain: "nga.gov" },
  { name: "Google Arts & Culture",   url: "https://artsandculture.google.com",         domain: "artsandculture.google.com" },
];

const favicon = (domain: string) =>
  `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;

export default function MuseumCollections() {
  return (
    <section
      aria-labelledby="open-museum-collections"
      className="max-w-2xl mx-auto px-6 py-10 sm:py-14"
    >
      {/* ── Eyebrow heading ── */}
      <h2
        id="open-museum-collections"
        className="text-center text-[10px] uppercase tracking-[0.32em] text-sepia-light/55 mb-5"
        style={{ fontFamily: "var(--font-ui)" }}
      >
        Open Museum Collections
      </h2>

      {/* ── Wrapping inline list — flows into ~2 lines ── */}
      <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2.5">
        {MUSEUMS.map((m) => (
          <li key={m.url}>
            <a
              href={m.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-1.5 text-[12.5px] sm:text-[13.5px]
                         text-sepia/85 hover:text-gold transition-colors duration-300"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={favicon(m.domain)}
                alt=""
                width={14}
                height={14}
                loading="lazy"
                referrerPolicy="no-referrer"
                aria-hidden="true"
                className="w-3.5 h-3.5 rounded-[2px] opacity-50 grayscale
                           group-hover:opacity-100 group-hover:grayscale-0
                           transition-all duration-300"
              />
              <span className="whitespace-nowrap">{m.name}</span>
            </a>
          </li>
        ))}
      </ul>

    </section>
  );
}
