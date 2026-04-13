import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewToken,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  assetUrl,
  fetchGallery,
  GalleryItem,
  getCachedGallery,
} from "../../lib/api";
import { colors, radius, space, type } from "../../lib/theme";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

/**
 * Gallery lightbox — horizontal paged viewer.
 *
 * Full-bleed viewer on a deep-ink background. The current painting
 * occupies the top 70% of the screen with `contentFit="contain"`
 * so nothing ever crops awkwardly. Below the image, a gilded caption
 * drawer holds the title in serif, artist + year in italic, and the
 * movement as a gold meta tag.
 *
 * Swipe horizontally to page between paintings; the page indicator
 * at the top ("12 / 200") updates as you go. Tap the close glyph
 * or swipe back to return to the grid.
 *
 * We refetch the gallery here rather than passing it as a param —
 * the whole list is <50 kB JSON and expo-image has already cached
 * the thumbnails, so scrubbing is instant.
 */
export default function GalleryDetailScreen() {
  const { index: indexParam } = useLocalSearchParams<{ index: string }>();
  const startIndex = Math.max(0, parseInt(indexParam ?? "0", 10) || 0);

  // Seed from the in-memory cache the grid populated so we open the
  // same painting the user tapped — the backend returns a fresh random
  // sample on every call, so refetching would misalign the indices.
  const cached = getCachedGallery();
  const [items, setItems] = useState<GalleryItem[]>(cached ?? []);
  const [loading, setLoading] = useState(!cached);
  const [error, setError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(startIndex);
  const listRef = useRef<FlatList<GalleryItem>>(null);

  useEffect(() => {
    if (cached) return; // cache hit — nothing to load
    fetchGallery(200)
      .then((data) => {
        setItems(data);
        setActiveIndex(Math.min(startIndex, Math.max(0, data.length - 1)));
      })
      .catch((e) => setError(e?.message ?? String(e)))
      .finally(() => setLoading(false));
  }, [startIndex, cached]);

  // Keep activeIndex in sync with scroll — momentum end is the most
  // reliable signal on iOS when paging is enabled.
  const onMomentumEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const i = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
      if (i !== activeIndex) {
        setActiveIndex(i);
        Haptics.selectionAsync();
      }
    },
    [activeIndex]
  );

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0) {
        const idx = viewableItems[0].index;
        if (typeof idx === "number") setActiveIndex(idx);
      }
    }
  ).current;

  const goTo = useCallback(
    (nextIdx: number) => {
      if (nextIdx < 0 || nextIdx >= items.length) return;
      Haptics.selectionAsync();
      listRef.current?.scrollToIndex({ index: nextIdx, animated: true });
      setActiveIndex(nextIdx);
    },
    [items.length]
  );

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.gold} />
      </View>
    );
  }

  if (error || items.length === 0) {
    return (
      <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
        <View style={styles.center}>
          <Text style={styles.error}>{error ?? "No paintings."}</Text>
          <Pressable onPress={() => router.back()} style={styles.backLink}>
            <Text style={styles.backLinkText}>Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const active = items[activeIndex] ?? items[0];

  return (
    <View style={styles.root}>
      <FlatList
        ref={listRef}
        data={items}
        keyExtractor={(it, i) => `${it.image_url}-${i}`}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        initialScrollIndex={startIndex}
        getItemLayout={(_, i) => ({
          length: SCREEN_W,
          offset: SCREEN_W * i,
          index: i,
        })}
        onMomentumScrollEnd={onMomentumEnd}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
        renderItem={({ item }) => (
          <View style={styles.page}>
            <Image
              source={{ uri: assetUrl(item.image_url) }}
              style={styles.canvas}
              contentFit="contain"
              transition={350}
              placeholder={{ blurhash: "L6PZfSi_.AyE_3t7t7R**0o#DgR4" }}
            />
          </View>
        )}
      />

      {/* Top chrome: close + page indicator */}
      <LinearGradient
        pointerEvents="none"
        colors={["rgba(10,8,4,0.55)", "rgba(10,8,4,0)"]}
        style={styles.topScrim}
      />
      <SafeAreaView edges={["top"]} style={styles.topBar} pointerEvents="box-none">
        <Pressable
          onPress={() => {
            Haptics.selectionAsync();
            router.back();
          }}
          style={styles.closeBtn}
          hitSlop={10}
        >
          <Text style={styles.closeGlyph}>✕</Text>
        </Pressable>
        <View style={styles.counter}>
          <Text style={styles.counterText}>
            {activeIndex + 1} <Text style={styles.counterDim}>of {items.length}</Text>
          </Text>
        </View>
        <View style={{ width: 44 }} />
      </SafeAreaView>

      {/* Side arrows — tap to step prev/next. Positioned over the canvas
          but above the bottom caption drawer so they don't overlap the
          title. Disabled state fades out at the ends. */}
      <View style={styles.arrowRow} pointerEvents="box-none">
        <Pressable
          onPress={() => goTo(activeIndex - 1)}
          hitSlop={12}
          disabled={activeIndex === 0}
          style={({ pressed }) => [
            styles.arrowBtn,
            activeIndex === 0 && styles.arrowBtnDisabled,
            pressed && { opacity: 0.6 },
          ]}
        >
          <Text style={styles.arrowGlyph}>‹</Text>
        </Pressable>
        <Pressable
          onPress={() => goTo(activeIndex + 1)}
          hitSlop={12}
          disabled={activeIndex >= items.length - 1}
          style={({ pressed }) => [
            styles.arrowBtn,
            activeIndex >= items.length - 1 && styles.arrowBtnDisabled,
            pressed && { opacity: 0.6 },
          ]}
        >
          <Text style={styles.arrowGlyph}>›</Text>
        </Pressable>
      </View>

      {/* Bottom caption drawer */}
      <LinearGradient
        pointerEvents="none"
        colors={["rgba(10,8,4,0)", "rgba(10,8,4,0.85)"]}
        style={styles.bottomScrim}
      />
      <SafeAreaView edges={["bottom"]} style={styles.caption} pointerEvents="box-none">
        <View style={styles.captionInner}>
          <Text style={styles.captionTitle} numberOfLines={2}>
            {active.title}
          </Text>
          <Text style={styles.captionArtist} numberOfLines={1}>
            {active.artist}
            {active.year ? `  ·  ${active.year}` : ""}
          </Text>
          <View style={styles.metaRow}>
            {active.movement ? (
              <View style={styles.metaChip}>
                <Text style={styles.metaChipText}>{active.movement}</Text>
              </View>
            ) : null}
            {active.origin_country ? (
              <Text style={styles.metaCountry}>{active.origin_country}</Text>
            ) : null}
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const CANVAS_HEIGHT = SCREEN_H * 0.7;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0a0804" },
  loading: {
    flex: 1,
    backgroundColor: "#0a0804",
    justifyContent: "center",
    alignItems: "center",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: space.lg,
  },
  error: { ...type.bodySm, color: colors.danger, marginBottom: space.md },
  backLink: { padding: space.md },
  backLinkText: { ...type.uiLabel, color: colors.gold },

  page: {
    width: SCREEN_W,
    height: SCREEN_H,
    justifyContent: "center",
    alignItems: "center",
  },
  canvas: {
    width: SCREEN_W,
    height: CANVAS_HEIGHT,
  },

  topScrim: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: 140,
  },
  topBar: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: space.md,
    paddingTop: space.sm,
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(250,247,240,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  closeGlyph: {
    color: colors.bg,
    fontSize: 18,
    lineHeight: 20,
  },
  counter: {
    paddingHorizontal: space.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: "rgba(250,247,240,0.08)",
  },
  counterText: {
    ...type.uiLabel,
    color: colors.bg,
    fontSize: 12,
    letterSpacing: 1.2,
  },
  counterDim: { opacity: 0.55 },

  arrowRow: {
    position: "absolute",
    left: 0,
    right: 0,
    top: CANVAS_HEIGHT / 2 + 40,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: space.md,
  },
  arrowBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(250,247,240,0.14)",
    borderWidth: 0.5,
    borderColor: "rgba(184,154,91,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  arrowBtnDisabled: {
    opacity: 0.25,
  },
  arrowGlyph: {
    color: colors.bg,
    fontSize: 30,
    lineHeight: 32,
    marginTop: -3,
    fontFamily: "CormorantGaramond_600SemiBold",
  },

  bottomScrim: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 260,
  },
  caption: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
  },
  captionInner: {
    paddingHorizontal: space.lg,
    paddingBottom: space.md,
  },
  captionTitle: {
    fontFamily: "CormorantGaramond_600SemiBold",
    fontSize: 30,
    lineHeight: 36,
    color: colors.bg,
    marginBottom: 4,
  },
  captionArtist: {
    fontFamily: "CrimsonPro_400Regular_Italic",
    fontSize: 16,
    color: colors.bg,
    opacity: 0.85,
    fontStyle: "italic",
    marginBottom: space.sm,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    marginTop: space.xs,
  },
  metaChip: {
    borderWidth: 0.5,
    borderColor: colors.gold,
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
  },
  metaChipText: {
    ...type.uiLabel,
    color: colors.gold,
    fontSize: 10,
    letterSpacing: 1.4,
  },
  metaCountry: {
    ...type.meta,
    color: colors.bg,
    opacity: 0.6,
    fontSize: 11,
  },
});
