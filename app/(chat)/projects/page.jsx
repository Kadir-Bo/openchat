"use client";

import { useDatabase, Dropdown } from "@/context";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Plus } from "react-feather";
import { PrimaryButton, ProjectCard, Searchbar, Select } from "@/components";

const FILTER_OPTIONS = [
  { id: "recent", value: "activity", label: "Recent activity" },
  { id: "name", value: "name", label: "Name" },
  { id: "date", value: "date", label: "Date created" },
];

export default function ProjectsPage() {
  const { subscribeToProjects } = useDatabase();
  const [projects, setProjects] = useState([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [sortBy, setSortBy] = useState(FILTER_OPTIONS[0].value);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    // Real-time Listener für Projekte
    const unsubscribe = subscribeToProjects((fetchedProjects) => {
      setProjects(fetchedProjects);
      setIsInitialLoading(false);
    }, false);

    // Cleanup beim Unmount
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [subscribeToProjects]);

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
  };

  const handleSearchProjects = useCallback((query) => {
    setSearchQuery(query);
  }, []);

  const filteredAndSortedProjects = useMemo(() => {
    let filtered = projects;

    if (searchQuery.trim()) {
      const lowerQuery = searchQuery.toLowerCase();
      filtered = projects.filter((project) => {
        const searchableText = [project.title, project.description]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return searchableText.includes(lowerQuery);
      });
    }

    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "name":
          return (a.title || "").localeCompare(b.title || "");

        case "date":
          const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt);
          const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt);
          return dateB - dateA;

        case "activity":
          const activityA = a.updatedAt?.toDate?.() || new Date(a.updatedAt);
          const activityB = b.updatedAt?.toDate?.() || new Date(b.updatedAt);
          return activityB - activityA;

        default:
          return 0;
      }
    });

    return sorted;
  }, [projects, searchQuery, sortBy]);

  const activeSort = FILTER_OPTIONS.find((item) => item.value === sortBy);

  return (
    <div className="flex-1 flex flex-col items-center justify-center max-w-5xl mx-auto py-8 gap-6">
      <header className="flex items-center justify-between w-full">
        <h1 className="text-3xl font-light">Projects</h1>
        <PrimaryButton
          text="New Project"
          icon={<Plus size={17} />}
          className="w-max justify-center text-sm min-w-32"
          href="/projects/create"
          filled
        />
      </header>

      <div className="w-full flex justify-end items-center gap-3 min-w-34">
        <span className="text-neutral-400 text-sm">Sort by:</span>
        <Select
          id="chat-sort"
          name="sort"
          label=""
          value={activeSort?.label || "Sort by"}
          list={FILTER_OPTIONS}
          onChange={handleSortChange}
          containerClassName="w-auto min-w-40"
          labelClassName="hidden"
          buttonClassName="text-sm px-3 min-w-32"
        />
      </div>

      <Searchbar onSearch={handleSearchProjects} className="mb-6" />

      <div className="flex gap-2 w-full"></div>

      {isInitialLoading ? (
        <div className="col-span-2 text-center py-12 text-neutral-400">
          Loading projects...
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4 w-full">
          {filteredAndSortedProjects.length > 0 ? (
            filteredAndSortedProjects.map((project) => (
              <ProjectCard key={project.id} project={project} sort={sortBy} />
            ))
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
                    className="w-max justify-center text-sm"
                    href="/projects/create"
                    filled
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
