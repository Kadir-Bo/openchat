"use client";

import React, { useEffect } from "react";
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

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        onClose?.();
      }, autoHideDuration);

      return () => clearTimeout(timer);
    }
  }, [message, autoHideDuration, onClose]);

  const variants = {
    error: "border-red-500/20",
    warning: "border-yellow-500/20",
    info: "border-blue-500/20",
    success: "border-green-500/20",
  };

  const defaultClasses = `
    text-center
    shadow
    bg-black
    rounded-xl
    w-full
    min-w-50
    max-w-80
    border
    bg-neutral-900
    text-white
  `;

  const variantClasses = variants[currentVariant] || variants.error;

  return (
    <motion.div
      key={message}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{
        duration: 0.2,
        ease: "easeInOut",
      }}
      className={twMerge(defaultClasses, className, variantClasses)}
    >
      <div className="flex items-center justify-center gap-2 p-3">
        <p className="text-sm">{message}</p>
      </div>
    </motion.div>
  );
}
