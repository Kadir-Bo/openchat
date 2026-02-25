"use client";

import { PrimaryButton } from "@/components";
import { useModal } from "@/context";
import React, { useState } from "react";

export default function DeleteConfirmModal({ title, description, onConfirm }) {
  const { closeModal } = useModal();
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    try {
      setLoading(true);
      await onConfirm();
      closeModal();
    } catch (error) {
      console.error("Delete failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-white mb-1">Delete {title}</h2>

      <p className="text-neutral-300">{description}</p>

      <div className="flex justify-end items-center gap-2 mt-6">
        <PrimaryButton
          className="w-max px-3"
          onClick={closeModal}
          disabled={loading}
        >
          Cancel
        </PrimaryButton>

        <PrimaryButton
          className="w-max px-3 min-w-32 justify-center border-none text-white bg-red-600/50 hover:bg-red-700/30"
          onClick={handleConfirm}
          disabled={loading}
          filled
        >
          {loading ? "Deleting..." : "Delete"}
        </PrimaryButton>
      </div>
    </div>
  );
}
