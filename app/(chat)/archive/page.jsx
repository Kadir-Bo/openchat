"use client";

import { useDatabase } from "@/context";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ArrowLeft, Plus, Trash2 } from "react-feather";
import {
  PrimaryButton,
  ChatCard,
  ProjectCard,
  Searchbar,
  Select,
} from "@/components";
import { useSelectionHandlers } from "@/hooks";
import { useRouter } from "next/navigation";

const FILTER_OPTIONS = [
  { id: "recent", value: "activity", label: "Recent activity" },
  { id: "name", value: "name", label: "Name" },
  { id: "date", value: "date", label: "Date created" },
];

const fuzzyMatch = (str, pattern) => {
  if (!pattern) return { match: true, score: 0 };
  if (!str) return { match: false, score: 0 };

  const lowerStr = str.toLowerCase();
  const lowerPattern = pattern.toLowerCase();

  if (lowerStr.includes(lowerPattern)) return { match: true, score: 1000 };

  let patternIdx = 0;
  let strIdx = 0;
  let score = 0;
  let consecutiveMatches = 0;

  while (strIdx < lowerStr.length && patternIdx < lowerPattern.length) {
    if (lowerStr[strIdx] === lowerPattern[patternIdx]) {
      score += 1;
      consecutiveMatches++;
      if (consecutiveMatches > 1) score += consecutiveMatches * 2;
      if (strIdx === 0 || lowerStr[strIdx - 1] === " ") score += 5;
      patternIdx++;
    } else {
      consecutiveMatches = 0;
    }
    strIdx++;
  }

  const match = patternIdx === lowerPattern.length;
  if (match) score = score * (1 + score / lowerStr.length);

  return { match, score: match ? score : 0 };
};

