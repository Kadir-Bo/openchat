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
      <h2 className="text-xl font-semibold text-white light:text-neutral-900 light:text-neutral-950 mb-1">
        Delete {title}
      </h2>

      <p className="text-neutral-300 light:text-neutral-800">{description}</p>

      <div className="flex justify-end items-center gap-2 mt-6">
        <PrimaryButton
          className="w-max px-3"
          onClick={closeModal}
          disabled={loading}
        >
          Cancel
        </PrimaryButton>

        <PrimaryButton
          className="w-max px-3 min-w-32 justify-center border-none text-white light:text-neutral-900 light:text-neutral-950 bg-red-600/50 hover:bg-red-700/30 light:bg-red-600/80 light:hover:bg-red-700/80"
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
