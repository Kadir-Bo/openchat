"use client";

import { useDatabase } from "@/context";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Plus, Trash2 } from "react-feather";
import {
  PrimaryButton,
  ChatCard,
  Searchbar,
  Select,
  ProjectCard,
  StackedProjectCard,
  SelectionStatus,
} from "@/components";
import { useRouter } from "next/navigation";
import { useSelectionHandlers } from "@/hooks";

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
  let patternIdx = 0,
    strIdx = 0,
    score = 0,
    consecutiveMatches = 0;
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

export default function ChatsPage() {
  const {
    subscribeToConversations,
    subscribeToProjects,
    deleteConversation,
    deleteProject,
  } = useDatabase();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("chats");
  const [sortBy, setSortBy] = useState(FILTER_OPTIONS[0].value);
  const [searchQuery, setSearchQuery] = useState("");
  const [conversations, setConversations] = useState([]);
  const [chatsLoading, setChatsLoading] = useState(true);
  const [allProjects, setAllProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(true);

  const chatListRef = useRef([]);
  const projectListRef = useRef([]);

  useEffect(() => {
    const unsubscribe = subscribeToConversations((data) => {
      setConversations(data);
      setChatsLoading(false);
    }, false);
    return () => unsubscribe?.();
  }, [subscribeToConversations]);

  useEffect(() => {
    const unsubscribe = subscribeToProjects((data) => {
      setAllProjects(data);
      setProjectsLoading(false);
    }, true);
    return () => unsubscribe?.();
  }, [subscribeToProjects]);

  const activeProjects = useMemo(
    () => allProjects.filter((p) => !p.isArchived),
    [allProjects],
  );

  const archivedProjectIds = useMemo(
    () => new Set(allProjects.filter((p) => p.isArchived).map((p) => p.id)),
    [allProjects],
  );

  const projectsById = useMemo(
    () => Object.fromEntries(activeProjects.map((p) => [p.id, p])),
    [activeProjects],
  );

  const visibleConversations = useMemo(
    () =>
      conversations.filter(
        (c) => !c.projectId || !archivedProjectIds.has(c.projectId),
      ),
    [conversations, archivedProjectIds],
  );

  // Group conversations by their projectId
  const conversationsByProject = useMemo(() => {
    const map = {};
    for (const c of visibleConversations) {
      if (c.projectId && projectsById[c.projectId]) {
        if (!map[c.projectId]) map[c.projectId] = [];
        map[c.projectId].push(c);
      }
    }
    return map;
  }, [visibleConversations, projectsById]);

  // Build the mixed list for the chats tab:
  // standalone chats render as ChatCard, project groups as StackedProjectCard
  const chatTabItems = useMemo(() => {
    const q = searchQuery.trim();
    const toMs = (v) => v?.toDate?.().getTime() ?? new Date(v).getTime();
    const sortKey = (item) => {
      if (sortBy === "name") return item.title || "";
      const key = sortBy === "date" ? "createdAt" : "updatedAt";
      return toMs(item[key]);
    };

    const items = [];
    const seenProjects = new Set();

    for (const c of visibleConversations) {
      const project = c.projectId ? projectsById[c.projectId] : null;

      if (project) {
        // Only add one entry per project group
        if (seenProjects.has(project.id)) continue;
        seenProjects.add(project.id);

        if (q) {
          const projectMatch = fuzzyMatch(project.title || "", q);
          const chatMatches = (conversationsByProject[project.id] ?? []).map(
            (conv) => fuzzyMatch(conv.title || "", q),
          );
          const bestChatScore = chatMatches.reduce(
            (best, s) => (s.score > best.score ? s : best),
            { match: false, score: 0 },
          );
          if (!projectMatch.match && !bestChatScore.match) continue;
          items.push({
            type: "project",
            item: project,
            score: Math.max(projectMatch.score, bestChatScore.score),
            sortValue: sortKey(project),
          });
        } else {
          items.push({
            type: "project",
            item: project,
            sortValue: sortKey(project),
          });
        }
      } else {
        // Standalone chat
        if (q) {
          const { match, score } = fuzzyMatch(c.title || "", q);
          if (!match) continue;
          items.push({ type: "chat", item: c, score, sortValue: sortKey(c) });
        } else {
          items.push({ type: "chat", item: c, sortValue: sortKey(c) });
        }
      }
    }

    // Sort
    if (q) {
      items.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
    } else if (sortBy === "name") {
      items.sort((a, b) =>
        (a.sortValue || "").localeCompare(b.sortValue || ""),
      );
    } else {
      items.sort((a, b) => b.sortValue - a.sortValue);
    }

    // Sync chatListRef for selection handlers (standalone chats only)
    chatListRef.current = items
      .filter((i) => i.type === "chat")
      .map((i) => i.item);

    return items;
  }, [
    visibleConversations,
    projectsById,
    conversationsByProject,
    searchQuery,
    sortBy,
  ]);

  const filteredProjects = useMemo(() => {
    const q = searchQuery.trim();
    const list = q
      ? activeProjects.filter((p) =>
          [p.title, p.description]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(q.toLowerCase()),
        )
      : [...activeProjects].sort((a, b) => {
          if (sortBy === "name")
            return (a.title || "").localeCompare(b.title || "");
          const key = sortBy === "date" ? "createdAt" : "updatedAt";
          const toDate = (v) => v?.toDate?.() ?? new Date(v);
          return toDate(b[key]) - toDate(a[key]);
        });
    projectListRef.current = list;
    return list;
  }, [activeProjects, searchQuery, sortBy]);

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

  useEffect(() => {
    setSearchQuery("");
  }, [activeTab]);

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

  const isChats = activeTab === "chats";
  const activeSort = FILTER_OPTIONS.find((o) => o.value === sortBy);
  const selectedCount = isChats
    ? chatHandlers.selectedIds.size
    : projectHandlers.selectedIds.size;
  const isLoading = isChats ? chatsLoading : projectsLoading;
  const hasItems = isChats
    ? chatTabItems.length > 0
    : activeProjects.length > 0;

  return (
    <div className="flex-1 flex flex-col max-w-220 mx-auto py-8 gap-6 w-full">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-light">Chats</h1>
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
              {tab === "chats"
                ? visibleConversations.length
                : activeProjects.length}
            </span>
          </button>
        ))}
      </div>

      <div className="flex justify-end items-center gap-3">
        <span className="text-neutral-400 text-sm">Sort by:</span>
        <Select
          id="chat-sort"
          name="sort"
          label=""
          value={activeSort?.label || "Sort by"}
          list={FILTER_OPTIONS}
          onChange={(e) => setSortBy(e.target.value)}
          containerClassName="w-auto min-w-40"
          labelClassName="hidden"
          buttonClassName="text-sm px-3 min-w-32 justify-center"
        />
      </div>

      <Searchbar
        onSearch={(q) => setSearchQuery(q)}
        placeholder={
          isChats ? "Search chats or projects..." : "Search projects..."
        }
      />

      {/* Action bar */}
      <div className="flex items-center justify-between">
        <SelectionStatus
          selectedCount={selectedCount}
          itemType={isChats ? "chat" : "project"}
          hasItems={hasItems}
        />
        <div className="flex items-center gap-2">
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
                  ? chatHandlers.handleDeleteAll(chatListRef.current)
                  : projectHandlers.handleDeleteAll(filteredProjects)
              }
            />
          )}
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <p className="text-center py-12 text-neutral-400">
          Loading {isChats ? "chats" : "projects"}...
        </p>
      ) : isChats ? (
        chatTabItems.length > 0 ? (
          <div className="flex flex-col gap-2">
            {chatTabItems.map(({ type, item }) =>
              type === "project" ? (
                <StackedProjectCard
                  key={item.id}
                  project={item}
                  conversations={conversationsByProject[item.id] ?? []}
                  isSelected={projectHandlers.selectedIds.has(item.id)}
                  onCardClick={projectHandlers.handleCardClick}
                />
              ) : (
                <ChatCard
                  key={item.id}
                  conversation={item}
                  isSelected={chatHandlers.selectedIds.has(item.id)}
                  onCardClick={chatHandlers.handleCardClick}
                  project={null}
                />
              ),
            )}
          </div>
        ) : (
          <div className="text-center py-12 text-neutral-400">
            {searchQuery ? (
              <>No chats found matching &quot;{searchQuery}&quot;</>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <p>No chats yet</p>
                <PrimaryButton
                  text="Start your first chat"
                  icon={<Plus size={17} />}
                  className="w-max justify-center text-sm"
                  href="/chat"
                  filled
                />
              </div>
            )}
          </div>
        )
      ) : filteredProjects.length > 0 ? (
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
      ) : (
        <div className="text-center py-12 text-neutral-400">
          {searchQuery ? (
            <>No projects found matching &quot;{searchQuery}&quot;</>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <p>No projects yet</p>
              <PrimaryButton
                text="Create a project"
                icon={<Plus size={17} />}
                className="w-max justify-center text-sm"
                href="/projects/new"
                filled
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
