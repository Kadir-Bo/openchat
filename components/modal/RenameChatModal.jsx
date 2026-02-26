"use client";

import { useDatabase, useModal } from "@/context";
import React, { useState } from "react";
import { PrimaryButton } from "@/components";

export default function RenameChatModal({ title, id }) {
  const { loading, updateConversation } = useDatabase();
  const { openMessage, closeModal } = useModal();
  const [newTitle, setNewTitle] = useState(title);

  const handleRenameChat = async () => {
    if (!newTitle.trim()) {
      openMessage("Title cannot be empty", "error");
      return;
    }

    if (newTitle.trim() === title) {
      closeModal();
      return;
    }

    try {
      const result = await updateConversation(id, { title: newTitle.trim() });

      if (result) {
        openMessage("Chat renamed successfully!", "success");
        closeModal();
      } else {
        openMessage("Failed to rename chat", "error");
      }
    } catch (error) {
      console.error("Error renaming chat:", error);
      openMessage("An error occurred while renaming the chat", "error");
    }
  };

  const handleCancel = () => {
    closeModal();
  };
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleRenameChat();
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-white mb-4">Rename Chat</h2>
      <div className="mb-4">
        <label className="block text-sm text-neutral-400 mb-2">
          Chat Title
        </label>
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full bg-neutral-900 text-white px-3 py-2 rounded-lg border border-neutral-700 focus:border-neutral-500 outline-none"
          placeholder="Enter chat title"
          autoFocus
        />
      </div>
      <div className="flex justify-end items-center gap-2">
        <PrimaryButton
          className="w-max px-3"
          onClick={handleCancel}
          disabled={loading}
        >
          Cancel
        </PrimaryButton>
        <PrimaryButton
          className="w-max px-3 min-w-24 justify-center"
          onClick={handleRenameChat}
          disabled={loading}
          filled
        >
          {loading ? "Saving..." : "Save"}
        </PrimaryButton>
      </div>
    </div>
  );
}
