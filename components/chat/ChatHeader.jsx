import React, { useEffect, useState } from "react";
import { usePathname, useParams, useRouter } from "next/navigation";
import {
  Archive,
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
} from "@/components";
import { getTitle } from "@/lib";
import { useDatabase } from "@/context/DatabaseContext";
import { useModal } from "@/context";

export default function ChatHeader({ handleToggleSidebar }) {
  const pathname = usePathname();
  const params = useParams();
  const router = useRouter();
  const { getProject, toggleArchiveProject, deleteProject } = useDatabase();
  const { openModal, openMessage } = useModal();

  const [project, setProject] = useState(null);

  const isProjectPage = pathname.startsWith("/project/");
  const projectId = isProjectPage ? params?.id : null;

  useEffect(() => {
    if (!projectId) {
      setProject(null);
      return;
    }
    getProject(projectId).then((p) => setProject(p ?? null));
  }, [projectId, getProject]);

  const title = isProjectPage
    ? (project?.title ?? "Project")
    : getTitle(pathname, params);

  // ── project dropdown actions ──
  const handleArchive = async () => {
    const result = await toggleArchiveProject(projectId, !project?.isArchived);
    if (result) {
      openMessage(
        project?.isArchived ? "Project unarchived" : "Project archived",
        "success",
      );
      setProject((prev) => ({ ...prev, isArchived: !prev.isArchived }));
    }
  };

  const handleDelete = async () => {
    const result = await deleteProject(projectId);
    if (result) {
      openMessage("Project deleted", "success");
      router.push("/projects");
    }
  };

  const projectMenuItems = project
    ? [
        {
          id: "rename-project",
          label: "Umbenennen",
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
          label: project.isArchived ? "Dearchivieren" : "Archivieren",
          icon: Archive,
          action: handleArchive,
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
                onConfirm={handleDelete}
              />,
            ),
        },
      ]
    : [];

  return (
    <div className="w-full bg-neutral-900">
      <div className="max-w-550 mx-auto flex justify-between items-center px-2 py-2 md:py-1 h-max">
        {/* Left — sidebar toggle */}
        <div className="flex-1">
          <button
            className="outline-none p-3 h-full md:hidden"
            onClick={handleToggleSidebar}
            aria-label="Open sidebar"
          >
            <Icon name={Menu} size="md" />
          </button>
        </div>

        {/* Center — title */}
        <div className="flex items-center justify-center flex-1 font-medium min-w-0">
          <span className="truncate max-w-48 text-center">{title}</span>
        </div>

        {/* Right — actions */}
        <div className="flex flex-1 justify-end items-center">
          {isProjectPage && project ? (
            <DropdownMenu
              dropdownList={projectMenuItems}
              triggerClassName="p-2 border-none"
              contentSide="left"
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
