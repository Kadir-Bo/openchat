import { useState, useEffect } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const PHRASE_DURATION = 3200;

// ─────────────────────────────────────────────────────────────────────────────
// Hook — cycles through phrases on an interval
// ─────────────────────────────────────────────────────────────────────────────

export function usePhraseCarousel(phrases, duration = PHRASE_DURATION) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(
      () => setIndex((i) => (i + 1) % phrases.length),
      duration,
    );
    return () => clearInterval(id);
  }, [phrases, duration]);

  return index;
}
