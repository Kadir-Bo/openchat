"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useDatabase } from "@/context";
import { MemoryItem, PrimaryButton } from "@/components";
import { Plus, Info } from "react-feather";
import { motion, AnimatePresence } from "framer-motion";
import { generateId } from "@/lib";

function PrivacySettingsPage() {
  const { getUserProfile, updateUserProfile, loading } = useDatabase();

  const [memories, setMemories] = useState([]);
  const [newMemory, setNewMemory] = useState("");
  const [isProfileLoading, setIsProfileLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      setIsProfileLoading(true);
      let profile = null;
      let attempts = 0;

      while (!profile && attempts < 5) {
        profile = await getUserProfile();
        if (!profile) {
          attempts++;
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      }

      if (profile) {
        setMemories(profile.memories || []);
      }

      setIsProfileLoading(false);
    };

    loadProfile();
  }, [getUserProfile]);

  const handleAddMemory = useCallback(async () => {
    if (!newMemory.trim()) return;

    const newEntry = {
      id: generateId(),
      text: newMemory.trim(),
      createdAt: new Date().toISOString(),
    };

    const updated = [...memories, newEntry];
    setMemories(updated);
    setNewMemory("");
    await updateUserProfile({ memories: updated });
  }, [newMemory, memories, updateUserProfile]);

  const handleDeleteMemory = useCallback(
    async (id) => {
      const updated = memories.filter((m) => m.id !== id);
      setMemories(updated);
      await updateUserProfile({ memories: updated });
    },
    [memories, updateUserProfile],
  );

  const handleUpdateMemory = useCallback(
    async (id, newText) => {
      const updated = memories.map((m) =>
        m.id === id
          ? { ...m, text: newText, updatedAt: new Date().toISOString() }
          : m,
      );
      setMemories(updated);
      await updateUserProfile({ memories: updated });
    },
    [memories, updateUserProfile],
  );

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAddMemory();
    }
  };

  if (isProfileLoading) return null;

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-5">
        <h4 className="font-medium">Data & Privacy</h4>
        <div className="flex flex-col gap-3 p-4 rounded-xl border border-neutral-800 bg-neutral-900/30">
          <div className="flex items-start gap-3">
            <Info size={16} className="text-neutral-400 mt-0.5 shrink-0" />
            <div className="flex flex-col gap-2">
              <p className="text-sm text-neutral-300 font-medium">
                How your data is used
              </p>
              <p className="text-sm text-neutral-400 leading-relaxed">
                Your conversations and interactions may be used to improve our
                AI models and services. This includes messages you send,
                feedback you provide, and how you interact with the assistant.
              </p>
              <p className="text-sm text-neutral-400 leading-relaxed">
                We do not sell your personal data to third parties. Data is
                processed in accordance with our privacy policy and applicable
                data protection regulations.
              </p>
            </div>
          </div>
        </div>
      </div>

      <hr className="text-neutral-700" />

      <div className="flex flex-col gap-5">
        <div>
          <h4 className="font-medium">Memories</h4>
          <p className="text-sm text-neutral-400 mt-1">
            Information the assistant remembers about you across conversations.
          </p>
        </div>

        <div className="flex flex-col gap-3 p-4 rounded-xl border border-neutral-800 bg-neutral-900/30">
          <div className="flex gap-2 items-end">
            <textarea
              value={newMemory}
              onChange={(e) => setNewMemory(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g. I prefer concise answers... (Shift+Enter for new line)"
              rows={Math.max(1, newMemory.split("\n").length)}
              className="flex-1 bg-neutral-900 text-white text-sm px-3 py-2 rounded-lg border border-neutral-700 focus:border-neutral-500 outline-none placeholder:text-neutral-600 resize-none"
            />
            <PrimaryButton
              text="Add"
              className="w-max px-3 justify-center shrink-0"
              onClick={handleAddMemory}
              disabled={!newMemory.trim() || loading}
            >
              <Plus size={15} />
            </PrimaryButton>
          </div>

          <div className="flex flex-col gap-2 mt-1">
            <AnimatePresence initial={false}>
              {memories.length > 0 ? (
                memories.map((memory) => (
                  <motion.div
                    key={memory.id}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <MemoryItem
                      memory={memory}
                      onDelete={handleDeleteMemory}
                      onUpdate={handleUpdateMemory}
                    />
                  </motion.div>
                ))
              ) : (
                <div>
                  <p className="text-sm text-neutral-600 text-center py-4">
                    No memories yet. Add something the assistant should remember
                    about you.
                  </p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PrivacySettingsPage;
