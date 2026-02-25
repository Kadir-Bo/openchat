"use client";

import { useDatabase } from "@/context";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Archive, Plus, Trash2 } from "react-feather";
import { PrimaryButton, ProjectCard, ChatPageShell } from "@/components";
import { useRouter } from "next/navigation";
import { FILTER_OPTIONS } from "@/lib";

export default function ProjectsPage() {
  const { subscribeToProjects, deleteProject, toggleArchiveProject } =
    useDatabase();
  const router = useRouter();

  const [projects, setProjects] = useState([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [sortBy, setSortBy] = useState(FILTER_OPTIONS[0].value);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState(new Set());

  const selectedIdsRef = useRef(selectedIds);
  const lastClickedIndexRef = useRef(null);
  const filteredListRef = useRef([]);

  useEffect(() => {
    selectedIdsRef.current = selectedIds;
  }, [selectedIds]);

  useEffect(() => {
    const unsubscribe = subscribeToProjects((data) => {
      setProjects(data);
      setIsInitialLoading(false);
    }, false);
    return () => unsubscribe?.();
  }, [subscribeToProjects]);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        setSelectedIds(new Set());
        lastClickedIndexRef.current = null;
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

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

  const handleCardClick = useCallback(
    (e, id) => {
      const list = filteredListRef.current;
      const index = list.findIndex((p) => p.id === id);
      const selected = selectedIdsRef.current;

      if (
        e.shiftKey &&
        lastClickedIndexRef.current !== null &&
        selected.size > 0
      ) {
        const start = Math.min(lastClickedIndexRef.current, index);
        const end = Math.max(lastClickedIndexRef.current, index);
        const range = list.slice(start, end + 1).map((p) => p.id);
        setSelectedIds((prev) => new Set([...prev, ...range]));
        lastClickedIndexRef.current = index;
        return;
      }

      if (e.metaKey || e.ctrlKey || selected.size > 0) {
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.has(id) ? next.delete(id) : next.add(id);
          return next;
        });
        lastClickedIndexRef.current = index;
        return;
      }

      router.push(`/project/${id}`);
    },
    [router],
  );

  const handleArchiveSelected = useCallback(async () => {
    await Promise.all(
      [...selectedIdsRef.current].map((id) => toggleArchiveProject(id, true)),
    );
    setSelectedIds(new Set());
    lastClickedIndexRef.current = null;
  }, [toggleArchiveProject]);

  const handleDeleteSelected = useCallback(async () => {
    await Promise.all(
      [...selectedIdsRef.current].map((id) => deleteProject(id)),
    );
    setSelectedIds(new Set());
    lastClickedIndexRef.current = null;
  }, [deleteProject]);

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
      actions={
        selectedCount > 0 && (
          <>
            <PrimaryButton
              className="w-max text-sm px-4"
              onClick={handleArchiveSelected}
            >
              <Archive size={14} />
              {`Archive ${selectedCount}`}
            </PrimaryButton>
            <PrimaryButton
              className="w-max text-sm px-4 text-red-400 border-red-400/30 hover:bg-red-400/10 hover:border-red-400/60"
              onClick={handleDeleteSelected}
            >
              <Trash2 size={14} />
              {`Delete ${selectedCount} ${selectedCount === 1 ? "project" : "projects"}`}
            </PrimaryButton>
          </>
        )
      }
    >
      {filteredAndSortedProjects.length > 0 ? (
        <div className="grid grid-cols-3 gap-4">
          {filteredAndSortedProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              sort={sortBy}
              isSelected={selectedIds.has(project.id)}
              onCardClick={handleCardClick}
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
                <Plus size={17} />
                Create your first project
              </PrimaryButton>
            </div>
          )}
        </div>
      )}
    </ChatPageShell>
  );
}
