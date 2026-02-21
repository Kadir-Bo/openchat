import { PhraseCarousel } from "@/components";
import { motion } from "framer-motion";
// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const EXAMPLE_TASKS = [
  "Write a cover letter",
  "Explain quantum entanglement",
  "Brainstorm startup ideas",
  "Refactor this Python script",
  "Draft a cold outreach email",
  "Summarize this research paper",
  "Generate a logo concept brief",
  "Plan a 7-day trip to Japan",
  "Come up with a product tagline",
];

const HIGHLIGHT_WORDS = new Set([
  "cover letter",
  "quantum entanglement",
  "startup ideas",
  "Python",
  "cold outreach",
  "research paper",
  "logo",
  "Japan",
  "tagline",
]);

export default function EmptyStateConversation({
  phrases = EXAMPLE_TASKS,
  highlightWords = HIGHLIGHT_WORDS,
}) {
  return (
    <div className="flex items-center justify-center w-full">
      <div className="text-center px-4 max-w-xl">
        <PhraseCarousel
          phrases={phrases}
          highlightWords={highlightWords}
          className="text-3xl h-20 flex flex-col justify-end"
        />
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="mt-2 text-neutral-600"
        >
          Start a conversation by typing a message below
        </motion.p>
      </div>
    </div>
  );
}
