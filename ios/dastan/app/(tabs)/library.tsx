import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Article, fetchArticles } from "../../lib/api";
import { colors, fonts, radius, space, type } from "../../lib/theme";
import { useGlassTabBarHeight } from "./_layout";

/**
 * The Library — contemporary art-book covers.
 *
 * Flat color fields, asymmetric editorial typography, a single
 * hairline accent. Think Penguin Modern Classics reissue, Fitzcarraldo
 * Editions, or a Japanese art-book catalogue: negative space does
 * most of the work, the title does the rest. No borders, no gilt,
 * no ornaments — every element earns its place or is cut.
 *
 * The shelf entrance is quiet: covers rise in turn with a small
 * translateY + opacity curve, as if they were just placed on a
 * gallery table for the reader to consider.
 */

const { width: SCREEN_W } = Dimensions.get("window");

const GUTTER = 10;
const H_PAD = space.lg;
// Two per row, trade-paperback proportion.
const COVER_W = (SCREEN_W - H_PAD * 2 - GUTTER) / 2;
const COVER_H = COVER_W * 1.52;

type Book = {
  id: "faal" | "little-prince" | "siddhartha" | "tao" | "proust";
  serial: string;
  kicker: string;
  title: string;
  titleLine2?: string;
  byline: string;
  year: string;
  href: string;
  bg: string;
  bgDeep: string;
  fg: string;
  accent: string;
  motif?: string;
};

const BOOKS: Book[] = [
  {
    id: "faal",
    serial: "01",
    kicker: "GHAZAL · PERSIAN",
    title: "Faal-e",
    titleLine2: "Hafez",
    byline: "Hāfez",
    year: "1389",
    href: "/library/faal",
    bg: "#9b3a2a",
    bgDeep: "#6a2418",
    fg: "#f6ecd8",
    accent: "#e8c17a",
  },
  {
    id: "little-prince",
    serial: "02",
    kicker: "FABLE · FRENCH",
    title: "The Little",
    titleLine2: "Prince",
    byline: "Saint-Exupéry",
    year: "1943",
    href: "/library/little-prince",
    bg: "#1e2a4a",
    bgDeep: "#0f1628",
    fg: "#f0e9d6",
    accent: "#d6b46b",
  },
  {
    id: "siddhartha",
    serial: "03",
    kicker: "NOVEL · GERMAN",
    title: "Siddhartha",
    byline: "Hermann Hesse",
    year: "1922",
    href: "/library/siddhartha",
    bg: "#e4d7b8",
    bgDeep: "#cdbd98",
    fg: "#1f1a12",
    accent: "#8a5a2a",
  },
  {
    id: "tao",
    serial: "04",
    kicker: "POETRY · CHINESE",
    title: "Tao Te",
    titleLine2: "Ching",
    byline: "Lao Tzu",
    year: "~400 BCE",
    href: "/library/tao",
    bg: "#1f2e24",
    bgDeep: "#0e1810",
    fg: "#d8e0d4",
    accent: "#7fa882",
    motif: "道",
  },
  {
    id: "proust",
    serial: "05",
    kicker: "NOVEL · FRENCH",
    title: "In Search of",
    titleLine2: "Lost Time",
    byline: "Marcel Proust",
    year: "1913",
    href: "/library/proust",
    bg: "#5a2836",
    bgDeep: "#371620",
    fg: "#f3e6d8",
    accent: "#d9a4a4",
    motif: "❦",
  },
];

export default function LibraryScreen() {
  const tabBarH = useGlassTabBarHeight();
  const [articles, setArticles] = useState<Article[]>([]);

  useEffect(() => {
    fetchArticles().then(setArticles).catch(() => {});
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: tabBarH + space.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Header />
        <Shelf />
        {articles.length > 0 && <Readings articles={articles} />}
        <Footer />
      </ScrollView>
    </SafeAreaView>
  );
}

/* ── Header ─────────────────────────────────────────────────── */

function Header() {
  return (
    <View style={styles.header}>
      <Text style={styles.eyebrow}>✦  THE READING ROOM  ✦</Text>
      <View style={styles.dividerWrap}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerGlyph}>❧</Text>
        <View style={styles.dividerLine} />
      </View>
      <Text style={styles.title}>Folio</Text>
    </View>
  );
}

