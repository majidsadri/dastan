import { StyleSheet, Text, View } from "react-native";
import { colors, fonts, space } from "../lib/theme";

/**
 * The Dastan brand mark — a small fleuron, the wordmark in wide-tracked
 * CormorantGaramond, a gilded hairline, and the manifesto in whispered
 * italic Crimson Pro. Used as the hero at the top of auth screens and
 * anywhere we want the app to announce itself with a little ceremony.
 *
 * Designed to feel like the title page of a 19th-century catalogue
 * raisonné rather than a tech app.
 */
export function BrandMark({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const scale = size === "lg" ? 1.25 : size === "sm" ? 0.72 : 1;
  return (
    <View style={styles.wrap}>
      <Text style={[styles.fleuron, { fontSize: 18 * scale }]}>❦</Text>
      <Text
        style={[
          styles.wordmark,
          {
            fontSize: 34 * scale,
            letterSpacing: 10 * scale,
            marginTop: 10 * scale,
          },
        ]}
      >
        DASTAN
      </Text>
      <View style={styles.ruleRow}>
        <View style={styles.rule} />
        <View style={[styles.diamond, { width: 5 * scale, height: 5 * scale }]} />
        <View style={styles.rule} />
      </View>
      <Text
        style={[
          styles.tagline,
          { fontSize: 13 * scale, marginTop: 10 * scale },
        ]}
      >
        every day, a new tale
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    paddingVertical: space.md,
  },
  fleuron: {
    color: colors.gold,
    opacity: 0.75,
  },
  wordmark: {
    fontFamily: fonts.display,
    color: colors.ink,
    // Slight kerning trick: CormorantGaramond SemiBold at wide tracking
    // reads as a wordmark rather than a word.
  },
  ruleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 14,
  },
  rule: {
    width: 44,
    height: 0.75,
    backgroundColor: colors.gold,
    opacity: 0.7,
  },
  diamond: {
    backgroundColor: colors.gold,
    transform: [{ rotate: "45deg" }],
    opacity: 0.85,
  },
  tagline: {
    fontFamily: fonts.serifItalic,
    fontStyle: "italic",
    color: colors.inkMuted,
    letterSpacing: 0.3,
  },
});
