import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { router, useNavigation } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
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
import { Artist, assetUrl, fetchArtists } from "../../lib/api";
import { colors, radius, space, type } from "../../lib/theme";
import { useGlassTabBarHeight } from "./_layout";

const { width: SCREEN_W } = Dimensions.get("window");
const COL_GAP = space.md;

/**
 * Artists — the salon wall.
 *
 * At the top of the page, the first artist becomes a cinematic
 * "cover" — a 60%-screen full-bleed portrait with a dark gilded
 * gradient, the artist's name in a 56px display serif, dates,
 * and the movement as a gold meta chip. It reads like the
 * frontispiece of an art monograph.
 *
 * Beneath that, "THE MASTERS" divider with a gold ornament, then a
 * two-column masonry of polaroid-style cards with subtle rotation
 * and hairline gold frames. Varying image aspect ratios and random
 * tilts make the wall feel curated and warm — a salon hang rather
 * than a mechanical grid.
 */
export default function ArtistsScreen() {
  const tabBarHeight = useGlassTabBarHeight();
  const navigation = useNavigation();
  const scrollRef = useRef<ScrollView>(null);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchArtists()
      .then(setArtists)
      .catch((e) => setError(e?.message ?? String(e)))
      .finally(() => setLoading(false));
  }, []);

  // Re-tap the Artists tab while already on it → scroll to top.
  useEffect(() => {
    const unsub = navigation.addListener("tabPress" as any, () => {
      if (navigation.isFocused()) {
        scrollRef.current?.scrollTo({ y: 0, animated: true });
      }
    });
    return unsub;
  }, [navigation]);

  const [cover, rest] = useMemo(
    () => [artists[0], artists.slice(1)] as const,
    [artists]
  );

  // Split the rest into two interleaved columns so images flow in
  // a balanced masonry. Odd rows go left, even rows go right.
  const [colA, colB] = useMemo(() => {
    const a: Artist[] = [];
    const b: Artist[] = [];
    rest.forEach((x, i) => (i % 2 === 0 ? a.push(x) : b.push(x)));
    return [a, b];
  }, [rest]);

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
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.root}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={{ paddingBottom: tabBarHeight + space.lg }}
        showsVerticalScrollIndicator={false}
      >
        {/* Page eyebrow floating above the cover */}
        <SafeAreaView edges={["top"]} style={styles.topEyebrow}>
          <Text style={styles.topEyebrowText}>
            ✦  THE HANDS BEHIND THE WORK  ✦
          </Text>
        </SafeAreaView>

        {/* Cover */}
        {cover && <CoverCard artist={cover} />}

        {/* Divider */}
        <View style={styles.dividerWrap}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerGlyph}>❋</Text>
          <View style={styles.dividerLine} />
        </View>
        <Text style={styles.sectionHeadline}>The Masters</Text>
        <Text style={styles.sectionSub}>
          Painters, writers, and poets — hung on a single wall.
        </Text>

        {/* Salon wall — masonry */}
        <View style={styles.masonry}>
          <View style={styles.column}>
            {colA.map((a, i) => (
              <PolaroidCard key={a.id} artist={a} seed={i * 2} />
            ))}
          </View>
          <View style={[styles.column, { marginTop: space.xl }]}>
            {colB.map((a, i) => (
              <PolaroidCard key={a.id} artist={a} seed={i * 2 + 1} />
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Cover — the frontispiece of the page
// ─────────────────────────────────────────────────────────────────────

function CoverCard({ artist }: { artist: Artist }) {
  const portrait = artist.image ? assetUrl(artist.image) : null;
  return (
    <Pressable
      style={({ pressed }) => [
        styles.cover,
        pressed && { opacity: 0.92 },
      ]}
      onPress={() => {
        Haptics.selectionAsync();
        router.push(`/artists/${artist.id}`);
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
          "rgba(10,8,4,0.92)",
        ]}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Gilded corner ornaments to evoke an old-master frame */}
      <View style={[styles.frameCorner, styles.frameTL]} />
      <View style={[styles.frameCorner, styles.frameTR]} />
      <View style={[styles.frameCorner, styles.frameBL]} />
      <View style={[styles.frameCorner, styles.frameBR]} />

      <View style={styles.coverBody}>
        <View style={styles.coverBadge}>
          <Text style={styles.coverBadgeText}>FEATURED</Text>
        </View>
        <Text style={styles.coverName}>{artist.name}</Text>
        <Text style={styles.coverDates}>
          {artist.born}
          {artist.died ? `  –  ${artist.died}` : ""}
          {artist.nationality ? `  ·  ${artist.nationality}` : ""}
        </Text>
        {artist.movement ? (
          <View style={styles.coverChip}>
            <Text style={styles.coverChipText}>{artist.movement}</Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Polaroid — salon-wall tile
// ─────────────────────────────────────────────────────────────────────

// Deterministic pseudo-random tilt so each card keeps its angle on
// re-render but the wall still feels hand-hung.
const TILTS = [-1.6, 1.2, -0.8, 0.5, 1.8, -1.2, 0.9, -0.4];
const ASPECTS = [0.78, 0.95, 0.72, 1.08, 0.85, 0.68];

function PolaroidCard({ artist, seed }: { artist: Artist; seed: number }) {
  const portrait = artist.image ? assetUrl(artist.image) : null;
  const tilt = TILTS[seed % TILTS.length];
  const aspect = ASPECTS[seed % ASPECTS.length];

  return (
    <Pressable
      style={({ pressed }) => [
        styles.polaroid,
        { transform: [{ rotate: `${tilt}deg` }] },
        pressed && {
          opacity: 0.88,
          transform: [{ rotate: `${tilt}deg` }, { scale: 0.97 }],
        },
      ]}
      onPress={() => {
        Haptics.selectionAsync();
        router.push(`/artists/${artist.id}`);
      }}
    >
      {portrait ? (
        <Image
          source={{ uri: portrait }}
          style={[styles.polaroidImage, { aspectRatio: aspect }]}
          contentFit="cover"
          transition={300}
        />
      ) : (
        <View
          style={[
            styles.polaroidImage,
            styles.polaroidPlaceholder,
            { aspectRatio: aspect },
          ]}
        >
          <Text style={styles.placeholderGlyph}>✎</Text>
        </View>
      )}
      <View style={styles.polaroidPlate}>
        <Text style={styles.polaroidName} numberOfLines={2}>
          {artist.name}
        </Text>
        <Text style={styles.polaroidDates} numberOfLines={1}>
          {artist.born}
          {artist.died ? `–${artist.died}` : ""}
        </Text>
        {artist.movement ? (
          <Text style={styles.polaroidMovement} numberOfLines={1}>
            {artist.movement}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

// ─────────────────────────────────────────────────────────────────────

const COVER_HEIGHT = Dimensions.get("window").height * 0.48;
const FRAME_CORNER = 22;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  safe: { flex: 1, backgroundColor: colors.bg },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: space.lg,
  },
  errorText: { ...type.bodySm, color: colors.danger },

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
    fontSize: 45,
    lineHeight: 48,
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
  coverChip: {
    alignSelf: "flex-start",
    marginTop: space.sm,
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
    marginBottom: space.xl,
  },

  // Masonry
  masonry: {
    flexDirection: "row",
    paddingHorizontal: space.lg,
    gap: COL_GAP,
  },
  column: {
    flex: 1,
    gap: space.lg,
  },

  // Polaroid
  polaroid: {
    backgroundColor: colors.surface,
    padding: 8,
    paddingBottom: 14,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: colors.hairline,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 4,
  },
  polaroidImage: {
    width: "100%",
    backgroundColor: colors.goldLight,
  },
  polaroidPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderGlyph: {
    fontSize: 34,
    color: colors.gold,
    opacity: 0.55,
  },
  polaroidPlate: {
    paddingTop: space.sm,
    paddingHorizontal: 2,
  },
  polaroidName: {
    fontFamily: "CormorantGaramond_600SemiBold",
    fontSize: 18,
    lineHeight: 22,
    color: colors.ink,
  },
  polaroidDates: {
    ...type.meta,
    fontSize: 10,
    marginTop: 2,
  },
  polaroidMovement: {
    ...type.meta,
    fontSize: 10,
    color: colors.gold,
    marginTop: 2,
  },
});
