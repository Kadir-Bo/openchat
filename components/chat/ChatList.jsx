"use client";

import React, { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useDatabase, useModal } from "@/context";

import { DeleteChatModal, DropdownMenu } from "@/components";

import { Archive, ChevronDown, Edit2, Trash } from "react-feather";
import { twMerge } from "tailwind-merge";

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
  const { openModal, openMessage } = useModal();
  const [isOpen, setIsOpen] = useState(defaultExpanded);
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
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

      if (editTitle.trim() === originalTitle) {
        setEditingId(null);
        setEditTitle("");
        return;
      }

      const result = await updateConversation(id, { title: editTitle.trim() });
      if (result) {
        setEditingId(null);
        setEditTitle("");
        openMessage("Chat renamed successfully!", "success");
      }
    },
    [editTitle, updateConversation, openMessage],
  );

  const handleCancelRename = useCallback(() => {
    setEditingId(null);
    setEditTitle("");
  }, []);

  const handleArchiveChat = useCallback(
    async (id) => {
      const result = await toggleArchiveConversation(id, true);
      if (result) {
        openMessage("Chat archived successfully!", "success");
      }
    },
    [toggleArchiveConversation, openMessage],
  );

  const handleDeleteChat = useCallback(
    (id, title) => {
      openModal(<DeleteChatModal title={title} id={id} />);
    },
    [openModal],
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
        action: () => handleDeleteChat(item.id, item.title),
      },
    ],
    [handleRenameChat, handleArchiveChat, handleDeleteChat],
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
            className="mt-1 w-full py-2 px-1 flex flex-col gap-1 overflow-hidden"
          >
            {button && <li>{button}</li>}

            {!hasItems && (
              <li className="text-sm text-gray-500 text-center py-4">
                Keine Chats vorhanden
              </li>
            )}

            {list.slice(0, 10).map((item) => (
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
                listItemClasses={listItemClasses}
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
    listItemClasses,
  }) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const defaultClasses = `w-full text-left rounded-lg transition duration-75 flex justify-between items-center gap-1 border`;
    const editingClasses = isEditing
      ? "border-neutral-500 bg-neutral-900/50"
      : "hover:bg-neutral-800 border-transparent";
    const activeClasses = isDropdownOpen && "bg-neutral-800 border-transparent";

    return (
      <li
        className={twMerge(
          defaultClasses,
          editingClasses,
          activeClasses,
          listItemClasses,
        )}
      >
        {isEditing ? (
          <input
            type="text"
            value={editTitle}
            onChange={(e) => onTitleChange(e.target.value)}
            onKeyDown={onKeyDown}
            onBlur={onSave}
            autoFocus
            className="w-full bg-transparent text-gray-200 py-2 px-3 border-transparent outline-none"
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

            <DropdownMenu
              dropdownList={getMenuItems(item)}
              triggerClassName="p-2"
              contentSide="right"
              onOpenChange={setIsDropdownOpen}
              contentClassName="-translate-x-2 translate-y-1"
              contentSideOffset={0}
              onClick={(e, menuItem) => {
                e.stopPropagation();
                menuItem.action();
              }}
            />
          </>
        )}
      </li>
    );
  },
);

ChatListItem.displayName = "ChatListItem";
