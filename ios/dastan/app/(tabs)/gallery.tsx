import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { assetUrl, fetchGallery, GalleryItem } from "../../lib/api";
import { colors, radius, space, type } from "../../lib/theme";
import { useGlassTabBarHeight } from "./_layout";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const GUTTER = 10;
const NUM_COLUMNS = 2;
const CARD_WIDTH = (SCREEN_WIDTH - GUTTER * 3) / NUM_COLUMNS;

/**
 * Gallery — the collection.
 *
 * The header is an editorial museum-wing entrance: three painting
 * crops form a triptych at the top (full-bleed, like a single long
 * gallery wall), then a gold hairline, a gilded eyebrow, a huge
 * display headline, an italic dedication, a ❋ divider, and a brass
 * stat band showing the scale of the collection.
 *
 * The header is rendered inside ListHeaderComponent so it scrolls
 * with the grid — a destination at the top of the room, not
 * permanent chrome that hogs screen real estate forever.
 *
 * Below: two-column editorial grid of painting plates with varied
 * aspect ratios for a magazine-hang feel. Tap any plate to open the
 * swipeable lightbox.
 */
export default function GalleryScreen() {
  const tabBarHeight = useGlassTabBarHeight();
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchGallery(200)
      .then(setItems)
      .catch((e) => setError(e?.message ?? String(e)))
      .finally(() => setLoading(false));
  }, []);

  // "Rehang the gallery" — force a fresh random sample from the
  // backend. The server re-rolls the selection on every request
  // (see lib/api.ts comment), so refresh = a brand new museum wing.
  const rehang = useCallback(async () => {
    if (refreshing) return;
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const fresh = await fetchGallery(200, { force: true });
      setItems(fresh);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: any) {
      setError(e?.message ?? String(e));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setRefreshing(false);
    }
  }, [refreshing]);

  const data = useMemo(() => items, [items]);

  if (loading) {
    return (
      <View style={styles.root}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.gold} />
        </View>
      </View>
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
      <FlatList
        data={data}
        keyExtractor={(item, i) => `${item.image_url}-${i}`}
        numColumns={NUM_COLUMNS}
        ListHeaderComponent={
          <GalleryHeader
            items={items}
            onRehang={rehang}
            refreshing={refreshing}
          />
        }
        contentContainerStyle={[
          styles.grid,
          { paddingBottom: tabBarHeight + space.md },
        ]}
        columnWrapperStyle={{ gap: GUTTER }}
        ItemSeparatorComponent={() => <View style={{ height: GUTTER }} />}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => <Plate item={item} index={index} />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={rehang}
            tintColor={colors.gold}
            colors={[colors.gold]}
          />
        }
      />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Header — the museum-wing entrance
// ─────────────────────────────────────────────────────────────────────

function GalleryHeader({
  items,
  onRehang,
  refreshing,
}: {
  items: GalleryItem[];
  onRehang: () => void;
  refreshing: boolean;
}) {
  // Slow rotation for the ↻ glyph while the collection is reloading.
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

  // The title page was removed — the grid of plates speaks for
  // itself. All that remains is a single gilded "Rehang the
  // gallery" button sitting inside the top safe area, so the user
  // can still re-roll the collection without a heavy frontispiece.
  return (
    <SafeAreaView edges={["top"]} style={styles.headerWrap}>
      <View style={styles.titlePage}>
        <Pressable
          onPress={onRehang}
          disabled={refreshing}
          accessibilityRole="button"
          accessibilityLabel="Rehang the gallery"
          style={({ pressed }) => [
            styles.rehangBtn,
            pressed && { opacity: 0.8, transform: [{ scale: 0.97 }] },
            refreshing && { opacity: 0.75 },
          ]}
        >
          <Animated.Text
            style={[styles.rehangGlyph, { transform: [{ rotate }] }]}
          >
            ↻
          </Animated.Text>
          <Text style={styles.rehangText}>
            {refreshing ? "REHANGING…" : "REHANG THE GALLERY"}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Plate — a painting card in the grid
// ─────────────────────────────────────────────────────────────────────

function Plate({ item, index }: { item: GalleryItem; index: number }) {
  // Vary card heights pseudo-randomly for the magazine feel.
  const aspect = [0.72, 0.82, 0.68, 0.88, 0.75][index % 5];
  return (
    <Pressable
      style={({ pressed }) => [
        styles.plate,
        { width: CARD_WIDTH },
        pressed && { opacity: 0.82, transform: [{ scale: 0.98 }] },
      ]}
      onPress={() => {
        Haptics.selectionAsync();
        router.push({
          pathname: "/gallery/[index]",
          params: { index: String(index) },
        });
      }}
    >
      <Image
        source={{ uri: assetUrl(item.image_url) }}
        style={[styles.plateImage, { aspectRatio: aspect }]}
        contentFit="cover"
        transition={250}
        placeholder={{ blurhash: "L6PZfSi_.AyE_3t7t7R**0o#DgR4" }}
      />
      <View style={styles.plateText}>
        <Text style={styles.plateTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.plateArtist} numberOfLines={1}>
          {item.artist}
        </Text>
        <View style={styles.plateMetaRow}>
          {item.year ? (
            <Text style={styles.plateMeta}>{item.year}</Text>
          ) : null}
          {item.movement ? (
            <Text style={styles.plateMovement} numberOfLines={1}>
              {item.movement}
            </Text>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  safe: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  error: { ...type.bodySm, color: colors.danger },
  grid: {
    paddingHorizontal: GUTTER,
  },

  // ─── Header ───────────────────────────────────────────────────────
  // The title-page header was removed — the grid of plates is the
  // content. All that remains in the header is a single gilded
  // "Rehang the gallery" pill pinned to the top safe area.
  headerWrap: {
    // Escape the grid's horizontal gutter so the wrap spans edge
    // to edge.
    marginHorizontal: -GUTTER,
    backgroundColor: colors.bg,
    marginBottom: space.md,
  },
  titlePage: {
    paddingTop: space.md,
    paddingBottom: space.sm,
    alignItems: "center",
  },

  // Rehang (refresh) button — a gilded pill in the top safe area.
  rehangBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: space.md,
    paddingVertical: 11,
    paddingHorizontal: 22,
    borderRadius: radius.pill,
    borderWidth: 0.75,
    borderColor: colors.gold,
    backgroundColor: "rgba(184,154,91,0.1)",
  },
  rehangGlyph: {
    color: colors.gold,
    fontSize: 18,
    lineHeight: 20,
    fontFamily: "CormorantGaramond_600SemiBold",
  },
  rehangText: {
    ...type.uiLabel,
    color: colors.goldDark,
    fontSize: 11,
    letterSpacing: 1.8,
  },

  // ─── Plates ───────────────────────────────────────────────────────
  plate: {
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.hairline,
    overflow: "hidden",
  },
  plateImage: {
    width: "100%",
    backgroundColor: colors.goldLight,
  },
  plateText: { padding: space.sm + 2, gap: 2 },
  plateTitle: {
    ...type.titleSm,
    fontSize: 15,
    lineHeight: 19,
  },
  plateArtist: {
    ...type.caption,
    fontSize: 12,
  },
  plateMetaRow: {
    flexDirection: "row",
    gap: space.sm,
    marginTop: 2,
    alignItems: "center",
  },
  plateMeta: { ...type.meta, fontSize: 10 },
  plateMovement: {
    ...type.meta,
    fontSize: 10,
    color: colors.gold,
    flex: 1,
  },
});
