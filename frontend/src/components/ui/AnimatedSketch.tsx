"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface AnimatedSketchProps {
  width?: number;
  height?: number;
  strokeColor?: string;
  backgroundColor?: string;
  duration?: number;
  loop?: boolean;
  className?: string;
}

// Single continuous line — face with hand on cheek.
// No M commands mid-path. One unbroken stroke.
const FACE_PATH = [
  // Neck rises from bottom center
  "M 200 490",
  "C 198 460, 195 430, 192 405",
  "C 189 380, 185 360, 182 342",
  "C 179 324, 176 310, 172 298",
  // Chin curves left
  "C 166 284, 156 276, 144 272",
  "C 132 268, 120 272, 112 282",
  // Left cheek rises to temple
  "C 104 292, 100 284, 98 270",
  "C 95 252, 97 232, 105 216",
  // Forehead arc
  "C 115 196, 135 182, 158 176",
  "C 180 172, 200 175, 218 185",
  // Right temple, curve toward cheek
  "C 232 193, 240 205, 246 218",
  // Hand approaches from right — palm on cheek
  "C 252 212, 262 200, 272 190",
  // Index finger up
  "C 280 180, 286 168, 284 158",
  "C 282 150, 276 152, 275 160",
  // Fold between fingers
  "C 274 168, 279 160, 286 150",
  // Middle finger
  "C 293 140, 298 135, 296 144",
  "C 294 152, 289 162, 283 170",
  // Palm curves back down
  "C 276 182, 268 200, 260 220",
  "C 254 236, 250 252, 248 265",
  // Line crosses inward — nose suggestion
  "C 245 272, 230 240, 226 248",
  "C 220 258, 218 270, 222 278",
  "Q 225 283, 229 280",
  // Curves down to lips
  "C 230 284, 224 288, 215 292",
  "C 208 296, 198 296, 192 292",
  "C 186 288, 182 284, 178 286",
  "C 174 290, 172 296, 175 298",
].join(" ");

export default function AnimatedSketch({
  width = 400,
  height = 500,
  strokeColor = "#1F1F1F",
  backgroundColor = "transparent",
  duration = 5,
  loop = true,
  className = "",
}: AnimatedSketchProps) {
  const pathRef = useRef<SVGPathElement>(null);
  const [length, setLength] = useState(1800); // reasonable default
  const [animKey, setAnimKey] = useState(0);

  const measure = useCallback(() => {
    if (pathRef.current) {
      setLength(Math.ceil(pathRef.current.getTotalLength()));
    }
  }, []);

  // Measure on mount
  useEffect(() => {
    measure();
  }, [measure]);

  // Re-measure after key change (loop restart)
  useEffect(() => {
    // Small delay to let DOM update
    const t = setTimeout(measure, 50);
    return () => clearTimeout(t);
  }, [animKey, measure]);

  // Loop: restart after draw + pause
  useEffect(() => {
    if (!loop) return;
    const cycle = (duration + 2) * 1000;
    const interval = setInterval(() => setAnimKey((k) => k + 1), cycle);
    return () => clearInterval(interval);
  }, [loop, duration]);

  return (
    <svg
      key={animKey}
      viewBox="0 0 400 500"
      fill="none"
      className={className}
      style={{ backgroundColor, width, height }}
    >
      <path
        ref={pathRef}
        d={FACE_PATH}
        stroke={strokeColor}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        style={{
          strokeDasharray: length,
          strokeDashoffset: length,
          animation: `sketch-draw ${duration}s cubic-bezier(0.25, 0.1, 0.25, 1) forwards`,
        }}
      />
    </svg>
  );
}
