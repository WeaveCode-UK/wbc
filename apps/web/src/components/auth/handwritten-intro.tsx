"use client";

import { Caveat } from "next/font/google";

// Carrega o Caveat só pra essa surface — fica em CSS separado e não polui
// o bundle do dashboard. Weight 600 dá peso de "caneta firme" sem perder
// o feeling manuscrito.
const handwriting = Caveat({
  subsets: ["latin"],
  weight: "600",
  display: "swap",
});

interface HandwrittenIntroProps {
  text: string;
  /** Total time to "write" the line, in ms. */
  durationMs?: number;
  /** Delay before the animation kicks in. */
  delayMs?: number;
  className?: string;
}

// Reveals `text` left-to-right via an animated clip-path so it looks
// like a hand is writing it. The accessible name is the full string
// from the start; the visual reveal is purely decorative. Respects
// prefers-reduced-motion via a fallback in the consuming CSS.
export function HandwrittenIntro({
  text,
  durationMs = 2400,
  delayMs = 250,
  className,
}: HandwrittenIntroProps) {
  return (
    <span
      className={[
        handwriting.className,
        "wc-handwrite",
        "inline-block whitespace-nowrap",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={{
        animationDuration: `${durationMs}ms`,
        animationDelay: `${delayMs}ms`,
      }}
      aria-label={text}
    >
      <span aria-hidden="true">{text}</span>
    </span>
  );
}
