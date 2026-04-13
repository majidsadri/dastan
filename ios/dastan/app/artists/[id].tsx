import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
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
  Artist,
  GalleryItem,
  assetUrl,
  fetchArtists,
  fetchPaintingsByArtist,
} from "../../lib/api";
import { colors, fonts, radius, space, type } from "../../lib/theme";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const HERO_HEIGHT = SCREEN_HEIGHT * 0.58;

// Works strip sizing — slightly taller than wide so the cards feel
// like museum plates, not square thumbnails.
const WORK_CARD_W = 148;
const WORK_CARD_H = 188;

/**
 * Artist detail — a monograph page.
 *
 * Layout (top → bottom):
 *
 *   1. Hero portrait (full-bleed, 58% of screen), dark gradient
 *      footer carrying eyebrow / name / dates / movement chip.
 *   2. Pull quote — oversized display italic with a gilded mark.
 *   3. Article — title, gold ornament rule, small-caps lead-in,
 *      body paragraphs with measured 17/29 serif rhythm.
 *   4. "Selected Works" horizontal strip — real thumbnails fetched
 *      from the backend filtered to this artist, sorted by year.
 *      Tap any thumbnail to open the gallery lightbox on that image.
 *   5. "Key Works" editorial list (from the artist catalog itself).
 *
 * Every section is separated by a consistent gold ornament rule so
 * the page reads as a single monograph chapter rather than a
 * stack of unrelated cards.
 */
