"use client";

import { useDatabase, useModal } from "@/context";
import React, { useRef } from "react";
import { PrimaryButton } from "@/components";

export default function DeleteProjectModal({ title, id, onDeleted }) {
  const { loading, deleteProject } = useDatabase();
  const { openMessage, closeModal } = useModal();

  // Prevents double-firing from onClick + onKeyDown + button focus Enter
  const isDeleting = useRef(false);

  const handleDeleteProject = async () => {
    if (isDeleting.current) return;
    isDeleting.current = true;
    try {
      const result = await deleteProject(id);
      if (result) {
        openMessage("Project deleted successfully!", "success");
        onDeleted?.(id);
        closeModal();
      } else {
        openMessage("Failed to delete project", "error");
      }
    } catch (error) {
      console.error("Error deleting project:", error);
      openMessage("An error occurred while deleting the project", "error");
    } finally {
      isDeleting.current = false;
    }
  };

  const handleCancel = () => closeModal();

  const handleKeyDown = (e) => {
    if (
      e.key === "Enter" &&
      !e.shiftKey &&
      e.target?.dataset?.action === "confirm-delete"
    ) {
      e.preventDefault();
      handleDeleteProject();
    }
  };

  return (
    <div onKeyDown={handleKeyDown}>
      <h2 className="text-xl font-semibold text-white mb-1">Delete Project</h2>
      <p className="text-neutral-300">
        Are you sure you want to delete{" "}
        <span className="font-semibold text-white">&quot;{title}&quot;</span>?
      </p>
      <p className="text-sm text-neutral-400">
        All conversations and documents associated with this project will also
        be removed.
      </p>
      <div className="flex justify-end items-center gap-2 mt-4">
        <PrimaryButton
          className="w-max px-3"
          onClick={handleCancel}
          disabled={loading}
        >
          Cancel
        </PrimaryButton>
        <PrimaryButton
          data-action="confirm-delete"
          className="w-max px-3 min-w-34 justify-center border-none ring-none text-white bg-red-700/60 hover:bg-red-700/90 hover:text-white"
          onClick={handleDeleteProject}
          disabled={loading}
          filled
        >
          {loading ? "Deleting..." : "Delete Project"}
        </PrimaryButton>
      </div>
    </div>
  );
}
