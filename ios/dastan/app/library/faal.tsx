import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { PaintingLoader } from "../../components/PaintingLoader";
import { fetchHafezPoems, fetchPoemAudio, HafezPoem, speakText } from "../../lib/api";
import { colors, fonts, radius, space, type } from "../../lib/theme";
import { useGlassTabBarHeight } from "../(tabs)/_layout";

// ── expo-audio (loaded defensively) ──────────────────────────────────
//
// `expo-audio` is a native module. When the app binary was built
// before the package was installed, `import … from "expo-audio"`
// throws "Cannot find native module 'ExpoAudio'" at module-evaluation
// time — which tanks the entire `(tabs)` group and the Faal tab
// disappears from the bar. To avoid that, we require it inside a
// try/catch so the screen still mounts on older binaries; the only
// thing that degrades is the LISTEN button.
type ExpoAudioModule = {
  setAudioModeAsync: (opts: { playsInSilentMode: boolean }) => Promise<void>;
  useAudioPlayer: (source: any) => any;
  useAudioPlayerStatus: (player: any) => any;
};
let ExpoAudio: ExpoAudioModule | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  ExpoAudio = require("expo-audio") as ExpoAudioModule;
} catch {
  ExpoAudio = null;
}
const audioAvailable = ExpoAudio !== null;

// Initialise once per app session so Faal audio plays with the
// iPhone silent switch on — otherwise tapping the play button does
// nothing on a muted phone, which is confusing.
if (ExpoAudio) {
  ExpoAudio.setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
}

// Stub hooks used when the native module isn't in the binary. They
// return stable dummy values so the rules of hooks stay satisfied
// without ever calling into expo-audio.
const noopPlayer = {
  play: () => {},
  pause: () => {},
  replace: (_: any) => {},
  seekTo: async (_: number) => {},
};
const noopStatus = {
  playing: false,
  currentTime: 0,
  didJustFinish: false,
};
const useAudioPlayer = ExpoAudio
  ? ExpoAudio.useAudioPlayer
  : (_: any) => noopPlayer;
const useAudioPlayerStatus = ExpoAudio
  ? ExpoAudio.useAudioPlayerStatus
  : (_: any) => noopStatus;

/**
 * Faal-e Hafez — the ancient Persian tradition of opening the
 * Divan of Hafez with a question in your heart and reading the
 * ghazal you meet as the answer.
 *
 * Layout (scrollable column):
 *   1. Hero header — eight-pointed gold star, "AN ANCIENT PERSIAN
 *      TRADITION" eyebrow, 44pt display "Faal-e Hafez", Farsi
 *      subtitle, italic lede, gilded ornament rule.
 *   2. "Close your eyes..." instruction card on a slightly warmer
 *      paper.
 *   3. Draw button — gilded pill that says "Draw your Faal" on
 *      first load, "Draw another" on subsequent taps.
 *   4. Poem card — title, ghazal metadata, language toggle
 *      (فارسی / EN), couplets rendered with generous leading.
 *   5. Closing attribution — a short quote from Hafez.
 *
 * First load uses a seeded-by-date poem so the same ghazal greets
 * the user all day. Tapping "Draw another" picks a truly random
 * poem from the cached collection.
 */
