"use client";

import React, { useState } from "react";
import { useDatabase, useModal } from "@/context";
import { ChatDeleteModal, ChatRenameModal, DropdownMenu } from "@/components";
import { Archive, Check, Edit2, Trash } from "react-feather";
import { useRouter } from "next/navigation";
import { twMerge } from "tailwind-merge";

export default function ChatCard({
  conversation,
  className = "",
  isSelected = false,
  onCardClick = () => null,
}) {
  const { title, id } = conversation;
  const { toggleArchiveConversation } = useDatabase();
  const { openModal, openMessage } = useModal();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const router = useRouter();

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
          <ChatRenameModal title={conversation.title} id={conversation.id} />,
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
          <ChatDeleteModal
            title={conversation.title}
            id={conversation.id}
            type="chat"
          />,
        ),
    },
  ];

  const handleClick = (e) => {
    if (e.defaultPrevented) return;
    // Cmd/Ctrl+Klick würde sonst einen neuen Tab öffnen
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

  const selectedClasses = isSelected
    ? "bg-neutral-900 border-neutral-500/60 shadow-neutral-950/50 hover:bg-neutral-900/90"
    : "";

  const dropdownActiveClasses =
    isDropdownOpen && !isSelected
      ? "bg-neutral-950 shadow-neutral-950/50 border-neutral-500/50"
      : "";

  return (
    <div
      className={twMerge(
        defaultClasses,
        selectedClasses,
        dropdownActiveClasses,
        className,
      )}
      onClick={handleClick}
    >
      <h4 className="font-medium truncate ml-3.5">
        {title || "Untitled Chat"}
      </h4>

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
