"use client";

import React, { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { twMerge } from "tailwind-merge";

export default function DropDownMenu({
  trigger,
  children,
  className = "",
  menuClassName = "",
  closeOnClick = true,
  ...props
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const toggleDropdown = () => {
    setIsOpen((prev) => !prev);
  };

  const closeDropdown = () => {
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const menuVariants = {
    hidden: { opacity: 0, y: 10, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: 10, scale: 0.95 },
  };

  const defaultContainerClasses = "mt-auto relative";

  const defaultMenuClasses = `
    absolute
    bottom-full
    left-0
    w-full
    mb-2
    bg-neutral-900
    border
    border-neutral-500/30
    rounded-lg
    shadow-lg
    overflow-hidden
  `;

  // Handle clicks inside the menu
  const handleMenuClick = (e) => {
    if (closeOnClick) {
      closeDropdown();
    }
  };

  return (
    <div
      className={twMerge(defaultContainerClasses, className)}
      ref={dropdownRef}
      {...props}
    >
      <div onClick={toggleDropdown}>{trigger}</div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            variants={menuVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.15, ease: "easeOut" }}
            className={twMerge(defaultMenuClasses, menuClassName)}
            onClick={handleMenuClick}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
