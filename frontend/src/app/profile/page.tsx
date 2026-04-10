"use client";

import { useEffect, useState, useCallback } from "react";
import { UserProfile } from "@/lib/types";
import { fetchProfile, createProfile, updateProfile } from "@/lib/api";
import { useAuth } from "@/lib/auth";

/* ── Option lists ── */

const ART_MOVEMENTS = [
  "Impressionism", "Post-Impressionism", "Surrealism", "Renaissance", "Baroque",
  "Ukiyo-e", "Art Nouveau", "Romanticism", "Expressionism", "Cubism",
  "Abstract", "Minimalism", "Pop Art", "Realism", "Pre-Raphaelite",
  "Pointillism", "Fauvism", "Gothic", "Neoclassicism", "Contemporary",
];

const THEMES = [
  "Nature", "Love", "Solitude", "Mythology", "Dreams",
  "Identity", "Freedom", "Death", "Beauty", "Time",
  "Memory", "Journey", "Light", "Silence", "Revolution",
  "Faith", "Exile", "Childhood", "War", "Wonder",
];

const LITERARY_GENRES = [
  "Poetry", "Magical Realism", "Philosophy", "Gothic Fiction", "Existentialism",
  "Romanticism", "Epic", "Memoir", "Short Stories", "Drama",
  "Satire", "Fable", "Literary Fiction", "Historical Fiction", "Mysticism",
];

const REGIONS = [
  "East Asia", "South Asia", "Middle East", "Western Europe", "Eastern Europe",
  "North Africa", "Sub-Saharan Africa", "Latin America", "North America", "Oceania",
  "Central Asia", "Southeast Asia", "Caribbean", "Scandinavia", "Mediterranean",
];

const AVATARS = [
  { file: "davinci.png", label: "Da Vinci" },
  { file: "frida.png", label: "Frida" },
  { file: "monalisa.png", label: "Mona Lisa" },
  { file: "Monet.png", label: "Monet" },
  { file: "van_gogh.png", label: "Van Gogh" },
  { file: "herman_hesse.png", label: "Hesse" },
  { file: "marquez.png", label: "Márquez" },
  { file: "shakespeare.png", label: "Shakespeare" },
  { file: "jane_austen.png", label: "Austen" },
  { file: "hafez.png", label: "Hafez" },
  { file: "tagore.png", label: "Tagore" },
  { file: "shikibu.png", label: "Shikibu" },
];

const TOTAL_STEPS = 6;

/* ── Chip component ── */

