"use client";

import React, { useState } from "react";
import { useDatabase, useModal } from "@/context";

import { ChatDeleteModal, ChatRenameModal, DropdownMenu } from "@/components";

import { Archive, Edit2, Trash } from "react-feather";
import { useRouter } from "next/navigation";
import { twMerge } from "tailwind-merge";

export default function ChatCard({ conversation, sort, className = "" }) {
  const { title, id } = conversation;
  const { toggleArchiveConversation } = useDatabase();
  const { openModal, openMessage } = useModal();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const router = useRouter();

  const handleNavigateToChat = (id) => {
    router.push(`/chat/${id}`);
  };

  const handleArchiveChat = async (id) => {
    const result = await toggleArchiveConversation(id);
    if (result) {
      openMessage("Chat archived", "success");
    }
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

  const defaultClasses = `
    relative
    flex
    justify-between
    items-center
    gap-4
    w-full
    border
    rounded-xl
    border-neutral-500/20
    hover:border-neutral-500/50
    cursor-pointer
    bg-neutral-950/10
    hover:bg-neutral-950
    shadow
    shadow-neutral-950/10
    hover:shadow-neutral-950/50
    transition-all
    duration-150
  `;

  const activeClasses =
    isDropdownOpen &&
    "bg-neutral-950 shadow-neutral-950/50 border-neutral-500/50";

  return (
    <div
      className={twMerge(defaultClasses, activeClasses, className)}
      onClick={() => handleNavigateToChat(conversation.id)}
    >
      <h4 className="font-medium ml-3.5 py-2">{title || "Untitled Chat"}</h4>
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
