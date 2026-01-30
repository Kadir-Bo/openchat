"use client";
import React from "react";
import { ArrowLeft, Menu, Settings } from "react-feather";
import { AnimatePresence, motion } from "framer-motion";
import { ExpandMenu, OutlinedButton, UserSettingsButton } from "@/components";
import { useAuth } from "@/context";

function Sidebar({ state = true, onClick }) {
  const { username } = useAuth();
  const sidebarWidth = 252;
  // Sidebar width animation
  const sidebarVariants = {
    hidden: { width: state ? sidebarWidth : 52, transition: { duration: 0.3 } },
    visible: {
      width: sidebarWidth,
      transition: { duration: 0.3, when: "beforeChildren" },
    },
  };

  // Menu items animation
  const ButtonVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.2 } },
    exit: { opacity: 0, transition: { duration: 0.2 } },
  };

  // Replace: Temp Chats
  const recentChats = [
    { id: "chat-1", label: "Recent conversation 1", path: "/chat/1" },
    { id: "chat-2", label: "Recent conversation 2", path: "/chat/2" },
  ];

  const starredChats = [
    { id: "star-1", label: "Important chat", path: "/chat/5" },
  ];

  return (
    <div
      className={`border-r border-neutral-800 flex flex-col gap-3 items-end bg-neutral-950`}
    >
      <button
        type="button"
        className="relative p-7 flex justify-center items-center cursor-pointer"
        onClick={onClick}
      >
        <motion.div
          className="absolute "
          variants={ButtonVariants}
          initial="hidden"
          animate={state ? "hidden" : "visible"}
        >
          <Menu />
        </motion.div>
        <motion.div
          type="button"
          className="absolute "
          variants={ButtonVariants}
          initial="hidden"
          animate={state ? "visible" : "hidden"}
        >
          <ArrowLeft />
        </motion.div>
      </button>

      {/* Sidebar Panel */}
      <motion.div
        className="flex flex-col flex-1 justify-between px-4 py-2 overflow-hidden"
        variants={sidebarVariants}
        initial="hidden"
        animate={state ? "visible" : "hidden"}
      >
        <AnimatePresence>
          {state && (
            <motion.nav
              className="flex-1 flex flex-col justify-between"
              initial="hidden"
              animate="visible"
              exit="hidden"
            >
              <ExpandMenu title="Recent chats" items={recentChats} />
              <ExpandMenu
                title="Starred"
                items={starredChats}
                className="mt-4"
              />
              <OutlinedButton
                href="/settings"
                text={username}
                icon={<Settings size={17} strokeWidth={1} />}
              />
            </motion.nav>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

export default Sidebar;
