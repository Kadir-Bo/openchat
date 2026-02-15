"use client";

import React from "react";
import { formatDate } from "@/lib";
import { motion, AnimatePresence } from "framer-motion";
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

export default function ChatCard({ conversation, sort }) {
  const { title, updatedAt, createdAt, id, messageCount } = conversation;
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

  return (
    <AnimatePresence mode="wait">
      <motion.div
        className="relative flex flex-col gap-4 w-full border p-4 rounded-xl border-neutral-500/20 hover:border-neutral-500/50 cursor-pointer bg-neutral-950/10 hover:bg-neutral-950 shadow shadow-neutral-950/10 hover:shadow-neutral-950/50"
        onClick={handleNavigateToChat}
        exit={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        layout
      >
        <div>
          <span className="font-medium">{title || "Untitled Chat"}</span>
          <p className="mt-2 text-sm text-neutral-400">
            {messageCount ? `${messageCount} messages` : "No messages yet"}
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
      </motion.div>
    </AnimatePresence>
  );
}
