"use client";

import React, { useState, useCallback } from "react";
import { Search, X } from "react-feather";
import { twMerge } from "tailwind-merge";
import { Icon } from "@/components";

export default function Searchbar({
  placeholder = "Search",
  onSearch,
  className = "",
  ...props
}) {
  const [query, setQuery] = useState("");

  const handleChange = useCallback(
    (e) => {
      const value = e.target.value;
      setQuery(value);
      onSearch?.(value);
    },
    [onSearch],
  );

  const handleClear = useCallback(() => {
    setQuery("");
    onSearch?.("");
  }, [onSearch]);

  const defaultClasses = `
    w-full
    border
    flex
    items-center
    rounded-full
    overflow-hidden
    transition-colors
    duration-150
  `;

  const borderColor = query
    ? "text-neutral-100 border-neutral-500"
    : "text-neutral-500 border-neutral-700";

  return (
    <div className={twMerge(defaultClasses, borderColor, className)} {...props}>
      <button
        className="outline-none p-3 pr-0 shrink-0"
        type="button"
        aria-label="Search"
        tabIndex={-1}
      >
        <Icon name={Search} size="md" />
      </button>

      <input
        type="text"
        name="query"
        id="query"
        placeholder={placeholder}
        className="w-full px-3 py-2.5 outline-none bg-transparent"
        onChange={handleChange}
        value={query}
        autoComplete="off"
        {...props}
      />

      {query && (
        <button
          onClick={handleClear}
          className="outline-none p-3 pl-0 shrink-0 hover:text-neutral-100 transition-colors"
          type="button"
          aria-label="Clear search"
        >
          <Icon name={X} size="md" />
        </button>
      )}
    </div>
  );
}
