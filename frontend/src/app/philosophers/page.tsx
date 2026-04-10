"use client";

import { useEffect, useState, useCallback, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  speakText,
  consultPhilosophers,
  type ConsultResponseItem,
} from "@/lib/api";

/* TTS cache — persists across modal opens within the session */
const ttsCache = new Map<string, Blob>();
/* Fun fact TTS cache — separate from article cache */
const funFactCache = new Map<string, Blob>();
/* Track which fun fact is currently playing to avoid overlaps */
let activeFunFactAudio: HTMLAudioElement | null = null;

/* ─── Wisdom Topics — connecting philosophy to modern life ─── */
interface WisdomTopic {
  id: string;
  title: string;
  subtitle: string;
  icon: string;       // SVG path key
  color: string;
  philosophers: string[];  // philosopher IDs
  lessons: { thinker: string; insight: string }[];
}

const WISDOM_TOPICS: WisdomTopic[] = [
  {
    id: "anxiety",
    title: "Dealing with Anxiety",
    subtitle: "When your mind won't stop racing",
    icon: "mind",
    color: "#4A6741",
    philosophers: ["marcus-aurelius", "epicurus", "kierkegaard", "spinoza"],
    lessons: [
      { thinker: "Marcus Aurelius", insight: "You have power over your mind — not outside events. Focus only on what you can control: your choices, your response, your character." },
      { thinker: "Epicurus", insight: "Most of what we fear never happens. Strip away imagined futures and you'll find the present moment is usually bearable — even pleasant." },
      { thinker: "Kierkegaard", insight: "Anxiety is the dizziness of freedom. It means you're alive and aware of your choices. Don't run from it — walk through it." },
      { thinker: "Spinoza", insight: "Understand the cause of your emotions and they lose their power over you. Anxiety dissolves in the light of reason." },
    ],
  },
  {
    id: "meaning",
    title: "Finding Meaning",
    subtitle: "When life feels pointless",
    icon: "compass",
    color: "#2C4A6E",
    philosophers: ["nietzsche", "sartre", "beauvoir", "aristotle"],
    lessons: [
      { thinker: "Nietzsche", insight: "He who has a why to live can bear almost any how. Meaning isn't given — you forge it through what you overcome." },
      { thinker: "Sartre", insight: "You are condemned to be free. There is no cosmic script — you write your own meaning through every choice you make." },
      { thinker: "Beauvoir", insight: "Freedom is not something given but something you actively create through engagement with the world and others." },
      { thinker: "Aristotle", insight: "Happiness is not a feeling but an activity — it comes from living well and doing well, from excellence practiced daily." },
    ],
  },
  {
    id: "anger",
    title: "Handling Anger",
    subtitle: "When someone wrongs you",
    icon: "flame",
    color: "#8B4513",
    philosophers: ["marcus-aurelius", "spinoza", "hume", "arendt"],
    lessons: [
      { thinker: "Marcus Aurelius", insight: "When offended, remember: the offender acts from ignorance, not malice. Anger punishes you more than them." },
      { thinker: "Spinoza", insight: "Hatred is increased by being reciprocated, but can be destroyed by love. Understanding someone's nature dissolves resentment." },
      { thinker: "Hume", insight: "Reason alone never motivates action — passions do. Acknowledge your anger, then ask: what do I actually want to happen next?" },
      { thinker: "Arendt", insight: "Forgiveness is the only way to break the cycle. Without it, we are forever bound to the act that harmed us." },
    ],
  },
  {
    id: "decisions",
    title: "Making Hard Choices",
    subtitle: "When you don't know what's right",
    icon: "scales",
    color: "#6B4423",
    philosophers: ["aristotle", "kant", "descartes", "kierkegaard"],
    lessons: [
      { thinker: "Aristotle", insight: "Virtue lies in the golden mean — between excess and deficiency. The right choice is usually not the extreme one." },
      { thinker: "Kant", insight: "Act only according to rules you'd want everyone to follow. If you wouldn't want it to be universal, don't do it." },
      { thinker: "Descartes", insight: "When lost in a forest, walk in one straight line. Indecision is worse than an imperfect choice made with resolve." },
      { thinker: "Kierkegaard", insight: "Every real choice involves a leap of faith. You'll never have perfect information — act anyway, and own it." },
    ],
  },
  {
    id: "love",
    title: "Love & Relationships",
    subtitle: "When the heart is complicated",
    icon: "heart",
    color: "#8B3A62",
    philosophers: ["plato", "schopenhauer", "beauvoir", "kierkegaard"],
    lessons: [
      { thinker: "Plato", insight: "Love begins with beauty but ascends to wisdom. The deepest love is not possession — it's mutual growth toward what is good." },
      { thinker: "Schopenhauer", insight: "Attachment causes suffering, but compassion — feeling with another — is the deepest ethical connection between humans." },
      { thinker: "Beauvoir", insight: "Authentic love is two freedoms recognizing each other. It doesn't diminish — it expands who both people can become." },
      { thinker: "Kierkegaard", insight: "Real love requires courage and commitment. The leap into love is the most terrifying and most human thing we do." },
    ],
  },
  {
    id: "success",
    title: "Ambition & Enough",
    subtitle: "When more is never enough",
    icon: "mountain",
    color: "#8B6914",
    philosophers: ["epicurus", "marx", "hegel", "marcus-aurelius"],
    lessons: [
      { thinker: "Epicurus", insight: "Wealth consists not in having great possessions but in having few wants. The richest person is the one who needs the least." },
      { thinker: "Marx", insight: "When your worth is measured only by what you produce, you lose yourself. Don't confuse your job with your identity." },
      { thinker: "Hegel", insight: "True recognition comes not from domination but from mutual respect. The master who needs a slave is never truly free." },
      { thinker: "Marcus Aurelius", insight: "At dawn remind yourself: I rise to do the work of a human being. Not to chase comfort — to fulfill my responsibility." },
    ],
  },
  {
    id: "mortality",
    title: "Death & Impermanence",
    subtitle: "When time feels short",
    icon: "hourglass",
    color: "#5B2C6E",
    philosophers: ["socrates", "epicurus", "heidegger", "marcus-aurelius"],
    lessons: [
      { thinker: "Socrates", insight: "To fear death is to think ourselves wise when we are not. No one knows whether death may be the greatest blessing." },
      { thinker: "Epicurus", insight: "Death is nothing to us. When we exist, death is not; when death exists, we are not. Why fear what you'll never experience?" },
      { thinker: "Heidegger", insight: "Being-toward-death is what makes life authentic. Only when you accept finitude can you truly choose how to live." },
      { thinker: "Marcus Aurelius", insight: "Think of how many before you have lived and died. Life is temporary — not to be sad, but to sharpen your choices today." },
    ],
  },
  {
    id: "freedom",
    title: "Freedom & Conformity",
    subtitle: "When the world wants you to fit in",
    icon: "bird",
    color: "#2C6E5A",
    philosophers: ["sartre", "nietzsche", "arendt", "beauvoir"],
    lessons: [
      { thinker: "Sartre", insight: "Bad faith is pretending you have no choice. You always have a choice — even choosing not to choose is a choice." },
      { thinker: "Nietzsche", insight: "The individual has always had to struggle to keep from being overwhelmed by the tribe. Be yourself — even if it's lonely." },
      { thinker: "Arendt", insight: "The most radical thing you can do is think for yourself. Evil thrives when people stop questioning and just follow orders." },
      { thinker: "Beauvoir", insight: "No one is free until everyone is. Your liberation is bound up with the liberation of others." },
    ],
  },
];

/* ─── Types ─── */
interface Era {
  id: string;
  name: string;
  period: string;
  color: string;
  description: string;
}

interface Philosopher {
  id: string;
  name: string;
  era: string;
  born: string;
  died: string;
  born_year: number;
  died_year: number;
  nationality: string;
  school: string;
  key_ideas: string[];
  influenced_by: string[];
  influenced: string[];
  famous_quote: string;
  key_works: string[];
  article_title: string;
  article: string;
  pull_quote: string;
  image: string;
  fun_fact?: string;
}

interface CatalogData {
  meta: {
    title: string;
    subtitle: string;
    description: string;
    eras: Era[];
  };
  philosophers: Philosopher[];
}

const ERA_COLORS: Record<string, string> = {
  ancient: "#8B6914",
  medieval: "#6B4423",
  "early-modern": "#4A6741",
  modern: "#2C4A6E",
  contemporary: "#5B2C6E",
};

const ERA_LABELS: Record<string, string> = {
  ancient: "Ancient",
  medieval: "Medieval",
  "early-modern": "Early Modern",
  modern: "Modern",
  contemporary: "Contemporary",
};

const ERA_SYMBOLS: Record<string, string> = {
  ancient: "Ω",
  medieval: "✦",
  "early-modern": "◈",
  modern: "◉",
  contemporary: "◎",
};

