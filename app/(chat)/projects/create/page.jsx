"use client";

import { PrimaryButton, Input, Textarea } from "@/components";
import { useDatabase } from "@/context/DatabaseContext";
import { useModal } from "@/context/ModalContext";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

export default function ProjectCreatePage() {
  const router = useRouter();
  const { createProject, loading } = useDatabase();
  const { openMessage } = useModal();

  const [project, setProject] = useState({
    name: "",
    description: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProject((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCreateProject = async () => {
    // Validation
    if (!project.name.trim()) {
      openMessage("Please enter a project name", "error");
      return;
    }

    try {
      const newProject = await createProject({
        title: project.name,
        description: project.description,
      });

      if (newProject) {
        openMessage("Project created successfully!", "success");
        // Navigate after a short delay to show success message
        setTimeout(() => {
          router.push(`/project/${newProject.id}`);
        }, 1000);
      } else {
        openMessage("Failed to create project", "error");
      }
    } catch (error) {
      console.error("Error creating project:", error);
      openMessage("An error occurred while creating the project", "error");
    }
  };

  const handleCancel = () => {
    router.push("/projects");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && e.metaKey) {
      handleCreateProject();
    }
  };

  return (
    <div className="max-w-md mx-auto h-full flex flex-col gap-8 items-center justify-start pt-20">
      <div className="flex flex-col gap-2 w-full">
        <h3 className="text-2xl">Create Project</h3>
        <p className="text-neutral-400">
          Get started by adding a title and description
        </p>
      </div>
      <div className="flex flex-col gap-4 w-full">
        <Input
          id="project-name"
          name="name"
          label="What are you working on?"
          placeholder="Name your Project"
          value={project.name}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          disabled={loading}
          autoFocus
        />

        <Textarea
          id="project-description"
          name="description"
          label="What are you trying to achieve?"
          placeholder="Describe your project, idea, goals, etc."
          value={project.description}
          onChange={handleInputChange}
          disabled={loading}
          rows={6}
          inputClassName="max-h-52 min-h-30"
        />

        <div className="flex justify-end items-center gap-2 mt-4">
          <PrimaryButton
            text="Cancel"
            className="w-max px-3"
            onClick={handleCancel}
            disabled={loading}
          />
          <PrimaryButton
            text={loading ? "Creating..." : "Create Project"}
            className="w-max px-3 min-w-34 justify-center"
            onClick={handleCreateProject}
            disabled={loading || !project.name.trim()}
            filled
          />
        </div>
      </div>
    </div>
  );
}
