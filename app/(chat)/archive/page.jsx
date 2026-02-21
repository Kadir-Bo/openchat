"use client";

import { useDatabase } from "@/context";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ArrowLeft } from "react-feather";
import {
  ChatCard,
  StackedProjectCard,
  ChatPageShell,
  DeleteButtons,
  EmptyStateSearch,
  PrimaryButton,
} from "@/components";
import { useSelectionHandlers } from "@/hooks";
import { useRouter } from "next/navigation";
import {
  buildChatTabItems,
  filterProjects,
  groupConversationsByProject,
} from "@/lib";

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
  const [sortBy, setSortBy] = useState("activity");
  const [searchQuery, setSearchQuery] = useState("");
  const [chats, setChats] = useState([]);
  const [chatsLoading, setChatsLoading] = useState(true);
  const [allProjects, setAllProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(true);

  const chatListRef = useRef([]);
  const projectListRef = useRef([]);

  useEffect(() => {
    return subscribeToArchivedConversations((data) => {
      setChats(data);
      setChatsLoading(false);
    });
  }, [subscribeToArchivedConversations]);

  useEffect(() => {
    return subscribeToProjects((data) => {
      setAllProjects(data);
      setProjectsLoading(false);
    }, true);
  }, [subscribeToProjects]);

  const archivedProjects = useMemo(
    () => allProjects.filter((p) => p.isArchived),
    [allProjects],
  );

  const allProjectsById = useMemo(
    () => Object.fromEntries(allProjects.map((p) => [p.id, p])),
    [allProjects],
  );

  const conversationsByProject = useMemo(
    () => groupConversationsByProject(chats, null),
    [chats],
  );

  const chatTabItems = useMemo(() => {
    const items = buildChatTabItems({
      conversations: chats,
      projectsById: allProjectsById,
      conversationsByProject,
      searchQuery,
      sortBy,
    });
    chatListRef.current = items
      .filter((i) => i.type === "chat")
      .map((i) => i.item);
    return items;
  }, [chats, allProjectsById, conversationsByProject, searchQuery, sortBy]);

  const filteredProjects = useMemo(() => {
    const list = filterProjects(archivedProjects, searchQuery, sortBy);
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
    ? chatHandlers.selectedIds.size
    : projectHandlers.selectedIds.size;
  const isLoading = isChats ? chatsLoading : projectsLoading;
  const hasItems = isChats
    ? chatTabItems.length > 0
    : archivedProjects.length > 0;

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    chatHandlers.clearSelection();
    projectHandlers.clearSelection();
  };

  return (
    <ChatPageShell
      title="Archive"
      tabs={[
        { key: "chats", label: "Chats", count: chats.length },
        { key: "projects", label: "Projects", count: archivedProjects.length },
      ]}
      activeTab={activeTab}
      onTabChange={handleTabChange}
      sortBy={sortBy}
      onSortChange={setSortBy}
      searchQuery={searchQuery}
      onSearch={setSearchQuery}
      searchPlaceholder={`Search archived ${isChats ? "chats" : "projects"}`}
      selectedCount={selectedCount}
      hasItems={hasItems}
      itemType={isChats ? "chat" : "project"}
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
          extraActions={
            !isChats &&
            selectedCount > 0 && (
              <PrimaryButton
                text={`Unarchive ${selectedCount}`}
                className="w-max text-sm px-4"
                onClick={handleUnarchiveSelected}
              />
            )
          }
        />
      }
    >
      {isLoading ? (
        <p className="text-center py-12 text-neutral-400">
          Loading archived {isChats ? "chats" : "projects"}...
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
          <EmptyStateSearch
            searchQuery={searchQuery}
            itemType="archived chat"
            href="/chats"
            hrefLabel="Go to Chats"
            icon={<ArrowLeft size={15} />}
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
            />
          ))}
        </div>
      ) : (
        <EmptyStateSearch
          searchQuery={searchQuery}
          itemType="archived project"
          href="/projects"
          hrefLabel="Go to Projects"
          icon={<ArrowLeft size={15} />}
        />
      )}
    </ChatPageShell>
  );
}
