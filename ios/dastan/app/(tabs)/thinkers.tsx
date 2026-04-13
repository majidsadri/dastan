import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
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
import { SchoolsTimeline } from "../../components/SchoolsTimeline";
import {
  assetUrl,
  fetchPhilosophers,
  Philosopher,
  PhilosopherEra,
} from "../../lib/api";
import { colors, radius, space, type } from "../../lib/theme";
import { useGlassTabBarHeight } from "./_layout";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");
const COVER_HEIGHT = SCREEN_H * 0.464;
const FRAME_CORNER = 22;

/**
 * Thinkers — the timeline.
 *
 * At the top, the first philosopher becomes a full-bleed cinematic
 * "frontispiece" — a dark gradient over their portrait, framed by
 * gilded corner ornaments, with their name in display serif and
 * their famous quote rising like a whispered inscription.
 *
 * Below, a gold ❋ divider introduces "The Timeline", then a
 * vertical timeline down the left side marks eras in their own
 * brand color. Each philosopher sits as a card to the right of
 * their era's timeline segment.
 *
 * A floating "Ask the Thinkers" button at the bottom right opens
 * the consult flow.
 */
export default function ThinkersScreen() {
  const tabBarHeight = useGlassTabBarHeight();
  const [philosophers, setPhilosophers] = useState<Philosopher[]>([]);
  const [eras, setEras] = useState<PhilosopherEra[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPhilosophers()
      .then((catalog) => {
        setPhilosophers(catalog.philosophers);
        setEras(catalog.meta.eras);
      })
      .catch((e) => setError(e?.message ?? String(e)))
      .finally(() => setLoading(false));
  }, []);

  const grouped = useMemo(() => {
    return eras
      .map((era) => ({
        era,
        people: philosophers.filter((p) => p.era === era.id),
      }))
      .filter((g) => g.people.length > 0);
  }, [eras, philosophers]);

  const cover = philosophers[0];

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.gold} />
        </View>
      </SafeAreaView>
    );
  }
  if (error) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.center}>
          <Text style={styles.error}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: tabBarHeight + space.lg },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Page eyebrow floating above the cover */}
        <SafeAreaView edges={["top"]} style={styles.topEyebrow}>
          <Text style={styles.topEyebrowText}>
            ✦  MINDS & MILLENNIA  ✦
          </Text>
        </SafeAreaView>

        {/* Cover */}
        {cover && <CoverCard p={cover} />}

        {/* Schools of Thought — the stream graph */}
        <SchoolsTimeline philosophers={philosophers} />

        {/* Divider */}
        <View style={styles.dividerWrap}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerGlyph}>❋</Text>
          <View style={styles.dividerLine} />
        </View>
        <Text style={styles.sectionHeadline}>The Timeline</Text>

        <View style={{ height: space.xl }} />

        {grouped.map(({ era, people }) => (
          <EraBlock key={era.id} era={era} people={people} />
        ))}
      </ScrollView>

      {/* Floating Ask button — lifted above the glass tab bar so
          it sits on top of the pill rather than behind it. */}
      <Pressable
        style={({ pressed }) => [
          styles.askFab,
          { bottom: tabBarHeight + 8 },
          pressed && { transform: [{ scale: 0.96 }], opacity: 0.92 },
        ]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          router.push("/thinkers/ask");
        }}
      >
        <Text style={styles.askFabGlyph}>❋</Text>
        <Text style={styles.askFabText}>Ask the Thinkers</Text>
      </Pressable>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Cover — the frontispiece of the page
// ─────────────────────────────────────────────────────────────────────

