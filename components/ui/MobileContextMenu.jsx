"use client";

import clsx from "clsx";
import { motion } from "framer-motion";
import { useLayoutEffect, useRef, useState } from "react";
import { copyToClipboard } from "@/lib";

export default function MobileContextMenu({
  actions,
  bubbleRef,
  isUser,
  onClose,
}) {
  const menuRef = useRef(null);
  const [pos, setPos] = useState(null);

  useLayoutEffect(() => {
    if (!bubbleRef.current || !menuRef.current) return;

    const bRect = bubbleRef.current.getBoundingClientRect();
    const menuHeight = menuRef.current.offsetHeight;
    const menuWidth = menuRef.current.offsetWidth;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const GAP = 12;

    const spaceAbove = bRect.top;
    const spaceBelow = vh - bRect.bottom;
    const canFitAbove = spaceAbove >= menuHeight + GAP;
    const canFitBelow = spaceBelow >= menuHeight + GAP;
    const showAbove = canFitAbove && (!canFitBelow || spaceAbove > spaceBelow);

    let left;
    if (isUser) {
      left = bRect.right - menuWidth;
    } else {
      left = bRect.left;
    }
    left = Math.max(8, Math.min(left, vw - menuWidth - 8));

    setPos({
      top: showAbove ? bRect.top - menuHeight - GAP : bRect.bottom + GAP,
      left,
    });
  }, [bubbleRef, isUser]);

  useLayoutEffect(() => {
    const handler = (e) => {
      if (
        !menuRef.current?.contains(e.target) &&
        !bubbleRef.current?.contains(e.target)
      ) {
        onClose();
      }
    };
    const t = setTimeout(() => {
      document.addEventListener("mousedown", handler);
      document.addEventListener("touchstart", handler);
    }, 50);
    return () => {
      clearTimeout(t);
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, [onClose, bubbleRef]);

  return (
    <motion.div
      ref={menuRef}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: pos ? 1 : 0, scale: pos ? 1 : 0.9 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ type: "spring", duration: 0.25, bounce: 0.2 }}
      style={{
        position: "fixed",
        zIndex: 9999,
        top: pos?.top ?? 0,
        left: pos?.left ?? 0,
        minWidth: 180,
        visibility: pos ? "visible" : "hidden",
        transformOrigin: isUser ? "top right" : "top left",
      }}
      className="bg-neutral-800/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
    >
      {actions.map(({ id, Icon, title, onClick, copyText }, i) => (
        <button
          key={id}
          onPointerDown={(e) => {
            e.stopPropagation();
            // Copy must happen synchronously inside the gesture for iOS
            if (copyText) {
              copyToClipboard(copyText);
            }
            onClick();
            onClose();
          }}
          className={clsx(
            "flex items-center gap-3 w-full px-4 py-3.5 text-sm text-left",
            "text-neutral-100 active:bg-white/10 transition-colors select-none",
            i !== 0 && "border-t border-white/5",
          )}
        >
          <Icon size={15} className="opacity-70 flex-shrink-0" />
          <span className="font-medium">{title}</span>
        </button>
      ))}
    </motion.div>
  );
}
