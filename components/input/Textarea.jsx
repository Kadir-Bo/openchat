"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { twMerge } from "tailwind-merge";
import { Lock } from "react-feather";

export default function Textarea({
  id = "",
  name = "",
  label = "label",
  value = "",
  placeholderArray = [],
  placeholder = "",
  disabled = false,
  autoFocus = false,
  locked = false,
  containerClassName = "",
  inputClassName = "",
  labelClassName = "",
  rows = 4,
  maxLength,
  onChange = () => null,
  onKeyDown = () => null,
  onBlur = () => null,
  onFocus = () => null,
}) {
  const [currentPlaceholderIndex, setCurrentPlaceholderIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (!placeholderArray || placeholderArray.length === 0) return;

    const interval = setInterval(() => {
      if (!isAnimating) {
        setIsAnimating(true);
        setCurrentPlaceholderIndex(
          (prev) => (prev + 1) % placeholderArray.length,
        );
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [placeholderArray, isAnimating]);

  const handleAnimationComplete = () => {
    setTimeout(() => {
      setIsAnimating(false);
    }, 500);
  };

  const lockedClasses = locked && "opacity-50 cursor-not-allowed";

  return (
    <div
      className={twMerge(
        "w-full min-w-40 relative",
        containerClassName,
        lockedClasses,
      )}
    >
      <label
        htmlFor={id}
        className={twMerge(
          "mb-1.5 text-neutral-400 text-sm ml-px flex gap-1 items-center justify-start pl-px",
          labelClassName,
          lockedClasses,
        )}
      >
        {label}
        {locked && <Lock className="text-neutral-500" size={13} />}
      </label>
      <textarea
        name={name || id}
        id={id}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        onBlur={onBlur}
        onFocus={onFocus}
        placeholder={placeholder}
        disabled={disabled}
        autoFocus={autoFocus}
        rows={rows}
        maxLength={maxLength}
        className={twMerge(
          "border w-full px-3 py-2 rounded-lg border-neutral-700 outline-none focus:ring-1 focus:ring-blue-500/30 resize-none bg-transparent placeholder:text-neutral-500 disabled:opacity-50 disabled:cursor-not-allowed",
          inputClassName,
          lockedClasses,
        )}
      />
      <AnimatePresence mode="wait">
        {!value && placeholderArray.length > 0 && (
          <motion.span
            key={currentPlaceholderIndex}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 0.4, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.4 }}
            onAnimationComplete={handleAnimationComplete}
            className="absolute z-50 top-12 md:top-7 left-0 pt-2 pl-3 pointer-events-none select-none text-neutral-400"
          >
            {placeholderArray[currentPlaceholderIndex]}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}