/* ── Shelf ──────────────────────────────────────────────────── */

function Shelf() {
  return (
    <View style={styles.shelfRow}>
      {BOOKS.map((b, i) => (
        <BookTile key={b.id} book={b} index={i} />
      ))}
    </View>
  );
}

/* ── Book tile ──────────────────────────────────────────────── */

function BookTile({ book, index }: { book: Book; index: number }) {
  const progress = useRef(new Animated.Value(0)).current;
  const pressScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: 600,
      delay: 140 + index * 130,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [index, progress]);

  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [18, 0],
  });

  const onPressIn = () =>
    Animated.spring(pressScale, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 40,
      bounciness: 0,
    }).start();
  const onPressOut = () =>
    Animated.spring(pressScale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
      bounciness: 6,
    }).start();
  const onPress = () => {
    Haptics.selectionAsync();
    router.push(book.href as any);
  };

  return (
    <Animated.View
      style={{
        opacity: progress,
        transform: [{ translateY }, { scale: pressScale }],
      }}
    >
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        accessibilityRole="button"
        accessibilityLabel={`${book.serial}. ${book.title}${
          book.titleLine2 ? " " + book.titleLine2 : ""
        } by ${book.byline}, ${book.year}`}
      >
        <View style={[styles.cover, { backgroundColor: book.bg }]}>
          <LinearGradient
            colors={["rgba(0,0,0,0)", book.bgDeep]}
            start={{ x: 0.1, y: 0.1 }}
            end={{ x: 1, y: 1 }}
            style={[StyleSheet.absoluteFill, { opacity: 0.45 }]}
            pointerEvents="none"
          />

          {book.motif ? (
            <Text
              style={[
                styles.motif,
                { color: book.accent },
              ]}
              pointerEvents="none"
            >
              {book.motif}
            </Text>
          ) : null}

          {/* Top row — kicker label + serial number */}
          <View style={styles.topRow}>
            <Text style={[styles.kicker, { color: book.fg, opacity: 0.65 }]}>
              {book.kicker}
            </Text>
          </View>

          {/* Accent bar — a single 1px horizontal mark anchoring
              the composition */}
          <View
            style={[styles.accentBar, { backgroundColor: book.accent }]}
            pointerEvents="none"
          />

          {/* Title — anchored to the lower-left */}
          <View style={styles.titleWrap}>
            <Text
              style={[styles.coverTitle, { color: book.fg }]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.7}
            >
              {book.title}
            </Text>
            {book.titleLine2 ? (
              <Text
                style={[styles.coverTitle, { color: book.fg }]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.7}
              >
                {book.titleLine2}
              </Text>
            ) : null}
          </View>

          {/* Byline + year — bottom strip */}
          <View style={styles.footRow}>
            <Text style={[styles.coverByline, { color: book.fg, opacity: 0.75 }]}>
              {book.byline.toUpperCase()}
            </Text>
            <Text
              style={[
                styles.coverYear,
                { color: book.accent, opacity: 0.85 },
              ]}
            >
              {book.year}
            </Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

/* ── Readings — editorial article carousel ─────────────────── */

const READING_ROMAN = ["I", "II", "III", "IV", "V"];
const READING_CARD_W = SCREEN_W * 0.52;
const READING_CARD_GAP = space.sm;

function Readings({ articles }: { articles: Article[] }) {
  return (
    <View style={styles.readingsSection}>
      <View style={styles.readingsHeader}>
        <View style={styles.readingsRule} />
        <Text style={styles.readingsEyebrow}>READINGS</Text>
        <View style={styles.readingsRule} />
      </View>
      <FlatList
        data={articles}
        keyExtractor={(a) => a.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={READING_CARD_W + READING_CARD_GAP}
        decelerationRate="fast"
        contentContainerStyle={styles.readingsScroll}
        renderItem={({ item, index }) => (
          <ReadingCard article={item} index={index} />
        )}
      />
    </View>
  );
}

function ReadingCard({
  article,
  index,
}: {
  article: Article;
  index: number;
}) {
  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync();
        router.push({
          pathname: "/thinkers/article",
          params: { id: article.id },
        });
      }}
      style={({ pressed }) => [
        styles.readingCard,
        pressed && { opacity: 0.75, transform: [{ scale: 0.97 }] },
      ]}
    >
      <View style={styles.readingAccent} />
      <View style={styles.readingBody}>
        <Text style={styles.readingNumeral}>
          {READING_ROMAN[index] ?? `${index + 1}`}
        </Text>
        <Text style={styles.readingTitle} numberOfLines={3}>
          {article.title}
        </Text>
        <Text style={styles.readingSubject} numberOfLines={1}>
          {article.subject}
        </Text>
      </View>
      <View style={styles.readingFooter}>
        <Text style={styles.readingReadLabel}>READ  ›</Text>
      </View>
    </Pressable>
  );
}

