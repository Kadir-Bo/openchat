import React, { useEffect, useState } from "react";
import { usePathname, useParams, useRouter } from "next/navigation";
import {
  Archive,
  ChevronDown,
  Edit2,
  FolderPlus,
  Menu,
  MessageSquare,
  MoreVertical,
  Trash,
} from "react-feather";
import {
  DropdownMenu,
  Icon,
  PrimaryButton,
  RenameProjectModal,
  DeleteConfirmModal,
  RenameChatModal,
} from "@/components";
import { getTitle } from "@/lib";
import { useDatabase } from "@/context/DatabaseContext";
import { useModal } from "@/context";

export default function ChatHeader({ handleToggleSidebar }) {
  const pathname = usePathname();
  const params = useParams();
  const router = useRouter();
  const {
    getProject,
    toggleArchiveProject,
    deleteProject,
    getConversation,
    deleteConversation,
  } = useDatabase();
  const { openModal, openMessage } = useModal();

  const [project, setProject] = useState(null);
  const [chat, setChat] = useState(null);

  const isProjectPage = pathname.startsWith("/project/");
  const isChatPage = pathname.startsWith("/chat/") && pathname !== "/chat";
  const projectId = isProjectPage ? params?.id : null;
  const chatId = isChatPage ? params?.chatId : null;

  // ── fetch project ──
  useEffect(() => {
    if (!projectId) {
      setProject(null);
      return;
    }
    getProject(projectId).then((p) => setProject(p ?? null));
  }, [projectId, getProject]);

  // ── fetch conversation title ──
  useEffect(() => {
    if (!chatId) {
      setChat(null);
      return;
    }
    getConversation(chatId).then((c) => setChat(c ?? "Chat"));
  }, [chatId, getConversation]);

  const title = isProjectPage
    ? (project?.title ?? "Project")
    : isChatPage
      ? (chat?.title ?? "Chat")
      : getTitle(pathname, params);

  // ── project dropdown actions ──
  const handleArchiveProject = async () => {
    const result = await toggleArchiveProject(projectId, !project?.isArchived);
    if (result) {
      openMessage(
        project?.isArchived ? "Project unarchived" : "Project archived",
        "success",
      );
      setProject((prev) => ({ ...prev, isArchived: !prev.isArchived }));
    }
  };

  const handleDeleteProject = async () => {
    const result = await deleteProject(projectId);
    if (result) {
      openMessage("Project deleted", "success");
      router.push("/projects");
    }
  };
  // ── project dropdown actions ──

  const handleDeleteChat = async () => {
    const result = await deleteConversation(chatId);
    if (result) {
      openMessage("Project deleted", "success");
      router.push("/chat");
    }
  };
  const handleArchiveChat = async () => {
    const result = await toggleArchiveProject(chatId, !chat?.isArchived);
    if (result) {
      openMessage(
        chat?.isArchived ? "Chat unarchived" : "Chat archived",
        "success",
      );
      setChat((prev) => ({ ...prev, isArchived: !prev.isArchived }));
      router.push("/chat");
    }
  };
  const handleNewChat = () => {
    router.push("/chat");
  };
  const projectMenuItems = project
    ? [
        {
          id: "rename-project",
          label: "Rename",
          icon: Edit2,
          action: () =>
            openModal(
              <RenameProjectModal
                title={project.title}
                description={project.description}
                id={projectId}
                onSuccess={(updates) =>
                  setProject((prev) => ({ ...prev, ...updates }))
                }
              />,
            ),
        },
        {
          id: "archive-project",
          label: project.isArchived ? "Unarchive" : "Archive",
          icon: Archive,
          action: handleArchiveProject,
        },
        {
          id: "delete-project",
          label: "Löschen",
          icon: Trash,
          action: () =>
            openModal(
              <DeleteConfirmModal
                title={project.title}
                description={`Are you sure you want to delete the project "${project.title}"? This action cannot be undone.`}
                onConfirm={handleDeleteProject}
              />,
            ),
        },
      ]
    : [];

  const chatMenuItems = chat
    ? [
        {
          id: "new-chat",
          label: "New Chat",
          icon: MessageSquare,
          action: handleNewChat,
        },
        {
          id: "rename-chat",
          label: "Rename",
          icon: Edit2,
          separator: true,
          action: () =>
            openModal(
              <RenameChatModal
                title={chat.title}
                description={chat.description}
                id={chatId}
                onSuccess={(updates) =>
                  setChat((prev) => ({ ...prev, ...updates }))
                }
              />,
            ),
        },
        {
          id: "archive-chat",
          label: chat.isArchived ? "Unarchive" : "Archive",
          icon: Archive,
          action: handleArchiveChat,
        },
        {
          id: "delete-chat",
          label: "Löschen",
          icon: Trash,
          action: () =>
            openModal(
              <DeleteConfirmModal
                title={chat.title}
                description={`Are you sure you want to delete the chat "${chat.title}"? This action cannot be undone.`}
                onConfirm={handleDeleteChat}
              />,
            ),
        },
      ]
    : [];

  return (
    <div className="w-full bg-neutral-900">
      <div className="max-w-550 mx-auto flex justify-between items-center px-2 py-2 md:py-1 h-max">
        {/* Left — sidebar toggle */}
        <div className="">
          <button
            className="outline-none p-3 h-full md:hidden"
            onClick={handleToggleSidebar}
            aria-label="Open sidebar"
          >
            <Icon name={Menu} size="md" />
          </button>
        </div>

        {/* Center — title */}
        <div className="flex items-center justify-center flex-1 font-medium min-w-0 relative">
          <h2 className="truncate text-center text-sm">{title}</h2>
        </div>

        {/* Right — actions */}
        <div className="flex justify-end items-center">
          {isProjectPage && project ? (
            <DropdownMenu
              dropdownList={projectMenuItems}
              triggerClassName="p-2 border-none"
              contentSideOffset={4}
              onClick={(e, menuItem) => {
                e.stopPropagation();
                menuItem.action();
              }}
            >
              <Icon name={MoreVertical} size="md" />
            </DropdownMenu>
          ) : isChatPage && chat ? (
            <DropdownMenu
              dropdownList={chatMenuItems}
              triggerClassName="p-2 border-none"
              contentSideOffset={4}
              onClick={(e, menuItem) => {
                e.stopPropagation();
                menuItem.action();
              }}
            >
              <Icon name={MoreVertical} size="md" />
            </DropdownMenu>
          ) : title === "Projects" ? (
            <PrimaryButton
              className="p-2 m-0 border-none w-max"
              tooltip="New Project"
              tooltipPosition="left"
              href="/projects/create"
            >
              <Icon name={FolderPlus} size="md" />
            </PrimaryButton>
          ) : (
            <PrimaryButton
              className="p-2 m-0 border-none w-max"
              tooltip="New Chat"
              tooltipPosition="left"
              href="/chat"
            >
              <Icon name={MessageSquare} size="md" />
            </PrimaryButton>
          )}
        </div>
      </div>
    </div>
  );
}
