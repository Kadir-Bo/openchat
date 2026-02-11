"use client";

import { useDropdown } from "@/context";
import { useOnClickOutside } from "@/hooks";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { twMerge } from "tailwind-merge";

export default function DropdownContent({
  children,
  className = "",
  align = "start", // start, center, end
  side = "top", // top, bottom, left, right
  sideOffset = 4,
  alignOffset = 0,
  ...props
}) {
  const { isOpen, setIsOpen } = useDropdown();
  const [shouldRender, setShouldRender] = useState(false);
  const contentRef = useRef(null);
  const triggerRef = useRef(null);

  useOnClickOutside(contentRef, () => setIsOpen(false));

  useEffect(() => {
    if (!isOpen) {
      setShouldRender(false);
      return;
    }

    const trigger = document.querySelector(
      '[aria-haspopup="true"][aria-expanded="true"]',
    );

    if (trigger) {
      triggerRef.current = trigger;
      requestAnimationFrame(() => {
        setShouldRender(true);
      });
    }
  }, [isOpen]);

  const getPosition = useCallback(() => {
    if (!triggerRef.current || !contentRef.current) {
      return { top: 2, left: 0, minWidth: "auto" };
    }

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const contentRect = contentRef.current.getBoundingClientRect();
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight,
    };

    let top = 2;
    let left = 0;

    switch (side) {
      case "bottom":
        top = triggerRect.bottom + sideOffset;
        break;
      case "top":
        top = triggerRect.top - contentRect.height - sideOffset;
        break;
      case "left":
        left = triggerRect.left - contentRect.width - sideOffset;
        top = triggerRect.top;
        break;
      case "right":
        left = triggerRect.right + sideOffset;
        top = triggerRect.top;
        break;
    }

    if (side === "bottom" || side === "top") {
      switch (align) {
        case "start":
          left = triggerRect.left + alignOffset;
          break;
        case "center":
          left =
            triggerRect.left +
            triggerRect.width / 2 -
            contentRect.width / 2 +
            alignOffset;
          break;
        case "end":
          left = triggerRect.right - contentRect.width + alignOffset;
          break;
      }
    } else {
      switch (align) {
        case "start":
          top = triggerRect.top + alignOffset;
          break;
        case "center":
          top =
            triggerRect.top +
            triggerRect.height / 2 -
            contentRect.height / 2 +
            alignOffset;
          break;
        case "end":
          top = triggerRect.bottom - contentRect.height + alignOffset;
          break;
      }
    }

    // Viewport collision detection
    if (left + contentRect.width > viewport.width) {
      left = viewport.width - contentRect.width - 8;
    }
    if (left < 8) {
      left = 8;
    }
    if (top + contentRect.height > viewport.height + window.scrollY) {
      top = triggerRect.top - contentRect.height - sideOffset;
    }
    if (top < window.scrollY) {
      top = triggerRect.bottom + sideOffset;
    }

    return {
      top,
      left,
      minWidth: triggerRect.width,
    };
  }, [side, align, sideOffset, alignOffset]);

  const [, forceUpdate] = useState({});
  const requestUpdate = useCallback(() => {
    forceUpdate({});
  }, []);

  useEffect(() => {
    if (!isOpen || !shouldRender) return;

    window.addEventListener("resize", requestUpdate);
    window.addEventListener("scroll", requestUpdate, true);

    return () => {
      window.removeEventListener("resize", requestUpdate);
      window.removeEventListener("scroll", requestUpdate, true);
    };
  }, [isOpen, shouldRender, requestUpdate]);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, setIsOpen]);

  const defaultClasses = `
    bg-neutral-900
    border
    border-neutral-500/30
    rounded-xl
    shadow-lg
    overflow-hidden
    p-1.5
  `;

  if (!isOpen) return null;

  const position = getPosition();
  const { top, left, minWidth } = position;

  const content = (
    <AnimatePresence>
      <motion.div
        ref={contentRef}
        initial={{ opacity: 0 }}
        animate={{
          opacity: shouldRender ? 1 : 0,
        }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        className={twMerge(defaultClasses, className)}
        style={{
          position: "fixed",
          top: `${top}px`,
          left: `${left}px`,
          zIndex: 9999,
          minWidth: typeof minWidth === "number" ? `${minWidth}px` : minWidth,
        }}
        {...props}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );

  return typeof window !== "undefined"
    ? createPortal(content, document.body)
    : null;
}