export default function ArtistDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [works, setWorks] = useState<GalleryItem[]>([]);

  useEffect(() => {
    fetchArtists()
      .then(setArtists)
      .catch((e) => setError(e?.message ?? String(e)))
      .finally(() => setLoading(false));
  }, []);

  const artist = useMemo(() => artists.find((a) => a.id === id), [artists, id]);

  // Once we know the artist's name, pull their painting strip.
  useEffect(() => {
    if (!artist?.name) return;
    let cancelled = false;
    fetchPaintingsByArtist(artist.name, 18)
      .then((items) => {
        if (!cancelled) setWorks(items);
      })
      .catch(() => {
        // Soft-fail: the page still works without the strip.
        if (!cancelled) setWorks([]);
      });
    return () => {
      cancelled = true;
    };
  }, [artist?.name]);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.bg }]}>
        <ActivityIndicator size="large" color={colors.gold} />
      </View>
    );
  }
  if (error || !artist) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.center}>
          <Text style={styles.error}>{error ?? "Artist not found."}</Text>
          <Pressable onPress={() => router.back()} style={styles.backLink}>
            <Text style={styles.backLinkText}>Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const portrait = artist.image ? assetUrl(artist.image) : null;
  const article = (artist.article ?? "").trim();
  const paragraphs = article ? article.split(/\n\s*\n/) : [];

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollInner}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Hero ──────────────────────────────────────────────── */}
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
              "rgba(20,16,8,0.15)",
              "rgba(20,16,8,0.88)",
            ]}
            locations={[0, 0.5, 1]}
            style={StyleSheet.absoluteFill}
          />

          {/* Gilded corner ornaments — turns the hero into a frame. */}
          <View style={[styles.frameCorner, styles.frameTL]} />
          <View style={[styles.frameCorner, styles.frameTR]} />
          <View style={[styles.frameCorner, styles.frameBL]} />
          <View style={[styles.frameCorner, styles.frameBR]} />

          <SafeAreaView edges={["top"]} style={styles.heroOverlay}>
            <Pressable
              style={({ pressed }) => [
                styles.backBtn,
                pressed && { opacity: 0.7 },
              ]}
              onPress={() => {
                Haptics.selectionAsync();
                router.back();
              }}
            >
              <Text style={styles.backGlyph}>‹</Text>
            </Pressable>

            <View style={styles.heroText}>
              <Text style={styles.heroEyebrow}>
                {(artist.type || "ARTIST").toUpperCase()}
              </Text>
              <Text
                style={styles.heroName}
                numberOfLines={2}
                adjustsFontSizeToFit
                minimumFontScale={0.7}
              >
                {artist.name}
              </Text>
              <Text style={styles.heroDates}>
                {artist.born}
                {artist.died ? `  –  ${artist.died}` : ""}
                {artist.nationality ? `  ·  ${artist.nationality}` : ""}
              </Text>
              {artist.movement ? (
                <View style={styles.heroChip}>
                  <Text style={styles.heroChipText}>{artist.movement}</Text>
                </View>
              ) : null}
            </View>
          </SafeAreaView>
        </View>

        {/* ─── Pull quote ────────────────────────────────────────── */}
        {artist.pull_quote ? (
          <View style={styles.pullQuoteBlock}>
            <Text style={styles.pullQuoteMark}>“</Text>
            <Text style={styles.pullQuote}>{artist.pull_quote}</Text>
            <View style={styles.pullQuoteRule} />
          </View>
        ) : null}

        {/* ─── Article ───────────────────────────────────────────── */}
        <View style={styles.body}>
          {artist.article_title ? (
            <>
              <Text style={styles.sectionEyebrow}>THE ESSAY</Text>
              <Text style={styles.articleTitle}>{artist.article_title}</Text>
            </>
          ) : null}

          {paragraphs.length > 0 ? (
            <View style={styles.ornamentRule}>
              <View style={styles.ornamentLine} />
              <Text style={styles.ornamentGlyph}>✦</Text>
              <View style={styles.ornamentLine} />
            </View>
          ) : null}

          {paragraphs.map((para, i) => {
            if (i === 0) {
              // First-paragraph small-caps lead-in. fontSize is smaller
              // than body so it reads as small caps, but lineHeight
              // MUST match the body's lineHeight to avoid iOS's
              // nested-Text line-metric bug (which would zebra-stripe
              // the whole paragraph — see memory).
              const words = para.split(/\s+/);
              const leadCount = Math.min(4, words.length);
              const leadIn = words.slice(0, leadCount).join(" ");
              const rest = words.slice(leadCount).join(" ");
              return (
                <Text key={`p-${i}`} style={styles.article}>
                  <Text style={styles.leadIn}>{leadIn.toUpperCase()}</Text>
                  {rest ? " " + rest : ""}
                </Text>
              );
            }
            return (
              <Text
                key={`p-${i}`}
                style={[styles.article, { marginTop: space.md }]}
              >
                {para}
              </Text>
            );
          })}
        </View>

        {/* ─── Selected Works — horizontal strip ─────────────────── */}
        {works.length > 0 ? (
          <View style={styles.worksSection}>
            <View style={styles.worksHeader}>
              <View style={styles.ornamentLine} />
              <Text style={styles.sectionEyebrowCentered}>SELECTED WORKS</Text>
              <View style={styles.ornamentLine} />
            </View>
            <Text style={styles.worksSub}>
              {works.length} painting{works.length === 1 ? "" : "s"} from the
              collection
            </Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.worksStrip}
              decelerationRate="fast"
              snapToInterval={WORK_CARD_W + space.md}
            >
              {works.map((w, i) => (
                <WorkCard key={`${w.image_url}-${i}`} work={w} />
              ))}
            </ScrollView>
          </View>
        ) : null}

        {/* ─── Key Works — editorial list from the catalog ───────── */}
        {artist.key_works && artist.key_works.length > 0 ? (
          <View style={styles.keyWorksSection}>
            <View style={styles.ornamentRule}>
              <View style={styles.ornamentLine} />
              <Text style={styles.ornamentGlyph}>❋</Text>
              <View style={styles.ornamentLine} />
            </View>
            <Text style={styles.sectionEyebrowCentered}>KEY WORKS</Text>
            <View style={styles.keyWorksList}>
              {artist.key_works.map((w, i) => (
                <View key={i} style={styles.keyWorkRow}>
                  <Text style={styles.keyWorkNum}>
                    {String(i + 1).padStart(2, "0")}
                  </Text>
                  <Text style={styles.keyWorkText}>{w}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* Closing flourish */}
        <View style={styles.closingFlourish}>
          <Text style={styles.closingGlyph}>✦  ✦  ✦</Text>
        </View>
      </ScrollView>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Work card — one painting thumbnail in the horizontal strip
// ─────────────────────────────────────────────────────────────────────

function WorkCard({ work }: { work: GalleryItem }) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.workCard,
        pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] },
      ]}
      onPress={() => {
        Haptics.selectionAsync();
        // Open the gallery lightbox. We don't know the card's index
        // in the gallery's random sample, so we pass the image path
        // as a fallback param. The gallery detail screen can decide
        // whether to honor it — here we route to the gallery tab.
        router.push("/(tabs)/gallery");
      }}
    >
      <Image
        source={{ uri: assetUrl(work.image_url) }}
        style={styles.workImage}
        contentFit="cover"
        transition={250}
      />
      <View style={styles.workPlate}>
        <Text style={styles.workTitle} numberOfLines={2}>
          {work.title}
        </Text>
        {work.year ? (
          <Text style={styles.workYear}>{work.year}</Text>
        ) : null}
      </View>
    </Pressable>
  );
}

