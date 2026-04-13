import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-warm-border bg-linen/50 mt-12 sm:mt-20 dot-pattern-sparse
                       pb-20 sm:pb-0">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 text-center">
        <p
          className="text-sm text-sepia-light italic"
          style={{ fontFamily: "var(--font-body)" }}
        >
          Beauty, one day at a time.
        </p>
        <p className="text-xs text-sepia-light/40 mt-2">
          &copy; {new Date().getFullYear()} Dastan
        </p>
        <nav
          className="mt-3 flex items-center justify-center gap-5 text-xs"
          style={{ fontFamily: "var(--font-ui)", letterSpacing: "0.15em" }}
        >
          <a
            href="https://www.instagram.com/dastan.journal/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Follow Dastan on Instagram"
            className="text-sepia-light/70 hover:text-sepia tracking-wide uppercase transition-colors inline-flex items-center gap-1.5"
          >
            {/* Simple Instagram glyph — outlined square with dot, no brand logo */}
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="3" y="3" width="18" height="18" rx="5" />
              <circle cx="12" cy="12" r="4" />
              <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" stroke="none" />
            </svg>
            Instagram
          </a>
          <span className="text-sepia-light/30" aria-hidden="true">·</span>
          <Link
            href="/privacy"
            className="text-sepia-light/70 hover:text-sepia tracking-wide uppercase transition-colors"
          >
            Privacy
          </Link>
        </nav>
      </div>
    </footer>
  );
}