function CoverCard({ p }: { p: Philosopher }) {
  const portrait = p.image ? assetUrl(p.image) : null;
  return (
    <Pressable
      style={({ pressed }) => [styles.cover, pressed && { opacity: 0.92 }]}
      onPress={() => {
        Haptics.selectionAsync();
        router.push(`/thinkers/${p.id}`);
      }}
    >
      {portrait && (
        <Image
          source={{ uri: portrait }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={500}
        />
      )}
      <LinearGradient
        colors={[
          "rgba(10,8,4,0.35)",
          "rgba(10,8,4,0.1)",
          "rgba(10,8,4,0.94)",
        ]}
        locations={[0, 0.4, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Gilded corner ornaments */}
      <View style={[styles.frameCorner, styles.frameTL]} />
      <View style={[styles.frameCorner, styles.frameTR]} />
      <View style={[styles.frameCorner, styles.frameBL]} />
      <View style={[styles.frameCorner, styles.frameBR]} />

      <View style={styles.coverBody}>
        <View style={styles.coverBadge}>
          <Text style={styles.coverBadgeText}>FEATURED</Text>
        </View>
        <Text style={styles.coverName}>{p.name}</Text>
        <Text style={styles.coverDates}>
          {p.born}
          {p.died ? `  –  ${p.died}` : ""}
          {p.nationality ? `  ·  ${p.nationality}` : ""}
        </Text>
        {p.famous_quote ? (
          <Text style={styles.coverQuote} numberOfLines={3}>
            “{p.famous_quote}”
          </Text>
        ) : null}
        {p.school ? (
          <View style={styles.coverChip}>
            <Text style={styles.coverChipText}>{p.school.toUpperCase()}</Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

function EraBlock({
  era,
  people,
}: {
  era: PhilosopherEra;
  people: Philosopher[];
}) {
  return (
    <View style={styles.eraBlock}>
      <View style={styles.eraHeader}>
        <View style={[styles.eraDot, { backgroundColor: era.color }]} />
        <View style={styles.eraHeaderText}>
          <Text style={[styles.eraName, { color: era.color }]}>
            {era.name.toUpperCase()}
          </Text>
          <Text style={styles.eraPeriod}>{era.period}</Text>
          <Text style={styles.eraDesc}>{era.description}</Text>
        </View>
      </View>
      <View style={styles.eraBody}>
        <View style={[styles.spine, { backgroundColor: era.color + "55" }]} />
        <View style={styles.peopleCol}>
          {people.map((p) => (
            <ThinkerCard key={p.id} p={p} color={era.color} />
          ))}
        </View>
      </View>
    </View>
  );
}

function ThinkerCard({ p, color }: { p: Philosopher; color: string }) {
  const portrait = p.image ? assetUrl(p.image) : null;
  return (
    <Pressable
      style={({ pressed }) => [
        styles.thinkerCard,
        pressed && { opacity: 0.55 },
      ]}
      onPress={() => {
        Haptics.selectionAsync();
        router.push(`/thinkers/${p.id}`);
      }}
    >
      <View style={[styles.timelineMarker, { borderColor: color }]}>
        {portrait ? (
          <Image
            source={{ uri: portrait }}
            style={styles.portrait}
            contentFit="cover"
            transition={250}
          />
        ) : (
          <View style={[styles.portrait, styles.portraitFallback]}>
            <Text style={{ color, fontSize: 18 }}>◈</Text>
          </View>
        )}
      </View>
      <View style={styles.thinkerBody}>
        <Text style={styles.thinkerName}>{p.name}</Text>
        <Text style={styles.thinkerDates}>
          {p.born}
          {p.died ? `  –  ${p.died}` : ""}
          {p.nationality ? `  ·  ${p.nationality}` : ""}
        </Text>
        {p.famous_quote ? (
          <Text style={styles.thinkerQuote} numberOfLines={3}>
            “{p.famous_quote}”
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const PORTRAIT_SIZE = 68;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingBottom: space.xxl },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: space.xl,
  },
  error: { ...type.bodySm, color: colors.danger, padding: space.lg },

  // Eyebrow floating above cover
  topEyebrow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    alignItems: "center",
    paddingTop: space.md,
  },
  topEyebrowText: {
    ...type.uiLabel,
    color: colors.goldLight,
    fontSize: 10,
    letterSpacing: 2,
  },

  // Cover
  cover: {
    width: SCREEN_W,
    height: COVER_HEIGHT,
    backgroundColor: colors.ink,
    justifyContent: "flex-end",
  },
  frameCorner: {
    position: "absolute",
    width: FRAME_CORNER,
    height: FRAME_CORNER,
    borderColor: colors.gold,
  },
  frameTL: {
    top: space.lg,
    left: space.lg,
    borderTopWidth: 1,
    borderLeftWidth: 1,
  },
  frameTR: {
    top: space.lg,
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
  coverBody: {
    padding: space.lg,
    paddingBottom: space.xl,
    gap: 4,
  },
  coverBadge: {
    alignSelf: "flex-start",
    borderWidth: 0.5,
    borderColor: colors.gold,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
    marginBottom: space.sm,
  },
  coverBadgeText: {
    ...type.uiLabel,
    color: colors.gold,
    fontSize: 9,
    letterSpacing: 1.8,
  },
  coverName: {
    ...type.display,
    fontSize: 43,
    lineHeight: 46,
    color: colors.bg,
    marginBottom: 4,
  },
  coverDates: {
    fontFamily: "CrimsonPro_400Regular_Italic",
    fontSize: 15,
    color: colors.bg,
    opacity: 0.85,
    fontStyle: "italic",
  },
  coverQuote: {
    fontFamily: "CormorantGaramond_500Medium_Italic",
    fontSize: 18,
    lineHeight: 26,
    color: colors.bg,
    opacity: 0.9,
    marginTop: space.md,
    fontStyle: "italic",
    maxWidth: 340,
  },
  coverChip: {
    alignSelf: "flex-start",
    marginTop: space.md,
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    backgroundColor: "rgba(184,154,91,0.18)",
    borderWidth: 0.5,
    borderColor: "rgba(184,154,91,0.6)",
  },
  coverChipText: {
    ...type.uiLabel,
    color: colors.goldLight,
    fontSize: 10,
    letterSpacing: 1.4,
  },

  // Divider
  dividerWrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: space.md,
    marginTop: space.xl,
    marginBottom: space.sm,
    paddingHorizontal: space.xl,
  },
  dividerLine: {
    flex: 1,
    height: 0.5,
    backgroundColor: colors.gold,
    opacity: 0.6,
  },
  dividerGlyph: {
    color: colors.gold,
    fontSize: 18,
    fontFamily: "CormorantGaramond_600SemiBold",
  },
  sectionHeadline: {
    ...type.display,
    fontSize: 38,
    textAlign: "center",
    marginTop: space.xs,
  },
  sectionSub: {
    ...type.caption,
    fontFamily: "CrimsonPro_400Regular_Italic",
    fontStyle: "italic",
    textAlign: "center",
    marginTop: space.xs,
    marginBottom: space.md,
    paddingHorizontal: space.xl,
  },

  // Eras
  eraBlock: { marginBottom: space.xl },
  eraHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: space.lg,
    gap: space.md,
    marginBottom: space.md,
  },
  eraDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginTop: 6,
  },
  eraHeaderText: { flex: 1 },
  eraName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    letterSpacing: 2,
  },
  eraPeriod: { ...type.meta, marginTop: 2 },
  eraDesc: {
    ...type.caption,
    marginTop: space.xs,
    lineHeight: 20,
  },

  eraBody: { flexDirection: "row", paddingLeft: space.lg },
  spine: {
    width: 2,
    marginLeft: PORTRAIT_SIZE / 2 - 1,
    marginRight: space.md,
  },
  peopleCol: { flex: 1 },

  thinkerCard: {
    flexDirection: "row",
    marginLeft: -(PORTRAIT_SIZE / 2 + space.md),
    paddingRight: space.lg,
    marginBottom: space.md,
    gap: space.md,
    alignItems: "flex-start",
  },
  timelineMarker: {
    width: PORTRAIT_SIZE,
    height: PORTRAIT_SIZE,
    borderRadius: PORTRAIT_SIZE / 2,
    borderWidth: 2,
    padding: 3,
    backgroundColor: colors.bg,
  },
  portrait: {
    width: "100%",
    height: "100%",
    borderRadius: PORTRAIT_SIZE / 2,
    backgroundColor: colors.goldLight,
  },
  portraitFallback: {
    justifyContent: "center",
    alignItems: "center",
  },
  thinkerBody: { flex: 1, paddingTop: space.sm },
  thinkerName: {
    ...type.titleSm,
    fontSize: 22,
    lineHeight: 26,
  },
  thinkerDates: { ...type.meta, marginTop: 2 },
  thinkerQuote: {
    ...type.caption,
    marginTop: space.sm,
    lineHeight: 20,
    fontSize: 13,
  },

  askFab: {
    position: "absolute",
    right: space.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: colors.ink,
    borderRadius: radius.pill,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
  },
  askFabGlyph: {
    color: colors.gold,
    fontSize: 18,
    fontFamily: "CormorantGaramond_600SemiBold",
  },
  askFabText: {
    ...type.uiLabel,
    color: colors.bg,
    fontSize: 12,
  },
});
