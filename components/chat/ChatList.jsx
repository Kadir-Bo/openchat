"use client";

import React, { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Archive,
  ChevronDown,
  Edit2,
  MoreHorizontal,
  Trash,
} from "react-feather";
import { motion, AnimatePresence } from "framer-motion";
import {
  DropdownContent,
  DropdownItem,
  DropdownTrigger,
  PrimaryButton,
} from "@/components";
import { Dropdown, useDatabase, useModal } from "@/context";
import ChatDeleteModal from "../modal/ChatDeleteModal";

export default function ChatList({
  label = "",
  list = [],
  button = null,
  listIcon = null,
  defaultExpanded = true,
  listItemClasses = "",
}) {
  const { deleteConversation, updateConversation, toggleArchiveConversation } =
    useDatabase();
  const [isOpen, setIsOpen] = useState(defaultExpanded);
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const { openModal } = useModal();
  const router = useRouter();

  const handleToggleChats = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const handleNavigateToChat = useCallback(
    (type = "chat", id) => {
      router.push(`/${type}/${id}`);
    },
    [router],
  );

  const handleRenameChat = useCallback((id, currentTitle) => {
    setEditingId(id);
    setEditTitle(currentTitle);
  }, []);

  const handleSaveRename = useCallback(
    async (id, originalTitle) => {
      if (!editTitle.trim()) {
        setEditingId(null);
        setEditTitle("");
        return;
      }

      // Nur updaten wenn sich der Titel geändert hat
      if (editTitle.trim() === originalTitle) {
        setEditingId(null);
        setEditTitle("");
        return;
      }

      const result = await updateConversation(id, { title: editTitle.trim() });
      if (result) {
        setEditingId(null);
        setEditTitle("");
      }
    },
    [editTitle, updateConversation],
  );

  const handleCancelRename = useCallback(() => {
    setEditingId(null);
    setEditTitle("");
  }, []);

  const handleArchiveChat = useCallback(
    async (id) => {
      const result = await toggleArchiveConversation(id, true);
      if (result) {
        console.log("Chat archiviert");
      }
    },
    [toggleArchiveConversation],
  );

  const handleDeleteChat = useCallback(
    async (id) => {
      if (confirm("Möchtest du diesen Chat wirklich löschen?")) {
        const result = await deleteConversation(id);
        if (result) {
          console.log("Chat gelöscht");
        }
      }
    },
    [deleteConversation],
  );

  const handleKeyDown = useCallback(
    (e, id, originalTitle) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleSaveRename(id, originalTitle);
      } else if (e.key === "Escape") {
        e.preventDefault();
        handleCancelRename();
      }
    },
    [handleSaveRename, handleCancelRename],
  );

  const getDropDownMenuItems = useCallback(
    (item) => [
      {
        id: "rename-chat",
        label: "Umbenennen",
        icon: Edit2,
        action: () => handleRenameChat(item.id, item.title),
      },
      {
        id: "archive-chat",
        label: "Archivieren",
        icon: Archive,
        action: () => handleArchiveChat(item.id),
      },
      {
        id: "delete-chat",
        label: "Löschen",
        icon: Trash,
        action: () =>
          openModal(<ChatDeleteModal title={item.title} id={item.id} />),
      },
    ],
    [handleRenameChat, handleArchiveChat, openModal],
  );

  const hasItems = useMemo(() => list.length > 0, [list.length]);

  return (
    <div className="py-2.5 w-full">
      {label && (
        <button
          className="group min-w-max w-full pl-2.5 text-sm text-gray-300/90 flex items-center gap-px ml-1 cursor-pointer hover:text-gray-200/80 transition-all duration-75"
          onClick={handleToggleChats}
          aria-expanded={isOpen}
          aria-label={`${isOpen ? "Minimieren" : "Erweitern"} ${label}`}
        >
          {label}
          <ChevronDown
            size={16}
            className={`opacity-0 group-hover:opacity-100 transition-all duration-200 ${
              isOpen ? "" : "-rotate-90"
            }`}
          />
        </button>
      )}

      <AnimatePresence>
        {isOpen && (
          <motion.ul
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-1 w-full py-2 px-1 flex flex-col gap-2 overflow-hidden"
          >
            {button && <li>{button}</li>}

            {!hasItems && (
              <li className="text-sm text-gray-500 text-center py-4">
                Keine Chats vorhanden
              </li>
            )}

            {list.map((item) => (
              <ChatListItem
                key={item.id}
                item={item}
                isEditing={editingId === item.id}
                editTitle={editTitle}
                onTitleChange={setEditTitle}
                onSave={() => handleSaveRename(item.id, item.title)}
                onCancel={handleCancelRename}
                onKeyDown={(e) => handleKeyDown(e, item.id, item.title)}
                onNavigate={handleNavigateToChat}
                getMenuItems={getDropDownMenuItems}
                listIcon={listIcon}
                listItemClasses
              />
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

const ChatListItem = React.memo(
  ({
    item,
    isEditing,
    editTitle,
    onTitleChange,
    onSave,
    onKeyDown,
    onNavigate,
    getMenuItems,
    listIcon,
  }) => {
    return (
      <li
        className={`w-full text-left rounded-lg transition duration-75 flex justify-between items-center gap-1 border ${
          isEditing
            ? "border-neutral-500 bg-neutral-900/50"
            : "hover:bg-neutral-800 border-transparent"
        }`}
      >
        {isEditing ? (
          <input
            type="text"
            value={editTitle}
            onChange={(e) => onTitleChange(e.target.value)}
            onKeyDown={onKeyDown}
            onBlur={onSave}
            autoFocus
            className="w-full bg-transparent text-gray-200 px-3 py-2 border-none outline-none"
          />
        ) : (
          <>
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
              onClick={() => onNavigate(item.type, item.id)}
              className="truncate py-2 pl-3 w-full flex items-center gap-1 text-left hover:text-gray-100 cursor-pointer"
            >
              {listIcon && listIcon}
              <span className="truncate"> {item.title}</span>
            </motion.button>

            <Dropdown>
              <DropdownTrigger className="p-2">
                <MoreHorizontal size={17} />
              </DropdownTrigger>

              <DropdownContent
                side="right"
                sideOffset={0}
                className="-translate-x-1 translate-y-2"
              >
                {getMenuItems(item).map((menuItem) => (
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
          </>
        )}
      </li>
    );
  },
);

ChatListItem.displayName = "ChatListItem";
