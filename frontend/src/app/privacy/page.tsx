import Link from "next/link";

/**
 * Privacy Policy — the URL Apple, Supabase, and the App Store need.
 *
 * Written plainly because legal prose pretending to be friendly is
 * worse than either. Kept in an editorial layout that matches the
 * rest of Dastan: parchment, serif, generous leading.
 *
 * The effective date is rendered at request time so we never have
 * to remember to bump it manually.
 */
export default function PrivacyPolicyPage() {
  const updated = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date());

  return (
    <main className="bg-parchment text-sepia min-h-screen py-16 px-6">
      <article className="max-w-2xl mx-auto">
        <header className="text-center mb-12">
          <p className="font-ui text-xs tracking-[0.3em] text-[#b89a5b] uppercase mb-3">
            The fine print
          </p>
          <h1 className="font-heading text-4xl md:text-5xl text-[#2c2418] mb-4">
            Privacy Policy
          </h1>
          <p className="font-body italic text-[#8a7a5c] text-sm">
            Effective {updated}
          </p>
        </header>

        <section className="font-body text-[17px] leading-8 space-y-6 text-[#2c2418]">
          <p>
            Dastan is a small, independent project. We collect only what is
            strictly necessary to give you a personal daily ritual of art,
            literature, and thought — and we do not sell any of it.
          </p>

          <h2 className="font-heading text-2xl text-[#2c2418] mt-10 mb-2">
            What we collect
          </h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>Account identifier.</strong> An email address when you
              sign up with email, or a stable Apple ID token when you use
              &ldquo;Sign in with Apple.&rdquo; If you use Apple&rsquo;s
              private relay, we only ever see the relay address.
            </li>
            <li>
              <strong>Profile preferences.</strong> The display name, avatar,
              art movements, themes, literary genres, and regions you choose
              during onboarding.
            </li>
            <li>
              <strong>Reading history.</strong> Which paintings, pages, and
              verses you&rsquo;ve opened or saved, so we don&rsquo;t repeat
              yesterday.
            </li>
          </ul>

          <h2 className="font-heading text-2xl text-[#2c2418] mt-10 mb-2">
            What we do not collect
          </h2>
          <p>
            We do not use advertising SDKs, tracking pixels, or third-party
            analytics that profile you across the web. We do not sell or
            rent your data to anyone, ever.
          </p>

          <h2 className="font-heading text-2xl text-[#2c2418] mt-10 mb-2">
            How we use it
          </h2>
          <p>
            Preferences and reading history shape the daily canvas — so the
            painting that greets you tomorrow feels tuned to you. Your email
            or Apple identifier is used only to sign you in and, on rare
            occasions, to send a transactional email such as a confirmation
            link.
          </p>

          <h2 className="font-heading text-2xl text-[#2c2418] mt-10 mb-2">
            Where it lives
          </h2>
          <p>
            Authentication and profile data are stored with{" "}
            <a
              href="https://supabase.com/privacy"
              className="underline decoration-[#b89a5b] decoration-1 underline-offset-4 hover:text-[#b89a5b]"
              target="_blank"
              rel="noopener noreferrer"
            >
              Supabase
            </a>
            , our backend provider. Apple Sign-In tokens are handled by Apple
            and Supabase per{" "}
            <a
              href="https://www.apple.com/legal/privacy/en-ww/"
              className="underline decoration-[#b89a5b] decoration-1 underline-offset-4 hover:text-[#b89a5b]"
              target="_blank"
              rel="noopener noreferrer"
            >
              Apple&rsquo;s privacy policy
            </a>
            . Everything else lives on our own servers.
          </p>

          <h2 className="font-heading text-2xl text-[#2c2418] mt-10 mb-2">
            Children
          </h2>
          <p>
            Dastan is not directed at children under 13 and we do not
            knowingly collect information from them.
          </p>

          <h2 className="font-heading text-2xl text-[#2c2418] mt-10 mb-2">
            Your rights
          </h2>
          <p>
            You can edit your profile anytime from the Profile page. To
            delete your account and all associated data, email us at the
            address below and we&rsquo;ll handle it within a few days.
          </p>

          <h2 className="font-heading text-2xl text-[#2c2418] mt-10 mb-2">
            Changes
          </h2>
          <p>
            If this policy changes in any meaningful way, we&rsquo;ll update
            the effective date above and, when the change affects how we
            handle your data, notify you in-app.
          </p>

          <h2 className="font-heading text-2xl text-[#2c2418] mt-10 mb-2">
            Contact
          </h2>
          <p>
            Questions, deletion requests, or anything else —{" "}
            <a
              href="mailto:hello@mydastan.com"
              className="underline decoration-[#b89a5b] decoration-1 underline-offset-4 hover:text-[#b89a5b]"
            >
              hello@mydastan.com
            </a>
            .
          </p>
        </section>

        <footer className="mt-16 pt-8 border-t border-[#e8dfc8] text-center">
          <Link
            href="/"
            className="font-ui text-xs tracking-[0.25em] text-[#8a7a5c] hover:text-[#b89a5b] uppercase"
          >
            ← Back to Dastan
          </Link>
        </footer>
      </article>
    </main>
  );
}
