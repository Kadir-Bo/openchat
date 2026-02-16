"use client";

import React, { useState } from "react";
import { formatDate } from "@/lib";
import { motion, AnimatePresence } from "framer-motion";
import { useDatabase, useModal } from "@/context";

import {
  DropdownMenu,
  ProjectsDeleteModal,
  ProjectsRenameModal,
} from "@/components";

import { Archive, Edit2, MoreHorizontal, Trash } from "react-feather";
import { useRouter } from "next/navigation";
import { twMerge } from "tailwind-merge";

export default function ProjectCard({ project, sort }) {
  const { title, description, updatedAt, createdAt, id } = project;
  const { toggleArchiveProject } = useDatabase();
  const { openModal, openMessage } = useModal();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const router = useRouter();

  const handleRenameProject = (id) => {
    return openModal(
      <ProjectsRenameModal title={title} description={description} id={id} />,
    );
  };

  const handleArchiveProject = async (id) => {
    const result = await toggleArchiveProject(id);
    if (result) {
      openMessage("Project archived", "success");
    }
  };

  const handleDeleteProject = (id) => {
    return openModal(<ProjectsDeleteModal title={title} id={id} />);
  };

  const handleNavigateToProject = (id) => {
    router.push(`project/${id}`);
  };

  const ProjectDropDownMenu = [
    {
      id: "rename-project",
      label: "Umbenennen",
      icon: Edit2,
      action: () => handleRenameProject(id),
    },
    {
      id: "archive-project",
      label: "Archivieren",
      icon: Archive,
      action: () => handleArchiveProject(id),
    },
    {
      id: "delete-project",
      label: "Löschen",
      icon: Trash,
      action: () => handleDeleteProject(id),
    },
  ];

  const cardClasses = twMerge(
    "group relative flex flex-col gap-4 w-full border p-4 rounded-xl border-neutral-500/20 cursor-pointer bg-neutral-950/10 shadow shadow-neutral-950/10 transition-all duration-150",
    "hover:border-neutral-500/50 hover:bg-neutral-950 hover:shadow-neutral-950/50",
    "focus-within:border-neutral-500/50 focus-within:bg-neutral-950 focus-within:shadow-neutral-950/50",
    isDropdownOpen &&
      "border-neutral-500/50 bg-neutral-950 shadow-neutral-950/50",
  );

  return (
    <AnimatePresence mode="wait">
      <motion.div
        className={cardClasses}
        onClick={() => handleNavigateToProject(id)}
        exit={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        layout
      >
        <div>
          <span className="font-medium">{title}</span>
          <p className="max-h-24 overflow-hidden mt-2 text-neutral-400">
            {description}
          </p>
        </div>
        <div className="flex justify-between items-center text-sm text-neutral-500">
          {sort === "date" ? (
            <span>Created: {formatDate(createdAt)}</span>
          ) : (
            <span>Updated: {formatDate(updatedAt)}</span>
          )}
        </div>
        <DropdownMenu
          dropdownList={ProjectDropDownMenu}
          triggerClassName="p-4 absolute top-0 right-0"
          contentSide="right"
          contentClassName="-translate-x-2 translate-y-1"
          contentSideOffset={0}
          onOpenChange={setIsDropdownOpen}
          onClick={(e, menuItem) => {
            e.stopPropagation();
            menuItem.action();
          }}
        />
      </motion.div>
    </AnimatePresence>
  );
}
