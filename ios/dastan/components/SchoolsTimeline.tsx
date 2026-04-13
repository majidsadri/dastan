import { useMemo, useState } from "react";
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Svg, { G, Line, Path, Rect, Text as SvgText } from "react-native-svg";
import { Philosopher } from "../lib/api";
import { colors, fonts, space, type } from "../lib/theme";

/**
 * Schools of Thought — a ridgeline/stream graph showing how eight
 * philosophical traditions wax and wane across 2,500 years of human
 * thought. A faithful port of the web app's `SchoolsStreamGraph`
 * (frontend/src/app/philosophers/page.tsx):
 *
 *   1. Bin philosopher lifespans into 10-year decades from -600 to
 *      +2020, counting every decade each philosopher was alive.
 *   2. Smooth each tradition's count with a triangular kernel of
 *      radius 7 (~140-year window) so the rivers flow gracefully
 *      instead of spiking on individual births.
 *   3. Stack the smoothed counts with a silhouette layout (centered
 *      on y=0) so the whole shape breathes symmetrically.
 *   4. Convert each band's top/bottom samples into a smooth
 *      cubic-Bezier path via Catmull-Rom interpolation — the
 *      "silk-smooth rivers" treatment from the web original.
 *   5. Render with era tint strips behind the streams, then the
 *      streams themselves, then era labels and a year axis.
 *   6. Tap a legend chip to isolate a single tradition (others dim).
 */

// ─── Traditions: hand-curated schools with gilded palette ───────────
// Exact match to the web component's TRADITIONS array so visual IDs
// stay consistent between platforms.
type Tradition = { id: string; name: string; color: string };
const TRADITIONS: Tradition[] = [
  { id: "classical",      name: "Classical Greek",                color: "#B8860B" },
  { id: "hellenistic",    name: "Hellenistic",                    color: "#A0522D" },
  { id: "scholastic",     name: "Scholastic",                     color: "#6B4423" },
  { id: "rationalism",    name: "Rationalism",                    color: "#4A6741" },
  { id: "empiricism",     name: "Empiricism",                     color: "#5F8A8B" },
  { id: "idealism",       name: "German Idealism",                color: "#2C4A6E" },
  { id: "existentialism", name: "Existentialism & Phenomenology", color: "#5B2C6E" },
  { id: "political",      name: "Marxism & Political",            color: "#8B3A3A" },
];

// Philosopher id → tradition id. Kept in lockstep with the web
// version; any philosopher not in this map is simply omitted from
// the timeline rather than crashing.
const PHILOSOPHER_TRADITION: Record<string, string> = {
  socrates: "classical", plato: "classical", aristotle: "classical",
  epicurus: "hellenistic", "marcus-aurelius": "hellenistic",
  augustine: "scholastic", "ibn-sina": "scholastic", aquinas: "scholastic",
  "mulla-sadra": "scholastic", "omar-khayyam": "scholastic",
  descartes: "rationalism", spinoza: "rationalism",
  hume: "empiricism",
  kant: "idealism", hegel: "idealism", schopenhauer: "idealism",
  kierkegaard: "existentialism", nietzsche: "existentialism",
  husserl: "existentialism", heidegger: "existentialism",
  sartre: "existentialism", beauvoir: "existentialism",
  marx: "political", arendt: "political",
};

// Era tint strips — gently colored rectangles behind the streams
// so the viewer can orient "ancient / medieval / …" at a glance.
const ERA_BOUNDS = [
  { id: "ancient",      start: -600, end:  300, label: "ANCIENT",      fill: "rgba(184,134,11,0.06)"  },
  { id: "medieval",     start:  300, end: 1500, label: "MEDIEVAL",     fill: "rgba(107,68,35,0.05)"    },
  { id: "early-modern", start: 1500, end: 1750, label: "EARLY MODERN", fill: "rgba(74,103,65,0.05)"    },
  { id: "modern",       start: 1750, end: 1900, label: "MODERN",       fill: "rgba(44,74,110,0.05)"    },
  { id: "contemporary", start: 1900, end: 2020, label: "CONTEMPORARY", fill: "rgba(91,44,110,0.05)"    },
];

// ─── Time binning ───────────────────────────────────────────────────
const START = -600;
const END = 2020;
const STEP = 10;
const T = Math.floor((END - START) / STEP) + 1; // 263 decades

