"use client";

import { useDatabase } from "@/context";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Plus, Trash2 } from "react-feather";
import { PrimaryButton, ProjectCard, Searchbar, Select } from "@/components";
import { useRouter } from "next/navigation";

const FILTER_OPTIONS = [
  { id: "recent", value: "activity", label: "Recent activity" },
  { id: "name", value: "name", label: "Name" },
  { id: "date", value: "date", label: "Date created" },
];

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
  const activeSort = FILTER_OPTIONS.find((o) => o.value === sortBy);
  const hasProjects = projects.length > 0;

  if (isInitialLoading) {
    return null;
  }

  return (
    <div className="flex-1 flex flex-col max-w-220 mx-auto py-8 gap-6 w-full">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-light">Projects</h1>
        <PrimaryButton
          text="New Project"
          icon={<Plus size={17} />}
          className="w-max justify-center text-sm min-w-32"
          href="/projects/create"
          filled
        />
      </header>

      <div className="flex justify-end items-center gap-3">
        <span className="text-neutral-400 text-sm">Sort by:</span>
        <Select
          id="project-sort"
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
        placeholder="Search Projects"
      />

      <div className="flex items-center justify-between h-10">
        <span className="text-xs text-neutral-600">
          {selectedCount > 0
            ? `${selectedCount} ${selectedCount === 1 ? "project" : "projects"} selected — Esc to cancel`
            : hasProjects
              ? "⌘ / Ctrl + click to select"
              : ""}
        </span>

        {selectedCount > 0 && (
          <div className="flex items-center gap-2">
            <PrimaryButton
              text={`Archive ${selectedCount}`}
              className="w-max text-sm px-4"
              onClick={handleArchiveSelected}
            />
            <PrimaryButton
              text={`Delete ${selectedCount} ${selectedCount === 1 ? "project" : "projects"}`}
              icon={<Trash2 size={14} />}
              className="w-max text-sm px-4 text-red-400 border-red-400/30 hover:bg-red-400/10 hover:border-red-400/60"
              onClick={handleDeleteSelected}
            />
          </div>
        )}
      </div>

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
                text="Create your first project"
                icon={<Plus size={17} />}
                className="w-max justify-center text-sm px-4 shadow-none"
                href="/projects/create"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
