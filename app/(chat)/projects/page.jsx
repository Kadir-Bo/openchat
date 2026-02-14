"use client";

import { useDatabase, Dropdown } from "@/context";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Plus } from "react-feather";
import {
  PrimaryButton,
  ProjectCard,
  Searchbar,
  DropdownContent,
  DropdownItem,
  DropdownTrigger,
} from "@/components";

const FILTER_OPTIONS = [
  { id: "recent", sort: "activity", label: "Recent activity" },
  { id: "name", sort: "name", label: "Name" },
  { id: "date", sort: "date", label: "Date created" },
];

export default function ProjectsPage() {
  const { subscribeToProjects } = useDatabase();
  const [projects, setProjects] = useState([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [sortBy, setSortBy] = useState(FILTER_OPTIONS[0].sort);
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

  const handleSortChange = (sortValue) => () => {
    setSortBy(sortValue);
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

  const activeSort = FILTER_OPTIONS.find((item) => item.sort === sortBy);

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
        <Dropdown>
          <DropdownTrigger>
            <PrimaryButton
              text={activeSort?.label || "Sort by"}
              className="text-sm justify-center items-center px-3 min-w-32"
            />
          </DropdownTrigger>

          <DropdownContent side="bottom">
            {FILTER_OPTIONS.map((menuItem) => (
              <DropdownItem
                key={menuItem.id}
                onClick={handleSortChange(menuItem.sort)}
              >
                {menuItem.label}
              </DropdownItem>
            ))}
          </DropdownContent>
        </Dropdown>
      </div>

      <Searchbar onSearch={handleSearchProjects} />

      {isInitialLoading ? (
        <div className="col-span-2 text-center py-12 text-neutral-400">
          Loading projects...
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4 mt-6 w-full">
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