/* ── Footer ─────────────────────────────────────────────────── */

function Footer() {
  return (
    <View style={styles.footer}>
      <Text style={styles.footerText}>
        Open a book. Close the world for a while.
      </Text>
    </View>
  );
}

/* ── Styles ─────────────────────────────────────────────────── */

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingHorizontal: H_PAD },

  /* Header — literary-magazine masthead (mirrors Artists divider
     treatment so the two pages read as siblings). */
  header: {
    alignItems: "center",
    paddingTop: space.lg,
    paddingBottom: space.xl,
  },
  eyebrow: {
    ...type.eyebrow,
    color: colors.gold,
    letterSpacing: 2,
    fontSize: 10,
    textAlign: "center",
  },
  dividerWrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: space.md,
    marginTop: space.md,
    marginBottom: space.xs,
    paddingHorizontal: space.xl,
    alignSelf: "stretch",
  },
  dividerLine: {
    flex: 1,
    height: 0.5,
    backgroundColor: colors.gold,
    opacity: 0.6,
  },
  dividerGlyph: {
    fontFamily: fonts.display,
    fontSize: 18,
    color: colors.gold,
  },
  title: {
    fontFamily: fonts.displayItalic,
    fontSize: 52,
    lineHeight: 58,
    color: colors.ink,
    textAlign: "center",
    marginTop: space.xs,
  },
  lede: {
    ...type.caption,
    fontFamily: fonts.serifItalic,
    fontStyle: "italic",
    textAlign: "center",
    marginTop: space.xs,
    paddingHorizontal: space.md,
  },
  byline: {
    fontFamily: fonts.uiBold,
    fontSize: 9,
    letterSpacing: 3,
    color: colors.gold,
    opacity: 0.75,
    textAlign: "center",
    marginTop: space.sm,
  },

  /* Shelf — two-column hang, third book centers on its own row */
  shelfRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "flex-start",
    gap: GUTTER,
    paddingBottom: space.xl,
  },

  /* Book cover */
  cover: {
    width: COVER_W,
    height: COVER_H,
    overflow: "hidden",
    shadowColor: "#1e1a15",
    shadowOffset: { width: 2, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 8,
    // Subtle squared corners — reads as contemporary trade rather
    // than pillowy card.
    borderRadius: 3,
  },

  motif: {
    position: "absolute",
    right: -8,
    top: "20%",
    fontSize: 120,
    lineHeight: 130,
    fontFamily: fonts.display,
    opacity: 0.12,
  },

  /* Top row — small kicker label */
  topRow: {
    position: "absolute",
    top: 22,
    left: 20,
    right: 20,
  },
  kicker: {
    fontFamily: fonts.uiBold,
    fontSize: 10,
    letterSpacing: 2.8,
  },

  /* Serial number — large, drawn off the grid */
  serial: {
    position: "absolute",
    right: 16,
    bottom: 10,
    fontFamily: fonts.displayItalic,
    fontSize: 64,
    lineHeight: 68,
    letterSpacing: -1,
  },

  /* Hairline accent bar — below the kicker */
  accentBar: {
    position: "absolute",
    top: 52,
    left: 20,
    width: 32,
    height: 1,
    opacity: 0.8,
  },

  /* Title — anchored to the lower-left, pushes against the serial */
  titleWrap: {
    position: "absolute",
    left: 20,
    right: 20,
    bottom: 76,
    alignItems: "flex-start",
  },
  coverTitle: {
    fontFamily: fonts.displayItalic,
    fontSize: 32,
    lineHeight: 34,
    textAlign: "left",
  },

  /* Foot row — byline on the left, year is the serial above */
  footRow: {
    position: "absolute",
    left: 20,
    right: 20,
    bottom: 22,
  },
  coverByline: {
    fontFamily: fonts.uiBold,
    fontSize: 10,
    letterSpacing: 2.2,
  },
  coverYear: {
    fontFamily: fonts.uiBold,
    fontSize: 9,
    letterSpacing: 2,
    marginTop: 5,
  },

  /* Readings carousel */
  readingsSection: {
    marginTop: space.lg,
    marginBottom: space.md,
    marginHorizontal: -H_PAD,
  },
  readingsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
    paddingHorizontal: space.xl,
    marginBottom: space.lg,
  },
  readingsRule: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.gold,
    opacity: 0.3,
  },
  readingsEyebrow: {
    ...type.uiLabel,
    fontSize: 10,
    letterSpacing: 2.5,
    color: colors.gold,
  },
  readingsScroll: {
    paddingHorizontal: H_PAD,
    gap: READING_CARD_GAP,
  },
  readingCard: {
    width: READING_CARD_W,
    backgroundColor: "rgba(250,247,240,0.6)",
    borderRadius: radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(184,154,91,0.3)",
    overflow: "hidden",
  },
  readingAccent: {
    height: 2,
    backgroundColor: colors.gold,
    opacity: 0.4,
    borderTopLeftRadius: radius.sm,
    borderTopRightRadius: radius.sm,
  },
  readingBody: {
    padding: space.md,
    paddingBottom: space.xs,
  },
  readingNumeral: {
    fontFamily: "CormorantGaramond_600SemiBold",
    fontSize: 22,
    lineHeight: 24,
    color: colors.gold,
    marginBottom: 4,
  },
  readingTitle: {
    fontFamily: "CormorantGaramond_600SemiBold",
    fontSize: 18,
    lineHeight: 22,
    color: colors.ink,
    marginBottom: 4,
  },
  readingSubject: {
    fontFamily: "CrimsonPro_400Regular_Italic",
    fontSize: 12,
    color: colors.inkMuted,
    fontStyle: "italic",
  },
  readingFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingHorizontal: space.md,
    paddingBottom: space.sm,
    paddingTop: space.xs,
  },
  readingReadLabel: {
    ...type.uiLabel,
    fontSize: 8,
    letterSpacing: 2,
    color: colors.gold,
  },

  /* Footer */
  footer: {
    alignItems: "center",
    paddingTop: space.md,
    paddingBottom: space.md,
  },
  footerText: {
    fontFamily: fonts.serifItalic,
    fontSize: 13,
    lineHeight: 18,
    color: colors.inkMuted,
    fontStyle: "italic",
  },

  /* Legacy — kept referenced for typing clean */
  radius: {
    borderRadius: radius.md,
  },
});
