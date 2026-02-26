"use client";

import React, {
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
} from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useDatabase, useModal } from "@/context";

import {
  DeleteConfirmModal,
  DropdownMenu,
  Icon,
  ProcessingIndicator,
} from "@/components";

import { Archive, ChevronDown, Edit2, Trash } from "react-feather";
import { twMerge } from "tailwind-merge";

export default function ChatList({
  label = "",
  list = [],
  button = null,
  listIcon = null,
  defaultExpanded = true,
  listItemClasses = "",
  pendingIds = null,
  activeChatId = null,
}) {
  const { updateConversation, toggleArchiveConversation, deleteConversation } =
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

  const editTitleRef = useRef(editTitle);
  useEffect(() => {
    editTitleRef.current = editTitle;
  }, [editTitle]);

  const handleSaveRename = useCallback(
    async (id, originalTitle) => {
      const current = editTitleRef.current;
      if (!current.trim() || current.trim() === originalTitle) {
        setEditingId(null);
        setEditTitle("");
        return;
      }
      const result = await updateConversation(id, { title: current.trim() });
      if (result) {
        setEditingId(null);
        setEditTitle("");
        openMessage("Chat renamed successfully!", "success");
      }
    },
    [updateConversation, openMessage],
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
    (id) => {
      openModal(
        <DeleteConfirmModal
          title="Chat löschen"
          description="Are you sure you want to delete this chat? This action cannot be undone."
          onConfirm={async () => {
            const result = await deleteConversation(id);
            if (result) {
              openMessage("Chat deleted successfully!", "success");
            }
          }}
        />,
      );
    },
    [openModal, deleteConversation, openMessage],
  );

  const handleKeyDownById = useCallback(
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
        action: () => handleDeleteChat(item.id),
      },
    ],
    [handleRenameChat, handleArchiveChat, handleDeleteChat],
  );

  const hasItems = list.length > 0;

  return (
    <div className="py-2.5 w-full">
      {label && (
        <button
          className="group min-w-max w-full pl-2.5 text-sm text-neutral-300/90 flex items-center gap-px ml-1 cursor-pointer hover:text-neutral-200/80 transition-all duration-75"
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
              <li className="text-sm text-neutral-500 text-center py-4">
                Keine Chats vorhanden
              </li>
            )}

            {list.slice(0, 10).map((item) => (
              <ChatListItem
                key={item.id}
                item={item}
                isEditing={editingId === item.id}
                isPending={
                  pendingIds
                    ? pendingIds.has(item.id)
                    : item.title === "New Chat"
                }
                editTitle={editingId === item.id ? editTitle : ""}
                onTitleChange={setEditTitle}
                onSave={handleSaveRename}
                onCancel={handleCancelRename}
                onKeyDown={handleKeyDownById}
                onNavigate={handleNavigateToChat}
                getMenuItems={getDropDownMenuItems}
                listIcon={listIcon}
                listItemClasses={listItemClasses}
                isActive={activeChatId === item.id}
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
    isPending,
    editTitle,
    onTitleChange,
    onSave,
    onCancel,
    onKeyDown,
    onNavigate,
    getMenuItems,
    listIcon,
    listItemClasses,
    isActive = null,
  }) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    // Bind item-specific values inside the item itself so the parent
    // never needs to create per-item inline closures.
    const handleSave = useCallback(
      () => onSave(item.id, item.title),
      [onSave, item.id, item.title],
    );

    const handleKeyDown = useCallback(
      (e) => onKeyDown(e, item.id, item.title),
      [onKeyDown, item.id, item.title],
    );

    const handleNavigate = useCallback(
      () => onNavigate(item.type, item.id),
      [onNavigate, item.type, item.id],
    );

    // Memoize menu items — only recompute when id/title actually change.
    const menuItems = useMemo(
      () => getMenuItems(item),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [getMenuItems, item.id, item.title],
    );

    const defaultClasses =
      "w-full text-left rounded-lg transition duration-75 flex justify-between items-center gap-1 border py-1.5";
    const editingClasses = isEditing
      ? "border-neutral-500 bg-neutral-900/50"
      : "hover:bg-neutral-800 border-transparent";
    const activeClasses =
      isDropdownOpen || isActive ? "bg-neutral-800 border-transparent" : "";

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
            onKeyDown={handleKeyDown}
            onBlur={handleSave}
            autoFocus
            className="w-full bg-transparent text-neutral-200 py-1 px-3 border-transparent outline-none"
          />
        ) : (
          <>
            <button
              onClick={handleNavigate}
              className="truncate py-1 pl-3 w-full flex items-center gap-1 text-left hover:text-neutral-100 cursor-pointer"
            >
              {listIcon && <Icon name={listIcon} size="md" />}
              <AnimatePresence mode="wait" initial={false}>
                {isPending ? (
                  <motion.span
                    key={item.id + "-pending"}
                    className="truncate"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <ProcessingIndicator message={"Creating New Chat"} />
                  </motion.span>
                ) : (
                  <motion.span
                    key={item.id + "-title"}
                    className="truncate"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    {item.title}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>

            <DropdownMenu
              dropdownList={menuItems}
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
  arePropsEqual,
);

ChatListItem.displayName = "ChatListItem";

// Custom comparator — only re-render if the fields ChatListItem actually USES changed.
// Firestore creates new object references on every snapshot even for unchanged docs,
// so without this every snapshot re-renders every item unnecessarily.
function arePropsEqual(prev, next) {
  if (prev.isEditing !== next.isEditing) return false;
  if (prev.isPending !== next.isPending) return false;
  if (prev.editTitle !== next.editTitle) return false;
  if (prev.listItemClasses !== next.listItemClasses) return false;
  if (prev.listIcon !== next.listIcon) return false;
  if (prev.isActive !== next.isActive) return false; // ← THIS IS MISSING

  if (prev.onTitleChange !== next.onTitleChange) return false;
  if (prev.onSave !== next.onSave) return false;
  if (prev.onCancel !== next.onCancel) return false;
  if (prev.onKeyDown !== next.onKeyDown) return false;
  if (prev.onNavigate !== next.onNavigate) return false;
  if (prev.getMenuItems !== next.getMenuItems) return false;

  if (prev.item.id !== next.item.id) return false;
  if (prev.item.title !== next.item.title) return false;
  if (prev.item.type !== next.item.type) return false;

  return true;
}
