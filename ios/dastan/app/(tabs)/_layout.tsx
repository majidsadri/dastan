import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { Tabs } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, fonts, space } from "../../lib/theme";

/**
 * Bottom tab bar — Today, Gallery, Artists, Thinkers, Library.
 *
 * Liquid Glass plaque: a floating pill sitting inside the bottom
 * safe area, backed by a native `UIVisualEffectView` with the
 * iOS `systemChromeMaterialLight` material — the same foundation
 * Apple's iOS 26 Liquid Glass is built on. A thin top highlight
 * linear gradient adds the "liquid" specular that gives glass its
 * wet, refractive feel; a gilded hairline border and soft shadow
 * lift it off the cream page like a museum wayfinding plaque.
 *
 * Intentionally typographic, not iconographic: each tab's "icon"
 * is a single glyph in the display serif — zero-dependency icons
 * that scale perfectly and match the editorial voice of the app.
 */

type TabDef = {
  name: "index" | "gallery" | "artists" | "thinkers" | "library";
  title: string;
  glyph: string;
};

const TAB_DEFS: TabDef[] = [
  { name: "index", title: "Today", glyph: "✦" },
  { name: "gallery", title: "Gallery", glyph: "❖" },
  { name: "artists", title: "Artists", glyph: "✎" },
  { name: "thinkers", title: "Thinkers", glyph: "◈" },
  // The Library — a reading room holding Faal-e Hafez, The Little
  // Prince, and Siddhartha. The hedera leaf (❧) is the classical
  // manuscript ornament for a section-end flourish; it reads as
  // "book" without resorting to emoji.
  { name: "library", title: "Shelf", glyph: "❧" },
];

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <LiquidGlassTabBar {...props} />}
    >
      <Tabs.Screen name="index" options={{ title: "Today" }} />
      <Tabs.Screen name="gallery" options={{ title: "Gallery" }} />
      <Tabs.Screen name="artists" options={{ title: "Artists" }} />
      <Tabs.Screen name="thinkers" options={{ title: "Thinkers" }} />
      <Tabs.Screen name="library" options={{ title: "Shelf" }} />
    </Tabs>
  );
}

function LiquidGlassTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.wrap,
        { paddingBottom: Math.max(insets.bottom, 10) + 4 },
      ]}
    >
      <View style={styles.pill}>
        {/* Native iOS visual-effect view — real background blur */}
        <BlurView
          intensity={90}
          tint="systemChromeMaterialLight"
          style={StyleSheet.absoluteFill}
        />
        {/* Liquid highlight — the thin specular that makes glass
            feel wet rather than just frosted. Sits above the blur
            but below the tab row. */}
        <LinearGradient
          pointerEvents="none"
          colors={[
            "rgba(255,255,255,0.55)",
            "rgba(255,255,255,0.12)",
            "rgba(255,255,255,0)",
            "rgba(184,154,91,0.08)",
          ]}
          locations={[0, 0.35, 0.7, 1]}
          style={StyleSheet.absoluteFill}
        />
        {/* Gilded hairline — subtle frame around the glass */}
        <View pointerEvents="none" style={styles.pillBorder} />

        <View style={styles.row}>
          {state.routes.map((route, index) => {
            const tab = TAB_DEFS.find((t) => t.name === route.name);
            if (!tab) return null;
            const focused = state.index === index;

            const onPress = () => {
              Haptics.selectionAsync();
              const event = navigation.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
              });
              if (!focused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            return (
              <Pressable
                key={route.key}
                onPress={onPress}
                hitSlop={6}
                style={({ pressed }) => [
                  styles.tab,
                  pressed && { opacity: 0.7 },
                ]}
                accessibilityRole="button"
                accessibilityState={focused ? { selected: true } : {}}
                accessibilityLabel={tab.title}
              >
                <Text
                  style={[
                    styles.glyph,
                    focused ? styles.glyphActive : styles.glyphInactive,
                  ]}
                >
                  {tab.glyph}
                </Text>
                <Text
                  style={[
                    styles.label,
                    focused ? styles.labelActive : styles.labelInactive,
                  ]}
                >
                  {tab.title.toUpperCase()}
                </Text>
                <View
                  style={[
                    styles.underline,
                    focused
                      ? styles.underlineActive
                      : styles.underlineInactive,
                  ]}
                />
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const PILL_RADIUS = 999;

// The glass pill's vertical footprint, broken down so the value
// stays in sync with the styles below:
//   • wrap.paddingTop                     = 10
//   • row.paddingVertical * 2             = 20
//   • tab.paddingVertical * 2             =  12
//   • glyph.lineHeight (26) + marginBottom (2) = 28
//   • label fontSize (9) ≈ lineHeight 12 + marginTop (1)     = 13
//   • underline height (1.5) + marginTop (4) + bleed slack   = 6
//   • wrap.paddingBottom = max(insets.bottom, 10) + 4
const PILL_CONTENT = 10 /*wrap pt*/ + 20 /*row pv*/ + 12 /*tab pv*/ + 28 + 13 + 6;

/**
 * The on-screen height of the Liquid Glass tab bar for a given
 * safe-area inset. Screens that host scrollable content should add
 * this to their scroll `paddingBottom` so the last row clears the
 * pill, and floating FABs should set their `bottom` to this value.
 *
 * We compute this directly instead of using `useBottomTabBarHeight`
 * because that hook returns 0 when the tab bar is absolutely
 * positioned — React Navigation's layout engine doesn't measure
 * tab bars that don't contribute to the flex column.
 */
export function useGlassTabBarHeight(): number {
  const insets = useSafeAreaInsets();
  return PILL_CONTENT + Math.max(insets.bottom, 10) + 4;
}

const styles = StyleSheet.create({
  // Absolutely-positioned so each tab screen flexes to full height
  // underneath the pill — scroll content passes beneath the glass
  // and you can see it ghosting through the blur. Screens that hold
  // scrollable content should use `useGlassTabBarHeight()` to pad
  // their last row clear of the pill.
  wrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "transparent",
    paddingHorizontal: space.md,
    paddingTop: 10,
    alignItems: "center",
  },
  // The glass plaque
  pill: {
    alignSelf: "stretch",
    borderRadius: PILL_RADIUS,
    overflow: "hidden",
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 10,
  },
  pillBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: PILL_RADIUS,
    borderWidth: 0.5,
    borderColor: "rgba(184,154,91,0.5)",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingVertical: 10,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    paddingHorizontal: 2,
  },
  glyph: {
    fontFamily: fonts.display,
    fontSize: 22,
    lineHeight: 26,
    marginBottom: 2,
  },
  glyphActive: { color: colors.gold },
  glyphInactive: { color: colors.inkMuted },
  label: {
    fontFamily: fonts.uiBold,
    fontSize: 9,
    letterSpacing: 1.5,
    marginTop: 1,
  },
  labelActive: { color: colors.goldDark },
  labelInactive: { color: colors.inkMuted },
  underline: {
    marginTop: 4,
    height: 1.5,
    borderRadius: 1,
  },
  underlineActive: {
    width: 18,
    backgroundColor: colors.gold,
    opacity: 0.95,
  },
  underlineInactive: {
    width: 18,
    backgroundColor: "transparent",
  },
});
