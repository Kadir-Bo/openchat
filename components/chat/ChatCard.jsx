"use client";

import React, { useState } from "react";
import { useDatabase, useModal } from "@/context";
import { DeleteChatModal, RenameChatModal, DropdownMenu } from "@/components";
import { Archive, Edit2, Folder, Trash } from "react-feather";
import { twMerge } from "tailwind-merge";

export default function ChatCard({
  conversation,
  className = "",
  isSelected = false,
  onCardClick = () => null,
  project = null,
}) {
  const { title, id } = conversation;
  const { toggleArchiveConversation } = useDatabase();
  const { openModal, openMessage } = useModal();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleArchiveChat = async (id) => {
    const result = await toggleArchiveConversation(id);
    if (result) openMessage("Chat archived", "success");
  };

  const ChatDropDownMenu = [
    {
      id: "rename-chat",
      label: "Umbenennen",
      icon: Edit2,
      action: () =>
        openModal(
          <RenameChatModal title={conversation.title} id={conversation.id} />,
        ),
    },
    {
      id: "archive-chat",
      label: "Archivieren",
      icon: Archive,
      action: () => handleArchiveChat(conversation.id),
    },
    {
      id: "delete-chat",
      label: "Löschen",
      icon: Trash,
      action: () =>
        openModal(
          <DeleteChatModal
            title={conversation.title}
            id={conversation.id}
            type="chat"
          />,
        ),
    },
  ];

  const handleClick = (e) => {
    if (e.defaultPrevented) return;
    if (e.metaKey || e.ctrlKey) e.preventDefault();
    onCardClick(e, id);
  };

  const defaultClasses = `
    relative flex justify-between items-center gap-4 w-full
    border rounded-xl cursor-pointer select-none
    transition-all duration-150
    border-neutral-500/20 hover:border-neutral-500/50
    bg-neutral-950/10 hover:bg-neutral-950
    shadow shadow-neutral-950/10 hover:shadow-neutral-950/50
  `;
  const projectClasses =
    project && `border-blue-200/30 hover:border-blue-200/40`;
  const selectedClasses = isSelected
    ? "bg-neutral-900 border-neutral-500/60 shadow-neutral-950/50 hover:bg-neutral-900 hover:border-neutral-400"
    : "";

  const dropdownActiveClasses =
    isDropdownOpen && !isSelected
      ? "bg-neutral-950 shadow-neutral-950/50 border-neutral-500/50"
      : "";

  return (
    <div
      className={twMerge(
        defaultClasses,
        projectClasses,
        selectedClasses,
        dropdownActiveClasses,
        className,
      )}
      onClick={handleClick}
    >
      <div className="flex flex-col justify-center flex-1 py-2.5 pl-4 min-w-0 gap-0.5">
        <h4 className="font-medium truncate leading-snug">
          {title || "Untitled Chat"}
        </h4>
        {project && (
          <span className="flex gap-1 mt-2 text-xs text-neutral-600 truncate max-w-48 leading-none">
            <Folder size={9} className="shrink-0" />
            {project.title}
          </span>
        )}
      </div>

      <DropdownMenu
        dropdownList={ChatDropDownMenu}
        triggerClassName="p-3.5"
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
