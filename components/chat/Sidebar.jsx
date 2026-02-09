"use client";

import React, { useState, useEffect } from "react";

import Image from "next/image";
import Link from "next/link";

import {
  DropDownMenu,
  PrimaryButton,
  UserProfileImage,
  ChatList,
} from "@/components";
import { useAuth, useDatabase } from "@/context";
import Logo from "@/assets/openchat_logo.webp";
import { useRouter } from "next/navigation";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Folder,
  LogOut,
  Menu,
  Plus,
  Settings,
  Sliders,
} from "react-feather";

export default function Sidebar() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(true);
  const [conversations, setConversations] = useState([]);

  const { user, logout } = useAuth();
  const { subscribeToConversations } = useDatabase();

  const { displayName, email, photoURL: userImage } = user;
  const username = displayName || email;

  const handleToggleSidebar = () => {
    setIsOpen((prev) => !prev);
  };

  // Real-time Listener für Conversations
  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToConversations((newConversations) => {
      setConversations(newConversations);
    });

    return () => unsubscribe();
  }, [user, subscribeToConversations]);

  // Konvertiere Conversations in das richtige Format für ChatList
  const recentChats = conversations.map((conv) => ({
    id: conv.id,
    title: conv.title,
    type: "chat",
  }));

  // Filtere nach Projects (wenn du später Projects hinzufügst)
  const projects = []; // Später: Filter nach conv.isProject oder ähnlich

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
  const signOut = async () => {
    const signOut = await logout();
    if (signOut) {
      router.push("/");
    }
  };

  // Dropdown Menu Items
  const dropDownMenuItems = [
    {
      id: "profile-settings",
      label: "Profile Settings",
      href: "/settings/profile-settings",
      icon: Settings,
    },
    {
      id: "preferences-settings",
      label: "Preferences",
      href: "/settings/preferences-settings",
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
      <div className="flex items-center justify-between h-12 ">
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
            className="p-3 outline-none cursor-pointer"
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
            className="p-1.5 flex flex-col gap-2 flex-1 overflow-y-auto overflow-x-hidden"
          >
            <PrimaryButton
              text="New Chat"
              icon={<Plus size={19} />}
              href={"/chat"}
            />
            <PrimaryButton
              text="Projects"
              icon={<Folder size={19} />}
              href={"/projects"}
            />
            <div className="flex-1 overflow-y-auto overflow-x-hidden">
              {/* Projects Section */}
              {projects.length > 0 && (
                <ChatList
                  label={"Projects"}
                  defaultExpanded={false}
                  list={projects}
                  listIcon={<Folder size={19} />}
                />
              )}

              {/* Recent Chats Section */}
              <ChatList
                label={"Recent Chats"}
                list={recentChats}
                defaultExpanded={true}
              />
            </div>

            <DropDownMenu
              trigger={
                <PrimaryButton
                  text={username}
                  icon={
                    <UserProfileImage image={userImage} username={username} />
                  }
                  className="gap-2 text-sm"
                />
              }
            >
              <ul className="p-2 w-full overflow-hidden">
                {dropDownMenuItems.map((button, id) => (
                  <React.Fragment key={button.id}>
                    {id === dropDownMenuItems.length - 1 && (
                      <div className="border-t border-neutral-500/20 my-2"></div>
                    )}
                    <PrimaryButton
                      text={button.label}
                      icon={<button.icon size={17} />}
                      onClick={button?.action}
                      href={button.href}
                      className={`border-transparent shadow-none hover:border-transparent hover:bg-neutral-800/50 ${button.id === "sign-out" ? "text-red-400" : ""}`}
                    />
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