function Chip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        inline-flex items-center gap-1.5 px-3.5 py-2 sm:px-4 rounded-full text-[13px] sm:text-sm
        border transition-all duration-200 cursor-pointer select-none
        ${
          selected
            ? "bg-sepia text-parchment border-sepia shadow-sm"
            : "bg-parchment text-sepia-light border-warm-border hover:border-sepia-light hover:text-sepia hover:shadow-sm"
        }
      `}
      style={{ fontFamily: "var(--font-ui)" }}
    >
      {selected && (
        <span className="inline-block w-2 h-2 rounded-full bg-gold" />
      )}
      {label}
    </button>
  );
}

/* ── Progress dots ── */

function ProgressDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-3">
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={`
            block rounded-full transition-all duration-300
            ${
              i + 1 === current
                ? "w-3.5 h-3.5 bg-gold shadow-sm"
                : i + 1 < current
                ? "w-2.5 h-2.5 bg-sepia/30"
                : "w-2.5 h-2.5 border-2 border-warm-border bg-transparent"
            }
          `}
        />
      ))}
    </div>
  );
}

/* ── Step number dot ── */

function StepDot({ number }: { number: number }) {
  return (
    <div className="flex items-center justify-center w-14 h-14 rounded-full bg-sepia/10 mx-auto mb-5">
      <span
        className="text-lg text-sepia font-medium"
        style={{ fontFamily: "var(--font-heading)" }}
      >
        {number}
      </span>
    </div>
  );
}

/* ── Profile view (when profile exists) ── */

function ProfileView({
  profile,
  onEdit,
  onSignOut,
}: {
  profile: UserProfile;
  onEdit: () => void;
  onSignOut: () => void;
}) {
  const sections: { label: string; icon: string; items: string[] }[] = [
    { label: "Art Movements", icon: "palette", items: profile.art_movements },
    { label: "Themes", icon: "spark", items: profile.themes },
    { label: "Literary Genres", icon: "book", items: profile.literary_genres },
    { label: "Regions", icon: "globe", items: profile.regions },
    { label: "Art Periods", icon: "clock", items: profile.art_periods },
    { label: "Favorite Artists", icon: "brush", items: profile.favorite_artists },
    { label: "Favorite Authors", icon: "pen", items: profile.favorite_authors },
    { label: "Languages", icon: "scroll", items: profile.preferred_languages },
  ].filter((s) => s.items.length > 0);

  function SectionIcon({ icon }: { icon: string }) {
    const props = { width: 14, height: 14, viewBox: "0 0 24 24", fill: "none", stroke: "#8B6914", strokeWidth: "1.5", strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
    switch (icon) {
      case "palette": return <svg {...props}><circle cx="13.5" cy="6.5" r="2" /><circle cx="17.5" cy="10.5" r="2" /><circle cx="8.5" cy="7.5" r="2" /><circle cx="6.5" cy="12" r="2" /><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.93 0 1.5-.75 1.5-1.5 0-.39-.15-.74-.38-1.01A1.49 1.49 0 0114.5 18c.83 0 1.5-.67 1.5-1.5 0-5.5-4.5-10-10-10z" /></svg>;
      case "spark": return <svg {...props}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>;
      case "book": return <svg {...props}><path d="M4 19.5A2.5 2.5 0 016.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" /></svg>;
      case "globe": return <svg {...props}><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" /></svg>;
      case "clock": return <svg {...props}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>;
      case "brush": return <svg {...props}><path d="M12 19l7-7 3 3-7 7-3-3z" /><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" /></svg>;
      case "pen": return <svg {...props}><path d="M17 3a2.828 2.828 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z" /></svg>;
      case "scroll": return <svg {...props}><path d="M8 3c-2 0-3 1-3 2.5S6 8 8 8h10c1.5 0 2.5-1 2.5-2.5S19.5 3 18 3H8z" /><path d="M5 5.5V19c0 1.5 1 2.5 2.5 2.5s2.5-1 2.5-2.5V8" /></svg>;
      default: return null;
    }
  }

  return (
    <div className="animate-fade-in">
      {/* Hero card with avatar and name */}
      <div className="paper-card overflow-hidden mb-6 sm:mb-8">
        {/* Warm gradient top */}
        <div
          className="px-5 sm:px-8 pt-8 sm:pt-12 pb-6 sm:pb-8 text-center"
          style={{
            background: "linear-gradient(180deg, rgba(139,105,20,0.05) 0%, transparent 100%)",
          }}
        >
          {profile.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`/avatars/${profile.avatar}`}
              alt="Profile avatar"
              className="w-20 h-20 sm:w-28 sm:h-28 rounded-full object-cover mx-auto mb-4
                        border-2 border-gold/20 shadow-md"
            />
          ) : (
            <div className="inline-flex items-center justify-center w-20 h-20 sm:w-28 sm:h-28
                          rounded-full bg-linen border-2 border-warm-border mb-4">
              <span
                className="text-2xl sm:text-4xl text-sepia"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                {profile.display_name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <h2
            className="text-2xl sm:text-4xl text-sepia"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            {profile.display_name}
          </h2>
          <p
            className="text-[10px] sm:text-xs text-sepia-light/40 uppercase tracking-[0.2em] mt-1.5"
            style={{ fontFamily: "var(--font-ui)" }}
          >
            {profile.art_movements.length + profile.literary_genres.length + profile.themes.length} interests curated
          </p>
        </div>

        {/* Edit button inside the card */}
        <div className="px-5 sm:px-8 pb-5 sm:pb-6 flex justify-center">
          <button
            onClick={onEdit}
            className="px-6 py-2 rounded-full text-xs sm:text-sm
                      border border-warm-border text-sepia-light
                      hover:border-sepia/30 hover:text-sepia active:scale-95
                      transition-all duration-200 cursor-pointer"
            style={{ fontFamily: "var(--font-ui)" }}
          >
            Edit profile
          </button>
        </div>
      </div>

      {/* Preference sections — compact cards */}
      <div className="space-y-3 sm:space-y-4">
        {sections.map((section) => (
          <div key={section.label} className="paper-card px-4 sm:px-6 py-4 sm:py-5">
            <div className="flex items-center gap-2 mb-3">
              <SectionIcon icon={section.icon} />
              <h3
                className="text-xs sm:text-sm uppercase tracking-[0.12em] text-sepia-light/60"
                style={{ fontFamily: "var(--font-ui)" }}
              >
                {section.label}
              </h3>
            </div>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {section.items.map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1 sm:py-1.5
                            rounded-full text-[11px] sm:text-xs
                            bg-linen text-sepia border border-warm-border/60"
                  style={{ fontFamily: "var(--font-ui)" }}
                >
                  <span className="inline-block w-1 h-1 rounded-full bg-gold/60" />
                  {item}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Sign out */}
      <div className="mt-8 sm:mt-10 flex justify-center">
        <button
          onClick={onSignOut}
          className="text-xs text-sepia-light/30 hover:text-sepia-light/60
                     transition-colors duration-200 cursor-pointer py-2 px-4"
          style={{ fontFamily: "var(--font-ui)" }}
        >
          Sign out
        </button>
      </div>
    </div>
  );
}

/* ── Main page component ── */

export default function ProfilePage() {
  const { signOut } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  // Onboarding form state
  const [step, setStep] = useState(1);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [artMovements, setArtMovements] = useState<string[]>([]);
  const [themes, setThemes] = useState<string[]>([]);
  const [literaryGenres, setLiteraryGenres] = useState<string[]>([]);
  const [regions, setRegions] = useState<string[]>([]);

  useEffect(() => {
    fetchProfile()
      .then((p) => {
        setProfile(p);
        if (p) {
          setAvatar(p.avatar);
          setDisplayName(p.display_name);
          setArtMovements(p.art_movements);
          setThemes(p.themes);
          setLiteraryGenres(p.literary_genres);
          setRegions(p.regions);
        }
      })
      .catch(() =>
        setError("Could not load profile. Make sure the backend server is running.")
      )
      .finally(() => setLoading(false));
  }, []);

  const toggleItem = useCallback(
    (list: string[], setList: (v: string[]) => void, item: string) => {
      setList(
        list.includes(item)
          ? list.filter((x) => x !== item)
          : [...list, item]
      );
    },
    []
  );

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      const data = {
        display_name: displayName.trim(),
        avatar,
        art_movements: artMovements,
        art_periods: [],
        favorite_artists: [],
        literary_genres: literaryGenres,
        favorite_authors: [],
        preferred_languages: [],
        themes,
        regions,
      };

      let saved: UserProfile;
      if (profile) {
        saved = await updateProfile(data);
      } else {
        saved = await createProfile(data);
      }
      setProfile(saved);
      setEditing(false);
      setStep(1);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      console.error("Profile save failed:", msg);
      setError(`Failed to save profile: ${msg}`);
    } finally {
      setSaving(false);
    }
  }

  function startEdit() {
    if (profile) {
      setAvatar(profile.avatar);
      setDisplayName(profile.display_name);
      setArtMovements(profile.art_movements);
      setThemes(profile.themes);
      setLiteraryGenres(profile.literary_genres);
      setRegions(profile.regions);
    }
    setEditing(true);
    setStep(1);
  }

  const showOnboarding = !profile || editing;

  /* ── Render step content ── */

  function renderStep() {
    switch (step) {
      case 1:
        return (
          <div className="animate-fade-in" key="step-1">
            <StepDot number={1} />
            <h3
              className="text-2xl sm:text-3xl text-sepia text-center mb-2"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Choose your avatar
            </h3>
            <p className="text-sepia-light text-center mb-8 text-sm">
              Pick a portrait that speaks to you
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
              {AVATARS.map((a) => (
                <button
                  key={a.file}
                  type="button"
                  onClick={() => setAvatar(a.file)}
                  className="flex flex-col items-center gap-1.5 sm:gap-2 group cursor-pointer"
                >
                  <div
                    className={`
                      w-16 h-16 sm:w-24 sm:h-24 rounded-full overflow-hidden border-3 transition-all duration-200
                      ${
                        avatar === a.file
                          ? "border-gold shadow-lg scale-110"
                          : "border-warm-border group-hover:border-sepia-light group-hover:shadow-md"
                      }
                    `}
                  >
                    <img
                      src={`/avatars/${a.file}`}
                      alt={a.label}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span
                    className={`text-xs transition-colors ${
                      avatar === a.file ? "text-gold font-medium" : "text-sepia-light"
                    }`}
                    style={{ fontFamily: "var(--font-ui)" }}
                  >
                    {a.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="animate-fade-in" key="step-2">
            <StepDot number={2} />
            <h3
              className="text-2xl sm:text-3xl text-sepia text-center mb-2"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              What&apos;s your name?
            </h3>
            <p className="text-sepia-light text-center mb-8 text-sm">
              How you&apos;d like to be greeted
            </p>
            <div className="max-w-sm mx-auto">
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                className="w-full px-5 py-3.5 rounded-xl border border-warm-border bg-parchment text-sepia
                           text-center text-lg placeholder:text-sepia-light/40
                           focus:outline-2 focus:outline-gold focus:outline-offset-2 transition-colors"
                style={{ fontFamily: "var(--font-body)", fontSize: "16px" }}
                autoFocus
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="animate-fade-in" key="step-3">
            <StepDot number={3} />
            <h3
              className="text-2xl sm:text-3xl text-sepia text-center mb-2"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Which art movements speak to you?
            </h3>
            <p className="text-sepia-light text-center mb-8 text-sm">
              Select as many as you like
            </p>
            <div className="flex flex-wrap justify-center gap-2.5">
              {ART_MOVEMENTS.map((m) => (
                <Chip
                  key={m}
                  label={m}
                  selected={artMovements.includes(m)}
                  onClick={() => toggleItem(artMovements, setArtMovements, m)}
                />
              ))}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="animate-fade-in" key="step-4">
            <StepDot number={4} />
            <h3
              className="text-2xl sm:text-3xl text-sepia text-center mb-2"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              What themes fascinate you?
            </h3>
            <p className="text-sepia-light text-center mb-8 text-sm">
              The ideas that keep you thinking
            </p>
            <div className="flex flex-wrap justify-center gap-2.5">
              {THEMES.map((t) => (
                <Chip
                  key={t}
                  label={t}
                  selected={themes.includes(t)}
                  onClick={() => toggleItem(themes, setThemes, t)}
                />
              ))}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="animate-fade-in" key="step-5">
            <StepDot number={5} />
            <h3
              className="text-2xl sm:text-3xl text-sepia text-center mb-2"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Which literary genres draw you in?
            </h3>
            <p className="text-sepia-light text-center mb-8 text-sm">
              The written worlds you gravitate toward
            </p>
            <div className="flex flex-wrap justify-center gap-2.5">
              {LITERARY_GENRES.map((g) => (
                <Chip
                  key={g}
                  label={g}
                  selected={literaryGenres.includes(g)}
                  onClick={() => toggleItem(literaryGenres, setLiteraryGenres, g)}
                />
              ))}
            </div>
          </div>
        );

      case 6:
        return (
          <div className="animate-fade-in" key="step-6">
            <StepDot number={6} />
            <h3
              className="text-2xl sm:text-3xl text-sepia text-center mb-2"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Which regions of the world intrigue you?
            </h3>
            <p className="text-sepia-light text-center mb-8 text-sm">
              Cultures and places that spark your curiosity
            </p>
            <div className="flex flex-wrap justify-center gap-2.5">
              {REGIONS.map((r) => (
                <Chip
                  key={r}
                  label={r}
                  selected={regions.includes(r)}
                  onClick={() => toggleItem(regions, setRegions, r)}
                />
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  }

  const canContinue =
    step === 2 ? displayName.trim().length > 0 : true;

  return (
    <div className="max-w-2xl mx-auto px-3 sm:px-6 py-6 sm:py-16 pb-24 sm:pb-20 animate-fade-in">
      {/* Page header — only show when onboarding/editing */}
      {showOnboarding && (
        <div className="text-center mb-6 sm:mb-10">
          <p
            className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-sepia-light/50 mb-2 sm:mb-3"
            style={{ fontFamily: "var(--font-ui)" }}
          >
            {profile ? "Edit profile" : "Welcome to Dastan"}
          </p>
          <h2
            className="text-2xl sm:text-4xl text-sepia"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            {profile ? "Your Artistic Profile" : "Tell us what moves you"}
          </h2>
          <div className="dot-divider mt-4 sm:mt-5"><span /><span /><span /><span /><span /></div>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="paper-card p-5 animate-pulse-warm">
              <div className="h-5 bg-warm-border/50 rounded w-2/3 mb-2" />
              <div className="h-4 bg-warm-border/50 rounded w-1/3" />
            </div>
          ))}
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="text-center py-4 mb-6">
          <p className="text-sm text-red-600" style={{ fontFamily: "var(--font-ui)" }}>
            {error}
          </p>
        </div>
      )}

      {/* Profile view */}
      {!loading && !showOnboarding && profile && (
        <ProfileView profile={profile} onEdit={startEdit} onSignOut={signOut} />
      )}

      {/* Onboarding / Edit form */}
      {!loading && showOnboarding && (
        <div className="paper-card p-5 sm:p-10">
          {/* Progress dots */}
          <div className="mb-10">
            <ProgressDots current={step} total={TOTAL_STEPS} />
          </div>

          {/* Step content */}
          {renderStep()}

          {/* Navigation buttons */}
          <div className="flex items-center justify-between mt-10 pt-6 border-t border-warm-border">
            <div>
              {step > 1 && (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="text-sm text-sepia-light hover:text-sepia transition-colors cursor-pointer"
                  style={{ fontFamily: "var(--font-ui)" }}
                >
                  Back
                </button>
              )}
              {editing && step === 1 && (
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="text-sm text-sepia-light hover:text-sepia transition-colors cursor-pointer"
                  style={{ fontFamily: "var(--font-ui)" }}
                >
                  Cancel
                </button>
              )}
            </div>

            <div>
              {step < TOTAL_STEPS ? (
                <button
                  type="button"
                  onClick={() => setStep(step + 1)}
                  disabled={!canContinue}
                  className={`
                    px-6 py-2.5 rounded-full text-sm font-medium tracking-wide
                    transition-all duration-200 cursor-pointer
                    ${
                      canContinue
                        ? "bg-gold text-parchment hover:bg-gold-hover"
                        : "bg-warm-border text-sepia-light/50 cursor-not-allowed"
                    }
                  `}
                  style={{ fontFamily: "var(--font-ui)" }}
                >
                  Continue
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="px-6 py-2.5 rounded-full text-sm font-medium tracking-wide
                             bg-gold text-parchment hover:bg-gold-hover transition-colors duration-200 cursor-pointer
                             disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ fontFamily: "var(--font-ui)" }}
                >
                  {saving ? "Saving..." : profile ? "Save Changes" : "Complete Profile"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
