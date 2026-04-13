import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  assetUrl,
  fetchProfile,
  saveProfile,
  UserProfile,
  UserProfileInput,
} from "../lib/api";
import { useSession } from "../lib/auth";
import { colors, fonts, radius, space, type } from "../lib/theme";

const { width: SCREEN_W } = Dimensions.get("window");
const TOTAL_STEPS = 6;

// ── Option lists (same as web app) ─────────────────────────────────────

const ART_MOVEMENTS = [
  "Impressionism", "Post-Impressionism", "Surrealism", "Renaissance", "Baroque",
  "Ukiyo-e", "Art Nouveau", "Romanticism", "Expressionism", "Cubism",
  "Abstract", "Minimalism", "Pop Art", "Realism", "Pre-Raphaelite",
  "Pointillism", "Fauvism", "Gothic", "Neoclassicism", "Contemporary",
];

const THEMES = [
  "Nature", "Love", "Solitude", "Mythology", "Dreams",
  "Identity", "Freedom", "Death", "Beauty", "Time",
  "Memory", "Journey", "Light", "Silence", "Revolution",
  "Faith", "Exile", "Childhood", "War", "Wonder",
];

const LITERARY_GENRES = [
  "Poetry", "Magical Realism", "Philosophy", "Gothic Fiction", "Existentialism",
  "Romanticism", "Epic", "Memoir", "Short Stories", "Drama",
  "Satire", "Fable", "Literary Fiction", "Historical Fiction", "Mysticism",
];

const REGIONS = [
  "East Asia", "South Asia", "Middle East", "Western Europe", "Eastern Europe",
  "North Africa", "Sub-Saharan Africa", "Latin America", "North America", "Oceania",
  "Central Asia", "Southeast Asia", "Caribbean", "Scandinavia", "Mediterranean",
];

const AVATARS = [
  { file: "davinci.png", label: "Da Vinci" },
  { file: "frida.png", label: "Frida" },
  { file: "monalisa.png", label: "Mona Lisa" },
  { file: "Monet.png", label: "Monet" },
  { file: "van_gogh.png", label: "Van Gogh" },
  { file: "herman_hesse.png", label: "Hesse" },
  { file: "marquez.png", label: "Márquez" },
  { file: "shakespeare.png", label: "Shakespeare" },
  { file: "jane_austen.png", label: "Austen" },
  { file: "hafez.png", label: "Hafez" },
  { file: "tagore.png", label: "Tagore" },
  { file: "shikibu.png", label: "Shikibu" },
];

// Step titles and subtitles — editorial museum voice
const STEP_META: { eyebrow: string; title: string; sub: string }[] = [
  {
    eyebrow: "STEP ONE",
    title: "Choose your\ncompanion",
    sub: "An avatar that walks with you through the galleries.",
  },
  {
    eyebrow: "STEP TWO",
    title: "What shall we\ncall you?",
    sub: "The name inscribed on your salon card.",
  },
  {
    eyebrow: "STEP THREE",
    title: "The movements\nthat move you",
    sub: "Select the art traditions that speak to your eye.",
  },
  {
    eyebrow: "STEP FOUR",
    title: "The threads\nthat bind",
    sub: "Themes that resonate across painting, poetry, and prose.",
  },
  {
    eyebrow: "STEP FIVE",
    title: "Words on\nthe shelf",
    sub: "The literary traditions you reach for most.",
  },
  {
    eyebrow: "STEP SIX",
    title: "Corners of\nthe world",
    sub: "The regions whose art and thought you wish to explore.",
  },
];

/**
 * Profile wizard — a six-step onboarding flow that collects the
 * user's aesthetic preferences so the backend can curate
 * personalized daily content (paintings, literature, verse).
 *
 * Mirrors the web app's /profile wizard, styled in the same
 * museum-editorial language as the rest of the iOS app.
 */
