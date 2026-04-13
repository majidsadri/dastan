"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";

export default function Header() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  const desktopLinks = [
    { href: "/", label: "Today", icon: "canvas" },
    { href: "/gallery", label: "Gallery", icon: "gallery" },
    { href: "/artists", label: "Artists", icon: "artists" },
    { href: "/philosophers", label: "Thinkers", icon: "thinkers" },
    { href: "/archive", label: "Archive", icon: "archive" },
    { href: "/favorites", label: "Saved", icon: "heart" },
    { href: "/profile", label: "Profile", icon: "profile" },
  ];

  // Mobile bottom tabs — Profile is in the header, not here
  const mobileLinks = [
    { href: "/", label: "Today", icon: "canvas" },
    { href: "/gallery", label: "Gallery", icon: "gallery" },
    { href: "/artists", label: "Artists", icon: "artists" },
    { href: "/philosophers", label: "Thinkers", icon: "thinkers" },
    { href: "/favorites", label: "Saved", icon: "heart" },
  ];

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  const isAuthPage = pathname === "/signin" || pathname === "/signup";
  const isGuestPublic = !user && (pathname === "/gallery" || pathname === "/artists" || pathname === "/philosophers" || pathname === "/faal");
  const profileActive = pathname.startsWith("/profile");

  // User avatar and initials
  const displayName = user?.user_metadata?.display_name || "";
  const avatarFile = user?.user_metadata?.avatar || null;
  const initials = displayName
    ? displayName.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  function NavIcon({ icon, active }: { icon: string; active: boolean }) {
    const color = active ? "#8B6914" : "#6B5D4D";
    const sw = "1.4";
    switch (icon) {
      case "canvas":
        return (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
            <line x1="8" y1="18" x2="5" y2="22" />
            <line x1="16" y1="18" x2="19" y2="22" />
            <rect x="5" y="3" width="14" height="15" rx="1" />
            <path d="M5 14l4-3 3 2 4-4 3 3" opacity={active ? "1" : "0.5"} />
          </svg>
        );
      case "gallery":
        return (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="4" width="11" height="13" rx="0.5" />
            <rect x="15" y="4" width="7" height="7" rx="0.5" />
            <rect x="15" y="13" width="7" height="7" rx="0.5" />
            <path d="M7.5 4L8.5 2 9.5 4" opacity="0.4" />
            <path d="M18 4l0.5-1.5L19 4" opacity="0.4" />
          </svg>
        );
      case "archive":
        return (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 3c-2 0-3 1-3 2.5S6 8 8 8h10c1.5 0 2.5-1 2.5-2.5S19.5 3 18 3H8z" />
            <path d="M5 5.5V19c0 1.5 1 2.5 2.5 2.5h0c1.5 0 2.5-1 2.5-2.5V8" />
            <line x1="7.5" y1="21.5" x2="18" y2="21.5" opacity="0.3" />
            <line x1="12" y1="12" x2="18" y2="12" opacity="0.4" />
            <line x1="12" y1="15" x2="17" y2="15" opacity="0.4" />
            <line x1="12" y1="18" x2="16" y2="18" opacity="0.4" />
          </svg>
        );
      case "artists":
        // Painter's palette — a subtle nod to the artist's tool
        return (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3c-5 0-9 3.8-9 8.5 0 3 2 4.5 4 4.5 1.2 0 2-.6 2-1.6 0-.5-.2-.9-.5-1.3-.3-.4-.5-.8-.5-1.3 0-1 .8-1.8 1.8-1.8h2.1c3 0 5.4-2.4 5.4-5.4C17.3 2.4 14.9 3 12 3z" />
            <circle cx="8" cy="9" r="1" fill={color} stroke="none" opacity={active ? "1" : "0.6"} />
            <circle cx="12" cy="6.8" r="1" fill={color} stroke="none" opacity={active ? "1" : "0.6"} />
            <circle cx="15.5" cy="8.5" r="1" fill={color} stroke="none" opacity={active ? "1" : "0.6"} />
          </svg>
        );
      case "thinkers":
        // Classical bust silhouette — a column with a head
        return (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="7" r="3.5" />
            <path d="M7.5 13c1.5-1 3-1.5 4.5-1.5s3 .5 4.5 1.5v2.5h-9V13z" />
            <path d="M5.5 21c0-2.5 1.5-4 3-5" opacity="0.5" />
            <path d="M18.5 21c0-2.5-1.5-4-3-5" opacity="0.5" />
            <line x1="5" y1="21.5" x2="19" y2="21.5" opacity="0.35" />
          </svg>
        );
      case "heart":
        return (
          <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? color : "none"} stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 2h10v19l-5-3.5L7 21V2z" />
            {active && <line x1="10" y1="8" x2="14" y2="8" stroke="#FDFBF7" strokeWidth="1.2" opacity="0.7" />}
          </svg>
        );
      case "profile":
        return (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
            <ellipse cx="12" cy="12" rx="8.5" ry="10" />
            <circle cx="12" cy="9.5" r="3" />
            <path d="M7.5 18.5c0-2.5 2-4.5 4.5-4.5s4.5 2 4.5 4.5" />
          </svg>
        );
      default:
        return null;
    }
  }

  return (
    <>
      {/* ── Top bar ── */}
      <header className="sticky top-0 z-50 bg-parchment/95 backdrop-blur-sm border-b border-warm-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <Link href={user ? "/" : "/signin"} className="group flex items-center gap-2.5 sm:gap-3">
            <Image
              src="/logo.svg"
              alt="Dastan logo"
              width={40}
              height={40}
              className="rounded-xl sm:w-[52px] sm:h-[52px]"
            />
            <div>
              <h1
                className="text-xl sm:text-3xl tracking-tight text-sepia"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Dastan
              </h1>
              <p className="text-[9px] sm:text-xs text-sepia-light tracking-widest uppercase mt-0">
                Every Day, a New Tale
              </p>
            </div>
          </Link>

          {/* Desktop nav — all links including Profile */}
          {user && !isAuthPage && (
            <nav className="hidden sm:flex items-center gap-5 lg:gap-6">
              {desktopLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm tracking-wide transition-colors duration-200 ${
                    isActive(link.href)
                      ? "text-gold font-medium"
                      : "text-sepia-light hover:text-gold"
                  }`}
                  style={{ fontFamily: "var(--font-ui)" }}
                >
                  {link.label}
                </Link>
              ))}
              <button
                onClick={signOut}
                className="text-sm text-sepia-light/40 hover:text-sepia-light transition-colors duration-200 cursor-pointer"
                style={{ fontFamily: "var(--font-ui)" }}
              >
                Sign out
              </button>
            </nav>
          )}

          {/* Guest gallery — sign in / sign up */}
          {isGuestPublic && (
            <div className="flex items-center gap-3 sm:gap-4">
              <Link
                href="/signin"
                className="text-xs sm:text-sm text-sepia-light hover:text-gold transition-colors duration-200"
                style={{ fontFamily: "var(--font-ui)" }}
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm rounded-full
                           bg-sepia text-parchment hover:bg-gold transition-colors duration-200"
                style={{ fontFamily: "var(--font-ui)" }}
              >
                Sign up free
              </Link>
            </div>
          )}

          {/* Mobile — profile avatar in top-right */}
          {user && !isAuthPage && (
            <Link
              href="/profile"
              className={`sm:hidden relative flex items-center justify-center w-9 h-9 rounded-full
                         overflow-hidden border-2 transition-all duration-200 active:scale-90
                         ${profileActive
                           ? "border-gold shadow-sm"
                           : "border-warm-border/80"
                         }`}
            >
              {avatarFile ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`/avatars/${avatarFile}`}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span
                  className={`text-[11px] font-medium leading-none
                             ${profileActive ? "text-gold" : "text-sepia-light"}`}
                  style={{ fontFamily: "var(--font-ui)" }}
                >
                  {initials}
                </span>
              )}
              {/* Active indicator dot */}
              {profileActive && (
                <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2
                               w-1.5 h-1.5 rounded-full bg-gold" />
              )}
            </Link>
          )}
        </div>
      </header>

      {/* ── Bottom tab bar — mobile only, 4 tabs (no Profile) ── */}
      {user && !isAuthPage && (
        <nav
          className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-parchment/95 backdrop-blur-sm
                     border-t border-warm-border"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <div className="flex items-center justify-around px-2 pt-2 pb-1.5">
            {mobileLinks.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex flex-col items-center gap-0.5 min-w-[48px] py-1 rounded-lg
                             transition-colors duration-200
                             ${active ? "text-gold" : "text-sepia-light"}`}
                >
                  <NavIcon icon={link.icon} active={active} />
                  <span
                    className={`text-[10px] tracking-wide ${active ? "font-medium" : ""}`}
                    style={{ fontFamily: "var(--font-ui)" }}
                  >
                    {link.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </>
  );
}
