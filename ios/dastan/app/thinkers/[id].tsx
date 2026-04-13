import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  assetUrl,
  fetchPhilosophers,
  Philosopher,
} from "../../lib/api";
import { colors, radius, space, type } from "../../lib/theme";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const HERO_HEIGHT = SCREEN_HEIGHT * 0.58;

/**
 * Registry of philosopher "scene" illustrations (same assets used on
 * the web app). A scene is rendered as an inline figure inside the
 * article, AFTER the paragraph at `afterParagraph` (0-indexed).
 *
 * Scene images live at /philosophers/scenes/<filename>.png on the
 * backend, same as the web app.
 */
type PhilosopherScene = {
  afterParagraph: number;
  src: string;
  caption: string;
};
const PHILOSOPHER_SCENES: Record<string, PhilosopherScene[]> = {
  socrates: [
    {
      afterParagraph: 2,
      src: "/philosophers/scenes/socrates-agora.png",
      caption: "Socrates in the Agora — the questions were the weapon.",
    },
  ],
  plato: [
    {
      afterParagraph: 2,
      src: "/philosophers/scenes/plato-cave.png",
      caption:
        "The allegory of the cave — shadows on the wall, sunlight beyond the threshold.",
    },
  ],
  aristotle: [
    {
      afterParagraph: 2,
      src: "/philosophers/scenes/aristotle-teaching.png",
      caption:
        "Aristotle at the Lyceum — from the dissection of animals to the first principles of being.",
    },
  ],
  "omar-khayyam": [
    {
      afterParagraph: 2,
      src: "/philosophers/scenes/khayyam-stars.png",
      caption:
        "Khayyam at his work — stars overhead, algebra in hand, Isfahan on the horizon.",
    },
  ],
  epicurus: [
    {
      afterParagraph: 2,
      src: "/philosophers/scenes/epicurus-contemplation.png",
      caption:
        "Epicurus in the Garden — atoms in the void, friendship at the table, happiness as the aim.",
    },
  ],
};

/**
 * Thinker detail — philosopher article page.
 *
 * Hero: full-bleed portrait with the famous quote floating over
 * the dark gradient at bottom. Below the hero: key ideas as gilded
 * chips, article body with drop cap, key works as a list, fun
 * fact as a polaroid-style card, and a big "Ask this thinker"
 * CTA that deep-links into the consult flow with this philosopher
 * pre-selected.
 */