/* ─── Era SVG Illustrations — inline clip art ─── */
function EraIllustration({ eraId, color, className = "" }: { eraId: string; color: string; className?: string }) {
  const c = color;
  switch (eraId) {
    case "ancient":
      // Greek column / temple
      return (
        <svg viewBox="0 0 80 80" fill="none" className={className}>
          <rect x="15" y="16" width="50" height="5" rx="2" fill={`${c}18`} stroke={`${c}30`} strokeWidth="0.5" />
          <rect x="12" y="12" width="56" height="5" rx="1" fill={`${c}12`} stroke={`${c}25`} strokeWidth="0.5" />
          <rect x="20" y="21" width="4" height="38" rx="1" fill={`${c}15`} stroke={`${c}25`} strokeWidth="0.5" />
          <rect x="32" y="21" width="4" height="38" rx="1" fill={`${c}15`} stroke={`${c}25`} strokeWidth="0.5" />
          <rect x="44" y="21" width="4" height="38" rx="1" fill={`${c}15`} stroke={`${c}25`} strokeWidth="0.5" />
          <rect x="56" y="21" width="4" height="38" rx="1" fill={`${c}15`} stroke={`${c}25`} strokeWidth="0.5" />
          <rect x="15" y="59" width="50" height="5" rx="1" fill={`${c}18`} stroke={`${c}30`} strokeWidth="0.5" />
          <path d="M40 6 L46 12 H34 Z" fill={`${c}20`} stroke={`${c}30`} strokeWidth="0.5" />
        </svg>
      );
    case "medieval":
      // Gothic arch / rose window
      return (
        <svg viewBox="0 0 80 80" fill="none" className={className}>
          <path d="M20 65 V35 Q20 15 40 12 Q60 15 60 35 V65" stroke={`${c}30`} strokeWidth="1" fill={`${c}06`} />
          <path d="M28 65 V38 Q28 22 40 19 Q52 22 52 38 V65" stroke={`${c}20`} strokeWidth="0.7" fill={`${c}04`} />
          <circle cx="40" cy="32" r="8" stroke={`${c}25`} strokeWidth="0.7" fill={`${c}08`} />
          <circle cx="40" cy="32" r="4" stroke={`${c}20`} strokeWidth="0.5" fill={`${c}12`} />
          <line x1="40" y1="24" x2="40" y2="40" stroke={`${c}15`} strokeWidth="0.5" />
          <line x1="32" y1="32" x2="48" y2="32" stroke={`${c}15`} strokeWidth="0.5" />
          <line x1="34" y1="26" x2="46" y2="38" stroke={`${c}12`} strokeWidth="0.4" />
          <line x1="46" y1="26" x2="34" y2="38" stroke={`${c}12`} strokeWidth="0.4" />
          <path d="M15 65 H65" stroke={`${c}20`} strokeWidth="0.7" />
        </svg>
      );
    case "early-modern":
      // Compass / navigation / enlightenment
      return (
        <svg viewBox="0 0 80 80" fill="none" className={className}>
          <circle cx="40" cy="40" r="26" stroke={`${c}25`} strokeWidth="0.8" fill={`${c}04`} />
          <circle cx="40" cy="40" r="22" stroke={`${c}15`} strokeWidth="0.5" strokeDasharray="2 2" />
          <circle cx="40" cy="40" r="3" fill={`${c}20`} />
          <path d="M40 14 L43 37 L40 40 L37 37 Z" fill={`${c}25`} />
          <path d="M40 66 L37 43 L40 40 L43 43 Z" fill={`${c}12`} />
          <path d="M14 40 L37 37 L40 40 L37 43 Z" fill={`${c}15`} />
          <path d="M66 40 L43 43 L40 40 L43 37 Z" fill={`${c}18`} />
          <text x="40" y="12" textAnchor="middle" fontSize="6" fill={`${c}40`} fontFamily="serif">N</text>
          <text x="40" y="72" textAnchor="middle" fontSize="6" fill={`${c}30`} fontFamily="serif">S</text>
          <text x="10" y="42" textAnchor="middle" fontSize="6" fill={`${c}30`} fontFamily="serif">W</text>
          <text x="70" y="42" textAnchor="middle" fontSize="6" fill={`${c}30`} fontFamily="serif">E</text>
        </svg>
      );
    case "modern":
      // Open book / knowledge
      return (
        <svg viewBox="0 0 80 80" fill="none" className={className}>
          <path d="M40 20 Q28 18 14 22 V60 Q28 56 40 58" stroke={`${c}25`} strokeWidth="0.8" fill={`${c}06`} />
          <path d="M40 20 Q52 18 66 22 V60 Q52 56 40 58" stroke={`${c}25`} strokeWidth="0.8" fill={`${c}08`} />
          <line x1="40" y1="20" x2="40" y2="58" stroke={`${c}20`} strokeWidth="0.6" />
          <line x1="20" y1="28" x2="36" y2="27" stroke={`${c}15`} strokeWidth="0.5" />
          <line x1="20" y1="33" x2="36" y2="32" stroke={`${c}12`} strokeWidth="0.4" />
          <line x1="20" y1="38" x2="36" y2="37" stroke={`${c}12`} strokeWidth="0.4" />
          <line x1="20" y1="43" x2="34" y2="42" stroke={`${c}10`} strokeWidth="0.4" />
          <line x1="44" y1="27" x2="60" y2="28" stroke={`${c}15`} strokeWidth="0.5" />
          <line x1="44" y1="32" x2="60" y2="33" stroke={`${c}12`} strokeWidth="0.4" />
          <line x1="44" y1="37" x2="60" y2="38" stroke={`${c}12`} strokeWidth="0.4" />
          <line x1="44" y1="42" x2="58" y2="43" stroke={`${c}10`} strokeWidth="0.4" />
          <circle cx="52" cy="50" r="3" stroke={`${c}20`} strokeWidth="0.5" fill={`${c}10`} />
        </svg>
      );
    case "contemporary":
      // Abstract thought / neural / connected nodes
      return (
        <svg viewBox="0 0 80 80" fill="none" className={className}>
          <circle cx="40" cy="30" r="5" fill={`${c}15`} stroke={`${c}30`} strokeWidth="0.7" />
          <circle cx="22" cy="50" r="4" fill={`${c}12`} stroke={`${c}25`} strokeWidth="0.6" />
          <circle cx="58" cy="50" r="4" fill={`${c}12`} stroke={`${c}25`} strokeWidth="0.6" />
          <circle cx="30" cy="68" r="3" fill={`${c}10`} stroke={`${c}20`} strokeWidth="0.5" />
          <circle cx="50" cy="68" r="3" fill={`${c}10`} stroke={`${c}20`} strokeWidth="0.5" />
          <circle cx="14" cy="34" r="2.5" fill={`${c}08`} stroke={`${c}18`} strokeWidth="0.5" />
          <circle cx="66" cy="34" r="2.5" fill={`${c}08`} stroke={`${c}18`} strokeWidth="0.5" />
          <line x1="40" y1="35" x2="22" y2="46" stroke={`${c}18`} strokeWidth="0.6" />
          <line x1="40" y1="35" x2="58" y2="46" stroke={`${c}18`} strokeWidth="0.6" />
          <line x1="22" y1="54" x2="30" y2="65" stroke={`${c}15`} strokeWidth="0.5" />
          <line x1="58" y1="54" x2="50" y2="65" stroke={`${c}15`} strokeWidth="0.5" />
          <line x1="40" y1="25" x2="14" y2="34" stroke={`${c}12`} strokeWidth="0.4" />
          <line x1="40" y1="25" x2="66" y2="34" stroke={`${c}12`} strokeWidth="0.4" />
          <line x1="22" y1="50" x2="58" y2="50" stroke={`${c}08`} strokeWidth="0.4" strokeDasharray="3 3" />
          <line x1="30" y1="68" x2="50" y2="68" stroke={`${c}08`} strokeWidth="0.4" strokeDasharray="2 2" />
        </svg>
      );
    default:
      return null;
  }
}

/* ─── Topic Icons — SVG clip art for life themes ─── */
function TopicIcon({ icon, color, className = "" }: { icon: string; color: string; className?: string }) {
  const c = color;
  switch (icon) {
    case "mind":
      return (
        <svg viewBox="0 0 40 40" fill="none" className={className}>
          <circle cx="20" cy="16" r="10" stroke={c} strokeWidth="1.2" fill={`${c}12`} />
          <path d="M14 16 Q14 10 20 8 Q26 10 26 16" stroke={c} strokeWidth="0.8" fill="none" />
          <path d="M16 16 Q16 12 20 10.5 Q24 12 24 16" stroke={c} strokeWidth="0.6" fill="none" opacity="0.6" />
          <path d="M20 26 V32" stroke={c} strokeWidth="1" />
          <path d="M16 32 H24" stroke={c} strokeWidth="1" strokeLinecap="round" />
          <circle cx="20" cy="14" r="1.5" fill={c} opacity="0.3" />
        </svg>
      );
    case "compass":
      return (
        <svg viewBox="0 0 40 40" fill="none" className={className}>
          <circle cx="20" cy="20" r="14" stroke={c} strokeWidth="1" fill={`${c}08`} />
          <circle cx="20" cy="20" r="10" stroke={c} strokeWidth="0.5" strokeDasharray="2 2" opacity="0.4" />
          <path d="M20 6 L22 18 L20 20 L18 18 Z" fill={c} opacity="0.5" />
          <path d="M20 34 L18 22 L20 20 L22 22 Z" fill={c} opacity="0.25" />
          <circle cx="20" cy="20" r="2" fill={c} opacity="0.4" />
        </svg>
      );
    case "flame":
      return (
        <svg viewBox="0 0 40 40" fill="none" className={className}>
          <path d="M20 6 Q26 14 26 20 Q26 28 20 32 Q14 28 14 20 Q14 14 20 6Z" fill={`${c}15`} stroke={c} strokeWidth="1" />
          <path d="M20 14 Q23 18 23 22 Q23 26 20 28 Q17 26 17 22 Q17 18 20 14Z" fill={`${c}25`} stroke={c} strokeWidth="0.5" opacity="0.6" />
          <circle cx="20" cy="22" r="2" fill={c} opacity="0.3" />
        </svg>
      );
    case "scales":
      return (
        <svg viewBox="0 0 40 40" fill="none" className={className}>
          <line x1="20" y1="6" x2="20" y2="32" stroke={c} strokeWidth="1" />
          <line x1="8" y1="12" x2="32" y2="12" stroke={c} strokeWidth="1" />
          <path d="M8 12 L5 22 Q5 26 11 26 L14 22 L8 12Z" fill={`${c}15`} stroke={c} strokeWidth="0.7" />
          <path d="M32 12 L29 22 Q29 26 35 26 L38 22 L32 12Z" fill={`${c}15`} stroke={c} strokeWidth="0.7" />
          <rect x="16" y="30" width="8" height="3" rx="1" fill={`${c}20`} stroke={c} strokeWidth="0.5" />
        </svg>
      );
    case "heart":
      return (
        <svg viewBox="0 0 40 40" fill="none" className={className}>
          <path d="M20 34 L8 22 Q4 16 8 12 Q12 8 16 12 L20 16 L24 12 Q28 8 32 12 Q36 16 32 22 L20 34Z"
            fill={`${c}15`} stroke={c} strokeWidth="1" />
          <path d="M20 28 L12 22 Q10 18 12 16 Q14 14 16 16 L20 20 L24 16 Q26 14 28 16 Q30 18 28 22 L20 28Z"
            fill={`${c}10`} stroke={c} strokeWidth="0.5" opacity="0.5" />
        </svg>
      );
    case "mountain":
      return (
        <svg viewBox="0 0 40 40" fill="none" className={className}>
          <path d="M4 32 L16 10 L22 20 L28 12 L36 32 Z" fill={`${c}10`} stroke={c} strokeWidth="1" />
          <path d="M16 10 L18 14 L14 14 Z" fill={`${c}25`} opacity="0.5" />
          <path d="M28 12 L30 16 L26 16 Z" fill={`${c}25`} opacity="0.5" />
          <circle cx="32" cy="8" r="3" fill={c} opacity="0.15" stroke={c} strokeWidth="0.5" />
        </svg>
      );
    case "hourglass":
      return (
        <svg viewBox="0 0 40 40" fill="none" className={className}>
          <rect x="12" y="4" width="16" height="3" rx="1" stroke={c} strokeWidth="0.8" fill={`${c}15`} />
          <rect x="12" y="33" width="16" height="3" rx="1" stroke={c} strokeWidth="0.8" fill={`${c}15`} />
          <path d="M14 7 L14 14 L20 20 L26 14 L26 7" stroke={c} strokeWidth="0.8" fill={`${c}08`} />
          <path d="M14 33 L14 26 L20 20 L26 26 L26 33" stroke={c} strokeWidth="0.8" fill={`${c}12`} />
          <circle cx="20" cy="20" r="1.5" fill={c} opacity="0.4" />
        </svg>
      );
    case "bird":
      return (
        <svg viewBox="0 0 40 40" fill="none" className={className}>
          <path d="M8 20 Q12 12 20 10 Q28 10 32 16" stroke={c} strokeWidth="1.2" fill="none" />
          <path d="M32 16 Q34 12 38 12" stroke={c} strokeWidth="0.8" fill="none" />
          <path d="M8 20 Q6 24 8 28" stroke={c} strokeWidth="0.8" fill="none" />
          <path d="M12 16 Q16 8 24 12" stroke={c} strokeWidth="0.6" fill={`${c}10`} opacity="0.5" />
          <circle cx="30" cy="14" r="1" fill={c} opacity="0.6" />
        </svg>
      );
    default:
      return null;
  }
}

/* ─── Wisdom Topic Card ─── */
function WisdomTopicCard({
  topic,
  onClick,
}: {
  topic: WisdomTopic;
  onClick: () => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { rootMargin: "60px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <button
      ref={ref}
      onClick={onClick}
      className="group relative text-left cursor-pointer rounded-2xl overflow-hidden
                 border border-warm-border/50 transition-all duration-500
                 hover:border-sepia/25 hover:-translate-y-0.5 hover:shadow-sm
                 active:scale-[0.985] active:duration-100"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(14px)",
        backgroundColor: "var(--color-linen)",
      }}
    >
      {/* Single color touch — a subtle accent stripe along the top */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px] transition-opacity duration-300"
        style={{ backgroundColor: topic.color, opacity: 0.5 }}
      />

      <div className="p-5 sm:p-6 flex items-start gap-4 min-h-[116px]">
        {/* Icon — no tile background, just the glyph in topic color */}
        <TopicIcon
          icon={topic.icon}
          color={topic.color}
          className="w-7 h-7 sm:w-8 sm:h-8 shrink-0 mt-0.5"
        />

        {/* Title + subtitle */}
        <div className="flex-1 min-w-0">
          <h4
            className="text-[15px] sm:text-[16px] text-sepia leading-snug mb-1"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            {topic.title}
          </h4>
          <p
            className="text-[11px] sm:text-[12px] text-sepia/45 leading-relaxed"
            style={{ fontFamily: "var(--font-body)" }}
          >
            {topic.subtitle}
          </p>
        </div>
      </div>
    </button>
  );
}

