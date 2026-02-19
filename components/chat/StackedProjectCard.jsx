"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDatabase, useModal } from "@/context";
import {
  DeleteProjectModal,
  RenameProjectModal,
  ChatCard,
  DropdownMenu,
} from "@/components";
import { Archive, ChevronDown, Edit2, Folder, Trash } from "react-feather";
import { twMerge } from "tailwind-merge";
import { useRouter } from "next/navigation";

export default function StackedProjectCard({
  project,
  conversations = [],
  isSelected = false,
  onCardClick = () => null,
  onChatClick = () => null,
}) {
  const { title, description, id, isArchived } = project;
  const { toggleArchiveProject } = useDatabase();
  const { openModal, openMessage } = useModal();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const router = useRouter();

  const handleToggleArchive = async () => {
    const result = await toggleArchiveProject(id, !isArchived);
    if (result)
      openMessage(
        isArchived ? "Project unarchived" : "Project archived",
        "success",
      );
  };

  const ProjectDropDownMenu = [
    {
      id: "rename-project",
      label: "Umbenennen",
      icon: Edit2,
      action: () =>
        openModal(
          <RenameProjectModal
            title={title}
            description={description}
            id={id}
          />,
        ),
    },
    {
      id: "archive-project",
      label: isArchived ? "Dearchivieren" : "Archivieren",
      icon: Archive,
      action: handleToggleArchive,
    },
    {
      id: "delete-project",
      label: "Löschen",
      icon: Trash,
      action: () => openModal(<DeleteProjectModal title={title} id={id} />),
    },
  ];

  const handleHeaderClick = (e) => {
    if (e.defaultPrevented) return;
    if (e.metaKey || e.ctrlKey) {
      e.preventDefault();
      onCardClick(e, id);
      return;
    }
    // If there are conversations, toggle accordion; otherwise navigate
    if (conversations.length > 0) {
      setIsExpanded((prev) => !prev);
    } else {
      router.push(`/project/${id}`);
    }
  };

  const chatCount = conversations.length;
  // How many stacked ghost cards to show behind (max 2)
  const stackDepth = Math.min(chatCount, 2);

  const handleNavigateToPage = (type = "chat", id) => {
    router.push(`/${type}/${id}`);
  };

  return (
    <div className="relative w-full">
      {/* Stacked ghost cards behind — only when collapsed */}
      <AnimatePresence>
        {!isExpanded && stackDepth >= 1 && (
          <motion.div
            key="stack-1"
            initial={{ opacity: 0, y: -4, scaleX: 0.97 }}
            animate={{ opacity: 0.4, y: 6, scaleX: 0.97 }}
            exit={{ opacity: 0, y: -4, scaleX: 0.97 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-x-0 top-0 h-full rounded-xl border border-neutral-500/15 bg-neutral-950/40 pointer-events-none"
            style={{ zIndex: 1 }}
          />
        )}
        {!isExpanded && stackDepth >= 2 && (
          <motion.div
            key="stack-2"
            initial={{ opacity: 0, y: -8, scaleX: 0.94 }}
            animate={{ opacity: 0.25, y: 12, scaleX: 0.94 }}
            exit={{ opacity: 0, y: -8, scaleX: 0.94 }}
            transition={{ duration: 0.2, delay: 0.03 }}
            className="absolute inset-x-0 top-0 h-full rounded-xl border border-neutral-500/10 bg-neutral-950/30 pointer-events-none"
            style={{ zIndex: 0 }}
          />
        )}
      </AnimatePresence>

      {/* Main card */}
      <motion.div
        layout
        className={twMerge(
          "relative flex flex-col w-full border rounded-xl cursor-pointer select-none transition-colors duration-150",
          "border-neutral-500/20 bg-neutral-950/10 shadow shadow-neutral-950/10",
          "hover:border-neutral-500/40 hover:bg-neutral-950/60",
          isSelected &&
            "border-neutral-500/60 bg-neutral-900 shadow-neutral-950/50",
          isExpanded && "border-neutral-500/35 bg-neutral-950/80",
          isDropdownOpen &&
            !isSelected &&
            "border-neutral-500/50 bg-neutral-950",
        )}
        style={{ zIndex: 2 }}
        onClick={handleHeaderClick}
      >
        {/* Header row */}
        <div className="flex items-start gap-3 p-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Folder size={13} className="text-neutral-500 shrink-0 mt-0.5" />
              <h4
                className="font-medium truncate leading-snug hover:underline py-1"
                onClick={() => handleNavigateToPage("project", id)}
              >
                {title}
              </h4>
            </div>
            {description && (
              <p className="mt-1.5 text-sm text-neutral-500 line-clamp-2 leading-relaxed">
                {description}
              </p>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {/* Chat count badge */}
            {chatCount > 0 && (
              <span className="text-xs text-neutral-400 bg-neutral-800/60 rounded-md px-2 py-0.5 tabular-nums">
                {chatCount} {chatCount === 1 ? "chat" : "chats"}
              </span>
            )}

            {/* Expand chevron */}
            {chatCount > 0 && (
              <motion.div
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className="p-1 text-neutral-600"
              >
                <ChevronDown size={14} />
              </motion.div>
            )}
            {/* Dropdown — stop propagation so it doesn't toggle accordion */}
            <div onClick={(e) => e.stopPropagation()}>
              <DropdownMenu
                dropdownList={ProjectDropDownMenu}
                triggerClassName="p-2"
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
          </div>
        </div>

        {/* Accordion — chat list */}
        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div
              key="accordion"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              className="overflow-hidden"
            >
              <div
                className="flex flex-col gap-1.5 px-3 pb-3"
                onClick={(e) => {
                  if (!e.metaKey && !e.ctrlKey) e.stopPropagation();
                }}
              >
                <div className="h-px bg-neutral-800/60 mb-1" />
                {conversations.map((conversation, index) => (
                  <motion.div
                    key={conversation.id}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.04, duration: 0.18 }}
                  >
                    <ChatCard
                      conversation={conversation}
                      onCardClick={(e, id) => {
                        if (e.metaKey || e.ctrlKey) {
                          e.preventDefault();
                          e.stopPropagation();
                          onChatClick(e, id);
                        } else {
                          handleNavigateToPage("chat", conversation.id);
                        }
                      }}
                      className="border-neutral-500/10 bg-neutral-900/40 hover:bg-neutral-900/80"
                    />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Bottom spacing to account for stacked ghost cards */}
      {!isExpanded && stackDepth > 0 && (
        <div style={{ height: stackDepth * 6 }} />
      )}
    </div>
  );
}