export default function FaalScreen() {
  const tabBarHeight = useGlassTabBarHeight();
  const [poems, setPoems] = useState<HafezPoem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 0 = today's seeded poem; incremented on each "Draw another".
  const [drawCount, setDrawCount] = useState(0);

  useEffect(() => {
    fetchHafezPoems()
      .then(setPoems)
      .catch((e) => setError(e?.message ?? String(e)))
      .finally(() => setLoading(false));
  }, []);

  const poem = useMemo<HafezPoem | null>(() => {
    if (poems.length === 0) return null;
    if (drawCount === 0) {
      // Seeded-by-date so the same ghazal greets the user all day.
      const now = new Date();
      const seed =
        now.getFullYear() * 10000 +
        (now.getMonth() + 1) * 100 +
        now.getDate();
      return poems[seed % poems.length];
    }
    return poems[Math.floor(Math.random() * poems.length)];
  }, [poems, drawCount]);

  const draw = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setDrawCount((c) => c + 1);
  }, []);

  if (loading) {
    return <PaintingLoader subtitle="Opening the Divan…" />;
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
          { paddingBottom: tabBarHeight + space.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <SafeAreaView edges={["top"]}>
          {/* ── Top bar — back to Library ───────────────────────── */}
          <View style={styles.topBar}>
            <Pressable
              onPress={() => router.back()}
              hitSlop={14}
              accessibilityRole="button"
              accessibilityLabel="Back to Shelf"
            >
              <Text style={styles.topBack}>← SHELF</Text>
            </Pressable>
          </View>

          {/* ── Hero header ─────────────────────────────────────── */}
          <View style={styles.hero}>
            <Text style={styles.heroStar}>❂</Text>
            <Text style={styles.heroEyebrow}>
              AN ANCIENT PERSIAN TRADITION
            </Text>
            <Text style={styles.heroTitle}>Faal-e Hafez</Text>
            <Text style={styles.heroTitleFa}>فال حافظ</Text>

            <Text style={styles.heroLede}>
              For seven centuries, Persians have opened the Divan of
              Hafez with a question in their heart. The ghazal they
              meet is the answer.
            </Text>
          </View>

          {/* ── Draw button ──────────────────────────────────────── */}
          <View style={styles.drawBtnWrap}>
            <Pressable
              onPress={draw}
              accessibilityRole="button"
              accessibilityLabel="Draw your faal"
              style={({ pressed }) => [
                styles.drawBtn,
                pressed && {
                  opacity: 0.88,
                  transform: [{ scale: 0.97 }],
                },
              ]}
            >
              <Text style={styles.drawGlyph}>❂</Text>
              <Text style={styles.drawText}>
                {drawCount === 0 ? "DRAW YOUR FAAL" : "DRAW ANOTHER"}
              </Text>
            </Pressable>
          </View>

          {/* ── Poem card ────────────────────────────────────────── */}
          {poem && <PoemCard poem={poem} drawKey={drawCount} />}

          {/* ── Closing attribution ──────────────────────────────── */}
          <View style={styles.closing}>
            <Text style={styles.closingQuote}>
              “I am the slave of the Magian elder — he has set me
              free.”
            </Text>
            <Text style={styles.closingAttr}>
              — Hafez of Shiraz, 14th century
            </Text>
          </View>
        </SafeAreaView>
      </ScrollView>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────
// PoemCard — the drawn ghazal
// ─────────────────────────────────────────────────────────────────────

function PoemCard({ poem, drawKey }: { poem: HafezPoem; drawKey: number }) {
  const [lang, setLang] = useState<"en" | "fa">("en");

  // ── TTS state ────────────────────────────────────────────────────
  // The player is created empty and we call `replace()` with the
  // downloaded file URI just before we `play()`. expo-audio disposes
  // the player automatically when this component unmounts.
  const player = useAudioPlayer(null);
  const status = useAudioPlayerStatus(player);
  const [ttsLoading, setTtsLoading] = useState(false);
  const [ttsError, setTtsError] = useState<string | null>(null);
  // Key of the currently-loaded audio: `${poem.id}-${lang}`. When
  // this doesn't match the current poem/language, we know we need
  // to fetch a fresh track rather than resuming the old one.
  const loadedKey = useRef<string | null>(null);

  // Fade the card in whenever a new ghazal is drawn.
  const fade = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    fade.setValue(0);
    Animated.timing(fade, {
      toValue: 1,
      duration: 700,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [drawKey, fade]);

  // Reset language toggle back to English whenever a new poem arrives.
  // Also stop any in-flight playback — the old ghazal's audio should
  // not bleed into the new one.
  useEffect(() => {
    setLang("en");
    setTtsError(null);
    try {
      player.pause();
    } catch {}
    loadedKey.current = null;
  }, [poem.id, player]);

  // Pause when the language toggle changes. The next play tap will
  // fetch the other language's audio from the backend.
  useEffect(() => {
    try {
      player.pause();
    } catch {}
  }, [lang, player]);

  const currentKey = `${poem.id}-${lang}`;
  const isPlaying = status.playing;
  const isPaused = !status.playing && loadedKey.current === currentKey && (status.currentTime ?? 0) > 0 && !status.didJustFinish;

  const handleTtsToggle = useCallback(async () => {
    Haptics.selectionAsync();
    setTtsError(null);

    // Old binary without expo-audio linked — tell the user instead
    // of silently doing nothing. A rebuild via `expo run:ios` fixes.
    if (!audioAvailable) {
      setTtsError("Voice needs a fresh native build.");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    // Already playing → pause.
    if (isPlaying) {
      player.pause();
      return;
    }

    // Paused mid-track on the same poem/language → resume.
    if (loadedKey.current === currentKey && (status.currentTime ?? 0) > 0 && !status.didJustFinish) {
      player.play();
      return;
    }

    // Need to load (or reload after finishing) — try pre-generated
    // high-quality audio first, fall back to live TTS.
    setTtsLoading(true);
    try {
      const isFarsi = lang === "fa";
      let uri: string;

      try {
        uri = await fetchPoemAudio(poem.id, isFarsi ? "fa" : "en");
      } catch {
        const text = isFarsi
          ? poem.farsi?.full_text ?? ""
          : poem.english?.full_text ?? "";
        const prompt = isFarsi
          ? "این غزل حافظ را با لحن گرم، آرام و شاعرانه بخوان"
          : "Read this Hafez poem aloud slowly and beautifully, with feeling";
        uri = await speakText(text, prompt);
      }

      player.replace({ uri });
      loadedKey.current = currentKey;
      try {
        await player.seekTo(0);
      } catch {}
      player.play();
    } catch (e: any) {
      console.warn("[Faal] TTS failed:", e);
      setTtsError("Voice is temporarily unavailable.");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setTtsLoading(false);
    }
  }, [
    isPlaying,
    currentKey,
    status.currentTime,
    status.didJustFinish,
    lang,
    poem,
    player,
  ]);

  const couplets =
    lang === "en"
      ? poem.english?.couplets ?? []
      : poem.farsi?.couplets ?? [];

  return (
    <Animated.View
      style={[
        styles.card,
        {
          opacity: fade,
          transform: [
            {
              translateY: fade.interpolate({
                inputRange: [0, 1],
                outputRange: [12, 0],
              }),
            },
          ],
        },
      ]}
    >
      {/* Card header */}
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderRow}>
          <View style={{ flex: 1, paddingRight: space.md }}>
            <Text style={styles.cardTitle} numberOfLines={3}>
              {poem.title_en}
            </Text>
            <Text style={styles.cardMeta}>
              Ghazal #{poem.ghazal_number}
            </Text>
          </View>

          {/* Language toggle */}
          <View style={styles.langToggle}>
            <Pressable
              onPress={() => {
                Haptics.selectionAsync();
                setLang("fa");
              }}
              style={[
                styles.langPill,
                lang === "fa" && styles.langPillActive,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Show Farsi"
            >
              <Text
                style={[
                  styles.langPillText,
                  lang === "fa" && styles.langPillTextActive,
                ]}
              >
                فارسی
              </Text>
            </Pressable>
            <Pressable
              onPress={() => {
                Haptics.selectionAsync();
                setLang("en");
              }}
              style={[
                styles.langPill,
                lang === "en" && styles.langPillActive,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Show English"
            >
              <Text
                style={[
                  styles.langPillText,
                  lang === "en" && styles.langPillTextActive,
                ]}
              >
                EN
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Listen (Gemini TTS) */}
        <View style={styles.listenRow}>
          <Pressable
            onPress={handleTtsToggle}
            disabled={ttsLoading}
            accessibilityRole="button"
            accessibilityLabel={
              isPlaying ? "Pause recitation" : "Listen to recitation"
            }
            style={({ pressed }) => [
              styles.listenBtn,
              pressed && { opacity: 0.85 },
              ttsLoading && { opacity: 0.75 },
            ]}
          >
            {ttsLoading ? (
              <ActivityIndicator size="small" color={colors.gold} />
            ) : (
              <Text style={styles.listenGlyph}>
                {isPlaying ? "❚❚" : "▶"}
              </Text>
            )}
            <Text style={styles.listenText}>
              {ttsLoading
                ? "PREPARING VOICE…"
                : isPlaying
                ? "PAUSE"
                : isPaused
                ? "RESUME"
                : lang === "fa"
                ? "LISTEN · فارسی"
                : "LISTEN · ENGLISH"}
            </Text>
          </Pressable>
          {ttsError ? (
            <Text style={styles.listenError}>{ttsError}</Text>
          ) : null}
        </View>
      </View>

      {/* Card body — couplets */}
      <View style={styles.cardBody}>
        {couplets.map((couplet, i) => (
          <View
            key={`${lang}-${i}`}
            style={[
              styles.couplet,
              i < couplets.length - 1 && styles.coupletDivider,
            ]}
          >
            {couplet.map((line, j) => (
              <Text
                key={j}
                style={[
                  lang === "fa" ? styles.lineFa : styles.lineEn,
                ]}
              >
                {line}
              </Text>
            ))}
          </View>
        ))}

        {/* Farsi attribution (shown only when viewing Farsi) */}
        {lang === "fa" ? (
          <Text style={styles.farsiAttr}>
            {poem.poet_fa} · {poem.form_fa}
          </Text>
        ) : null}

        <Text style={styles.source}>Source: hafizonlove.com</Text>
      </View>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingHorizontal: space.lg },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: space.lg,
  },
  error: { ...type.bodySm, color: colors.danger },

  // ─── Hero ──────────────────────────────────────────────────────────
  // Matched to the Thinkers "The Timeline" section headline so the
  // two tabs feel like siblings: 38pt display title, small 22pt
  // gilded ornament above, 10pt eyebrow, quiet italic lede.
  topBar: {
    paddingHorizontal: space.lg,
    paddingTop: space.sm,
    paddingBottom: space.xs,
    alignItems: "flex-start",
  },
  topBack: {
    fontFamily: fonts.uiBold,
    fontSize: 10,
    letterSpacing: 2,
    color: colors.gold,
  },
  hero: {
    alignItems: "center",
    paddingTop: space.md,
    paddingBottom: space.md,
  },
  heroStar: {
    fontFamily: fonts.display,
    fontSize: 22,
    lineHeight: 26,
    color: colors.gold,
    opacity: 0.85,
    marginBottom: space.xs,
  },
  heroEyebrow: {
    fontFamily: fonts.uiBold,
    fontSize: 10,
    letterSpacing: 2,
    color: colors.goldDark,
    marginBottom: space.xs,
  },
  heroTitle: {
    ...type.display,
    fontSize: 38,
    textAlign: "center",
    marginTop: space.xs,
    marginBottom: 2,
  },
  heroTitleFa: {
    fontFamily: fonts.serifItalic,
    fontSize: 15,
    color: colors.inkSoft,
    opacity: 0.75,
    marginBottom: space.sm,
  },
  heroLede: {
    ...type.caption,
    fontFamily: fonts.serifItalic,
    fontStyle: "italic",
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
    color: colors.inkMuted,
    maxWidth: 320,
    paddingHorizontal: space.md,
    marginTop: space.xs,
  },

  // ─── Draw button ───────────────────────────────────────────────────
  drawBtnWrap: {
    alignItems: "center",
    marginTop: space.lg,
    marginBottom: space.lg,
  },
  drawBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 13,
    paddingHorizontal: 26,
    borderRadius: radius.pill,
    backgroundColor: colors.ink,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 6,
  },
  drawGlyph: {
    fontFamily: fonts.display,
    fontSize: 20,
    lineHeight: 22,
    color: colors.gold,
  },
  drawText: {
    fontFamily: fonts.uiBold,
    fontSize: 12,
    letterSpacing: 2,
    color: colors.goldLight,
  },

  // ─── Poem card ─────────────────────────────────────────────────────
  card: {
    marginTop: space.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 0.75,
    borderColor: colors.hairline,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 18,
    elevation: 4,
    overflow: "hidden",
  },
  cardHeader: {
    paddingHorizontal: space.lg,
    paddingTop: space.lg,
    paddingBottom: space.md,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.hairline,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  cardTitle: {
    fontFamily: fonts.display,
    fontSize: 22,
    lineHeight: 28,
    color: colors.ink,
  },
  cardMeta: {
    fontFamily: fonts.ui,
    fontSize: 10.5,
    letterSpacing: 0.3,
    color: colors.inkMuted,
    marginTop: 4,
  },
  langToggle: {
    flexDirection: "row",
    borderWidth: 0.5,
    borderColor: "rgba(184,154,91,0.45)",
    borderRadius: radius.pill,
    overflow: "hidden",
  },
  langPill: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  langPillActive: {
    backgroundColor: "rgba(184,154,91,0.18)",
  },
  langPillText: {
    fontFamily: fonts.ui,
    fontSize: 10.5,
    color: colors.inkMuted,
    letterSpacing: 0.5,
  },
  langPillTextActive: {
    color: colors.goldDark,
    fontFamily: fonts.uiBold,
  },

  listenRow: {
    marginTop: space.md,
    alignItems: "flex-start",
  },
  listenBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    borderWidth: 0.6,
    borderColor: "rgba(184,154,91,0.55)",
    backgroundColor: "rgba(184,154,91,0.08)",
  },
  listenGlyph: {
    fontFamily: fonts.ui,
    fontSize: 11,
    color: colors.goldDark,
    lineHeight: 13,
  },
  listenText: {
    fontFamily: fonts.uiBold,
    fontSize: 10,
    letterSpacing: 1.6,
    color: colors.goldDark,
  },
  listenError: {
    fontFamily: fonts.ui,
    fontSize: 10,
    color: colors.danger,
    marginTop: 6,
    letterSpacing: 0.2,
  },

  cardBody: {
    paddingHorizontal: space.lg,
    paddingTop: space.lg,
    paddingBottom: space.lg,
  },
  couplet: {
    paddingVertical: space.sm + 2,
  },
  coupletDivider: {
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(184,154,91,0.18)",
  },
  lineEn: {
    fontFamily: fonts.serif,
    fontSize: 15,
    lineHeight: 26,
    color: colors.ink,
  },
  lineFa: {
    fontFamily: fonts.serif,
    fontSize: 17,
    lineHeight: 32,
    color: colors.ink,
    textAlign: "right",
    writingDirection: "rtl",
  },
  farsiAttr: {
    fontFamily: fonts.ui,
    fontSize: 10,
    color: colors.inkMuted,
    textAlign: "right",
    marginTop: space.md,
    letterSpacing: 0.3,
  },
  source: {
    fontFamily: fonts.ui,
    fontSize: 9,
    color: colors.inkMuted,
    opacity: 0.7,
    marginTop: space.lg,
    letterSpacing: 0.2,
  },

  // ─── Closing ───────────────────────────────────────────────────────
  closing: {
    alignItems: "center",
    marginTop: space.xl,
    paddingHorizontal: space.lg,
  },
  closingQuote: {
    fontFamily: fonts.serifItalic,
    fontStyle: "italic",
    fontSize: 14,
    lineHeight: 22,
    color: colors.inkMuted,
    textAlign: "center",
    marginBottom: 6,
  },
  closingAttr: {
    fontFamily: fonts.ui,
    fontSize: 10,
    letterSpacing: 1.1,
    color: colors.inkMuted,
    opacity: 0.7,
  },
});
