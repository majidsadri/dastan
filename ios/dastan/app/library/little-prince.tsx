import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
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
import {
  bookAssetUrl,
  fetchLppCatalog,
  LppCatalog,
  LppScene,
  roman,
} from "../../lib/books";
import { colors, fonts, radius, space, type } from "../../lib/theme";

/**
 * The Little Prince reader — 13 scenes on a single scrollable page.
 * The currently-selected scene expands to show its illustration,
 * French & English quote, and the Dastan essay. Other scenes stay
 * collapsed as chips for quick jumping. Catalog is fetched from the
 * production web origin so content stays in one place.
 */

export default function LittlePrinceReader() {
  const [catalog, setCatalog] = useState<LppCatalog | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    fetchLppCatalog()
      .then(setCatalog)
      .catch((e) => setError(e instanceof Error ? e.message : "load failed"));
  }, []);

  if (error) return <ErrorState message={error} />;
  if (!catalog) return <LoadingState />;

  const scene = catalog.scenes[index];

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <TopBar title="The Little Prince" />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Header scene={scene} />

        <ConstellationStrip
          scenes={catalog.scenes}
          index={index}
          onSelect={(i) => {
            Haptics.selectionAsync();
            setIndex(i);
          }}
        />

        <Essay text={scene.essay} />

        <PullQuote text={scene.pull_quote} />

        <Nav
          prev={index > 0 ? catalog.scenes[index - 1] : null}
          next={index < catalog.scenes.length - 1 ? catalog.scenes[index + 1] : null}
          onPrev={() => {
            Haptics.selectionAsync();
            setIndex(index - 1);
          }}
          onNext={() => {
            Haptics.selectionAsync();
            setIndex(index + 1);
          }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

/* ── Top bar with back button ──────────────────────────────── */

function TopBar({ title }: { title: string }) {
  return (
    <View style={styles.topBar}>
      <Pressable
        onPress={() => router.back()}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel="Back to Shelf"
      >
        <Text style={styles.topBack}>← SHELF</Text>
      </Pressable>
      <Text style={styles.topTitle} numberOfLines={1}>
        {title}
      </Text>
      <View style={{ width: 70 }} />
    </View>
  );
}

/* ── Header — chapter label + Roman + title + illustration ── */

function Header({ scene }: { scene: LppScene }) {
  return (
    <View style={styles.header}>
      <Text style={styles.bookTitle}>{scene.title}</Text>
      <View style={styles.illoWrap}>
        <Image
          source={{ uri: bookAssetUrl(scene.image) }}
          style={styles.illo}
          contentFit="contain"
          transition={220}
        />
      </View>
    </View>
  );
}

/* ── Horizontal chapter-jump strip ─────────────────────────── */

function ConstellationStrip({
  scenes,
  index,
  onSelect,
}: {
  scenes: LppScene[];
  index: number;
  onSelect: (i: number) => void;
}) {
  return (
    <View style={{ marginBottom: space.xl }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.stripRow}
      >
        {scenes.map((s, i) => {
          const active = i === index;
          return (
            <Pressable
              key={s.id}
              onPress={() => onSelect(i)}
              style={[
                styles.chip,
                active ? styles.chipActive : styles.chipIdle,
                {
                  width: active ? 120 : 52,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Chapter ${s.number}: ${s.title}`}
            >
              <View
                style={[
                  styles.chipThumb,
                  { backgroundColor: active ? "rgba(255,255,255,0.9)" : colors.surfaceMuted },
                ]}
              >
                <Image
                  source={{ uri: bookAssetUrl(s.image) }}
                  style={{ width: 28, height: 28 }}
                  contentFit="contain"
                />
              </View>
              <Text
                style={[
                  styles.chipRoman,
                  { color: active ? "rgba(253,251,247,0.9)" : colors.inkMuted },
                ]}
              >
                {roman(s.number)}
              </Text>
              {active && (
                <Text style={styles.chipTitle} numberOfLines={1}>
                  {s.title.toUpperCase()}
                </Text>
              )}
            </Pressable>
          );
        })}
      </ScrollView>
      <View style={styles.progressBar}>
        <LinearGradient
          colors={["rgba(139,105,20,0.55)", "rgba(212,184,90,0.95)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[
            styles.progressFill,
            { width: `${((index + 1) / scenes.length) * 100}%` },
          ]}
        />
      </View>
    </View>
  );
}

/* ── Essay ──────────────────────────────────────────────────── */

function Essay({ text }: { text: string }) {
  const paragraphs = text
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
  return (
    <View style={styles.essayBlock}>
      {paragraphs.map((p, i) => (
        <Text key={i} style={[styles.essayP, i === 0 && { marginTop: 0 }]}>
          {p}
        </Text>
      ))}
    </View>
  );
}

/* ── Pull quote ─────────────────────────────────────────────── */

function PullQuote({ text }: { text: string }) {
  return (
    <View style={styles.pullWrap}>
      <Text style={styles.pullOrn}>✦</Text>
      <Text style={styles.pullText}>{text}</Text>
      <Text style={styles.pullOrn}>✦</Text>
    </View>
  );
}

/* ── Prev / Next ───────────────────────────────────────────── */

function Nav({
  prev,
  next,
  onPrev,
  onNext,
}: {
  prev: LppScene | null;
  next: LppScene | null;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <View style={styles.nav}>
      <View style={styles.navHalf}>
        {prev ? (
          <Pressable onPress={onPrev} hitSlop={8}>
            <Text style={styles.navLabel}>← PREVIOUS · {roman(prev.number)}</Text>
            <Text style={styles.navTitle} numberOfLines={2}>
              {prev.title}
            </Text>
          </Pressable>
        ) : null}
      </View>
      <View style={[styles.navHalf, { alignItems: "flex-end" }]}>
        {next ? (
          <Pressable onPress={onNext} hitSlop={8}>
            <Text style={[styles.navLabel, { textAlign: "right" }]}>
              NEXT · {roman(next.number)} →
            </Text>
            <Text style={[styles.navTitle, { textAlign: "right" }]} numberOfLines={2}>
              {next.title}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

/* ── Loading / Error ───────────────────────────────────────── */

function LoadingState() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.center}>
        <ActivityIndicator color={colors.gold} />
        <Text style={styles.loading}>Opening the book…</Text>
      </View>
    </SafeAreaView>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.center}>
        <Text style={styles.error}>Could not open the book.</Text>
        <Text style={styles.errorSub}>{message}</Text>
        <Pressable onPress={() => router.back()} style={styles.errorBack}>
          <Text style={styles.errorBackText}>Return to Shelf</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

/* ── Styles ─────────────────────────────────────────────────── */

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: {
    paddingHorizontal: space.lg,
    paddingBottom: space.xxl,
  },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: space.lg },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.hairline,
  },
  topBack: {
    fontFamily: fonts.uiBold,
    fontSize: 10,
    letterSpacing: 2,
    color: colors.gold,
  },
  topTitle: {
    fontFamily: fonts.displayItalic,
    fontSize: 16,
    color: colors.ink,
  },

  header: {
    alignItems: "center",
    paddingTop: space.md,
    paddingBottom: space.sm,
  },
  eyebrow: {
    fontFamily: fonts.uiBold,
    fontSize: 10,
    letterSpacing: 3,
    color: colors.gold,
  },
  bookTitle: {
    fontFamily: fonts.displayItalic,
    fontSize: 40,
    lineHeight: 46,
    color: colors.ink,
    textAlign: "center",
    marginTop: 10,
    paddingHorizontal: space.md,
  },
  illoWrap: {
    width: "100%",
    height: 220,
    marginTop: space.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  illo: { width: "80%", height: "100%" },

  stripEyebrow: {
    ...type.meta,
    textAlign: "center",
    letterSpacing: 3,
    marginBottom: space.sm,
  },
  stripRow: {
    gap: 8,
    paddingHorizontal: space.sm,
    paddingBottom: space.sm,
    alignItems: "stretch",
  },
  chip: {
    borderRadius: 18,
    paddingVertical: 8,
    paddingHorizontal: 6,
    alignItems: "center",
  },
  chipIdle: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "rgba(44,36,24,0.12)",
  },
  chipActive: {
    backgroundColor: "#6E5210",
    borderWidth: 1,
    borderColor: "#6E5210",
    shadowColor: "#8B6914",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  chipThumb: {
    width: 36,
    height: 36,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  chipRoman: {
    fontFamily: fonts.displayItalic,
    fontSize: 11,
    marginTop: 4,
  },
  chipTitle: {
    fontFamily: fonts.uiBold,
    fontSize: 8,
    letterSpacing: 1.5,
    color: "rgba(253,251,247,0.95)",
    marginTop: 3,
  },
  progressBar: {
    marginTop: 8,
    marginHorizontal: space.lg,
    height: 2,
    borderRadius: 2,
    backgroundColor: "rgba(44,36,24,0.1)",
    overflow: "hidden",
  },
  progressFill: { height: "100%" },

  quoteBlock: {
    alignItems: "center",
    paddingVertical: space.xl,
  },
  quoteFr: {
    fontFamily: fonts.displayItalic,
    fontSize: 22,
    lineHeight: 30,
    color: colors.ink,
    textAlign: "center",
    marginBottom: 10,
  },
  quoteEn: {
    fontFamily: fonts.serifItalic,
    fontSize: 15,
    lineHeight: 22,
    color: colors.inkSoft,
    textAlign: "center",
    fontStyle: "italic",
  },

  essayBlock: {
    paddingVertical: space.md,
  },
  essayP: {
    fontFamily: fonts.serif,
    fontSize: 17,
    lineHeight: 29,
    color: colors.ink,
    marginTop: space.md,
  },

  pullWrap: {
    alignItems: "center",
    paddingVertical: space.xl,
  },
  pullOrn: {
    fontFamily: fonts.display,
    fontSize: 14,
    color: colors.gold,
    opacity: 0.7,
    marginVertical: 8,
  },
  pullText: {
    fontFamily: fonts.displayItalic,
    fontSize: 22,
    lineHeight: 30,
    color: colors.ink,
    textAlign: "center",
    paddingHorizontal: space.md,
  },

  nav: {
    flexDirection: "row",
    paddingTop: space.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.hairline,
  },
  navHalf: { flex: 1 },
  navLabel: {
    fontFamily: fonts.uiBold,
    fontSize: 9,
    letterSpacing: 2,
    color: colors.inkMuted,
    marginBottom: 6,
  },
  navTitle: {
    fontFamily: fonts.displayItalic,
    fontSize: 17,
    lineHeight: 22,
    color: colors.ink,
  },

  loading: {
    ...type.caption,
    marginTop: space.sm,
  },
  error: {
    fontFamily: fonts.display,
    fontSize: 20,
    color: colors.ink,
  },
  errorSub: {
    ...type.caption,
    marginTop: 6,
    textAlign: "center",
  },
  errorBack: {
    marginTop: space.lg,
    paddingVertical: 10,
    paddingHorizontal: space.lg,
    borderWidth: 1,
    borderColor: colors.gold,
    borderRadius: radius.pill,
  },
  errorBackText: {
    fontFamily: fonts.uiBold,
    fontSize: 11,
    letterSpacing: 2,
    color: colors.goldDark,
  },
});
