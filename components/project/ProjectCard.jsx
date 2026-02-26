"use client";

import React, { useState } from "react";
import { formatDate } from "@/lib";
import { useDatabase, useModal } from "@/context";
import {
  DropdownMenu,
  RenameProjectModal,
  DeleteConfirmModal,
} from "@/components";
import { Archive, Edit2, Trash } from "react-feather";
import { twMerge } from "tailwind-merge";

export default function ProjectCard({
  project,
  sort,
  isSelected = false,
  onCardClick = () => null,
}) {
  const { title, description, updatedAt, createdAt, id, isArchived } = project;
  const { toggleArchiveProject, deleteProject } = useDatabase();
  const { openModal, openMessage } = useModal();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleArchiveProject = async () => {
    const result = await toggleArchiveProject(id, !project.isArchived);
    if (result) openMessage("Project archived", "success");
  };

  const handleDeleteProject = async (id) => {
    const result = await deleteProject(id);
    if (result) {
      openMessage("Chat deleted", "success");
    }
  };
  const ProjectDropDownMenu = [
    {
      id: "rename-project",
      label: "Umbenennen",
      icon: Edit2,
      action: () =>
        openModal(
          <RenameProjectModal
            title={title}
            description={description}
            id={id}
          />,
        ),
    },
    {
      id: "archive-project",
      label: isArchived ? "Dearchivieren" : "Archivieren",
      icon: Archive,
      action: handleArchiveProject,
    },
    {
      id: "delete-project",
      label: "Löschen",
      icon: Trash,
      action: () =>
        openModal(
          <DeleteConfirmModal
            title={title}
            description={`Are you sure you want to delete the project "${title}"? This action cannot be undone.`}
            onConfirm={() => handleDeleteProject(id)}
          />,
        ),
    },
  ];

  const handleClick = (e) => {
    if (e.defaultPrevented) return;
    if (e.metaKey || e.ctrlKey) e.preventDefault();
    onCardClick(e, id);
  };

  const defaultClasses = `group relative flex flex-col gap-4 w-full border p-4 rounded-xl cursor-pointer select-none transition-all duration-150 border-neutral-500/20 bg-neutral-950/10 shadow shadow-neutral-950/10 over:border-neutral-500/50 hover:bg-neutral-950 hover:shadow-neutral-950/50`;
  const selectedClasses =
    isSelected && `border-neutral-500/50 bg-neutral-950 shadow-neutral-950/50`;
  const isActive =
    isDropdownOpen &&
    !isSelected &&
    `border-neutral-500/50 bg-neutral-950 shadow-neutral-950/50`;

  return (
    <div
      className={twMerge(defaultClasses, selectedClasses, isActive)}
      onClick={handleClick}
    >
      <h4 className="font-medium">{title}</h4>
      <p className="max-h-24 overflow-hidden mt-2 text-neutral-400 text-sm line-clamp-3">
        {description}
      </p>

      <div className="flex justify-between items-center text-sm text-neutral-500">
        <span>
          {sort === "date"
            ? `Created: ${formatDate(createdAt)}`
            : `Updated: ${formatDate(updatedAt)}`}
        </span>
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
    </div>
  );
}