export default function ThinkerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [philosophers, setPhilosophers] = useState<Philosopher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPhilosophers()
      .then((d) => setPhilosophers(d.philosophers))
      .catch((e) => setError(e?.message ?? String(e)))
      .finally(() => setLoading(false));
  }, []);

  const p = useMemo(
    () => philosophers.find((x) => x.id === id),
    [philosophers, id]
  );

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.bg }]}>
        <ActivityIndicator size="large" color={colors.gold} />
      </View>
    );
  }
  if (error || !p) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.center}>
          <Text style={styles.error}>{error ?? "Thinker not found."}</Text>
          <Pressable onPress={() => router.back()} style={styles.backLink}>
            <Text style={styles.backLinkText}>Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const portrait = p.image ? assetUrl(p.image) : null;
  const article = (p.article ?? "").trim();
  const paragraphs = article ? article.split(/\n\s*\n/) : [];
  const scenes = PHILOSOPHER_SCENES[p.id] ?? [];

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={styles.hero}>
          {portrait && (
            <Image
              source={{ uri: portrait }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              transition={400}
            />
          )}
          <LinearGradient
            colors={[
              "rgba(20,16,8,0.0)",
              "rgba(20,16,8,0.1)",
              "rgba(20,16,8,0.9)",
            ]}
            locations={[0, 0.4, 1]}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.heroOverlay}>
            <View style={styles.heroText}>
              {p.school ? (
                <Text style={styles.heroEyebrow}>
                  {p.school.toUpperCase()}
                </Text>
              ) : null}
              <Text style={styles.heroName}>{p.name}</Text>
              <Text style={styles.heroDates}>
                {p.born}
                {p.died ? `  –  ${p.died}` : ""}
                {p.nationality ? `  ·  ${p.nationality}` : ""}
              </Text>
              {p.famous_quote ? (
                <Text style={styles.heroQuote}>“{p.famous_quote}”</Text>
              ) : null}
            </View>
          </View>
        </View>

        {/* Body */}
        <View style={styles.body}>
          {/* Ask CTA */}
          <Pressable
            style={({ pressed }) => [
              styles.askCta,
              pressed && { opacity: 0.85 },
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push({
                pathname: "/thinkers/ask",
                params: { preselect: p.id },
              });
            }}
          >
            <Text style={styles.askCtaGlyph}>❋</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.askCtaTitle}>Consult {p.name}</Text>
              <Text style={styles.askCtaSub}>
                Ask a question and hear the answer in their voice.
              </Text>
            </View>
            <Text style={styles.askCtaChevron}>›</Text>
          </Pressable>

          {/* Key ideas */}
          {p.key_ideas && p.key_ideas.length > 0 ? (
            <View style={styles.ideaWrap}>
              <Text style={styles.sectionLabel}>KEY IDEAS</Text>
              <View style={styles.ideaChips}>
                {p.key_ideas.map((k, i) => (
                  <View key={i} style={styles.ideaChip}>
                    <Text style={styles.ideaChipText}>{k}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {/* Article */}
          {p.article_title ? (
            <Text style={styles.articleTitle}>{p.article_title}</Text>
          ) : null}

          {/* Gilded page-turn opener between the title block and the
              article body. */}
          {paragraphs.length > 0 ? (
            <View style={styles.articleOpener}>
              <View style={styles.articleOpenerLine} />
              <Text style={styles.articleOpenerGlyph}>✦</Text>
              <View style={styles.articleOpenerLine} />
            </View>
          ) : null}

          {paragraphs.map((para, i) => {
            const sceneAfter = scenes.find((s) => s.afterParagraph === i);
            // Editorial lead-in on the first paragraph: first ~4
            // words in small caps at body lineHeight so the opening
            // reads as one continuous piece with the rest of the
            // article — no flex-row column, no disconnection.
            let content: ReactNode;
            if (i === 0) {
              const words = para.split(/\s+/);
              const leadCount = Math.min(4, words.length);
              const leadIn = words.slice(0, leadCount).join(" ");
              const rest = words.slice(leadCount).join(" ");
              content = (
                <Text style={styles.article}>
                  <Text style={styles.leadIn}>{leadIn.toUpperCase()}</Text>
                  {rest ? " " + rest : ""}
                </Text>
              );
            } else {
              content = (
                <Text style={[styles.article, { marginTop: space.md }]}>
                  {para}
                </Text>
              );
            }
            return (
              <View key={`p-${i}`}>
                {content}
                {sceneAfter && (
                  <SceneFigure
                    src={sceneAfter.src}
                    caption={sceneAfter.caption}
                  />
                )}
              </View>
            );
          })}

          {/* Pull quote */}
          {p.pull_quote ? (
            <View style={styles.pullQuoteBlock}>
              <Text style={styles.pullQuoteMark}>“</Text>
              <Text style={styles.pullQuote}>{p.pull_quote}</Text>
            </View>
          ) : null}

          {/* Key works */}
          {p.key_works && p.key_works.length > 0 ? (
            <View style={styles.worksBox}>
              <Text style={styles.sectionLabel}>KEY WORKS</Text>
              {p.key_works.map((k, i) => (
                <View key={i} style={styles.workRow}>
                  <Text style={styles.workBullet}>✦</Text>
                  <Text style={styles.workText}>{k}</Text>
                </View>
              ))}
            </View>
          ) : null}

          {/* Fun fact as polaroid */}
          {p.fun_fact ? (
            <View style={styles.polaroid}>
              <Text style={styles.polaroidLabel}>A CURIOUS DETAIL</Text>
              <Text style={styles.polaroidText}>{p.fun_fact}</Text>
            </View>
          ) : null}
        </View>
      </ScrollView>

      {/* Floating back button — always accessible over the hero */}
      <SafeAreaView edges={["top"]} style={styles.backFloat} pointerEvents="box-none">
        <Pressable
          style={({ pressed }) => [
            styles.backBtn,
            pressed && { opacity: 0.7 },
          ]}
          onPress={() => router.back()}
          hitSlop={12}
        >
          <Text style={styles.backGlyph}>‹</Text>
        </Pressable>
      </SafeAreaView>
    </View>
  );
}

function SceneFigure({ src, caption }: { src: string; caption: string }) {
  return (
    <View style={styles.scene}>
      <View style={styles.sceneFrame}>
        <Image
          source={{ uri: assetUrl(src) }}
          style={styles.sceneImage}
          contentFit="cover"
          transition={350}
        />
      </View>
      <Text style={styles.sceneCaption}>{caption}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  safe: { flex: 1, backgroundColor: colors.bg },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: space.lg,
  },
  error: { ...type.bodySm, color: colors.danger, marginBottom: space.md },
  backLink: { padding: space.md },
  backLinkText: { ...type.uiLabel, color: colors.gold },

  scroll: { paddingBottom: space.xxl * 2 },

  // Hero
  hero: {
    width: SCREEN_WIDTH,
    height: HERO_HEIGHT,
    backgroundColor: colors.ink,
  },
  heroOverlay: { flex: 1, justifyContent: "flex-end" },
  backFloat: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingLeft: space.md,
    paddingTop: space.xs,
    zIndex: 20,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(20,16,8,0.45)",
    justifyContent: "center",
    alignItems: "center",
  },
  backGlyph: {
    color: colors.bg,
    fontSize: 32,
    lineHeight: 32,
    marginTop: -4,
  },
  heroText: {
    padding: space.lg,
    paddingBottom: space.xl,
  },
  heroEyebrow: {
    ...type.eyebrow,
    color: colors.goldLight,
    marginBottom: space.xs,
  },
  heroName: {
    ...type.display,
    fontSize: 52,
    lineHeight: 56,
    color: colors.bg,
    marginBottom: space.xs,
  },
  heroDates: { ...type.caption, color: colors.bg, fontSize: 14 },
  heroQuote: {
    fontFamily: "CormorantGaramond_500Medium_Italic",
    fontSize: 19,
    lineHeight: 28,
    color: colors.bg,
    opacity: 0.9,
    marginTop: space.md,
    fontStyle: "italic",
    maxWidth: 340,
  },

  // Body
  body: { padding: space.lg, paddingTop: space.xl, gap: space.xl },

  askCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
    backgroundColor: colors.ink,
    padding: space.lg,
    borderRadius: radius.md,
  },
  askCtaGlyph: {
    color: colors.gold,
    fontSize: 26,
    fontFamily: "CormorantGaramond_600SemiBold",
  },
  askCtaTitle: {
    fontFamily: "CormorantGaramond_600SemiBold",
    fontSize: 20,
    color: colors.bg,
    marginBottom: 2,
  },
  askCtaSub: {
    ...type.caption,
    color: colors.bg,
    opacity: 0.75,
    fontSize: 12,
  },
  askCtaChevron: { color: colors.gold, fontSize: 28 },

  ideaWrap: {},
  sectionLabel: {
    ...type.uiLabel,
    color: colors.gold,
    marginBottom: space.md,
    letterSpacing: 1.5,
  },
  ideaChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: space.sm,
  },
  ideaChip: {
    borderWidth: 0.5,
    borderColor: colors.gold,
    borderRadius: radius.pill,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  ideaChipText: {
    fontFamily: "CrimsonPro_400Regular_Italic",
    fontSize: 13,
    color: colors.ink,
    fontStyle: "italic",
  },

  articleTitle: {
    ...type.title,
    fontSize: 28,
    lineHeight: 34,
  },
  article: { ...type.body, fontSize: 17, lineHeight: 28 },
  // First-paragraph small-caps lead-in. lineHeight must match body
  // lineHeight to avoid iOS's nested-Text line-metric bug.
  leadIn: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13.5,
    lineHeight: 28,
    letterSpacing: 2,
    color: colors.ink,
  },
  // Decorative "page-turn" opener between the title block and
  // the article body.
  articleOpener: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: space.md,
    marginTop: space.md,
    marginBottom: space.lg,
    paddingHorizontal: space.lg,
  },
  articleOpenerLine: {
    flex: 1,
    height: 0.5,
    backgroundColor: colors.gold,
    opacity: 0.5,
  },
  articleOpenerGlyph: {
    color: colors.gold,
    fontFamily: "CormorantGaramond_600SemiBold",
    fontSize: 16,
  },
  scene: {
    marginVertical: space.xl,
    marginHorizontal: -space.md,
  },
  sceneFrame: {
    borderWidth: 1,
    borderColor: colors.goldLight,
    borderRadius: radius.md,
    overflow: "hidden",
    backgroundColor: colors.surface,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.14,
    shadowRadius: 20,
    elevation: 4,
  },
  sceneImage: {
    width: "100%",
    aspectRatio: 1.4,
    backgroundColor: colors.goldLight,
  },
  sceneCaption: {
    fontFamily: "CrimsonPro_400Regular_Italic",
    fontSize: 13,
    fontStyle: "italic",
    color: colors.inkSoft,
    textAlign: "center",
    marginTop: space.sm,
    paddingHorizontal: space.md,
  },

  pullQuoteBlock: { paddingHorizontal: space.md },
  pullQuoteMark: {
    fontFamily: "CormorantGaramond_600SemiBold",
    fontSize: 72,
    lineHeight: 72,
    color: colors.gold,
    marginBottom: -20,
  },
  pullQuote: {
    fontFamily: "CormorantGaramond_500Medium_Italic",
    fontSize: 24,
    lineHeight: 34,
    color: colors.ink,
    fontStyle: "italic",
  },

  worksBox: {},
  workRow: { flexDirection: "row", gap: space.sm, marginBottom: space.sm },
  workBullet: { color: colors.gold, fontSize: 14, marginTop: 3 },
  workText: { ...type.body, flex: 1, fontSize: 15, lineHeight: 23 },

  polaroid: {
    backgroundColor: colors.surface,
    padding: space.lg,
    paddingBottom: space.xl,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.hairline,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 3,
    transform: [{ rotate: "-0.6deg" }],
  },
  polaroidLabel: {
    ...type.uiLabel,
    color: colors.gold,
    marginBottom: space.sm,
    letterSpacing: 1.5,
  },
  polaroidText: { ...type.body, fontSize: 15, lineHeight: 24 },
});
