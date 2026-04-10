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
      </div>
    </footer>
  );
}
