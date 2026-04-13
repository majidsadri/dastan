import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useRef, useState } from "react";
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
import { PaintingLoader } from "../../components/PaintingLoader";
import {
  Article,
  assetUrl,
  fetchArticles,
  fetchRefreshedCanvas,
  fetchTodayCanvas,
  TodayCanvas,
} from "../../lib/api";
import { useSession } from "../../lib/auth";
import { colors, fonts, radius, space, type } from "../../lib/theme";
import { useGlassTabBarHeight } from "./_layout";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const HERO_HEIGHT = SCREEN_HEIGHT * 0.5;

// Hardcoded hero for the signed-out state — Vermeer's Girl with a
// Pearl Earring is the Mona Lisa of the Dutch Golden Age and sets
// the right tone for an art-lover's app on first launch.
const PEARL_EARRING_URL = assetUrl("/paintings/vermeer.jpg");

/**
 * Today — the front door.
 *
 * Signed out: a full-bleed hero featuring today's painting, the
 * Dastan wordmark, a one-line manifesto, and sign-in / sign-up
 * CTAs. First-time visitors land here and immediately understand
 * the pitch.
 *
 * Signed in: the daily canvas — today's painting, novel page,
 * literature verse, and mood word. This is the rhythmic heart
 * of the product.
 */
export default function TodayScreen() {
  const { session, loading: sessionLoading } = useSession();

  if (sessionLoading) {
    return <PaintingLoader subtitle="Opening the gallery…" />;
  }

  return session ? <SignedIn /> : <SignedOutHero />;
}

// ─────────────────────────────────────────────────────────────────────
//  Signed out — hero onboarding
// ─────────────────────────────────────────────────────────────────────

