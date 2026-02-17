"use client";

import React, { useState } from "react";
import { formatDate } from "@/lib";
import { useDatabase, useModal } from "@/context";
import {
  DropdownMenu,
  DeleteProjectsModal,
  RenameProjectsModal,
} from "@/components";
import { Archive, Check, Edit2, Trash } from "react-feather";
import { useRouter } from "next/navigation";
import { twMerge } from "tailwind-merge";

export default function ProjectCard({
  project,
  sort,
  isSelected = false,
  onCardClick = () => null,
}) {
  const { title, description, updatedAt, createdAt, id } = project;
  const { toggleArchiveProject } = useDatabase();
  const { openModal, openMessage } = useModal();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const router = useRouter();

  const handleArchiveProject = async () => {
    const result = await toggleArchiveProject(id, true);
    if (result) openMessage("Project archived", "success");
  };

  const ProjectDropDownMenu = [
    {
      id: "rename-project",
      label: "Umbenennen",
      icon: Edit2,
      action: () =>
        openModal(
          <RenameProjectsModal
            title={title}
            description={description}
            id={id}
          />,
        ),
    },
    {
      id: "archive-project",
      label: "Archivieren",
      icon: Archive,
      action: handleArchiveProject,
    },
    {
      id: "delete-project",
      label: "Löschen",
      icon: Trash,
      action: () => openModal(<DeleteProjectsModal title={title} id={id} />),
    },
  ];

  const handleClick = (e) => {
    if (e.defaultPrevented) return;
    if (e.metaKey || e.ctrlKey) e.preventDefault();
    onCardClick(e, id);
  };

  return (
    <div
      className={twMerge(
        "group relative flex flex-col gap-4 w-full border p-4 rounded-xl cursor-pointer select-none transition-all duration-150",
        "border-neutral-500/20 bg-neutral-950/10 shadow shadow-neutral-950/10",
        "hover:border-neutral-500/50 hover:bg-neutral-950 hover:shadow-neutral-950/50",
        isSelected &&
          "border-neutral-500/60 bg-neutral-900 shadow-neutral-950/50",
        isDropdownOpen &&
          !isSelected &&
          "border-neutral-500/50 bg-neutral-950 shadow-neutral-950/50",
      )}
      onClick={handleClick}
    >
      {/* Checkmark im Auswahl-Modus */}
      <div
        className={twMerge(
          "absolute top-3 left-3 w-4 h-4 flex items-center justify-center transition-all duration-150",
          isSelected ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
      >
        <Check size={13} className="text-neutral-300" strokeWidth={3} />
      </div>

      <div
        className={twMerge("transition-all duration-150", isSelected && "pl-5")}
      >
        <span className="font-medium">{title}</span>
        <p className="max-h-24 overflow-hidden mt-2 text-neutral-400 text-sm line-clamp-3">
          {description}
        </p>
      </div>

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
