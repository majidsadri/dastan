import { useEffect, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import { fonts } from "../lib/theme";

/**
 * PaintingLoader — the 3-second opening ritual of Dastan.
 *
 * This is the curated opening experience, not a waiting state. When
 * the app mounts, the user sees a museum-wall cream canvas and a
 * single elegant gesture: the word DASTAN being inked onto paper
 * and then gilded, as if a calligrapher were at work.
 *
 * Timeline (3000ms total, staged):
 *
 *   0.00 – 0.60s   Top ornament rule draws outward from center,
 *                  a small gilt star settles between the rules.
 *   0.70 – 1.40s   D · A · S · T · A · N — each letter fades up
 *                  (translateY, scale 0.9→1, opacity 0→1), 80ms
 *                  staggered. Feels like letters being set, one
 *                  at a time, by an unhurried hand.
 *   1.50 – 2.20s   Gilding sweep — each letter's color transitions
 *                  from deep ink (#2c2418) to gilt (#b89a5b), left
 *                  to right, like gold leaf being applied across
 *                  the wordmark.
 *   2.30 – 2.90s   Italic subtitle fades up below. Bottom pip row
 *                  resolves at the end.
 *   Ambient        Gentle breathing pulse on the whole wordmark.
 *
 * Fonts: the custom display face may not be loaded yet when this
 * renders (we're often gating *on* font loading). iOS falls back
 * to the system serif, which reads well at 42pt. Per-letter cells
 * are fixed-width so font swaps don't cause layout jumps.
 */

const CANVAS_BG = "#faf7f0";
const INK = "#2c2418";
const GOLD = "#b89a5b";
const GOLD_DARK = "#9a7f44";
const INK_SOFT = "rgba(44, 36, 24, 0.55)";

const LETTERS = ["D", "A", "S", "T", "A", "N"] as const;

// Per-letter entrance offset (ms) — total entrance lasts 700ms.
const ENTRANCE_START = 700;
const LETTER_STAGGER = 80;
const LETTER_DURATION = 420;

// Gilding sweep (color transition from ink → gold).
const GILD_START = 1500;
const GILD_STAGGER = 90;
const GILD_DURATION = 560;

// Outro: subtitle + pips.
const SUBTITLE_AT = 2300;
const PIPS_AT = 2700;

export function PaintingLoader({
  subtitle = "A daily ritual of painting, literature, and thought.",
}: {
  subtitle?: string;
}) {
  // Top ornament
  const ruleScale = useRef(new Animated.Value(0)).current;
  const starOp = useRef(new Animated.Value(0)).current;

  // Per-letter entrance (opacity + translateY + scale)
  const letterOps = useRef(LETTERS.map(() => new Animated.Value(0))).current;
  const letterYs = useRef(LETTERS.map(() => new Animated.Value(10))).current;
  const letterScales = useRef(LETTERS.map(() => new Animated.Value(0.9)))
    .current;

  // Per-letter gilding (0 = ink, 1 = gold)
  const letterGilds = useRef(LETTERS.map(() => new Animated.Value(0))).current;

  // Outro
  const subtitleOp = useRef(new Animated.Value(0)).current;
  const subtitleY = useRef(new Animated.Value(6)).current;
  const pipsOp = useRef(new Animated.Value(0)).current;

  // Ambient breathing pulse
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // ── Top ornament rule + star ──────────────────────────────────
    Animated.sequence([
      Animated.delay(150),
      Animated.parallel([
        Animated.timing(ruleScale, {
          toValue: 1,
          duration: 550,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.delay(300),
          Animated.timing(starOp, {
            toValue: 1,
            duration: 350,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]).start();

    // ── Letter entrance (staggered) ───────────────────────────────
    LETTERS.forEach((_, i) => {
      const delay = ENTRANCE_START + i * LETTER_STAGGER;
      Animated.parallel([
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(letterOps[i], {
            toValue: 1,
            duration: LETTER_DURATION,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(letterYs[i], {
            toValue: 0,
            duration: LETTER_DURATION,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(letterScales[i], {
            toValue: 1,
            duration: LETTER_DURATION,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    });

    // ── Gilding sweep (ink → gold, left to right) ─────────────────
    // Color interpolation can't use the native driver, so gilding
    // runs on the JS driver — it's a small, subtle animation.
    LETTERS.forEach((_, i) => {
      const delay = GILD_START + i * GILD_STAGGER;
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(letterGilds[i], {
          toValue: 1,
          duration: GILD_DURATION,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: false,
        }),
      ]).start();
    });

    // ── Subtitle + pips outro ─────────────────────────────────────
    Animated.sequence([
      Animated.delay(SUBTITLE_AT),
      Animated.parallel([
        Animated.timing(subtitleOp, {
          toValue: 1,
          duration: 500,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(subtitleY, {
          toValue: 0,
          duration: 500,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    Animated.sequence([
      Animated.delay(PIPS_AT),
      Animated.timing(pipsOp, {
        toValue: 1,
        duration: 350,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();

    // ── Ambient breathing pulse (loops forever) ───────────────────
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [
    ruleScale,
    starOp,
    letterOps,
    letterYs,
    letterScales,
    letterGilds,
    subtitleOp,
    subtitleY,
    pipsOp,
    pulse,
  ]);

  const pulseOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.88, 1],
  });

  return (
    <View style={styles.root}>
      {/* ── Top ornament: ——— ❋ ——— ───────────────────────────── */}
      <View style={styles.ornament}>
        <Animated.View
          style={[
            styles.rule,
            { transform: [{ scaleX: ruleScale }] },
          ]}
        />
        <Animated.Text style={[styles.star, { opacity: starOp }]}>
          ❋
        </Animated.Text>
        <Animated.View
          style={[
            styles.rule,
            { transform: [{ scaleX: ruleScale }] },
          ]}
        />
      </View>

      {/* ── Wordmark: D A S T A N ──────────────────────────────── */}
      {/* Two-node structure per letter: an outer Animated.View owns
          opacity + transform (native driver) while the inner
          Animated.Text owns color (JS driver). Splitting them onto
          distinct animated nodes is required — RN will throw
          "Attempting to run JS driven animation on animated node
          that has been moved to native" if a single node mixes
          native- and JS-driven style props. */}
      <Animated.View style={[styles.wordmark, { opacity: pulseOpacity }]}>
        {LETTERS.map((L, i) => {
          const color = letterGilds[i].interpolate({
            inputRange: [0, 1],
            outputRange: [INK, GOLD],
          });
          return (
            <View key={`${L}-${i}`} style={styles.letterCell}>
              <Animated.View
                style={{
                  opacity: letterOps[i],
                  transform: [
                    { translateY: letterYs[i] },
                    { scale: letterScales[i] },
                  ],
                }}
              >
                <Animated.Text style={[styles.letter, { color }]}>
                  {L}
                </Animated.Text>
              </Animated.View>
            </View>
          );
        })}
      </Animated.View>

      {/* ── Italic subtitle lede ──────────────────────────────── */}
      <Animated.Text
        style={[
          styles.subtitle,
          {
            opacity: subtitleOp,
            transform: [{ translateY: subtitleY }],
          },
        ]}
      >
        {subtitle}
      </Animated.Text>

      {/* ── Bottom pips ───────────────────────────────────────── */}
      <Animated.View style={[styles.pips, { opacity: pipsOp }]}>
        <View style={styles.pip} />
        <View style={[styles.pip, styles.pipCenter]} />
        <View style={styles.pip} />
      </Animated.View>
    </View>
  );
}

/**
 * useIntroGate — parent-side minimum display time for PaintingLoader.
 *
 * The ritual runs 3000ms, so the default minimum is 3100ms — a small
 * buffer so the full sequence always plays, even on warm launches.
 *
 * @example
 *   const showLoader = useIntroGate(!fontsLoaded);
 *   if (showLoader) return <PaintingLoader />;
 */
export function useIntroGate(
  notReady: boolean,
  minMs: number = 3100
): boolean {
  const [minElapsed, setMinElapsed] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setMinElapsed(true), minMs);
    return () => clearTimeout(id);
  }, [minMs]);
  return notReady || !minElapsed;
}

// Fixed per-letter cell width — stable across font swaps (system
// fallback ↔ custom font) so letters don't jitter mid-animation.
const LETTER_CELL_W = 38;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: CANVAS_BG,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },

  // ── Ornament ───────────────────────────────────────────────────
  ornament: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 34,
  },
  rule: {
    width: 40,
    height: 1,
    backgroundColor: GOLD,
    opacity: 0.85,
  },
  star: {
    fontSize: 14,
    color: GOLD_DARK,
    // A touch of weight so the star feels gilt, not ink.
    textShadowColor: "rgba(184,154,91,0.35)",
    textShadowRadius: 4,
  },

  // ── Wordmark ───────────────────────────────────────────────────
  wordmark: {
    flexDirection: "row",
    alignItems: "center",
  },
  letterCell: {
    width: LETTER_CELL_W,
    alignItems: "center",
  },
  letter: {
    fontFamily: fonts.display,
    fontSize: 44,
    lineHeight: 52,
    // Gold text shadow gives a hint of gilt thickness once the
    // letter has been gilded. When the letter is still ink, the
    // shadow reads as a soft halo on cream — unobtrusive.
    textShadowColor: "rgba(184,154,91,0.2)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },

  // ── Subtitle ───────────────────────────────────────────────────
  subtitle: {
    marginTop: 28,
    fontFamily: fonts.serifItalic,
    fontStyle: "italic",
    fontSize: 13,
    lineHeight: 19,
    color: INK_SOFT,
    textAlign: "center",
    letterSpacing: 0.3,
    maxWidth: 280,
  },

  // ── Pips ───────────────────────────────────────────────────────
  pips: {
    flexDirection: "row",
    gap: 10,
    marginTop: 22,
  },
  pip: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(184,154,91,0.45)",
  },
  pipCenter: {
    backgroundColor: GOLD_DARK,
  },
});