/* ─── Wisdom Detail Modal ─── */
function WisdomModal({
  topic,
  allPhilosophers,
  onClose,
  onSelectPhilosopher,
}: {
  topic: WisdomTopic;
  allPhilosophers: Philosopher[];
  onClose: () => void;
  onSelectPhilosopher: (p: Philosopher) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scrollY = window.scrollY;
    const body = document.body;
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.overflow = "hidden";
    return () => {
      body.style.position = "";
      body.style.top = "";
      body.style.left = "";
      body.style.right = "";
      body.style.overflow = "";
      window.scrollTo(0, scrollY);
    };
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[100] animate-fade-in">
      <div className="hidden sm:block absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div
        ref={scrollRef}
        className="absolute inset-0 sm:inset-auto sm:top-0 sm:left-0 sm:right-0 sm:bottom-0
                   overflow-y-auto overscroll-contain
                   sm:flex sm:items-start sm:justify-center sm:py-10"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        <div className="hidden sm:block absolute inset-0" onClick={onClose} />

        <div
          className="relative bg-parchment min-h-full sm:min-h-0
                     sm:rounded-2xl sm:max-w-2xl sm:w-full sm:mx-4 sm:overflow-hidden"
          style={{ boxShadow: "0 25px 80px rgba(0,0,0,0.3)" }}
        >
          {/* Mobile close bar */}
          <div className="sm:hidden sticky top-0 z-30 bg-parchment/95 backdrop-blur-sm border-b border-warm-border/30"
            style={{ paddingTop: "env(safe-area-inset-top)" }}>
            <div className="flex items-center justify-between px-3 py-1">
              <button onClick={onClose}
                className="flex items-center gap-1 text-sepia/80 active:text-gold active:scale-95
                           transition-all cursor-pointer min-w-[44px] min-h-[44px] -ml-1 rounded-lg active:bg-warm-border/20">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
                <span className="text-[13px] font-medium" style={{ fontFamily: "var(--font-ui)" }}>Back</span>
              </button>
              <button onClick={onClose}
                className="flex items-center justify-center w-[44px] h-[44px] -mr-1
                           text-sepia-light/40 active:text-sepia active:scale-90
                           transition-all cursor-pointer rounded-lg active:bg-warm-border/20">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>

          {/* Desktop close */}
          <button onClick={onClose}
            className="hidden sm:flex absolute top-4 right-4 z-30 w-9 h-9 items-center justify-center rounded-full bg-warm-border/30 hover:bg-warm-border/60 transition-colors cursor-pointer">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B5D4D" strokeWidth="1.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          {/* Hero banner */}
          <div className="relative overflow-hidden" style={{
            height: "140px",
            background: `linear-gradient(135deg, ${topic.color}12 0%, ${topic.color}06 60%, var(--color-parchment) 100%)`,
          }}>
            <div className="absolute -right-6 -top-6 w-40 h-40 opacity-[0.08]">
              <TopicIcon icon={topic.icon} color={topic.color} className="w-full h-full" />
            </div>
            <div className="absolute inset-0 flex items-center px-6 sm:px-10">
              <div>
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center mb-2"
                  style={{ backgroundColor: `${topic.color}15`, border: `1px solid ${topic.color}25` }}>
                  <TopicIcon icon={topic.icon} color={topic.color} className="w-7 h-7 sm:w-8 sm:h-8" />
                </div>
                <h2 className="text-[22px] sm:text-[26px] text-sepia leading-tight"
                  style={{ fontFamily: "var(--font-heading)" }}>
                  {topic.title}
                </h2>
                <p className="text-[13px] sm:text-[14px] italic mt-1"
                  style={{ fontFamily: "var(--font-body)", color: `${topic.color}90` }}>
                  {topic.subtitle}
                </p>
              </div>
            </div>
          </div>

          {/* Lessons */}
          <div className="px-5 sm:px-10 py-6 sm:py-8">
            <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.2em] text-sepia-light/40 mb-6"
              style={{ fontFamily: "var(--font-ui)" }}>
              {topic.lessons.length} philosophical perspectives
            </p>

            <div className="space-y-6 sm:space-y-8">
              {topic.lessons.map((lesson, i) => {
                const philosopher = allPhilosophers.find(p =>
                  p.name === lesson.thinker || p.name.includes(lesson.thinker.split(" ").pop() || "")
                );
                return (
                  <div key={i} className="relative">
                    {/* Accent line */}
                    <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-full"
                      style={{ background: `linear-gradient(to bottom, ${topic.color}40, ${topic.color}10)` }} />

                    <div className="pl-5 sm:pl-6">
                      {/* Thinker name */}
                      <div className="flex items-center gap-2 mb-2">
                        {philosopher && (
                          <button onClick={() => onSelectPhilosopher(philosopher)}
                            className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer">
                            <div className="w-7 h-7 rounded-full flex items-center justify-center text-[9px]"
                              style={{
                                background: `linear-gradient(135deg, ${topic.color}15, ${topic.color}30)`,
                                fontFamily: "var(--font-heading)",
                                color: `${topic.color}CC`,
                                border: `1px solid ${topic.color}20`,
                              }}>
                              {getInitials(lesson.thinker)}
                            </div>
                            <span className="text-[14px] sm:text-[15px] font-medium"
                              style={{ fontFamily: "var(--font-heading)", color: topic.color }}>
                              {lesson.thinker}
                            </span>
                          </button>
                        )}
                        {!philosopher && (
                          <span className="text-[14px] sm:text-[15px] font-medium"
                            style={{ fontFamily: "var(--font-heading)", color: topic.color }}>
                            {lesson.thinker}
                          </span>
                        )}
                      </div>

                      {/* Insight */}
                      <p className="text-[15px] sm:text-[16px] text-sepia/75 leading-[1.8]"
                        style={{ fontFamily: "var(--font-body)" }}>
                        {lesson.insight}
                      </p>

                      {/* Link to philosopher */}
                      {philosopher && (
                        <button onClick={() => onSelectPhilosopher(philosopher)}
                          className="mt-2 text-[11px] sm:text-[12px] flex items-center gap-1 cursor-pointer hover:gap-2 transition-all duration-200"
                          style={{ fontFamily: "var(--font-ui)", color: `${topic.color}80` }}>
                          Read about {lesson.thinker}
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                            <polyline points="9 6 15 12 9 18" />
                          </svg>
                        </button>
                      )}
                    </div>

                    {/* Divider between lessons */}
                    {i < topic.lessons.length - 1 && (
                      <div className="mt-6 sm:mt-8 flex items-center gap-3">
                        <div className="flex-1 h-px" style={{ background: `linear-gradient(to right, ${topic.color}15, transparent)` }} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Bottom */}
            <div className="mt-8 sm:mt-10 pt-6 border-t border-warm-border/20 text-center">
              <p className="text-[11px] sm:text-[12px] text-sepia-light/40 italic"
                style={{ fontFamily: "var(--font-body)" }}>
                Philosophy is not about having answers — it&apos;s about asking better questions.
              </p>
            </div>

            <div className="h-10 sm:hidden" style={{ paddingBottom: "env(safe-area-inset-bottom)" }} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* Helper: get initials from name */
function getInitials(name: string): string {
  const clean = name.replace(/\(.*\)/, "").trim();
  const words = clean
    .split(" ")
    .filter((w) => !["de", "von", "van", "of", "the"].includes(w.toLowerCase()));
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

/* ─── Philosopher Avatar — classical medallion style ─── */
function PhilosopherAvatar({
  philosopher,
  size = "md",
}: {
  philosopher: Philosopher;
  size?: "sm" | "md" | "lg";
}) {
  const eraColor = ERA_COLORS[philosopher.era] || "#2C2418";
  const initials = getInitials(philosopher.name);
  const dims = { sm: { outer: "w-7 h-7", fs: "10px" }, md: { outer: "w-12 h-12 sm:w-12 sm:h-12", fs: "15px" }, lg: { outer: "w-22 h-22 sm:w-24 sm:h-24", fs: "26px" } };
  const d = dims[size];

  // Prefer the catalog image when available; gracefully fall back to
  // the medallion initials on missing file or load error.
  const [imgFailed, setImgFailed] = useState(false);
  const hasImage = Boolean(philosopher.image) && !imgFailed;

  return (
    <div
      className={`${d.outer} rounded-full flex items-center justify-center shrink-0 select-none relative overflow-hidden`}
      style={{
        background: `radial-gradient(circle at 35% 35%, ${eraColor}18 0%, ${eraColor}30 70%, ${eraColor}40 100%)`,
        boxShadow: `inset 0 1px 3px ${eraColor}15, 0 1px 4px ${eraColor}10`,
        fontFamily: "var(--font-heading)",
        color: eraColor,
        fontSize: d.fs,
        letterSpacing: "0.05em",
        fontWeight: 500,
      }}
    >
      {hasImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={philosopher.image}
          alt={philosopher.name}
          loading="lazy"
          onError={() => setImgFailed(true)}
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}
      {!hasImage && initials}
      {/* Outer ring — medallion edge (drawn above the image so it reads as a framed coin) */}
      <div className="absolute inset-0 rounded-full pointer-events-none" style={{
        border: `1.5px solid ${eraColor}25`,
        boxShadow: `inset 0 0 0 2.5px var(--color-parchment), inset 0 0 0 3.5px ${eraColor}15`,
      }} />
    </div>
  );
}

/* ─── Timeline Card ─── */
function TimelineCard({
  philosopher,
  index,
  onClick,
  isActive,
  isLast,
  eraColor,
}: {
  philosopher: Philosopher;
  index: number;
  onClick: () => void;
  isActive: boolean;
  isLast: boolean;
  eraColor: string;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const [visible, setVisible] = useState(false);
  const [funFactState, setFunFactState] = useState<"idle" | "loading" | "playing">("idle");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "80px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  async function playFunFact(e?: React.MouseEvent) {
    if (e) { e.stopPropagation(); e.preventDefault(); }
    if (!philosopher.fun_fact || funFactState === "loading") return;

    // Stop any currently playing fun fact
    if (activeFunFactAudio) {
      activeFunFactAudio.pause();
      activeFunFactAudio.currentTime = 0;
      activeFunFactAudio = null;
    }

    if (funFactState === "playing") {
      setFunFactState("idle");
      return;
    }

    setFunFactState("loading");
    try {
      const cacheKey = `fun-${philosopher.id}`;
      let blob = funFactCache.get(cacheKey);
      if (!blob) {
        blob = await speakText(
          philosopher.fun_fact,
          "Achernar",
          `Share this fun fact about ${philosopher.name} in a lively, slightly amused, conversational tone — like telling a friend a fascinating tidbit at a dinner party. Keep it warm and engaging.`
        );
        funFactCache.set(cacheKey, blob);
      }
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      activeFunFactAudio = audio;
      audio.onended = () => { setFunFactState("idle"); activeFunFactAudio = null; URL.revokeObjectURL(url); };
      audio.onerror = () => { setFunFactState("idle"); activeFunFactAudio = null; URL.revokeObjectURL(url); };
      await audio.play();
      setFunFactState("playing");
    } catch {
      setFunFactState("idle");
    }
  }

  const influencedCount = philosopher.influenced.length;

  return (
    <button
      ref={ref}
      onClick={onClick}
      className="group relative w-full text-left cursor-pointer transition-all duration-500"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(20px)",
        transitionDelay: `${Math.min(index % 8, 4) * 100}ms`,
      }}
    >
      <div className="flex items-stretch">
        {/* ── Left: year label ── */}
        <div className="relative shrink-0 w-[56px] sm:w-[78px] flex flex-col items-end">
          <div className="flex-1 flex items-center pr-3 sm:pr-4">
            <div className="text-right">
              <p
                className="text-[12px] sm:text-[13px] tabular-nums leading-none font-semibold"
                style={{ fontFamily: "var(--font-ui)", color: `${eraColor}CC` }}
              >
                {philosopher.born}
              </p>
              <p
                className="text-[10px] sm:text-[10px] tabular-nums leading-none text-sepia-light/45 mt-1"
                style={{ fontFamily: "var(--font-ui)" }}
              >
                {philosopher.died}
              </p>
            </div>
          </div>
        </div>

        {/* ── Center: dot ── */}
        <div className="relative shrink-0 w-7 sm:w-8 flex flex-col items-center">
          <div
            className="absolute w-px left-1/2 -translate-x-1/2"
            style={{
              backgroundColor: `${eraColor}45`,
              top: "-1px",
              bottom: isLast ? "50%" : "-1px",
            }}
          />
          <div className="flex-1 flex items-center justify-center relative z-10">
            <div
              className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full border-[2.5px]
                         transition-all duration-300 group-hover:scale-[1.5]"
              style={{
                borderColor: eraColor,
                backgroundColor: isActive ? eraColor : "var(--color-parchment)",
                boxShadow: isActive
                  ? `0 0 0 4px ${eraColor}18, 0 0 12px ${eraColor}15`
                  : `0 0 0 3px var(--color-parchment)`,
              }}
            />
          </div>
        </div>

        {/* ── Right: card with era gradient + illustration ── */}
        <div
          className="flex-1 rounded-xl my-2 sm:my-2.5 ml-2 sm:ml-3 overflow-hidden relative
                     transition-all duration-300
                     group-hover:shadow-lg group-hover:shadow-sepia/[0.08]
                     active:scale-[0.985] active:duration-100"
          style={{
            border: `1px solid ${isActive ? `${eraColor}45` : `${eraColor}18`}`,
            background: `linear-gradient(135deg, var(--color-linen) 60%, ${eraColor}08 100%)`,
          }}
        >
          {/* Era illustration — faded in background */}
          <div className="absolute -right-2 -bottom-2 w-20 h-20 sm:w-24 sm:h-24 opacity-[0.35] group-hover:opacity-[0.5] transition-opacity duration-500 pointer-events-none">
            <EraIllustration eraId={philosopher.era} color={eraColor} className="w-full h-full" />
          </div>

          <div className="flex relative z-10">
            {/* Era accent stripe — gradient */}
            <div className="w-[3px] shrink-0 rounded-l-xl" style={{
              background: `linear-gradient(to bottom, ${eraColor}60, ${eraColor}20)`,
            }} />

            <div className="flex-1 px-3.5 sm:px-5 py-3.5 sm:py-4">
              {/* Name + avatar row */}
              <div className="flex items-center gap-3 sm:gap-3.5">
                <PhilosopherAvatar philosopher={philosopher} />
                <div className="flex-1 min-w-0">
                  <h3
                    className="text-[16px] sm:text-[18px] text-sepia leading-snug"
                    style={{ fontFamily: "var(--font-heading)" }}
                  >
                    {philosopher.name}
                  </h3>
                  <p
                    className="text-[11px] sm:text-[12px] mt-0.5 font-medium"
                    style={{ fontFamily: "var(--font-ui)", color: `${eraColor}AA` }}
                  >
                    {philosopher.school}
                  </p>
                </div>
                {/* Fun fact sound button — golden beacon */}
                {philosopher.fun_fact && (
                  <div
                    role="button"
                    tabIndex={-1}
                    onClick={playFunFact}
                    className={`shrink-0 w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center
                               cursor-pointer transition-transform duration-200
                               active:scale-90 hover:scale-105 select-none
                               ${funFactState === "idle" ? "gold-beacon" : ""}`}
                    style={{
                      background: funFactState === "playing"
                        ? "linear-gradient(135deg, #D4B85A 0%, #A67C1A 100%)"
                        : "linear-gradient(135deg, #E6C86E 0%, #B8861A 100%)",
                      color: "#FFF8E7",
                      WebkitTapHighlightColor: "transparent",
                      touchAction: "manipulation",
                    }}
                    aria-label={`Fun fact about ${philosopher.name}`}
                  >
                    {funFactState === "loading" ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" className="animate-spin">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" fill="none" strokeDasharray="31.4" strokeDashoffset="10" strokeLinecap="round" />
                      </svg>
                    ) : funFactState === "playing" ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M4 12h4l3-9v18l-3-9H4z" fill="currentColor" stroke="none" />
                        <path d="M15 8a4 4 0 010 8" /><path d="M18 5a8 8 0 010 14" />
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M4 12h4l3-9v18l-3-9H4z" fill="currentColor" stroke="none" />
                        <path d="M15 8a4 4 0 010 8" />
                      </svg>
                    )}
                  </div>
                )}
              </div>

              {/* Quote — the heart of each card */}
              <div className="mt-3 relative pl-4 sm:pl-5">
                <span className="absolute left-0 -top-0.5 text-[24px] sm:text-[28px] leading-none select-none"
                  style={{ fontFamily: "Georgia, serif", color: `${eraColor}35` }}>&ldquo;</span>
                <p
                  className="text-[13px] sm:text-[13.5px] text-sepia/65 leading-[1.7] italic line-clamp-2"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  {philosopher.famous_quote}
                </p>
              </div>

              {/* Key ideas + influence count */}
              <div className="flex items-center justify-between mt-3 gap-2">
                <div className="flex flex-wrap gap-1.5 flex-1 min-w-0">
                  {philosopher.key_ideas.slice(0, 2).map((idea) => (
                    <span
                      key={idea}
                      className="px-2.5 py-0.5 text-[10px] sm:text-[10px] rounded-full truncate"
                      style={{
                        fontFamily: "var(--font-ui)",
                        border: `1px solid ${eraColor}25`,
                        backgroundColor: `${eraColor}08`,
                        color: `${eraColor}CC`,
                      }}
                    >
                      {idea}
                    </span>
                  ))}
                </div>
                {influencedCount > 0 && (
                  <span className="shrink-0 text-[9px] sm:text-[10px] flex items-center gap-1"
                    style={{ fontFamily: "var(--font-ui)", color: `${eraColor}60` }}>
                    <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor" opacity="0.6">
                      <circle cx="5" cy="8" r="2.5" /><circle cx="11" cy="8" r="2.5" />
                      <path d="M7.5 8 L8.5 8" stroke="currentColor" strokeWidth="1" />
                    </svg>
                    {influencedCount}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}

/* ─── Era Section Header — banner-style with period pill ─── */
function EraHeader({ era, isFirst }: { era: Era; isFirst: boolean }) {
  const symbol = ERA_SYMBOLS[era.id] || "◆";

  return (
    <div className={`relative ${isFirst ? "" : "mt-12 sm:mt-16"}`}>
      {/* Horizontal era divider — ornamental, only between eras */}
      {!isFirst && (
        <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8 px-1">
          <div className="flex-1 h-px" style={{ background: `linear-gradient(to right, transparent, ${era.color}30, transparent)` }} />
          <span className="text-[10px] select-none" style={{ color: `${era.color}55`, fontFamily: "Georgia, serif" }}>{symbol}</span>
          <div className="flex-1 h-px" style={{ background: `linear-gradient(to right, transparent, ${era.color}30, transparent)` }} />
        </div>
      )}

      <div className="flex items-stretch">
        {/* Left: era illustration — width matches TimelineCard year column so dots align */}
        <div className="relative shrink-0 w-[56px] sm:w-[78px] flex items-center justify-end pr-3 sm:pr-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 opacity-80">
            <EraIllustration eraId={era.id} color={era.color} className="w-full h-full" />
          </div>
        </div>

        {/* Center: continuous line + Ω dot — width matches TimelineCard dot column */}
        <div className="relative shrink-0 w-7 sm:w-8 flex flex-col items-center">
          {/* Single continuous line — passes behind the dot; the dot's parchment halo masks it */}
          <div
            className="absolute w-px left-1/2 -translate-x-1/2 z-0"
            style={{
              backgroundColor: `${era.color}45`,
              top: isFirst ? "50%" : "-1px",
              bottom: "-1px",
            }}
          />
          {/* Flex-1 spacer pushes the dot to vertical center of banner */}
          <div className="flex-1" />
          <div
            className="relative z-10 w-6 h-6 sm:w-7 sm:h-7 rounded-full shrink-0 flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${era.color}, ${era.color}CC)`,
              boxShadow: `0 0 0 3px var(--color-parchment), 0 0 0 5px ${era.color}22, 0 2px 18px ${era.color}35`,
            }}
          >
            <span className="text-white/90 text-[10px] sm:text-[11px] font-bold select-none"
              style={{ fontFamily: "Georgia, serif" }}>{symbol}</span>
          </div>
          <div className="flex-1" />
        </div>

        {/* Right: banner with era name, period pill, description */}
        <div className="flex-1 ml-2.5 sm:ml-3 my-2 sm:my-2.5">
          <div
            className="rounded-xl px-4 sm:px-5 py-3.5 sm:py-4 relative overflow-hidden"
            style={{
              background: `linear-gradient(135deg, var(--color-linen) 0%, ${era.color}10 100%)`,
              border: `1px solid ${era.color}22`,
            }}
          >
            {/* Faint corner glyph */}
            <span
              className="absolute -right-2 -bottom-3 text-[72px] select-none pointer-events-none leading-none"
              style={{ color: `${era.color}08`, fontFamily: "Georgia, serif" }}
              aria-hidden="true"
            >
              {symbol}
            </span>

            <div className="relative flex items-baseline gap-2.5 flex-wrap">
              <h3
                className="text-[22px] sm:text-[26px] leading-tight tracking-tight"
                style={{ fontFamily: "var(--font-heading)", fontWeight: 500, color: era.color }}
              >
                {era.name}
              </h3>
              <span
                className="px-2.5 py-0.5 text-[9px] sm:text-[10px] uppercase tracking-[0.14em] rounded-full font-semibold whitespace-nowrap tabular-nums"
                style={{
                  fontFamily: "var(--font-ui)",
                  color: era.color,
                  backgroundColor: `${era.color}14`,
                  border: `1px solid ${era.color}30`,
                }}
              >
                {era.period}
              </span>
            </div>
            <p
              className="relative mt-2 text-[12px] sm:text-[13px] leading-relaxed text-sepia-light/65 max-w-md"
              style={{ fontFamily: "var(--font-body)" }}
            >
              {era.description}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Article Reader ─── */
function ArticleModal({
  philosopher,
  allPhilosophers,
  onClose,
  onSelect,
}: {
  philosopher: Philosopher;
  allPhilosophers: Philosopher[];
  onClose: () => void;
  onSelect: (p: Philosopher) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);
  const eraColor = ERA_COLORS[philosopher.era] || "#2C2418";

  /* ── TTS state ── */
  const [ttsState, setTtsState] = useState<"idle" | "loading" | "playing" | "paused">("idle");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const blobUrlRef = useRef<string | null>(null);
  const prefetchRef = useRef<Promise<Blob> | null>(null);

  /* Truncate article text for TTS */
  function getTtsText() {
    const maxLen = 1200;
    let text = philosopher.article;
    if (text.length > maxLen) {
      const cut = text.lastIndexOf("\n\n", maxLen);
      text = cut > 400 ? text.slice(0, cut) : text.slice(0, maxLen);
    }
    return text;
  }

  /* Prefetch TTS audio when modal opens — silently in the background */
  useEffect(() => {
    const cacheKey = `philosopher-${philosopher.id}`;
    if (ttsCache.has(cacheKey)) return;
    const text = getTtsText();
    const promise = speakText(
      text,
      "Achernar",
      `Read this biographical essay about the philosopher ${philosopher.name} aloud with a thoughtful, engaging, and warm narration style. Speak at a measured pace.`
    ).then((blob) => {
      ttsCache.set(cacheKey, blob);
      return blob;
    }).catch(() => null as unknown as Blob);
    prefetchRef.current = promise;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [philosopher.id]);

  function handleTtsToggle() {
    if (ttsState === "playing" && audioRef.current) {
      audioRef.current.pause();
      setTtsState("paused");
      return;
    }
    if (ttsState === "paused" && audioRef.current) {
      audioRef.current.play();
      setTtsState("playing");
      return;
    }
    if (ttsState === "loading") return;
    playArticle();
  }

  function handleTtsStop() {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setTtsState("idle");
  }

  async function playArticle() {
    setTtsState("loading");
    try {
      const cacheKey = `philosopher-${philosopher.id}`;
      let blob = ttsCache.get(cacheKey);
      if (!blob) {
        // Wait for prefetch if in progress, otherwise fetch now
        if (prefetchRef.current) {
          blob = await prefetchRef.current;
        }
        if (!blob) {
          blob = await speakText(
            getTtsText(),
            "Achernar",
            `Read this biographical essay about the philosopher ${philosopher.name} aloud with a thoughtful, engaging, and warm narration style. Speak at a measured pace.`
          );
          ttsCache.set(cacheKey, blob);
        }
      }

      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
      const url = URL.createObjectURL(blob);
      blobUrlRef.current = url;

      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => setTtsState("idle");
      audio.onerror = () => setTtsState("idle");

      await audio.play();
      setTtsState("playing");
    } catch {
      setTtsState("idle");
    }
  }

  // Stop TTS when philosopher changes or modal closes
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
    };
  }, [philosopher.id]);

  useEffect(() => {
    const scrollY = window.scrollY;
    const body = document.body;
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.overflow = "hidden";
    return () => {
      body.style.position = "";
      body.style.top = "";
      body.style.left = "";
      body.style.right = "";
      body.style.overflow = "";
      window.scrollTo(0, scrollY);
    };
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    function onScroll() {
      setScrolled((el?.scrollTop ?? 0) > 200);
    }
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    handleTtsStop();
    scrollRef.current?.scrollTo(0, 0);
    setScrolled(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [philosopher.id]);

  const paragraphs = philosopher.article.split("\n\n");
  const [firstParagraph, ...restParagraphs] = paragraphs;

  const influences = philosopher.influenced_by
    .map((id) => allPhilosophers.find((p) => p.id === id))
    .filter(Boolean) as Philosopher[];

  const influenced = philosopher.influenced
    .map((id) => allPhilosophers.find((p) => p.id === id))
    .filter(Boolean) as Philosopher[];

  return (
    <div className="fixed inset-0 z-[100] animate-fade-in">
      <div className="hidden sm:block absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div
        ref={scrollRef}
        className="absolute inset-0 sm:inset-auto sm:top-0 sm:left-0 sm:right-0 sm:bottom-0
                   overflow-y-auto overscroll-contain
                   sm:flex sm:items-start sm:justify-center sm:py-10"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        <div className="hidden sm:block absolute inset-0" onClick={onClose} />

        <div
          className="relative bg-parchment min-h-full sm:min-h-0
                     sm:rounded-2xl sm:max-w-2xl sm:w-full sm:mx-4 sm:overflow-hidden"
          style={{ boxShadow: "0 25px 80px rgba(0,0,0,0.3), 0 4px 16px rgba(0,0,0,0.15)" }}
        >
          {/* Sticky close bar — mobile: always visible */}
          <div
            className="sm:hidden sticky top-0 z-30 bg-parchment/95 backdrop-blur-sm border-b border-warm-border/30"
            style={{ paddingTop: "env(safe-area-inset-top)" }}
          >
            <div className="flex items-center justify-between px-3 py-1">
              <button onClick={onClose}
                className="flex items-center gap-1 text-sepia/80 active:text-gold active:scale-95
                           transition-all cursor-pointer min-w-[44px] min-h-[44px] -ml-1
                           rounded-lg active:bg-warm-border/20">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
                <span className="text-[13px] font-medium" style={{ fontFamily: "var(--font-ui)" }}>Back</span>
              </button>
              <p className={`text-[12px] text-sepia/70 truncate max-w-[50%] transition-opacity duration-300 ${scrolled ? "opacity-100" : "opacity-0"}`}
                style={{ fontFamily: "var(--font-heading)" }}>
                {philosopher.name}
              </p>
              {/* Extra close X on the right for discoverability */}
              <button onClick={onClose}
                className="flex items-center justify-center w-[44px] h-[44px] -mr-1
                           text-sepia-light/40 active:text-sepia active:scale-90
                           transition-all cursor-pointer rounded-lg active:bg-warm-border/20">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>

          {/* Desktop close */}
          <button onClick={onClose}
            className="hidden sm:flex absolute top-4 right-4 z-30 w-9 h-9 items-center justify-center rounded-full bg-warm-border/30 hover:bg-warm-border/60 transition-colors duration-200 cursor-pointer">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B5D4D" strokeWidth="1.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          {/* Era accent bar */}
          <div className="hidden sm:block h-[2px]"
            style={{ background: `linear-gradient(to right, transparent 10%, ${eraColor} 30%, ${eraColor}CC 50%, ${eraColor} 70%, transparent 90%)` }} />

          {/* Hero */}
          <div className="relative overflow-hidden sm:mt-0"
            style={{
              height: "190px",
              background: `linear-gradient(135deg, ${eraColor}15 0%, ${eraColor}08 40%, var(--color-parchment) 100%)`,
            }}>
            <div className="absolute inset-0 opacity-[0.04]"
              style={{ backgroundImage: `radial-gradient(circle, ${eraColor} 1px, transparent 1px)`, backgroundSize: "24px 24px" }} />
            <div className="absolute inset-0 flex items-center justify-center">
              <PhilosopherAvatar philosopher={philosopher} size="lg" />
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-20"
              style={{ background: "linear-gradient(to top, var(--color-parchment), transparent)" }} />
            <div className="absolute top-3 sm:top-4 left-4">
              <span className="px-2.5 py-1 text-[10px] sm:text-[10px] uppercase tracking-[0.15em] text-white/90 rounded-full"
                style={{ fontFamily: "var(--font-ui)", backgroundColor: `${eraColor}CC` }}>
                {ERA_LABELS[philosopher.era]}
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="px-5 sm:px-10 -mt-8 relative z-10 pb-10">
            <div className="mb-7 sm:mb-8">
              <span className="text-[10px] sm:text-[10px] uppercase tracking-[0.2em] text-sepia-light/55"
                style={{ fontFamily: "var(--font-ui)" }}>
                {philosopher.nationality} · {philosopher.born}–{philosopher.died}
              </span>
              <h2 className="text-[26px] sm:text-3xl text-sepia mt-1.5 leading-[1.15]"
                style={{ fontFamily: "var(--font-heading)" }}>
                {philosopher.name}
              </h2>
              <p className="text-[15px] sm:text-lg italic mt-1.5"
                style={{ fontFamily: "var(--font-body)", color: `${eraColor}B0` }}>
                {philosopher.article_title}
              </p>
              <p className="text-[12px] sm:text-xs text-sepia-light/55 mt-1"
                style={{ fontFamily: "var(--font-ui)" }}>
                {philosopher.school}
              </p>

              {/* Voice controls */}
              <div className="flex items-center gap-2 mt-4">
                <button
                  onClick={handleTtsToggle}
                  disabled={ttsState === "loading"}
                  className={`flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-full
                             border transition-all duration-300 cursor-pointer
                             ${ttsState === "playing" || ttsState === "paused"
                               ? "bg-gold/10 border-gold text-gold"
                               : "bg-transparent border-warm-border/50 text-sepia-light/50 hover:text-gold hover:border-gold/50"
                             }
                             ${ttsState === "loading" ? "opacity-50 cursor-wait" : "active:scale-90"}`}
                  aria-label={ttsState === "playing" ? "Pause" : ttsState === "paused" ? "Resume" : "Read aloud"}
                >
                  {ttsState === "loading" ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" className="animate-spin">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" strokeDasharray="31.4" strokeDashoffset="10" strokeLinecap="round" />
                    </svg>
                  ) : ttsState === "playing" ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <rect x="6" y="5" width="4" height="14" rx="1" />
                      <rect x="14" y="5" width="4" height="14" rx="1" />
                    </svg>
                  ) : ttsState === "paused" ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="6 3 20 12 6 21 6 3" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" stroke="none" />
                      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                    </svg>
                  )}
                </button>

                {/* Stop button — only when playing or paused */}
                {(ttsState === "playing" || ttsState === "paused") && (
                  <button
                    onClick={handleTtsStop}
                    className="flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-full
                              border border-warm-border/50 text-sepia-light/50 hover:text-red-400 hover:border-red-400/50
                              transition-all duration-300 cursor-pointer active:scale-90"
                    aria-label="Stop"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <rect x="5" y="5" width="14" height="14" rx="2" />
                    </svg>
                  </button>
                )}

                {ttsState === "idle" && (
                  <span className="text-[10px] text-sepia-light/35" style={{ fontFamily: "var(--font-ui)" }}>
                    Listen to article
                  </span>
                )}
                {ttsState === "loading" && (
                  <span className="text-[10px] text-gold/60" style={{ fontFamily: "var(--font-ui)" }}>
                    Preparing narration...
                  </span>
                )}
              </div>
            </div>

            {/* Famous quote */}
            <div className="relative mb-8 pl-5 sm:pl-6 py-1" style={{ borderLeft: `2px solid ${eraColor}40` }}>
              <p className="text-sepia/65 text-[15px] sm:text-base leading-[1.85] italic"
                style={{ fontFamily: "var(--font-quote, var(--font-body))" }}>
                &ldquo;{philosopher.famous_quote}&rdquo;
              </p>
            </div>

            {/* Key ideas */}
            <div className="flex flex-wrap gap-2 mb-7 sm:mb-8">
              {philosopher.key_ideas.map((idea) => (
                <span key={idea}
                  className="px-2.5 py-1 text-[10px] sm:text-[11px] rounded-full border text-sepia/60"
                  style={{ fontFamily: "var(--font-ui)", borderColor: `${eraColor}30`, backgroundColor: `${eraColor}06` }}>
                  {idea}
                </span>
              ))}
            </div>

            <div className="dot-divider mb-7 sm:mb-8"><span /><span /><span /><span /><span /></div>

            {/* Article */}
            <div className="space-y-5">
              {firstParagraph && (
                <p className="text-sepia/85 text-[16px] sm:text-[15px] leading-[1.85]
                             first-letter:text-[3.2em] first-letter:font-bold first-letter:float-left
                             first-letter:mr-2 first-letter:mt-1 first-letter:leading-[0.8] first-letter:text-sepia"
                  style={{ fontFamily: "var(--font-body)" }}>
                  {firstParagraph}
                </p>
              )}
              {restParagraphs.map((p, i) => (
                <p key={i} className="text-sepia/80 text-[16px] sm:text-[15px] leading-[1.85]"
                  style={{ fontFamily: "var(--font-body)" }}>
                  {p}
                </p>
              ))}
            </div>

            {/* Pull quote */}
            <div className="my-8 sm:my-10 pl-5 sm:pl-6 py-2" style={{ borderLeft: `2px solid ${eraColor}25` }}>
              <p className="text-sepia/50 text-[14px] sm:text-[15px] leading-[1.85] italic"
                style={{ fontFamily: "var(--font-body)" }}>
                &ldquo;{philosopher.pull_quote}&rdquo;
              </p>
            </div>

            {/* Footer */}
            <div className="mt-10 pt-6 border-t border-warm-border/30">
              <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] text-sepia-light/50 mb-3"
                style={{ fontFamily: "var(--font-ui)" }}>Notable Works</p>
              <div className="flex flex-wrap gap-2 mb-6">
                {philosopher.key_works.map((work) => (
                  <span key={work}
                    className="px-3 py-1.5 text-[11px] text-sepia/60 border border-warm-border/50 rounded-full"
                    style={{ fontFamily: "var(--font-ui)" }}>
                    {work}
                  </span>
                ))}
              </div>

              <div className="mb-6">
                <span className="px-3 py-1.5 text-[9px] sm:text-[10px] uppercase tracking-widest rounded-full border"
                  style={{ fontFamily: "var(--font-ui)", color: `${eraColor}90`, borderColor: `${eraColor}35` }}>
                  {philosopher.school}
                </span>
              </div>

              {/* Lineage */}
              {(influences.length > 0 || influenced.length > 0) && (
                <div className="pt-5 border-t border-warm-border/20">
                  <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] text-sepia-light/50 mb-4"
                    style={{ fontFamily: "var(--font-ui)" }}>Intellectual Lineage</p>

                  {influences.length > 0 && (
                    <div className="mb-4">
                      <p className="text-[10px] text-sepia-light/40 mb-2" style={{ fontFamily: "var(--font-ui)" }}>Built upon</p>
                      <div className="flex flex-wrap gap-2">
                        {influences.map((p) => (
                          <button key={p.id} onClick={() => onSelect(p)}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-warm-border/40 bg-linen/50 hover:border-gold/30 hover:bg-highlight/50 transition-colors duration-200 cursor-pointer">
                            <PhilosopherAvatar philosopher={p} size="sm" />
                            <span className="text-[11px] text-sepia/70" style={{ fontFamily: "var(--font-ui)" }}>{p.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {influenced.length > 0 && (
                    <div>
                      <p className="text-[10px] text-sepia-light/40 mb-2" style={{ fontFamily: "var(--font-ui)" }}>Shaped the thought of</p>
                      <div className="flex flex-wrap gap-2">
                        {influenced.map((p) => (
                          <button key={p.id} onClick={() => onSelect(p)}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-warm-border/40 bg-linen/50 hover:border-gold/30 hover:bg-highlight/50 transition-colors duration-200 cursor-pointer">
                            <PhilosopherAvatar philosopher={p} size="sm" />
                            <span className="text-[11px] text-sepia/70" style={{ fontFamily: "var(--font-ui)" }}>{p.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="h-10 sm:hidden" style={{ paddingBottom: "env(safe-area-inset-bottom)" }} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Ask Them — consult 1–3 philosophers about a real question ─── */
const ASK_SUGGESTED_QUESTIONS = [
  "I'm thinking of quitting a stable job to pursue art. Is that foolish?",
  "Why do I feel empty even when everything is going well?",
  "A close friend betrayed me. How should I respond?",
  "Does my life have meaning if no one will remember me?",
  "How do I know when to let go of something I care about?",
];

function AskThemView({
  philosophers,
  onSelectPhilosopher,
}: {
  philosophers: Philosopher[];
  onSelectPhilosopher: (p: Philosopher) => void;
}) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [responses, setResponses] = useState<ConsultResponseItem[] | null>(null);

  const MAX_SELECT = 3;

  const selectedPhilosophers = selectedIds
    .map((id) => philosophers.find((p) => p.id === id))
    .filter((p): p is Philosopher => Boolean(p));

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((curr) => {
      if (curr.includes(id)) return curr.filter((x) => x !== id);
      if (curr.length >= MAX_SELECT) return [...curr.slice(1), id]; // FIFO replace
      return [...curr, id];
    });
  }, []);

  async function handleAsk() {
    if (!question.trim() || selectedPhilosophers.length === 0 || loading) return;
    setLoading(true);
    setError(null);
    setResponses(null);
    try {
      const profiles = selectedPhilosophers.map((p) => ({
        id: p.id,
        name: p.name,
        school: p.school,
        key_ideas: p.key_ideas,
        famous_quote: p.famous_quote,
        pull_quote: p.pull_quote,
        // Backend caps at ~1400 chars; send a generous slice so it has
        // enough of the thinker's own text to ground the reply.
        article_excerpt: (p.article || "").slice(0, 1500),
      }));
      const res = await consultPhilosophers(question.trim(), profiles);
      if (res.error) {
        setError(res.error);
      } else if (!res.responses || res.responses.length === 0) {
        setError("The thinkers had nothing to say. Please try again.");
      } else {
        setResponses(res.responses);
        // Scroll answers into view on mobile
        setTimeout(() => {
          document
            .getElementById("ask-responses")
            ?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 100);
      }
    } catch {
      setError("Something went wrong. Please try again in a moment.");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setResponses(null);
    setError(null);
    setQuestion("");
  }

  const canSubmit =
    question.trim().length > 0 && selectedPhilosophers.length > 0 && !loading;

  function lastName(fullName: string): string {
    const clean = fullName.replace(/\(.*\)/, "").trim();
    const parts = clean.split(/\s+/);
    return parts[parts.length - 1];
  }

  return (
    <div className="animate-fade-in">
      {/* Intro copy */}
      <div className="text-center mb-6 sm:mb-8">
        <p
          className="text-[12px] sm:text-[13px] text-sepia/45 italic max-w-md mx-auto leading-relaxed px-4 sm:px-0"
          style={{ fontFamily: "var(--font-body)" }}
        >
          Select up to three thinkers. Ask them anything. They will answer in
          character, grounded in what they actually believed.
        </p>
      </div>

      {/* Selected chips */}
      <div className="min-h-[28px] mb-4 flex flex-wrap justify-center gap-2">
        {selectedPhilosophers.length === 0 ? (
          <span
            className="text-[10px] sm:text-[11px] uppercase tracking-[0.25em] text-sepia-light/35"
            style={{ fontFamily: "var(--font-ui)" }}
          >
            No one selected yet
          </span>
        ) : (
          selectedPhilosophers.map((p) => {
            const color = ERA_COLORS[p.era] || "#2C2418";
            return (
              <button
                key={p.id}
                onClick={() => toggleSelect(p.id)}
                className="flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] sm:text-[12px] transition-all cursor-pointer hover:opacity-80"
                style={{
                  borderColor: `${color}55`,
                  backgroundColor: `${color}12`,
                  color: color,
                  fontFamily: "var(--font-ui)",
                }}
              >
                {p.name.replace(/\(.*\)/, "").trim()}
                <span className="opacity-60 text-[13px] leading-none">×</span>
              </button>
            );
          })
        )}
      </div>

      {/* Philosopher grid */}
      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 sm:gap-3 mb-8">
        {philosophers.map((p) => {
          const isSelected = selectedIds.includes(p.id);
          const color = ERA_COLORS[p.era] || "#2C2418";
          return (
            <button
              key={p.id}
              onClick={() => toggleSelect(p.id)}
              aria-pressed={isSelected}
              className={`flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all duration-200 cursor-pointer
                ${
                  isSelected
                    ? "shadow-sm scale-[1.03]"
                    : "opacity-80 hover:opacity-100 hover:scale-[1.01]"
                }`}
              style={{
                backgroundColor: isSelected ? `${color}14` : "transparent",
                border: isSelected
                  ? `1px solid ${color}55`
                  : "1px solid transparent",
              }}
            >
              <PhilosopherAvatar philosopher={p} size="md" />
              <span
                className="text-[9px] sm:text-[10px] text-sepia/70 leading-tight text-center truncate w-full"
                style={{ fontFamily: "var(--font-ui)" }}
              >
                {lastName(p.name)}
              </span>
            </button>
          );
        })}
      </div>

      {/* Question input */}
      <div className="mb-4">
        <label
          htmlFor="ask-question"
          className="block text-[10px] sm:text-[11px] uppercase tracking-[0.25em] text-sepia-light/50 mb-2"
          style={{ fontFamily: "var(--font-ui)" }}
        >
          Your question
        </label>
        <textarea
          id="ask-question"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="What's on your mind?"
          rows={3}
          maxLength={500}
          className="w-full rounded-lg border border-warm-border/60 p-3 text-[14px] text-sepia placeholder-sepia/30 focus:border-sepia/40 focus:outline-none transition-colors resize-none"
          style={{
            fontFamily: "var(--font-body)",
            backgroundColor: "var(--color-linen)",
          }}
        />
      </div>

      {/* Suggested questions */}
      {!question && (
        <div className="mb-6">
          <p
            className="text-[10px] text-sepia-light/40 uppercase tracking-[0.25em] mb-2"
            style={{ fontFamily: "var(--font-ui)" }}
          >
            Or try one of these
          </p>
          <div className="flex flex-wrap gap-2">
            {ASK_SUGGESTED_QUESTIONS.map((q) => (
              <button
                key={q}
                onClick={() => setQuestion(q)}
                className="text-left text-[11px] sm:text-[12px] px-3 py-1.5 rounded-full border border-warm-border/50 text-sepia/60 hover:text-sepia hover:border-sepia/30 transition-all cursor-pointer"
                style={{ fontFamily: "var(--font-body)" }}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Submit */}
      <div className="flex justify-center mb-10">
        <button
          onClick={handleAsk}
          disabled={!canSubmit}
          className="px-6 py-2.5 rounded-full bg-sepia text-parchment text-[12px] sm:text-[13px] shadow-sm disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer hover:bg-sepia/90 transition-all"
          style={{ fontFamily: "var(--font-ui)" }}
        >
          {loading
            ? "Asking the thinkers…"
            : selectedPhilosophers.length === 0
              ? "Select a thinker first"
              : `Ask ${selectedPhilosophers.length} ${
                  selectedPhilosophers.length === 1 ? "thinker" : "thinkers"
                }`}
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center py-8">
          <div className="flex gap-2 mb-3">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="w-2 h-2 rounded-full bg-sepia/40"
                style={{
                  animation: `pulse 1.4s ease-in-out ${i * 0.25}s infinite`,
                }}
              />
            ))}
          </div>
          <p
            className="text-[11px] text-sepia-light/50 italic"
            style={{ fontFamily: "var(--font-body)" }}
          >
            The thinkers are considering your question…
          </p>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div
          className="text-center py-6 text-[13px] text-sepia/70 italic"
          style={{ fontFamily: "var(--font-body)" }}
        >
          {error}
        </div>
      )}

      {/* Responses */}
      {responses && !loading && (
        <div id="ask-responses" className="space-y-4 mt-2">
          <div className="text-center mb-4">
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="w-10 sm:w-14 h-px bg-sepia/15" />
              <span
                className="text-sepia/25 text-[10px]"
                style={{ fontFamily: "Georgia, serif" }}
              >
                ✦
              </span>
              <div className="w-10 sm:w-14 h-px bg-sepia/15" />
            </div>
            <p
              className="text-[11px] text-sepia-light/50 italic"
              style={{ fontFamily: "var(--font-body)" }}
            >
              They have considered your question
            </p>
          </div>

          {responses.map((r) => {
            const p = philosophers.find((x) => x.id === r.id);
            const color = p ? ERA_COLORS[p.era] || "#2C2418" : "#2C2418";
            return (
              <div
                key={r.id}
                className="rounded-lg border border-warm-border/50 p-4 sm:p-5 animate-fade-in"
                style={{ backgroundColor: "var(--color-linen)" }}
              >
                <div className="flex items-start gap-3 mb-3">
                  {p && <PhilosopherAvatar philosopher={p} size="sm" />}
                  <div className="flex-1 min-w-0">
                    <h3
                      className="text-[14px] sm:text-[15px] text-sepia leading-tight"
                      style={{ fontFamily: "var(--font-heading)" }}
                    >
                      {r.name}
                    </h3>
                    {p && (
                      <p
                        className="text-[10px] sm:text-[11px] text-sepia-light/55 mt-0.5"
                        style={{ fontFamily: "var(--font-ui)" }}
                      >
                        {p.school}
                      </p>
                    )}
                  </div>
                  {p && (
                    <button
                      onClick={() => onSelectPhilosopher(p)}
                      className="shrink-0 text-[10px] sm:text-[11px] text-sepia-light/60 hover:text-sepia underline underline-offset-4 cursor-pointer"
                      style={{ fontFamily: "var(--font-ui)" }}
                    >
                      Read bio →
                    </button>
                  )}
                </div>
                <p
                  className="text-[14px] sm:text-[15px] text-sepia/85 leading-relaxed pl-4"
                  style={{
                    fontFamily: "var(--font-body)",
                    borderLeft: `2px solid ${color}45`,
                  }}
                >
                  {r.response}
                </p>
              </div>
            );
          })}

          <div className="text-center pt-6">
            <button
              onClick={reset}
              className="text-[12px] sm:text-[13px] px-5 py-2 rounded-full border border-warm-border/60 text-sepia-light/70 hover:text-sepia hover:border-sepia/30 transition-all cursor-pointer"
              style={{ fontFamily: "var(--font-ui)" }}
            >
              Ask another question
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   Schools of Thought — stream graph
   A smooth, silhouette stream graph showing how many living thinkers of
   each philosophical tradition existed at every moment over 2,600 years.
   ────────────────────────────────────────────────────────────────────────── */

interface Tradition {
  id: string;
  name: string;
  color: string;
}

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

const PHILOSOPHER_TRADITION: Record<string, string> = {
  socrates: "classical", plato: "classical", aristotle: "classical",
  epicurus: "hellenistic", "marcus-aurelius": "hellenistic",
  augustine: "scholastic", "ibn-sina": "scholastic", aquinas: "scholastic",
  descartes: "rationalism", spinoza: "rationalism",
  hume: "empiricism",
  kant: "idealism", hegel: "idealism", schopenhauer: "idealism",
  kierkegaard: "existentialism", nietzsche: "existentialism",
  husserl: "existentialism", heidegger: "existentialism",
  sartre: "existentialism", beauvoir: "existentialism",
  marx: "political", arendt: "political",
};

const STREAM_ERA_BOUNDS: { id: string; start: number; end: number; label: string }[] = [
  { id: "ancient",      start: -600, end:  300, label: "Ancient"      },
  { id: "medieval",     start:  300, end: 1500, label: "Medieval"     },
  { id: "early-modern", start: 1500, end: 1750, label: "Early Modern" },
  { id: "modern",       start: 1750, end: 1900, label: "Modern"       },
  { id: "contemporary", start: 1900, end: 2020, label: "Contemporary" },
];

function SchoolsStreamGraph({
  philosophers,
  eraFilter,
}: {
  philosophers: Philosopher[];
  eraFilter: string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(0);
  const [hoverT, setHoverT] = useState<number | null>(null);
  const [hoveredTradition, setHoveredTradition] = useState<string | null>(null);
  const [pinnedTradition, setPinnedTradition] = useState<string | null>(null);

  /* ── Responsive width ── */
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setWidth(el.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /* ── Time binning ── */
  const START = -600;
  const END = 2020;
  const STEP = 10;
  const T = Math.floor((END - START) / STEP) + 1;
  const decades: number[] = [];
  for (let i = 0; i < T; i++) decades.push(START + i * STEP);

  /* ── Raw count matrix [tradition][decade] ── */
  const raw: number[][] = TRADITIONS.map(() => new Array(T).fill(0));
  for (const p of philosophers) {
    const tid = PHILOSOPHER_TRADITION[p.id];
    if (!tid) continue;
    const ti = TRADITIONS.findIndex((t) => t.id === tid);
    if (ti < 0) continue;
    for (let t = 0; t < T; t++) {
      const y = decades[t];
      if (p.born_year <= y + STEP && p.died_year >= y) raw[ti][t] += 1;
    }
  }

  /* ── Triangular-kernel smoothing (~140 yr window) ── */
  const smooth = (vs: number[], r: number): number[] => {
    const out = new Array(vs.length).fill(0);
    for (let i = 0; i < vs.length; i++) {
      let s = 0, w = 0;
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
  const smoothed = raw.map((r) => smooth(r, 7));

  /* ── Layout ── */
  const H = 224;
  const padTop = 30, padBot = 52, padLeft = 14, padRight = 14;
  const innerH = H - padTop - padBot;
  const innerW = Math.max(120, width - padLeft - padRight);

  /* ── Stack math (silhouette: center on 0) ── */
  const totals = new Array(T).fill(0);
  for (let t = 0; t < T; t++)
    for (let i = 0; i < TRADITIONS.length; i++) totals[t] += smoothed[i][t];
  const maxTotal = Math.max(0.001, ...totals);

  const xScale = (t: number) => padLeft + (t / (T - 1)) * innerW;
  const yScale = (v: number) =>
    padTop + innerH * 0.5 + (v / maxTotal) * innerH * 0.9;

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

  /* ── Catmull-Rom → cubic Bezier for silk-smooth rivers ── */
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

  const bandPath = (band: { t: number; top: number; bot: number }[]): string => {
    const topPts: [number, number][] = band.map((b) => [xScale(b.t), yScale(b.top)] as [number, number]);
    const botPts: [number, number][] = band.map((b) => [xScale(b.t), yScale(b.bot)] as [number, number]).reverse();
    return `M${topPts[0][0].toFixed(2)},${topPts[0][1].toFixed(2)}${curves(topPts)} L${botPts[0][0].toFixed(2)},${botPts[0][1].toFixed(2)}${curves(botPts)} Z`;
  };

  /* ── Hover ── */
  const onMove = (e: React.MouseEvent<SVGRectElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const t = Math.round(((px - padLeft) / innerW) * (T - 1));
    if (t >= 0 && t < T) setHoverT(t);
  };
  const onLeave = () => setHoverT(null);

  const activeTradition = hoveredTradition || pinnedTradition;
  const bandOpacity = (id: string) => {
    if (!activeTradition) return 0.86;
    return id === activeTradition ? 0.96 : 0.14;
  };

  /* ── Tooltip content ── */
  const hoverYear = hoverT !== null ? decades[hoverT] : null;
  const hoverActive =
    hoverT !== null
      ? TRADITIONS
          .map((t, i) => ({ t, count: raw[i][hoverT] }))
          .filter((x) => x.count > 0)
      : [];
  const hoverTotal = hoverActive.reduce((s, x) => s + x.count, 0);

  const formatYear = (y: number) =>
    y < 0 ? `${-y} BCE` : y === 0 ? "1 CE" : `${y} CE`;

  /* ── Year axis ticks ── */
  const ticks = [-500, 0, 500, 1000, 1500, 2000];

  /* ── Era filter dim overlay coordinates ── */
  const dimBounds =
    eraFilter !== "All"
      ? STREAM_ERA_BOUNDS.find((e) => e.id === eraFilter)
      : null;
  const dimX1 = dimBounds ? xScale(Math.max(0, (dimBounds.start - START) / STEP)) : 0;
  const dimX2 = dimBounds ? xScale(Math.min(T - 1, (dimBounds.end - START) / STEP)) : 0;

  return (
    <div className="mb-8 sm:mb-10 animate-fade-in">
      {/* Heading */}
      <div className="flex items-baseline justify-between mb-1.5 px-0.5">
        <h3
          className="text-[13px] sm:text-[14px] text-sepia/75"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Schools of Thought, across 2,500 years
        </h3>
        <span
          className="text-[9px] sm:text-[10px] tracking-[0.18em] uppercase text-sepia-light/40"
          style={{ fontFamily: "var(--font-ui)" }}
        >
          600 BCE — today
        </span>
      </div>
      <p
        className="text-[11px] sm:text-[12px] text-sepia/40 italic mb-3 px-0.5"
        style={{ fontFamily: "var(--font-body)" }}
      >
        Each river swells as its tradition gathers living minds. Hover to explore — tap a legend chip to isolate a tradition.
      </p>

      {/* Chart container */}
      <div
        ref={containerRef}
        className="relative rounded-xl border border-warm-border/50 overflow-hidden"
        style={{ backgroundColor: "var(--color-linen)", minHeight: H + 8 }}
      >
        {width > 0 && (
          <svg width={width} height={H} style={{ display: "block" }}>
            {/* Era background tints */}
            {STREAM_ERA_BOUNDS.map((era) => {
              const x1 = xScale(Math.max(0, (era.start - START) / STEP));
              const x2 = xScale(Math.min(T - 1, (era.end - START) / STEP));
              const color = ERA_COLORS[era.id] || "#2C2418";
              return (
                <rect
                  key={era.id}
                  x={x1}
                  y={padTop - 4}
                  width={Math.max(0, x2 - x1)}
                  height={innerH + 8}
                  fill={color}
                  opacity={0.038}
                />
              );
            })}

            {/* Era boundary lines */}
            {STREAM_ERA_BOUNDS.slice(1).map((era) => {
              const x = xScale((era.start - START) / STEP);
              return (
                <line
                  key={era.id}
                  x1={x}
                  x2={x}
                  y1={padTop - 4}
                  y2={padTop + innerH + 4}
                  stroke="#2C2418"
                  strokeWidth={0.6}
                  strokeDasharray="2 3"
                  opacity={0.22}
                />
              );
            })}

            {/* Era labels at top */}
            {STREAM_ERA_BOUNDS.map((era) => {
              const x1 = xScale(Math.max(0, (era.start - START) / STEP));
              const x2 = xScale(Math.min(T - 1, (era.end - START) / STEP));
              const cx = (x1 + x2) / 2;
              const w = x2 - x1;
              if (w < 38) return null;
              const color = ERA_COLORS[era.id] || "#2C2418";
              return (
                <text
                  key={era.id}
                  x={cx}
                  y={16}
                  textAnchor="middle"
                  fontSize={9}
                  fontFamily="var(--font-ui)"
                  fill={color}
                  opacity={0.72}
                  style={{ letterSpacing: "0.12em", textTransform: "uppercase" }}
                >
                  {era.label}
                </text>
              );
            })}

            {/* Stream layers */}
            {bands.map((band, i) => {
              const tr = TRADITIONS[i];
              return (
                <path
                  key={tr.id}
                  d={bandPath(band)}
                  fill={tr.color}
                  opacity={bandOpacity(tr.id)}
                  stroke={tr.color}
                  strokeWidth={0.5}
                  strokeOpacity={0.45}
                  style={{ transition: "opacity 260ms ease", cursor: "pointer" }}
                  onMouseEnter={() => setHoveredTradition(tr.id)}
                  onMouseLeave={() => setHoveredTradition(null)}
                  onClick={() =>
                    setPinnedTradition((p) => (p === tr.id ? null : tr.id))
                  }
                />
              );
            })}

            {/* Era-filter dim: fade everything outside the selected era */}
            {dimBounds && (
              <>
                <rect
                  x={0}
                  y={padTop - 4}
                  width={dimX1}
                  height={innerH + 8}
                  fill="#FDFBF7"
                  opacity={0.78}
                  pointerEvents="none"
                />
                <rect
                  x={dimX2}
                  y={padTop - 4}
                  width={Math.max(0, width - dimX2)}
                  height={innerH + 8}
                  fill="#FDFBF7"
                  opacity={0.78}
                  pointerEvents="none"
                />
              </>
            )}

            {/* Year axis ticks */}
            {ticks.map((yy) => {
              const ti = (yy - START) / STEP;
              if (ti < 0 || ti > T - 1) return null;
              const x = xScale(ti);
              return (
                <g key={yy}>
                  <line
                    x1={x}
                    x2={x}
                    y1={padTop + innerH + 4}
                    y2={padTop + innerH + 8}
                    stroke="#2C2418"
                    strokeWidth={0.5}
                    opacity={0.35}
                  />
                  <text
                    x={x}
                    y={padTop + innerH + 19}
                    textAnchor="middle"
                    fontSize={9}
                    fontFamily="var(--font-ui)"
                    fill="#2C2418"
                    opacity={0.5}
                  >
                    {formatYear(yy)}
                  </text>
                </g>
              );
            })}

            {/* Hover hairline */}
            {hoverT !== null && (
              <line
                x1={xScale(hoverT)}
                x2={xScale(hoverT)}
                y1={padTop - 4}
                y2={padTop + innerH + 4}
                stroke="#2C2418"
                strokeWidth={1}
                opacity={0.35}
                pointerEvents="none"
              />
            )}

            {/* Mouse capture overlay */}
            <rect
              x={padLeft}
              y={padTop - 4}
              width={innerW}
              height={innerH + 8}
              fill="transparent"
              onMouseMove={onMove}
              onMouseLeave={onLeave}
            />
          </svg>
        )}

        {/* HTML tooltip */}
        {width > 0 && hoverT !== null && hoverYear !== null && (
          <div
            className="absolute pointer-events-none px-2.5 py-1.5 rounded-md shadow-sm border border-warm-border/60"
            style={{
              left: Math.min(Math.max(xScale(hoverT) + 10, 8), width - 172),
              top: 34,
              backgroundColor: "var(--color-parchment)",
              fontFamily: "var(--font-ui)",
              minWidth: 148,
              maxWidth: 200,
            }}
          >
            <div
              className="text-[11px] text-sepia/90"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              {formatYear(hoverYear)}
            </div>
            <div className="text-[9px] text-sepia-light/60 mb-1">
              {hoverTotal === 0
                ? "between voices"
                : `${hoverTotal} ${hoverTotal === 1 ? "thinker" : "thinkers"} alive`}
            </div>
            {hoverActive.length > 0 && (
              <div className="flex flex-col gap-0.5">
                {hoverActive.map(({ t, count }) => (
                  <div key={t.id} className="flex items-center gap-1.5">
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: t.color }}
                    />
                    <span className="text-[9px] text-sepia/75 truncate flex-1">
                      {t.name}
                    </span>
                    <span className="text-[9px] text-sepia-light/50 ml-1">
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-1.5 sm:gap-2 justify-center mt-3">
        {TRADITIONS.map((tr) => {
          const isPinned = pinnedTradition === tr.id;
          const isDim = !!pinnedTradition && !isPinned;
          return (
            <button
              key={tr.id}
              onClick={() =>
                setPinnedTradition((p) => (p === tr.id ? null : tr.id))
              }
              onMouseEnter={() => setHoveredTradition(tr.id)}
              onMouseLeave={() => setHoveredTradition(null)}
              className="flex items-center gap-1.5 px-2 py-1 rounded-full border transition-all duration-200 cursor-pointer"
              style={{
                fontFamily: "var(--font-ui)",
                fontSize: 10,
                opacity: isDim ? 0.38 : 1,
                borderColor: `${tr.color}55`,
                backgroundColor: isPinned ? `${tr.color}1c` : `${tr.color}08`,
                color: tr.color,
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: tr.color }}
              />
              {tr.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
export default function PhilosophersPage() {
  return (
    <Suspense>
      <PhilosophersContent />
    </Suspense>
  );
}

function PhilosophersContent() {
  const [data, setData] = useState<CatalogData | null>(null);
  const [loading, setLoading] = useState(true);
  const eraFilter = "All";
  const [selected, setSelected] = useState<Philosopher | null>(null);
  const [wisdomTopic, setWisdomTopic] = useState<WisdomTopic | null>(null);
  const searchParams = useSearchParams();
  const [viewMode, setViewMode] = useState<"wisdom" | "ask" | "timeline">(() => {
    const v = searchParams.get("view");
    if (v === "wisdom") return "wisdom";
    if (v === "ask") return "ask";
    return "timeline";
  });

  useEffect(() => {
    fetch("/philosophers/catalog.json")
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const philosophers = data?.philosophers || [];
  const eras = data?.meta.eras || [];

  const filtered =
    eraFilter === "All"
      ? philosophers
      : philosophers.filter((p) => p.era === eraFilter);

  const groupedByEra = eras
    .filter((era) => eraFilter === "All" || era.id === eraFilter)
    .map((era) => ({
      era,
      philosophers: filtered.filter((p) => p.era === era.id),
    }))
    .filter((g) => g.philosophers.length > 0);

  const closeModal = useCallback(() => setSelected(null), []);
  const selectPhilosopher = useCallback((p: Philosopher) => { setWisdomTopic(null); setSelected(p); }, []);
  const closeWisdom = useCallback(() => setWisdomTopic(null), []);

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10 pb-24 sm:pb-16 animate-fade-in">
        {/* Header — rich visual hero */}
        <div className="relative text-center mb-8 sm:mb-12 overflow-hidden">
          {/* Background decorative elements */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.04]"
            style={{ backgroundImage: "radial-gradient(circle, #2C2418 1px, transparent 1px)", backgroundSize: "28px 28px" }} />

          {/* Decorative illustration — The Thinker silhouette */}
          <div className="flex justify-center mb-4 sm:mb-5">
            <svg width="52" height="52" viewBox="0 0 64 64" fill="none" className="sm:w-16 sm:h-16">
              {/* Outer ring */}
              <circle cx="32" cy="32" r="30" stroke="#2C2418" strokeWidth="0.5" opacity="0.12" />
              <circle cx="32" cy="32" r="26" stroke="#2C2418" strokeWidth="0.3" opacity="0.08" strokeDasharray="3 4" />
              {/* Greek key pattern corners */}
              <path d="M16 8 h4 v4 h-4 v4 h8 v-8 h-4 v-4 h-4" stroke="#8B6914" strokeWidth="0.5" opacity="0.15" fill="none" />
              <path d="M44 56 h4 v-4 h-4 v-4 h-8 v8 h4 v4 h4" stroke="#5B2C6E" strokeWidth="0.5" opacity="0.15" fill="none" />
              {/* Central phi with decorative surround */}
              <circle cx="32" cy="32" r="14" fill="#2C2418" opacity="0.04" />
              <text x="32" y="38" textAnchor="middle" fill="#8B6914" fontSize="22" fontFamily="Georgia, serif" opacity="0.35">φ</text>
              {/* Small era dots around the circle */}
              <circle cx="32" cy="5" r="2" fill="#8B6914" opacity="0.25" />
              <circle cx="55" cy="20" r="1.5" fill="#6B4423" opacity="0.2" />
              <circle cx="55" cy="44" r="1.5" fill="#4A6741" opacity="0.2" />
              <circle cx="32" cy="59" r="2" fill="#2C4A6E" opacity="0.25" />
              <circle cx="9" cy="32" r="1.5" fill="#5B2C6E" opacity="0.2" />
            </svg>
          </div>

          <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.35em] text-sepia-light/50 mb-3 sm:mb-4"
            style={{ fontFamily: "var(--font-ui)" }}>
            Minds &amp; Millennia
          </p>
          <h2 className="text-[28px] sm:text-[42px] text-sepia leading-none"
            style={{ fontFamily: "var(--font-heading)" }}>
            The Thinkers
          </h2>
          <p className="text-[13px] sm:text-[15px] text-sepia/40 mt-3 sm:mt-4 max-w-sm sm:max-w-md mx-auto leading-relaxed italic px-4 sm:px-0"
            style={{ fontFamily: "var(--font-body)" }}>
            From the olive groves of Athens to the cafes of twentieth-century Paris &mdash; twenty-five centuries of wondering why
          </p>

          {/* Greek ornamental divider */}
          <div className="flex items-center justify-center gap-2.5 mt-5 sm:mt-7">
            <svg width="40" height="8" viewBox="0 0 40 8" className="sm:w-12">
              <path d="M0 4 L8 4 L8 0 L12 0 L12 4 L16 4 L16 8 L12 8 L12 4" stroke="#8B6914" strokeWidth="0.6" fill="none" opacity="0.2" />
              <path d="M20 4 L28 4 L28 0 L32 0 L32 4 L36 4 L36 8 L32 8 L32 4" stroke="#8B6914" strokeWidth="0.6" fill="none" opacity="0.2" />
            </svg>
            <span className="text-sepia/25 text-[11px] sm:text-[12px] tracking-wider" style={{ fontFamily: "Georgia, serif" }}>φιλοσοφία</span>
            <svg width="40" height="8" viewBox="0 0 40 8" className="sm:w-12" style={{ transform: "scaleX(-1)" }}>
              <path d="M0 4 L8 4 L8 0 L12 0 L12 4 L16 4 L16 8 L12 8 L12 4" stroke="#8B6914" strokeWidth="0.6" fill="none" opacity="0.2" />
              <path d="M20 4 L28 4 L28 0 L32 0 L32 4 L36 4 L36 8 L32 8 L32 4" stroke="#8B6914" strokeWidth="0.6" fill="none" opacity="0.2" />
            </svg>
          </div>
        </div>

        {/* View mode toggle — Wisdom / Ask Them / Timeline */}
        <div className="flex justify-center mb-6 sm:mb-8">
          <div className="inline-flex rounded-full border border-warm-border/60 p-0.5 sm:p-1"
            style={{ backgroundColor: "var(--color-linen)" }}>
            <button
              onClick={() => setViewMode("wisdom")}
              className={`px-3 sm:px-5 py-1.5 sm:py-2 rounded-full text-[11px] sm:text-[12px] transition-all duration-300 cursor-pointer
                         ${viewMode === "wisdom"
                           ? "bg-sepia text-parchment shadow-sm"
                           : "text-sepia-light/70 hover:text-sepia"}`}
              style={{ fontFamily: "var(--font-ui)" }}>
              Wisdom
            </button>
            <button
              onClick={() => setViewMode("ask")}
              className={`px-3 sm:px-5 py-1.5 sm:py-2 rounded-full text-[11px] sm:text-[12px] transition-all duration-300 cursor-pointer
                         ${viewMode === "ask"
                           ? "bg-sepia text-parchment shadow-sm"
                           : "text-sepia-light/70 hover:text-sepia"}`}
              style={{ fontFamily: "var(--font-ui)" }}>
              Ask Them
            </button>
            <button
              onClick={() => setViewMode("timeline")}
              className={`px-3 sm:px-5 py-1.5 sm:py-2 rounded-full text-[11px] sm:text-[12px] transition-all duration-300 cursor-pointer
                         ${viewMode === "timeline"
                           ? "bg-sepia text-parchment shadow-sm"
                           : "text-sepia-light/70 hover:text-sepia"}`}
              style={{ fontFamily: "var(--font-ui)" }}>
              Timeline
            </button>
          </div>
        </div>

        {/* ══════ WISDOM FOR TODAY ══════ */}
        {viewMode === "wisdom" && (
          <div className="animate-fade-in">
            {/* Topic grid — 1 col mobile, 2 col desktop */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {WISDOM_TOPICS.map((topic) => (
                <WisdomTopicCard
                  key={topic.id}
                  topic={topic}
                  onClick={() => setWisdomTopic(topic)}
                />
              ))}
            </div>
          </div>
        )}

        {/* ══════ ASK THEM ══════ */}
        {viewMode === "ask" && (
          <AskThemView
            philosophers={philosophers}
            onSelectPhilosopher={selectPhilosopher}
          />
        )}

        {/* ══════ TIMELINE VIEW ══════ */}
        {viewMode === "timeline" && (
          <>
        {/* Schools of Thought — stream graph overview */}
        {!loading && philosophers.length > 0 && (
          <SchoolsStreamGraph philosophers={philosophers} eraFilter={eraFilter} />
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-stretch">
                <div className="w-[68px] sm:w-[88px]" />
                <div className="w-7 sm:w-8 flex justify-center">
                  <div className="w-3 h-3 rounded-full bg-warm-border/25 animate-pulse-warm self-center" />
                </div>
                <div className="flex-1 rounded-xl animate-pulse-warm my-2 ml-2 sm:ml-3 flex overflow-hidden border border-warm-border/20"
                  style={{ height: `${110 + (i % 3) * 18}px` }}>
                  <div className="w-[3px] bg-warm-border/20 shrink-0" />
                  <div className="flex-1 bg-warm-border/8" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Timeline */}
        {!loading && (
          <div>
            {groupedByEra.map(({ era, philosophers: eraPhilosophers }, eraIdx) => (
              <div key={era.id}>
                <EraHeader era={era} isFirst={eraIdx === 0} />
                {eraPhilosophers.map((philosopher, i) => (
                  <TimelineCard
                    key={philosopher.id}
                    philosopher={philosopher}
                    index={i}
                    onClick={() => setSelected(philosopher)}
                    isActive={selected?.id === philosopher.id}
                    isLast={eraIdx === groupedByEra.length - 1 && i === eraPhilosophers.length - 1}
                    eraColor={era.color}
                  />
                ))}
              </div>
            ))}
          </div>
        )}

        {/* Empty */}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-20">
            <p className="text-sepia-light/60 text-sm" style={{ fontFamily: "var(--font-heading)" }}>
              No philosophers in this era yet
            </p>
          </div>
        )}

        {/* CTA — philosophical closing with visual elements */}
        <div className="text-center mt-14 sm:mt-20 relative">
          {/* Decorative end-of-scroll illustration */}
          <div className="flex justify-center mb-4">
            <svg width="48" height="32" viewBox="0 0 64 40" fill="none" className="sm:w-16">
              {/* Scroll / parchment end */}
              <path d="M12 8 Q12 4 16 4 H48 Q52 4 52 8 V32 Q52 36 48 36 H16 Q12 36 12 32 Z"
                fill="#2C2418" opacity="0.05" stroke="#2C2418" strokeWidth="0.5" />
              <circle cx="16" cy="20" r="4" stroke="#8B6914" strokeWidth="0.5" fill="#8B6914" opacity="0.08" />
              <circle cx="48" cy="20" r="4" stroke="#8B6914" strokeWidth="0.5" fill="#8B6914" opacity="0.08" />
              <line x1="22" y1="14" x2="42" y2="14" stroke="#2C2418" strokeWidth="0.4" opacity="0.1" />
              <line x1="22" y1="20" x2="42" y2="20" stroke="#2C2418" strokeWidth="0.4" opacity="0.1" />
              <line x1="22" y1="26" x2="38" y2="26" stroke="#2C2418" strokeWidth="0.4" opacity="0.08" />
            </svg>
          </div>
          <p className="text-[14px] sm:text-[15px] text-sepia/30 italic mb-1.5 max-w-xs mx-auto leading-relaxed"
            style={{ fontFamily: "var(--font-body)" }}>
            &ldquo;The unexamined life is not worth living.&rdquo;
          </p>
          <p className="text-[10px] sm:text-[11px] text-sepia-light/30 mb-6"
            style={{ fontFamily: "var(--font-ui)" }}>
            — Socrates, 399 BC
          </p>

          <Link href="/signup"
            className="inline-block px-7 py-2.5 text-[12px] sm:text-sm rounded-full bg-sepia text-parchment hover:bg-gold transition-colors duration-200"
            style={{ fontFamily: "var(--font-ui)" }}>
            Begin your journey
          </Link>
        </div>
          </>
        )}
      </div>

      {selected && (
        <ArticleModal
          philosopher={selected}
          allPhilosophers={philosophers}
          onClose={closeModal}
          onSelect={selectPhilosopher}
        />
      )}

      {wisdomTopic && (
        <WisdomModal
          topic={wisdomTopic}
          allPhilosophers={philosophers}
          onClose={closeWisdom}
          onSelectPhilosopher={selectPhilosopher}
        />
      )}
    </>
  );
}
