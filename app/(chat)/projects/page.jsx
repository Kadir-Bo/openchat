"use client";

import { useDatabase, useModal } from "@/context";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Plus } from "react-feather";
import {
  PrimaryButton,
  ProjectCard,
  ChatPageShell,
  DeleteConfirmModal,
  Icon,
} from "@/components";
import { useRouter } from "next/navigation";
import { FILTER_OPTIONS } from "@/lib";
import { useSelectionHandlers } from "@/hooks";

export default function ProjectsPage() {
  const { subscribeToProjects, deleteProject, toggleArchiveProject } =
    useDatabase();
  const router = useRouter();

  const [projects, setProjects] = useState([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [sortBy, setSortBy] = useState(FILTER_OPTIONS[0].value);
  const [searchQuery, setSearchQuery] = useState("");
  const { openModal } = useModal();

  const filteredListRef = useRef([]);

  useEffect(() => {
    const unsubscribe = subscribeToProjects((data) => {
      setProjects(data);
      setIsInitialLoading(false);
    }, false);
    return () => unsubscribe?.();
  }, [subscribeToProjects]);

  // Escape clears selection — handled inside useSelectionHandlers,
  // but we also wire it here for safety.
  const filteredAndSortedProjects = useMemo(() => {
    const filtered = searchQuery.trim()
      ? projects.filter((p) =>
          [p.title, p.description]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(searchQuery.toLowerCase()),
        )
      : projects;

    return [...filtered].sort((a, b) => {
      if (sortBy === "name")
        return (a.title || "").localeCompare(b.title || "");
      const key = sortBy === "date" ? "createdAt" : "updatedAt";
      const toDate = (v) => v?.toDate?.() ?? new Date(v);
      return toDate(b[key]) - toDate(a[key]);
    });
  }, [projects, searchQuery, sortBy]);

  useEffect(() => {
    filteredListRef.current = filteredAndSortedProjects;
  }, [filteredAndSortedProjects]);

  const {
    selectedIds,
    handleCardClick,
    handleLongPressStart,
    handleLongPressCancel,
    clearSelection,
    handleDeleteSelected,
    handleDeleteAll,
  } = useSelectionHandlers({
    listRef: filteredListRef,
    onNavigate: (id) => router.push(`/project/${id}`),
    deleteOne: deleteProject,
  });

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") clearSelection();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [clearSelection]);

  const handleArchiveSelected = useCallback(async () => {
    await Promise.all(
      [...selectedIds].map((id) => toggleArchiveProject(id, true)),
    );
    clearSelection();
  }, [selectedIds, toggleArchiveProject, clearSelection]);

  const handleDeleteAction = () => {
    if (selectedCount > 0) {
      openModal(
        <DeleteConfirmModal
          title={`${selectedCount} ${selectedCount > 1 ? "Projects" : "Project"}`}
          description={`Are you sure you want to delete ${selectedCount} selected ${
            selectedCount === 1 ? "project" : "projects"
          }? This action cannot be undone.`}
          onConfirm={handleDeleteSelected}
        />,
      );
    } else {
      openModal(
        <DeleteConfirmModal
          title="All Projects"
          description="Are you sure you want to delete ALL projects? This action cannot be undone."
          onConfirm={() => handleDeleteAll(filteredAndSortedProjects)}
        />,
      );
    }
  };

  const selectedCount = selectedIds.size;
  const hasProjects = projects.length > 0;

  if (isInitialLoading) return null;

  return (
    <ChatPageShell
      title="Projects"
      sortBy={sortBy}
      onSortChange={setSortBy}
      searchQuery={searchQuery}
      onSearch={setSearchQuery}
      searchPlaceholder="Search Projects"
      selectedCount={selectedCount}
      hasItems={hasProjects}
      itemType={selectedCount === 1 ? "project" : "projects"}
      headerActionTitle={"New Project"}
      headerActionLink={"/projects/create"}
      clearSelection={clearSelection}
      actions={
        hasProjects && (
          <>
            <PrimaryButton
              className="w-max px-4 text-red-400 border-red-400/30 hover:bg-red-400/10 hover:border-red-400/60"
              onClick={handleDeleteAction}
            >
              {selectedCount > 0 ? `Delete ${selectedCount}` : "Delete All"}
            </PrimaryButton>
          </>
        )
      }
    >
      {filteredAndSortedProjects.length > 0 ? (
        <div className="grid grid-cols-3 mt-4 md:mt-0 gap-2 md:gap-4">
          {filteredAndSortedProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              sort={sortBy}
              isSelected={selectedIds.has(project.id)}
              onCardClick={handleCardClick}
              onLongPressStart={handleLongPressStart}
              onLongPressCancel={handleLongPressCancel}
              className="col-span-3 md:col-span-1"
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-neutral-400 col-span-3">
          {searchQuery ? (
            <>No projects found matching &quot;{searchQuery}&quot;</>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <p>No projects yet</p>
              <PrimaryButton
                className="w-max justify-center text-sm px-4"
                href="/projects/create"
              >
                <Icon name={Plus} size="sm" />
                Create your first project
              </PrimaryButton>
            </div>
          )}
        </div>
      )}
    </ChatPageShell>
  );
}
