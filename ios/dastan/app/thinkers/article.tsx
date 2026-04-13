import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Article, fetchArticles } from "../../lib/api";
import { colors, fonts, radius, space, type } from "../../lib/theme";

// Era accent colors — same palette as the web app
const ERA_COLORS: Record<string, string> = {
  ancient: "#8B6914",
  classical: "#6B4226",
  medieval: "#4A5568",
  "early-modern": "#9B2C2C",
  modern: "#2C5282",
  contemporary: "#2D3748",
};

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"];

/**
 * Article reader — a full-screen modal for long-form philosophical
 * essays. Designed like a fine book page: generous margins, tall
 * leading, a drop cap, and a pull-quote block.
 */
export default function ArticleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArticles()
      .then((all) => setArticle(all.find((a) => a.id === id) ?? null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.gold} />
        </View>
      </SafeAreaView>
    );
  }

  if (!article) {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <View style={styles.center}>
          <Text style={styles.errorText}>Article not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const accent = ERA_COLORS[article.era] ?? colors.gold;
  const paragraphs = article.article.split("\n\n");
  const firstPara = paragraphs[0] || "";
  const restParas = paragraphs.slice(1);

  // Drop cap: first letter of the first paragraph
  const dropLetter = firstPara.charAt(0);
  const afterDrop = firstPara.slice(1);

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      {/* Header — close + accent bar */}
      <View style={styles.header}>
        <Pressable
          onPress={() => {
            Haptics.selectionAsync();
            router.back();
          }}
          style={styles.closeBtn}
          hitSlop={8}
        >
          <Text style={styles.closeGlyph}>✕</Text>
        </Pressable>
        <View style={[styles.accentBar, { backgroundColor: accent }]} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Subject + Title */}
        <Text style={[styles.subject, { color: accent }]}>
          {article.subject}
        </Text>
        <Text style={styles.title}>{article.title}</Text>
        <Text style={styles.theme}>{article.theme}</Text>

        {/* Gold rule */}
        <View style={styles.rule} />

        {/* First paragraph with drop cap */}
        <View style={styles.dropCapRow}>
          <Text style={[styles.dropCapLetter, { color: accent }]}>
            {dropLetter}
          </Text>
          <Text style={styles.dropCapBody}>{afterDrop}</Text>
        </View>

        {/* Body paragraphs */}
        {restParas.map((p, i) => {
          // Insert pull quote after ~40% of the article
          const insertQuote = i === Math.floor(restParas.length * 0.4);
          return (
            <View key={i}>
              {insertQuote && (
                <View style={styles.pullQuoteBlock}>
                  <View
                    style={[styles.pullQuoteLine, { backgroundColor: accent }]}
                  />
                  <Text style={styles.pullQuoteText}>
                    {article.pull_quote}
                  </Text>
                </View>
              )}
              <Text style={styles.bodyText}>{p}</Text>
            </View>
          );
        })}

        {/* Ending quote card */}
        <View style={[styles.endingCard, { borderColor: accent + "40" }]}>
          <Text style={styles.endingQuote}>"{article.ending_quote}"</Text>
          <Text style={styles.endingAttrib}>
            — {article.ending_quote_attribution}
          </Text>
        </View>

        {/* Fin ornament */}
        <Text style={styles.finOrnament}>✦</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: { ...type.bodySm, color: colors.danger },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
    gap: space.md,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  closeGlyph: { color: colors.inkMuted, fontSize: 16 },
  accentBar: {
    flex: 1,
    height: 2,
    borderRadius: 1,
    opacity: 0.4,
  },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: space.lg + space.sm,
    paddingTop: space.md,
    paddingBottom: space.xxl + space.xl,
  },

  // Masthead
  subject: {
    ...type.uiLabel,
    fontSize: 10,
    letterSpacing: 2,
    marginBottom: space.sm,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 36,
    lineHeight: 40,
    color: colors.ink,
    marginBottom: space.xs,
  },
  theme: {
    fontFamily: fonts.serifItalic,
    fontSize: 15,
    lineHeight: 22,
    color: colors.inkMuted,
    fontStyle: "italic",
  },
  rule: {
    width: 40,
    height: 1.5,
    backgroundColor: colors.gold,
    opacity: 0.5,
    marginVertical: space.xl,
    borderRadius: 1,
  },

  // Drop cap
  dropCapRow: {
    flexDirection: "row",
    marginBottom: space.md,
  },
  dropCapLetter: {
    fontFamily: fonts.display,
    fontSize: 58,
    lineHeight: 52,
    marginRight: 4,
    marginTop: -4,
  },
  dropCapBody: {
    flex: 1,
    fontFamily: fonts.serif,
    fontSize: 17,
    lineHeight: 30,
    color: colors.ink,
  },

  // Body
  bodyText: {
    fontFamily: fonts.serif,
    fontSize: 17,
    lineHeight: 30,
    color: colors.ink,
    marginBottom: space.md + space.sm,
  },

  // Pull quote
  pullQuoteBlock: {
    flexDirection: "row",
    gap: space.md,
    marginVertical: space.xl,
    paddingRight: space.md,
  },
  pullQuoteLine: {
    width: 3,
    borderRadius: 2,
  },
  pullQuoteText: {
    flex: 1,
    fontFamily: fonts.displayItalic,
    fontSize: 22,
    lineHeight: 32,
    color: colors.ink,
    fontStyle: "italic",
  },

  // Ending card
  endingCard: {
    marginTop: space.xl,
    paddingVertical: space.xl,
    paddingHorizontal: space.lg,
    borderWidth: 1,
    borderRadius: radius.md,
    alignItems: "center",
  },
  endingQuote: {
    fontFamily: fonts.displayItalic,
    fontSize: 20,
    lineHeight: 28,
    color: colors.ink,
    fontStyle: "italic",
    textAlign: "center",
    marginBottom: space.sm,
  },
  endingAttrib: {
    ...type.meta,
    fontSize: 12,
    color: colors.inkMuted,
    letterSpacing: 0.5,
  },

  // Fin
  finOrnament: {
    fontFamily: fonts.display,
    fontSize: 14,
    color: colors.gold,
    opacity: 0.4,
    textAlign: "center",
    marginTop: space.xl,
  },
});
