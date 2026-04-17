import {
  CormorantGaramond_500Medium_Italic,
  CormorantGaramond_600SemiBold,
} from "@expo-google-fonts/cormorant-garamond";
import {
  CrimsonPro_400Regular,
  CrimsonPro_400Regular_Italic,
  CrimsonPro_600SemiBold,
} from "@expo-google-fonts/crimson-pro";
import {
  Inter_500Medium,
  Inter_600SemiBold,
} from "@expo-google-fonts/inter";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { PaintingLoader, useIntroGate } from "../components/PaintingLoader";
import { SessionProvider } from "../lib/auth";
import { colors } from "../lib/theme";

/**
 * Root layout — loads all typography BEFORE the app renders (so no
 * "flash of default font" on first paint), wraps everything in a
 * Supabase session provider, and defines the global stack.
 *
 * Every screen below inherits the cream background and header
 * styling from here. Detail screens are regular Stack routes that
 * slide over the tab bar.
 */
export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    CormorantGaramond_600SemiBold,
    CormorantGaramond_500Medium_Italic,
    CrimsonPro_400Regular,
    CrimsonPro_600SemiBold,
    CrimsonPro_400Regular_Italic,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  // Keep the intro on-screen for the full 3s sketch-to-painting
  // animation even if the fonts come back sooner — the loader is
  // the *opening ritual*, not a waiting state, so the user always
  // gets the whole sequence.
  const showIntro = useIntroGate(!fontsLoaded, 3100);

  if (showIntro) {
    return <PaintingLoader />;
  }

  return (
    <SafeAreaProvider>
      <SessionProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.bg },
          }}
        >
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="artists/[id]"
            options={{ animation: "slide_from_right" }}
          />
          <Stack.Screen
            name="gallery/[index]"
            options={{
              presentation: "modal",
              animation: "fade",
              contentStyle: { backgroundColor: "#0a0804" },
            }}
          />
          <Stack.Screen
            name="thinkers/[id]"
            options={{ animation: "slide_from_right" }}
          />
          <Stack.Screen
            name="thinkers/ask"
            options={{ presentation: "modal", animation: "slide_from_bottom" }}
          />
          <Stack.Screen
            name="thinkers/article"
            options={{ presentation: "modal", animation: "slide_from_bottom" }}
          />
          <Stack.Screen
            name="library/faal"
            options={{ animation: "slide_from_right" }}
          />
          <Stack.Screen
            name="library/little-prince"
            options={{ animation: "slide_from_right" }}
          />
          <Stack.Screen
            name="library/siddhartha"
            options={{ animation: "slide_from_right" }}
          />
          <Stack.Screen
            name="library/tao"
            options={{ animation: "slide_from_right" }}
          />
          <Stack.Screen
            name="profile"
            options={{ presentation: "modal", animation: "slide_from_bottom" }}
          />
          <Stack.Screen
            name="signin"
            options={{ presentation: "modal", animation: "slide_from_bottom" }}
          />
          <Stack.Screen
            name="signup"
            options={{ presentation: "modal", animation: "slide_from_bottom" }}
          />
        </Stack>
      </SessionProvider>
    </SafeAreaProvider>
  );
}
