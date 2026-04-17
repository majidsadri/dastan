import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
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
import {
  fetchProustCatalog,
  ProustCatalog,
  ProustScene,
  roman,
} from "../../lib/books";
import { colors, fonts, radius, space, type } from "../../lib/theme";

/**
 * In Search of Lost Time — twelve stations.
 *
 * Same editorial shape as the Tao and Siddhartha readers, but keyed
 * to a belle-époque palette: a dusty rose accent on warm cream, deep
 * aubergine ink. Each station opens with a small French epigraph —
 * tap to unfold the English translation.
 */

const INK = "#231B1E";
const INK_SOFT = "rgba(35,27,30,0.88)";
const INK_MUTED = "rgba(35,27,30,0.55)";
const INK_FAINT = "rgba(35,27,30,0.28)";
const ROSE = "#9e5a5a";
const ROSE_DARK = "#7a4242";
const ROSE_SOFT = "rgba(158,90,90,0.55)";
const ROSE_FAINT = "rgba(158,90,90,0.10)";

export default function ProustReader() {
  const [catalog, setCatalog] = useState<ProustCatalog | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [index, setIndex] = useState(0);
  const [showEnglish, setShowEnglish] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const fade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    fetchProustCatalog()
      .then(setCatalog)
      .catch((e) => setError(e instanceof Error ? e.message : "load failed"));
  }, []);

  const changeIndex = (i: number) => {
    if (i === index) return;
    Haptics.selectionAsync();
    setShowEnglish(false);
    Animated.timing(fade, {
      toValue: 0,
      duration: 140,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start(() => {
      setIndex(i);
      scrollRef.current?.scrollTo({ y: 0, animated: false });
      Animated.timing(fade, {
        toValue: 1,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    });
  };

  if (error) return <ErrorState message={error} />;
  if (!catalog) return <LoadingState />;

  const scene = catalog.scenes[index];
  const total = catalog.scenes.length;
  const isFirst = index === 0;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <TopBar title="In Search of Lost Time" />
      <ProgressRail index={index} total={total} />
      <Animated.ScrollView
        ref={scrollRef as any}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        style={{ opacity: fade }}
      >
        {isFirst && catalog.curator_note ? (
          <CuratorHero
            note={catalog.curator_note}
            signature={catalog.curator_signature}
          />
        ) : null}

        <Header scene={scene} position={index + 1} total={total} />

        {scene.french_quote ? (
          <FrenchEpigraph
            french={scene.french_quote}
            english={scene.english_quote}
            expanded={showEnglish}
            onToggle={() => {
              Haptics.selectionAsync();
              setShowEnglish((s) => !s);
            }}
          />
        ) : null}

        <Essay text={scene.essay} />

        <PullQuote text={scene.pull_quote} />

        {scene.editor_note ? <EditorNote text={scene.editor_note} /> : null}

        <StationStrip
          scenes={catalog.scenes}
          index={index}
          onSelect={changeIndex}
        />

        <Nav
          prev={index > 0 ? catalog.scenes[index - 1] : null}
          next={index < total - 1 ? catalog.scenes[index + 1] : null}
          onPrev={() => changeIndex(index - 1)}
          onNext={() => changeIndex(index + 1)}
        />

        {catalog.translator ? (
          <Colophon translator={catalog.translator} />
        ) : null}
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

/* ── Curator hero ─────────────────────────────────────────── */

function CuratorHero({
  note,
  signature,
}: {
  note: string;
  signature?: string;
}) {
  const paragraphs = note.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
  return (
    <View style={styles.curatorWrap}>
      <Text style={styles.curatorEyebrow}>EDITOR&rsquo;S NOTE</Text>
      <View style={styles.curatorRule} />
      {paragraphs.map((p, i) => (
        <Text
          key={i}
          style={[styles.curatorText, i > 0 && { marginTop: space.md }]}
        >
          {p}
        </Text>
      ))}
      {signature ? (
        <Text style={styles.curatorSignature}>{signature}</Text>
      ) : null}
    </View>
  );
}

/* ── Progress rail ─────────────────────────────────────────── */

function ProgressRail({ index, total }: { index: number; total: number }) {
  return (
    <View style={styles.railWrap}>
      <View
        style={[
          styles.railFill,
          { width: `${((index + 1) / total) * 100}%` },
        ]}
      />
    </View>
  );
}

/* ── Top bar ───────────────────────────────────────────────── */

function TopBar({ title }: { title: string }) {
  return (
    <View style={styles.topBar}>
      <Pressable onPress={() => router.back()} hitSlop={12}>
        <Text style={styles.topBack}>← SHELF</Text>
      </Pressable>
      <Text style={styles.topTitle} numberOfLines={1}>
        {title}
      </Text>
      <View style={{ width: 70 }} />
    </View>
  );
}

/* ── Header: station number + title + motif ornament ──────── */

function Header({
  scene,
  position,
  total,
}: {
  scene: ProustScene;
  position: number;
  total: number;
}) {
  return (
    <View style={styles.header}>
      <Text style={styles.eyebrow}>
        STATION {roman(scene.number)}
        <Text style={styles.eyebrowDim}>  ·  {position} of {total}</Text>
      </Text>
      <Text style={styles.bookTitle}>{scene.title}</Text>
      <Text style={styles.motifOrn}>❦</Text>
      {scene.motif_caption ? (
        <Text style={styles.motifCaption}>{scene.motif_caption}</Text>
      ) : null}
      <View style={styles.headerDivider}>
        <View style={styles.headerDivLine} />
        <View style={styles.headerDivDot} />
        <View style={styles.headerDivLine} />
      </View>
    </View>
  );
}

/* ── French epigraph — source always present, tap to translate. */

function FrenchEpigraph({
  french,
  english,
  expanded,
  onToggle,
}: {
  french: string;
  english: string;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <Pressable
      onPress={onToggle}
      style={styles.epigraphWrap}
      accessibilityLabel={
        expanded ? "Hide English translation" : "Show English translation"
      }
    >
      <Text
        style={[styles.epigraphLine, expanded && styles.epigraphLineFull]}
      >
        {french}
      </Text>
      {expanded && english ? (
        <Text style={styles.epigraphEnglish}>{english}</Text>
      ) : null}
      <Text style={styles.epigraphToggle}>
        {expanded ? "— fold —" : "— unfold —"}
      </Text>
    </Pressable>
  );
}

/* ── Essay ─────────────────────────────────────────────────── */

function Essay({ text }: { text: string }) {
  const paragraphs = text
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
  return (
    <View style={styles.essayBlock}>
      {paragraphs.map((p, i) => (
        <Text
          key={i}
          style={[styles.essayP, i === 0 && styles.essayPFirst]}
        >
          {p}
        </Text>
      ))}
    </View>
  );
}

/* ── Pull quote ────────────────────────────────────────────── */

function PullQuote({ text }: { text: string }) {
  return (
    <View style={styles.pullWrap}>
      <View style={styles.pullRule} />
      <Text style={styles.pullText}>{text}</Text>
    </View>
  );
}

/* ── Editor note ───────────────────────────────────────────── */

function EditorNote({ text }: { text: string }) {
  return (
    <View style={styles.editorNoteWrap}>
      <Text style={styles.editorNoteLabel}>NOTE</Text>
      <Text style={styles.editorNoteText}>{text}</Text>
    </View>
  );
}

/* ── Station strip ─────────────────────────────────────────── */

function StationStrip({
  scenes,
  index,
  onSelect,
}: {
  scenes: ProustScene[];
  index: number;
  onSelect: (i: number) => void;
}) {
  return (
    <View style={styles.stripWrap}>
      <Text style={styles.stripEyebrow}>STATIONS</Text>
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
                { width: active ? 120 : 52 },
              ]}
              accessibilityLabel={`Station ${s.number}: ${s.title}`}
            >
              <Text
                style={[
                  styles.chipRoman,
                  {
                    color: active
                      ? "rgba(246,241,230,0.95)"
                      : "rgba(35,27,30,0.7)",
                  },
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
    </View>
  );
}

/* ── Nav ───────────────────────────────────────────────────── */

function Nav({
  prev,
  next,
  onPrev,
  onNext,
}: {
  prev: ProustScene | null;
  next: ProustScene | null;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <View style={styles.nav}>
      <View style={styles.navHalf}>
        {prev ? (
          <Pressable onPress={onPrev} hitSlop={8}>
            <Text style={styles.navLabel}>
              ← PREVIOUS · {roman(prev.number)}
            </Text>
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
            <Text
              style={[styles.navTitle, { textAlign: "right" }]}
              numberOfLines={2}
            >
              {next.title}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

/* ── Colophon ──────────────────────────────────────────────── */

function Colophon({ translator }: { translator: string }) {
  return (
    <View style={styles.colophon}>
      <View style={styles.colophonRule} />
      <Text style={styles.colophonLabel}>TRANSLATION</Text>
      <Text style={styles.colophonText}>{translator}</Text>
    </View>
  );
}

/* ── Loading / Error ───────────────────────────────────────── */

function LoadingState() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.center}>
        <ActivityIndicator color={ROSE} />
        <Text style={styles.loading}>Lighting the candle…</Text>
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
          <Text style={styles.errorBackText}>Return to Library</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

/* ── Styles ─────────────────────────────────────────────────── */

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingHorizontal: space.lg, paddingBottom: space.xxl },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: space.lg,
  },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
  },
  topBack: {
    fontFamily: fonts.uiBold,
    fontSize: 10,
    letterSpacing: 2,
    color: ROSE_DARK,
  },
  topTitle: {
    fontFamily: fonts.displayItalic,
    fontSize: 15,
    color: colors.ink,
    flex: 1,
    textAlign: "center",
  },

  railWrap: {
    height: 2,
    backgroundColor: "rgba(35,27,30,0.06)",
    overflow: "hidden",
  },
  railFill: {
    height: "100%",
    backgroundColor: "rgba(35,27,30,0.65)",
  },

  /* Curator hero */
  curatorWrap: {
    marginTop: space.lg,
    marginBottom: space.xl,
    paddingVertical: space.lg,
    paddingHorizontal: space.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: ROSE_SOFT,
    backgroundColor: ROSE_FAINT,
  },
  curatorEyebrow: {
    fontFamily: fonts.uiBold,
    fontSize: 9,
    letterSpacing: 3.5,
    color: ROSE_DARK,
    textAlign: "center",
    marginBottom: space.sm,
  },
  curatorRule: {
    alignSelf: "center",
    width: 18,
    height: 1,
    backgroundColor: ROSE,
    opacity: 0.55,
    marginBottom: space.md,
  },
  curatorText: {
    fontFamily: fonts.serifItalic,
    fontSize: 16,
    lineHeight: 26,
    color: INK_SOFT,
    fontStyle: "italic",
    textAlign: "center",
  },
  curatorSignature: {
    fontFamily: fonts.uiBold,
    fontSize: 10,
    letterSpacing: 2,
    color: INK_MUTED,
    textAlign: "center",
    marginTop: space.md,
  },

  /* Header */
  header: {
    alignItems: "center",
    paddingTop: space.xl,
    paddingBottom: space.lg,
  },
  eyebrow: {
    fontFamily: fonts.uiBold,
    fontSize: 10,
    letterSpacing: 3.5,
    color: INK,
    marginBottom: space.sm,
  },
  eyebrowDim: {
    color: INK_MUTED,
    letterSpacing: 2.5,
  },
  bookTitle: {
    fontFamily: fonts.displayItalic,
    fontSize: 38,
    lineHeight: 44,
    color: INK,
    textAlign: "center",
    paddingHorizontal: space.md,
  },
  motifOrn: {
    fontFamily: fonts.display,
    fontSize: 46,
    lineHeight: 54,
    color: ROSE,
    opacity: 0.35,
    marginTop: space.md,
  },
  motifCaption: {
    fontFamily: fonts.serifItalic,
    fontSize: 13,
    lineHeight: 20,
    color: INK_MUTED,
    fontStyle: "italic",
    textAlign: "center",
    marginTop: space.sm,
    paddingHorizontal: space.lg,
    maxWidth: 360,
  },
  headerDivider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: space.lg,
  },
  headerDivLine: {
    width: 24,
    height: StyleSheet.hairlineWidth,
    backgroundColor: ROSE,
    opacity: 0.5,
  },
  headerDivDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: ROSE,
    opacity: 0.45,
  },

  /* French epigraph */
  epigraphWrap: {
    alignItems: "center",
    paddingVertical: space.md,
    marginTop: space.sm,
    marginBottom: space.sm,
  },
  epigraphLine: {
    fontFamily: fonts.serifItalic,
    fontSize: 17,
    lineHeight: 26,
    color: INK,
    opacity: 0.45,
    textAlign: "center",
    paddingHorizontal: space.md,
  },
  epigraphLineFull: {
    fontSize: 18,
    lineHeight: 28,
    opacity: 0.8,
  },
  epigraphEnglish: {
    fontFamily: fonts.serif,
    fontSize: 15,
    lineHeight: 23,
    color: INK_MUTED,
    textAlign: "center",
    paddingHorizontal: space.md,
    marginTop: space.sm,
    maxWidth: 360,
  },
  epigraphToggle: {
    fontFamily: fonts.uiBold,
    fontSize: 8,
    letterSpacing: 3,
    color: ROSE_DARK,
    opacity: 0.7,
    marginTop: space.sm,
  },

  /* Essay */
  essayBlock: {
    paddingTop: space.lg,
    paddingBottom: space.md,
  },
  essayP: {
    fontFamily: fonts.serif,
    fontSize: 18,
    lineHeight: 30,
    color: INK_SOFT,
    marginTop: space.md,
    textAlign: "left",
  },
  essayPFirst: {
    marginTop: 0,
    fontSize: 19,
    lineHeight: 32,
    color: INK,
  },

  /* Pull quote */
  pullWrap: {
    marginTop: space.xl,
    marginBottom: space.md,
    paddingVertical: space.md,
    paddingLeft: space.lg,
    position: "relative",
  },
  pullRule: {
    position: "absolute",
    left: 0,
    top: space.md,
    bottom: space.md,
    width: 2,
    backgroundColor: ROSE,
    opacity: 0.75,
  },
  pullText: {
    fontFamily: fonts.displayItalic,
    fontSize: 22,
    lineHeight: 32,
    color: INK,
  },

  /* Editor note */
  editorNoteWrap: {
    marginTop: space.sm,
    marginBottom: space.lg,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    alignItems: "center",
  },
  editorNoteLabel: {
    fontFamily: fonts.uiBold,
    fontSize: 8,
    letterSpacing: 3.5,
    color: INK_FAINT,
    marginBottom: space.xs,
  },
  editorNoteText: {
    fontFamily: fonts.serifItalic,
    fontSize: 14,
    lineHeight: 22,
    color: INK_MUTED,
    fontStyle: "italic",
    textAlign: "center",
    maxWidth: 360,
  },

  /* Station strip */
  stripWrap: {
    marginTop: space.xl,
    paddingTop: space.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(35,27,30,0.12)",
  },
  stripEyebrow: {
    fontFamily: fonts.uiBold,
    fontSize: 10,
    letterSpacing: 3,
    color: INK_MUTED,
    marginBottom: space.sm,
  },
  stripRow: {
    gap: 8,
    paddingVertical: space.sm,
    alignItems: "stretch",
  },
  chip: {
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  chipIdle: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "rgba(35,27,30,0.15)",
  },
  chipActive: {
    backgroundColor: INK,
    borderWidth: 1,
    borderColor: INK,
  },
  chipRoman: {
    fontFamily: fonts.displayItalic,
    fontSize: 18,
    lineHeight: 22,
  },
  chipTitle: {
    fontFamily: fonts.uiBold,
    fontSize: 8,
    letterSpacing: 1.5,
    color: "rgba(246,241,230,0.85)",
    marginTop: 3,
  },

  /* Nav */
  nav: {
    flexDirection: "row",
    marginTop: space.xl,
    paddingTop: space.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(35,27,30,0.12)",
  },
  navHalf: { flex: 1 },
  navLabel: {
    fontFamily: fonts.uiBold,
    fontSize: 9,
    letterSpacing: 2,
    color: INK_MUTED,
    marginBottom: 6,
  },
  navTitle: {
    fontFamily: fonts.displayItalic,
    fontSize: 17,
    lineHeight: 22,
    color: INK,
  },

  /* Colophon */
  colophon: {
    marginTop: space.xl,
    paddingTop: space.lg,
    alignItems: "center",
  },
  colophonRule: {
    width: 24,
    height: StyleSheet.hairlineWidth,
    backgroundColor: INK,
    opacity: 0.18,
    marginBottom: space.md,
  },
  colophonLabel: {
    fontFamily: fonts.uiBold,
    fontSize: 8,
    letterSpacing: 3,
    color: INK_FAINT,
    marginBottom: space.xs,
  },
  colophonText: {
    fontFamily: fonts.serifItalic,
    fontSize: 11,
    lineHeight: 16,
    color: INK_MUTED,
    fontStyle: "italic",
    textAlign: "center",
    maxWidth: 320,
  },

  loading: { ...type.caption, marginTop: space.sm },
  error: { fontFamily: fonts.display, fontSize: 20, color: colors.ink },
  errorSub: { ...type.caption, marginTop: 6, textAlign: "center" },
  errorBack: {
    marginTop: space.lg,
    paddingVertical: 10,
    paddingHorizontal: space.lg,
    borderWidth: 1,
    borderColor: ROSE,
    borderRadius: radius.pill,
  },
  errorBackText: {
    fontFamily: fonts.uiBold,
    fontSize: 11,
    letterSpacing: 2,
    color: ROSE_DARK,
  },
});
