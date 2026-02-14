import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { twMerge } from "tailwind-merge";

export default function Message({
  message,
  className = "",
  variant = null,
  onClose = null,
  autoHideDuration = 3000,
}) {
  // Auto-detect variant based on message content
  const detectVariant = (msg) => {
    if (!msg) return "error";
    const lowerMsg = msg.toLowerCase();

    if (
      lowerMsg.includes("success") ||
      lowerMsg.includes("created") ||
      lowerMsg.includes("saved")
    ) {
      return "success";
    }
    if (lowerMsg.includes("warning") || lowerMsg.includes("caution")) {
      return "warning";
    }
    if (lowerMsg.includes("info") || lowerMsg.includes("note")) {
      return "info";
    }
    return "error";
  };

  const currentVariant = variant || detectVariant(message);

  React.useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        onClose?.();
      }, autoHideDuration);

      return () => clearTimeout(timer);
    }
  }, [message, autoHideDuration, onClose]);

  const variants = {
    error: "border-red-500/10 bg-red-950/20 text-red-400",
    warning: "border-yellow-500/10 bg-yellow-950/20 text-yellow-400",
    info: "border-blue-500/10 bg-blue-950/20 text-blue-400",
    success: "border-green-500/10 bg-green-950/20 text-green-400",
  };

  const defaultClasses = `
    border
    rounded-lg
    max-w-sm
    mx-auto
    min-w-xs
    p-3
    text-center
    shadow
  `;

  const variantClasses = variants[currentVariant] || variants.error;

  return (
    <AnimatePresence mode="wait">
      {message && (
        <motion.div
          key={message}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{
            duration: 0.3,
            ease: "easeInOut",
          }}
          className={twMerge(defaultClasses, variantClasses, className)}
        >
          <div className="flex items-center justify-center gap-2">
            <p className="text-sm">{message}</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
