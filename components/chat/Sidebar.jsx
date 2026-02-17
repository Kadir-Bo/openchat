"use client";

import React, { useState, useEffect } from "react";

import Image from "next/image";
import Link from "next/link";

import {
  PrimaryButton,
  UserProfileImage,
  ChatList,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
  DropdownSeparator,
} from "@/components";

import { useAuth, useDatabase, Dropdown } from "@/context";
import { useRouter } from "next/navigation";

import { AnimatePresence, motion } from "framer-motion";
import {
  Archive,
  ArrowLeft,
  FolderPlus,
  List,
  LogOut,
  Menu,
  Plus,
  Settings,
} from "react-feather";

export default function Sidebar() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(true);
  const [conversations, setConversations] = useState([]);
  const [projects, setProjects] = useState([]);

  const { user, logout } = useAuth();
  const { subscribeToConversations, subscribeToProjects } = useDatabase();

  const { displayName, email, photoURL: userImage } = user;
  const username = displayName || email;

  const handleToggleSidebar = () => {
    setIsOpen((prev) => !prev);
  };

  // Real-time listener for conversations.
  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToConversations((newConversations) => {
      setConversations(newConversations.filter((c) => !c.isArchived));
    }, true);

    return () => unsubscribe?.();
  }, [user, subscribeToConversations]);

  // Real-time listener for projects.
  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToProjects((newProjects) => {
      setProjects(newProjects.filter((p) => !p.isArchived));
    }, true);

    return () => unsubscribe?.();
  }, [user, subscribeToProjects]);

  const recentChats = conversations
    .filter((conv) => !conv.projectId)
    .map((conv) => ({
      id: conv.id,
      title: conv.title,
      type: "chat",
    }));

  const sidebarVariants = {
    open: { width: "280px" },
    closed: { width: "50px" },
  };

  const logoVariants = {
    animate: { x: 10, opacity: 1 },
    exit: { x: 20, opacity: 0 },
  };

  const listVariants = {
    animate: { x: 0, opacity: 1 },
    exit: { x: 10, opacity: 0 },
  };

  const signOut = async () => {
    const result = await logout();
    if (result) {
      router.push("/");
    }
  };

  const dropDownMenuItems = [
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
    },
  ];

  return (
    <motion.aside
      className="bg-neutral-900 border-r border-r-neutral-500/10 overflow-hidden flex flex-col shrink-0 z-50 min-h-dvh"
      variants={sidebarVariants}
      initial={false}
      animate={isOpen ? "open" : "closed"}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      id="sidebar"
    >
      <div className="flex items-center justify-between h-12">
        <AnimatePresence>
          {isOpen && (
            <motion.div
              key="logo"
              variants={logoVariants}
              initial="animate"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.3 }}
            >
              <Link href={"/chat"}>
                <Image
                  src={"/assets/images/openchat_logo.webp"}
                  alt="openchat logo"
                  width={160}
                  height={32}
                  className="max-w-28"
                />
              </Link>
            </motion.div>
          )}
          <button
            className="p-3 outline-none cursor-pointer"
            onClick={handleToggleSidebar}
            aria-label={isOpen ? "Sidebar schließen" : "Sidebar öffnen"}
          >
            {isOpen ? <ArrowLeft /> : <Menu />}
          </button>
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.nav
            key="sidebar-navigation"
            variants={listVariants}
            initial="exit"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.2, delay: 0.1 }}
            className="p-1.5 flex flex-col gap-4 flex-1 overflow-y-auto overflow-x-hidden"
            aria-label="Hauptnavigation"
          >
            <PrimaryButton
              text="New Chat"
              icon={<Plus size={16} />}
              href={"/chat"}
            />
            <div className="flex flex-col">
              <PrimaryButton
                text="Projects"
                icon={<FolderPlus size={16} />}
                href={"/projects"}
                className="border-transparent shadow-none hover:border-transparent hover:bg-neutral-800 gap-2"
              />
              <PrimaryButton
                text="Chats"
                icon={<List size={16} />}
                href={"/chats"}
                className="border-transparent shadow-none hover:border-transparent hover:bg-neutral-800 gap-2"
              />
              <PrimaryButton
                text="Archive"
                icon={<Archive size={16} />}
                href={"/archive"}
                className="border-transparent shadow-none hover:border-transparent hover:bg-neutral-800 gap-2"
              />
            </div>
            <hr className="text-neutral-800" />
            <div className="flex-1 overflow-y-auto overflow-x-hidden">
              {recentChats.length > 0 ? (
                <ChatList
                  label="Recent Chats"
                  list={recentChats}
                  defaultExpanded={true}
                />
              ) : (
                <span className="text-neutral-400 text-sm flex justify-center">
                  No Recent Chats
                </span>
              )}
            </div>

            <Dropdown>
              <DropdownTrigger>
                <PrimaryButton
                  text={username}
                  icon={
                    <UserProfileImage image={userImage} username={username} />
                  }
                  className="gap-2 text-sm"
                />
              </DropdownTrigger>

              <DropdownContent
                side="top"
                sideOffset={4}
                className="-translate-x-1"
              >
                {dropDownMenuItems.map((button, id) => (
                  <React.Fragment key={button.id}>
                    {id === dropDownMenuItems.length - 1 && (
                      <DropdownSeparator />
                    )}
                    <DropdownItem onClick={button?.action} href={button.href}>
                      <button.icon size={17} />
                      {button.label}
                    </DropdownItem>
                  </React.Fragment>
                ))}
              </DropdownContent>
            </Dropdown>
          </motion.nav>
        )}
      </AnimatePresence>
    </motion.aside>
  );
}