export default function ProfileScreen() {
  const { refreshProfile } = useSession();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [existingProfile, setExistingProfile] = useState<UserProfile | null>(null);

  // Profile fields
  const [avatar, setAvatar] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [artMovements, setArtMovements] = useState<string[]>([]);
  const [themes, setThemes] = useState<string[]>([]);
  const [literaryGenres, setLiteraryGenres] = useState<string[]>([]);
  const [regions, setRegions] = useState<string[]>([]);

  // Fade animation for step transitions
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Load existing profile if editing
  useEffect(() => {
    fetchProfile().then((p) => {
      if (p) {
        setExistingProfile(p);
        setAvatar(p.avatar);
        setDisplayName(p.display_name);
        setArtMovements(p.art_movements);
        setThemes(p.themes);
        setLiteraryGenres(p.literary_genres);
        setRegions(p.regions);
      }
    });
  }, []);

  const animateStep = useCallback(
    (next: number) => {
      Haptics.selectionAsync();
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start(() => {
        setStep(next);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }).start();
      });
    },
    [fadeAnim]
  );

  const canAdvance = (): boolean => {
    switch (step) {
      case 1: return avatar !== null;
      case 2: return displayName.trim().length >= 2;
      case 3: return artMovements.length >= 1;
      case 4: return themes.length >= 1;
      case 5: return literaryGenres.length >= 1;
      case 6: return regions.length >= 1;
      default: return false;
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const data: UserProfileInput = {
        display_name: displayName.trim(),
        avatar,
        art_movements: artMovements,
        art_periods: [],
        favorite_artists: [],
        literary_genres: literaryGenres,
        favorite_authors: [],
        preferred_languages: [],
        themes,
        regions,
      };
      await saveProfile(data);
      // Refresh the session context so `hasProfile` flips to true.
      // Without this, TodayScreen's redirect effect will bounce the
      // user straight back into the wizard on every mount.
      await refreshProfile();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (e: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      // Surface the error so silent save failures don't look like
      // success — a silent failure here is exactly what re-shows the
      // wizard on the next login.
      setSaveError(e?.message ?? "Could not save your profile. Please try again.");
      setSaving(false);
    }
  };

  const toggleItem = (
    list: string[],
    setList: (v: string[]) => void,
    item: string
  ) => {
    Haptics.selectionAsync();
    if (list.includes(item)) {
      setList(list.filter((x) => x !== item));
    } else {
      setList([...list, item]);
    }
  };

  const meta = STEP_META[step - 1];

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        {/* Header — progress + close */}
        <View style={styles.header}>
          {step > 1 ? (
            <Pressable
              onPress={() => animateStep(step - 1)}
              style={styles.backBtn}
              hitSlop={8}
            >
              <Text style={styles.backGlyph}>‹</Text>
            </Pressable>
          ) : (
            <View style={{ width: 36 }} />
          )}

          <ProgressDots current={step} total={TOTAL_STEPS} />

          <Pressable onPress={() => router.back()} style={styles.closeBtn}>
            <Text style={styles.closeGlyph}>✕</Text>
          </Pressable>
        </View>

        {/* Step content */}
        <Animated.View style={[styles.body, { opacity: fadeAnim }]}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.stepEyebrow}>{meta.eyebrow}</Text>
            <Text style={styles.stepTitle}>{meta.title}</Text>
            <Text style={styles.stepSub}>{meta.sub}</Text>

            {step === 1 && (
              <AvatarStep
                selected={avatar}
                onSelect={setAvatar}
              />
            )}
            {step === 2 && (
              <NameStep
                value={displayName}
                onChange={setDisplayName}
              />
            )}
            {step === 3 && (
              <ChipStep
                options={ART_MOVEMENTS}
                selected={artMovements}
                onToggle={(item) => toggleItem(artMovements, setArtMovements, item)}
              />
            )}
            {step === 4 && (
              <ChipStep
                options={THEMES}
                selected={themes}
                onToggle={(item) => toggleItem(themes, setThemes, item)}
              />
            )}
            {step === 5 && (
              <ChipStep
                options={LITERARY_GENRES}
                selected={literaryGenres}
                onToggle={(item) => toggleItem(literaryGenres, setLiteraryGenres, item)}
              />
            )}
            {step === 6 && (
              <ChipStep
                options={REGIONS}
                selected={regions}
                onToggle={(item) => toggleItem(regions, setRegions, item)}
              />
            )}
          </ScrollView>
        </Animated.View>

        {/* Bottom CTA */}
        <View style={styles.footer}>
          {saveError ? (
            <Text style={styles.saveError}>{saveError}</Text>
          ) : null}
          {step < TOTAL_STEPS ? (
            <Pressable
              disabled={!canAdvance()}
              onPress={() => animateStep(step + 1)}
              style={({ pressed }) => [
                styles.cta,
                !canAdvance() && styles.ctaDisabled,
                pressed && canAdvance() && styles.ctaPressed,
              ]}
            >
              <Text
                style={[
                  styles.ctaText,
                  !canAdvance() && styles.ctaTextDisabled,
                ]}
              >
                Continue
              </Text>
            </Pressable>
          ) : (
            <Pressable
              disabled={!canAdvance() || saving}
              onPress={handleSave}
              style={({ pressed }) => [
                styles.cta,
                styles.ctaGold,
                (!canAdvance() || saving) && styles.ctaDisabled,
                pressed && styles.ctaPressed,
              ]}
            >
              {saving ? (
                <ActivityIndicator color={colors.bg} />
              ) : (
                <Text style={styles.ctaText}>
                  {existingProfile ? "Save changes" : "Begin the ritual"}
                </Text>
              )}
            </Pressable>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────────

function ProgressDots({
  current,
  total,
}: {
  current: number;
  total: number;
}) {
  return (
    <View style={styles.dotsRow}>
      {Array.from({ length: total }, (_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            i + 1 === current
              ? styles.dotActive
              : i + 1 < current
              ? styles.dotDone
              : styles.dotPending,
          ]}
        />
      ))}
    </View>
  );
}