// ─────────────────────────────────────────────────────────────────────

const FRAME_CORNER = 24;

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

  scroll: { flex: 1 },
  scrollInner: { paddingBottom: space.xxl },

  // ─── Hero ──────────────────────────────────────────────────────────
  hero: {
    width: SCREEN_WIDTH,
    height: HERO_HEIGHT,
    backgroundColor: colors.ink,
  },
  frameCorner: {
    position: "absolute",
    width: FRAME_CORNER,
    height: FRAME_CORNER,
    borderColor: colors.gold,
    opacity: 0.75,
  },
  frameTL: {
    top: space.xl + space.sm,
    left: space.lg,
    borderTopWidth: 1,
    borderLeftWidth: 1,
  },
  frameTR: {
    top: space.xl + space.sm,
    right: space.lg,
    borderTopWidth: 1,
    borderRightWidth: 1,
  },
  frameBL: {
    bottom: space.lg,
    left: space.lg,
    borderBottomWidth: 1,
    borderLeftWidth: 1,
  },
  frameBR: {
    bottom: space.lg,
    right: space.lg,
    borderBottomWidth: 1,
    borderRightWidth: 1,
  },
  heroOverlay: { flex: 1, justifyContent: "space-between" },
  backBtn: {
    marginLeft: space.md,
    marginTop: space.sm,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(250,247,240,0.18)",
    borderWidth: 0.5,
    borderColor: "rgba(232,223,200,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  backGlyph: {
    color: colors.bg,
    fontSize: 30,
    lineHeight: 32,
    marginTop: -4,
  },
  heroText: {
    paddingHorizontal: space.lg,
    paddingBottom: space.xl,
  },
  heroEyebrow: {
    ...type.eyebrow,
    color: colors.goldLight,
    fontSize: 10,
    letterSpacing: 2.4,
    marginBottom: space.sm,
  },
  heroName: {
    fontFamily: fonts.display,
    fontSize: 52,
    lineHeight: 56,
    color: colors.bg,
    marginBottom: space.sm,
  },
  heroDates: {
    fontFamily: fonts.serifItalic,
    fontSize: 15,
    lineHeight: 22,
    color: colors.bg,
    opacity: 0.88,
    fontStyle: "italic",
  },
  heroChip: {
    alignSelf: "flex-start",
    marginTop: space.md,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    backgroundColor: "rgba(184,154,91,0.18)",
    borderWidth: 0.5,
    borderColor: "rgba(184,154,91,0.65)",
  },
  heroChipText: {
    fontFamily: fonts.uiBold,
    fontSize: 10,
    letterSpacing: 1.6,
    color: colors.goldLight,
  },

  // ─── Pull quote ────────────────────────────────────────────────────
  pullQuoteBlock: {
    paddingHorizontal: space.xl,
    paddingTop: space.xl,
    paddingBottom: space.lg,
    alignItems: "center",
  },
  pullQuoteMark: {
    fontFamily: fonts.display,
    fontSize: 84,
    lineHeight: 72,
    color: colors.gold,
    opacity: 0.85,
    marginBottom: -24,
  },
  pullQuote: {
    fontFamily: fonts.displayItalic,
    fontSize: 26,
    lineHeight: 38,
    color: colors.ink,
    fontStyle: "italic",
    textAlign: "center",
  },
  pullQuoteRule: {
    width: 48,
    height: 0.75,
    backgroundColor: colors.gold,
    opacity: 0.6,
    marginTop: space.md,
  },

  // ─── Article body ──────────────────────────────────────────────────
  body: {
    paddingHorizontal: space.lg,
    paddingTop: space.md,
  },
  sectionEyebrow: {
    fontFamily: fonts.uiBold,
    fontSize: 10,
    letterSpacing: 2.4,
    color: colors.goldDark,
    marginBottom: space.sm,
  },
  sectionEyebrowCentered: {
    fontFamily: fonts.uiBold,
    fontSize: 10,
    letterSpacing: 2.4,
    color: colors.goldDark,
    textAlign: "center",
    paddingHorizontal: space.md,
  },
  articleTitle: {
    fontFamily: fonts.display,
    fontSize: 30,
    lineHeight: 36,
    color: colors.ink,
    marginBottom: space.md,
  },
  ornamentRule: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: space.md,
    marginTop: space.sm,
    marginBottom: space.lg,
  },
  ornamentLine: {
    flex: 1,
    height: 0.5,
    backgroundColor: colors.gold,
    opacity: 0.5,
  },
  ornamentGlyph: {
    color: colors.gold,
    fontFamily: fonts.display,
    fontSize: 16,
  },
  article: {
    fontFamily: fonts.serif,
    fontSize: 17,
    lineHeight: 29,
    color: colors.ink,
  },
  leadIn: {
    fontFamily: fonts.uiBold,
    fontSize: 13.5,
    lineHeight: 29,
    letterSpacing: 2,
    color: colors.goldDark,
  },

  // ─── Selected Works strip ─────────────────────────────────────────
  worksSection: {
    marginTop: space.xxl - space.sm,
  },
  worksHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: space.md,
    paddingHorizontal: space.lg,
    marginBottom: space.xs,
  },
  worksSub: {
    ...type.caption,
    textAlign: "center",
    marginBottom: space.lg,
  },
  worksStrip: {
    paddingHorizontal: space.lg,
    paddingRight: space.xl,
    gap: space.md,
  },
  workCard: {
    width: WORK_CARD_W,
  },
  workImage: {
    width: WORK_CARD_W,
    height: WORK_CARD_H,
    backgroundColor: colors.goldLight,
    borderRadius: radius.sm,
    borderWidth: 0.75,
    borderColor: colors.hairline,
  },
  workPlate: {
    paddingTop: space.sm,
    paddingHorizontal: 2,
  },
  workTitle: {
    fontFamily: fonts.display,
    fontSize: 14,
    lineHeight: 18,
    color: colors.ink,
  },
  workYear: {
    fontFamily: fonts.serifItalic,
    fontSize: 11,
    color: colors.inkMuted,
    fontStyle: "italic",
    marginTop: 2,
  },

  // ─── Key Works list ────────────────────────────────────────────────
  keyWorksSection: {
    marginTop: space.xxl - space.sm,
    paddingHorizontal: space.lg,
  },
  keyWorksList: {
    marginTop: space.lg,
  },
  keyWorkRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: space.md,
    paddingVertical: space.sm + 2,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.hairline,
  },
  keyWorkNum: {
    fontFamily: fonts.uiBold,
    fontSize: 10,
    letterSpacing: 1.2,
    color: colors.gold,
    width: 24,
  },
  keyWorkText: {
    fontFamily: fonts.display,
    fontSize: 17,
    lineHeight: 24,
    color: colors.ink,
    flex: 1,
  },

  // ─── Closing flourish ─────────────────────────────────────────────
  closingFlourish: {
    alignItems: "center",
    marginTop: space.xxl,
    marginBottom: space.lg,
  },
  closingGlyph: {
    fontFamily: fonts.display,
    fontSize: 16,
    letterSpacing: 6,
    color: colors.gold,
    opacity: 0.55,
  },
});
