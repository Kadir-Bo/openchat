"use client";

import React, { useState } from "react";
import { useAuth, useModal } from "@/context";
import { PrimaryButton } from "@/components";

export default function DeleteAccountModal() {
  const { logout, user } = useAuth();
  const { closeModal, openMessage } = useModal();
  const [confirmText, setConfirmText] = useState("");

  const handleDeleteAccount = async () => {
    try {
      // Delete account logic here
      openMessage("Account deleted successfully", "success");
      closeModal();
      await logout();
    } catch (error) {
      openMessage("Failed to delete account", "error");
    }
  };

  const isConfirmed = confirmText === user?.email;

  return (
    <div>
      <h2 className="text-xl font-semibold text-white mb-1">Delete Account</h2>
      <p className="text-neutral-300">
        This action is{" "}
        <span className="text-red-400 font-medium">permanent</span> and cannot
        be undone. All your data including conversations, projects, and settings
        will be deleted.
      </p>
      <div className="flex flex-col gap-2 mt-4">
        <label className="text-sm text-neutral-400">
          Type <span className="text-white font-medium">{user?.email}</span> to
          confirm
        </label>
        <input
          type="text"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          className="w-full bg-neutral-900 text-white px-3 py-2 rounded-lg border border-neutral-700 focus:border-neutral-500 outline-none text-sm"
          placeholder={user?.email}
        />
      </div>
      <div className="flex justify-end items-center gap-2 mt-4">
        <PrimaryButton className="w-max px-3" onClick={closeModal}>
          Cancel
        </PrimaryButton>
        <PrimaryButton
          className="w-max px-3 min-w-34 justify-center border-none text-white bg-red-700/60 hover:bg-red-700/90 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
          onClick={handleDeleteAccount}
          disabled={!isConfirmed}
          filled
        >
          Delete Account
        </PrimaryButton>
      </div>
    </div>
  );
}
