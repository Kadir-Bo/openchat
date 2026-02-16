"use client";

import { useDatabase, Dropdown } from "@/context";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Plus } from "react-feather";
import {
  PrimaryButton,
  ChatCard,
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

// Fuzzy match algorithm
const fuzzyMatch = (str, pattern) => {
  if (!pattern) return { match: true, score: 0 };
  if (!str) return { match: false, score: 0 };

  const lowerStr = str.toLowerCase();
  const lowerPattern = pattern.toLowerCase();

  // Exact substring match gets highest priority
  if (lowerStr.includes(lowerPattern)) {
    return { match: true, score: 1000 };
  }

  let patternIdx = 0;
  let strIdx = 0;
  let score = 0;
  let consecutiveMatches = 0;

  while (strIdx < lowerStr.length && patternIdx < lowerPattern.length) {
    if (lowerStr[strIdx] === lowerPattern[patternIdx]) {
      // Award points for matches
      score += 1;

      // Bonus for consecutive matches
      consecutiveMatches++;
      if (consecutiveMatches > 1) {
        score += consecutiveMatches * 2;
      }

      // Bonus for match at word boundary
      if (strIdx === 0 || lowerStr[strIdx - 1] === " ") {
        score += 5;
      }

      patternIdx++;
    } else {
      consecutiveMatches = 0;
    }
    strIdx++;
  }

  // All pattern characters must be found in order
  const match = patternIdx === lowerPattern.length;

  // Penalize based on distance between matches
  if (match) {
    const density = score / lowerStr.length;
    score = score * (1 + density);
  }

  return { match, score: match ? score : 0 };
};

export default function ChatsPage() {
  const { subscribeToConversations } = useDatabase();
  const [conversations, setConversations] = useState([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [sortBy, setSortBy] = useState(FILTER_OPTIONS[0].sort);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    // Real-time Listener für Conversations
    const unsubscribe = subscribeToConversations((fetchedConversations) => {
      setConversations(fetchedConversations);
      setIsInitialLoading(false);
    }, false); // nicht archivierte

    // Cleanup beim Unmount
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [subscribeToConversations]);

  const handleSortChange = (sortValue) => () => {
    setSortBy(sortValue);
  };

  const handleSearchChats = useCallback((query) => {
    setSearchQuery(query);
  }, []);

  const filteredAndSortedConversations = useMemo(() => {
    let filtered = conversations;

    // Fuzzy search
    if (searchQuery.trim()) {
      filtered = conversations
        .map((conversation) => {
          const { match, score } = fuzzyMatch(
            conversation.title || "",
            searchQuery,
          );
          return { conversation, match, score };
        })
        .filter(({ match }) => match)
        .sort((a, b) => b.score - a.score)
        .map(({ conversation }) => conversation);
    }

    // Sortierung (only if no search query, otherwise fuzzy score determines order)
    if (!searchQuery.trim()) {
      filtered = [...filtered].sort((a, b) => {
        switch (sortBy) {
          case "name":
            return (a.title || "").localeCompare(b.title || "");

          case "date":
            const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt);
            const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt);
            return dateB - dateA;

          case "activity":
          default:
            const activityA = a.updatedAt?.toDate?.() || new Date(a.updatedAt);
            const activityB = b.updatedAt?.toDate?.() || new Date(b.updatedAt);
            return activityB - activityA;
        }
      });
    }

    return filtered;
  }, [conversations, searchQuery, sortBy]);

  const activeSort = FILTER_OPTIONS.find((item) => item.sort === sortBy);

  return (
    <div className="flex-1 flex flex-col items-center justify-center max-w-5xl mx-auto py-8 gap-6">
      <header className="flex items-center justify-between w-full">
        <h1 className="text-3xl font-light">Chats</h1>
        <PrimaryButton
          text="New Chat"
          icon={<Plus size={17} />}
          className="w-max justify-center text-sm min-w-32"
          href="/chat"
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

      <Searchbar onSearch={handleSearchChats} />

      {isInitialLoading ? (
        <div className="col-span-2 text-center py-12 text-neutral-400">
          Loading chats...
        </div>
      ) : (
        <div className="flex flex-col gap-2 mt-6 w-full">
          {filteredAndSortedConversations.length > 0 ? (
            filteredAndSortedConversations.map((conversation) => (
              <ChatCard
                key={conversation.id}
                conversation={conversation}
                sort={sortBy}
              />
            ))
          ) : (
            <div className="text-center py-12 text-neutral-400 col-span-3">
              {searchQuery ? (
                <>No chats found matching &quot;{searchQuery}&quot;</>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <p>No chats yet</p>
                  <PrimaryButton
                    text="Start your first chat"
                    icon={<Plus size={17} />}
                    className="w-max justify-center text-sm"
                    href="/chat"
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
