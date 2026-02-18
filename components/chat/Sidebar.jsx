"use client";

import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";

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

// Module-level pending tracking — survives Next.js soft navigation remounts.
//
// WHY NOT CLEAR IN THE SNAPSHOT CALLBACK?
// React 18 batches rapid successive setState calls. When Firestore fires two
// snapshots in quick succession (snapshot 1: "New Chat", snapshot 2: real title),
// both callbacks run before React renders. If we clear _globalPendingIds in the
// snapshot callback, the pending state is gone before the first paint — so the
// indicator never appears.
//
// Solution: IDs are added immediately when "New Chat" is seen. Removal is
// delayed by MIN_PENDING_MS so the indicator is always visible long enough
// to read, then a forced re-render (via _forceUpdate) clears it cleanly.
const _globalPendingIds = new Set();
const _pendingTimers = new Map(); // id → timer handle
const MIN_PENDING_MS = 1200; // match ChatContext MIN_INDICATOR_MS

export default function Sidebar() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(true);
  const [conversations, setConversations] = useState([]);
  const [projects, setProjects] = useState([]);

  const { user, logout } = useAuth();
  // Only destructure the functions we actually need — avoids re-rendering
  // when unrelated context values (e.g. loading, error) change.
  const { subscribeToConversations, subscribeToProjects } = useDatabase();

  const { displayName, email, photoURL: userImage } = user;
  const username = displayName || email;

  const handleToggleSidebar = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  // Force-update trigger — incrementing this causes Sidebar to re-render so
  // ChatList receives the updated pendingIds reference after a timer clears one.
  const [, forceUpdate] = useState(0);

  // ── Real-time listener for conversations ─────────────────────────────────
  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToConversations((newConversations) => {
      const filtered = newConversations.filter((c) => !c.isArchived);

      filtered.forEach((c) => {
        if (c.title === "New Chat") {
          // New pending item — add immediately and start a minimum-display timer.
          // If the real title arrives before the timer fires, the timer still
          // keeps the indicator up for MIN_PENDING_MS so it never flashes.
          if (!_globalPendingIds.has(c.id)) {
            _globalPendingIds.add(c.id);
          }
          // Reset timer on every "New Chat" snapshot so we always get the full
          // MIN_PENDING_MS from the last time we saw it as pending.
          if (_pendingTimers.has(c.id)) {
            clearTimeout(_pendingTimers.get(c.id));
          }
          _pendingTimers.set(
            c.id,
            setTimeout(() => {
              _globalPendingIds.delete(c.id);
              _pendingTimers.delete(c.id);
              forceUpdate((n) => n + 1);
            }, MIN_PENDING_MS),
          );
        }
        // Never synchronously remove from _globalPendingIds here —
        // the timer above handles removal after the minimum display time.
      });

      // Clean up IDs that left the list entirely (e.g. deleted)
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

  // ── Real-time listener for projects ──────────────────────────────────────
  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToProjects((newProjects) => {
      setProjects(newProjects.filter((p) => !p.isArchived));
    }, true);

    return () => unsubscribe?.();
  }, [user, subscribeToProjects]);

  // ── Memoize recentChats ───────────────────────────────────────────────────
  // Without useMemo this produced a new array reference on every Sidebar
  // render, causing ChatList (and all ChatListItems) to re-render even when
  // the underlying data hadn't changed.
  const recentChats = useMemo(() => {
    const filtered = conversations.filter((conv) => !conv.projectId);
    // Pending items (unresolved serverTimestamp → updatedAt is null) must stay
    // at the top. The DatabaseContext sort already handles this via Infinity,
    // but we re-enforce it here so client-side ordering is always stable even
    // if the snapshot arrives before Firestore confirms the timestamp.
    const pending = filtered.filter((c) => c.updatedAt == null);
    const settled = filtered.filter((c) => c.updatedAt != null);
    return [...pending, ...settled].map((conv) => ({
      id: conv.id,
      title: conv.title,
      type: "chat",
    }));
  }, [conversations]);

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

  const signOut = useCallback(async () => {
    const result = await logout();
    if (result) {
      router.push("/");
    }
  }, [logout, router]);

  // Stable reference — defined outside render so the DropdownItem map never
  // triggers unnecessary re-renders of the user menu.
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
      },
    ],
    [signOut],
  );

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
                  loading="eager" // Fix: LCP image should load eagerly
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
                  pendingIds={_globalPendingIds}
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
