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
  fetchTaoCatalog,
  TaoCatalog,
  TaoScene,
} from "../../lib/books";
import { fonts, radius, space, type } from "../../lib/theme";

const INK = "#1a2b1e";
const INK_SOFT = "rgba(26,43,30,0.82)";
const INK_MUTED = "rgba(26,43,30,0.45)";
const INK_FAINT = "rgba(26,43,30,0.28)";
const JADE = "#6b9e70";
const JADE_SOFT = "rgba(107,158,112,0.5)";
const JADE_FAINT = "rgba(107,158,112,0.15)";
const MIST = "#f4f7f4";

// Classical chapter number parsed out of `chapter: "Verse 42"`.
// Falls back to sequential `number` if the string can't be parsed.
function classicalNumber(scene: TaoScene): number {
  const m = scene.chapter?.match(/\d+/);
  return m ? parseInt(m[0], 10) : scene.number;
}

export default function TaoReader() {
  const [catalog, setCatalog] = useState<TaoCatalog | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [index, setIndex] = useState(0);
  const [showFullChinese, setShowFullChinese] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const fade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    fetchTaoCatalog()
      .then(setCatalog)
      .catch((e) => setError(e instanceof Error ? e.message : "load failed"));
  }, []);

  const changeIndex = (i: number) => {
    if (i === index) return;
    Haptics.selectionAsync();
    setShowFullChinese(false);
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
      <TopBar title="Tao Te Ching" />
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

        {scene.chinese_text ? (
          <ChineseEpigraph
            text={scene.chinese_text}
            expanded={showFullChinese}
            onToggle={() => {
              Haptics.selectionAsync();
              setShowFullChinese((s) => !s);
            }}
          />
        ) : null}

        <Verse text={scene.essay} />

        <InkDivider />

        <PullQuote text={scene.pull_quote} />

        {scene.editor_note ? <EditorNote text={scene.editor_note} /> : null}

        <VerseStrip
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

/* ── Curator hero (first verse only) ───────────────────────── */

function CuratorHero({
  note,
  signature,
}: {
  note: string;
  signature?: string;
}) {
  return (
    <View style={styles.curatorWrap}>
      <Text style={styles.curatorEyebrow}>EDITOR'S NOTE</Text>
      <View style={styles.curatorRule} />
      <Text style={styles.curatorText}>{note}</Text>
      {signature ? (
        <Text style={styles.curatorSignature}>{signature}</Text>
      ) : null}
    </View>
  );
}

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

function Header({
  scene,
  position,
  total,
}: {
  scene: TaoScene;
  position: number;
  total: number;
}) {
  const classical = classicalNumber(scene);
  return (
    <View style={styles.header}>
      <Text style={styles.eyebrow}>
        VERSE {classical}
        <Text style={styles.eyebrowDim}>  ·  {position} of {total}</Text>
      </Text>
      <Text style={styles.bookTitle}>{scene.title}</Text>
      {scene.theme ? (
        <View style={styles.themeBadge}>
          <Text style={styles.themeText}>{scene.theme.toUpperCase()}</Text>
        </View>
      ) : null}
      <Text style={styles.motifGlyph}>道</Text>
      <View style={styles.headerDivider}>
        <View style={styles.headerDivLine} />
        <View style={styles.headerDivDot} />
        <View style={styles.headerDivLine} />
      </View>
    </View>
  );
}

/* ── Chinese source — always present, tap to unfold ─────────
   The first two lines sit as a quiet epigraph above the English.
   A single tap reveals the full classical text. No pill, no
   modal — the source is always there, just waiting to be seen. */

function ChineseEpigraph({
  text,
  expanded,
  onToggle,
}: {
  text: string;
  expanded: boolean;
  onToggle: () => void;
}) {
  const allLines = (text ?? "").split("\n").filter((ln) => ln.trim() !== "");
  if (allLines.length === 0) return null;
  const visible = expanded ? allLines : allLines.slice(0, 2);
  const hasMore = allLines.length > 2;

  return (
    <Pressable
      onPress={hasMore ? onToggle : undefined}
      style={styles.epigraphWrap}
      accessibilityLabel={expanded ? "Collapse Chinese source" : "Expand Chinese source"}
    >
      {visible.map((line, i) => (
        <Text
          key={i}
          style={[
            styles.epigraphLine,
            expanded && styles.epigraphLineFull,
          ]}
        >
          {line}
        </Text>
      ))}
      {hasMore ? (
        <Text style={styles.epigraphToggle}>
          {expanded ? "— fold —" : "— unfold —"}
        </Text>
      ) : null}
    </Pressable>
  );
}

function Verse({ text }: { text: string }) {
  const stanzas = text
    .split(/\n\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
  return (
    <View style={styles.verseBlock}>
      {stanzas.map((stanza, i) => {
        const lines = stanza.split("\n");
        return (
          <View key={i} style={[styles.stanza, i === 0 && { marginTop: 0 }]}>
            {lines.map((line, j) => (
              <Text key={j} style={styles.verseLine}>
                {line}
              </Text>
            ))}
          </View>
        );
      })}
    </View>
  );
}

function InkDivider() {
  return (
    <View style={styles.inkDivider}>
      <View style={styles.inkBrush} />
    </View>
  );
}

function PullQuote({ text }: { text: string }) {
  return (
    <View style={styles.pullWrap}>
      <View style={styles.pullRule} />
      <Text style={styles.pullText}>{text}</Text>
    </View>
  );
}

/* ── Editor note — a single editorial aside below the pull
   quote. Short, italicized, framed as margin commentary. */

function EditorNote({ text }: { text: string }) {
  return (
    <View style={styles.editorNoteWrap}>
      <Text style={styles.editorNoteLabel}>NOTE</Text>
      <Text style={styles.editorNoteText}>{text}</Text>
    </View>
  );
}

function VerseStrip({
  scenes,
  index,
  onSelect,
}: {
  scenes: TaoScene[];
  index: number;
  onSelect: (i: number) => void;
}) {
  return (
    <View style={styles.stripWrap}>
      <Text style={styles.stripEyebrow}>VERSES</Text>
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
              ]}
              accessibilityLabel={`Verse ${classicalNumber(s)}: ${s.title}`}
            >
              <Text
                style={[
                  styles.chipNumber,
                  { color: active ? MIST : INK_MUTED },
                ]}
              >
                {classicalNumber(s)}
              </Text>
              {active && s.theme ? (
                <Text style={styles.chipTheme} numberOfLines={1}>
                  {s.theme.toUpperCase()}
                </Text>
              ) : null}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

function Nav({
  prev,
  next,
  onPrev,
  onNext,
}: {
  prev: TaoScene | null;
  next: TaoScene | null;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <View style={styles.nav}>
      <View style={styles.navHalf}>
        {prev ? (
          <Pressable onPress={onPrev} hitSlop={8}>
            <Text style={styles.navLabel}>
              ← PREVIOUS · VERSE {classicalNumber(prev)}
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
              NEXT · VERSE {classicalNumber(next)} →
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

/* ── Colophon — translator credit, footer ─────────────────── */

function Colophon({ translator }: { translator: string }) {
  return (
    <View style={styles.colophon}>
      <View style={styles.colophonRule} />
      <Text style={styles.colophonLabel}>TRANSLATION</Text>
      <Text style={styles.colophonText}>{translator}</Text>
    </View>
  );
}

function LoadingState() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.center}>
        <ActivityIndicator color={JADE} />
        <Text style={styles.loading}>Finding the way…</Text>
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
          <Text style={styles.errorBackText}>Return to Shelf</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: MIST },
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
    color: JADE,
  },
  topTitle: {
    fontFamily: fonts.displayItalic,
    fontSize: 16,
    color: INK,
  },

  railWrap: {
    height: 2,
    backgroundColor: JADE_FAINT,
    overflow: "hidden",
  },
  railFill: {
    height: "100%",
    backgroundColor: JADE,
    opacity: 0.6,
  },

  /* Curator hero — framed editorial note that opens the book */
  curatorWrap: {
    marginTop: space.lg,
    marginBottom: space.xl,
    paddingVertical: space.lg,
    paddingHorizontal: space.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: JADE_SOFT,
    backgroundColor: "rgba(107,158,112,0.04)",
  },
  curatorEyebrow: {
    fontFamily: fonts.uiBold,
    fontSize: 9,
    letterSpacing: 3.5,
    color: JADE,
    textAlign: "center",
    marginBottom: space.sm,
  },
  curatorRule: {
    alignSelf: "center",
    width: 18,
    height: 1,
    backgroundColor: JADE,
    opacity: 0.45,
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

  header: {
    alignItems: "center",
    paddingTop: space.lg,
    paddingBottom: space.sm,
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
    fontSize: 36,
    lineHeight: 42,
    color: INK,
    textAlign: "center",
    paddingHorizontal: space.md,
  },
  themeBadge: {
    marginTop: space.sm,
    paddingVertical: 4,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: JADE_SOFT,
    backgroundColor: JADE_FAINT,
  },
  themeText: {
    fontFamily: fonts.uiBold,
    fontSize: 8,
    letterSpacing: 3,
    color: JADE,
  },
  motifGlyph: {
    fontSize: 48,
    lineHeight: 56,
    color: INK,
    marginTop: space.md,
    opacity: 0.08,
  },
  headerDivider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: space.md,
  },
  headerDivLine: {
    width: 24,
    height: StyleSheet.hairlineWidth,
    backgroundColor: JADE,
    opacity: 0.5,
  },
  headerDivDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: JADE,
    opacity: 0.4,
  },

  /* Chinese epigraph — source text always present, unfoldable */
  epigraphWrap: {
    alignItems: "center",
    paddingVertical: space.md,
    marginTop: space.md,
    marginBottom: space.sm,
  },
  epigraphLine: {
    fontSize: 17,
    lineHeight: 28,
    color: INK,
    opacity: 0.32,
    letterSpacing: 2,
    textAlign: "center",
  },
  epigraphLineFull: {
    fontSize: 20,
    lineHeight: 34,
    opacity: 0.72,
    letterSpacing: 2.5,
  },
  epigraphToggle: {
    fontFamily: fonts.uiBold,
    fontSize: 8,
    letterSpacing: 3,
    color: JADE,
    opacity: 0.7,
    marginTop: space.sm,
  },

  verseBlock: {
    paddingTop: space.lg,
    paddingBottom: space.sm,
  },
  stanza: {
    marginTop: space.lg,
    alignItems: "center",
  },
  verseLine: {
    fontFamily: fonts.displayItalic,
    fontSize: 19,
    lineHeight: 30,
    color: INK_SOFT,
    textAlign: "center",
  },

  inkDivider: {
    alignItems: "center",
    marginVertical: space.lg,
  },
  inkBrush: {
    width: 36,
    height: StyleSheet.hairlineWidth,
    backgroundColor: INK,
    opacity: 0.18,
  },

  pullWrap: {
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
    width: 1.5,
    backgroundColor: JADE,
    opacity: 0.5,
  },
  pullText: {
    fontFamily: fonts.displayItalic,
    fontSize: 22,
    lineHeight: 32,
    color: INK,
  },

  /* Editor note — margin commentary under the pull quote */
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

  stripWrap: {
    marginTop: space.xl,
    paddingTop: space.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: JADE_FAINT,
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
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 52,
  },
  chipIdle: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: JADE_FAINT,
  },
  chipActive: {
    backgroundColor: INK,
    borderWidth: 1,
    borderColor: INK,
  },
  chipNumber: {
    fontFamily: fonts.displayItalic,
    fontSize: 17,
    lineHeight: 22,
  },
  chipTheme: {
    fontFamily: fonts.uiBold,
    fontSize: 7,
    letterSpacing: 1.5,
    color: JADE,
    marginTop: 3,
    opacity: 0.9,
  },

  nav: {
    flexDirection: "row",
    marginTop: space.xl,
    paddingTop: space.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: JADE_FAINT,
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
    fontSize: 18,
    lineHeight: 24,
    color: INK,
  },

  /* Colophon — translation credit at the bottom */
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
  error: { fontFamily: fonts.display, fontSize: 20, color: INK },
  errorSub: { ...type.caption, marginTop: 6, textAlign: "center" },
  errorBack: {
    marginTop: space.lg,
    paddingVertical: 10,
    paddingHorizontal: space.lg,
    borderWidth: 1,
    borderColor: JADE,
    borderRadius: radius.pill,
  },
  errorBackText: {
    fontFamily: fonts.uiBold,
    fontSize: 11,
    letterSpacing: 2,
    color: INK,
  },
});
