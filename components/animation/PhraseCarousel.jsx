"use client";

import { useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { usePhraseCarousel } from "@/hooks";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildPattern(highlightWords) {
  return new RegExp(
    `(${[...highlightWords]
      .sort((a, b) => b.length - a.length)
      .map(escapeRegex)
      .join("|")})`,
    "gi",
  );
}

function tokenize(phrase, pattern) {
  pattern.lastIndex = 0;
  const tokens = [];
  let lastIndex = 0;
  let wordIdx = 0;
  let match;

  while ((match = pattern.exec(phrase)) !== null) {
    if (match.index > lastIndex) {
      phrase
        .slice(lastIndex, match.index)
        .split(/(\s+)/)
        .forEach((chunk) => {
          if (chunk)
            tokens.push({
              value: chunk,
              highlight: false,
              wordIndex: wordIdx++,
            });
        });
    }
    tokens.push({ value: match[0], highlight: true, wordIndex: wordIdx++ });
    lastIndex = pattern.lastIndex;
  }

  phrase
    .slice(lastIndex)
    .split(/(\s+)/)
    .forEach((chunk) => {
      if (chunk)
        tokens.push({ value: chunk, highlight: false, wordIndex: wordIdx++ });
    });

  return tokens;
}

// ─────────────────────────────────────────────────────────────────────────────
// Animation variants
// ─────────────────────────────────────────────────────────────────────────────

const containerVariants = {
  enter: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
  exit: { transition: { staggerChildren: 0.03, staggerDirection: -1 } },
};

const wordVariants = {
  initial: { opacity: 0, y: 14, filter: "blur(4px)" },
  enter: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  },
  exit: {
    opacity: 0,
    y: -10,
    filter: "blur(3px)",
    transition: { duration: 0.3, ease: [0.55, 0, 1, 0.45] },
  },
};

const highlightVariants = {
  initial: { opacity: 0, color: "rgb(74 222 128)", filter: "blur(3px)" },
  enter: {
    opacity: 1,
    color: "rgb(74 222 128)",
    filter: "blur(0px)",
    transition: { duration: 0.6, ease: "easeInOut" },
  },
  exit: {
    opacity: 0,
    color: "rgb(74 222 128)",
    filter: "blur(2px)",
    transition: { duration: 0.2 },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Sub-component: single animated phrase
// ─────────────────────────────────────────────────────────────────────────────

function AnimatedPhrase({ phrase, pattern }) {
  const tokens = useMemo(() => tokenize(phrase, pattern), [phrase, pattern]);

  return (
    <motion.span
      variants={containerVariants}
      initial="initial"
      animate="enter"
      exit="exit"
      className="inline-flex flex-wrap justify-center gap-x-[0.3em]"
      aria-label={phrase}
    >
      {tokens.map((token) => {
        if (/^\s+$/.test(token.value)) return null;

        return (
          <motion.span
            key={`${token.value}-${token.wordIndex}`}
            variants={token.highlight ? undefined : wordVariants}
            className="inline-block"
          >
            {token.highlight ? (
              <motion.span
                variants={highlightVariants}
                initial="initial"
                animate="enter"
                exit="exit"
                className="font-light"
              >
                {token.value}
              </motion.span>
            ) : (
              token.value
            )}
          </motion.span>
        );
      })}
    </motion.span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PhraseCarousel
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Cycles through `phrases`, animating each one in with per-word stagger.
 * Words that appear in `highlightWords` fade in with a green accent color.
 *
 * @param {string[]}    phrases        List of phrases to cycle through.
 * @param {Set<string>} highlightWords Words/phrases to render in green.
 * @param {string}      [className]    Extra classes on the wrapper <h2>.
 */
export default function PhraseCarousel({
  phrases,
  highlightWords,
  className = "",
}) {
  const index = usePhraseCarousel(phrases);

  // Memoised so the RegExp isn't rebuilt on every render
  const pattern = useMemo(() => buildPattern(highlightWords), [highlightWords]);

  return (
    <h2
      className={`font-medium text-neutral-300 font-serif tracking-tighter relative ${className}`}
      style={{ minHeight: "2.5rem" }}
    >
      <AnimatePresence mode="wait">
        <AnimatedPhrase key={index} phrase={phrases[index]} pattern={pattern} />
      </AnimatePresence>
    </h2>
  );
}
