"use client";

import React, { useState } from "react";
import { formatDate } from "@/lib";
import { motion, AnimatePresence } from "framer-motion";
import { Dropdown, useDatabase, useModal } from "@/context";

import {
  DropdownContent,
  DropdownItem,
  DropdownTrigger,
  ProjectsDeleteModal,
  ProjectsRenameModal,
} from "@/components";

import { Archive, Edit2, MoreHorizontal, Trash } from "react-feather";
import { useRouter } from "next/navigation";

export default function ProjectCard({ project, sort }) {
  const { title, description, updatedAt, createdAt, id } = project;
  const { toggleArchiveProject } = useDatabase();
  const { openModal, openMessage } = useModal();
  const router = useRouter();

  const handleRenameProject = () => {
    return openModal(
      <ProjectsRenameModal title={title} description={description} id={id} />,
    );
  };

  const handleArchiveProject = async () => {
    const result = await toggleArchiveProject(id);
    if (result) {
      openMessage("Project archived", "success");
    }
  };

  const handleDeleteProject = () => {
    return openModal(<ProjectsDeleteModal title={title} id={id} />);
  };

  const handleNavigateToProject = () => {
    router.push(`project/${id}`);
  };

  const ProjectDropDownMenu = [
    {
      id: "rename-project",
      label: "Umbenennen",
      icon: Edit2,
      action: () => handleRenameProject(),
    },
    {
      id: "archive-project",
      label: "Archivieren",
      icon: Archive,
      action: () => handleArchiveProject(),
    },
    {
      id: "delete-project",
      label: "Löschen",
      icon: Trash,
      action: () => handleDeleteProject(),
    },
  ];

  return (
    <AnimatePresence mode="wait">
      <motion.div
        className="relative flex flex-col gap-4 w-full border p-4 rounded-xl border-neutral-500/20 hover:border-neutral-500/50 cursor-pointer bg-neutral-950/10 hover:bg-neutral-950 shadow shadow-neutral-950/10 hover:shadow-neutral-950/50"
        onClick={handleNavigateToProject}
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
        <Dropdown>
          <DropdownTrigger className="absolute top-0 right-0 p-3">
            <MoreHorizontal size={17} />
          </DropdownTrigger>

          <DropdownContent
            side="right"
            className="-translate-x-2 translate-y-1"
            sideOffset={0}
          >
            {ProjectDropDownMenu.map((menuItem) => (
              <DropdownItem
                key={menuItem.id}
                onClick={(e) => {
                  e.stopPropagation();
                  menuItem.action();
                }}
              >
                <menuItem.icon size={15} strokeWidth={1.5} />
                {menuItem.label}
              </DropdownItem>
            ))}
          </DropdownContent>
        </Dropdown>
      </motion.div>
    </AnimatePresence>
  );
}
