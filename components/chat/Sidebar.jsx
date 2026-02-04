"use client";

import React, { useState } from "react";

import Image from "next/image";
import Link from "next/link";

import {
  DropDownMenu,
  PrimaryButton,
  UserProfileImage,
  ChatList,
} from "@/components";
import Logo from "@/assets/openchat_logo.webp";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Folder,
  FolderPlus,
  LogOut,
  Menu,
  Plus,
  Settings,
  Sliders,
} from "react-feather";

function Sidebar() {
  const [isOpen, setIsOpen] = useState(true);

  const handleToggleSidebar = () => {
    setIsOpen((prev) => !prev);
  };

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

  // Drop Down Menu Actions
  const signOut = () => {
    alert("sign out");
  };
  // Example Data for User
  const recentChats = [
    {
      id: "chat-1",
      title: "chat 1",
      path: "/chat?id=1",
    },
    {
      id: "chat-2",
      title: "chat 2",
      path: "/chat?id=2",
    },
    {
      id: "chat-3",
      title: "chat 3",
      path: "/chat?id=3",
    },
  ];
  const recentProjects = [
    {
      id: "project-1",
      title: "project 1",
      path: "/chat?id=project_chat_1",
    },
    {
      id: "project-2",
      title: "project 2",
      path: "/chat?id=project_chat_2",
    },
    {
      id: "project-3",
      title: "project 3",
      path: "/chat?id=project_chat_3",
    },
  ];
  const user = {
    email: "example.name@example.com",
    username: "John Doe",
    image:
      "https://img.freepik.com/free-photo/portrait-white-man-isolated_53876-40306.jpg?semt=ais_hybrid&w=740&q=80",
  };
  const username = user.username || user.email;
  const userImage = user.image;

  // Dropdown Menu Items

  const dropDownMenuItems = [
    {
      id: "profile-settings",
      label: "Profile Settings",
      action: signOut,
      icon: Settings,
    },
    {
      id: "preferences-settings",
      label: "Preferences",
      action: signOut,
      icon: Sliders,
    },
    {
      id: "sign-out",
      label: "Sign Out",
      action: signOut,
      icon: LogOut,
    },
  ];
  return (
    <motion.div
      className="bg-neutral-800/10 border-r border-r-neutral-500/10 overflow-hidden flex flex-col"
      variants={sidebarVariants}
      initial={false}
      animate={isOpen ? "open" : "closed"}
      transition={{ duration: 0.3, ease: "easeInOut" }}
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
                  src={Logo}
                  alt="openchat logo"
                  width={"auto"}
                  height={"auto"}
                  className="max-w-28"
                />
              </Link>
            </motion.div>
          )}
          <button
            className="p-3 ml-auto outline-none cursor-pointer"
            onClick={handleToggleSidebar}
          >
            {isOpen ? <ArrowLeft /> : <Menu />}
          </button>
        </AnimatePresence>
      </div>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="recent-chat-list"
            variants={listVariants}
            initial="exit"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.2, delay: 0.1 }}
            className="p-1.5 flex flex-col gap-2 flex-1"
          >
            <PrimaryButton
              text="New Chat"
              icon={<Plus size={19} />}
              href={"/chat"}
            />
            <div>
              <ChatList
                label={"projects"}
                defaultExpanded={false}
                list={recentProjects}
                listIcon={<Folder size={19} />}
                button={
                  <PrimaryButton
                    text="New Project"
                    icon={<FolderPlus size={19} />}
                  />
                }
              />
              <ChatList label={"recent chats"} list={recentChats} />
            </div>
            <DropDownMenu
              trigger={
                <PrimaryButton
                  text={username}
                  icon={
                    <UserProfileImage image={userImage} username={username} />
                  }
                  className="gap-1"
                />
              }
            >
              <ul className="p-2">
                {dropDownMenuItems.map((button, id) => (
                  <React.Fragment key={button.id}>
                    {id === dropDownMenuItems.length - 1 && (
                      <div className="border-t border-neutral-500/20 my-2"></div>
                    )}
                    <button
                      className={`w-full flex items-center justify-start gap-2.5 text-left px-3 py-2 hover:bg-neutral-800/50 rounded-lg transition cursor-pointer ${button.id === "sign-out" ? "text-red-400" : ""}`}
                      onClick={button?.action}
                    >
                      <button.icon size={17} />
                      {button.label}
                    </button>
                  </React.Fragment>
                ))}
              </ul>
            </DropDownMenu>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default Sidebar;
