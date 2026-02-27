"use client";

import { useDatabase } from "@/context";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  ChatCard,
  StackedProjectCard,
  ChatPageShell,
  DeleteButtons,
  EmptyStateSearch,
} from "@/components";
import { useOnClickOutside, useSelectionHandlers } from "@/hooks";
import {
  buildChatTabItems,
  filterProjects,
  groupConversationsByProject,
} from "@/lib";

export default function ChatsPage() {
  const {
    subscribeToConversations,
    subscribeToProjects,
    deleteConversation,
    deleteProject,
  } = useDatabase();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("chats");
  const [sortBy, setSortBy] = useState("activity");
  const [searchQuery, setSearchQuery] = useState("");
  const [conversations, setConversations] = useState([]);
  const [chatsLoading, setChatsLoading] = useState(true);
  const [allProjects, setAllProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(true);

  const chatListRef = useRef([]);
  const projectListRef = useRef([]);

  useEffect(() => {
    return subscribeToConversations((data) => {
      setConversations(data);
      setChatsLoading(false);
    }, false);
  }, [subscribeToConversations]);

  useEffect(() => {
    return subscribeToProjects((data) => {
      setAllProjects(data);
      setProjectsLoading(false);
    }, true);
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

  const conversationsByProject = useMemo(
    () => groupConversationsByProject(visibleConversations, projectsById),
    [visibleConversations, projectsById],
  );

  const chatTabItems = useMemo(() => {
    const items = buildChatTabItems({
      conversations: visibleConversations,
      projectsById,
      conversationsByProject,
      searchQuery,
      sortBy,
    });

    chatListRef.current = [
      ...items.filter((i) => i.type === "chat").map((i) => i.item),
      ...items
        .filter((i) => i.type === "project")
        .flatMap((i) => conversationsByProject[i.item.id] ?? []),
    ];

    return items;
  }, [
    visibleConversations,
    projectsById,
    conversationsByProject,
    searchQuery,
    sortBy,
  ]);

  const filteredProjects = useMemo(() => {
    const list = filterProjects(activeProjects, searchQuery, sortBy);
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
  const selectedCount = isChats
    ? (() => {
        let count = chatHandlers.selectedIds.size;
        for (const projectId of projectHandlers.selectedIds) {
          const chatIds = conversationsByProject[projectId] ?? [];
          const hasSelectedChats = chatIds.some((c) =>
            chatHandlers.selectedIds.has(c.id),
          );
          if (!hasSelectedChats) count += 1;
        }
        return count;
      })()
    : projectHandlers.selectedIds.size;
  const isLoading = isChats ? chatsLoading : projectsLoading;
  const hasItems = isChats
    ? chatTabItems.length > 0
    : activeProjects.length > 0;

  const handleClearSelection = () => {
    chatHandlers.clearSelection();
    projectHandlers.clearSelection();
  };
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    handleClearSelection();
    projectHandlers.clearSelection();
  };

  const getProjectChatIds = useCallback(
    (projectId) => (conversationsByProject[projectId] ?? []).map((c) => c.id),
    [conversationsByProject],
  );

  const handleProjectCardClick = useCallback(
    (e, id) => {
      projectHandlers.handleCardClick(e, id);
      const chatIds = getProjectChatIds(id);
      if (!projectHandlers.selectedIds.has(id)) {
        // selecting — add all chats
        chatHandlers.selectIds([...chatHandlers.selectedIds, ...chatIds]);
      } else {
        // deselecting — remove all chats
        const next = new Set(chatHandlers.selectedIds);
        chatIds.forEach((cid) => next.delete(cid));
        chatHandlers.selectIds([...next]);
      }
    },
    [projectHandlers, chatHandlers, getProjectChatIds],
  );

  const handleProjectChatClick = useCallback(
    (e, id) => {
      // Let chat handler do its own selection — don't call selectIds after
      chatHandlers.handleCardClick(e, id);

      const conversation = visibleConversations.find((c) => c.id === id);
      if (!conversation?.projectId) return;
      const projectId = conversation.projectId;
      const chatIds = getProjectChatIds(projectId);

      // Simulate the post-toggle state to decide project selection
      const currentSelected = chatHandlers.selectedIds;
      const nextChatSelected = new Set(currentSelected);
      nextChatSelected.has(id)
        ? nextChatSelected.delete(id)
        : nextChatSelected.add(id);

      const allSelected = chatIds.every((cid) => nextChatSelected.has(cid));

      // Only update project selection, don't touch chat selection
      if (allSelected) {
        projectHandlers.selectIds([...projectHandlers.selectedIds, projectId]);
      } else {
        const next = new Set(projectHandlers.selectedIds);
        next.delete(projectId);
        projectHandlers.selectIds([...next]);
      }
    },
    [chatHandlers, projectHandlers, visibleConversations, getProjectChatIds],
  );

  return (
    <ChatPageShell
      title="Chats"
      tabs={[
        { key: "chats", label: "Chats", count: visibleConversations.length },
        { key: "projects", label: "Projects", count: activeProjects.length },
      ]}
      activeTab={activeTab}
      onTabChange={handleTabChange}
      sortBy={sortBy}
      onSortChange={setSortBy}
      searchQuery={searchQuery}
      onSearch={setSearchQuery}
      searchPlaceholder={isChats ? "Search chats" : "Search projects..."}
      selectedCount={selectedCount}
      hasItems={hasItems}
      itemType={isChats ? "chat" : "project"}
      clearSelection={handleClearSelection}
      actions={
        <DeleteButtons
          selectedCount={selectedCount}
          itemType={isChats ? "chat" : "project"}
          hasItems={hasItems}
          onDeleteSelected={
            isChats
              ? chatHandlers.handleDeleteSelected
              : projectHandlers.handleDeleteSelected
          }
          onDeleteAll={() =>
            isChats
              ? chatHandlers.handleDeleteAll(chatListRef.current)
              : projectHandlers.handleDeleteAll(filteredProjects)
          }
        />
      }
    >
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
                  onCardClick={handleProjectCardClick}
                  onChatClick={handleProjectChatClick}
                  onLongPressStart={projectHandlers.handleLongPressStart}
                  onLongPressCancel={projectHandlers.handleLongPressCancel}
                  onChatLongPressStart={chatHandlers.handleLongPressStart}
                  onChatLongPressCancel={chatHandlers.handleLongPressCancel}
                  selectedChatIds={chatHandlers.selectedIds}
                />
              ) : (
                <ChatCard
                  key={item.id}
                  conversation={item}
                  isSelected={chatHandlers.selectedIds.has(item.id)}
                  onCardClick={chatHandlers.handleCardClick}
                  onLongPressStart={chatHandlers.handleLongPressStart}
                  onLongPressCancel={chatHandlers.handleLongPressCancel}
                  project={null}
                />
              ),
            )}
          </div>
        ) : (
          <EmptyStateSearch
            searchQuery={searchQuery}
            itemType="chat"
            href="/chat"
            hrefLabel="Start your first chat"
          />
        )
      ) : filteredProjects.length > 0 ? (
        <div className="flex flex-col gap-2">
          {filteredProjects.map((project) => (
            <StackedProjectCard
              key={project.id}
              project={project}
              conversations={conversationsByProject[project.id] ?? []}
              isSelected={projectHandlers.selectedIds.has(project.id)}
              onCardClick={projectHandlers.handleCardClick}
              onChatClick={chatHandlers.handleCardClick}
              onLongPressStart={projectHandlers.handleLongPressStart}
              onLongPressCancel={projectHandlers.handleLongPressCancel}
              onChatLongPressStart={chatHandlers.handleLongPressStart}
              onChatLongPressCancel={chatHandlers.handleLongPressCancel}
              selectedChatIds={chatHandlers.selectedIds}
            />
          ))}
        </div>
      ) : (
        <EmptyStateSearch
          searchQuery={searchQuery}
          itemType="project"
          href="/projects/new"
          hrefLabel="Create a project"
        />
      )}
    </ChatPageShell>
  );
}
7;