function SignedOutHero() {
  const tabBarHeight = useGlassTabBarHeight();
  return (
    <View style={styles.heroRoot}>
      <Image
        source={{ uri: PEARL_EARRING_URL }}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        transition={600}
      />
      {/* Gentle bottom scrim — just enough to anchor the wordmark
          and CTAs, not so much that it smothers Vermeer's painting. */}
      <LinearGradient
        colors={[
          "rgba(10,8,4,0)",
          "rgba(10,8,4,0.08)",
          "rgba(10,8,4,0.65)",
        ]}
        locations={[0, 0.55, 1]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView
        style={[
          styles.heroSafe,
          { paddingBottom: tabBarHeight + space.sm },
        ]}
        edges={["top", "bottom"]}
      >
        {/* Top: minimal gilded wordmark + eyebrow. Small and restrained
            so the painting remains the primary subject. */}
        <View style={styles.heroTop}>
          <Text style={styles.heroWordmark}>DASTAN</Text>
          <View style={styles.heroRule} />
          <Text style={styles.heroEyebrow}>EVERY DAY, A NEW TALE</Text>
        </View>

        {/* Bottom: a single short lede + two CTAs. No giant display
            title — let the Vermeer speak. */}
        <View style={styles.heroActions}>
          <Text style={styles.heroLede}>
            A daily ritual of painting, literature, and thought.
          </Text>
          <Pressable
            style={({ pressed }) => [
              styles.ctaPrimary,
              pressed && styles.ctaPressed,
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push("/signin");
            }}
          >
            <Text style={styles.ctaPrimaryText}>Enter the Salon</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.ctaSecondary,
              pressed && { opacity: 0.6 },
            ]}
            onPress={() => router.push("/signup")}
          >
            <Text style={styles.ctaSecondaryText}>New here? Begin the ritual</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────
//  Signed in — daily canvas
// ─────────────────────────────────────────────────────────────────────

type TabId = "painting" | "novel" | "verse";

const TABS: { id: TabId; label: string; glyph: string }[] = [
  { id: "painting", label: "Canvas", glyph: "✦" },
  { id: "novel", label: "One Page", glyph: "❖" },
  { id: "verse", label: "A Verse", glyph: "◈" },
];

function SignedIn() {
  const { signOut, hasProfile, profileChecked, refreshProfile } = useSession();
  const tabBarHeight = useGlassTabBarHeight();
  const [canvas, setCanvas] = useState<TodayCanvas | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("painting");
  const [articles, setArticles] = useState<Article[]>([]);

  // Redirect to profile setup only after the async check finishes
  // and confirms no profile exists — prevents false redirects on
  // every mount while the check is still in flight.
  useEffect(() => {
    if (profileChecked && !hasProfile) {
      router.push("/profile");
    }
  }, [profileChecked, hasProfile]);

  useEffect(() => {
    fetchTodayCanvas()
      .then((d) => setCanvas(d.canvas))
      .catch((e) => setError(e?.message ?? String(e)))
      .finally(() => setLoading(false));
    fetchArticles().then(setArticles).catch(() => {});
  }, []);

  // Rotating glyph while refreshing — same treatment as the gallery
  // "rehang" button for visual consistency.
  const spin = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (refreshing) {
      spin.setValue(0);
      const loop = Animated.loop(
        Animated.timing(spin, {
          toValue: 1,
          duration: 900,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      loop.start();
      return () => loop.stop();
    }
  }, [refreshing, spin]);
  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  // Reroll — calls /api/canvas/refresh to fetch a brand-new random
  // painting + novel page + verse. Mirrors the web app's refresh
  // button at the top of the Today page.
  const handleRefresh = useCallback(async () => {
    if (refreshing) return;
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const d = await fetchRefreshedCanvas();
      setCanvas(d.canvas);
      setActiveTab("painting");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: any) {
      setError(e?.message ?? String(e));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setRefreshing(false);
    }
  }, [refreshing]);

  const painting = canvas?.painting ?? null;
  const novel = canvas?.novel_page ?? null;
  const literature = canvas?.literature ?? null;
  const heroImage = painting?.image_url ? assetUrl(painting.image_url) : null;

  // Keep artist's name tight — the backend sometimes returns
  // "Artist unknown\nChinese". We want only the first line.
  const artistName = painting?.artist
    ? painting.artist.split("\n")[0]
    : "";

  if (loading) {
    return <PaintingLoader />;
  }

  return (
    <ScrollView
      style={styles.canvasRoot}
      contentContainerStyle={{ paddingBottom: tabBarHeight + space.xl }}
      showsVerticalScrollIndicator={false}
    >
      {/* ─── Hero: full-bleed painting with mood word + date ──────── */}
      <View style={styles.canvasHero}>
        {heroImage && (
          <Image
            source={{ uri: heroImage }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={500}
          />
        )}
        <LinearGradient
          colors={[
            "rgba(10,8,4,0.55)",
            "rgba(10,8,4,0.05)",
            "rgba(10,8,4,0.3)",
            "rgba(10,8,4,0.95)",
          ]}
          locations={[0, 0.25, 0.6, 1]}
          style={StyleSheet.absoluteFill}
        />

        {/* Gilded corner ornaments — the "frame" around the day */}
        <View style={[styles.frameCorner, styles.frameTL]} />
        <View style={[styles.frameCorner, styles.frameTR]} />
        <View style={[styles.frameCorner, styles.frameBL]} />
        <View style={[styles.frameCorner, styles.frameBR]} />

        <SafeAreaView edges={["top"]} style={styles.heroInner}>
          {/* ── Top bar: frosted glass profile · date · refresh ───── */}
          <View style={styles.heroTopRow}>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push("/profile");
              }}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Open profile"
              style={({ pressed }) => [
                styles.glassBtn,
                pressed && styles.glassBtnPressed,
              ]}
            >
              <BlurView intensity={40} tint="dark" style={styles.glassBtnBlur}>
                <Text style={styles.glassBtnIcon}>✦</Text>
              </BlurView>
            </Pressable>

            <View style={styles.heroDatePill}>
              <BlurView intensity={30} tint="dark" style={styles.heroDateBlur}>
                <Text style={styles.heroDateText}>
                  {canvas?.date ?? "TODAY"}
                </Text>
              </BlurView>
            </View>

            <Pressable
              onPress={handleRefresh}
              disabled={refreshing}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Refresh today's canvas"
              style={({ pressed }) => [
                styles.glassBtn,
                pressed && styles.glassBtnPressed,
              ]}
            >
              <BlurView intensity={40} tint="dark" style={styles.glassBtnBlur}>
                <Animated.Text
                  style={[styles.glassRefreshIcon, { transform: [{ rotate }] }]}
                >
                  ❋
                </Animated.Text>
              </BlurView>
            </Pressable>
          </View>

          <View style={styles.heroBottom}>
            {canvas?.mood_word ? (
              <Text style={styles.heroMoodLabel}>THE MOOD</Text>
            ) : null}
            {canvas?.mood_word ? (
              <Text style={styles.heroMood}>{canvas.mood_word}</Text>
            ) : null}
            {painting ? (
              <>
                <Text style={styles.heroPaintingTitle} numberOfLines={2}>
                  {painting.title}
                </Text>
                <Text style={styles.heroPaintingMeta}>
                  {artistName}
                  {painting.year ? `  ·  ${painting.year}` : ""}
                </Text>
              </>
            ) : null}
          </View>
        </SafeAreaView>
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}

      {/* ─── Tab bar ────────────────────────────────────────────────── */}
      <View style={styles.tabs}>
        {TABS.map((t) => {
          const active = activeTab === t.id;
          return (
            <Pressable
              key={t.id}
              onPress={() => {
                Haptics.selectionAsync();
                setActiveTab(t.id);
              }}
              style={({ pressed }) => [
                styles.tab,
                pressed && { opacity: 0.7 },
              ]}
            >
              <Text
                style={[
                  styles.tabGlyph,
                  active ? styles.tabGlyphActive : styles.tabGlyphInactive,
                ]}
              >
                {t.glyph}
              </Text>
              <Text
                style={[
                  styles.tabLabel,
                  active ? styles.tabLabelActive : styles.tabLabelInactive,
                ]}
              >
                {t.label.toUpperCase()}
              </Text>
              <View
                style={[
                  styles.tabUnderline,
                  active && styles.tabUnderlineActive,
                ]}
              />
            </Pressable>
          );
        })}
      </View>

      {/* ─── Tab content ───────────────────────────────────────────── */}
      <View style={styles.tabBody}>
        {activeTab === "painting" && painting && (
          <PaintingTab painting={painting} />
        )}
        {activeTab === "novel" && novel && <NovelTab novel={novel} />}
        {activeTab === "verse" && literature && (
          <VerseTab literature={literature} />
        )}
      </View>

      {/* ─── Readings carousel ──────────────────────────────────── */}
      {articles.length > 0 && <ReadingsCarousel articles={articles} />}

      {/* ─── Colophon: the end-of-chapter ritual ─────────────────── */}
      <View style={styles.colophon}>
        {/* Triple-rule ornament: thin · thick · thin */}
        <View style={styles.colophonOrnament}>
          <View style={styles.colophonRuleThin} />
          <View style={{ height: 3 }} />
          <View style={styles.colophonRuleThick} />
          <View style={{ height: 3 }} />
          <View style={styles.colophonRuleThin} />
        </View>

        {/* Monogram circle */}
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push("/profile");
          }}
          style={({ pressed }) => [
            styles.colophonAvatar,
            pressed && { transform: [{ scale: 0.94 }], opacity: 0.85 },
          ]}
        >
          <View style={styles.colophonAvatarRing}>
            <Text style={styles.colophonAvatarGlyph}>✦</Text>
          </View>
        </Pressable>

        <Text style={styles.colophonTitle}>Your Cabinet</Text>
        <Text style={styles.colophonSub}>
          Curated for your eye and ear
        </Text>

        <Pressable
          onPress={() => {
            Haptics.selectionAsync();
            router.push("/profile");
          }}
          style={({ pressed }) => [
            styles.colophonEditBtn,
            pressed && { opacity: 0.6, transform: [{ scale: 0.97 }] },
          ]}
        >
          <Text style={styles.colophonEditText}>Edit preferences</Text>
        </Pressable>

        {/* Sign out — barely there, like a printer's mark */}
        <View style={styles.colophonFootmark}>
          <View style={styles.colophonFootLine} />
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              signOut();
            }}
            style={({ pressed }) => [pressed && { opacity: 0.3 }]}
          >
            <Text style={styles.colophonSignOut}>Leave the salon</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Tab bodies — each renders one kind of daily content