// ─── Catmull-Rom → cubic Bezier path smoother (silk rivers) ────────
const curves = (pts: [number, number][]): string => {
  if (pts.length < 2) return "";
  let d = "";
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || pts[i + 1];
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C${c1x.toFixed(2)},${c1y.toFixed(2)} ${c2x.toFixed(2)},${c2y.toFixed(2)} ${p2[0].toFixed(2)},${p2[1].toFixed(2)}`;
  }
  return d;
};

// Triangular-kernel smoothing (radius r ≈ r*STEP years on each side).
const smooth = (vs: number[], r: number): number[] => {
  const out = new Array(vs.length).fill(0);
  for (let i = 0; i < vs.length; i++) {
    let s = 0;
    let w = 0;
    for (let j = -r; j <= r; j++) {
      const k = i + j;
      if (k < 0 || k >= vs.length) continue;
      const weight = 1 - Math.abs(j) / (r + 1);
      s += vs[k] * weight;
      w += weight;
    }
    out[i] = w > 0 ? s / w : 0;
  }
  return out;
};

// ─── Component ──────────────────────────────────────────────────────
export function SchoolsTimeline({ philosophers }: { philosophers: Philosopher[] }) {
  const [isolated, setIsolated] = useState<string | null>(null);

  // Chart geometry — sized to the screen width minus a small gutter.
  // We draw into a viewBox of [W × H] and let the SVG scale.
  const screenW = Dimensions.get("window").width;
  const W = Math.min(screenW - space.md * 2, 560);
  const H = 260;
  const padL = 10;
  const padR = 10;
  const padT = 28; // leave room for era labels
  const padB = 26; // leave room for year axis
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;

  const xScale = (t: number) => padL + (t / (T - 1)) * innerW;
  const yScaleFactory = (maxTotal: number) => (v: number) =>
    padT + innerH * 0.5 + (v / Math.max(0.001, maxTotal)) * innerH * 0.9;

  // Era strip x-coordinates (convert year → decade-index → px).
  const yearToX = (year: number) => {
    const t = (year - START) / STEP;
    return xScale(Math.max(0, Math.min(T - 1, t)));
  };

  // Compute bands + paths from the live philosopher list.
  const { paths, maxTotal } = useMemo(() => {
    // Count matrix [tradition][decade]
    const decades: number[] = [];
    for (let i = 0; i < T; i++) decades.push(START + i * STEP);
    const raw: number[][] = TRADITIONS.map(() => new Array(T).fill(0));
    for (const p of philosophers) {
      const tid = PHILOSOPHER_TRADITION[p.id];
      if (!tid) continue;
      const ti = TRADITIONS.findIndex((t) => t.id === tid);
      if (ti < 0) continue;
      const by = p.born_year;
      const dy = p.died_year;
      if (by == null || dy == null) continue;
      for (let t = 0; t < T; t++) {
        const y = decades[t];
        if (by <= y + STEP && dy >= y) raw[ti][t] += 1;
      }
    }
    const smoothed = raw.map((r) => smooth(r, 7));

    // Silhouette stacking — each point's bottom is the running sum
    // of the traditions below minus half the total, so the whole
    // shape is centered vertically.
    const totals = new Array(T).fill(0);
    for (let t = 0; t < T; t++) {
      for (let i = 0; i < TRADITIONS.length; i++) totals[t] += smoothed[i][t];
    }
    const maxT = Math.max(0.001, ...totals);
    const yScale = yScaleFactory(maxT);

    const bands = TRADITIONS.map((_, i) => {
      const out: { t: number; top: number; bot: number }[] = [];
      for (let t = 0; t < T; t++) {
        let below = 0;
        for (let j = 0; j < i; j++) below += smoothed[j][t];
        const bot = -totals[t] / 2 + below;
        const top = bot + smoothed[i][t];
        out.push({ t, top, bot });
      }
      return out;
    });

    const paths = bands.map((band) => {
      const topPts = band.map(
        (b) => [xScale(b.t), yScale(b.top)] as [number, number]
      );
      const botPts = band
        .map((b) => [xScale(b.t), yScale(b.bot)] as [number, number])
        .reverse();
      const d =
        `M${topPts[0][0].toFixed(2)},${topPts[0][1].toFixed(2)}` +
        curves(topPts) +
        ` L${botPts[0][0].toFixed(2)},${botPts[0][1].toFixed(2)}` +
        curves(botPts) +
        " Z";
      return d;
    });

    return { paths, maxTotal: maxT };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [philosophers, innerW, innerH]);

  // Year ticks along the x-axis
  const tickYears = [-500, 0, 500, 1000, 1500, 2000];

  return (
    <View style={styles.wrap}>
      <Text style={styles.eyebrow}>✦  SCHOOLS OF THOUGHT  ✦</Text>

      {/* Chart */}
      <View style={styles.chartCard}>
        <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
          {/* Era tint strips — behind everything */}
          {ERA_BOUNDS.map((era) => {
            const x0 = yearToX(era.start);
            const x1 = yearToX(era.end);
            return (
              <Rect
                key={`era-bg-${era.id}`}
                x={x0}
                y={padT}
                width={Math.max(0, x1 - x0)}
                height={innerH}
                fill={era.fill}
              />
            );
          })}

          {/* Faint era dividers */}
          {ERA_BOUNDS.slice(1).map((era) => {
            const x = yearToX(era.start);
            return (
              <Line
                key={`era-div-${era.id}`}
                x1={x}
                x2={x}
                y1={padT}
                y2={padT + innerH}
                stroke="rgba(184,154,91,0.25)"
                strokeWidth={0.5}
                strokeDasharray="2,3"
              />
            );
          })}

          {/* Era labels at the top */}
          {ERA_BOUNDS.map((era) => {
            const x0 = yearToX(era.start);
            const x1 = yearToX(era.end);
            const cx = (x0 + x1) / 2;
            if (x1 - x0 < 28) return null; // too narrow to label
            return (
              <SvgText
                key={`era-lbl-${era.id}`}
                x={cx}
                y={padT - 10}
                fontSize={7}
                fontWeight="600"
                fill="#999"
                textAnchor="middle"
                letterSpacing={0.8}
              >
                {era.label}
              </SvgText>
            );
          })}

          {/* Streams */}
          <G>
            {paths.map((d, i) => {
              const trad = TRADITIONS[i];
              const dim = isolated != null && isolated !== trad.id;
              const opacity = dim ? 0.1 : 0.85;
              return (
                <Path
                  key={`band-${trad.id}`}
                  d={d}
                  fill={trad.color}
                  fillOpacity={opacity}
                  stroke={trad.color}
                  strokeWidth={0.5}
                  strokeOpacity={dim ? 0.2 : 0.6}
                />
              );
            })}
          </G>

          {/* Year ticks */}
          {tickYears.map((yr) => {
            const x = yearToX(yr);
            return (
              <G key={`tick-${yr}`}>
                <Line
                  x1={x}
                  x2={x}
                  y1={padT + innerH}
                  y2={padT + innerH + 3}
                  stroke="#bfa67a"
                  strokeWidth={0.5}
                />
                <SvgText
                  x={x}
                  y={padT + innerH + 14}
                  fontSize={8}
                  fill="#8a7a5a"
                  textAnchor="middle"
                >
                  {yr < 0 ? `${Math.abs(yr)} BCE` : `${yr} CE`}
                </SvgText>
              </G>
            );
          })}
        </Svg>
      </View>

      {/* Legend chips — tap to isolate. Horizontally scrollable
          so all 8 fit on narrow screens without wrapping awkwardly. */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.legendRow}
      >
        {TRADITIONS.map((trad) => {
          const active = isolated === trad.id;
          return (
            <Pressable
              key={`chip-${trad.id}`}
              onPress={() => setIsolated((cur) => (cur === trad.id ? null : trad.id))}
              style={({ pressed }) => [
                styles.chip,
                active && { backgroundColor: trad.color + "22", borderColor: trad.color },
                pressed && { opacity: 0.7 },
              ]}
            >
              <View style={[styles.chipDot, { backgroundColor: trad.color }]} />
              <Text
                style={[
                  styles.chipText,
                  active && { color: trad.color, fontFamily: fonts.uiBold },
                ]}
              >
                {trad.name}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Footnote so the tap affordance is discoverable */}
      <Text style={styles.hint}>
        Tap a chip to isolate a tradition · Max density ≈ {maxTotal.toFixed(1)} minds
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: space.md,
    paddingVertical: space.xl,
    alignItems: "center",
  },
  eyebrow: {
    ...type.uiLabel,
    color: colors.goldLight,
    fontSize: 10,
    letterSpacing: 2,
    marginBottom: space.sm,
    textAlign: "center",
  },
  chartCard: {
    backgroundColor: "rgba(184,154,91,0.04)",
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: "rgba(184,154,91,0.35)",
    paddingVertical: space.sm,
    paddingHorizontal: space.xs,
    marginBottom: space.md,
  },
  legendRow: {
    gap: 8,
    paddingHorizontal: space.sm,
    paddingVertical: 4,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 0.5,
    borderColor: "rgba(184,154,91,0.4)",
    backgroundColor: "rgba(250,247,240,0.5)",
  },
  chipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  chipText: {
    fontFamily: fonts.ui,
    fontSize: 10.5,
    color: colors.inkSoft,
    letterSpacing: 0.3,
  },
  hint: {
    ...type.meta,
    fontSize: 10,
    color: colors.inkMuted,
    fontStyle: "italic",
    textAlign: "center",
    marginTop: space.sm,
    paddingHorizontal: space.md,
  },
});
