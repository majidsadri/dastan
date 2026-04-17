import React from "react";

export type MotifType =
  | "enso"
  | "river"
  | "mountain"
  | "ascetic"
  | "bamboo"
  | "lotus"
  | "bodhi"
  | "dot"
  | "path"
  | "wheel"
  | "ferry"
  | "moon"
  | "peacock"
  | "mandala"
  | "fledgling"
  | "om";

type MotifProps = {
  type: MotifType;
  size?: number;
  className?: string;
  inkColor?: string;
};

/* One source of brushed ink motifs for Siddhartha.
   Each lives on a 100×100 grid so sizes compose cleanly. */
export function Motif({ type, size = 120, className = "", inkColor = "currentColor" }: MotifProps) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 100 100",
    fill: "none",
    stroke: inkColor,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
    "aria-hidden": true,
  };

  switch (type) {
    case "enso":
      // Incomplete brush circle with a tapered opening
      return (
        <svg {...common} strokeWidth="2.4">
          <path
            d="M 78 30 A 32 32 0 1 0 72 78 L 68 82"
            opacity="0.85"
          />
          <circle cx="68" cy="82" r="1.4" fill={inkColor} opacity="0.6" stroke="none" />
        </svg>
      );

    case "river":
      return (
        <svg {...common} strokeWidth="1.6">
          <path d="M 8 40 Q 28 32, 50 40 T 92 40" opacity="0.75" />
          <path d="M 8 52 Q 28 44, 50 52 T 92 52" opacity="0.55" />
          <path d="M 8 64 Q 28 56, 50 64 T 92 64" opacity="0.38" />
        </svg>
      );

    case "mountain":
      return (
        <svg {...common} strokeWidth="2">
          <path d="M 18 76 L 42 32 L 54 50 L 64 38 L 84 76" opacity="0.85" />
          <line x1="18" y1="76" x2="84" y2="76" opacity="0.28" strokeWidth="0.9" />
          {/* Distant second peak */}
          <path d="M 8 76 L 22 58 L 34 76" opacity="0.35" strokeWidth="1.2" />
        </svg>
      );

    case "ascetic":
      // A bare wintered tree — stripped to angular branches, no leaves
      return (
        <svg {...common} strokeWidth="1.8">
          {/* soft earth line */}
          <line x1="24" y1="90" x2="76" y2="90" opacity="0.28" strokeWidth="0.7" />
          {/* trunk, lightly crooked */}
          <path d="M 50 90 Q 48 74, 52 60 Q 48 46, 51 28" opacity="0.9" strokeWidth="2.2" fill="none" />
          {/* main branches reaching up */}
          <path d="M 51 28 Q 44 22, 36 12" opacity="0.88" strokeWidth="1.6" fill="none" />
          <path d="M 51 28 Q 58 22, 66 12" opacity="0.88" strokeWidth="1.6" fill="none" />
          <path d="M 51 28 Q 50 22, 50 8"  opacity="0.7"  strokeWidth="1.3" fill="none" />
          {/* mid branches */}
          <path d="M 50 46 Q 40 40, 28 36" opacity="0.7"  strokeWidth="1.3" fill="none" />
          <path d="M 52 54 Q 64 48, 74 42" opacity="0.65" strokeWidth="1.3" fill="none" />
          {/* twigs */}
          <line x1="36" y1="12" x2="30" y2="6"  opacity="0.55" strokeWidth="0.9" />
          <line x1="36" y1="12" x2="40" y2="4"  opacity="0.55" strokeWidth="0.9" />
          <line x1="66" y1="12" x2="72" y2="6"  opacity="0.55" strokeWidth="0.9" />
          <line x1="66" y1="12" x2="60" y2="4"  opacity="0.55" strokeWidth="0.9" />
          <line x1="28" y1="36" x2="20" y2="32" opacity="0.45" strokeWidth="0.9" />
          <line x1="74" y1="42" x2="82" y2="38" opacity="0.45" strokeWidth="0.9" />
        </svg>
      );

    case "bamboo":
      return (
        <svg {...common} strokeWidth="2.2">
          <line x1="50" y1="10" x2="50" y2="90" opacity="0.78" />
          <line x1="46" y1="28" x2="54" y2="28" opacity="0.9" />
          <line x1="46" y1="52" x2="54" y2="52" opacity="0.9" />
          <line x1="46" y1="74" x2="54" y2="74" opacity="0.9" />
          <path d="M 50 28 Q 60 22, 70 18" opacity="0.55" strokeWidth="1.3" fill="none" />
          <path d="M 50 52 Q 40 46, 30 42" opacity="0.55" strokeWidth="1.3" fill="none" />
          <path d="M 50 74 Q 62 70, 72 68" opacity="0.45" strokeWidth="1.2" fill="none" />
        </svg>
      );

    case "bodhi":
      // A bodhi / pipal leaf — heart-shaped base, long drip tip
      return (
        <svg {...common} strokeWidth="1.5">
          {/* petiole stem */}
          <line x1="50" y1="14" x2="50" y2="8" opacity="0.6" strokeWidth="1" />
          {/* leaf outline */}
          <path
            d="M 50 16
               Q 45 12, 40 18
               Q 33 18, 29 22
               Q 18 30, 20 50
               Q 22 68, 50 92
               Q 78 68, 80 50
               Q 82 30, 71 22
               Q 67 18, 60 18
               Q 55 12, 50 16 Z"
            opacity="0.9"
            fill={inkColor}
            fillOpacity="0.05"
          />
          {/* central vein */}
          <path d="M 50 18 Q 50 52, 50 90" opacity="0.55" strokeWidth="0.9" fill="none" />
          {/* side veins, paired */}
          <path d="M 50 30 Q 42 34, 28 36" opacity="0.42" strokeWidth="0.8" fill="none" />
          <path d="M 50 30 Q 58 34, 72 36" opacity="0.42" strokeWidth="0.8" fill="none" />
          <path d="M 50 48 Q 38 52, 26 54" opacity="0.4"  strokeWidth="0.8" fill="none" />
          <path d="M 50 48 Q 62 52, 74 54" opacity="0.4"  strokeWidth="0.8" fill="none" />
          <path d="M 50 66 Q 42 70, 34 72" opacity="0.35" strokeWidth="0.8" fill="none" />
          <path d="M 50 66 Q 58 70, 66 72" opacity="0.35" strokeWidth="0.8" fill="none" />
        </svg>
      );

    case "lotus":
      return (
        <svg {...common} strokeWidth="1.7">
          {/* Water line */}
          <line x1="16" y1="74" x2="84" y2="74" opacity="0.35" />
          {/* Outer petals */}
          <path d="M 50 74 Q 26 56, 36 36 Q 48 56, 50 74" opacity="0.75" />
          <path d="M 50 74 Q 74 56, 64 36 Q 52 56, 50 74" opacity="0.75" />
          {/* Inner petal */}
          <path d="M 50 74 Q 42 54, 50 32 Q 58 54, 50 74" opacity="0.85" fill={inkColor} fillOpacity="0.06" />
          {/* Tip */}
          <circle cx="50" cy="32" r="1.4" fill={inkColor} opacity="0.6" stroke="none" />
        </svg>
      );

    case "dot":
      return (
        <svg {...common} strokeWidth="0">
          <circle cx="50" cy="50" r="5.5" fill={inkColor} fillOpacity="0.92" />
          <circle cx="50" cy="50" r="14" stroke={inkColor} strokeWidth="0.7" strokeOpacity="0.4" fill="none" />
          <circle cx="50" cy="50" r="26" stroke={inkColor} strokeWidth="0.5" strokeOpacity="0.2" fill="none" />
          <circle cx="50" cy="50" r="38" stroke={inkColor} strokeWidth="0.4" strokeOpacity="0.1" fill="none" />
        </svg>
      );

    case "path":
      return (
        <svg {...common} strokeWidth="1.4">
          <path
            d="M 10 78 Q 28 52, 44 58 T 72 40 T 92 22"
            opacity="0.7"
            strokeDasharray="1.2 4.5"
          />
          <circle cx="10" cy="78" r="2" fill={inkColor} fillOpacity="0.75" stroke="none" />
          <circle cx="92" cy="22" r="2" fill={inkColor} fillOpacity="0.75" stroke="none" />
        </svg>
      );

    case "wheel":
      return (
        <svg {...common} strokeWidth="1.3">
          <circle cx="50" cy="50" r="32" opacity="0.75" />
          <circle cx="50" cy="50" r="8" opacity="0.9" />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((a, i) => {
            const rad = (a * Math.PI) / 180;
            const x1 = 50 + Math.cos(rad) * 9;
            const y1 = 50 + Math.sin(rad) * 9;
            const x2 = 50 + Math.cos(rad) * 32;
            const y2 = 50 + Math.sin(rad) * 32;
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                opacity="0.6"
              />
            );
          })}
        </svg>
      );

    case "ferry":
      // Simple canoe on water, a single oar laid across it
      return (
        <svg {...common} strokeWidth="1.5">
          {/* Boat hull — elongated crescent */}
          <path
            d="M 20 52 Q 50 46, 80 52 Q 50 62, 20 52 Z"
            opacity="0.88"
            fill={inkColor}
            fillOpacity="0.06"
          />
          {/* Water meeting the hull */}
          <path d="M 20 52 Q 50 57, 80 52" opacity="0.55" strokeWidth="0.9" fill="none" />
          {/* Single oar, laid diagonally */}
          <line x1="44" y1="48" x2="28" y2="36" opacity="0.75" strokeWidth="1.5" />
          <line x1="27" y1="35" x2="26" y2="33" opacity="0.65" strokeWidth="1.2" />
          {/* Ripples beneath */}
          <path d="M 10 72 Q 30 68, 50 72 T 90 72" opacity="0.48" strokeWidth="1" fill="none" />
          <path d="M 18 82 Q 34 78, 50 82 T 82 82" opacity="0.28" strokeWidth="1" fill="none" />
        </svg>
      );

    case "moon":
      return (
        <svg {...common} strokeWidth="1.8">
          {/* Glow */}
          <circle cx="52" cy="50" r="30" stroke={inkColor} strokeWidth="0.4" strokeOpacity="0.15" fill="none" />
          {/* Crescent */}
          <path
            d="M 60 28 A 22 22 0 1 0 60 72 A 16 16 0 1 1 60 28 Z"
            opacity="0.85"
            fill={inkColor}
            fillOpacity="0.06"
          />
        </svg>
      );

    case "peacock":
      // A single peacock feather — shaft, soft barbs, iconic eye at top
      return (
        <svg {...common} strokeWidth="1.2">
          {/* The eye — concentric ovals, deepest at center */}
          <ellipse cx="50" cy="24" rx="15" ry="19" opacity="0.28" fill={inkColor} fillOpacity="0.03" />
          <ellipse cx="50" cy="24" rx="10" ry="13" opacity="0.55" fill={inkColor} fillOpacity="0.07" />
          <ellipse cx="50" cy="24" rx="5.5" ry="7.5" opacity="0.85" fill={inkColor} fillOpacity="0.55" />
          {/* Shaft (rachis) */}
          <line x1="50" y1="43" x2="50" y2="92" opacity="0.75" strokeWidth="1.5" />
          {/* Left barbs, arcing outward */}
          <path d="M 50 50 Q 40 54, 30 58" opacity="0.5"  strokeWidth="0.9" fill="none" />
          <path d="M 50 58 Q 36 62, 24 66" opacity="0.46" strokeWidth="0.9" fill="none" />
          <path d="M 50 66 Q 36 70, 22 74" opacity="0.42" strokeWidth="0.9" fill="none" />
          <path d="M 50 74 Q 38 78, 28 82" opacity="0.36" strokeWidth="0.9" fill="none" />
          <path d="M 50 82 Q 42 86, 34 88" opacity="0.3"  strokeWidth="0.9" fill="none" />
          {/* Right barbs */}
          <path d="M 50 50 Q 60 54, 70 58" opacity="0.5"  strokeWidth="0.9" fill="none" />
          <path d="M 50 58 Q 64 62, 76 66" opacity="0.46" strokeWidth="0.9" fill="none" />
          <path d="M 50 66 Q 64 70, 78 74" opacity="0.42" strokeWidth="0.9" fill="none" />
          <path d="M 50 74 Q 62 78, 72 82" opacity="0.36" strokeWidth="0.9" fill="none" />
          <path d="M 50 82 Q 58 86, 66 88" opacity="0.3"  strokeWidth="0.9" fill="none" />
        </svg>
      );

    case "fledgling":
      // A small bird leaving the empty branch — the son flying off to his own river
      return (
        <svg {...common} strokeWidth="1.4">
          {/* Branch, reaching in from the lower left */}
          <path d="M 6 74 Q 26 70, 46 72" opacity="0.78" strokeWidth="1.6" fill="none" />
          {/* A few small leaves on the branch */}
          <path d="M 18 70 Q 20 65, 24 67" opacity="0.55" strokeWidth="0.9" fill="none" />
          <path d="M 30 70 Q 32 65, 36 67" opacity="0.5"  strokeWidth="0.9" fill="none" />
          <path d="M 40 71 Q 42 66, 46 68" opacity="0.45" strokeWidth="0.9" fill="none" />
          {/* Empty nest nestled against the branch — a small U */}
          <path d="M 42 72 Q 46 78, 52 72" opacity="0.5" strokeWidth="1" fill="none" />
          {/* Faint trail of flight rising from the nest */}
          <path
            d="M 52 72 Q 62 56, 76 36"
            opacity="0.35"
            strokeWidth="0.9"
            strokeDasharray="1.2 3.5"
            fill="none"
          />
          {/* The small bird, wings open — a soft double arc high to the right */}
          <path d="M 72 30 Q 78 24, 82 30 Q 86 24, 90 30" opacity="0.85" strokeWidth="1.5" fill="none" />
          {/* Tiny body dot beneath the wings */}
          <circle cx="82" cy="31" r="0.9" fill={inkColor} opacity="0.7" stroke="none" />
        </svg>
      );

    case "mandala":
      // A mandala — many petals radiating from one still centre (the vision of oneness)
      return (
        <svg {...common} strokeWidth="1">
          {/* Outer ring */}
          <circle cx="50" cy="50" r="40" opacity="0.2" strokeWidth="0.5" />
          {/* Eight outer petals, rotated around centre */}
          {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
            <g key={`op-${a}`} transform={`rotate(${a} 50 50)`}>
              <path
                d="M 50 14 Q 56 28, 50 42 Q 44 28, 50 14 Z"
                opacity="0.55"
                strokeWidth="0.9"
                fill={inkColor}
                fillOpacity="0.04"
              />
            </g>
          ))}
          {/* Middle ring */}
          <circle cx="50" cy="50" r="24" opacity="0.35" strokeWidth="0.7" />
          {/* Eight inner petals, offset by 22.5° */}
          {[22.5, 67.5, 112.5, 157.5, 202.5, 247.5, 292.5, 337.5].map((a) => (
            <g key={`ip-${a}`} transform={`rotate(${a} 50 50)`}>
              <path
                d="M 50 30 Q 54 40, 50 50 Q 46 40, 50 30 Z"
                opacity="0.75"
                strokeWidth="0.8"
                fill={inkColor}
                fillOpacity="0.08"
              />
            </g>
          ))}
          {/* Core */}
          <circle cx="50" cy="50" r="7" opacity="0.6" strokeWidth="0.8" fill={inkColor} fillOpacity="0.08" />
          <circle cx="50" cy="50" r="2.2" fill={inkColor} opacity="0.85" stroke="none" />
        </svg>
      );

    case "om":
      // Devanagari ॐ via text, plus a subtle underline
      return (
        <svg {...common} strokeWidth="0">
          <text
            x="50"
            y="70"
            textAnchor="middle"
            fontSize="72"
            fontFamily="Georgia, 'Noto Sans Devanagari', serif"
            fill={inkColor}
            fillOpacity="0.9"
            fontStyle="italic"
          >
            ॐ
          </text>
        </svg>
      );

    default:
      return null;
  }
}
