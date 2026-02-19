"use client";

import React, { useState } from "react";
import { PrimaryButton, Input, Textarea } from "@/components";
import { useDatabase, useModal } from "@/context";

export default function RenameProjectModal({ title, description, id }) {
  const { closeModal, openMessage } = useModal();
  const { updateProject, loading } = useDatabase();

  const [project, setProject] = useState({
    name: title || "",
    description: description || "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProject((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleUpdateProject = async () => {
    // Validation
    if (!project.name.trim()) {
      openMessage("Please enter a project name", "error");
      return;
    }

    try {
      // Updates object that matches your Firestore schema
      const updates = {
        title: project.name,
        description: project.description,
      };

      const result = await updateProject(id, updates);

      if (result) {
        openMessage("Project updated successfully!", "success");
        closeModal();
      } else {
        openMessage("Failed to update project", "error");
      }
    } catch (error) {
      console.error("Error updating project:", error);
      openMessage("An error occurred while updating the project", "error");
    }
  };

  const handleCancel = () => {
    closeModal();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleUpdateProject();
    }
  };

  return (
    <div className="flex flex-col gap-4" onKeyDown={handleKeyDown}>
      <h3 className="text-xl font-medium mb-2">Rename Project</h3>

      <Input
        id="project-name"
        name="name"
        label="Project Name"
        value={project.name}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        disabled={loading}
        placeholder="Enter project name"
        autoFocus
      />

      <Textarea
        id="project-description"
        name="description"
        label="Description"
        value={project.description}
        onChange={handleInputChange}
        disabled={loading}
        containerClassName="mt-2"
        placeholder="Enter project description"
        rows={4}
      />

      <div className="flex justify-end items-center gap-2 mt-4">
        <PrimaryButton
          text="Cancel"
          className="w-max px-3"
          onClick={handleCancel}
          disabled={loading}
        />
        <PrimaryButton
          text={loading ? "Updating..." : "Update Project"}
          className="w-max px-3 min-w-34 justify-center"
          onClick={handleUpdateProject}
          disabled={loading || !project.name.trim()}
          filled
        />
      </div>
    </div>
  );
}
