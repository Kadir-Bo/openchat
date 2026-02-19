import { useChat } from "@/context";
import { AnimatePresence, motion } from "framer-motion";
import React from "react";

export default function ChatFooterMessage() {
  const { isLoading } = useChat();
  const ParagraphVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    transition: { duration: 1 },
  };

  return (
    <AnimatePresence key={isLoading}>
      <div className="text-xs text-neutral-600 flex justify-center my-2">
        {isLoading ? (
          <motion.p
            variants={ParagraphVariants}
            initial="hidden"
            animate="visible"
            transition={"transition"}
            className="animate-pulse"
          >
            Generating response...
          </motion.p>
        ) : (
          <motion.p
            variants={ParagraphVariants}
            initial="hidden"
            animate="visible"
            transition={"transition"}
          >
            openchat and AI can make mistakes. Please double-check responses.
          </motion.p>
        )}
      </div>
    </AnimatePresence>
  );
}
