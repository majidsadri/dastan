import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
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
  askThinkers,
  assetUrl,
  ConsultResponseItem,
  fetchPhilosophers,
  Philosopher,
  toPhilosopherProfile,
} from "../../lib/api";
import { colors, radius, space, type } from "../../lib/theme";

const MAX_SELECTION = 3;

/**
 * Ask the Thinkers — modal flow.
 *
 * Two steps: select up to three thinkers (with portraits) → type a
 * question → hit "Ask" → the backend hits `/api/ai/consult` and
 * returns each philosopher's in-character response, which we lay
 * out as letters with the thinker's portrait as the signature
 * above each answer.
 *
 * If the user deep-linked here from a detail page with `?preselect=`,
 * that philosopher starts selected.
 */
export default function AskThinkersScreen() {
  const { preselect } = useLocalSearchParams<{ preselect?: string }>();
  const [philosophers, setPhilosophers] = useState<Philosopher[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(
    new Set(preselect ? [preselect] : [])
  );
  const [question, setQuestion] = useState("");
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [responses, setResponses] = useState<ConsultResponseItem[] | null>(
    null
  );

  useEffect(() => {
    fetchPhilosophers()
      .then((d) => setPhilosophers(d.philosophers))
      .catch((e) => setError(e?.message ?? String(e)))
      .finally(() => setLoading(false));
  }, []);

  const selectedPhilosophers = useMemo(
    () => philosophers.filter((p) => selected.has(p.id)),
    [philosophers, selected]
  );

  function toggle(id: string) {
    Haptics.selectionAsync();
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        if (next.size >= MAX_SELECTION) return prev;
        next.add(id);
      }
      return next;
    });
  }

  async function submit() {
    if (!question.trim() || selectedPhilosophers.length === 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setAsking(true);
    setError(null);
    setResponses(null);
    try {
      const result = await askThinkers(
        question.trim(),
        selectedPhilosophers.map(toPhilosopherProfile)
      );
      setResponses(result.responses);
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setAsking(false);
    }
  }

  function reset() {
    setResponses(null);
    setQuestion("");
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.modalHeader}>
        <Text style={styles.title}>Ask the Thinkers</Text>
        <Pressable onPress={() => router.back()} style={styles.close}>
          <Text style={styles.closeGlyph}>✕</Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={12}
      >
        {responses ? (
          <ResponseView
            responses={responses}
            question={question}
            philosophers={philosophers}
            onReset={reset}
          />
        ) : (
          <ScrollView contentContainerStyle={styles.scroll}>
            {/* Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>
                CHOOSE UP TO {MAX_SELECTION}
              </Text>
              <Text style={styles.sectionSub}>
                {selected.size === 0
                  ? "Who do you want to hear from?"
                  : `${selected.size} of ${MAX_SELECTION} selected`}
              </Text>
            </View>

            {loading ? (
              <ActivityIndicator color={colors.gold} style={{ marginTop: 40 }} />
            ) : (
              <View style={styles.grid}>
                {philosophers.map((p) => {
                  const isSelected = selected.has(p.id);
                  const portrait = p.image ? assetUrl(p.image) : null;
                  return (
                    <Pressable
                      key={p.id}
                      onPress={() => toggle(p.id)}
                      style={({ pressed }) => [
                        styles.tile,
                        isSelected && styles.tileSelected,
                        pressed && { opacity: 0.8 },
                      ]}
                    >
                      {portrait ? (
                        <Image
                          source={{ uri: portrait }}
                          style={styles.tileImage}
                          contentFit="cover"
                          transition={200}
                        />
                      ) : (
                        <View
                          style={[
                            styles.tileImage,
                            { justifyContent: "center", alignItems: "center" },
                          ]}
                        >
                          <Text style={{ color: colors.gold, fontSize: 20 }}>
                            ◈
                          </Text>
                        </View>
                      )}
                      <Text style={styles.tileName} numberOfLines={1}>
                        {p.name}
                      </Text>
                      {isSelected && (
                        <View style={styles.tileCheck}>
                          <Text style={styles.tileCheckGlyph}>✓</Text>
                        </View>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            )}

            {/* Question */}
            <View style={[styles.section, { marginTop: space.xl }]}>
              <Text style={styles.sectionLabel}>YOUR QUESTION</Text>
              <TextInput
                value={question}
                onChangeText={setQuestion}
                placeholder="What is a life well lived?"
                placeholderTextColor={colors.inkMuted}
                multiline
                style={styles.input}
              />
            </View>

            {error && <Text style={styles.error}>{error}</Text>}

            <Pressable
              disabled={
                asking || !question.trim() || selected.size === 0
              }
              style={({ pressed }) => [
                styles.askBtn,
                (asking || !question.trim() || selected.size === 0) &&
                  styles.askBtnDisabled,
                pressed && { transform: [{ scale: 0.98 }] },
              ]}
              onPress={submit}
            >
              {asking ? (
                <ActivityIndicator color={colors.bg} />
              ) : (
                <Text style={styles.askBtnText}>
                  Ask{" "}
                  {selected.size > 0
                    ? `${selected.size} ${
                        selected.size === 1 ? "thinker" : "thinkers"
                      }`
                    : ""}
                </Text>
              )}
            </Pressable>
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function ResponseView({
  responses,
  question,
  philosophers,
  onReset,
}: {
  responses: ConsultResponseItem[];
  question: string;
  philosophers: Philosopher[];
  onReset: () => void;
}) {
  return (
    <ScrollView contentContainerStyle={styles.responseScroll}>
      <Text style={styles.responseEyebrow}>YOU ASKED</Text>
      <Text style={styles.responseQuestion}>“{question}”</Text>

      {responses.map((r) => {
        const meta = philosophers.find((p) => p.id === r.id);
        const portrait = meta?.image ? assetUrl(meta.image) : null;
        return (
          <View key={r.id} style={styles.letter}>
            <View style={styles.letterHeader}>
              {portrait ? (
                <Image
                  source={{ uri: portrait }}
                  style={styles.letterPortrait}
                  contentFit="cover"
                  transition={250}
                />
              ) : (
                <View style={[styles.letterPortrait, styles.letterPortraitFallback]}>
                  <Text style={{ color: colors.gold }}>◈</Text>
                </View>
              )}
              <View>
                <Text style={styles.letterName}>{r.name}</Text>
                {meta?.school ? (
                  <Text style={styles.letterSchool}>{meta.school}</Text>
                ) : null}
              </View>
            </View>
            <Text style={styles.letterBody}>{r.response}</Text>
          </View>
        );
      })}

      <Pressable style={styles.askAgain} onPress={onReset}>
        <Text style={styles.askAgainText}>Ask another question</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.hairline,
  },
  title: {
    ...type.displaySm,
    fontSize: 26,
  },
  close: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  closeGlyph: {
    color: colors.inkMuted,
    fontSize: 16,
  },

  scroll: { padding: space.lg, paddingBottom: space.xxl },
  section: { marginBottom: space.md },
  sectionLabel: {
    ...type.uiLabel,
    color: colors.gold,
    letterSpacing: 1.5,
    marginBottom: space.xs,
  },
  sectionSub: { ...type.caption, fontSize: 13 },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: space.sm,
    marginTop: space.sm,
  },
  tile: {
    width: "31%",
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.hairline,
    overflow: "hidden",
    padding: 6,
  },
  tileSelected: {
    borderColor: colors.gold,
    borderWidth: 2,
    padding: 5,
    backgroundColor: "#fffaeb",
  },
  tileImage: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: radius.sm,
    backgroundColor: colors.goldLight,
  },
  tileName: {
    ...type.meta,
    fontSize: 11,
    textAlign: "center",
    marginTop: 4,
    color: colors.ink,
  },
  tileCheck: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.gold,
    justifyContent: "center",
    alignItems: "center",
  },
  tileCheckGlyph: {
    color: colors.bg,
    fontSize: 12,
    fontWeight: "700",
  },

  input: {
    ...type.body,
    fontSize: 18,
    lineHeight: 26,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.hairline,
    padding: space.md,
    paddingTop: space.md,
    minHeight: 110,
    textAlignVertical: "top",
  },
  error: {
    ...type.bodySm,
    color: colors.danger,
    marginTop: space.sm,
  },

  askBtn: {
    backgroundColor: colors.ink,
    borderRadius: radius.pill,
    paddingVertical: 18,
    alignItems: "center",
    marginTop: space.lg,
  },
  askBtnDisabled: { opacity: 0.4 },
  askBtnText: {
    ...type.uiLabel,
    color: colors.bg,
    fontSize: 13,
  },

  // Response view
  responseScroll: { padding: space.lg, paddingBottom: space.xxl },
  responseEyebrow: { ...type.eyebrow, marginBottom: space.xs },
  responseQuestion: {
    fontFamily: "CormorantGaramond_500Medium_Italic",
    fontSize: 26,
    lineHeight: 34,
    color: colors.ink,
    fontStyle: "italic",
    marginBottom: space.xl,
  },
  letter: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.hairline,
    padding: space.lg,
    marginBottom: space.md,
  },
  letterHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
    marginBottom: space.md,
    paddingBottom: space.md,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.hairline,
  },
  letterPortrait: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.goldLight,
    borderWidth: 2,
    borderColor: colors.gold,
  },
  letterPortraitFallback: {
    justifyContent: "center",
    alignItems: "center",
  },
  letterName: {
    ...type.title,
    fontSize: 22,
  },
  letterSchool: { ...type.meta, fontSize: 11 },
  letterBody: {
    ...type.body,
    fontSize: 16,
    lineHeight: 26,
  },

  askAgain: {
    marginTop: space.lg,
    paddingVertical: space.md,
    alignItems: "center",
  },
  askAgainText: { ...type.uiLabel, color: colors.gold },
});
