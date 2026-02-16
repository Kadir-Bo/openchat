"use client";

import React from "react";
import { useDatabase, useModal } from "@/context";

import { ChatDeleteModal, ChatRenameModal, DropdownMenu } from "@/components";

import { Archive, Edit2, Trash } from "react-feather";
import { useRouter } from "next/navigation";
import { twMerge } from "tailwind-merge";

export default function ChatCard({ conversation, sort, className = "" }) {
  const { title, id } = conversation;
  const { toggleArchiveConversation } = useDatabase();
  const { openModal, openMessage } = useModal();
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

  return (
    <div
      className={twMerge(defaultClasses, className)}
      onClick={() => handleNavigateToChat(conversation.id)}
    >
      <h4 className="font-medium p-4">{title || "Untitled Chat"}</h4>
      <DropdownMenu
        dropdownList={ChatDropDownMenu}
        triggerClassName="p-4"
        contentSide="right"
        contentClassName="-translate-x-2 translate-y-1"
        contentSideOffset={0}
        onClick={(e, menuItem) => {
          e.stopPropagation();
          menuItem.action();
        }}
      />
    </div>
  );
}
