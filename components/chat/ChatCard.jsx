"use client";

import React from "react";
import { Dropdown, useDatabase, useModal } from "@/context";

import {
  DropdownContent,
  DropdownItem,
  DropdownTrigger,
  ChatDeleteModal,
  ChatRenameModal,
} from "@/components";

import { Archive, Edit2, MoreHorizontal, Trash } from "react-feather";
import { useRouter } from "next/navigation";
import { twMerge } from "tailwind-merge";

export default function ChatCard({ conversation, sort, className = "" }) {
  const { title, id } = conversation;
  const { toggleArchiveConversation } = useDatabase();
  const { openModal, openMessage } = useModal();
  const router = useRouter();

  const handleNavigateToChat = () => {
    router.push(`/chat/${id}`);
  };

  const handleArchiveChat = async () => {
    const result = await toggleArchiveConversation(id, true);
    if (result) {
      openMessage("Chat archived", "success");
    }
  };

  const ChatDropDownMenu = [
    {
      id: "rename-chat",
      label: "Umbenennen",
      icon: Edit2,
      action: () => openModal(<ChatRenameModal title={title} id={id} />),
    },
    {
      id: "archive-chat",
      label: "Archivieren",
      icon: Archive,
      action: () => handleArchiveChat(),
    },
    {
      id: "delete-chat",
      label: "Löschen",
      icon: Trash,
      action: () =>
        openModal(<ChatDeleteModal title={title} id={id} type="chat" />),
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
      onClick={handleNavigateToChat}
    >
      <h4 className="font-medium p-4">{title || "Untitled Chat"}</h4>
      <Dropdown>
        <DropdownTrigger className="p-4">
          <MoreHorizontal size={17} />
        </DropdownTrigger>

        <DropdownContent
          side="right"
          className="-translate-x-2 translate-y-1"
          sideOffset={0}
        >
          {ChatDropDownMenu.map((menuItem) => (
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
    </div>
  );
}
