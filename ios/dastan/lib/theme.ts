/**
 * Dastan design tokens.
 *
 * One source of truth for color, spacing, and typography so the
 * entire app feels coherent. Any screen that needs a cream
 * background, a gold accent, or a drop-cap-sized serif reads
 * from here — no magic numbers scattered across `StyleSheet`s.
 *
 * The visual language is museum-editorial: warm neutrals, a single
 * gold accent, generous leading on long-form text, heavy serif
 * display with a quieter serif body and a sans for UI chrome.
 */

export const colors = {
  // warm cream paper
  bg: "#faf7f0",
  bgDeep: "#f4eedb",
  surface: "#ffffff",
  surfaceMuted: "#fbf8f0",

  // ink
  ink: "#2c2418",
  inkSoft: "#5a4e38",
  inkMuted: "#8a7a5c",

  // gilt accent
  gold: "#b89a5b",
  goldDark: "#9a7f44",
  goldLight: "#e8dfc8",

  // signals
  danger: "#c94a4a",

  // misc
  hairline: "#e8dfc8",
  scrim: "rgba(15, 12, 8, 0.55)",
  scrimSoft: "rgba(15, 12, 8, 0.25)",
} as const;

export const fonts = {
  display: "CormorantGaramond_600SemiBold",
  displayItalic: "CormorantGaramond_500Medium_Italic",
  serif: "CrimsonPro_400Regular",
  serifBold: "CrimsonPro_600SemiBold",
  serifItalic: "CrimsonPro_400Regular_Italic",
  ui: "Inter_500Medium",
  uiBold: "Inter_600SemiBold",
} as const;

export const type = {
  eyebrow: {
    fontFamily: fonts.ui,
    fontSize: 11,
    letterSpacing: 2,
    color: colors.gold,
  },
  display: {
    fontFamily: fonts.display,
    fontSize: 46,
    lineHeight: 52,
    color: colors.ink,
  },
  displaySm: {
    fontFamily: fonts.display,
    fontSize: 34,
    lineHeight: 40,
    color: colors.ink,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 26,
    lineHeight: 32,
    color: colors.ink,
  },
  titleSm: {
    fontFamily: fonts.display,
    fontSize: 20,
    lineHeight: 26,
    color: colors.ink,
  },
  body: {
    fontFamily: fonts.serif,
    fontSize: 16,
    lineHeight: 26,
    color: colors.ink,
  },
  bodySm: {
    fontFamily: fonts.serif,
    fontSize: 14,
    lineHeight: 22,
    color: colors.inkSoft,
  },
  meta: {
    fontFamily: fonts.ui,
    fontSize: 12,
    color: colors.inkMuted,
  },
  caption: {
    fontFamily: fonts.serifItalic,
    fontSize: 13,
    color: colors.inkMuted,
    fontStyle: "italic" as const,
  },
  uiLabel: {
    fontFamily: fonts.uiBold,
    fontSize: 12,
    letterSpacing: 1.2,
    color: colors.ink,
  },
} as const;

export const space = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 40,
  xxl: 64,
} as const;

export const radius = {
  sm: 4,
  md: 8,
  lg: 16,
  pill: 999,
} as const;