// ─────────────────────────────────────────────────────────────────────

function PaintingTab({ painting }: { painting: NonNullable<TodayCanvas["painting"]> }) {
  const artistLines = painting.artist.split("\n");
  return (
    <View>
      <Text style={styles.sectionEyebrow}>THE PAINTING</Text>
      <Text style={styles.sectionTitle}>{painting.title}</Text>
      <Text style={styles.sectionByline}>
        {artistLines.join(" · ")}
        {painting.year ? `  ·  ${painting.year}` : ""}
      </Text>
      {painting.movement || painting.origin_country ? (
        <Text style={styles.sectionMeta}>
          {painting.movement}
          {painting.origin_country ? `  ·  ${painting.origin_country}` : ""}
        </Text>
      ) : null}
      {painting.description ? (
        <Text style={styles.bodyText}>{painting.description}</Text>
      ) : null}
    </View>
  );
}

function NovelTab({ novel }: { novel: NonNullable<TodayCanvas["novel_page"]> }) {
  const paragraphs = (novel.content || "").split(/\n\s*\n/);
  const progress =
    novel.total_pages > 0
      ? Math.min(1, Math.max(0, novel.page_number / novel.total_pages))
      : 0;
  return (
    <View>
      <Text style={styles.sectionEyebrow}>ONE PAGE</Text>
      <Text style={styles.sectionTitle}>{novel.novel_title}</Text>
      <Text style={styles.sectionByline}>
        {novel.author}
        {novel.author_country ? `  ·  ${novel.author_country}` : ""}
      </Text>
      <Text style={styles.sectionMeta}>
        Page {novel.page_number} of {novel.total_pages}
      </Text>
      {/* Slim progress bar — how far into the novel we are */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>
      {paragraphs.map((p, i) => (
        <Text
          key={i}
          style={[styles.bodyText, i > 0 && { marginTop: space.md }]}
        >
          {p}
        </Text>
      ))}
    </View>
  );
}

function VerseTab({ literature }: { literature: NonNullable<TodayCanvas["literature"]> }) {
  const [showOriginal, setShowOriginal] = useState(false);
  const lines = (literature.content || "").split("\n");
  return (
    <View>
      <Text style={styles.sectionEyebrow}>
        {(literature.genre || "VERSE").toUpperCase()}
      </Text>
      <Text style={styles.sectionTitle}>{literature.title}</Text>
      <Text style={styles.sectionByline}>
        {literature.author}
        {literature.author_country ? `  ·  ${literature.author_country}` : ""}
      </Text>

      <View style={styles.verseBlock}>
        {lines.map((ln, i) =>
          ln.trim() === "" ? (
            <View key={i} style={{ height: 10 }} />
          ) : (
            <Text key={i} style={styles.verseLine}>
              {ln}
            </Text>
          )
        )}
      </View>

      {literature.original_text ? (
        <Pressable
          onPress={() => {
            Haptics.selectionAsync();
            setShowOriginal((s) => !s);
          }}
          style={({ pressed }) => [
            styles.originalToggle,
            pressed && { opacity: 0.7 },
          ]}
        >
          <Text style={styles.originalToggleText}>
            {showOriginal
              ? "HIDE ORIGINAL"
              : `READ IN ${(literature.original_language || "ORIGINAL").toUpperCase()}`}
          </Text>
        </Pressable>
      ) : null}

      {showOriginal && literature.original_text ? (
        <View style={styles.originalBlock}>
          {literature.original_text.split("\n").map((ln, i) =>
            ln.trim() === "" ? (
              <View key={i} style={{ height: 10 }} />
            ) : (
              <Text key={i} style={styles.originalLine}>
                {ln}
              </Text>
            )
          )}
        </View>
      ) : null}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Readings carousel — horizontal swipe of editorial article cards
// ─────────────────────────────────────────────────────────────────────

const ROMAN = ["I", "II", "III", "IV", "V"];
const CARD_W = Dimensions.get("window").width * 0.42;
const CARD_GAP = space.sm;

function ReadingsCarousel({ articles }: { articles: Article[] }) {
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
        snapToInterval={CARD_W + CARD_GAP}
        decelerationRate="fast"
        contentContainerStyle={styles.readingsScroll}
        renderItem={({ item, index }) => (
          <ReadingCard article={item} index={index} />
        )}
      />
    </View>
  );
}

function ReadingCard({ article, index }: { article: Article; index: number }) {
  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync();
        router.push({ pathname: "/thinkers/article", params: { id: article.id } });
      }}
      style={({ pressed }) => [
        styles.readingCard,
        pressed && { opacity: 0.75, transform: [{ scale: 0.97 }] },
      ]}
    >
      <View style={styles.readingAccent} />
      <View style={styles.readingBody}>
        <Text style={styles.readingNumeral}>
          {ROMAN[index] ?? `${index + 1}`}
        </Text>
        <Text style={styles.readingTitle} numberOfLines={2}>
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

// ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  // Hero (signed out)
  heroRoot: { flex: 1, backgroundColor: colors.ink },
  heroSafe: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: space.lg,
  },

  // Top of the hero: a small gilded wordmark with a hairline rule and
  // an eyebrow tagline. Minimal so Vermeer's Girl with a Pearl Earring
  // reads as the hero, not chrome stacked on top of her.
  heroTop: {
    paddingTop: space.md,
    alignItems: "center",
  },
  heroWordmark: {
    fontFamily: "CormorantGaramond_600SemiBold",
    fontSize: 22,
    lineHeight: 26,
    letterSpacing: 6,
    color: colors.goldLight,
  },
  heroRule: {
    width: 28,
    height: 0.75,
    backgroundColor: colors.gold,
    opacity: 0.8,
    marginTop: 8,
    marginBottom: 8,
  },
  heroEyebrow: {
    ...type.uiLabel,
    fontSize: 9,
    letterSpacing: 2,
    color: colors.bg,
    opacity: 0.7,
  },

  // Bottom of the hero: lede + two CTAs. Tight spacing, no giant
  // display title — the Vermeer does the heavy lifting visually.
  heroActions: {
    gap: space.sm,
  },
  heroLede: {
    fontFamily: "CrimsonPro_400Regular_Italic",
    fontSize: 16,
    lineHeight: 24,
    color: colors.bg,
    opacity: 0.92,
    textAlign: "center",
    fontStyle: "italic",
    marginBottom: space.sm,
    maxWidth: 320,
    alignSelf: "center",
  },
  ctaPrimary: {
    backgroundColor: colors.gold,
    paddingVertical: 16,
    borderRadius: radius.pill,
    alignItems: "center",
  },
  ctaPressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  ctaPrimaryText: {
    ...type.uiLabel,
    color: colors.bg,
    fontSize: 12,
    letterSpacing: 1.5,
  },
  ctaSecondary: { paddingVertical: 10, alignItems: "center" },
  ctaSecondaryText: {
    ...type.meta,
    color: colors.bg,
    opacity: 0.8,
    fontSize: 12,
  },

  // ─── Canvas (signed in) ─────────────────────────────────────────
  canvasRoot: { flex: 1, backgroundColor: colors.bg },

  // Hero
  canvasHero: {
    height: HERO_HEIGHT,
    backgroundColor: colors.ink,
    justifyContent: "flex-end",
  },
  frameCorner: {
    position: "absolute",
    width: 22,
    height: 22,
    borderColor: colors.gold,
    opacity: 0.85,
  },
  frameTL: { top: space.lg, left: space.lg, borderTopWidth: 1, borderLeftWidth: 1 },
  frameTR: { top: space.lg, right: space.lg, borderTopWidth: 1, borderRightWidth: 1 },
  frameBL: { bottom: space.lg, left: space.lg, borderBottomWidth: 1, borderLeftWidth: 1 },
  frameBR: { bottom: space.lg, right: space.lg, borderBottomWidth: 1, borderRightWidth: 1 },
  heroInner: { flex: 1, justifyContent: "space-between" },

  // ── Frosted glass top bar ──────────────────────────────────────────
  heroTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: space.lg,
    paddingTop: space.xs,
  },

  // Shared glass button (profile + refresh)
  glassBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(232,223,200,0.3)",
  },
  glassBtnPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.9 }],
  },
  glassBtnBlur: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(10,8,4,0.25)",
  },
  glassBtnIcon: {
    color: colors.goldLight,
    fontSize: 16,
    fontFamily: fonts.display,
  },
  glassRefreshIcon: {
    color: colors.goldLight,
    fontSize: 18,
    fontFamily: fonts.display,
  },

  // Date pill — also frosted
  heroDatePill: {
    borderRadius: radius.pill,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(232,223,200,0.2)",
  },
  heroDateBlur: {
    paddingVertical: 7,
    paddingHorizontal: 18,
    backgroundColor: "rgba(10,8,4,0.2)",
  },
  heroDateText: {
    ...type.uiLabel,
    color: colors.goldLight,
    fontSize: 10,
    letterSpacing: 2.5,
  },
  heroBottom: {
    padding: space.lg,
    paddingBottom: space.xl,
  },
  heroMoodLabel: {
    ...type.uiLabel,
    color: colors.goldLight,
    fontSize: 9,
    letterSpacing: 2,
    marginBottom: 4,
  },
  heroMood: {
    ...type.display,
    fontSize: 44,
    lineHeight: 48,
    color: colors.bg,
    textTransform: "capitalize",
    marginBottom: space.md,
  },
  heroPaintingTitle: {
    fontFamily: fonts.serifItalic,
    fontSize: 18,
    lineHeight: 24,
    color: colors.bg,
    fontStyle: "italic",
    opacity: 0.95,
  },
  heroPaintingMeta: {
    ...type.meta,
    color: colors.bg,
    opacity: 0.75,
    marginTop: 2,
    fontSize: 12,
  },

  errorText: {
    ...type.bodySm,
    color: colors.danger,
    paddingHorizontal: space.lg,
    paddingTop: space.md,
  },

  // Tabs
  tabs: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: space.md,
    paddingTop: space.lg,
    paddingBottom: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.hairline,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: space.sm,
  },
  tabGlyph: {
    fontFamily: fonts.display,
    fontSize: 20,
    lineHeight: 24,
    marginBottom: 2,
  },
  tabGlyphActive: { color: colors.gold },
  tabGlyphInactive: { color: colors.inkMuted },
  tabLabel: {
    ...type.uiLabel,
    fontSize: 10,
    letterSpacing: 1.5,
    marginTop: 2,
  },
  tabLabelActive: { color: colors.goldDark },
  tabLabelInactive: { color: colors.inkMuted },
  tabUnderline: {
    marginTop: 6,
    height: 1.5,
    width: 20,
    borderRadius: 1,
    backgroundColor: "transparent",
  },
  tabUnderlineActive: { backgroundColor: colors.gold },

  // Tab body
  tabBody: {
    paddingHorizontal: space.lg,
    paddingTop: space.xl,
  },
  sectionEyebrow: {
    ...type.uiLabel,
    fontSize: 10,
    letterSpacing: 2,
    color: colors.gold,
    marginBottom: space.sm,
  },
  sectionTitle: {
    ...type.display,
    fontSize: 30,
    lineHeight: 34,
    color: colors.ink,
    marginBottom: space.xs,
  },
  sectionByline: {
    fontFamily: fonts.serifItalic,
    fontSize: 15,
    color: colors.inkSoft,
    fontStyle: "italic",
    marginBottom: 2,
  },
  sectionMeta: {
    ...type.meta,
    fontSize: 11,
    color: colors.inkMuted,
    marginTop: 2,
  },
  bodyText: {
    ...type.body,
    fontSize: 16,
    lineHeight: 26,
    color: colors.ink,
    marginTop: space.lg,
  },

  // Novel progress
  progressTrack: {
    height: 2,
    marginTop: space.md,
    marginBottom: space.sm,
    backgroundColor: "rgba(184,154,91,0.2)",
    borderRadius: 1,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.gold,
  },

  // Verse
  verseBlock: {
    marginTop: space.lg,
    paddingLeft: space.md,
    borderLeftWidth: 1,
    borderLeftColor: colors.gold,
  },
  verseLine: {
    fontFamily: "CormorantGaramond_500Medium_Italic",
    fontSize: 19,
    lineHeight: 29,
    color: colors.ink,
    fontStyle: "italic",
  },
  originalToggle: {
    alignSelf: "flex-start",
    marginTop: space.lg,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    borderWidth: 0.5,
    borderColor: colors.gold,
    backgroundColor: "rgba(184,154,91,0.08)",
  },
  originalToggleText: {
    ...type.uiLabel,
    fontSize: 10,
    letterSpacing: 1.6,
    color: colors.goldDark,
  },
  originalBlock: {
    marginTop: space.md,
    paddingLeft: space.md,
    borderLeftWidth: 1,
    borderLeftColor: "rgba(184,154,91,0.4)",
  },
  originalLine: {
    fontFamily: "CormorantGaramond_500Medium_Italic",
    fontSize: 17,
    lineHeight: 26,
    color: colors.inkSoft,
    fontStyle: "italic",
    writingDirection: "rtl",
    textAlign: "right",
  },

  // ── Readings carousel ────────────────────────────────────────────────
  readingsSection: {
    marginTop: space.xxl,
    marginBottom: space.sm,
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
    paddingHorizontal: space.lg,
    gap: CARD_GAP,
  },
  readingCard: {
    width: CARD_W,
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
    fontSize: 20,
    lineHeight: 22,
    color: colors.gold,
    marginBottom: 4,
  },
  readingTitle: {
    fontFamily: "CormorantGaramond_600SemiBold",
    fontSize: 17,
    lineHeight: 21,
    color: colors.ink,
    marginBottom: 3,
  },
  readingSubject: {
    fontFamily: "CrimsonPro_400Regular_Italic",
    fontSize: 11,
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

  // ── Colophon: book-ending the daily page ────────────────────────────
  colophon: {
    marginTop: space.xxl + space.lg,
    paddingHorizontal: space.xl,
    alignItems: "center",
    paddingBottom: space.lg,
  },

  // Triple-rule ornament (thin / thick / thin)
  colophonOrnament: {
    width: 80,
    alignItems: "center",
    marginBottom: space.xl,
  },
  colophonRuleThin: {
    width: 80,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.gold,
    opacity: 0.4,
  },
  colophonRuleThick: {
    width: 40,
    height: 1.5,
    backgroundColor: colors.gold,
    opacity: 0.6,
    borderRadius: 1,
  },

  // Avatar ring
  colophonAvatar: {
    marginBottom: space.md,
  },
  colophonAvatarRing: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: colors.gold,
    backgroundColor: colors.ink,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  colophonAvatarGlyph: {
    color: colors.gold,
    fontSize: 20,
    fontFamily: fonts.display,
  },

  // Text
  colophonTitle: {
    fontFamily: fonts.display,
    fontSize: 22,
    lineHeight: 26,
    color: colors.ink,
    marginBottom: 4,
  },
  colophonSub: {
    fontFamily: fonts.serifItalic,
    fontSize: 14,
    lineHeight: 20,
    color: colors.inkMuted,
    fontStyle: "italic",
    marginBottom: space.lg,
  },

  // Edit button
  colophonEditBtn: {
    paddingVertical: 11,
    paddingHorizontal: 28,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.gold,
    backgroundColor: "rgba(184,154,91,0.06)",
    marginBottom: space.xxl,
  },
  colophonEditText: {
    ...type.uiLabel,
    fontSize: 11,
    letterSpacing: 1.8,
    color: colors.goldDark,
  },

  // Footmark — printer's mark at the very bottom
  colophonFootmark: {
    alignItems: "center",
    gap: space.md,
  },
  colophonFootLine: {
    width: 24,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.inkMuted,
    opacity: 0.3,
  },
  colophonSignOut: {
    fontFamily: fonts.serifItalic,
    fontSize: 12,
    color: colors.inkMuted,
    opacity: 0.45,
    fontStyle: "italic",
    letterSpacing: 0.3,
  },
});
