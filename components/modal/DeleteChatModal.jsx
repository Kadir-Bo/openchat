"use client";

import { useDatabase, useModal } from "@/context";
import React from "react";
import { PrimaryButton } from "@/components";
import { useParams, useRouter } from "next/navigation";

export default function DeleteChatModal({ title, id }) {
  const { loading, deleteConversation } = useDatabase();
  const { openMessage, closeModal } = useModal();
  const params = useParams();
  const router = useRouter();

  const handleDeleteChat = async () => {
    try {
      const result = await deleteConversation(id);

      if (result) {
        openMessage("Chat deleted successfully!", "success");
        closeModal();

        if (params?.chatId === id) {
          router.push("/chat");
        }
      } else {
        openMessage("Failed to delete Chat", "error");
      }
    } catch (error) {
      console.error("Error deleting Chat:", error);
      openMessage("An error occurred while deleting the Chat", "error");
    }
  };

  const handleCancel = () => {
    closeModal();
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-white mb-1">Delete Chat</h2>
      <p className="text-neutral-300">
        Are you sure you want to delete{" "}
        <span className="font-semibold text-white">&quot;{title}&quot;</span>?
      </p>
      <p className="text-sm text-neutral-400">
        All conversations and documents associated with this Chat will also be
        removed.
      </p>
      <div className="flex justify-end items-center gap-2 mt-4">
        <PrimaryButton
          text="Cancel"
          className="w-max px-3"
          onClick={handleCancel}
          disabled={loading}
        />
        <PrimaryButton
          text={loading ? "Deleting..." : "Delete Chat"}
          className="w-max px-3 min-w-34 justify-center border-none ring-none text-white bg-red-600/50 hover:bg-red-700/30 hover:text-white"
          onClick={handleDeleteChat}
          disabled={loading}
          filled
        />
      </div>
    </div>
  );
}