export default function ArchivePage() {
  const {
    subscribeToArchivedConversations,
    subscribeToProjects,
    deleteConversation,
    deleteProject,
    toggleArchiveProject,
  } = useDatabase();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("chats");
  const [sortBy, setSortBy] = useState(FILTER_OPTIONS[0].value);
  const [searchQuery, setSearchQuery] = useState("");

  const [chats, setChats] = useState([]);
  const [chatsLoading, setChatsLoading] = useState(true);

  const [allProjects, setAllProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(true);

  const chatListRef = useRef([]);
  const projectListRef = useRef([]);

  // Subscribe to archived conversations
  useEffect(() => {
    const unsubscribe = subscribeToArchivedConversations((data) => {
      setChats(data);
      setChatsLoading(false);
    });
    return () => unsubscribe?.();
  }, [subscribeToArchivedConversations]);

  // Single project subscription — filters applied client-side to reuse the
  useEffect(() => {
    const unsubscribe = subscribeToProjects((data) => {
      setAllProjects(data);
      setProjectsLoading(false);
    }, true);
    return () => unsubscribe?.();
  }, [subscribeToProjects]);

  // Derive active and archived project lists from the single subscription
  const archivedProjects = useMemo(
    () => allProjects.filter((p) => p.isArchived),
    [allProjects],
  );

  const activeProjectsById = useMemo(
    () =>
      Object.fromEntries(
        allProjects.filter((p) => !p.isArchived).map((p) => [p.id, p]),
      ),
    [allProjects],
  );

  // Clear search when switching tabs
  useEffect(() => {
    setSearchQuery("");
  }, [activeTab]);

  // Escape clears selection
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        chatHandlers.clearSelection();
        projectHandlers.clearSelection();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredChats = useMemo(() => {
    const list = searchQuery.trim()
      ? chats
          .map((c) => ({ c, ...fuzzyMatch(c.title || "", searchQuery) }))
          .filter(({ match }) => match)
          .sort((a, b) => b.score - a.score)
          .map(({ c }) => c)
      : [...chats].sort((a, b) => {
          if (sortBy === "name")
            return (a.title || "").localeCompare(b.title || "");
          const key = sortBy === "date" ? "createdAt" : "updatedAt";
          const toDate = (v) => v?.toDate?.() ?? new Date(v);
          return toDate(b[key]) - toDate(a[key]);
        });
    chatListRef.current = list;
    return list;
  }, [chats, searchQuery, sortBy]);

  const filteredProjects = useMemo(() => {
    const list = searchQuery.trim()
      ? archivedProjects.filter((p) =>
          [p.title, p.description]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(searchQuery.toLowerCase()),
        )
      : [...archivedProjects].sort((a, b) => {
          if (sortBy === "name")
            return (a.title || "").localeCompare(b.title || "");
          const key = sortBy === "date" ? "createdAt" : "updatedAt";
          const toDate = (v) => v?.toDate?.() ?? new Date(v);
          return toDate(b[key]) - toDate(a[key]);
        });
    projectListRef.current = list;
    return list;
  }, [archivedProjects, searchQuery, sortBy]);

  const chatHandlers = useSelectionHandlers({
    listRef: chatListRef,
    onNavigate: (id) => router.push(`/chat/${id}`),
    deleteOne: deleteConversation,
  });

  const projectHandlers = useSelectionHandlers({
    listRef: projectListRef,
    onNavigate: (id) => router.push(`/project/${id}`),
    deleteOne: deleteProject,
  });

  const handleUnarchiveSelected = useCallback(async () => {
    await Promise.all(
      [...projectHandlers.selectedIds].map((id) =>
        toggleArchiveProject(id, false),
      ),
    );
    projectHandlers.clearSelection();
  }, [projectHandlers, toggleArchiveProject]);

  const isChats = activeTab === "chats";
  const activeSort = FILTER_OPTIONS.find((o) => o.value === sortBy);
  const selectedCount = isChats
    ? chatHandlers.selectedIds.size
    : projectHandlers.selectedIds.size;
  const isLoading = isChats ? chatsLoading : projectsLoading;
  const currentList = isChats ? filteredChats : filteredProjects;
  const hasItems = isChats ? chats.length > 0 : archivedProjects.length > 0;

  return (
    <div className="flex-1 flex flex-col max-w-5xl mx-auto py-8 gap-6 w-full">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-light">Archive</h1>
        <PrimaryButton
          text="New Chat"
          icon={<Plus size={17} />}
          className="w-max justify-center text-sm min-w-32"
          href="/chat"
          filled
        />
      </header>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-neutral-800">
        {["chats", "projects"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm capitalize transition-colors duration-150 border-b-2 -mb-px ${
              activeTab === tab
                ? "border-neutral-300 text-neutral-100"
                : "border-transparent text-neutral-500 hover:text-neutral-300"
            }`}
          >
            {tab}
            <span className="ml-2 text-xs text-neutral-600">
              {tab === "chats" ? chats.length : archivedProjects.length}
            </span>
          </button>
        ))}
      </div>

      <div className="flex justify-end items-center gap-3">
        <span className="text-neutral-400 text-sm">Sort by:</span>
        <Select
          id="archive-sort"
          name="sort"
          label=""
          value={activeSort?.label || "Sort by"}
          list={FILTER_OPTIONS}
          onChange={(e) => setSortBy(e.target.value)}
          containerClassName="w-auto min-w-40"
          labelClassName="hidden"
          buttonClassName="text-sm px-3 min-w-32"
        />
      </div>

      <Searchbar
        onSearch={(q) => setSearchQuery(q)}
        placeholder={`Search ${isChats ? "archived chats" : "archived projects"}`}
      />

      {/* Action bar */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-neutral-600">
          {selectedCount > 0
            ? `${selectedCount} ${
                isChats
                  ? selectedCount === 1
                    ? "chat"
                    : "chats"
                  : selectedCount === 1
                    ? "project"
                    : "projects"
              } selected — Esc to cancel`
            : hasItems
              ? "⌘ / Ctrl + click to select"
              : ""}
        </span>

        <div className="flex items-center gap-2">
          {!isChats && selectedCount > 0 && (
            <PrimaryButton
              text={`Unarchive ${selectedCount}`}
              className="w-max text-sm px-4"
              onClick={handleUnarchiveSelected}
            />
          )}

          {selectedCount > 0 && (
            <PrimaryButton
              text={`Delete ${selectedCount} ${
                isChats
                  ? selectedCount === 1
                    ? "chat"
                    : "chats"
                  : selectedCount === 1
                    ? "project"
                    : "projects"
              }`}
              icon={<Trash2 size={14} />}
              className="w-max text-sm px-4 text-red-400 border-red-400/30 hover:bg-red-400/10 hover:border-red-400/60"
              onClick={
                isChats
                  ? chatHandlers.handleDeleteSelected
                  : projectHandlers.handleDeleteSelected
              }
            />
          )}

          {selectedCount === 0 && hasItems && (
            <PrimaryButton
              text={`Delete all ${isChats ? "chats" : "projects"}`}
              icon={<Trash2 size={14} />}
              className="w-max text-sm px-4 text-red-400 border-red-400/30 hover:bg-red-400/10 hover:border-red-400/60"
              onClick={() =>
                isChats
                  ? chatHandlers.handleDeleteAll(filteredChats)
                  : projectHandlers.handleDeleteAll(filteredProjects)
              }
            />
          )}
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <p className="text-center py-12 text-neutral-400">
          Loading archived {isChats ? "chats" : "projects"}...
        </p>
      ) : currentList.length > 0 ? (
        isChats ? (
          <div className="flex flex-col gap-2">
            {filteredChats.map((conversation) => (
              <ChatCard
                key={conversation.id}
                conversation={conversation}
                isSelected={chatHandlers.selectedIds.has(conversation.id)}
                onCardClick={chatHandlers.handleCardClick}
                project={
                  conversation.projectId
                    ? (activeProjectsById[conversation.projectId] ?? null)
                    : null
                }
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                sort={sortBy}
                isSelected={projectHandlers.selectedIds.has(project.id)}
                onCardClick={projectHandlers.handleCardClick}
              />
            ))}
          </div>
        )
      ) : (
        <div className="text-center py-12 text-neutral-400">
          {searchQuery ? (
            <>
              No archived {isChats ? "chats" : "projects"} found matching &quot;
              {searchQuery}&quot;
            </>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <p>No archived {isChats ? "chats" : "projects"}</p>
              <PrimaryButton
                text={isChats ? "Go to Chats" : "Go to Projects"}
                className="w-max justify-center text-sm px-4"
                href={isChats ? "/chats" : "/projects"}
                icon={<ArrowLeft size={15} />}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
