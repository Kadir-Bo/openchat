import { useDatabase, useModal } from "@/context";
import React from "react";
import { PrimaryButton } from "@/components";

export default function DeleteProjectsModal({ title, id }) {
  const { loading, deleteProject } = useDatabase();
  const { openMessage, closeModal } = useModal();
  const handleDeleteProject = async () => {
    try {
      const result = await deleteProject(id);

      if (result) {
        openMessage("Project deleted successfully!", "success");
        closeModal();
      } else {
        openMessage("Failed to delete project", "error");
      }
    } catch (error) {
      console.error("Error deleting project:", error);
      openMessage("An error occurred while deleting the project", "error");
    }
  };
  const handleCancel = () => {
    closeModal();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
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
          text="Cancel"
          className="w-max px-3"
          onClick={handleCancel}
          disabled={loading}
        />
        <PrimaryButton
          text={loading ? "Deleting..." : "Delete Project"}
          className="w-max px-3 min-w-34 justify-center border-none ring-none text-white bg-red-700/60 hover:bg-red-700/90 hover:text-white"
          onClick={handleDeleteProject}
          disabled={loading}
          filled
        />
      </div>
    </div>
  );
}
