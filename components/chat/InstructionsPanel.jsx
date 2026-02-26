"use client";

import { useRef, useState } from "react";
import { Icon } from "..";
import { ChevronDown } from "react-feather";
import { motion, AnimatePresence } from "framer-motion";
import { useIsMobile } from "@/hooks";

export default function InstructionsPanel({ project, onSave }) {
  const [draft, setDraft] = useState(project.instructions ?? "");
  const [status, setStatus] = useState("idle");
  const saveTimer = useRef(null);
  const isMobile = useIsMobile();
  const [isExpanded, setIsExpanded] = useState(true);

  const triggerSave = (value) => {
    clearTimeout(saveTimer.current);
    setStatus("saving");
    saveTimer.current = setTimeout(async () => {
      await onSave({ instructions: value.trim() });
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 1500);
    }, 800);
  };

  const handleChange = (e) => {
    setDraft(e.target.value);
    triggerSave(e.target.value);
  };

  return (
    <div>
      <div className="flex justify-between items-center p-4 md:px-6 md:pt-6 md:pb-4">
        <div className="flex justify-between w-full">
          <div className="flex flex-col gap-1">
            <h3 className="text-sm font-medium text-neutral-100">
              Instructions
            </h3>
            <p className="text-neutral-500 text-xs">
              Tailor responses for this project
            </p>
          </div>
          <button
            className="p-2 md:hidden"
            onClick={() => setIsExpanded((p) => !p)}
          >
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
            >
              <Icon name={ChevronDown} size="sm" />
            </motion.div>
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            key="instructions"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="px-3 md:px-4 pb-5 relative">
              <textarea
                value={draft}
                onChange={handleChange}
                placeholder="e.g. Always reply in English. Use TypeScript. Be concise."
                rows={5}
                className="w-full bg-transparent border border-neutral-800 hover:border-neutral-700 focus:border-neutral-600 rounded-xl p-3.5 text-sm text-neutral-300 placeholder-neutral-700 resize-none outline-none transition-colors leading-relaxed"
              />
              <motion.span
                animate={{ opacity: status === "idle" ? 0 : 1 }}
                transition={{ duration: 0.3 }}
                className={`text-xs absolute bottom-10 right-8 ${
                  status === "saved" ? "text-emerald-500" : "text-neutral-500"
                }`}
              >
                {status === "saving" ? "Saving…" : "Saved"}
              </motion.span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
