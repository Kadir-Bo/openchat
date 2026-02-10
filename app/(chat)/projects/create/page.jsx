"use client";

import { Message, PrimaryButton } from "@/components";
import { useDatabase } from "@/context/DatabaseContext";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

export default function ProjectCreatePage() {
  const router = useRouter();
  const { createProject, loading } = useDatabase();
  const [message, setMessage] = useState("");
  const [messageVariant, setMessageVariant] = useState("error");

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

  const showMessage = (text, variant = "error") => {
    setMessage(text);
    setMessageVariant(variant);
  };

  const handleCreateProject = async () => {
    // Validation
    if (!project.name.trim()) {
      showMessage("Please enter a project name", "error");
      return;
    }

    try {
      const newProject = await createProject({
        title: project.name,
        description: project.description,
      });

      if (newProject) {
        showMessage("Project created successfully!", "success");
        // Navigate after a short delay to show success message
        setTimeout(() => {
          router.push(`/project/${newProject.id}`);
        }, 1000);
      } else {
        showMessage("Failed to create project", "error");
      }
    } catch (error) {
      console.error("Error creating project:", error);
      showMessage("An error occurred while creating the project", "error");
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
        <div className="w-full">
          <label
            htmlFor="project-name"
            className="text-sm text-neutral-400 pl-px"
          >
            What are you working on?
          </label>
          <input
            type="text"
            name="name"
            id="project-name"
            placeholder="Name your Project"
            value={project.name}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            disabled={loading}
            className="w-full border border-neutral-700 placeholder:text-neutral-500 px-2.5 py-2 mt-1.5 rounded-lg bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            autoFocus
          />
        </div>
        <div className="w-full">
          <label
            htmlFor="project-description"
            className="text-sm text-neutral-400 pl-px"
          >
            What are you trying to achieve?
          </label>
          <textarea
            name="description"
            id="project-description"
            placeholder="Describe your project, idea, goals, etc."
            value={project.description}
            onChange={handleInputChange}
            disabled={loading}
            className="resize-none w-full border border-neutral-700 placeholder:text-neutral-500 px-2.5 py-2 mt-1.5 rounded-lg max-h-52 min-h-30 bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
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
        <Message
          message={message}
          variant={messageVariant}
          autoHideDuration={5000}
          onClose={() => setMessage("")}
        />
      </div>
    </div>
  );
}
