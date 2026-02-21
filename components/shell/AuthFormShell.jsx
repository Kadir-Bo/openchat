"use client";

import { motion, AnimatePresence } from "framer-motion";

const cardVariants = {
  initial: { opacity: 0, y: 10 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.25, ease: "easeOut" },
  },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2, ease: "easeIn" } },
};

export default function AuthFormShell({
  title,
  error,
  footer,
  animKey = "default",
  children,
}) {
  return (
    <div className="w-full md:max-w-sm px-4 md:px-0">
      <AnimatePresence mode="wait">
        <motion.div
          key={animKey}
          variants={cardVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="p-6 md:border border-neutral-900 rounded-lg md:bg-neutral-800/5"
        >
          {/* ── Title ───────────────────────────────────── */}
          {title && (
            <h2 className="text-3xl md:text-2xl font-semibold mb-6 text-center">
              {title}
            </h2>
          )}

          {/* ── Main content (form or success state) ────── */}
          {children}

          {/* ── Inline error ────────────────────────────── */}
          <AnimatePresence>
            {error && (
              <motion.p
                key="auth-error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="mt-3 text-red-500 text-sm text-center"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          {/* ── Footer links ────────────────────────────── */}
          {footer && (
            <div className="mt-4 text-center text-sm text-neutral-200">
              {footer}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
