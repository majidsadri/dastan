/**
 * Philosopher-specific illustrations registry.
 *
 * Figures are interleaved inside each philosopher's article at the
 * paragraph index given by `afterParagraph`. The render function
 * receives the current era color so decorative frames/captions can
 * harmonize with the page palette.
 *
 * Image assets live under `public/philosophers/scenes/`.
 */

import type { ReactElement } from "react";

export type PhilosopherFigure = {
  /** Insert this figure AFTER this paragraph index in the article body (0-based). */
  afterParagraph: number;
  /** Small italic line rendered under the illustration. */
  caption: string;
  /** Optional wider viewBox for scenes that want to breathe. */
  wide?: boolean;
  render: (props: { color: string }) => ReactElement;
};

/* ═══════════════════════════════════════════════════════════
 * SOCRATES
 * ═══════════════════════════════════════════════════════════ */

function SocratesAgoraScene({ color }: { color: string }) {
  return (
    <div
      className="relative w-full overflow-hidden rounded-lg"
      style={{
        boxShadow: `0 1px 0 ${color}22, 0 20px 40px -24px rgba(44, 36, 24, 0.35)`,
        border: `1px solid ${color}33`,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/philosophers/scenes/socrates-agora.png"
        alt="Socrates teaching in the Agora — surrounded by listeners beneath the columns of Athens."
        className="block h-auto w-full"
        loading="lazy"
        decoding="async"
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
 * PLATO
 * ═══════════════════════════════════════════════════════════ */

function PlatoCaveScene({ color }: { color: string }) {
  return (
    <div
      className="relative w-full overflow-hidden rounded-lg"
      style={{
        boxShadow: `0 1px 0 ${color}22, 0 20px 40px -24px rgba(44, 36, 24, 0.35)`,
        border: `1px solid ${color}33`,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/philosophers/scenes/plato-cave.png"
        alt="Plato's allegory of the cave — prisoners watch shadows on the wall while one escapes toward the sunlit world outside."
        className="block h-auto w-full"
        loading="lazy"
        decoding="async"
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
 * ARISTOTLE
 * ═══════════════════════════════════════════════════════════ */

function AristotleTeachingScene({ color }: { color: string }) {
  return (
    <div
      className="relative w-full overflow-hidden rounded-lg"
      style={{
        boxShadow: `0 1px 0 ${color}22, 0 20px 40px -24px rgba(44, 36, 24, 0.35)`,
        border: `1px solid ${color}33`,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/philosophers/scenes/aristotle-teaching.png"
        alt="Aristotle teaching his students — thought bubbles overhead labeled Biology and Metaphysics, a table of specimens before him."
        className="block h-auto w-full"
        loading="lazy"
        decoding="async"
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
 * OMAR KHAYYAM
 * ═══════════════════════════════════════════════════════════ */

function KhayyamStarsScene({ color }: { color: string }) {
  return (
    <div
      className="relative w-full overflow-hidden rounded-lg"
      style={{
        boxShadow: `0 1px 0 ${color}22, 0 20px 40px -24px rgba(44, 36, 24, 0.35)`,
        border: `1px solid ${color}33`,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/philosophers/scenes/khayyam-stars.png"
        alt="Omar Khayyam seated with a book, a celestial globe and scrolls beside him — thought bubbles overhead carrying constellations and algebraic equations."
        className="block h-auto w-full"
        loading="lazy"
        decoding="async"
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
 * EPICURUS
 * ═══════════════════════════════════════════════════════════ */

function EpicurusContemplationScene({ color }: { color: string }) {
  return (
    <div
      className="relative w-full overflow-hidden rounded-lg"
      style={{
        boxShadow: `0 1px 0 ${color}22, 0 20px 40px -24px rgba(44, 36, 24, 0.35)`,
        border: `1px solid ${color}33`,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/philosophers/scenes/epicurus-contemplation.png"
        alt="Epicurus in his garden — raising a cup to his students, with thought bubbles of atoms and a reclining figure labeled happiness."
        className="block h-auto w-full"
        loading="lazy"
        decoding="async"
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
 * REGISTRY
 * ═══════════════════════════════════════════════════════════ */

export const PHILOSOPHER_ILLUSTRATIONS: Record<string, PhilosopherFigure[]> = {
  socrates: [
    {
      afterParagraph: 2,
      caption: "Socrates in the Agora — the questions were the weapon.",
      wide: true,
      render: SocratesAgoraScene,
    },
  ],
  plato: [
    {
      afterParagraph: 2,
      caption: "The allegory of the cave — shadows on the wall, sunlight beyond the threshold.",
      wide: true,
      render: PlatoCaveScene,
    },
  ],
  aristotle: [
    {
      afterParagraph: 2,
      caption: "Aristotle at the Lyceum — from the dissection of animals to the first principles of being.",
      wide: true,
      render: AristotleTeachingScene,
    },
  ],
  "omar-khayyam": [
    {
      afterParagraph: 2,
      caption: "Khayyam at his work — stars overhead, algebra in hand, Isfahan on the horizon.",
      wide: true,
      render: KhayyamStarsScene,
    },
  ],
  epicurus: [
    {
      afterParagraph: 2,
      caption: "Epicurus in the Garden — atoms in the void, friendship at the table, happiness as the aim.",
      wide: true,
      render: EpicurusContemplationScene,
    },
  ],
};

export function getPhilosopherFigures(id: string): PhilosopherFigure[] {
  return PHILOSOPHER_ILLUSTRATIONS[id] ?? [];
}
