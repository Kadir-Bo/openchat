"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { twMerge } from "tailwind-merge";

export default function SettingsTextarea({
  id = "",
  label = "label",
  value = "",
  placeholderArray = [],
  placeholder = "",
  ContainerClassName = "",
  InputClassName = "",
  labelClassName = "",
  onChange = () => null,
}) {
  const [currentPlaceholderIndex, setCurrentPlaceholderIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (!placeholder || placeholder.length === 0) return;

    const interval = setInterval(() => {
      if (!isAnimating) {
        setIsAnimating(true);
        setCurrentPlaceholderIndex((prev) => (prev + 1) % placeholder.length);
      }
    }, 3000); // Change placeholder every 3 seconds

    return () => clearInterval(interval);
  }, [placeholder, isAnimating]);

  const handleAnimationComplete = () => {
    // Ensure the placeholder stays visible for at least 0.5s
    setTimeout(() => {
      setIsAnimating(false);
    }, 500);
  };

  return (
    <div className={twMerge("w-full min-w-40 relative", ContainerClassName)}>
      <label
        htmlFor={id}
        className={twMerge(
          "block mb-1.5 text-neutral-300/80 text-sm ml-px",
          labelClassName,
        )}
      >
        {label}
      </label>
      <textarea
        name={id}
        id={id}
        value={value}
        onChange={onChange}
        className={twMerge(
          "border w-full px-3 py-2 rounded-lg border-neutral-600 outline-none focus:ring-1 focus:ring-blue-500/30 resize-none relative bg-transparent",
          InputClassName,
        )}
      ></textarea>
      <AnimatePresence mode="wait">
        {!value && placeholderArray.length > 0 && (
          <motion.span
            key={currentPlaceholderIndex}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 0.4, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.4 }}
            onAnimationComplete={handleAnimationComplete}
            className="absolute z-50 top-7 left-0 pt-2 pl-3 pointer-events-none select-none text-neutral-400"
          >
            {placeholderArray[currentPlaceholderIndex]}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}
