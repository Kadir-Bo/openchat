"use client";

import { useRef, useState } from "react";

export default function InstructionsPanel({ project, onSave }) {
  const [draft, setDraft] = useState(project.instructions ?? "");
  const [status, setStatus] = useState("idle"); // "idle" | "saving" | "saved"
  const saveTimer = useRef(null);

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
      <div className="flex justify-between items-center px-6 pt-6 pb-4">
        <div className="flex flex-col gap-1">
          <h3 className="text-sm font-medium text-neutral-100">Instructions</h3>
          <p className="text-neutral-500 text-xs">
            Tailor responses for this project
          </p>
        </div>
        <span
          className={`text-xs transition-opacity duration-300 ${
            status === "idle" ? "opacity-0" : "opacity-100"
          } ${status === "saved" ? "text-emerald-500" : "text-neutral-500"}`}
        >
          {status === "saving" ? "Saving…" : "Saved"}
        </span>
      </div>

      <div className="px-4 pb-5">
        <textarea
          value={draft}
          onChange={handleChange}
          placeholder="e.g. Always reply in English. Use TypeScript. Be concise."
          rows={5}
          className="w-full bg-transparent border border-neutral-800 hover:border-neutral-700 focus:border-neutral-600 rounded-xl p-3.5 text-sm text-neutral-300 placeholder-neutral-700 resize-none outline-none transition-colors leading-relaxed"
        />
      </div>
    </div>
  );
}
