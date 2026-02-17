import { motion, AnimatePresence } from "framer-motion";

export default function ProcessingIndicator({ message }) {
  return (
    <AnimatePresence>
      {message && (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.4, 1, 0.4] }}
          exit={{ opacity: 0 }}
          transition={{
            opacity: {
              duration: 1.8,
              repeat: Infinity,
              ease: "easeInOut",
            },
          }}
          className="text-xs text-neutral-400 tracking-wide px-1"
        >
          {message}
        </motion.span>
      )}
    </AnimatePresence>
  );
}
