"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";

import {
  PrimaryButton,
  UserProfileImage,
  ChatList,
  LogoButton,
  DropdownMenu,
} from "@/components";

import { useAuth, useDatabase } from "@/context";
import { useRouter } from "next/navigation";

import { AnimatePresence, motion } from "framer-motion";
import {
  Archive,
  ArrowLeft,
  ChevronUp,
  FolderPlus,
  List,
  LogOut,
  Menu,
  Plus,
  Settings,
} from "react-feather";
import { useIsMobile } from "@/hooks";
import clsx from "clsx";

const _globalPendingIds = new Set();
const _pendingTimers = new Map();
const MIN_PENDING_MS = 1200;

export default function Sidebar({
  isOpen,
  handleCloseSidebar,
  handleToggleSidebar,
}) {
  const router = useRouter();
  const [conversations, setConversations] = useState([]);
  const [projects, setProjects] = useState([]);
  const isMobile = useIsMobile();

  const { user, logout } = useAuth();
  const { subscribeToConversations, subscribeToProjects } = useDatabase();

  const { displayName, email, photoURL: userImage } = user;
  const username = displayName || email;

  const [, forceUpdate] = useState(0);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToConversations((newConversations) => {
      const filtered = newConversations.filter((c) => !c.isArchived);
      filtered.forEach((c) => {
        if (c.title === "New Chat") {
          if (!_globalPendingIds.has(c.id)) _globalPendingIds.add(c.id);
          if (_pendingTimers.has(c.id)) clearTimeout(_pendingTimers.get(c.id));
          _pendingTimers.set(
            c.id,
            setTimeout(() => {
              _globalPendingIds.delete(c.id);
              _pendingTimers.delete(c.id);
              forceUpdate((n) => n + 1);
            }, MIN_PENDING_MS),
          );
        }
      });
      const ids = new Set(filtered.map((c) => c.id));
      for (const id of _globalPendingIds) {
        if (!ids.has(id)) {
          clearTimeout(_pendingTimers.get(id));
          _pendingTimers.delete(id);
          _globalPendingIds.delete(id);
        }
      }
      setConversations(filtered);
    }, true);
    return () => unsubscribe?.();
  }, [user, subscribeToConversations]);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToProjects((newProjects) => {
      setProjects(newProjects.filter((p) => !p.isArchived));
    }, true);
    return () => unsubscribe?.();
  }, [user, subscribeToProjects]);

  const recentChats = useMemo(() => {
    const filtered = conversations.filter((conv) => !conv.projectId);
    const pending = filtered.filter((c) => c.updatedAt == null);
    const settled = filtered.filter((c) => c.updatedAt != null);
    return [...pending, ...settled].map((conv) => ({
      id: conv.id,
      title: conv.title,
      type: "chat",
    }));
  }, [conversations]);

  const sidebarVariants = {
    open: { width: "280px", x: 0 },
    closed: { width: isMobile ? "280px" : "50px", x: isMobile ? "-280px" : 0 },
  };

  const signOut = useCallback(async () => {
    const result = await logout();
    if (result) router.push("/sign-in");
  }, [logout, router]);

  const dropDownMenuItems = useMemo(
    () => [
      {
        id: "settings",
        label: "Settings",
        href: "/settings/general",
        icon: Settings,
      },
      {
        id: "sign-out",
        label: "Sign Out",
        action: signOut,
        icon: LogOut,
        separator: true,
      },
    ],
    [signOut],
  );

  return (
    <>
      <AnimatePresence>
        {isMobile && isOpen && (
          <motion.div
            key="sidebar-backdrop"
            className="fixed inset-0 z-40 bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleCloseSidebar}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      <motion.aside
        className={`bg-neutral-900 border-r border-r-neutral-500/10 overflow-hidden flex flex-col shrink-0 z-999 h-dvh px-1 ${
          isMobile ? "fixed top-0 left-0" : "relative"
        }`}
        variants={sidebarVariants}
        initial={false}
        animate={isOpen ? "open" : "closed"}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        id="sidebar"
      >
        {/* Header */}
        <div className="flex items-center justify-between h-20">
          <AnimatePresence>
            {isOpen && (
              <motion.div
                key="logo"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 10, opacity: 1 }}
                exit={{ x: 20, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <LogoButton />
              </motion.div>
            )}
          </AnimatePresence>

          <button
            className="p-3 outline-none cursor-pointer shrink-0"
            onClick={handleToggleSidebar}
            aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
          >
            {!isOpen && !isMobile ? (
              <Menu size={20} />
            ) : (
              <ArrowLeft size={20} />
            )}
          </button>
        </div>

        {/* Content */}
        <AnimatePresence>
          {isOpen && (
            <motion.nav
              key="sidebar-navigation"
              initial={{ x: 10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 10, opacity: 0 }}
              transition={{ duration: 0.2, delay: 0.1 }}
              className="flex flex-col gap-4 flex-1 overflow-y-auto overflow-x-hidden"
              aria-label="Main navigation"
            >
              <div className="flex flex-col gap-1 p-2">
                <PrimaryButton href="/chat" className="hover:bg-neutral-800">
                  <Plus size={16} />
                  New Chat
                </PrimaryButton>
                <PrimaryButton
                  href="/projects"
                  className="border-transparent shadow-none hover:border-transparent hover:bg-neutral-800 gap-2"
                >
                  <FolderPlus size={16} />
                  Projects
                </PrimaryButton>
                <PrimaryButton
                  href="/chats"
                  className="border-transparent shadow-none hover:border-transparent hover:bg-neutral-800 gap-2"
                >
                  <List size={16} />
                  Chats
                </PrimaryButton>
                <PrimaryButton
                  href="/archive"
                  className="border-transparent shadow-none hover:border-transparent hover:bg-neutral-800 gap-2"
                >
                  <Archive size={16} />
                  Archive
                </PrimaryButton>
              </div>

              <hr className="text-neutral-800" />

              <div className="flex-1 overflow-y-auto overflow-x-hidden p-2s">
                {recentChats.length > 0 ? (
                  <ChatList
                    label="Recent Chats"
                    list={recentChats}
                    defaultExpanded={true}
                    pendingIds={_globalPendingIds}
                  />
                ) : (
                  <span className="text-neutral-400 text-sm flex justify-center">
                    No Recent Chats
                  </span>
                )}
              </div>

              <DropdownMenu
                dropdownList={dropDownMenuItems}
                contentSide="top"
                onClick={(e, menuItem) => {
                  e.stopPropagation();
                  menuItem.action?.();
                }}
                contentClassName="bg-neutral-950/50 -translate-x-1.5"
                triggerClassName="border-t border-neutral-800 pb-8 md:py-2"
              >
                <PrimaryButton className="gap-2 md:text-sm rounded-none border-none shadow-none hover:bg-transparent">
                  <UserProfileImage image={userImage} username={username} />
                  <div className="flex flex-1 justify-between items-center">
                    {username}
                    <ChevronUp size={15} />
                  </div>
                </PrimaryButton>
              </DropdownMenu>
            </motion.nav>
          )}
        </AnimatePresence>
      </motion.aside>
    </>
  );
}