function AvatarStep({
  selected,
  onSelect,
}: {
  selected: string | null;
  onSelect: (v: string) => void;
}) {
  return (
    <View style={styles.avatarGrid}>
      {AVATARS.map((a) => {
        const isSelected = selected === a.file;
        return (
          <Pressable
            key={a.file}
            onPress={() => {
              Haptics.selectionAsync();
              onSelect(a.file);
            }}
            style={[
              styles.avatarCell,
              isSelected && styles.avatarCellSelected,
            ]}
          >
            <Image
              source={{ uri: assetUrl(`/avatars/${a.file}`) }}
              style={styles.avatarImage}
              contentFit="cover"
              transition={200}
            />
            <Text
              style={[
                styles.avatarLabel,
                isSelected && styles.avatarLabelSelected,
              ]}
            >
              {a.label}
            </Text>
            {isSelected && (
              <View style={styles.avatarCheck}>
                <Text style={styles.avatarCheckText}>✓</Text>
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

function NameStep({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <View style={styles.nameWrap}>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder="Your name"
        placeholderTextColor={colors.inkMuted}
        autoCapitalize="words"
        autoCorrect={false}
        style={styles.nameInput}
        autoFocus
      />
      <View style={styles.nameUnderline} />
    </View>
  );
}

function ChipStep({
  options,
  selected,
  onToggle,
}: {
  options: string[];
  selected: string[];
  onToggle: (item: string) => void;
}) {
  return (
    <View style={styles.chipGrid}>
      {options.map((opt) => {
        const isOn = selected.includes(opt);
        return (
          <Pressable
            key={opt}
            onPress={() => onToggle(opt)}
            style={[styles.chip, isOn && styles.chipSelected]}
          >
            {isOn && <View style={styles.chipDot} />}
            <Text style={[styles.chipText, isOn && styles.chipTextSelected]}>
              {opt}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  backGlyph: {
    fontFamily: fonts.display,
    fontSize: 28,
    color: colors.inkSoft,
    marginTop: -2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  closeGlyph: { color: colors.inkMuted, fontSize: 16 },

  // Progress dots
  dotsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dot: {
    borderRadius: 99,
  },
  dotActive: {
    width: 10,
    height: 10,
    backgroundColor: colors.gold,
  },
  dotDone: {
    width: 7,
    height: 7,
    backgroundColor: colors.goldDark,
    opacity: 0.4,
  },
  dotPending: {
    width: 7,
    height: 7,
    borderWidth: 1.5,
    borderColor: colors.hairline,
    backgroundColor: "transparent",
  },

  // Body
  body: { flex: 1 },
  scrollContent: {
    paddingHorizontal: space.lg,
    paddingTop: space.md,
    paddingBottom: space.xl,
  },
  stepEyebrow: {
    ...type.uiLabel,
    fontSize: 10,
    letterSpacing: 2,
    color: colors.gold,
    marginBottom: space.sm,
  },
  stepTitle: {
    fontFamily: fonts.display,
    fontSize: 38,
    lineHeight: 42,
    color: colors.ink,
    marginBottom: space.sm,
  },
  stepSub: {
    fontFamily: fonts.serifItalic,
    fontSize: 15,
    lineHeight: 22,
    color: colors.inkMuted,
    fontStyle: "italic",
    marginBottom: space.xl,
  },

  // Avatar grid
  avatarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: space.md,
    justifyContent: "center",
  },
  avatarCell: {
    width: (SCREEN_W - space.lg * 2 - space.md * 3) / 4,
    alignItems: "center",
    padding: space.sm,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  avatarCellSelected: {
    borderColor: colors.gold,
    backgroundColor: "rgba(184,154,91,0.08)",
  },
  avatarImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.goldLight,
  },
  avatarLabel: {
    ...type.meta,
    fontSize: 10,
    marginTop: 6,
    textAlign: "center",
    color: colors.inkSoft,
  },
  avatarLabelSelected: {
    color: colors.goldDark,
    fontFamily: fonts.uiBold,
  },
  avatarCheck: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.gold,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarCheckText: {
    color: colors.bg,
    fontSize: 10,
    fontFamily: fonts.uiBold,
  },

  // Name input
  nameWrap: {
    marginTop: space.md,
  },
  nameInput: {
    fontFamily: fonts.display,
    fontSize: 32,
    color: colors.ink,
    paddingVertical: space.md,
    textAlign: "center",
  },
  nameUnderline: {
    height: 1,
    backgroundColor: colors.gold,
    opacity: 0.5,
    marginTop: -4,
  },

  // Chip grid
  chipGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: space.sm,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.bg,
  },
  chipSelected: {
    borderColor: colors.gold,
    backgroundColor: colors.ink,
  },
  chipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.gold,
  },
  chipText: {
    fontFamily: fonts.ui,
    fontSize: 13,
    color: colors.inkSoft,
  },
  chipTextSelected: {
    color: colors.bg,
  },

  // Footer CTA
  footer: {
    paddingHorizontal: space.lg,
    paddingBottom: space.md,
    paddingTop: space.sm,
  },
  saveError: {
    ...type.bodySm,
    color: colors.danger,
    textAlign: "center",
    marginBottom: space.sm,
  },
  cta: {
    backgroundColor: colors.ink,
    borderRadius: radius.pill,
    paddingVertical: 18,
    alignItems: "center",
  },
  ctaGold: {
    backgroundColor: colors.gold,
  },
  ctaDisabled: {
    opacity: 0.35,
  },
  ctaPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  ctaText: {
    ...type.uiLabel,
    color: colors.bg,
    fontSize: 13,
    letterSpacing: 1.5,
  },
  ctaTextDisabled: {
    opacity: 0.6,
  },
});
