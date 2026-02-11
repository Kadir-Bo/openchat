"use client";

import { PrimaryButton, ProjectCard, Searchbar } from "@/components";
import { useDatabase } from "@/context/DatabaseContext";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Plus } from "react-feather";

const FILTER_OPTIONS = [
  { id: "recent", sort: "activity", label: "Recent activity" },
  { id: "name", sort: "name", label: "Name" },
  { id: "date", sort: "date", label: "Date created" },
];

export default function ProjectsPage() {
  const { getProjects, loading } = useDatabase();
  const [projects, setProjects] = useState([]);
  const [sortBy, setSortBy] = useState(FILTER_OPTIONS[0].sort);
  const [searchQuery, setSearchQuery] = useState("");

  // Load projects on mount
  useEffect(() => {
    const loadProjects = async () => {
      const fetchedProjects = await getProjects(false);
      if (fetchedProjects) {
        setProjects(fetchedProjects);
      }
    };

    loadProjects();
  }, [getProjects]);

  const handleSortChange = (sortValue) => () => {
    setSortBy(sortValue);
  };

  const handleSearchProjects = useCallback((query) => {
    setSearchQuery(query);
  }, []);

  // Filter and sort projects
  const filteredAndSortedProjects = useMemo(() => {
    // First, filter by search query
    let filtered = projects;

    if (searchQuery.trim()) {
      const lowerQuery = searchQuery.toLowerCase();
      filtered = projects.filter((project) => {
        const searchableText = [project.name, project.description]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return searchableText.includes(lowerQuery);
      });
    }

    // Then, sort the filtered results
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);

        case "date":
          // Convert Firestore Timestamps to dates
          const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt);
          const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt);
          return dateB - dateA; // Most recent first

        case "activity":
          // Use updatedAt for activity
          const activityA = a.updatedAt?.toDate?.() || new Date(a.updatedAt);
          const activityB = b.updatedAt?.toDate?.() || new Date(b.updatedAt);
          return activityB - activityA; // Most recent first

        default:
          return 0;
      }
    });

    return sorted;
  }, [projects, searchQuery, sortBy]);

  const activeSort = FILTER_OPTIONS.find((item) => item.sort === sortBy);

  return (
    <div className="flex-1 flex flex-col items-center justify-center max-w-4xl mx-auto py-8 gap-6">
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
        {/* <DropDownMenu
          menuClassName="bottom-auto w-max min-w-34 mt-1"
          trigger={
            <PrimaryButton
              text={activeSort?.label || "Sort by"}
              className="text-sm justify-center items-center px-3 min-w-32"
            />
          }
        >
          <ul className="p-2">
            {FILTER_OPTIONS.map((item) => (
              <li key={item.id}>
                <PrimaryButton
                  text={item.label}
                  onClick={handleSortChange(item.sort)}
                  active={item.sort === sortBy}
                  className="border-transparent hover:border-transparent hover:bg-neutral-800/50 "
                />
              </li>
            ))}
          </ul>
        </DropDownMenu> */}
      </div>

      <Searchbar onSearch={handleSearchProjects} />

      {loading ? (
        <div className="col-span-2 text-center py-12 text-neutral-400">
          Loading projects...
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-6 mt-6 w-full">
          {filteredAndSortedProjects.length > 0 ? (
            filteredAndSortedProjects.map((project) => (
              <ProjectCard key={project.id} project={project} sort={sortBy} />
            ))
          ) : (
            <div className="col-span-2 text-center py-12 text-neutral-400">
              {searchQuery ? (
                <>No projects found matching &quot;{searchQuery}&quot;</>
              ) : projects.length === 0 ? (
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
              ) : (
                <>No projects available</>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
